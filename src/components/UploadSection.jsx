import React, { useState, useRef } from 'react';
import { api } from '../api';

const UploadSection = ({ activeWorkspace, onMatchResults }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFiles = async (selectedFiles) => {
    if (selectedFiles.length === 0) return;
    if (!activeWorkspace) {
      alert("Please select or create a Campaign Workspace first!");
      return;
    }
    
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('job_description', activeWorkspace.description);
      formData.append('workspace_id', activeWorkspace.id);
      formData.append('min_score', activeWorkspace.min_score || 75);
      Array.from(selectedFiles).forEach(file => formData.append('resumes', file));

      const data = await api.postForm('/api/match', formData);
      if (data.candidates) {
        onMatchResults(data.candidates);
      } else {
        alert("Error analyzing resumes. Check backend console.");
      }
    } catch (error) {
      console.error("Error processing resumes:", error);
      alert("Could not connect to the backend server.");
    } finally {
      setIsProcessing(false);
      setFiles([]);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    setFiles(droppedFiles);
    await processFiles(droppedFiles);
  };

  const handleFileSelect = async (e) => {
    const selectedFiles = e.target.files;
    setFiles(selectedFiles);
    await processFiles(selectedFiles);
  };

  if (!activeWorkspace) {
    return (
      <div className="upload-container animate-slide-up" style={{ animationDelay: '0.1s', opacity: 0.5, pointerEvents: 'none' }}>
        <h2 className="heading-3 upload-heading">Batch Resume Upload</h2>
        <div className="drop-zone">
          <div className="upload-prompt">
             <p>Create a Campaign first...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="upload-container animate-slide-up" style={{ animationDelay: '0.1s' }}>
      <h2 className="upload-heading">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        Upload to "{activeWorkspace.title}"
      </h2>

      <div 
        className={`drop-zone ${isDragging ? 'dragging' : ''} ${isProcessing ? 'processing' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          multiple 
          accept=".pdf" 
          ref={fileInputRef} 
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        
        {isProcessing ? (
          <div className="processing-state">
            <div className="spinner"></div>
            <p>Evaluating Resumes against Job Requirements...</p>
          </div>
        ) : (
          <div className="upload-prompt" onClick={() => fileInputRef.current.click()}>
            <div className="icon-circle">
              <svg className="upload-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            <h3 className="heading-3">Click or Drag Resumes</h3>
            <p className="text-secondary">Upload PDF files to start AI matching</p>
          </div>
        )}
      </div>

      <style>{`
        .upload-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          height: 100%;
        }

        .upload-heading {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .upload-heading svg {
          color: var(--accent-secondary);
        }

        .drop-zone {
          flex: 1;
          background: rgba(255, 255, 255, 0.03);
          border: 2px dashed var(--border-color);
          border-radius: 1.25rem;
          padding: 3rem 2rem;
          text-align: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 280px;
        }

        .dark .drop-zone {
          background: rgba(15, 23, 42, 0.4);
        }

        .drop-zone:hover {
          border-color: var(--accent-primary);
          background: rgba(99, 102, 241, 0.05);
        }

        .drop-zone.dragging {
          border-color: var(--accent-primary);
          background: rgba(99, 102, 241, 0.1);
          transform: scale(1.01);
        }

        .drop-zone.processing {
          border-color: var(--success-color);
          background: rgba(16, 185, 129, 0.05);
          cursor: wait;
        }

        .upload-prompt {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .icon-circle {
          width: 64px;
          height: 64px;
          background: rgba(34, 211, 238, 0.1);
          border: 1px solid rgba(34, 211, 238, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.5rem;
        }

        .upload-icon {
          color: var(--accent-secondary);
        }

        .upload-prompt h3 {
          color: var(--text-primary);
          margin: 0;
          font-size: 1.25rem;
        }

        .upload-prompt p {
          color: var(--text-secondary);
          margin: 0;
          font-size: 0.9rem;
        }

        .processing-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          color: var(--success-color);
          font-weight: 600;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(16, 185, 129, 0.1);
          border-top-color: var(--success-color);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default UploadSection;
