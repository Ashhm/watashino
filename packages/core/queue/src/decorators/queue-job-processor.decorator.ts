import { SetMetadata } from '@nestjs/common';
import { QUEUE_JOB_PROCESSOR_METADATA_KEY, QUEUE_PROCESSOR_METADATA_KEY } from '../constants';

export const QueueJobProcessor = (queueName: string, jobName: string): MethodDecorator => {
  return function (target, key, descriptor) {
    SetMetadata(QUEUE_JOB_PROCESSOR_METADATA_KEY, { queueName, jobName })(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
      target as Function,
      key,
      descriptor,
    );
    const existingMetadata = Reflect.getMetadata(QUEUE_PROCESSOR_METADATA_KEY, target.constructor) || [];
    SetMetadata(QUEUE_PROCESSOR_METADATA_KEY, [...existingMetadata, { queueName, jobName }])(target.constructor);
  };
};
