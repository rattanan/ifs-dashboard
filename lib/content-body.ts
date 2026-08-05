export type ContentBody = {
  paragraphs: string[];
};

function splitParagraphs(value: string) {
  return value
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function getContentParagraphs(bodyJson: unknown): string[] {
  if (typeof bodyJson === "string") {
    const value = bodyJson.trim();
    if (!value) return [];

    try {
      return getContentParagraphs(JSON.parse(value));
    } catch {
      return splitParagraphs(value);
    }
  }

  if (Array.isArray(bodyJson)) {
    return bodyJson
      .filter((paragraph): paragraph is string => typeof paragraph === "string")
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
  }

  if (!bodyJson || typeof bodyJson !== "object") return [];

  const body = bodyJson as Record<string, unknown>;
  if ("paragraphs" in body) return getContentParagraphs(body.paragraphs);

  return [];
}

export function normalizeContentBody(bodyJson: unknown): ContentBody {
  return { paragraphs: getContentParagraphs(bodyJson) };
}
