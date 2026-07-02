import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { nowStamp, reservationEnd, slotsForSchedule } from "./src/shared/domain.js";
import { readData, token, uid, writeData } from "./src/server/storage.js";

const root = process.cwd();
const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || "127.0.0.1";
const adminEmail = process.env.ADMIN_EMAIL || "admin@pt.local";
const adminPasswordHash = hash(process.env.ADMIN_PASSWORD || "admin1234");
const sessions = new Map();

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function hash(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

function safePath(pathname) {
  const clean = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  return join(root, clean === "/" ? "index.html" : clean);
}

function sendJson(res, status, body, headers = {}) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...headers });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || "").split(";").filter(Boolean).map((part) => {
    const [key, ...value] = part.trim().split("=");
    return [key, decodeURIComponent(value.join("="))];
  }));
}

function currentSession(req) {
  const sid = parseCookies(req).pt_admin_session;
  const session = sid && sessions.get(sid);
  if (!session || session.expiresAt < Date.now()) return null;
  return { sid, session };
}

function requireAdmin(req, res) {
  if (currentSession(req)) return true;
  sendJson(res, 401, { error: "관리자 로그인이 필요합니다." });
  return false;
}

function publicState(data, memberToken) {
  const member = data.members.find((item) => item.token === memberToken);
  if (!member) return null;
  return {
    trainers: data.trainers.filter((trainer) => trainer.id === member.trainerId),
    members: [member],
    schedules: data.schedules.filter((schedule) => schedule.trainerId === member.trainerId),
    reservations: data.reservations.filter((reservation) => reservation.memberId === member.id || reservation.trainerId === member.trainerId)
  };
}

function availableSlots(data, member, date) {
  if (!member || member.status !== "active" || Number(member.remainingCount) <= 0) return [];

  const schedules = data.schedules
    .filter((schedule) => schedule.trainerId === member.trainerId && schedule.date === date && schedule.isAvailable)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const now = new Date();
  const taken = data.reservations
    .filter((reservation) => reservation.status === "booked" && reservation.date === date && reservation.trainerId === member.trainerId)
    .map((reservation) => reservation.startTime);

  return schedules.flatMap((schedule) =>
    slotsForSchedule(schedule)
      .filter((slot) => !taken.includes(slot))
      .filter((slot) => new Date(`${date}T${slot}:00`) > now)
      .map((slot) => ({ scheduleId: schedule.id, time: slot, duration: schedule.duration }))
  );
}

