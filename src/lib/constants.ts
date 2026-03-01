// Reference data per docs/backend.md

export const LOCATIONS = [
  "Red Pharmacy",
  "CSC Pharmacy",
  "Shapiro Pharmacy",
  "Whittier Pharmacy",
  "Green Pharmacy",
  "Speciality Pharmacy",
  "Brooklyn Park Pharmacy",
  "St. Anthony Pharmacy",
  "Richfield Pharmacy",
  "North Loop Pharmacy",
] as const;

export const ROLES = ["Pharmacist"] as const;

export type Location = (typeof LOCATIONS)[number];
export type Role = (typeof ROLES)[number];
