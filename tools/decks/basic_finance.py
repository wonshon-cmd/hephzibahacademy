# Source for public/data/basic-finance.json (Korean is the original; English is a translation).
#   python3 tools/decks/basic_finance.py
import json, os

S = []
def slide(id, section, kind, en, ko, interaction=None, ko_ix=None, notes=None, ko_notes=None):
    s = {"id": id, "section": section[0], "kind": kind, **en}
    s.setdefault("body", [])
    if interaction: s["interaction"] = interaction
    s["notes"] = notes or []
    k = {"section": section[1], **ko, "notes": ko_notes or []}
    k.setdefault("body", [])
    if ko_ix: k["interaction"] = ko_ix
    s["ko"] = k
    S.append(s)

START = ("Start", "시작")
S1 = ("01 Salary and real life", "01 연봉과 실제 생활")
S2 = ("02 How much is enough?", "02 얼마면 충분할까?")
S3 = ("03 Card debt, interest, taxes, house, car", "03 카드빚·복리·세금·집·차·절세")
END = ("10 Application and homework", "10 개인 적용과 과제")

slide("f01", START, "cover",
  {"eyebrow": "HEPHZIBAH ACADEMY", "title": "Basic Finance:\nliving as God’s steward.", "subtitle": "How am I using the time, money and abilities entrusted to me?", "body": ["Basic Finance"]},
  {"eyebrow": "HEPHZIBAH ACADEMY", "title": "기초재정 —\n하나님의 청지기로 살아가기", "subtitle": "내게 맡겨진 시간과 물질과 능력을 어떻게 사용하고 있는가", "body": ["기초재정"]},
  notes=["The heart of this lecture: acknowledge the life we received from God, and use what is entrusted to us according to the Owner’s will."],
  ko_notes=["이 강의의 중심은 하나님께 받은 삶을 인정하고, 맡겨진 것을 주인의 뜻에 따라 사용하는 것입니다."])

slide("f02", START, "statement",
  {"eyebrow": "Giving starts somewhere else", "title": "Not “How much good did\nI do with my money?”", "subtitle": "But “How did I respond to God’s will with what He entrusted to me?”",
   "body": ["Earning, caring for family, paying taxes, preparing for the future, and how we treat employees and customers all belong to this question."]},
  {"eyebrow": "헌금과 나눔의 출발점", "title": "“내 돈으로 얼마나\n좋은 일을 했는가?”보다", "subtitle": "“하나님이 맡기신 것으로 그분의 뜻에 어떻게 응답했는가?”",
   "body": ["나눔뿐 아니라 돈을 버는 과정, 가족을 돌보는 일, 납세, 미래 준비, 직원과 고객을 대하는 태도까지 모두 이 질문 안에 들어갑니다."]},
  notes=["Giving doesn’t start from self-evaluation: “I’m a Christian, so I do good things.”", "It starts from responsibility: as people who received God’s love and grace, we are stewards and agents managing what belongs to God."],
  ko_notes=["헌금과 나눔도 “나는 기독교인이니까 좋은 일을 한다”는 자기평가에서 출발하지 않습니다.", "하나님께 사랑과 은혜를 받은 사람으로서, 하나님의 것을 맡아 관리하는 청지기이자 대리인이라는 책임에서 출발합니다."])

slide("f03", START, "path",
  {"eyebrow": "How we’ll work", "title": "Question first.\nThen Scripture.", "subtitle": "Scripture notes are summaries. Modern finance and math are applications.",
   "body": ["Question", "My answer", "Guess vs. actual", "Scripture", "Application"]},
  {"eyebrow": "진행 방식", "title": "질문으로 시작해\n말씀으로 갑니다.", "subtitle": "성경 설명은 본문의 요약이며, 현대 금융제도와 계산은 적용으로 구분합니다.",
   "body": ["질문", "개인 응답", "예상과 실제 비교", "성경 본문", "적용"]})

