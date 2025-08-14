# 📄 문서 진위 확인 및 버전 관리 시스템

FastAPI 백엔드와 Supabase를 기반으로 **디지털 서명(Digital Signature)** 및 **RSA 공개키 기반 구조(PKI)** 를 활용하여 문서의 무결성과 진위를 검증하고, 버전을 관리하는 시스템입니다.  
**Docker Compose**를 통해 프론트엔드(Nginx)와 백엔드(FastAPI)를 컨테이너로 간단히 배포할 수 있습니다.

---

## 🚀 Quick Start
> 모든 준비가 끝난 상태라면, 아래 명령어 한 줄이면 실행됩니다.  
> 실행 후 `http://localhost:8080` 접속

```bash
git clone https://github.com/kidjohn0306/Digital_Signature_Verification_System.git
cd Digital_Signature_Verification_System
docker compose up -d
```
필수 준비물  
- Docker & Docker Compose 설치  
- back/.env 파일 생성 후 환경 변수 설정:
```bash
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_KEY="your-anon-key"
SECRET_KEY="랜덤_32바이트_16진수"
ISSUING_AUTHORITY_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```
## ✨ 주요 기능
### 인증 및 권한

- 회원가입 및 로그인

- JWT 기반 안전한 인증 (httpOnly 쿠키)

- Bcrypt 비밀번호 해싱

- RBAC(Role-Based Access Control): admin, user 역할 기반 접근 제어

- 관리자: 모든 문서 상세 조회/삭제 가능 (비밀번호 불필요)

### 문서 등록 & 디지털 서명

- 업로드 파일의 SHA-256 해시값 계산

- RSA 개인 키로 서명 후 Supabase 저장

- 신규 문서 등록 및 기존 문서 버전 업데이트

- 동일 내용 중복 등록 방지

### 문서 버전 관리

- 자동 버전 부여(v2, v3…)

- v1 삭제 시 모든 버전 일괄 삭제로 정합성 유지

### 문서 진위 검증

- 등록된 원본 파일과 비교하여 위변조 여부 판별

- RSA 서명 유효성 검증

### 문서 조회 및 상세 보기

- 검색 / 정렬 / 기간 필터

- 비밀번호 기반 상세 정보 조회 (일반 사용자)

- 관리자 모드에서는 비밀번호 없이 상세 정보 확인

- 파일 미리보기, 긴 내용 접기/펼치기

### UX/UI 개선

- 비밀번호 입력 모달 크기 축소

- 상세 패널 화면 가림 최소화

- 다크 모드 유지(useDarkMode), 입력 지연 최적화(useDebouncedValue)

## 🛠 기술 스택
| 구분      | 사용 기술                                        |
| ------- | -------------------------------------------- |
| 백엔드     | Python, FastAPI                              |
| DB/스토리지 | Supabase (PostgreSQL, Storage)               |
| 프론트엔드   | React, Tailwind CSS                          |
| 보안/인증   | RSA, SHA-256, JWT, Bcrypt                    |
| 배포/운영   | Docker, Nginx, docker-compose                |
| 기타      | dotenv, jose, cryptography, python-multipart |

## 📌 개념 및 구조 변경 사항 (최근 버전 반영)

- RBAC 도입: is_admin → role 기반 권한 제어

- python-multipart 의존성 추가: FormData 기반 업로드 처리

- Docker 배포 공식 지원: 개발·운영 환경 일관성 보장

- Nginx /api 프록시 구성: 프론트·백엔드 동일 오리진 → CORS 불필요

- 환경 변수 예시: .env.example 제공

## 📸 화면 예시
| 메인 페이지 |
|-------------|
|<img width="709" height="661" alt="main" src="https://github.com/user-attachments/assets/024d9f75-f2d8-4beb-bea1-365cbca90969" />| 

---
## 📄 라이선스
```markdown
이 프로젝트는 [MIT License](https://github.com/kidjohn0306/Digital_Signature_Verification_System/blob/main/LICENSE)를 따릅니다.  
Copyright © 보안지킴이_a security guard

```
