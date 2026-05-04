from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class TradeCreate(BaseModel):
    title: str = Field(..., example="BTC 15m 눌림 롱 시나리오")
    side: str = Field(..., example="Long")
    entry: float = Field(..., gt=0)
    tp: float = Field(..., gt=0)
    sl: float = Field(..., gt=0)
    thesis: str = Field(..., min_length=10)
    
    # 심리 상태
    confidence: int = Field(..., ge=1, le=10)
    impatience: int = Field(..., ge=0, le=5)
    revenge: int = Field(..., ge=0, le=5)
    fomo: int = Field(..., ge=0, le=5)
    
    # 체크리스트 및 결과
    checklist_checked: int = Field(..., ge=0, le=5)
    stop_defined: bool = Field(True)
    outcome: str = Field(default="Planned Only")
    pnl_percent: float = Field(default=0.0)
    reflection: Optional[str] = None

    # 사고 훈련 6단계 선택
    trend_choice: str
    structure_choice: str
    candle_choice: str
    volume_choice: str
    indicator_choice: str
    final_choice: str

class TradeResponse(BaseModel):
    id: str
    created_at: str
    title: str
    side: str
    entry: float
    tp: float
    sl: float
    rr: Optional[float]
    thesis: str
    confidence: int
    impatience: int
    revenge: int
    fomo: int
    checklist_checked: int
    stop_defined: bool
    outcome: str
    pnl_percent: float
    reflection: Optional[str]
    
    score: int
    classification: str
    reason_points: List[str]
    feedback: str
    
    step_points: int
    step_notes: List[str]
    
    trend_choice: str
    structure_choice: str
    candle_choice: str
    volume_choice: str
    indicator_choice: str
    final_choice: str
    
    chart_15m: Optional[str] = None
    chart_1h: Optional[str] = None
    chart_4h: Optional[str] = None
