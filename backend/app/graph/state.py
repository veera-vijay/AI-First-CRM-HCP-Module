from typing import TypedDict, List, Optional, Any

class ExtractedEntitiesDict(TypedDict, total=False):
    doctor_name: Optional[str]
    hospital: Optional[str]
    specialization: Optional[str]
    meeting_date: Optional[str]
    meeting_type: Optional[str]
    products_discussed: List[str]
    summary: Optional[str]
    doctor_feedback: Optional[str]
    sentiment: Optional[str]
    priority: Optional[str]
    follow_up_date: Optional[str]
    next_action: Optional[str]

class AgentState(TypedDict):
    input_text: str
    user_id: int
    intent: str  # log_interaction, edit_interaction, search_hcp, view_history, schedule_followup, unknown
    extracted_entities: ExtractedEntitiesDict
    validation_errors: List[str]
    selected_tool: str
    tool_output: Optional[Any]
    response: str
