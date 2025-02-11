export function getSchedulerJobName(queueName: string) {
  return `SCHEDULER_JOB_${queueName}`;
}
