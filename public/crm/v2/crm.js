// IBB CRM v2 — private dashboard. No data lives in this file: everything comes
// from Supabase after login + authenticator code, and the database itself
// refuses any request without both (see crm/supabase/migrations/004).
(() => {
"use strict";

const SUPABASE_URL = "https://tbgxeqauakiydzwmqyyf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_6W3WVHfj1xqSDpv1c_4Nfg_jd__XOyA"; // publishable key: public by design, the database rules do the protecting
const IDLE_MINUTES = 30;
const VAT_THRESHOLD_EUR = 42500;
const FX_FALLBACK = 6.2; // BRL per EUR, only if the rate service is down

const NATURES = {
  receita: "Receita", estorno: "Devolução a cliente", despesa: "Despesa", imposto: "Imposto",
  pro_labore: "Pró-labore", aporte: "Aporte", fatura_cartao: "Fatura do cartão",
  transferencia: "Investimento / transferência", ajuste: "Ajuste", detalhe_cartao: "Item do cartão (não soma)",
};
const LEAD_STATUS = { new: "Novo", replied: "Respondido", check_sent: "Check enviado", call_requested: "Pediu call",
  call_booked: "Call marcada", client: "Virou cliente", lost: "Perdido" };
const CLIENT_STATUS = { prospect: "Em negociação", active: "Ativo", paused: "Pausado", ended: "Encerrado" };
const CONTRACT_STATUS = { draft: "Rascunho", active: "Ativo", notice: "Em aviso", ended: "Encerrado" };
const VAT_MODE = { included: "VAT incluído", plus: "+ VAT", none: "Sem VAT" };
const ENTITY = { BR: "Brasil", IE: "Irlanda" };
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MONTHS_FULL = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const ICON = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
  wallet: '<rect x="2.5" y="5.5" width="19" height="14" rx="3"/><path d="M2.5 9.5h19"/><circle cx="16.5" cy="14.5" r="1.3"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.8c1.6.8 2.7 2.5 3 5.2"/>',
  file: '<path d="M14 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8z"/><path d="M14 2.5V8h5.5M8.5 13h7M8.5 17h5"/>',
  inbox: '<path d="M3 13.5 5.5 5h13l2.5 8.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 13.5h5l1.5 2.5h5l1.5-2.5h5"/>',
  alert: '<path d="M12 3 2 20.5h20z"/><path d="M12 10v4.5M12 17.5v.1"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  repeat: '<path d="M17 2.5 20.5 6 17 9.5"/><path d="M3.5 11V9.5a3.5 3.5 0 0 1 3.5-3.5h13.5"/><path d="M7 21.5 3.5 18 7 14.5"/><path d="M20.5 13v1.5A3.5 3.5 0 0 1 17 18H3.5"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  check: '<path d="M4.5 12.5 9.5 17.5 19.5 6.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  out: '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M9 16.5 4.5 12 9 7.5M4.5 12H15"/>',
};
const ic = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON[n]}</svg>`;

// ── helpers ──────────────────────────────────────────────────────────────────
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (v, cur = "BRL", dec = 2) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: cur, minimumFractionDigits: dec, maximumFractionDigits: dec }).format(+v || 0);
const short = (v, cur) => (Math.abs(v) >= 10000 ? money(v, cur, 0) : money(v, cur));
const moneyEn = (v, cur = "EUR") => new Intl.NumberFormat("en-IE", { style: "currency", currency: cur }).format(+v || 0);
const fdate = (d) => (d ? d.slice(0, 10).split("-").reverse().join("/") : "");
const enDate = (d) => { const [y, m, dd] = d.split("-"); return `${+dd} ${MONTHS_EN[+m - 1]} ${y}`; };
const today = () => { const n = new Date(); return new Date(n - n.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const addDays = (d, n) => { const x = new Date(d + "T12:00:00"); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
const addMonths = (d, n) => { const x = new Date(d + "T12:00:00"); x.setMonth(x.getMonth() + n); return x.toISOString().slice(0, 10); };
const daysBetween = (a, b) => Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 864e5);
const sum = (arr, f = (x) => x) => arr.reduce((a, x) => a + (+f(x) || 0), 0);
const store = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };

function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), 3200);
}

// theme (dark by default)
function applyTheme() {
  const light = store.get("crm-theme") === "light";
  document.documentElement.dataset.theme = light ? "light" : "dark";
  const b = $("#theme"); if (b) b.innerHTML = light ? `${ic("moon")} Tema escuro` : `${ic("sun")} Tema claro`;
}
applyTheme();

const LOGO = `<div class="logo"><span class="mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg></span><div>IBB<small>CRM</small></div></div>`;

if (!window.supabase || !SUPABASE_ANON_KEY) {
  const a = $("#auth"); a.hidden = false;
  a.innerHTML = `<div class="box">${LOGO}<h1>Não configurado</h1><p>Falta a chave pública do Supabase em crm.js.</p></div>`;
  return;
}
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

// ── auth: magic link → authenticator app (TOTP) ─────────────────────────────
const authBox = (html) => { $("#app").hidden = true; const a = $("#auth"); a.hidden = false; a.innerHTML = `<div class="box">${LOGO}${html}</div>`; return a; };

function showLogin(msg = "") {
  const a = authBox(`<h1>Bem-vinda <span class="serif">de volta</span></h1><p>Entre com o seu e-mail. O link de acesso chega na hora.</p>
    <form class="row" id="f"><input type="email" id="em" placeholder="seu e-mail" autocomplete="email" required>
    <button class="primary">Enviar link</button><div class="err">${esc(msg)}</div></form>`);
  $("#f", a).onsubmit = async (e) => {
    e.preventDefault();
    const btn = $("button", a); btn.disabled = true;
    const { error } = await sb.auth.signInWithOtp({
      email: $("#em", a).value.trim(),
      options: { shouldCreateUser: false, emailRedirectTo: location.origin + location.pathname },
    });
    if (error && !/signups not allowed|not found/i.test(error.message)) { btn.disabled = false; $(".err", a).textContent = error.message; return; }
    authBox(`<h1>Confira seu <span class="serif">e-mail</span></h1><p>Se este e-mail tiver acesso, o link chega em instantes. Abra o link neste mesmo navegador.</p>`);
  };
}

async function gate() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return showLogin();
  S.email = session.user?.email || "";
  const { data: aal, error } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) return showLogin(error.message);
  if (aal.currentLevel === "aal2") return startApp();
  const { data: f } = await sb.auth.mfa.listFactors();
  const verified = (f?.totp || []).find((x) => x.status === "verified");
  return verified ? showChallenge(verified.id) : showEnroll(f?.all || []);
}

function codeForm(a, onCode) {
  const inp = $("#code", a); inp.focus();
  inp.oninput = () => { if (inp.value.replace(/\D/g, "").length === 6) $("#f", a).requestSubmit?.(); };
  $("#f", a).onsubmit = async (e) => {
    e.preventDefault();
    const btn = $("button", a); if (btn.disabled) return; btn.disabled = true;
    const err = await onCode(inp.value.replace(/\D/g, ""));
    if (err) { btn.disabled = false; $(".err", a).textContent = err; inp.select(); }
  };
}

function showChallenge(factorId) {
  const a = authBox(`<h1>Código do <span class="serif">app</span></h1><p>Digite os 6 dígitos do seu app autenticador.</p>
    <form class="row" id="f"><input id="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000" required>
    <button class="primary">Entrar</button><div class="err"></div></form>
    <p class="sub" style="margin:14px 0 0"><a href="#" id="out">Sair</a></p>`);
  $("#out", a).onclick = (e) => { e.preventDefault(); sb.auth.signOut().then(() => showLogin()); };
  codeForm(a, async (code) => {
    const { error } = await sb.auth.mfa.challengeAndVerify({ factorId, code });
    if (error) return "Código inválido. Tente de novo.";
    startApp();
  });
}

async function showEnroll(allFactors) {
  for (const f of allFactors.filter((x) => x.status !== "verified")) await sb.auth.mfa.unenroll({ factorId: f.id });
  const { data, error } = await sb.auth.mfa.enroll({ factorType: "totp", friendlyName: "IBB CRM " + today() });
  if (error) return authBox(`<h1>Erro</h1><p>${esc(error.message)}</p>`);
  const a = authBox(`<h1>Proteja o <span class="serif">acesso</span></h1>
    <p>Abra o app autenticador no celular (Google Authenticator, Authy, 1Password…), toque em adicionar e leia o QR code.</p>
    <img class="qr" alt="QR code" src="${esc(data.totp.qr_code)}">
    <p class="sub">Sem câmera? Digite esta chave no app:</p><code>${esc(data.totp.secret)}</code>
    <form class="row" id="f"><input id="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000" required>
    <button class="primary">Ativar e entrar</button><div class="err"></div></form>`);
  codeForm(a, async (code) => {
    const { error } = await sb.auth.mfa.challengeAndVerify({ factorId: data.id, code });
    if (error) return "Código inválido. Confira o horário do celular e tente de novo.";
    startApp();
  });
}

