import { AdminApi, MemberApi } from "./src/client/api.js";
import { badge, emptyTable, loadingScreen, pageTitle, stat } from "./src/client/ui.js";
import {
  MEMBER_STATUS,
  STATUSES,
  STATUS_TONE,
  dateLabel,
  escapeHtml,
  minutes,
  money,
  nowStamp,
  reservationEnd,
  shortDate,
  slotsForSchedule,
  todayISO,
  unitPrice
} from "./src/shared/domain.js";

let state = null;
let adminAuthenticated = false;
let sessionChecked = false;
let loadedMemberToken = null;
let invalidMemberToken = null;
let currentTab = "home";
let modal = null;
let toastTimer = null;

const app = document.querySelector("#app");

function uid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
}

function token() {
  const bytes = new Uint8Array(14);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0")).join("").slice(0, 18);
}

async function loadSession() {
  const session = await AdminApi.session();
  adminAuthenticated = session.authenticated;
  sessionChecked = true;
}

async function loadAdminState() {
  state = await AdminApi.loadState();
}

async function loadMemberState(memberToken) {
  try {
    state = await MemberApi.loadState(memberToken);
    loadedMemberToken = memberToken;
    invalidMemberToken = null;
  } catch {
    state = { trainers: [], members: [], schedules: [], reservations: [] };
    loadedMemberToken = memberToken;
    invalidMemberToken = memberToken;
  }
}

async function saveState() {
  if (!adminAuthenticated) return;
  try {
    state = await AdminApi.saveState(state);
  } catch (error) {
    showToast(error.message);
  }
}

function isLoggedIn() {
  return adminAuthenticated;
}

function trainerName(id) {
  return state.trainers.find((trainer) => trainer.id === id)?.name || "-";
}

function memberById(id) {
  return state.members.find((member) => member.id === id);
}

function activeReservations() {
  return state.reservations.filter((reservation) => reservation.status === "booked");
}

function availableSlots(memberId, date) {
  const member = memberById(memberId);
  if (!member || member.status !== "active" || Number(member.remainingCount) <= 0) return [];

  const schedules = state.schedules
    .filter((schedule) => schedule.trainerId === member.trainerId && schedule.date === date && schedule.isAvailable)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const now = new Date();
  const taken = activeReservations()
    .filter((reservation) => reservation.date === date && reservation.trainerId === member.trainerId)
    .map((reservation) => reservation.startTime);

  return schedules.flatMap((schedule) =>
    slotsForSchedule(schedule)
      .filter((slot) => !taken.includes(slot))
      .filter((slot) => new Date(`${date}T${slot}:00`) > now)
      .map((slot) => ({ scheduleId: schedule.id, time: slot, duration: schedule.duration }))
  );
}

function nextReservation(memberId) {
  return activeReservations()
    .filter((reservation) => reservation.memberId === memberId)
    .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`))[0];
}

function bookingUrl(member) {
  return `${location.origin}/booking/${member.token}`;
}

function showToast(message) {
  clearTimeout(toastTimer);
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.append(toast);
  }
  toast.textContent = message;
  toastTimer = setTimeout(() => toast.remove(), 2600);
}

function render() {
  const path = location.pathname;
  if (path.startsWith("/booking/")) {
    const memberToken = path.split("/").pop();
    if (loadedMemberToken !== memberToken || !state) {
      renderLoading("예약 정보를 불러오는 중입니다.");
      loadMemberState(memberToken).then(render);
      return;
    }
    renderMemberBooking(memberToken);
    return;
  }

  if (!sessionChecked) {
    renderLoading("서비스 상태를 확인하는 중입니다.");
    loadSession().then(render).catch((error) => {
      sessionChecked = true;
      showToast(error.message);
      renderLogin();
    });
    return;
  }

  if (!isLoggedIn()) {
    renderLogin();
    return;
  }

  if (!state || loadedMemberToken) {
    renderLoading("관리자 데이터를 불러오는 중입니다.");
    loadAdminState().then(() => {
      loadedMemberToken = null;
      invalidMemberToken = null;
      render();
    }).catch((error) => {
      adminAuthenticated = false;
      showToast(error.message);
      renderLogin();
    });
    return;
  }

  renderAdmin();
}

function renderLoading(message) {
  app.innerHTML = loadingScreen(message);
}

function renderLogin() {
  app.innerHTML = `
    <main class="login-screen">
      <section class="login-panel">
        <div class="brand">
          <div>
            <h1>PT 예약 관리</h1>
            <p>관리자 로그인</p>
          </div>
          ${badge("운영형", "success")}
        </div>
        <form id="loginForm" class="form-grid">
          <label>이메일
            <input name="email" type="email" value="admin@pt.local" autocomplete="username" required />
          </label>
          <label>비밀번호
            <input name="password" type="password" value="admin1234" autocomplete="current-password" required />
          </label>
          <button class="primary" type="submit">로그인</button>
          <p class="muted">초기 계정: admin@pt.local / admin1234</p>
        </form>
      </section>
    </main>
  `;

  document.querySelector("#loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await AdminApi.login(data);
      adminAuthenticated = true;
      state = null;
      render();
    } catch (error) {
      showToast(error.message);
    }
  });
}

function renderAdmin() {
  app.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <div>
          <h1>PT 예약 관리</h1>
          <span class="muted">회원 링크 예약과 관리자 운영을 한 화면에서 관리합니다.</span>
        </div>
        <div class="actions">
          <button class="secondary" data-action="open-booking-sample">회원 화면 보기</button>
          <button class="secondary" data-action="logout">로그아웃</button>
        </div>
      </header>
      <div class="layout">
        <nav class="sidebar">
          ${navButton("home", "홈")}
          ${navButton("members", "회원")}
          ${navButton("schedules", "시간표")}
          ${navButton("reservations", "예약")}
          ${navButton("settlement", "정산")}
        </nav>
        <main class="content">${renderTab()}</main>
      </div>
      ${modal ? renderModal() : ""}
    </div>
  `;

  bindAdminEvents();
}

