import requests
import re
import sys

try:
    print("Fetching index.html...")
    html = requests.get('https://d1njkikcllb7t4.cloudfront.net/index.html').text
    
    match = re.search(r'assets/index-[a-zA-Z0-9]+\.js', html)
    if not match:
        print("Could not find JS file in index.html")
        sys.exit(1)
        
    js_file = match.group(0)
    print(f"Found JS file: {js_file}")
    
    print(f"Fetching {js_file}...")
    js_content = requests.get(f'https://d1njkikcllb7t4.cloudfront.net/{js_file}').text
    
    api_url = "https://j07ds748oh.execute-api.us-east-1.amazonaws.com/Prod"
    placeholder = "CHANGE_ME"
    
    if api_url in js_content:
        print("SUCCESS: Correct API URL found in JS bundle.")
    else:
        print("FAILURE: Correct API URL NOT found.")
        
    if placeholder in js_content:
        print("FAILURE: Placeholder 'CHANGE_ME' found in JS bundle.")
    else:
        print("SUCCESS: Placeholder NOT found.")

except Exception as e:
    print(f"Error: {e}")