let idleTimer;
function bumpIdle() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(async () => { await sb.auth.signOut(); showLogin("Saiu por inatividade."); }, IDLE_MINUTES * 60e3);
}
["click", "keydown", "scroll", "touchstart"].forEach((ev) => addEventListener(ev, bumpIdle, { passive: true }));

// ── data ─────────────────────────────────────────────────────────────────────
const S = {
  tab: "overview", ent: store.get("crm-ent") || "ALL", fx: null, fxDate: null, email: "",
  fin: { entity: "BR", year: String(new Date().getFullYear()), nature: "", q: "", card: false },
};

async function all(table, order, asc = true) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from(table).select("*").order(order, { ascending: asc }).range(from, from + 999);
    if (error) throw error;
    out.push(...data);
    if (data.length < 1000) return out;
  }
}

async function loadFx() {
  for (const host of ["https://api.frankfurter.app", "https://api.frankfurter.dev/v1"]) {
    try {
      const r = await fetch(`${host}/latest?from=EUR&to=BRL`);
      if (!r.ok) continue;
      const j = await r.json();
      if (j?.rates?.BRL) { S.fx = j.rates.BRL; S.fxDate = j.date; return; }
    } catch {}
  }
  S.fx = FX_FALLBACK; S.fxDate = null;
}

async function load() {
  const [clients, contracts, invoices, accounts, balances, settings, transactions, leads] = await Promise.all([
    all("clients", "company"), all("contracts", "start_date"), all("invoices", "issue_date", false), all("accounts", "name"),
    all("v_account_balances", "name"), all("settings", "key"), all("transactions", "date", false),
    sb.from("leads").select("*").order("created_at", { ascending: false }).limit(300).then((r) => { if (r.error) throw r.error; return r.data; }),
    S.fx ? null : loadFx(),
  ]);
  Object.assign(S, { clients, contracts, invoices, accounts, balances, transactions, leads,
    settings: Object.fromEntries(settings.map((s) => [s.key, s.value])) });
}

const clientById = (id) => S.clients.find((c) => c.id === id);
const accountById = (id) => S.accounts.find((a) => a.id === id);
const contractsOf = (id) => S.contracts.filter((k) => k.client_id === id);
const invoiceState = (i) => (i.status === "sent" && i.due_date < today() ? "late" : i.status === "sent" ? "open" : i.status);
const INVOICE_LABEL = { open: "Em aberto", late: "Atrasado", paid: "Pago", draft: "Rascunho", cancelled: "Cancelado" };

// currency of the current view, and conversion into it
const viewCur = () => (S.ent === "BR" ? "BRL" : "EUR");
const conv = (v, from, to = viewCur()) => (from === to ? +v : from === "BRL" ? +v / S.fx : +v * S.fx);
const inEnt = (x) => S.ent === "ALL" || x.entity === S.ent;

async function startApp() {
  $("#auth").hidden = true; $("#app").hidden = false; bumpIdle();
  $("#who").textContent = S.email;
  $("#view").innerHTML = `<div class="topbar"><div class="skel" style="width:260px;height:40px"></div></div>
    <div class="kpis">${'<div class="skel" style="height:104px"></div>'.repeat(4)}</div>
    <div class="grid-home"><div class="skel" style="height:320px"></div><div class="skel" style="height:320px"></div></div>`;
  try { await load(); } catch (e) { $("#view").innerHTML = `<p class="empty">Erro ao carregar: ${esc(e.message)}</p>`; return; }
  render();
}

async function save(table, row, id) {
  const q = id ? sb.from(table).update(row).eq("id", id) : sb.from(table).insert(row);
  const { data, error } = await q.select().single();
  if (error) { toast("Erro: " + error.message); throw error; }
  return data;
}
async function remove(table, id) {
  const { error } = await sb.from(table).delete().eq("id", id);
  if (error) { toast("Erro: " + error.message); throw error; }
}
async function refresh(msg) { await load(); render(); if (msg) toast(msg); }

// ── shell ────────────────────────────────────────────────────────────────────
const TABS = [["overview", "Início", "home"], ["finance", "Financeiro", "wallet"], ["clients", "Clientes", "users"], ["invoices", "Invoices", "file"], ["leads", "Leads", "inbox"]];

function renderNav() {
  const counts = {
    invoices: S.invoices.filter((i) => invoiceState(i) === "late").length,
    leads: S.leads.filter((l) => l.status === "new").length,
  };
  $("#tabs").innerHTML = TABS.map(([k, l, i]) => `<button data-tab="${k}" class="${S.tab === k ? "on" : ""}">${ic(i)}${l}${counts[k] ? `<span class="count">${counts[k]}</span>` : ""}</button>`).join("");
  $("#bottomnav").innerHTML = TABS.map(([k, l, i]) => `<button data-tab="${k}" class="${S.tab === k ? "on" : ""}">${ic(i)}${l}</button>`).join("");
}
const go = (tab) => { S.tab = tab; render(); scrollTo({ top: 0 }); };
document.addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) go(b.dataset.tab); });
$("#theme").onclick = () => { store.set("crm-theme", store.get("crm-theme") === "light" ? "dark" : "light"); applyTheme(); render(); };
$("#logout").innerHTML = `${ic("out")} Sair`;
$("#logout").onclick = async () => { await sb.auth.signOut(); location.reload(); };

function render() { applyTheme(); renderNav(); ({ overview, finance, clients, invoices, leads })[S.tab](); countUp(); }

function topbar(title, sub = "", right = "") {
  return `<div class="topbar"><div><h1>${title}</h1>${sub ? `<div class="sub">${sub}</div>` : ""}</div><div class="spacer"></div>${right}</div>`;
}
function entSwitch() {
  return `<div><div class="seg" id="ent">${[["BR", "Brasil"], ["IE", "Irlanda"], ["ALL", "Tudo"]].map(([k, l]) => `<button data-ent="${k}" class="${S.ent === k ? "on" : ""}">${l}</button>`).join("")}</div>
    ${S.ent === "ALL" ? `<div class="fx" style="text-align:right;margin-top:5px">em € · 1 € = ${S.fx.toFixed(2).replace(".", ",")} R$ ${S.fxDate ? `(BCE ${fdate(S.fxDate)})` : "(aprox.)"}</div>` : ""}</div>`;
}
function bindEnt(rerender) {
  $$("#ent [data-ent]").forEach((b) => (b.onclick = () => { S.ent = b.dataset.ent; store.set("crm-ent", S.ent); rerender(); countUp(); }));
}

// numbers that count up on screen
function countUp() {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;
  $$("[data-count]").forEach((el) => {
    const end = +el.dataset.count, cur = el.dataset.cur, t0 = performance.now(), dur = 900;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = short(end * e, cur);
      if (k < 1) requestAnimationFrame(step); else el.textContent = short(end, cur);
    };
    requestAnimationFrame(step);
  });
}

// ── charts (inline SVG) ──────────────────────────────────────────────────────
function series(months = 12, offsetYears = 0) {
  const now = new Date(); const cur = viewCur(); const out = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear() - offsetYears, now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const ts = S.transactions.filter((t) => inEnt(t) && t.date.startsWith(key));
    const v = (n) => sum(ts.filter((t) => n.includes(t.nature)), (t) => conv(t.amount, t.currency, cur));
    out.push({ key, label: MONTHS[d.getMonth()], year: d.getFullYear(), inc: v(["receita"]) - v(["estorno"]), out: v(["despesa", "fatura_cartao", "imposto"]) });
  }
  return out;
}
const pathOf = (pts) => pts.map((p, i) => {
  if (!i) return `M${p[0]},${p[1]}`;
  const [x0, y0] = pts[i - 1], cx = (x0 + p[0]) / 2;
  return `C${cx},${y0} ${cx},${p[1]} ${p[0]},${p[1]}`;
}).join("");

