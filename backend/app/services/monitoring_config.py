import os
 
from dotenv import load_dotenv
 
 
load_dotenv()
 
 
def get_monitored_folders():
    value = os.getenv("MONITORED_FOLDERS", "")
 
    return [
        folder.strip()
        for folder in value.split(",")
        if folder.strip()
    ]