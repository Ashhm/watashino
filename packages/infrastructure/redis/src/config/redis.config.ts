import { registerAs } from '@nestjs/config';
import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, ValidateIf, IsEnum } from 'class-validator';
import { RedisMode, RedisConfig } from './redis-config.type';
import { validateConfig } from '@common/validation';
import { RedisOptions, ClusterOptions } from 'ioredis';

class EnvironmentVariablesValidator {
  @IsEnum(['standalone', 'cluster', 'sentinel'])
  REDIS_MODE: string;

  @ValidateIf((o) => o.REDIS_MODE === 'standalone' || !o.REDIS_NODES)
  @IsString()
  @IsNotEmpty()
  REDIS_HOST: string;

  @ValidateIf((o) => o.REDIS_MODE === 'standalone' || !o.REDIS_NODES)
  @IsInt()
  @Min(0)
  @Max(65535)
  @Transform(({ value }) => parseInt(value, 10))
  REDIS_PORT: number;

  @IsString()
  @IsOptional()
  REDIS_NODES?: string;

  @ValidateIf((o) => o.REDIS_MODE === 'cluster')
  @IsInt()
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  REDIS_CLUSTER_MAX_REDIRECTIONS: number;

  @IsString()
  @IsNotEmpty()
  @ValidateIf((o) => o.REDIS_MODE === 'sentinel')
  REDIS_SENTINEL_NAME: string;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD: string;

  @IsInt()
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  REDIS_DB: number;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  REDIS_TLS: boolean;
}

function normalizeNodes(validatedConfig: EnvironmentVariablesValidator): { host: string; port: number }[] {
  return (
    validatedConfig.REDIS_NODES?.split(',').map((node) => {
      const [host, port] = node.trim().split(':');
      if (!host || !port) {
        throw new Error(`Invalid cluster node format: ${node}. Expected format: host:port`);
      }
      return { host, port: parseInt(port, 10) };
    }) || [{ host: validatedConfig.REDIS_HOST, port: validatedConfig.REDIS_PORT }]
  );
}

export default registerAs('infrastructure.redis', (): RedisConfig => {
  const validatedConfig = validateConfig(process.env, EnvironmentVariablesValidator);
  const mode = validatedConfig.REDIS_MODE as RedisMode;

  if (mode === 'cluster') {
    // Ensure we have cluster nodes defined
    const nodes = normalizeNodes(validatedConfig);

    const options: ClusterOptions = {
      redisOptions: {
        password: validatedConfig.REDIS_PASSWORD,
        db: validatedConfig.REDIS_DB || 0,
        tls: validatedConfig.REDIS_TLS ? {} : undefined,
        maxRetriesPerRequest: null,
        lazyConnect: true,
      },
      maxRedirections: validatedConfig.REDIS_CLUSTER_MAX_REDIRECTIONS || 16,
    };

    return { mode, options, nodes };
  } else if (mode === 'sentinel') {
    const sentinels = normalizeNodes(validatedConfig);

    const options: RedisOptions = {
      sentinels,
      name: validatedConfig.REDIS_SENTINEL_NAME,
      password: validatedConfig.REDIS_PASSWORD,
      sentinelPassword: validatedConfig.REDIS_PASSWORD,
      db: validatedConfig.REDIS_DB,
      tls: validatedConfig.REDIS_TLS ? {} : undefined,
      maxRetriesPerRequest: 3,
    };
    return { mode, options };
  } else {
    const options: RedisOptions = {
      host: validatedConfig.REDIS_HOST,
      port: validatedConfig.REDIS_PORT,
      password: validatedConfig.REDIS_PASSWORD,
      db: validatedConfig.REDIS_DB,
      tls: validatedConfig.REDIS_TLS ? {} : undefined,
      maxRetriesPerRequest: null,
    };

    return { mode, options };
  }
});
