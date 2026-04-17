"""
Vercel Serverless Entry Point — Drona AI Backend.

Vercel looks for Python files inside an `api/` directory.
This file imports the Flask `app` object from the parent directory (backend/app.py)
and exposes it as a Vercel-compatible WSGI handler.
"""
import sys
import os

# Add the backend/ folder (parent of api/) to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app import app
