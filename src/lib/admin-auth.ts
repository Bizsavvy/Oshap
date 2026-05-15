export function validateAdminPin(request: Request): boolean {
  const expected = process.env.ADMIN_PIN;
  if (!expected) {
    throw new Error("ADMIN_PIN environment variable is not set");
  }
  const pin = request.headers.get("x-admin-pin");
  return pin === expected;
}

export function validateAdminResponse(): Response {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
