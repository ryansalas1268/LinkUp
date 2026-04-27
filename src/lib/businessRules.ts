// LinkUp business rules — single source of truth for validation (BR001–BR018)
// Keep this aligned with mem://features/business-rules.md

export const BR = {
  USERNAME_MIN: 3,
  USERNAME_MAX: 30,
  PASSWORD_MIN: 8,
  EVENT_TITLE_MAX: 50,
  FREE_EVENTS_PER_MONTH: 1,
} as const;

const USERNAME_RE = /^[a-zA-Z0-9_]+$/;
const PASSWORD_LETTER = /[A-Za-z]/;
const PASSWORD_NUMBER = /[0-9]/;
const PASSWORD_SPECIAL = /[^A-Za-z0-9]/;
const EMAIL_RE = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;

export type Result = { ok: true } | { ok: false; message: string };

// BR001: Username unique (DB enforces unique), here: format + length only
export function validateUsername(username: string): Result {
  const u = username.trim();
  if (!u) return { ok: false, message: "Username is required" };
  if (u.length < BR.USERNAME_MIN || u.length > BR.USERNAME_MAX)
    return { ok: false, message: `Username must be ${BR.USERNAME_MIN}–${BR.USERNAME_MAX} characters` };
  if (!USERNAME_RE.test(u))
    return { ok: false, message: "Username can only use letters, numbers, and underscores" };
  return { ok: true };
}

// BR002: Password ≥8 with letter, number, special char
export function validatePassword(password: string): Result {
  if (password.length < BR.PASSWORD_MIN)
    return { ok: false, message: `Password must be at least ${BR.PASSWORD_MIN} characters` };
  if (!PASSWORD_LETTER.test(password))
    return { ok: false, message: "Password must include at least one letter" };
  if (!PASSWORD_NUMBER.test(password))
    return { ok: false, message: "Password must include at least one number" };
  if (!PASSWORD_SPECIAL.test(password))
    return { ok: false, message: "Password must include at least one special character" };
  return { ok: true };
}

// BR003: Valid email format
export function validateEmail(email: string): Result {
  const e = email.trim();
  if (!e) return { ok: false, message: "Email is required" };
  if (!EMAIL_RE.test(e)) return { ok: false, message: "Enter a valid email address" };
  return { ok: true };
}

// BR010: Event title required, max 50 chars
export function validateEventTitle(title: string): Result {
  const t = title.trim();
  if (!t) return { ok: false, message: "Event name is required" };
  if (t.length > BR.EVENT_TITLE_MAX)
    return { ok: false, message: `Event name must be ${BR.EVENT_TITLE_MAX} characters or fewer` };
  return { ok: true };
}

// BR004: Friendlier login error message
export function friendlyLoginError(raw: string): string {
  if (/invalid login credentials/i.test(raw)) return "Wrong email or password. Please try again.";
  if (/email not confirmed/i.test(raw)) return "Please verify your email before logging in.";
  return raw;
}

// BR016: Task status options
export type TaskStatus = "not_started" | "in_progress" | "completed";
export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
};
