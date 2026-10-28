import React, { useState, useEffect, useRef } from 'react';
import { getAuthUrl, checkAuthStatus } from '../api';

export default function AuthStep({ onAuthSuccess }) {
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState(null);
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'GOOGLE_AUTH_COMPLETE') {
        setStatusMessage('Authorization confirmed! Retrieving emails...');
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setTimeout(() => {
          onAuthSuccess();
        }, 500);
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleStartAuth = () => {
    setError(null);
    setIsAuthorizing(true);
    setStatusMessage('Opening Google authorization window...');

    const authUrl = getAuthUrl();
    const width = 550;
    const height = 650;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      authUrl,
      'googleOAuth',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,status=no`
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      setStatusMessage('Popup was blocked by your browser. Use the direct link below.');
      return;
    }

    setStatusMessage('Waiting for Google authorization to complete in popup...');

    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const { isAuthorized, data } = await checkAuthStatus();
        if (isAuthorized) {
          clearInterval(pollIntervalRef.current);
          if (!popup.closed) popup.close();
          setStatusMessage('Authorization verified! Loading messages...');
          setTimeout(() => {
            onAuthSuccess(data);
          }, 600);
        }
      } catch (err) {
        console.warn('Poll error:', err);
      }
    }, 2000);
  };

  const handleManualCheck = async () => {
    setError(null);
    setStatusMessage('Checking authorization status with backend...');
    try {
      const { isAuthorized, data, error: backendErr } = await checkAuthStatus();
      if (isAuthorized) {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setStatusMessage('Authorization successful! Fetching your emails...');
        setTimeout(() => {
          onAuthSuccess(data);
        }, 500);
      } else {
        setError(
          backendErr 
            ? `Backend responded: ${backendErr}. Make sure login completed and uvicorn was not restarted.` 
            : 'Backend credentials not yet set. Complete Google login in the popup window.'
        );
        setStatusMessage('');
      }
    } catch (err) {
      setError(`Failed to connect to backend: ${err.message}. Is FastAPI running on http://localhost:8000?`);
      setStatusMessage('');
    }
  };

  return (
    <div className="auth-step-wrapper">
      <div className="auth-card">
        <div className="auth-badge">Step 1 of 3</div>
        <div className="google-icon-wrapper">
          <svg width="48" height="48" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.79l7.97-6.2z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
        </div>

        <h2 className="auth-title">Authorize Google Workspace</h2>
        <p className="auth-description">
          Sign in with your Google account to grant read-only access to view today's emails.
        </p>

        <div className="auth-permissions-box">
          <div className="permission-item">
            <span className="permission-check">✓</span>
            <span>Read-only access to Gmail (<code>gmail.readonly</code>)</span>
          </div>
          <div className="permission-item">
            <span className="permission-check">✓</span>
            <span>Direct OAuth 2.0 handled by FastAPI server</span>
          </div>
        </div>

        {error && (
          <div className="error-alert">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {statusMessage && (
          <div className="status-notice">
            <span className="spinner-dot"></span>
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="auth-actions">
          <button 
            className="btn-google-auth" 
            onClick={handleStartAuth}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.92 0 12s.45 3.85 1.24 5.42l4.04-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>{isAuthorizing ? 'Re-open Authorization Popup' : 'Connect with Google'}</span>
          </button>

          <button 
            className="btn-secondary" 
            onClick={handleManualCheck}
          >
            Check Authorization Status
          </button>

          <div style={{ marginTop: '8px', fontSize: '0.82rem' }}>
            <span>Or open directly: </span>
            <a 
              href="http://localhost:8000/auth" 
              style={{ color: '#2563eb', fontWeight: '500' }}
            >
              Sign in via Full-Page Redirect
            </a>
          </div>
        </div>

        <div className="auth-footnote">
          Backend server: <code>http://localhost:8000</code>
        </div>
      </div>
    </div>
  );
}
