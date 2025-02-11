# @watashino/queue

A NestJS module for managing BullMQ queues with support for Bull Board.

## Installation

```bash
npm install @watashino/bull-bull-queue
```

## Usage

### Importing the Module

To use the QueueModule, import it into your NestJS application module.

```typescript
import { Module } from '@nestjs/common';
import { QueueModule } from '@watashino/bull-bull-queue';

;

@Module({
  imports: [
    QueueModule.forRoot({
      host: 'localhost',
      port: 6379,
    }),
  ],
})
export class AppModule {
}
```

### Registering Queues

You can register queues, schedulers, and flow producers using the register method.

```typescript
import { Module } from '@nestjs/common';
import { QueueModule } from '@watashino/bull-bull-queue';

@Module({
  imports: [
    QueueModule.register({
      queues: ['queue1', 'queue2'],
      schedulers: ['scheduler1'],
      flowProducers: ['flowProducer1'],
    }),
  ],
})
export class AppModule {
}
```

## Using Bull Board

The QueueModule integrates with Bull Board for monitoring queues. The Bull Board interface is available at /system/queues.  
Configuration
You can configure queues using environment variables or by providing configuration objects.
Example Configuration

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QueueModule } from '@watashino/bull-bull-queue';

@Module({
  imports: [
    ConfigModule.forRoot(),
    QueueModule.register({
      queues: [
        {
          name: 'queue1',
          config: {
            redis: {
              host: process.env.REDIS_HOST,
              port: +process.env.REDIS_PORT,
            },
          },
        },
      ],
    }),
  ],
})
export class AppModule {
}
```

## License

This project is licensed under the MIT License.
