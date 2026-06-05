import json
import traceback
import httpx
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.schemas.trade import TradeResponse
from backend.core.logic import (
    calc_rr, emotion_score, classify_trade, 
    grade_step_training
)
from backend.core.gemini_feedback import generate_ai_feedback
from backend.database.repository import TradeRepository
from backend.database.db_setup import get_db

router = APIRouter()

@router.get("/trades")
def get_trades(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """모든 트레이딩 기록을 DB에서 가져옵니다."""
    trades = TradeRepository.get_all_trades(db, skip=skip, limit=limit)
    return {"trades": trades}

@router.post("/trades")
async def create_trade(
    title: str = Form(...),
    side: str = Form(...),
    entry: float = Form(...),
    tp: float = Form(...),
    sl: float = Form(...),
    thesis: str = Form(...),
    confidence: int = Form(...),
    impatience: int = Form(...),
    revenge: int = Form(...),
    fomo: int = Form(...),
    checklist_checked: int = Form(...),
    stop_defined: bool = Form(True),
    outcome: str = Form("Planned Only"),
    pnl_percent: float = Form(0.0),
    reflection: str = Form(""),
    trend_choice: str = Form(...),
    structure_choice: str = Form(...),
    candle_choice: str = Form(...),
    volume_choice: str = Form(...),
    indicator_choice: str = Form(...),
    final_choice: str = Form(...),
    chart_15m: UploadFile = File(None),
    chart_1h: UploadFile = File(None),
    chart_4h: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    """새로운 트레이딩 기록을 생성하고 DB에 저장한 뒤 분석 결과를 반환합니다."""
    
    try:
        trade_id = datetime.now().strftime("%Y%m%d%H%M%S")
        
        # 1. 계산 및 분석 로직
        rr_value = calc_rr(side, entry, tp, sl)
        
        step_points, step_notes = grade_step_training(
            trend_choice, structure_choice, candle_choice, 
            volume_choice, indicator_choice, final_choice
        )
        
        score, reason_points = emotion_score(
            thesis, confidence, impatience, revenge, fomo, 
            checklist_checked, rr_value, stop_defined
        )
        classification = classify_trade(score)
        
        # 1.5. Gemini 피드백 생성용 데이터 딕셔너리 구성 및 호출
        trade_data_for_ai = {
            "side": side,
            "entry": entry,
            "tp": tp,
            "sl": sl,
            "rr": rr_value,
            "stop_defined": stop_defined,
            "outcome": outcome,
            "pnl_percent": pnl_percent,
            "thesis": thesis,
            "reflection": reflection,
            "score": score,
            "classification": classification,
            "confidence": confidence,
            "impatience": impatience,
            "revenge": revenge,
            "fomo": fomo,
            "reason_points": reason_points,
            "step_points": step_points,
            "step_notes": step_notes
        }
        
        feedback_text = await generate_ai_feedback(trade_data_for_ai)
        
        # 2. 이미지 파일 저장 (로컬) - 파일이 있을 때만 진행
        path15, path1h, path4h = None, None, None
        
        async def handle_upload(file, prefix):
            if file and file.filename:
                content = await file.read()
                if content:
                    ext = Path(file.filename).suffix
                    return TradeRepository.save_uploaded_file(content, f"{trade_id}_{prefix}{ext}")
            return None

        path15 = await handle_upload(chart_15m, "15m")
        path1h = await handle_upload(chart_1h, "1h")
        path4h = await handle_upload(chart_4h, "4h")

        # 3. DB 저장을 위한 딕셔너리 준비
        trade_item = {
            "id": trade_id,
            "title": title,
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
            "classification": classification,
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

        # 4. MySQL(또는 SQLite)에 저장
        saved_trade = TradeRepository.save_trade(db, trade_item)
        return saved_trade

    except Exception as e:
        # 에러 발생 시 서버 로그에 상세 정보 기록
        print(f"Error in create_trade: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# =============================================================================
# 💹 Upbit Real-time Market Data Integration
# =============================================================================

UPBIT_API_URL = "https://api.upbit.com/v1"

@router.get("/market/candles")
async def get_upbit_candles(market: str = "KRW-BTC", count: int = 24):
    """업비트 캔들 데이터 가져오기 (1시간봉 기준)"""
    async with httpx.AsyncClient() as client:
        try:
            # 1시간봉(minutes/60) 데이터를 가져옵니다.
            response = await client.get(
                f"{UPBIT_API_URL}/candles/minutes/60",
                params={"market": market, "count": count}
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Upbit API Error: {str(e)}")

@router.get("/market/orderbook")
async def get_upbit_orderbook(market: str = "KRW-BTC"):
    """업비트 호가창 데이터 가져오기"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{UPBIT_API_URL}/orderbook",
                params={"markets": market}
            )
            response.raise_for_status()
            data = response.json()
            return data[0] if data else {}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Upbit API Error: {str(e)}")
