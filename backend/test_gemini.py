import os
from dotenv import load_dotenv
load_dotenv()
try:
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel('gemini-3-flash-preview')
    response = model.generate_content("Say hello")
    print("SUCCESS: ", response.text)
except Exception as e:
    print("ERROR: ", str(e))
