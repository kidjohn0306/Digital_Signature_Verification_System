
# 📄 문서 진위 확인 및 버전 관리 시스템
FastAPI 백엔드와 Supabase를 기반으로 **디지털 서명(Digital Signature)** 및 **RSA 공개키 기반 구조(PKI)** 를 활용하여 문서의 무결성과 진위를 검증하고, 버전을 관리하는 시스템입니다.

---

## ✨ 주요 기능
- **회원가입 및 로그인**  
  - JWT 기반 안전한 인증  
  - Bcrypt를 통한 비밀번호 해싱 저장  
  - 로그인 세션 유지 (쿠키 기반)
- **문서 등록 & 디지털 서명**  
  - 업로드된 파일의 SHA-256 해시값 계산  
  - RSA 개인 키로 디지털 서명 후 Supabase 저장  
  - 신규 문서 등록 & 기존 문서 버전 업데이트 가능
- **문서 버전 관리**  
  - 기존 문서 업데이트 시 자동으로 v2, v3 … 버전 부여  
  - 동일한 내용의 중복 등록 방지
- **문서 진위 검증**  
  - 등록된 원본 파일과 비교하여 위변조 여부 확인  
  - RSA 서명 유효성 검증
- **문서 조회 및 상세 보기**  
  - 검색 / 정렬 / 기간 필터  
  - **비밀번호 기반 상세 정보 조회**(일반 사용자)  
  - 관리자 모드에서는 바로 상세 정보 확인 가능  
  - 긴 내용 접기·펼치기, 파일 미리보기 지원
- **UX 개선**  
  - 비밀번호 입력창 모달 크기 축소  
  - 상세 패널이 화면을 가리지 않도록 조정

---

## 🛠 기술 스택
| 구분 | 사용 기술 |
|------|-----------|
| **백엔드** | Python, FastAPI |
| **DB/스토리지** | Supabase (PostgreSQL, Storage) |
| **프론트엔드** | React, Tailwind CSS |
| **보안/인증** | RSA, SHA-256, JWT, Bcrypt |
| **기타** | dotenv, jose, cryptography |

---

## 🚀 설치 및 실행 방법

### 1. 사전 준비
- Python 3.8+
- Node.js (프론트엔드 실행용)
- Supabase 프로젝트

### 2. 레포지토리 클론
```bash
git clone https://github.com/your-username/your-repository-name.git
cd your-repository-name
```

### 3. 백엔드 환경 설정
```bash
python -m venv .venv
source .venv/bin/activate  # (Windows: .venv\Scripts\activate)
pip install -r requirements.txt
```
`.env` 파일 생성 후 환경변수 설정:
```env
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_KEY="your-anon-key"
SECRET_KEY="랜덤_32바이트_16진수"
ISSUING_AUTHORITY_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

### 4. Supabase 설정
#### (1) 데이터베이스 테이블 생성
```sql
-- 사용자 테이블
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    role TEXT DEFAULT 'user', -- admin / user
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 문서 메타데이터 테이블
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

-- 인덱스
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_file_hash ON documents(file_hash);
CREATE INDEX idx_documents_document_id ON documents(document_id);
```

#### (2) 최신 버전 조회 함수 생성
```sql
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

#### (3) Storage 버킷 생성 및 정책
```sql
-- documents 버킷 생성 후, Public 비활성화
-- 사용자 전용 접근 정책
CREATE POLICY "Allow authenticated user to view their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents' AND auth.uid() = (storage.foldername(name))[1]::uuid);

CREATE POLICY "Allow authenticated user to upload to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents' AND auth.uid() = (storage.foldername(name))[1]::uuid);
```

---

### 5. 서버 실행
```bash
uvicorn main:app --reload --port 8000
```

### 6. 프론트엔드 실행
```bash
cd Frontend
npm install
npm run dev
```

---

## 📸 화면 예시
| 메인 페이지 |
|-------------|
| ![main](https://github.com/user-attachments/assets/ec600d58-5fb6-451f-b730-cff6cd007a1f) | 

---
