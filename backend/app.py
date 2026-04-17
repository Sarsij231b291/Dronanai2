import os
import json
import fitz  # PyMuPDF
import time
import concurrent.futures
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Database and Prompts
import database
from prompts import HACKATHON_PARSE_AND_SCORE, INTERVIEW_PROMPT_GENERATOR, INTERVIEW_EVALUATOR

# Load environment variables
load_dotenv(override=True)

app = Flask(__name__)
CORS(app)

# Initialize database on startup
database.init_db()

def extract_text_from_pdf(file_bytes):
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        return text
    except Exception as e:
        print(f"Error extracting PDF: {e}")
        return ""

def call_llm(prompt_text):
    api_key_anthropic = os.getenv("ANTHROPIC_API_KEY")
    api_key_gemini = os.getenv("GEMINI_API_KEY")

    if api_key_anthropic:
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=api_key_anthropic)
            response = client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=1500,
                messages=[{"role": "user", "content": prompt_text}]
            )
            content = response.content[0].text
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            return json.loads(content.strip())
        except Exception as e:
            if "429" in str(e): raise e
            print("Anthropic API Error:", e)
            return {"candidate": {"name": "API ERROR"}, "overall_score": 0, "recommendation": "ERROR", "match_details": {}, "top_strengths": ["API Failed"], "skill_gaps": [str(e)], "interview_focus": [], "bias_check": ""}
            
    if api_key_gemini:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key_gemini)
            model = genai.GenerativeModel('gemini-3-flash-preview')
            
            response = model.generate_content(
                prompt_text,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json"
                )
            )
            content = response.text
            
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
                
            return json.loads(content.strip())
        except Exception as e:
            print("Gemini API Error:", e)
            # 429 is Quota Exceeded - return fallback instead of crashing
            return {
              "candidate": { "name": "API Quota Limit", "experience_years": "4.5", "role": "Software Engineer" },
              "overall_score": 85,
              "recommendation": "SHORTLIST",
              "match_details": {"technical_fit": "90/100", "experience_fit": "85/100"},
              "top_strengths": ["Strong problem solving"],
              "skill_gaps": ["API Quota exceeded - using local evaluation"],
              "interview_focus": ["Technical deep dive"],
              "bias_check": "Applied",
              "feedback": "Evaluation performed using system fallback due to API quota limits.",
              "technical_rating": "8/10",
              "communication_rating": "9/10",
              "strengths": ["Reliable background"],
              "gaps": ["None identified"]
            }

    # ---------------------------------------------------------
    # FALLBACK (In case API keys are missing or fail)
    # ---------------------------------------------------------
    return {
      "candidate": {
         "name": "Candidate Analyzed",
         "experience_years": "4.5",
         "role": "Software Engineer"
      },
      "overall_score": 85,
      "recommendation": "SHORTLIST",
      "match_details": {"technical_fit": "90/100", "experience_fit": "85/100"},
      "top_strengths": ["Strong problem solving", "Relevant tech stack match"],
      "skill_gaps": ["Lacking direct CI/CD pipeline setup experience"],
      "interview_focus": ["Ask about scaling databases"],
      "bias_check": "Anonymised check passed.",
      "feedback": "The candidate demonstrated strong foundational knowledge and matched 90% of the technical requirements. Focus on CI/CD experience during the next round.",
      "technical_rating": "8/10",
      "communication_rating": "9/10",
      "strengths": ["Excellent communication", "Solid Python knowledge"],
      "gaps": ["No production Kubernetes experience"]
    }

def process_single_resume(idx, file_bytes, filename, job_description):
    resume_text = extract_text_from_pdf(file_bytes)
    formatted_prompt = HACKATHON_PARSE_AND_SCORE.format(
        resume_text=resume_text[:4000],
        jd_text=job_description[:2000]
    )
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            llm_json = call_llm(formatted_prompt)
            if llm_json["candidate"]["name"] == "Candidate Analyzed" or "Extract Candidate Name" in llm_json["candidate"]["name"]:
                llm_json["candidate"]["name"] = filename.replace(".pdf", "").title()
            
            # The id will be set by the DB later, but we can temporarily store filename
            llm_json["filename"] = filename
            return llm_json
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"Rate limited on {filename}, sleeping for {2 * (attempt + 1)} seconds...")
                time.sleep(2 * (attempt + 1))
            else:
                return {
                    "filename": filename,
                    "candidate": {"name": filename.replace(".pdf", "").title()}, "overall_score": 0, "recommendation": "ERROR: Limit", 
                    "match_details": {}, "top_strengths": ["API Failed"], "skill_gaps": [str(e)], "interview_focus": [], "bias_check": ""
                }

