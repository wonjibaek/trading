from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# 로컬 테스트용 SQLite, 추후 NCP에서는 MySQL 주소로 변경하면 됩니다.
# MySQL 예시: "mysql+pymysql://유저아이디:비밀번호@네이버서버IP:3306/데이터베이스명"
SQLALCHEMY_DATABASE_URL = "sqlite:///./data/trades.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False} # SQLite 설정
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
