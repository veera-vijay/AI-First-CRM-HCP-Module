import datetime
from sqlalchemy import desc
from app.database import SessionLocal
from app.models import HCP, Product, Interaction, FollowUp, ActivityLog, User
from typing import Dict, Any, List

def calculate_interaction_score(sentiment: str, feedback: str) -> int:
    """Helper to compute a premium interaction score 0-100 based on sentiment and feedback."""
    score = 50
    sentiment_lower = sentiment.lower() if sentiment else ""
    if "positive" in sentiment_lower:
        score = 80
    elif "negative" in sentiment_lower:
        score = 25
    elif "neutral" in sentiment_lower:
        score = 50
        
    # Analyze feedback keywords
    feedback_lower = feedback.lower() if feedback else ""
    if any(word in feedback_lower for word in ["excellent", "great", "highly", "prescribe", "love"]):
        score += 15
    if any(word in feedback_lower for word in ["skeptical", "expensive", "concern", "complaint", "reject"]):
        score -= 15
        
    return max(0, min(100, score))

def log_interaction_tool(entities: Dict[str, Any], user_id: int) -> Dict[str, Any]:
    """Tool 1: Log Interaction. Parses LLM entities, resolves/creates HCP/Products, and saves record."""
    db = SessionLocal()
    try:
        doctor_name = entities.get("doctor_name")
        hospital = entities.get("hospital") or "Unknown Hospital"
        specialization = entities.get("specialization") or "General Medicine"
        
        if not doctor_name:
            return {"success": False, "error": "Doctor Name is required to log an interaction."}
            
        # Find or create HCP
        hcp = db.query(HCP).filter(HCP.name.ilike(f"%{doctor_name}%")).first()
        if not hcp:
            hcp = HCP(
                name=doctor_name,
                hospital=hospital,
                specialization=specialization,
                location="Assigned via AI Chat",
                status="Active"
            )
            db.add(hcp)
            db.commit()
            db.refresh(hcp)
            
        # Parse Dates
        meeting_date = datetime.date.today()
        if entities.get("meeting_date"):
            try:
                meeting_date = datetime.date.fromisoformat(entities.get("meeting_date"))
            except ValueError:
                pass # Use today as fallback
                
        follow_up_date = None
        if entities.get("follow_up_date"):
            try:
                follow_up_date = datetime.date.fromisoformat(entities.get("follow_up_date"))
            except ValueError:
                pass
                
        sentiment = entities.get("sentiment") or "Neutral"
        doctor_feedback = entities.get("doctor_feedback") or ""
        score = calculate_interaction_score(sentiment, doctor_feedback)
        
        # Create Interaction
        interaction = Interaction(
            hcp_id=hcp.id,
            user_id=user_id,
            meeting_date=meeting_date,
            meeting_type=entities.get("meeting_type") or "Face-to-Face",
            summary=entities.get("summary") or "Logged via AI Chat.",
            doctor_feedback=doctor_feedback,
            sentiment=sentiment,
            priority=entities.get("priority") or "Medium",
            interaction_score=score,
            next_action=entities.get("next_action"),
            follow_up_date=follow_up_date
        )
        db.add(interaction)
        db.commit()
        db.refresh(interaction)
        
        # Link Products
        products_discussed = entities.get("products_discussed") or []
        for prod_name in products_discussed:
            product = db.query(Product).filter(Product.name.ilike(prod_name)).first()
            if not product:
                product = Product(
                    name=prod_name,
                    description=f"Auto-created during chat interaction with {doctor_name}.",
                    indication="General"
                )
                db.add(product)
                db.commit()
                db.refresh(product)
            interaction.products.append(product)
            
        # Create Follow-up if date present
        if follow_up_date:
            followup = FollowUp(
                interaction_id=interaction.id,
                hcp_id=hcp.id,
                user_id=user_id,
                follow_up_date=follow_up_date,
                description=entities.get("next_action") or f"Follow up with {hcp.name}",
                status="Pending"
            )
            db.add(followup)
            
        # Log Activity
        activity = ActivityLog(
            user_id=user_id,
            action=f"AI Chat: Logged interaction with {hcp.name} (ID: {interaction.id})"
        )
        db.add(activity)
        db.commit()
        
        return {
            "success": True,
            "interaction_id": interaction.id,
            "hcp_name": hcp.name,
            "message": f"Successfully logged interaction with {hcp.name} on {meeting_date}."
        }
    except Exception as e:
        db.rollback()
        return {"success": False, "error": str(e)}
    finally:
        db.close()

