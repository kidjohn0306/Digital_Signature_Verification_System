# jonghoon_kim
Open Source_Developer Conference_

💻 AI 최저가 탐색 프로그램 - 설치 및 사용 설명서
📄 1. 프로그램 소개
이 프로그램은 사용자가 원하는 상품의 최저가를 실시간으로 탐색하고, 과거 가격 데이터와 비교하여 지금이 구매하기 좋은 시기인지 조언해주는 AI 에이전트 시스템입니다. Docker를 사용하여 복잡한 설치 과정 없이 어디서든 동일한 환경에서 프로그램을 실행할 수 있습니다.

🛠️ 2. 사전 준비물 (필수 설치 프로그램)
이 프로그램을 실행하기 위해서는 사용자님의 컴퓨터에 아래 3가지 프로그램이 반드시 설치되어 있어야 합니다.
🟢

Node.js (LTS 버전)

자바스크립트 실행 환경. npm 명령어가 포함되어 있습니다.

https://nodejs.org/ko

🐳

Docker Desktop

프로그램을 가상의 독립된 환경에서 실행시켜 줍니다.

https://www.docker.com/products/docker-desktop/

📝

Visual Studio Code

코드 확인 및 터미널 명령어 입력을 위한 편집기입니다.

https://code.visualstudio.com/

🚀 3. 설치 및 실행 방법
사전 준비물 설치가 모두 끝났다면, 아래 순서대로 프로그램을 설치하고 실행할 수 있습니다.

1️⃣ 단계: 프로젝트 파일 준비

이 프로그램의 모든 코드 파일(Dockerfile, package.json, src 폴더 등)을 컴퓨터의 특정 폴더(예: C:\my-price-agent)에 다운로드하거나 복사합니다.

2️⃣ 단계: VS Code에서 프로젝트 열기

VS Code를 실행합니다.

상단 메뉴에서 파일(File) > 폴더 열기(Open Folder)를 선택하여 방금 파일을 복사해 둔 폴더를 엽니다.

3️⃣ 단계: 터미널 열기

VS Code 상단 메뉴에서 터미널(Terminal) > 새 터미널(New Terminal)을 선택하여 화면 하단에 터미널 창을 엽니다.

4️⃣ 단계: (최초 1회만) 필요한 라이브러리 설치

열린 터미널에 아래 명령어들을 한 줄씩 순서대로 실행합니다. (시간이 조금 걸릴 수 있습니다.)

# 기본 라이브러리 설치
npm install agentica cheerio

# 웹 크롤링 라이브러리 설치
npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth

# 개발용 라이브러리 설치
npm install -D typescript ts-node @types/node @types/cheerio

5️⃣ 단계: 프로그램 빌드 및 실행

이제 모든 준비가 끝났습니다. 터미널에 아래 명령어들을 순서대로 입력하여 프로그램을 최종적으로 실행합니다.

프로그램 빌드 (캐시 없이 새로 만들기):

docker-compose build --no-cache

빌드 완료 후 프로그램 실행:

docker-compose up

⚙️ 4. 사용 방법
1. 검색어 변경하기

프로그램이 기본적으로 "갤럭시 S24 자급제"를 검색하도록 설정되어 있습니다. 다른 상품을 검색하고 싶다면,

VS Code의 왼쪽 파일 탐색기에서 src 폴더 안에 있는 main.ts 파일을 엽니다.

아래 코드 부분을 찾아서 "" 안의 검색어를 원하는 상품명으로 수정하고 저장하세요.

// src/main.ts 파일
// ...
// 1단계: 사용자 입력 분석
const interpreter = new UserInputInterpreter();
const userQuery = "아이폰 16 프로"; // <--- 이 부분을 원하는 상품명으로 수정하세요.
const searchKeyword = await interpreter.run(userQuery);
// ...

중요: 검색어를 수정한 후에는, 위 **3. 설치 및 실행 방법**의 **5단계**를 다시 진행하여 프로그램을 재시작해야 합니다.

2. 결과 확인하기

docker-compose up 명령어를 실행하면, 터미널 화면에 각 AI 에이전트가 작동하는 과정과 함께 최종 분석 리포트가 출력됩니다.

3. 가격 히스토리 확인하기

프로그램을 한 번 실행하면, 프로젝트 폴더에 price_history.json 파일이 자동으로 생성됩니다.

이 파일에는 매일의 최저가 정보가 날짜와 함께 기록되며, 프로그램은 이 파일을 참고하여 30일 평균가를 계산합니다.
