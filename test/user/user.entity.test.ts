import { faker } from '@faker-js/faker';
import { Application, Framework } from '@midwayjs/koa';
import { close, createApp } from '@midwayjs/mock';

import { UserService } from '../../src/entity/user/user.service';

describe('UserEntity', () => {
  let app: Application;
  let service: UserService;

  beforeAll(async () => {
    app = await createApp<Framework>();
    service = await app
      .getApplicationContext()
      .getAsync<UserService>(UserService);
  });

  afterAll(async () => {
    await service.userModel.deleteMany();
    await close(app);
  });

  it('should inject user entity into the app', async () => {
    expect(service.userModel.find).toBeDefined();
    expect(typeof service.userModel.find).toEqual('function');
  });

  it('should installed `mongoose-delete` plugin successfully', async () => {
    const user = await service.userModel.create({
      name: faker.person.fullName(),
      email: faker.internet.email(),
    });
    const deleteResult = await service.userModel.deleteById(user.id);
    expect(deleteResult.acknowledged).toEqual(true);
    const resultWithoutDelete = await service.userModel.findOne({
      id: user.id,
    });
    expect(resultWithoutDelete).toBeNull();
    const resultWithDelete = await service.userModel.findOneWithDeleted({
      name: user.name,
    });
    expect(resultWithDelete).toBeTruthy();
    expect(resultWithDelete?.id).toEqual(user.id);
  });
});
