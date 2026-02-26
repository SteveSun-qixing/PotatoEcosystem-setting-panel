export interface InvokeCandidate {
  namespace: string;
  action: string;
  params?: unknown;
}

export interface BridgeInvokeError extends Error {
  code?: string;
  cause?: unknown;
}

const BRIDGE_UNAVAILABLE_CODE = 'BRIDGE_UNAVAILABLE';

function toBridgeError(error: unknown): BridgeInvokeError {
  if (error instanceof Error) {
    return error as BridgeInvokeError;
  }

  if (typeof error === 'object' && error !== null) {
    const message =
      typeof (error as { message?: unknown }).message === 'string'
        ? (error as { message: string }).message
        : 'Unknown bridge error';
    const bridgeError = new Error(message) as BridgeInvokeError;
    bridgeError.code =
      typeof (error as { code?: unknown }).code === 'string'
        ? ((error as { code: string }).code)
        : undefined;
    bridgeError.cause = error;
    return bridgeError;
  }

  const fallback = new Error(String(error)) as BridgeInvokeError;
  fallback.cause = error;
  return fallback;
}

function requireBridge(): ChipsBridgeAPI {
  if (typeof window === 'undefined' || !window.chips || typeof window.chips.invoke !== 'function') {
    const error = new Error('window.chips.invoke is unavailable') as BridgeInvokeError;
    error.code = BRIDGE_UNAVAILABLE_CODE;
    throw error;
  }

  return window.chips;
}

export async function invokeBridge<T>(namespace: string, action: string, params?: unknown): Promise<T> {
  try {
    const bridge = requireBridge();
    return (await bridge.invoke(namespace, action, params)) as T;
  } catch (error: unknown) {
    throw toBridgeError(error);
  }
}

export async function invokeFirstSuccessful<T>(candidates: readonly InvokeCandidate[]): Promise<T> {
  let latestError: BridgeInvokeError | null = null;

  for (const candidate of candidates) {
    try {
      return await invokeBridge<T>(candidate.namespace, candidate.action, candidate.params);
    } catch (error: unknown) {
      latestError = toBridgeError(error);
    }
  }

  throw latestError ?? new Error('No invoke candidates provided');
}

export function isRouteMissingError(error: unknown): boolean {
  const bridgeError = toBridgeError(error);
  const code = bridgeError.code?.toUpperCase() ?? '';
  const message = bridgeError.message.toLowerCase();

  return (
    code.includes('ROUTE') ||
    code.includes('NOT_FOUND') ||
    message.includes('route not found') ||
    message.includes('not registered')
  );
}
