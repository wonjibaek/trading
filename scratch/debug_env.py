import os
from pathlib import Path

print("--- .env 디버깅 스크립트 ---")

# 현재 파일 기준의 프로젝트 루트 경로
root_dir = Path(__file__).resolve().parent.parent
print(f"1. 계산된 프로젝트 루트 디렉터리: {root_dir}")

# 루트 디렉터리의 파일 목록 출력
print("\n2. 루트 디렉터리 내 파일 목록:")
for file in root_dir.iterdir():
    if file.is_file():
        print(f"  - {file.name}")

# .env 파일 존재 여부 확인
env_file = root_dir / ".env"
print(f"\n3. .env 파일 절대 경로: {env_file}")
print(f"   존재 여부: {env_file.exists()}")

if env_file.exists():
    print("\n4. .env 파일 내용 읽기 시도:")
    try:
        with open(env_file, "r", encoding="utf-8") as f:
            lines = f.readlines()
            for line in lines:
                # 보안을 위해 API 키 값은 마스킹 처리하여 출력
                if "=" in line:
                    key, val = line.split("=", 1)
                    val = val.strip()
                    masked_val = val[:5] + "..." + val[-5:] if len(val) > 10 else "..."
                    print(f"  - {key.strip()} = {masked_val}")
                else:
                    print(f"  - [형식 에러 확인용 라인]: {line.strip()}")
    except Exception as e:
        print(f"   파일 읽기 오류: {e}")
else:
    # 혹시 대소문자나 뒤에 확장자가 붙었는지 체크
    print("\n5. .env 파일이 존재하지 않습니다. 혹시 .env.txt 등으로 저장되었는지 확인해 주세요.")