function navButton(tab, label) {
  return `<button class="nav-button ${currentTab === tab ? "active" : ""}" data-tab="${tab}">${label}</button>`;
}

function renderTab() {
  if (currentTab === "members") return membersView();
  if (currentTab === "schedules") return schedulesView();
  if (currentTab === "reservations") return reservationsView();
  if (currentTab === "settlement") return settlementView();
  return homeView();
}

function homeView() {
  const today = todayISO();
  const month = today.slice(0, 7);
  const todayBooked = state.reservations.filter((reservation) => reservation.date === today && reservation.status === "booked").length;
  const monthCompleted = state.reservations.filter((reservation) => reservation.date.startsWith(month) && reservation.status === "completed").length;
  const canceled = state.reservations.filter((reservation) => ["memberCanceled", "adminCanceled"].includes(reservation.status)).length;
  const emptyMembers = state.members.filter((member) => Number(member.remainingCount) <= 0 && member.status === "active").length;

  return `
    ${pageTitle("관리자 홈", "오늘 예약, 수업권 잔여, 취소와 노쇼를 빠르게 확인합니다.")}
    <div class="stats-grid">
      ${stat("오늘 예약", todayBooked)}
      ${stat("이번 달 완료", monthCompleted)}
      ${stat("취소 건수", canceled)}
      ${stat("잔여 0회 회원", emptyMembers)}
    </div>
    <section class="panel">
      <div class="section-title">
        <div>
          <h2>오늘 수업 목록</h2>
          <p>${dateLabel(today)}</p>
        </div>
      </div>
      ${reservationTable(state.reservations.filter((reservation) => reservation.date === today))}
    </section>
  `;
}

function membersView() {
  const q = (new URLSearchParams(location.search).get("q") || "").trim();
  const filtered = state.members.filter((member) => {
    const text = `${member.name} ${member.phone} ${trainerName(member.trainerId)}`;
    return text.includes(q);
  });

  return `
    ${pageTitle("회원 관리", "회원 등록과 전용 예약 링크 복사, 재발급, 수업권 잔여 횟수를 관리합니다.", `<button class="primary" data-action="new-member">회원 등록</button>`)}
    <section class="panel">
      <div class="filters">
        <input id="memberSearch" placeholder="회원명, 연락처, 트레이너 검색" value="${escapeHtml(q)}" />
        <button class="secondary" data-action="zero-members">잔여 0회 보기</button>
      </div>
    </section>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>회원명</th><th>연락처</th><th>담당</th><th>상태</th><th>수업권</th><th>잔여</th><th>완료</th><th>다음 예약</th><th>링크</th><th>관리</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map(memberRow).join("") || emptyTable(10, "회원이 없습니다.")}
        </tbody>
      </table>
    </div>
  `;
}

function memberRow(member) {
  const next = nextReservation(member.id);
  return `
    <tr>
      <td><strong>${escapeHtml(member.name)}</strong></td>
      <td>${escapeHtml(member.phone)}</td>
      <td>${escapeHtml(trainerName(member.trainerId))}</td>
      <td>${badge(MEMBER_STATUS[member.status] || member.status, member.status === "active" ? "success" : "danger")}</td>
      <td>${escapeHtml(member.packageName)}</td>
      <td>${member.remainingCount}회</td>
      <td>${member.completedCount || 0}회</td>
      <td>${next ? `${shortDate(next.date)} ${next.startTime}` : "-"}</td>
      <td class="link-text">${escapeHtml(bookingUrl(member))}</td>
      <td>
        <div class="actions">
          <button class="secondary" data-action="copy-link" data-id="${member.id}">복사</button>
          <button class="secondary" data-action="edit-member" data-id="${member.id}">수정</button>
          <button class="secondary" data-action="renew-link" data-id="${member.id}">재발급</button>
          <button class="danger" data-action="toggle-member" data-id="${member.id}">${member.status === "active" ? "비활성" : "활성"}</button>
        </div>
      </td>
    </tr>
  `;
}

