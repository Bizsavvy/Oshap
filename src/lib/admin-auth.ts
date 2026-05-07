export function validateAdminPin(request: Request): boolean {
  const pin = request.headers.get("x-admin-pin");
  const expected = process.env.ADMIN_PIN || "0000";
  return pin === expected;
}

export function validateAdminResponse(): Response {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
