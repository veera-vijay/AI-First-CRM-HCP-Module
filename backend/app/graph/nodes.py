import json
import re
import datetime
from typing import Dict, Any, List
from app.config import settings
from app.graph.state import AgentState, ExtractedEntitiesDict
from app.graph.tools import (
    log_interaction_tool,
    edit_interaction_tool,
    search_hcp_tool,
    view_interaction_history_tool,
    schedule_followup_tool
)

# Conditionally import LangChain and Groq
try:
    from langchain_groq import ChatGroq
    from langchain_core.prompts import ChatPromptTemplate
    HAS_LANGCHAIN = True
except ImportError:
    HAS_LANGCHAIN = False

def get_llm(model_name: str):
    """Retrieve ChatGroq instance if available, otherwise return None."""
    if HAS_LANGCHAIN and settings.GROQ_API_KEY:
        try:
            return ChatGroq(
                groq_api_key=settings.GROQ_API_KEY,
                model_name=model_name,
                temperature=0.0
            )
        except Exception as e:
            print(f"Error initializing ChatGroq for model {model_name}: {e}")
    return None

def parse_json_from_llm(text: str) -> Dict[str, Any]:
    """Helper to clean and extract JSON payload from LLM markdown block or text."""
    try:
        # Try direct parsing first
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass
        
    # Attempt to extract text inside ```json ... ``` or ``` ... ```
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            pass
            
    # Attempt to find the first '{' and last '}'
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1:
        try:
            return json.loads(text[start:end+1].strip())
        except json.JSONDecodeError:
            pass
            
    return {}

def calculate_next_friday() -> str:
    """Helper to get date string for next Friday."""
    today = datetime.date.today()
    days_ahead = 4 - today.weekday() # Friday is 4
    if days_ahead <= 0: # Target is today or already passed this week
        days_ahead += 7
    return (today + datetime.timedelta(days_ahead)).isoformat()

def run_mock_intent_detection(text: str) -> str:
    text_lower = text.lower()
    if any(word in text_lower for word in ["search", "find", "look up", "hcp list", "query"]):
        return "search_hcp"
    elif any(word in text_lower for word in ["history", "previous", "past meetings", "meetings with", "timeline"]):
        return "view_history"
    elif any(word in text_lower for word in ["schedule", "remind", "follow up next", "follow-up date"]):
        # If it contains met/discussed, it's primarily a log interaction that also schedules follow-up
        if any(word in text_lower for word in ["met", "discussed", "saw", "had a call", "visited"]):
            return "log_interaction"
        return "schedule_followup"
    elif any(word in text_lower for word in ["edit", "update", "change status", "modify"]):
        return "edit_interaction"
    return "log_interaction"

