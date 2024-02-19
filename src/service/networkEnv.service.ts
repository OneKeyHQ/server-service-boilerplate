import { Config, Provide } from '@midwayjs/decorator';

@Provide()
export class NetworkEnvService {
  @Config('lndhub.baseUrl')
  baseUrl: string;

  @Config('lndhubTestnet.baseUrl')
  testnetBaseUrl: string;

  @Config('lndhub.jwtAccessExpiry')
  jwtAccessExpiry: number;

  @Config('lndhub.jwtRefreshExpiry')
  jwtRefreshExpiry: number;

  @Config('lndhub.adminToken')
  adminToken: string;

  @Config('lndhubTestnet.adminToken')
  testnetAdminToken: string;

  getBaseUrl(testnet: boolean) {
    return testnet ? this.testnetBaseUrl : this.baseUrl;
  }

  getAdminToken(testnet: boolean) {
    return testnet ? this.testnetAdminToken : this.adminToken;
  }
}
