import assert from "node:assert/strict";
import test from "node:test";

import { normalizeUsername, validateUsername } from "@/lib/validations/username";

test("normalizeUsername trims whitespace and lowercases", () => {
  assert.equal(normalizeUsername("  LinkID-User  "), "linkid-user");
});

test("validateUsername accepts mixed case input after normalization", () => {
  assert.equal(validateUsername("LinkID-User").valid, true);
  assert.equal(validateUsername("  LINKID-USER  ").valid, true);
});