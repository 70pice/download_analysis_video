export type ParsedSourceInput = {
  platform: "douyin" | "generic";
  url: string | null;
  normalizedInput: string;
  author: string | null;
  title: string | null;
  hashtags: string[];
  shareCode: string | null;
};

const unique = <T>(items: T[]) => [...new Set(items)];

export const parseSourceInput = (sourceInput: string): ParsedSourceInput => {
  const normalizedInput = sourceInput.replace(/\s+/g, " ").trim();
  const urlMatch = normalizedInput.match(/https?:\/\/[^\s]+/i);
  const authorMatch = normalizedInput.match(/看看【([^】]+)的作品】/);
  const shareCodeMatch = normalizedInput.match(/[A-Za-z0-9@.]+\s+[A-Za-z0-9.:/]+\s*\/\s*\d+\/\d+/);
  const hashtagMatches = [...normalizedInput.matchAll(/#\s*([^\s#@]+)\s*/g)].map((match) => match[1]);
  const titleMatch = normalizedInput.match(/】([^#]+?)(?:\s+#|\s+-\s+抖音|$)/);

  return {
    platform: /抖音|douyin/i.test(normalizedInput) ? "douyin" : "generic",
    url: urlMatch?.[0] ?? null,
    normalizedInput,
    author: authorMatch?.[1] ?? null,
    title: titleMatch?.[1]?.replace(/\.\.\.$/, "").trim() ?? null,
    hashtags: unique(hashtagMatches),
    shareCode: shareCodeMatch?.[0] ?? null,
  };
};

