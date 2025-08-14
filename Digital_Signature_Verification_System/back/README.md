문서 진위 확인 시스템 (Backend)
이 프로젝트는 React 프론트엔드와 연동되는 FastAPI 기반의 백엔드 서버입니다. Supabase를 데이터베이스 및 스토리지로 활용하여, 디지털 서명으로 문서의 진위를 확인하고 버전을 관리하는 핵심 로직을 처리합니다.

✨ 주요 기능
사용자 인증 API:

bcrypt로 암호화된 비밀번호를 사용하는 안전한 회원가입 (/signup).

로그인 성공 시 httpOnly 쿠키에 JWT를 발급하여 보안을 강화 (/login).

문서 관리 API:

등록 및 서명: 파일의 SHA-256 해시를 계산하고, RSA-2048 개인키로 서명하여 Supabase에 기록 (/register).

버전 관리: 기존 문서를 업데이트하여 새로운 버전을 생성하고(v1, v2, ...), 중복 등록을 방지.

진위 검증: 등록된 원본 문서와 검증할 파일을 비교하여 내용의 일치 여부 및 서명의 유효성을 판별 (/verify_with_original).

조회 및 삭제: 사용자는 자신이 등록한 문서 목록을 조회하고, 비밀번호를 통해 상세 정보를 확인하거나 삭제 (/documents, /document_detail, /document_delete).

관리자 기능: 관리자 계정은 모든 사용자의 문서를 조회하고 관리할 수 있는 권한을 가집니다.

🛠️ 기술 스택
Core: Python, FastAPI

Database & Storage: Supabase

Authentication & Cryptography:

JWT: python-jose

Password Hashing: passlib[bcrypt]

Digital Signature (RSA): cryptography

🚀 시작하기
프로젝트를 로컬 환경에서 실행하기 위한 단계별 지침입니다.

1. 사전 준비 사항
Python 3.8 이상 및 pip

Git

2. 프로젝트 클론
git clone https://github.com/your-username/your-repository-name.git
cd your-repository-name/backend
# 백엔드 폴더로 이동합니다.

3. Supabase 프로젝트 설정
Supabase에 가입하고 새 프로젝트를 생성한 후, 아래 절차를 따라 데이터베이스와 스토리지를 설정합니다.

가. 데이터베이스 테이블 생성
Supabase 대시보드의 SQL Editor로 이동하여 아래 SQL 쿼리를 실행하세요.

-- 사용자 정보 저장을 위한 테이블
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 문서 메타데이터 저장을 위한 테이블
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

-- 빠른 조회를 위한 인덱스 추가
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_document_id ON documents(document_id);

나. 스토리지 버킷 및 정책 설정
Supabase 대시보드의 Storage로 이동하여 New bucket을 클릭합니다.

버킷 이름으로 documents를 입력하고, **Public bucket 옵션을 해제(비공개)**한 상태로 생성합니다.

생성된 documents 버킷 옆의 점 3개 메뉴를 클릭하여 Policies로 이동합니다.

기존 정책들을 삭제하고, 아래의 정책들을 New policy를 통해 추가합니다. (SQL 템플릿 사용)

로그인한 사용자가 자신의 파일만 볼 수 있도록 허용하는 정책:

-- Allows authenticated users to view their own files
CREATE POLICY "Allow authenticated user to view their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents' AND auth.uid() = (storage.foldername(name))[1]::uuid);

로그인한 사용자가 자신의 폴더에만 파일을 업로드할 수 있도록 허용하는 정책:

-- Allows authenticated users to upload to their own folder
CREATE POLICY "Allow authenticated user to upload to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents' AND auth.uid() = (storage.foldername(name))[1]::uuid);

로그인한 사용자가 자신의 파일만 삭제할 수 있도록 허용하는 정책:

-- Allows authenticated users to delete their own files
CREATE POLICY "Allow authenticated user to delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND auth.uid() = (storage.foldername(name))[1]::uuid);

4. 백엔드 환경 설정
가. Python 가상 환경 생성 및 활성화
# 가상 환경 생성
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

나. 의존성 라이브러리 설치
requirements.txt 파일을 사용하여 필요한 모든 라이브러리를 설치합니다.

pip install -r requirements.txt

다. .env 파일 생성 및 설정
프로젝트 루트에 .env 파일을 생성하고, .env.example 파일을 참고하여 아래 변수들을 채워넣습니다.

# .env

# 1. Supabase 프로젝트의 URL과 anon KEY
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_KEY="your-supabase-anon-key"

# 2. JWT 토큰 암호화를 위한 비밀 키 (아래 명령어로 생성)
# python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY="여기에_생성된_무작위_문자열을_입력하세요"

# 3. RSA-2048 개인 키 (아래 명령어로 생성 후, private_key.pem 파일 내용을 복사)
# openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048
ISSUING_AUTHORITY_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n여기에\nprivate_key.pem\n파일의\n내용을\n붙여넣으세요\n-----END PRIVATE KEY-----"

# 4. JWT 설정
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30

중요: ISSUING_AUTHORITY_PRIVATE_KEY 값은 private_key.pem 파일의 내용을 복사하여 붙여넣되, 반드시 줄바꿈을 \n으로 변경해야 합니다.

5. 애플리케이션 실행
아래 명령어를 실행하여 개발 서버를 시작합니다.

uvicorn main:app --reload --port 8000

서버가 http://127.0.0.1:8000 에서 실행됩니다. 이제 프론트엔드 애플리케이션과 통신할 준비가 완료되었습니다.