function schedulesView() {
  const sorted = [...state.schedules].sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
  return `
    ${pageTitle("시간표 관리", "날짜별 예약 가능 시간을 만들고 수정합니다.", `
      <div class="actions">
        <button class="secondary" data-action="repeat-schedule">반복 등록</button>
        <button class="primary" data-action="new-schedule">시간표 등록</button>
      </div>
    `)}
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>날짜</th><th>시간</th><th>단위</th><th>담당</th><th>상태</th><th>예약 수</th><th>관리</th>
          </tr>
        </thead>
        <tbody>
          ${sorted.map(scheduleRow).join("") || emptyTable(7, "등록된 시간표가 없습니다.")}
        </tbody>
      </table>
    </div>
  `;
}

function scheduleRow(schedule) {
  const count = state.reservations.filter((reservation) => reservation.scheduleId === schedule.id && reservation.status === "booked").length;
  return `
    <tr>
      <td>${dateLabel(schedule.date)}</td>
      <td>${schedule.startTime} - ${schedule.endTime}</td>
      <td>${schedule.duration}분</td>
      <td>${escapeHtml(trainerName(schedule.trainerId))}</td>
      <td>${badge(schedule.isAvailable ? "예약 가능" : "예약 불가", schedule.isAvailable ? "success" : "danger")}</td>
      <td>${count}</td>
      <td>
        <div class="actions">
          <button class="secondary" data-action="edit-schedule" data-id="${schedule.id}">수정</button>
          <button class="danger" data-action="delete-schedule" data-id="${schedule.id}">삭제</button>
        </div>
      </td>
    </tr>
  `;
}

function reservationsView() {
  const sorted = [...state.reservations].sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`));
  return `
    ${pageTitle("예약 관리", "예약 조회, 직접 생성, 상태 변경, 수업 완료와 노쇼를 처리합니다.", `<button class="primary" data-action="new-reservation">예약 추가</button>`)}
    ${reservationTable(sorted)}
  `;
}

function reservationTable(reservations) {
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>날짜</th><th>시간</th><th>회원</th><th>연락처</th><th>담당</th><th>상태</th><th>메모</th><th>관리</th>
          </tr>
        </thead>
        <tbody>
          ${reservations.map(reservationRow).join("") || emptyTable(8, "예약이 없습니다.")}
        </tbody>
      </table>
    </div>
  `;
}

function reservationRow(reservation) {
  const member = memberById(reservation.memberId) || {};
  return `
    <tr>
      <td>${dateLabel(reservation.date)}</td>
      <td>${reservation.startTime} - ${reservation.endTime}</td>
      <td><strong>${escapeHtml(member.name || "-")}</strong></td>
      <td>${escapeHtml(member.phone || "-")}</td>
      <td>${escapeHtml(trainerName(reservation.trainerId))}</td>
      <td>${badge(STATUSES[reservation.status], STATUS_TONE[reservation.status])}</td>
      <td>${escapeHtml(reservation.memo || reservation.cancelReason || "-")}</td>
      <td>
        <div class="actions">
          <button class="secondary" data-action="edit-reservation" data-id="${reservation.id}">수정</button>
          <button class="secondary" data-action="complete-reservation" data-id="${reservation.id}" ${reservation.status !== "booked" ? "disabled" : ""}>완료</button>
          <button class="secondary" data-action="noshow-reservation" data-id="${reservation.id}" ${reservation.status !== "booked" ? "disabled" : ""}>노쇼</button>
          <button class="danger" data-action="cancel-reservation" data-id="${reservation.id}" ${reservation.status !== "booked" ? "disabled" : ""}>취소</button>
        </div>
      </td>
    </tr>
  `;
}

