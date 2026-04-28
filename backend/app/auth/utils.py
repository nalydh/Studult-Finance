from datetime import datetime, timedelta
from jose import jwt, JWTError
import bcrypt
import hashlib
import base64
import os

SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 2


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


def create_access_token(user_id: int, email: str) -> str:
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


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
