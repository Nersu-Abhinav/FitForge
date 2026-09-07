// ============================================================================
// FitForge Sync Error Classification System
// Distinguishes network errors, retryable 5xx, conflicts (409), and 4xx client errors
// ============================================================================

export type SyncErrorAction = 
  | 'QUEUE_OFFLINE'     // Network down, timeout, offline -> Queue for sync
  | 'RETRY_BACKOFF'     // 500, 502, 503, 504 -> Retry with exponential backoff
  | 'RESOLVE_CONFLICT'  // 409 Conflict -> Already exists, mark resolved
  | 'PERMANENT_FAILURE'; // 400, 401, 403, 404, 422 -> Don't retry, permanent failure

export interface ErrorClassification {
  action: SyncErrorAction;
  isNetwork: boolean;
  isRetryable: boolean;
  isConflict: boolean;
  isPermanent: boolean;
  statusCode?: number;
  message: string;
}

/**
 * Classifies an HTTP or runtime error to determine exact sync behavior
 */
export function classifySyncError(error: any): ErrorClassification {
  const message = error?.message || (typeof error === 'string' ? error : 'Unknown error');
  let status: number | undefined = error?.status;

  // Extract HTTP status if embedded in message (e.g. "HTTP 500", "HTTP 409", "status: 404")
  if (!status) {
    const statusMatch = message.match(/HTTP\s*(\d{3})/i) || message.match(/status[:\s]+(\d{3})/i);
    if (statusMatch) {
      status = parseInt(statusMatch[1], 10);
    }
  }

  // 1. Check for Network / Timeout / Offline errors
  const isNetwork = 
    !navigator.onLine ||
    error?.name === 'TypeError' ||
    message.includes('Failed to fetch') ||
    message.includes('NetworkError') ||
    message.includes('Network request failed') ||
    message.includes('aborted') ||
    message.includes('timeout') ||
    message.includes('ERR_CONNECTION_REFUSED') ||
    message.includes('ERR_INTERNET_DISCONNECTED') ||
    message.includes('connection was forcibly closed');

  if (isNetwork && !status) {
    return {
      action: 'QUEUE_OFFLINE',
      isNetwork: true,
      isRetryable: true,
      isConflict: false,
      isPermanent: false,
      message
    };
  }

  // 2. Conflict (409)
  if (status === 409 || message.includes('409') || message.toLowerCase().includes('duplicate') || message.toLowerCase().includes('already exists')) {
    return {
      action: 'RESOLVE_CONFLICT',
      isNetwork: false,
      isRetryable: false,
      isConflict: true,
      isPermanent: false,
      statusCode: 409,
      message: 'Record conflict or duplicate: resolved with existing database state.'
    };
  }

  // 3. Retryable Server Errors (500, 502, 503, 504)
  if (status && [500, 502, 503, 504].includes(status)) {
    return {
      action: 'RETRY_BACKOFF',
      isNetwork: false,
      isRetryable: true,
      isConflict: false,
      isPermanent: false,
      statusCode: status,
      message: `Server temporary error (HTTP ${status}): queued for exponential backoff retry.`
    };
  }

  // 4. Non-retryable Client Errors (400, 401, 403, 404, 422)
  if (status && [400, 401, 403, 404, 422].includes(status)) {
    return {
      action: 'PERMANENT_FAILURE',
      isNetwork: false,
      isRetryable: false,
      isConflict: false,
      isPermanent: true,
      statusCode: status,
      message: `Client error (HTTP ${status}): non-retryable mutation.`
    };
  }

  // Fallback: If status is unknown and we are offline, queue; otherwise if server error format, backoff
  if (!navigator.onLine) {
    return {
      action: 'QUEUE_OFFLINE',
      isNetwork: true,
      isRetryable: true,
      isConflict: false,
      isPermanent: false,
      message
    };
  }

  return {
    action: 'RETRY_BACKOFF',
    isNetwork: false,
    isRetryable: true,
    isConflict: false,
    isPermanent: false,
    statusCode: status,
    message
  };
}
