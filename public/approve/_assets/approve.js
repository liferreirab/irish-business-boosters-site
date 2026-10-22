// Content approval pages · irishbusinessboosters.com/approve/<page>/
// Each page holds its content in <script id="approval-data" type="application/json">:
//   { page, client, username, avatar, location, profile?, posts: [...] }
// Responses go to the "approval" Edge Function (Supabase, table public.approvals).
(function () {
  const ENDPOINT = "https://tbgxeqauakiydzwmqyyf.supabase.co/functions/v1/approval";
  const DATA = JSON.parse(document.getElementById("approval-data").textContent);
  const ITEMS = [...(DATA.profile ? [DATA.profile] : []), ...DATA.posts];
  const responses = {}; // item id -> [rows]
  const picked = {};    // item id -> choice picked on screen
  let online = true;

  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // [square brackets] = details we fill in once the photos arrive
  const rich = (s) => esc(s).replace(/\[([^\]]+)\]/g, '<mark class="fill">$1</mark>');
  const day = (iso, o) => new Date(iso + "T12:00:00").toLocaleDateString("en-IE", o);
  const fmtStamp = (iso) => new Date(iso).toLocaleString("en-IE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const store = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch { return null; } };

  const ICON = {
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    chat: '<path d="M20 12a8 8 0 1 1-3.2-6.4A8 8 0 0 1 20 12zM20 20l-2.6-2.6"/>',
    send: '<path d="M21 3 10 14M21 3l-7 18-4-7-7-4z"/>',
    save: '<path d="M6 3h12v18l-6-4-6 4z"/>',
    play: '<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>',
    multi: '<rect x="7" y="3" width="14" height="14" rx="2"/><path d="M17 21H5a2 2 0 0 1-2-2V7"/>',
    check: '<path d="M5 12.5 10 17l9-10"/>',
    pen: '<path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/>',
  };
  const svg = (n, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`;

  async function call(body) {
    const res = await fetch(ENDPOINT, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ page: DATA.page, ...body }) });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(out.error || "Something went wrong");
    return out;
  }
  const statusOf = (id) => { const r = (responses[id] || []).filter((x) => x.status !== "comment"); return r.length ? r[r.length - 1] : null; };
  const choiceOf = (it) => picked[it.id] ?? statusOf(it.id)?.choice ?? it.choices?.[0]?.id;

  // ---------- Instagram mockups ----------
  const head = () => `<div class="ig-head"><img src="${esc(DATA.avatar)}" alt=""><div><b>${esc(DATA.username)}</b><span>${esc(DATA.location || "")}</span></div><span class="dots3">•••</span></div>`;

  function igPost(p) {
    const n = p.images.length;
    return `<div class="ig">${head()}
      <div class="ig-media" data-n="${n}">
        <div class="track">${p.images.map((src, i) => `<img src="${esc(src)}" alt="Slide ${i + 1}" loading="${i ? "lazy" : "eager"}">`).join("")}</div>
        ${n > 1 ? `<span class="count">1/${n}</span><button type="button" class="nav prev" aria-label="Previous slide" hidden>‹</button><button type="button" class="nav next" aria-label="Next slide">›</button>` : ""}
      </div>
      ${n > 1 ? `<div class="pips">${p.images.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("")}</div>` : ""}
      <div class="ig-icons">${svg("heart")}${svg("chat")}${svg("send")}<span class="sp"></span>${svg("save")}</div>
      <div class="ig-cap"><p class="cap clamp"><b>${esc(DATA.username)}</b> ${rich(p.caption)}${p.tags ? `\n\n<span class="tags">${esc(p.tags)}</span>` : ""}</p><button type="button" class="more">more</button></div>
    </div>`;
  }

  function igReel(p) {
    return `<div class="reel" style="background-image:url('${esc(p.images[0])}')">
      <span class="rtag">${svg("play")} Reel · ${esc(p.length || "")}</span>
      <div class="rside">${svg("heart")}${svg("chat")}${svg("send")}</div>
      <div class="rfoot"><div class="ruser"><img src="${esc(DATA.avatar)}" alt=""><b>${esc(DATA.username)}</b></div></div>
    </div>
    <div class="ig-cap solo"><p class="cap clamp"><b>${esc(DATA.username)}</b> ${rich(p.caption)}${p.tags ? `\n\n<span class="tags">${esc(p.tags)}</span>` : ""}</p><button type="button" class="more">more</button></div>`;
  }

  function igProfile(it) {
    const bio = it.choices.find((c) => c.id === choiceOf(it))?.bio || "";
    return `<div class="phone"><div class="prof">
      <div class="prow"><img class="pav" src="${esc(DATA.avatar)}" alt="">
        <div class="pstats"><div><b>${esc(it.stats[0])}</b>posts</div><div><b>${esc(it.stats[1])}</b>followers</div><div><b>${esc(it.stats[2])}</b>following</div></div></div>
      <b class="pname">${esc(it.name)}</b><span class="pcat">${esc(it.category)}</span>
      <p class="pbio" data-bio>${esc(bio)}</p><span class="plink">🔗 ${esc(it.link)}</span>
      <div class="pbtns"><span>Follow</span><span>Message</span><span>Contact</span></div>
      <div class="hl">${it.highlights.map((h) => `<figure><img src="${esc(h.src)}" alt=""><figcaption>${esc(h.name)}</figcaption></figure>`).join("")}</div>
      <div class="pgrid">${it.grid.map((g) => `<img src="${esc(g)}" alt="" loading="lazy">`).join("")}</div>
    </div></div>`;
  }

  // ---------- cards ----------
  function pill(id) {
    const st = statusOf(id);
    if (!st) return '<span class="pill">Waiting for you</span>';
    return st.status === "approved" ? `<span class="pill approved">${svg("check")} Approved</span>` : `<span class="pill changes">${svg("pen")} Changes asked</span>`;
  }

  function actions(it) {
    const rows = responses[it.id] || [];
    const word = { approved: "Approved", changes: "Asked for changes", comment: "Commented" };
    const st = statusOf(it.id);
    return `${rows.length ? `<ul class="history">${rows.map((r) => `<li><span class="h"><b>${word[r.status]}</b>${r.choice ? " · " + esc(r.choice) : ""} · ${esc(r.name || "")} · ${esc(fmtStamp(r.created_at))}</span>${r.comment ? `<span class="c">${esc(r.comment)}</span>` : ""}</li>`).join("")}</ul>` : ""}
      <div class="btns">
        <button type="button" class="btn ok" data-act="approve" ${online ? "" : "disabled"}>${svg("check")} ${st?.status === "approved" ? "Approved" : "Approve"}</button>
        <button type="button" class="btn" data-act="open" ${online ? "" : "disabled"}>${svg("pen")} Suggest changes</button>
      </div>
      <div class="form" hidden>
        <label class="label" for="c-${it.id}">What would you like changed?</label>
        <textarea id="c-${it.id}" placeholder="e.g. Use the oak kitchen in Dunmore East instead, and say it took 6 weeks."></textarea>
        <div class="btns"><button type="button" class="btn dark" data-act="send">Send to Eli</button><button type="button" class="btn ghost" data-act="cancel">Cancel</button></div>
      </div>
      <p class="err" hidden></p>`;
  }

  function side(it, extra = "") {
    const dateBlock = it.date ? `<div class="when"><span class="wd">${esc(day(it.date, { weekday: "long" }))}</span><span class="dm">${esc(day(it.date, { day: "numeric", month: "long" }))}</span></div>` : "";
    return `<div class="side">
      <div class="shead">${dateBlock}<span data-pill="${it.id}">${pill(it.id)}</span></div>
      <h3>${esc(it.title)}</h3>
      ${it.chips ? `<div class="chips">${it.chips.map((c) => `<span class="chip">${esc(c)}</span>`).join("")}</div>` : ""}
      ${it.about ? `<p class="about">${rich(it.about)}</p>` : ""}
      ${extra}
      ${it.need ? `<div class="need"><b>What I need from you</b><span>${rich(it.need)}</span></div>` : ""}
      <div class="actions" data-item="${it.id}">${actions(it)}</div>
    </div>`;
  }

  function profileCard(it) {
    const opts = `<div class="opts">${it.choices.map((c) => `<button type="button" class="opt" data-item="${it.id}" data-choice="${esc(c.id)}" aria-pressed="${choiceOf(it) === c.id}"><b>${esc(c.label)}</b><span>${esc(c.bio)}</span></button>`).join("")}</div>`;
    return `<article class="card" id="${it.id}"><div class="mock">${igProfile(it)}</div>${side(it, opts)}</article>`;
  }
  const postCard = (p) => `<article class="card" id="${p.id}"><div class="mock">${p.kind === "reel" ? igReel(p) : igPost(p)}</div>${side(p)}</article>`;

  function strip() {
    return `<div class="strip">${DATA.posts.map((p, i) => `<a href="#${p.id}" class="tile"><span class="thumb" style="background-image:url('${esc(p.images[0])}')">${p.kind === "reel" ? svg("play", "badge") : p.images.length > 1 || p.slides ? svg("multi", "badge") : ""}<i class="dot" data-dot="${p.id}"></i></span><span class="td">${esc(day(p.date, { weekday: "short", day: "numeric", month: "short" }))}</span><span class="tt">${esc(p.title)}</span></a>`).join("")}</div>`;
  }

  function refresh(id) {
    const done = ITEMS.filter((it) => statusOf(it.id)?.status === "approved").length;
    $("#count").textContent = `${done} of ${ITEMS.length} approved`;
    $("#fill").style.width = (100 * done / ITEMS.length) + "%";
    $("#conn").hidden = online;
    (id ? ITEMS.filter((x) => x.id === id) : ITEMS).forEach((it) => {
      const a = $(`.actions[data-item="${it.id}"]`); if (a) a.innerHTML = actions(it);
      const p = $(`[data-pill="${it.id}"]`); if (p) p.innerHTML = pill(it.id);
      const d = $(`[data-dot="${it.id}"]`); if (d) d.className = "dot " + (statusOf(it.id)?.status || "");
      const c = $("#" + it.id); if (c) c.classList.toggle("is-approved", statusOf(it.id)?.status === "approved");
    });
  }

  function build() {
    $("#strip").innerHTML = strip();
    $("#app").innerHTML =
      (DATA.profile ? `<section class="group"><header><span class="eyebrow">Step 1</span><h2>Your new profile</h2><p>${esc(DATA.profile.intro || "")}</p></header>${profileCard(DATA.profile)}</section>` : "") +
      `<section class="group"><header><span class="eyebrow">Step 2</span><h2>${esc(DATA.postsTitle || "Posts")}</h2><p>${esc(DATA.postsIntro || "")}</p></header>${DATA.posts.map(postCard).join("")}</section>`;
    document.querySelectorAll(".ig-media").forEach(wireCarousel);
    document.querySelectorAll(".cap.clamp").forEach((c) => { if (c.scrollHeight <= c.clientHeight + 2) c.nextElementSibling.hidden = true; });
    refresh();
  }

  function wireCarousel(m) {
    const track = $(".track", m), n = +m.dataset.n;
    if (n < 2) return;
    const pips = m.nextElementSibling;
    const update = () => {
      const i = Math.round(track.scrollLeft / track.clientWidth);
      $(".count", m).textContent = `${i + 1}/${n}`;
      $(".prev", m).hidden = i === 0; $(".next", m).hidden = i === n - 1;
      pips.querySelectorAll("i").forEach((p, k) => p.classList.toggle("on", k === i));
    };
    track.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
    $(".prev", m).onclick = () => track.scrollBy({ left: -track.clientWidth, behavior: "smooth" });
    $(".next", m).onclick = () => track.scrollBy({ left: track.clientWidth, behavior: "smooth" });
  }

  async function submit(id, status, comment, box) {
    const it = ITEMS.find((x) => x.id === id);
    const err = $(".err", box); err.hidden = true;
    const name = $("#who").value.trim() || DATA.client;
    box.querySelectorAll("button").forEach((b) => (b.disabled = true));
    try {
      const out = await call({ action: "submit", item: id, itemTitle: it.title, status, comment, choice: it.choices ? choiceOf(it) : null, name });
      (responses[id] ||= []).push(out.response);
      refresh(id);
    } catch {
      box.querySelectorAll("button").forEach((b) => (b.disabled = false));
      err.textContent = "That didn't save. Please try again in a minute, or just reply to Eli's email.";
      err.hidden = false;
    }
  }

  document.addEventListener("click", (e) => {
    const more = e.target.closest(".more");
    if (more) { const c = more.previousElementSibling; c.classList.toggle("clamp"); more.textContent = c.classList.contains("clamp") ? "more" : "less"; return; }
    const opt = e.target.closest(".opt");
    if (opt) {
      const it = ITEMS.find((x) => x.id === opt.dataset.item);
      picked[it.id] = opt.dataset.choice;
      document.querySelectorAll(`.opt[data-item="${it.id}"]`).forEach((o) => o.setAttribute("aria-pressed", o === opt));
      $("[data-bio]").textContent = it.choices.find((c) => c.id === opt.dataset.choice).bio;
      return;
    }
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const box = btn.closest(".actions"), id = box.dataset.item, form = $(".form", box);
    const act = btn.dataset.act;
    if (act === "approve") submit(id, "approved", null, box);
    if (act === "open") { form.hidden = false; $("textarea", form).focus(); }
    if (act === "cancel") form.hidden = true;
    if (act === "send") {
      const text = $("textarea", form).value.trim();
      if (!text) { const err = $(".err", box); err.textContent = "Write what you'd like changed first."; err.hidden = false; return; }
      submit(id, "changes", text, box);
    }
  });

  const who = $("#who");
  who.value = store("approve-name") || DATA.client;
  who.addEventListener("change", () => store("approve-name", who.value.trim()));

  build();
  call({ action: "list" })
    .then((out) => { (out.responses || []).forEach((r) => (responses[r.item] ||= []).push(r)); refresh(); if (location.hash) $(location.hash)?.scrollIntoView(); })
    .catch(() => { online = false; refresh(); });
})();
