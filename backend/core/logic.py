def calc_rr(side: str, entry: float, tp: float, sl: float):
    if side == "Long":
        risk = entry - sl
        reward = tp - entry
    else:
        risk = sl - entry
        reward = entry - tp

    if risk <= 0:
        return None

    return round(reward / risk, 2)


def emotion_score(reason_text: str, confidence: int, impatience: int, revenge: int, fomo: int, checklist_checked: int, rr_value: float, stop_defined: bool):
    score = 0
    reasons = []

    weak_keywords = [
        "그냥", "느낌", "왠지", "오를 것 같", "내릴 것 같", "감", "몰빵",
        "무조건", "반드시", "복구", "급해서", "대충", "찍음"
    ]
    strong_keywords = [
        "지지", "저항", "거래량", "추세", "돌파", "눌림", "구조", "리테스트",
        "전고점", "전저점", "손절", "리스크", "rr", "ema", "rsi", "vwap", "볼린저"
    ]

    reason_lower = reason_text.lower()

    if not stop_defined:
        score += 25
        reasons.append("손절 기준이 없음")

    if rr_value is None:
        score += 20
        reasons.append("TP/SL 구조가 비정상적이라 R:R 계산이 불가함")
    elif rr_value < 1.2:
        score += 18
        reasons.append(f"R:R가 낮음 ({rr_value})")
    elif rr_value < 1.5:
        score += 10
        reasons.append(f"R:R가 다소 애매함 ({rr_value})")

    weak_hit = sum(1 for k in weak_keywords if k in reason_text)
    strong_hit = sum(1 for k in strong_keywords if k in reason_lower)

    if len(reason_text.strip()) < 50:
        score += 12
        reasons.append("진입 근거 설명이 너무 짧음")

    if weak_hit >= 1:
        score += min(weak_hit * 8, 20)
        reasons.append("감정적/직관적 표현이 포함됨")

    if strong_hit >= 4:
        score -= 12
        reasons.append("구조적 근거가 비교적 명확함")

    if confidence >= 9:
        score += 10
        reasons.append("확신 과잉 가능성")
    elif confidence <= 4:
        score += 4
        reasons.append("근거 대비 확신이 낮아 흔들릴 가능성")

    score += impatience * 3
    if impatience >= 3:
        reasons.append("조급함이 높음")

    score += revenge * 5
    if revenge >= 2:
        reasons.append("복구 심리 가능성")

    score += fomo * 4
    if fomo >= 2:
        reasons.append("FOMO 성향이 감지됨")

    if checklist_checked <= 2:
        score += 15
        reasons.append("진입 전 체크리스트 충족 수가 부족함")
    elif checklist_checked == 3:
        score += 7
        reasons.append("체크리스트 충족 수가 애매함")
    else:
        score -= 5
        reasons.append("체크리스트를 비교적 잘 지킴")

    score = max(0, min(100, score))
    return score, reasons


def classify_trade(score: int) -> str:
    if score >= 70:
        return "감정매매 가능성 높음"
    if score >= 45:
        return "혼합형 / 경계 필요"
    return "규칙매매에 가까움"


def grade_step_training(trend_choice: str, structure_choice: str, candle_choice: str, volume_choice: str, indicator_choice: str, final_choice: str):
    points = 0
    notes = []

    if trend_choice == "상승":
        points += 1
    else:
        notes.append("큰 방향부터 틀렸다. 상승 구조를 먼저 읽지 못하면 뒤 판단도 흔들린다.")

    if structure_choice == "눌림 후 재상승 가능 구간":
        points += 1
    else:
        notes.append("자리를 못 봤다. 이 예시는 추격 자리보다 눌림 확인 자리다.")

    if candle_choice == "아랫꼬리 반등 + 종가 회복":
        points += 1
    else:
        notes.append("캔들을 단순 모양으로만 본다. 아래에서 받아 올린 흔적을 읽어야 한다.")

    if volume_choice == "돌파/반등에 힘이 실렸는지 확인":
        points += 1
    else:
        notes.append("거래량은 방향 버튼이 아니라 힘 확인 도구다.")

    if indicator_choice == "구조를 보조하며 진입 확률을 높이는 확인용":
        points += 1
    else:
        notes.append("지표를 정답처럼 보고 있다. 구조를 먼저 보고 지표는 확인용으로 써야 한다.")

    if final_choice == "관점은 롱이지만 손절과 자리 확인 후 계획":
        points += 1
    else:
        notes.append("결론이 너무 성급하다. 방향보다 계획이 먼저다.")

    return points, notes


def build_feedback(side: str, rr_value: float, score: int, reason_points: list, outcome: str, pnl_percent: float, step_points: int, step_notes: list):
    feedback = []
    feedback.append(f"현재 판정은 **{classify_trade(score)}** 입니다.")

    if rr_value is None:
        feedback.append("TP/SL 구조부터 다시 잡아라. 이 상태는 매매 계획이 아니라 추측에 가깝다.")
    elif rr_value < 1.2:
        feedback.append(f"R:R {rr_value}는 별로다. 좋은 자리 아니면 들어가지 마라.")
    elif rr_value < 1.5:
        feedback.append(f"R:R {rr_value}는 애매하다. 확실한 구조 확인 전엔 패스가 맞다.")
    else:
        feedback.append(f"R:R {rr_value} 자체는 나쁘지 않다. 이제 중요한 건 진입 근거의 질이다.")

    filtered = [p for p in reason_points if "비교적 명확" not in p and "비교적 잘 지킴" not in p]
    if filtered:
        feedback.append("문제 요약:\n" + "\n".join([f"- {p}" for p in filtered[:4]]))

    feedback.append(f"사고 훈련 점수: **{step_points} / 6**")
    if step_notes:
        feedback.append("사고 과정 교정:\n" + "\n".join([f"- {n}" for n in step_notes[:4]]))
    else:
        feedback.append("사고 순서는 비교적 괜찮다. 중요한 건 이 순서를 다음 거래에서도 반복하는 거다.")

    if outcome == "Win":
        feedback.append(f"이번 거래는 익절({pnl_percent}%)로 끝났더라도 결과가 논리를 정당화해주진 않는다. 수익보다 과정이 맞았는지 먼저 봐라.")
    elif outcome == "Loss":
        feedback.append(f"손실({pnl_percent}%) 자체보다 왜 이 자리를 선택했는지가 더 중요하다. 손실 뒤 복수심으로 다음 거래를 망치지 마라.")
    elif outcome == "Breakeven":
        feedback.append("본전 청산도 의미 있다. 다만 흔들려서 나온 건지, 원래 계획대로 관리한 건지 구분해야 한다.")
    else:
        feedback.append("아직 결과가 없으면 더 좋다. 지금 단계에서 틀린 거래를 걸러내는 게 목적이다.")

    if score >= 70:
        feedback.append("한 줄 결론: **지금 같은 스타일로 실전 들어가면 계좌 흔들린다. 규칙부터 고쳐라.**")
    elif score >= 45:
        feedback.append("한 줄 결론: **관점은 있을 수 있지만 진입 근거가 아직 덜 정교하다.**")
    else:
        feedback.append("한 줄 결론: **형태는 괜찮다. 다만 계속 같은 기준으로 반복 가능한지 확인해야 한다.**")

    feedback.append("교육 포인트: **추세 확인 → 구조 판단 → 캔들 해석 → 거래량 확인 → 지표 확인 → TP/SL 설정 → 결과 회고** 순서를 반복해 눈을 익혀라.")
    return "\n\n".join(feedback)