function settlementView() {
  const month = todayISO().slice(0, 7);
  const completed = state.reservations.filter((reservation) => reservation.status === "completed" && reservation.date.startsWith(month));
  const noShows = state.reservations.filter((reservation) => reservation.status === "noShow" && reservation.date.startsWith(month));
  const amount = completed.reduce((sum, reservation) => {
    const member = memberById(reservation.memberId);
    return sum + unitPrice(member);
  }, 0);

  return `
    ${pageTitle("정산 대시보드", "수업 완료 기준으로 이번 달 예상 정산 금액을 계산합니다.")}
    <div class="stats-grid">
      ${stat("이번 달 완료", completed.length)}
      ${stat("예약 예정", activeReservations().length)}
      ${stat("노쇼", noShows.length)}
      ${stat("예상 정산", `${money(amount)}원`)}
    </div>
    <section class="panel">
      <div class="section-title">
        <div>
          <h2>회원별 잔여 수업</h2>
          <p>결제 금액과 총 횟수로 1회 단가를 계산합니다.</p>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>회원</th><th>수업권</th><th>총 횟수</th><th>잔여</th><th>완료</th><th>1회 단가</th><th>결제 금액</th></tr></thead>
          <tbody>
            ${state.members.map((member) => `
              <tr>
                <td>${escapeHtml(member.name)}</td>
                <td>${escapeHtml(member.packageName)}</td>
                <td>${member.totalCount}회</td>
                <td>${member.remainingCount}회</td>
                <td>${member.completedCount || 0}회</td>
                <td>${money(unitPrice(member))}원</td>
                <td>${money(member.paidAmount)}원</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderModal() {
  if (modal.type === "member") return memberModal(modal.member);
  if (modal.type === "schedule") return scheduleModal(modal.schedule);
  if (modal.type === "repeat") return repeatScheduleModal();
  if (modal.type === "reservation") return reservationModal(modal.reservation);
  return "";
}

function memberModal(member = {}) {
  return `
    <div class="dialog-backdrop">
      <section class="dialog">
        <div class="dialog-head">
          <h2>${member.id ? "회원 수정" : "회원 등록"}</h2>
          <button class="secondary" data-action="close-modal">닫기</button>
        </div>
        <form id="memberForm" class="form-grid">
          <input type="hidden" name="id" value="${member.id || ""}" />
          <div class="form-grid two">
            <label>이름<input name="name" value="${escapeHtml(member.name || "")}" required /></label>
            <label>연락처<input name="phone" value="${escapeHtml(member.phone || "")}" required /></label>
            <label>담당 트레이너
              <select name="trainerId">${state.trainers.map((trainer) => `<option value="${trainer.id}" ${trainer.id === member.trainerId ? "selected" : ""}>${escapeHtml(trainer.name)}</option>`)}</select>
            </label>
            <label>수업권명<input name="packageName" value="${escapeHtml(member.packageName || "10회권")}" required /></label>
            <label>총 횟수<input name="totalCount" type="number" min="1" value="${member.totalCount || 10}" required /></label>
            <label>남은 횟수<input name="remainingCount" type="number" min="0" value="${member.remainingCount ?? member.totalCount ?? 10}" required /></label>
            <label>결제 금액<input name="paidAmount" type="number" min="0" step="1000" value="${member.paidAmount || 0}" /></label>
            <label>상태
              <select name="status">
                <option value="active" ${member.status !== "inactive" ? "selected" : ""}>활성</option>
                <option value="inactive" ${member.status === "inactive" ? "selected" : ""}>비활성</option>
              </select>
            </label>
          </div>
          <label>메모<textarea name="memo">${escapeHtml(member.memo || "")}</textarea></label>
          <button class="primary" type="submit">저장</button>
        </form>
      </section>
    </div>
  `;
}

function scheduleModal(schedule = {}) {
  return `
    <div class="dialog-backdrop">
      <section class="dialog">
        <div class="dialog-head">
          <h2>${schedule.id ? "시간표 수정" : "시간표 등록"}</h2>
          <button class="secondary" data-action="close-modal">닫기</button>
        </div>
        <form id="scheduleForm" class="form-grid">
          <input type="hidden" name="id" value="${schedule.id || ""}" />
          <div class="form-grid two">
            <label>날짜<input name="date" type="date" value="${schedule.date || todayISO()}" required /></label>
            <label>담당 트레이너
              <select name="trainerId">${state.trainers.map((trainer) => `<option value="${trainer.id}" ${trainer.id === schedule.trainerId ? "selected" : ""}>${escapeHtml(trainer.name)}</option>`)}</select>
            </label>
            <label>시작 시간<input name="startTime" type="time" value="${schedule.startTime || "10:00"}" required /></label>
            <label>종료 시간<input name="endTime" type="time" value="${schedule.endTime || "20:00"}" required /></label>
            <label>수업 단위
              <select name="duration">
                ${[30, 50, 60, 90].map((value) => `<option value="${value}" ${Number(schedule.duration || 60) === value ? "selected" : ""}>${value}분</option>`)}
              </select>
            </label>
            <label>예약 가능
              <select name="isAvailable">
                <option value="true" ${schedule.isAvailable !== false ? "selected" : ""}>가능</option>
                <option value="false" ${schedule.isAvailable === false ? "selected" : ""}>불가</option>
              </select>
            </label>
          </div>
          <button class="primary" type="submit">저장</button>
        </form>
      </section>
    </div>
  `;
}

function repeatScheduleModal() {
  return `
    <div class="dialog-backdrop">
      <section class="dialog">
        <div class="dialog-head">
          <h2>반복 시간표 등록</h2>
          <button class="secondary" data-action="close-modal">닫기</button>
        </div>
        <form id="repeatForm" class="form-grid">
          <div class="form-grid two">
            <label>시작일<input name="startDate" type="date" value="${todayISO()}" required /></label>
            <label>종료일<input name="endDate" type="date" value="${todayISO()}" required /></label>
            <label>시작 시간<input name="startTime" type="time" value="10:00" required /></label>
            <label>종료 시간<input name="endTime" type="time" value="20:00" required /></label>
            <label>수업 단위
              <select name="duration"><option value="60">60분</option><option value="50">50분</option><option value="30">30분</option></select>
            </label>
            <label>담당 트레이너
              <select name="trainerId">${state.trainers.map((trainer) => `<option value="${trainer.id}">${escapeHtml(trainer.name)}</option>`)}</select>
            </label>
          </div>
          <label>요일
            <select name="weekdays" multiple size="7">
              <option value="1" selected>월요일</option><option value="2">화요일</option><option value="3" selected>수요일</option>
              <option value="4">목요일</option><option value="5" selected>금요일</option><option value="6">토요일</option><option value="0">일요일</option>
            </select>
          </label>
          <label>제외 날짜<input name="excludeDates" placeholder="2026-07-15, 2026-07-22" /></label>
          <button class="primary" type="submit">반복 등록</button>
        </form>
      </section>
    </div>
  `;
}

function reservationModal(reservation = {}) {
  return `
    <div class="dialog-backdrop">
      <section class="dialog">
        <div class="dialog-head">
          <h2>${reservation.id ? "예약 수정" : "예약 추가"}</h2>
          <button class="secondary" data-action="close-modal">닫기</button>
        </div>
        <form id="reservationForm" class="form-grid">
          <input type="hidden" name="id" value="${reservation.id || ""}" />
          <div class="form-grid two">
            <label>회원
              <select name="memberId" required>
                ${state.members.filter((member) => member.status === "active").map((member) => `<option value="${member.id}" ${member.id === reservation.memberId ? "selected" : ""}>${escapeHtml(member.name)} (${member.remainingCount}회)</option>`)}
              </select>
            </label>
            <label>날짜<input name="date" type="date" value="${reservation.date || todayISO()}" required /></label>
            <label>시간<input name="startTime" type="time" value="${reservation.startTime || "10:00"}" required /></label>
            <label>상태
              <select name="status">
                ${Object.entries(STATUSES).map(([key, label]) => `<option value="${key}" ${key === (reservation.status || "booked") ? "selected" : ""}>${label}</option>`)}
              </select>
            </label>
          </div>
          <label>메모<textarea name="memo">${escapeHtml(reservation.memo || "")}</textarea></label>
          <button class="primary" type="submit">저장</button>
        </form>
      </section>
    </div>
  `;
}

function bindAdminEvents() {
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      currentTab = button.dataset.tab;
      history.replaceState(null, "", "/");
      render();
    });
  });

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleAction(button.dataset.action, button.dataset.id));
  });

  document.querySelector("#memberSearch")?.addEventListener("input", (event) => {
    const params = new URLSearchParams(location.search);
    if (event.target.value) params.set("q", event.target.value);
    else params.delete("q");
    history.replaceState(null, "", `/?${params.toString()}`);
    render();
  });

  document.querySelector("#memberForm")?.addEventListener("submit", saveMember);
  document.querySelector("#scheduleForm")?.addEventListener("submit", saveSchedule);
  document.querySelector("#repeatForm")?.addEventListener("submit", saveRepeatSchedules);
  document.querySelector("#reservationForm")?.addEventListener("submit", saveReservation);
}

