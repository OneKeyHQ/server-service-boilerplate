/**
 * This file is auto-generated by grpc-helper
 */

/* eslint-disable @typescript-eslint/no-namespace */

import * as grpc from '@midwayjs/grpc';

/* package token start */
export namespace token {
  export interface RpcNetworkService {
    listNetworks(data: ListNetworksRequest): Promise<ListNetworksResponse>;
    getNetwork(data: GetNetworkRequest): Promise<GetNetworkResponse>;
  }
  /**
   * RpcNetworkService client interface
   */
  export interface RpcNetworkServiceClient {
    listNetworks(
      options?: grpc.IClientOptions
    ): grpc.IClientUnaryService<ListNetworksRequest, ListNetworksResponse>;
    getNetwork(
      options?: grpc.IClientOptions
    ): grpc.IClientUnaryService<GetNetworkRequest, GetNetworkResponse>;
  }
  export interface Network {
    name?: string;
  }
  export interface ListNetworksRequest {
    page?: number;
    page_size?: number;
  }
  export interface ListNetworksResponse {
    networks?: token.Network[];
  }
  export interface GetNetworkRequest {
    // The field will contain name of the resource requested.
    name?: string;
  }
  export interface GetNetworkResponse {
    // The field will contain name of the resource requested.
    name?: string;
  }
}
/* package token end */

/* package google start */
export namespace google {
  /* package protobuf start */
  export namespace protobuf {
    // tslint:disable-next-line:no-empty-interface
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    export interface Empty {}
  }
  /* package protobuf end */
}
/* package google end */
