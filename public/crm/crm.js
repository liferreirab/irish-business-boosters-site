// IBB CRM — private dashboard. No data lives in this file: everything comes
// from Supabase after login + authenticator code, and the database itself
// refuses any request without both (see crm/supabase/migrations/004).
(() => {
"use strict";

const SUPABASE_URL = "https://tbgxeqauakiydzwmqyyf.supabase.co";
const SUPABASE_ANON_KEY = ""; // public "anon" key (Supabase → Project Settings → API)
const IDLE_MINUTES = 30;
const VAT_THRESHOLD_EUR = 42500;

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
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// ── helpers ──────────────────────────────────────────────────────────────────
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (v, cur = "BRL") => new Intl.NumberFormat("pt-BR", { style: "currency", currency: cur }).format(+v || 0);
const moneyEn = (v, cur = "EUR") => new Intl.NumberFormat("en-IE", { style: "currency", currency: cur }).format(+v || 0);
const fdate = (d) => (d ? d.slice(0, 10).split("-").reverse().join("/") : "");
const enDate = (d) => { const [y, m, dd] = d.split("-"); return `${+dd} ${MONTHS_EN[+m - 1]} ${y}`; };
const today = () => { const n = new Date(); return new Date(n - n.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const addDays = (d, n) => { const x = new Date(d + "T12:00:00"); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
const addMonths = (d, n) => { const x = new Date(d + "T12:00:00"); x.setMonth(x.getMonth() + n); return x.toISOString().slice(0, 10); };
const sum = (arr, f = (x) => x) => arr.reduce((a, x) => a + (+f(x) || 0), 0);
const signed = (t) => (t.type === "in" ? +t.amount : -t.amount);

function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), 3200);
}

if (!window.supabase || !SUPABASE_ANON_KEY) {
  const a = $("#auth"); a.hidden = false;
  a.innerHTML = `<div class="box"><h1>IBB CRM</h1><p>Painel ainda não configurado: falta a chave pública do Supabase em crm.js.</p></div>`;
  return;
}
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

// ── auth: magic link → authenticator app (TOTP) ─────────────────────────────
const authBox = (html) => { $("#app").hidden = true; const a = $("#auth"); a.hidden = false; a.innerHTML = `<div class="box">${html}</div>`; return a; };

function showLogin(msg = "") {
  const a = authBox(`<h1>IBB CRM</h1><p>Entre com o seu e-mail. Você recebe um link para entrar.</p>
    <form class="row" id="f"><input type="email" id="em" placeholder="seu e-mail" autocomplete="email" required>
    <button>Enviar link</button><div class="err">${esc(msg)}</div></form>`);
  $("#f", a).onsubmit = async (e) => {
    e.preventDefault();
    const btn = $("button", a); btn.disabled = true;
    const { error } = await sb.auth.signInWithOtp({
      email: $("#em", a).value.trim(),
      options: { shouldCreateUser: false, emailRedirectTo: location.origin + location.pathname },
    });
    // Same answer whether or not the e-mail exists.
    if (error && !/signups not allowed|not found/i.test(error.message)) { btn.disabled = false; $(".err", a).textContent = error.message; return; }
    authBox(`<h1>Confira seu e-mail</h1><p>Se este e-mail tiver acesso, o link chega em instantes. Abra o link neste mesmo navegador.</p>`);
  };
}

async function gate() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return showLogin();
  const { data: aal, error } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) return showLogin(error.message);
  if (aal.currentLevel === "aal2") return startApp();
  const { data: f } = await sb.auth.mfa.listFactors();
  const verified = (f?.totp || []).find((x) => x.status === "verified");
  return verified ? showChallenge(verified.id) : showEnroll(f?.all || []);
}

function codeForm(a, onCode) {
  const inp = $("#code", a); inp.focus();
  $("#f", a).onsubmit = async (e) => {
    e.preventDefault();
    const btn = $("button", a); btn.disabled = true;
    const err = await onCode(inp.value.replace(/\D/g, ""));
    if (err) { btn.disabled = false; $(".err", a).textContent = err; inp.select(); }
  };
}

