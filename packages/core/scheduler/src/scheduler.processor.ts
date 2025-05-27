import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { SCHEDULER_QUEUE } from './scheduler.constants';
import { SchedulerService } from './scheduler.service';

@Processor(SCHEDULER_QUEUE)
export class SchedulerProcessor extends WorkerHost {
  private readonly logger = new Logger(SchedulerProcessor.name);

  constructor(private readonly schedulerService: SchedulerService) {
    super();
  }

  async process(job: { name: string; data: Record<string, unknown> }) {
    this.logger.debug(`Processing scheduled job: ${job.name}`);
    await this.schedulerService.handleJob(job.name, job.data);
  }
}
