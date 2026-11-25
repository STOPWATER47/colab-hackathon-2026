/* =========================================================
   한 페이지 웹앱 화면: #/apply 참가 신청 · #/login 로그인 · #/my 내 페이지 · #/admin 운영 관리
   (#about 같은 주소는 메인 화면 안의 위치로 이동)
   ========================================================= */
(function () {
  const C = window.COLAB;
  const $ = id => document.getElementById(id);
  const app = () => $("app"), home = () => $("home");
  const CONTACT = "wl5839@naver.com";
  const lang = () => window.COLAB_LANG || "ko";
  const fmt = (s, o) => s ? new Date(s).toLocaleString(lang() === "ko" ? "ko-KR" : lang() === "vi" ? "vi-VN" : "en-GB", o) : "";
  const when = s => fmt(s, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const day = s => fmt(s, { month: "short", day: "numeric" });
  const stageName = id => { const s = C.STAGES.find(x => x.id === id); return s ? t(s) : id; };
  const modeName = m => m === "online" ? T("온라인", "Online", "Trực tuyến") : T("대면", "In person", "Trực tiếp");
  const fileLink = f => f.url && !f.url.startsWith("#") ? `<a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.name)}</a>` : esc(f.name);
  const ROLE = { participant: ["참가 학생", "Student", "Sinh viên"], judge: ["심사위원", "Judge", "Giám khảo"], mentor: ["멘토", "Mentor", "Cố vấn"], admin: ["운영팀", "Organiser", "Ban tổ chức"] };
  const STAT = { pending: ["승인 대기", "Pending", "Chờ duyệt"], approved: ["승인", "Approved", "Đã duyệt"], rejected: ["반려", "Rejected", "Từ chối"] };
  const INTEREST = { energy: ["에너지", "Energy", "Năng lượng"], circular: ["자원순환", "Circular economy", "Tuần hoàn tài nguyên"], env: ["환경", "Environment", "Môi trường"], undecided: ["아직 모름", "Not sure yet", "Chưa chắc"] };
  const contactBox = () => `<div class="box"><p class="help">${T("문의", "Questions?", "Thắc mắc?")} · <a href="#/board">${T("게시판", "Q&A board", "Hỏi đáp")}</a></p></div>`;

  const FLOW = [
    ["apply", "#/apply", ["참가 신청", "Apply", "Đăng ký"], ["이메일·이름·학교", "Email, name, school", "Email, họ tên, trường"]],
    ["login", "#/login", ["승인 후 로그인", "Log in once approved", "Đăng nhập khi được duyệt"], ["이메일 인증코드", "Code sent by email", "Mã gửi qua email"]],
    ["my", "#/my", ["팀 만들고 제출", "Team up & submit", "Lập đội & nộp bài"], ["팀 · 결과물", "Team · uploads", "Đội · nộp bài"]]
  ];
  const flowHTML = cur => `<ol class="flow" aria-label="${T("진행 단계", "Steps", "Các bước")}">${FLOW.map(([id, href, ttl, sub], i) =>
    `<li class="${id === cur ? "on" : ""}"><a href="${href}"><span class="n">${i + 1}</span><span class="t"><b>${T(...ttl)}</b><small>${T(...sub)}</small></span></a></li>`).join("")}</ol>`;
  const heroHTML = (who, title, lead) => `<div class="page-head card"><span class="tag">${who}</span><h1>${title}</h1><p>${lead}</p></div>`;

  /* ---------- 참가 신청 ---------- */
  const applyState = { done: null };
  function viewApply() {
    const el = app();
    if (applyState.done) {
      el.innerHTML = heroHTML(T("참가 신청", "Apply", "Đăng ký"), T("신청했어요", "Application sent", "Đã gửi đăng ký"),
        T("운영팀이 확인하고 승인하면, 이 이메일로 로그인할 수 있어요.", "Once the organisers approve it, you can log in with this email.", "Khi ban tổ chức duyệt, bạn có thể đăng nhập bằng email này."), "apply") +
        `<div class="fn-body"><div class="main-col"><div class="panel"><span class="badge-st" data-k="pending">${T(...STAT.pending)}</span>
        <dl class="kv" style="margin-top:14px"><dt>${T("이메일", "Email", "Email")}</dt><dd>${esc(applyState.done.email)}</dd><dt>${T("이름", "Name", "Họ tên")}</dt><dd>${esc(applyState.done.name)}</dd></dl>
        <p class="desc" style="margin-top:14px">${T("승인 여부는 로그인 화면에서 이메일을 넣어 보면 알 수 있어요.", "To check, enter your email on the log-in screen.", "Để kiểm tra, hãy nhập email ở màn hình đăng nhập.")}</p>
        <div class="actions" style="margin-top:16px"><a class="btn btn-pri" href="#/login">${T("로그인 화면으로", "Go to log in", "Đến đăng nhập")}</a><button class="btn btn-ghost" type="button" id="again">${T("다른 사람 신청하기", "Apply for someone else", "Đăng ký cho người khác")}</button></div></div></div>
        <aside class="aside">${contactBox()}</aside></div>`;
      $("again").onclick = () => { applyState.done = null; viewApply(); };
      return;
    }
    el.innerHTML = heroHTML(T("학생 · 심사위원 · 멘토", "Students · judges · mentors", "Sinh viên · giám khảo · cố vấn"), T("참가 신청", "Apply", "Đăng ký"),
      T("회원가입 없이 신청서만 쓰면 돼요. 운영팀이 승인하면 이메일 인증코드로 로그인해요.", "No sign-up — just this form. Once approved, you log in with a code sent to your email.", "Không cần tạo tài khoản — chỉ cần điền đơn. Khi được duyệt, bạn đăng nhập bằng mã gửi qua email."), "apply") +
    `<div class="fn-body"><div class="main-col"><form id="af" novalidate>
      <div class="panel"><h2>${T("어떤 역할로 신청하나요?", "Apply as", "Đăng ký với vai trò")}</h2>
        <div class="role-pick" role="radiogroup">
          <label><input type="radio" name="role" value="participant" checked><b>${T(...ROLE.participant)}</b><span>${T("해커톤에 팀으로 참가해요. 팀은 승인 후 직접 만들어요.", "Take part in a team. You form your team after approval.", "Tham gia theo đội. Bạn lập đội sau khi được duyệt.")}</span></label>
          <label><input type="radio" name="role" value="mentor"><b>${T(...ROLE.mentor)}</b><span>${T("팀을 만나 멘토링하고 기록을 남겨요.", "Meet teams and log each session.", "Gặp các đội và ghi lại từng buổi.")}</span></label>
          <label><input type="radio" name="role" value="judge"><b>${T(...ROLE.judge)}</b><span>${T("최종 발표에서 팀별 점수를 입력해요.", "Score each team at the final pitches.", "Chấm điểm từng đội ở buổi thuyết trình cuối.")}</span></label>
        </div></div>
      <div class="panel"><h2>${T("신청자 정보", "About you", "Thông tin của bạn")}</h2>
        <div class="grid2">
          <div class="field"><label for="aName">${T("이름", "Name", "Họ tên")}<span class="req">*</span></label><input id="aName" type="text" maxlength="60" autocomplete="name"></div>
          <div class="field"><label for="aNameEn">${T("영문 이름", "Name in English", "Họ tên (tiếng Anh)")}<span class="req" data-only="participant">*</span></label><input id="aNameEn" type="text" maxlength="80" placeholder="Hong Gildong"><span class="hint">${T("명찰과 서로 부를 때 써요", "Used on name tags", "Dùng cho bảng tên")}</span></div>
          <div class="field full"><label for="aEmail">${T("이메일", "Email", "Email")}<span class="req">*</span></label><input id="aEmail" type="email" maxlength="120" autocomplete="email" placeholder="you@email.com"><span class="hint">${T("로그인 인증코드를 이 주소로 보내요. 자주 확인하는 메일로 적어 주세요.", "Your login code goes here — use an inbox you check.", "Mã đăng nhập sẽ gửi đến đây — hãy dùng email bạn hay kiểm tra.")}</span></div>
          <div class="field" data-for="participant"><label for="aSchool">${T("학교", "University", "Trường")}<span class="req">*</span></label><input id="aSchool" type="text" maxlength="80" list="schoolList" autocomplete="organization" placeholder="${T("예: 제주대학교", "e.g. Jeju National University", "VD: VKU")}"><datalist id="schoolList"><option value="Jeju National University (JNU)"><option value="VKU (Vietnam–Korea University of ICT)"></datalist><span class="hint">${T("학교 이름을 직접 적어 주세요", "Type your university's name", "Nhập tên trường của bạn")}</span></div>
          <div class="field" data-for="mentor judge" hidden><label for="aOrg">${T("소속", "Affiliation", "Đơn vị")}<span class="req">*</span></label><input id="aOrg" type="text" maxlength="80" placeholder="${T("학교, 회사 등", "University, company…", "Trường, công ty…")}"></div>
          <div class="field" data-for="participant"><label for="aInt">${T("관심 분야 (선택)", "Interest (optional)", "Lĩnh vực quan tâm (tùy chọn)")}</label>
            <select id="aInt"><option value="">–</option>${Object.keys(INTEREST).map(k => `<option value="${k}">${T(...INTEREST[k])}</option>`).join("")}</select><span class="hint">${T("팀을 짤 때 서로 참고해요", "Helps when forming teams", "Giúp khi lập đội")}</span></div>
        </div></div>
      <div class="panel">
        <label class="check"><input type="checkbox" id="agree"> <span><b style="color:var(--danger)">${T("[필수]", "[Required]", "[Bắt buộc]")}</b> ${T("개인정보 수집·이용에 동의합니다.", "I agree to the collection and use of my personal information.", "Tôi đồng ý cho thu thập và sử dụng thông tin cá nhân.")}</span></label>
        <details class="consent"><summary>${T("자세히 보기", "Details", "Chi tiết")}</summary><dl>
          <dt>${T("수집 항목", "Collected", "Thu thập")}</dt><dd>${T("이름, 영문 이름, 이메일, 학교(소속), 관심 분야", "Name, name in English, email, university (affiliation), interest", "Họ tên, tên tiếng Anh, email, trường (đơn vị), lĩnh vực quan tâm")}</dd>
          <dt>${T("이용 목적", "Purpose", "Mục đích")}</dt><dd>${T("해커톤 운영 (승인, 로그인 인증코드 발송, 팀 구성, 결과물 제출, 멘토링, 심사)", "Running the hackathon: approval, login codes, teams, submissions, mentoring, judging", "Vận hành hackathon: xét duyệt, mã đăng nhập, lập đội, nộp bài, cố vấn, chấm điểm")}</dd>
          <dt>${T("보유 기간", "Kept until", "Lưu đến")}</dt><dd>${T("행사 종료 후 파기", "Deleted after the event", "Xóa sau sự kiện")}</dd></dl></details>
        <div class="actions" style="margin-top:20px"><button class="btn btn-pri" type="submit" id="aBtn">${T("신청하기", "Apply", "Gửi đăng ký")}</button>
          <span class="muted sm">${T("이미 신청했나요?", "Already applied?", "Đã đăng ký?")} <a href="#/login">${T("로그인", "Log in", "Đăng nhập")}</a></span></div>
        <div class="msg" id="aMsg" role="status" tabindex="-1"></div></div>
    </form></div>
    <aside class="aside">
      <div class="box"><h3>${T("신청 후", "After you apply", "Sau khi đăng ký")}</h3><ul>
        <li>${T("운영팀이 확인 후 승인", "The organisers review and approve", "Ban tổ chức xem xét và duyệt")}</li>
        <li>${T("이메일 인증코드로 로그인", "Log in with a code sent by email", "Đăng nhập bằng mã gửi qua email")}</li>
        <li>${T("팀장은 팀을 만들고, 팀원은 합류 신청", "Leads create teams; members ask to join", "Trưởng nhóm tạo đội; thành viên xin tham gia")}</li></ul></div>
      <div class="box"><h3>${T("팀 구성", "Teams", "Đội")}</h3><p class="help">${T(`한 팀은 최대 ${C.TEAM_MAX}명이에요. 신청은 각자 따로 해요.`, `Up to ${C.TEAM_MAX} per team. Everyone applies individually.`, `Tối đa ${C.TEAM_MAX} người/đội. Mỗi người tự đăng ký.`)}</p></div>
      ${contactBox()}</aside></div>`;
    const f = $("af"), role = () => f.role.value;
    const sync = () => {
      const r = role();
      f.querySelectorAll("[data-for]").forEach(x => x.hidden = !x.dataset.for.split(" ").includes(r));
      f.querySelectorAll("[data-only]").forEach(x => x.hidden = x.dataset.only !== r);
    };
    f.querySelectorAll("[name=role]").forEach(x => x.onchange = sync); sync();
    f.onsubmit = async ev => {
      ev.preventDefault();
      const r = role(), m = $("aMsg"), need = [$("aName"), $("aEmail")];
      if (r === "participant") { need.push($("aNameEn"), $("aSchool")); } else need.push($("aOrg"));
      const miss = need.find(x => !x.value.trim());
      if (miss) { miss.focus(); return showMsg(m, "err", T("표시(*)된 항목을 모두 입력해 주세요.", "Fill in all fields marked *.", "Vui lòng điền các mục có dấu *.")); }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($("aEmail").value.trim())) { $("aEmail").focus(); return showMsg(m, "err", errText("bad_email")); }
      if (!$("agree").checked) { $("agree").focus(); return showMsg(m, "err", T("개인정보 수집·이용에 동의해 주세요.", "Please agree to the personal information notice.", "Vui lòng đồng ý với thông báo thông tin cá nhân.")); }
      const school = (r === "participant" ? $("aSchool") : $("aOrg")).value.trim();
      $("aBtn").disabled = true; showMsg(m, "ok", T("보내는 중이에요…", "Sending…", "Đang gửi…"));
      const res = await api("apply", { role: r, name: $("aName").value, nameEn: $("aNameEn").value, email: $("aEmail").value, school, interest: r === "participant" ? $("aInt").value : "" });
      if (!res.ok) { $("aBtn").disabled = false; return showMsg(m, "err", errText(res.error)); }
      applyState.done = { email: $("aEmail").value.trim(), name: $("aName").value.trim() };
      viewApply(); scrollTo(0, 0);
    };
  }

  /* ---------- 로그인 (이메일 → 인증코드) ---------- */
  const loginState = { email: "", sent: false, demoCode: "" };
  function viewLogin() {
    if (Session.get()) { location.hash = "#/my"; return; }
    const s = loginState, el = app();
    el.innerHTML = heroHTML(T("승인된 학생 · 멘토 · 심사위원 · 운영팀", "Approved students, mentors, judges and organisers", "Sinh viên, cố vấn, giám khảo, BTC đã được duyệt"), T("로그인", "Log in", "Đăng nhập"),
      T("비밀번호 없이, 신청한 이메일로 받은 6자리 코드로 로그인해요.", "No password — just the 6-digit code we email you.", "Không cần mật khẩu — chỉ cần mã 6 số gửi qua email."), "login") +
    `<div class="fn-body"><div class="main-col">
      <form class="panel narrow" id="lf" novalidate>
        <h2>${s.sent ? T("인증코드 입력", "Enter your code", "Nhập mã") : T("이메일로 로그인", "Log in with email", "Đăng nhập bằng email")}</h2>
        ${s.sent ? `<p class="desc">${T(`<b>${esc(s.email)}</b> 로 보낸 6자리 코드를 입력해 주세요. 10분 동안 쓸 수 있어요.`, `Enter the 6-digit code we sent to <b>${esc(s.email)}</b>. It works for 10 minutes.`, `Nhập mã 6 số đã gửi đến <b>${esc(s.email)}</b>. Mã dùng được trong 10 phút.`)}</p>
          ${s.demoCode ? `<div class="notice" style="margin:0 0 14px"><span aria-hidden="true">●</span><span>${T("데모 모드라 메일 대신 여기 보여 드려요:", "Demo mode — here's your code:", "Chế độ demo — mã của bạn:")} <b class="mono">${s.demoCode}</b></span></div>` : ""}
          <div class="field"><label for="lCode">${T("인증코드", "Code", "Mã")}</label><input id="lCode" class="code-in" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••"></div>
          <div class="actions"><button class="btn btn-pri" type="submit" id="lBtn">${T("로그인", "Log in", "Đăng nhập")}</button>
            <button class="linkish" type="button" id="lResend">${T("코드 다시 받기", "Send a new code", "Gửi lại mã")}</button>
            <button class="linkish" type="button" id="lBack">${T("이메일 바꾸기", "Change email", "Đổi email")}</button></div>`
        : `<div class="field"><label for="lEmail">${T("신청한 이메일", "Email you applied with", "Email đã đăng ký")}</label><input id="lEmail" type="email" autocomplete="email" value="${esc(s.email)}"></div>
          <div class="actions"><button class="btn btn-pri" type="submit" id="lBtn">${T("인증코드 받기", "Send me a code", "Gửi mã cho tôi")}</button></div>`}
        <div class="msg" id="lMsg" role="status" tabindex="-1"></div>
        ${s.sent ? `<p class="hint-line">${T("코드가 안 오면 스팸함을 확인하고, 1분 뒤 다시 받아 보세요.", "No code? Check spam, or request again after a minute.", "Không nhận được mã? Kiểm tra thư rác hoặc lấy lại sau 1 phút.")}</p>` : `<p class="hint-line">${T("승인된 이메일에만 코드가 가요.", "Codes go only to approved emails.", "Mã chỉ gửi đến email đã được duyệt.")}</p>`}
        <p class="muted sm" style="margin-top:6px">${T("아직 신청 전인가요?", "Haven't applied yet?", "Chưa đăng ký?")} <a href="#/apply">${T("참가 신청", "Apply", "Đăng ký")}</a></p>
      </form>
      ${window.IS_DEMO ? `<div class="panel narrow"><h2>${T("데모 계정", "Demo accounts", "Tài khoản demo")}</h2><p class="desc">${T("누르면 이메일이 채워져요.", "Click to fill in the email.", "Bấm để điền email.")}</p>
        <div class="acc-list">${C.DEMO_ACCOUNTS.map(a => `<button type="button" data-e="${a.email}"><b>${esc(t(a))}</b><span>${a.email}</span></button>`).join("")}</div>
        <button class="linkish" type="button" id="dReset">${T("데모 데이터 초기화", "Reset demo data", "Đặt lại dữ liệu demo")}</button></div>` : ""}
    </div><aside class="aside">
      <div class="box"><h3>${T("코드가 안 오나요?", "No code?", "Không nhận được mã?")}</h3><ul>
        <li>${T("스팸함을 확인해 주세요", "Check your spam folder", "Kiểm tra thư rác")}</li>
        <li>${T("승인 전이면 코드가 가지 않아요", "Codes are only sent after approval", "Mã chỉ được gửi sau khi duyệt")}</li>
        <li>${T("1분 뒤에 다시 받을 수 있어요", "You can request again after a minute", "Có thể lấy lại sau 1 phút")}</li></ul></div>${contactBox()}</aside></div>`;
    const m = $("lMsg");
    const request = async () => {
      $("lBtn").disabled = true;
      const r = await api("requestCode", { email: s.email });
      $("lBtn").disabled = false;
      if (!r.ok) { showMsg(m, "err", errText(r.error)); if (r.error === "no_application") m.insertAdjacentHTML("beforeend", ` <a href="#/apply">${T("참가 신청하기", "Apply", "Đăng ký")}</a>`); return false; }
      s.sent = true; s.demoCode = r.demoCode || ""; viewLogin(); $("lCode").focus();
      showMsg($("lMsg"), "ok", T("인증코드를 보냈어요.", "Code sent.", "Đã gửi mã.")); return true;
    };
    $("lf").onsubmit = async ev => {
      ev.preventDefault();
      if (!s.sent) {
        s.email = $("lEmail").value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email)) { $("lEmail").focus(); return showMsg(m, "err", errText("bad_email")); }
        return request();
      }
      const code = $("lCode").value.replace(/\D/g, "");
      if (code.length !== 6) { $("lCode").focus(); return showMsg(m, "err", errText("bad_code")); }
      $("lBtn").disabled = true;
      const r = await api("verifyCode", { email: s.email, code });
      if (!r.ok) { $("lBtn").disabled = false; return showMsg(m, "err", errText(r.error)); }
      try { localStorage.setItem("colab-role", r.user.role); } catch (e) {}
      Session.set(r.token); Object.assign(s, { sent: false, demoCode: "" }); updateNavAuth();
      location.hash = r.user.role === "admin" ? "#/admin" : "#/my";
    };
    if (s.sent) {
      $("lResend").onclick = request;
      $("lBack").onclick = () => { s.sent = false; s.demoCode = ""; viewLogin(); };
    }
    if (window.IS_DEMO) {
      app().querySelectorAll(".acc-list button").forEach(b => b.onclick = () => { s.sent = false; s.email = b.dataset.e; viewLogin(); $("lBtn").focus(); });
      $("dReset").onclick = () => { resetDemo(); updateNavAuth(); showMsg($("lMsg"), "ok", T("데모 데이터를 처음 상태로 되돌렸어요.", "Demo data reset.", "Đã đặt lại dữ liệu demo.")); };
    }
  }

  /* ---------- 내 페이지 ---------- */
  let ME = null, D = null, sel = null, leaveArmed = false;
  let MODE = "team";
  async function viewMy(reload, mode) {
    if (mode) MODE = mode;
    if (!Session.get()) {
      const sub = MODE === "submit";
      app().innerHTML = heroHTML(sub ? T("결과물 제출", "Submit", "Nộp bài") : T("팀빌딩", "Team building", "Lập đội"), sub ? T("결과물 제출", "Submit", "Nộp bài") : T("팀빌딩", "Team building", "Lập đội"),
        sub ? T("결과물은 팀으로 제출해요.", "Work is submitted as a team.", "Bài được nộp theo đội.") : T("팀장은 팀을 만들고, 팀원은 모집 중인 팀에 합류 신청해요.", "Leads create a team; members ask to join one.", "Trưởng nhóm tạo đội; thành viên xin tham gia.")) +
        `<div class="panel need-login"><h2>${T("로그인이 필요해요", "Please log in", "Cần đăng nhập")}</h2>
        <p class="desc">${sub ? T("제출은 승인된 참가자만 로그인해서 할 수 있어요.", "Only approved participants can submit after logging in.", "Chỉ người tham gia đã được duyệt mới nộp bài sau khi đăng nhập.") : T("팀빌딩은 승인된 참가자만 로그인해서 할 수 있어요.", "Only approved participants can form teams after logging in.", "Chỉ người tham gia đã được duyệt mới lập đội sau khi đăng nhập.")}</p>
        <div class="actions"><a class="btn btn-pri" href="#/login">${T("로그인", "Log in", "Đăng nhập")}</a><a class="btn btn-line" href="#/apply">${T("아직 신청 전이에요", "I haven't applied yet", "Tôi chưa đăng ký")}</a></div></div>`;
      return;
    }
    if (reload || !ME) {
      app().innerHTML = `<div class="card pad"><p class="muted">${T("불러오는 중…", "Loading…", "Đang tải…")}</p></div>`;
      const me = await api("me"); if (!me.ok) { location.hash = "#/login"; return; }
      ME = me.user;
      if (ME.role === "admin") { location.hash = "#/admin"; return; }
      const d = await api("dash"); if (!d.ok) { app().innerHTML = `<div class="card pad"><div class="msg show err">${esc(errText(d.error))}</div></div>`; return; }
      D = d; if (ME.role !== "participant" && !sel && D.teams.length) sel = D.teams[0].teamId;
    }
    const lead = {
      participant: MODE === "submit" ? T("팀원 누구나 결과물을 올릴 수 있어요. 단계별로 마지막에 올린 것이 심사 대상이에요.", "Any member can upload. The latest upload for each stage is judged.", "Thành viên nào cũng nộp được. Bản mới nhất mỗi giai đoạn sẽ được chấm.")
        : D.team ? T("팀 정보와 팀원, 합류 신청, 멘토링 기록을 확인하세요.", "See your team, members, join requests and mentoring notes.", "Xem đội, thành viên, yêu cầu tham gia và ghi chú cố vấn.")
        : T("팀장이면 팀을 만들고, 팀원이면 모집 중인 팀에 합류 신청을 보내세요.", "Leads create a team; members ask to join one.", "Trưởng nhóm tạo đội; thành viên gửi yêu cầu tham gia."),
      mentor: T("팀을 고르고 멘토링 내용을 기록하세요.", "Pick a team and log your session.", "Chọn đội và ghi lại buổi cố vấn."),
      judge: T("팀을 고르고 항목별 점수를 입력하세요. 저장한 뒤에도 고칠 수 있어요.", "Pick a team and enter scores. You can change them later.", "Chọn đội và nhập điểm. Có thể sửa sau.")
    }[ME.role];
    app().innerHTML = heroHTML(T(...ROLE[ME.role]) + (D.team ? " · " + esc(D.team.teamName) : ""), (ME.role === "participant" ? (MODE === "submit" ? T("결과물 제출", "Submit", "Nộp bài") : T("팀빌딩", "Team building", "Lập đội")) : T(`${esc(ME.name)}님, 반가워요`, `Hi, ${esc(ME.nameEn || ME.name)}`, `Xin chào, ${esc(ME.nameEn || ME.name)}`)), lead, ME.role === "participant" ? "my" : "") +
      `<div class="fn-body"><div class="main-col" id="view"></div><aside class="aside" id="side"></aside></div>`;
    ({ participant: MODE === "submit" ? (D.team ? renderTeam : renderNeedTeam) : (D.team ? renderTeam : renderNoTeam), mentor: renderMentor, judge: renderJudge })[ME.role]();
    /* 팀빌딩 화면과 제출 화면은 같은 데이터를 쓰고, 보이는 칸만 나눔 */
    if (ME.role === "participant" && D.team) $("view").querySelectorAll("[data-sec]").forEach(el => el.hidden = el.dataset.sec !== (MODE === "submit" ? "sub" : "team"));
  }
  function renderNeedTeam() {
    $("view").innerHTML = `<div class="panel"><h2>${T("아직 팀이 없어요", "You're not in a team yet", "Bạn chưa có đội")}</h2>
      <p class="desc">${T("결과물은 팀으로 제출해요. 먼저 팀빌딩에서 팀을 만들거나 합류해 주세요.", "Work is submitted as a team. Create or join a team first.", "Bài được nộp theo đội. Hãy tạo hoặc tham gia đội trước.")}</p>
      <a class="btn btn-pri" href="#/team">${T("팀빌딩으로", "Go to team building", "Đến lập đội")}</a></div>`;
  }

  function renderNoTeam() {
    const mine = new Set(D.myRequests || []);
    $("view").innerHTML = `<form class="panel" id="tc" novalidate><h2>${T("팀장으로 팀 만들기", "Create a team as lead", "Tạo đội (trưởng nhóm)")}</h2>
        <p class="desc">${T("팀을 만들면 팀장이 되고, 팀원들의 합류 신청을 받아 수락할 수 있어요.", "You become the lead and accept teammates' join requests.", "Bạn trở thành trưởng nhóm và duyệt yêu cầu tham gia của thành viên.")}</p>
        <div class="grid2"><div class="field"><label for="tName">${T("팀 이름", "Team name", "Tên đội")}</label><input id="tName" type="text" maxlength="60"></div>
        <div class="field"><label for="tTitle">${T("프로젝트 제목", "Project title", "Tên dự án")}</label><input id="tTitle" type="text" maxlength="120" placeholder="${T("나중에 바꿀 수 있어요", "You can change it later", "Có thể đổi sau")}"></div></div>
        <div class="actions" style="margin-top:16px"><button class="btn btn-pri" type="submit">${T("팀 만들기", "Create team", "Tạo đội")}</button></div>
        <div class="msg" id="tcMsg" role="status" tabindex="-1"></div></form>
      <div class="panel"><h2>${T("모집 중인 팀", "Teams looking for members", "Đội đang tuyển")}</h2>
        <p class="desc">${T("들어가고 싶은 팀에 합류 신청을 보내요. 팀장이 수락하면 그 팀의 팀원이 돼요.", "Send a join request; you're in once the lead accepts.", "Gửi yêu cầu tham gia; bạn vào đội khi trưởng nhóm chấp nhận.")}</p>
        ${D.openTeams.length ? `<ul class="team-cards">${D.openTeams.map(tm => `<li>
          <div class="tc-main"><b>${esc(tm.teamName)}</b><span class="muted sm">${esc(tm.title)}</span>
            <span class="sm">${T("팀장", "Lead", "Trưởng nhóm")} ${esc(tm.leaderName)} · ${tm.members.length}/${D.teamMax}${T("명", "", "")}</span>
            <span class="chips-mini">${tm.members.map(m => `<i>${esc(m.nameEn || m.name)} · ${esc(m.school)}</i>`).join("")}</span></div>
          <div class="tc-act">${mine.has(tm.teamId)
            ? `<span class="badge-st" data-k="pending">${T("신청함", "Requested", "Đã gửi")}</span><button class="linkish" type="button" data-cancel="${tm.teamId}">${T("취소", "Cancel", "Hủy")}</button>`
            : `<input type="text" maxlength="300" class="jr-msg" data-for="${tm.teamId}" placeholder="${T("한마디 (선택)", "Note (optional)", "Lời nhắn (tùy chọn)")}"><button class="btn btn-sm btn-pri" type="button" data-join="${tm.teamId}">${T("합류 신청", "Ask to join", "Xin tham gia")}</button>`}</div></li>`).join("")}</ul>`
          : `<p class="empty">${T("아직 모집 중인 팀이 없어요. 직접 팀을 만들어 보세요.", "No teams are recruiting yet. Create one!", "Chưa có đội nào đang tuyển. Hãy tự tạo đội.")}</p>`}
        <div class="msg" id="tjMsg" role="status" tabindex="-1"></div></div>`;
    $("tc").onsubmit = async ev => {
      ev.preventDefault();
      if (!$("tName").value.trim() || !$("tTitle").value.trim()) return showMsg($("tcMsg"), "err", T("팀 이름과 프로젝트 제목을 적어 주세요.", "Enter a team name and project title.", "Nhập tên đội và tên dự án."));
      const r = await api("teamCreate", { teamName: $("tName").value, title: $("tTitle").value });
      if (!r.ok) return showMsg($("tcMsg"), "err", errText(r.error));
      viewMy(true);
    };
    app().querySelectorAll("[data-join]").forEach(b => b.onclick = async () => {
      const msg = app().querySelector(`.jr-msg[data-for="${b.dataset.join}"]`);
      b.disabled = true;
      const r = await api("joinRequest", { teamId: b.dataset.join, message: msg ? msg.value : "" });
      if (!r.ok) { b.disabled = false; return showMsg($("tjMsg"), "err", errText(r.error)); }
      await viewMy(true); showMsg($("tjMsg"), "ok", T("합류 신청을 보냈어요. 팀장이 수락하면 팀에 들어가요.", "Request sent. You'll join once the lead accepts.", "Đã gửi yêu cầu. Bạn sẽ vào đội khi trưởng nhóm chấp nhận."));
    });
    app().querySelectorAll("[data-cancel]").forEach(b => b.onclick = async () => { await api("joinCancel", { teamId: b.dataset.cancel }); viewMy(true); });
  }

  function renderTeam() {
    const tm = D.team, latest = {}, isLead = tm.leaderUid === ME.uid; D.files.forEach(f => { if (!latest[f.stage]) latest[f.stage] = f; });
    $("view").innerHTML = (isLead ? `<div class="panel" data-sec="team"><h2>${T("합류 신청", "Join requests", "Yêu cầu tham gia")}${D.incoming.length ? ` <span class="cnt-b">${D.incoming.length}</span>` : ""}</h2>
      ${D.incoming.length ? `<ul class="req-list">${D.incoming.map(r => `<li><div><b>${esc(r.name)}</b> <span class="muted sm">${esc(r.nameEn)} · ${esc(r.school)}</span>${r.message ? `<p class="sm">${esc(r.message)}</p>` : ""}</div>
        <div class="actions"><button class="btn btn-sm btn-pri" type="button" data-acc="${r.id}">${T("수락", "Accept", "Chấp nhận")}</button><button class="btn btn-sm btn-line" type="button" data-dec="${r.id}">${T("거절", "Decline", "Từ chối")}</button></div></li>`).join("")}</ul>`
        : `<p class="empty">${T("아직 들어온 신청이 없어요. 팀원들에게 '모집 중인 팀'에서 우리 팀을 찾아 신청하라고 알려 주세요.", "No requests yet. Ask teammates to find your team under 'Teams looking for members'.", "Chưa có yêu cầu. Hãy nhờ đồng đội tìm đội bạn trong mục 'Đội đang tuyển'.")}</p>`}
      <div class="msg" id="rqMsg" role="status" tabindex="-1"></div></div>` : "") + `
    <div class="panel" data-sec="team"><div class="team-head"><div><h2>${esc(tm.teamName)}</h2><p class="desc" style="margin:2px 0 0">${esc(tm.title)}</p></div>
        ${isLead ? `<button class="linkish" type="button" id="tEditBtn">${T("팀 정보 수정", "Edit", "Sửa")}</button>` : ""}</div>
      <form id="tEdit" hidden novalidate class="grid2" style="margin-top:14px">
        <div class="field"><label for="eName">${T("팀 이름", "Team name", "Tên đội")}</label><input id="eName" type="text" maxlength="60" value="${esc(tm.teamName)}"></div>
        <div class="field"><label for="eTitle">${T("프로젝트 제목", "Project title", "Tên dự án")}</label><input id="eTitle" type="text" maxlength="120" value="${esc(tm.title)}"></div>
        <div class="actions full"><button class="btn btn-pri" type="submit">${T("저장", "Save", "Lưu")}</button></div></form>
      <p class="sm muted" style="margin-top:14px">${T(`팀원 ${tm.members.length}/${D.teamMax}명`, `${tm.members.length}/${D.teamMax} members`, `${tm.members.length}/${D.teamMax} thành viên`)}</p>
      <ul class="members-list">${tm.members.map(m => `<li><span class="av">${esc((m.nameEn || m.name).slice(0, 1))}</span><span><b>${esc(m.name)}</b>${m.uid === tm.leaderUid ? ` <span class="role-chip" data-r="participant">${T("팀장", "Lead", "Trưởng nhóm")}</span>` : ""}<br><span class="muted sm">${esc(m.nameEn)} · ${esc(m.school)}</span></span></li>`).join("")}</ul>
      <div class="msg" id="tMsg" role="status" tabindex="-1"></div></div>
    <form class="panel" id="up" data-sec="sub" novalidate><h2>${T("결과물 올리기", "Upload your work", "Nộp bài")}</h2>
      <p class="desc">${T("팀원 누구나 올릴 수 있어요. 다시 올리면 이전 것도 남고, 단계별로 가장 마지막 것이 심사 대상이에요.", "Any member can upload. Earlier uploads are kept; the latest per stage is judged.", "Thành viên nào cũng nộp được. Bản cũ vẫn lưu; bản mới nhất mỗi giai đoạn sẽ được chấm.")}</p>
      <div class="field"><span class="lbl">${T("단계", "Stage", "Giai đoạn")}</span><div class="radio-row">${C.STAGES.map((s, i) => `<label><input type="radio" name="stage" value="${s.id}"${i === 0 ? " checked" : ""}>${esc(t(s))}${latest[s.id] ? " ✓" : ""}</label>`).join("")}</div></div>
      <div class="field" style="margin-top:16px"><span class="lbl">${T("올리는 방법", "How", "Cách nộp")}</span><div class="radio-row">
        <label><input type="radio" name="kind" value="file" checked>${T("파일", "File", "Tệp")}</label><label><input type="radio" name="kind" value="link">${T("링크", "Link", "Liên kết")}</label></div></div>
      <div class="field" id="fileBox" style="margin-top:16px"><div class="file"><input type="file" id="file" accept=".pdf,.ppt,.pptx,.key,.zip,.hwp,.docx,.mp4,.mov"><span class="st" id="fileSt">PDF · PPT · ZIP · ${C.MAX_FILE_MB}MB ${T("이하", "max", "tối đa")}</span></div>
        <span class="hint">${T("영상이나 큰 파일은 유튜브(일부 공개)·구글 드라이브·깃허브 링크로 올려 주세요.", "For videos or large files, share a YouTube (unlisted), Google Drive or GitHub link.", "Video hoặc tệp lớn: gửi liên kết YouTube (không công khai), Google Drive hoặc GitHub.")}</span></div>
      <div class="field" id="linkBox" style="margin-top:16px" hidden><label for="link">${T("링크 주소", "Link", "Liên kết")}</label><input type="text" id="link" placeholder="https://"></div>
      <div class="actions" style="margin-top:18px"><button class="btn btn-pri" type="submit" id="upBtn">${T("올리기", "Upload", "Nộp")}</button></div>
      <div class="msg" id="upMsg" role="status" tabindex="-1"></div></form>
    <div class="panel" data-sec="sub"><h2>${T("제출 내역", "Submitted", "Đã nộp")}</h2>
      ${D.files.length ? `<p class="desc">${T("★ 표시가 단계별 심사 대상이에요.", "★ marks what is judged for each stage.", "★ là bản được chấm của mỗi giai đoạn.")}</p><ul class="sub-list">${D.files.map(f =>
        `<li><span>${latest[f.stage] === f ? "★ " : ""}<b>${esc(stageName(f.stage))}</b> · ${fileLink(f)}</span><span class="when">${esc(f.by)} · ${when(f.at)}</span></li>`).join("")}</ul>`
        : `<p class="empty">${T("아직 올린 결과물이 없어요.", "Nothing uploaded yet.", "Chưa nộp gì.")}</p>`}</div>
    <div class="panel" data-sec="team"><h2>${T("멘토링 기록", "Mentoring notes", "Ghi chú cố vấn")}</h2>
      ${D.mentoring.length ? `<ul class="notes">${D.mentoring.map(r => `<li><div class="n-meta"><b>${esc(r.date)}</b> · ${modeName(r.mode)} · ${esc(r.mentorName)}</div><p>${esc(r.content)}</p></li>`).join("")}</ul>`
        : `<p class="empty">${T("멘토가 기록을 남기면 여기에 보여요.", "Notes from mentors will appear here.", "Ghi chú của cố vấn sẽ hiện ở đây.")}</p>`}</div>
    <p class="leave" data-sec="team"><button class="linkish danger" type="button" id="leave">${T("팀 나가기", "Leave team", "Rời đội")}</button></p>`;
    $("side").innerHTML = `<div class="box"><h3>${T("단계별 마감", "Deadlines", "Hạn nộp")}</h3><dl>${C.STAGES.map(s => `<dt>${esc(t(s))}</dt><dd>${s.due ? s.due.slice(5).replace("-", ".") : T("추후 공지", "TBA", "Sẽ thông báo")}</dd>`).join("")}</dl></div>
      <div class="box"><h3>${T("알아두기", "Good to know", "Lưu ý")}</h3><ul><li>${T("올린 파일은 심사위원이 볼 수 있어요", "Judges can open your uploads", "Giám khảo xem được tệp đã nộp")}</li><li>${T("멘토링 기록은 우리 팀과 운영팀만 봐요", "Only your team and organisers see mentoring notes", "Chỉ đội bạn và BTC xem ghi chú cố vấn")}</li></ul></div>` + contactBox();

    if (isLead) $("tEditBtn").onclick = () => { $("tEdit").hidden = !$("tEdit").hidden; };
    app().querySelectorAll("[data-acc],[data-dec]").forEach(b => b.onclick = async () => {
      const r = await api("joinDecide", { id: b.dataset.acc || b.dataset.dec, accept: !!b.dataset.acc });
      if (!r.ok) return showMsg($("rqMsg"), "err", errText(r.error));
      viewMy(true);
    });
    $("tEdit").onsubmit = async ev => {
      ev.preventDefault();
      const r = await api("teamEdit", { teamName: $("eName").value, title: $("eTitle").value });
      if (!r.ok) return showMsg($("tMsg"), "err", errText(r.error));
      viewMy(true);
    };
    $("leave").onclick = async () => {
      if (!leaveArmed) { leaveArmed = true; $("leave").textContent = T("한 번 더 누르면 팀에서 나가요", "Click again to leave", "Bấm lần nữa để rời đội"); setTimeout(() => { leaveArmed = false; const b = $("leave"); if (b) b.textContent = T("팀 나가기", "Leave team", "Rời đội"); }, 4000); return; }
      leaveArmed = false; const r = await api("teamLeave"); if (r.ok) viewMy(true);
    };
    const f = $("up"), syncKind = () => {
      const st = C.STAGES.find(s => s.id === f.stage.value), linkOnly = st && st.linkOnly;
      f.querySelector("[name=kind][value=file]").disabled = !!linkOnly;
      if (linkOnly) f.querySelector("[name=kind][value=link]").checked = true;
      const isLink = f.kind.value === "link"; $("fileBox").hidden = isLink; $("linkBox").hidden = !isLink;
    };
    f.querySelectorAll("[name=stage],[name=kind]").forEach(x => x.onchange = syncKind); syncKind();
    $("file").onchange = () => { const x = $("file").files[0]; $("fileSt").textContent = x ? `${x.name} · ${(x.size / 1048576).toFixed(1)}MB` : ""; };
    f.onsubmit = async ev => {
      ev.preventDefault();
      const m = $("upMsg"), p = { stage: f.stage.value };
      if (f.kind.value === "link") { p.link = $("link").value.trim(); if (!/^https?:\/\//i.test(p.link)) { $("link").focus(); return showMsg(m, "err", errText("bad_link")); } }
      else {
        const x = $("file").files[0]; if (!x) return showMsg(m, "err", T("올릴 파일을 골라 주세요.", "Choose a file.", "Hãy chọn tệp."));
        if (x.size > C.MAX_FILE_MB * 1048576) return showMsg(m, "err", errText("too_big"));
        p.fileName = x.name; p.mime = x.type; p.data = await readFile(x);
      }
      $("upBtn").disabled = true; showMsg(m, "ok", T("올리는 중이에요…", "Uploading…", "Đang tải lên…"));
      const r = await api("upload", p);
      if (!r.ok) { $("upBtn").disabled = false; return showMsg(m, "err", errText(r.error)); }
      D.files = r.files; const keep = p.stage; renderTeam(); $("view").querySelectorAll("[data-sec]").forEach(el => el.hidden = el.dataset.sec !== "sub");
      $("up").stage.value = keep; showMsg($("upMsg"), "ok", T(`${stageName(keep)} 올렸어요.`, `${stageName(keep)} uploaded.`, `Đã nộp ${stageName(keep)}.`));
    };
  }

  const teamBtns = (list, done) => `<div class="team-list" role="group">${list.map(tm => `<button type="button" data-id="${tm.teamId}" aria-pressed="${sel === tm.teamId}" class="${done(tm.teamId) ? "done" : ""}">${esc(tm.teamName)}</button>`).join("")}</div>`;
  const bindTeams = fn => app().querySelectorAll(".team-list button").forEach(b => b.onclick = () => { sel = b.dataset.id; fn(); });
  const membersLine = tm => tm.members.map(m => `${esc(m.nameEn || m.name)} <span class="muted">(${esc(m.school)})</span>`).join(", ");

  function renderMentor() {
    const tn = id => (D.teams.find(x => x.teamId === id) || {}).teamName || id, tm = D.teams.find(x => x.teamId === sel);
    const recs = D.records.filter(r => !sel || r.teamId === sel), today = new Date().toISOString().slice(0, 10);
    $("view").innerHTML = D.teams.length ? `<form class="panel" id="mf" novalidate><h2>${T("멘토링 기록하기", "Log a session", "Ghi lại buổi cố vấn")}</h2>
      <p class="desc">${T("팀을 고르세요. 기록은 그 팀과 운영팀이 볼 수 있어요.", "Pick a team. The team and organisers can read your notes.", "Chọn đội. Đội và BTC có thể đọc ghi chú.")}</p>
      ${teamBtns(D.teams, id => D.records.some(r => r.teamId === id))}
      ${tm ? `<div class="sel-box"><p class="sel-title"><b>${esc(tm.teamName)}</b> · ${esc(tm.title)}</p><p class="sm">${membersLine(tm)}</p></div>
      <div class="grid2"><div class="field"><label for="mdate">${T("날짜", "Date", "Ngày")}</label><input type="date" id="mdate" value="${today}"></div>
        <div class="field"><span class="lbl">${T("방식", "Format", "Hình thức")}</span><div class="radio-row"><label><input type="radio" name="mode" value="online" checked>${modeName("online")}</label><label><input type="radio" name="mode" value="offline">${modeName("offline")}</label></div></div>
        <div class="field full"><label for="mtext">${T("멘토링 내용", "Notes", "Nội dung")}</label><textarea id="mtext" rows="5" maxlength="3000" placeholder="${T("논의한 내용, 조언, 다음까지 해 올 것", "What you discussed, advice, next steps", "Nội dung, góp ý, việc tiếp theo")}"></textarea></div></div>
      <div class="actions" style="margin-top:16px"><button class="btn btn-pri" type="submit" id="mBtn">${T("기록 저장", "Save note", "Lưu ghi chú")}</button></div>` : ""}
      <div class="msg" id="mMsg" role="status" tabindex="-1"></div></form>
      <div class="panel"><h2>${sel ? T(`${esc(tn(sel))} 기록`, `Notes for ${esc(tn(sel))}`, `Ghi chú cho ${esc(tn(sel))}`) : T("내 기록", "My notes", "Ghi chú của tôi")}</h2>
      ${recs.length ? `<ul class="notes">${recs.map(r => `<li><div class="n-meta"><b>${esc(r.date)}</b> · ${modeName(r.mode)} · ${esc(tn(r.teamId))}</div><p>${esc(r.content)}</p></li>`).join("")}</ul>` : `<p class="empty">${T("아직 기록이 없어요.", "No notes yet.", "Chưa có ghi chú.")}</p>`}</div>`
      : `<div class="panel"><p class="empty">${T("아직 만들어진 팀이 없어요. 팀이 생기면 여기에 보여요.", "No teams yet.", "Chưa có đội nào.")}</p></div>`;
    $("side").innerHTML = `<div class="box"><h3>${T("기록 팁", "Tips", "Gợi ý")}</h3><ul><li>${T("만날 때마다 한 건씩", "One note per session", "Mỗi buổi một ghi chú")}</li><li>${T("팀이 다음에 할 일을 적어 두기", "Note the team's next steps", "Ghi việc tiếp theo của đội")}</li></ul></div>` + contactBox();
    bindTeams(renderMentor);
    const f = $("mf"); if (!f || !tm) return;
    f.onsubmit = async ev => {
      ev.preventDefault();
      const content = $("mtext").value.trim(); if (!content) { $("mtext").focus(); return showMsg($("mMsg"), "err", T("멘토링 내용을 적어 주세요.", "Write your notes.", "Hãy nhập nội dung.")); }
      $("mBtn").disabled = true;
      const r = await api("mentorSave", { teamId: sel, date: $("mdate").value, mode: f.mode.value, content });
      if (!r.ok) { $("mBtn").disabled = false; return showMsg($("mMsg"), "err", errText(r.error)); }
      D.records = r.records; renderMentor(); showMsg($("mMsg"), "ok", T("저장했어요.", "Saved.", "Đã lưu."));
    };
  }

  function renderJudge() {
    const tm = D.teams.find(x => x.teamId === sel), s = (sel && D.scores[sel]) || { scores: {}, comment: "" }, max = C.CRITERIA.reduce((a, c) => a + c.max, 0);
    $("view").innerHTML = D.teams.length ? `<form class="panel" id="sf" novalidate><h2>${T("점수 입력", "Scoring", "Chấm điểm")}</h2>
      <p class="desc">${T("팀을 고르세요. ✓는 이미 저장한 팀이에요.", "Pick a team. ✓ means saved.", "Chọn đội. ✓ là đã lưu.")}</p>
      ${teamBtns(D.teams, id => !!D.scores[id])}
      ${tm ? `<div class="sel-box"><p class="sel-title"><b>${esc(tm.teamName)}</b> · ${esc(tm.title)}</p><p class="sm" style="margin-bottom:10px">${membersLine(tm)}</p>
        <ul class="files-mini">${C.STAGES.map(st => `<li><span>${esc(t(st))}</span>${tm.files[st.id] ? fileLink(tm.files[st.id]) : `<span class="muted">${T("미제출", "Not submitted", "Chưa nộp")}</span>`}</li>`).join("")}</ul></div>
      <table class="score-table"><thead><tr><th>${T("항목", "Criterion", "Tiêu chí")}</th><th>${T("점수", "Score", "Điểm")}</th><th></th></tr></thead><tbody>${C.CRITERIA.map((c, i) => `${i === 0 || C.CRITERIA[i - 1].g !== c.g ? `<tr class="g-row"><td colspan="3">${esc(t(C.CRITERIA_GROUPS.find(g => g.id === c.g)))} (${C.CRITERIA_GROUPS.find(g => g.id === c.g).max})</td></tr>` : ""}<tr><th scope="row"><div>${esc(t(c))}</div><div class="muted" style="font-weight:400;font-size:13px">${esc(t(c, "d"))}</div></th>
        <td><input type="number" min="0" max="${c.max}" step="1" inputmode="numeric" data-id="${c.id}" value="${s.scores[c.id] ?? ""}" aria-label="${esc(t(c))}"></td><td class="max">/ ${c.max}</td></tr>`).join("")}</tbody></table>
      <div class="total"><span>${T("합계", "Total", "Tổng")}</span><span><span id="sum">0</span> / ${max}</span></div>
      <div class="field" style="margin-top:18px"><label for="cmt">${T("의견 (선택, 운영팀만 봐요)", "Comment (optional, organisers only)", "Nhận xét (tùy chọn, chỉ BTC xem)")}</label><textarea id="cmt" rows="3" maxlength="2000">${esc(s.comment || "")}</textarea></div>
      <div class="actions" style="margin-top:16px"><button class="btn btn-pri" type="submit" id="sBtn">${T("점수 저장", "Save score", "Lưu điểm")}</button>${s.at ? `<span class="muted sm">${T("마지막 저장", "Last saved", "Lưu lần cuối")} ${when(s.at)}</span>` : ""}</div>` : ""}
      <div class="msg" id="sMsg" role="status" tabindex="-1"></div></form>`
      : `<div class="panel"><p class="empty">${T("아직 만들어진 팀이 없어요.", "No teams yet.", "Chưa có đội nào.")}</p></div>`;
    $("side").innerHTML = `<div class="box"><h3>${T("심사 기준", "Criteria", "Tiêu chí")}</h3><dl>${C.CRITERIA.map(c => `<dt>${esc(t(c))}</dt><dd>${c.max}</dd>`).join("")}</dl></div>
      <div class="box"><h3>${T("진행 방법", "How it works", "Cách chấm")}</h3><ul><li>${T("배점 안에서 정수로 입력", "Whole numbers within each maximum", "Số nguyên trong giới hạn")}</li><li>${T("저장 후에도 고칠 수 있어요", "You can edit after saving", "Có thể sửa sau khi lưu")}</li><li>${T("결과는 운영팀만 봐요", "Only organisers see results", "Chỉ BTC xem kết quả")}</li></ul></div>` + contactBox();
    bindTeams(renderJudge);
    const f = $("sf"); if (!f || !tm) return;
    const ins = [...f.querySelectorAll("input[type=number]")], sum = () => $("sum").textContent = ins.reduce((a, i) => a + (Number(i.value) || 0), 0);
    ins.forEach(i => i.oninput = sum); sum();
    f.onsubmit = async ev => {
      ev.preventDefault();
      const bad = ins.find(i => i.value === "" || +i.value < 0 || +i.value > +i.max || !Number.isInteger(+i.value));
      if (bad) { bad.focus(); return showMsg($("sMsg"), "err", errText("bad_score")); }
      $("sBtn").disabled = true;
      const scores = Object.fromEntries(ins.map(i => [i.dataset.id, Number(i.value)]));
      const r = await api("scoreSave", { teamId: sel, scores, comment: $("cmt").value });
      if (!r.ok) { $("sBtn").disabled = false; return showMsg($("sMsg"), "err", errText(r.error)); }
      D.scores[sel] = { scores, comment: $("cmt").value, at: new Date().toISOString() };
      renderJudge(); showMsg($("sMsg"), "ok", T(`저장했어요. 합계 ${r.total}점`, `Saved. Total ${r.total}`, `Đã lưu. Tổng ${r.total}`));
    };
  }

  /* ---------- 운영 관리 ---------- */
  let A = null, tab = "approve", filter = "pending";
  async function viewAdmin(reload) {
    if (!Session.get()) { location.hash = "#/login"; return; }
    if (reload || !A) {
      app().innerHTML = `<div class="card pad"><p class="muted">${T("불러오는 중…", "Loading…", "Đang tải…")}</p></div>`;
      const me = await api("me"); if (!me.ok) { location.hash = "#/login"; return; }
      if (me.user.role !== "admin") { location.hash = "#/my"; return; }
      const r = await api("dash"); if (!r.ok) return;
      A = r;
    }
    const pend = A.users.filter(u => u.status === "pending").length, n = (r, s) => A.users.filter(x => x.role === r && x.status === s).length;
    app().innerHTML = `<div class="page-head card"><span class="tag">${T("운영팀 전용", "Organisers only", "Chỉ ban tổ chức")}</span>
      <h1>${T("운영 관리", "Admin", "Quản trị")}</h1><p>${T("신청 승인, 팀·제출, 멘토링, 심사 결과를 봐요. 심사 결과는 이 화면에서만 보여요.", "Approve applications and follow teams, uploads, mentoring and results. Results are shown only here.", "Duyệt đơn, theo dõi đội, bài nộp, cố vấn và kết quả. Kết quả chỉ hiển thị tại đây.")}</p></div>
      <div class="stats stats4">${[[T("승인 대기", "Pending", "Chờ duyệt"), pend], [T("팀", "Teams", "Đội"), A.teams.length], [T("참가 학생", "Students", "Sinh viên"), n("participant", "approved")], [T("멘토 · 심사위원", "Mentors · judges", "Cố vấn · GK"), n("mentor", "approved") + n("judge", "approved")]]
        .map(([k, v]) => `<div class="card"><small>${k}</small><b>${v}</b></div>`).join("")}</div>
      <div class="admin-body"><div class="tabs" role="tablist">${[["approve", T("신청·승인", "Applications", "Đơn đăng ký"), pend], ["teams", T("팀·제출", "Teams & uploads", "Đội & bài nộp")], ["mentoring", T("멘토링 기록", "Mentoring", "Cố vấn")], ["results", T("심사 결과", "Results", "Kết quả")]]
        .map(([k, l, c]) => `<button role="tab" data-tab="${k}" aria-selected="${tab === k}">${l}${c ? ` <b class="cnt">${c}</b>` : ""}</button>`).join("")}</div>
      <div class="panel" id="pane" role="tabpanel"></div></div>`;
    app().querySelectorAll("[role=tab]").forEach(b => b.onclick = () => { tab = b.dataset.tab; viewAdmin(false); });
    ({ approve: paneApprove, teams: paneTeams, mentoring: paneMentoring, results: paneResults })[tab]();
  }
  const teamOf = id => A.teams.find(t => t.teamId === id);
  function paneApprove() {
    const F = [["pending", T("대기 중", "Pending", "Chờ duyệt")], ["all", T("전체", "All", "Tất cả")], ["participant", T("학생", "Students", "Sinh viên")], ["mentor", T("멘토", "Mentors", "Cố vấn")], ["judge", T("심사위원", "Judges", "Giám khảo")]];
    const rows = A.users.filter(u => u.role !== "admin").filter(u => filter === "all" ? true : filter === "pending" ? u.status === "pending" : u.role === filter)
      .sort((a, b) => (b.status === "pending") - (a.status === "pending") || (a.createdAt < b.createdAt ? 1 : -1));
    $("pane").innerHTML = `<div class="chips">${F.map(([k, l]) => `<button type="button" data-f="${k}" aria-pressed="${filter === k}">${l}</button>`).join("")}</div>
    ${rows.length ? `<div class="tbl-wrap"><table class="adm"><thead><tr><th>${T("역할", "Role", "Vai trò")}</th><th>${T("이름", "Name", "Họ tên")}</th><th>${T("학교·소속", "University", "Trường")}</th><th>${T("이메일", "Email", "Email")}</th><th>${T("팀", "Team", "Đội")}</th><th>${T("신청일", "Applied", "Ngày")}</th><th>${T("상태", "Status", "Trạng thái")}</th><th></th></tr></thead><tbody>
      ${rows.map(u => `<tr><td><span class="role-chip" data-r="${u.role}">${T(...ROLE[u.role])}</span></td>
        <td><b>${esc(u.name)}</b>${u.nameEn ? `<div class="muted sm">${esc(u.nameEn)}</div>` : ""}${u.interest ? `<div class="muted sm">${T(...(INTEREST[u.interest] || [u.interest, u.interest, u.interest]))}</div>` : ""}</td>
        <td>${esc(u.school)}</td><td class="sm">${esc(u.email)}</td><td class="sm">${u.teamId && teamOf(u.teamId) ? esc(teamOf(u.teamId).teamName) : "–"}</td><td class="sm">${day(u.createdAt)}</td>
        <td><span class="badge-st" data-k="${u.status}">${T(...STAT[u.status])}</span></td>
        <td class="act">${u.status !== "approved" ? `<button type="button" class="btn-s ok" data-uid="${u.uid}" data-s="approved">${T("승인", "Approve", "Duyệt")}</button>` : ""}${u.status === "pending" ? `<button type="button" class="btn-s" data-uid="${u.uid}" data-s="rejected">${T("반려", "Reject", "Từ chối")}</button>` : ""}${u.status !== "pending" ? `<button type="button" class="btn-s ghost" data-uid="${u.uid}" data-s="pending">${T("대기로", "Undo", "Hoàn tác")}</button>` : ""}</td></tr>`).join("")}
      </tbody></table></div>` : `<p class="empty">${filter === "pending" ? T("기다리는 신청이 없어요.", "No pending applications.", "Không có đơn chờ duyệt.") : T("해당하는 사람이 없어요.", "Nothing here.", "Không có mục nào.")}</p>`}
    <div class="msg" id="aMsg" role="status" tabindex="-1"></div>`;
    $("pane").querySelectorAll(".chips button").forEach(b => b.onclick = () => { filter = b.dataset.f; paneApprove(); });
    $("pane").querySelectorAll(".btn-s").forEach(b => b.onclick = async () => {
      $("pane").querySelectorAll(".btn-s").forEach(x => x.disabled = true);
      const r = await api("setStatus", { uid: b.dataset.uid, status: b.dataset.s });
      if (!r.ok) { $("pane").querySelectorAll(".btn-s").forEach(x => x.disabled = false); return showMsg($("aMsg"), "err", errText(r.error)); }
      viewAdmin(true);
    });
  }
  function paneTeams() {
    const latest = id => { const o = {}; A.files.filter(f => f.teamId === id).forEach(f => { if (!o[f.stage]) o[f.stage] = f; }); return o; };
    $("pane").innerHTML = A.teams.length ? `<div class="tbl-wrap"><table class="adm"><thead><tr><th>${T("팀", "Team", "Đội")}</th><th>${T("팀원", "Members", "Thành viên")}</th>${C.STAGES.map(s => `<th>${esc(t(s))}</th>`).join("")}<th class="n">${T("멘토링", "Mentoring", "Cố vấn")}</th></tr></thead><tbody>
      ${A.teams.map(tm => { const f = latest(tm.teamId); return `<tr><td><b>${esc(tm.teamName)}</b><div class="muted sm">${esc(tm.title)}</div></td>
        <td class="sm">${tm.members.map(m => `${esc(m.name)} <span class="muted">${esc(m.school)}</span>`).join("<br>")}</td>
        ${C.STAGES.map(s => `<td class="sm">${f[s.id] ? `✓ ${fileLink(f[s.id])}<div class="muted">${day(f[s.id].at)}</div>` : `<span class="muted">–</span>`}</td>`).join("")}
        <td class="n">${A.mentoring.filter(m => m.teamId === tm.teamId).length}</td></tr>`; }).join("")}</tbody></table></div>`
      : `<p class="empty">${T("아직 만들어진 팀이 없어요.", "No teams yet.", "Chưa có đội nào.")}</p>`;
  }
  function paneMentoring() {
    const ids = [...new Set(A.mentoring.map(m => m.teamId))];
    $("pane").innerHTML = ids.length ? ids.map(id => `<h3 class="grp">${esc((teamOf(id) || {}).teamName || id)}</h3><ul class="notes">${A.mentoring.filter(m => m.teamId === id).map(r => `<li><div class="n-meta"><b>${esc(r.date)}</b> · ${modeName(r.mode)} · ${esc(r.mentorName)}</div><p>${esc(r.content)}</p></li>`).join("")}</ul>`).join("")
      : `<p class="empty">${T("아직 멘토링 기록이 없어요.", "No mentoring notes yet.", "Chưa có ghi chú cố vấn.")}</p>`;
  }
  function paneResults() {
    const R = A.results, fx = v => v == null ? "–" : String(Math.round(v * 100) / 100);
    $("pane").innerHTML = `<div class="notice" style="margin:0 0 16px"><span aria-hidden="true">●</span><span>${T("비공개 — 운영팀만 볼 수 있어요. 순위는 심사위원 합계 점수의 평균이에요.", "Private — organisers only. Ranked by the average of judges' totals.", "Riêng tư — chỉ BTC. Xếp hạng theo trung bình tổng điểm của giám khảo.")}</span></div>
    ${R.length ? `<div class="tbl-wrap"><table class="adm"><thead><tr><th>#</th><th>${T("팀", "Team", "Đội")}</th>${C.CRITERIA.map(c => `<th class="n">${esc(t(c))}<div class="muted">/${c.max}</div></th>`).join("")}<th class="n">${T("평균", "Avg", "TB")}</th><th class="n">${T("심사 수", "Judges", "Số GK")}</th></tr></thead><tbody>
      ${R.map((x, i) => `<tr><td>${x.avg == null ? "–" : i + 1}</td><td><b>${esc(x.teamName)}</b><div class="muted sm">${esc(x.title)}</div>
        ${x.detail.length ? `<details class="mem"><summary>${T("심사위원별", "By judge", "Theo giám khảo")}</summary>${x.detail.map(d => `${esc(d.judge)} · <b>${d.total}</b>${d.comment ? `<div class="muted">${esc(d.comment)}</div>` : ""}`).join("<br>")}</details>` : ""}</td>
        ${C.CRITERIA.map(c => `<td class="n">${fx(x.per[c.id])}</td>`).join("")}<td class="n"><b>${fx(x.avg)}</b></td><td class="n">${x.judges}</td></tr>`).join("")}</tbody></table></div>`
      : `<p class="empty">${T("팀이 생기고 점수가 들어오면 여기에 쌓여요.", "Results appear once teams are scored.", "Kết quả sẽ hiện khi các đội được chấm.")}</p>`}`;
  }


  /* ---------- 게시판 (문의) — 글 + 댓글 ---------- */
  let BOARD = null, bq = "";
  const ago = s => { const m = Math.round((Date.now() - new Date(s)) / 60000);
    if (m < 60) return T(`${Math.max(1, m)}분 전`, `${Math.max(1, m)} min ago`, `${Math.max(1, m)} phút trước`);
    const h = Math.round(m / 60); if (h < 24) return T(`${h}시간 전`, `${h} h ago`, `${h} giờ trước`);
    const d = Math.round(h / 24); return T(`${d}일 전`, `${d} days ago`, `${d} ngày trước`); };
  /* 운영팀은 정해진 프로필 이미지(assets/admin-avatar.svg), 나머지는 이름 첫 글자 */
  const av = (name, staff) => staff ? `<span class="b-av staff"><img src="assets/admin-avatar.svg" alt=""></span>` : `<span class="b-av">${esc((name || "?").charAt(0))}</span>`;
  const icoCmt = `<svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 3h11v8h-6l-3 2.5V11h-2z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>`;
  const boardHead = () => heroHTML(T("문의", "Questions", "Hỏi đáp"), T("게시판", "Board", "Bảng tin"),
    T("대회 관련 질문을 올리면 운영팀이 댓글로 답해요.", "Post a question and the organisers reply in the comments.", "Đăng câu hỏi, ban tổ chức sẽ trả lời bằng bình luận."));
  async function viewBoard(reload) {
    const id = (location.hash.split("/")[2] || "").split("?")[0];
    if (id) return viewPost(id);
    if (reload || !BOARD) { app().innerHTML = `<div class="card pad"><p class="muted">${T("불러오는 중…", "Loading…", "Đang tải…")}</p></div>`; const r = await api("boardList"); BOARD = r.ok ? r.posts : []; }
    const logged = !!Session.get(), list = BOARD.filter(x => !bq || x.title.toLowerCase().includes(bq.toLowerCase()));
    app().innerHTML = boardHead() + `<div class="panel board">
      <div class="b-top"><h2>${T("게시판", "Board", "Bảng tin")} <span class="b-cnt">${BOARD.length}</span></h2>
        ${logged ? `<a class="btn btn-sm btn-pri" href="#/board/new">${T("글쓰기", "New post", "Viết bài")}</a>` : `<a class="btn btn-sm btn-line" href="#/login">${T("로그인하고 글쓰기", "Log in to post", "Đăng nhập để viết")}</a>`}</div>
      <input type="search" id="bSearch" class="b-search" placeholder="${T("게시글 검색…", "Search posts…", "Tìm bài viết…")}" value="${esc(bq)}">
      ${list.length ? `<ul class="b-list">${list.map(x => `<li class="${x.notice ? "is-notice" : ""}"><a href="#/board/${x.id}">${av(x.author, x.notice)}<div class="b-main">
          <div class="b-tags">${x.notice ? `<span class="tag-notice">${T("공지", "Notice", "Thông báo")}</span>` : `<span class="tag-gen">${T("일반", "General", "Chung")}</span>`}</div>
          <b>${esc(x.title)}</b><span class="b-meta">${esc(x.author)} · ${ago(x.at)} <span class="b-c">${icoCmt} ${x.comments}</span></span></div></a></li>`).join("")}</ul>`
        : `<p class="empty">${bq ? T("검색 결과가 없어요.", "No matching posts.", "Không có kết quả.") : T("아직 올라온 글이 없어요.", "No posts yet.", "Chưa có bài viết.")}</p>`}
    </div>`;
    const sb = $("bSearch"); sb.oninput = () => { bq = sb.value; const pos = sb.selectionStart; viewBoard(false); const n = $("bSearch"); n.focus(); n.setSelectionRange(pos, pos); };
  }
  async function viewPost(id) {
    const logged = !!Session.get();
    if (id === "new") {
      if (!logged) { location.hash = "#/login"; return; }
      app().innerHTML = boardHead() + `<form class="panel" id="bf" novalidate><h2>${T("글쓰기", "New post", "Viết bài")}</h2>
        <div class="field"><label for="bTitle">${T("제목", "Title", "Tiêu đề")}</label><input id="bTitle" type="text" maxlength="100"></div>
        <div class="field" style="margin-top:12px"><label for="bBody">${T("내용", "Content", "Nội dung")}</label><textarea id="bBody" rows="6" maxlength="3000"></textarea>
          <span class="hint">${T("게시판 글은 누구나 볼 수 있어요. 이메일 같은 개인정보는 적지 마세요.", "Posts are public. Don't include personal details such as your email.", "Bài viết công khai. Đừng ghi thông tin cá nhân như email.")}</span></div>
        <div class="actions" style="margin-top:14px"><button class="btn btn-pri" type="submit" id="bBtn">${T("등록", "Post", "Đăng")}</button><a class="btn btn-line" href="#/board">${T("취소", "Cancel", "Hủy")}</a></div>
        <div class="msg" id="bMsg" role="status" tabindex="-1"></div></form>`;
      $("bf").onsubmit = async ev => {
        ev.preventDefault();
        if (!$("bTitle").value.trim() || !$("bBody").value.trim()) return showMsg($("bMsg"), "err", T("제목과 내용을 적어 주세요.", "Enter a title and content.", "Nhập tiêu đề và nội dung."));
        $("bBtn").disabled = true;
        const r = await api("boardPost", { title: $("bTitle").value, body: $("bBody").value });
        if (!r.ok) { $("bBtn").disabled = false; return showMsg($("bMsg"), "err", errText(r.error)); }
        BOARD = null; location.hash = "#/board/" + r.id;
      };
      return;
    }
    app().innerHTML = `<div class="card pad"><p class="muted">${T("불러오는 중…", "Loading…", "Đang tải…")}</p></div>`;
    const r = await api("boardGet", { id });
    if (!r.ok) { app().innerHTML = boardHead() + `<div class="panel"><p class="empty">${T("글을 찾지 못했어요.", "Post not found.", "Không tìm thấy bài viết.")}</p><a class="linkish" href="#/board">${T("목록으로", "Back to list", "Về danh sách")}</a></div>`; return; }
    renderPost(r.post);
  }
  function renderPost(x) {
    const logged = !!Session.get();
    app().innerHTML = `<div class="panel post">
      <a class="linkish back" href="#/board">← ${T("목록", "All posts", "Danh sách")}</a>
      <div class="b-tags" style="margin-top:14px">${x.notice ? `<span class="tag-notice">${T("공지", "Notice", "Thông báo")}</span>` : `<span class="tag-gen">${T("일반", "General", "Chung")}</span>`}</div>
      <h1 class="post-t">${esc(x.title)}</h1>
      <div class="post-by">${av(x.author, x.notice)}<span><b>${esc(x.author)}</b><span class="b-meta">${when(x.at)}</span></span>
        ${x.mine ? `<button class="linkish quiet" type="button" id="pDel">${T("삭제", "Delete", "Xóa")}</button>` : ""}</div>
      <div class="post-body">${esc(x.body)}</div>
      <h2 class="c-h">${T("댓글", "Comments", "Bình luận")} ${x.comments.length}</h2>
      <ul class="c-list">${x.comments.map(c => `<li>${av(c.author, c.staff)}<div><span class="c-by"><b>${esc(c.author)}</b> <span class="b-meta">${ago(c.at)}</span>
        ${c.mine ? `<button class="linkish quiet" type="button" data-cdel="${c.id}">${T("삭제", "Delete", "Xóa")}</button>` : ""}</span><p>${esc(c.body)}</p></div></li>`).join("")}</ul>
      ${logged ? `<form id="cf" class="c-form" novalidate><textarea id="cBody" rows="2" maxlength="2000" placeholder="${T("댓글을 입력하세요", "Write a comment", "Viết bình luận")}"></textarea><button class="btn btn-pri btn-sm" type="submit">${T("등록", "Post", "Đăng")}</button></form>`
        : `<p class="muted sm"><a class="linkish" href="#/login">${T("로그인", "Log in", "Đăng nhập")}</a> ${T("하면 댓글을 달 수 있어요.", "to comment.", "để bình luận.")}</p>`}
      <div class="msg" id="cMsg" role="status" tabindex="-1"></div></div>`;
    const cf = $("cf");
    if (cf) cf.onsubmit = async ev => {
      ev.preventDefault();
      if (!$("cBody").value.trim()) return $("cBody").focus();
      const r = await api("boardComment", { id: x.id, body: $("cBody").value });
      if (!r.ok) return showMsg($("cMsg"), "err", errText(r.error));
      BOARD = null; renderPost(r.post);
    };
    app().querySelectorAll("[data-cdel]").forEach(b => b.onclick = async () => { const r = await api("commentDelete", { id: b.dataset.cdel }); if (r.ok) { BOARD = null; renderPost(r.post); } });
    const pd = $("pDel"); if (pd) pd.onclick = async () => { const r = await api("boardDelete", { id: x.id }); if (r.ok) { BOARD = null; location.hash = "#/board"; } };
  }

  /* ---------- 라우터 ---------- */
  const VIEWS = { apply: () => { applyState.done = null; viewApply(); if (window.maybeGuide) window.maybeGuide(); }, login: viewLogin, my: () => viewMy(true, "team"), team: () => viewMy(true, "team"), submit: () => viewMy(true, "submit"), admin: () => viewAdmin(true), board: () => viewBoard(true) };
  const RERENDER = { apply: viewApply, login: viewLogin, my: () => ME && D ? viewMy(false) : viewMy(true), team: () => ME && D ? viewMy(false, "team") : viewMy(true, "team"), submit: () => ME && D ? viewMy(false, "submit") : viewMy(true, "submit"), admin: () => A ? viewAdmin(false) : viewAdmin(true), board: () => viewBoard(!BOARD) };
  let current = "";
  function route() {
    const h = location.hash, name = h.startsWith("#/") ? h.slice(2).split(/[?/]/)[0] : "";
    const isView = !!VIEWS[name];
    home().hidden = isView; app().hidden = !isView;
    const hb = document.getElementById("heroBand"); if (hb) hb.hidden = isView;
    setTimeout(syncTop, 0);
    document.body.classList.toggle("photo-top", !isView);
    syncTop();
    document.querySelectorAll("#nav a").forEach(a => a.removeAttribute("aria-current"));
    document.querySelectorAll(".side-nav .item, .stepper a").forEach(a => a.classList.remove("on"));
    if (isView) { const si = document.querySelector(`.side-nav .item[href="#/${name === "login" ? "my" : name}"]`); if (si) si.classList.add("on"); }
    current = isView ? name : "";
    if (isView) {
      const navA = document.querySelector(`#nav a[href="#/${name}"]`) || (name === "admin" ? document.querySelector('#nav a[href="#/my"]') : null);
      if (navA) navA.setAttribute("aria-current", "page");
      if (name !== "my") ME = name === "admin" ? ME : ME; // keep cache
      VIEWS[name](); window.scrollTo(0, 0);
      document.title = { apply: T("참가 신청", "Apply", "Đăng ký"), login: T("로그인", "Log in", "Đăng nhập"), my: T("내 페이지", "My page", "Trang của tôi"), team: T("팀빌딩", "Team building", "Lập đội"), submit: T("제출", "Submit", "Nộp bài"), admin: T("운영 관리", "Admin", "Quản trị"), board: T("게시판", "Q&A board", "Hỏi đáp") }[name] + " — Co-Lab 2026";
    } else {
      document.title = "Global Co-Lab 2026 — Net-Zero Hackathon";
      const id = h.replace(/^#\/?/, "");
      const el = id && document.getElementById(id);
      if (el) { const sec = el.closest(".isec"); if (sec && sec.classList.contains("closed")) sec.querySelector(".sec-head").click(); setTimeout(() => el.scrollIntoView(), 0); }
      else if (h === "#/" || h === "#" || h === "") window.scrollTo(0, 0);
    }
  }
  /* 메인 사진 위에서만 머리말을 어두운 유리로, 내려가면 흰색으로 */
  function syncTop() {
    const hero = document.getElementById("heroBand"), onHome = !home().hidden;
    document.body.classList.toggle("over-photo", !!(onHome && hero && !hero.hidden && window.scrollY < hero.offsetHeight - 70));
  }
  window.addEventListener("scroll", syncTop, { passive: true });
  window.addEventListener("hashchange", route);
  document.addEventListener("DOMContentLoaded", route);
  document.addEventListener("langchange", () => { if (current) RERENDER[current](); });
})();