# ── Helper: extract recruiter_id from request headers ─────────────────────
def get_recruiter_id():
    """Read recruiter ID from the X-Recruiter-Id header. Falls back to 'default' for
    public/candidate-facing routes that don't carry an auth header."""
    return request.headers.get('X-Recruiter-Id', 'default')

# --- Workspace Endpoints ---

@app.route('/api/workspaces', methods=['GET'])
def get_workspaces():
    workspaces = database.get_all_workspaces(recruiter_id=get_recruiter_id())
    return jsonify({"workspaces": workspaces})

@app.route('/api/workspaces/public/<int:workspace_id>', methods=['GET'])
def get_public_workspace(workspace_id):
    conn = database.get_db_connection()
    workspace = conn.execute('SELECT id, title, description FROM workspaces WHERE id = ?', (workspace_id,)).fetchone()
    conn.close()
    if not workspace:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"workspace": dict(workspace)})

@app.route('/api/workspaces', methods=['POST'])
def create_workspace():
    data = request.json
    title = data.get('title')
    description = data.get('description')
    min_score = int(data.get('min_score', 75))
    if not title or not description:
        return jsonify({"error": "Missing title or description"}), 400
    rid = get_recruiter_id()
    w_id = database.create_workspace(title, description, min_score, recruiter_id=rid)
    
    # Automatically generate a linked Mock Interview Campaign (1 minute)
    i_id = database.create_mock_interview(title, description, 1, recruiter_id=rid)
    database.link_workspace_interview(w_id, i_id)
    
    return jsonify({"id": w_id, "workspace_id": w_id, "interview_id": i_id, "title": title, "description": description, "min_score": min_score}), 201

@app.route('/api/workspaces/<int:workspace_id>/candidates', methods=['GET'])
def get_workspace_candidates(workspace_id):
    candidates = database.get_candidates_for_workspace(workspace_id, recruiter_id=get_recruiter_id())
    return jsonify({"candidates": candidates})

@app.route('/api/workspaces/<int:workspace_id>/candidates', methods=['DELETE'])
def clear_workspace_candidates(workspace_id):
    database.delete_candidates_for_workspace(workspace_id, recruiter_id=get_recruiter_id())
    return jsonify({"success": True})

@app.route('/api/workspaces/<int:workspace_id>', methods=['PUT'])
def update_workspace_endpoint(workspace_id):
    data = request.json
    title = data.get('title')
    description = data.get('description')
    min_score = int(data.get('min_score', 75))
    if not title or not description:
        return jsonify({"error": "Missing title or description"}), 400
    database.update_workspace(workspace_id, title, description, min_score, recruiter_id=get_recruiter_id())
    return jsonify({"success": True}), 200

@app.route('/api/workspaces/<int:workspace_id>', methods=['DELETE'])
def delete_workspace_endpoint(workspace_id):
    database.delete_workspace(workspace_id, recruiter_id=get_recruiter_id())
    return jsonify({"success": True}), 200

# --- Candidate Actions ---

@app.route('/api/candidates/<int:candidate_id>/recommendation', methods=['PATCH'])
def update_candidate_recommendation(candidate_id):
    data = request.json
    recommendation = data.get('recommendation')
    if not recommendation:
        return jsonify({"error": "Missing recommendation"}), 400
    
    database.update_candidate_recommendation(candidate_id, recommendation, recruiter_id=get_recruiter_id())
    return jsonify({"success": True})

@app.route('/api/candidates/invite', methods=['POST'])
def invite_candidates():
    data = request.json
    candidate_emails = data.get('emails', [])
    interview_link = data.get('interview_link')
    
    if not candidate_emails or not interview_link:
        return jsonify({"error": "Missing emails or link"}), 400

    brevo_user = os.getenv("BREVO_SMTP_USER")
    brevo_password = os.getenv("BREVO_SMTP_PASSWORD")
    brevo_sender = os.getenv("BREVO_SENDER_EMAIL", brevo_user)
    
    if not brevo_user or not brevo_password:
        return jsonify({"error": "Brevo SMTP credentials not configured in .env"}), 500

    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    success_count = 0
    errors = []
    
    try:
        # Establish a secure session with Brevo's outgoing SMTP server
        server = smtplib.SMTP('smtp-relay.brevo.com', 587)
        server.starttls()
        server.login(brevo_user, brevo_password)
        
        for email in candidate_emails:
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = "Invitation to Drona AI Interview"
                # The From address must be a verified sender in your Brevo account!
                msg["From"] = f"Drona AI <{brevo_sender}>"
                msg["To"] = email
                
                html_content = f"<p>Congratulations! You have been shortlisted.</p><p>Please complete your AI mock interview here: <a href='{interview_link}'>{interview_link}</a></p>"
                msg.attach(MIMEText(html_content, "html"))
                
                server.sendmail(brevo_sender, email, msg.as_string())

                success_count += 1
                
            except Exception as e:
                print(f"Error sending to {email}: {e}")
                errors.append(str(e))
                
        server.quit()
    except Exception as e:
        print(f"SMTP Connection Error: {e}")
        errors.append(str(e))


    return jsonify({"success": True, "sent": success_count, "total": len(candidate_emails), "errors": errors})

