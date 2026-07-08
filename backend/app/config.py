import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-First CRM HCP Module"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkeyforhcpmoduledevelopment")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    
    # DB Settings (PostgreSQL default)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgres@localhost:5432/hcp_crm"
    )
    
    # AI Settings
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    PRIMARY_MODEL: str = "gemma2-9b-it"
    CONTEXT_MODEL: str = "llama-3.3-70b-versatile"
    
    # Is LLM Mocked when key is missing?
    FALLBACK_TO_MOCK: bool = True

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
