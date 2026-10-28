import React, { useState } from 'react';

/**
 * CourseList
 * Left sidebar listing all Google Classroom courses.
 * Clicking a course selects it and shows its assignments on the right.
 */
export default function CourseList({ courses, selectedId, onSelectCourse }) {
  const [search, setSearch] = useState('');

  // courses: { courseId: courseName, ... }
  const entries = Object.entries(courses || {});
  const filtered = entries.filter(([id, name]) =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="course-list-panel">
      <div className="course-list-header">
        <h2 className="course-list-title">📚 My Courses</h2>
        <div className="search-input-wrapper">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search-btn" onClick={() => setSearch('')}>×</button>
          )}
        </div>
        <div className="list-count-badge">{filtered.length} course{filtered.length !== 1 ? 's' : ''}</div>
      </div>

      <div className="course-items-container">
        {filtered.length === 0 ? (
          <div className="no-emails-placeholder">
            <p className="no-emails-icon">🎓</p>
            <p className="no-emails-text">{search ? 'No courses match your search' : 'No courses found'}</p>
            {search && <button className="btn-link" onClick={() => setSearch('')}>Clear filter</button>}
          </div>
        ) : (
          filtered.map(([id, name]) => (
            <div
              key={id}
              className={`course-item-card${id === selectedId ? ' active' : ''}`}
              onClick={() => onSelectCourse(id)}
            >
              <div className="course-item-avatar">{getInitials(name)}</div>
              <div className="course-item-name" title={name}>{name}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function getInitials(name = '') {
  const clean = name.replace(/[^a-zA-Z\s]/g, '').trim();
  if (!clean) return '📘';
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
