import { QueueModule } from '../src';
import { Module } from '@nestjs/common';
import { QueueExampleModule } from './queue-example.module';
import { SchedulerExampleModule } from './scheduler-example.module';

@Module({
  imports: [
    QueueModule.forRoot({
      host: 'localhost',
      port: 6379,
    }),
    QueueExampleModule,
    SchedulerExampleModule,
  ],
})
export class AppModule {}
