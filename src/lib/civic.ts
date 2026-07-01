export const CATEGORIES = [
  { value: "pothole", label: "Pothole" },
  { value: "garbage", label: "Garbage / Litter" },
  { value: "streetlight", label: "Streetlight" },
  { value: "water_leak", label: "Water Leak" },
  { value: "sewage", label: "Sewage" },
  { value: "road_damage", label: "Road Damage" },
  { value: "illegal_dumping", label: "Illegal Dumping" },
  { value: "graffiti", label: "Graffiti" },
  { value: "broken_sign", label: "Broken Sign" },
  { value: "flooding", label: "Flooding" },
  { value: "tree_hazard", label: "Tree Hazard" },
  { value: "other", label: "Other" },
] as const;

export const DEPARTMENTS = [
  { value: "public_works", label: "Public Works" },
  { value: "sanitation", label: "Sanitation" },
  { value: "electricity", label: "Electricity" },
  { value: "water", label: "Water & Sewerage" },
  { value: "transportation", label: "Transportation" },
  { value: "parks_recreation", label: "Parks & Recreation" },
  { value: "public_safety", label: "Public Safety" },
  { value: "general", label: "General" },
] as const;

export const SEVERITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
] as const;

export const STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "in_review", label: "In Review" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
] as const;

export type Category = (typeof CATEGORIES)[number]["value"];
export type Department = (typeof DEPARTMENTS)[number]["value"];
export type Severity = (typeof SEVERITIES)[number]["value"];
export type Status = (typeof STATUSES)[number]["value"];

export function severityColor(s: Severity): string {
  switch (s) {
    case "critical": return "bg-destructive text-destructive-foreground";
    case "high": return "bg-warning text-warning-foreground";
    case "medium": return "bg-secondary text-secondary-foreground";
    case "low": return "bg-muted text-muted-foreground";
  }
}
export function statusColor(s: Status): string {
  switch (s) {
    case "resolved": return "bg-success text-success-foreground";
    case "rejected": return "bg-destructive text-destructive-foreground";
    case "in_progress":
    case "assigned":
    case "in_review": return "bg-primary text-primary-foreground";
    case "pending": return "bg-muted text-muted-foreground";
  }
}
export function labelOf<T extends { value: string; label: string }>(list: readonly T[], v: string) {
  return list.find((x) => x.value === v)?.label ?? v;
}
