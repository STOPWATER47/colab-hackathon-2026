/* 공통: 머리말·꼬리말, 3개 국어 전환, 서버 연결(데모 모드 포함) */
(function () {
  const C = window.COLAB;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ---------- 머리말·꼬리말 ---------- */
  const navItems = [
    ["#about", "대회안내", "About", "Thông tin"],
    ["#/apply", "참가 신청", "Apply", "Đăng ký"],
    ["#/team", "팀빌딩", "Team building", "Lập đội"],
    ["#/submit", "제출", "Submit", "Nộp bài"],
    ["#/board", "게시판", "Q&A board", "Hỏi đáp"]
  ];
  const header = document.createElement("header");
  header.className = "top";
  header.innerHTML = `<div class="wrap">
    <a class="brand" href="#">Co-Lab<b>2026</b></a>
    <button class="menu-btn" aria-label="메뉴 / Menu" aria-expanded="false"><svg width="18" height="18" viewBox="0 0 18 18"><path d="M2 5h14M2 9h14M2 13h14" stroke="#1E211E" stroke-width="1.8" stroke-linecap="round"/></svg></button>
    <nav class="nav" id="nav">${navItems.map(([h, ko, en, vi]) =>
      `<a href="${h}" data-en="${en}" data-vi="${vi}">${ko}</a>`).join("")}<span class="nav-auth" id="navAuth"></span></nav>
    <div class="lang">
      <button class="lang-btn" aria-haspopup="true" aria-expanded="false" aria-label="언어 선택 / Chọn ngôn ngữ / Language"><img alt="" src="assets/flags/kr.svg"><svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>
      <ul class="lang-menu" role="menu" hidden>
        <li><button role="menuitemradio" data-l="ko" aria-checked="false"><img alt="" src="assets/flags/kr.svg">한국어</button></li>
        <li><button role="menuitemradio" data-l="vi" aria-checked="false"><img alt="" src="assets/flags/vn.svg">Tiếng Việt</button></li>
        <li><button role="menuitemradio" data-l="en" aria-checked="false"><img alt="" src="assets/flags/gb.svg">English</button></li>
      </ul>
    </div></div>`;
  document.body.prepend(header);
  const DEMO = !C.ENDPOINT;
  window.IS_DEMO = DEMO;
  if (DEMO) {
    const bar = document.createElement("div");
    bar.className = "demo-bar";
    bar.innerHTML = '<span data-en="<b>Demo mode</b> — not connected yet. Everything is saved only in this browser. <a href=\'#/login\'>Demo accounts</a>" data-vi="<b>Chế độ demo</b> — chưa kết nối. Dữ liệu chỉ lưu trên trình duyệt này. <a href=\'#/login\'>Tài khoản demo</a>"><b>데모 모드</b> — 아직 서버 연결 전이라 입력값은 이 브라우저에만 저장돼요. <a href="#/login">데모 계정 보기</a></span>';
    header.after(bar);
  }
  const mb = header.querySelector(".menu-btn"), nav = header.querySelector("#nav");
  mb.addEventListener("click", () => { const o = nav.classList.toggle("open"); mb.setAttribute("aria-expanded", o); });
  nav.addEventListener("click", e => { if (e.target.closest("a")) { nav.classList.remove("open"); mb.setAttribute("aria-expanded", false); } });

  const footer = document.createElement("footer");
  footer.innerHTML = `<div class="wrap"><span>© 2026 Global Co-Lab</span><span><span data-en="Hosted by Jeju National University · Vietnam-Korea University of Information and Communication Technology (VKU)" data-vi="Chủ trì: Đại học Quốc gia Jeju · Trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn (VKU)">주최 제주대학교 · 다낭 정보통신기술대학교(VKU)</span> · <span data-en="Organised by JNU Glocal University Project Group" data-vi="Tổ chức: Ban Dự án Glocal, ĐH Quốc gia Jeju">주관 제주대학교 글로컬사업단</span></span><span><a href="#/board" data-en="Questions: Q&amp;A board" data-vi="Hỏi đáp: bảng câu hỏi">문의는 게시판으로</a></span></div>`;
  document.body.append(footer);

  /* ---------- 언어: 한국어 / 베트남어 / 영어 (국기 버튼) ---------- */
  function setLang(l) {
    document.documentElement.lang = l;
    document.querySelectorAll("[data-en]").forEach(el => {
      if (el.dataset.ko === undefined) el.dataset.ko = el.innerHTML;
      el.innerHTML = l === "ko" ? el.dataset.ko : (el.dataset[l] || el.dataset.en);
    });
    document.querySelectorAll("[data-ph-en]").forEach(el => {
      if (el.dataset.phKo === undefined) el.dataset.phKo = el.placeholder;
      el.placeholder = l === "ko" ? el.dataset.phKo : (l === "vi" ? el.dataset.phVi : el.dataset.phEn) || el.dataset.phEn;
    });
    header.querySelectorAll(".lang-menu button").forEach(b => b.setAttribute("aria-checked", b.dataset.l === l));
    header.querySelector(".lang-btn img").src = `assets/flags/${FLAG[l]}.svg`;
    store.set("colab-lang", l);
    window.COLAB_LANG = l;
    document.dispatchEvent(new CustomEvent("langchange", { detail: l }));
  }
  const FLAG = { ko: "kr", vi: "vn", en: "gb" };
  const lb = header.querySelector(".lang-btn"), lm = header.querySelector(".lang-menu");
  const openMenu = o => { lm.hidden = !o; lb.setAttribute("aria-expanded", o); if (o) lm.querySelector('[aria-checked="true"]')?.focus(); };
  lb.addEventListener("click", e => { e.stopPropagation(); openMenu(lm.hidden); });
  lm.querySelectorAll("button").forEach(b => b.addEventListener("click", () => { setLang(b.dataset.l); openMenu(false); lb.focus(); }));
  document.addEventListener("click", e => { if (!lm.hidden && !header.querySelector(".lang").contains(e.target)) openMenu(false); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !lm.hidden) { openMenu(false); lb.focus(); } });
  window.t = (o, p = "") => { const l = window.COLAB_LANG || "ko"; return o[p + l] || o[p + "en"] || o[p + "ko"]; };
  window.T = (ko, en, vi) => { const l = window.COLAB_LANG || "ko"; return l === "ko" ? ko : l === "vi" ? (vi || en) : en; };
  window.reTranslate = () => setLang(window.COLAB_LANG || "ko");
  const q = new URLSearchParams(location.search).get("lang");
  document.addEventListener("DOMContentLoaded", () => setLang(["ko", "vi", "en"].includes(q) ? q : store.get("colab-lang", "ko")));

  /* ---------- 서버 연결 (Apps Script). 주소가 비어 있으면 데모 모드: 같은 로직을 이 브라우저 안에서 ---------- */
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const TKEY = "colab-token";
  window.Session = {
    get() { try { return localStorage.getItem(TKEY) || ""; } catch (e) { return ""; } },
    set(t) { try { localStorage.setItem(TKEY, t); } catch (e) {} },
    clear() { try { localStorage.removeItem(TKEY); } catch (e) {} }
  };
  const DKEY = "colab-demo-v6";
  function seed() {
    const at = "2026-11-17T10:00:00.000Z";
    const u = (uid, email, name, nameEn, school, role, status, teamId, interest = "") => ({ uid, email, name, nameEn, school, role, interest, status, teamId, createdAt: at, decidedAt: status === "pending" ? "" : at });
    return {
      Users: [
        u("u0", "admin@demo.kr", "운영팀", "Organiser", "", "admin", "approved", ""),
        u("u1", "team@demo.kr", "김제주", "Kim Jeju", "JNU", "participant", "approved", "T01", "energy"),
        u("u2", "an@demo.kr", "Nguyen An", "Nguyen An", "VKU", "participant", "approved", "T01", "energy"),
        u("u3", "binh@demo.kr", "Pham Binh", "Pham Binh", "VKU", "participant", "approved", "T01", "env"),
        u("u4", "minh@demo.kr", "Le Minh", "Le Minh", "VKU", "participant", "approved", "T02", "circular"),
        u("u5", "hallim@demo.kr", "최한림", "Choi Hallim", "JNU", "participant", "approved", "T02", "circular"),
        u("u6", "solo@demo.kr", "이서귀", "Lee Seogwi", "JNU", "participant", "approved", "", "env"),
        Object.assign(u("u7", "new@demo.kr", "박한라", "Park Halla", "JNU", "participant", "pending", "", "energy"), { createdAt: "2026-11-23T02:00:00.000Z" }),
        u("u8", "mentor@demo.kr", "Tran Mentor", "Tran Mentor", "Demo Company", "mentor", "approved", ""),
        Object.assign(u("u9", "mentor2@demo.kr", "이멘토", "Lee Mentor", "JNU", "mentor", "pending", ""), { createdAt: "2026-11-23T03:00:00.000Z" }),
        u("u10", "judge@demo.kr", "Judge Demo", "Judge Demo", "VKU", "judge", "approved", ""),
        u("u11", "vy@demo.kr", "Tran Vy", "Tran Vy", "VKU", "participant", "approved", "", "energy")
      ],
      Teams: [
        { teamId: "T01", teamName: "Demo Team A", title: "데모 프로젝트 A", inviteCode: "AB12CD", leaderUid: "u1", createdAt: at },
        { teamId: "T02", teamName: "Demo Team B", title: "Demo project B", inviteCode: "EF34GH", leaderUid: "u4", createdAt: at }
      ],
      Requests: [{ id: "R1", teamId: "T01", uid: "u11", message: "데이터 분석을 맡고 싶어요.", status: "pending", at: "2026-11-24T09:00:00.000Z", decidedAt: "" }],
      Posts: [
        { id: "P0", uid: "u0", title: "[필독] 사전 과제 제출 안내", body: "사전 과제는 문제 정의 → 조사 내용 → 아이디어 → 역할 분담 순서의 양식으로 제출해 주세요.", at: "2026-11-20T01:00:00.000Z", status: "open" },
        { id: "P1", uid: "u2", title: "발표는 영어로 해야 하나요?", body: "팀원 중 한 명이 영어가 서툰데 괜찮을까요?", at: "2026-11-21T03:00:00.000Z", status: "open" },
        { id: "P2", uid: "u6", title: "사전 과제 양식은 어디서 받나요?", body: "HWP 양식 파일이 따로 있나요?", at: "2026-11-24T05:00:00.000Z", status: "open" }
      ],
      Comments: [{ id: "C1", postId: "P1", uid: "u0", body: "팀원끼리 나눠서 발표해도 괜찮아요.", at: "2026-11-21T06:00:00.000Z", status: "open" }],
      Files: [], Mentoring: [], Scores: [], Codes: [], Sessions: []
    };
  }
  const demoDB = {
    load() { let d = store.get(DKEY, null); if (!d) { d = seed(); store.set(DKEY, d); } return d; },
    all(t) { return this.load()[t].map(o => ({ ...o })); },
    add(t, o) { const d = this.load(); d[t].push({ ...o }); store.set(DKEY, d); },
    patch(t, kf, kv, p) { const d = this.load(); const r = d[t].find(x => x[kf] === kv); if (r) Object.assign(r, p); store.set(DKEY, d); }
  };
  window.resetDemo = () => { try { localStorage.removeItem(DKEY); } catch (e) {} Session.clear(); };
  const rnd = (n, chars) => {
    const a = new Uint32Array(n);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a); else for (let i = 0; i < n; i++) a[i] = Math.floor(Math.random() * 4294967295);
    let o = ""; a.forEach(v => o += chars[v % chars.length]); return o;
  };
  const fnv = s => { let h = 2166136261; for (const ch of s) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; } return h.toString(16); };
  const demoHandle = DEMO ? CORE.make(demoDB, {
    adminEmails: ["admin@demo.kr"], criteria: Object.fromEntries(C.CRITERIA.map(c => [c.id, c.max])),
    tie: { group: C.CRITERIA.filter(c => c.g === "hack").map(c => c.id), last: "tech" },
    stages: C.STAGES.map(s => s.id), linkOnly: C.STAGES.filter(s => s.linkOnly).map(s => s.id), maxFileMB: C.MAX_FILE_MB, teamMax: C.TEAM_MAX,
    saveFile: (t, st, name, mime, b64) => ({ url: "#demo-file", size: Math.round(b64.length * 0.75) }),
    sendCode: () => {}, hash: fnv, random: rnd, exposeCode: true
  }) : null;

  window.api = async function (action, payload = {}) {
    const body = { action, token: Session.get(), lang: window.COLAB_LANG || "ko", ...payload };
    let r;
    if (DEMO) {
      await sleep(250);
      try { r = demoHandle(action, JSON.parse(JSON.stringify(body))); } catch (e) { console.error(e); r = { ok: false, error: "unknown" }; }
    } else {
      try {
        const res = await fetch(C.ENDPOINT, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) });
        r = await res.json();
      } catch (e) { r = { ok: false, error: "network" }; }
    }
    if (r && r.error === "auth") { Session.clear(); window.updateNavAuth && window.updateNavAuth(); }
    return r;
  };

  /* 머리말: 로그인 상태에 따라 '로그인' 또는 '내 페이지 · 로그아웃' */
  window.updateNavAuth = function () {
    const slot = document.getElementById("navAuth"); if (!slot) return;
    slot.innerHTML = Session.get()
      ? `<button type="button" class="nav-out" data-en="Log out" data-vi="Đăng xuất">로그아웃</button>`
      : `<a href="#/login" class="btn btn-pri btn-sm" data-en="Log in" data-vi="Đăng nhập">로그인</a>`;
    let role = ""; try { role = Session.get() ? localStorage.getItem("colab-role") || "" : ""; } catch (e) {}
    const sa = document.getElementById("sideAdmin"); if (sa) sa.hidden = role !== "admin";
    const out = slot.querySelector(".nav-out");
    if (out) out.addEventListener("click", async () => { await api("logout"); Session.clear(); try { localStorage.removeItem("colab-role"); } catch (e) {} window.updateNavAuth(); location.hash = "#/"; });
    window.reTranslate && window.reTranslate();
  };
  document.addEventListener("DOMContentLoaded", () => window.updateNavAuth());

  /* 참가 가이드 팝업 (메인 첫 방문 시) */
  const GUIDE = [
    ["참가 신청", "Apply", "Đăng ký", "이메일·이름·학교를 적고 동의사항을 확인한 뒤 신청해요.", "Enter your email, name and university, check the notice and apply.", "Điền email, họ tên, trường, đọc điều khoản rồi đăng ký."],
    ["팀 구성", "Form a team", "Lập đội", "승인되면 로그인해서 팀장은 팀을 만들고, 팀원은 원하는 팀에 합류 신청해요.", "Once approved, leads create a team and members ask to join one.", "Khi được duyệt, trưởng nhóm tạo đội, thành viên gửi yêu cầu tham gia."],
    ["결과물 제출", "Submit", "Nộp bài", "팀원 누구나 마감 전에 내 페이지에서 결과물을 올려요.", "Any member uploads your work on My page before the deadline.", "Thành viên nào cũng nộp bài ở trang của tôi trước hạn."]
  ];
  function openGuide() {
    let d = document.getElementById("guide");
    if (!d) {
      d = document.createElement("dialog"); d.id = "guide"; d.className = "guide";
      d.setAttribute("aria-labelledby", "guideTitle");
      d.innerHTML = `<div class="g-art"><img src="assets/guide-art.svg" alt=""></div>
        <div class="g-body">
          <button class="g-x" type="button" aria-label="닫기 / Close">&times;</button>
          <h2 id="guideTitle" tabindex="-1" autofocus data-en="How to take part" data-vi="Hướng dẫn tham gia">해커톤 참가 가이드</h2>
          <p class="g-sub" data-en="Three easy steps" data-vi="3 bước đơn giản">3단계로 쉽게 참가하기</p>
          <ol>${GUIDE.map((g, i) => `<li><span class="g-n">${i + 1}</span><div><b data-en="${g[1]}" data-vi="${g[2]}">${g[0]}</b><p data-en="${g[4]}" data-vi="${g[5]}">${g[3]}</p></div></li>`).join("")}</ol>
          <div class="g-act"><button type="button" class="g-skip" data-en="Don't show again" data-vi="Không hiển thị lại">다시 보지 않기</button>
          <a class="btn btn-pri g-go" href="#/apply" data-en="Get started" data-vi="Bắt đầu">시작하기</a></div>
        </div>`;
      document.body.append(d);
      d.querySelector(".g-x").addEventListener("click", () => d.close());
      d.querySelector(".g-go").addEventListener("click", () => d.close());
      d.querySelector(".g-skip").addEventListener("click", () => { store.set("colab-guide-off", true); d.close(); });
      d.addEventListener("click", e => { if (e.target === d) d.close(); });
      window.reTranslate && window.reTranslate();
    }
    if (!d.open) d.showModal();
  }
  window.openGuide = openGuide;
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-open-guide]").forEach(b => b.addEventListener("click", e => { e.preventDefault(); openGuide(); }));
    window.maybeGuide = () => { if (!store.get("colab-guide-off", false)) setTimeout(openGuide, 200); };
  });

  /* 파일 → base64 */
  window.readFile = file => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(",")[1]);
    r.onerror = rej; r.readAsDataURL(file);
  });

  window.ERR = {
    auth: ["로그인이 필요해요. 다시 로그인해 주세요.", "Please log in again.", "Vui lòng đăng nhập lại."],
    exists: ["이미 이 이메일로 신청했어요. 승인되면 로그인할 수 있어요.", "You've already applied with this email. Log in once approved.", "Email này đã đăng ký. Hãy đăng nhập khi được duyệt."],
    bad_email: ["이메일 주소를 확인해 주세요.", "Check the email address.", "Kiểm tra lại địa chỉ email."],
    rate: ["코드는 1분에 한 번만 받을 수 있어요. 잠시 뒤에 다시 눌러 주세요.", "You can request a code once a minute. Try again shortly.", "Mỗi phút chỉ lấy mã một lần. Hãy thử lại sau."],
    no_application: ["이 이메일로 들어온 신청이 없어요. 참가 신청을 먼저 해 주세요.", "No application with this email. Apply first.", "Không có đơn đăng ký với email này. Hãy đăng ký trước."],
    rejected: ["이번 신청은 승인되지 않았어요. 궁금한 점은 문의 메일로 알려 주세요.", "This application wasn't approved. Email us with any questions.", "Đơn này không được duyệt. Hãy email nếu có thắc mắc."],
    bad_code: ["인증코드가 맞지 않아요. 메일의 6자리 숫자를 다시 확인해 주세요.", "That code isn't right. Check the 6 digits in your email.", "Mã không đúng. Kiểm tra lại 6 số trong email."],
    code_expired: ["인증코드 유효 시간(10분)이 지났어요. 코드를 다시 받아 주세요.", "The code has expired (10 minutes). Request a new one.", "Mã đã hết hạn (10 phút). Hãy lấy mã mới."],
    too_many: ["여러 번 틀려서 이 코드는 막혔어요. 코드를 다시 받아 주세요.", "Too many wrong tries. Request a new code.", "Nhập sai quá nhiều lần. Hãy lấy mã mới."],
    already_requested: ["이미 이 팀에 합류 신청했어요. 팀장이 수락하면 팀에 들어가요.", "You've already asked to join this team.", "Bạn đã gửi yêu cầu tham gia đội này."],
    leader_only: ["팀장만 할 수 있어요.", "Only the team lead can do this.", "Chỉ trưởng nhóm mới làm được."],
    gone: ["신청한 사람이 이미 다른 팀에 들어갔거나 신청을 취소했어요.", "That person has joined another team or cancelled.", "Người này đã vào đội khác hoặc đã hủy."],
    has_team: ["이미 팀에 들어가 있어요.", "You're already in a team.", "Bạn đã ở trong một đội."],
    no_team: ["먼저 팀을 만들거나 팀에 들어가 주세요.", "Create or join a team first.", "Hãy tạo hoặc tham gia đội trước."],
    bad_invite: ["초대코드를 찾지 못했어요. 6자리를 다시 확인해 주세요.", "Invite code not found. Check the 6 characters.", "Không tìm thấy mã mời. Kiểm tra lại 6 ký tự."],
    team_full: ["이 팀은 이미 인원이 다 찼어요.", "This team is already full.", "Đội này đã đủ người."],
    not_approved: ["아직 승인 전이에요. 운영팀이 승인하면 이용할 수 있어요.", "Not approved yet. You can use this once the organisers approve you.", "Chưa được duyệt. Bạn có thể dùng khi ban tổ chức duyệt."],
    forbidden: ["이 역할로는 할 수 없는 작업이에요.", "Your role can't do this.", "Vai trò của bạn không thể thực hiện thao tác này."],
    bad_input: ["입력값을 확인해 주세요.", "Check what you entered.", "Kiểm tra lại thông tin đã nhập."],
    bad_link: ["링크는 http:// 또는 https:// 로 시작해야 해요.", "Links must start with http:// or https://.", "Liên kết phải bắt đầu bằng http:// hoặc https://."],
    bad_score: ["점수는 항목별 배점 안의 정수로 모두 입력해 주세요.", "Enter a whole number within each criterion's maximum.", "Nhập số nguyên trong giới hạn điểm của từng tiêu chí."],
    too_big: ["파일이 너무 커요. 용량을 줄이거나 링크로 제출해 주세요.", "File too large. Compress it or submit a link.", "Tệp quá lớn. Hãy nén hoặc nộp liên kết."],
    network: ["서버에 연결하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.", "Couldn't reach the server. Check your connection and try again.", "Không kết nối được máy chủ. Kiểm tra mạng và thử lại."],
    unknown: ["처리하지 못했어요. 문제가 계속되면 운영팀에 알려 주세요.", "Something went wrong. Contact the organisers if it keeps happening.", "Đã xảy ra lỗi. Hãy liên hệ ban tổ chức nếu lỗi lặp lại."]
  };
  window.esc = v => String(v == null ? "" : v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  window.errText = code => T(...(ERR[code] || ERR.unknown));
  window.showMsg = (el, kind, text) => { el.className = "msg show " + kind; el.textContent = text; el.focus && el.focus(); };
})();