function bigChart() {
  const W = 760, H = 280, P = { l: 8, r: 8, t: 14, b: 26 };
  const s = series(), prev = series(12, 1), cur = viewCur();
  const max = Math.max(1, ...s.map((x) => Math.max(x.inc, x.out)), ...prev.map((x) => x.inc)) * 1.12;
  const X = (i) => P.l + (i * (W - P.l - P.r)) / (s.length - 1), Y = (v) => H - P.b - (v / max) * (H - P.t - P.b);
  const pIn = s.map((x, i) => [X(i), Y(x.inc)]), pOut = s.map((x, i) => [X(i), Y(x.out)]), pPrev = prev.map((x, i) => [X(i), Y(x.inc)]);
  const area = `${pathOf(pIn)}L${X(s.length - 1)},${H - P.b}L${X(0)},${H - P.b}Z`;
  const grid = [0.25, 0.5, 0.75, 1].map((k) => `<line class="gl" x1="0" x2="${W}" y1="${Y(max * k / 1.12)}" y2="${Y(max * k / 1.12)}"/>`).join("");
  const len = 3000;
  return `<div class="chart" id="chart" data-cur="${cur}">
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <defs><linearGradient id="gin" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#5DCAA5" stop-opacity=".32"/><stop offset="1" stop-color="#5DCAA5" stop-opacity="0"/></linearGradient></defs>
      ${grid}
      <path d="${area}" fill="url(#gin)"/>
      <path class="l-prev" d="${pathOf(pPrev)}" vector-effect="non-scaling-stroke"/>
      <path class="l-out draw" style="--len:${len}" d="${pathOf(pOut)}" vector-effect="non-scaling-stroke"/>
      <path class="l-in draw" style="--len:${len}" d="${pathOf(pIn)}" vector-effect="non-scaling-stroke"/>
      ${s.map((x, i) => `<text class="axis" x="${X(i)}" y="${H - 6}" text-anchor="${i === 0 ? "start" : i === s.length - 1 ? "end" : "middle"}">${x.label}</text>`).join("")}
      <line class="cursor" id="cx" x1="0" x2="0" y1="${P.t}" y2="${H - P.b}" opacity="0"/>
      <circle class="dot" id="d1" r="5" fill="#5DCAA5" opacity="0"/><circle class="dot" id="d2" r="5" fill="#ee7a50" opacity="0"/>
    </svg>
    <div class="tip" id="tip" style="opacity:0"></div>
  </div>
  <div class="legend" style="margin-top:12px"><span><i style="background:var(--teal)"></i>Receita</span><span><i style="background:var(--coral-2)"></i>Despesas, faturas e impostos</span><span><i style="background:var(--faint)"></i>Receita 12 meses antes</span></div>`;
  // hover is bound in bindChart()
}
function bindChart() {
  const box = $("#chart"); if (!box) return;
  const svg = $("svg", box), tip = $("#tip", box), cur = box.dataset.cur;
  const s = series(), prev = series(12, 1);
  const W = 760, H = 280, P = { l: 8, r: 8, t: 14, b: 26 };
  const max = Math.max(1, ...s.map((x) => Math.max(x.inc, x.out)), ...prev.map((x) => x.inc)) * 1.12;
  const X = (i) => P.l + (i * (W - P.l - P.r)) / (s.length - 1), Y = (v) => H - P.b - (v / max) * (H - P.t - P.b);
  const show = (clientX) => {
    const r = svg.getBoundingClientRect();
    const i = Math.max(0, Math.min(s.length - 1, Math.round(((clientX - r.left) / r.width * W - P.l) / ((W - P.l - P.r) / (s.length - 1)))));
    const x = X(i), m = s[i], p = prev[i];
    $("#cx", svg).setAttribute("x1", x); $("#cx", svg).setAttribute("x2", x); $("#cx", svg).setAttribute("opacity", 1);
    [["#d1", m.inc], ["#d2", m.out]].forEach(([id, v]) => { const d = $(id, svg); d.setAttribute("cx", x); d.setAttribute("cy", Y(v)); d.setAttribute("opacity", 1); });
    const delta = p.inc ? Math.round(((m.inc - p.inc) / p.inc) * 100) : null;
    tip.innerHTML = `<b>${MONTHS_FULL[+m.key.slice(5) - 1]} ${m.year}</b>
      <div><span>Receita</span><span class="m" style="color:var(--teal)">${money(m.inc, cur)}</span></div>
      <div><span>Gastos</span><span class="m" style="color:var(--coral-2)">${money(m.out, cur)}</span></div>
      <div><span>${p.year}</span><span class="m">${money(p.inc, cur)}${delta !== null ? ` <span class="delta ${delta >= 0 ? "up" : "down"}">${delta >= 0 ? "+" : ""}${delta}%</span>` : ""}</span></div>`;
    tip.style.left = `${Math.max(90, Math.min(r.width - 90, (x / W) * r.width))}px`;
    tip.style.top = `${(Y(Math.max(m.inc, m.out)) / H) * r.height - 12}px`;
    tip.style.opacity = 1;
  };
  box.onmousemove = (e) => show(e.clientX);
  box.ontouchstart = box.ontouchmove = (e) => show(e.touches[0].clientX);
  box.onmouseleave = () => { tip.style.opacity = 0; ["#cx", "#d1", "#d2"].forEach((id) => $(id, svg).setAttribute("opacity", 0)); };
}
function spark(values, color) {
  const W = 120, H = 40, max = Math.max(1, ...values);
  const pts = values.map((v, i) => [(i * W) / (values.length - 1), H - 4 - (v / max) * (H - 10)]);
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><path d="${pathOf(pts)}L${W},${H}L0,${H}Z" fill="${color}" opacity=".12"/><path d="${pathOf(pts)}" fill="none" stroke="${color}" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>`;
}
const deltaTag = (now, before, invert = false) => {
  if (!before) return `<span class="delta flat">—</span>`;
  const d = Math.round(((now - before) / Math.abs(before)) * 100);
  const good = invert ? d <= 0 : d >= 0;
  return `<span class="delta ${d === 0 ? "flat" : good ? "up" : "down"}">${d > 0 ? "+" : ""}${d}%</span>`;
};

// ── home ─────────────────────────────────────────────────────────────────────
function todoItems() {
  const t = today(), items = [];
  for (const i of S.invoices.filter((x) => x.status === "sent").sort((a, b) => a.due_date.localeCompare(b.due_date))) {
    const c = clientById(i.client_id)?.company, late = i.due_date < t, d = daysBetween(t, i.due_date);
    if (!late && d > 7) continue;
    items.push({ tone: late ? "red" : "amber", icon: late ? "alert" : "clock",
      title: late ? `${i.number} atrasado` : `${i.number} vence ${d === 0 ? "hoje" : d === 1 ? "amanhã" : `em ${d} dias`}`,
      sub: `${c} · ${late ? `venceu em ${fdate(i.due_date)} (${-d} dia${-d === 1 ? "" : "s"})` : `vencimento ${fdate(i.due_date)}`}${i.notes ? ` · ${i.notes}` : ""}`,
      amt: money(i.amount, i.currency), action: ["Recebido", () => paidForm(i)] });
  }
  const month = t.slice(0, 7), mName = MONTHS_FULL[+t.slice(5, 7) - 1];
  for (const k of S.contracts.filter((x) => x.status === "active" && +x.monthly_fee > 0)) {
    const has = S.invoices.some((i) => i.contract_id === k.id && i.issue_date.startsWith(month) && i.status !== "cancelled" && /month/i.test(i.description));
    const dueDay = k.billing_day || 1;
    if (!has && +t.slice(8) >= dueDay - 3) {
      const c = clientById(k.client_id);
      items.push({ tone: "coral", icon: "file", title: `Invoice de ${mName}: ${c?.company}`, sub: `${k.title} · cobrança todo dia ${dueDay}`,
        amt: money(k.monthly_fee, k.currency), action: ["Gerar", () => invoiceForm({ client_id: k.client_id }, true)] });
    }
  }
  for (const k of S.contracts.filter((x) => (x.status === "active" || x.status === "notice") && x.renewal_date)) {
    const d = daysBetween(t, k.renewal_date);
    if (d < 0 || d > 60) continue;
    const c = clientById(k.client_id), notice = k.notice_days ? addDays(k.renewal_date, -k.notice_days) : null;
    items.push({ tone: "blue", icon: "repeat", title: `Renovação: ${c?.company} em ${d} dias`,
      sub: `fim do período mínimo ${fdate(k.renewal_date)}${notice ? ` · aviso até ${fdate(notice)}` : ""}`, action: ["Ver cliente", () => go("clients")] });
  }
  const flagged = S.transactions.filter((x) => x.flag).length;
  if (flagged) items.push({ tone: "amber", icon: "flag", title: `${flagged} lançamento${flagged > 1 ? "s" : ""} para conferir`, sub: "marcados na importação ou por você",
    action: ["Conferir", () => { S.fin.nature = "flag"; S.fin.year = "all"; go("finance"); }] });
  const fresh = S.leads.filter((l) => l.status === "new");
  if (fresh.length) items.push({ tone: "teal", icon: "spark", title: `${fresh.length} lead${fresh.length > 1 ? "s" : ""} novo${fresh.length > 1 ? "s" : ""} sem resposta`,
    sub: fresh.slice(0, 3).map((l) => l.business || l.name).filter(Boolean).join(", "), action: ["Ver leads", () => go("leads")] });
  return items;
}

function overview() {
  const t = today(), y = +t.slice(0, 4), m = t.slice(0, 7), cur = viewCur();
  const tx = S.transactions.filter(inEnt);
  const val = (list, natures) => sum(list.filter((x) => natures.includes(x.nature)), (x) => conv(x.amount, x.currency, cur));
  const rev = (list) => val(list, ["receita"]) - val(list, ["estorno"]);
  const prevMonth = (() => { const d = new Date(y, +t.slice(5, 7) - 2, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; })();
  const sameDayLastYear = `${y - 1}${t.slice(4)}`;
  const ytd = tx.filter((x) => x.date.startsWith(String(y))), lytd = tx.filter((x) => x.date.startsWith(String(y - 1)) && x.date <= sameDayLastYear);
  const revM = rev(tx.filter((x) => x.date.startsWith(m))), revPM = rev(tx.filter((x) => x.date.startsWith(prevMonth) && x.date.slice(8) <= t.slice(8)));
  const revY = rev(ytd), revLY = rev(lytd);
  const costY = val(ytd, ["despesa", "fatura_cartao", "imposto"]);
  const banks = S.balances.filter((b) => inEnt(b) && b.kind === "bank");
  const cash = sum(banks, (b) => conv(b.balance, b.currency, cur));
  const invest = sum(S.balances.filter((b) => inEnt(b) && b.kind === "investment"), (b) => conv(b.last_checked_balance, b.currency, cur));
  const active = S.contracts.filter((k) => (k.status === "active" || k.status === "notice") && inEnt(k));
  const mrr = sum(active, (k) => conv(k.monthly_fee, k.currency, cur));
  const open = S.invoices.filter((i) => i.status === "sent" && inEnt(i));
  const receivable = sum(open, (i) => conv(i.amount, i.currency, cur));
  const sp = series();
  const hour = new Date().getHours(), hello = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const dateLabel = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  const todos = todoItems();
  const ie12 = S.transactions.filter((x) => x.entity === "IE" && x.date > addDays(t, -365));
  const vat = sum(ie12.filter((x) => x.nature === "receita"), (x) => x.amount) - sum(ie12.filter((x) => x.nature === "estorno"), (x) => x.amount);
  const vatPct = Math.min(100, (vat / VAT_THRESHOLD_EUR) * 100);
  const recent = tx.filter((x) => x.nature !== "detalhe_cartao").slice(0, 7);
  const activeClients = S.contracts.filter((k) => k.status === "active" || k.status === "notice");
  const kpi = (k, v, c, s = "", extra = "", cls = "") => `<div class="panel kpi ${cls}"><div class="k">${k}</div><div class="v" data-count="${v}" data-cur="${c}">${short(v, c)}</div><div class="s">${s}</div>${extra}</div>`;

  $("#view").innerHTML = `
    ${topbar(`${hello}, <span class="serif">Eli</span>`, dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1), entSwitch())}
    <div class="kpis six">
      ${kpi(`Receita de ${MONTHS_FULL[+t.slice(5, 7) - 1]}`, revM, cur, `${deltaTag(revM, revPM)} vs mesmos dias de ${MONTHS_FULL[+prevMonth.slice(5) - 1]}`, spark(sp.map((x) => x.inc), "#5DCAA5"), "accent")}
      ${kpi(`Receita ${y}`, revY, cur, `${deltaTag(revY, revLY)} vs mesmo período de ${y - 1}`)}
      ${kpi(`Resultado ${y}`, revY - costY, cur, "receita − despesas e impostos")}
      ${kpi("Caixa", cash, cur, invest ? `+ ${short(invest, cur)} investidos` : `${banks.length} conta${banks.length === 1 ? "" : "s"}`)}
      ${kpi("Recorrente / mês", mrr, cur, `${active.length} contrato${active.length === 1 ? "" : "s"} ativo${active.length === 1 ? "" : "s"}`)}
      ${kpi("A receber", receivable, cur, `${open.length} invoice${open.length === 1 ? "" : "s"} em aberto`)}
    </div>
    <div class="grid-home">
      <div class="stack">
        <div class="panel pad"><div class="ph"><h2>Precisa de você</h2><span class="hint">${todos.length ? `${todos.length} ${todos.length > 1 ? "itens" : "item"}` : "hoje"}</span></div>
          ${todos.length ? `<div class="today">${todos.map((it, n) => `<div class="todo" style="animation-delay:${n * 60}ms">
              <span class="ic ${it.tone}">${ic(it.icon)}</span>
              <div class="tx"><b>${esc(it.title)}</b><span>${esc(it.sub)}</span></div>
              ${it.amt ? `<span class="amt">${esc(it.amt)}</span>` : ""}
              <button class="small ${it.tone === "red" || it.tone === "coral" ? "primary" : "ghost"}" data-todo="${n}">${esc(it.action[0])}</button></div>`).join("")}</div>`
          : `<div class="allgood"><span class="ic">${ic("check")}</span><div><b style="color:var(--ink)">Tudo em dia.</b><br>Nenhum invoice atrasado, nenhuma renovação perto.</div></div>`}
        </div>
        <div class="panel pad"><div class="ph"><h2>Últimos 12 meses</h2><span class="hint">${S.ent === "ALL" ? "Brasil + Irlanda" : ENTITY[S.ent]}</span></div>${bigChart()}</div>
      </div>
      <div class="stack">
        <div class="panel pad"><div class="ph"><h2>Contratos ativos</h2><span class="hint">${activeClients.length}</span></div>
          <div class="clientmini">${activeClients.map((k) => {
            const c = clientById(k.client_id), months = S.invoices.filter((i) => i.contract_id === k.id && /month/i.test(i.description) && i.status !== "cancelled").length;
            const pct = k.min_months ? Math.min(100, (months / k.min_months) * 100) : 100, left = k.renewal_date ? daysBetween(t, k.renewal_date) : null;
            return `<div class="row"><b>${esc(c?.company)}</b><span class="m nowrap">${money(k.monthly_fee, k.currency, 0)}<small style="color:var(--muted);font-weight:400"> /mês</small></span>
              <div class="meter coral"><i style="width:${pct}%"></i></div>
              <div class="sub"><span>${k.min_months ? `mês ${months} de ${k.min_months}` : esc(k.title)}</span><span>${left !== null ? (left >= 0 ? `renova em ${left} dias` : "mês a mês") : ""}</span></div></div>`;
          }).join("") || `<div class="empty">Nenhum contrato ativo</div>`}</div>
        </div>
        <div class="panel pad"><div class="ph"><h2>Limite do VAT</h2><span class="hint">Irlanda · 12 meses</span></div>
          <div style="display:flex;justify-content:space-between;align-items:baseline"><span class="mono" style="font-size:20px;color:var(--ink);font-weight:600">${money(vat, "EUR", 0)}</span><span class="sub">de ${money(VAT_THRESHOLD_EUR, "EUR", 0)}</span></div>
          <div class="meter ${vatPct > 100 ? "over" : vatPct > 80 ? "hot" : ""}"><i style="width:${vatPct}%"></i></div>
          <div class="sub" style="margin-top:8px">${vatPct >= 80 ? "Perto do limite: hora de falar com o contador." : `Faltam ${money(Math.max(0, VAT_THRESHOLD_EUR - vat), "EUR", 0)} para precisar registrar.`}</div>
        </div>
        <div class="panel pad"><div class="ph"><h2>Movimentações</h2><button class="small ghost" data-tab="finance">Ver tudo</button></div>
          <div class="feed">${recent.map((x) => `<div class="it"><span class="dotc" style="background:${x.type === "in" ? "var(--teal)" : "var(--coral-2)"}"></span>
            <div class="t"><b>${esc(x.description)}</b><span>${fdate(x.date)} · ${esc(NATURES[x.nature])}${S.ent === "ALL" ? ` · ${x.entity}` : ""}</span></div>
            <span class="a ${x.type === "in" ? "pos" : ""}">${x.type === "in" ? "+" : "−"}${money(x.amount, x.currency, 0)}</span></div>`).join("") || `<div class="empty">Nada ainda</div>`}</div>
        </div>
      </div>
    </div>`;
  $$("[data-todo]").forEach((b) => (b.onclick = () => todos[+b.dataset.todo].action[1]()));
  bindEnt(overview);
  bindChart();
}

// ── generic form drawer ──────────────────────────────────────────────────────
function form({ title, fields, values = {}, onSave, onDelete, deleteLabel = "Apagar", note, onChange, saveLabel = "Salvar", onOpen }) {
  const m = $("#modal"); m.hidden = false;
  const input = (f) => {
    const v = values[f.k] ?? "";
    if (f.type === "select") return `<select name="${f.k}">${Object.entries(f.options).map(([k, l]) => `<option value="${esc(k)}" ${String(v) === k ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>`;
    if (f.type === "textarea") return `<textarea name="${f.k}">${esc(v)}</textarea>`;
    return `<input name="${f.k}" type="${f.type || "text"}" value="${esc(v)}" ${f.step ? `step="${f.step}"` : ""} ${f.list ? `list="dl-${f.k}"` : ""} ${f.required ? "required" : ""}>
      ${f.list ? `<datalist id="dl-${f.k}">${f.list.map((o) => `<option value="${esc(o)}">`).join("")}</datalist>` : ""}`;
  };
  m.innerHTML = `<form class="box"><h2>${esc(title)}</h2>${note ? `<div class="hint">${note}</div>` : ""}
    <div class="grid">${fields.map((f) => `<div class="${f.full ? "full" : ""}"><label>${esc(f.label)}</label>${input(f)}${f.hint ? `<div class="sub" style="margin-top:5px">${esc(f.hint)}</div>` : ""}</div>`).join("")}</div>
    <div class="foot">${onDelete ? `<button type="button" class="danger left" id="del">${esc(deleteLabel)}</button>` : ""}
      <button type="button" class="ghost" id="cancel">Cancelar</button><button class="primary" id="ok">${esc(saveLabel)}</button></div></form>`;
  const f = $("form", m);
  const read = () => Object.fromEntries(fields.map((x) => {
    const raw = f.elements[x.k].value.trim();
    return [x.k, raw === "" ? null : x.type === "number" ? +raw : raw];
  }));
  const set = (k, v) => { if (f.elements[k]) f.elements[k].value = v ?? ""; };
  if (onChange) f.addEventListener("change", (e) => onChange(e.target.name, read(), set));
  const close = () => { m.hidden = true; m.innerHTML = ""; removeEventListener("keydown", onKey); };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  addEventListener("keydown", onKey);
  $("#cancel", m).onclick = close;
  m.onclick = (e) => { if (e.target === m) close(); };
  f.onsubmit = async (e) => {
    e.preventDefault(); $("#ok", m).disabled = true;
    try { await onSave(read()); close(); } catch (err) { console.error(err); $("#ok", m).disabled = false; }
  };
  if (onDelete) $("#del", m).onclick = async () => {
    if (!confirm("Tem certeza? Fica registrado no histórico, mas some do painel.")) return;
    try { await onDelete(); close(); } catch (err) { console.error(err); }
  };
  if (onOpen) onOpen(set, read);
  setTimeout(() => f.querySelector("input:not([type=hidden]), select, textarea")?.focus(), 50);
}

