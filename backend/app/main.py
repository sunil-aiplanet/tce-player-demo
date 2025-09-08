import requests
import logging

from fastapi import FastAPI, HTTPException, Form, Request, Query, Header
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="TCE Player Demo",
    version="1.0.0",
    docs_url="/docs" if not settings.is_production else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {
        "message": "Hi, Welcome To FastAPI Server!",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "environment": settings.ENVIRONMENT}


@app.get("/api/clientid")
def get_client_id(request: Request):
    try:
        origin = request.headers.get("origin")
        logger.info(f"Client ID request from: {origin}")

        resp = requests.get(
            f"{settings.AUTH_BASE_URL}/auth-api/30/api/v1/sso/clientid", timeout=30
        )

        if not resp.ok:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)

        cookie_config = settings.cookie_config
        logger.info(f"Cookie Config: {cookie_config}")

        cookies_dict = {
            cookie.name: {"value": cookie.value, **cookie_config}
            for cookie in resp.cookies
        }

        data = {"cookies": cookies_dict, "clientId": resp.json()}

        logging.info(f"clientId Response : {data}")

        return JSONResponse(content=data)

    except requests.RequestException as e:
        logger.error(f"Error fetching client ID: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {e}")


@app.post("/api/token")
def get_token(
    request: Request,
    school_name: str = Form(...),
    role: str = Form(...),
    grant_type: str = Form(...),
    user_name: str = Form(...),
):
    try:
        cookies = request.cookies
        logger.info(f"Token request with cookies: {list(cookies.keys())}")

        payload = {
            "schoolName": school_name,
            "role": role,
            "grant_type": grant_type,
            "username": user_name,
        }

        resp = requests.post(
            f"{settings.AUTH_BASE_URL}/auth-api/30/api/v1/sso/token",
            data=payload,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            cookies=cookies,
            timeout=30,
        )

        if not resp.ok:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)

        logging.info(f"token response : {resp.json()}")

        return resp.json()

    except requests.RequestException as e:
        logger.error(f"Error fetching token: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {e}")


@app.get("/api/assets")
def get_assets(
    ids: str = Query(..., description="Comma-separated asset IDs"),
    authorization: str = Header(None),
):
    try:
        headers = {}

        if authorization:
            headers["Authorization"] = authorization

        resp = requests.get(
            f"{settings.AUTH_BASE_URL}/tce-teach-api/1/api/v1/serve/asset",
            params={"ids": ids},
            headers=headers,
            timeout=30,
        )

        if not resp.ok:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)

        logger.info(f"asset response: {resp.json()}")

        return resp.json()

    except requests.RequestException as e:
        logger.error(f"Error fetching assets: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {e}")


if not settings.is_production:

    @app.get("/api/debug/config")
    def debug_config():
        return {
            "environment": settings.ENVIRONMENT,
            "cors_origins": settings.cors_origins,
            "cookie_config": settings.cookie_config,
        }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.BACKEND_HOST,
        port=settings.BACKEND_PORT,
        reload=not settings.is_production,
    )
