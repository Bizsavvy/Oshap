/**
 * Returns a stable anonymous device token for the current browser tab.
 * Generated once per tab and stored in sessionStorage so each QR scan
 * (new tab / new device) gets its own token.
 */
export function getDeviceToken(): string {
  const KEY = "oshap-device-token";

  if (typeof window === "undefined") return "";

  let token = sessionStorage.getItem(KEY);
  if (!token) {
    token = crypto.randomUUID();
    sessionStorage.setItem(KEY, token);
  }
  return token;
}
