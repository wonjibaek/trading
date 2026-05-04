from pathlib import Path
from sqlalchemy.orm import Session
from backend.database.models import Trade
from datetime import datetime

DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)

class TradeRepository:
    """
    SQLAlchemy ORM을 사용한 데이터 접근 계층입니다.
    """
    
    @staticmethod
    def get_all_trades(db: Session, skip: int = 0, limit: int = 100):
        """모든 트레이딩 기록을 가져옵니다."""
        return db.query(Trade).order_by(Trade.created_at.desc()).offset(skip).limit(limit).all()
        
    @staticmethod
    def save_trade(db: Session, trade_data: dict) -> Trade:
        """새로운 트레이딩 기록을 저장합니다."""
        # JSON 키를 SQLAlchemy 모델 컬럼에 맞게 매핑
        if "id" in trade_data:
            trade_data["trade_string_id"] = trade_data.pop("id")
            
        db_trade = Trade(**trade_data)
        db.add(db_trade)
        db.commit()
        db.refresh(db_trade)
        return db_trade

    @staticmethod
    def save_uploaded_file(file_content: bytes, filename: str) -> str:
        """업로드된 이미지 파일을 로컬에 저장하고 경로를 반환합니다. (NCP 마이크로서버 로컬 저장)"""
        file_path = DATA_DIR / filename
        with open(file_path, "wb") as f:
            f.write(file_content)
        return str(file_path)
