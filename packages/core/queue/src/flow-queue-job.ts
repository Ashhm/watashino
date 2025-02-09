import { FlowChildJob, FlowJob, JobsOptions } from 'bullmq';
import { QueueJob } from './queue-job';

export class FlowQueueJob<T> extends QueueJob<T> implements FlowJob {
  public children: FlowChildJob[] = [];

  constructor(queueName: string, name: string, data?: T, opts?: Omit<JobsOptions, 'repeat'>) {
    super(queueName, name, data, opts);
  }

  public addChild(child: FlowChildJob): this {
    if (!child.opts) {
      child.opts = this.opts;
    }
    this.children.push(child);
    return this;
  }
}
