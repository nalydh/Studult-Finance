from datetime import datetime, timedelta
from jose import jwt, JWTError
import bcrypt
import hashlib
import base64
import os
import requests

SECRET_KEY = os.getenv("JWT_SECRET")
if not SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET environment variable is not set. "
        "Refusing to start with an unsigned/empty JWT secret."
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 2

# A signed-in user can keep refreshing their access token for this long
# before being forced to re-authenticate (see /auth/refresh).
MAX_SESSION_AGE_DAYS = 30


def _prepare(password: str) -> bytes:
    """
    SHA-256 pre-hash → base64, always 44 bytes.
    Bypasses bcrypt's 72-byte truncation limit safely.
    """
    digest = hashlib.sha256(password.encode("utf-8")).digest()
    return base64.b64encode(digest)


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(_prepare(password), salt)
    return hashed.decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(_prepare(plain), hashed.encode("utf-8"))
    except ValueError:
        return False


def hash_token(token: str) -> str:
    """
    SHA-256 digest for storing email verification / password reset tokens.
    The raw token only ever exists in the emailed link; a DB leak exposes
    nothing usable. Tokens are 256-bit random values, so no salt is needed
    and deterministic hashing keeps exact-match lookups working.
    """
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_access_token(user_id: int, email: str, auth_time: int | None = None) -> str:
    """
    Issue a short-lived access token.

    `auth_time` is the unix timestamp of the original interactive sign-in.
    It is preserved across refreshes so /auth/refresh can cap the total
    session lifetime at MAX_SESSION_AGE_DAYS.
    """
    now = datetime.utcnow()
    payload = {
        "sub": str(user_id),
        "email": email,
        "auth_time": auth_time if auth_time is not None else int(now.timestamp()),
        "exp": now + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


# ── Google ID token verification ─────────────────────────────────
# /auth/google must never trust client-supplied identity fields; the
# only acceptable proof is a Google-signed ID token whose signature,
# audience, issuer and expiry all check out.

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
_GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs"
_GOOGLE_ISSUERS = ("https://accounts.google.com", "accounts.google.com")
_google_jwks_cache: dict | None = None


def _google_jwks(force_refresh: bool = False) -> dict:
    global _google_jwks_cache
    if _google_jwks_cache is None or force_refresh:
        resp = requests.get(_GOOGLE_JWKS_URL, timeout=10)
        resp.raise_for_status()
        _google_jwks_cache = resp.json()
    return _google_jwks_cache


def verify_google_id_token(id_token: str) -> dict:
    """
    Verify a Google-issued ID token and return its claims.
    Raises JWTError if the token is invalid, RuntimeError if the
    backend is missing its GOOGLE_CLIENT_ID configuration.
    """
    if not GOOGLE_CLIENT_ID:
        raise RuntimeError("GOOGLE_CLIENT_ID environment variable is not set")

    header = jwt.get_unverified_header(id_token)
    keys = _google_jwks()
    # Google rotates its signing keys; refetch once on an unknown kid.
    if not any(k.get("kid") == header.get("kid") for k in keys.get("keys", [])):
        keys = _google_jwks(force_refresh=True)

    claims = jwt.decode(id_token, keys, algorithms=["RS256"], audience=GOOGLE_CLIENT_ID)
    if claims.get("iss") not in _GOOGLE_ISSUERS:
        raise JWTError("Invalid token issuer")
    return claims


from itsdangerous import URLSafeSerializer, BadSignature

def generate_unsubscribe_token(user_id: int) -> str:
    s = URLSafeSerializer(SECRET_KEY, salt="unsubscribe-salt")
    return s.dumps(user_id)


def verify_unsubscribe_token(token: str) -> int | None:
    s = URLSafeSerializer(SECRET_KEY, salt="unsubscribe-salt")
    try:
        user_id = s.loads(token)
        return int(user_id)
    except (BadSignature, ValueError):
        return None
