from pydantic import BaseModel


class attachments(BaseModel):
    message_id:str
    attachments_list:list[dict]
