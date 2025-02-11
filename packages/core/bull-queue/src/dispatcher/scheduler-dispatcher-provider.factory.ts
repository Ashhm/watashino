import { FactoryProvider, OnApplicationBootstrap } from '@nestjs/common';
import { getSchedulerDispatcherToken, getSchedulerJobName } from '../utils';
import { Queue } from 'bullmq';
import { SchedulerConfig } from '../config';
import { getQueueToken } from '@nestjs/bullmq';
import { getConfigToken } from '@nestjs/config';

export class SchedulerDispatcherProvider implements OnApplicationBootstrap {
  constructor(private readonly queue: Queue, private readonly config: SchedulerConfig) {}

  public async onApplicationBootstrap() {
    await this.setup();
  }

  private async cleanUp() {
    const schedulers = await this.queue.getJobSchedulers();
    await Promise.all(schedulers.map((scheduler) => scheduler.id && this.queue.removeJobScheduler(scheduler.id)));
  }

  private async setup() {
    await this.cleanUp();
    const jobName = getSchedulerJobName(this.queue.name);
    await this.queue.upsertJobScheduler(jobName, this.config);
  }
}

export const schedulerDispatcherProviderFactory = (queueName: string): FactoryProvider => ({
  provide: getSchedulerDispatcherToken(queueName),
  useFactory: (queue: Queue, config: SchedulerConfig) => new SchedulerDispatcherProvider(queue, config),
  inject: [getQueueToken(queueName), getConfigToken(queueName)],
});
