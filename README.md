# 문서 진위 확인 시스템 (Document Verification System)

블록체인(이더리움 Ganache), FastAPI 백엔드, 그리고 Supabase를 활용한 문서 진위 확인 시스템입니다. 

문서의 해시값을 블록체인에 기록하고, 저장된 해시값을 통해 문서의 진위를 검증하며, 

Supabase를 통해 문서 메타데이터를 관리합니다.

필요한 모듈은 다음과 같습니다
 ### Node.js 패키지 (npm을 통해 설치)

@truffle/hdwallet-provider: 이더리움 지갑을 Truffle 프로젝트와 연결하는 데 사용됩니다.

dotenv: .env 파일에 설정된 환경 변수를 로드하는 데 사용됩니다.

npm install 명령어를 프로젝트 루트 디렉토리에서 실행하여 설치할 수 있습니다.

### Python 패키지 (pip을 통해 설치)

fastapi: API 서버를 구축하는 데 사용되는 웹 프레임워크입니다.

uvicorn: FastAPI 애플리케이션을 실행하는 ASGI 서버입니다.

web3: 이더리움 블록체인과 상호작용하는 데 사용되는 라이브러리입니다.

python-dotenv: Python에서 .env 파일의 환경 변수를 로드하는 데 사용됩니다.

supabase-py: Supabase와 상호작용하는 Python 클라이언트 라이브러리입니다.

pip install fastapi uvicorn web3 python-dotenv supabase-py 명령어를 Python 가상 환경을 활성화한 후 실행하여 설치할 수 있습니다.

## 🗂️ 프로젝트 구조

BlockChain_Document/

├── .env.example              # 환경 변수 예시 파일

├── .gitignore                # Git 추적에서 제외할 파일 설정

├── contracts/                # 스마트 계약 (Solidity) 소스 코드

│   └── DocumentVerifier.sol

├── migrations/               # Truffle 마이그레이션 스크립트 

│└── 1_initial_migration.js 

├── index.html                # 웹 프론트엔드 (HTML/JavaScript)
│ 

├── main.py                   # FastAPI 백엔드 서버 코드 (Python)

├── package.json              # Node.js 프로젝트 종속성

├── package-lock.json         # Node.js 종속성 잠금 파일

├── truffle-config.js         # Truffle 설정 파일

└── README.md                 # 현재 문서

## ✨ 주요 기능

* **문서 해시 등록**: 파일의 해시값을 계산하여 이더리움 블록체인에 등록합니다. 등록된 해시는 Supabase에도 파일명, 트랜잭션 ID와 함께 기록됩니다.
* **문서 진위 검증**: 파일의 해시값을 계산하여 블록체인에 등록된 해시와 비교하여 진위 여부를 확인합니다.
* **문서 조회**: Supabase에 저장된 문서 목록과 상세 정보를 조회할 수 있습니다.

## 🛠️ 기술 스택

* **블록체인**: Solidity, Truffle, Ganache (개발용 프라이빗 블록체인)
* **백엔드**: Python, FastAPI, Web3.py
* **데이터베이스**: Supabase
* **프론트엔드**: HTML, JavaScript, Tailwind CSS

## 🚀 시작하기

프로젝트를 실행하기 위한 단계별 지침입니다.

### 📋 사전 준비 사항

다음 소프트웨어들이 시스템에 설치되어 있어야 합니다:

