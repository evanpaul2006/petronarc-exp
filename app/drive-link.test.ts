import { describe, expect, it } from "vitest";
import { labelForLink, normalizeImageLink } from "./drive-link";

const FILE_ID = "1AbCdEfGhIjKlMnOpQrStUvWxYz0123456";
const THUMBNAIL = `https://drive.google.com/thumbnail?id=${FILE_ID}&sz=w1600`;

function expectUrl(result: ReturnType<typeof normalizeImageLink>) {
  if ("error" in result) throw new Error(`expected a url, got: ${result.error}`);
  return result.url;
}

describe("normalizeImageLink", () => {
  it("rewrites every Drive link shape to a renderable thumbnail url", () => {
    const shareForms = [
      `https://drive.google.com/file/d/${FILE_ID}/view?usp=sharing`,
      `https://drive.google.com/open?id=${FILE_ID}`,
      `https://drive.google.com/uc?export=view&id=${FILE_ID}`,
      `https://drive.usercontent.google.com/download?id=${FILE_ID}&export=view`,
      `https://lh3.googleusercontent.com/d/${FILE_ID}`,
    ];
    for (const form of shareForms) {
      expect(expectUrl(normalizeImageLink(form))).toBe(THUMBNAIL);
    }
  });

  it("passes non-Drive image urls through untouched", () => {
    const direct = "https://cdn.example.com/bills/invoice-77.jpg";
    expect(expectUrl(normalizeImageLink(direct))).toBe(direct);
  });

  it("trims surrounding whitespace from a pasted link", () => {
    expect(expectUrl(normalizeImageLink(`  https://drive.google.com/file/d/${FILE_ID}/view  `))).toBe(
      THUMBNAIL,
    );
  });

  it("rejects input that cannot render an image", () => {
    const rejected = [
      "",
      "   ",
      "drive.google.com/file/d/abc/view",
      "javascript:alert(1)",
      "https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQr",
      "https://drive.google.com/file/d/short",
    ];
    for (const input of rejected) {
      expect(normalizeImageLink(input)).toHaveProperty("error");
    }
  });
});

describe("labelForLink", () => {
  it("names Drive attachments and falls back to the filename", () => {
    expect(labelForLink(THUMBNAIL)).toBe("Drive attachment");
    expect(labelForLink("https://cdn.example.com/bills/invoice-77.jpg")).toBe("invoice-77.jpg");
  });
});
