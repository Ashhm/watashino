import type { RepeatOptions } from 'bullmq';
import type { JobSchedulerTemplateOptions } from 'bullmq/dist/esm/types';
import { SchedulerJobConstructor } from './interfaces/scheduler-job-constructor.interface';

export class SchedulerJob<T extends Record<string, unknown> = Record<string, unknown>> {
  public static key: string;

  public name: string = (this.constructor as SchedulerJobConstructor).key;

  public readonly repeat: Omit<RepeatOptions, 'key'>;

  public readonly template: {
    name?: string;
    data?: T;
    opts?: JobSchedulerTemplateOptions;
  };
}
