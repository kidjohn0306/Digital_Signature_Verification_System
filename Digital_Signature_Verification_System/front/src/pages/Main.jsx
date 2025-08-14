// front/src/pages/Main.jsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../lib/config";
import { http, httpJson } from "../lib/http";
import DocumentDetailModal from "../components/DocumentDetailModal";
import useDebouncedValue from "../lib/useDebouncedValue";
import useDarkMode from "../lib/useDarkMode";

export default function Main() {
  const navigate = useNavigate();
  const isAdmin = useMemo(
    () => sessionStorage.getItem("is_admin") === "true",
    []
  );

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
    } catch {
      return iso || "-";
    }
  };

  // ✅ 다크모드: Main에서만 훅 사용 (App.jsx에서는 사용하지 마세요)
  const { dark, toggle } = useDarkMode();

  const [activeTab, setActiveTab] = useState("lookup");
  const [filesToProcess, setFilesToProcess] = useState([]);
  const [password, setPassword] = useState("");
  const [uploadType, setUploadType] = useState("new");
  const [updateDocs, setUpdateDocs] = useState([]);
  const [targetDocumentId, setTargetDocumentId] = useState("");
  const [originalOptions, setOriginalOptions] = useState([]);
  const [selectedOriginalHash, setSelectedOriginalHash] = useState("");
  const [docGroups, setDocGroups] = useState([]);
  const [isLoadingLookup, setIsLoadingLookup] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [resultBox, setResultBox] = useState(null);

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const passwordInputRef = useRef(null);
  const [passwordError, setPasswordError] = useState("");
  const [pendingDetail, setPendingDetail] = useState(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentDetail, setCurrentDetail] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const docsAuth = useMemo(
    () => JSON.parse(sessionStorage.getItem("docsAuth_v1") || "{}"),
    []
  );
  const docsCache = useMemo(
    () => JSON.parse(sessionStorage.getItem("docsCache_v1") || "{}"),
    []
  );
  const saveCache = (k, v) => {
    try {
      sessionStorage.setItem(k, JSON.stringify(v));
    } catch (err) {
      console.warn("saveCache failed", err);
    }
  };

  // ✅ 검색 상태 (IME 대응: 하나의 상태로만 관리)
  const [q, setQ] = useState("");
  const [isComposing, setIsComposing] = useState(false); // 한글 조합 중 표시
  const debouncedQ = useDebouncedValue(q, 400);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortOrder, setSortOrder] = useState("latest");
  const loadAbortRef = useRef(null);

  // 목록 불러오기 (qParam을 명시적으로 넘김)
  const fetchDocuments = useCallback(
    async ({ qParam, signal }) => {
      setIsLoadingLookup(true);
      setLookupError("");
      try {
        const sp = new URLSearchParams({
          sort: sortOrder || "latest",
          q: qParam || "",
          from: dateFrom || "",
          to: dateTo || "",
          admin: isAdmin ? "1" : "",
        });
        const data = await httpJson(`${API_BASE}/documents?${sp.toString()}`, {
          signal,
        });
        setDocGroups(Array.isArray(data.documents) ? data.documents : []);
      } catch (e) {
        if (e.name !== "AbortError") {
          setLookupError(e.message);
          setDocGroups([]);
        }
      } finally {
        setIsLoadingLookup(false);
      }
    },
    [sortOrder, dateFrom, dateTo, isAdmin]
  );

  // 검색/필터 변경 시 로드 (조합 중에는 무시)
  useEffect(() => {
    if (activeTab !== "lookup" || isComposing) return;
    loadAbortRef.current?.abort?.();

    const controller = new AbortController();
    loadAbortRef.current = controller;

    setCurrentPage(1);
    fetchDocuments({ qParam: debouncedQ, signal: controller.signal });

    return () => controller.abort();
  }, [activeTab, debouncedQ, dateFrom, dateTo, sortOrder, isComposing, fetchDocuments]);

  const changeTab = async (tab) => {
    setActiveTab(tab);
    setResultBox(null);
    setFilesToProcess([]);
    setPassword("");
    setSelectedOriginalHash("");
    setTargetDocumentId("");
    setCurrentPage(1);
    setIsDetailModalOpen(false);

    if (tab === "verify") {
      await loadOriginalOptions();
    }
  };

  const loadUpdateDocs = async () => {
    try {
      const data = await httpJson(
        `${API_BASE}/documents_for_update?sort=${sortOrder}`
      );
      if (data.success) setUpdateDocs(data.documents || []);
    } catch (e) {
      console.error("업데이트용 문서 목록 로드 실패", e);
      setUpdateDocs([]);
    }
  };

  const loadOriginalOptions = async () => {
    try {
      const data = await httpJson(`${API_BASE}/documents?sort=${sortOrder}`);
      const flattened = [];
      if (data.success && Array.isArray(data.documents)) {
        data.documents.forEach((g) =>
          (g.version_history || []).forEach((d) => {
            flattened.push({
              file_hash: d.file_hash,
              file_name: d.file_name,
              version: d.version,
            });
          })
        );
      }
      setOriginalOptions(flattened);
    } catch (e) {
      console.error("원본 목록 로드 실패", e);
      setOriginalOptions([]);
    }
  };

  const pickFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = (e) => {
      const f = e.target.files?.[0];
      setFilesToProcess(f ? [f] : []);
    };
    input.click();
  };
  const removeFile = () => setFilesToProcess([]);

  const canSubmit = useMemo(() => {
    const hasFile = filesToProcess.length === 1;
    if (activeTab === "register") {
      const hasPw = password.trim() !== "";
      return uploadType === "update"
        ? hasFile && hasPw && !!targetDocumentId
        : hasFile && hasPw;
    }
    if (activeTab === "verify") return hasFile && !!selectedOriginalHash;
    return false;
  }, [
    activeTab,
    filesToProcess,
    password,
    uploadType,
    targetDocumentId,
    selectedOriginalHash,
  ]);

  const runAction = async () => {
    if (!canSubmit) return;
    setActionBusy(true);
    setResultBox(null);
    try {
      let url = "";
      const body = new FormData();
      if (activeTab === "register") {
        url = `${API_BASE}/register`;
        body.append("document_file", filesToProcess[0]);
        body.append("password", password);
        body.append("upload_type", uploadType);
        if (uploadType === "update")
          body.append("target_document_id", targetDocumentId);
      } else {
        url = `${API_BASE}/verify_with_original`;
        body.append("original_file_hash", selectedOriginalHash);
        body.append("document_file", filesToProcess[0]);
      }
      const res = await http(url, { method: "POST", body });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.detail || `API 호출 실패: ${res.status}`);
      const ok = data.success !== false && data.is_valid !== false;
      setResultBox({
        success: ok,
        file_name: data.file_name || filesToProcess[0]?.name,
        message: data.message,
        submitted_hash: data.submitted_hash,
        uploaded_hash: data.uploaded_hash,
      });
      if (activeTab === "register") {
        setCurrentPage(1);
        // 최신 목록 갱신
        loadAbortRef.current?.abort?.();
        const controller = new AbortController();
        loadAbortRef.current = controller;
        fetchDocuments({ qParam: debouncedQ, signal: controller.signal });
      }
    } catch (e) {
      setResultBox({ success: false, message: e.message });
    } finally {
      setActionBusy(false);
    }
  };

  const openDetail = (doc) => {
    if (docsAuth[doc.file_hash] && docsCache[doc.file_hash]) {
      setCurrentDetail(docsCache[doc.file_hash]);
      setIsDetailModalOpen(true);
      return;
    }
    if (isAdmin) {
      fetchDetailAsAdmin(doc);
      return;
    }
    setPendingDetail({ doc });
    setPasswordError("");
    setPasswordModalOpen(true);
    setTimeout(() => passwordInputRef.current?.focus(), 10);
  };

  const fetchDetailAsAdmin = async (doc) => {
    try {
      const form = new FormData();
      form.append("file_hash", doc.file_hash);
      const data = await httpJson(`${API_BASE}/document_detail_admin`, {
        method: "POST",
        body: form,
      });
      if (data.success && data.document) {
        docsAuth[doc.file_hash] = true;
        docsCache[doc.file_hash] = data.document;
        saveCache("docsAuth_v1", docsAuth);
        saveCache("docsCache_v1", docsCache);
        setCurrentDetail(data.document);
        setIsDetailModalOpen(true);
      }
    } catch (e) {
      alert(e.message || "상세 조회 실패");
    }
  };

  const confirmDetailPassword = async () => {
    const el = passwordInputRef.current;
    if (!el || !pendingDetail) return;
    const pw = el.value.trim();
    if (!pw) {
      setPasswordError("비밀번호를 입력하세요.");
      return;
    }
    try {
      const body = new FormData();
      body.append("file_hash", pendingDetail.doc.file_hash);
      body.append("password", pw);
      const data = await httpJson(`${API_BASE}/document_detail`, {
        method: "POST",
        body,
      });
      if (data.success && data.document) {
        docsAuth[pendingDetail.doc.file_hash] = true;
        docsCache[pendingDetail.doc.file_hash] = data.document;
        saveCache("docsAuth_v1", docsAuth);
        saveCache("docsCache_v1", docsCache);
        setCurrentDetail(data.document);
        setIsDetailModalOpen(true);
        setPasswordModalOpen(false);
      }
    } catch (e) {
      setPasswordError(e.message || "비밀번호가 일치하지 않습니다.");
    }
  };

  const deleteDocument = async () => {
    if (!currentDetail) return;
    if (
      !window.confirm(
        `'${currentDetail.file_name}' 문서를 삭제하시겠습니까?\n(v1 삭제 시 그룹 전체가 삭제됩니다.)`
      )
    )
      return;
    try {
      const body = new FormData();
      body.append("file_hash", currentDetail.file_hash);
      const data = await httpJson(`${API_BASE}/document_delete`, {
        method: "DELETE",
        body,
      });
      if (data.success) {
        setIsDetailModalOpen(false);
        setCurrentDetail(null);
        setCurrentPage(1);
        // 삭제 후 목록 갱신
        loadAbortRef.current?.abort?.();
        const controller = new AbortController();
        loadAbortRef.current = controller;
        fetchDocuments({ qParam: debouncedQ, signal: controller.signal });
      }
    } catch (e) {
      alert("삭제 실패: " + (e.message || "알 수 없는 오류"));
    }
  };

  const handleCloseDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
    setCurrentDetail(null);
  }, []);

  const Tabs = (
    <div className="flex space-x-2 border-b-2 border-gray-200 dark:border-neutral-700 mb-6">
      {[
        { key: "register", label: "문서 등록하기" },
        { key: "verify", label: "문서 진위 검증" },
        { key: "lookup", label: "문서 조회하기" },
      ].map((t) => (
        <button
          key={t.key}
          onClick={() => changeTab(t.key)}
          className={`flex-1 text-center px-4 py-2 font-medium rounded-t-lg transition-colors duration-200 ${
            activeTab === t.key
              ? "bg-indigo-600 text-white"
              : "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );

  const RegisterSection = (
    <div className="space-y-6">
      <div>
        <label className="block text-gray-700 dark:text-neutral-200 font-medium mb-2">
          등록 방식
        </label>
        <div className="flex gap-2">
          <button
            className={`flex-1 px-4 py-2 rounded-lg font-medium ${
              uploadType === "new"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-800 dark:bg-neutral-700 dark:text-neutral-200"
            }`}
            onClick={() => {
              setUploadType("new");
              setTargetDocumentId("");
            }}
          >
            신규 문서 등록
          </button>
          <button
            className={`flex-1 px-4 py-2 rounded-lg font-medium ${
              uploadType === "update"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-800 dark:bg-neutral-700 dark:text-neutral-200"
            }`}
            onClick={async () => {
              setUploadType("update");
              await loadUpdateDocs();
            }}
          >
            기존 문서 업데이트
          </button>
        </div>
      </div>

      {uploadType === "update" && (
        <div>
          <label className="block text-gray-700 dark:text-neutral-200 mb-2">
            업데이트할 원본 문서 선택
          </label>
          <select
            className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700 text-gray-900 dark:text-neutral-100"
            value={targetDocumentId}
            onChange={(e) => setTargetDocumentId(e.target.value)}
          >
            <option value="">원본 문서 선택...</option>
            {updateDocs.map((d) => (
              <option key={d.document_id} value={d.document_id}>
                {d.file_name} (v{d.version})
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-gray-700 dark:text-neutral-200 font-medium mb-2">
          문서 파일 추가 (1개만 가능)
        </label>
        {filesToProcess.length === 0 ? (
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            onClick={pickFile}
          >
            파일 추가
          </button>
        ) : (
          <div className="mt-1 flex items-center gap-2 bg-gray-100 dark:bg-neutral-700 rounded-lg px-3 py-2">
            <span className="truncate">{filesToProcess[0].name}</span>
            <button
              className="text-gray-500 hover:text-gray-800 dark:text-neutral-300 dark:hover:text-white"
              onClick={removeFile}
            >
              &times;
            </button>
          </div>
        )}
      </div>

      <div>
        <label className="block text-gray-700 dark:text-neutral-200 font-medium mb-2">
          비밀번호 입력{" "}
          <span className="text-xs text-gray-400 dark:text-neutral-400">
            (문서 상세조회 보호)
          </span>
        </label>
        <input
          type="password"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:border-indigo-400 bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700 text-gray-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-400"
          placeholder="문서 비밀번호를 입력하세요"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="flex justify-center">
        <button
          className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-indigo-700 disabled:bg-gray-400"
          disabled={!canSubmit || actionBusy}
          onClick={runAction}
        >
          {actionBusy ? "문서 등록 중..." : "문서 등록하기"}
        </button>
      </div>

      {resultBox && (
        <ActionResult
          box={resultBox}
          fileNameFallback={filesToProcess[0]?.name}
        />
      )}
    </div>
  );

  const VerifySection = (
    <div className="space-y-6">
      <div>
        <label className="block text-gray-700 dark:text-neutral-200 mb-2">
          비교할 원본 문서 선택
        </label>
        <select
          className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700 text-gray-900 dark:text-neutral-100"
          value={selectedOriginalHash}
          onChange={(e) => setSelectedOriginalHash(e.target.value)}
        >
          <option value="">원본 문서 선택...</option>
          {originalOptions.map((o) => (
            <option key={`${o.file_hash}-${o.version}`} value={o.file_hash}>
              {o.file_name} (v{o.version})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-gray-700 dark:text-neutral-200 font-medium mb-2">
          문서 파일 추가 (1개만 가능)
        </label>
        {filesToProcess.length === 0 ? (
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            onClick={pickFile}
          >
            파일 추가
          </button>
        ) : (
          <div className="mt-1 flex items-center gap-2 bg-gray-100 dark:bg-neutral-700 rounded-lg px-3 py-2">
            <span className="truncate">{filesToProcess[0].name}</span>
            <button
              className="text-gray-500 hover:text-gray-800 dark:text-neutral-300 dark:hover:text-white"
              onClick={removeFile}
            >
              &times;
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <button
          className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-indigo-700 disabled:bg-gray-400"
          disabled={!canSubmit || actionBusy}
          onClick={runAction}
        >
          {actionBusy ? "문서 검증 중..." : "문서 진위 검증하기"}
        </button>
      </div>

      {resultBox && (
        <ActionResult
          box={resultBox}
          fileNameFallback={filesToProcess[0]?.name}
        />
      )}
    </div>
  );

  const LookupSection = () => {
    const itemsPerPage = 3;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentDocGroups = docGroups.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(docGroups.length / itemsPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            className="px-3 py-2 border rounded w-48 bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700 text-gray-900 dark:text-neutral-100"
            value={q}
            placeholder="검색: 파일명/이메일"
            onChange={(e) => setQ(e.target.value)}          // 가공 금지
            onCompositionStart={() => setIsComposing(true)} // 한글 조합 시작
            onCompositionEnd={(e) => {                      // 한글 조합 종료
              setIsComposing(false);
              setQ(e.currentTarget.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                loadAbortRef.current?.abort?.();
                const controller = new AbortController();
                loadAbortRef.current = controller;
                fetchDocuments({ qParam: q, signal: controller.signal });
              }
            }}
          />
          <input
            type="date"
            className="px-3 py-2 border rounded bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700 text-gray-900 dark:text-neutral-100"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <span className="text-gray-500 dark:text-neutral-400">~</span>
          <input
            type="date"
            className="px-3 py-2 border rounded bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700 text-gray-900 dark:text-neutral-100"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
          <select
            className="px-3 py-2 border rounded bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700 text-gray-900 dark:text-neutral-100"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="latest">최신순</option>
            <option value="oldest">오래된순</option>
          </select>
          <button
            className="ml-auto px-3 py-2 border rounded hover:bg-gray-50 dark:hover:bg-neutral-800 bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700"
            onClick={() => {
              setQ("");
              setDateFrom("");
              setDateTo("");
              setSortOrder("latest");
            }}
          >
            초기화
          </button>
        </div>

        {isLoadingLookup ? (
          <div className="text-center py-8">문서 목록을 불러오는 중...</div>
        ) : lookupError ? (
          <div className="text-center text-red-500 py-8">
            문서 목록 로드 실패: {lookupError}
          </div>
        ) : docGroups.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-neutral-400 p-4">
            등록된 문서가 없습니다.
          </p>
        ) : (
          currentDocGroups.map((group) => (
            <div
              key={`group-${group.document_id}`}
              className="bg-white dark:bg-neutral-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-neutral-700 space-y-2"
            >
              <p className="font-bold text-gray-800 dark:text-neutral-100 text-lg">
                {group.latest_file_name}
                <span className="text-sm font-medium text-indigo-600 ml-1">
                  (총 {group.version_history?.length || 0}개 버전)
                </span>
              </p>

              {(group.version_history || []).map((doc) => (
                <button
                  type="button"
                  key={`ver-${group.document_id}-${doc.file_hash}-${doc.version}`}
                  className="w-full text-left ml-4 p-3 rounded-md bg-gray-50 dark:bg-neutral-700 hover:bg-indigo-50 dark:hover:bg-neutral-600 cursor-pointer border-l-4 border-gray-300 dark:border-neutral-600 hover:border-indigo-400"
                  onClick={() => openDetail(doc)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800 dark:text-neutral-100">
                      v{doc.version}: {doc.file_name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-neutral-300">
                      {formatDate(doc.created_at)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ))
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex justify-center items-center gap-2">
            <button
              onClick={() => paginate(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-200 font-medium hover:bg-gray-50 dark:hover:bg-neutral-700 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              이전
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (number) => (
                <button
                  key={`page-${number}`}
                  onClick={() => paginate(number)}
                  className={`w-10 h-10 border rounded-md font-medium transition-colors ${
                    currentPage === number
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-200 border-gray-300 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-700"
                  }`}
                >
                  {number}
                </button>
              )
            )}

            <button
              onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-200 font-medium hover:bg-gray-50 dark:hover:bg-neutral-700 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-100 dark:bg-neutral-900 font-sans min-h-screen p-4 flex justify-center text-gray-900 dark:text-neutral-100">
      <div className="w-full max-w-2xl bg-white dark:bg-neutral-800 dark:text-neutral-100 shadow-xl rounded-2xl p-6 border border-transparent dark:border-neutral-700">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-neutral-100">
              문서 진위 확인 시스템
            </h1>
            {isAdmin && (
              <span className="px-2 py-1 text-xs rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                관리자
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-2 rounded-lg border bg-white dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-700"
              onClick={toggle}
              title="다크 모드 토글"
            >
              {dark ? "라이트" : "다크"}
            </button>
            <button
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
              onClick={async () => {
                try {
                  await fetch(`${API_BASE}/logout`, {
                    method: "POST",
                    credentials: "include",
                  });
                } catch {
                  /* empty */
                }
                sessionStorage.clear();
                navigate("/login");
              }}
            >
              로그아웃
            </button>
          </div>
        </div>

        <p className="text-center text-gray-600 dark:text-neutral-300 mb-6">
          문서의 해시값을 데이터베이스에 등록하고, 진위 여부를 검증합니다.
        </p>

        {Tabs}
        {activeTab === "register" && RegisterSection}
        {activeTab === "verify" && VerifySection}
        {activeTab === "lookup" && <LookupSection />}
      </div>

      {/* 비밀번호 모달 */}
      {passwordModalOpen && (
        <Modal onClose={() => setPasswordModalOpen(false)}>
          <div className="flex items-start justify-between mb-1">
            <div className="text-sm font-semibold text-gray-900 dark:text-neutral-100">
              비밀번호 입력
            </div>
            <button
              className="ml-2 text-gray-400 hover:text-gray-600"
              onClick={() => setPasswordModalOpen(false)}
              aria-label="close"
            >
              ✕
            </button>
          </div>
          <input
            ref={passwordInputRef}
            type="password"
            className="mt-1 w-full border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring focus:border-indigo-400 bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700 text-gray-900 dark:text-neutral-100"
            placeholder="비밀번호"
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmDetailPassword();
            }}
            autoFocus
          />
          {passwordError && (
            <div className="mt-1 text-[12px] text-red-600">{passwordError}</div>
          )}
          <div className="mt-2 flex justify-end gap-2">
            <button
              className="px-2.5 py-1 text-sm rounded-md bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300 dark:hover:bg-neutral-600"
              onClick={() => setPasswordModalOpen(false)}
            >
              취소
            </button>
            <button
              className="px-2.5 py-1 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={confirmDetailPassword}
            >
              확인
            </button>
          </div>
        </Modal>
      )}

      {/* 상세 모달 */}
      <DocumentDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        detail={currentDetail}
        isAdmin={isAdmin}
        formatDate={formatDate}
        onPreview={(url, name) => {
          const dl = `${url}?download=${encodeURIComponent(name || "download")}`;
          window.open(dl, "_blank");
        }}
        onDelete={deleteDocument}
      />
    </div>
  );
}

function Modal({ children, onClose }) {
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const onBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onMouseDown={onBackdrop}
    >
      <div
        className="pointer-events-auto w-[min(90vw,480px)] max-w-md max-h-[90vh] overflow-auto
        rounded-2xl p-5 shadow-xl
         bg-white text-neutral-900 border border-neutral-200
          dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function ActionResult({ box, fileNameFallback }) {
  const ok = box.success !== false;
  return (
    <div
      className={`mt-6 p-4 rounded-lg shadow-sm border ${
        ok ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
      }`}
    >
      <div className="flex items-center mb-2">
        <span className="text-3xl">{ok ? "✅" : "❌"}</span>
        <p className="font-bold text-lg ml-2 text-gray-800 dark:text-neutral-100">
          {box.file_name || fileNameFallback || "파일"}:{" "}
          {box.message || (ok ? "성공" : "실패")}
        </p>
      </div>
      {box.submitted_hash && (
        <div className="space-y-2 text-sm text-gray-600 dark:text-neutral-300">
          <div className="bg-gray-100 dark:bg-neutral-700 p-2 rounded-md">
            <p>
              <strong>제출 해시:</strong>
            </p>
            <p className="break-all font-mono text-gray-700 dark:text-neutral-100">
              {box.submitted_hash}
            </p>
          </div>
        </div>
      )}
      {box.uploaded_hash && (
        <div className="space-y-2 text-sm text-gray-600 dark:text-neutral-300 mt-2">
          <div className="bg-gray-100 dark:bg-neutral-700 p-2 rounded-md">
            <p>
              <strong>업로드(검증) 해시:</strong>
            </p>
            <p className="break-all font-mono text-gray-700 dark:text-neutral-100">
              {box.uploaded_hash}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