async function handleApi(req, res, url) {
  if (url.pathname === "/api/session" && req.method === "GET") {
    return sendJson(res, 200, { authenticated: Boolean(currentSession(req)), adminEmail });
  }

  if (url.pathname === "/api/login" && req.method === "POST") {
    const body = await readBody(req);
    if (body.email !== adminEmail || hash(body.password || "") !== adminPasswordHash) {
      return sendJson(res, 401, { error: "이메일 또는 비밀번호가 올바르지 않습니다." });
    }
    const sid = token();
    sessions.set(sid, { email: adminEmail, expiresAt: Date.now() + 1000 * 60 * 60 * 12 });
    return sendJson(res, 200, { authenticated: true }, {
      "Set-Cookie": `pt_admin_session=${encodeURIComponent(sid)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=43200`
    });
  }

  if (url.pathname === "/api/logout" && req.method === "POST") {
    const active = currentSession(req);
    if (active) sessions.delete(active.sid);
    return sendJson(res, 200, { authenticated: false }, {
      "Set-Cookie": "pt_admin_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0"
    });
  }

  if (url.pathname === "/api/admin/state" && req.method === "GET") {
    if (!requireAdmin(req, res)) return;
    return sendJson(res, 200, await readData());
  }

  if (url.pathname === "/api/admin/state" && req.method === "PUT") {
    if (!requireAdmin(req, res)) return;
    const body = await readBody(req);
    if (!Array.isArray(body.members) || !Array.isArray(body.schedules) || !Array.isArray(body.reservations) || !Array.isArray(body.trainers)) {
      return sendJson(res, 400, { error: "저장할 데이터 형식이 올바르지 않습니다." });
    }
    await writeData(body);
    return sendJson(res, 200, body);
  }

  const memberMatch = url.pathname.match(/^\/api\/member\/([^/]+)$/);
  if (memberMatch && req.method === "GET") {
    const data = await readData();
    const visible = publicState(data, decodeURIComponent(memberMatch[1]));
    if (!visible) return sendJson(res, 404, { error: "유효하지 않은 링크입니다." });
    return sendJson(res, 200, visible);
  }

  const reservationMatch = url.pathname.match(/^\/api\/member\/([^/]+)\/reservations$/);
  if (reservationMatch && req.method === "POST") {
    const memberToken = decodeURIComponent(reservationMatch[1]);
    const body = await readBody(req);
    const data = await readData();
    const member = data.members.find((item) => item.token === memberToken);
    if (!member) return sendJson(res, 404, { error: "유효하지 않은 링크입니다." });

    const slot = availableSlots(data, member, body.date).find((item) => item.time === body.startTime);
    if (!slot) return sendJson(res, 409, { error: "이미 예약되었거나 선택할 수 없는 시간입니다." });

    const reservation = {
      id: uid("reservation"),
      memberId: member.id,
      trainerId: member.trainerId,
      scheduleId: slot.scheduleId,
      date: body.date,
      startTime: body.startTime,
      endTime: reservationEnd(body.startTime, slot.duration),
      status: "booked",
      memo: String(body.memo || "").trim(),
      cancelReason: "",
      noShowDeducted: false,
      createdAt: nowStamp(),
      updatedAt: nowStamp()
    };
    data.reservations.push(reservation);
    await writeData(data);
    return sendJson(res, 201, { reservation, state: publicState(data, memberToken) });
  }

  const cancelMatch = url.pathname.match(/^\/api\/member\/([^/]+)\/reservations\/([^/]+)\/cancel$/);
  if (cancelMatch && req.method === "POST") {
    const memberToken = decodeURIComponent(cancelMatch[1]);
    const reservationId = decodeURIComponent(cancelMatch[2]);
    const data = await readData();
    const member = data.members.find((item) => item.token === memberToken);
    const reservation = data.reservations.find((item) => item.id === reservationId && item.memberId === member?.id && item.status === "booked");
    if (!member || !reservation) return sendJson(res, 404, { error: "예약을 찾을 수 없습니다." });

    const startsAt = new Date(`${reservation.date}T${reservation.startTime}:00`);
    if ((startsAt - new Date()) / 36e5 < 12) {
      return sendJson(res, 409, { error: "수업 12시간 전부터는 트레이너에게 문의해주세요." });
    }
    reservation.status = "memberCanceled";
    reservation.cancelReason = "회원 취소";
    reservation.updatedAt = nowStamp();
    await writeData(data);
    return sendJson(res, 200, { state: publicState(data, memberToken) });
  }

  return sendJson(res, 404, { error: "API를 찾을 수 없습니다." });
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);

    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }

    let filePath = safePath(url.pathname);
    let ext = extname(filePath);

    if (!ext) {
      filePath = join(root, "index.html");
      ext = ".html";
    }

    const data = await readFile(filePath);
    res.writeHead(200, { "Content-Type": contentTypes[ext] || "application/octet-stream" });
    res.end(data);
  } catch (error) {
    if (!res.headersSent) {
      const url = new URL(req.url || "/", `http://${req.headers.host}`);
      if (url.pathname.startsWith("/api/")) {
        sendJson(res, 500, { error: "서버에서 요청을 처리하지 못했습니다." });
        return;
      }
      const data = await readFile(join(root, "index.html"));
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(data);
    }
  }
});

server.listen(port, host, () => {
  console.log(`PT booking app running at http://${host}:${port}`);
  console.log(`Admin: ${adminEmail} / ${process.env.ADMIN_PASSWORD ? "(environment password)" : "admin1234"}`);
});
