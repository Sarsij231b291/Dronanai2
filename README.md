# 🏹 Drona AI: Intelligent Resume Screening & Voice Interviewing

**CodeSrijan Hackathon**

Drona AI is a premium, forensic-level recruitment platform designed to automate the initial screening phase of hiring. It combines advanced PDF parsing, mathematical scoring models, real-time face detection security, and conversational AI voice interviews into a single, seamless dashboard.
Deployment Link - https://dronanai21.vercel.app/
---

## 🚀 Key Features

### 1. **Forensic Resume Analysis**
*   **Mass Parallel Processing:** Process 100+ resumes simultaneously using Python ThreadPool concurrency.
*   **Mathematical Scoring:** Calculates dynamic match scores based on Job Descriptions vs. Candidate Skills.
*   **Bias-Free Screening:** Optional anonymization mode to ensure merit-based hiring.

### 2. **🛡️ Security-First Face Detection**
*   **Client-Side AI:** Uses TensorFlow.js and BlazeFace to monitor the candidate's webcam feed.
*   **Anti-Cheating:** Blocks the interview launch if more than one person is detected in the frame, ensuring total integrity.

### 3. **🎙️ AI Voice Interview Module**
*   **Conversational AI:** Integrated with Vapi.ai for low-latency, natural voice conversations.
*   **Drill-Down Logic:** The AI automatically asks follow-up questions based on specific claims in the candidate's resume.
*   **Real-time Transcription:** Tracks every word spoken during the session.

### 4. **📊 Real-time Evaluation & Insights**
*   **Automated Grading:** Powered by Gemini 3.1 Flash Preview to provide technical and communication ratings.
*   **Historical Database:** All transcripts, scores, and feedback are permanently stored in a local SQLite database.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React, Vite, Vanilla CSS (Custom Design System) |
| **Backend** | Python (Flask), SQLite |
| **Voice AI** | Vapi.ai SDK |
| **Vision AI** | TensorFlow.js, BlazeFace |
| **Core AI** | Google Gemini 3.1 Flash Preview |
| **Concurrency** | Python ThreadPoolExecutor |

---

## 🚦 Getting Started

### 1. Prerequisites
*   Node.js (v18+)
*   Python (3.9+)
*   API Keys for: Vapi.ai, Google Gemini.

### 2. Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

### 3. Frontend Setup
```bash
npm install
npm run dev
```

---

## 📁 Project Structure
*   `/src/components`: React components including the core `VoiceRoom` and `Dashboard`.
*   `/backend/app.py`: Main Flask API gateway.
*   `/backend/database.py`: SQLite database schema and helper functions.
*   `/backend/prompts.py`: The specialized "Prompts" used for AI evaluation.

---
*Created for the CodeSrijan Hackathon by SHUBHDEEP.*
