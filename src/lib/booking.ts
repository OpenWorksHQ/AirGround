/**
 * Booking progress lives in sessionStorage so a back button, a page reload, or a
 * detour through sign-in never clears what the customer already entered.
 */

export type BookingMode = "once" | "care";

export type CarePick = { serviceId: string; serviceName: string; frequency: string };

export type BookingDraft = {
  mode: BookingMode;
  stateCode: string;
  address: string;
  zip: string;
  city: string;
  categorySlug: string | null;
  serviceId: string | null;
  serviceName: string | null;
  description: string;
  lotSize: string;
  accessNotes: string;
  requestedDate: string;
  timeWindow: string;
  carePicks: CarePick[];
};

export const emptyDraft = (): BookingDraft => ({
  mode: "once",
  stateCode: "MI",
  address: "",
  zip: "",
  city: "",
  categorySlug: null,
  serviceId: null,
  serviceName: null,
  description: "",
  lotSize: "",
  accessNotes: "",
  requestedDate: "",
  timeWindow: "",
  carePicks: [],
});

const KEY = "airground.booking";

export function loadDraft(): BookingDraft {
  if (typeof window === "undefined") return emptyDraft();
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return emptyDraft();
    return { ...emptyDraft(), ...(JSON.parse(raw) as Partial<BookingDraft>) };
  } catch {
    return emptyDraft();
  }
}

export function saveDraft(draft: BookingDraft) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(KEY, JSON.stringify(draft));
}

export function clearDraft() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(KEY);
}

export const TIME_WINDOWS = ["Morning (8am – 12pm)", "Afternoon (12pm – 4pm)", "Late day (4pm – 7pm)"];

export const FREQUENCIES = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Monthly" },
  { value: "seasonally", label: "Seasonally" },
  { value: "twice_yearly", label: "Twice per year" },
  { value: "yearly", label: "Yearly" },
  { value: "custom", label: "Custom" },
];