* **Node.js & npm (또는 yarn)**: [Node.js 공식 웹사이트](https://nodejs.org/)에서 다운로드 및 설치.
* **Python 3.x & pip**: [Python 공식 웹사이트](https://www.python.org/)에서 다운로드 및 설치.
* **Ganache**: [TruffleSuite 공식 웹사이트](https://trufflesuite.com/ganache/)에서 다운로드 및 설치.
* **Git**: [Git 공식 웹사이트](https://git-scm.com/)에서 다운로드 및 설치.

### 📦 종속성 설치

프로젝트 루트 디렉토리에서 터미널을 열고 다음 명령어를 실행하여 필요한 종속성(패키지)을 설치합니다:

```bash
# Node.js 패키지 설치
npm install

# Python 가상 환경 생성 및 활성화 (권장)
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

# Python 패키지 설치
pip install fastapi uvicorn web3 python-dotenv supabase-py

⚙️ 환경 설정
프로젝트 루트 디렉토리에 .env 파일을 생성하고 .env.example 파일을 참고하여 환경 변수를 설정합니다.

Ganache 실행:

Ganache 데스크톱 애플리케이션을 실행합니다.

새로운 워크스페이스를 생성하거나 기존 워크스페이스를 초기화합니다 (Settings -> Workspaces -> DELETE -> ADD WORKSPACE).

Ganache의 NETWORK ID가 5777인지, RPC SERVER가 http://127.0.0.1:8545인지 확인합니다.

Ganache에서 제공하는 첫 번째 계정의 PRIVATE KEY를 복사합니다. (계정 옆 열쇠 아이콘 클릭)

.env 파일 생성 및 설정:

프로젝트 루트 디렉토리에 .env 파일을 생성합니다.

아래 내용을 .env 파일에 붙여넣고 YOUR_CONTRACT_ADDRESS_HERE 및 YOUR_PRIVATE_KEY_HERE 부분을 위에서 얻은 실제 값으로 대체합니다. Supabase 키는 이미 설정되어 있으니 그대로 사용하거나 .env.example의 플레이스홀더로 변경할 수 있습니다.
```
## ⚙️ 환경 설정

프로젝트 루트 디렉토리에 .env 파일을 생성하고 .env.example 파일을 참고하여 환경 변수를 설정합니다.

### 1. Ganache 실행:

Ganache 데스크톱 애플리케이션을 실행합니다.

새로운 워크스페이스를 생성하거나 기존 워크스페이스를 초기화합니다 

(Settings -> Workspaces -> DELETE -> ADD WORKSPACE).

Ganache의 NETWORK ID가 5777인지, RPC SERVER가 http://127.0.0.1:8545인지 확인합니다.

Ganache에서 제공하는 첫 번째 계정의 PRIVATE KEY를 복사합니다. (계정 옆 열쇠 아이콘 클릭)

### 2. env 파일 생성 및 설정:

프로젝트 루트 디렉토리에 .env 파일을 생성합니다.

아래 내용을 .env 파일에 붙여넣고 
YOUR_CONTRACT_ADDRESS_HERE 및 YOUR_PRIVATE_KEY_HERE 부분을 위에서 얻은 실제 값으로 대체합니다. 

Supabase 키는 이미 설정되어 있으니 그대로 사용하거나 .env.example의 플레이스홀더로 변경할 수 있습니다.

```bash
WEB3_PROVIDER_URL="[http://127.0.0.1:8545](http://127.0.0.1:8545)"
CONTRACT_ADDRESS="YOUR_CONTRACT_ADDRESS_HERE"
PRIVATE_KEY="YOUR_PRIVATE_KEY_HERE"

SUPABASE_URL="[https://mdtmbxpwlemlivfhfwfi.supabase.co](https://mdtmbxpwlemlivfhfwfi.supabase.co)"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kdG1ieHB3bGVtbGl2Zmhmd2ZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNjEzMzYsImV4cCI6MjA2OTYzNzMzNn0.-wJMqozHt_jsIYfdATuZXUsd0XxsyxlCsEdtx_o6Hjg"
```
## 🔗 스마트 계약 배포
DocumentVerifier.sol 스마트 계약을 Ganache 블록체인에 배포합니다.

### 1. 계약 컴파일:

프로젝트 루트 디렉토리에서 다음 명령어를 실행합니다:
```bash
truffle compile
```
이 명령은 build/contracts/DocumentVerifier.json 파일을 생성합니다. 

### 2.계약 마이그레이션 (배포):

다음 명령어를 실행하여 계약을 Ganache에 배포합니다:
```bash
truffle migrate --network development
```
### 중요: 이 명령어가 완료되면 터미널에 DocumentVerifier 계약의 contract address:가 출력됩니다.이 주소를 복사하여 .env 파일의 CONTRACT_ADDRESS 값으로 업데이트해야 합니다.

## 🚀 애플리케이션 실행
이제 백엔드 서버와 프론트엔드를 실행할 준비가 되었습니다.

백엔드 서버 실행:

이전에 활성화한 Python 가상 환경에서 다음 명령어를 실행합니다:
```bash
uvicorn main:app --reload --port 8000
```
서버가 http://127.0.0.1:8000에서 실행될 것입니다.

## 프론트엔드 웹 페이지 열기:

웹 브라우저를 열고 index.html 파일을 직접 엽니다.
이제 웹 인터페이스를 통해 문서 등록, 검증, 조회를 테스트할 수 있습니다!

## _예시 이미지_
<img width="500" height="280" alt="1번" src="https://github.com/user-attachments/assets/410c19fe-27a4-48f0-9e21-1d960bf9e831" />
<img width="500" height="600" alt="4번" src="https://github.com/user-attachments/assets/68473cdd-0b3e-450c-97c1-478f1f2ba4da" />



## 문서 등록 시 Supabase의 documents 테이블에 데이터가 저장되는지 확인해 보세요.

**Full Changelog**: https://github.com/kidjohn0306/BlockChain_Document/compare/v0.05...v0.06
