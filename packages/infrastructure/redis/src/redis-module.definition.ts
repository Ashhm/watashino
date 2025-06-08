import { ConfigurableModuleBuilder } from '@nestjs/common';
import { RedisConfig } from './config/redis-config.type';

const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE, ASYNC_OPTIONS_TYPE } =
  new ConfigurableModuleBuilder<RedisConfig>()
    .setClassMethodName('forRoot')
    .setFactoryMethodName('createRedisOptions')
    .setExtras(
      {
        isGlobal: true,
      },
      (definition, extras) => ({
        ...definition,
        global: extras.isGlobal,
      }),
    )
    .build();
const REDIS_MODULE_OPTIONS_TOKEN = MODULE_OPTIONS_TOKEN;
const REDIS_MODULE_OPTIONS = OPTIONS_TYPE;
const REDIS_MODULE_ASYNC_OPTIONS = ASYNC_OPTIONS_TYPE;

export type RedisModuleOptions = RedisConfig;
export type RedisModuleOptionsFactory = { createRedisOptions(): RedisModuleOptions | Promise<RedisModuleOptions> };

export { ConfigurableModuleClass, REDIS_MODULE_OPTIONS_TOKEN, REDIS_MODULE_OPTIONS, REDIS_MODULE_ASYNC_OPTIONS };
