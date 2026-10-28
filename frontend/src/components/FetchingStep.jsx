import React, { useEffect, useState } from 'react';
import { fetchGmailMessages } from '../api';

export default function FetchingStep({ onMessagesFetched, onResetAuth }) {
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setError(null);

    const load = async () => {
      try {
        const data = await fetchGmailMessages();
        if (isMounted) {
          onMessagesFetched(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to retrieve messages from Gmail');
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [retryCount]);

  return (
    <div className="fetching-step-wrapper">
      <div className="fetching-card">
        <div className="auth-badge">Step 2 of 3</div>

        {!error ? (
          <>
            <div className="fetching-spinner-container">
              <div className="envelope-pulse">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </div>
              <div className="pulse-ring"></div>
            </div>

            <h3 className="fetching-title">Retrieving Today's Emails...</h3>
            <p className="fetching-subtitle">
              Querying Gmail service with <code>after:today before:tomorrow</code> and parsing HTML bodies...
            </p>
          </>
        ) : (
          <div className="fetching-error-state">
            <div className="error-icon-large">❌</div>
            <h3 className="fetching-title">Error Fetching Messages</h3>
            <p className="fetching-error-msg">{error}</p>
            <div className="fetching-error-actions">
              <button 
                className="btn-primary" 
                onClick={() => setRetryCount((c) => c + 1)}
              >
                🔄 Try Again
              </button>
              <button 
                className="btn-secondary" 
                onClick={onResetAuth}
              >
                Re-authorize Google
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
