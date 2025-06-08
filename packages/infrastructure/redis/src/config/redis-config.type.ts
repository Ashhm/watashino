import type { RedisOptions, ClusterOptions } from 'ioredis';

export type RedisMode = 'standalone' | 'cluster' | 'sentinel';

export interface RedisSentinelNode {
  host: string;
  port: number;
}

export interface RedisSentinelOptions {
  name: string;
  sentinels: RedisSentinelNode[];
  password?: string;
  sentinelPassword?: string;
  db?: number;
  tls?: Record<string, unknown>;
  maxRetriesPerRequest?: number | null;
}

export interface RedisConfig {
  mode: RedisMode;
  options: RedisOptions | ClusterOptions | RedisSentinelOptions;
  nodes?: { host: string; port: number }[];
}
