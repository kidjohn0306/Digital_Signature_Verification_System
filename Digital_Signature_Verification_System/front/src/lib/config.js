// 환경변수 우선(Vite: import.meta.env.VITE_API_BASE_URL), 없으면 로컬 기본값
export const API_BASE = (import.meta?.env?.VITE_API_BASE_URL?.trim()) || 'http://localhost:8000';