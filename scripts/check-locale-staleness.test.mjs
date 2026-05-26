import assert from "node:assert/strict";
import test from "node:test";

import { flattenKeys, compareKeys } from "./check-locale-staleness.mjs";

test("flattenKeys extracts flat key paths from nested objects", () => {
  const obj = {
    app: {
      name: "Paperclip",
      noCompanies: {
        title: "Create",
        description: "Get started",
      },
    },
    account: {
      settings: "Settings",
    },
  };

  assert.deepEqual(flattenKeys(obj), [
    "app.name",
    "app.noCompanies.title",
    "app.noCompanies.description",
    "account.settings",
  ]);
});

test("flattenKeys handles empty objects", () => {
  assert.deepEqual(flattenKeys({}), []);
});

test("flattenKeys handles single-level objects", () => {
  assert.deepEqual(flattenKeys({ a: "1", b: "2" }), ["a", "b"]);
});

test("flattenKeys handles mixed types (null, arrays, numbers) as leaf values", () => {
  const obj = {
    a: null,
    b: [1, 2],
    c: 42,
    d: true,
  };
  assert.deepEqual(flattenKeys(obj), ["a", "b", "c", "d"]);
});

test("compareKeys reports no missing or extra keys when identical", () => {
  const ref = { a: { b: "x" }, c: "y" };
  const cand = { a: { b: "z" }, c: "w" };
  const result = compareKeys(ref, cand);
  assert.deepEqual(result, { missing: [], extra: [] });
});

test("compareKeys reports missing keys", () => {
  const ref = { a: "1", b: "2", c: "3" };
  const cand = { a: "1" };
  assert.deepEqual(compareKeys(ref, cand), {
    missing: ["b", "c"],
    extra: [],
  });
});

test("compareKeys reports extra keys", () => {
  const ref = { a: "1" };
  const cand = { a: "1", b: "2" };
  assert.deepEqual(compareKeys(ref, cand), {
    missing: [],
    extra: ["b"],
  });
});

test("compareKeys reports both missing and extra keys with nested structure", () => {
  const ref = { app: { title: "A", desc: "B" }, extra: "X" };
  const cand = { app: { title: "A", extraKey: "Y" } };
  assert.deepEqual(compareKeys(ref, cand), {
    missing: ["app.desc", "extra"],
    extra: ["app.extraKey"],
  });
});
