import sqlite3
import json
import os

# On Vercel, the filesystem is read-only except for /tmp.
# We use /tmp for serverless, and a local file for development.
DB_FILE = '/tmp/recruitment.db' if os.getenv('VERCEL') else 'recruitment.db'

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    c = conn.cursor()
    
    # Create Workspaces/Jobs table
    c.execute('''
        CREATE TABLE IF NOT EXISTS workspaces (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recruiter_id TEXT NOT NULL DEFAULT 'default',
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Safe Migrations
    for col, defn in [
        ('min_score', 'INTEGER DEFAULT 75'),
        ('recruiter_id', "TEXT NOT NULL DEFAULT 'default'"),
        ('interview_id', "INTEGER"),
    ]:
        try:
            c.execute(f'ALTER TABLE workspaces ADD COLUMN {col} {defn}')
        except sqlite3.OperationalError:
            pass

    # Create Candidates table
    c.execute('''
        CREATE TABLE IF NOT EXISTS candidates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            workspace_id INTEGER NOT NULL,
            recruiter_id TEXT NOT NULL DEFAULT 'default',
            filename TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT,
            experience_years TEXT,
            overall_score INTEGER,
            recommendation TEXT,
            technical_fit TEXT,
            experience_fit TEXT,
            top_strengths TEXT,  -- JSON serialized list
            skill_gaps TEXT,     -- JSON serialized list
            interview_focus TEXT, -- JSON serialized list
            bias_check TEXT,
            red_flags TEXT,      -- JSON serialized list
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (workspace_id) REFERENCES workspaces (id)
        )
    ''')
    
    for col, defn in [
        ('red_flags', 'TEXT'),
        ('recruiter_id', "TEXT NOT NULL DEFAULT 'default'"),
    ]:
        try:
            c.execute(f'ALTER TABLE candidates ADD COLUMN {col} {defn}')
        except sqlite3.OperationalError:
            pass

    # Safe migrations for Candidates table
    for col, defn in [
        ('email', 'TEXT'),
    ]:
        try:
            c.execute(f'ALTER TABLE candidates ADD COLUMN {col} {defn}')
        except sqlite3.OperationalError:
            pass

    # Create Mock Interview Tables
    c.execute('''
        CREATE TABLE IF NOT EXISTS mock_interviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recruiter_id TEXT NOT NULL DEFAULT 'default',
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            duration_minutes INTEGER DEFAULT 15,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    try:
        c.execute("ALTER TABLE mock_interviews ADD COLUMN recruiter_id TEXT NOT NULL DEFAULT 'default'")
    except sqlite3.OperationalError:
        pass

    # Interview Sessions
    c.execute('''
        CREATE TABLE IF NOT EXISTS interview_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            interview_id INTEGER NOT NULL,
            candidate_name TEXT NOT NULL,
            resume_text TEXT NOT NULL,
            transcript TEXT,
            overall_score INTEGER,
            feedback TEXT,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (interview_id) REFERENCES mock_interviews (id)
        )
    ''')
    
    conn.commit()
    conn.close()

# ── Workspace CRUD ─────────────────────────────────────────────────────────

def get_all_workspaces(recruiter_id='default'):
    conn = get_db_connection()
    workspaces = conn.execute(
        'SELECT * FROM workspaces WHERE recruiter_id = ? ORDER BY created_at DESC',
        (recruiter_id,)
    ).fetchall()
    conn.close()
    return [dict(w) for w in workspaces]

def create_workspace(title, description, min_score=75, recruiter_id='default'):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO workspaces (title, description, min_score, recruiter_id) VALUES (?, ?, ?, ?)',
        (title, description, min_score, recruiter_id)
    )
    conn.commit()
    workspace_id = cursor.lastrowid
    conn.close()
    return workspace_id

def update_workspace(workspace_id, title, description, min_score=75, recruiter_id='default'):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        'UPDATE workspaces SET title=?, description=?, min_score=? WHERE id=? AND recruiter_id=?',
        (title, description, min_score, workspace_id, recruiter_id)
    )
    conn.commit()
    conn.close()