async function handleAction(action, id) {
  if (action === "logout") {
    await AdminApi.logout();
    adminAuthenticated = false;
    state = null;
    render();
  }
  if (action === "open-booking-sample") {
    const member = state.members.find((item) => item.status === "active") || state.members[0];
    if (member) location.href = `/booking/${member.token}`;
  }
  if (action === "new-member") openModal({ type: "member", member: {} });
  if (action === "edit-member") openModal({ type: "member", member: memberById(id) });
  if (action === "copy-link") copyLink(id);
  if (action === "renew-link") renewLink(id);
  if (action === "toggle-member") toggleMember(id);
  if (action === "zero-members") {
    const names = state.members.filter((member) => Number(member.remainingCount) <= 0).map((member) => member.name).join(", ") || "해당 회원 없음";
    showToast(names);
  }
  if (action === "new-schedule") openModal({ type: "schedule", schedule: {} });
  if (action === "edit-schedule") openModal({ type: "schedule", schedule: state.schedules.find((schedule) => schedule.id === id) });
  if (action === "delete-schedule") deleteSchedule(id);
  if (action === "repeat-schedule") openModal({ type: "repeat" });
  if (action === "new-reservation") openModal({ type: "reservation", reservation: {} });
  if (action === "edit-reservation") openModal({ type: "reservation", reservation: state.reservations.find((reservation) => reservation.id === id) });
  if (action === "complete-reservation") completeReservation(id);
  if (action === "noshow-reservation") noShowReservation(id);
  if (action === "cancel-reservation") cancelReservation(id);
  if (action === "close-modal") {
    modal = null;
    render();
  }
}

