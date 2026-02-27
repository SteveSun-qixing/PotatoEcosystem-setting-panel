export const resolvePackagePath = (file: File | null): string | null => {
  if (!file) {
    return null;
  }

  const candidate = file as File & { path?: string };
  if (typeof candidate.path === 'string' && candidate.path.length > 0) {
    return candidate.path;
  }

  return null;
};