function showChallenge(factorId) {
  const a = authBox(`<h1>Código do app</h1><p>Digite o código de 6 dígitos do seu app autenticador.</p>
    <form class="row" id="f"><input id="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000" required>
    <button>Entrar</button><div class="err"></div></form>
    <p class="sub" style="margin-top:12px"><a href="#" id="out">Sair</a></p>`);
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
  const a = authBox(`<h1>Proteja o acesso</h1>
    <p>Primeiro acesso: abra o app autenticador no celular (Google Authenticator, Authy, 1Password…), toque em adicionar e leia o QR code.</p>
    <img class="qr" alt="QR code" src="${esc(data.totp.qr_code)}">
    <p class="sub">Sem câmera? Digite esta chave no app:</p><code>${esc(data.totp.secret)}</code>
    <form class="row" id="f"><input id="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="código de 6 dígitos" required>
    <button>Ativar e entrar</button><div class="err"></div></form>`);
  codeForm(a, async (code) => {
    const { error } = await sb.auth.mfa.challengeAndVerify({ factorId: data.id, code });
    if (error) return "Código inválido. Confira o horário do celular e tente de novo.";
    startApp();
  });
}

// Log out after inactivity.
let idleTimer;
function bumpIdle() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(async () => { await sb.auth.signOut(); showLogin("Saiu por inatividade."); }, IDLE_MINUTES * 60e3);
}
["click", "keydown", "scroll", "touchstart"].forEach((ev) => addEventListener(ev, bumpIdle, { passive: true }));

$("#logout").onclick = async () => { await sb.auth.signOut(); location.reload(); };

// ── data ─────────────────────────────────────────────────────────────────────
const S = { tab: "overview", fin: { entity: "BR", year: String(new Date().getFullYear()), nature: "", q: "", card: false } };

async function all(table, order, asc = true) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from(table).select("*").order(order, { ascending: asc }).range(from, from + 999);
    if (error) throw error;
    out.push(...data);
    if (data.length < 1000) return out;
  }
}

async function load() {
  const [clients, contracts, invoices, accounts, balances, settings, transactions, leads] = await Promise.all([
    all("clients", "company"), all("contracts", "start_date"), all("invoices", "issue_date", false), all("accounts", "name"),
    all("v_account_balances", "name"), all("settings", "key"), all("transactions", "date", false),
    sb.from("leads").select("*").order("created_at", { ascending: false }).limit(300).then((r) => { if (r.error) throw r.error; return r.data; }),
  ]);
  Object.assign(S, { clients, contracts, invoices, accounts, balances, transactions, leads,
    settings: Object.fromEntries(settings.map((s) => [s.key, s.value])) });
}

const clientById = (id) => S.clients.find((c) => c.id === id);
const accountById = (id) => S.accounts.find((a) => a.id === id);
const contractsOf = (id) => S.contracts.filter((k) => k.client_id === id);
const invoiceState = (i) => (i.status === "sent" && i.due_date < today() ? "late" : i.status === "sent" ? "open" : i.status);
const INVOICE_LABEL = { open: "Em aberto", late: "Atrasado", paid: "Pago", draft: "Rascunho", cancelled: "Cancelado" };

async function startApp() {
  $("#auth").hidden = true; $("#app").hidden = false; bumpIdle();
  $("#view").innerHTML = `<p class="empty">Carregando…</p>`;
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

// ── tabs ─────────────────────────────────────────────────────────────────────
$("#tabs").onclick = (e) => {
  const b = e.target.closest("button"); if (!b) return;
  S.tab = b.dataset.tab; $$("#tabs button").forEach((x) => x.classList.toggle("on", x === b)); render();
};
function render() { ({ overview, finance, clients, invoices, leads })[S.tab](); }

// ── overview ─────────────────────────────────────────────────────────────────
function monthly(entity, months = 12) {
  const now = new Date(); const out = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const ts = S.transactions.filter((t) => t.entity === entity && t.date.startsWith(key));
    out.push({ key, label: MONTHS[d.getMonth()],
      inc: sum(ts.filter((t) => t.nature === "receita"), (t) => t.amount) - sum(ts.filter((t) => t.nature === "estorno"), (t) => t.amount),
      out: sum(ts.filter((t) => ["despesa", "fatura_cartao", "imposto"].includes(t.nature)), (t) => t.amount) });
  }
  return out;
}
function bars(entity, cur) {
  const m = monthly(entity); const max = Math.max(1, ...m.map((x) => Math.max(x.inc, x.out)));
  return `<div class="card"><div class="bars">${m.map((x) => `<div class="m" title="${esc(x.key)} · receita ${esc(money(x.inc, cur))} · gastos ${esc(money(x.out, cur))}">
      <div class="pair"><i class="in" style="height:${(x.inc / max) * 100}%"></i><i class="out" style="height:${(x.out / max) * 100}%"></i></div>
      <small>${x.label}</small></div>`).join("")}</div>
    <div class="legend"><span><i class="in" style="background:var(--teal)"></i>Receita</span><span><i style="background:var(--coral);opacity:.75"></i>Despesas, faturas e impostos</span></div></div>`;
}