function openModal(nextModal) {
  modal = nextModal;
  render();
}

async function copyLink(id) {
  const member = memberById(id);
  await navigator.clipboard.writeText(bookingUrl(member));
  showToast("예약 링크를 복사했습니다.");
}

async function renewLink(id) {
  if (!confirm("새 링크를 발급하면 기존 링크는 즉시 사용할 수 없습니다. 계속할까요?")) return;
  const member = memberById(id);
  member.token = token();
  member.updatedAt = nowStamp();
  await saveState();
  render();
  showToast("새 예약 링크를 발급했습니다.");
}

async function toggleMember(id) {
  const member = memberById(id);
  member.status = member.status === "active" ? "inactive" : "active";
  member.updatedAt = nowStamp();
  await saveState();
  render();
}

async function saveMember(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const existing = memberById(data.id);
  const payload = {
    name: data.name.trim(),
    phone: data.phone.trim(),
    trainerId: data.trainerId,
    packageName: data.packageName.trim(),
    totalCount: Number(data.totalCount),
    remainingCount: Number(data.remainingCount),
    paidAmount: Number(data.paidAmount || 0),
    memo: data.memo.trim(),
    status: data.status,
    updatedAt: nowStamp()
  };

  if (existing) {
    Object.assign(existing, payload);
  } else {
    state.members.push({
      id: uid("member"),
      ...payload,
      completedCount: 0,
      token: token(),
      createdAt: nowStamp()
    });
  }

  modal = null;
  await saveState();
  render();
  showToast("회원 정보를 저장했습니다.");
}

async function saveSchedule(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  if (minutes(data.startTime) >= minutes(data.endTime)) {
    showToast("종료 시간은 시작 시간보다 늦어야 합니다.");
    return;
  }
  const existing = state.schedules.find((schedule) => schedule.id === data.id);
  const payload = {
    trainerId: data.trainerId,
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    duration: Number(data.duration),
    isAvailable: data.isAvailable === "true",
    updatedAt: nowStamp()
  };

  if (existing) Object.assign(existing, payload);
  else state.schedules.push({ id: uid("schedule"), ...payload, createdAt: nowStamp() });

  modal = null;
  await saveState();
  render();
  showToast("시간표를 저장했습니다.");
}

async function saveRepeatSchedules(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  const weekdays = [...form.weekdays.selectedOptions].map((option) => Number(option.value));
  const excludes = data.excludeDates.split(",").map((item) => item.trim()).filter(Boolean);
  const start = new Date(`${data.startDate}T00:00:00`);
  const end = new Date(`${data.endDate}T00:00:00`);
  let count = 0;

  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const iso = date.toISOString().slice(0, 10);
    if (!weekdays.includes(date.getDay()) || excludes.includes(iso)) continue;
    const duplicate = state.schedules.some((schedule) => schedule.trainerId === data.trainerId && schedule.date === iso && schedule.startTime === data.startTime);
    if (duplicate) continue;
    state.schedules.push({
      id: uid("schedule"),
      trainerId: data.trainerId,
      date: iso,
      startTime: data.startTime,
      endTime: data.endTime,
      duration: Number(data.duration),
      isAvailable: true,
      createdAt: nowStamp(),
      updatedAt: nowStamp()
    });
    count += 1;
  }

  modal = null;
  await saveState();
  render();
  showToast(`${count}개의 시간표를 등록했습니다.`);
}

async function deleteSchedule(id) {
  const hasBooking = state.reservations.some((reservation) => reservation.scheduleId === id && reservation.status === "booked");
  if (hasBooking && !confirm("예약이 있는 시간표입니다. 연결된 예약을 관리자 취소 처리하고 삭제할까요?")) return;
  state.reservations.forEach((reservation) => {
    if (reservation.scheduleId === id && reservation.status === "booked") {
      reservation.status = "adminCanceled";
      reservation.cancelReason = "시간표 삭제";
    }
  });
  state.schedules = state.schedules.filter((schedule) => schedule.id !== id);
  await saveState();
  render();
}

