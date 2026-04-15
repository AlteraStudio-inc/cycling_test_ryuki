/** Format a time string (HH:mm:ss or HH:mm) to HH:mm display */
export function fmtTime(raw: string): string {
  if (!raw) return "";
  // "09:00:00" → "09:00", "LAST" stays as-is
  if (raw === "LAST") return "LAST";
  return raw.slice(0, 5);
}
