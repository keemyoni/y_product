import { escapeHtml } from "../shared/domain.js";

export function badge(label, tone = "neutral") {
  return `<span class="badge ${tone}">${escapeHtml(label)}</span>`;
}

export function stat(label, value) {
  return `
    <div class="stat">
      <span class="muted">${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

export function pageTitle(title, description, actions = "") {
  return `
    <section class="section-title">
      <div>
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(description)}</p>
      </div>
      ${actions}
    </section>
  `;
}

export function emptyTable(colspan, message) {
  return `<tr><td colspan="${colspan}" class="empty">${escapeHtml(message)}</td></tr>`;
}

export function loadingScreen(message) {
  return `
    <main class="login-screen">
      <section class="login-panel">
        <div class="brand">
          <div>
            <h1>PT 예약 관리</h1>
            <p>${escapeHtml(message)}</p>
          </div>
        </div>
      </section>
    </main>
  `;
}
