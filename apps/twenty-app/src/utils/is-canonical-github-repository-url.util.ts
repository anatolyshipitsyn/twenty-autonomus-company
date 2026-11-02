export function isCanonicalGitHubRepositoryUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    const pathParts = url.pathname.split('/').filter(Boolean);
    return (
      url.protocol === 'https:' &&
      url.hostname === 'github.com' &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      pathParts.length === 2 &&
      pathParts.every((part) => /^[A-Za-z0-9_.-]+$/.test(part))
    );
  } catch {
    return false;
  }
}
