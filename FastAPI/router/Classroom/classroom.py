from router.auth.auth import get_credentials
from fastapi import APIRouter, HTTPException
from googleapiclient.errors import HttpError
from googleapiclient.discovery import build
from fastapi.responses import StreamingResponse
from io import BytesIO

classroom = APIRouter(
    prefix="/classroom",
    tags=["Classroom"]
)

def require_credentials():
    credentials = get_credentials()
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Not authorized. Please complete Google OAuth first via /auth."
        )
    return credentials

def get_classroom_services(credentials):
    service=build(
        "classroom",
        "v1",
        credentials=credentials
    )
    return service



def get_courses():
    credentials=require_credentials()
    service=get_classroom_services(credentials)
    all_courses={}
    page_token=None
    while True:
        all_info=service.courses().list(
            pageToken=page_token
        ).execute()
        for course in all_info.get("courses", []):
            all_courses[course["id"]]=course["name"]
        page_token=all_info.get("nextPageToken")
        if not page_token:
            break
    return all_courses

def normalize_materials(materials):
    attachments=[]
    for m in materials or []:
        if "driveFile" in m:
            f=m["driveFile"].get("driveFile", {})
            attachments.append({
                "type": "drive",
                "id": f.get("id"),
                "title": f.get("title"),
                "url": f.get("alternateLink"),
                "thumbnail": f.get("thumbnailUrl"),
            })
        elif "link" in m:
            l=m["link"]
            attachments.append({
                "type": "link",
                "title": l.get("title") or l.get("url"),
                "url": l.get("url"),
            })
        elif "youtubeVideo" in m:
            y=m["youtubeVideo"]
            attachments.append({
                "type": "youtube",
                "title": y.get("title"),
                "url": y.get("alternateLink"),
            })
        elif "form" in m:
            fm=m["form"]
            attachments.append({
                "type": "form",
                "title": fm.get("title"),
                "url": fm.get("formUrl"),
            })
    return attachments

def get_coursework():
    credentials=require_credentials()
    service=get_classroom_services(credentials)
    courses=get_courses()
    all_coursework={}
    fields=["id", "courseId", "title", "description",
            "dueDate", "dueTime", "alternateLink", "materials"]
    for course_id, course_name in courses.items():
        assignments=[]
        submissions={}
        try:
            page_token=None
            while True:
                sub_info=service.courses().courseWork().studentSubmissions().list(
                    courseId=course_id,
                    courseWorkId="-",
                    userId="me",
                    pageToken=page_token
                ).execute()
                for sub in sub_info.get("studentSubmissions", []):
                    submissions[sub["courseWorkId"]]=sub
                page_token=sub_info.get("nextPageToken")
                if not page_token:
                    break
            page_token=None
            while True:
                all_info=service.courses().courseWork().list(
                    courseId=course_id,
                    pageToken=page_token
                ).execute()
                for assignment in all_info.get("courseWork", []):
                    assignment_info={}
                    for field in fields:
                        if field in assignment:
                            assignment_info[field]=assignment[field]
                    assignment_info["attachments"]=normalize_materials(
                        assignment.get("materials")
                    )
                    sub=submissions.get(assignment["id"])
                    state=sub.get("state") if sub else None
                    assignment_info["submissionState"]=state
                    assignment_info["submitted"]=state in ("TURNED_IN", "RETURNED")
                    assignment_info["late"]=sub.get("late", False) if sub else False
                    assignment_info["grade"]=sub.get("assignedGrade") if sub else None
                    assignments.append(assignment_info)
                page_token=all_info.get("nextPageToken")
                if not page_token:
                    break
        except HttpError as e:
            print(f"Skipping course {course_id} ({course_name}): {e}")
            continue
        all_coursework[course_name]=assignments
    return all_coursework

def get_drive_service(credentials):
    service=build(
        "drive",
        "v3",
        credentials=credentials
    )
    return service

def get_coursework_attachment(file_id):
    credentials=require_credentials()
    service=get_drive_service(credentials)
    file_info=service.files().get(
        fileId=file_id,
        fields="name,mimeType"
    ).execute()
    if file_info["mimeType"].startswith("application/vnd.google-apps."):
        file_data=service.files().export(
            fileId=file_id,
            mimeType="application/pdf"
        ).execute()
        file_info["mimeType"]="application/pdf"
        file_info["name"]=file_info["name"]+".pdf"
    else:
        file_data=service.files().get_media(
            fileId=file_id
        ).execute()
    return StreamingResponse(
        BytesIO(file_data),
        media_type=file_info["mimeType"],
        headers={
            "Content-Disposition": f'inline; filename="{file_info["name"]}"'
        }
    )

@classroom.get("/courses")
def get_courses_route():
    return get_courses()


@classroom.get("/coursework")
def get_coursework_route():
    return get_coursework() 


@classroom.get("/coursework/attachment/{file_id}")
def get_attachment_route(file_id: str):
    return get_coursework_attachment(file_id)