slide("f04", START, "privacy",
  {"eyebrow": "Before we start", "title": "Scan, get a name,\nanswer privately.", "subtitle": "Income, assets and debt are answered as ranges. You can skip any question.",
   "body": ["Each person gets a random Bible-character name and portrait", "Only totals are shown, never individual finances", "Research use and future counseling contact are separate, optional choices"]},
  {"eyebrow": "시작 전 — 참여 준비", "title": "QR로 접속하고,\n가명으로 참여해요.", "subtitle": "소득·자산·부채는 범위로 응답하며 건너뛸 수 있습니다.",
   "body": ["성경 인물 가명과 그림을 무작위로 배정받아요", "개별 재정 내용은 공개하지 않고 집계만 보여줘요", "연구 활용과 향후 상담 연락은 각각 선택 동의예요"]},
  notes=["Have everyone scan the QR code. They can roll again before confirming their name; confirmed names appear on the presenter screen."],
  ko_notes=["QR 코드로 접속해 정보 이용 안내를 확인하고, 가명을 배정받습니다. 재추첨 후 이름을 확정하면 진행자 화면에 접속 상태가 표시됩니다."])

slide("f05", S1, "choice",
  {"eyebrow": "Question one", "title": "If your salary doubled,\nwould money worry halve?", "subtitle": "Choose your income range. You can skip."},
  {"eyebrow": "첫 번째 질문", "title": "연봉이 두 배가 되면,\n돈 걱정도 절반으로 줄어들까요?", "subtitle": "소득 범위를 선택해 주세요. 건너뛰어도 괜찮아요."},
  interaction={"type": "choice", "prompt": "My yearly income (range)", "options": [
    {"value": "u30", "label": "Under $30,000"}, {"value": "30-60", "label": "$30,000–60,000"}, {"value": "60-100", "label": "$60,000–100,000"},
    {"value": "100-200", "label": "$100,000–200,000"}, {"value": "200p", "label": "$200,000+"}, {"value": "na", "label": "Prefer not to say"}]},
  ko_ix={"prompt": "나의 연 소득 (범위)", "options": {"u30": "$30,000 미만", "30-60": "$30,000–60,000", "60-100": "$60,000–100,000", "100-200": "$100,000–200,000", "200p": "$200,000 이상", "na": "답하지 않을래요"}})

slide("f06", S1, "choice",
  {"eyebrow": "Right now", "title": "How is your month,\nhonestly?", "subtitle": "Only totals appear on screen."},
  {"eyebrow": "지금 나의 생활", "title": "솔직히, 요즘 한 달은\n어떤가요?", "subtitle": "화면에는 집계만 보여요."},
  interaction={"type": "choice", "prompt": "My monthly situation", "options": [
    {"value": "room", "label": "There’s room"}, {"value": "tight", "label": "It’s tight"}, {"value": "short", "label": "Short every month"}, {"value": "unsure", "label": "I don’t really know"}]},
  ko_ix={"prompt": "나의 한 달 형편", "options": {"room": "여유가 있다", "tight": "빠듯하다", "short": "매달 적자다", "unsure": "잘 모르겠다"}},
  notes=["You may know your salary but not what’s actually left.", "Let’s check: is income too low, are essential costs too high, or are we spending more than we think?"],
  ko_notes=["“연봉은 알아도, 실제로 얼마가 남는지는 모를 수 있습니다.", "소득이 부족한 것인지, 필수비용이 큰 것인지, 생각보다 많이 쓰고 있는 것인지부터 확인해보겠습니다.”"])

slide("f07", S1, "path",
  {"eyebrow": "Where did the money go?", "title": "From gross pay\nto what’s left.", "subtitle": "",
   "body": ["Gross pay", "Taxes & deductions", "Take-home pay", "Living costs & debt payments", "Saving, giving & choices"]},
  {"eyebrow": "돈은 어디 갔을까?", "title": "총급여에서\n남는 돈까지.", "subtitle": "",
   "body": ["총급여", "세금·공제", "실수령액", "생활비·부채상환", "저축·나눔·선택지출"]})

