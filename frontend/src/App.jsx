import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import AuthStep from './components/AuthStep';
import FetchingStep from './components/FetchingStep';
import EmailList from './components/EmailList';
import EmailViewer from './components/EmailViewer';
import ClassroomView from './components/ClassroomView';
import ChatView from './components/ChatView';
import { checkAuthStatus } from './api';

/**
 * App
 *
 * Layout (post-auth):
 *   ┌──────────────────────────────────────────┐
 *   │  Navbar (top bar, logo + re-auth)        │
 *   ├──────────┬───────────────────────────────┤
 *   │ Sidebar  │  Main area                    │
 *   │ Chat     │  activeTab controls what shows│
 *   │ Gmail    │                               │
 *   │ Classroom│                               │
 *   └──────────┴───────────────────────────────┘
 *
 * activeTab: 'chat' | 'gmail' | 'classroom'
 * Default tab after auth: 'chat'
 */
export default function App() {
  const [step, setStep] = useState('CHECKING');
  const [messages, setMessages] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');

  // Popup OAuth handler
  useEffect(() => {
    if (window.opener && window.opener !== window) {
      try {
        window.opener.postMessage({ type: 'GOOGLE_AUTH_COMPLETE' }, '*');
        setTimeout(() => window.close(), 300);
      } catch (e) {
        console.warn('Could not postMessage to opener:', e);
      }
    }
  }, []);

  // Check auth on mount
  useEffect(() => {
    let mounted = true;

    async function verifyInitialAuth() {
      try {
        const { isAuthorized, data } = await checkAuthStatus();
        if (!mounted) return;
        if (isAuthorized) {
          setMessages(data || {});
          setSelectedId(Object.keys(data || {})[0] || null);
          setStep('MESSAGES');
        } else {
          setStep('AUTH');
        }
      } catch {
        if (mounted) setStep('AUTH');
      }
    }

    verifyInitialAuth();

    const handleMessage = (event) => {
      if (event.data?.type === 'GOOGLE_AUTH_COMPLETE') setStep('FETCHING');
    };
    window.addEventListener('message', handleMessage);
    return () => {
      mounted = false;
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleAuthSuccess = (initialData) => {
    if (initialData && Object.keys(initialData).length > 0) {
      setMessages(initialData);
      setSelectedId(Object.keys(initialData)[0] || null);
      setStep('MESSAGES');
    } else {
      setStep('FETCHING');
    }
  };

  const handleMessagesFetched = (fetchedData) => {
    setMessages(fetchedData || {});
    const ids = Object.keys(fetchedData || {});
    setSelectedId((prev) => (prev && ids.includes(prev) ? prev : ids[0] || null));
    setStep('MESSAGES');
  };

  const handleRefresh = () => setStep('FETCHING');
  const handleReauthorize = () => setStep('AUTH');
  const isAuthed = step === 'MESSAGES';

  return (
    <div className="app-root">
      {/* Top navbar — minimal when authed (just logo + api badge via sidebar) */}
      {!isAuthed && (
        <Navbar
          currentStep={step === 'CHECKING' ? 'AUTH' : step}
          onRefresh={handleRefresh}
          onReauthorize={handleReauthorize}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isAuthed={false}
        />
      )}

      <div className={`app-body${isAuthed ? ' with-sidebar' : ''}`}>
        {/* Left sidebar — only when authenticated */}
        {isAuthed && (
          <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onRefresh={handleRefresh}
            onReauthorize={handleReauthorize}
          />
        )}

        {/* Main content area */}
        <main className="app-main-content">
          {/* Pre-auth states */}
          {step === 'CHECKING' && (
            <div className="loading-initial">
              <div className="spinner-lg" />
              <p>Checking Google connection...</p>
            </div>
          )}

          {step === 'AUTH' && (
            <AuthStep onAuthSuccess={handleAuthSuccess} />
          )}

          {step === 'FETCHING' && (
            <FetchingStep
              onMessagesFetched={handleMessagesFetched}
              onResetAuth={handleReauthorize}
            />
          )}

          {/* Post-auth tabs */}
          {isAuthed && activeTab === 'chat' && (
            <ChatView />
          )}

          {isAuthed && activeTab === 'gmail' && (
            <div className="messages-workspace">
              <EmailList
                messages={messages}
                selectedId={selectedId}
                onSelectEmail={(id) => setSelectedId(id)}
              />
              <EmailViewer
                email={selectedId ? messages[selectedId] : null}
                messageId={selectedId}
              />
            </div>
          )}

          {isAuthed && activeTab === 'classroom' && (
            <ClassroomView />
          )}
        </main>
      </div>
    </div>
  );
}
