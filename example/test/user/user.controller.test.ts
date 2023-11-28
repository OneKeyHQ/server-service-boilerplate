import { faker } from '@faker-js/faker';
import { Application, Framework } from '@midwayjs/koa';
import { close, createApp, createHttpRequest } from '@midwayjs/mock';

describe('test UserController', () => {

  let app: Application;

  beforeAll(async () => {
    app = await createApp<Framework>();
  });

  afterAll(async () => {
    await close(app);
  });

  it('should create user successfully', async () => {
    // make request
    const result = await createHttpRequest(app).post('/user').send({
      name: faker.person.fullName(),
      email: faker.internet.email()
    });

    expect(result.status).toBe(200);
  });
});
