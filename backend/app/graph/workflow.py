from langgraph.graph import StateGraph, END
from app.graph.state import AgentState
from app.graph.nodes import (
    intent_detection_node,
    entity_extraction_node,
    validation_node,
    execute_tool_node,
    generate_response_node
)

# Initialize the StateGraph with the AgentState schema
workflow = StateGraph(AgentState)

# Add Nodes to Graph
workflow.add_node("intent_detection", intent_detection_node)
workflow.add_node("entity_extraction", entity_extraction_node)
workflow.add_node("validation", validation_node)
workflow.add_node("execute_tool", execute_tool_node)
workflow.add_node("generate_response", generate_response_node)

# Define Directed Transitions
workflow.set_entry_point("intent_detection")

workflow.add_edge("intent_detection", "entity_extraction")
workflow.add_edge("entity_extraction", "validation")
workflow.add_edge("validation", "execute_tool")
workflow.add_edge("execute_tool", "generate_response")
workflow.add_edge("generate_response", END)

# Compile the Workflow into a runnable application
app_graph = workflow.compile()