function overview() {
  const t = today(), y = t.slice(0, 4);
  const active = S.contracts.filter((k) => k.status === "active" || k.status === "notice");
  const mrrIE = sum(active.filter((k) => k.currency === "EUR"), (k) => k.monthly_fee);
  const mrrBR = sum(active.filter((k) => k.currency === "BRL"), (k) => k.monthly_fee);
  const open = S.invoices.filter((i) => i.status === "sent");
  const late = open.filter((i) => i.due_date < t);
  const soon = active.filter((k) => k.renewal_date && k.renewal_date <= addDays(t, 60));
  const yearAgo = addDays(t, -365);
  const ie12 = S.transactions.filter((x) => x.entity === "IE" && x.date > yearAgo);
  const vat = sum(ie12.filter((x) => x.nature === "receita"), (x) => x.amount) - sum(ie12.filter((x) => x.nature === "estorno"), (x) => x.amount);
  const vatPct = Math.min(100, (vat / VAT_THRESHOLD_EUR) * 100);
  const bal = (n) => S.balances.find((b) => b.name === n);
  const pj = bal("Nubank PJ"), inv = bal("Investimentos BR"), rev = bal("Revolut");
  const brY = S.transactions.filter((x) => x.entity === "BR" && x.date.startsWith(y));
  const flagged = S.transactions.filter((x) => x.flag).length;
  const newLeads = S.leads.filter((l) => l.status === "new").length;

  $("#view").innerHTML = `
    <h2>Irlanda</h2>
    <div class="cards">
      <div class="card"><div class="k">Receita mensal recorrente</div><div class="v">${money(mrrIE, "EUR")}</div><div class="s">${active.filter((k) => k.currency === "EUR").length} contrato(s) ativo(s)</div></div>
      <div class="card ${late.length ? "bad" : ""}"><div class="k">A receber</div><div class="v">${money(sum(open.filter((i) => i.currency === "EUR"), (i) => i.amount), "EUR")}</div>
        <div class="s">${open.length} invoice(s) em aberto${late.length ? ` · <b>${late.length} atrasado(s)</b>` : ""}</div></div>
      <div class="card"><div class="k">Saldo Revolut</div><div class="v">${money(rev?.balance, "EUR")}</div><div class="s">calculado pelos lançamentos</div></div>
      <div class="card ${vatPct > 80 ? "warn" : ""}"><div class="k">Limite do VAT (12 meses)</div><div class="v">${money(vat, "EUR")}</div>
        <div class="meter ${vatPct > 100 ? "over" : vatPct > 80 ? "hot" : ""}"><i style="width:${vatPct}%"></i></div><div class="s">${vatPct.toFixed(0)}% de ${money(VAT_THRESHOLD_EUR, "EUR")}</div></div>
    </div>
    ${soon.length || late.length ? `<div class="section"><h2>Atenção</h2><div class="list">
      ${late.map((i) => `<div><span>Invoice <b>${esc(i.number)}</b> · ${esc(clientById(i.client_id)?.company)} venceu em ${fdate(i.due_date)}</span><b>${money(i.amount, i.currency)}</b></div>`).join("")}
      ${soon.map((k) => `<div><span>Contrato <b>${esc(clientById(k.client_id)?.company)}</b>: fim do período em ${fdate(k.renewal_date)}${k.notice_days ? ` (aviso de ${k.notice_days} dias até ${fdate(addDays(k.renewal_date, -k.notice_days))})` : ""}</span><span class="badge notice">Renovação</span></div>`).join("")}
    </div></div>` : ""}
    <div class="section">${bars("IE", "EUR")}</div>

    <div class="section"><h2>Brasil</h2>
    <div class="cards">
      <div class="card"><div class="k">Saldo Nubank PJ</div><div class="v">${money(pj?.balance)}</div>
        <div class="s">${pj?.last_checked_date ? `conferido com o app: ${money(pj.last_checked_balance)} em ${fdate(pj.last_checked_date)}` : ""}</div></div>
      <div class="card"><div class="k">Investimentos</div><div class="v">${money(inv?.last_checked_balance)}</div><div class="s">${inv?.last_checked_date ? `informado em ${fdate(inv.last_checked_date)}` : "sem saldo informado"}</div></div>
      <div class="card"><div class="k">Receita ${y}</div><div class="v">${money(sum(brY.filter((x) => x.nature === "receita"), (x) => x.amount) - sum(brY.filter((x) => x.nature === "estorno"), (x) => x.amount))}</div>
        <div class="s">${mrrBR ? `recorrente: ${money(mrrBR)}/mês` : "&nbsp;"}</div></div>
      <div class="card"><div class="k">Pró-labore ${y}</div><div class="v">${money(sum(brY.filter((x) => x.nature === "pro_labore"), (x) => x.amount))}</div></div>
    </div></div>
    <div class="section">${bars("BR", "BRL")}</div>

    <div class="section"><div class="cards">
      <div class="card ${flagged ? "warn" : ""}"><div class="k">Lançamentos para conferir</div><div class="v">${flagged}</div></div>
      <div class="card"><div class="k">Leads novos</div><div class="v">${newLeads}</div><div class="s">${S.leads.length} no total (últimos 300)</div></div>
    </div></div>`;
}

