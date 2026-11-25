/* =========================================================
   핵심 처리 로직 — 브라우저(데모 모드)와 Apps Script(실제 운영)가 같은 코드를 씁니다.
   저장소(db)와 메일·파일·암호화 함수(cfg)만 바꿔 끼웁니다.
   db : { all(table) -> [row], add(table, row), patch(table, keyField, keyVal, patchObj) }
   cfg: { adminEmails, criteria{id:max}, stages[], linkOnly[], maxFileMB, teamMax,
          saveFile(teamId, stage, name, mime, b64) -> {url,size},
          sendCode(email, code, lang), hash(text) -> text, random(len, chars) -> text, exposeCode }
   로그인: 비밀번호 없이, 승인된 이메일로 6자리 인증코드를 보내 확인합니다.
   ========================================================= */
var CORE = (function () {
  var ROLES = ["participant", "judge", "mentor"];
  var STATUSES = ["pending", "approved", "rejected"];
  var CODE_MIN = 10, SESSION_DAYS = 14, MAX_TRIES = 5;

  function nowIso() { return new Date().toISOString(); }
  function later(min) { return new Date(Date.now() + min * 60000).toISOString(); }
  function str(v, max) { v = v == null ? "" : String(v).trim(); return max ? v.slice(0, max) : v; }
  function lower(v) { return str(v).toLowerCase(); }
  function err(code) { return { ok: false, error: code }; }
  function parse(s, d) { try { return s ? JSON.parse(s) : d; } catch (e) { return d; } }
  function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

  function make(db, cfg) {
    var admins = (cfg.adminEmails || []).map(lower);
    var teamMax = cfg.teamMax || 4;

    function users() { return db.all("Users"); }
    function byEmail(e) { e = lower(e); return users().filter(function (u) { return lower(u.email) === e; })[0]; }
    function byUid(id) { return users().filter(function (u) { return u.uid === id; })[0]; }
    function pubUser(u) { return { uid: u.uid, email: u.email, name: u.name, nameEn: u.nameEn, school: u.school, role: u.role, interest: u.interest, status: u.status, teamId: u.teamId, createdAt: u.createdAt, decidedAt: u.decidedAt }; }
    function members(teamId) {
      return users().filter(function (u) { return teamId && u.teamId === teamId && u.status === "approved"; })
        .map(function (u) { return { uid: u.uid, name: u.name, nameEn: u.nameEn, school: u.school, email: u.email }; });
    }
    function team(id, withCode) {
      var t = db.all("Teams").filter(function (x) { return x.teamId === id; })[0];
      if (!t) return null;
      var o = { teamId: t.teamId, teamName: t.teamName, title: t.title, leaderUid: t.leaderUid, leaderName: (byUid(t.leaderUid) || {}).name || "", members: members(t.teamId), createdAt: t.createdAt };
      return o;
    }
    function activeTeams(withCode) {
      return db.all("Teams").map(function (t) { return team(t.teamId, withCode); }).filter(function (t) { return t && t.members.length; });
    }
    function mask(n) { n = str(n); return n ? n.charAt(0) + "**" : ""; }
    /* 작성자 이름: 운영팀에게만 실제 이름·이메일, 나머지에게는 가린 이름 */
    function authorOf(uid, viewer) {
      var a = byUid(uid) || {};
      if (a.role === "admin") return "운영팀";
      return viewer && viewer.role === "admin" ? (a.name || "") + (a.email ? " · " + a.email : "") : mask(a.name);
    }
    function comments(postId, viewer) {
      return db.all("Comments").filter(function (c) { return c.postId === postId && c.status !== "deleted"; }).map(function (c) {
        var a = byUid(c.uid) || {};
        return { id: c.id, body: c.body, at: c.at, author: authorOf(c.uid, viewer), staff: a.role === "admin", mine: !!(viewer && (viewer.uid === c.uid || viewer.role === "admin")) };
      }).sort(function (x, y) { return x.at < y.at ? -1 : 1; });
    }
    function posts(viewer) {
      var cs = db.all("Comments").filter(function (c) { return c.status !== "deleted"; });
      return db.all("Posts").filter(function (x) { return x.status !== "deleted"; }).map(function (x) {
        var a = byUid(x.uid) || {};
        return { id: x.id, title: x.title, author: authorOf(x.uid, viewer), notice: a.role === "admin", at: x.at,
          comments: cs.filter(function (c) { return c.postId === x.id; }).length };
      }).sort(function (p1, p2) { return (p2.notice - p1.notice) || (p1.at < p2.at ? 1 : -1); });
    }
    function postDetail(id, viewer) {
      var x = db.all("Posts").filter(function (y) { return y.id === id && y.status !== "deleted"; })[0];
      if (!x) return null;
      var a = byUid(x.uid) || {};
      return { id: x.id, title: x.title, body: x.body, author: authorOf(x.uid, viewer), notice: a.role === "admin", at: x.at,
        mine: !!(viewer && (viewer.uid === x.uid || viewer.role === "admin")), comments: comments(x.id, viewer) };
    }
    function requests(filter) { return db.all("Requests").filter(filter); }
    /* 한 팀에 들어가면 다른 팀에 낸 합류 신청은 자동으로 닫음 */
    function closeMyRequests(uid, exceptId) {
      requests(function (r) { return r.uid === uid && r.status === "pending" && r.id !== exceptId; })
        .forEach(function (r) { db.patch("Requests", "id", r.id, { status: "cancelled", decidedAt: nowIso() }); });
    }
    function newUid() { return "u" + Date.now().toString(36) + cfg.random(4, "abcdefghijklmnopqrstuvwxyz0123456789"); }

    function filesFor(teamId) {
      return db.all("Files").filter(function (f) { return !teamId || f.teamId === teamId; })
        .map(function (f) { return { at: f.at, teamId: f.teamId, stage: f.stage, kind: f.kind, name: f.name, url: f.url, size: Number(f.size) || 0, by: (byUid(f.byUid) || {}).name || "" }; })
        .sort(function (a, b) { return a.at < b.at ? 1 : -1; });
    }
    function latestByStage(list) { var o = {}; list.forEach(function (f) { if (!o[f.stage]) o[f.stage] = f; }); return o; }
    function mentoring(filter) {
      return db.all("Mentoring").filter(filter).map(function (r) {
        return { id: r.id, at: r.at, teamId: r.teamId, mentorName: r.mentorName, mentorUid: r.mentorUid, date: r.date, mode: r.mode, content: r.content };
      }).sort(function (a, b) { return a.date === b.date ? (a.at < b.at ? 1 : -1) : (a.date < b.date ? 1 : -1); });
    }
    function results() {
      var sc = db.all("Scores"), keys = Object.keys(cfg.criteria);
      return activeTeams(false).map(function (t) {
        var rows = sc.filter(function (s) { return s.teamId === t.teamId; });
        var per = {}; keys.forEach(function (k) {
          var v = rows.map(function (r) { return Number(parse(r.scoresJson, {})[k]); }).filter(function (x) { return !isNaN(x); });
          per[k] = v.length ? v.reduce(function (a, b) { return a + b; }, 0) / v.length : null;
        });
        var tot = rows.map(function (r) { return Number(r.total); });
        return { teamId: t.teamId, teamName: t.teamName, title: t.title, judges: rows.length,
          avg: tot.length ? tot.reduce(function (a, b) { return a + b; }, 0) / tot.length : null, per: per,
          detail: rows.map(function (r) { return { judge: (byUid(r.judgeUid) || {}).name || r.judgeName, total: Number(r.total), comment: r.comment }; }) };
      }).sort(function (a, b) {
        /* 동점이면 Ⅱ 해커톤 결과 합 → 프로토타입 완성도 순 (cfg.tie) */
        var d = (b.avg == null ? -1 : b.avg) - (a.avg == null ? -1 : a.avg); if (d) return d;
        var tie = cfg.tie || {}, sum = function (x) { return (tie.group || []).reduce(function (s, k) { return s + (x.per[k] || 0); }, 0); };
        d = sum(b) - sum(a); if (d) return d;
        return (b.per[tie.last] || 0) - (a.per[tie.last] || 0);
      });
    }
    function sessionUser(token) {
      if (!token) return null;
      var h = cfg.hash("s:" + token), n = nowIso();
      var s = db.all("Sessions").filter(function (x) { return x.tokenHash === h && x.expiresAt > n; })[0];
      return s ? byUid(s.uid) : null;
    }
    function ensureAdmin(email) {
      var u = byEmail(email);
      if (u || admins.indexOf(lower(email)) < 0) return u;
      u = { uid: newUid(), email: lower(email), name: "운영팀", nameEn: "Organiser", school: "", role: "admin", interest: "", status: "approved", teamId: "", createdAt: nowIso(), decidedAt: nowIso() };
      db.add("Users", u); return u;
    }

    return function handle(action, p) {
      p = p || {};

      /* ---------- 로그인 없이 쓰는 것 ---------- */
      if (action === "apply") {
        var role = str(p.role), email = lower(p.email);
        if (ROLES.indexOf(role) < 0 || !validEmail(email) || !str(p.name) || !str(p.school)) return err("bad_input");
        if (role === "participant" && !str(p.nameEn)) return err("bad_input");
        if (byEmail(email) || admins.indexOf(email) >= 0) return err("exists");
        db.add("Users", { uid: newUid(), email: email, name: str(p.name, 60), nameEn: str(p.nameEn, 80), school: str(p.school, 80), role: role,
          interest: role === "participant" ? str(p.interest, 20) : "", status: "pending", teamId: "", createdAt: nowIso(), decidedAt: "" });
        return { ok: true };
      }
      if (action === "requestCode") {
        var u = ensureAdmin(p.email);
        if (!u) return err("no_application");
        if (u.status === "pending") return err("not_approved");
        if (u.status === "rejected") return err("rejected");
        var key = lower(u.email), prev = db.all("Codes").filter(function (c) { return c.email === key; })[0];
        if (prev && prev.sentAt && Date.now() - new Date(prev.sentAt).getTime() < 60000) return err("rate");
        var code = cfg.random(6, "0123456789");
        var row = { email: key, codeHash: cfg.hash("c:" + key + ":" + code), expiresAt: later(CODE_MIN), tries: 0, sentAt: nowIso() };
        if (prev) db.patch("Codes", "email", key, row); else db.add("Codes", row);
        cfg.sendCode(u.email, code, str(p.lang) || "ko");
        var out = { ok: true, minutes: CODE_MIN };
        if (cfg.exposeCode) out.demoCode = code;
        return out;
      }
      if (action === "verifyCode") {
        var em = lower(p.email), c = db.all("Codes").filter(function (x) { return x.email === em; })[0];
        if (!c || !c.codeHash) return err("bad_code");
        if (c.expiresAt < nowIso()) return err("code_expired");
        if (Number(c.tries) >= MAX_TRIES) return err("too_many");
        if (cfg.hash("c:" + em + ":" + str(p.code)) !== c.codeHash) { db.patch("Codes", "email", em, { tries: Number(c.tries) + 1 }); return err("bad_code"); }
        db.patch("Codes", "email", em, { codeHash: "", tries: 0 });
        var who = byEmail(em); if (!who || who.status !== "approved") return err("not_approved");
        var token = cfg.random(40, "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789");
        db.add("Sessions", { tokenHash: cfg.hash("s:" + token), uid: who.uid, expiresAt: later(SESSION_DAYS * 1440), createdAt: nowIso() });
        return { ok: true, token: token, user: pubUser(who) };
      }

      /* 게시판 목록은 누구나 볼 수 있음 (이름은 가림) */
      if (action === "boardList") return { ok: true, posts: posts(sessionUser(str(p.token))) };
      if (action === "boardGet") {
        var pd0 = postDetail(str(p.id), sessionUser(str(p.token)));
        return pd0 ? { ok: true, post: pd0 } : err("bad_input");
      }

      /* ---------- 여기부터는 로그인 필요 ---------- */
      var me = sessionUser(str(p.token));
      if (!me) return err("auth");
      if (me.status !== "approved") return err("not_approved");

      if (action === "logout") {
        db.patch("Sessions", "tokenHash", cfg.hash("s:" + str(p.token)), { expiresAt: nowIso() });
        return { ok: true };
      }
      if (action === "me") return { ok: true, user: pubUser(me), team: me.teamId ? team(me.teamId, true) : null };

      if (action === "dash") {
        if (me.role === "participant") return { ok: true, teamMax: teamMax, team: me.teamId ? team(me.teamId) : null,
          openTeams: me.teamId ? [] : activeTeams().filter(function (t) { return t.members.length < teamMax; }).map(function (t) {
            t.members = t.members.map(function (m) { return { name: m.name, nameEn: m.nameEn, school: m.school }; }); return t; }),
          myRequests: requests(function (r) { return r.uid === me.uid && r.status === "pending"; }).map(function (r) { return r.teamId; }),
          incoming: me.teamId && team(me.teamId).leaderUid === me.uid ? requests(function (r) { return r.teamId === me.teamId && r.status === "pending"; }).map(function (r) {
            var u = byUid(r.uid) || {}; return { id: r.id, name: u.name, nameEn: u.nameEn, school: u.school, interest: u.interest, message: r.message, at: r.at }; }) : [],
          files: me.teamId ? filesFor(me.teamId) : [], mentoring: me.teamId ? mentoring(function (r) { return r.teamId === me.teamId; }).map(function (r) { delete r.mentorUid; return r; }) : [] };
        if (me.role === "mentor") return { ok: true, teams: activeTeams(false), records: mentoring(function (r) { return r.mentorUid === me.uid; }) };
        if (me.role === "judge") {
          var mine = {}; db.all("Scores").forEach(function (s) { if (s.judgeUid === me.uid) mine[s.teamId] = { scores: parse(s.scoresJson, {}), comment: s.comment, at: s.at }; });
          return { ok: true, scores: mine, teams: activeTeams(false).map(function (t) { t.files = latestByStage(filesFor(t.teamId)); return t; }) };
        }
        if (me.role === "admin") return { ok: true, users: users().map(pubUser), teams: activeTeams(true), files: filesFor(""),
          mentoring: mentoring(function () { return true; }), results: results() };
        return err("forbidden");
      }

      /* 팀: 팀장이 팀을 만들고, 팀원은 원하는 팀에 합류 신청 → 팀장이 수락 (참가자) */
      if (["teamCreate", "joinRequest", "joinCancel", "joinDecide", "teamLeave", "teamEdit"].indexOf(action) >= 0) {
        if (me.role !== "participant") return err("forbidden");
        if (action === "teamCreate") {
          if (me.teamId) return err("has_team");
          if (!str(p.teamName) || !str(p.title)) return err("bad_input");
          var n = db.all("Teams").length + 1, id = "T" + (n < 10 ? "0" + n : n);
          db.add("Teams", { teamId: id, teamName: str(p.teamName, 60), title: str(p.title, 120), inviteCode: "", leaderUid: me.uid, createdAt: nowIso() });
          db.patch("Users", "uid", me.uid, { teamId: id });
          closeMyRequests(me.uid, "");
          return { ok: true };
        }
        if (action === "joinRequest") {
          if (me.teamId) return err("has_team");
          var tj = team(str(p.teamId));
          if (!tj || !tj.members.length) return err("bad_input");
          if (tj.members.length >= teamMax) return err("team_full");
          if (requests(function (r) { return r.uid === me.uid && r.teamId === tj.teamId && r.status === "pending"; }).length) return err("already_requested");
          db.add("Requests", { id: "R" + Date.now().toString(36) + cfg.random(3, "0123456789"), teamId: tj.teamId, uid: me.uid, message: str(p.message, 300), status: "pending", at: nowIso(), decidedAt: "" });
          return { ok: true };
        }
        if (action === "joinCancel") {
          requests(function (r) { return r.uid === me.uid && r.teamId === str(p.teamId) && r.status === "pending"; })
            .forEach(function (r) { db.patch("Requests", "id", r.id, { status: "cancelled", decidedAt: nowIso() }); });
          return { ok: true };
        }
        if (!me.teamId) return err("no_team");
        var cur = team(me.teamId);
        if (action === "joinDecide") {
          if (cur.leaderUid !== me.uid) return err("leader_only");
          var rq = requests(function (r) { return r.id === str(p.id) && r.teamId === me.teamId && r.status === "pending"; })[0];
          if (!rq) return err("bad_input");
          if (!p.accept) { db.patch("Requests", "id", rq.id, { status: "declined", decidedAt: nowIso() }); return { ok: true }; }
          var who2 = byUid(rq.uid);
          if (!who2 || who2.status !== "approved" || who2.teamId) { db.patch("Requests", "id", rq.id, { status: "cancelled", decidedAt: nowIso() }); return err("gone"); }
          if (cur.members.length >= teamMax) return err("team_full");
          db.patch("Users", "uid", who2.uid, { teamId: me.teamId });
          db.patch("Requests", "id", rq.id, { status: "accepted", decidedAt: nowIso() });
          closeMyRequests(who2.uid, rq.id);
          return { ok: true };
        }
        if (action === "teamEdit") {
          if (cur.leaderUid !== me.uid) return err("leader_only");
          if (!str(p.teamName) || !str(p.title)) return err("bad_input");
          db.patch("Teams", "teamId", me.teamId, { teamName: str(p.teamName, 60), title: str(p.title, 120) });
          return { ok: true };
        }
        db.patch("Users", "uid", me.uid, { teamId: "" });
        if (cur.leaderUid === me.uid) {
          var next = cur.members.filter(function (m) { return m.uid !== me.uid; })[0];
          db.patch("Teams", "teamId", me.teamId, { leaderUid: next ? next.uid : "" });
        }
        return { ok: true };
      }

      if (action === "boardPost") {
        var title = str(p.title, 100), body = str(p.body, 3000);
        if (!title || !body) return err("bad_input");
        var pid = "P" + Date.now().toString(36) + cfg.random(3, "0123456789");
        db.add("Posts", { id: pid, uid: me.uid, title: title, body: body, at: nowIso(), status: "open" });
        return { ok: true, id: pid };
      }
      if (action === "boardComment") {
        var cb = str(p.body, 2000), pc = postDetail(str(p.id), me);
        if (!pc || !cb) return err("bad_input");
        db.add("Comments", { id: "C" + Date.now().toString(36) + cfg.random(3, "0123456789"), postId: pc.id, uid: me.uid, body: cb, at: nowIso(), status: "open" });
        return { ok: true, post: postDetail(pc.id, me) };
      }
      if (action === "boardDelete") {
        var pd = db.all("Posts").filter(function (x) { return x.id === str(p.id); })[0];
        if (!pd || (pd.uid !== me.uid && me.role !== "admin")) return err("forbidden");
        db.patch("Posts", "id", pd.id, { status: "deleted" });
        return { ok: true };
      }
      if (action === "commentDelete") {
        var cd = db.all("Comments").filter(function (x) { return x.id === str(p.id); })[0];
        if (!cd || (cd.uid !== me.uid && me.role !== "admin")) return err("forbidden");
        db.patch("Comments", "id", cd.id, { status: "deleted" });
        return { ok: true, post: postDetail(cd.postId, me) };
      }

      if (action === "upload") {
        if (me.role !== "participant") return err("forbidden");
        if (!me.teamId) return err("no_team");
        var stage = str(p.stage);
        if ((cfg.stages || []).indexOf(stage) < 0) return err("bad_input");
        var f = { at: nowIso(), teamId: me.teamId, stage: stage, kind: "", name: "", url: "", size: 0, byUid: me.uid };
        if (p.link) {
          var l = str(p.link, 500); if (!/^https?:\/\//i.test(l)) return err("bad_link");
          f.kind = "link"; f.name = l; f.url = l;
        } else {
          if ((cfg.linkOnly || []).indexOf(stage) >= 0) return err("bad_input");
          var b = str(p.data); if (!b) return err("bad_input");
          if (b.length * 0.75 > (cfg.maxFileMB || 20) * 1048576) return err("too_big");
          var saved = cfg.saveFile(me.teamId, stage, str(p.fileName, 150) || "file", str(p.mime, 100), b);
          f.kind = "file"; f.name = str(p.fileName, 150); f.url = saved.url; f.size = saved.size;
        }
        db.add("Files", f);
        return { ok: true, files: filesFor(me.teamId) };
      }

      if (action === "mentorSave") {
        if (me.role !== "mentor") return err("forbidden");
        var tid = str(p.teamId); if (!team(tid) || !members(tid).length) return err("bad_input");
        var content = str(p.content, 3000), date = str(p.date, 10), mode = str(p.mode);
        if (!content || !/^\d{4}-\d{2}-\d{2}$/.test(date) || ["online", "offline"].indexOf(mode) < 0) return err("bad_input");
        db.add("Mentoring", { id: "M" + Date.now().toString(36) + cfg.random(3, "0123456789"), at: nowIso(), mentorUid: me.uid, mentorName: me.name, teamId: tid, date: date, mode: mode, content: content });
        return { ok: true, records: mentoring(function (r) { return r.mentorUid === me.uid; }) };
      }

      if (action === "scoreSave") {
        if (me.role !== "judge") return err("forbidden");
        var st = str(p.teamId); if (!team(st) || !members(st).length) return err("bad_input");
        var s = p.scores || {}, clean = {}, total = 0, keys = Object.keys(cfg.criteria);
        for (var i = 0; i < keys.length; i++) {
          var k = keys[i], v = Number(s[k]);
          if (s[k] === "" || s[k] == null || isNaN(v) || v < 0 || v > cfg.criteria[k] || Math.round(v) !== v) return err("bad_score");
          clean[k] = v; total += v;
        }
        var sk = me.uid + "|" + st, rec = { key: sk, judgeUid: me.uid, judgeName: me.name, teamId: st, scoresJson: JSON.stringify(clean), total: total, comment: str(p.comment, 2000), at: nowIso() };
        if (db.all("Scores").some(function (x) { return x.key === sk; })) db.patch("Scores", "key", sk, rec); else db.add("Scores", rec);
        return { ok: true, total: total };
      }

      if (action === "setStatus") {
        if (me.role !== "admin") return err("forbidden");
        var target = byUid(str(p.uid)), ns = str(p.status);
        if (!target || target.role === "admin" || STATUSES.indexOf(ns) < 0) return err("bad_input");
        var patch = { status: ns, decidedAt: nowIso() };
        if (ns !== "approved") {
          if (target.teamId) {
            patch.teamId = "";
            var tt = team(target.teamId);
            if (tt && tt.leaderUid === target.uid) {
              var nx = tt.members.filter(function (m) { return m.uid !== target.uid; })[0];
              db.patch("Teams", "teamId", target.teamId, { leaderUid: nx ? nx.uid : "" });
            }
          }
          closeMyRequests(target.uid, "");
        }
        db.patch("Users", "uid", target.uid, patch);
        return { ok: true };
      }
      return err("unknown");
    };
  }

  /* 시트 탭과 열 순서 (Apps Script setup()과 데모 저장소가 함께 씀) */
  var TABLES = {
    Users: ["uid", "email", "name", "nameEn", "school", "role", "interest", "status", "teamId", "createdAt", "decidedAt"],
    Teams: ["teamId", "teamName", "title", "inviteCode", "leaderUid", "createdAt"],
    Files: ["at", "teamId", "stage", "kind", "name", "url", "size", "byUid"],
    Mentoring: ["id", "at", "mentorUid", "mentorName", "teamId", "date", "mode", "content"],
    Scores: ["key", "judgeUid", "judgeName", "teamId", "scoresJson", "total", "comment", "at"],
    Requests: ["id", "teamId", "uid", "message", "status", "at", "decidedAt"],
    Posts: ["id", "uid", "title", "body", "at", "status"],
    Comments: ["id", "postId", "uid", "body", "at", "status"],
    Codes: ["email", "codeHash", "expiresAt", "tries", "sentAt"],
    Sessions: ["tokenHash", "uid", "expiresAt", "createdAt"]
  };
  return { make: make, TABLES: TABLES };
})();
if (typeof window !== "undefined") window.CORE = CORE;
