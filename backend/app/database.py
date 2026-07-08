from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
import datetime

from app.config import settings

# Setup Database connection
# Note: For SQLite or Postgres, we use create_engine
try:
    engine = create_engine(settings.DATABASE_URL)
    # Test connection
    connection = engine.connect()
    connection.close()
except Exception as e:
    print(f"Warning: PostgreSQL connection failed. Falling back to local SQLite.")
    sqlite_url = "sqlite:///./hcp_crm.db"
    engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Password hashing helper for seeding (bypassing passlib on Windows)
import bcrypt

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def seed_data():
    from app.models import Base, User, HCP, Product, Interaction, FollowUp, ActivityLog
    
    # Create all tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if database is empty to run full seed later
        is_empty_db = db.query(User).first() is None

        print("Seeding initial database data...")
        
        # 1. Seed Users (Ensure rep1 and vijay are always seeded)
        rep1 = db.query(User).filter(User.username == "rep1").first()
        if not rep1:
            hashed_password = bcrypt.hashpw(b"password123", bcrypt.gensalt()).decode('utf-8')
            rep1 = User(
                username="rep1",
                password_hash=hashed_password,
                full_name="Vijay Kumar",
                role="representative"
            )
            db.add(rep1)
            db.commit()
            db.refresh(rep1)

        vijay = db.query(User).filter(User.username == "vijay").first()
        if not vijay:
            hashed_password_vijay = bcrypt.hashpw(b"123", bcrypt.gensalt()).decode('utf-8')
            vijay = User(
                username="vijay",
                password_hash=hashed_password_vijay,
                full_name="Vijay",
                role="representative"
            )
            db.add(vijay)
            db.commit()
            db.refresh(vijay)

        if not is_empty_db:
            print("Database already seeded with clinical data.")
            return
        
        # 2. Seed Products
        products = [
            Product(name="CardioX", description="Advanced beta-blocker for hypertension management.", indication="Cardiology"),
            Product(name="NeuroSentry", description="Targeted therapy for early-stage Alzheimers symptom management.", indication="Neurology"),
            Product(name="DiabeCare", description="Once-daily oral GLP-1 receptor agonist for Type 2 Diabetes.", indication="Endocrinology"),
            Product(name="RespiClear", description="Inhaled corticosteroid for severe asthma control.", indication="Pulmonology"),
            Product(name="OncoShield", description="Monoclonal antibody targeting specific oncogenic receptors.", indication="Oncology")
        ]
        for p in products:
            db.add(p)
        db.commit()
        
        # 3. Seed HCPs (Doctors)
        hcps = [
            HCP(name="Dr. Rajesh Kumar", hospital="Apollo Hospital", specialization="Cardiology", location="New Delhi", email="rajesh.kumar@apollo.com", phone="9876543210", status="Active"),
            HCP(name="Dr. Sarah Jenkins", hospital="Metro General Hospital", specialization="Neurology", location="Mumbai", email="s.jenkins@metrogeneral.org", phone="9876543211", status="Active"),
            HCP(name="Dr. David Chen", hospital="City Cardiology Center", specialization="Cardiology", location="Bangalore", email="davidchen@citycardio.com", phone="9876543212", status="Active"),
            HCP(name="Dr. Priya Patel", hospital="Apex Endocrinology Clinic", specialization="Endocrinology", location="Ahmedabad", email="priya.patel@apexendo.com", phone="9876543213", status="Active"),
            HCP(name="Dr. Michael Vance", hospital="St. Jude Oncology Ward", specialization="Oncology", location="Hyderabad", email="m.vance@stjude.org", phone="9876543214", status="Active"),
            HCP(name="Dr. Ananya Rao", hospital="Fortis Healthcare", specialization="Pulmonology", location="Chennai", email="ananya.rao@fortis.com", phone="9876543215", status="Active"),
            HCP(name="Dr. Robert Miller", hospital="Grace Memorial Clinic", specialization="Cardiology", location="Kolkata", email="r.miller@gracememorial.org", phone="9876543216", status="Active"),
            HCP(name="Dr. Susan Choi", hospital="West End Neurology Care", specialization="Neurology", location="Pune", email="susan.choi@westendneuro.com", phone="9876543217", status="Active"),
            HCP(name="Dr. Vikram Singh", hospital="Max Super Speciality Hospital", specialization="Endocrinology", location="Delhi", email="vikram.singh@maxhospital.com", phone="9876543218", status="Active"),
            HCP(name="Dr. Elena Petrova", hospital="Unity Cancer Center", specialization="Oncology", location="Bangalore", email="e.petrova@unitycancer.org", phone="9876543219", status="Active")
        ]
        for h in hcps:
            db.add(h)
        db.commit()

        # Retrieve seeded entries for referencing IDs
        db_hcps = db.query(HCP).all()
        db_products = db.query(Product).all()

        # 4. Seed Interactions
        today = datetime.date.today()
        interactions = [
            Interaction(
                hcp_id=db_hcps[0].id,
                user_id=rep1.id,
                meeting_date=today - datetime.timedelta(days=10),
                meeting_type="Face-to-Face",
                summary="Discussed CardioX trials and efficacy in elderly patients. Dr. Rajesh expressed high interest in clinical data.",
                doctor_feedback="Very interested in CardioX. Requested physical brochures for patient education.",
                sentiment="Positive",
                priority="High",
                interaction_score=85,
                next_action="Send CardioX brochures and clinical trial booklet.",
                follow_up_date=today + datetime.timedelta(days=4)
            ),
            Interaction(
                hcp_id=db_hcps[1].id,
                user_id=rep1.id,
                meeting_date=today - datetime.timedelta(days=7),
                meeting_type="Virtual",
                summary="Reviewed NeuroSentry dosage guidelines. Doctor raised concerns about possible gastrointestinal side effects.",
                doctor_feedback="Somewhat skeptical about patient compliance due to side effects.",
                sentiment="Neutral",
                priority="Medium",
                interaction_score=55,
                next_action="Provide safety profile summary and patient compliance studies.",
                follow_up_date=today + datetime.timedelta(days=5)
            ),
            Interaction(
                hcp_id=db_hcps[3].id,
                user_id=rep1.id,
                meeting_date=today - datetime.timedelta(days=5),
                meeting_type="Phone",
                summary="Introductory call for DiabeCare. Discussed pricing structures and formulary coverage at Apex Clinic.",
                doctor_feedback="Pleased with local insurance coverage. Will consider prescribing for new patients.",
                sentiment="Positive",
                priority="Low",
                interaction_score=75,
                next_action="Check back next month on formulary listing status.",
                follow_up_date=today + datetime.timedelta(days=20)
            ),
            Interaction(
                hcp_id=db_hcps[4].id,
                user_id=rep1.id,
                meeting_date=today - datetime.timedelta(days=2),
                meeting_type="Face-to-Face",
                summary="Critical review of OncoShield efficacy studies. Discussed survival rates in Stage 3 lung cancer.",
                doctor_feedback="Expressed reservations on high cost, but acknowledged superior efficacy.",
                sentiment="Neutral",
                priority="High",
                interaction_score=60,
                next_action="Share drug access and co-pay support program details.",
                follow_up_date=today + datetime.timedelta(days=2)
            )
        ]
        for index, item in enumerate(interactions):
            db.add(item)
            db.commit()
            db.refresh(item)
            # Associate products
            if index == 0:
                item.products.append(db_products[0]) # CardioX
            elif index == 1:
                item.products.append(db_products[1]) # NeuroSentry
            elif index == 2:
                item.products.append(db_products[2]) # DiabeCare
            elif index == 3:
                item.products.append(db_products[4]) # OncoShield
            db.commit()

        # 5. Seed Follow-Ups
        followups = [
            FollowUp(
                interaction_id=interactions[0].id,
                hcp_id=db_hcps[0].id,
                user_id=rep1.id,
                follow_up_date=today + datetime.timedelta(days=4),
                description="Deliver CardioX brochures and clinical trial booklet.",
                status="Pending"
            ),
            FollowUp(
                interaction_id=interactions[1].id,
                hcp_id=db_hcps[1].id,
                user_id=rep1.id,
                follow_up_date=today + datetime.timedelta(days=5),
                description="Email safety profile summary and compliance sheets.",
                status="Pending"
            ),
            FollowUp(
                interaction_id=interactions[3].id,
                hcp_id=db_hcps[4].id,
                user_id=rep1.id,
                follow_up_date=today + datetime.timedelta(days=2),
                description="Provide co-pay program documentation to Dr. Vance.",
                status="Pending"
            )
        ]
        for f in followups:
            db.add(f)
        
        # 6. Seed Activity Logs
        logs = [
            ActivityLog(user_id=rep1.id, action="Logged in to the HCP CRM Portal."),
            ActivityLog(user_id=rep1.id, action="Created initial interaction with Dr. Rajesh Kumar."),
            ActivityLog(user_id=rep1.id, action="Created interaction with Dr. Sarah Jenkins."),
            ActivityLog(user_id=rep1.id, action="Scheduled follow-up with Dr. Michael Vance.")
        ]
        for l in logs:
            db.add(l)
        
        db.commit()
        print("Database successfully seeded.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()
# Run seed
if __name__ == "__main__":
    seed_data()
