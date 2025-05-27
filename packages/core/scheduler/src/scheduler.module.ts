import { BullModule } from '@nestjs/bullmq';
import { DynamicModule, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { SCHEDULER_QUEUE } from './scheduler.constants';
import { SchedulerProcessor } from './scheduler.processor';
import { SchedulerService } from './scheduler.service';
import { ConfigurableModuleClass, OPTIONS_TYPE, ASYNC_OPTIONS_TYPE } from './scheduler-module.definition';

@Module({})
export class SchedulerModule extends ConfigurableModuleClass {
  /**
   * Register the SchedulerModule with the provided options
   * This method is called by the ConfigurableModuleBuilder
   */
  static forRoot(options: typeof OPTIONS_TYPE): DynamicModule {
    const queueName = options.name || SCHEDULER_QUEUE;

    return {
      ...super.forRoot(options),
      module: SchedulerModule,
      imports: [
        DiscoveryModule,
        BullModule.registerQueue({
          name: queueName,
          ...options,
        }),
      ],
      providers: [SchedulerService, SchedulerProcessor],
      exports: [SchedulerService],
      global: options.isGlobal,
    };
  }

  /**
   * Register the SchedulerModule with asynchronously provided options
   * This method is automatically created by the ConfigurableModuleBuilder
   */
  static forRootAsync(options: typeof ASYNC_OPTIONS_TYPE): DynamicModule {
    return {
      ...super.forRootAsync(options),
      module: SchedulerModule,
      imports: [
        DiscoveryModule,
        BullModule.registerQueueAsync({
          name: SCHEDULER_QUEUE,
          ...options,
        }),
        ...(options.imports || []),
      ],
      providers: [SchedulerService, SchedulerProcessor],
      exports: [SchedulerService],
      global: options.isGlobal,
    };
  }
}
