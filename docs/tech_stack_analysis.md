# 🚀 Trading Insight Pro: 기술 스택 분석 보고서

본 문서는 파이썬(Python) 기반의 백엔드와 현대적인 프론트엔드가 결합된 **실시간 트레이딩 피드백 웹 애플리케이션**의 핵심 기술 스택을 분석한 보고서입니다.

---

## 1. 🐍 Backend Architecture (Python)

백엔드는 성능과 생산성을 모두 잡기 위해 최신 파이썬 생태계의 도구들을 활용했습니다.

### ⚡ FastAPI (Web Framework)
- **특징**: 파이썬 3.8+의 Type Hints를 기반으로 한 현대적이고 빠른(High-performance) 웹 프레임워크입니다.
- **역할**: 트레이딩 데이터의 CRUD(생성, 조회, 수정, 삭제) 처리 및 업비트 API 프록시 서버 역할을 수행합니다.
- **장점**: 비동기(Asynchronous) 처리에 최적화되어 있어, 실시간 데이터를 다루는 트레이딩 앱에 매우 적합합니다.

### 🏗️ SQLAlchemy (ORM) & PyMySQL
- **SQLAlchemy**: 파이썬에서 가장 강력한 Database Object-Relational Mapper입니다. SQL 쿼리를 직접 짜지 않고도 파이썬 객체로 데이터를 다룰 수 있게 해줍니다.
- **PyMySQL**: 파이썬에서 MySQL 서버와 통신하기 위한 드라이버입니다.
- **데이터베이스**: Naver Cloud Platform(NCP) 상의 **MySQL**을 사용하여 사용자의 매매 기록을 안전하게 보관합니다.

### 🌐 HTTPX (Asynchronous HTTP Client)
- **역할**: 업비트(Upbit) Open API로부터 실시간 비트코인 캔들 데이터 및 호가 데이터를 가져오는 데 사용됩니다.
- **특징**: `requests` 라이브러리의 비동기 버전으로, API 호출 시 서버가 멈추지 않고 다른 작업을 동시에 처리할 수 있게 합니다.

### 📁 Python Core Modules
- **Pathlib**: NCP 서버 내에서 이미지 파일(차트 스크린샷)을 저장하고 경로를 관리할 때 사용됩니다.
- **DateTime**: 매매가 발생한 시점을 정확하게 기록하고 관리합니다.
- **Traceback**: 서버 에러 발생 시 상세한 원인을 파악하여 로그로 남기는 데 활용됩니다.

---

## 2. 💻 Frontend Integration (React & Vite)

파이썬 백엔드와 완벽하게 조화되는 현대적인 프론트엔드 스택입니다.

- **React & Vite**: 빠르고 반응성이 뛰어난 사용자 인터페이스를 구축합니다.
- **Recharts**: 업비트 실시간 데이터를 시각화하여 캔들스틱, EMA, 볼린저 밴드, RSI 등을 차트로 그려냅니다.
- **Lucide-React**: 전문적인 트레이딩 툴 느낌을 주는 세련된 아이콘 시스템입니다.

---

## 3. 🚢 Infrastructure & DevOps

- **Naver Cloud Platform (NCP)**: 클라우드 가상 서버를 통해 24시간 중단 없는 서비스를 제공합니다.
- **Uvicorn (ASGI Server)**: FastAPI 앱을 실행하기 위한 초고속 서버 인터페이스입니다.
- **CORS Middleware**: 브라우저와 서버 간의 보안 통신 규칙을 설정하여 안전한 데이터 주고받기를 가능케 합니다.
- **Static File Serving**: 별도의 웹 서버(Nginx 등) 없이도 FastAPI가 직접 React 빌드 파일을 서빙하도록 통합 배포 구조를 설계했습니다.

---

## 4. 🧠 Core Logic & Algorithms

- **Emotion Scoring Logic**: 사용자의 심리 상태(FOMO, 조급함 등)와 매매 근거의 논리성을 수치화하는 알고리즘이 포함되어 있습니다.
- **Indicator Math**: 캔들 데이터를 바탕으로 EMA, RSI, Bollinger Bands, VWAP 등을 계산하는 수식 로직이 구현되어 있습니다.

---
*본 보고서는 Trading Insight Pro 프로젝트의 기술적 우수성을 설명하기 위해 Antigravity AI에 의해 작성되었습니다.*