def link_workspace_interview(workspace_id, interview_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE workspaces SET interview_id=? WHERE id=?', (interview_id, workspace_id))
    conn.commit()
    conn.close()

def delete_workspace(workspace_id, recruiter_id='default'):
    conn = get_db_connection()
    cursor = conn.cursor()
    # Only delete candidates belonging to this recruiter's workspace
    cursor.execute(
        'DELETE FROM candidates WHERE workspace_id=? AND recruiter_id=?',
        (workspace_id, recruiter_id)
    )
    cursor.execute(
        'DELETE FROM workspaces WHERE id=? AND recruiter_id=?',
        (workspace_id, recruiter_id)
    )
    conn.commit()
    conn.close()

# ── Candidate CRUD ─────────────────────────────────────────────────────────

def save_candidate(workspace_id, filename, llm_json, recruiter_id='default', email=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    c_data = llm_json.get("candidate", {})
    match_data = llm_json.get("match_details", {})
    
    cursor.execute('''
        INSERT INTO candidates (
            workspace_id, recruiter_id, filename, name, email, role, experience_years, 
            overall_score, recommendation, technical_fit, experience_fit,
            top_strengths, skill_gaps, interview_focus, bias_check, red_flags
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        workspace_id,
        recruiter_id,
        filename,
        c_data.get("name", "Unknown"),
        email or c_data.get("email", ""),
        c_data.get("role", "Unknown"),
        str(c_data.get("experience_years", "Unknown")),
        llm_json.get("overall_score", 0),
        llm_json.get("recommendation", "UNKNOWN"),
        match_data.get("technical_fit", ""),
        match_data.get("experience_fit", ""),
        json.dumps(llm_json.get("top_strengths", [])),
        json.dumps(llm_json.get("skill_gaps", [])),
        json.dumps(llm_json.get("interview_focus", [])),
        llm_json.get("bias_check", ""),
        json.dumps(llm_json.get("red_flags", []))
    ))
    conn.commit()
    candidate_id = cursor.lastrowid
    conn.close()
    
    llm_json["id"] = candidate_id
    return llm_json

def delete_candidates_for_workspace(workspace_id, recruiter_id='default'):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        'DELETE FROM candidates WHERE workspace_id = ? AND recruiter_id = ?',
        (workspace_id, recruiter_id)
    )
    conn.commit()
    conn.close()

def get_candidates_for_workspace(workspace_id, recruiter_id='default'):
    conn = get_db_connection()
    rows = conn.execute(
        'SELECT * FROM candidates WHERE workspace_id = ? AND recruiter_id = ? ORDER BY overall_score DESC',
        (workspace_id, recruiter_id)
    ).fetchall()
    conn.close()
    
    results = []
    for r in rows:
        results.append({
            "id": r["id"],
            "candidate": {
                "name": r["name"],
                "email": r["email"],
                "role": r["role"],
                "experience_years": r["experience_years"]
            },
            "overall_score": r["overall_score"],
            "recommendation": r["recommendation"],
            "match_details": {
                "technical_fit": r["technical_fit"],
                "experience_fit": r["experience_fit"]
            },
            "top_strengths": json.loads(r["top_strengths"]) if r["top_strengths"] else [],
            "skill_gaps": json.loads(r["skill_gaps"]) if r["skill_gaps"] else [],
            "interview_focus": json.loads(r["interview_focus"]) if r["interview_focus"] else [],
            "bias_check": r["bias_check"],
            "red_flags": json.loads(r["red_flags"]) if r["red_flags"] else [],
            "filename": r["filename"]
        })
    return results

def update_candidate_recommendation(candidate_id, recommendation, recruiter_id='default'):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE candidates 
        SET recommendation = ? 
        WHERE id = ? AND recruiter_id = ?
    ''', (recommendation, candidate_id, recruiter_id))
    conn.commit()
    conn.close()

# ── Mock Interview Helpers ─────────────────────────────────────────────────

def get_all_mock_interviews(recruiter_id='default'):
    conn = get_db_connection()
    rows = conn.execute(
        'SELECT * FROM mock_interviews WHERE recruiter_id = ? ORDER BY created_at DESC',
        (recruiter_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def create_mock_interview(title, description, duration, recruiter_id='default'):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO mock_interviews (title, description, duration_minutes, recruiter_id) VALUES (?, ?, ?, ?)',
        (title, description, duration, recruiter_id)
    )
    conn.commit()
    mi_id = cursor.lastrowid
    conn.close()
    return mi_id

def delete_mock_interview(id, recruiter_id='default'):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM interview_sessions WHERE interview_id=?', (id,))
    cursor.execute(
        'DELETE FROM mock_interviews WHERE id=? AND recruiter_id=?',
        (id, recruiter_id)
    )
    conn.commit()
    conn.close()

def create_interview_session(interview_id, candidate_name, resume_text):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO interview_sessions (interview_id, candidate_name, resume_text)
        VALUES (?, ?, ?)
    ''', (interview_id, candidate_name, resume_text))
    conn.commit()
    session_id = cursor.lastrowid
    conn.close()
    return session_id

def update_interview_session(session_id, transcript, score=None, feedback=None, status='completed'):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE interview_sessions 
        SET transcript=?, overall_score=?, feedback=?, status=? 
        WHERE id=?
    ''', (json.dumps(transcript), score, feedback, status, session_id))
    conn.commit()
    conn.close()

def get_sessions_for_interview(interview_id):
    conn = get_db_connection()
    rows = conn.execute(
        'SELECT * FROM interview_sessions WHERE interview_id = ? ORDER BY created_at DESC',
        (interview_id,)
    ).fetchall()
    conn.close()
    
    results = []
    for r in rows:
        results.append({
            "id": r["id"],
            "candidate_name": r["candidate_name"],
            "overall_score": r["overall_score"],
            "feedback": r["feedback"],
            "status": r["status"],
            "created_at": r["created_at"]
        })
    return results

# Initialize DB when module imports
init_db()
