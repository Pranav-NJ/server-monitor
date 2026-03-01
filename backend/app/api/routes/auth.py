"""
Auth routes – login and user registration.
"""

from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.schemas import LoginRequest, TokenResponse, RegisterUserRequest
from app.core.database import execute_query, execute_insert
from app.core.security import verify_password, hash_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    rows = await execute_query(
        "SELECT user_id, password_hash, is_active FROM Users WHERE username = %s",
        (body.username,),
    )
    if not rows:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    user = rows[0]
    if not user["is_active"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")

    if not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(data={"sub": user["user_id"]})
    return TokenResponse(access_token=token)


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(body: RegisterUserRequest, current_user: dict = Depends(get_current_user)):
    # Only admins (role_id=1) may create users
    if current_user["role_id"] != 1:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    hashed = hash_password(body.password)
    try:
        user_id = await execute_insert(
            "INSERT INTO Users (username, email, password_hash, phone, role_id) "
            "VALUES (%s, %s, %s, %s, %s)",
            (body.username, body.email, hashed, body.phone, body.role_id),
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username or email exists")

    return {"user_id": user_id, "username": body.username}


@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    return current_user
