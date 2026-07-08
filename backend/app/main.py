from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
import datetime

from app.config import settings
from app.database import get_db, seed_data
from app.auth import get_current_user, verify_password, create_access_token
from app.models import User, HCP, Product, Interaction, FollowUp, ChatHistory, ActivityLog, interaction_products
from app.schemas import (
    LoginRequest, TokenResponse, UserResponse,
    HCPResponse, HCPCreate, InteractionResponse, InteractionCreate, InteractionUpdate,
    FollowUpResponse, FollowUpCreate, ChatRequest, ChatResponse,
    ChatHistoryResponse, DashboardStats, SentimentCount
)
from app.graph.workflow import app_graph
from app.graph.tools import calculate_interaction_score

app = FastAPI(title=settings.PROJECT_NAME, version="1.0.0")

# Enable CORS for frontend API calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    # Automatically migrate and seed database on startup
    seed_data()

# --- AUTH ENDPOINTS ---

@app.post("/api/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    access_token = create_access_token(data={"sub": user.username})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@app.get("/api/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# --- HCP ENDPOINTS ---

@app.get("/api/hcps", response_model=List[HCPResponse])
def get_hcps(
    name: Optional[str] = None,
    specialization: Optional[str] = None,
    hospital: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(HCP)
    if name:
        query = query.filter(HCP.name.ilike(f"%{name}%"))
    if specialization:
        query = query.filter(HCP.specialization.ilike(f"%{specialization}%"))
    if hospital:
        query = query.filter(HCP.hospital.ilike(f"%{hospital}%"))
    if status:
        query = query.filter(HCP.status == status)
        
    return query.order_by(HCP.name).all()

@app.get("/api/hcp/{id}", response_model=HCPResponse)
def get_hcp(id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    hcp = db.query(HCP).filter(HCP.id == id).first()
    if not hcp:
        raise HTTPException(status_code=404, detail="HCP profile not found.")
    return hcp

@app.post("/api/hcp", response_model=HCPResponse)
def create_hcp(payload: HCPCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(HCP).filter(HCP.name.ilike(payload.name)).first()
    if existing:
        raise HTTPException(status_code=400, detail="HCP with this name already exists.")
    
    hcp = HCP(
        name=payload.name,
        hospital=payload.hospital,
        specialization=payload.specialization,
        location=payload.location,
        email=payload.email,
        phone=payload.phone,
        status="Active"
    )
    db.add(hcp)
    db.commit()
    db.refresh(hcp)
    
    # Audit log
    db.add(ActivityLog(user_id=current_user.id, action=f"Added new HCP profile for {hcp.name}"))
    db.commit()
    return hcp


# --- INTERACTION ENDPOINTS ---

@app.get("/api/interactions", response_model=List[InteractionResponse])
def get_interactions(
    hcp_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Interaction)
    if hcp_id:
        query = query.filter(Interaction.hcp_id == hcp_id)
    return query.order_by(desc(Interaction.meeting_date)).all()

@app.post("/api/interaction", response_model=InteractionResponse)
def create_interaction(
    payload: InteractionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Duplicate Interaction Detection:
    # Check if this representative has already logged a meeting with this doctor on the same day.
    existing = db.query(Interaction).filter(
        Interaction.hcp_id == payload.hcp_id,
        Interaction.meeting_date == payload.meeting_date,
        Interaction.user_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Duplicate detected: You already logged an interaction with this doctor on {payload.meeting_date}."
        )

    # 2. Verify HCP exists
    hcp = db.query(HCP).filter(HCP.id == payload.hcp_id).first()
    if not hcp:
        raise HTTPException(status_code=404, detail="Selected Healthcare Professional not found.")

    # Calculate score & sentiment dynamically if not supplied explicitly
    sentiment = payload.sentiment or "Neutral"
    score = calculate_interaction_score(sentiment, payload.doctor_feedback)

    # 3. Create Interaction
    interaction = Interaction(
        hcp_id=payload.hcp_id,
        user_id=current_user.id,
        meeting_date=payload.meeting_date,
        meeting_type=payload.meeting_type,
        summary=payload.summary,
        doctor_feedback=payload.doctor_feedback,
        sentiment=sentiment,
        priority=payload.priority or "Medium",
        interaction_score=score,
        next_action=payload.next_action,
        follow_up_date=payload.follow_up_date
    )
    db.add(interaction)
    db.commit()
    db.refresh(interaction)

    # 4. Attach Products
    for p_name in payload.products_discussed:
        product = db.query(Product).filter(Product.name.ilike(p_name)).first()
        if not product:
            # Dynamically create if not found
            product = Product(name=p_name, description=f"Autogenerated product indication for {p_name}", indication="General")
            db.add(product)
            db.commit()
            db.refresh(product)
        interaction.products.append(product)

    # 5. Create Followup Task
    if payload.follow_up_date:
        followup = FollowUp(
            interaction_id=interaction.id,
            hcp_id=payload.hcp_id,
            user_id=current_user.id,
            follow_up_date=payload.follow_up_date,
            description=payload.next_action or f"Follow up with {hcp.name}",
            status="Pending"
        )
        db.add(followup)

    # Log Activity
    db.add(ActivityLog(user_id=current_user.id, action=f"Logged interaction with {hcp.name} on {payload.meeting_date}"))
    db.commit()
    db.refresh(interaction)
    
    return interaction

@app.put("/api/interaction/{id}", response_model=InteractionResponse)
def update_interaction(
    id: int,
    payload: InteractionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    interaction = db.query(Interaction).filter(
        Interaction.id == id,
        Interaction.user_id == current_user.id
    ).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction log not found or access denied.")

    # Update basic fields
    if payload.meeting_date is not None:
        interaction.meeting_date = payload.meeting_date
    if payload.meeting_type is not None:
        interaction.meeting_type = payload.meeting_type
    if payload.summary is not None:
        interaction.summary = payload.summary
    if payload.doctor_feedback is not None:
        interaction.doctor_feedback = payload.doctor_feedback
    if payload.sentiment is not None:
        interaction.sentiment = payload.sentiment
    if payload.priority is not None:
        interaction.priority = payload.priority
    if payload.next_action is not None:
        interaction.next_action = payload.next_action
    
    # Recalculate score
    interaction.interaction_score = calculate_interaction_score(interaction.sentiment, interaction.doctor_feedback)

    # Manage products discussed if provided
    if payload.products_discussed is not None:
        interaction.products = [] # Clear existing associations
        for p_name in payload.products_discussed:
            product = db.query(Product).filter(Product.name.ilike(p_name)).first()
            if not product:
                product = Product(name=p_name, description=f"Autogenerated product indication for {p_name}", indication="General")
                db.add(product)
                db.commit()
                db.refresh(product)
            interaction.products.append(product)

    # Manage followups
    if payload.follow_up_date is not None:
        interaction.follow_up_date = payload.follow_up_date
        followup = db.query(FollowUp).filter(FollowUp.interaction_id == interaction.id).first()
        if followup:
            followup.follow_up_date = payload.follow_up_date
            if payload.next_action:
                followup.description = payload.next_action
        else:
            followup = FollowUp(
                interaction_id=interaction.id,
                hcp_id=interaction.hcp_id,
                user_id=current_user.id,
                follow_up_date=payload.follow_up_date,
                description=payload.next_action or f"Follow up with {interaction.hcp.name}",
                status="Pending"
            )
            db.add(followup)

    db.add(ActivityLog(user_id=current_user.id, action=f"Updated interaction with {interaction.hcp.name} (ID: {id})"))
    db.commit()
    db.refresh(interaction)
    return interaction

@app.delete("/api/interaction/{id}")
def delete_interaction(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    interaction = db.query(Interaction).filter(
        Interaction.id == id,
        Interaction.user_id == current_user.id
    ).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction log not found or access denied.")

    hcp_name = interaction.hcp.name
    db.delete(interaction)
    
    # Audit log
    db.add(ActivityLog(user_id=current_user.id, action=f"Deleted interaction with {hcp_name} (ID: {id})"))
    db.commit()
    return {"message": "Interaction successfully deleted."}


# --- FOLLOW UP ENDPOINTS ---

@app.get("/api/followups", response_model=List[FollowUpResponse])
def get_followups(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(FollowUp).filter(FollowUp.user_id == current_user.id)
    if status:
        query = query.filter(FollowUp.status == status)
    return query.order_by(FollowUp.follow_up_date).all()

@app.post("/api/followup", response_model=FollowUpResponse)
def create_followup(
    payload: FollowUpCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    followup = FollowUp(
        interaction_id=payload.interaction_id,
        hcp_id=payload.hcp_id,
        user_id=current_user.id,
        follow_up_date=payload.follow_up_date,
        description=payload.description,
        status="Pending"
    )
    db.add(followup)
    db.commit()
    db.refresh(followup)
    
    # Audit log
    db.add(ActivityLog(user_id=current_user.id, action=f"Scheduled standalone follow-up with Doctor (ID: {payload.hcp_id})"))
    db.commit()
    db.refresh(followup)
    return followup

@app.put("/api/followup/{id}/status")
def update_followup_status(
    id: int,
    status: str = Query(..., description="Completed or Pending"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    followup = db.query(FollowUp).filter(FollowUp.id == id, FollowUp.user_id == current_user.id).first()
    if not followup:
        raise HTTPException(status_code=404, detail="Follow-up reminder not found.")
    
    followup.status = status
    db.add(ActivityLog(user_id=current_user.id, action=f"Marked follow-up with {followup.hcp.name} as {status}"))
    db.commit()
    return {"message": f"Follow-up status successfully updated to {status}."}


# --- AI CHAT / LANGGRAPH ROUTE ---

@app.post("/api/chat", response_model=ChatResponse)
def run_chat_agent(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    message_text = payload.message.strip()
    if not message_text:
        raise HTTPException(status_code=400, detail="Empty text message.")

    # 1. Save representative's chat message to DB
    user_chat = ChatHistory(user_id=current_user.id, message=message_text, sender="user")
    db.add(user_chat)
    db.commit()

    # 2. Invoke the compiled LangGraph workflow with input state
    initial_state = {
        "input_text": message_text,
        "user_id": current_user.id,
        "intent": "unknown",
        "extracted_entities": {},
        "validation_errors": [],
        "selected_tool": "none",
        "tool_output": None,
        "response": ""
    }

    try:
        final_state = app_graph.invoke(initial_state)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"LangGraph execution exception: {str(e)}"
        )

    # 3. Save AI's response to DB
    ai_reply = final_state.get("response", "I encountered an error parsing that request.")
    ai_chat = ChatHistory(user_id=current_user.id, message=ai_reply, sender="ai")
    db.add(ai_chat)
    db.commit()

    # Determine execution success
    tool_output = final_state.get("tool_output")
    success = False
    interaction_id = None
    if tool_output and isinstance(tool_output, dict):
        success = tool_output.get("success", False)
        interaction_id = tool_output.get("interaction_id")

    return {
        "reply": ai_reply,
        "intent": final_state.get("intent"),
        "extracted_entities": final_state.get("extracted_entities"),
        "success": success,
        "validation_errors": final_state.get("validation_errors", []),
        "interaction_id": interaction_id
    }

@app.get("/api/chat/history", response_model=List[ChatHistoryResponse])
def get_chat_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(ChatHistory).filter(
        ChatHistory.user_id == current_user.id
    ).order_by(ChatHistory.timestamp).all()


# --- DASHBOARD & ANALYTICS ROUTE ---

@app.get("/api/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    total_interactions = db.query(Interaction).count()
    total_hcps = db.query(HCP).filter(HCP.status == "Active").count()
    pending_followups = db.query(FollowUp).filter(FollowUp.status == "Pending").count()
    
    # Calculate average interaction score
    avg_score_res = db.query(func.avg(Interaction.interaction_score)).scalar()
    average_score = round(float(avg_score_res), 1) if avg_score_res is not None else 0.0
    
    # Sentiment distribution breakdown
    sent_query = db.query(Interaction.sentiment, func.count(Interaction.id)).group_by(Interaction.sentiment).all()
    sentiment_distribution = []
    
    found_sentiments = {item[0]: item[1] for item in sent_query}
    for s in ["Positive", "Neutral", "Negative"]:
        sentiment_distribution.append(
            SentimentCount(sentiment=s, count=found_sentiments.get(s, 0))
        )
        
    # Retrieve last 6 activity logs
    logs = db.query(ActivityLog).order_by(desc(ActivityLog.timestamp)).limit(6).all()
    recent_logs = [l.action for l in logs]
    
    return {
        "total_interactions": total_interactions,
        "total_hcps": total_hcps,
        "pending_followups": pending_followups,
        "average_score": average_score,
        "sentiment_distribution": sentiment_distribution,
        "recent_logs": recent_logs
    }


# --- SYSTEM STATUS ENDPOINT FOR SETTINGS ---

@app.get("/api/status")
def get_system_status(current_user: User = Depends(get_current_user)):
    return {
        "database_connected": True,
        "database_url": settings.DATABASE_URL.split("@")[-1] if "@" in settings.DATABASE_URL else "Local SQLite",
        "groq_api_status": "Active Connection" if settings.GROQ_API_KEY else "Mock Fallback Mode (No API Key Configured)",
        "models": {
            "primary": settings.PRIMARY_MODEL,
            "context": settings.CONTEXT_MODEL
        }
    }