def run_mock_entity_extraction(text: str) -> ExtractedEntitiesDict:
    text_lower = text.lower()
    
    # Extract Doctor Name, Hospital & Specialization (with smart DB lookup fallback)
    doctor_name = None
    hospital = None
    specialization = "General Medicine"
    
    # Try looking up existing doctors in the local DB
    from app.database import SessionLocal
    from app.models import HCP
    db = SessionLocal()
    try:
        # Tokenize text into standalone words to prevent substring matches (e.g., 'chen' in 'chennai')
        words = set(re.findall(r"\b[a-z]+\b", text_lower))
        all_hcps = db.query(HCP).all()
        for hcp in all_hcps:
            clean_name = hcp.name.replace("Dr. ", "").strip()
            name_parts = clean_name.lower().split()
            # If any name part matches a standalone word in the text
            if any(part in words for part in name_parts if len(part) > 2):
                doctor_name = hcp.name
                hospital = hcp.hospital
                specialization = hcp.specialization
                break
    except Exception as e:
        print(f"Error checking DB for doctor matching: {e}")
    finally:
        db.close()

    # Regex fallback if DB check yielded nothing
    if not doctor_name:
        doc_match = re.search(r"(?:dr\.|dr|doctor)\s+([a-z]+(?:\s+[a-z]+)?)", text, re.IGNORECASE)
        if doc_match:
            doctor_name = "Dr. " + doc_match.group(1).title()
        elif "kumar" in text_lower:
            doctor_name = "Dr. Rajesh Kumar"
        elif "jenkins" in text_lower:
            doctor_name = "Dr. Sarah Jenkins"
        elif "chen" in text_lower:
            doctor_name = "Dr. David Chen"

    # Extract Hospital if still empty
    if not hospital:
        hosp_match = re.search(r"([a-z0-9\s]+(?:hospital|clinic|care|ward|center))", text, re.IGNORECASE)
        if hosp_match:
            hospital = hosp_match.group(1).strip().title()
        elif "apollo" in text_lower:
            hospital = "Apollo Hospital"
        elif "metro" in text_lower:
            hospital = "Metro General Hospital"
        elif "city cardiology" in text_lower:
            hospital = "City Cardiology Center"
        
    # Extract Products
    products = []
    for p in ["CardioX", "NeuroSentry", "DiabeCare", "RespiClear", "OncoShield"]:
        if p.lower() in text_lower:
            products.append(p)
    if not products and "cardio" in text_lower:
        products.append("CardioX")
        
    # Extract Dates
    today = datetime.date.today()
    meeting_date = today.isoformat()
    if "yesterday" in text_lower:
        meeting_date = (today - datetime.timedelta(days=1)).isoformat()
    elif "last week" in text_lower:
        meeting_date = (today - datetime.timedelta(days=7)).isoformat()
        
    follow_up_date = None
    if "next friday" in text_lower:
        follow_up_date = calculate_next_friday()
    elif "next week" in text_lower:
        follow_up_date = (today + datetime.timedelta(days=7)).isoformat()
    elif "tomorrow" in text_lower:
        follow_up_date = (today + datetime.timedelta(days=1)).isoformat()
        
    # Specialization (fallback if default is still General Medicine)
    if specialization == "General Medicine":
        if "cardio" in text_lower or "heart" in text_lower:
            specialization = "Cardiology"
        elif "neuro" in text_lower or "brain" in text_lower:
            specialization = "Neurology"
        elif "diab" in text_lower or "sugar" in text_lower:
            specialization = "Endocrinology"
        
    # Meeting Type
    meeting_type = "Face-to-Face"
    if any(w in text_lower for w in ["call", "phone", "telephonic"]):
        meeting_type = "Phone"
    elif any(w in text_lower for w in ["zoom", "virtual", "teams", "online"]):
        meeting_type = "Virtual"
        
    # Sentiment
    sentiment = "Neutral"
    if any(w in text_lower for w in ["happy", "positive", "interested", "excited", "liked", "loves", "great"]):
        sentiment = "Positive"
    elif any(w in text_lower for w in ["skeptical", "negative", "reject", "angry", "disliked", "concern", "complained"]):
        sentiment = "Negative"
        
    # Priority
    priority = "Medium"
    if any(w in text_lower for w in ["urgent", "high", "asap", "immediate", "critical"]):
        priority = "High"
    elif any(w in text_lower for w in ["low", "flexible", "routine"]):
        priority = "Low"
        
    # Feedback & Summary
    feedback = "Requested more information."
    if "clinical trial" in text_lower:
        feedback = "Doctor wants clinical trial reports."
    elif "safety" in text_lower:
        feedback = "Requested safety profile data."
        
    summary = f"Interaction logged via AI Chat with {doctor_name or 'HCP'}."
    if products:
        summary += f" Discussed {', '.join(products)}."
        
    next_action = "Follow up with clinical literature."
    if "follow up" in text_lower:
        next_action = "Deliver requested clinical documents."

    return {
        "doctor_name": doctor_name,
        "hospital": hospital,
        "specialization": specialization,
        "meeting_date": meeting_date,
        "meeting_type": meeting_type,
        "products_discussed": products,
        "summary": summary,
        "doctor_feedback": feedback,
        "sentiment": sentiment,
        "priority": priority,
        "follow_up_date": follow_up_date,
        "next_action": next_action
    }

# --- LANGGRAPH NODES ---

def intent_detection_node(state: AgentState) -> Dict[str, Any]:
    """Node: Detect User Intent from query."""
    input_text = state["input_text"]
    llm = get_llm(settings.CONTEXT_MODEL)
    
    if not llm:
        # Fallback to local heuristic
        intent = run_mock_intent_detection(input_text)
        return {"intent": intent}
        
    prompt = ChatPromptTemplate.from_messages([
        ("system", 
         "You are an AI assistant in a pharmaceutical CRM. Analyze the Medical Representative's input "
         "and classify the intent into exactly one of these options: \n"
         "- 'log_interaction' (logging a meeting, visit, or call with a doctor)\n"
         "- 'edit_interaction' (updating, changing, or editing an existing meeting record)\n"
         "- 'search_hcp' (searching for a doctor, clinic, or specialization)\n"
         "- 'view_history' (reviewing past interactions, timelines, or histories of a doctor)\n"
         "- 'schedule_followup' (scheduling a follow-up or setting a reminder separately)\n"
         "- 'unknown' (none of the above)\n\n"
         "Respond with ONLY the intent name in lowercase (no quotes, no preamble)."),
        ("user", "{input}")
    ])
    
    chain = prompt | llm
    try:
        response = chain.invoke({"input": input_text})
        intent = response.content.strip().lower()
        if intent not in ["log_interaction", "edit_interaction", "search_hcp", "view_history", "schedule_followup"]:
            intent = "log_interaction" # Default fallback
    except Exception as e:
        print(f"Error in intent detection node: {e}")
        intent = run_mock_intent_detection(input_text)
        
    return {"intent": intent}

