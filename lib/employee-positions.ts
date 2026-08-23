export const EMPLOYEE_POSITIONS = [
  "Management",
  "Front Office",
  "Food & Beverage",
  "Kitchen",
  "Bakery/Pastry",
  "Bar",
  "Housekeeping",
  "Finance",
  "HR",
  "Store/Procurement",
  "Security",
  "Cleaning",
] as const;

export const OTHER_POSITION = "Other";

export function isKnownEmployeePosition(value?: string | null) {
  return Boolean(value && EMPLOYEE_POSITIONS.includes(value as (typeof EMPLOYEE_POSITIONS)[number]));
}

export function getPositionChoice(value?: string | null) {
  return value && isKnownEmployeePosition(value) ? value : value ? OTHER_POSITION : "";
}
