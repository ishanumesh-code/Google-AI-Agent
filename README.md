# Google AI Agent

An AI-powered assistant that integrates Gmail and Google Classroom with a conversational interface.

## Features

- **Gmail integration** — access and work with email data.
- **Google Classroom integration** — retrieve classroom information and assignments.
- **AI chat** — interact with an AI assistant powered by LangGraph.
- **Web interface** — use a React-based frontend connected to a FastAPI backend.

## Tech Stack

- **Frontend:** React, Vite, JavaScript
- **Backend:** Python, FastAPI
- **AI orchestration:** LangGraph, LangChain
- **LLM provider:** Groq
- **Integrations:** Gmail API, Google Classroom API

## Project Structure

```text
Google-AI-Agent/
├── FastAPI/
│   ├── main.py
│   └── router/
│       ├── Classroom/
│       ├── Gmail/
│       ├── agent/
│       └── auth/
├── frontend/
│   └── src/
├── package.json
├── package-lock.json
└── README.md
```

## Prerequisites

- Python
- Node.js and npm
- Google API credentials for the integrations
- A Groq API key

## Configuration

Create a `.env` file in the appropriate backend directory and configure the environment variables required by the application.

Never commit API keys, access tokens, Google credentials, or other secrets to GitHub.

## Running the Project

The exact commands depend on your local configuration.

1. Install the Python dependencies listed in your backend requirements file.
2. Configure the required Google API credentials and environment variables.
3. Install the frontend dependencies using `npm install`.
4. Start the FastAPI backend using your configured server command.
5. Start the frontend using `npm run dev`.

Check the backend and frontend configuration files for the exact startup commands and required environment variables.

## Status

This project is under development.
