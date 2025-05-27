# Scheduler Library

A powerful and flexible job scheduling library for NestJS applications, built on top of BullMQ.

## Overview

The Scheduler Library provides a simple way to define and manage scheduled jobs in your NestJS application. It uses BullMQ under the hood for reliable job processing and scheduling.

Key features:
- Declarative job definition using decorators
- Automatic discovery of jobs and handlers
- Support for recurring jobs with flexible scheduling options
- Type-safe job data

## Installation

The Scheduler Library is included in the SweepKing project by default. To use it in your module, import the `SchedulerModule` and configure it using one of the available methods:

### Basic Installation

```typescript
import { Module } from '@nestjs/common';
import { SchedulerModule } from '@infrastructure/scheduler/scheduler.module';

@Module({
  imports: [
    SchedulerModule.forRoot(),
    // ...
  ],
})
export class YourModule {}
```

### With Configuration Options

```typescript
import { Module } from '@nestjs/common';
import { SchedulerModule } from '@infrastructure/scheduler/scheduler.module';

@Module({
  imports: [
    SchedulerModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
      queue: {
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      },
      queueName: 'custom-scheduler-queue',
      isGlobal: true, // Make the module available globally
    }),
    // ...
  ],
})
export class YourModule {}
```

### With Async Configuration

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SchedulerModule } from '@infrastructure/scheduler/scheduler.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    SchedulerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
        },
        queue: {
          defaultJobOptions: {
            attempts: configService.get('JOB_ATTEMPTS', 3),
          },
        },
        isGlobal: configService.get('SCHEDULER_GLOBAL', false), // Make the module available globally
      }),
    }),
    // ...
  ],
})
export class YourModule {}
```

## Basic Usage

### 1. Define a Scheduler Job

Create a class that extends `SchedulerJob` and decorate it with `@Scheduler()`:

```typescript
import { Scheduler } from '@infrastructure/scheduler/decorators/scheduler.decorator';
import { SchedulerJob } from '@infrastructure/scheduler/scheduler-job';

@Scheduler()
export class YourJob extends SchedulerJob {
  // Define a unique key for this job
  static readonly key = 'your-job-key';

  // Define when the job should repeat
  repeat = {
    every: 1000 * 60 * 60, // Run every hour
  };

  // Optional: Define job template data
  template = {
    data: {
      // Your job data here
    },
  };
}
```

### 2. Create a Job Handler

In a service, create a method decorated with `@OnSchedule()` to handle the job:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { OnSchedule } from '@infrastructure/scheduler/decorators/on-schedule.decorator';
import { YourJob } from './your.job';

@Injectable()
export class YourService {
  private readonly logger = new Logger(YourService.name);

  @OnSchedule(YourJob.key)
  async handleYourJob(data: Record<string, unknown>) {
    this.logger.log(`Processing job with data: ${JSON.stringify(data)}`);
    // Your job handling logic here
  }
}
```

### 3. Register Your Job

Make sure both your job class and service are provided in your module:

```typescript
import { Module } from '@nestjs/common';
import { SchedulerModule } from '@infrastructure/scheduler/scheduler.module';
import { YourJob } from './your.job';
import { YourService } from './your.service';

@Module({
  imports: [SchedulerModule],
  providers: [YourJob, YourService],
})
export class YourModule {}
```

## Advanced Usage

### Type-Safe Job Data

You can define the type of data your job will handle:

```typescript
interface YourJobData {
  userId: string;
  action: string;
}

@Scheduler()
export class YourTypedJob extends SchedulerJob<YourJobData> {
  static readonly key = 'your-typed-job';

  repeat = {
    every: 1000 * 60 * 5, // Run every 5 minutes
  };

  template = {
    data: {
      userId: 'default-user-id',
      action: 'default-action',
    },
  };
}
```

Then in your handler:

```typescript
@OnSchedule(YourTypedJob.key)
async handleYourTypedJob(data: YourJobData) {
  this.logger.log(`Processing job for user: ${data.userId}, action: ${data.action}`);
  // Your job handling logic here
}
```

### Custom Scheduling Options

You can use various scheduling options provided by BullMQ:

```typescript
@Scheduler()
export class ComplexScheduleJob extends SchedulerJob {
  static readonly key = 'complex-schedule-job';

  // Run at specific times
  repeat = {
    cron: '0 0 * * *', // Run at midnight every day
    // Or use other options:
    // every: 1000 * 60 * 60, // milliseconds
    // pattern: '0 * * * *', // cron pattern (every hour)
    // tz: 'Europe/London', // timezone
  };
}
```

### Job Options

You can configure additional job options:

```typescript
@Scheduler()
export class ConfiguredJob extends SchedulerJob {
  static readonly key = 'configured-job';

  repeat = {
    every: 1000 * 60 * 30, // Run every 30 minutes
  };

  template = {
    name: 'custom-job-name', // Optional custom name
    data: {
      // Your job data
    },
    opts: {
      attempts: 3, // Number of retry attempts
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  };
}
```

