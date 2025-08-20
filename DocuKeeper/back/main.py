# /back/main.py
import hashlib
import mimetypes
import os
import uuid
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from jose import JWTError, jwt
from passlib.context import CryptContext
from supabase import create_client, Client

# -------------------------- RSA 서명/검증------------------------
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import serialization

load_dotenv()

# ----------------------------- 설정 -----------------------------
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

COOKIE_DOMAIN = os.getenv("COOKIE_DOMAIN", None)
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"

CORS_ORIGINS = [o.strip() for o in os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000",
).split(",") if o.strip()]

if not SECRET_KEY:
    raise ValueError("SECRET_KEY not set")

STORAGE_BUCKET = "documents"

# --------------------------- 보안 유틸 ---------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(p: str) -> str:
    return pwd_context.hash(p)

def verify_password(p: str, h: str) -> bool:
    return pwd_context.verify(p, h)

# --------------------------- RSA 키 ---------------------------
try:
    pem = os.getenv("ISSUING_AUTHORITY_PRIVATE_KEY")
    if pem and "-----BEGIN PRIVATE KEY-----" in pem:
        private_key = serialization.load_pem_private_key(
            pem.replace("\\n", "\n").encode(), password=None, backend=default_backend()
        )
        public_key = private_key.public_key()
    else:
        private_key = None
        public_key = None
except Exception:
    private_key = None
    public_key = None

# ---------------------------- 앱/미들웨어 ----------------------------
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def sha256_bytes(b: bytes) -> bytes:
    return hashlib.sha256(b).digest()

# --------------------------- JWT & 인증 ---------------------------

