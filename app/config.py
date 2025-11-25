"""
Configuration Management using Pydantic Settings
All environment variables and secrets are loaded here.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import PostgresDsn, RedisDsn, SecretStr
from typing import Literal, Optional

class Settings(BaseSettings):
    """
    STRICT CONFIGURATION RULE:
    Do not hardcode strings in your code.
    If you need a configuration value, add it here.
    Values are read from environment variables or .env file.
    """
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Critical Infrastructure
    DATABASE_URL: PostgresDsn
    REDIS_URL: RedisDsn
    
    # AI Providers
    LLM_PROVIDER: Literal["openai", "anthropic", "gemini"] = "openai"
    OPENAI_API_KEY: Optional[SecretStr] = None
    ANTHROPIC_API_KEY: Optional[SecretStr] = None
    GEMINI_API_KEY: Optional[SecretStr] = None
    CHAT_MODEL: str = "gpt-4o-mini"
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIM: int = 1536
    
    # API protection
    RATE_LIMIT_REQUESTS_PER_MIN: int = 60
    
    # App Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Memori Service"
    DEBUG: bool = False

settings = Settings()
