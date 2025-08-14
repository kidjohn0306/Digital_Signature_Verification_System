# 문서 진위 확인 시스템 (Frontend)

이 프로젝트는 FastAPI 백엔드와 연동되는 React + Vite 기반의 프론트엔드 애플리케이션입니다.
사용자는 이 웹 인터페이스를 통해 문서를 안전하게 등록, 검증, 조회 및 관리할 수 있습니다.

## ✨ 주요 기능

### 보안 인증

- httpOnly JWT 쿠키를 통한 안전한 회원가입 및 로그인

### 직관적인 UI

- 탭 기반 인터페이스로 문서 등록, 진위 검증, 목록 조회 기능 제공

### 문서 등록 및 버전 관리

- 신규 문서 등록 / 기존 문서 업데이트(v1, v2 …)

### 문서 진위 검증

- 등록된 원본 문서와 업로드 파일 비교 → 즉시 일치 여부 확인

### 동적 문서 조회

- 권한(관리자/일반 사용자)에 따라 목록 범위 차등 제공

- 검색, 날짜 필터, 정렬 지원

### 접근 제어

- 인증된 사용자만 메인 기능 접근 가능 (PrivateRoute 적용)

# 🛠 기술 스택

영역	            기술
Core	         React, React Router
Styling	         Tailwind CSS
Build Tool	     Vite
Language	     JavaScript (JSX)

# 🚀 시작하기

프론트엔드 프로젝트를 로컬에서 실행하기 위한 단계별 안내입니다.

1. 사전 준비 사항

Node.js v18 이상 권장

npm (Node.js 설치 시 기본 포함)

Git

백엔드 서버가 먼저 실행 중이어야 함 (기본 포트: http://localhost:8000)

2. 프로젝트 클론
git clone https://github.com/kidjohn0306/Digital_Signature_Verification_System.git
cd Digital_Signature_Verification_System

3. 의존성 설치
npm install

4. 환경 변수 설정

프론트엔드 루트(front/)에 .env 파일을 생성하고 다음 값을 입력합니다.
(.env_example을 복사해 .env로 이름 변경 후 값 수정하는 방식 권장)

# 백엔드 FastAPI 서버 주소
VITE_API_BASE_URL="http://localhost:8000"

# 선택 사항: Sentry DSN
VITE_SENTRY_DSN_FRONTEND=""


주의:

VITE_ 접두사는 Vite 프로젝트에서 환경 변수를 코드에 노출하기 위해 필수입니다.

배포 시 실제 API URL로 변경하세요.

5. 애플리케이션 실행
npm run dev


실행 후 터미널에 표시되는 주소(기본: http://localhost:5173)로 접속하면 됩니다.

📂 폴더 구조 (요약)
front/
 ├── src/
 │   ├── components/    # UI 컴포넌트
 │   ├── pages/         # 페이지 컴포넌트
 │   ├── hooks/         # 커스텀 훅
 │   └── utils/         # 공용 함수
 ├── public/
 ├── package.json
 ├── vite.config.js
 └── .env_example