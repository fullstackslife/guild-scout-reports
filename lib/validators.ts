export function isPhoneIdentifier(value: string) {
  return /^\+?[0-9]{7,15}$/.test(value);
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}
