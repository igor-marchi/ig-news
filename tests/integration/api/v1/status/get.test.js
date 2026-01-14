test(" GET to /api/v1/status should return status OK", async () => {
  const response = await fetch("http://localhost:3000/api/v1/status");
  expect(response.status).toBe(200);

  const data = await response.json();
  expect(data.updated_at).toBeDefined();

  const parsedUpdatedAt = new Date(data.updated_at).toISOString();
  expect(data.updated_at).toBe(parsedUpdatedAt);

  expect(data.dependencies.database.version).toBe("16.0");
  expect(data.dependencies.database.max_connections).toBe(100);
  expect(data.dependencies.database.opened_connections).toBe(1);
});
