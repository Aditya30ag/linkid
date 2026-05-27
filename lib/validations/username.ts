export const usernameRegex = /^[a-zA-Z0-9-]+$/;

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function validateUsername(username: string): { valid: boolean; error?: string } {
  const normalizedUsername = normalizeUsername(username);

  if (!normalizedUsername) {
    return { valid: false, error: "Username is required" };
  }
  if (username !== normalizedUsername) {
    return {
      valid: false,
      error: "Username must be lowercase.",
    };
  }
  if (!usernameRegex.test(normalizedUsername)) {
    return {
      valid: false,
      error: "Username can only contain lowercase letters, numbers, and hyphens.",
    };
  }
  if (normalizedUsername.length < 3) {
    return { valid: false, error: "Username must be at least 3 characters" };
  }
  if (normalizedUsername.length > 30) {
    return { valid: false, error: "Username must be at most 30 characters" };
  }
  return { valid: true };
}