async function saveReservation(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const member = memberById(data.memberId);
  const slot = availableSlots(data.memberId, data.date).find((item) => item.time === data.startTime);
  const existing = state.reservations.find((reservation) => reservation.id === data.id);

  if (!existing && !slot) {
    showToast("선택한 시간은 예약할 수 없습니다.");
    return;
  }

  if (existing && reservationConflicts(existing.id, member.trainerId, data.date, data.startTime)) {
    showToast("이미 예약된 시간입니다.");
    return;
  }

  const duration = slot?.duration || state.schedules.find((schedule) => schedule.id === existing?.scheduleId)?.duration || 60;
  const payload = {
    memberId: member.id,
    trainerId: member.trainerId,
    scheduleId: slot?.scheduleId || existing?.scheduleId,
    date: data.date,
    startTime: data.startTime,
    endTime: reservationEnd(data.startTime, duration),
    status: data.status,
    memo: data.memo.trim(),
    updatedAt: nowStamp()
  };

  if (existing) Object.assign(existing, payload);
  else state.reservations.push({ id: uid("reservation"), ...payload, createdAt: nowStamp() });

  modal = null;
  await saveState();
  render();
  showToast("예약을 저장했습니다.");
}

function reservationConflicts(ignoreId, trainerId, date, startTime) {
  return activeReservations().some((reservation) =>
    reservation.id !== ignoreId &&
    reservation.trainerId === trainerId &&
    reservation.date === date &&
    reservation.startTime === startTime
  );
}

async function completeReservation(id) {
  const reservation = state.reservations.find((item) => item.id === id);
  const member = memberById(reservation.memberId);
  if (Number(member.remainingCount) < 1) {
    showToast("남은 수업 횟수가 없습니다.");
    return;
  }
  reservation.status = "completed";
  reservation.updatedAt = nowStamp();
  member.remainingCount = Number(member.remainingCount) - 1;
  member.completedCount = Number(member.completedCount || 0) + 1;
  member.updatedAt = nowStamp();
  await saveState();
  render();
  showToast("수업 완료 처리하고 1회를 차감했습니다.");
}

async function noShowReservation(id) {
  const reservation = state.reservations.find((item) => item.id === id);
  const member = memberById(reservation.memberId);
  const deduct = confirm("노쇼로 처리하면서 수업 횟수를 차감할까요?");
  reservation.status = "noShow";
  reservation.noShowDeducted = deduct;
  reservation.updatedAt = nowStamp();
  if (deduct && Number(member.remainingCount) > 0) {
    member.remainingCount = Number(member.remainingCount) - 1;
    member.updatedAt = nowStamp();
  }
  await saveState();
  render();
  showToast("노쇼 처리했습니다.");
}

async function cancelReservation(id) {
  const reason = prompt("취소 사유를 입력해주세요.", "관리자 취소") || "관리자 취소";
  const reservation = state.reservations.find((item) => item.id === id);
  reservation.status = "adminCanceled";
  reservation.cancelReason = reason;
  reservation.updatedAt = nowStamp();
  await saveState();
  render();
}

function renderMemberBooking(memberToken) {
  const member = state.members.find((item) => item.token === memberToken);
  if (!member || invalidMemberToken === memberToken) {
    app.innerHTML = `
      <main class="member-screen">
        <section class="member-panel">
          <h1>유효하지 않은 링크입니다</h1>
          <p class="muted">예약 링크가 재발급되었거나 잘못된 주소일 수 있습니다.</p>
        </section>
      </main>
    `;
    return;
  }

  const params = new URLSearchParams(location.search);
  const selectedDate = params.get("date") || nextBookableDate(member.id) || todayISO();
  const selectedTime = params.get("time") || "";
  const slots = availableSlots(member.id, selectedDate);
  const next = nextReservation(member.id);
  const memberReservations = state.reservations
    .filter((reservation) => reservation.memberId === member.id && reservation.status === "booked")
    .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));

  app.innerHTML = `
    <main class="member-screen">
      <section class="member-panel">
        <div class="booking-header">
          ${badge("PT 예약")}
          <h1>안녕하세요, ${escapeHtml(member.name)}님</h1>
          <p class="muted">예약할 날짜와 시간을 선택해주세요.</p>
        </div>
        <div class="booking-summary">
          <div class="summary-cell"><span>남은 PT</span><strong>${member.remainingCount}회</strong></div>
          <div class="summary-cell"><span>다음 예약</span><strong>${next ? `${dateLabel(next.date)} ${next.startTime}` : "없음"}</strong></div>
        </div>
        ${member.status !== "active" ? `<div class="panel"><strong>비활성 회원입니다.</strong><p class="muted">예약이 필요하면 트레이너에게 문의해주세요.</p></div>` : ""}
        ${Number(member.remainingCount) <= 0 ? `<div class="panel"><strong>남은 수업 횟수가 없습니다.</strong><p class="muted">수업권 등록 후 예약할 수 있습니다.</p></div>` : bookingForm(member, selectedDate, selectedTime, slots)}
        <section class="panel">
          <strong>내 예약</strong>
          <div class="reservation-list">
            ${memberReservations.map((reservation) => `
              <div class="reservation-item">
                <strong>${dateLabel(reservation.date)} ${reservation.startTime}</strong>
                <p class="muted">${escapeHtml(trainerName(reservation.trainerId))}</p>
                <button class="danger" data-member-action="cancel" data-id="${reservation.id}">예약 취소</button>
              </div>
            `).join("") || `<p class="muted">예정된 예약이 없습니다.</p>`}
          </div>
        </section>
      </section>
    </main>
  `;

  document.querySelectorAll("[data-date]").forEach((button) => {
    button.addEventListener("click", () => {
      history.replaceState(null, "", `/booking/${member.token}?date=${button.dataset.date}`);
      render();
    });
  });
  document.querySelectorAll("[data-time]").forEach((button) => {
    button.addEventListener("click", () => {
      history.replaceState(null, "", `/booking/${member.token}?date=${selectedDate}&time=${button.dataset.time}`);
      render();
    });
  });
  document.querySelector("#bookingForm")?.addEventListener("submit", (event) => createMemberReservation(event, member, selectedDate, selectedTime));
  document.querySelectorAll("[data-member-action='cancel']").forEach((button) => {
    button.addEventListener("click", () => memberCancelReservation(button.dataset.id, member.token));
  });
}

