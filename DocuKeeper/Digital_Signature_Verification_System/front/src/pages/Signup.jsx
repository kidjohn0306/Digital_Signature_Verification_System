import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../lib/config";

// 회원가입 페이지 컴포넌트
export default function Signup() {
  const navigate = useNavigate();

  // --- 상태 관리 ---
  // 사용자 입력 값 (이메일, 비밀번호)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  // UI 상태 (오류, 성공, 로딩)
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  // --- 유효성 검사 함수 ---
  // 이메일 형식, 비밀번호 길이, 비밀번호 일치 여부 등을 확인합니다.
  const validate = () => {
    setError("");
    setOk("");

    if (!email || !password || !confirm) {
      setError("모든 필드를 입력해주세요.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("이메일 형식이 올바르지 않습니다.");
      return false;
    }
    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      return false;
    }
    if (password !== confirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return false;
    }
    return true;
  };

  // --- 회원가입 처리 함수 ---
  // 서버에 회원가입을 요청하고 결과에 따라 UI를 업데이트합니다.
  const handleSignup = async () => {
    if (!validate()) return;

    setLoading(true);
    setError("");
    setOk("");

    try {
      const form = new FormData();
      form.append("email", email);
      form.append("password", password);

      const res = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "회원가입에 실패했습니다.");
      }

      setOk("회원가입이 완료되었습니다. 로그인 페이지로 이동합니다...");
      setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: { flash: "회원가입 완료! 로그인해 주세요." },
        });
      }, 600);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- JSX 렌더링 ---
  // 회원가입 폼 UI를 화면에 그립니다.
  return (
    <div className="bg-gray-100 font-sans flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-lg bg-white shadow-2xl rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          회원가입
        </h1>
        <p className="text-center text-gray-600 mb-8">
          문서 진위 확인 시스템 계정을 생성하세요.
        </p>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </div>
        )}
        {ok && (
          <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
            {ok}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
            이메일
          </label>
          <input
            id="email"
            type="email"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:border-indigo-400"
            placeholder="사용할 이메일을 입력하세요"
            value={email}
            onChange={(e) => setEmail(e.target.value.trim())}
            autoComplete="email"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:border-indigo-400"
            placeholder="비밀번호를 입력하세요 (최소 6자)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="confirm" className="block text-gray-700 font-medium mb-2">
            비밀번호 확인
          </label>
          <input
            id="confirm"
            type="password"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:border-indigo-400"
            placeholder="비밀번호를 다시 입력하세요"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <button
          onClick={handleSignup}
          disabled={loading}
          className="w-full bg-indigo-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-indigo-700 disabled:bg-gray-400"
        >
          {loading ? "회원가입 중..." : "회원가입"}
        </button>

        <p className="text-center text-gray-600 mt-6">
          이미 계정이 있으신가요?{" "}
          <a href="/login" className="text-indigo-600 hover:underline font-medium">
            로그인
          </a>
        </p>
      </div>
    </div>
  );
}