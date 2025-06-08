// Export module
export { RedisModule } from './redis.module';

// Export client
export { RedisClient } from './redis.client';

// Export module definition
export {
  REDIS_MODULE_OPTIONS_TOKEN,
  REDIS_MODULE_OPTIONS,
  REDIS_MODULE_ASYNC_OPTIONS,
} from './redis-module.definition';

// Export config types
export type { RedisMode, RedisConfig, RedisSentinelOptions, RedisSentinelNode } from './config/redis-config.type';
