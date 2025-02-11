import { BackoffOptions, JobsOptions } from 'bullmq';
import { Expose, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsObject, IsOptional, IsString, Min, ValidateIf, ValidateNested } from 'class-validator';
import { RepeatOptions } from 'bullmq/dist/esm/interfaces/repeat-options';

export class QueueConfigBackoff implements BackoffOptions {
  @Expose({ name: 'QUEUE_CONFIG_BACKOFF_TYPE' })
  @IsEnum(['fixed', 'exponential'])
  public type: 'fixed' | 'exponential' = 'exponential';

  @Expose({ name: 'QUEUE_CONFIG_BACKOFF_DELAY' })
  @IsNumber()
  @Min(100)
  public delay = 5000;
}

export class QueueConfigRemoveOnComplete {
  @Expose({ name: 'QUEUE_CONFIG_REMOVE_ON_COMPLETE_AGE' })
  @IsNumber()
  @IsOptional()
  public age?: number = 7 * 24 * 60 * 60 * 1000;

  @Expose({ name: 'QUEUE_CONFIG_REMOVE_ON_COMPLETE_COUNT' })
  @IsNumber()
  @IsOptional()
  public count?: number = 100;
}

export class QueueConfigRemoveOnFail {
  @Expose({ name: 'QUEUE_CONFIG_REMOVE_ON_FAIL_AGE' })
  @IsNumber()
  @IsOptional()
  public age?: number = 7 * 24 * 60 * 60 * 1000;

  @Expose({ name: 'QUEUE_CONFIG_REMOVE_ON_FAIL_COUNT' })
  @IsNumber()
  @IsOptional()
  public count?: number = 100;
}

export class BaseQueueConfig implements JobsOptions {
  @IsObject()
  @ValidateNested()
  @Type(() => QueueConfigRemoveOnComplete)
  public removeOnComplete: QueueConfigRemoveOnComplete;

  @IsObject()
  @ValidateNested()
  @Type(() => QueueConfigRemoveOnFail)
  public removeOnFail: QueueConfigRemoveOnFail;

  @IsObject()
  @ValidateNested()
  @Type(() => QueueConfigBackoff)
  public backoff: QueueConfigBackoff;

  @Expose({ name: 'QUEUE_CONFIG_ATTEMPTS' })
  @IsNumber()
  @Min(0)
  public attempts?: number = 5;
}

export class SchedulerConfig implements RepeatOptions {
  @Expose({ name: 'QUEUE_CONFIG_SCHEDULER_PATTERN' })
  @IsString()
  @IsOptional()
  public pattern?: string;

  @Expose({ name: 'QUEUE_CONFIG_REPEAT_EVERY' })
  @IsNumber()
  @Min(100)
  @ValidateIf((object) => !object.pattern)
  public every = 60_000;
}

export class QueueConfig extends BaseQueueConfig {}

export class FlowProducerConfig extends BaseQueueConfig {}
