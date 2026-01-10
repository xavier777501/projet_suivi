from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from fastapi import HTTPException, status
import secrets
import hashlib

# Configuration JWT
SECRET_KEY = secrets.token_urlsafe(32)  # Générer une clé secrète en production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Crée un token JWT d'accès
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Dict[str, Any]:
    """
    Vérifie et décode un token JWT
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_password_hash(password: str) -> str:
    """
    Hache un mot de passe avec SHA-256 (cohérent avec l'algorithme original)
    """
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Vérifie si un mot de passe correspond au hash
    """
    # Essayer SHA-256 (notre algorithme principal)
    current_hash = hashlib.sha256(plain_password.encode()).hexdigest()
    if current_hash == hashed_password:
        return True

    # Compatibilité MD5
    if hashlib.md5(plain_password.encode()).hexdigest() == hashed_password:
        return True

    # Correspondance exacte (non recommandé mais présent pour compatibilité initiale)
    if plain_password == hashed_password:
        return True

    return False