slide("f08", S1, "estimate",
  {"eyebrow": "Guess, then check", "title": "What do you spend\nin a month on…", "subtitle": "Guess first. Then compare with your real statements on your phone. This stays private.",
   "body": ["What did I spend the most on?", "How much spending don’t I remember?", "Do my spending and what I say I value match?"]},
  {"eyebrow": "예상하고, 확인하기", "title": "한 달에 이것들에\n얼마를 쓸까요?", "subtitle": "먼저 예상하고, 휴대폰에서 실제 내역과 비교해요. 나만 볼 수 있어요.",
   "body": ["무엇에 가장 많이 썼는가?", "기억하지 못하는 지출은 얼마인가?", "내가 소중하다고 말하는 것과 사용처가 일치하는가?"]},
  interaction={"type": "estimate", "prompt": "Monthly spending: guess vs. actual", "categories": [
    {"id": "delivery", "label": "Delivery"}, {"id": "dining", "label": "Eating out"}, {"id": "shopping", "label": "Shopping"}, {"id": "subs", "label": "Subscriptions"}]},
  ko_ix={"prompt": "한 달 지출: 예상 vs 실제", "categories": {"delivery": "배달", "dining": "외식", "shopping": "쇼핑", "subs": "구독"}},
  notes=["Don’t blame every financial struggle on spending habits. Look at real income and essential costs together."],
  ko_notes=["경제적 어려움을 모두 소비 습관 탓으로 돌리지 않습니다. 실제 소득과 필수비용을 함께 봅니다."])

slide("f09", S1, "scripture",
  {"eyebrow": "Genesis 39:2, 21–23 · summary", "title": "Joseph: God was with him\nas a slave and in prison.", "subtitle": "God’s presence didn’t begin when Joseph became prime minister.",
   "body": ["The numbers we look at today help me understand my situation. They don’t decide my worth before God."]},
  {"eyebrow": "창세기 39:2, 21–23 · 요약", "title": "요셉은 종의 자리와 감옥에서도\n하나님이 함께하셨습니다.", "subtitle": "총리가 된 뒤에야 하나님의 함께하심이 시작된 것은 아닙니다.",
   "body": ["오늘 살펴볼 숫자는 내 형편을 이해하기 위한 것입니다. 하나님 앞에서 내 가치를 결정하는 숫자는 아닙니다."]})

slide("f10", S2, "choice",
  {"eyebrow": "Question two", "title": "How much would\nbe enough?", "subtitle": "Pick the number closest to your gut answer."},
  {"eyebrow": "두 번째 질문", "title": "얼마면\n충분할까?", "subtitle": "마음속에 떠오르는 숫자에 가까운 것을 골라 보세요."},
  interaction={"type": "choice", "prompt": "Enough would be…", "options": [
    {"value": "100k", "label": "$100,000 a year"}, {"value": "200k", "label": "$200,000 a year"}, {"value": "1b", "label": "₩1 billion in assets"},
    {"value": "2b", "label": "₩2 billion in assets"}, {"value": "none", "label": "Hard to put a number on it"}]},
  ko_ix={"prompt": "충분한 건…", "options": {"100k": "연봉 $100,000", "200k": "연봉 $200,000", "1b": "자산 10억 원", "2b": "자산 20억 원", "none": "숫자로 말하기 어렵다"}})

slide("f11", S2, "text-input",
  {"eyebrow": "What money promises", "title": "If you had that money,\nwhat do you hope would change?", "subtitle": "One line. No names on screen."},
  {"eyebrow": "돈이 내게 약속하는 것", "title": "그 돈이 생기면\n무엇이 달라지길 바라나요?", "subtitle": "한 줄이면 충분해요. 이름은 나오지 않아요."},
  interaction={"type": "text", "prompt": "If I had that money, I hope…", "placeholder": "e.g. I wouldn’t worry about my parents’ health costs", "maxLength": 180},
  ko_ix={"prompt": "그 돈이 생기면, 나는…", "placeholder": "예: 부모님 병원비 걱정을 안 했으면 좋겠어요"})

slide("f12", S2, "list",
  {"eyebrow": "“I don’t have money” can mean…", "title": "Not all “no money”\nis the same.", "subtitle": "",
   "body": ["Basic living costs aren’t covered", "Debt and fixed costs leave nothing", "No room to prepare for the future", "I can’t spend at the level I want"]},
  {"eyebrow": "‘돈이 없다’의 의미", "title": "‘돈이 없다’도\n다 같지 않아요.", "subtitle": "",
   "body": ["기본생활비가 부족하다", "부채와 고정비 때문에 남지 않는다", "미래를 준비할 여유가 없다", "원하는 수준의 소비가 어렵다"]})

