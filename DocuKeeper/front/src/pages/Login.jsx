import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { API_BASE } from "../lib/config";

export default function Login() {
  // 이메일, 비밀번호 입력값 상태를 관리
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 에러 메시지와 플래시 메시지 상태를 관리
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");

  // 로딩 상태를 관리 (로그인 버튼을 비활성화 및 "로그인 중..." 메시지 출력)
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // 회원가입 성공 후 redirect 시 플래시 메시지를 출력
  useEffect(() => {
    if (location.state?.flash) {
      setFlash(location.state.flash); // 회원가입 성공 시 전달된 메시지를 표시
      // 메시지 재출력 방지를 위해 state를 초기화
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // 로그인 버튼 클릭 시 실행되는 함수
  const handleLogin = async () => {
    // 이메일/비밀번호 미입력 시 에러 처리
    if (!email || !password) {
      setError("이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }
    setLoading(true);
    setError("");
    setFlash("");

    try {
      // 로그인 요청에 필요한 FormData 생성
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);

      // 백엔드 API 호출
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        body: formData,
        credentials: "include", // 쿠키를 포함한 인증 처리
      });

      const data = await res.json();

      // 응답이 실패 상태라면 에러 발생
      if (!res.ok) throw new Error(data.detail || "로그인에 실패했습니다.");

      // 관리자 여부 저장 (세션 스토리지 사용)
      sessionStorage.setItem("is_admin", String(!!data.is_admin));

      // 로그인 성공 시 홈으로 이동
      navigate("/");
    } catch (err) {
      // 에러 메시지를 화면에 표시
      setError(err.message);
    } finally {
      // 로딩 상태 해제
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 font-sans min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white shadow-2xl rounded-2xl p-10">
        {/* 페이지 타이틀 */}
        <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-8">
          로그인
        </h1>
        <p className="text-center text-gray-600 mb-6">
          문서 진위 확인 시스템에 로그인하세요.
        </p>

        {/* 플래시 메시지 (회원가입 후 성공 메시지) */}
        {flash && (
          <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
            {flash}
          </div>
        )}
        {/* 에러 메시지 출력 */}
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </div>
        )}

        {/* 이메일 입력 필드 */}
        <div className="mb-6">
          <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
            이메일
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring focus:border-indigo-400"
            placeholder="이메일을 입력하세요"
            autoComplete="email"
          />
        </div>

        {/* 비밀번호 입력 필드 */}
        <div className="mb-8">
          <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring focus:border-indigo-400"
            placeholder="비밀번호를 입력하세요"
            autoComplete="current-password"
          />
        </div>

        {/* 로그인 버튼 */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-indigo-700 transition-all duration-200 disabled:bg-gray-400"
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>

        {/* 회원가입 유도 문구 */}
        <p className="text-center text-gray-600 mt-8">
          계정이 없으신가요?{" "}
          <a href="/signup" className="text-indigo-600 hover:underline font-medium">
            회원가입
          </a>
        </p>
      </div>
    </div>
  );
}