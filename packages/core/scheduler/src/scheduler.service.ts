import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, OnModuleInit, Logger, InternalServerErrorException } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Queue } from 'bullmq';
import { SCHEDULE_HANDLER_METADATA, ScheduleHandlerMetadata } from './decorators/on-schedule.decorator';
import { SchedulerMetadata, Scheduler } from './decorators/scheduler.decorator';
import { SchedulerJob } from './scheduler-job';
import { SCHEDULER_QUEUE } from './scheduler.constants';
import { SchedulerJobConstructor } from './interfaces/scheduler-job-constructor.interface';

// Define a type for handler instances
interface HandlerInstance {
  [key: string]: (...args: unknown[]) => unknown;
}

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);
  private readonly handlers = new Map<string, { instance: HandlerInstance; methodName: string }>();

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
    @InjectQueue(SCHEDULER_QUEUE)
    private readonly schedulerQueue: Queue,
  ) {}

  public async onModuleInit() {
    this.discoverHandlers();
    await this.registerJobs();
  }

  /**
   * Handles a scheduled job by calling the appropriate handler method.
   */
  public async handleJob(jobName: string, data: Record<string, unknown>) {
    const handler = this.handlers.get(jobName);

    if (!handler) {
      this.logger.warn(`No handler found for scheduled job: ${jobName}`);
      return;
    }

    const { instance, methodName } = handler;
    try {
      await instance[methodName](data);
      this.logger.debug(`Successfully executed handler for scheduled job: ${jobName}`);
    } catch (error) {
      this.logger.error(`Error executing handler for scheduled job: ${jobName}`, error);
      throw error;
    }
  }

  async addSchedulerJob(job: SchedulerJob): Promise<void> {
    // Use a type-safe approach to access the key property
    const jobName = (job.constructor as SchedulerJobConstructor).key;
    if (!jobName) {
      throw new InternalServerErrorException('Scheduler job must have a key');
    }
    await this.schedulerQueue.upsertJobScheduler(jobName, job.repeat, job.template);
  }

  private discoverHandlers() {
    const providers = this.discoveryService.getProviders();
    const controllers = this.discoveryService.getControllers();
    const instanceWrappers = [...providers, ...controllers];

    for (const wrapper of instanceWrappers) {
      this.processInstanceWrapper(wrapper);
    }
  }

  private processInstanceWrapper(wrapper: InstanceWrapper) {
    const { instance } = wrapper;

    if (!instance || typeof instance !== 'object') {
      return;
    }

    const methodNames = this.metadataScanner.getAllMethodNames(instance);
    methodNames.forEach((methodName) => {
      this.processMethod(instance as HandlerInstance, methodName);
    });
  }

  private processMethod(instance: HandlerInstance, methodName: string) {
    const metadata = this.reflector.get<ScheduleHandlerMetadata>(SCHEDULE_HANDLER_METADATA, instance[methodName]);

    if (metadata) {
      this.handlers.set(metadata.scheduleName, { instance, methodName });
      this.logger.log(
        `Discovered schedule handler for "${metadata.scheduleName}": ${instance.constructor.name}.${methodName}`,
      );
    }
  }

  private async registerJobs() {
    const providers = this.discoveryService.getProviders({ metadataKey: Scheduler.KEY });
    const jobs: SchedulerJob[] = [];

    for (const wrapper of providers) {
      const { instance } = wrapper;

      if (!instance) {
        continue;
      }

      const metadata = this.reflector.get<SchedulerMetadata>(Scheduler.KEY, instance.constructor);

      if (metadata && instance instanceof SchedulerJob) {
        jobs.push(instance);
        this.logger.log(`Discovered scheduler job: ${metadata.name}`);
      }
    }

    for (const job of jobs) {
      await this.addSchedulerJob(job);
      this.logger.log(`Registered scheduler job: ${job.name}`);
    }
  }
}
