import { DiscoveryService } from '@nestjs/core';

export interface SchedulerMetadata {
  name: string;
}

/**
 * Decorator that marks a class as a scheduler job.
 */
export const Scheduler = DiscoveryService.createDecorator();
