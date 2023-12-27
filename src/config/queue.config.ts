import { getTimeDurationMs } from '../utils/time-duration';

import type { JobOptions, QueueOptions } from 'bull';
export enum EBullQueueNames {
  lightningNetwork = 'lightningNetwork',
  lightningNetworkPaymentVerify = 'lightningNetworkPaymentVerify',
}

export const queueConfig: Record<
  EBullQueueNames,
  {
    name: EBullQueueNames;
    concurrency: number;
    jobOptions: JobOptions;
    queueOptions: QueueOptions;
  }
> = {
  [EBullQueueNames.lightningNetwork]: {
    name: EBullQueueNames.lightningNetwork,
    concurrency: 2000,
    jobOptions: {
      timeout: getTimeDurationMs({
        hour: 2,
      }),
      removeOnComplete: false,
      removeOnFail: false,
    },
    queueOptions: {
      prefix: `{bull-task-${EBullQueueNames.lightningNetwork}}`,
    },
  },
  [EBullQueueNames.lightningNetworkPaymentVerify]: {
    name: EBullQueueNames.lightningNetworkPaymentVerify,
    concurrency: 2000,
    jobOptions: {
      timeout: getTimeDurationMs({
        hour: 2,
      }),
    },
    queueOptions: {
      prefix: `{bull-task-${EBullQueueNames.lightningNetworkPaymentVerify}}`,
    },
  },
};
