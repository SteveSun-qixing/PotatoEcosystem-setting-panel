export interface DisplayError {
  code: string;
  message: string;
  rawMessage: string;
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

export const toDisplayError = (error: unknown, fallbackCode = 'UNKNOWN_ERROR'): DisplayError => {
  if (error instanceof Error) {
    const withCode = error as Error & { code?: string };
    return {
      code: withCode.code ?? fallbackCode,
      message: error.message,
      rawMessage: error.message
    };
  }

  const record = asRecord(error);
  if (record) {
    const code = typeof record.code === 'string' ? record.code : fallbackCode;
    const message = typeof record.message === 'string' ? record.message : JSON.stringify(record);
    return {
      code,
      message,
      rawMessage: message
    };
  }

  return {
    code: fallbackCode,
    message: String(error),
    rawMessage: String(error)
  };
};
