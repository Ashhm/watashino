import { QueueJobProcessor } from './process-queue-job.decorator';
import { getSchedulerJobName } from '../utils';

export function SchedulerProcessor(queueName: string) {
  return QueueJobProcessor(queueName, getSchedulerJobName(queueName));
}
