import os
import asyncio
from pathlib import Path
from google import genai
from dotenv import load_dotenv
from backend.core.logic import build_feedback

# 프로젝트 루트의 .env 파일을 찾아 로드
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# API 키 설정 (새로운 패키지 방식)
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None

async def generate_ai_feedback(trade_data: dict) -> str:
    # 에러 발생 시 사용할 기본 피드백
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
    
    if not client:
        print("GEMINI_API_KEY가 없습니다.")
        return fallback

    try:
        step_notes_str = "\n".join([f"- {n}" for n in trade_data.get('step_notes', [])]) if trade_data.get('step_notes') else '- 특별한 지적 사항 없음'
        reason_points_str = ", ".join(trade_data.get('reason_points', [])) if trade_data.get('reason_points') else '지적 사항 없음'

        prompt = f"""
너는 15년 경력의 글로벌 헤지펀드 수석 암호화폐 트레이더이자, 후배 트레이더들을 혹독하고 정교하게 교육하는 냉철한 트레이딩 코치이다.

[트레이더의 거래 정보]
- 거래 방향: {trade_data.get('side')}
- 진입가 / 익절가 / 손절가: {trade_data.get('entry')} / {trade_data.get('tp')} / {trade_data.get('sl')}
- 손익비 (R:R): {trade_data.get('rr')}
- 매매 결과: {trade_data.get('outcome')} (수익률: {trade_data.get('pnl_percent')}%)
- 진입 근거: "{trade_data.get('thesis')}"

[심리 점수: {trade_data.get('score')} / 100]
- 감정 분류: {trade_data.get('classification')}
- 자신감: {trade_data.get('confidence')} / 조급함: {trade_data.get('impatience')} / 복수심: {trade_data.get('revenge')} / FOMO: {trade_data.get('fomo')}
- 감정 지적요인: {reason_points_str}

[사고 훈련 피드백]
{step_notes_str}

[피드백 지침]
1. 핵심은 포함하나 사용자가 의지를 잃지 않도록 친절한 말투로 조언하라.
2. 리스크 관리, 심리 통제, 진입 근거 분석, 핵심 액션 플랜 1~2가지를 포함하라.
3. 한국어로 마크다운 형식을 사용하여 가독성 있게 작성하라.
"""
        loop = asyncio.get_event_loop()
        # 새로운 패키지의 메서드 사용
        response = await loop.run_in_executor(
            None,
            lambda: client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
        )
        
        if response and response.text:
            return response.text.strip()
        
        return fallback

    except Exception as e:
        print(f"Gemini API 호출 에러: {e}")
        return fallback
