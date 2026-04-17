import React, { useState } from 'react';

const CandidateApplyForm = ({ type = 'interview', interviewId, data, onBack }) => {
  const [formData, setFormData] = useState({ name: '', email: '', resume: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);

  const campaign = data.find(i => i.id === parseInt(interviewId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.resume) return alert("Please upload your resume.");

    setIsSubmitting(true);
    const formDataObj = new FormData();
    formDataObj.append('name', formData.name);
    formDataObj.append('email', formData.email);
    formDataObj.append('resume', formData.resume);

    const API_BASE = import.meta.env.VITE_API_URL || '';
    const endpoint = type === 'screening'
      ? `${API_BASE}/api/workspaces/apply/${interviewId}`
      : `${API_BASE}/api/interviews/apply/${interviewId}`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: formDataObj
      });
      const result = await res.json();
      if (result.success) {
        setSubmitted(true);
        setScore(result.score || (result.candidate && result.candidate.overall_score));
      } else {
        alert("Submission failed: " + result.error);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!campaign) return <div className="p-10 text-white">Campaign not found.</div>;

  if (submitted) {
    return (
      <div className="application-success animate-fade-in">
        <div className="success-card glass-panel">
          <div className="success-icon">✓</div>
          <h2>Application Received!</h2>
          <p>Thank you for applying to the <strong>{campaign.title}</strong> position.</p>
          <div className="ai-notice">
            Our AI Talent Engine is currently reviewing your profile.
          </div>
          <button className="btn-primary" onClick={onBack} style={{ marginTop: '2rem' }}>
            Back to Home
          </button>
        </div>
        <style>{`
          .application-success { 
            display: flex; align-items: center; justify-content: center; min-height: 60vh; 
            padding: 2rem;
          }
          .success-card {
            max-width: 500px; text-align: center; padding: 4rem; border-radius: 3rem;
            background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2);
          }
          .success-icon {
            font-size: 4rem; color: #10b981; margin-bottom: 2rem;
          }
          .ai-notice {
            background: rgba(255, 255, 255, 0.03); padding: 1.5rem; border-radius: 1rem;
            margin-top: 2rem; font-size: 0.9rem; color: rgba(255, 255, 255, 0.5);
            border: 1px dashed rgba(255, 255, 255, 0.1);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="candidate-application-page animate-fade-in">
      <div className="application-container">
        <div className="job-info-panel animate-slide-up">
          <div className="job-badge">OPEN APPLICATION</div>
          <h1 className="job-title">{campaign.title.toUpperCase()}</h1>
          <div className="job-meta">
            <span>DRONA AI SCREENING</span> • <span>REMOTE / OFFICE</span>
          </div>
          <p className="job-desc">{campaign.description}</p>
        </div>

        <div className="form-panel glass-panel animate-scale-up">
          <h3>Apply for this position</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>FULL NAME</label>
              <input
                type="text"
                placeholder="Enter your name"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>EMAIL ADDRESS</label>
              <input
                type="email"
                placeholder="email@example.com"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>RESUME (PDF ONLY)</label>
              <div className="file-upload-zone">
                <input
                  type="file"
                  accept=".pdf"
                  required
                  onChange={e => setFormData({ ...formData, resume: e.target.files[0] })}
                  id="resume-upload"
                  className="hidden-file-input"
                />
                <label htmlFor="resume-upload" className="file-label">
                  {formData.resume ? formData.resume.name : "Drag & Drop or Click to Upload"}
                </label>
              </div>
            </div>

            <button type="submit" className="btn-primary apply-btn" disabled={isSubmitting}>
              {isSubmitting ? "PROCESSING..." : "SUBMIT APPLICATION"}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        .candidate-application-page { padding: 4rem 2rem; color: white; max-width: 1200px; margin: 0 auto; }
        .application-container { display: grid; grid-template-columns: 1fr 1fr; gap: 5rem; align-items: start; }
        
        .job-info-panel { padding-right: 2rem; }
        .job-badge { 
          display: inline-block; padding: 0.5rem 1rem; background: rgba(16, 185, 129, 0.1); 
          color: #10b981; border-radius: 2rem; font-size: 0.7rem; font-weight: 900; 
          letter-spacing: 0.15em; margin-bottom: 2rem;
        }
        .job-title { font-size: 3.5rem; font-weight: 950; line-height: 1; margin-bottom: 1.5rem; }
        .job-meta { font-size: 0.8rem; font-weight: 800; color: rgba(255,255,255,0.4); margin-bottom: 2rem; }
        .job-desc { font-size: 1.1rem; line-height: 1.7; color: rgba(255,255,255,0.7); }

        .form-panel { padding: 4rem; border-radius: 3rem; background: rgba(15, 23, 42, 0.4); }
        .form-panel h3 { font-size: 1.5rem; font-weight: 900; margin-bottom: 3rem; }

        .form-group { margin-bottom: 2.5rem; }
        .form-group label { display: block; font-size: 0.7rem; font-weight: 950; color: #10b981; margin-bottom: 0.75rem; letter-spacing: 0.1em; }
        .form-group input {
          width: 100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1);
          padding: 1.25rem; border-radius: 1.25rem; color: white; font-size: 1rem; outline: none; transition: all 0.3s;
        }
        .form-group input:focus { border-color: #10b981; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1); }

        .file-upload-zone {
          border: 2px dashed rgba(255,255,255,0.1); border-radius: 1.25rem; padding: 2rem;
          text-align: center; transition: all 0.3s;
        }
        .file-upload-zone:hover { border-color: #10b981; background: rgba(16, 185, 129, 0.03); }
        .hidden-file-input { display: none; }
        .file-label { cursor: pointer; display: block; font-weight: 700; color: rgba(255,255,255,0.5); }

        .apply-btn { width: 100%; padding: 1.25rem; border-radius: 1.5rem; margin-top: 1.5rem; }

        @media (max-width: 968px) {
          .application-container { grid-template-columns: 1fr; gap: 3rem; }
          .job-title { font-size: 2.5rem; }
        }
      `}</style>
    </div>
  );
};

export default CandidateApplyForm;
