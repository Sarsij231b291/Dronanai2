import json
import os

# ---------------------------------------------------------------------------
# Database Abstraction Layer
# ---------------------------------------------------------------------------
# Production (Render / any cloud):  Uses PostgreSQL via DATABASE_URL env var.
# Local development:                Falls back to SQLite (recruitment.db).
# ---------------------------------------------------------------------------

DATABASE_URL = os.getenv('DATABASE_URL')

# Render provides DATABASE_URL starting with "postgres://..." but psycopg2
# requires "postgresql://..." — fix it automatically.
if DATABASE_URL and DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

USE_POSTGRES = bool(DATABASE_URL)

if USE_POSTGRES:
    import psycopg2
    import psycopg2.extras
else:
    import sqlite3

# On Vercel, the filesystem is read-only except for /tmp.
# We use /tmp for serverless, and a local file for development.
SQLITE_DB_FILE = '/tmp/recruitment.db' if os.getenv('VERCEL') else 'recruitment.db'


def get_db_connection():
    if USE_POSTGRES:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    else:
        conn = sqlite3.connect(SQLITE_DB_FILE)
        conn.row_factory = sqlite3.Row
        return conn


def _placeholder():
    """Return the correct SQL placeholder for the active DB engine."""
    return '%s' if USE_POSTGRES else '?'


def _serial_type():
    """Return the correct auto-increment primary key syntax."""
    return 'SERIAL PRIMARY KEY' if USE_POSTGRES else 'INTEGER PRIMARY KEY AUTOINCREMENT'


def _timestamp_default():
    """Return the correct timestamp default."""
    if USE_POSTGRES:
        return 'TIMESTAMP DEFAULT NOW()'
    return 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'


def _execute(conn, query, params=None):
    """Execute a query using the correct cursor type."""
    if USE_POSTGRES:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    else:
        cur = conn.cursor()
    cur.execute(query, params or ())
    return cur


def _fetchall(conn, query, params=None):
    """Execute + fetchall with proper cursor."""
    cur = _execute(conn, query, params)
    rows = cur.fetchall()
    cur.close()
    if USE_POSTGRES:
        return rows  # already list of dicts (RealDictCursor)
    else:
        return [dict(r) for r in rows]


def _fetchone(conn, query, params=None):
    """Execute + fetchone with proper cursor."""
    cur = _execute(conn, query, params)
    row = cur.fetchone()
    cur.close()
    if USE_POSTGRES:
        return row  # dict or None
    else:
        return dict(row) if row else None


def _q(query):
    """Convert a query with ? placeholders to %s if using PostgreSQL."""
    if USE_POSTGRES:
        return query.replace('?', '%s')
    return query


def init_db():
    conn = get_db_connection()
    serial = _serial_type()
    ts = _timestamp_default()

    cur = conn.cursor()

    # Create Workspaces/Jobs table
    cur.execute(f'''
        CREATE TABLE IF NOT EXISTS workspaces (
            id {serial},
            recruiter_id TEXT NOT NULL DEFAULT 'default',
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            min_score INTEGER DEFAULT 75,
            interview_id INTEGER,
            created_at {ts}
        )
    ''')

    # Create Candidates table
    cur.execute(f'''
        CREATE TABLE IF NOT EXISTS candidates (
            id {serial},
            workspace_id INTEGER NOT NULL,
            recruiter_id TEXT NOT NULL DEFAULT 'default',
            filename TEXT NOT NULL,
            name TEXT NOT NULL,
            email TEXT,
            role TEXT,
            experience_years TEXT,
            overall_score INTEGER,
            recommendation TEXT,
            technical_fit TEXT,
            experience_fit TEXT,
            top_strengths TEXT,
            skill_gaps TEXT,
            interview_focus TEXT,
            bias_check TEXT,
            red_flags TEXT,
            created_at {ts}
        )
    ''')

    # Create Mock Interview Tables
    cur.execute(f'''
        CREATE TABLE IF NOT EXISTS mock_interviews (
            id {serial},
            recruiter_id TEXT NOT NULL DEFAULT 'default',
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            duration_minutes INTEGER DEFAULT 15,
            created_at {ts}
        )
    ''')

    # Interview Sessions
    cur.execute(f'''
        CREATE TABLE IF NOT EXISTS interview_sessions (
            id {serial},
            interview_id INTEGER NOT NULL,
            candidate_name TEXT NOT NULL,
            resume_text TEXT NOT NULL,
            transcript TEXT,
            overall_score INTEGER,
            feedback TEXT,
            status TEXT DEFAULT 'pending',
            created_at {ts}
        )
    ''')

    conn.commit()

    # ---------- Safe Migrations (SQLite only — PostgreSQL tables are created
    # with all columns already) ----------
    if not USE_POSTGRES:
        for col, defn in [
            ('min_score', 'INTEGER DEFAULT 75'),
            ('recruiter_id', "TEXT NOT NULL DEFAULT 'default'"),
            ('interview_id', "INTEGER"),
        ]:
            try:
                cur.execute(f'ALTER TABLE workspaces ADD COLUMN {col} {defn}')
            except sqlite3.OperationalError:
                pass

        for col, defn in [
            ('red_flags', 'TEXT'),
            ('recruiter_id', "TEXT NOT NULL DEFAULT 'default'"),
            ('email', 'TEXT'),
        ]:
            try:
                cur.execute(f'ALTER TABLE candidates ADD COLUMN {col} {defn}')
            except sqlite3.OperationalError:
                pass

        try:
            cur.execute("ALTER TABLE mock_interviews ADD COLUMN recruiter_id TEXT NOT NULL DEFAULT 'default'")
        except sqlite3.OperationalError:
            pass

        conn.commit()

    cur.close()
    conn.close()