def edit_interaction_tool(entities: Dict[str, Any], user_id: int) -> Dict[str, Any]:
    """Tool 2: Edit Interaction. Finds latest interaction for specified doctor and edits fields."""
    db = SessionLocal()
    try:
        doctor_name = entities.get("doctor_name")
        if not doctor_name:
            return {"success": False, "error": "Doctor name is required to identify the interaction to update."}
            
        # Find doctor
        hcp = db.query(HCP).filter(HCP.name.ilike(f"%{doctor_name}%")).first()
        if not hcp:
            return {"success": False, "error": f"No doctor profile found matching '{doctor_name}'."}
            
        # Find latest interaction
        interaction = db.query(Interaction).filter(
            Interaction.hcp_id == hcp.id,
            Interaction.user_id == user_id
        ).order_by(desc(Interaction.meeting_date)).first()
        
        if not interaction:
            return {"success": False, "error": f"No recent interaction found with {hcp.name} to update."}
            
        # Update fields if provided in entities
        if entities.get("summary"):
            interaction.summary = entities.get("summary")
        if entities.get("doctor_feedback"):
            interaction.doctor_feedback = entities.get("doctor_feedback")
            # Recalculate score if feedback is modified
            sentiment = entities.get("sentiment") or interaction.sentiment
            interaction.interaction_score = calculate_interaction_score(sentiment, interaction.doctor_feedback)
        if entities.get("sentiment"):
            interaction.sentiment = entities.get("sentiment")
            interaction.interaction_score = calculate_interaction_score(interaction.sentiment, interaction.doctor_feedback)
        if entities.get("priority"):
            interaction.priority = entities.get("priority")
        if entities.get("next_action"):
            interaction.next_action = entities.get("next_action")
        if entities.get("meeting_type"):
            interaction.meeting_type = entities.get("meeting_type")
            
        # If follow-up date changed, update or create followup
        if entities.get("follow_up_date"):
            try:
                f_date = datetime.date.fromisoformat(entities.get("follow_up_date"))
                interaction.follow_up_date = f_date
                # Find associated follow-up
                followup = db.query(FollowUp).filter(FollowUp.interaction_id == interaction.id).first()
                if followup:
                    followup.follow_up_date = f_date
                    if entities.get("next_action"):
                        followup.description = entities.get("next_action")
                else:
                    followup = FollowUp(
                        interaction_id=interaction.id,
                        hcp_id=hcp.id,
                        user_id=user_id,
                        follow_up_date=f_date,
                        description=entities.get("next_action") or f"Follow up with {hcp.name}",
                        status="Pending"
                    )
                    db.add(followup)
            except ValueError:
                pass
                
        # Log Activity
        activity = ActivityLog(
            user_id=user_id,
            action=f"AI Chat: Updated interaction with {hcp.name} (ID: {interaction.id})"
        )
        db.add(activity)
        db.commit()
        
        return {
            "success": True,
            "interaction_id": interaction.id,
            "hcp_name": hcp.name,
            "message": f"Successfully updated the latest interaction with {hcp.name}."
        }
    except Exception as e:
        db.rollback()
        return {"success": False, "error": str(e)}
    finally:
        db.close()

