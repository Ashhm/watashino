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

```bash
npm install @watashino/scheduler
```

## Basic Usage

### 1. Define a Scheduler Job

Create a class that extends `SchedulerJob` and decorate it with `@Scheduler()`:

```typescript
import { Scheduler } from '@watashino/scheduler';
import { SchedulerJob } from '@watashino/scheduler';

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
import { OnSchedule } from '@watashino/scheduler';
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
import { SchedulerModule } from '@watashino/scheduler';
import { YourJob } from './your.job';
import { YourService } from './your.service';

@Module({
  imports: [SchedulerModule.forRoot()],
  providers: [YourJob, YourService],
})
export class YourModule {}
```

## Documentation

For more detailed documentation, including advanced usage, configuration options, and API reference, please see the [full documentation](https://github.com/yourusername/watashino/tree/main/packages/core/scheduler).
