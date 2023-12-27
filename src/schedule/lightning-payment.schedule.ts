import { IProcessor, Processor } from '@midwayjs/bull';

import { EBullQueueNames, queueConfig } from '../config/queue.config';

@Processor(
  EBullQueueNames.lightningNetwork,
  queueConfig[EBullQueueNames.lightningNetwork].concurrency,
  queueConfig[EBullQueueNames.lightningNetwork].jobOptions,
  queueConfig[EBullQueueNames.lightningNetwork].queueOptions
)
export class LightningPaymentProcessor implements IProcessor {
  async execute(params: { foo: string }) {
    console.log(
      `test processor execute at ${new Date().toLocaleString()}, params: ${params}`
    );
  }
}
