// Content approval pages · irishbusinessboosters.com/approve/<page>/
// Each page holds its content in <script id="approval-data" type="application/json">.
// Responses go to the "approval" Edge Function (Supabase, table public.approvals).
(function () {
  const ENDPOINT = "https://tbgxeqauakiydzwmqyyf.supabase.co/functions/v1/approval";
  const DATA = JSON.parse(document.getElementById("approval-data").textContent);
  const PAGE = DATA.page;
  const app = document.getElementById("app");
  const responses = {}; // item id -> [rows]
  const picked = {};    // item id -> choice id picked on screen
  let online = true;

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // [square brackets] = details we fill in once the photos arrive
  const rich = (s) => esc(s).replace(/\[([^\]]+)\]/g, '<mark class="fill">$1</mark>');
  const fmtDate = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("en-IE", { weekday: "short", day: "numeric", month: "short" });
  const fmtStamp = (iso) => new Date(iso).toLocaleString("en-IE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  function store(key, val) {
    try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch { return null; }
  }

  async function call(body) {
    const res = await fetch(ENDPOINT, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ page: PAGE, ...body }) });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(out.error || "Something went wrong");
    return out;
  }

  function statusOf(id) {
    const rows = (responses[id] || []).filter((r) => r.status !== "comment");
    return rows.length ? rows[rows.length - 1] : null;
  }

  // ---------- previews ----------
  function preview(it) {
    if (it.type === "reel") {
      return `<div class="reel"><span class="tag">Reel · ${esc(it.length || "")}</span>
        <div class="ost">${rich(it.onscreen || "")}</div>
        <div class="shot"><b>What you'll see:</b> ${rich(it.shot || "")}</div></div>`;
    }
    if (it.type === "carousel") {
      const s = it.slides.map((sl, i) => `<div class="slide"><span class="n">${i + 1}/${it.slides.length}</span>
        <div class="t">${rich(sl.text)}</div><div class="p">${sl.photo ? "Photo: " + rich(sl.photo) : ""}</div></div>`).join("");
      return `<div><div class="slides">${s}</div><p class="hint">Swipe to see every slide →</p></div>`;
    }
    return "";
  }

  function choiceBody(it) {
    const sel = picked[it.id] ?? statusOf(it.id)?.choice ?? null;
    return `<div class="choices">${it.choices.map((c) => `
      <button type="button" class="choice" data-item="${it.id}" data-choice="${esc(c.id)}" aria-pressed="${sel === c.id}">
        <span class="cl">${esc(c.label)}</span>
        ${c.bio ? `<div class="bio"><b>${esc(it.name || "")}</b>${esc(c.bio)}</div>` : ""}
        ${c.covers ? `<div class="circles">${c.covers.map((cv) => `<figure><img src="${esc(cv.src)}" alt="" loading="lazy"><figcaption>${esc(cv.name)}</figcaption></figure>`).join("")}</div>` : ""}
        ${c.note ? `<span class="hint">${esc(c.note)}</span>` : ""}
      </button>`).join("")}</div>`;
  }

  function body(it) {
    if (it.choices) return `<div class="ibody wide"><div class="details">${choiceBody(it)}${it.note ? `<p class="note">${rich(it.note)}</p>` : ""}</div></div>`;
    if (it.type === "stories") {
      return `<div class="ibody wide"><div class="details"><div class="stories">${it.screens.map((s) => `<div><div class="story"><p>${rich(s.text)}</p></div><p class="cap">${esc(s.label)}</p></div>`).join("")}</div>${it.note ? `<p class="note">${rich(it.note)}</p>` : ""}</div></div>`;
    }
    return `<div class="ibody"><div>${preview(it)}</div><div class="details">
      <div><p class="label">Caption</p><p class="caption">${rich(it.caption)}</p>${it.tags ? `<p class="tags">${esc(it.tags)}</p>` : ""}</div>
      ${it.note ? `<p class="note">${rich(it.note)}</p>` : ""}</div></div>`;
  }

  function history(id) {
    const rows = responses[id] || [];
    if (!rows.length) return "";
    const word = { approved: "Approved", changes: "Asked for changes", comment: "Commented" };
    return `<ul class="history">${rows.map((r) => `<li><span class="h"><b>${esc(word[r.status])}</b>${r.choice ? " · " + esc(r.choice) : ""} · ${esc(r.name || "")} · ${esc(fmtStamp(r.created_at))}</span>${r.comment ? `<span class="c">${esc(r.comment)}</span>` : ""}</li>`).join("")}</ul>`;
  }

  function card(it) {
    const st = statusOf(it.id);
    const pill = st ? (st.status === "approved" ? '<span class="pill approved">Approved</span>' : '<span class="pill changes">Changes requested</span>') : '<span class="pill">Waiting for you</span>';
    const meta = [it.date ? `<span class="chip date">${esc(fmtDate(it.date))}</span>` : "", ...(it.chips || []).map((c) => `<span class="chip">${esc(c)}</span>`)].join("");
    return `<article class="item ${st ? "is-" + st.status : ""}" id="${it.id}">
      <div class="ihead"><div><h3>${esc(it.title)}</h3>${meta ? `<div class="meta">${meta}</div>` : ""}</div>${pill}</div>
      ${body(it)}
      <div class="actions" data-item="${it.id}">
        ${history(it.id)}
        <div class="btns">
          <button type="button" class="btn primary" data-act="approve" ${online ? "" : "disabled"}>${st?.status === "approved" ? "Approve again" : "Approve"}</button>
          <button type="button" class="btn" data-act="open" ${online ? "" : "disabled"}>Suggest changes</button>
        </div>
        <div class="form" hidden>
          <label class="label" for="c-${it.id}">What would you like changed?</label>
          <textarea id="c-${it.id}" placeholder="e.g. Use the oak kitchen in Dunmore East instead, and say it took 6 weeks."></textarea>
          <div class="btns"><button type="button" class="btn primary" data-act="send">Send to Eli</button><button type="button" class="btn" data-act="cancel">Cancel</button></div>
        </div>
        <p class="err" hidden></p>
      </div></article>`;
  }

  function render() {
    const items = DATA.sections.flatMap((s) => s.items);
    const done = items.filter((it) => statusOf(it.id)?.status === "approved").length;
    document.getElementById("count").textContent = `${done} of ${items.length} approved`;
    document.getElementById("fill").style.width = (100 * done / items.length) + "%";
    document.getElementById("conn").hidden = online;
    app.innerHTML = DATA.sections.map((s) => `<section class="group"><header><h2>${esc(s.title)}</h2>${s.intro ? `<p>${esc(s.intro)}</p>` : ""}</header>${s.items.map(card).join("")}</section>`).join("");
  }

  async function submit(itemId, status, comment, box) {
    const it = DATA.sections.flatMap((s) => s.items).find((x) => x.id === itemId);
    const err = box.querySelector(".err");
    err.hidden = true;
    const choiceId = picked[itemId] ?? statusOf(itemId)?.choice ?? null;
    if (it.choices && status === "approved" && !choiceId) {
      err.textContent = "Pick the option you prefer first, then press Approve.";
      err.hidden = false;
      return;
    }
    const name = document.getElementById("who").value.trim() || DATA.client;
    box.querySelectorAll("button").forEach((b) => (b.disabled = true));
    try {
      const out = await call({ action: "submit", item: itemId, itemTitle: it.title, status, comment, choice: choiceId, name });
      (responses[itemId] ||= []).push(out.response);
      render();
      document.getElementById(itemId)?.scrollIntoView({ block: "nearest" });
    } catch (e) {
      box.querySelectorAll("button").forEach((b) => (b.disabled = false));
      err.textContent = "That didn't save. Please try again in a minute, or just reply to Eli's email.";
      err.hidden = false;
    }
  }

  app.addEventListener("click", (e) => {
    const ch = e.target.closest(".choice");
    if (ch) { picked[ch.dataset.item] = ch.dataset.choice; render(); return; }
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const box = btn.closest(".actions");
    const id = box.dataset.item;
    const form = box.querySelector(".form");
    const act = btn.dataset.act;
    if (act === "approve") submit(id, "approved", null, box);
    if (act === "open") { form.hidden = false; form.querySelector("textarea").focus(); }
    if (act === "cancel") form.hidden = true;
    if (act === "send") {
      const text = form.querySelector("textarea").value.trim();
      if (!text) { const err = box.querySelector(".err"); err.textContent = "Write what you'd like changed first."; err.hidden = false; return; }
      submit(id, "changes", text, box);
    }
  });

  const who = document.getElementById("who");
  who.value = store("approve-name") || DATA.client;
  who.addEventListener("change", () => store("approve-name", who.value.trim()));

  render();
  call({ action: "list" })
    .then((out) => { (out.responses || []).forEach((r) => (responses[r.item] ||= []).push(r)); render(); if (location.hash) document.querySelector(location.hash)?.scrollIntoView(); })
    .catch(() => { online = false; render(); });
})();
