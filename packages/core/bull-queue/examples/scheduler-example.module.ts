import { Module } from '@nestjs/common';
import { QueueModule } from '../src';

@Module({
  imports: [
    QueueModule.forFeature({
      schedulers: [
        'simple-scheduler',
        { name: 'cron-scheduler', config: { pattern: '0 0 * * *' } },
        { name: 'interval-scheduler', config: { every: 30 * 60 * 1000 } },
      ],
    }),
  ],
})
export class SchedulerExampleModule {}
