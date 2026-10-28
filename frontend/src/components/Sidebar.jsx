import React from 'react';

/**
 * Sidebar
 * Left vertical nav shown after authentication.
 * Items: Chat (default), Gmail, Classroom
 */
export default function Sidebar({ activeTab, onTabChange, onRefresh, onReauthorize }) {
  const items = [
    { id: 'chat',      icon: '💬', label: 'Chat' },
    { id: 'gmail',     icon: '✉️',  label: 'Gmail' },
    { id: 'classroom', icon: '🎓', label: 'Classroom' },
  ];

  return (
    <aside className="app-sidebar">
      <div className="sidebar-logo">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
        <span className="sidebar-logo-text">Workspace</span>
      </div>

      <nav className="sidebar-nav">
        {items.map(({ id, icon, label }) => (
          <button
            key={id}
            className={`sidebar-nav-item${activeTab === id ? ' active' : ''}`}
            onClick={() => onTabChange(id)}
            title={label}
          >
            <span className="sidebar-nav-icon">{icon}</span>
            <span className="sidebar-nav-label">{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        {activeTab === 'gmail' && (
          <button className="sidebar-action-btn" onClick={onRefresh} title="Re-fetch emails">
            🔄
            <span>Refresh</span>
          </button>
        )}
        <button className="sidebar-action-btn" onClick={onReauthorize} title="Re-authenticate">
          🔑
          <span>Re-auth</span>
        </button>
        <div className="sidebar-api-badge">
          <span className="status-indicator-dot online" />
          <span>:8000</span>
        </div>
      </div>
    </aside>
  );
}