// ── generic form modal ───────────────────────────────────────────────────────
// fields: [{k, label, type, options, full, step, hint}]
function form({ title, fields, values = {}, onSave, onDelete, deleteLabel = "Apagar", note, onChange, saveLabel = "Salvar" }) {
  const m = $("#modal"); m.hidden = false;
  const input = (f) => {
    const v = values[f.k] ?? "";
    if (f.type === "select") return `<select name="${f.k}">${Object.entries(f.options).map(([k, l]) => `<option value="${esc(k)}" ${String(v) === k ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>`;
    if (f.type === "textarea") return `<textarea name="${f.k}">${esc(v)}</textarea>`;
    return `<input name="${f.k}" type="${f.type || "text"}" value="${esc(v)}" ${f.step ? `step="${f.step}"` : ""} ${f.list ? `list="dl-${f.k}"` : ""} ${f.required ? "required" : ""}>
      ${f.list ? `<datalist id="dl-${f.k}">${f.list.map((o) => `<option value="${esc(o)}">`).join("")}</datalist>` : ""}`;
  };
  m.innerHTML = `<form class="box"><h2>${esc(title)}</h2>${note ? `<div class="hint">${note}</div>` : ""}
    <div class="grid">${fields.map((f) => `<div class="${f.full ? "full" : ""}"><label>${esc(f.label)}</label>${input(f)}${f.hint ? `<div class="sub">${esc(f.hint)}</div>` : ""}</div>`).join("")}</div>
    <div class="foot">${onDelete ? `<button type="button" class="danger left" id="del">${esc(deleteLabel)}</button>` : ""}
      <button type="button" class="ghost" id="cancel">Cancelar</button><button id="ok">${esc(saveLabel)}</button></div></form>`;
  const f = $("form", m);
  const read = () => Object.fromEntries(fields.map((x) => {
    const raw = f.elements[x.k].value.trim();
    return [x.k, raw === "" ? null : x.type === "number" ? +raw : raw];
  }));
  const set = (k, v) => { if (f.elements[k]) f.elements[k].value = v ?? ""; };
  if (onChange) f.addEventListener("change", (e) => onChange(e.target.name, read(), set));
  const close = () => { m.hidden = true; m.innerHTML = ""; };
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
  inYear.filter((t) => ["despesa", "detalhe_cartao"].includes(t.nature) && (t.nature === "despesa" || F.card)).forEach((t) => { const k = t.category || "Outros"; byCat[k] = (byCat[k] || 0) + +t.amount; });
  const top = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 8);

  $("#view").innerHTML = `
    <div class="toolbar">
      <div><label>Empresa</label><select id="f-entity">${Object.entries(ENTITY).map(([k, l]) => `<option value="${k}" ${F.entity === k ? "selected" : ""}>${l}</option>`).join("")}</select></div>
      <div><label>Ano</label><select id="f-year">${years.map((y) => `<option ${F.year === y ? "selected" : ""}>${y}</option>`).join("")}<option value="all" ${F.year === "all" ? "selected" : ""}>Todos</option></select></div>
      <div><label>Tipo</label><select id="f-nature"><option value="">Todos</option><option value="flag" ${F.nature === "flag" ? "selected" : ""}>⚑ Para conferir</option>${Object.entries(NATURES).map(([k, l]) => `<option value="${k}" ${F.nature === k ? "selected" : ""}>${l}</option>`).join("")}</select></div>
      <div class="grow"><label>Buscar</label><input id="f-q" value="${esc(F.q)}" placeholder="cliente, descrição…"></div>
      <div><label>&nbsp;</label><label style="display:flex;gap:6px;align-items:center;color:var(--body)"><input type="checkbox" id="f-card" style="width:auto" ${F.card ? "checked" : ""}> itens do cartão</label></div>
      <div class="right"><label>&nbsp;</label><button id="new-tx">+ Lançamento</button></div>
    </div>
    <div class="cards">
      <div class="card"><div class="k">Receita</div><div class="v">${money(receita, cur)}</div><div class="s">já descontadas devoluções</div></div>
      <div class="card"><div class="k">Despesas</div><div class="v">${money(gastos, cur)}</div><div class="s">${F.entity === "BR" ? "inclui faturas do cartão" : "&nbsp;"}</div></div>
      <div class="card"><div class="k">Impostos</div><div class="v">${money(imp, cur)}</div></div>
      <div class="card"><div class="k">Resultado</div><div class="v">${money(receita - gastos - imp, cur)}</div><div class="s">antes do pró-labore</div></div>
      <div class="card"><div class="k">Pró-labore</div><div class="v">${money(tot("pro_labore"), cur)}</div></div>
    </div>
    <div class="section split">
      <div><h2>Receita por cliente</h2><div class="list">${top(byClient).map(([k, v]) => `<div><span>${esc(k)}</span><b class="num">${money(v, cur)}</b></div>`).join("") || `<div class="empty">Nada no período</div>`}</div></div>
      <div><h2>Despesas por categoria</h2><div class="list">${top(byCat).map(([k, v]) => `<div><span>${esc(k)}</span><b class="num">${money(v, cur)}</b></div>`).join("") || `<div class="empty">${F.entity === "BR" && !F.card ? "Quase tudo passa pelo cartão: marque “itens do cartão”" : "Nada no período"}</div>`}</div></div>
    </div>
    <div class="section"><h2>Lançamentos <span class="sub">(${rows.length})</span></h2>
    <div class="tbl-wrap"><table><thead><tr><th>Data</th><th>Descrição</th><th>Tipo</th><th>Conta</th><th class="num">Valor</th></tr></thead><tbody>
      ${rows.map((t) => `<tr class="click ${t.flag ? "flagged" : ""} ${t.nature === "detalhe_cartao" ? "muted" : ""}" data-id="${t.id}">
        <td class="nowrap">${fdate(t.date)}</td>
        <td>${esc(t.description)}${t.flag ? `<span class="flag-tag">⚑</span>` : ""}<div class="sub">${esc([t.category, t.notes].filter(Boolean).join(" · "))}</div></td>
        <td><span class="badge ${t.nature}">${esc(NATURES[t.nature])}</span></td>
        <td class="nowrap sub">${esc(accountById(t.account_id)?.name)}</td>
        <td class="num ${t.type === "in" ? "pos" : "neg"}">${t.type === "in" ? "+" : "−"} ${money(t.amount, t.currency)}</td></tr>`).join("") || `<tr><td colspan="5" class="empty">Nenhum lançamento</td></tr>`}
    </tbody></table></div></div>`;

  const upd = (k, v) => { F[k] = v; finance(); };
  $("#f-entity").onchange = (e) => { F.entity = e.target.value; F.year = String(new Date().getFullYear()); finance(); };
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
  $("#view").innerHTML = `<div class="toolbar"><h2 style="margin:0">Clientes</h2><div class="right"><button id="new-client">+ Cliente</button></div></div>
    ${list.map((c) => {
      const ks = contractsOf(c.id);
      const inv = S.invoices.filter((i) => i.client_id === c.id && i.status !== "cancelled");
      return `<div class="client"><div class="head">
        <div><h3>${esc(c.company)} <span class="badge ${c.status}">${esc(CLIENT_STATUS[c.status])}</span> <span class="badge">${ENTITY[c.entity]}</span></h3>
          <div class="sub">${esc([c.contact_name, c.email, c.phone].filter(Boolean).join(" · "))}</div></div>
        <div class="actions"><button class="small ghost" data-edit-client="${c.id}">Editar</button><button class="small ghost" data-new-contract="${c.id}">+ Contrato</button><button class="small" data-new-invoice="${c.id}">+ Invoice</button></div></div>
        ${ks.map((k) => `<div class="facts">
          <div><span>Contrato</span><b>${esc(k.title)}</b> <span class="badge ${k.status}">${esc(CONTRACT_STATUS[k.status])}</span></div>
          <div><span>Mensal</span><b>${money(k.monthly_fee, k.currency)}</b><span>${esc(VAT_MODE[k.vat_mode])}</span></div>
          ${+k.setup_fee ? `<div><span>Setup</span><b>${money(k.setup_fee, k.currency)}</b></div>` : ""}
          <div><span>Início</span><b>${fdate(k.start_date)}</b></div>
          <div><span>Fim do período mínimo</span><b>${fdate(k.renewal_date) || "—"}</b>${k.notice_days ? `<span>aviso de ${k.notice_days} dias</span>` : ""}</div>
          <div><span>&nbsp;</span><button class="small ghost" data-edit-contract="${k.id}">Editar contrato</button></div>
        </div>`).join("")}
        <div class="facts"><div><span>Recebido</span><b>${money(sum(inv.filter((i) => i.status === "paid"), (i) => i.amount), ks[0]?.currency || "EUR")}</b></div>
          <div><span>Em aberto</span><b>${money(sum(inv.filter((i) => i.status === "sent"), (i) => i.amount), ks[0]?.currency || "EUR")}</b></div>
          ${c.notes ? `<div style="grid-column:span 3"><span>Notas</span><div>${esc(c.notes)}</div></div>` : ""}</div>
      </div>`;
    }).join("") || `<p class="empty">Nenhum cliente ainda</p>`}`;
  $("#new-client").onclick = () => clientForm();
  $$("[data-edit-client]").forEach((b) => (b.onclick = () => clientForm(clientById(b.dataset.editClient))));
  $$("[data-new-contract]").forEach((b) => (b.onclick = () => contractForm({ client_id: b.dataset.newContract })));
  $$("[data-edit-contract]").forEach((b) => (b.onclick = () => contractForm(S.contracts.find((k) => k.id === b.dataset.editContract))));
  $$("[data-new-invoice]").forEach((b) => (b.onclick = () => invoiceForm({ client_id: b.dataset.newInvoice })));
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
      { k: "renewal_date", label: "Fim do período mínimo / renovação", type: "date" }, { k: "notice_days", label: "Aviso prévio (dias)", type: "number" },
      { k: "billing_day", label: "Dia da cobrança", type: "number" }, { k: "status", label: "Status", type: "select", options: CONTRACT_STATUS },
      { k: "end_date", label: "Data de término (se encerrado)", type: "date" },
      { k: "invoice_terms", label: "Texto de condições no invoice", type: "textarea", full: true },
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
  $("#view").innerHTML = `<div class="toolbar"><h2 style="margin:0">Invoices</h2><div class="right"><button id="new-inv">+ Invoice</button></div></div>
    <div class="tbl-wrap"><table><thead><tr><th>Nº</th><th>Cliente</th><th>Emissão</th><th>Vencimento</th><th class="num">Valor</th><th>Status</th><th></th></tr></thead><tbody>
    ${list.map((i) => { const st = invoiceState(i); return `<tr>
      <td class="nowrap"><b>${esc(i.number)}</b></td>
      <td>${esc(clientById(i.client_id)?.company)}<div class="sub">${esc(i.description)}</div></td>
      <td class="nowrap">${fdate(i.issue_date)}</td><td class="nowrap">${fdate(i.due_date)}</td>
      <td class="num">${money(i.amount, i.currency)}</td>
      <td><span class="badge ${st}">${INVOICE_LABEL[st]}</span>${i.paid_at ? `<div class="sub">em ${fdate(i.paid_at)}</div>` : ""}</td>
      <td class="nowrap"><div class="actions">
        <button class="small ghost" data-print="${i.id}">PDF</button>
        ${i.status === "sent" ? `<button class="small" data-paid="${i.id}">Recebido</button>` : ""}
        <button class="small ghost" data-edit="${i.id}">Editar</button></div></td></tr>`; }).join("") || `<tr><td colspan="7" class="empty">Nenhum invoice</td></tr>`}
    </tbody></table></div>
    <p class="sub" style="margin-top:10px">${list.filter((i) => i.notes && i.status === "sent").map((i) => `${esc(i.number)}: ${esc(i.notes)}`).join("<br>")}</p>`;
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

function invoiceForm(i = {}) {
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
    onChange: (name, v, set) => {
      if (name === "client_id" && v.client_id) { if (!i.id) suggestFromContract(v.client_id, set); }
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
  $("#view").innerHTML = `<div class="toolbar"><h2 style="margin:0">Leads</h2><span class="sub">últimos 300</span></div>
    <div class="tbl-wrap"><table><thead><tr><th>Data</th><th>Quem</th><th>Contato</th><th>Origem</th><th>Status</th><th></th></tr></thead><tbody>
    ${S.leads.map((l) => `<tr>
      <td class="nowrap">${fdate(l.created_at)}</td>
      <td><b>${esc(l.name || "—")}</b><div class="sub">${esc([l.business, l.town].filter(Boolean).join(" · "))}</div>
        ${l.message ? `<div class="sub" style="max-width:360px">${esc(l.message.slice(0, 160))}${l.message.length > 160 ? "…" : ""}</div>` : ""}</td>
      <td class="sub">${esc([l.email, l.phone, l.ig_username && "@" + l.ig_username, l.website].filter(Boolean).join(" · "))}</td>
      <td class="nowrap sub">${esc([l.source, l.keyword, l.interest].filter(Boolean).join(" · "))}</td>
      <td><select data-lead="${l.id}" style="min-width:130px">${Object.entries(LEAD_STATUS).map(([k, v]) => `<option value="${k}" ${l.status === k ? "selected" : ""}>${v}</option>`).join("")}</select></td>
      <td>${l.status !== "client" ? `<button class="small ghost" data-convert="${l.id}">Virar cliente</button>` : ""}</td></tr>`).join("") || `<tr><td colspan="6" class="empty">Nenhum lead</td></tr>`}
    </tbody></table></div>`;
  $$("[data-lead]").forEach((s) => (s.onchange = async () => { await save("leads", { status: s.value }, s.dataset.lead); toast("Status atualizado"); const l = S.leads.find((x) => x.id === s.dataset.lead); l.status = s.value; }));
  $$("[data-convert]").forEach((b) => (b.onclick = () => {
    const l = S.leads.find((x) => x.id === b.dataset.convert);
    clientForm({ company: l.business || l.name || "", contact_name: l.name, email: l.email, phone: l.phone, status: "prospect", entity: "IE", lead_id: l.id,
      notes: [l.message, l.keyword && "Palavra: " + l.keyword].filter(Boolean).join("\n") },
      async () => { await save("leads", { status: "client" }, l.id); });
  }));
}

// ── start ────────────────────────────────────────────────────────────────────
gate();
})();
