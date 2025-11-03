import type { LitigationCase, LitigationCaseInsert } from "@/hooks/useLitigationCases";

const STORAGE_KEY_PREFIX = "litigation_cases_";

const isBrowser = typeof window !== "undefined";

const getStorageKey = (userId: string) => `${STORAGE_KEY_PREFIX}${userId}`;

const parseCases = (value: string | null): LitigationCase[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => {
        if (typeof item !== "object" || item === null) {
          return null;
        }

        const candidate = item as Partial<LitigationCase>;
        if (
          typeof candidate.id === "string" &&
          typeof candidate.user_id === "string" &&
          typeof candidate.parties === "string" &&
          typeof candidate.forum === "string" &&
          typeof candidate.status === "string" &&
          typeof candidate.created_at === "string" &&
          typeof candidate.updated_at === "string"
        ) {
          return {
            id: candidate.id,
            user_id: candidate.user_id,
            sr_no: candidate.sr_no ?? null,
            parties: candidate.parties,
            forum: candidate.forum,
            particular: candidate.particular ?? null,
            start_date: candidate.start_date ?? null,
            last_hearing_date: candidate.last_hearing_date ?? null,
            next_hearing_date: candidate.next_hearing_date ?? null,
            amount_involved: candidate.amount_involved ?? null,
            treatment_resolution: candidate.treatment_resolution ?? null,
            remarks: candidate.remarks ?? null,
            status: candidate.status,
            created_at: candidate.created_at,
            updated_at: candidate.updated_at,
          } satisfies LitigationCase;
        }

        return null;
      })
      .filter((item): item is LitigationCase => item !== null);
  } catch (error) {
    console.error("Failed to parse local litigation cases:", error);
    return [];
  }
};

export const getLocalLitigationCases = (userId: string): LitigationCase[] => {
  if (!isBrowser) return [];
  const raw = window.localStorage.getItem(getStorageKey(userId));
  return parseCases(raw);
};

const persistCases = (userId: string, cases: LitigationCase[]) => {
  if (!isBrowser) return;
  window.localStorage.setItem(getStorageKey(userId), JSON.stringify(cases));
};

const generateLocalId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `local-${crypto.randomUUID()}`;
  }

  return `local-${Math.random().toString(36).slice(2, 11)}`;
};

const normalizeDate = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
};

export const addLocalLitigationCases = (
  userId: string,
  cases: LitigationCaseInsert[]
): LitigationCase[] => {
  if (!isBrowser) return [];

  const now = new Date().toISOString();
  const existing = getLocalLitigationCases(userId);

  const newCases = cases.map((caseData) => ({
    id: generateLocalId(),
    user_id: userId,
    sr_no: caseData.sr_no ?? null,
    parties: caseData.parties,
    forum: caseData.forum,
    particular: caseData.particular ?? null,
    start_date: normalizeDate(caseData.start_date),
    last_hearing_date: normalizeDate(caseData.last_hearing_date),
    next_hearing_date: normalizeDate(caseData.next_hearing_date),
    amount_involved: caseData.amount_involved ?? null,
    treatment_resolution: caseData.treatment_resolution ?? null,
    remarks: caseData.remarks ?? null,
    status: caseData.status ?? "Active",
    created_at: now,
    updated_at: now,
  } satisfies LitigationCase));

  const updated = [...newCases, ...existing];
  persistCases(userId, updated);
  return newCases;
};

export const removeLocalLitigationCase = (
  userId: string,
  caseId: string
): LitigationCase[] => {
  if (!isBrowser) return [];

  const existing = getLocalLitigationCases(userId);
  const filtered = existing.filter((item) => item.id !== caseId);
  persistCases(userId, filtered);
  return filtered;
};
