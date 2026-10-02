export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
};

export const isValidMobile = (mobile) => {
  return /^[6-9]\d{9}$/.test(String(mobile).trim());
};

export const isNonEmptyString = (value) => {
  return typeof value === "string" && value.trim().length > 0;
};
