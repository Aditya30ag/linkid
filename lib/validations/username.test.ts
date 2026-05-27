import assert from "node:assert/strict";
import test from "node:test";

import { normalizeUsername, validateUsername } from "@/lib/validations/username";

test("normalizeUsername trims whitespace and lowercases", () => {
  assert.equal(normalizeUsername("  LinkID-User  "), "linkid-user");
});

test("validateUsername accepts mixed case input after normalization", () => {
  assert.equal(validateUsername("linkid-user").valid, true);
});

test("validateUsername rejects uppercase usernames", () => {
  assert.equal(validateUsername("LinkID-User").valid, false);
  assert.equal(validateUsername("  LINKID-USER  ").valid, false);
});