import React, { useState } from 'react';
import { getAttachmentUrl } from '../api';

/**
 * AssignmentList
 * Right panel showing all coursework for the selected course.
 *
 * Submission state logic lives entirely in the backend (classroom.py).
 * The API returns:
 *   submitted   : bool  — true if TURNED_IN or RETURNED
 *   late        : bool  — true if submitted after the due date
 *   grade       : number|null — assigned grade if returned
 *   submissionState: string  — raw state from Google
 *
 * The frontend only DISPLAYS these values — no date comparison here.
 */
export default function AssignmentList({ courseName, assignments }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'submitted' | 'pending' | 'due'

  if (!courseName) {
    return (
      <div className="assignment-empty-state">
        <div className="empty-mailbox-graphic">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        </div>
        <h3>No course selected</h3>
        <p>Pick a course from the left to see its assignments.</p>
      </div>
    );
  }

  const list = assignments || [];

  let filtered = list;
  if (filter === 'submitted') filtered = filtered.filter(a => a.submitted);
  if (filter === 'pending')   filtered = filtered.filter(a => !a.submitted);
  if (filter === 'due')       filtered = filtered.filter(a => a.dueDate);
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(a =>
      (a.title || '').toLowerCase().includes(q) ||
      (a.description || '').toLowerCase().includes(q)
    );
  }

  return (
    <div className="assignment-list-panel">
      {/* Header */}
      <div className="assignment-list-header">
        <div className="assignment-header-top">
          <h2 className="assignment-course-name">{courseName}</h2>
          <span className="assignment-count-badge">{filtered.length} / {list.length} assignments</span>
        </div>

        {/* Search + Filter bar */}
        <div className="assignment-toolbar">
          <div className="search-input-wrapper">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search assignments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && <button className="clear-search-btn" onClick={() => setSearch('')}>×</button>}
          </div>
          <div className="filter-tabs">
            {[
              ['all',       'All'],
              ['submitted', 'Submitted'],
              ['pending',   'Pending'],
              ['due',       'Has Due Date'],
            ].map(([val, label]) => (
              <button
                key={val}
                className={`filter-tab-btn${filter === val ? ' active' : ''}`}
                onClick={() => setFilter(val)}
              >{label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Assignment cards */}
      <div className="assignment-cards-container">
        {filtered.length === 0 ? (
          <div className="no-emails-placeholder">
            <p className="no-emails-icon">📭</p>
            <p className="no-emails-text">No assignments found</p>
            {(search || filter !== 'all') && (
              <button className="btn-link" onClick={() => { setSearch(''); setFilter('all'); }}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          filtered.map((assignment) => (
            <AssignmentCard key={assignment.id} assignment={assignment} />
          ))
        )}
      </div>
    </div>
  );
}


function AssignmentCard({ assignment }) {
  const {
    title, description, dueDate, dueTime,
    alternateLink, attachments,
    // ── These come from the backend, no frontend calculation needed ──
    submitted, late, grade, submissionState,
  } = assignment;

  const dueDateStr = formatDueDate(dueDate, dueTime);

  // Determine badge purely from backend-supplied fields
  const statusBadge = getStatusBadge(submitted, late, grade, submissionState, !!dueDate);

  return (
    <div className={`assignment-card${statusBadge.isOverdue ? ' overdue' : ''}${submitted ? ' submitted' : ''}`}>
      {/* Title row */}
      <div className="assignment-card-header">
        <div className="assignment-card-title-row">
          <span className="assignment-icon">{submitted ? '✅' : '📋'}</span>
          <h3 className="assignment-card-title">{title || '(Untitled)'}</h3>
        </div>
        <div className="assignment-card-badges">
          {/* Submission status badge */}
          <span className={`due-badge ${statusBadge.className}`}>
            {statusBadge.icon} {statusBadge.label}
          </span>
          {/* Due date (shown separately if present) */}
          {dueDateStr && (
            <span className="due-badge due-date-badge">
              📅 {dueDateStr}
            </span>
          )}
          {/* Grade badge */}
          {grade != null && (
            <span className="due-badge grade-badge">
              🏅 {grade} pts
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {description && (
        <p className="assignment-description">{description}</p>
      )}

      {/* Attachments — normalized by the backend into {type, id, title, url} */}
      {attachments && attachments.length > 0 && (
        <div className="assignment-materials">
          <span className="materials-label">📎 Materials:</span>
          <div className="materials-list">
            {attachments.map((att, idx) => {
              if (att.type === 'drive') {
                return (
                  <a
                    key={idx}
                    href={getAttachmentUrl(att.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="material-chip drive"
                    title={`Stream via backend: ${att.title}`}
                  >
                    📄 {att.title}
                  </a>
                );
              }
              return (
                <a
                  key={idx}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`material-chip ${att.type}`}
                >
                  {att.type === 'youtube' ? '▶️' : att.type === 'form' ? '📝' : '🔗'} {att.title}
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="assignment-card-footer">
        {alternateLink && (
          <a
            href={alternateLink}
            target="_blank"
            rel="noopener noreferrer"
            className="open-in-classroom-btn"
          >
            Open in Google Classroom ↗
          </a>
        )}
      </div>
    </div>
  );
}


/**
 * Returns display info for the status badge.
 * All logic is derived from backend-supplied fields — no date math here.
 *
 * Backend provides:
 *   submitted  : TURNED_IN or RETURNED
 *   late       : true if Google marked submission as late
 *   grade      : numeric grade if returned by teacher
 *   submissionState: raw string (NEW, CREATED, TURNED_IN, RETURNED, RECLAIMED_BY_STUDENT)
 */
function getStatusBadge(submitted, late, grade, submissionState, hasDueDate) {
  if (submissionState === 'RETURNED' && grade != null) {
    return { label: 'Graded', icon: '🏅', className: 'graded', isOverdue: false };
  }
  if (submissionState === 'RETURNED') {
    return { label: 'Returned', icon: '↩️', className: 'returned', isOverdue: false };
  }
  if (submitted && late) {
    return { label: 'Submitted (late)', icon: '⚠️', className: 'late', isOverdue: false };
  }
  if (submitted) {
    return { label: 'Submitted', icon: '✅', className: 'submitted-badge', isOverdue: false };
  }
  // Not submitted — backend's `late` field also covers overdue-and-not-submitted
  if (late) {
    return { label: 'Overdue', icon: '⚠️', className: 'overdue-badge', isOverdue: true };
  }
  if (!hasDueDate) {
    return { label: 'Assigned', icon: '📋', className: 'assigned', isOverdue: false };
  }
  return { label: 'Pending', icon: '🕐', className: 'pending', isOverdue: false };
}


function formatDueDate(dueDate, dueTime) {
  if (!dueDate) return null;
  const { year, month, day } = dueDate;
  // Google Classroom due times are in UTC
  const hour = dueTime?.hours ?? 0;
  const minute = dueTime?.minutes ?? 0;
  const d = new Date(Date.UTC(year, month - 1, day, hour, minute));
  return d.toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
    timeZone: 'Asia/Kolkata',
  });
}
