import { Provide } from '@midwayjs/core';

import { FaviconkitDomain } from '../constant';

@Provide()
export class AppService {
  async getIconFromFaviconKit(
    urlOrHostname: string,
    size: number,
    options: { https?: boolean } = { https: true }
  ) {
    const hostname = urlOrHostname.includes('/')
      ? new URL(urlOrHostname).hostname
      : urlOrHostname;

    const path = `/${hostname}/${size}`;

    const scheme = options.https ? 'https' : 'http';
    return new URL(`${path}`, `${scheme}://${FaviconkitDomain}/`).href;
  }
}
