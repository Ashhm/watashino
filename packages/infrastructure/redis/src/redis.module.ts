import { Module, OnApplicationShutdown, Global, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Redis, { Cluster, ClusterOptions } from 'ioredis';
import { RedisConfig } from './config/redis-config.type';
import redisConfig from './config/redis.config';
import { ConfigurableModuleClass } from './redis-module.definition';
import { RedisClient } from './redis.client';

@Global()
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
  private readonly logger = new Logger(RedisModule.name);

  constructor(private readonly redisClient: RedisClient) {
    super();
  }

  async onApplicationShutdown() {
    try {
      await this.redisClient.quit();
    } catch (error) {
      this.logger.debug('Error while closing Redis connection:', error);
      if (this.redisClient.status === 'ready') {
        this.logger.error('Redis connection not closed');
      }
    }
  }

  static createRedisClient(config: RedisConfig): Redis | Cluster {
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
