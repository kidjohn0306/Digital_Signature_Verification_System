// 상세 모달 + 파일 미리보기 (PDF는 react-pdf 사용)
import React, { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
// Vite: pdfjs-dist 워커를 번들에서 자동 제공받도록 처리
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

function PdfPreview({ fileUrl }) {
  const [numPages, setNumPages] = useState(null);
  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }
  return (
    <div
      className="border rounded-lg p-2 bg-neutral-100 dark:bg-neutral-800
                 border-neutral-200 dark:border-neutral-700 flex flex-col items-center"
    >
      <p className="font-semibold text-neutral-700 dark:text-neutral-200 mb-2 w-full">
        파일 미리보기:
      </p>
      <div className="flex justify-center bg-neutral-300 dark:bg-neutral-700">
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className="p-4 text-sm text-neutral-500 dark:text-neutral-300">PDF 로딩 중...</div>}
          error={<div className="p-4 text-sm text-red-500">PDF를 불러올 수 없습니다.</div>}
        >
          <Page pageNumber={1} width={400} />
        </Document>
      </div>
      {numPages && (
        <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-2">
          총 {numPages}페이지 중 1페이지
        </p>
      )}
    </div>
  );
}

function FilePreview({ detail }) {
  const fileName = detail.file_name || "";
  const fileUrl = detail.public_url || "";
  const fileContent = detail.file_content || "";
  const [fold, setFold] = useState(fileContent.length > 300);
  const fileExtension = (fileName.split(".").pop() || "").toLowerCase();

  // 이미지
  if (["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(fileExtension)) {
    return (
      <div className="border rounded-lg p-2 bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700">
        <p className="font-semibold text-neutral-700 dark:text-neutral-200 mb-2">파일 미리보기:</p>
        <img
          src={fileUrl}
          alt={fileName}
          className="max-w-full h-auto max-h-96 rounded-md object-contain mx-auto"
        />
      </div>
    );
  }
  // PDF
  if (fileExtension === "pdf") return <PdfPreview fileUrl={fileUrl} />;

  // 텍스트
  if (fileContent) {
    return (
      <div className="border rounded-lg p-3 bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700">
        <p className="font-semibold text-neutral-700 dark:text-neutral-200 mb-1">파일 내용 미리보기:</p>
        <pre
          className={`whitespace-pre-wrap text-xs font-mono text-neutral-800 dark:text-neutral-100 transition-all ${
            fold ? "max-h-24 overflow-hidden" : ""
          }`}
        >
          {fileContent}
        </pre>
        {fileContent.length > 300 && (
          <button
            type="button"
            className="text-sm font-medium underline mt-1 text-neutral-700 dark:text-neutral-200"
            onClick={() => setFold(!fold)}
          >
            {fold ? "펼치기" : "접기"}
          </button>
        )}
      </div>
    );
  }
  return null;
}

export default function DocumentDetailModal({
  isOpen,
  detail,
  onClose,
  isAdmin,
  formatDate,
  onPreview,
  onDelete,
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !detail) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-40 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl shadow-xl p-6 space-y-4
                   max-h-[90vh] overflow-y-auto
                   bg-white text-neutral-900 border border-neutral-200
                   dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex justify-between items-start pb-4 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            {detail.file_name} 상세 정보
          </h3>
          <button
            type="button"
            className="text-neutral-400 bg-transparent hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
            onClick={onClose}
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* 본문 */}
        <div className="space-y-3 text-sm">
          {isAdmin && detail.user_email && (
            <div className="bg-neutral-100 dark:bg-neutral-800 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <p className="font-semibold text-neutral-800 dark:text-neutral-200 mb-1">등록자 이메일:</p>
              <p className="break-all font-mono text-neutral-800 dark:text-neutral-100 text-sm">
                {detail.user_email}
              </p>
            </div>
          )}

          <div className="bg-neutral-100 dark:bg-neutral-800 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <p className="font-semibold text-neutral-800 dark:text-neutral-200 mb-1">문서 해시 (DB):</p>
            <p className="break-all font-mono text-neutral-800 dark:text-neutral-100 text-sm">
              {detail.file_hash}
            </p>
          </div>

          <div className="bg-neutral-100 dark:bg-neutral-800 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <p className="font-semibold text-neutral-800 dark:text-neutral-200 mb-1">디지털 서명:</p>
            <p className="break-all font-mono text-neutral-800 dark:text-neutral-100 text-sm">
              {detail.signature || "-"}
            </p>
          </div>

          <div className="bg-neutral-100 dark:bg-neutral-800 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <p className="font-semibold text-neutral-800 dark:text-neutral-200 mb-1">등록일:</p>
            <p className="text-neutral-800 dark:text-neutral-100 text-sm">
              {formatDate(detail.created_at)}
            </p>
          </div>

          <FilePreview detail={detail} />
        </div>

        {/* 풋터 */}
        <div className="flex justify-end items-center gap-3 pt-4">
          <button
            type="button"
            onClick={() => onPreview?.(detail.public_url, detail.file_name)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            파일 다운로드
          </button>
          <button
            type="button"
            onClick={() => onDelete?.()}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            삭제
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg border
                       bg-neutral-200 text-neutral-800 hover:bg-neutral-300
                       dark:bg-neutral-700 dark:text-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-600"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
