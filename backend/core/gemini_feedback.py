import os
import asyncio
from pathlib import Path
import google.generativeai as genai
from dotenv import load_dotenv
from backend.core.logic import build_feedback

# 프로젝트 루트의 .env 파일을 절대 경로로 찾아서 로드
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# API 키 설정
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

async def generate_ai_feedback(trade_data: dict) -> str:
    """
    Gemini API를 사용하여 트레이딩 일지에 대한 맞춤형 AI 피드백을 생성합니다.
    API 키가 없거나 호출에 실패하면 기존 규칙 기반 피드백을 반환합니다.
    """
    # 1. 예외 처리를 위한 기본 폴백 피드백 준비
    fallback = build_feedback(
        side=trade_data.get("side"),
        rr_value=trade_data.get("rr"),
        score=trade_data.get("score"),
        reason_points=trade_data.get("reason_points", []),
        outcome=trade_data.get("outcome"),
        pnl_percent=trade_data.get("pnl_percent", 0.0),
        step_points=trade_data.get("step_points", 0),
        step_notes=trade_data.get("step_notes", [])
    )
    
    if not api_key:
        print("GEMINI_API_KEY 가 설정되지 않아 기본 룰 기반 피드백을 사용합니다.")
        return fallback

    try:
        # 가독성을 위해 미리 변수 정리
        step_notes_str = "\n".join([f"- {n}" for n in trade_data.get('step_notes', [])]) if trade_data.get('step_notes') else '- 특별한 단계별 지적 사항 없음'
        reason_points_str = ", ".join(trade_data.get('reason_points', [])) if trade_data.get('reason_points') else '지적 사항 없음'

        # Prompt 설계
        prompt = f"""
너는 15년 경력의 글로벌 헤지펀드 수석 암호화폐 트레이더이자, 후배 트레이더들을 혹독하고 정교하게 교육하는 냉철한 트레이딩 코치이다.
아래에 제공된 후배 트레이더의 진입 계획, 감정 상태 점수, 사고 훈련 평가 및 매매 결과를 종합적으로 분석하여 냉철하고 실질적인 피드백을 작성하라.

[트레이더의 거래 정보]
- 거래 방향: {trade_data.get('side')}
- 진입가 / 익절가 / 손절가: {trade_data.get('entry')} / {trade_data.get('tp')} / {trade_data.get('sl')}
- 손익비 (R:R): {trade_data.get('rr') if trade_data.get('rr') is not None else '계산 불가'}
- 손절 기준 정의 여부: {'정의됨' if trade_data.get('stop_defined') else '없음 (매우 위험)'}
- 매매 결과: {trade_data.get('outcome')} (수익률: {trade_data.get('pnl_percent')}%)
- 진입 근거 (Thesis): "{trade_data.get('thesis')}"
- 매매 복기 (Reflection): "{trade_data.get('reflection')}"

[감정 점수 분석]
- 감정 리스크 총합 점수: {trade_data.get('score')} / 100
- 감정 분류: {trade_data.get('classification')}
- 감정 감지 세부 요인:
  - 자신감 (Confidence): {trade_data.get('confidence')} / 10
  - 조급함 (Impatience): {trade_data.get('impatience')} / 10
  - 복수심 (Revenge): {trade_data.get('revenge')} / 10
  - FOMO: {trade_data.get('fomo')} / 10
  - 체크리스트 미준수 감지 요인: {reason_points_str}

[체크리스트 단계별 사고 점수]
- 사고 훈련 점수: {trade_data.get('step_points')} / 6
- 분석 실수 및 지적사항:
{step_notes_str}

[피드백 작성 지침]
1. 친절하지만 뼈를 때리는 냉철한 어조(트레이딩 코치 말투)로 조언하라.
2. 다음 네 가지 요소를 포함하여 구체적으로 작성하라:
   - **리스크 관리 평가**: 손익비가 합리적인지, 손절 계획이 명확한지 지적하라.
   - **심리 및 감정 통제**: FOMO나 복수심, 확신 과잉 등 감정 요소를 언급하며 경고하라.
   - **진입 근거와 복기 비판**: 진입 근거(Thesis)와 복기(Reflection)의 허점을 날카롭게 분석하라.
   - **행동 지침**: 다음 거래에서 즉시 개선해야 할 핵심 액션 플랜 1~2가지를 구체적으로 제시하라.
3. 한국어로 마크다운 형식을 사용하여 가독성 있게 작성하라.
"""

        model = genai.GenerativeModel("gemini-1.5-flash")
        
        # 비동기로 Gemini API 호출 실행
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: model.generate_content(prompt)
        )
        
        if response and response.text:
            return response.text.strip()
        
        return fallback

    except Exception as e:
        print(f"Gemini API 호출 중 오류 발생, 기본 피드백으로 대체합니다: {e}")
        return fallback
