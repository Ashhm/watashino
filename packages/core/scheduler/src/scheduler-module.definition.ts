import { ConfigurableModuleBuilder } from '@nestjs/common';
import { SchedulerModuleOptions } from './interfaces/scheduler-module-options.interface';

/**
 * Builder for the SchedulerModule
 * This uses NestJS's ConfigurableModuleBuilder to create a configurable module
 * with both synchronous and asynchronous configuration options.
 */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE, ASYNC_OPTIONS_TYPE } =
  new ConfigurableModuleBuilder<SchedulerModuleOptions, 'forRoot' | 'forRootAsync', 'createRegisterQueueOptions'>()
    .setClassMethodName('forRoot')
    .setExtras(
      {
        isGlobal: false,
      },
      (definition, extras) => ({
        ...definition,
        global: extras.isGlobal,
      }),
    )
    .build();
