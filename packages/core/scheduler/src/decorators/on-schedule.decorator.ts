import { SetMetadata } from '@nestjs/common';

export const SCHEDULE_HANDLER_METADATA = 'schedule_handler_metadata';

export interface ScheduleHandlerMetadata {
  scheduleName: string;
}

/**
 * Decorator that marks a method as a handler for a scheduled job.
 */
export function OnSchedule(scheduleName: string): PropertyDecorator {
  return SetMetadata<string, ScheduleHandlerMetadata>(SCHEDULE_HANDLER_METADATA, {
    scheduleName,
  });
}
