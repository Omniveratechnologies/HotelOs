import type { IdDocumentItem, FileRef } from "../types/checkIn.types";

export interface CheckInDraft {
  guest: {
    name: string;
    email: string;
    phone: string;
    nationality: string;
  };
  documents: IdDocumentItem[];
  selfie: (FileRef & { previewUrl?: string }) | null;
  signature: { dataUrl: string; ref: FileRef } | null;
  terms: boolean;
  prefs: string[];
  remarks: string;
  savedStep: number;
  isEditing?: boolean;
  timestamp: number;
}

const STORAGE_PREFIX = "hotelos_checkin_draft_";

export function loadCheckInDraft(token: string): CheckInDraft | null {
  if (!token) return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${token}`);
    if (!raw) return null;
    return JSON.parse(raw) as CheckInDraft;
  } catch {
    return null;
  }
}

export function saveCheckInDraft(
  token: string,
  draft: Partial<CheckInDraft>,
): void {
  if (!token) return;
  try {
    const existing = loadCheckInDraft(token) || ({} as Partial<CheckInDraft>);
    const updated = {
      ...existing,
      ...draft,
      timestamp: Date.now(),
    };
    localStorage.setItem(`${STORAGE_PREFIX}${token}`, JSON.stringify(updated));
  } catch {
    // Ignore storage quota or disabled localStorage exceptions
  }
}

export function clearCheckInDraft(token: string): void {
  if (!token) return;
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${token}`);
  } catch {
    // ignore
  }
}
