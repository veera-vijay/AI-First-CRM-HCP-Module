from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Table, Date, func
from sqlalchemy.orm import relationship, declarative_base
import datetime

Base = declarative_base()

# Many-to-Many Association Table between Interactions and Products
interaction_products = Table(
    "interaction_products",
    Base.metadata,
    Column("interaction_id", Integer, ForeignKey("interactions.id", ondelete="CASCADE"), primary_key=True),
    Column("product_id", Integer, ForeignKey("products.id", ondelete="CASCADE"), primary_key=True)
)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(50), default="representative")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    interactions = relationship("Interaction", back_populates="user")
    followups = relationship("FollowUp", back_populates="user")
    chat_histories = relationship("ChatHistory", back_populates="user")
    activity_logs = relationship("ActivityLog", back_populates="user")


class HCP(Base):
    __tablename__ = "hcps"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    hospital = Column(String(150), nullable=False)
    specialization = Column(String(100), nullable=False)
    location = Column(String(150), nullable=False)
    email = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)
    status = Column(String(20), default="Active")  # Active, Inactive
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    # One Doctor -> Many Interactions
    interactions = relationship("Interaction", back_populates="hcp", cascade="all, delete-orphan")
    followups = relationship("FollowUp", back_populates="hcp", cascade="all, delete-orphan")


class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    indication = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Interaction(Base):
    __tablename__ = "interactions"
    
    id = Column(Integer, primary_key=True, index=True)
    hcp_id = Column(Integer, ForeignKey("hcps.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    meeting_date = Column(Date, nullable=False)
    meeting_type = Column(String(50), nullable=False)  # Face-to-Face, Virtual, Phone
    summary = Column(Text, nullable=True)
    doctor_feedback = Column(Text, nullable=True)
    sentiment = Column(String(20), default="Neutral")  # Positive, Neutral, Negative
    priority = Column(String(20), default="Medium")  # High, Medium, Low
    interaction_score = Column(Integer, default=50)  # 0 to 100 based on feedback/sentiment
    next_action = Column(String(255), nullable=True)
    follow_up_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    hcp = relationship("HCP", back_populates="interactions")
    user = relationship("User", back_populates="interactions")
    
    # One Interaction -> Many Products
    products = relationship("Product", secondary=interaction_products)
    
    # One Interaction -> One Follow-up
    followup = relationship("FollowUp", uselist=False, back_populates="interaction", cascade="all, delete-orphan")


class FollowUp(Base):
    __tablename__ = "followups"
    
    id = Column(Integer, primary_key=True, index=True)
    interaction_id = Column(Integer, ForeignKey("interactions.id", ondelete="CASCADE"), unique=True, nullable=True)
    hcp_id = Column(Integer, ForeignKey("hcps.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    follow_up_date = Column(Date, nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(20), default="Pending")  # Pending, Completed, Overdue
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    interaction = relationship("Interaction", back_populates="followup")
    hcp = relationship("HCP", back_populates="followups")
    user = relationship("User", back_populates="followups")


class ChatHistory(Base):
    __tablename__ = "chat_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message = Column(Text, nullable=False)
    sender = Column(String(20), nullable=False)  # user, ai
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="chat_histories")


class ActivityLog(Base):
    __tablename__ = "activity_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    action = Column(String(255), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="activity_logs")
