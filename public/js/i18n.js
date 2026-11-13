// English / 한국어 toggle for the website pages.
// Text nodes and placeholders are matched by their exact English text.
(function () {
  const KO = {
    "Apply": "지원하기", "Beulah Venture": "쁄라 벤처",
    "Tell us about your business.": "당신의 사업을 들려주세요.", "Venture 101 graduates only. We reply within 2 weeks.": "Venture 101 수료자만 지원할 수 있어요. 2주 안에 답해 드려요.",
    "First Track": "퍼스트 트랙", "2027 cohort.": "2027년 기수.", "Our first track for gospel-based startups begins in 2027.": "복음 기반 스타트업을 위한 첫 트랙이 2027년에 시작해요.",
    "Name and email": "이름과 이메일", "Verify your email": "이메일 인증", "Tell us about your business": "사업 소개 작성",
    "Step 1 of 3": "1 / 3단계", "Step 2 of 3": "2 / 3단계", "Step 3 of 3 ·": "3 / 3단계 ·",
    "Send verification code": "인증 코드 보내기", "We sent a 6-digit code to": "6자리 코드를 보냈어요:", "Verification code": "인증 코드",
    "Verify": "인증하기", "Send a new code": "새 코드 받기", "A new code is on its way.": "새 코드를 보냈어요.",
    "I completed Venture 101.": "Venture 101을 수료했어요.", "Venture 101 cohort or year (optional)": "Venture 101 기수 또는 연도 (선택)",
    "Company name": "회사 이름", "Your business in one line": "한 줄 사업 소개", "Stage": "단계",
    "Idea": "아이디어", "Building": "만드는 중", "Launched": "출시", "Revenue": "매출 발생",
    "What problem are you solving?": "어떤 문제를 해결하나요?", "Who are your customers?": "고객은 누구인가요?",
    "Traction so far (optional)": "지금까지의 성과 (선택)", "How does your faith shape this business?": "신앙이 이 사업에 어떻게 녹아 있나요?",
    "Team (optional)": "팀 (선택)", "What are you asking for? (optional)": "어떤 도움을 원하시나요? (선택)", "Funding, mentoring, customers…": "투자, 멘토링, 고객 연결…",
    "Website (optional)": "웹사이트 (선택)", "Submit application": "지원서 제출", "We reply within 2 weeks.": "2주 안에 답해 드릴게요.",
    "Have a business? Apply to Beulah Venture →": "사업을 하고 있나요? 쁄라 벤처에 지원하세요 →",
    "This track is for Venture 101 graduates.": "이 트랙은 Venture 101 수료자를 위한 것이에요.", "Please fill in the required fields.": "필수 항목을 채워 주세요.",
    "Please add your name.": "이름을 입력해 주세요.", "Please add a valid email.": "올바른 이메일을 입력해 주세요.",
    "We just sent a code. Please wait a minute before asking again.": "방금 코드를 보냈어요. 1분 뒤에 다시 요청해 주세요.",
    "That code has expired. Please request a new one.": "코드가 만료됐어요. 새 코드를 받아 주세요.",
    "Too many tries. Please request a new code.": "시도가 너무 많아요. 새 코드를 받아 주세요.",
    "That code isn’t right. Please check your email and try again.": "코드가 맞지 않아요. 이메일을 확인하고 다시 입력해 주세요.",
    "Your session expired. Please verify your email again.": "세션이 만료됐어요. 이메일을 다시 인증해 주세요.",
    "We couldn’t send the email. Please try again in a minute.": "이메일을 보내지 못했어요. 잠시 뒤 다시 시도해 주세요.",
    "Something went wrong.": "문제가 생겼어요.",
    "Open the presenter screen.": "발표 화면을 열어요.", "A room code and QR code appear on the projector.": "프로젝터에 방 코드와 QR 코드가 나타나요.",
    "Students scan with their phones.": "학생들은 휴대폰으로 스캔해요.", "No sign-up. Each joins as a random orchestra instrument, the only name shown on screen.": "가입 없이, 각자 무작위 오케스트라 악기 이름으로 참여해요. 화면에는 그 이름만 나와요.",
    "Students answer on question slides.": "질문 슬라이드에서 학생들이 답해요.", "Answers appear on the big screen without names. Turn on review mode to approve each one first.": "답은 이름 없이 큰 화면에 나와요. 검토 모드를 켜면 하나씩 승인할 수 있어요.",
    "The first-page worksheet stays private.": "“첫 페이지” 워크시트는 비공개예요.", "It stays on each phone and can be downloaded.": "각자의 휴대폰에만 남고 내려받을 수 있어요.",
    "Click each instrument to hear its part alone, then all together, before the closing video.": "마지막 영상 전에 악기를 하나씩 눌러 그 파트만 듣고, 함께 들어요.",
    "Hear the orchestra.": "오케스트라를 들어요.",
    "Live classes need the full site with its server.": "실시간 강의는 서버가 있는 전체 사이트에서 이용할 수 있어요.", "This form needs the full site with its server.": "이 신청은 서버가 있는 전체 사이트에서 제출할 수 있어요.",
    "Personality test": "성격 진단", "My User Manual personality test": "나의 사용설명서 성격 진단", "Personality test.": "성격 진단.",
    "20 questions about you. See your strengths, where you might get stuck, and how to grow.": "나에 대한 질문 20개. 강점, 막힐 수 있는 때, 성장하는 방법을 알아봐요.",
    "About 5 minutes": "약 5분", "Results right away": "결과 바로 보기", "20 questions about you. About 5 minutes.": "나에 대한 질문 20개. 약 5분이면 돼요.",
    "Cohort": "코호트", "Learn together.": "함께 배워요.", "A small group that meets, learns, and checks in.": "함께 만나고, 배우고, 서로 점검하는 작은 모임.",
    "How a cohort works": "코호트 진행 방식", "Live session": "실시간 강의", "The lecture, live. Everyone answers from their phone.": "실시간 강의. 모두 휴대폰으로 참여해요.",
    "Class": "클래스", "Go deeper together in a small group.": "작은 그룹에서 더 깊이 나눠요.", "Mentoring": "멘토링", "Meet an adult mentor who has walked the road.": "먼저 길을 걸어간 어른 멘토를 만나요.",
    "✓ Check-in": "✓ 체크인", "Every section ends with a short check-in: what I learned, how I’m doing, my next step.": "섹션마다 짧은 체크인으로 마무리해요. 배운 것, 요즘 나의 상태, 다음 한 걸음.",
    "Sign up": "신청", "Join the next cohort.": "다음 코호트에 함께해요.", "Track": "과정",
    "My User Manual · For High School": "나의 사용설명서 · 고등학생", "I am a": "나는", "Student": "학생", "Parent": "학부모", "Adult": "성인",
    "Grade or age (optional)": "학년 또는 나이 (선택)", "Church (optional)": "교회 (선택)", "What do you hope to get out of it? (optional)": "무엇을 기대하나요? (선택)",
    "If I’m under 18, a parent or guardian knows I’m signing up.": "18세 미만이라면 부모님 또는 보호자가 신청 사실을 알고 있어요.",
    "Sign up for the cohort": "코호트 신청하기", "Sign up for a cohort": "코호트 신청", "We’ll email you when the next cohort opens.": "다음 코호트가 열리면 이메일로 알려 드릴게요.",
    "Please choose a track.": "과정을 선택해 주세요.",
    "CEO": "사장", "AI": "AI", "Christian CEO School": "기독교 사장 학교", "For business owners who want to lead by faith.": "믿음으로 회사를 이끌고 싶은 사장님들을 위해.",
    "Leadership": "리더십", "People": "사람", "Calling": "소명",
    "How to Live in the Age of AI": "AI 시대, 어떻게 살아가야 할까", "What does it mean to live well, and faithfully, in the age of AI?": "AI 시대에 믿음으로, 바르게 살아간다는 것은 무엇일까?",
    "Work": "일", "Identity": "정체성", "Wisdom": "지혜",
    "Later: How to live in the age of AI": "나중에: AI 시대, 어떻게 살아가야 할까",
    "Class fees and monthly gifts support Hephzibah Academy and mentoring, and invest in gospel-based startups through Beulah Venture.": "수강료와 정기 후원은 헵시바 아카데미와 멘토링을 통해, 그리고 쁄라 벤처를 통해 복음 기반 스타트업에 투자됩니다.", "Support →": "후원하기 →",
    "Builds people · Education": "사람을 세운다 · 교육", "Builds businesses · Investment": "사업을 세운다 · 투자",
    "Living as God’s steward. A Christian view of money, for life in the U.S.": "하나님의 청지기로 살아가기. 미국에서 살아가는 그리스도인의 재정관.",
    "60 or 120 min": "60분 또는 120분", "/ Finance": "/ 재정",
    "Living as God’s steward. How am I using the time, money and abilities entrusted to me?": "하나님의 청지기로 살아가기. 내게 맡겨진 시간과 물질과 능력을 어떻게 사용하고 있는가?",
    "Everyone scans and gets a Bible name.": "모두 스캔하고 성경 인물 이름을 받아요.",
    "Each person gets a random Bible-character pseudonym and portrait, and can roll again before confirming.": "성경 인물 가명과 그림을 무작위로 받고, 확정 전에 다시 뽑을 수 있어요.",
    "Optional consents.": "선택 동의.", "Research use and future counseling contact are separate, optional choices.": "연구 활용과 향후 상담 연락은 각각 선택 동의예요.",
    "Answer in ranges.": "범위로 답해요.", "Income, assets and debt are answered as ranges and can be skipped. Only totals appear on screen.": "소득·자산·부채는 범위로 답하고 건너뛸 수 있어요. 화면에는 집계만 나와요.",
    "Guess, then check.": "예상하고, 확인해요.", "Spending guesses, actual statements and the card-debt calculator stay private on each phone.": "지출 예상, 실제 내역, 카드빚 계산기는 각자의 휴대폰에만 남아요.",
    "Question → answer → compare → Scripture → application.": "질문 → 개인 응답 → 예상과 실제 비교 → 성경 본문 → 적용.",
    "Scripture notes are summaries; modern finance and math are applications.": "성경 설명은 본문의 요약이며, 현대 금융제도와 계산은 적용으로 구분해요.",
    "Finish with application and homework.": "개인 적용과 과제로 마무리해요.", "Fill in four sentences and check off five home tasks, privately.": "네 문장을 채우고, 집에서 할 다섯 가지를 혼자 체크해요.",
    "60 or 120 minutes.": "60분 또는 120분.", "All slides.": "전체 슬라이드.",
    "Admin": "관리자",
    "Admin password": "관리자 암호",
    "Unlock": "열기",
    "The big question": "중심 질문",
    "Why do I believe in God?": "하나님을 믿는 목적은 무엇인가?",
    "To get my money problems solved, or to know God and live with Him?": "돈의 문제를 해결받는 데 있는가, 하나님을 알고 그분과 함께 살아가는 데 있는가?",
    "Trust God, and manage what’s entrusted responsibly.": "하나님을 신뢰하며, 맡겨진 돈은 책임 있게 관리한다.",
    "Topics": "주제",
    "1 hour": "1시간",
    "2 hours": "2시간",
    "01  Salary and real life: where did the money go?": "01  연봉과 실제 생활 — 돈은 어디 갔을까?",
    "02  How much is enough? Money and my heart": "02  얼마면 충분할까? — 돈과 내 마음",
    "03  Card debt, compound interest, taxes, house, car": "03  카드빚·복리·세금·집·차·절세",
    "04  Me at 80, 90, 100: preparing a responsible future": "04  80·90·100세의 나 — 책임 있는 미래 준비",
    "05  Work and starting a business: value and faithfulness": "05  직업과 창업 — 가치와 성실함",
    "06  Stocks and cash flow: what do I own?": "06  주식과 현금흐름 — 무엇을 소유하는가?",
    "07  God’s steward: whose will do I use it for?": "07  하나님의 청지기 — 누구의 뜻대로 사용하는가?",
    "08  Offering and giving: caring for people with what’s entrusted": "08  헌금과 나눔 — 맡겨진 것으로 사람을 돌보기",
    "09  Joseph again: why did God entrust it?": "09  다시 요셉 — 왜 맡기셨을까?",
    "10  Time, money, talents: how am I using what I have now?": "10  시간·물질·달란트 — 지금 받은 것을 어떻게 사용하는가?",
    "2 min": "2분",
    "3 min": "3분",
    "4 min": "4분",
    "5 min": "5분",
    "6 min": "6분",
    "7 min": "7분",
    "8 min": "8분",
    "9 min": "9분",
    "10 min": "10분",
    "12 min": "12분",
    "14 min": "14분",
    "16 min": "16분",
    "18 min": "18분",
    "20 min": "20분",
    "01  The first question & introduction": "01  처음 질문과 소개",
    "02  Questions I met in Kenya": "02  케냐에서 만난 질문",
    "03  A user manual — and faith": "03  사용설명서와 믿음",
    "04  My first page & one next step": "04  나의 첫 페이지와 다음 한 걸음",
    "05  The orchestra, the video & your review": "05  오케스트라, 영상, 그리고 나의 리뷰",
    "11 min": "11분",
    "Startup & Business Academy": "창업/비즈니스 아카데미", "For anyone dreaming of starting a business, or already running one.": "창업을 꿈꾸고 이미 사업을 운영하고 계신 누구에게나.",
    "Menu": "메뉴", "Academy": "아카데미", "Community": "커뮤니티", "About": "소개", "Mentors": "멘토", "Support": "후원", "Log in": "로그인",
    "Hephzibah Academy": "헵시바 아카데미",
    "Light and salt.": "빛과 소금.", "Light and salt": "빛과 소금", "Matthew 5:13–16": "마태복음 5:13–16", "Start learning": "배움 시작하기",
    "LEARN / THRIVE / SHARE": "배우고 / 자라고 / 나누고",
    "Learn": "배움", "Ask honest questions.": "솔직하게 질문해요.", "Live as God’s child in the world.": "세상에서 하나님의 자녀로 살아가는 법을 배워요.", "Share": "나눔", "Hear one another.": "서로의 이야기를 들어요.", "Edify one another.": "서로 세워 줘요.", "Build up one another.": "다른 이들을 세워요.",
    "Thrive": "성장", "Take one small step.": "작은 한 걸음을 내디뎌요.", "Grow and flourish in Him.": "그분 안에서 자라고 풍성해져요.",
    "Light and Salt": "빛과 소금", "A house on a hill.": "산 위의 집.", "A light for every room.": "모든 방을 비추는 빛.",
    "For Christians worn down by the world’s values.": "세상의 가치관 속에서 지쳐 가는 그리스도인들을 위해.",
    "To live as light — with power — every day,": "날마다 능력 있는 빛으로 살아가도록,", "as children of God.": "하나님의 자녀로.",
    "“You are the light of the world. … Even so, let your light shine before men, that they may see your good works, and glorify your Father who is in heaven.”":
      "“너희는 세상의 빛이라 … 이같이 너희 빛을 사람 앞에 비취게 하여 저희로 너희 착한 행실을 보고 하늘에 계신 너희 아버지께 영광을 돌리게 하라.”",
    "Matthew 5:14–16 (WEB)": "마태복음 5:14–16 (개역한글)",
    "Lectures": "강의", "Start with a question.": "질문으로 시작해요.", "How should we live in the age of AI?": "AI 시대, 어떻게 살아가야 할까?", "All lectures": "전체 강의",
    "For High School": "고등학생", "My User Manual": "나의 사용설명서",
    "Who am I made to be?": "나는 어떤 사람으로 지음받았을까?",
    "29 slides": "슬라이드 29장", "~40 min": "약 40분", "Live & interactive": "실시간 참여",
    "Startup": "창업", "Startup Academy": "창업 아카데미", "For anyone who wants to start a company.": "창업을 꿈꾸는 누구에게나.",
    "Coming soon": "준비 중", "Finance": "재정", "Basic Finance": "기초 재정",
    "A Christian view of money, for life in the U.S.": "미국에서 살아가는 그리스도인의 재정관.",
    "Give monthly.": "매달 후원하기.",
    "Classes and monthly gifts invest in gospel-based startups through Beulah Venture.": "수강료와 정기 후원은 쁄라 벤처를 통해 복음 기반 스타트업에 투자됩니다.",
    "Become a supporter": "후원자 되기",
    "About · Isaiah 62:4": "소개 · 이사야 62:4",
    "Hephzibah": "헵시바", "Beulah": "쁄라", "ACADEMY": "아카데미", "VENTURE": "벤처",
    "My delight is in her.": "나의 기쁨이 그녀에게 있다.", "Married. A land made fruitful.": "결혼한 땅, 풍성한 땅.",
    "After Babylon, two new names from God for a people who felt forsaken. A promise of restoration and love.": "바벨론 이후, 버림받은 듯했던 백성에게 하나님이 주신 두 새 이름. 회복과 사랑의 약속.",
    "“Thou shalt be called Hephzibah, and thy land Beulah: for the LORD delighteth in thee.”": "“너를 헵시바라 하며 네 땅을 쁄라라 하리니 이는 여호와께서 너를 기뻐하실 것이며”",
    "Isaiah 62:4 (KJV)": "이사야 62:4 (개역한글)",
    "In the room right now?": "지금 강의실에 있나요?", "Enter the code on the screen.": "화면에 보이는 코드를 입력하세요.",
    "Room code": "방 코드", "ROOM CODE": "방 코드", "Join": "입장",
    "An adult who wants to give, teach or mentor?": "후원하고, 가르치고, 멘토가 되고 싶은 어른이신가요?", "Become a mentor": "멘토 되기",
    "501(c)(3) applied, status pending.": "501(c)(3) 신청 완료, 승인 대기 중.", "Speakers": "강사", "Tell young people your story.": "여러분의 이야기를 청년들에게 들려주세요.", "Pastors, ministers, staff and church members. Your faith in real life is the lesson.": "목사님, 전도사님, 간사님, 성도님. 삶 속의 믿음이 곧 수업입니다.", "Five steps.": "다섯 단계.", "Tell us who you are and the story you’d share.": "어떤 분인지, 어떤 이야기를 나누고 싶은지 알려 주세요.", "Review": "심사", "Upload": "자료 올리기", "Send your outline or slides. We help shape it.": "개요나 슬라이드를 보내 주세요. 함께 다듬어요.", "Schedule": "일정", "Pick your dates. We share contacts and details.": "날짜를 고르시면 담당자 연락처와 안내를 드려요.", "Speak and get paid": "강의와 사례비", "An honorarium for every session.": "강의마다 사례비를 드려요.", "Share your story.": "이야기를 나눠 주세요.", "Gospel-based learning, told by real lives.": "복음에 기반한 배움, 삶으로 전하는 이야기.", "I serve as": "섬기는 자리", "Pastor": "목사", "Minister": "전도사", "Ministry staff": "간사", "Church member": "성도", "Phone (optional)": "전화번호 (선택)", "Church or organization": "교회 또는 단체", "Your work or field": "하시는 일", "Talk title": "강의 제목", "Your story in a few lines": "나누실 이야기를 몇 줄로", "When are you available? (optional)": "가능한 시간 (선택)", "Link to past talks or slides (optional)": "이전 강의나 자료 링크 (선택)", "Apply to speak": "강사 지원하기", "We’ll reply within 2 weeks.": "2주 안에 답해 드릴게요.", "Faith for life. Learning for the world.": "삶을 위한 믿음. 세상을 위한 배움.", "© 2026 Hephzibah Academy": "© 2026 헵시바 아카데미",
    "Learn together. One slide at a time.": "함께 배워요. 한 장씩.",
    "Class fees invest in gospel-based startups through": "수강료는 복음 기반 스타트업에 투자됩니다 ·", "Beulah Venture": "쁄라 벤처",
    "All": "전체", "Who am I made to be? A talk on study, money and purpose.": "나는 어떤 사람으로 지음받았을까? 공부, 돈, 목적에 대한 이야기.",
    "Joseph Shon": "손원규", "Live answers, orchestra & video": "실시간 답변, 오케스트라, 영상",
    "For anyone who wants to start a company — gospel-based, built to last.": "창업을 꿈꾸는 누구에게나. 복음 위에, 오래가는 회사로.",
    "Idea": "아이디어", "Customers": "고객", "Money": "돈", "Team": "팀", "Mission": "사명",
    "Budget": "예산", "Save": "저축", "Credit": "신용", "Taxes": "세금", "Give": "나눔",
    "/ For High School": "/ 고등학생",
    "For a life that shines in the image God made.": "하나님이 지으신 형상대로 빛나는 삶을 위해.",
    "Present live": "실시간 발표", "Preview slides": "슬라이드 미리보기", "Join as audience": "청중으로 입장", "Download slides": "슬라이드 내려받기",
    "How it works": "진행 방법", "One slide at a time. Everyone takes part.": "한 장씩, 모두가 함께.",
    "Open the presenter screen": "발표 화면을 여세요", "on the projector. A room code and QR code appear.": "프로젝터에 방 코드와 QR 코드가 나타나요.",
    "Students scan with their phones.": "학생들은 휴대폰으로 스캔해요.",
    "No sign-up — each joins as a random orchestra instrument — the only name shown on screen.": "가입 없이, 각자 무작위 오케스트라 악기 이름으로 참여해요. 화면에는 그 이름만 나와요.",
    "Advance one slide at a time.": "한 장씩 넘겨요.", "Phones follow along automatically.": "휴대폰도 자동으로 따라와요.",
    "On question slides, students type or tap.": "질문 슬라이드에서는 학생들이 입력하거나 눌러요.",
    "Answers appear live on the big screen — no names. Turn on review mode to approve each message first.": "답은 이름 없이 큰 화면에 바로 나와요. 검토 모드를 켜면 하나씩 승인할 수 있어요.",
    "The “first page” worksheet stays private": "“첫 페이지” 워크시트는 비공개예요", "on each phone, and can be downloaded.": "각자의 휴대폰에만 남고 내려받을 수 있어요.",
    "Hear the orchestra.": "오케스트라를 들어요.", "Click each instrument to hear its part alone — then all together — before the closing video.": "마지막 영상 전에 악기를 하나씩 눌러 그 파트만 듣고, 함께 들어요.",
    "Finish with a review.": "리뷰로 마무리해요.",
    "Students share what they learned, review the lecture, unlock their 20-question results, and write how they’ll use their strengths and weaknesses.": "배운 것을 나누고 강의를 평가하면 20문항 결과가 열려요. 강점과 약점을 어떻게 쓸지 적어요.",
    "Run of show": "진행 순서", "About 40 minutes.": "약 40분.", "Slides": "슬라이드", "All 36 slides.": "슬라이드 36장 전체.",
    "Your gift keeps the light on — and multiplies.": "당신의 후원이 불을 밝히고, 더 크게 자라게 해요.",
    "Where it goes": "후원금은 이렇게 쓰여요", "Learn & give": "배우고 나누기", "Class fees and monthly gifts.": "수강료와 정기 후원.",
    "Invest": "투자", "Gospel-based startups through Beulah Venture.": "쁄라 벤처를 통해 복음 기반 스타트업에.",
    "Share profit": "수익 나눔", "Companies share what they earn.": "회사가 번 것을 나눠요.",
    "Invest more": "다시 투자", "Profits go back into new ventures.": "수익은 새 회사에 다시 투자돼요.",
    "What we invest in": "우리가 투자하는 곳", "Value,": "가격이 아닌,", "not price.": "가치.",
    "Gospel-based companies, built to last — creating value, not just money.": "복음 위에 세운 지속 가능한 회사. 돈이 아닌 가치를 만들어요.",
    "Hope": "희망", "Value": "가치", "Love": "사랑", "Gospel": "복음", "For everyone who walks with us.": "함께하는 모든 이에게.",
    "Monthly": "정기 후원", "Choose an amount.": "금액을 선택하세요.", "/ month": "/ 월", "Other": "기타", "any amount": "원하는 금액",
    "Want to teach or mentor too? →": "가르치거나 멘토가 되고 싶나요? →",
    "Walk with them.": "함께 걸어요.", "Adults who give, teach and guide the next generation.": "다음 세대를 후원하고, 가르치고, 이끄는 어른들.",
    "How will you help?": "어떻게 함께하실 건가요?", "Ways to help": "함께하는 방법",
    "Fund classes": "강의 후원", "Sponsor students.": "학생들을 후원해요.", "Career advice": "진로 조언", "Share what you’ve learned.": "경험을 나눠 주세요.",
    "Teach a live class": "실시간 강의", "Lead a session.": "강의를 맡아 주세요.", "Give feedback": "피드백", "Review student work.": "학생들의 결과를 봐 주세요.",
    "Through Beulah Venture.": "쁄라 벤처를 통해.",
    "Name": "이름", "Email": "이메일", "Your field (optional)": "분야 (선택)", "e.g. Pharmacy, software, finance": "예: 약학, 소프트웨어, 금융",
    "Note (optional)": "메모 (선택)", "Join as a mentor": "멘토로 참여하기",
    "This page wandered off.": "페이지를 찾을 수 없어요.", "Back home": "홈으로",
    "Online giving opens soon.": "온라인 후원은 곧 열려요.", "You’ll be taken to our secure giving page.": "안전한 후원 페이지로 이동해요.",
    "Thank you.": "감사합니다.", "We’ll be in touch soon.": "곧 연락드릴게요.",
    "Live classes run on the real site once it is hosted.": "실시간 강의는 실제 사이트가 열리면 이용할 수 있어요.",
    "Preview only — forms work on the real site once it is hosted.": "미리보기 전용이에요. 실제 사이트에서 신청할 수 있어요.",
  };
  const original = new WeakMap();
  let mem = null;
  const get = () => { if (mem) return mem; try { return localStorage.getItem("hz-lang") === "ko" ? "ko" : "en"; } catch { return "en"; } };
  const set = (v) => { mem = v; try { localStorage.setItem("hz-lang", v); } catch {} };
  window.hzLang = get;

  function apply(root) {
    const lang = get();
    document.documentElement.lang = lang;
    const walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => n.parentElement && !n.parentElement.closest("script,style,[lang=he],.no-i18n,.brand,.lk") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
    });
    let n;
    while ((n = walker.nextNode())) {
      if (!original.has(n)) { const key = n.nodeValue.trim(); if (!KO[key]) continue; original.set(n, n.nodeValue); }
      const en = original.get(n), key = en.trim();
      n.nodeValue = lang === "ko" ? en.replace(key, KO[key]) : en;
    }
    document.querySelectorAll("[placeholder]").forEach((el) => {
      if (!el.dataset.en) { if (!KO[el.placeholder]) return; el.dataset.en = el.placeholder; }
      el.placeholder = lang === "ko" ? KO[el.dataset.en] : el.dataset.en;
    });
    document.querySelectorAll(".lang-btn").forEach((b) => (b.textContent = lang === "ko" ? "English" : "한국어"));
  }
  window.hzI18n = { apply, KO };

  function addButton() {
    const nav = document.querySelector(".site-header .nav");
    if (!nav || nav.querySelector(".lang-btn")) return;
    const b = document.createElement("button");
    b.type = "button"; b.className = "lang-btn";
    b.addEventListener("click", () => {
      set(get() === "ko" ? "en" : "ko");
      apply();
      document.dispatchEvent(new CustomEvent("hz-langchange", { detail: get() }));
    });
    nav.append(b);
  }
  function init() { addButton(); apply(); }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", init) : init();
})();
