# 문서 진위 확인 및 버전 관리 시스템
## FastAPI 백엔드와 Supabase를 활용하여 디지털 서명으로 문서의 진위를 확인하고, 버전을 관리하는 시스템입니다.

사용자는 문서를 신규 등록하거나 기존 문서를 업데이트할 수 있습니다. 각 파일의 해시값은 RSA 개인 키로 서명되며,  
이 서명값과 버전 정보를 통해 문서의 무결성 및 이력을 관리합니다. Supabase는 사용자 인증, 문서 메타데이터, 파일 저장소 역할을 합니다.

## ✨ 주요 기능
보안 인증: JWT(JSON Web Token) 기반의 안전한 사용자 회원가입 및 로그인 기능을 제공합니다.

문서 등록 및 디지털 서명: 파일의 SHA-256 해시값을 계산하고, RSA 개인 키로 서명하여 Supabase에 안전하게 기록합니다.

문서 버전 관리: 기존 문서를 업데이트하여 새로운 버전을 생성할 수 있습니다 (v1, v2, ...). 신규 등록 시에는 동일한 내용의 문서 중복 등록을 방지합니다.

문서 진위 검증: 등록된 원본 문서와 검증할 파일을 1:1로 비교하여 내용의 일치 여부를 판별합니다.

문서 조회 및 관리: 사용자는 자신이 등록한 문서 목록을 버전 정보와 함께 조회하고, 비밀번호를 통해 상세 정보 확인 및 삭제가 가능합니다.

## 🛠️ 기술 스택
백엔드: Python, FastAPI

데이터베이스 & 스토리지: Supabase

프론트엔드: HTML, Vanilla JavaScript, Tailwind CSS

암호화 / 인증:

RSA (Digital Signatures) - cryptography

SHA-256 (Hashing)

JWT (User Authentication) - python-jose

Bcrypt (Password Hashing) - passlib

## 🚀 시작하기
프로젝트를 로컬 환경에서 실행하기 위한 단계별 지침입니다.

## 1. 사전 준비 사항
### Python 3.8 이상 및 pip

### Git (필수 X)

## 2. 프로젝트 클론
```
git clone https://github.com/your-username/your-repository-name.git
cd your-repository-name
```
## 3. Supabase 프로젝트 설정
Supabase에 가입하고 새 프로젝트를 생성한 후, 아래 절차를 따라 데이터베이스와 스토리지를 설정합니다.

## 가. 데이터베이스 테이블 및 함수 생성
Supabase 대시보드의 SQL Editor로 이동하여 아래 SQL 쿼리를 순서대로 실행하세요.

## 1) users 테이블 생성:

SQL
```
-- 사용자 정보 저장을 위한 테이블
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```
## 2) documents 테이블 생성:

SQL
```
-- 문서 메타데이터 저장을 위한 테이블
CREATE TABLE documents (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    document_id UUID,
    version INT,
    file_name TEXT,
    file_hash TEXT,
    password_hash TEXT,
    signature TEXT,
    storage_path TEXT,
    public_url TEXT,
    file_content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 빠른 조회를 위한 인덱스 추가
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_file_hash ON documents(file_hash);
CREATE INDEX idx_documents_document_id ON documents(document_id);
```
## 3) 문서 업데이트를 위한 DB 함수 생성:
(문서 업데이트 시 원본 목록을 효율적으로 가져오는 데 사용됩니다.)

SQL
```
-- 각 문서의 최신 버전을 가져오는 함수
CREATE OR REPLACE FUNCTION get_latest_documents_for_user(p_user_id uuid)
RETURNS TABLE(document_id uuid, file_name text, version int) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.document_id,
        d.file_name,
        d.version
    FROM (
        SELECT
            doc.document_id,
            MAX(doc.version) as max_version
        FROM documents doc
        WHERE doc.user_id = p_user_id AND doc.document_id IS NOT NULL
        GROUP BY doc.document_id
    ) as latest_versions
    JOIN documents d ON d.document_id = latest_versions.document_id AND d.version = latest_versions.max_version
    WHERE d.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;
```
## 나. 스토리지 버킷 및 정책 설정
Supabase 대시보드의 Storage로 이동하여 New bucket을 클릭합니다.

버킷 이름으로 documents를 입력하고, **Public bucket 옵션을 해제(비공개)**한 상태로 생성합니다.

생성된 documents 버킷 옆의 점 3개 메뉴를 클릭하여 Policies로 이동합니다.

기존 정책들을 삭제하고, 아래의 정책들을 New policy를 통해 추가합니다. (SQL 템플릿 사용)

### 1) 로그인한 사용자가 자신의 파일만 볼 수 있도록 허용하는 정책:

SQL
```
-- Allows authenticated users to view their own files
CREATE POLICY "Allow authenticated user to view their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents' AND auth.uid() = (storage.foldername(name))[1]::uuid);
```
### 2) 로그인한 사용자가 자신의 폴더에만 파일을 업로드할 수 있도록 허용하는 정책:

SQL
```
-- Allows authenticated users to upload to their own folder
CREATE POLICY "Allow authenticated user to upload to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents' AND auth.uid() = (storage.foldername(name))[1]::uuid);
```
## 4. 백엔드 환경 설정
가. Python 가상 환경 생성 및 활성화
```

# 가상 환경 생성
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate
```
## 나. Python 라이브러리 설치
requirements.txt 파일을 사용하여 필요한 모든 라이브러리를 설치합니다.
```
pip install -r requirements.txt
```
## 다. .env 파일 생성 및 설정
프로젝트 루트에 .env 파일을 생성하고, .env.example 파일을 참고하여 아래 변수들을 채워넣습니다.

```
# .env 파일

# 1. Supabase 프로젝트의 URL과 anon KEY
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_KEY="your-supabase-anon-key"

# 2. JWT 토큰 암호화를 위한 비밀 키 (아래 명령어로 생성)
# python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY="여기에_생성된_무작위_문자열을_입력하세요"

# 3. RSA-2048 개인 키 (아래 명령어로 생성 후, private_key.pem 파일 내용을 복사)
# openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048
ISSUING_AUTHORITY_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n여기에\nprivate_key.pem\n파일의\n내용을\n붙여넣으세요\n-----END PRIVATE KEY-----"
```
ISSUING_AUTHORITY_PRIVATE_KEY: private_key.pem 파일의 내용을 복사하여 붙여넣되, 반드시 줄바꿈을 \n으로 변경해야 합니다.

## 5. 애플리케이션 실행
## 가. 백엔드 서버 실행

```
uvicorn main:app --reload --port 8000
```  
서버가 http://127.0.0.1:8000 에서 실행됩니다.

## 나. 프론트엔드 웹 페이지 열기
웹 브라우저에서 index.html 파일을 직접 엽니다. 


## 이제 모든 기능이 정상적으로 동작할 것입니다.

<img width="771" height="704" alt="first" src="https://github.com/user-attachments/assets/ec600d58-5fb6-451f-b730-cff6cd007a1f" />
