// 定义统一的响应格式
import { MidwayHttpError } from '@midwayjs/core';

// reply error
export function ResParamsError(message: string): MidwayHttpError {
  return new MidwayHttpError(message, 404);
}

// internal server error
export function ResInternalServerError(message: string): MidwayHttpError {
  return new MidwayHttpError(message, 500);
}
