import { Application, Framework } from '@midwayjs/koa';
import { close, createApp, createHttpRequest } from '@midwayjs/mock';

describe('test host security service', () => {

  let app: Application;

  beforeAll(async () => {
    app = await createApp<Framework>();
  });

  afterAll(async () => {
    await close(app);
  });

  it('should get check info successfully', async () => {
    // make request
    const result = await createHttpRequest(app).get('/check-host').query({ url: 'https://app-1inch.io' })

    console.log('=========',result.body)
    expect(result.status).toBe(200);
    expect(result.body.data.phishingInfo.phishing_site).toBe(0);
  });
});
