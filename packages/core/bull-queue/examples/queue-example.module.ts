import { Module } from '@nestjs/common';
import { QueueModule } from '../src';

@Module({
  imports: [
    QueueModule.forFeature({
      queues: [
        'simple-queue',
        { name: 'complex-queue' },
        {
          name: 'complex-queue-with-custom-settings',
          config: { attempts: 15, backoff: { type: 'fixed', delay: 10000 } },
        },
      ],
    }),
  ],
})
export class QueueExampleModule {}
