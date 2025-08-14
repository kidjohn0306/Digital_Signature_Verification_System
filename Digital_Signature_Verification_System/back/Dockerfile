# ===== base =====
FROM python:3.11-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
WORKDIR /app

# 시스템 패키지
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates tzdata locales gnupg curl vim \
    libc6-dev build-essential libssl-dev libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# 로케일
RUN sed -i 's/# ko_KR.UTF-8 UTF-8/ko_KR.UTF-8 UTF-8/' /etc/locale.gen && locale-gen
ENV LANG=ko_KR.UTF-8 LC_ALL=ko_KR.UTF-8

# ===== deps =====
FROM base AS deps

# requirements 설치 (UTF-16 → UTF-8 변환 포함)
COPY requirements.txt /tmp/requirements.txt

# BOM/인코딩 감지 없이 간단히: UTF-16이면 디코드, 아니면 UTF-8로 처리
RUN python -c "raw=open('/tmp/requirements.txt','rb').read(); \
txt=(raw.decode('utf-16') if raw[:2] in (b'\xff\xfe', b'\xfe\xff') else raw.decode('utf-8')); \
open('/tmp/requirements.utf8.txt','w',encoding='utf-8').write(txt)"

RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r /tmp/requirements.utf8.txt

# ===== runtime =====
FROM base AS runner
WORKDIR /app

# 파이썬 런타임/패키지 복사
COPY --from=deps /usr/local /usr/local

# 앱 코드 복사
COPY . /app

# 비루트 사용자
RUN useradd -m appuser
USER appuser

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
