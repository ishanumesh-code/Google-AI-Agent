from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, TypedDict, Annotated
import os
from dotenv import load_dotenv
import re
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from router.Gmail.mail import get_messages as get_mail_data
from router.Classroom.classroom import get_coursework

agent_router = APIRouter(prefix="/chat", tags=["Agent"])

load_dotenv()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []


class AgentState(TypedDict):
    messages: Annotated[list, add_messages]


def build_context() -> str:
    parts = []
    try:
        mail_data = get_mail_data()
        if mail_data:
            parts.append("=== TODAY'S GMAIL MESSAGES ===")
            for idx, (msg_id, email) in enumerate(mail_data.items(), 1):
                h = email.get("header", {})
                body_html = email.get("data", {}).get("message", "")
                body_text = re.sub(r"<[^>]+>", " ", body_html)
                body_text = re.sub(r"\s+", " ", body_text).strip()[:400]
                atts = email.get("data", {}).get("attachments", [])
                parts.append(
                    f"{idx}. Subject: {h.get('subject','(none)')}\n"
                    f"   From: {h.get('efrom','?')}  To: {h.get('to','?')}\n"
                    f"   Preview: {body_text or '(no text body)'}\n"
                    f"   Attachments: {len(atts)}"
                )
        else:
            parts.append("=== GMAIL: No emails found for today ===")
    except Exception as e:
        parts.append(f"=== GMAIL: Could not fetch ({e}) ===")

    try:
        coursework = get_coursework()
        if coursework:
            parts.append("\n=== GOOGLE CLASSROOM ASSIGNMENTS ===")
            for course_name, assignments in coursework.items():
                parts.append(f"\nCourse: {course_name}")
                if not assignments:
                    parts.append("  (no assignments)")
                    continue
                for a in assignments:
                    due = ""
                    if a.get("dueDate"):
                        d = a["dueDate"]
                        due = f"  Due: {d.get('year')}-{str(d.get('month')).zfill(2)}-{str(d.get('day')).zfill(2)}"
                    if a.get("submitted"):
                        status = "Submitted"
                    elif a.get("late"):
                        status = "Overdue"
                    else:
                        status = "Pending"
                    grade = f"  Grade: {a['grade']}" if a.get("grade") is not None else ""
                    parts.append(f"  - {a.get('title','(untitled)')} [{status}]{due}{grade}")
        else:
            parts.append("=== CLASSROOM: No coursework found ===")
    except Exception as e:
        parts.append(f"=== CLASSROOM: Could not fetch ({e}) ===")

    return "\n".join(parts)


def llm_node(state: AgentState, context: str) -> AgentState:
    llm = ChatOpenAI(
        model="openai/gpt-oss-20b",
        api_key=os.environ.get("GROQ_API_KEY"),
        base_url="https://api.groq.com/openai/v1",
        temperature=0.3,
    )
    system_msg = SystemMessage(content=(
        "The user has connected their Gmail and Google Classroom account. "
        "Use the live data below to answer questions accurately and concisely. "
        "there is no need to use the HTML tags"
        "if the user asks to summerise the mail make sure that the summery is informal language"
        "If data is missing or not authorized, say so clearly.\n\n"
        + context
    ))
    response = llm.invoke([system_msg] + state["messages"])
    return {"messages": [response]}


def build_graph(context: str):
    graph = StateGraph(AgentState)
    def node(state):
        return llm_node(state, context)
    graph.add_node("llm", node)
    graph.set_entry_point("llm")
    graph.add_edge("llm", END)
    return graph.compile()


@agent_router.post("")
def chat(req: ChatRequest):
    lc_messages = []
    for msg in req.history:
        if msg.role == "user":
            lc_messages.append(HumanMessage(content=msg.content))
        elif msg.role == "assistant":
            lc_messages.append(AIMessage(content=msg.content))
    lc_messages.append(HumanMessage(content=req.message))

    context = build_context()
    graph = build_graph(context)
    result = graph.invoke({"messages": lc_messages})
    last_msg = result["messages"][-1]
    return {"reply": last_msg.content}
