from sqlalchemy import Column, Integer, String, Float, Boolean, Text, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database.db_setup import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    trades = relationship("Trade", back_populates="owner")

class Trade(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # 나중을 위해 추가
    trade_string_id = Column(String(50), unique=True, index=True) # 기존 타임스탬프 ID 호환용

    title = Column(String(255), nullable=False)
    side = Column(String(10), nullable=False)
    entry = Column(Float, nullable=False)
    tp = Column(Float, nullable=False)
    sl = Column(Float, nullable=False)
    rr = Column(Float, nullable=True)
    thesis = Column(Text, nullable=False)
    
    confidence = Column(Integer)
    impatience = Column(Integer)
    revenge = Column(Integer)
    fomo = Column(Integer)
    
    checklist_checked = Column(Integer)
    stop_defined = Column(Boolean, default=True)
    outcome = Column(String(20), default="Planned Only")
    pnl_percent = Column(Float, default=0.0)
    reflection = Column(Text, nullable=True)
    
    score = Column(Integer)
    classification = Column(String(50))
    reason_points = Column(JSON) # MySQL 5.7 이상 지원
    feedback = Column(Text)
    
    step_points = Column(Integer)
    step_notes = Column(JSON)
    
    trend_choice = Column(String(100))
    structure_choice = Column(String(100))
    candle_choice = Column(String(100))
    volume_choice = Column(String(100))
    indicator_choice = Column(String(100))
    final_choice = Column(String(100))
    
    chart_15m = Column(String(255), nullable=True)
    chart_1h = Column(String(255), nullable=True)
    chart_4h = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="trades")