// ── finance ──────────────────────────────────────────────────────────────────
function finance() {
  const F = S.fin;
  const years = [...new Set([String(new Date().getFullYear()), ...S.transactions.filter((t) => t.entity === F.entity).map((t) => t.date.slice(0, 4))])].sort().reverse();
  const cur = F.entity === "BR" ? "BRL" : "EUR";
  const inYear = S.transactions.filter((t) => t.entity === F.entity && (F.year === "all" || t.date.startsWith(F.year)));
  const q = F.q.toLowerCase();
  const rows = inYear.filter((t) => (F.card || t.nature !== "detalhe_cartao") && (!F.nature || (F.nature === "flag" ? t.flag : t.nature === F.nature))
    && (!q || `${t.description} ${t.category} ${t.client_name} ${t.notes}`.toLowerCase().includes(q)));
  const tot = (n) => sum(inYear.filter((t) => t.nature === n), (t) => t.amount);
  const receita = tot("receita") - tot("estorno"), gastos = tot("despesa") + tot("fatura_cartao"), imp = tot("imposto");
  const byClient = {};
  inYear.filter((t) => t.nature === "receita").forEach((t) => { const k = t.client_name || t.category || "Outros"; byClient[k] = (byClient[k] || 0) + +t.amount; });
  const byCat = {};
  inYear.filter((t) => t.nature === "despesa" || (F.card && t.nature === "detalhe_cartao")).forEach((t) => { const k = t.category || "Outros"; byCat[k] = (byCat[k] || 0) + +t.amount; });
  const top = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const barList = (o) => { const t = top(o), mx = Math.max(1, ...t.map((x) => x[1])); return t.map(([k, v], n) => `<div class="r"><div class="top"><span>${esc(k)}</span><b>${money(v, cur, 0)}</b></div><div class="bar"><i style="width:${(v / mx) * 100}%;animation-delay:${n * 60}ms"></i></div></div>`).join(""); };

  $("#view").innerHTML = `
    ${topbar("Financeiro", `${ENTITY[F.entity]} · ${F.year === "all" ? "todos os anos" : F.year}`, `<button class="primary" id="new-tx">${ic("plus")} Lançamento</button>`)}
    <div class="toolbar">
      <div><label>Empresa</label><div class="seg" id="f-entity">${Object.entries(ENTITY).map(([k, l]) => `<button data-v="${k}" class="${F.entity === k ? "on" : ""}">${l}</button>`).join("")}</div></div>
      <div><label>Ano</label><select id="f-year">${years.map((y) => `<option ${F.year === y ? "selected" : ""}>${y}</option>`).join("")}<option value="all" ${F.year === "all" ? "selected" : ""}>Todos</option></select></div>
      <div><label>Tipo</label><select id="f-nature"><option value="">Todos</option><option value="flag" ${F.nature === "flag" ? "selected" : ""}>⚑ Para conferir</option>${Object.entries(NATURES).map(([k, l]) => `<option value="${k}" ${F.nature === k ? "selected" : ""}>${l}</option>`).join("")}</select></div>
      <div class="grow"><label>Buscar</label><input id="f-q" value="${esc(F.q)}" placeholder="cliente, descrição…"></div>
      <div><label>&nbsp;</label><label style="display:flex;gap:8px;align-items:center;color:var(--body);text-transform:none;font-family:var(--sans);font-size:13px;letter-spacing:0;padding:10px 0"><input type="checkbox" id="f-card" style="width:auto" ${F.card ? "checked" : ""}> itens do cartão</label></div>
    </div>
    <div class="kpis">
      <div class="panel kpi accent"><div class="k">Receita</div><div class="v" data-count="${receita}" data-cur="${cur}">${short(receita, cur)}</div><div class="s">já descontadas devoluções</div></div>
      <div class="panel kpi"><div class="k">Despesas</div><div class="v" data-count="${gastos}" data-cur="${cur}">${short(gastos, cur)}</div><div class="s">${F.entity === "BR" ? "inclui faturas do cartão" : "&nbsp;"}</div></div>
      <div class="panel kpi"><div class="k">Impostos</div><div class="v" data-count="${imp}" data-cur="${cur}">${short(imp, cur)}</div><div class="s">&nbsp;</div></div>
      <div class="panel kpi"><div class="k">Resultado</div><div class="v" data-count="${receita - gastos - imp}" data-cur="${cur}">${short(receita - gastos - imp, cur)}</div><div class="s">antes do pró-labore</div></div>
      <div class="panel kpi"><div class="k">Pró-labore</div><div class="v" data-count="${tot("pro_labore")}" data-cur="${cur}">${short(tot("pro_labore"), cur)}</div><div class="s">&nbsp;</div></div>
    </div>
    <div class="section split">
      <div class="panel pad"><div class="ph"><h2>Receita por cliente</h2></div><div class="blist in">${barList(byClient) || `<div class="empty">Nada no período</div>`}</div></div>
      <div class="panel pad"><div class="ph"><h2>Despesas por categoria</h2></div><div class="blist out">${barList(byCat) || `<div class="empty">${F.entity === "BR" && !F.card ? "Quase tudo passa pelo cartão: marque “itens do cartão”" : "Nada no período"}</div>`}</div></div>
    </div>
    <div class="section panel"><div class="ph" style="padding:16px 18px 0"><h2>Lançamentos <span class="sub">(${rows.length})</span></h2></div>
    <div class="tbl-wrap"><table><thead><tr><th>Data</th><th>Descrição</th><th>Tipo</th><th>Conta</th><th class="num">Valor</th></tr></thead><tbody>
      ${rows.map((t) => `<tr class="click ${t.flag ? "flagged" : ""} ${t.nature === "detalhe_cartao" ? "muted" : ""}" data-id="${t.id}">
        <td class="nowrap mono sub">${fdate(t.date)}</td>
        <td><span style="color:var(--ink)">${esc(t.description)}</span>${t.flag ? `<span class="flag-tag">⚑ conferir</span>` : ""}<div class="sub">${esc([t.category, t.notes].filter(Boolean).join(" · "))}</div></td>
        <td><span class="badge ${t.nature}">${esc(NATURES[t.nature])}</span></td>
        <td class="nowrap sub">${esc(accountById(t.account_id)?.name)}</td>
        <td class="num mono ${t.type === "in" ? "pos" : "neg"}">${t.type === "in" ? "+" : "−"} ${money(t.amount, t.currency)}</td></tr>`).join("") || `<tr><td colspan="5" class="empty">Nenhum lançamento</td></tr>`}
    </tbody></table></div></div>`;

  const upd = (k, v) => { F[k] = v; finance(); countUp(); };
  $$("#f-entity [data-v]").forEach((b) => (b.onclick = () => { F.entity = b.dataset.v; F.year = String(new Date().getFullYear()); finance(); countUp(); }));
  $("#f-year").onchange = (e) => upd("year", e.target.value);
  $("#f-nature").onchange = (e) => upd("nature", e.target.value);
  $("#f-card").onchange = (e) => upd("card", e.target.checked);
  let deb; $("#f-q").oninput = (e) => { clearTimeout(deb); deb = setTimeout(() => { upd("q", e.target.value); const i = $("#f-q"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 300); };
  $("#new-tx").onclick = () => txForm({ entity: F.entity });
  $$("tr[data-id]").forEach((tr) => (tr.onclick = () => txForm(S.transactions.find((t) => t.id === tr.dataset.id))));
}

function txForm(t = {}) {
  const entity = t.entity || "BR";
  const accounts = Object.fromEntries(S.accounts.filter((a) => a.active || a.id === t.account_id).map((a) => [a.id, `${a.name} (${ENTITY[a.entity]})`]));
  const cats = [...new Set(S.transactions.map((x) => x.category).filter(Boolean))].sort();
  const defAcc = t.account_id || S.accounts.find((a) => a.entity === entity && a.kind === "bank")?.id;
  form({
    title: t.id ? "Editar lançamento" : "Novo lançamento",
    note: t.id && (t.flag || t.source) ? esc([t.flag && "⚑ " + t.flag, t.source && "Origem: " + t.source].filter(Boolean).join(" · ")) : "",
    values: { ...t, account_id: defAcc, date: t.date || today(), type: t.type || "out", nature: t.nature || "despesa", flag_ok: "" },
    fields: [
      { k: "date", label: "Data", type: "date", required: true },
      { k: "account_id", label: "Conta", type: "select", options: accounts },
      { k: "type", label: "Entrada ou saída", type: "select", options: { in: "Entrada", out: "Saída" } },
      { k: "nature", label: "Tipo", type: "select", options: NATURES },
      { k: "description", label: "Descrição", full: true, required: true },
      { k: "category", label: "Categoria", list: cats },
      { k: "client_name", label: "Cliente (se for receita)" },
      { k: "amount", label: "Valor", type: "number", step: "0.01", required: true },
      { k: "notes", label: "Observação" },
      ...(t.flag ? [{ k: "flag_ok", label: "Marcar como conferido?", type: "select", options: { "": "Ainda não", yes: "Sim, já conferi" } }] : []),
    ],
    onSave: async (v) => {
      const acc = accountById(v.account_id);
      const row = { date: v.date, account_id: v.account_id, entity: acc.entity, currency: acc.currency, type: v.type, nature: v.nature,
        description: v.description, category: v.category, client_name: v.client_name, amount: v.amount, notes: v.notes };
      if (v.flag_ok === "yes") row.flag = null;
      if (!t.id) row.source = "Painel";
      await save("transactions", row, t.id);
      await refresh(t.id ? "Lançamento atualizado" : "Lançamento criado");
    },
    onDelete: t.id ? async () => { await remove("transactions", t.id); await refresh("Lançamento apagado"); } : null,
  });
}

// ── clients & contracts ──────────────────────────────────────────────────────
function clients() {
  const order = { active: 0, prospect: 1, paused: 2, ended: 3 };
  const list = [...S.clients].sort((a, b) => order[a.status] - order[b.status] || a.company.localeCompare(b.company));
  $("#view").innerHTML = `${topbar("Clientes", `${list.filter((c) => c.status === "active").length} ativo(s)`, `<button class="primary" id="new-client">${ic("plus")} Cliente</button>`)}
    ${list.map((c) => {
      const ks = contractsOf(c.id);
      const inv = S.invoices.filter((i) => i.client_id === c.id && i.status !== "cancelled");
      return `<div class="panel client"><div class="head">
        <div><h3>${esc(c.company)} <span class="badge ${c.status}">${esc(CLIENT_STATUS[c.status])}</span> <span class="badge">${ENTITY[c.entity]}</span></h3>
          <div class="sub" style="margin-top:4px">${esc([c.contact_name, c.email, c.phone].filter(Boolean).join(" · "))}</div></div>
        <div class="actions"><button class="small ghost" data-edit-client="${c.id}">Editar</button><button class="small ghost" data-new-contract="${c.id}">+ Contrato</button><button class="small primary" data-new-invoice="${c.id}">+ Invoice</button></div></div>
        ${ks.map((k) => `<div class="facts">
          <div><span>Contrato</span><b style="font-family:var(--sans)">${esc(k.title)}</b> <span class="badge ${k.status}">${esc(CONTRACT_STATUS[k.status])}</span></div>
          <div><span>Mensal</span><b>${money(k.monthly_fee, k.currency)}</b><span>${esc(VAT_MODE[k.vat_mode])}</span></div>
          ${+k.setup_fee ? `<div><span>Setup</span><b>${money(k.setup_fee, k.currency)}</b></div>` : ""}
          <div><span>Início</span><b>${fdate(k.start_date)}</b></div>
          <div><span>Fim do período mínimo</span><b>${fdate(k.renewal_date) || "—"}</b>${k.notice_days ? `<span>aviso de ${k.notice_days} dias</span>` : ""}</div>
          <div><span>&nbsp;</span><button class="small ghost" data-edit-contract="${k.id}">Editar contrato</button></div>
        </div>`).join("")}
        <div class="facts"><div><span>Recebido</span><b class="pos">${money(sum(inv.filter((i) => i.status === "paid"), (i) => i.amount), ks[0]?.currency || "EUR")}</b></div>
          <div><span>Em aberto</span><b>${money(sum(inv.filter((i) => i.status === "sent"), (i) => i.amount), ks[0]?.currency || "EUR")}</b></div>
          ${c.notes ? `<div style="grid-column:span 3"><span>Notas</span><div>${esc(c.notes)}</div></div>` : ""}</div>
      </div>`;
    }).join("") || `<p class="empty">Nenhum cliente ainda</p>`}`;
  $("#new-client").onclick = () => clientForm();
  $$("[data-edit-client]").forEach((b) => (b.onclick = () => clientForm(clientById(b.dataset.editClient))));
  $$("[data-new-contract]").forEach((b) => (b.onclick = () => contractForm({ client_id: b.dataset.newContract })));
  $$("[data-edit-contract]").forEach((b) => (b.onclick = () => contractForm(S.contracts.find((k) => k.id === b.dataset.editContract))));
  $$("[data-new-invoice]").forEach((b) => (b.onclick = () => invoiceForm({ client_id: b.dataset.newInvoice }, true)));
}

function clientForm(c = {}, afterSave) {
  form({
    title: c.id ? "Editar cliente" : "Novo cliente",
    values: { entity: "IE", status: "active", ...c },
    fields: [
      { k: "company", label: "Empresa", required: true }, { k: "legal_name", label: "Razão social (no invoice)" },
      { k: "contact_name", label: "Contato" }, { k: "email", label: "E-mail", type: "email" },
      { k: "phone", label: "Telefone" }, { k: "entity", label: "Atendido pela empresa", type: "select", options: ENTITY },
      { k: "status", label: "Status", type: "select", options: CLIENT_STATUS },
      { k: "address", label: "Endereço (no invoice)", type: "textarea", full: true },
      { k: "notes", label: "Notas", type: "textarea", full: true },
    ],
    onSave: async (v) => {
      const saved = await save("clients", { ...v, lead_id: c.lead_id || null }, c.id);
      if (afterSave) await afterSave(saved);
      await refresh(c.id ? "Cliente atualizado" : "Cliente criado");
    },
  });
}

function contractForm(k = {}) {
  const c = clientById(k.client_id);
  form({
    title: (k.id ? "Editar contrato · " : "Novo contrato · ") + (c?.company || ""),
    note: "Se deixar o fim do período em branco, eu calculo pelo início + meses mínimos.",
    values: { entity: c?.entity || "IE", currency: c?.entity === "BR" ? "BRL" : "EUR", vat_mode: c?.entity === "BR" ? "none" : "plus", status: "active", billing_day: 1, ...k },
    fields: [
      { k: "title", label: "Nome do contrato", required: true, full: true },
      { k: "monthly_fee", label: "Valor mensal", type: "number", step: "0.01" }, { k: "setup_fee", label: "Setup (único)", type: "number", step: "0.01" },
      { k: "currency", label: "Moeda", type: "select", options: { EUR: "Euro (€)", BRL: "Real (R$)" } },
      { k: "vat_mode", label: "VAT", type: "select", options: VAT_MODE },
      { k: "start_date", label: "Início", type: "date", required: true }, { k: "min_months", label: "Meses mínimos", type: "number" },
      { k: "renewal_date", label: "Fim do período mínimo", type: "date" }, { k: "notice_days", label: "Aviso prévio (dias)", type: "number" },
      { k: "billing_day", label: "Dia da cobrança", type: "number" }, { k: "status", label: "Status", type: "select", options: CONTRACT_STATUS },
      { k: "end_date", label: "Término (se encerrado)", type: "date" },
      { k: "invoice_terms", label: "Condições no invoice", type: "textarea", full: true },
      { k: "notes", label: "Notas", type: "textarea", full: true },
    ],
    onSave: async (v) => {
      if (!v.renewal_date && v.min_months && v.start_date) v.renewal_date = addDays(addMonths(v.start_date, v.min_months), -1);
      await save("contracts", { ...v, client_id: k.client_id, entity: v.currency === "BRL" ? "BR" : "IE", setup_fee: v.setup_fee || 0, monthly_fee: v.monthly_fee || 0 }, k.id);
      await refresh("Contrato salvo");
    },
    onDelete: k.id ? async () => { await remove("contracts", k.id); await refresh("Contrato apagado"); } : null,
  });
}

// ── invoices ─────────────────────────────────────────────────────────────────
function nextNumber(entity) {
  const n = Math.max(0, ...S.invoices.filter((i) => i.entity === entity).map((i) => +(i.number.match(/(\d+)$/) || [0, 0])[1]));
  return "INV-" + String(n + 1).padStart(4, "0");
}

function invoices() {
  const list = S.invoices;
  const st = (s) => list.filter((i) => invoiceState(i) === s);
  const tot = (arr) => sum(arr, (i) => conv(i.amount, i.currency, "EUR"));
  $("#view").innerHTML = `${topbar("Invoices", `${list.length} no total`, `<button class="primary" id="new-inv">${ic("plus")} Invoice</button>`)}
    <div class="kpis">
      <div class="panel kpi ${st("late").length ? "accent" : ""}"><div class="k">Atrasados</div><div class="v" data-count="${tot(st("late"))}" data-cur="EUR">${short(tot(st("late")), "EUR")}</div><div class="s">${st("late").length} invoice(s)</div></div>
      <div class="panel kpi"><div class="k">Em aberto</div><div class="v" data-count="${tot(st("open"))}" data-cur="EUR">${short(tot(st("open")), "EUR")}</div><div class="s">${st("open").length} invoice(s)</div></div>
      <div class="panel kpi"><div class="k">Recebido</div><div class="v" data-count="${tot(st("paid"))}" data-cur="EUR">${short(tot(st("paid")), "EUR")}</div><div class="s">${st("paid").length} invoice(s)</div></div>
    </div>
    <div class="section panel"><div class="tbl-wrap"><table><thead><tr><th>Nº</th><th>Cliente</th><th>Emissão</th><th>Vencimento</th><th class="num">Valor</th><th>Status</th><th></th></tr></thead><tbody>
    ${list.map((i) => { const s = invoiceState(i); return `<tr>
      <td class="nowrap mono" style="color:var(--ink);font-weight:600">${esc(i.number)}</td>
      <td><span style="color:var(--ink)">${esc(clientById(i.client_id)?.company)}</span><div class="sub">${esc(i.description)}</div>${i.notes && i.status === "sent" ? `<div class="sub" style="color:var(--amber)">${esc(i.notes)}</div>` : ""}</td>
      <td class="nowrap mono sub">${fdate(i.issue_date)}</td><td class="nowrap mono sub">${fdate(i.due_date)}</td>
      <td class="num mono" style="color:var(--ink)">${money(i.amount, i.currency)}</td>
      <td><span class="badge ${s}">${INVOICE_LABEL[s]}</span>${i.paid_at ? `<div class="sub mono" style="margin-top:3px">${fdate(i.paid_at)}</div>` : ""}</td>
      <td class="nowrap"><div class="actions">
        <button class="small ghost" data-print="${i.id}">PDF</button>
        ${i.status === "sent" ? `<button class="small primary" data-paid="${i.id}">Recebido</button>` : ""}
        <button class="small ghost" data-edit="${i.id}">Editar</button></div></td></tr>`; }).join("") || `<tr><td colspan="7" class="empty">Nenhum invoice</td></tr>`}
    </tbody></table></div></div>`;
  $("#new-inv").onclick = () => invoiceForm();
  $$("[data-print]").forEach((b) => (b.onclick = () => printInvoice(S.invoices.find((i) => i.id === b.dataset.print))));
  $$("[data-paid]").forEach((b) => (b.onclick = () => paidForm(S.invoices.find((i) => i.id === b.dataset.paid))));
  $$("[data-edit]").forEach((b) => (b.onclick = () => invoiceForm(S.invoices.find((i) => i.id === b.dataset.edit))));
}

function suggestFromContract(clientId, set) {
  const k = contractsOf(clientId).find((x) => x.status === "active");
  if (!k) return;
  const d = new Date(); const month = MONTHS_EN[d.getMonth()], y = d.getFullYear();
  const last = new Date(y, d.getMonth() + 1, 0).getDate();
  const nth = S.invoices.filter((i) => i.contract_id === k.id && /monthly/i.test(i.description) && i.status !== "cancelled").length + 1;
  set("contract_id", k.id); set("currency", k.currency); set("amount", k.monthly_fee);
  set("description", `Monthly partnership: month ${nth}${k.min_months && nth <= k.min_months ? ` of ${k.min_months}` : ""}`);
  set("detail", `Period: 1 to ${last} ${month} ${y}.`);
}

function invoiceForm(i = {}, suggest = false) {
  const pay = S.settings.invoice_ie?.payment_days || 7;
  const clientOpts = Object.fromEntries([["", "— escolha —"], ...S.clients.map((c) => [c.id, c.company])]);
  const contractOpts = (cid) => Object.fromEntries([["", "— nenhum —"], ...S.contracts.filter((k) => !cid || k.client_id === cid).map((k) => [k.id, `${clientById(k.client_id)?.company}: ${k.title}`])]);
  const entity = i.entity || clientById(i.client_id)?.entity || "IE";
  form({
    title: i.id ? `Editar ${i.number}` : "Novo invoice",
    values: { number: nextNumber(entity), issue_date: today(), due_date: addDays(today(), pay), currency: entity === "BR" ? "BRL" : "EUR", status: "sent", ...i },
    fields: [
      { k: "client_id", label: "Cliente", type: "select", options: clientOpts },
      { k: "contract_id", label: "Contrato", type: "select", options: contractOpts(i.client_id) },
      { k: "number", label: "Número", required: true }, { k: "status", label: "Status", type: "select", options: { draft: "Rascunho", sent: "Enviado", paid: "Pago", cancelled: "Cancelado" } },
      { k: "issue_date", label: "Emissão", type: "date", required: true }, { k: "due_date", label: "Vencimento", type: "date", required: true },
      { k: "description", label: "Descrição (linha principal)", full: true, required: true },
      { k: "detail", label: "Detalhe (linha menor)", type: "textarea", full: true },
      { k: "amount", label: "Valor", type: "number", step: "0.01", required: true },
      { k: "currency", label: "Moeda", type: "select", options: { EUR: "Euro (€)", BRL: "Real (R$)" } },
      { k: "notes", label: "Nota interna (não sai no invoice)", full: true },
    ],
    onOpen: (set) => { if (suggest && !i.id && i.client_id) suggestFromContract(i.client_id, set); },
    onChange: (name, v, set) => {
      if (name === "client_id" && v.client_id && !i.id) suggestFromContract(v.client_id, set);
      if (name === "issue_date" && v.issue_date) set("due_date", addDays(v.issue_date, pay));
    },
    onSave: async (v) => {
      if (!v.client_id) { toast("Escolha o cliente"); throw new Error("client"); }
      const row = { ...v, entity: v.currency === "BRL" ? "BR" : "IE" };
      if (row.status !== "paid") row.paid_at = null;
      await save("invoices", row, i.id);
      await refresh(i.id ? "Invoice atualizado" : `${v.number} criado`);
    },
    onDelete: i.id && i.status !== "paid" ? async () => { await remove("invoices", i.id); await refresh("Invoice apagado"); } : null,
  });
}

function paidForm(i) {
  const c = clientById(i.client_id);
  const accs = Object.fromEntries(S.accounts.filter((a) => a.currency === i.currency && a.kind === "bank").map((a) => [a.id, a.name]));
  form({
    title: `${i.number} recebido`,
    note: `Marca o invoice como pago e já lança a entrada de ${esc(money(i.amount, i.currency))} no financeiro.`,
    values: { paid_at: today(), account_id: Object.keys(accs)[0], amount: i.amount },
    fields: [
      { k: "paid_at", label: "Data em que caiu", type: "date", required: true },
      { k: "account_id", label: "Conta", type: "select", options: accs },
      { k: "amount", label: "Valor recebido", type: "number", step: "0.01", required: true, hint: "Se veio diferente (taxa, parcial), ajuste aqui." },
    ],
    saveLabel: "Confirmar",
    onSave: async (v) => {
      const acc = accountById(v.account_id);
      if (!acc) { toast("Cadastre uma conta nessa moeda primeiro"); throw new Error("account"); }
      await save("invoices", { status: "paid", paid_at: v.paid_at }, i.id);
      await save("transactions", { entity: acc.entity, currency: acc.currency, account_id: acc.id, date: v.paid_at, type: "in", nature: "receita",
        category: "Gestão de redes", description: `${i.number} · ${c?.company}`, client_name: c?.company, client_id: i.client_id,
        invoice_id: i.id, amount: v.amount, source: "Painel (invoice)" });
      await refresh(`${i.number} pago e lançado`);
    },
  });
}

function printInvoice(i) {
  const s = S.settings.invoice_ie || {}, c = clientById(i.client_id) || {}, k = S.contracts.find((x) => x.id === i.contract_id) || {};
  const amt = moneyEn(i.amount, i.currency), first = (c.contact_name || "").split(" ")[0];
  const terms = [`Payment due within ${s.payment_days || 7} days.`, ...(k.invoice_terms || "").split("\n")].filter(Boolean);
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Invoice ${esc(i.number)} · ${esc(c.company)}</title>
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,600;0,700;1,600&family=Work+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
:root{--coral:#D85A30;--teal:#5DCAA5;--ink:#2C2C2A;--body:#4A4945;--cream:#F1EFE8;--muted:#97948C;--line:#E2DED3}
@page{size:A4;margin:0}*{box-sizing:border-box}
body{margin:0;background:var(--cream);color:var(--body);font:14px/1.55 "Work Sans",system-ui,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:210mm;min-height:297mm;margin:0 auto;background:#FBFAF6;padding:18mm 18mm 16mm;display:flex;flex-direction:column}
header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:22px;border-bottom:1px solid var(--line)}
.brand{display:inline-flex;align-items:center;gap:8px;color:var(--coral)}.brand span{font:700 20px/1 Lora,serif;color:var(--ink);white-space:nowrap}.brand em{font-style:italic;font-weight:600;color:var(--coral)}
.from{margin-top:12px;font-size:12.5px;line-height:1.6}.title{text-align:right}.title h1{margin:0;font:700 34px/1 Lora,serif;color:var(--ink)}
.title .no{margin-top:8px;font:600 13px "Work Sans";letter-spacing:.08em;color:var(--coral)}
.meta{display:grid;grid-template-columns:1.3fr 1fr;gap:24px;margin:26px 0 30px}
.label{font:600 11px "Work Sans";letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:6px}
.to b{display:block;color:var(--ink);font-weight:600}.dates{display:grid;grid-template-columns:auto auto;gap:6px 18px;justify-content:end;align-content:start;margin:0}
.dates dt{color:var(--muted);text-align:right}.dates dd{margin:0;color:var(--ink);font-weight:500;text-align:right}
table{width:100%;border-collapse:collapse}thead th{font:600 11px "Work Sans";letter-spacing:.12em;text-transform:uppercase;color:var(--muted);text-align:left;padding:0 0 10px;border-bottom:1.5px solid var(--ink)}
th.amt,td.amt{text-align:right;white-space:nowrap}tbody td{padding:16px 0;border-bottom:1px solid var(--line);vertical-align:top}
tbody td b{display:block;color:var(--ink);font-weight:600;margin-bottom:3px}tbody td small{color:var(--muted);font-size:12.5px}tbody td.amt{color:var(--ink);font-weight:500;padding-left:24px}
.totals{margin:18px 0 0 auto;width:300px}.totals div{display:flex;justify-content:space-between;padding:6px 0}.totals .vat{color:var(--muted);font-size:12.5px}
.totals .due{margin-top:8px;padding:14px 18px;background:var(--ink);color:#fff;border-radius:12px;align-items:center}
.totals .due span{font:600 12px "Work Sans";letter-spacing:.1em;text-transform:uppercase;color:var(--teal)}.totals .due b{font:700 24px/1 Lora,serif}
.pay{margin-top:34px;display:grid;grid-template-columns:1fr 1fr;gap:18px}.card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px 18px;font-size:13px}
.card dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:4px 14px}.card dt{color:var(--muted)}.card dd{margin:0;color:var(--ink);font-weight:500;white-space:nowrap}.card p{margin:0 0 6px}
footer{margin-top:auto;padding-top:22px;border-top:1px solid var(--line);display:flex;justify-content:space-between;font-size:12px;color:var(--muted)}
footer em{font:600 italic 13px Lora,serif;color:var(--coral)}
</style></head><body><div class="page">
<header><div><div class="brand"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
<span><em>Irish</em> Business Boosters</span></div>
<div class="from">${esc(s.from_name)}<br>${esc(s.from_address).replace(/, /g, "<br>")}<br>${esc(s.email)} · ${esc(s.website)}</div></div>
<div class="title"><h1>Invoice</h1><div class="no">${esc(i.number)}</div></div></header>
<section class="meta"><div class="to"><div class="label">Bill to</div><b>${esc(c.legal_name || c.company)}</b>
${c.contact_name ? `Attn: ${esc(c.contact_name)}<br>` : ""}${esc(c.address).replace(/\n/g, "<br>")}${c.email ? `<br>${esc(c.email)}` : ""}</div>
<dl class="dates"><dt>Invoice date</dt><dd>${enDate(i.issue_date)}</dd><dt>Due date</dt><dd>${enDate(i.due_date)}</dd>${k.title ? `<dt>Reference</dt><dd>${esc(k.title)}</dd>` : ""}</dl></section>
<table><thead><tr><th>Description</th><th class="amt">Amount</th></tr></thead><tbody><tr><td><b>${esc(i.description)}</b>${i.detail ? `<small>${esc(i.detail)}</small>` : ""}</td><td class="amt">${amt}</td></tr></tbody></table>
<div class="totals"><div><span>Subtotal</span><span>${amt}</span></div><div class="vat"><span>VAT</span><span>${esc(s.vat_note || "")}</span></div><div class="due"><span>Total due</span><b>${amt}</b></div></div>
<section class="pay"><div class="card"><div class="label">Pay by bank transfer</div><dl>
<dt>Account name</dt><dd>${esc(s.account_name)}</dd><dt>IBAN</dt><dd>${esc(s.iban)}</dd><dt>BIC</dt><dd>${esc(s.bic)}</dd><dt>Reference</dt><dd>${esc(i.number)}</dd></dl></div>
<div class="card"><div class="label">Terms</div>${terms.map((t) => `<p>${esc(t)}</p>`).join("")}</div></section>
<footer><span>${first ? `Thank you, ${esc(first)}.` : "Thank you."}</span><em>${esc(s.closing || "")}</em></footer>
</div></body></html>`;
  const w = window.open("", "_blank");
  if (!w) { toast("O navegador bloqueou a janela: libere pop-ups para este site"); return; }
  w.document.open(); w.document.write(html); w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 700);
}

// ── leads ────────────────────────────────────────────────────────────────────
function leads() {
  $("#view").innerHTML = `${topbar("Leads", `${S.leads.filter((l) => l.status === "new").length} novo(s) · últimos 300`)}
    <div class="panel"><div class="tbl-wrap"><table><thead><tr><th>Data</th><th>Quem</th><th>Contato</th><th>Origem</th><th>Status</th><th></th></tr></thead><tbody>
    ${S.leads.map((l) => `<tr>
      <td class="nowrap mono sub">${fdate(l.created_at)}</td>
      <td><b style="color:var(--ink)">${esc(l.name || "—")}</b><div class="sub">${esc([l.business, l.town].filter(Boolean).join(" · "))}</div>
        ${l.message ? `<div class="sub" style="max-width:360px">${esc(l.message.slice(0, 160))}${l.message.length > 160 ? "…" : ""}</div>` : ""}</td>
      <td class="sub">${esc([l.email, l.phone, l.ig_username && "@" + l.ig_username, l.website].filter(Boolean).join(" · "))}</td>
      <td class="nowrap sub">${esc([l.source, l.keyword, l.interest].filter(Boolean).join(" · "))}</td>
      <td><select data-lead="${l.id}" style="min-width:140px">${Object.entries(LEAD_STATUS).map(([k, v]) => `<option value="${k}" ${l.status === k ? "selected" : ""}>${v}</option>`).join("")}</select></td>
      <td>${l.status !== "client" ? `<button class="small ghost" data-convert="${l.id}">Virar cliente</button>` : ""}</td></tr>`).join("") || `<tr><td colspan="6" class="empty">Nenhum lead</td></tr>`}
    </tbody></table></div></div>`;
  $$("[data-lead]").forEach((s) => (s.onchange = async () => { await save("leads", { status: s.value }, s.dataset.lead); toast("Status atualizado"); const l = S.leads.find((x) => x.id === s.dataset.lead); l.status = s.value; renderNav(); }));
  $$("[data-convert]").forEach((b) => (b.onclick = () => {
    const l = S.leads.find((x) => x.id === b.dataset.convert);
    clientForm({ company: l.business || l.name || "", contact_name: l.name, email: l.email, phone: l.phone, status: "prospect", entity: "IE", lead_id: l.id,
      notes: [l.message, l.keyword && "Palavra: " + l.keyword].filter(Boolean).join("\n") },
      async () => { await save("leads", { status: "client" }, l.id); });
  }));
}

gate();
})();
