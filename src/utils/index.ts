export const getGoplusHostUrlSecurityCacheKey = host => {
  return `goplus-host-url:${host}`;
};

export const getGoplusHostDappSecurityCacheKey = host => {
  return `goplus-host-dapp:${host}`;
};

export function isObjectEmpty(obj) {
  return Object.keys(obj).length === 0;
}

export const getGoplusAccessTokenCacheKey = () => {
  return 'goplus-access-token';
};

export type IGetTimeDurationOptions = {
  seconds?: number;
  minute?: number;
  hour?: number;
  day?: number;
  week?: number;
  month?: number;
  year?: number;
};

const MS_ONE_SECOND = 1000;
const MS_ONE_MINUTE = 60 * MS_ONE_SECOND;
const MS_ONE_HOUR = 60 * MS_ONE_MINUTE;
const MS_ONE_DAY = 24 * MS_ONE_HOUR;
const MS_ONE_WEEK = 7 * MS_ONE_DAY;
const MS_ONE_MONTH = 31 * MS_ONE_DAY;
const MS_ONE_YEAR = 365 * MS_ONE_DAY;

export function getTimeDurationMs({
  seconds = 0,
  minute = 0,
  hour = 0,
  day = 0,
  week = 0,
  month = 0,
  year = 0,
}: IGetTimeDurationOptions): number {
  return (
    seconds * MS_ONE_SECOND +
    minute * MS_ONE_MINUTE +
    hour * MS_ONE_HOUR +
    day * MS_ONE_DAY +
    week * MS_ONE_WEEK +
    month * MS_ONE_MONTH +
    year * MS_ONE_YEAR
  );
}

export function getTimeDurationSecond(
  options: IGetTimeDurationOptions
): number {
  return getTimeDurationMs(options) / 1000;
}

export function getTokenKey(token: string) {
  return `X-API-TOKEN:${token}`;
}
