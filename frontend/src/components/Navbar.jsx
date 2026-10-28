import React from 'react';

/**
 * Navbar
 *
 * Shows:
 *  - Left: app logo + name
 *  - Center: either the auth flow stepper (pre-auth) or Gmail/Classroom tabs (post-auth)
 *  - Right: Refresh / Re-auth buttons + API badge
 */
export default function Navbar({
  currentStep,
  onRefresh,
  onReauthorize,
  activeTab,
  onTabChange,
  isAuthed,
}) {
  const steps = [
    { id: 'AUTH', label: 'Authorize' },
    { id: 'FETCHING', label: 'Fetch Emails' },
    { id: 'MESSAGES', label: 'View' },
  ];

  const getStepIndex = (step) => {
    switch (step) {
      case 'AUTH': return 0;
      case 'FETCHING': return 1;
      case 'MESSAGES': return 2;
      default: return 0;
    }
  };
  const currentIndex = getStepIndex(currentStep);

  return (
    <header className="app-navbar">
      {/* Logo */}
      <div className="nav-left">
        <div className="nav-logo">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          <span className="nav-title">Google Workspace</span>
        </div>
      </div>

      {/* Center — stepper or tab switcher */}
      <div className="nav-center">
        {isAuthed ? (
          /* Tab switcher — shown when the user is authenticated */
          <div className="nav-tabs">
            <button
              className={`nav-tab-btn${activeTab === 'gmail' ? ' active' : ''}`}
              onClick={() => onTabChange('gmail')}
            >
              ✉️ Gmail
            </button>
            <button
              className={`nav-tab-btn${activeTab === 'classroom' ? ' active' : ''}`}
              onClick={() => onTabChange('classroom')}
            >
              🎓 Classroom
            </button>
          </div>
        ) : (
          /* Auth flow stepper — shown during auth */
          <div className="flow-stepper">
            {steps.map((st, idx) => {
              const isCompleted = idx < currentIndex;
              const isCurrent = idx === currentIndex;
              return (
                <div
                  key={st.id}
                  className={`stepper-step${isCurrent ? ' active' : ''}${isCompleted ? ' completed' : ''}`}
                >
                  <span className="step-dot">{isCompleted ? '✓' : idx + 1}</span>
                  <span className="step-text">{st.label}</span>
                  {idx < steps.length - 1 && <span className="step-arrow">→</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right — action buttons */}
      <div className="nav-right">
        {isAuthed && (
          <>
            {activeTab === 'gmail' && (
              <button className="nav-btn nav-refresh-btn" onClick={onRefresh} title="Re-fetch today's emails">
                🔄 Refresh
              </button>
            )}
            <button className="nav-btn nav-auth-btn" onClick={onReauthorize} title="Re-authenticate with Google">
              🔑 Re-auth
            </button>
          </>
        )}
        <div className="api-badge" title="FastAPI backend">
          <span className="status-indicator-dot online" />
          <span>FastAPI :8000</span>
        </div>
      </div>
    </header>
  );
}
