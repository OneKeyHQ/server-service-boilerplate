import type { AxiosError } from 'axios';

export interface ErrorResponse {
  message: string;
}

export function extractErrorMessage(
  error: AxiosError<ErrorResponse>
): string | undefined {
  const responseData = error?.response?.data;
  if (responseData) {
    if (typeof responseData === 'string') {
      return responseData;
    }
    if (typeof responseData === 'object' && responseData.message) {
      return responseData.message;
    }
  }
  return undefined;
}