slide("f13", S2, "questions",
  {"eyebrow": "The heart behind the choice", "title": "Why do I want\na new car?", "subtitle": "We’re not judging cars or houses. We’re looking at what moves the choice.",
   "body": ["If I earned more, why would I want to change my car?", "Is changing houses about my family’s needs, or feeling successful?", "Where did “I should have at least this much” come from?"]},
  {"eyebrow": "선택을 움직이는 마음", "title": "돈을 더 벌면\n왜 차를 바꾸고 싶을까요?", "subtitle": "차와 집 자체를 판단하기보다, 선택을 움직이는 마음을 살펴봅니다.",
   "body": ["돈을 더 벌면 왜 차를 바꾸고 싶을까요?", "집을 바꾸는 이유는 가족의 필요인가요, 성공했다는 느낌인가요?", "‘이 정도는 가져야 한다’는 기준은 어디서 왔나요?"]})

slide("f14", S2, "statement",
  {"eyebrow": "Building wealth", "title": "Then who is\nthat money for?", "subtitle": "Earn more. Spend less than you earn. Build assets that create lasting income.",
   "body": ["And then always ask: who is it for?"]},
  {"eyebrow": "부를 쌓는 기본 방향", "title": "그렇게 모은 돈은\n누구를 위한 것인가?", "subtitle": "소득을 늘리고, 버는 것보다 적게 쓰며, 지속적인 소득을 만들 자산을 준비합니다.",
   "body": ["그다음 반드시 묻습니다. 누구를 위한 것인가?"]})

slide("f15", S2, "scripture",
  {"eyebrow": "Mark 10:17–27 · Matthew 13:44–46 · summary", "title": "The rich young man,\nand the treasure in the field.", "subtitle": "One went away sad, unable to let go. One sold everything with joy.",
   "body": ["Do I treasure the gospel that much?", "Do I believe God is good, yet think money will protect me more surely?", "Also: Matthew 6:24 · Proverbs 30:7–9 · 1 Timothy 6:6–10"]},
  {"eyebrow": "마가복음 10:17–27 · 마태복음 13:44–46 · 요약", "title": "부자 청년과\n밭의 보화", "subtitle": "부자 청년은 재산을 놓기 어려워 슬퍼했고, 보화를 발견한 사람은 기뻐하며 가진 것을 팔았습니다.",
   "body": ["나는 복음을 그만큼 귀하게 여기고 있나요?", "하나님이 선하시다고 믿으면서, 돈이 나를 더 확실하게 지켜준다고 생각하지 않나요?", "연결 본문: 마태복음 6:24 · 잠언 30:7–9 · 디모데전서 6:6–10"]},
  notes=["This is not a formula that giving up wealth saves you. It asks what we hold onto as master."],
  ko_notes=["재산을 포기하면 구원받는다는 공식이 아니라, 무엇을 주인으로 붙잡고 있는가를 묻는 시간입니다."])

slide("f16", S3, "statement",
  {"eyebrow": "How money works", "title": "Money is hard.\nSo let’s learn it.", "subtitle": "Instead of vague fear, learn what results our choices create.", "body": []},
  {"eyebrow": "돈의 구조 이해하기", "title": "돈이 어렵다는 것을\n이해합니다.", "subtitle": "막연히 두려워하기보다, 내 선택이 어떤 결과를 만드는지 배워야 합니다.", "body": []})

slide("f17", S3, "calculator",
  {"eyebrow": "Card debt & compound interest · Proverbs 22:7", "title": "“I learned compound interest\nthrough credit card debt.”", "subtitle": "Check: total balance, APR, due date, minimum payment, what you can really pay.",
   "body": ["Paying in full vs. carrying a balance", "How long minimum payments take", "A plan you can keep, alongside basic living costs"]},
  {"eyebrow": "카드빚과 복리 · 잠언 22:7", "title": "“나는 카드빚을 통해\n복리를 배웠습니다.”", "subtitle": "확인할 것: 전체 잔액·이자율·결제일·최소 납부액·실제 상환 가능액",
   "body": ["전액 결제와 잔액 이월 구분하기", "최소 납부액만 낼 때 상환기간", "기본생활비를 고려한, 지킬 수 있는 상환 계획"]},
  interaction={"type": "calculator", "prompt": "Card payoff calculator"},
  ko_ix={"prompt": "카드빚 상환 계산기"},
  notes=["Proverbs 22:7: debt binds our future choices."], ko_notes=["잠언 22:7: 부채가 미래의 선택을 묶는 문제를 생각합니다."])

