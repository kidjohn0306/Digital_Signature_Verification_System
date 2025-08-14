# 📄 문서 진위 확인 시스템 (Backend)

이 프로젝트는 React 프론트엔드와 연동되는 FastAPI 기반 ****백엔드** 서버입니다.
Supabase를 데이터베이스 및 스토리지로 활용하여, 디지털 서명(RSA) 기반 문서 진위 확인과 버전 관리의 핵심 로직을 처리합니다.

## ✨ 주요 기능
사용자 인증 API

회원가입: bcrypt로 암호화된 비밀번호 저장 (/signup)

로그인: 성공 시 httpOnly 쿠키에 JWT 발급 (/login)

역할(Role) 기반 권한: role 컬럼(admin/user)을 이용해 접근 제어

문서 관리 API

등록 & 서명: 파일 SHA-256 해시 생성 → RSA-2048 개인키로 서명 → Supabase 저장 (/register)

버전 관리: 동일 문서 업데이트 시 버전 증가 (v1, v2, …) 및 중복 방지

진위 검증: 원본과 비교하여 내용 일치 여부 + 서명 유효성 확인 (/verify_with_original)

조회 & 삭제: 본인이 등록한 문서 조회, 상세보기(비밀번호 검증 후), 삭제 (/documents, /document_detail, /document_delete)

관리자 기능: role='admin' 계정은 모든 사용자 문서 조회 및 관리 가능

## 🛠️ 기술 스택

- Core: Python, FastAPI

- Database & Storage: Supabase

- Authentication & Cryptography:

- WT: python-jose

- Password Hashing: passlib[bcrypt]

- Digital Signature (RSA): cryptography

## 🚀 실행 방법
1. 사전 준비

Docker & Docker Compose

Git

(선택) Python 3.8+ (로컬 단독 실행 시)

2. 프로젝트 클론
git clone https://github.com/kidjohn0306/Digital_Signature_Verification_System.git
cd Digital_Signature_Verification_System

3. 환경 변수 설정

back/.env 파일을 생성하고 다음 내용을 채웁니다.

# 1. Supabase 프로젝트의 URL과 anon KEY
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_KEY="your-supabase-anon-key"

# 2. JWT 비밀키 (아래 명령어로 생성)
# python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY="생성된_랜덤문자열"

# 3. RSA 개인 키 (PEM 내용, 줄바꿈은 \n으로 변경)
ISSUING_AUTHORITY_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# 4. JWT 설정
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30

4. 데이터베이스 테이블 생성

Supabase SQL Editor에서 실행:

-- 사용자 정보
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 문서 정보
CREATE TABLE documents (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    document_id UUID,
    version INT,
    file_name TEXT,
    file_hash TEXT UNIQUE,
    password_hash TEXT,
    signature TEXT,
    storage_path TEXT,
    public_url TEXT,
    file_content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_document_id ON documents(document_id);

5. Supabase 스토리지 버킷 & 정책 설정

Storage → documents 버킷 생성 (Public 비활성화)

Policies에서 본인 파일만 접근/업로드/삭제 가능하도록 정책 추가

6. 실행
📦 Docker 통합 실행 (추천)

프론트엔드 + 백엔드 함께 실행:

docker compose up -d --build


웹 접속: http://localhost:8080

API 엔드포인트: http://localhost:8080/api/...

🖥️ 로컬 백엔드 단독 실행
cd back
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # macOS/Linux

pip install -r requirements.txt
uvicorn main:app --reload --port 8000


API 접속: http://localhost:8000

📌 참고

Docker 실행 시 API는 Nginx 프록시를 거쳐 /api로 접근합니다.

로컬 개발 시 API는 직접 8000 포트로 접근합니다.