# ── Workspace CRUD ─────────────────────────────────────────────────────────

def get_all_workspaces(recruiter_id='default'):
    conn = get_db_connection()
    rows = _fetchall(conn, _q(
        'SELECT * FROM workspaces WHERE recruiter_id = ? ORDER BY created_at DESC'
    ), (recruiter_id,))
    conn.close()
    return rows


def create_workspace(title, description, min_score=75, recruiter_id='default'):
    conn = get_db_connection()

    if USE_POSTGRES:
        cur = _execute(conn, '''
            INSERT INTO workspaces (title, description, min_score, recruiter_id)
            VALUES (%s, %s, %s, %s) RETURNING id
        ''', (title, description, min_score, recruiter_id))
        workspace_id = cur.fetchone()['id']
    else:
        cur = _execute(conn, '''
            INSERT INTO workspaces (title, description, min_score, recruiter_id)
            VALUES (?, ?, ?, ?)
        ''', (title, description, min_score, recruiter_id))
        workspace_id = cur.lastrowid

    conn.commit()
    cur.close()
    conn.close()
    return workspace_id


def update_workspace(workspace_id, title, description, min_score=75, recruiter_id='default'):
    conn = get_db_connection()
    _execute(conn, _q(
        'UPDATE workspaces SET title=?, description=?, min_score=? WHERE id=? AND recruiter_id=?'
    ), (title, description, min_score, workspace_id, recruiter_id))
    conn.commit()
    conn.close()


def link_workspace_interview(workspace_id, interview_id):
    conn = get_db_connection()
    _execute(conn, _q('UPDATE workspaces SET interview_id=? WHERE id=?'), (interview_id, workspace_id))
    conn.commit()
    conn.close()


def delete_workspace(workspace_id, recruiter_id='default'):
    conn = get_db_connection()
    _execute(conn, _q(
        'DELETE FROM candidates WHERE workspace_id=? AND recruiter_id=?'
    ), (workspace_id, recruiter_id))
    _execute(conn, _q(
        'DELETE FROM workspaces WHERE id=? AND recruiter_id=?'
    ), (workspace_id, recruiter_id))
    conn.commit()
    conn.close()


# ── Candidate CRUD ─────────────────────────────────────────────────────────