def create_access_token(data: dict, exp: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + (exp or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(request: Request) -> Dict[str, Any]:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth.split(" ", 1)[1]
    if not token:
        raise HTTPException(status_code=401, detail="유효하지 않은 인증")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        uid = payload.get("sub")
        email = payload.get("email")
        is_admin = bool(payload.get("is_admin"))
        if not uid or not email:
            raise HTTPException(status_code=401, detail="인증 정보 누락")
        return {"id": uid, "email": email, "is_admin": is_admin}
    except JWTError:
        raise HTTPException(status_code=401, detail="토큰 검증 실패")


def require_admin(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="관리자 전용 API")
    return current_user

# ----------------------------- 인증 API -----------------------------
@app.post("/login")
async def login(email: str = Form(...), password: str = Form(...)):
    res = supabase.table("users").select("id,email,hashed_password,is_admin").eq("email", email).limit(1).execute()

    if not res.data or not verify_password(password, res.data[0]["hashed_password"]):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")

    user = res.data[0]
    token = create_access_token({
        "sub": user["id"],
        "email": user["email"],
        "is_admin": bool(user.get("is_admin", False)),
    })

    resp = JSONResponse({"ok": True, "is_admin": bool(user.get("is_admin"))})
    domain_env = (COOKIE_DOMAIN or "").strip()
    cookie_kwargs = dict(httponly=True, samesite="Lax", secure=COOKIE_SECURE)
    if domain_env and domain_env not in ("localhost", "127.0.0.1"):
        cookie_kwargs["domain"] = domain_env
    resp.set_cookie("access_token", token, **cookie_kwargs)
    return resp

@app.post("/logout")
async def logout():
    resp = JSONResponse({"ok": True})
    domain_env = (COOKIE_DOMAIN or "").strip()
    if domain_env and domain_env not in ("localhost", "127.0.0.1"):
        resp.delete_cookie("access_token", domain=domain_env)
    else:
        resp.delete_cookie("access_token")
    return resp

@app.post("/signup")
async def signup(email: str = Form(...), password: str = Form(...)):
    exists = supabase.table("users").select("id").eq("email", email).execute()
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="비밀번호는 최소 6자 이상이어야 합니다.")
    if exists.data:
        raise HTTPException(status_code=400, detail="이미 등록된 이메일입니다.")

    uid = str(uuid.uuid4())
    supabase.table("users").insert({
        "id": uid,
        "email": email,
        "hashed_password": hash_password(password)
    }).execute()
    return {"message": "회원가입이 성공적으로 완료되었습니다.", "user_id": uid}

# --------------------------- 인증 확인 ---------------------------
@app.get("/auth/ping")
async def auth_ping(current_user: Dict[str, Any] = Depends(get_current_user)):
    return {
        "ok": True,
        "user": {
            "id": current_user["id"],
            "email": current_user["email"],
            "is_admin": bool(current_user.get("is_admin"))
        }
    }

# --------------------------- 문서 등록/검증 ---------------------------
@app.post("/register")
async def register_document(
    document_file: UploadFile = File(...),
    password: str = Form(...),
    upload_type: str = Form(...),  # 'new' | 'update'
    target_document_id: Optional[str] = Form(None),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    file_name = document_file.filename
    data = await document_file.read()
    h_bytes = sha256_bytes(data)
    h_hex = h_bytes.hex()

    if upload_type == "new":
        dup = supabase.table("documents").select("id").eq("file_hash", h_hex).eq("user_id", current_user["id"]).execute()
        if dup.data:
            raise HTTPException(status_code=409, detail="이미 등록된 파일입니다.")
        document_id = str(uuid.uuid4())
        new_version = 1
    elif upload_type == "update":
        if not target_document_id:
            raise HTTPException(status_code=400, detail="업데이트할 문서 ID 필요")
        latest = supabase.table("documents").select("version").eq("document_id", target_document_id).eq("user_id", current_user["id"]).order("version", desc=True).limit(1).execute()
        if not latest.data:
            raise HTTPException(status_code=404, detail="업데이트할 원본 문서를 찾을 수 없습니다.")
        document_id = target_document_id
        new_version = latest.data[0]["version"] + 1
    else:
        raise HTTPException(status_code=400, detail="잘못된 등록 방식입니다.")

    signature_hex = ""
    if private_key:
        try:
            sig = private_key.sign(
                h_bytes,
                padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH),
                hashes.SHA256(),
            )
            signature_hex = sig.hex()
        except Exception:
            signature_hex = ""

    mime, _ = mimetypes.guess_type(file_name)
    if not mime:
        mime = "application/octet-stream"
    ext = Path(file_name).suffix  # ".pdf", ".png" 등
    safe_name = f"{uuid.uuid4().hex}{ext}"
    storage_path = f"{current_user['id']}/{safe_name}"
    supabase.storage.from_(STORAGE_BUCKET).upload(storage_path, data, {"content-type": mime})
    public_url = supabase.storage.from_(STORAGE_BUCKET).get_public_url(storage_path)

    file_content_str = ""
    if mime.startswith("text"):
        try:
            file_content_str = data.decode("utf-8", errors="replace")[:8000]
        except Exception:
            pass

    supabase.table("documents").insert({
        "user_id": current_user["id"],
        "document_id": document_id,
        "version": new_version,
        "file_name": file_name,
        "file_hash": h_hex,
        "password_hash": hash_password(password),
        "signature": signature_hex,
        "storage_path": storage_path,
        "public_url": public_url,
        "file_content": file_content_str,
    }).execute()

    return {
        "success": True,
        "file_name": file_name,
        "message": f"성공적으로 등록되었습니다. (v{new_version})",
        "submitted_hash": h_hex,
    }

@app.post("/verify_with_original")
async def verify_with_original(
    original_file_hash: str = Form(...),
    document_file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    res = supabase.table("documents").select("file_hash,file_name,signature") \
        .eq("file_hash", original_file_hash) \
        .eq("user_id", current_user["id"]).execute()

    if not res.data:
        return JSONResponse({"success": False, "message": "원본 문서를 찾을 수 없습니다."}, status_code=404)

    original = res.data[0]
    uploaded_bytes = await document_file.read()
    uploaded_hash = hashlib.sha256(uploaded_bytes).hexdigest()
    is_valid = (uploaded_hash == original["file_hash"])

    msg = "일치합니다. 진본입니다." if is_valid else "원본과 다릅니다. 위조 또는 변경된 파일입니다."

    if is_valid and public_key and original.get("signature"):
        try:
            public_key.verify(
                bytes.fromhex(original["signature"]),
                bytes.fromhex(original["file_hash"]),
                padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH),
                hashes.SHA256(),
            )
            msg += " (서명 유효)"
        except Exception:
            msg += " (서명 유효하지 않음)"

    return {
        "success": True,
        "is_valid": is_valid,
        "message": msg,
        "original_hash": original["file_hash"],
        "uploaded_hash": uploaded_hash,
    }

# -------------------------- 조회/그룹화 유틸 --------------------------

def _group_rows(rows: List[Dict[str, Any]], sort: str, admin: bool) -> List[Dict[str, Any]]:
    reverse = (sort != "oldest")

    users_map: Dict[str, str] = {}
    if admin:
        uids = sorted({r["user_id"] for r in rows if r.get("user_id")})
        if uids:
            um = supabase.table("users").select("id,email").in_("id", uids).execute()
            users_map = {u["id"]: u["email"] for u in (um.data or [])}

    groups: Dict[str, List[Dict[str, Any]]] = {}
    for r in rows:
        groups.setdefault(r["document_id"], []).append(r)

    out = []
    for gid, hist in groups.items():
        hist_sorted = sorted(hist, key=lambda x: x.get("version", 1))
        v1_name = next((h["file_name"] for h in hist_sorted if h.get("version") == 1), hist_sorted[0]["file_name"])
        disp = sorted(hist, key=lambda x: x["created_at"], reverse=reverse)

        vh = []
        for d in disp:
            item = {
                "file_name": d["file_name"],
                "file_hash": d["file_hash"],
                "version": d["version"],
                "created_at": d["created_at"],
                "public_url": d.get("public_url"),
                "signature": d.get("signature"),
                "user_id": d.get("user_id"),
            }
            if admin:
                item["user_email"] = users_map.get(d.get("user_id", ""), "")
            vh.append(item)

        sort_key = max if reverse else min
        group_dt = sort_key([d["created_at"] for d in hist])

        out.append({
            "document_id": gid,
            "latest_file_name": v1_name,
            "version_history": vh,
            "group_sort_key": group_dt,
        })

    out.sort(key=lambda g: g["group_sort_key"], reverse=reverse)
    for g in out:
        g.pop("group_sort_key", None)
    return out

# --------------------------- 목록/상세/삭제 ---------------------------
@app.get("/documents")
async def get_documents(
    request: Request,
    sort: str = "latest",
    q: Optional[str] = None,
    _from: Optional[str] = None,
    to: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    if not _from:
        _from = request.query_params.get("from")

    is_admin = bool(current_user.get("is_admin"))

    sel = "document_id,file_name,file_hash,version,created_at,public_url,signature,user_id"
    query = supabase.table("documents").select(sel)
    if not is_admin:
        query = query.eq("user_id", current_user["id"])

    if _from:
        query = query.gte("created_at", _from)
    if to:
        query = query.lte("created_at", to)

    query = query.order("created_at", desc=True)
    rows = query.execute().data or []

    if q:
        q_lower = q.lower()
        if is_admin:
            uids = sorted({r["user_id"] for r in rows})
            um = supabase.table("users").select("id,email").in_("id", uids).execute()
            email_map = {u["id"]: u["email"].lower() for u in (um.data or [])}
            rows = [
                r for r in rows
                if q_lower in r["file_name"].lower() or q_lower in email_map.get(r.get("user_id", ""), "")
            ]
        else:
            rows = [r for r in rows if q_lower in r["file_name"].lower()]

    return {"success": True, "documents": _group_rows(rows, sort, is_admin)}

@app.get("/documents_for_update")
async def documents_for_update(
    sort: str = "latest",
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    is_admin = bool(current_user.get("is_admin"))
    sel = "document_id,file_name,version,user_id,created_at"
    query = supabase.table("documents").select(sel)
    if not is_admin:
        query = query.eq("user_id", current_user["id"])

    query = query.order("version", desc=True)
    rows = query.execute().data or []

    latest_by_gid: Dict[str, Dict[str, Any]] = {}
    for r in rows:
        if r["document_id"] not in latest_by_gid:
            latest_by_gid[r["document_id"]] = r

    reverse = (sort != "oldest")
    items = sorted(latest_by_gid.values(), key=lambda x: x["created_at"], reverse=reverse)
    return {"success": True, "documents": items}

@app.post("/document_detail")
async def document_detail(
    file_hash: str = Form(...),
    password: str = Form(...),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    res = supabase.table("documents").select(
        "file_name,file_hash,signature,created_at,file_content,password_hash,public_url,user_id"
    ).eq("file_hash", file_hash).execute()

    if not res.data:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다.")

    doc = res.data[0]
    if doc.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="권한이 없습니다.")

    if not verify_password(password, doc["password_hash"]):
        return JSONResponse({"success": False, "detail": "비밀번호가 일치하지 않습니다."}, status_code=403)

    doc.pop("password_hash", None)
    doc.pop("user_id", None)
    return {"success": True, "document": doc}

@app.post("/document_detail_admin")
async def document_detail_admin(
    file_hash: str = Form(...),
    admin_user: Dict[str, Any] = Depends(require_admin),
):
    res = supabase.table("documents").select(
        "file_name,file_hash,signature,created_at,file_content,public_url,user_id"
    ).eq("file_hash", file_hash).execute()

    if not res.data:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다.")

    doc = res.data[0]
    u = supabase.table("users").select("email").eq("id", doc["user_id"]).limit(1).execute()
    doc["user_email"] = (u.data[0]["email"] if u.data else "")
    doc.pop("user_id", None)
    return {"success": True, "document": doc}

@app.delete("/document_delete")
async def document_delete(
    file_hash: str = Form(...),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    res = supabase.table("documents").select(
        "storage_path,document_id,version,user_id"
    ).eq("file_hash", file_hash).execute()

    if not res.data:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없거나 삭제 권한이 없습니다.")
    doc = res.data[0]

    # ---------------------권한: 소유자 또는 관리자----------------------------------------
    if (doc.get("user_id") != current_user["id"]) and (not current_user.get("is_admin")):
        raise HTTPException(status_code=403, detail="삭제 권한이 없습니다.")

    #---------------------- v1 삭제 (루트 문서)시 → 그룹 전체 삭제-------------------------
    if doc.get("version") == 1 and doc.get("document_id"):
        all_in_group = supabase.table("documents").select("storage_path") \
            .eq("document_id", doc["document_id"]).execute().data or []
        paths = [d["storage_path"] for d in all_in_group if d.get("storage_path")]
        if paths:
            supabase.storage.from_(STORAGE_BUCKET).remove(paths)
        supabase.table("documents").delete().eq("document_id", doc["document_id"]).execute()
    else:
        if doc.get("storage_path"):
            supabase.storage.from_(STORAGE_BUCKET).remove([doc["storage_path"]])
        supabase.table("documents").delete().eq("file_hash", file_hash).execute()

    return {"success": True, "message": "문서가 성공적으로 삭제되었습니다."}
