import re
 
 
def parse_issserver_command(command: str):
    if not command:
        return None
 
    pattern = r'\\SSISDB\\([^\\]+)\\([^\\]+)\\([^\\"]+\.dtsx)'
 
    match = re.search(pattern, command, re.IGNORECASE)
 
    if not match:
        return None
 
    return {
        "folder_name": match.group(1),
        "project_name": match.group(2),
        "package_name": match.group(3),
    }