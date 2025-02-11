import { ConfigurableModuleBuilder } from '@nestjs/common';
import { ConnectionOptions } from 'bullmq';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } = new ConfigurableModuleBuilder<ConnectionOptions>()
  .setClassMethodName('forRoot')
  .setFactoryMethodName('createConnectionOptions')
  .build();
