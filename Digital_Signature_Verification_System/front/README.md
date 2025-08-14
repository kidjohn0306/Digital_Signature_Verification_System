문서 진위 확인 시스템 (Frontend)
이 프로젝트는 FastAPI 백엔드와 연동되는 React 기반의 프론트엔드 애플리케이션입니다. 사용자는 이 웹 인터페이스를 통해 문서를 안전하게 등록, 검증, 조회 및 관리할 수 있습니다.

✨ 주요 기능
보안 인증: JWT 쿠키를 활용한 안전한 회원가입 및 로그인 기능을 제공합니다.

직관적인 UI: 탭 기반의 인터페이스로 '문서 등록', '진위 검증', '목록 조회' 기능을 쉽게 사용할 수 있습니다.

문서 등록 및 버전 관리: 새로운 문서를 등록하거나 기존 문서를 업데이트(버전 관리)할 수 있습니다.

문서 진위 검증: 등록된 원본 문서와 사용자가 업로드한 파일을 비교하여 내용의 일치 여부를 즉시 판별합니다.

동적 문서 조회: 관리자와 일반 사용자의 권한에 따라 다른 범위의 문서 목록을 보여주며, 검색, 날짜 필터링, 정렬 기능을 제공합니다.

접근 제어: 인증된 사용자만 메인 기능에 접근할 수 있도록 PrivateRoute를 통해 페이지를 보호합니다.

🛠️ 기술 스택
Core: React, React Router

Styling: Tailwind CSS

Build Tool: Vite

Language: JavaScript (JSX)

🚀 시작하기
프로젝트를 로컬 환경에서 실행하기 위한 단계별 지침입니다.

1. 사전 준비 사항
Node.js (v18 이상 권장) 및 npm

Git

백엔드 서버가 먼저 실행되고 있어야 합니다. (기본 포트: http://localhost:8000)

2. 프로젝트 클론
git clone [https://github.com/your-username/your-repository-name.git](https://github.com/your-username/your-repository-name.git)
cd your-repository-name/frontend 
# 프론트엔드 폴더로 이동합니다.

3. 의존성 라이브러리 설치
프로젝트 폴더에서 아래 명령어를 실행하여 필요한 모든 라이브러리를 설치합니다.

npm install

4. 환경 변수 설정
프론트엔드 프로젝트 루트에 .env 파일을 생성하고, 백엔드 API 서버의 주소를 설정합니다.

# .env

# 백엔드 FastAPI 서버의 주소
VITE_API_BASE_URL=http://localhost:8000

중요: VITE_ 접두사는 Vite 프로젝트에서 환경 변수를 코드에 노출시키기 위해 반드시 필요합니다.

5. 애플리케이션 실행
아래 명령어를 실행하여 개발 서버를 시작합니다.

npm run dev

이제 웹 브라우저에서 http://localhost:5173 (또는 터미널에 표시되는 다른 주소)으로 접속하면 애플리케이션을 확인할 수 있습니다.