slide("f18", S3, "list",
  {"eyebrow": "Taxes · Romans 13:6–7", "title": "Pay honestly.\nPrepare wisely.", "subtitle": "Not avoiding taxes, but paying what’s owed and using allowed tools to prepare for the future.",
   "body": ["Tax brackets: each layer of income is taxed at its own rate", "Deductions lower taxable income; credits lower the tax itself", "401(k) and IRA encourage retirement saving, but not every benefit has the same purpose"]},
  {"eyebrow": "세금과 절세 · 로마서 13:6–7", "title": "낼 세금은 정직하게,\n미래는 지혜롭게.", "subtitle": "세금을 내지 말자는 것이 아니라, 허용된 제도로 미래의 책임도 준비하자는 것입니다.",
   "body": ["구간별 과세: 소득 구간마다 다른 세율", "소득공제는 과세 소득을, 세액공제는 세금 자체를 줄여요", "401(k)·IRA는 은퇴 준비를 장려하는 장치. 모든 혜택의 목적이 같지는 않아요"]})

slide("f19", S3, "list",
  {"eyebrow": "House, car & deductions", "title": "If it’s deductible, is the\nmore expensive one a win?", "subtitle": "Count every cost, then see what’s actually left.",
   "body": ["House: interest, property tax, insurance, repairs, transaction costs", "Car: financing, insurance, maintenance, parking, depreciation"]},
  {"eyebrow": "집·차·절세", "title": "공제가 되면 더 비싼 것을\n사도 이득일까요?", "subtitle": "세금이 줄었다는 사실보다, 모든 비용을 계산한 뒤 무엇이 남는지 확인합시다.",
   "body": ["집: 이자·재산세·보험·수리·거래비용", "차: 금융비용·보험·정비·주차·가치 하락"]})

SECTIONS = [
  ("f25", ("05 Work and starting a business", "05 직업과 창업"), "Section five", "다섯 번째", "Work and starting a business:\nvalue and faithfulness", "직업과 창업 —\n가치와 성실함"),
  ("f26", ("06 Stocks and cash flow", "06 주식과 현금흐름"), "Section six", "여섯 번째", "Stocks and cash flow:\nwhat do I own?", "주식과 현금흐름 —\n무엇을 소유하는가?"),
  ("f27", ("07 God’s steward", "07 하나님의 청지기"), "Section seven", "일곱 번째", "God’s steward:\nwhose will do I use it for?", "하나님의 청지기 —\n누구의 뜻대로 사용하는가?"),
  ("f28", ("08 Offering and giving", "08 헌금과 나눔"), "Section eight", "여덟 번째", "Offering and giving:\ncaring for people with what’s entrusted", "헌금과 나눔 —\n맡겨진 것으로 사람을 돌보기"),
  ("f29", ("09 Joseph again", "09 다시 요셉"), "Section nine", "아홉 번째", "Joseph again:\nwhy did God entrust it?", "다시 요셉 —\n왜 맡기셨을까?"),
]
S4 = ("04 Living to 80, 90, 100", "04 80·90·100세의 나")
slide("f20", S4, "list",
  {"eyebrow": "Section four", "title": "Am I ready to live\nto 80, 90, 100?", "subtitle": "Retiring at 65, how many years do I need to prepare for?",
   "body": ["To 80 · 15 years", "To 90 · 25 years", "To 100 · 35 years"]},
  {"eyebrow": "네 번째 · 책임 있는 미래 준비", "title": "나는 80·90·100세까지\n살 준비가 되어 있는가?", "subtitle": "65세에 은퇴한다면, 준비할 기간은?",
   "body": ["80세까지 · 15년", "90세까지 · 25년", "100세까지 · 35년"]})
slide("f30", S4, "statement",
  {"eyebrow": "After the paycheck", "title": "Your paycheck stops.\nYour needs don’t.", "subtitle": "Housing, food, medicine and care, caregiving, and the cost of relationships.",
   "body": ["Compare today’s living costs with future needs, including inflation."]},
  {"eyebrow": "급여가 멈춘 뒤", "title": "급여가 멈춰도\n필요한 것은 남습니다.", "subtitle": "집, 먹을 것, 약과 의료, 돌봄, 관계를 위한 비용입니다.",
   "body": ["인플레이션을 반영해 현재의 생활비와 미래의 필요를 비교합니다."]})
