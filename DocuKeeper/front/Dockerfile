# ===== build (vite) =====
FROM node:20-alpine AS build
WORKDIR /app/front

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# 루트 컨텍스트에서 front 하위 파일 복사
COPY front/package.json front/package-lock.json* ./
RUN npm ci

COPY front/ .
# 빌드 시 API 엔드포인트는 compose args로 주입됨 (VITE_API_BASE_URL=/api)
RUN npm run build

# ===== nginx serve =====
FROM nginx:1.27-alpine
WORKDIR /usr/share/nginx/html

# 정적 파일
COPY --from=build /app/front/dist/ /usr/share/nginx/html/

# Nginx 설정 (루트 컨텍스트의 front/nginx.conf → 컨테이너 경로)
COPY front/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]