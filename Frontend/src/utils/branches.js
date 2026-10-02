export const BRANCHES = [
  { value: "MAMTA_NAMKEEN", label: "Mamta Namkeen" },
  { value: "BHOLARAM", label: "Bholaram" },
];

export const getBranchLabel = (value) =>
  BRANCHES.find((b) => b.value === value)?.label || value;

export const SLOTS = [
  { value: "MORNING", label: "Morning" },
  { value: "EVENING", label: "Evening" },
];

export const getSlotLabel = (value) =>
  SLOTS.find((s) => s.value === value)?.label || value;

export const PAYMENT_STATUSES = ["SUBMITTED", "VERIFIED", "REJECTED"];
