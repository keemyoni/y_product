export async function apiJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "요청을 처리하지 못했습니다.");
  return body;
}

export const AdminApi = {
  session: () => apiJson("/api/session"),
  login: (payload) => apiJson("/api/login", { method: "POST", body: JSON.stringify(payload) }),
  logout: () => apiJson("/api/logout", { method: "POST", body: "{}" }),
  loadState: () => apiJson("/api/admin/state"),
  saveState: (state) => apiJson("/api/admin/state", { method: "PUT", body: JSON.stringify(state) })
};

export const MemberApi = {
  loadState: (memberToken) => apiJson(`/api/member/${encodeURIComponent(memberToken)}`),
  createReservation: (memberToken, payload) => apiJson(`/api/member/${encodeURIComponent(memberToken)}/reservations`, {
    method: "POST",
    body: JSON.stringify(payload)
  }),
  cancelReservation: (memberToken, reservationId) => apiJson(`/api/member/${encodeURIComponent(memberToken)}/reservations/${encodeURIComponent(reservationId)}/cancel`, {
    method: "POST",
    body: "{}"
  })
};