def entity_extraction_node(state: AgentState) -> Dict[str, Any]:
    """Node: Extract structured details for CRM entities using LLM."""
    input_text = state["input_text"]
    intent = state.get("intent", "log_interaction")
    llm = get_llm(settings.PRIMARY_MODEL)
    
    if not llm:
        # Fallback to local heuristic
        entities = run_mock_entity_extraction(input_text)
        return {"extracted_entities": entities}
        
    today_str = datetime.date.today().isoformat()
    next_friday_str = calculate_next_friday()
    
    system_prompt = f"""You are an advanced medical NLP extractor in a Pharma CRM. Extract entity details from the conversation context.
Formulate a JSON object containing the exact structure below. If a field is not mentioned and you cannot infer it, return null.

The current date is: {today_str} (Today).
If the representative says "next Friday", resolve it as: {next_friday_str}.

Required JSON Output Structure:
{{
  "doctor_name": "Doctor name (e.g. Dr. Rajesh Kumar). Omit titles in key, but prefix with 'Dr. ' in name.",
  "hospital": "Hospital or clinic name (e.g. Apollo Hospital)",
  "specialization": "Specialization of the doctor (e.g. Cardiology, Neurology, Endocrinology, Pulmonology, Oncology)",
  "meeting_date": "Meeting date in YYYY-MM-DD format (Today is {today_str})",
  "meeting_type": "Must be 'Face-to-Face', 'Virtual', or 'Phone'",
  "products_discussed": ["List of products discussed: CardioX, NeuroSentry, DiabeCare, RespiClear, OncoShield"],
  "summary": "Professional summary of the discussion",
  "doctor_feedback": "What the doctor said or requested",
  "sentiment": "Must be 'Positive', 'Neutral', or 'Negative' based on feedback",
  "priority": "Must be 'High', 'Medium', or 'Low' based on urgency",
  "follow_up_date": "Follow-up date in YYYY-MM-DD format (if requested or scheduled)",
  "next_action": "Clear description of the next task/action item"
}}

Respond with ONLY the JSON object. Do not add markdown code formatting blocks if possible, or format strictly as raw JSON.
"""

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("user", "{input}")
    ])
    
    chain = prompt | llm
    try:
        response = chain.invoke({"input": input_text})
        entities = parse_json_from_llm(response.content)
        # Ensure products_discussed is a list
        if "products_discussed" in entities and not isinstance(entities["products_discussed"], list):
            entities["products_discussed"] = [entities["products_discussed"]]
        # Ensure matching key structure
        keys = ["doctor_name", "hospital", "specialization", "meeting_date", "meeting_type", 
                "products_discussed", "summary", "doctor_feedback", "sentiment", "priority", 
                "follow_up_date", "next_action"]
        for k in keys:
            if k not in entities:
                entities[k] = None
        if not entities.get("products_discussed"):
            entities["products_discussed"] = []
    except Exception as e:
        print(f"Error in entity extraction node: {e}")
        entities = run_mock_entity_extraction(input_text)
        
    return {"extracted_entities": entities}

def validation_node(state: AgentState) -> Dict[str, Any]:
    """Node: Validate extracted parameters against constraints."""
    entities = state.get("extracted_entities", {})
    intent = state.get("intent", "log_interaction")
    errors = []
    
    # Validation Rules
    if intent in ["log_interaction", "edit_interaction"]:
        if not entities.get("doctor_name"):
            errors.append("Doctor Name is required.")
        if not entities.get("meeting_date"):
            # Set today as default if missing instead of error
            entities["meeting_date"] = datetime.date.today().isoformat()
        if not entities.get("meeting_type"):
            entities["meeting_type"] = "Face-to-Face"
            
    elif intent == "schedule_followup":
        if not entities.get("doctor_name"):
            errors.append("Doctor Name is required to schedule a follow-up.")
        if not entities.get("follow_up_date"):
            errors.append("Follow-up date is required.")
            
    elif intent == "view_history":
        if not entities.get("doctor_name"):
            errors.append("Doctor Name is required to query meeting history.")
            
    elif intent == "search_hcp":
        # Search can proceed with any fields, but verify at least one parameter is present
        if not entities.get("doctor_name") and not entities.get("hospital") and not entities.get("specialization"):
            errors.append("Please specify a doctor name, hospital, or specialization to search.")
            
    return {
        "validation_errors": errors,
        "extracted_entities": entities
    }

