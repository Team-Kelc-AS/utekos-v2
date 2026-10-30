import assert from "node:assert/strict";
import test from "node:test";
import {
  preferenceSchema,
  preferenceWriteSchema,
  storedPreferenceSchema,
  emptyPreferences,
} from "../src/lib/klarna/preferences";

test("Camping and Bobil are independent saved values; six current interests are supported", () => {
  assert.deepEqual(
    preferenceSchema.parse({
      ...emptyPreferences,
      interests: ["camping", "bobil", "hytte", "terrasse", "glamping", "annet"],
    }).interests,
    ["camping", "bobil", "hytte", "terrasse", "glamping", "annet"],
  );
  assert.equal(
    preferenceSchema.safeParse({
      ...emptyPreferences,
      interests: ["camping-og-bobil"],
    }).success,
    false,
  );
});
test("reading a former combined category never silently assigns either new interest", () => {
  assert.deepEqual(
    storedPreferenceSchema.parse({
      ...emptyPreferences,
      interests: ["camping-og-bobil", "hytte"],
    }).interests,
    ["hytte"],
  );
});

test("older open forms retain their combined value at the server boundary", () => {
  assert.deepEqual(
    preferenceWriteSchema.parse({
      ...emptyPreferences,
      interests: ["camping-og-bobil"],
    }).interests,
    ["camping-og-bobil"],
  );
});
