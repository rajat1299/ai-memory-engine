"""
Configuration Management using Pydantic Settings
All environment variables and secrets are loaded here.
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Database
    DATABASE_URL: str
    
    # Redis
    REDIS_URL: str
    
    # OpenAI
    OPENAI_API_KEY: str
    
    # Application
    APP_NAME: str = "Memori API"
    DEBUG: bool = False
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