def execute_tool_node(state: AgentState) -> Dict[str, Any]:
    """Node: Select and execute the proper database action."""
    errors = state.get("validation_errors", [])
    intent = state.get("intent", "log_interaction")
    entities = state.get("extracted_entities", {})
    user_id = state["user_id"]
    
    if errors:
        return {
            "selected_tool": "none",
            "tool_output": None,
            "response": f"Validation failed: {', '.join(errors)}"
        }
        
    tool_output = None
    selected_tool = intent
    
    if intent == "log_interaction":
        tool_output = log_interaction_tool(entities, user_id)
    elif intent == "edit_interaction":
        tool_output = edit_interaction_tool(entities, user_id)
    elif intent == "search_hcp":
        tool_output = search_hcp_tool(entities, user_id)
    elif intent == "view_history":
        tool_output = view_interaction_history_tool(entities, user_id)
    elif intent == "schedule_followup":
        tool_output = schedule_followup_tool(entities, user_id)
    else:
        selected_tool = "unknown"
        tool_output = {"success": False, "error": "Unable to determine interaction intent."}
        
    return {
        "selected_tool": selected_tool,
        "tool_output": tool_output
    }

def generate_response_node(state: AgentState) -> Dict[str, Any]:
    """Node: Formulate final user-facing text based on intent and tool execution."""
    intent = state.get("intent")
    tool_output = state.get("tool_output", {})
    errors = state.get("validation_errors", [])
    entities = state.get("extracted_entities", {})
    
    if errors:
        return {"response": f"I couldn't process your request because:\n" + "\n".join([f"- {err}" for err in errors])}
        
    if not tool_output or not tool_output.get("success"):
        error_msg = tool_output.get("error", "An unknown error occurred during database transaction.")
        return {"response": f"I failed to execute your request. Error details: {error_msg}"}
        
    response_text = ""
    
    if intent == "log_interaction":
        response_text = (
            f"**Interaction Logged Successfully!**\n\n"
            f"I have recorded a meeting with **{tool_output.get('hcp_name')}** for {entities.get('meeting_date')}.\n"
            f"- **Products**: {', '.join(entities.get('products_discussed')) or 'None'}\n"
            f"- **Sentiment**: {entities.get('sentiment')}\n"
            f"- **Next Action**: {entities.get('next_action') or 'None'}\n"
            f"- **Follow-up Scheduled**: {entities.get('follow_up_date') or 'No'}\n\n"
            f"Please review the extracted entities in the panel and confirm if everything is correct."
        )
    elif intent == "edit_interaction":
        response_text = (
            f"**Interaction Updated!**\n\n"
            f"I have successfully updated your latest meeting log with **{tool_output.get('hcp_name')}**.\n"
            f"- **Updated Summary**: {entities.get('summary') or 'Unchanged'}\n"
            f"- **Next Action**: {entities.get('next_action') or 'Unchanged'}"
        )
    elif intent == "search_hcp":
        hcps = tool_output.get("hcps", [])
        if not hcps:
            response_text = "I couldn't find any doctor profiles matching your search criteria."
        else:
            response_text = f"**Search Results (Found {len(hcps)}):**\n\n"
            for h in hcps:
                response_text += f"- **{h['name']}** - {h['specialization']} at {h['hospital']} ({h['status']})\n"
    elif intent == "view_history":
        history = tool_output.get("history", [])
        hcp_name = tool_output.get("hcp_name")
        if not history:
            response_text = f"There are no recorded past interactions with **{hcp_name}**."
        else:
            response_text = f"**Interaction History for {hcp_name} (Last {len(history)} meetings):**\n\n"
            for idx, i in enumerate(history):
                response_text += (
                    f"{idx+1}. **{i['meeting_date']}** ({i['meeting_type']}) - Score: {i['score']}/100\n"
                    f"   *Feedback*: \"{i['doctor_feedback']}\"\n"
                    f"   *Summary*: {i['summary']}\n"
                )
    elif intent == "schedule_followup":
        response_text = (
            f"**Follow-up Scheduled!**\n\n"
            f"Scheduled follow-up reminder with **{tool_output.get('hcp_name')}** for {entities.get('follow_up_date')}.\n"
            f"- **Description**: {entities.get('next_action') or 'General follow-up visit'}"
        )
    else:
        response_text = "I processed your request, but I'm not sure how to display the results."
        
    return {"response": response_text}
