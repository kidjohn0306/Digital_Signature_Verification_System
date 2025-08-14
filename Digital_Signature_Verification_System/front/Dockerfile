# ===== build (vite) =====
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .

# 빌드 타임 API 엔드포인트 주입 (compose의 build-args 에서 전달)
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

# ===== nginx serve =====
FROM nginx:1.27-alpine
WORKDIR /usr/share/nginx/html
# 정적 파일 복사
COPY --from=build /app/dist/ /usr/share/nginx/html/

# 커스텀 Nginx 설정
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
