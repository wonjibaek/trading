from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.routes import router
from backend.database.db_setup import engine, Base

# 서버 구동 시 DB 테이블 자동 생성 (실제 운영환경에서는 Alembic 사용 권장)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Trading Insight Trainer API",
    description="트레이딩 훈련 및 피드백을 제공하는 FastAPI 백엔드 서버입니다.",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(router, prefix="/api")

@app.get("/")
def root():
    return {"message": "Trading Insight Trainer API Server is running with Database connected!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
