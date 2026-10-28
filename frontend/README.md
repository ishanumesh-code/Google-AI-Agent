# Gmail Workspace Frontend (React + Vite)

A modern React application built to interface with your FastAPI Google Workspace backend.

## Project Structure

```
frontend/
├── index.html                   # HTML entrypoint with React module link
├── package.json                 # React 18 & Vite configuration
├── vite.config.js               # Vite bundler setup
└── src/
    ├── main.jsx                 # React root render
    ├── App.jsx                  # Main flow state controller (Auth -> Fetch -> Messages)
    ├── api.js                   # Backend API caller (localhost:8000)
    ├── index.css                # Stylesheet
    └── components/
        ├── AuthStep.jsx         # Step 1: Google OAuth initiation & auto-polling
        ├── FetchingStep.jsx     # Step 2: Message retrieval & loading indicators
        ├── EmailList.jsx        # Step 3: Searchable list of today's emails
        ├── EmailViewer.jsx      # Step 3: Full email viewer & actions
        ├── HtmlEmailFrame.jsx   # Isolated iframe for exact HTML email rendering
        └── Navbar.jsx           # Stepper navbar & refresh/re-auth controls
```

## How to Run

1. **Start your FastAPI backend**:
   ```bash
   cd ../FastAPI
   uvicorn main:app --reload --port 8000
   ```

2. **Start the React frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

Vite will serve the React app at `http://localhost:3000`.