slide("f31", S4, "list",
  {"eyebrow": "401(k) · IRA", "title": "Retirement accounts,\nexplained.", "subtitle": "",
   "body": ["Workplace retirement plans and personal retirement accounts", "How Traditional and Roth are taxed", "Company match, eligibility to contribute, withdrawal rules"]},
  {"eyebrow": "401(k) · IRA", "title": "은퇴계좌,\n이렇게 다릅니다.", "subtitle": "",
   "body": ["직장 은퇴제도와 개인 은퇴계좌", "Traditional과 Roth의 세금 처리", "회사 매칭·납입 자격·인출 조건"]})
slide("f32", S4, "compound",
  {"eyebrow": "Compound growth activity", "title": "Change when you start,\nhow long, and how much.", "subtitle": "Try it on your phone. The numbers are examples, not a promise of returns.", "body": []},
  {"eyebrow": "복리 활동", "title": "시작 시점·기간·납입액을\n바꿔봅니다.", "subtitle": "휴대폰에서 직접 바꿔 보세요. 수익률은 예시이며 보장이 아닙니다.", "body": []},
  interaction={"type": "compound", "prompt": "Compound growth"}, ko_ix={"prompt": "복리 계산"})

for sid, sec, ey_en, ey_ko, t_en, t_ko in SECTIONS:
    slide(sid, sec, "section", {"eyebrow": ey_en, "title": t_en, "subtitle": "", "body": []}, {"eyebrow": ey_ko, "title": t_ko, "subtitle": "", "body": []},
          notes=["(Content for this section is coming.)"], ko_notes=["(이 섹션 내용은 추가 예정)"])

slide("f21", END, "statement",
  {"eyebrow": "Using it well", "title": "Using life well isn’t\nfilling every hour with output.", "subtitle": "Resting, getting care, being with family, staying beside someone who grieves: this too is treasuring the life entrusted to us.", "body": []},
  {"eyebrow": "잘 사용한다는 것", "title": "모든 시간을 성과로\n채우는 뜻이 아닙니다.", "subtitle": "쉬고, 치료받고, 가족과 함께하고, 슬퍼하는 사람 곁에 머무는 것도 맡겨진 삶을 소중히 사용하는 일입니다.", "body": []})

slide("f22", END, "worksheet",
  {"eyebrow": "Personal application", "title": "Fill in the blanks.", "subtitle": "This stays on your phone."},
  {"eyebrow": "개인 적용", "title": "빈칸을 채워 보세요.", "subtitle": "휴대폰에만 남아요."},
  interaction={"type": "private", "prompt": "Personal application", "privacy": "This stays on your phone. It never appears on the big screen.", "fields": [
    {"id": "enough", "label": "For me, an enough life is ______.", "placeholder": ""},
    {"id": "promise", "label": "What I believed money promised me is ______.", "placeholder": ""},
    {"id": "change", "label": "In the next 30 days I will change ______.", "placeholder": ""},
    {"id": "care", "label": "With what I have now, I will care for ______.", "placeholder": ""}]},
  ko_ix={"prompt": "개인 적용", "privacy": "내 휴대폰에만 남아요. 큰 화면에는 나오지 않아요.", "fields": {
    "enough": {"label": "나에게 충분한 삶은 ______이다."}, "promise": {"label": "돈이 내게 약속한다고 믿었던 것은 ______이다."},
    "change": {"label": "앞으로 30일 안에 바꿀 행동은 ______이다."}, "care": {"label": "지금 맡겨진 것으로 돌볼 사람은 ______이다."}}})

slide("f23", END, "checklist",
  {"eyebrow": "At home", "title": "Five things\nto do this month.", "subtitle": "Check them off on your phone.",
   "body": ["Review the last 30 days of spending, plus card balances and interest rates", "For ten things you own: price, why you bought it, times used, would you buy again", "Find one thing you didn’t know about your emergency fund or retirement account", "Understand and solve one problem for a customer, coworker or employee", "Practice one kind of giving: money, time, skill or a visit"]},
  {"eyebrow": "집에서 할 과제", "title": "이번 달에 해 볼\n다섯 가지", "subtitle": "휴대폰에서 체크해 보세요.",
   "body": ["지난 30일 지출과 카드 잔액·이자율 확인하기", "물건 열 개의 가격·구매 이유·사용 횟수·재구매 의사 적기", "비상자금·은퇴계좌에서 모르던 내용 하나 확인하기", "고객·동료·직원의 문제 하나를 더 잘 알아보고 해결하기", "돈·시간·기술·방문 중 가능한 나눔 하나 실천하기"]},
  interaction={"type": "checklist", "prompt": "Home tasks"}, ko_ix={"prompt": "집에서 할 과제"})

