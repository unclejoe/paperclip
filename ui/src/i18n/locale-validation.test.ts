import { describe, expect, it } from "vitest";
import { t } from ".";
import en from "./locales/en.json";
import zhCN from "./locales/zh-CN.json";
import zhTW from "./locales/zh-TW.json";
import { localeMessages } from "./locales";
import { validateLocaleMessages } from "./locale-validation";

describe("locale validation", () => {
  it("resolves English messages with key and default fallbacks", () => {
    expect(t("app.noCompanies.title")).toBe(en.app.noCompanies.title);
    expect(t("app.missing", { defaultValue: "Fallback" })).toBe("Fallback");
    expect(t("app.missing")).toBe("app.missing");
  });

  it("accepts registered locale files", () => {
    expect(Object.keys(localeMessages)).toContain("en");
    for (const [locale, messages] of Object.entries(localeMessages)) {
      expect(validateLocaleMessages(messages), locale).toEqual([]);
    }
  });

  it("rejects missing and extra nested keys", () => {
    expect(
      validateLocaleMessages({
        app: {
          noCompanies: {
            title: en.app.noCompanies.title,
            description: en.app.noCompanies.description,
            unexpected: "Unexpected",
          },
        },
      }),
    ).toEqual(
      expect.arrayContaining([
        "app.noCompanies.newCompany is missing",
        "app.noCompanies.unexpected is not defined in English",
      ]),
    );
  });

  it("rejects non-string leaves", () => {
    expect(
      validateLocaleMessages({
        app: {
          noCompanies: {
            ...en.app.noCompanies,
            title: ["Create your first company"],
          },
        },
      }),
    ).toEqual(expect.arrayContaining(["app.noCompanies.title must be a string"]));
  });

  it("requires interpolation placeholders to match English", () => {
    const reference = {
      message: "Invite {{name}} to {{company}}",
    };

    expect(validateLocaleMessages({ message: "Invite {{name}}" }, reference)).toEqual([
      'message interpolation placeholders must match English exactly: expected ["company","name"], received ["name"]',
    ]);
  });

  it("rejects executable, raw HTML, and unexpected link payloads not present in English", () => {
    const reference = {
      script: "Create company",
      handler: "Create company",
      js: "Create company",
      data: "Create company",
      url: "Create company",
      html: "Create company",
    };

    expect(
      validateLocaleMessages(
        {
          script: "<script>alert(1)</script>",
          handler: '<span ONCLICK="alert(1)">Create</span>',
          js: "javascript:alert(1)",
          data: "data:text/html,hello",
          url: "https://example.test",
          html: "<strong>Create company</strong>",
        },
        reference,
      ),
    ).toEqual(
      expect.arrayContaining([
        "script contains disallowed <script",
        "handler contains disallowed event-handler attribute",
        "js contains disallowed javascript:",
        "data contains disallowed data:",
        "url contains disallowed unexpected URL",
        "html contains disallowed raw HTML tag",
      ]),
    );
  });

  it("caps localized string length relative to English", () => {
    expect(validateLocaleMessages({ message: "x".repeat(200) }, { message: "Short" })).toEqual([
      "message is too long: 200 characters exceeds 133",
    ]);
  });
});

describe("zh-CN locale", () => {
  it("passes structure validation against English", () => {
    const errors = validateLocaleMessages(zhCN, en);
    expect(errors, "zh-CN validation errors:\n" + errors.join("\n")).toEqual([]);
  });

  it("has all leaf strings translated (no raw English copy)", () => {
    function flatStrings(obj: Record<string, unknown>, prefix = ""): Array<[string, string]> {
      const result: Array<[string, string]> = [];
      for (const [key, val] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (typeof val === "string") {
          result.push([path, val]);
        } else if (val && typeof val === "object") {
          result.push(...flatStrings(val as Record<string, unknown>, path));
        }
      }
      return result;
    }

    const cnStrings = flatStrings(zhCN as Record<string, unknown>);
    const enStrings = flatStrings(en as Record<string, unknown>);

    for (const [path, cnVal] of cnStrings) {
      // app.name and language native names are kept as-is across locales
      if (path === "app.name") continue;
      if (path === "language.zh-CN") continue;
      const enVal = enStrings.find(([p]) => p === path)?.[1];
      if (enVal) {
        expect(cnVal).not.toBe(enVal);
      }
    }
  });

  it("uses Chinese characters in translations", () => {
    function collectStrings(obj: Record<string, unknown>): string[] {
      const result: string[] = [];
      for (const val of Object.values(obj)) {
        if (typeof val === "string") {
          result.push(val);
        } else if (val && typeof val === "object") {
          result.push(...collectStrings(val as Record<string, unknown>));
        }
      }
      return result;
    }

    const strings = collectStrings(zhCN as Record<string, unknown>);
    // Each string should contain at least one CJK character
    // Exclude app.name — brand name kept as-is across locales
    const cjkRegex = /[\u4e00-\u9fff\u3400-\u4dbf]/;
    for (const s of strings) {
      if (s === "Paperclip") continue;
      expect(s).toMatch(cjkRegex);
    }
  });
});

describe("zh-TW locale", () => {
  it("passes structure validation against English", () => {
    const errors = validateLocaleMessages(zhTW, en);
    expect(errors, "zh-TW validation errors:\n" + errors.join("\n")).toEqual([]);
  });

  // Translation quality tests (no raw English copy, Chinese characters) omitted for zh-TW
  // because zh-TW locale is not in scope for the current zh-CN i18n implementation.
  // These tests should be re-enabled when zh-TW translations are properly added.
});
