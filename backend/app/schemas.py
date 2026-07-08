from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import datetime

# --- AUTH SCHEMAS ---
class LoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    full_name: str
    role: str

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# --- PRODUCT SCHEMAS ---
class ProductSchema(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    indication: Optional[str] = None

    class Config:
        from_attributes = True


# --- HCP (DOCTOR) SCHEMAS ---
class HCPCreate(BaseModel):
    name: str = Field(..., min_length=1)
    hospital: str = Field(..., min_length=1)
    specialization: str = Field(..., min_length=1)
    location: str = Field(..., min_length=1)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    status: Optional[str] = "Active"

class HCPResponse(BaseModel):
    id: int
    name: str
    hospital: str
    specialization: str
    location: str
    email: Optional[str] = None
    phone: Optional[str] = None
    status: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# --- INTERACTION SCHEMAS ---
class InteractionCreate(BaseModel):
    hcp_id: int
    meeting_date: datetime.date
    meeting_type: str = Field(..., description="Meeting type e.g., Face-to-Face, Virtual, Phone")
    products_discussed: List[str] = []  # list of product names
    summary: Optional[str] = ""
    doctor_feedback: Optional[str] = ""
    sentiment: Optional[str] = "Neutral"  # Positive, Neutral, Negative
    priority: Optional[str] = "Medium"  # High, Medium, Low
    interaction_score: Optional[int] = 50
    next_action: Optional[str] = None
    follow_up_date: Optional[datetime.date] = None

class InteractionUpdate(BaseModel):
    meeting_date: Optional[datetime.date] = None
    meeting_type: Optional[str] = None
    products_discussed: Optional[List[str]] = None
    summary: Optional[str] = None
    doctor_feedback: Optional[str] = None
    sentiment: Optional[str] = None
    priority: Optional[str] = None
    interaction_score: Optional[int] = None
    next_action: Optional[str] = None
    follow_up_date: Optional[datetime.date] = None

class InteractionResponse(BaseModel):
    id: int
    hcp_id: int
    user_id: int
    meeting_date: datetime.date
    meeting_type: str
    summary: Optional[str] = None
    doctor_feedback: Optional[str] = None
    sentiment: str
    priority: str
    interaction_score: int
    next_action: Optional[str] = None
    follow_up_date: Optional[datetime.date] = None
    created_at: datetime.datetime
    hcp: HCPResponse
    products: List[ProductSchema] = []

    class Config:
        from_attributes = True


# --- FOLLOW UP SCHEMAS ---
class FollowUpCreate(BaseModel):
    interaction_id: Optional[int] = None
    hcp_id: int
    follow_up_date: datetime.date
    description: str
    status: Optional[str] = "Pending"

class FollowUpUpdate(BaseModel):
    follow_up_date: Optional[datetime.date] = None
    description: Optional[str] = None
    status: Optional[str] = None

class FollowUpResponse(BaseModel):
    id: int
    interaction_id: Optional[int] = None
    hcp_id: int
    user_id: int
    follow_up_date: datetime.date
    description: str
    status: str
    created_at: datetime.datetime
    hcp: HCPResponse

    class Config:
        from_attributes = True


# --- AI CHAT SCHEMAS ---
class ChatRequest(BaseModel):
    message: str

class ExtractedEntities(BaseModel):
    doctor_name: Optional[str] = None
    hospital: Optional[str] = None
    specialization: Optional[str] = None
    meeting_date: Optional[str] = None
    meeting_type: Optional[str] = None
    products_discussed: List[str] = []
    summary: Optional[str] = None
    doctor_feedback: Optional[str] = None
    sentiment: Optional[str] = "Neutral"
    priority: Optional[str] = "Medium"
    follow_up_date: Optional[str] = None
    next_action: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    intent: Optional[str] = None
    extracted_entities: Optional[ExtractedEntities] = None
    success: bool
    validation_errors: List[str] = []
    interaction_id: Optional[int] = None

# --- HISTORY SCHEMAS ---
class ChatHistoryResponse(BaseModel):
    id: int
    message: str
    sender: str
    timestamp: datetime.datetime

    class Config:
        from_attributes = True

# --- DASHBOARD & ANALYTICS SCHEMAS ---
class SentimentCount(BaseModel):
    sentiment: str
    count: int

class DashboardStats(BaseModel):
    total_interactions: int
    total_hcps: int
    pending_followups: int
    average_score: float
    sentiment_distribution: List[SentimentCount]
    recent_logs: List[str]
