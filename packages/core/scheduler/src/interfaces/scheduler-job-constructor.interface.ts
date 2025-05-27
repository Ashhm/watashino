import { SchedulerJob } from '../scheduler-job';

/**
 * Interface for the constructor of SchedulerJob
 */
export type SchedulerJobConstructor = {
  key: string;
  new <T extends Record<string, unknown> = Record<string, unknown>>(): SchedulerJob<T>;
};