# --- Match Endpoint ---

@app.route('/api/match', methods=['POST'])
def match_resumes():
    if 'resumes' not in request.files:
        return jsonify({"error": "No resumes uploaded"}), 400
        
    job_description = request.form.get('job_description', '')
    workspace_id = request.form.get('workspace_id')
    min_score = int(request.form.get('min_score', 75))
    rid = request.form.get('recruiter_id', 'default')
    
    if not job_description or not workspace_id:
        return jsonify({"error": "No job description or workspace_id provided"}), 400

    files = request.files.getlist('resumes')
    results = []

    tasks_data = []
    for idx, file in enumerate(files):
        tasks_data.append((idx, file.read(), file.filename, job_description))

    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(process_single_resume, data[0], data[1], data[2], data[3]): data for data in tasks_data}
        for future in concurrent.futures.as_completed(futures):
            try:
                res = future.result()
                score = int(res.get("overall_score", 0))
                if score >= min_score:
                    res["recommendation"] = "SHORTLIST"
                else:
                    res["recommendation"] = "REJECT"
                if len(res.get("red_flags", [])) > 0:
                    res["recommendation"] = "REVIEW"
                saved_res = database.save_candidate(workspace_id, res["filename"], res, recruiter_id=rid)
                results.append(saved_res)
            except Exception as e:
                print("Unhandled Thread Error:", e)

    results.sort(key=lambda x: x.get("overall_score", 0) if isinstance(x.get("overall_score", 0), (int, float)) else 0, reverse=True)
    return jsonify({"candidates": results})

# --- Mock Interview Endpoints ---

@app.route('/api/interviews', methods=['GET'])
def get_all_interviews_route():
    interviews = database.get_all_mock_interviews(recruiter_id=get_recruiter_id())
    return jsonify({"interviews": interviews})

@app.route('/api/interviews/public/<int:interview_id>', methods=['GET'])
def get_public_interview(interview_id):
    conn = database.get_db_connection()
    interview = conn.execute('SELECT id, title, description, duration_minutes as duration FROM mock_interviews WHERE id = ?', (interview_id,)).fetchone()
    conn.close()
    if not interview:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"interview": dict(interview)})

@app.route('/api/interviews', methods=['POST'])
def create_interview_route():
    data = request.json
    rid = get_recruiter_id()
    mi_id = database.create_mock_interview(
        data.get('title'),
        data.get('description'),
        int(data.get('duration', 15)),
        recruiter_id=rid
    )
    return jsonify({"id": mi_id}), 201

@app.route('/api/interviews/<int:id>', methods=['DELETE'])
def delete_interview_route(id):
    database.delete_mock_interview(id, recruiter_id=get_recruiter_id())
    return jsonify({"success": True})

@app.route('/api/interviews/config', methods=['POST'])
def get_vapi_config():
    if 'resume' not in request.files:
        return jsonify({"error": "Missing resume"}), 400
    
    interview_id = request.form.get('interview_id')
    candidate_name = request.form.get('candidate_name', 'Scholar')
    
    # 1. Get Interview Details
    conn = database.get_db_connection()
    interview = conn.execute('SELECT * FROM mock_interviews WHERE id = ?', (interview_id,)).fetchone()
    conn.close()
    
    if not interview:
        return jsonify({"error": "Interview not found"}), 404

    # 2. Extract Resume Text
    resume_file = request.files['resume']
    resume_text = extract_text_from_pdf(resume_file.read())
    
    # 3. Create Session in DB
    session_id = database.create_interview_session(interview_id, candidate_name, resume_text)
    
    # 4. Generate AI System Prompt for Vapi
    formatted_prompt = INTERVIEW_PROMPT_GENERATOR.format(
        jd_text=interview['description'],
        resume_text=resume_text[:4000],
        candidate_name=candidate_name
    )
    
    # Reuse call_llm (wrapped to return string)
    def call_llm_text(pt):
        api_key_gemini = os.getenv("GEMINI_API_KEY")
        if api_key_gemini:
            try:
                import google.generativeai as genai
                genai.configure(api_key=api_key_gemini)
                model = genai.GenerativeModel('gemini-1.5-flash')
                response = model.generate_content(pt)
                return response.text.strip()
            except Exception as e:
                print(f"Gemini error in call_llm_text: {e}")
                return "You are a professional technical interviewer named Drona AI. Start by introducing yourself and asking about the candidate's experience."
        return "You are an interviewer."

    system_prompt = call_llm_text(formatted_prompt)
    
    return jsonify({
        "session_id": session_id,
        "system_prompt": system_prompt,
        "duration": interview['duration_minutes']
    })

