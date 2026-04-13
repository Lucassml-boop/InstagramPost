import test from "node:test";
import assert from "node:assert/strict";
import { getDictionary, isLocale, locales } from "../lib/i18n.ts";

test("supported locales stay stable", () => {
  assert.deepEqual(locales, ["en", "pt-BR"]);
  assert.equal(isLocale("en"), true);
  assert.equal(isLocale("pt-BR"), true);
  assert.equal(isLocale("es"), false);
});

test("content automation labels exist in both dictionaries", () => {
  const en = getDictionary("en");
  const pt = getDictionary("pt-BR");

  assert.equal(Boolean(en.sidebar.contentAutomation), true);
  assert.equal(Boolean(pt.sidebar.contentAutomation), true);
  assert.equal(Boolean(en.contentAutomation.topicsHistoryTitle), true);
  assert.equal(Boolean(pt.contentAutomation.topicsHistoryTitle), true);
  assert.equal(Boolean(en.contentAutomation.clearTopicsHistory), true);
  assert.equal(Boolean(pt.contentAutomation.clearTopicsHistory), true);
});

test("dashboard description remains callable", () => {
  const dictionary = getDictionary("pt-BR");
  const text = dictionary.dashboard.description("user@example.com");

  assert.match(text, /user@example\.com/);
});

test("auth dictionaries expose register and password reset labels", () => {
  const en = getDictionary("en");
  const pt = getDictionary("pt-BR");

  assert.equal(Boolean(en.register.title), true);
  assert.equal(Boolean(pt.register.title), true);
  assert.equal(Boolean(en.forgotPassword.submit), true);
  assert.equal(Boolean(pt.forgotPassword.submit), true);
  assert.equal(Boolean(en.resetPassword.invalidToken), true);
  assert.equal(Boolean(pt.resetPassword.invalidToken), true);
});
