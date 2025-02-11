export function getProcessorCoreToken(queueName: string) {
  return `QUEUE_PROCESSOR_CORE_TOKEN_${queueName}`;
}
