import { useEffect, useState } from "react";

const KEY = "prefers-dark";

export default function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem(KEY);
    if (saved !== null) return saved === "1";
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });

  // html 요소에 dark 클래스 반영 + 저장
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", dark);
    localStorage.setItem(KEY, dark ? "1" : "0");
  }, [dark]);

  // 시스템 테마 변화(사용자 수동 저장 없을 때만 반영)
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e) => {
      if (localStorage.getItem(KEY) !== null) return;
      setDark(e.matches);
    };
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, []);

  return { dark, setDark, toggle: () => setDark((v) => !v) };
}
