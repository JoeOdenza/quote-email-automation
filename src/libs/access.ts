import "server-only";

// Who may use the app. MICROSOFT_TENANT set to a directory (tenant) ID already
// limits sign-in to that organization, so ALLOWED_EMAILS can be left empty.
// With "common", "consumers" or "organizations" anyone with a Microsoft
// account could sign in, so ALLOWED_EMAILS is required and nobody gets in
// without it.
export function isAllowed(email: string): boolean {
    const allowed = (process.env.ALLOWED_EMAILS ?? "")
        .split(",")
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean);
    if (allowed.length > 0) return allowed.includes(email.trim().toLowerCase());
    const tenant = (process.env.MICROSOFT_TENANT ?? "").toLowerCase();
    return !["common", "consumers", "organizations", ""].includes(tenant);
}
