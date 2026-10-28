import React, { useState } from 'react';
import HtmlEmailFrame from './HtmlEmailFrame';
import AttachmentPanel from './AttachmentPanel';

/**
 * EmailViewer
 *
 * Right-side panel. Shows the selected email's:
 *  - Subject, From, To, Message-ID metadata
 *  - Clickable attachment chips (click any chip to open the AttachmentPanel)
 *  - Email body via HtmlEmailFrame (sandboxed iframe) or raw HTML source
 *  - "Open in Tab" and "Print" action buttons
 */
export default function EmailViewer({ email, messageId }) {
  const [viewMode, setViewMode] = useState('rendered');
  // showAttachments: null = closed, otherwise open
  const [showAttachments, setShowAttachments] = useState(false);

  // Empty state — no email selected
  if (!email) {
    return (
      <div className="email-viewer-empty">
        <div className="empty-mailbox-graphic">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>
        <h3>No message selected</h3>
        <p>Choose an email from the list on the left to view its details and content.</p>
      </div>
    );
  }

  const header = email.header || {};
  const data = email.data || {};
  // attachments: list of {id, mimeType} dicts from backend
  const attachments = data.attachments || [];
  const htmlContent = data.message || '';

  const handleOpenInNewWindow = () => {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(htmlContent);
      win.document.close();
    }
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>${header.subject || 'Email'}</title>
            <style>
              body { font-family: sans-serif; padding: 20px; }
              .hdr { border-bottom: 2px solid #ccc; margin-bottom: 20px; padding-bottom: 10px; }
            </style>
          </head>
          <body>
            <div class="hdr">
              <h2>${header.subject || '(No Subject)'}</h2>
              <p><strong>From:</strong> ${header.efrom || 'Unknown'}</p>
              <p><strong>To:</strong> ${header.to || 'Unknown'}</p>
            </div>
            ${htmlContent}
          </body>
        </html>
      `);
      win.document.close();
      win.focus();
      win.print();
    }
  };

  return (
    <div className="email-viewer-panel">

      {/* ── Email Header Section ──────────────────────────────────── */}
      <div className="email-viewer-header">

        {/* Subject + action buttons */}
        <div className="email-viewer-title-row">
          <h1 className="email-viewer-subject">
            {header.subject || '(No Subject)'}
          </h1>
          <div className="email-viewer-actions">
            <button className="action-btn" onClick={handleOpenInNewWindow} title="Open email in full browser tab">
              ↗ Open in Tab
            </button>
            <button className="action-btn" onClick={handlePrint} title="Print this email">
              🖨️ Print
            </button>
          </div>
        </div>

        {/* Metadata grid */}
        <div className="email-metadata-grid">
          <div className="meta-row">
            <span className="meta-label">From:</span>
            <span className="meta-value sender-highlight">{header.efrom || 'Unknown sender'}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">To:</span>
            <span className="meta-value">{header.to || 'Unknown recipient'}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Message ID:</span>
            <span className="meta-value id-badge"><code>{messageId}</code></span>
          </div>

          {/* Attachment chips — click any to toggle the AttachmentPanel */}
          {attachments.length > 0 && (
            <div className="meta-row attachments-row">
              <span className="meta-label">Attachments:</span>
              <div className="attachments-list">
                {attachments.map((att, idx) => {
                  const mimeType = typeof att === 'string' ? '' : att.mimeType;
                  const ext = mimeType ? mimeType.split('/')[1] : '';
                  return (
                    <button
                      key={idx}
                      className={`attachment-chip clickable${showAttachments ? ' active' : ''}`}
                      onClick={() => setShowAttachments((prev) => !prev)}
                      title={`${mimeType || 'attachment'} — click to view all attachments`}
                    >
                      {getIcon(mimeType)} Attachment #{idx + 1}
                      {ext && <span className="att-mime">· {ext}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* View mode tabs */}
        <div className="view-mode-tabs">
          <button
            className={`tab-btn${viewMode === 'rendered' ? ' active' : ''}`}
            onClick={() => setViewMode('rendered')}
          >
            🎨 Exact HTML View
          </button>
          <button
            className={`tab-btn${viewMode === 'raw' ? ' active' : ''}`}
            onClick={() => setViewMode('raw')}
          >
            &lt;/&gt; Raw HTML Source
          </button>
        </div>
      </div>

      {/* ── Attachment Panel (slide-in below header) ─────────────── */}
      {showAttachments && attachments.length > 0 && (
        <AttachmentPanel
          messageId={messageId}
          attachments={attachments}
          onClose={() => setShowAttachments(false)}
        />
      )}

      {/* ── Email Body ───────────────────────────────────────────── */}
      <div className="email-viewer-body">
        {viewMode === 'rendered' ? (
          <div className="html-email-wrapper">
            <HtmlEmailFrame htmlContent={htmlContent} />
          </div>
        ) : (
          <div className="raw-html-wrapper">
            <pre className="raw-html-code">
              <code>{htmlContent || '<!-- Empty content -->'}</code>
            </pre>
          </div>
        )}
      </div>

    </div>
  );
}

function getIcon(mimeType = '') {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('excel') || mimeType.includes('sheet')) return '📊';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️';
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return '🗜️';
  if (mimeType.startsWith('text/')) return '📃';
  return '📎';
}
