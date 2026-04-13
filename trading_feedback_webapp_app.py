import json
import os
from datetime import datetime
from pathlib import Path

import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import streamlit as st

# =========================
# Page setup
# =========================
st.set_page_config(
    page_title="Trading Insight Trainer",
    page_icon="📈",
    layout="wide",
)

DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)
TRADES_FILE = DATA_DIR / "trades.json"


# =========================
# Storage helpers
# =========================
def load_trades():
    if TRADES_FILE.exists():
        with open(TRADES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []



def save_trades(trades):
    with open(TRADES_FILE, "w", encoding="utf-8") as f:
        json.dump(trades, f, ensure_ascii=False, indent=2)



def save_uploaded_file(uploaded_file, trade_id, prefix):
    if uploaded_file is None:
        return None

    ext = Path(uploaded_file.name).suffix
    file_name = f"{trade_id}_{prefix}{ext}"
    file_path = DATA_DIR / file_name

    with open(file_path, "wb") as f:
        f.write(uploaded_file.getbuffer())

    return str(file_path)



def normalize_trade_records(trades):
    normalized = []
    defaults = {
        "step_points": 0,
        "trend_choice": "-",
        "structure_choice": "-",
        "candle_choice": "-",
        "volume_choice": "-",
        "indicator_choice": "-",
        "final_choice": "-",
        "reason_points": [],
        "feedback": "저장 당시에는 상세 피드백 기능이 없었던 기록입니다.",
        "reflection": "",
        "rr": None,
        "classification": "기존 기록",
        "score": 0,
        "outcome": "Planned Only",
        "pnl_percent": 0.0,
    }

    for trade in trades:
        item = dict(defaults)
        item.update(trade)
        normalized.append(item)
    return normalized


# =========================
# Trading helpers
# =========================
def calc_rr(side, entry, tp, sl):
    if side == "Long":
        risk = entry - sl
        reward = tp - entry
    else:
        risk = sl - entry
        reward = entry - tp

    if risk <= 0:
        return None

    return round(reward / risk, 2)



def emotion_score(reason_text, confidence, impatience, revenge, fomo, checklist_checked, rr_value, stop_defined):
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



def classify_trade(score):
    if score >= 70:
        return "감정매매 가능성 높음"
    if score >= 45:
        return "혼합형 / 경계 필요"
    return "규칙매매에 가까움"



def grade_step_training(trend_choice, structure_choice, candle_choice, volume_choice, indicator_choice, final_choice):
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



def build_feedback(side, rr_value, score, reason_points, outcome, pnl_percent, step_points, step_notes):
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


# =========================
# Chart builders
# =========================
def draw_single_candle_chart(title, open_price, high_price, low_price, close_price, annotation):
    fig = go.Figure(
        data=[
            go.Candlestick(
                x=[title],
                open=[open_price],
                high=[high_price],
                low=[low_price],
                close=[close_price],
                name=title,
            )
        ]
    )
    fig.update_layout(
        height=330,
        template="plotly_white",
        xaxis_rangeslider_visible=False,
        margin=dict(l=20, r=20, t=45, b=20),
        showlegend=False,
        annotations=[
            dict(
                x=title,
                y=high_price,
                text=annotation,
                showarrow=True,
                arrowhead=2,
                yshift=25,
            )
        ],
    )
    return fig



def build_market_structure_chart():
    x = list(range(1, 13))
    open_data = [100, 101, 102, 101, 103, 104, 103, 105, 106, 105, 107, 108]
    high_data = [102, 103, 103, 104, 105, 106, 105, 107, 108, 107, 109, 110]
    low_data = [99, 100, 100, 100, 102, 103, 102, 104, 105, 104, 106, 107]
    close_data = [101, 102, 101, 103, 104, 105, 104, 106, 107, 106, 108, 109]

    fig = go.Figure(data=[go.Candlestick(x=x, open=open_data, high=high_data, low=low_data, close=close_data)])
    fig.update_layout(height=430, template="plotly_white", xaxis_rangeslider_visible=False, margin=dict(l=20, r=20, t=40, b=20))
    return fig



def build_indicator_demo_chart():
    x = list(range(1, 21))
    open_data = [100, 101, 102, 101, 103, 104, 105, 106, 105, 107, 108, 109, 110, 109, 111, 112, 113, 114, 113, 115]
    high_data = [102, 103, 103, 104, 105, 106, 107, 107, 108, 109, 110, 111, 111, 112, 113, 114, 115, 116, 116, 117]
    low_data = [99, 100, 100, 100, 102, 103, 104, 104, 104, 106, 107, 108, 108, 108, 110, 111, 112, 113, 112, 114]
    close_data = [101, 102, 101, 103, 104, 105, 106, 105, 107, 108, 109, 110, 109, 111, 112, 113, 114, 113, 115, 116]

    ema20 = [100.5, 100.8, 101.0, 101.3, 101.9, 102.7, 103.6, 104.1, 104.6, 105.3, 106.1, 107.0, 107.5, 108.1, 109.0, 110.0, 111.0, 111.6, 112.4, 113.2]
    ema60 = [100.3, 100.5, 100.7, 100.9, 101.2, 101.6, 102.0, 102.5, 103.0, 103.6, 104.2, 104.9, 105.5, 106.1, 106.8, 107.6, 108.4, 109.1, 109.9, 110.7]
    ema120 = [100.1, 100.2, 100.3, 100.5, 100.7, 101.0, 101.3, 101.7, 102.1, 102.6, 103.1, 103.7, 104.3, 104.9, 105.6, 106.3, 107.0, 107.8, 108.6, 109.4]
    vwap = [100.4, 100.7, 100.9, 101.2, 101.8, 102.5, 103.2, 103.8, 104.3, 105.0, 105.8, 106.7, 107.2, 107.8, 108.6, 109.5, 110.4, 111.1, 111.9, 112.7]
    bb_upper = [102, 102.5, 102.8, 103.4, 104.2, 105.0, 105.8, 106.1, 106.7, 107.5, 108.3, 109.2, 109.6, 110.4, 111.3, 112.2, 113.1, 113.6, 114.5, 115.3]
    bb_lower = [98.5, 99.1, 99.4, 99.9, 100.5, 101.3, 102.1, 102.5, 102.9, 103.5, 104.1, 104.8, 105.4, 105.9, 106.7, 107.5, 108.3, 108.8, 109.6, 110.4]
    volume = [120, 140, 130, 160, 180, 190, 210, 170, 200, 220, 230, 250, 210, 240, 260, 280, 300, 240, 310, 330]
    rsi = [48, 52, 50, 55, 58, 61, 64, 57, 62, 66, 68, 71, 63, 67, 70, 73, 76, 69, 74, 78]

    fig = make_subplots(
        rows=3,
        cols=1,
        shared_xaxes=True,
        vertical_spacing=0.04,
        row_heights=[0.58, 0.18, 0.24],
        subplot_titles=("캔들 + EMA + VWAP + 볼린저 밴드", "거래량", "RSI"),
    )

    fig.add_trace(go.Candlestick(x=x, open=open_data, high=high_data, low=low_data, close=close_data, name="Candles"), row=1, col=1)
    fig.add_trace(go.Scatter(x=x, y=ema20, mode="lines", name="EMA 20"), row=1, col=1)
    fig.add_trace(go.Scatter(x=x, y=ema60, mode="lines", name="EMA 60"), row=1, col=1)
    fig.add_trace(go.Scatter(x=x, y=ema120, mode="lines", name="EMA 120"), row=1, col=1)
    fig.add_trace(go.Scatter(x=x, y=vwap, mode="lines", name="VWAP"), row=1, col=1)
    fig.add_trace(go.Scatter(x=x, y=bb_upper, mode="lines", name="BB Upper"), row=1, col=1)
    fig.add_trace(go.Scatter(x=x, y=bb_lower, mode="lines", name="BB Lower"), row=1, col=1)
    fig.add_trace(go.Bar(x=x, y=volume, name="Volume"), row=2, col=1)
    fig.add_trace(go.Scatter(x=x, y=rsi, mode="lines", name="RSI"), row=3, col=1)
    fig.add_hline(y=70, line_dash="dash", row=3, col=1)
    fig.add_hline(y=30, line_dash="dash", row=3, col=1)

    fig.update_layout(
        height=760,
        template="plotly_white",
        xaxis_rangeslider_visible=False,
        margin=dict(l=20, r=20, t=70, b=20),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
    )
    return fig


# =========================
# Quiz data
# =========================
QUIZ_QUESTIONS = [
    {
        "question": "윗꼬리가 길게 달린 캔들은 보통 무엇을 시사할 수 있을까?",
        "options": ["매수세만 강함", "위에서 매도 압력이 있었을 수 있음", "무조건 상승 시작"],
        "answer": "위에서 매도 압력이 있었을 수 있음",
        "explanation": "윗꼬리는 위쪽 가격을 유지하지 못하고 밀린 흔적이다. 다만 위치와 구조를 같이 봐야 한다.",
    },
    {
        "question": "트레이딩에서 가장 먼저 봐야 할 것은?",
        "options": ["RSI 수치", "시장 구조와 추세", "뉴스 제목 하나"],
        "answer": "시장 구조와 추세",
        "explanation": "구조를 먼저 보고, 지표는 나중에 확인용으로 써야 한다.",
    },
    {
        "question": "20 EMA는 무엇을 의미할까?",
        "options": ["최근 20개 캔들의 종가 평균 흐름", "최근 20일 거래량 합계", "20번의 진입 신호"],
        "answer": "최근 20개 캔들의 종가 평균 흐름",
        "explanation": "EMA는 일정 기간 종가 평균을 최근 값에 더 민감하게 반영한 이동평균선이다.",
    },
    {
        "question": "RSI가 75라고 해서 가장 적절한 해석은?",
        "options": ["무조건 숏", "과열 가능성은 있으나 구조를 먼저 확인", "하락 확정"],
        "answer": "과열 가능성은 있으나 구조를 먼저 확인",
        "explanation": "RSI는 보조지표다. 단독 진입 버튼처럼 쓰면 계속 당한다.",
    },
    {
        "question": "거래량이 없는 돌파는 왜 주의해야 할까?",
        "options": ["힘 없는 움직임일 수 있어서", "항상 더 강한 상승이라서", "손절이 필요 없어서"],
        "answer": "힘 없는 움직임일 수 있어서",
        "explanation": "거래량은 움직임에 실제 힘이 실렸는지 보여준다.",
    },
    {
        "question": "VWAP을 보는 가장 적절한 이유는?",
        "options": ["기관/평균 체결 가격 기준 확인", "가격을 예언", "손절 없이 진입 가능 확인"],
        "answer": "기관/평균 체결 가격 기준 확인",
        "explanation": "VWAP은 평균 체결 가격 기준선이다. 위냐 아래냐로 상대 강약을 보는 데 자주 활용된다.",
    },
]


# =========================
# Pages
# =========================
def render_tutorial_page():
    st.title("📚 트레이딩 기초 튜토리얼")
    st.caption("기초 개념을 눈으로 익히고, 나중에 연습하기에서 근거를 직접 쓰도록 만드는 학습 페이지")

    tab1, tab2, tab3 = st.tabs(["캔들 기초", "시장 구조", "기본 지표"])

    with tab1:
        st.subheader("1. 캔들 구조를 눈으로 익히기")
        st.write("말로만 설명하면 안 박힌다. 아래 예시처럼 **캔들의 모양과 위치가 어떤 뜻을 가질 수 있는지** 눈으로 익히는 게 먼저다.")

        c1, c2 = st.columns(2)
        with c1:
            st.plotly_chart(draw_single_candle_chart("긴 윗꼬리 캔들", 100, 112, 99, 102, "위로 갔다가 강하게 밀린 흔적"), use_container_width=True, key="tutorial_candle_upper")
            st.markdown("**긴 윗꼬리 해석 포인트**\n- 위쪽 가격을 유지하지 못했다\n- 매도 압력이 들어왔을 수 있다\n- 저항 근처면 의미가 커질 수 있다")
        with c2:
            st.plotly_chart(draw_single_candle_chart("긴 아랫꼬리 캔들", 104, 106, 92, 103, "아래에서 강하게 받아 올린 흔적"), use_container_width=True, key="tutorial_candle_lower")
            st.markdown("**긴 아랫꼬리 해석 포인트**\n- 아래 가격대에서 매수 유입 가능\n- 지지 구간이면 반등 후보\n- 한 개만 보고 확정하면 안 된다")

        c3, c4 = st.columns(2)
        with c3:
            st.plotly_chart(draw_single_candle_chart("큰 몸통 양봉", 100, 111, 99, 109, "매수세가 우세했던 구간"), use_container_width=True, key="tutorial_candle_bull")
            st.markdown("**큰 몸통 양봉**\n- 종가가 시가보다 많이 높다\n- 강한 매수세 의미 가능\n- 거래량이 같이 실리면 더 의미가 커진다")
        with c4:
            st.plotly_chart(draw_single_candle_chart("도지형 캔들", 100, 108, 93, 100.5, "방향성 고민 구간"), use_container_width=True, key="tutorial_candle_doji")
            st.markdown("**도지형 캔들**\n- 시가와 종가가 비슷하다\n- 매수/매도 힘이 엇갈릴 수 있다\n- 위치가 더 중요하다")

        st.info("핵심: 캔들은 외우는 게 아니라 **반복해서 보며 눈에 익히는 것**이 중요하다.")

    with tab2:
        st.subheader("2. 시장 구조를 눈으로 익히기")
        st.write("추세는 말로 이해하는 게 아니라 **차트를 보면서 반복해서 익혀야 한다.**")
        st.plotly_chart(build_market_structure_chart(), use_container_width=True, key="tutorial_market_structure")
        st.markdown(
            """
            **상승 추세 특징**
            - 저점이 계속 높아짐 (Higher Low)
            - 고점도 계속 높아짐 (Higher High)
            - 눌림 이후 다시 상승

            **하락 추세 특징**
            - 고점이 점점 낮아짐
            - 저점도 점점 낮아짐
            - 반등이 약하고 계속 밀림

            **횡보 / 박스권 특징**
            - 위아래 범위 안에서 반복 움직임
            - 방향성이 없음
            - 추세가 아닌 구간
            """
        )
        st.warning("핵심: **지표 보기 전에 추세부터 판단해야 한다.**")
        st.success("학습 포인트: 차트를 보면서 '지금 상승인지, 하락인지, 횡보인지' 먼저 말할 수 있어야 한다.")

    with tab3:
        st.subheader("3. 보조지표를 제대로 이해하기")
        st.write("지표는 암기가 아니라 이해다. 각각 **왜 쓰는지 + 어떻게 쓰는지**를 같이 알아야 한다.")
        st.plotly_chart(build_indicator_demo_chart(), use_container_width=True, key="tutorial_indicator_demo")

        st.markdown("### EMA (지수이동평균선)")
        st.markdown(
            """
            - 일정 기간의 **종가 평균 흐름**을 선으로 표현한 것
            - 최근 값에 더 가중치를 줘서 반응이 빠름
            - 예: **20 EMA = 최근 20개 캔들의 종가 흐름을 반영한 평균선**

            **중요 EMA 예시**
            - 20 EMA: 단기 추세
            - 60 EMA: 중기 추세
            - 120 EMA: 장기 추세, 많은 사람이 기준선처럼 봄

            **해석**
            - 가격이 EMA 위: 상대적으로 강한 흐름일 가능성
            - 가격이 EMA 아래: 상대적으로 약한 흐름일 가능성
            - EMA 정배열은 상승 추세 해석에 힘을 실어줄 수 있음
            """
        )
        st.caption("잘못 쓰는 방식: EMA 하나 닿았다고 무조건 진입")

        st.markdown("### 거래량 (Volume)")
        st.markdown(
            """
            - 매수/매도가 얼마나 많이 일어났는지 보여줌
            - 움직임에 실제 힘이 실렸는지 확인할 때 봄

            **해석**
            - 거래량 증가 + 돌파/상승 = 진짜 움직임일 가능성 증가
            - 거래량 없이 돌파 = 가짜 돌파일 가능성 존재
            """
        )
        st.caption("잘못 쓰는 방식: 거래량만 많다고 무조건 좋은 자리라고 생각")

        st.markdown("### RSI")
        st.markdown(
            """
            - 가격의 과열 / 과매도 정도를 보는 대표 보조지표
            - 일반적으로 70 이상은 과매수 후보, 30 이하는 과매도 후보로 많이 봄

            **해석**
            - RSI가 높다고 바로 하락은 아님
            - 강한 상승에서는 RSI가 계속 높게 유지될 수 있음
            - 구조와 같이 볼 때 의미가 생김
            """
        )
        st.caption("잘못 쓰는 방식: RSI 과매수 하나만 보고 바로 숏")

        st.markdown("### VWAP")
        st.markdown(
            """
            - 거래량 가중 평균 가격 기준선
            - 하루 동안의 평균 체결 가격 느낌으로 많이 봄
            - 기관들도 많이 참고하는 기준선 중 하나

            **해석**
            - 가격이 VWAP 위: 상대적으로 강한 흐름으로 보는 경우가 많음
            - 가격이 VWAP 아래: 상대적으로 약한 흐름으로 보는 경우가 많음
            """
        )
        st.caption("잘못 쓰는 방식: VWAP 위라고 무조건 매수")

        st.markdown("### 볼린저 밴드")
        st.markdown(
            """
            - 가격의 변동 범위를 보여주는 지표
            - 중심선과 상단/하단 밴드로 구성됨

            **해석**
            - 상단 근처: 강한 움직임 또는 과열 후보
            - 하단 근처: 약한 움직임 또는 과매도 후보
            - 밴드 수축: 변동성 축소
            - 밴드 확장: 변동성 확대
            """
        )
        st.caption("잘못 쓰는 방식: 밴드 상단 닿으면 무조건 숏, 하단 닿으면 무조건 롱")

        st.success("학습 포인트: **구조 → 캔들 → 거래량 → 지표** 순서로 보는 습관을 만들어야 한다.")



def render_quiz_page():
    st.title("🧠 개념 퀴즈")
    st.caption("설명을 읽고 끝내지 말고, 직접 선택하면서 개념을 머리에 박는 단계")

    answers = []
    for idx, item in enumerate(QUIZ_QUESTIONS):
        st.markdown(f"### Q{idx + 1}. {item['question']}")
        choice = st.radio("정답 선택", item["options"], key=f"quiz_{idx}")
        answers.append(choice)

    if st.button("채점하기", use_container_width=True):
        score = 0
        for choice, item in zip(answers, QUIZ_QUESTIONS):
            if choice == item["answer"]:
                score += 1

        st.subheader(f"총점: {score} / {len(QUIZ_QUESTIONS)}")
        st.progress(score / len(QUIZ_QUESTIONS))

        for idx, (choice, item) in enumerate(zip(answers, QUIZ_QUESTIONS)):
            if choice == item["answer"]:
                st.success(f"Q{idx + 1} 정답: {item['explanation']}")
            else:
                st.error(f"Q{idx + 1} 오답: 정답은 '{item['answer']}' | {item['explanation']}")

        if score <= 2:
            st.warning("아직 개념이 약하다. 튜토리얼부터 다시 보고 오는 게 맞다.")
        elif score <= 4:
            st.info("기초는 들어왔지만 아직 구조와 지표 해석이 흔들린다. 반복이 필요하다.")
        else:
            st.success("좋다. 이제 연습하기에서 근거를 직접 써보면서 사고 훈련으로 넘어가면 된다.")



def render_practice_page(trades):
    st.title("📈 연습하기 / 시나리오 기록")
    st.caption("실제 매수 없이 관점을 세우고, 결과가 나온 뒤 다시 회고하는 훈련 공간")

    st.markdown("## 0) 사고 훈련 단계")
    st.write("아무 생각 없이 진입 근거부터 쓰지 말고, **올바른 순서로 생각하는 훈련**부터 한다.")

    s1, s2, s3 = st.columns(3)
    with s1:
        trend_choice = st.selectbox("1단계: 지금 큰 흐름은?", ["선택", "상승", "하락", "횡보"])
        structure_choice = st.selectbox("2단계: 현재 자리는?", ["선택", "눌림 후 재상승 가능 구간", "고점 추격 구간", "박스 중간 애매한 구간"])
    with s2:
        candle_choice = st.selectbox("3단계: 캔들 해석은?", ["선택", "아랫꼬리 반등 + 종가 회복", "윗꼬리 밀림 + 약세", "의미 없음"])
        volume_choice = st.selectbox("4단계: 거래량은 왜 보나?", ["선택", "돌파/반등에 힘이 실렸는지 확인", "많으면 무조건 진입", "없어도 상관없음"])
    with s3:
        indicator_choice = st.selectbox("5단계: 지표는 어떤 역할인가?", ["선택", "구조를 보조하며 진입 확률을 높이는 확인용", "지표 하나로 방향 확정", "지표가 전부"])
        final_choice = st.selectbox("6단계: 최종 결론은?", ["선택", "관점은 롱이지만 손절과 자리 확인 후 계획", "무조건 롱 즉시 진입", "애매해도 일단 진입"])

    step_ready = all(v != "선택" for v in [trend_choice, structure_choice, candle_choice, volume_choice, indicator_choice, final_choice])
    if step_ready:
        step_points, step_notes = grade_step_training(trend_choice, structure_choice, candle_choice, volume_choice, indicator_choice, final_choice)
        st.info(f"사고 훈련 임시 점수: {step_points} / 6")
    else:
        step_points, step_notes = 0, []
        st.warning("사고 훈련 6단계를 먼저 채워라. 이 플랫폼의 핵심은 생각 순서다.")

    st.markdown("---")

    col1, col2 = st.columns([1.15, 0.85])

    with col1:
        st.subheader("1) 차트 및 매매 정보 입력")
        trade_title = st.text_input("거래 제목", placeholder="예: BTC 15m 눌림 롱 시나리오")
        side = st.selectbox("관점", ["Long", "Short"])

        c1, c2, c3 = st.columns(3)
        with c1:
            entry = st.number_input("진입가", min_value=0.0, value=0.0, step=0.1)
        with c2:
            tp = st.number_input("익절가(TP)", min_value=0.0, value=0.0, step=0.1)
        with c3:
            sl = st.number_input("손절가(SL)", min_value=0.0, value=0.0, step=0.1)

        thesis = st.text_area(
            "진입 근거 상세 작성",
            height=220,
            placeholder="예: 4시간봉 상승 추세 유지, 1시간봉에서 눌림 확인, 15분봉에서 아랫꼬리 반등과 거래량 재증가 확인. 20EMA 위 유지, VWAP 위 종가 회복, 손절은 직전 저점 하단.",
        )

        st.markdown("### 2) 멀티 타임프레임 차트 업로드")
        img15 = st.file_uploader("15분봉 차트", type=["png", "jpg", "jpeg"], key="upload_15m")
        img1h = st.file_uploader("1시간봉 차트", type=["png", "jpg", "jpeg"], key="upload_1h")
        img4h = st.file_uploader("4시간봉 차트", type=["png", "jpg", "jpeg"], key="upload_4h")

    with col2:
        st.subheader("3) 진입 전 체크")
        trend_checked = st.checkbox("큰 추세(4시간봉)를 먼저 확인했다")
        structure_checked = st.checkbox("1시간봉 구조/지지저항을 확인했다")
        timing_checked = st.checkbox("15분봉에서 진입 타이밍을 확인했다")
        stop_defined = st.checkbox("손절 기준을 명확히 정했다", value=True)
        rr_reviewed = st.checkbox("R:R를 계산하고 검토했다")

        checklist_checked = sum([trend_checked, structure_checked, timing_checked, stop_defined, rr_reviewed])

        st.subheader("4) 심리 상태")
        confidence = st.slider("확신 정도", 1, 10, 6)
        impatience = st.slider("조급함", 0, 5, 1)
        revenge = st.slider("복구 심리", 0, 5, 0)
        fomo = st.slider("FOMO", 0, 5, 1)

        st.subheader("5) 결과 입력")
        outcome = st.selectbox("거래 결과", ["Planned Only", "Win", "Loss", "Breakeven"])
        pnl_percent = st.number_input("손익률(%)", value=0.0, step=0.1)
        reflection = st.text_area("거래 후 회고", height=120, placeholder="예: 방향은 맞았지만 종가 확인 전에 들어가서 손절폭이 커졌다.")

        rr_value = calc_rr(side, entry, tp, sl) if entry > 0 and tp > 0 and sl > 0 else None
        st.metric("예상 R:R", rr_value if rr_value is not None else "계산 불가")

    if st.button("분석하고 저장하기", use_container_width=True):
        if not step_ready:
            st.error("사고 훈련 6단계를 먼저 완료해라.")
        elif not trade_title.strip():
            st.error("거래 제목을 입력해라.")
        elif entry <= 0 or tp <= 0 or sl <= 0:
            st.error("진입가, TP, SL은 모두 0보다 커야 한다.")
        elif not thesis.strip():
            st.error("진입 근거를 자세히 적어라.")
        else:
            trade_id = datetime.now().strftime("%Y%m%d%H%M%S")
            score, reason_points = emotion_score(thesis, confidence, impatience, revenge, fomo, checklist_checked, rr_value, stop_defined)
            feedback_text = build_feedback(side, rr_value, score, reason_points, outcome, pnl_percent, step_points, step_notes)

            path15 = save_uploaded_file(img15, trade_id, "15m")
            path1h = save_uploaded_file(img1h, trade_id, "1h")
            path4h = save_uploaded_file(img4h, trade_id, "4h")

            trade_item = {
                "id": trade_id,
                "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "title": trade_title,
                "side": side,
                "entry": entry,
                "tp": tp,
                "sl": sl,
                "rr": rr_value,
                "thesis": thesis,
                "confidence": confidence,
                "impatience": impatience,
                "revenge": revenge,
                "fomo": fomo,
                "checklist_checked": checklist_checked,
                "stop_defined": stop_defined,
                "outcome": outcome,
                "pnl_percent": pnl_percent,
                "reflection": reflection,
                "score": score,
                "classification": classify_trade(score),
                "reason_points": reason_points,
                "feedback": feedback_text,
                "step_points": step_points,
                "step_notes": step_notes,
                "trend_choice": trend_choice,
                "structure_choice": structure_choice,
                "candle_choice": candle_choice,
                "volume_choice": volume_choice,
                "indicator_choice": indicator_choice,
                "final_choice": final_choice,
                "chart_15m": path15,
                "chart_1h": path1h,
                "chart_4h": path4h,
            }

            trades.insert(0, trade_item)
            save_trades(trades)

            st.success("분석 완료. 기록까지 저장했다.")

            a, b = st.columns([0.7, 0.3])
            with a:
                st.subheader("분석 결과")
                st.markdown(f"### {trade_item['classification']}")
                st.progress(trade_item['score'] / 100)
                st.write(f"감정매매 점수: **{trade_item['score']} / 100**")
                st.write(trade_item["feedback"])

            with b:
                st.subheader("핵심 지표")
                st.metric("관점", trade_item["side"])
                st.metric("예상 R:R", trade_item["rr"] if trade_item["rr"] is not None else "불가")
                st.metric("결과", trade_item["outcome"])
                st.metric("손익률", f"{trade_item['pnl_percent']}%")
                st.metric("사고 훈련", f"{trade_item['step_points']} / 6")

            st.markdown("### 주요 판정 사유")
            for point in trade_item["reason_points"]:
                st.write(f"- {point}")

            st.markdown("### 사고 훈련 교정")
            if trade_item["step_notes"]:
                for note in trade_item["step_notes"]:
                    st.write(f"- {note}")
            else:
                st.write("- 사고 순서는 비교적 좋다. 이 순서를 다음에도 유지해라.")

            st.markdown("### 업로드한 차트")
            cols = st.columns(3)
            if img15:
                cols[0].image(img15, caption="15분봉", use_container_width=True)
            if img1h:
                cols[1].image(img1h, caption="1시간봉", use_container_width=True)
            if img4h:
                cols[2].image(img4h, caption="4시간봉", use_container_width=True)



def render_history_page(trades):
    st.title("🗂️ 분석 기록")

    if not trades:
        st.info("저장된 거래 기록이 아직 없다.")
        return

    df = pd.DataFrame(trades)
    summary_cols = ["created_at", "title", "side", "rr", "classification", "outcome", "pnl_percent", "score", "step_points"]
    st.dataframe(df[summary_cols], use_container_width=True)

    selected_label = st.selectbox("상세 기록 선택", [f"{t['created_at']} | {t['title']}" for t in trades])
    selected_trade = next(t for t in trades if f"{t['created_at']} | {t['title']}" == selected_label)

    left, right = st.columns([0.65, 0.35])
    with left:
        st.markdown(f"## {selected_trade['title']}")
        st.write(f"- 작성일시: {selected_trade['created_at']}")
        st.write(f"- 관점: {selected_trade['side']}")
        st.write(f"- 진입가 / TP / SL: {selected_trade['entry']} / {selected_trade['tp']} / {selected_trade['sl']}")
        st.write(f"- 예상 R:R: {selected_trade['rr']}")
        st.write(f"- 판정: {selected_trade['classification']}")
        st.write(f"- 결과: {selected_trade['outcome']} ({selected_trade['pnl_percent']}%)")

        st.markdown("### 사고 훈련 선택 내용")
        st.write(f"- 추세 판단: {selected_trade.get('trend_choice', '-')}")
        st.write(f"- 자리 판단: {selected_trade.get('structure_choice', '-')}")
        st.write(f"- 캔들 해석: {selected_trade.get('candle_choice', '-')}")
        st.write(f"- 거래량 해석: {selected_trade.get('volume_choice', '-')}")
        st.write(f"- 지표 역할: {selected_trade.get('indicator_choice', '-')}")
        st.write(f"- 최종 결론: {selected_trade.get('final_choice', '-')}")

        st.markdown("### 진입 근거")
        st.write(selected_trade["thesis"])

        if selected_trade.get("reflection"):
            st.markdown("### 거래 후 회고")
            st.write(selected_trade["reflection"])

        st.markdown("### 피드백")
        st.write(selected_trade["feedback"])

    with right:
        st.metric("감정매매 점수", f"{selected_trade['score']} / 100")
        st.progress(selected_trade["score"] / 100)
        st.metric("사고 훈련", f"{selected_trade.get('step_points', 0)} / 6")

        st.markdown("### 판정 근거")
        for point in selected_trade["reason_points"]:
            st.write(f"- {point}")

    st.markdown("### 차트")
    chart_cols = st.columns(3)
    for idx, key in enumerate(["chart_15m", "chart_1h", "chart_4h"]):
        path = selected_trade.get(key)
        if path and os.path.exists(path):
            label = {"chart_15m": "15분봉", "chart_1h": "1시간봉", "chart_4h": "4시간봉"}[key]
            chart_cols[idx].image(path, caption=label, use_container_width=True)



def render_growth_page(trades):
    st.title("📊 성장 분석")
    st.caption("내가 반복해서 저지르는 실수와 개선 흐름을 보는 페이지")

    if not trades:
        st.info("아직 분석 기록이 없어서 성장 데이터를 보여줄 수 없다.")
        return

    df = pd.DataFrame(trades)

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("총 기록 수", len(df))
    c2.metric("평균 감정매매 점수", round(df["score"].mean(), 1))

    rr_series = pd.to_numeric(df["rr"], errors="coerce")
    avg_rr = round(rr_series.dropna().mean(), 2) if not rr_series.dropna().empty else "없음"
    c3.metric("평균 R:R", avg_rr)

    step_series = pd.to_numeric(df["step_points"], errors="coerce") if "step_points" in df.columns else pd.Series(dtype=float)
    avg_step = round(step_series.dropna().mean(), 2) if not step_series.dropna().empty else 0
    c4.metric("평균 사고 훈련 점수", avg_step)

    st.markdown("### 최근 기록 요약")
    st.dataframe(df[["created_at", "title", "classification", "outcome", "pnl_percent", "score", "step_points"]], use_container_width=True)

    st.markdown("### 반복되는 약점")
    high_risk = df[df["score"] >= 70]
    mixed = df[(df["score"] >= 45) & (df["score"] < 70)]
    stable = df[df["score"] < 45]

    st.write(f"- 감정매매 가능성 높음: {len(high_risk)}건")
    st.write(f"- 혼합형 / 경계 필요: {len(mixed)}건")
    st.write(f"- 규칙매매에 가까움: {len(stable)}건")

    if "step_points" in df.columns:
        low_step = df[df["step_points"] <= 3]
        st.write(f"- 사고 순서가 흔들린 기록: {len(low_step)}건")

    st.info("핵심 목표는 승률 자랑이 아니라, **같은 실수를 반복하지 않는 눈을 기르는 것**이다.")



def render_about_page():
    st.title("💡 프로젝트 소개")
    st.markdown(
        """
        ### 프로젝트 목적
        이 웹사이트는 단순한 차트 분석 도구가 아니라,
        **모든 사회인이 트레이딩의 기초를 익히고 투자 판단력을 기를 수 있도록 돕는 교육형 훈련 플랫폼**입니다.

        ### 플랫폼 구조
        1. 튜토리얼로 개념 학습
        2. 퀴즈로 이해도 확인
        3. 단계별 사고 훈련으로 차트 해석 습관 형성
        4. 시나리오 작성과 결과 기록
        5. 강한 피드백으로 판단 교정
        6. 성장 분석으로 반복 실수 점검

        ### 한 줄 정의
        **트레이딩을 잘하게 만드는 사이트가 아니라, 투자 판단을 더 건강하게 만드는 최초 학습 플랫폼**
        """
    )


# =========================
# Router
# =========================
trades = normalize_trade_records(load_trades())

st.sidebar.title("📌 메뉴")
menu = st.sidebar.radio(
    "이동",
    ["튜토리얼", "개념 퀴즈", "연습하기", "기록 보기", "성장 분석", "프로젝트 소개"],
)

if menu == "튜토리얼":
    render_tutorial_page()
elif menu == "개념 퀴즈":
    render_quiz_page()
elif menu == "연습하기":
    render_practice_page(trades)
elif menu == "기록 보기":
    render_history_page(trades)
elif menu == "성장 분석":
    render_growth_page(trades)
else:
    render_about_page()
