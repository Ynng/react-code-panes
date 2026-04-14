const LANGUAGE_ALIASES: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  py: "python",
  yml: "yaml",
  md: "markdown",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  text: "plaintext",
  plaintext: "plaintext",
  jsonl: "json",
};

function extensionFromPath(path?: string) {
  if (!path || !path.includes(".")) return "";
  return path.split(".").pop()?.toLowerCase() ?? "";
}

export function resolveMonacoLanguage(language: string, path?: string) {
  const normalized = language.toLowerCase();
  return LANGUAGE_ALIASES[normalized] ?? LANGUAGE_ALIASES[extensionFromPath(path)] ?? normalized;
}

export function withMonacoModelSuffix(path: string, suffix: string) {
  const lastSlash = path.lastIndexOf("/");
  const lastDot = path.lastIndexOf(".");
  if (lastDot <= lastSlash) return `${path}.${suffix}`;
  return `${path.slice(0, lastDot)}.${suffix}${path.slice(lastDot)}`;
}
