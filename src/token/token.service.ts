import { Init, Inject, Provide } from '@midwayjs/core';
import { Clients } from '@midwayjs/grpc';

import { token } from '../types/network';

@Provide()
export class TokenService {
  @Inject()
  grpcClients: Clients;

  networkService: token.RpcNetworkServiceClient;

  @Init()
  async init() {
    this.networkService =
      this.grpcClients.getService<token.RpcNetworkServiceClient>(
        'token.RpcNetworkService'
      );
  }

  async getNetworks() {
    const networks = await this.networkService.listNetworks().sendMessage({});
    return networks;
  }

  async getToken(name: string) {
    const network = await this.networkService
      .getNetwork()
      .sendMessage({ name });
    return network;
  }
}
