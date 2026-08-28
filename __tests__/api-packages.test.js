/**
 * Tests for app/api/packages/route.js
 * Verifies query routing, JSON field parsing, error handling.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockQuery = vi.fn();
vi.mock("../../../lib/db.js", () => ({ getPool: () => ({ query: mockQuery }) }));
vi.mock("../lib/db.js", () => ({ getPool: () => ({ query: mockQuery }) }));
vi.mock("../../lib/db.js", () => ({ getPool: () => ({ query: mockQuery }) }));

// Mock NextResponse
vi.mock("next/server", () => ({
  NextResponse: {
    json: (data, init) => ({ data, status: init?.status ?? 200, isResponse: true }),
  },
}));

import { GET } from "../../app/api/packages/route.js";

function makeRequest(url = "http://localhost/api/packages") {
  return { url };
}

const sampleRow = {
  id: 1,
  name: "Royal Dinner",
  package_type: "event_menu",
  price_per_person: 3500,
  inclusions: '["Starter","Main","Dessert"]',
  courses: '{"starter":"Soup","main":"Fish"}',
  dessert_options: '["Ice cream","Cake"]',
};

beforeEach(() => vi.clearAllMocks());

describe("GET /api/packages", () => {
  it("returns all packages with no type filter", async () => {
    mockQuery.mockResolvedValueOnce([[sampleRow]]);
    const res = await GET(makeRequest());
    expect(res.data.success).toBe(true);
    expect(res.data.data).toHaveLength(1);
  });

  it("parses inclusions JSON array correctly", async () => {
    mockQuery.mockResolvedValueOnce([[sampleRow]]);
    const res = await GET(makeRequest());
    expect(res.data.data[0].inclusions).toEqual(["Starter", "Main", "Dessert"]);
  });

  it("parses courses JSON object correctly", async () => {
    mockQuery.mockResolvedValueOnce([[sampleRow]]);
    const res = await GET(makeRequest());
    expect(res.data.data[0].courses).toEqual({ starter: "Soup", main: "Fish" });
  });

  it("parses dessert_options JSON array correctly", async () => {
    mockQuery.mockResolvedValueOnce([[sampleRow]]);
    const res = await GET(makeRequest());
    expect(res.data.data[0].dessert_options).toEqual(["Ice cream", "Cake"]);
  });

  it("filters by type=event_menu when valid type provided", async () => {
    mockQuery.mockResolvedValueOnce([[sampleRow]]);
    const res = await GET(makeRequest("http://localhost/api/packages?type=event_menu"));
    // The query should have included the WHERE clause
    const querySql = mockQuery.mock.calls[0][0];
    expect(querySql).toMatch(/package_type/i);
    expect(mockQuery.mock.calls[0][1]).toContain("event_menu");
  });

  it("ignores invalid type filter and returns all", async () => {
    mockQuery.mockResolvedValueOnce([[sampleRow]]);
    const res = await GET(makeRequest("http://localhost/api/packages?type=invalid_type"));
    const querySql = mockQuery.mock.calls[0][0];
    // Should use the unfiltered query (no WHERE package_type)
    expect(querySql).not.toMatch(/package_type/i);
  });

  it("returns fallback values for malformed JSON fields", async () => {
    const malformed = {
      ...sampleRow,
      inclusions: "NOT_JSON",
      courses: "{bad",
      dessert_options: undefined,
    };
    mockQuery.mockResolvedValueOnce([[malformed]]);
    const res = await GET(makeRequest());
    expect(res.data.data[0].inclusions).toEqual([]);
    expect(res.data.data[0].courses).toBeNull();
    expect(res.data.data[0].dessert_options).toEqual([]);
  });

  it("returns 500 on DB error", async () => {
    mockQuery.mockRejectedValueOnce(new Error("DB unreachable"));
    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
    expect(res.data.success).toBe(false);
  });

  it("handles already-parsed JSON objects without re-parsing", async () => {
    const preParsed = {
      ...sampleRow,
      inclusions: ["Already", "Parsed"],
      courses: { main: "Curry" },
      dessert_options: [],
    };
    mockQuery.mockResolvedValueOnce([[preParsed]]);
    const res = await GET(makeRequest());
    expect(res.data.data[0].inclusions).toEqual(["Already", "Parsed"]);
  });
});