function bookingForm(member, selectedDate, selectedTime, slots) {
  const dates = nextDates(10);
  return `
    <form id="bookingForm" class="form-grid">
      <label>날짜 선택</label>
      <div class="date-row">
        ${dates.map((date) => `<button class="date-button ${date === selectedDate ? "active" : ""}" type="button" data-date="${date}">${dateLabel(date)}</button>`).join("")}
      </div>
      <label>시간 선택</label>
      <div class="slot-grid">
        ${slots.map((slot) => `<button class="slot-button ${slot.time === selectedTime ? "active" : ""}" type="button" data-time="${slot.time}">${slot.time}</button>`).join("") || `<div class="empty">예약 가능한 시간이 없습니다.</div>`}
      </div>
      <label>요청 메모<textarea name="memo" placeholder="선택 입력"></textarea></label>
      <button class="primary" type="submit" ${!selectedTime ? "disabled" : ""}>예약 완료</button>
    </form>
  `;
}

function nextDates(count) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

function nextBookableDate(memberId) {
  return nextDates(21).find((date) => availableSlots(memberId, date).length > 0);
}

async function createMemberReservation(event, member, selectedDate, selectedTime) {
  event.preventDefault();
  const slot = availableSlots(member.id, selectedDate).find((item) => item.time === selectedTime);
  if (!slot) {
    showToast("이미 예약되었거나 선택할 수 없는 시간입니다.");
    render();
    return;
  }
  const data = Object.fromEntries(new FormData(event.currentTarget));
  try {
    const result = await MemberApi.createReservation(member.token, {
      date: selectedDate,
      startTime: selectedTime,
      memo: data.memo.trim()
    });
    state = result.state;
  } catch (error) {
    showToast(error.message);
    await loadMemberState(member.token);
    render();
    return;
  }
  app.innerHTML = `
    <main class="member-screen">
      <section class="member-panel">
        ${badge("예약 완료", "success")}
        <h1>예약이 완료되었습니다.</h1>
        <div class="booking-summary">
          <div class="summary-cell"><span>예약 날짜</span><strong>${dateLabel(selectedDate)}</strong></div>
          <div class="summary-cell"><span>예약 시간</span><strong>${selectedTime}</strong></div>
          <div class="summary-cell"><span>회원명</span><strong>${escapeHtml(member.name)}</strong></div>
          <div class="summary-cell"><span>남은 PT</span><strong>${member.remainingCount}회</strong></div>
        </div>
        <p class="muted">수업 횟수는 수업 완료 처리 시 차감됩니다.</p>
        <button class="primary" id="backToBooking">예약 화면으로</button>
      </section>
    </main>
  `;
  document.querySelector("#backToBooking").addEventListener("click", () => {
    location.href = `/booking/${member.token}`;
  });
}

async function memberCancelReservation(id, memberToken) {
  const reservation = state.reservations.find((item) => item.id === id);
  const startsAt = new Date(`${reservation.date}T${reservation.startTime}:00`);
  const hours = (startsAt - new Date()) / 36e5;
  if (hours < 12) {
    showToast("수업 12시간 전부터는 트레이너에게 문의해주세요.");
    return;
  }
  if (!confirm("예약을 취소할까요?")) return;
  try {
    const result = await MemberApi.cancelReservation(memberToken, id);
    state = result.state;
    location.href = `/booking/${memberToken}`;
  } catch (error) {
    showToast(error.message);
  }
}

window.addEventListener("popstate", render);
render();
