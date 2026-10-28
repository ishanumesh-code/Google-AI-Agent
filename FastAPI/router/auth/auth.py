from fastapi import APIRouter
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
import os
os.environ["OAUTHLIB_RELAX_TOKEN_SCOPE"] = "1"


auth = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


CLIENT_SECRETS_FILE = "credentials.json"

SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/classroom.coursework.me.readonly", 
    "https://www.googleapis.com/auth/classroom.coursework.students.readonly",
    "https://www.googleapis.com/auth/classroom.courses.readonly",
    "https://www.googleapis.com/auth/classroom.student-submissions.me.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
]

REDIRECT_URI = "http://localhost:8000/auth/google/callback"

code_verifier = None
credentials=None


code_verifier = None
credentials=None

def get_credentials():
    return credentials


@auth.get("")
def google_login():
    global code_verifier
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )
    authorization_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true"
    )
    code_verifier = flow.code_verifier
    return RedirectResponse(authorization_url)


@auth.get("/google/callback")
def google_callback(code: str, state: str):
    global code_verifier,credentials
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        state=state
    )
    flow.redirect_uri = REDIRECT_URI
    flow.code_verifier = code_verifier
    flow.fetch_token(code=code)
    credentials=flow.credentials
    return RedirectResponse("http://localhost:3000")