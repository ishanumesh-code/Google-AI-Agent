import React, { useState, useEffect } from 'react';
import { fetchCourses, fetchCoursework } from '../api';
import CourseList from './CourseList';
import AssignmentList from './AssignmentList';

/**
 * ClassroomView
 *
 * Top-level Classroom tab. Fetches courses + all coursework on mount.
 * Manages selected course. Passes data down to CourseList and AssignmentList.
 */
export default function ClassroomView() {
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [error, setError] = useState(null);

  // { courseId: courseName }
  const [courses, setCourses] = useState({});
  // { courseName: [ assignment, ... ] }
  const [coursework, setCoursework] = useState({});

  const [selectedCourseId, setSelectedCourseId] = useState(null);

  useEffect(() => {
    let mounted = true;
    setStatus('loading');

    async function load() {
      try {
        const [coursesData, courseworkData] = await Promise.all([
          fetchCourses(),
          fetchCoursework(),
        ]);
        if (!mounted) return;
        setCourses(coursesData);
        setCoursework(courseworkData);

        // Auto-select first course
        const firstId = Object.keys(coursesData)[0] || null;
        setSelectedCourseId(firstId);
        setStatus('ready');
      } catch (err) {
        if (!mounted) return;
        setError(err.message);
        setStatus('error');
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  const handleRefresh = () => {
    setStatus('loading');
    setError(null);
    setCourses({});
    setCoursework({});
    setSelectedCourseId(null);
    // Re-trigger the effect by toggling a dummy key — simplest approach is
    // to just call load() inline.
    async function reload() {
      try {
        const [coursesData, courseworkData] = await Promise.all([
          fetchCourses(),
          fetchCoursework(),
        ]);
        setCourses(coursesData);
        setCoursework(courseworkData);
        setSelectedCourseId(Object.keys(coursesData)[0] || null);
        setStatus('ready');
      } catch (err) {
        setError(err.message);
        setStatus('error');
      }
    }
    reload();
  };

  // ── Loading state ──────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="classroom-loading">
        <div className="spinner-lg" />
        <p>Loading Google Classroom courses and assignments…</p>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────
  if (status === 'error') {
    const isAuthError = error && (error.includes('401') || error.includes('Not authorized') || error.includes('credentials'));
    return (
      <div className="classroom-error">
        <div className="empty-mailbox-graphic">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        {isAuthError ? (
          <>
            <h3>Authorization needed</h3>
            <p className="error-detail">
              The backend does not have valid credentials yet — or the Classroom scopes are missing.
            </p>
            <p className="error-hint">
              Click <strong>🔑 Re-auth</strong> in the navbar to sign in again and grant Classroom + Drive permissions.
            </p>
          </>
        ) : (
          <>
            <h3>Failed to load Classroom data</h3>
            <p className="error-detail">{error}</p>
            <p className="error-hint">
              Make sure the backend has the correct scopes:<br />
              <code>classroom.courses.readonly</code> and <code>classroom.coursework.me.readonly</code>
            </p>
          </>
        )}
        <button className="btn-primary" onClick={handleRefresh}>Try Again</button>
      </div>
    );
  }

  // ── Ready state ────────────────────────────────────────────────────────
  const selectedCourseName = selectedCourseId ? courses[selectedCourseId] : null;
  const selectedAssignments = selectedCourseName ? (coursework[selectedCourseName] || []) : [];

  return (
    <div className="classroom-workspace">
      <CourseList
        courses={courses}
        selectedId={selectedCourseId}
        onSelectCourse={setSelectedCourseId}
      />
      <AssignmentList
        courseName={selectedCourseName}
        assignments={selectedAssignments}
      />
    </div>
  );
}
