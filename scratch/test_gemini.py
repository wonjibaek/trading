import asyncio
import os
import sys

# 프로젝트 루트 경로를 sys.path에 추가 (임포트 에러 방지)
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.core.gemini_feedback import generate_ai_feedback

async def main():
    print("--- Gemini API 연동 테스트 시작 ---")
    
    # 더미 데이터 구성
    dummy_trade_data = {
        "side": "Long",
        "entry": 85000000.0,
        "tp": 90000000.0,
        "sl": 83000000.0,
        "rr": 2.5,
        "stop_defined": True,
        "outcome": "Loss",
        "pnl_percent": -2.3,
        "thesis": "비트코인 4시간봉 주요 매물대 지지 확인 후 돌파 시점에 진입했으나, 거래량이 부족했음.",
        "reflection": "손절가는 잘 지켰으나 지지선이 무너질 때 너무 일찍 손절하지 않고 버텼다. 다음에는 기준 미달 시 바로 자르는 연습이 필요함.",
        "score": 55,
        "classification": "혼합형 / 경계 필요",
        "confidence": 7,
        "impatience": 4,
        "revenge": 2,
        "fomo": 3,
        "reason_points": ["R:R가 다소 애매함 (2.5)", "조급함이 높음"],
        "step_points": 4,
        "step_notes": ["캔들을 단순 모양으로만 본다. 아래에서 받아 올린 흔적을 읽어야 한다.", "결론이 너무 성급하다."]
    }
    
    print("피드백 생성 요청 중...")
    feedback = await generate_ai_feedback(dummy_trade_data)
    print("\n--- 생성된 피드백 결과 ---")
    print(feedback)
    print("------------------------")

if __name__ == "__main__":
    asyncio.run(main())
