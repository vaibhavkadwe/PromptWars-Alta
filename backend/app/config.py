"""Configuration management for SafeSignal backend."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Gemini API settings
    GEMINI_API_KEY: str | None = None
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GEMINI_PAID_TIER: bool = False
    GEMINI_TIMEOUT_SECONDS: int = 30

    # Content length limits
    MAX_DESCRIPTION_CHARS: int = 4000
    MAX_EVIDENCE_CHARS: int = 20000

    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 6
    DAILY_ANALYSIS_CAP: int = 300

    # Network & environment
    TRUST_PROXY: bool = False
    APP_ENV: str = "development"

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.lower() == "production"

    @property
    def is_ai_configured(self) -> bool:
        return bool(self.GEMINI_API_KEY and self.GEMINI_API_KEY.strip())


@lru_cache
def get_settings() -> Settings:
    return Settings()
