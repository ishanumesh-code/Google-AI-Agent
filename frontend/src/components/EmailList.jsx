import React, { useState } from 'react';

function parseSender(fromStr = '') {
  const match = fromStr.match(/^(.*?)\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].replace(/^["']|["']$/g, ''), email: match[2] };
  }
  return { name: fromStr || 'Unknown Sender', email: fromStr };
}

function getInitials(name = '') {
  const clean = name.replace(/[^a-zA-Z\s]/g, '').trim();
  if (!clean) return '✉️';
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function EmailList({ messages, selectedId, onSelectEmail }) {
  const [searchQuery, setSearchQuery] = useState('');

  const messageEntries = Object.entries(messages || {});

  const filteredEntries = messageEntries.filter(([id, email]) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const subject = (email.header?.subject || '').toLowerCase();
    const from = (email.header?.efrom || '').toLowerCase();
    const to = (email.header?.to || '').toLowerCase();
    return subject.includes(q) || from.includes(q) || to.includes(q);
  });

  return (
    <div className="email-list-panel">
      <div className="email-list-header">
        <div className="search-input-wrapper">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search subject, sender..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>
        <div className="list-count-badge">
          {filteredEntries.length} {filteredEntries.length === 1 ? 'email' : 'emails'}
        </div>
      </div>

      <div className="email-items-container">
        {filteredEntries.length === 0 ? (
          <div className="no-emails-placeholder">
            <p className="no-emails-icon">📭</p>
            <p className="no-emails-text">
              {searchQuery ? 'No emails match your search' : 'No emails found for today'}
            </p>
            {searchQuery && (
              <button className="btn-link" onClick={() => setSearchQuery('')}>
                Clear filter
              </button>
            )}
          </div>
        ) : (
          filteredEntries.map(([id, email]) => {
            const sender = parseSender(email.header?.efrom);
            const isSelected = id === selectedId;
            const attachmentsCount = email.data?.attachments?.length || 0;
            const subject = email.header?.subject || '(No Subject)';

            return (
              <div
                key={id}
                className={`email-item-card ${isSelected ? 'active' : ''}`}
                onClick={() => onSelectEmail(id)}
              >
                <div className="email-item-avatar">
                  {getInitials(sender.name)}
                </div>

                <div className="email-item-content">
                  <div className="email-item-top">
                    <span className="email-sender-name" title={sender.email}>
                      {sender.name || sender.email}
                    </span>
                    {attachmentsCount > 0 && (
                      <span className="attachment-indicator" title={`${attachmentsCount} attachment(s)`}>
                        📎 {attachmentsCount}
                      </span>
                    )}
                  </div>

                  <div className="email-item-subject" title={subject}>
                    {subject}
                  </div>

                  <div className="email-item-preview">
                    {email.data?.message ? (
                      email.data.message.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim().slice(0, 75) + '...'
                    ) : (
                      <span className="empty-snippet-text">(No text preview)</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