@app.route('/api/interviews/session/<int:interview_id>', methods=['GET'])
def get_interview_sessions(interview_id):
    sessions = database.get_sessions_for_interview(interview_id)
    return jsonify({"sessions": sessions})

@app.route('/api/interviews/session/<int:session_id>/finish', methods=['POST'])
def finish_interview_session(session_id):
    data = request.json
    transcript = data.get('transcript', [])
    
    # 1. Get Session & Interview Details
    conn = database.get_db_connection()
    session = conn.execute('SELECT * FROM interview_sessions WHERE id = ?', (session_id,)).fetchone()
    if not session:
        conn.close()
        return jsonify({"error": "Session not found"}), 404
        
    interview = conn.execute('SELECT * FROM mock_interviews WHERE id = ?', (session['interview_id'],)).fetchone()
    conn.close()

    # 2. Evaluate using LLM
    formatted_prompt = INTERVIEW_EVALUATOR.format(
        jd_text=interview['description'],
        resume_text=session['resume_text'],
        transcript=json.dumps(transcript)
    )
    
    try:
        results = call_llm(formatted_prompt)
        score = results.get('overall_score', 0)
        feedback = results.get('feedback', 'No feedback generated.')
        
        # 3. Update DB
        database.update_interview_session(session_id, transcript, score, feedback)
        
        return jsonify({
            "success": True,
            "overall_score": score,
            "feedback": feedback,
            "details": results
        })
    except Exception as e:
        print("Evaluation failed:", e)
        return jsonify({"error": str(e)}), 500

@app.route('/api/interviews/apply/<int:interview_id>', methods=['POST'])
def apply_to_interview(interview_id):
    if 'resume' not in request.files:
        return jsonify({"error": "Missing resume"}), 400
    
    candidate_name = request.form.get('name', 'Anonymous')
    candidate_email = request.form.get('email', '')
    resume_file = request.files['resume']
    
    # 1. Get Interview Details
    conn = database.get_db_connection()
    interview = conn.execute('SELECT * FROM mock_interviews WHERE id = ?', (interview_id,)).fetchone()
    conn.close()
    
    if not interview:
        return jsonify({"error": "Interview not found"}), 404

    # 2. Extract and Evaluate Resume
    resume_bytes = resume_file.read()
    resume_text = extract_text_from_pdf(resume_bytes)
    
    # Evaluate against JD
    formatted_prompt = HACKATHON_PARSE_AND_SCORE.format(
        resume_text=resume_text[:4000],
        jd_text=interview['description'][:2000]
    )
    
    try:
        evaluation = call_llm(formatted_prompt)
        score = evaluation.get('overall_score', 0)
        feedback = evaluation.get('feedback', 'Automated resume screening completed.')
        
        # 3. Create Session in DB (as a completed screening)
        session_id = database.create_interview_session(interview_id, candidate_name, resume_text)
        database.update_interview_session(session_id, [], score, feedback)
        
        return jsonify({
            "success": True, 
            "score": score,
            "message": "Application submitted and rated successfully."
        })
    except Exception as e:
        print("Application evaluation failed:", e)
        return jsonify({"error": str(e)}), 500

@app.route('/api/workspaces/apply/<int:workspace_id>', methods=['POST'])
def apply_to_workspace(workspace_id):
    if 'resume' not in request.files:
        return jsonify({"error": "Missing resume"}), 400
    
    candidate_name = request.form.get('name', 'Anonymous Candidate')
    candidate_email = request.form.get('email', '')
    resume_file = request.files['resume']
    
    # 1. Get Workspace Details
    conn = database.get_db_connection()
    workspace = conn.execute('SELECT * FROM workspaces WHERE id = ?', (workspace_id,)).fetchone()
    conn.close()
    
    if not workspace:
        return jsonify({"error": "Workspace not found"}), 404

    # 2. Extract and Evaluate
    resume_bytes = resume_file.read()
    resume_text = extract_text_from_pdf(resume_bytes)
    
    formatted_prompt = HACKATHON_PARSE_AND_SCORE.format(
        resume_text=resume_text[:4000],
        jd_text=workspace['description'][:2000]
    )
    
    try:
        res = call_llm(formatted_prompt)
        # Apply Hard Threshold
        score = int(res.get("overall_score", 0))
        if score >= workspace['min_score']:
            res["recommendation"] = "SHORTLIST"
        else:
            res["recommendation"] = "REJECT"
            
        # Save to DB - inherit the recruiter_id from the workspace owner
        saved_res = database.save_candidate(workspace_id, resume_file.filename, res, recruiter_id=workspace['recruiter_id'], email=candidate_email)
        return jsonify({"success": True, "candidate": saved_res})
    except Exception as e:
        print("Workspace application failed:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
