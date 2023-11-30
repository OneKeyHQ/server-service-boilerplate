import { Application, Framework } from '@midwayjs/koa';
import { close, createApp } from '@midwayjs/mock';
import { HostSecurityService } from '../../src/host-security/host-security.service';

describe('test host security service', () => {

  let app: Application;

  beforeAll(async () => {
    app = await createApp<Framework>();
  });

  afterAll(async () => {
    await close(app);
  });

  it('should get check info successfully', async () => {
    // 根据依赖注入 class 获取实例（推荐）
    const hostSecurityService = await app.getApplicationContext().getAsync<HostSecurityService>(HostSecurityService);

   const result = await hostSecurityService.checkHost('https://app-1inch.io')

    console.log('=========',result)

    expect(result?.phishingInfo?.phishing_site).toBe(0);
  });

  it('should get check info has dapp info', async () => {
    // 根据依赖注入 class 获取实例（推荐）
    const hostSecurityService = await app.getApplicationContext().getAsync<HostSecurityService>(HostSecurityService);

   const result = await hostSecurityService.checkHost('https://app.uniswap.org')

    console.log('=========',result)

    expect(result?.phishingInfo?.phishing_site).toBe(0);
    expect(result?.dappSecurityInfo).toBeDefined();
  });
});
