from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from router.auth.auth import auth
from router.Gmail.mail import mail
from router.Classroom.classroom import classroom
from router.agent.agent import agent_router


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth)
app.include_router(mail)
app.include_router(classroom)
app.include_router(agent_router)


@app.get("/")
def root():
    return {
        "message": "Google Workspace AI Assistant API is running"
    }