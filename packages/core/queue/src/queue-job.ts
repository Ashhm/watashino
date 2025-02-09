import { JobsOptions } from 'bullmq';

export class QueueJob<T> {
  constructor(
    public queueName: string,
    public name: string,
    public data?: T,
    public opts?: JobsOptions,
  ) {}

  public setData(data: T): this {
    this.data = data;
    return this;
  }

  public assignData(data: T): this {
    this.data = { ...this.data, ...data };
    return this;
  }
}
