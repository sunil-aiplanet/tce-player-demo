from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ENVIRONMENT: str

    FRONTEND_URL: str
    BACKEND_HOST: str
    BACKEND_PORT: str

    AUTH_BASE_URL: str
    USE_HTTPS: bool

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def cors_origins(self) -> List[str]:
        return [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]

    @property
    def cookie_config(self) -> dict:
        """Cookie configuration"""
        base_config = {
            "httponly": True,
            "max_age": 3600,
        }

        if self.is_production:
            base_config.update(
                {
                    "secure": self.USE_HTTPS,
                    "samesite": "lax",
                }
            )
        else:
            base_config.update(
                {
                    "secure": False,
                    "samesite": "lax",
                }
            )

        return base_config

    class Config:
        env_file = ".env"


settings = Settings()
