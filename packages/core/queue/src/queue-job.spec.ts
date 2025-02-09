import { QueueJob } from './queue-job';

describe('QueueJob', () => {
  it('should merge nested objects correctly using assignData', () => {
    const job = new QueueJob<Record<string, unknown>>('testQueue', 'testJob', { key1: { subKey1: 'value1' } });
    job.assignData({ key1: { subKey2: 'value2' } });
    expect(job.data).toEqual({ key1: { subKey1: 'value1', subKey2: 'value2' } });
  });

  it('should overwrite primitive values with objects using assignData', () => {
    const job = new QueueJob<Record<string, unknown>>('testQueue', 'testJob', { key: 'value' });
    job.assignData({ key: { subKey: 'newValue' } });
    expect(job.data).toEqual({ key: { subKey: 'newValue' } });
  });

  it('should handle merging arrays correctly using assignData', () => {
    const job = new QueueJob<Record<string, unknown>>('testQueue', 'testJob', { key: ['value1'] });
    job.assignData({ key: ['value2'] });
    expect(job.data).toEqual({ key: ['value2'] });
  });

  it('should handle merging with undefined initial data using assignData', () => {
    const job = new QueueJob<Record<string, unknown>>('testQueue', 'testJob');
    job.assignData({ key: 'value' });
    expect(job.data).toEqual({ key: 'value' });
  });

  it('should handle merging with null values using assignData', () => {
    const job = new QueueJob<Record<string, unknown>>('testQueue', 'testJob', { key: null });
    job.assignData({ key: 'value' });
    expect(job.data).toEqual({ key: 'value' });
  });

  it('should handle merging with empty objects using assignData', () => {
    const job = new QueueJob('testQueue', 'testJob', {});
    job.assignData({ key: 'value' });
    expect(job.data).toEqual({ key: 'value' });
  });
});
