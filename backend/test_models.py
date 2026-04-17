import os
from dotenv import load_dotenv
load_dotenv()
try:
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(m.name)
except Exception as e:
    print("ERROR: ", str(e))
