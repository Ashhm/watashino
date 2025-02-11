export function getSchedulerDispatcherToken(queueName: string): string {
  return `SCHEDULER_DISPATCHER_${queueName}`;
}