def search_hcp_tool(entities: Dict[str, Any], user_id: int) -> Dict[str, Any]:
    """Tool 3: Search HCP. Looks up doctor profiles based on doctor_name, hospital, or specialization."""
    db = SessionLocal()
    try:
        doctor_name = entities.get("doctor_name")
        hospital = entities.get("hospital")
        specialization = entities.get("specialization")
        
        query = db.query(HCP)
        if doctor_name:
            query = query.filter(HCP.name.ilike(f"%{doctor_name}%"))
        if hospital:
            query = query.filter(HCP.hospital.ilike(f"%{hospital}%"))
        if specialization:
            query = query.filter(HCP.specialization.ilike(f"%{specialization}%"))
            
        results = query.all()
        
        hcp_list = []
        for r in results:
            hcp_list.append({
                "id": r.id,
                "name": r.name,
                "hospital": r.hospital,
                "specialization": r.specialization,
                "location": r.location,
                "status": r.status
            })
            
        # Log activity
        activity = ActivityLog(
            user_id=user_id,
            action=f"AI Chat: Searched for HCPs (Criteria: Name: {doctor_name}, Specialization: {specialization})"
        )
        db.add(activity)
        db.commit()
        
        return {
            "success": True,
            "hcps": hcp_list,
            "count": len(hcp_list),
            "message": f"Found {len(hcp_list)} matching Healthcare Professionals."
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        db.close()

def view_interaction_history_tool(entities: Dict[str, Any], user_id: int) -> Dict[str, Any]:
    """Tool 4: View Interaction History. Retrieves historical meetings with a specific doctor."""
    db = SessionLocal()
    try:
        doctor_name = entities.get("doctor_name")
        if not doctor_name:
            return {"success": False, "error": "Doctor Name is required to search interaction history."}
            
        hcp = db.query(HCP).filter(HCP.name.ilike(f"%{doctor_name}%")).first()
        if not hcp:
            return {"success": False, "error": f"No doctor profile found matching '{doctor_name}'."}
            
        interactions = db.query(Interaction).filter(
            Interaction.hcp_id == hcp.id
        ).order_by(desc(Interaction.meeting_date)).all()
        
        history = []
        for i in interactions:
            history.append({
                "id": i.id,
                "meeting_date": str(i.meeting_date),
                "meeting_type": i.meeting_type,
                "summary": i.summary,
                "sentiment": i.sentiment,
                "score": i.interaction_score,
                "products": [p.name for p in i.products]
            })
            
        # Log Activity
        activity = ActivityLog(
            user_id=user_id,
            action=f"AI Chat: Viewed interaction history for {hcp.name}"
        )
        db.add(activity)
        db.commit()
        
        return {
            "success": True,
            "hcp_name": hcp.name,
            "history": history,
            "count": len(history),
            "message": f"Retrieved {len(history)} meetings with {hcp.name}."
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        db.close()

def schedule_followup_tool(entities: Dict[str, Any], user_id: int) -> Dict[str, Any]:
    """Tool 5: Schedule Follow-up. Sets a follow-up date and description for an HCP."""
    db = SessionLocal()
    try:
        doctor_name = entities.get("doctor_name")
        follow_up_date_str = entities.get("follow_up_date")
        description = entities.get("next_action") or entities.get("summary") or "General Follow-up scheduled via AI"
        
        if not doctor_name:
            return {"success": False, "error": "Doctor Name is required to schedule a follow-up."}
        if not follow_up_date_str:
            return {"success": False, "error": "Follow-up date is required."}
            
        try:
            f_date = datetime.date.fromisoformat(follow_up_date_str)
        except ValueError:
            return {"success": False, "error": f"Invalid date format '{follow_up_date_str}'. Use YYYY-MM-DD."}
            
        # Find HCP
        hcp = db.query(HCP).filter(HCP.name.ilike(f"%{doctor_name}%")).first()
        if not hcp:
            hcp = HCP(
                name=doctor_name,
                hospital=entities.get("hospital") or "Unknown Hospital",
                specialization=entities.get("specialization") or "General Medicine",
                location="Assigned via AI Follow-up Tool",
                status="Active"
            )
            db.add(hcp)
            db.commit()
            db.refresh(hcp)
            
        # Find latest interaction to link if possible
        latest_interaction = db.query(Interaction).filter(
            Interaction.hcp_id == hcp.id,
            Interaction.user_id == user_id
        ).order_by(desc(Interaction.meeting_date)).first()
        
        interaction_id = latest_interaction.id if latest_interaction else None
        
        # Check if follow-up already exists for this interaction to prevent duplicates
        if interaction_id:
            existing = db.query(FollowUp).filter(FollowUp.interaction_id == interaction_id).first()
            if existing:
                existing.follow_up_date = f_date
                existing.description = description
                db.commit()
                return {
                    "success": True,
                    "followup_id": existing.id,
                    "hcp_name": hcp.name,
                    "message": f"Updated existing follow-up with {hcp.name} for {f_date}."
                }
                
        followup = FollowUp(
            interaction_id=interaction_id,
            hcp_id=hcp.id,
            user_id=user_id,
            follow_up_date=f_date,
            description=description,
            status="Pending"
        )
        db.add(followup)
        
        # Log activity
        activity = ActivityLog(
            user_id=user_id,
            action=f"AI Chat: Scheduled follow-up with {hcp.name} for {f_date}"
        )
        db.add(activity)
        db.commit()
        db.refresh(followup)
        
        return {
            "success": True,
            "followup_id": followup.id,
            "hcp_name": hcp.name,
            "message": f"Successfully scheduled follow-up with {hcp.name} on {f_date}."
        }
    except Exception as e:
        db.rollback()
        return {"success": False, "error": str(e)}
    finally:
        db.close()
