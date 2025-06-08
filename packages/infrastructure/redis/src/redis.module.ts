import { Module, OnApplicationShutdown, Inject } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Redis, { Cluster, ClusterOptions } from 'ioredis';
import { RedisConfig } from './config/redis-config.type';
import redisConfig from './config/redis.config';
import { ConfigurableModuleClass } from './redis-module.definition';
import { RedisClient } from './redis.client';

@Module({
  imports: [ConfigModule.forFeature(redisConfig)],
  providers: [
    {
      provide: RedisClient,
      useFactory: (defaultConfig: RedisConfig) => {
        return RedisModule.createRedisClient(defaultConfig);
      },
      inject: [redisConfig.KEY],
    },
  ],
  exports: [RedisClient],
})
// TODO: Support custom config
export class RedisModule extends ConfigurableModuleClass implements OnApplicationShutdown {
  constructor(@Inject(RedisClient) private readonly redisClient: RedisClient) {
    super();
  }

  async onApplicationShutdown() {
    // Close Redis connection when application shuts down
    await this.redisClient.quit();
  }

  static createRedisClient(config: RedisConfig): RedisClient {
    const { mode, options } = config;

    if (mode === 'cluster') {
      if (!config.nodes) {
        throw new Error('Cluster nodes not found in Redis configuration');
      }
      return new Cluster(config.nodes, options as ClusterOptions);
    } else {
      return new Redis(options);
    }
  }
}