## Configuration Options

### SchedulerModuleOptions

The `SchedulerModuleOptions` interface provides configuration options for the SchedulerModule:

```typescript
interface SchedulerModuleOptions {
  /**
   * Redis connection options
   */
  redis?: RedisOptions;

  /**
   * Queue options for BullMQ
   */
  queue?: Omit<QueueOptions, 'connection'>;

  /**
   * Name of the scheduler queue
   * @default 'scheduler'
   */
  queueName?: string;

  /**
   * Whether the module should be registered as global
   * When true, the module will be available in all modules without needing to import it
   * @default false
   */
  isGlobal?: boolean;
}
```

#### redis

Redis connection options from the `ioredis` package. These options are passed directly to the Redis client.

```typescript
redis: {
  host: 'localhost',
  port: 6379,
  password: 'your-password',
  db: 0,
  // Other ioredis options...
}
```

#### queue

Queue options for BullMQ, excluding the `connection` option which is handled separately. These options are passed directly to the BullMQ Queue constructor.

```typescript
queue: {
  prefix: 'your-prefix',
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
  // Other BullMQ options...
}
```

#### queueName

The name of the scheduler queue. Defaults to `'scheduler'`.

```typescript
queueName: 'custom-scheduler-queue'
```

### SchedulerModuleAsyncOptions

The `SchedulerModuleAsyncOptions` interface provides options for asynchronously configuring the SchedulerModule:

```typescript
interface SchedulerModuleAsyncOptions {
  /**
   * Factory function to create the SchedulerModuleOptions
   */
  useFactory: (...args: unknown[]) => Promise<SchedulerModuleOptions> | SchedulerModuleOptions;

  /**
   * Dependencies to inject into the factory function
   */
  inject?: Array<string | symbol | object | Function>;

  /**
   * Imports required by the factory function
   */
  imports?: Array<object>;

  /**
   * Whether the module should be registered as global
   * When true, the module will be available in all modules without needing to import it
   * @default false
   */
  isGlobal?: boolean;
}
```

## API Reference

### SchedulerJob

Base class for defining scheduled jobs.

Properties:
- `static key: string` - Unique identifier for the job
- `name: string` - Job name (defaults to the class's static key)
- `repeat: Omit<RepeatOptions, 'key'>` - When the job should repeat
- `template: { name?: string; data?: T; opts?: JobSchedulerTemplateOptions }` - Job template configuration

### Decorators

#### @Scheduler()

Marks a class as a scheduler job.

```typescript
@Scheduler()
export class YourJob extends SchedulerJob {
  // ...
}
```

#### @OnSchedule(scheduleName: string)

Marks a method as a handler for a scheduled job.

```typescript
@OnSchedule('your-job-key')
async handleJob(data: Record<string, unknown>) {
  // ...
}
```

### SchedulerService

Service for managing scheduled jobs.

Methods:
- `handleJob(jobName: string, data: Record<string, unknown>)` - Handles a scheduled job
- `addSchedulerJob(job: SchedulerJob)` - Adds a job to the scheduler

## Best Practices

1. **Use meaningful job keys**: Choose descriptive and unique keys for your jobs.

2. **Handle errors in job handlers**: Always include proper error handling in your job handlers to prevent jobs from failing silently.

3. **Keep job handlers lightweight**: If a job requires heavy processing, consider breaking it down into smaller tasks.

4. **Use type-safe job data**: Define interfaces for your job data to ensure type safety.

5. **Monitor job execution**: Use logging to monitor job execution and troubleshoot issues.

6. **Consider job persistence**: For critical jobs, ensure that the Redis instance used by BullMQ is properly configured for persistence.

## Example: Cleanup Job

Here's a complete example of a job that cleans up expired refresh tokens:

```typescript
// cleanup-refresh-tokens.job.ts
import { Scheduler } from '@infrastructure/scheduler/decorators/scheduler.decorator';
import { SchedulerJob } from '@infrastructure/scheduler/scheduler-job';

@Scheduler()
export class CleanupRefreshTokensJob extends SchedulerJob {
  static readonly key = 'cleanup-refresh-tokens';

  repeat = {
    every: 1000 * 60 * 60 * 24, // Run every 24 hours
  };
}
```

```typescript
// refresh-token.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnSchedule } from '@infrastructure/scheduler/decorators/on-schedule.decorator';
import { CleanupRefreshTokensJob } from '../jobs/cleanup-refresh-tokens.job';

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(private readonly refreshTokenRepository: RefreshTokenRepository) {}

  // ... other methods

  @OnSchedule(CleanupRefreshTokensJob.key)
  async cleanup(data: {}) {
    this.logger.log('Starting cleanup of expired refresh tokens');

    try {
      const deletedCount = await this.refreshTokenRepository.deleteExpired();
      this.logger.log(`Successfully cleaned up ${deletedCount} expired refresh tokens`);
    } catch (error) {
      this.logger.error('Error cleaning up expired refresh tokens', error);
      throw error;
    }
  }
}
```