slide("f24", END, "closing",
  {"eyebrow": "HEPHZIBAH ACADEMY", "title": "A good person who gives what’s mine,\nor a steward answering His will?", "subtitle": "Do I want to live as a good person who gives from what is mine, or am I living as a steward who holds what is God’s and responds to His will?", "body": []},
  {"eyebrow": "HEPHZIBAH ACADEMY", "title": "내 것을 베푸는 좋은 사람인가,\n그분의 뜻에 응답하는 청지기인가?", "subtitle": "“나는 내 것을 베푸는 좋은 사람으로 살고 싶은가, 하나님의 것을 맡아 그분의 뜻에 응답하는 청지기로 살고 있는가?”", "body": []},
  interaction={"type": "text", "channel": "qa", "prompt": "Any questions?", "placeholder": "Ask anything. No names shown.", "maxLength": 200},
  ko_ix={"prompt": "궁금한 점이 있나요?", "placeholder": "무엇이든 물어보세요. 이름은 보이지 않아요."})

deck = {
  "id": "basic-finance", "track": "Finance", "title": "Basic Finance", "fullTitle": "Basic Finance: Living as God’s Steward",
  "subtitle": "How am I using the time, money and abilities entrusted to me?", "speaker": "Joseph Shon", "minutes": 60, "minutes2h": 120,
  "pseudonyms": "bible", "consent": True,
  "summary": "A Christian view of money for life in the U.S.: income and real life, how much is enough, card debt, taxes, houses and cars, and living to 100. Question, personal answer, guess vs. actual, Scripture, application.",
  "runOfShow": [
    {"label": "Salary and real life: where did the money go?", "slides": "5–9", "minutes": 6, "minutes2h": 12},
    {"label": "How much is enough? Money and my heart", "slides": "10–15", "minutes": 6, "minutes2h": 12},
    {"label": "Card debt, compound interest, taxes, house, car", "slides": "16–19", "minutes": 10, "minutes2h": 20},
    {"label": "Me at 80, 90, 100: preparing a responsible future", "slides": "20–23", "minutes": 9, "minutes2h": 18},
    {"label": "Work and starting a business: value and faithfulness", "slides": "24", "minutes": 8, "minutes2h": 16},
    {"label": "Stocks and cash flow: what do I own?", "slides": "25", "minutes": 7, "minutes2h": 14},
    {"label": "God’s steward: whose will do I use it for?", "slides": "26", "minutes": 6, "minutes2h": 12},
    {"label": "Offering and giving: caring for people with what’s entrusted", "slides": "27", "minutes": 4, "minutes2h": 8},
    {"label": "Joseph again: why did God entrust it?", "slides": "28", "minutes": 2, "minutes2h": 5},
    {"label": "Personal application and homework", "slides": "29–32", "minutes": 2, "minutes2h": 3}],
  "ko": {"title": "기초재정", "fullTitle": "기초재정 — 하나님의 청지기로 살아가기", "subtitle": "내게 맡겨진 시간과 물질과 능력을 어떻게 사용하고 있는가", "track": "재정", "speaker": "손원규",
    "summary": "미국에서 살아가는 그리스도인의 재정관: 연봉과 실제 생활, 얼마면 충분한가, 카드빚과 복리, 세금, 집과 차, 100세 준비. 질문 → 개인 응답 → 예상과 실제 비교 → 성경 본문 → 적용.",
    "runOfShow": ["연봉과 실제 생활 — 돈은 어디 갔을까?", "얼마면 충분할까? — 돈과 내 마음", "카드빚·복리·세금·집·차·절세", "80·90·100세의 나 — 책임 있는 미래 준비", "직업과 창업 — 가치와 성실함", "주식과 현금흐름 — 무엇을 소유하는가?", "하나님의 청지기 — 누구의 뜻대로 사용하는가?", "헌금과 나눔 — 맡겨진 것으로 사람을 돌보기", "다시 요셉 — 왜 맡기셨을까?", "개인 적용과 과제"]},
  "slides": S,
}
root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
json.dump(deck, open(os.path.join(root, "public", "data", "basic-finance.json"), "w"), ensure_ascii=False, indent=1)
print(len(S), "slides")
