import { Inject } from '@nestjs/common';
import { getConfigToken } from '@nestjs/config';

export function InjectQueueConfig(queueName: string): ParameterDecorator {
  return Inject(getConfigToken(queueName));
}
