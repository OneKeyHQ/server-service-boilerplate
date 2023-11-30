import { getTimeDurationSecond } from '../utils';

export const FaviconkitDomain = 'significant-lavender-scallop.faviconkit.com';

export const GoplusAccessTokenTTL = getTimeDurationSecond({ minute: 110 });

export const GoplusHostSecurityUrlTTL = getTimeDurationSecond({ hour: 24 });

export const GoplusHostSecurityDappTTL = getTimeDurationSecond({ hour: 4 });
