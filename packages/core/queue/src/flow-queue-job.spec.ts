import { FlowQueueJob } from './flow-queue-job';
import { QueueJob } from './queue-job';

describe('FlowQueueJob', () => {
  it('should create a FlowQueueJob instance with given parameters', () => {
    const job = new FlowQueueJob('testQueue', 'testJob', { key: 'value' }, { attempts: 3 });
    expect(job.queueName).toBe('testQueue');
    expect(job.name).toBe('testJob');
    expect(job.data).toEqual({ key: 'value' });
    expect(job.opts).toEqual({ attempts: 3 });
    expect(job.children).toEqual([]);
  });

  it('should add a child job correctly using addChild', () => {
    const job = new FlowQueueJob<Record<string, unknown>>('testQueue', 'testJob');
    const childJob = new QueueJob<Record<string, unknown>>('testQueue', 'childJob', {
      name: 'childJob',
      data: { key: 'value' },
      opts: { attempts: 2 },
    });
    job.addChild(childJob);
    expect(job.children).toEqual([childJob]);
  });

  it('should set child job options to parent options if not provided', () => {
    const job = new FlowQueueJob('testQueue', 'testJob', {}, { attempts: 3 });
    const childJob = new QueueJob<Record<string, unknown>>('testQueue', 'childJob', { key: 'value' });
    job.addChild(childJob);
    expect(job.children[0].opts).toEqual({ attempts: 3 });
  });

  it('should handle adding multiple child jobs correctly', () => {
    const job = new FlowQueueJob('testQueue', 'testJob');
    const childJob1 = new QueueJob<Record<string, unknown>>('testQueue', 'childJob1', { key1: 'value1' });
    const childJob2 = new QueueJob<Record<string, unknown>>('testQueue', 'childJob2', { key2: 'value2' });
    job.addChild(childJob1).addChild(childJob2);
    expect(job.children).toEqual([childJob1, childJob2]);
  });
});
