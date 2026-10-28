export const API_BASE = 'http://localhost:8000';

/** Returns the Google OAuth authorization URL */
export function getAuthUrl() {
  return `${API_BASE}/auth`;
}

/**
 * Tests if the backend currently has valid Google OAuth credentials.
 * Calls /gmail/messages — if it succeeds (or fails with the known
 * "no emails today" KeyError), credentials are valid.
 */
export async function checkAuthStatus() {
  try {
    const res = await fetch(`${API_BASE}/gmail/messages`);
    if (res.ok) {
      const data = await res.json();
      return { isAuthorized: true, data };
    }
    const errorText = await res.text();
    if (errorText.includes("'messages'") || errorText.includes("KeyError")) {
      return { isAuthorized: true, data: {} };
    }
    return { isAuthorized: false, data: null, error: errorText };
  } catch (err) {
    return { isAuthorized: false, error: err.message };
  }
}

/** Fetches all Gmail messages for today */
export async function fetchGmailMessages() {
  const res = await fetch(`${API_BASE}/gmail/messages`);
  if (!res.ok) {
    const errorText = await res.text();
    if (errorText.includes("'messages'") || errorText.includes("KeyError")) {
      return {};
    }
    throw new Error(`Failed to fetch messages (${res.status}): ${errorText || res.statusText}`);
  }
  return await res.json();
}

/**
 * Fetches attachment data for a given Gmail message.
 * POST /gmail/attachments
 * Body: { message_id, attachments_list: [{id, mimeType}, ...] }
 * Returns: [{data: base64string, mimeType: string}, ...]
 */
export async function fetchAttachments(messageId, attachmentsList) {
  const res = await fetch(`${API_BASE}/gmail/attachments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message_id: messageId,
      attachments_list: attachmentsList,
    }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch attachments (${res.status}): ${errorText || res.statusText}`);
  }
  return await res.json();
}

/**
 * Decodes a Gmail base64url attachment blob and triggers a browser download.
 * Gmail uses base64url encoding (- and _ instead of + and /).
 */
export function downloadAttachment(base64Data, mimeType, filename) {
  const fixed = base64Data.replace(/-/g, '+').replace(/_/g, '/');
  const byteChars = atob(fixed);
  const byteArray = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
  const blob = new Blob([byteArray], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Creates an object URL for previewing an attachment inline.
 * Caller is responsible for revoking the URL when done.
 */
export function createPreviewUrl(base64Data, mimeType) {
  const fixed = base64Data.replace(/-/g, '+').replace(/_/g, '/');
  const byteChars = atob(fixed);
  const byteArray = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
  const blob = new Blob([byteArray], { type: mimeType });
  return URL.createObjectURL(blob);
}

/** Maps common MIME types to file extensions */
export function mimeToExtension(mimeType = '') {
  const map = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif',
    'image/webp': 'webp', 'image/svg+xml': 'svg',
    'text/plain': 'txt', 'text/html': 'html', 'text/csv': 'csv',
    'application/zip': 'zip', 'application/json': 'json',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  };
  return map[mimeType] || 'bin';
}

// ─────────────────────────────────────────────────────────────────────────────
// CLASSROOM API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches all Google Classroom courses.
 * GET /classroom/courses
 * Returns: { courseId: courseName, ... }
 */
export async function fetchCourses() {
  const res = await fetch(`${API_BASE}/classroom/courses`);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to fetch courses (${res.status}): ${err}`);
  }
  return await res.json();
}

/**
 * Fetches all coursework for all courses.
 * GET /classroom/coursework
 * Returns: { courseName: [ { id, courseId, title, description, dueDate, dueTime, alternateLink, materials }, ... ] }
 */
export async function fetchCoursework() {
  const res = await fetch(`${API_BASE}/classroom/coursework`);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to fetch coursework (${res.status}): ${err}`);
  }
  return await res.json();
}

/**
 * Returns the direct streaming URL for a Classroom Drive attachment.
 * The backend streams the file (exporting Google Docs → PDF).
 * GET /classroom/coursework/attachment/{file_id}
 *
 * Used as an <a href> or window.open() — the browser handles download/preview.
 */
export function getAttachmentUrl(fileId) {
  return `${API_BASE}/classroom/coursework/attachment/${fileId}`;
}

/**
 * Sends a chat message to the LangGraph agent.
 * POST /chat
 * Body: { message: string, history: [{role, content}, ...] }
 * Returns: the AI reply string
 */
export async function sendChatMessage(message, history = []) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Chat error (${res.status}): ${err}`);
  }
  const data = await res.json();
  return data.reply;
}