def save_candidate(workspace_id, filename, llm_json, recruiter_id='default', email=None):
    conn = get_db_connection()

    c_data = llm_json.get("candidate", {})
    match_data = llm_json.get("match_details", {})

    if USE_POSTGRES:
        cur = _execute(conn, '''
            INSERT INTO candidates (
                workspace_id, recruiter_id, filename, name, email, role, experience_years,
                overall_score, recommendation, technical_fit, experience_fit,
                top_strengths, skill_gaps, interview_focus, bias_check, red_flags
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        ''', (
            workspace_id, recruiter_id, filename,
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
        candidate_id = cur.fetchone()['id']
    else:
        cur = _execute(conn, '''
            INSERT INTO candidates (
                workspace_id, recruiter_id, filename, name, email, role, experience_years,
                overall_score, recommendation, technical_fit, experience_fit,
                top_strengths, skill_gaps, interview_focus, bias_check, red_flags
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            workspace_id, recruiter_id, filename,
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
        candidate_id = cur.lastrowid

    conn.commit()
    cur.close()
    conn.close()

    llm_json["id"] = candidate_id
    return llm_json


def delete_candidates_for_workspace(workspace_id, recruiter_id='default'):
    conn = get_db_connection()
    _execute(conn, _q(
        'DELETE FROM candidates WHERE workspace_id = ? AND recruiter_id = ?'
    ), (workspace_id, recruiter_id))
    conn.commit()
    conn.close()


def get_candidates_for_workspace(workspace_id, recruiter_id='default'):
    conn = get_db_connection()
    rows = _fetchall(conn, _q(
        'SELECT * FROM candidates WHERE workspace_id = ? AND recruiter_id = ? ORDER BY overall_score DESC'
    ), (workspace_id, recruiter_id))
    conn.close()

    results = []
    for r in rows:
        results.append({
            "id": r["id"],
            "candidate": {
                "name": r["name"],
                "email": r.get("email", ""),
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
    _execute(conn, _q('''
        UPDATE candidates
        SET recommendation = ?
        WHERE id = ? AND recruiter_id = ?
    '''), (recommendation, candidate_id, recruiter_id))
    conn.commit()
    conn.close()


# ── Mock Interview Helpers ─────────────────────────────────────────────────

def get_all_mock_interviews(recruiter_id='default'):
    conn = get_db_connection()
    rows = _fetchall(conn, _q(
        'SELECT * FROM mock_interviews WHERE recruiter_id = ? ORDER BY created_at DESC'
    ), (recruiter_id,))
    conn.close()
    return rows


def create_mock_interview(title, description, duration, recruiter_id='default'):
    conn = get_db_connection()

    if USE_POSTGRES:
        cur = _execute(conn, '''
            INSERT INTO mock_interviews (title, description, duration_minutes, recruiter_id)
            VALUES (%s, %s, %s, %s) RETURNING id
        ''', (title, description, duration, recruiter_id))
        mi_id = cur.fetchone()['id']
    else:
        cur = _execute(conn, '''
            INSERT INTO mock_interviews (title, description, duration_minutes, recruiter_id)
            VALUES (?, ?, ?, ?)
        ''', (title, description, duration, recruiter_id))
        mi_id = cur.lastrowid

    conn.commit()
    cur.close()
    conn.close()
    return mi_id


def delete_mock_interview(id, recruiter_id='default'):
    conn = get_db_connection()
    _execute(conn, _q('DELETE FROM interview_sessions WHERE interview_id=?'), (id,))
    _execute(conn, _q(
        'DELETE FROM mock_interviews WHERE id=? AND recruiter_id=?'
    ), (id, recruiter_id))
    conn.commit()
    conn.close()


def create_interview_session(interview_id, candidate_name, resume_text):
    conn = get_db_connection()

    if USE_POSTGRES:
        cur = _execute(conn, '''
            INSERT INTO interview_sessions (interview_id, candidate_name, resume_text)
            VALUES (%s, %s, %s) RETURNING id
        ''', (interview_id, candidate_name, resume_text))
        session_id = cur.fetchone()['id']
    else:
        cur = _execute(conn, '''
            INSERT INTO interview_sessions (interview_id, candidate_name, resume_text)
            VALUES (?, ?, ?)
        ''', (interview_id, candidate_name, resume_text))
        session_id = cur.lastrowid

    conn.commit()
    cur.close()
    conn.close()
    return session_id


def update_interview_session(session_id, transcript, score=None, feedback=None, status='completed'):
    conn = get_db_connection()
    _execute(conn, _q('''
        UPDATE interview_sessions
        SET transcript=?, overall_score=?, feedback=?, status=?
        WHERE id=?
    '''), (json.dumps(transcript), score, feedback, status, session_id))
    conn.commit()
    conn.close()


def get_sessions_for_interview(interview_id):
    conn = get_db_connection()
    rows = _fetchall(conn, _q(
        'SELECT * FROM interview_sessions WHERE interview_id = ? ORDER BY created_at DESC'
    ), (interview_id,))
    conn.close()

    results = []
    for r in rows:
        results.append({
            "id": r["id"],
            "candidate_name": r["candidate_name"],
            "overall_score": r["overall_score"],
            "feedback": r["feedback"],
            "status": r["status"],
            "created_at": r["created_at"] if isinstance(r["created_at"], str) else str(r["created_at"])
        })
    return results


# Initialize DB when module imports — wrapped in try/except so the app
# can still start even if the database isn't reachable yet.
try:
    init_db()
    print("[database] OK - Database initialised successfully" +
          (" (PostgreSQL)" if USE_POSTGRES else " (SQLite)"))
except Exception as e:
    print(f"[database] WARNING - init_db() failed: {e} - will retry on first request")

