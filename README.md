# 문서 진위 확인 시스템 (Digital Signature Verification System)
### FastAPI 백엔드와 Supabase를 활용하여 디지털 서명(Digital Signatures) 및 공개 키 기반 구조(PKI)로 문서의 진위를 확인하는 시스템입니다.

### 문서의 해시값을 RSA 개인 키로 서명하고, 이 서명값을 통해 문서의 위변조 여부를 검증합니다. Supabase는 문서 메타데이터와 서명값을 안전하게 저장하는 역할을 합니다.

## 🗂️ 프로젝트 구조
Digital_Signature_Verification_System/

├── .env                      # 환경 변수 파일 (민감한 정보 포함, gitignore에 추가)

├── .env.example              # 환경 변수 예시 파일

├── .gitignore                # Git 추적에서 제외할 파일 설정

├── index.html                # 웹 프론트엔드 (HTML/JavaScript)

├── main.py                   # FastAPI 백엔드 서버 코드 (Python)

├── requirements.txt          # Python 패키지 의존성 목록

└── README.md                 # 현재 문서

## ✨ 주요 기능
문서 서명 및 등록: 파일의 해시값을 계산하여 미리 설정된 RSA 개인 키로 서명합니다. 서명된 해시값과 문서 메타데이터는 Supabase에 안전하게 기록됩니다.

문서 진위 검증: 파일의 해시값을 다시 계산하고, Supabase에 저장된 서명과 개인 키로부터 유도된 공개 키를 비교하여 문서의 위변조 여부를 확인합니다.

문서 조회: Supabase에 저장된 문서 목록과 상세 정보를 조회할 수 있습니다.

## 🛠️ 기술 스택
### 암호화: RSA (Digital Signatures), SHA-256 (Hashing), cryptography 라이브러리

### 백엔드: Python, FastAPI, passlib, python-dotenv

### 데이터베이스: Supabase

### 프론트엔드: HTML, JavaScript, Tailwind CSS

🚀 시작하기
프로젝트를 실행하기 위한 단계별 지침입니다.

## 📋 사전 준비 사항
다음 소프트웨어들이 시스템에 설치되어 있어야 합니다:

Python 3.x & pip: Python 공식 웹사이트에서 다운로드 및 설치.

Git: Git 공식 웹사이트에서 다운로드 및 설치.

## 📦 종속성 설치
프로젝트 루트 디렉토리에서 터미널을 열고 다음 명령어를 실행하여 필요한 종속성(패키지)을 설치합니다:

## Python 가상 환경 생성 및 활성화 (권장)
python -m venv .venv
### Windows
```
.venv\Scripts\activate
```
### macOS/Linux
```
source .venv/bin/activate
```
## Python 패키지 설치 (requirements.txt 파일을 사용하는 경우)
```
pip install -r requirements.txt
```
## requirements.txt 파일이 없는 경우, 다음 명령어를 사용하여 직접 설치

```
pip install fastapi uvicorn cryptography passlib[bcrypt] python-dotenv supabase-py
```

## ⚙️ 환경 설정
.env 파일 생성 및 설정:
프로젝트 루트 디렉토리에 .env 파일을 생성하고, SUPABASE_URL, SUPABASE_KEY 값을 설정합니다. 특히, ISSUING_AUTHORITY_PRIVATE_KEY에는 유효한 PEM 형식의 RSA 개인 키를 입력해야 합니다.

```
openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048 명령어를 사용하여 개인 키를 생성할 수 있습니다.
```


## Supabase 데이터베이스 설정:
Supabase의 documents 테이블에 signature라는 새로운 TEXT 타입 컬럼을 추가해야 합니다.

## 🚀 애플리케이션 실행
이제 백엔드 서버와 프론트엔드를 실행할 준비가 되었습니다.

### 백엔드 서버 실행:
이전에 활성화한 Python 가상 환경에서 다음 명령어를 실행합니다:

```
uvicorn main:app --reload --port 8000
```

서버가 http://127.0.0.1:8000에서 실행될 것입니다.

### 프론트엔드 웹 페이지 열기:
웹 브라우저를 열고 index.html 파일을 직접 엽니다.
### 이제 웹 인터페이스를 통해 문서 등록, 검증, 조회를 테스트할 수 있습니다!

## 문서 등록 시 Supabase의 documents 테이블에 file_hash와 signature 데이터가 성공적으로 저장되는지 확인해 보세요.  

