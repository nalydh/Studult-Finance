from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
import hashlib
import base64
import os

SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _prepare(password: str) -> str:
    """
    SHA-256 pre-hash → base64, always 44 bytes.
    Bypasses bcrypt's 72-byte truncation limit safely.
    """
    digest = hashlib.sha256(password.encode("utf-8")).digest()
    return base64.b64encode(digest).decode("utf-8")


def hash_password(password: str) -> str:
    return pwd_context.hash(_prepare(password))


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(_prepare(plain), hashed)


def create_access_token(user_id: int, email: str) -> str:
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
