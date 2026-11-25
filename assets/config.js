/* =========================================================
   운영팀이 수정하는 설정 파일 — 이 파일만 고치면 됩니다.
   ========================================================= */
window.COLAB = {
  /* Apps Script 웹 앱 주소 (README의 "백엔드 연결" 참고).
     비워 두면 '데모 모드'로 동작합니다: 입력값이 이 브라우저에만 저장되고 서버로 가지 않습니다. */
  ENDPOINT: "",

  /* 팀 최대 인원 (apps-script/Code.gs 의 TEAM_MAX 와 같게) */
  TEAM_MAX: 4,

  /* D-day·카운트다운 기준: 최종 발표일 */
  DEPART: "2026-12-29T00:00:00+09:00",

  /* 제출 파일 1개당 최대 용량(MB). Apps Script 요청 한도 때문에 25MB 이하를 권장합니다. */
  MAX_FILE_MB: 20,

  /* 결과물 제출 단계 (apps-script/Code.gs 의 STAGES 와 같게)  — 마감일은 운영팀이 확정하면 due에 입력 (예: "2026-12-20") */
  STAGES: [
    { id: "plan",  ko: "아이디어 기획서",   en: "Idea proposal",          vi: "Bản đề xuất ý tưởng",      due: "" },
    { id: "mid",   ko: "중간 점검 자료",     en: "Mid-term check-in",      vi: "Tài liệu kiểm tra giữa kỳ", due: "" },
    { id: "final", ko: "최종 발표 자료",     en: "Final presentation",     vi: "Bài thuyết trình cuối",     due: "2026-12-29" },
    { id: "demo",  ko: "시연 영상·코드 링크", en: "Demo video / code link", vi: "Video demo / liên kết mã",  due: "2026-12-29", linkOnly: true }
  ],

  /* 심사 기준 (공식, 100점) — 바꾸면 apps-script/Code.gs 의 CRITERIA·TIE 도 같이 */
  CRITERIA_CONFIRMED: true,
  CRITERIA_GROUPS: [
    { id: "pre",    ko: "Ⅰ. 사전 온라인 활동", en: "Ⅰ. Pre-event Online Activities", vi: "Ⅰ. Hoạt động trực tuyến trước sự kiện", max: 30 },
    { id: "hack",   ko: "Ⅱ. 해커톤 결과",      en: "Ⅱ. Hackathon Results",           vi: "Ⅱ. Kết quả hackathon",                  max: 60 },
    { id: "collab", ko: "Ⅲ. 한·베 공동협업",   en: "Ⅲ. Korea–Vietnam Collaboration", vi: "Ⅲ. Hợp tác Hàn–Việt",                   max: 10 }
  ],
  CRITERIA: [
    { id: "tb", g: "pre", max: 10, ko: "팀빌딩 참여도", en: "Team-building Participation", vi: "Mức độ tham gia xây dựng đội",
      dko: "온라인 팀빌딩 3회 출석률(팀원 평균). 회당 약 3.3점, 전원 참석 시 만점", den: "Attendance at 3 online team-building sessions (team average). About 3.3 points per session; full marks if all members attend", dvi: "Tỷ lệ tham dự 3 buổi xây dựng đội trực tuyến (trung bình thành viên). Khoảng 3,3 điểm mỗi buổi; đủ điểm nếu tất cả tham dự" },
    { id: "pre", g: "pre", max: 15, ko: "사전 과제 결과물", en: "Pre-assignment Deliverable", vi: "Sản phẩm bài tập trước sự kiện",
      dko: "팀별 제출 문서(HWP)의 Net-Zero 문제 정의, 자료 조사, 아이디어 초안 충실도", den: "Quality of the team's submitted document (HWP): Net-Zero problem definition, research and initial idea", dvi: "Chất lượng tài liệu nộp của đội (HWP): xác định vấn đề Net-Zero, nghiên cứu và ý tưởng ban đầu" },
    { id: "comm", g: "pre", max: 5, ko: "기한 준수 및 온라인 소통", en: "Deadline Compliance & Online Communication", vi: "Đúng hạn & giao tiếp trực tuyến",
      dko: "과제 기한 내 제출 여부, 회의 사이 팀 채팅 등 꾸준한 소통", den: "On-time submission and consistent communication between sessions (e.g., team chat)", dvi: "Nộp đúng hạn và giao tiếp đều đặn giữa các buổi (ví dụ: chat nhóm)" },
    { id: "prob", g: "hack", max: 10, ko: "문제 정의 및 Net-Zero 연관성", en: "Problem Definition & Net-Zero Relevance", vi: "Xác định vấn đề & liên quan Net-Zero",
      dko: "기후변화·에너지 절감·자원순환 등과의 연관성, 문제의 구체성", den: "Relevance to climate change, energy saving, resource circulation, etc.; how specific the problem is", dvi: "Mức liên quan tới biến đổi khí hậu, tiết kiệm năng lượng, tuần hoàn tài nguyên…; độ cụ thể của vấn đề" },
    { id: "crea", g: "hack", max: 15, ko: "창의성·혁신성", en: "Creativity & Innovation", vi: "Sáng tạo & đổi mới",
      dko: "기존 방식과의 차별성, 아이디어의 참신함", den: "Differentiation from existing approaches; originality of the idea", dvi: "Khác biệt so với cách làm hiện có; tính mới của ý tưởng" },
    { id: "tech", g: "hack", max: 20, ko: "AI·디지털 기술 활용 및 프로토타입 완성도", en: "Use of AI & Digital Technology / Prototype Completeness", vi: "Ứng dụng AI & công nghệ số / Mức hoàn thiện nguyên mẫu",
      dko: "기술 활용의 적절성, 실제 작동 수준", den: "Appropriate use of technology; how well the prototype actually works", dvi: "Sử dụng công nghệ phù hợp; mức độ nguyên mẫu hoạt động thực tế" },
    { id: "feas", g: "hack", max: 10, ko: "실현 가능성 및 파급효과", en: "Feasibility & Impact", vi: "Tính khả thi & tác động",
      dko: "현장 적용 가능성, 확산 가능성과 기대 효과", den: "Real-world applicability, scalability and expected impact", dvi: "Khả năng áp dụng thực tế, mở rộng và hiệu quả kỳ vọng" },
    { id: "pres", g: "hack", max: 5, ko: "발표 및 질의응답", en: "Presentation & Q&A", vi: "Thuyết trình & hỏi đáp",
      dko: "전달력, 질문에 대한 대응", den: "Clarity of delivery and responses to questions", dvi: "Khả năng truyền đạt và trả lời câu hỏi" },
    { id: "collab", g: "collab", max: 10, ko: "역할 분담 및 공동 기여", en: "Role Sharing & Joint Contribution", vi: "Phân vai & đóng góp chung",
      dko: "양국 학생의 고른 기여(심사위원 관찰 + 팀 제출 역할표)", den: "Balanced contribution from Korean and Vietnamese students (judges' observation + team role sheet)", dvi: "Đóng góp cân bằng của sinh viên hai nước (giám khảo quan sát + bảng phân vai của đội)" }
  ],


  /* 데모 모드에서 눌러볼 수 있는 이메일 (인증코드는 화면에 바로 보여 줍니다) */
  DEMO_ACCOUNTS: [
    { email: "admin@demo.kr",  ko: "운영팀", en: "Organiser", vi: "Ban tổ chức" },
    { email: "team@demo.kr",   ko: "참가자 · 팀 있음", en: "Participant · in a team", vi: "Thí sinh · đã có đội" },
    { email: "solo@demo.kr",   ko: "참가자 · 팀 없음", en: "Participant · no team", vi: "Thí sinh · chưa có đội" },
    { email: "mentor@demo.kr", ko: "멘토", en: "Mentor", vi: "Cố vấn" },
    { email: "judge@demo.kr",  ko: "심사위원", en: "Judge", vi: "Giám khảo" },
    { email: "new@demo.kr",    ko: "승인 대기", en: "Waiting for approval", vi: "Chờ duyệt" }
  ]
};
