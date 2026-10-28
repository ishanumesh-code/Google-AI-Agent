import React, { useState, useEffect, useRef } from 'react';
import { fetchAttachments, downloadAttachment, createPreviewUrl, mimeToExtension } from '../api';

/**
 * AttachmentPanel
 *
 * Shown below the email header when the user clicks an attachment chip.
 * - Fetches all attachment data from the backend via POST /gmail/attachments
 * - Shows each attachment with a Download button
 * - Images and PDFs also get an inline Preview toggle
 */
export default function AttachmentPanel({ messageId, attachments, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetched, setFetched] = useState([]);
  // Track which attachments are being previewed and their object URLs
  const [previews, setPreviews] = useState({});
  const previewUrls = useRef({});

  useEffect(() => {
    setLoading(true);
    setError(null);
    setFetched([]);
    setPreviews({});

    // Revoke any leftover object URLs from previous email
    Object.values(previewUrls.current).forEach(URL.revokeObjectURL);
    previewUrls.current = {};

    fetchAttachments(messageId, attachments)
      .then((data) => {
        setFetched(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });

    return () => {
      Object.values(previewUrls.current).forEach(URL.revokeObjectURL);
    };
  }, [messageId, JSON.stringify(attachments)]);

  const handleDownload = (att, idx) => {
    const ext = mimeToExtension(att.mimeType);
    downloadAttachment(att.data, att.mimeType, `attachment-${idx + 1}.${ext}`);
  };

  const handleTogglePreview = (idx, att) => {
    if (previews[idx]) {
      // Hide preview — revoke its URL
      URL.revokeObjectURL(previewUrls.current[idx]);
      delete previewUrls.current[idx];
      setPreviews((prev) => { const n = { ...prev }; delete n[idx]; return n; });
    } else {
      // Show preview — create URL once and cache it
      const url = createPreviewUrl(att.data, att.mimeType);
      previewUrls.current[idx] = url;
      setPreviews((prev) => ({ ...prev, [idx]: url }));
    }
  };

  const canPreview = (mimeType = '') =>
    mimeType.startsWith('image/') || mimeType === 'application/pdf';

  return (
    <div className="attachment-panel">
      {/* Panel header */}
      <div className="attachment-panel-header">
        <div className="attachment-panel-title">
          <span>📎</span>
          <span>Attachments ({attachments.length})</span>
        </div>
        <button
          className="attachment-panel-close"
          onClick={onClose}
          title="Close attachments"
        >
          ✕
        </button>
      </div>

      {/* Panel body */}
      <div className="attachment-panel-body">

        {/* Loading state */}
        {loading && (
          <div className="attachment-loading">
            <div className="spinner-sm" />
            <span>Fetching attachments from Gmail…</span>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="attachment-error">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && fetched.length === 0 && (
          <div className="attachment-empty">No attachment data was returned.</div>
        )}

        {/* Attachment list */}
        {!loading && !error && fetched.length > 0 && (
          <div className="attachment-items">
            {fetched.map((att, idx) => {
              const ext = mimeToExtension(att.mimeType);
              const filename = `attachment-${idx + 1}.${ext}`;
              const isPreviewing = !!previews[idx];

              return (
                <div key={idx} className="attachment-item">
                  {/* Row: icon + name/type + action buttons */}
                  <div className="attachment-item-info">
                    <span className="attachment-item-icon">{getIcon(att.mimeType)}</span>
                    <div className="attachment-item-meta">
                      <span className="attachment-item-name">{filename}</span>
                      <span className="attachment-item-type">{att.mimeType || 'unknown'}</span>
                    </div>
                  </div>

                  <div className="attachment-item-actions">
                    {canPreview(att.mimeType) && (
                      <button
                        className={`att-action-btn${isPreviewing ? ' active' : ''}`}
                        onClick={() => handleTogglePreview(idx, att)}
                      >
                        {isPreviewing ? '🙈 Hide' : '👁️ Preview'}
                      </button>
                    )}
                    <button
                      className="att-action-btn download"
                      onClick={() => handleDownload(att, idx)}
                    >
                      ⬇️ Download
                    </button>
                  </div>

                  {/* Inline preview (images & PDFs only) */}
                  {isPreviewing && previews[idx] && (
                    <div className="attachment-preview">
                      {att.mimeType.startsWith('image/') ? (
                        <img
                          src={previews[idx]}
                          alt={filename}
                          className="attachment-preview-image"
                        />
                      ) : att.mimeType === 'application/pdf' ? (
                        <iframe
                          src={previews[idx]}
                          title={filename}
                          className="attachment-preview-pdf"
                        />
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
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
