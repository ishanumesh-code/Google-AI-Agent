from router.auth import auth
from fastapi import APIRouter
from googleapiclient.discovery import build
import base64
from .schemas import attachments
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

mail = APIRouter(
    prefix="/gmail",
    tags=["Gmail"]
)


def get_gmail_service(credentials):
    service = build(
        "gmail",
        "v1",
        credentials=credentials
    )
    return service



def get_gmail_messages():
    credentials=auth.credentials
    service=get_gmail_service(credentials)
    india = ZoneInfo("Asia/Kolkata")
    now = datetime.now(india)
    today = now.replace(
        hour=0,
        minute=0,
        second=0,
        microsecond=0
    )
    tomorrow = today + timedelta(days=1)
    today_timestamp = int(today.timestamp())
    tomorrow_timestamp = int(tomorrow.timestamp())
    query = f"after:{today_timestamp} before:{tomorrow_timestamp}"
    result = service.users().messages().list(
        userId="me",
        q=query
    ).execute()
    return result



@mail.get("/messages")
def get_messages():
    result = get_gmail_messages()
    all_messages = {}
    for message in result.get("messages", []):
        credentials = auth.credentials
        service = get_gmail_service(credentials)
        encoded_email = service.users().messages().get(
            userId="me",
            id=message["id"]
        ).execute()
        header_dict = {}
        for header in encoded_email["payload"]["headers"]:
            if header["name"] == "Subject":
                subject = header["value"]
            if header["name"] == "From":
                efrom = header["value"]
            if header["name"] == "To":
                to = header["value"]
        header_dict["subject"] = subject
        header_dict["to"] = to
        header_dict["efrom"] = efrom
        '''now for the data'''
        data_dict = {}
        html_message = ""
        attachment_ids = []
        parts = encoded_email["payload"].get("parts", [])

        def for_multipart(sub_parts, html_acc, att_acc):
            for part in sub_parts:
                mime = part["mimeType"]
                if mime == "text/html":
                    encoded_data = part["body"].get("data")
                    if encoded_data:
                        html_acc.append(
                            base64.urlsafe_b64decode(encoded_data).decode("utf-8")
                        )
                elif mime.startswith("multipart/"):
                    for_multipart(part.get("parts", []), html_acc, att_acc)
                if part.get("filename"):
                    attachment_id = part["body"].get("attachmentId")
                    if attachment_id:
                        att_acc.append({
                            "id": attachment_id,
                            "mimeType": mime
                        })

        html_parts = []
        for_multipart(parts, html_parts, attachment_ids)
        html_message = html_parts[0] if html_parts else ""

        data_dict["message"] = html_message
        data_dict["attachments"] = attachment_ids
        all_messages[message["id"]] = {
            "header": header_dict,
            "data": data_dict
        }
    return all_messages


def get_gmail_attachment(message_id,attachment_id):
    credentials=auth.credentials
    service=get_gmail_service(credentials)
    attachment=service.users().messages().attachments().get(
        userId="me",
        messageId=message_id,
        id=attachment_id
    ).execute()["data"]
    return attachment



@mail.post("/attachments")
def get_attachments(maildata:attachments):
    all_attachments=[]
    for i in maildata.attachments_list:
        temp=get_gmail_attachment(
            maildata.message_id,
            i["id"]
        )
        temp_dict={}
        temp_dict["data"]=temp
        temp_dict["mimeType"]=i["mimeType"]
        all_attachments.append(temp_dict)
    return all_attachments
