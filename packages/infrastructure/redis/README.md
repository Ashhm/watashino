# @watashino/redis

A reusable NestJS module for Redis supporting Standalone, Cluster, and Sentinel modes with easy-to-use provider for injection.

## Overview

The `@watashino/redis` package provides a NestJS module for Redis that supports three different modes of operation:

1. **Standalone** - Connect to a single Redis instance
2. **Cluster** - Connect to a Redis cluster for high availability and scalability
3. **Sentinel** - Connect to Redis using Sentinel for high availability

This module uses [ioredis](https://github.com/luin/ioredis) under the hood and provides a simple way to inject and use Redis in your NestJS application.

## Installation

```bash
npm install @watashino/redis ioredis
```

or

```bash
yarn add @watashino/redis ioredis
```

## Usage

### Basic Usage

Import the `RedisModule` in your application module:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '@watashino/redis';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RedisModule,
  ],
})
export class AppModule {}
```

Then inject the `RedisClient` in your services:

```typescript
import { Injectable } from '@nestjs/common';
import { RedisClient } from '@watashino/redis';

@Injectable()
export class AppService {
  constructor(private readonly redisClient: RedisClient) {}

  async setValue(key: string, value: string): Promise<string> {
    return this.redisClient.set(key, value);
  }

  async getValue(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }
}
```

### Working with Complex Objects

When working with complex objects, you need to serialize and deserialize them:

```typescript
import { Injectable } from '@nestjs/common';
import { RedisClient } from '@watashino/redis';

@Injectable()
export class AppService {
  constructor(private readonly redisClient: RedisClient) {}

  async setObject(key: string, value: Record<string, any>): Promise<string> {
    return this.redisClient.set(key, JSON.stringify(value));
  }

  async getObject<T>(key: string): Promise<T | null> {
    const data = await this.redisClient.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  }
}
```

## Configuration

The Redis module is configured using environment variables. The following environment variables are supported:

### Common Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| REDIS_MODE | Redis mode: 'standalone', 'cluster', or 'sentinel' | - | Yes |
| REDIS_PASSWORD | Redis password | - | No |
| REDIS_DB | Redis database number | 0 | No |
| REDIS_TLS | Whether to use TLS for Redis connections | false | No |

### Standalone Mode Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| REDIS_HOST | Redis host | - | Yes |
| REDIS_PORT | Redis port | - | Yes |

### Cluster Mode Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| REDIS_NODES | Comma-separated list of Redis nodes (format: host:port,host:port) | - | Yes |
| REDIS_CLUSTER_MAX_REDIRECTIONS | Maximum number of redirections for cluster mode | 16 | No |

### Sentinel Mode Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| REDIS_NODES | Comma-separated list of Redis sentinel nodes (format: host:port,host:port) | - | Yes |
| REDIS_SENTINEL_NAME | The name of the sentinel | - | Yes |

## Examples

### Standalone Mode

```
REDIS_MODE=standalone
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=mypassword
REDIS_DB=0
```

### Cluster Mode

```
REDIS_MODE=cluster
REDIS_NODES=localhost:6379,localhost:6380,localhost:6381,localhost:6382,localhost:6383,localhost:6384
REDIS_PASSWORD=mypassword
REDIS_DB=0
REDIS_CLUSTER_MAX_REDIRECTIONS=16
```

### Sentinel Mode

```
REDIS_MODE=sentinel
REDIS_NODES=localhost:26379,localhost:26380,localhost:26381
REDIS_SENTINEL_NAME=mymaster
REDIS_PASSWORD=mypassword
REDIS_DB=0
```

## API Reference

The `RedisClient` class extends the `Commander` class from ioredis, which provides all the Redis command methods. Here are some of the most commonly used methods:

### Basic Operations

- `set(key, value, [options])` - Set a key-value pair
- `get(key)` - Get the value of a key
- `del(key)` - Delete a key
- `exists(key)` - Check if a key exists
- `expire(key, seconds)` - Set a key's time to live in seconds
- `ttl(key)` - Get the time to live for a key in seconds

### Hash Operations

- `hset(key, field, value)` - Set the value of a hash field
- `hget(key, field)` - Get the value of a hash field
- `hdel(key, field)` - Delete a hash field
- `hgetall(key)` - Get all the fields and values in a hash

### List Operations

- `lpush(key, value)` - Prepend a value to a list
- `rpush(key, value)` - Append a value to a list
- `lpop(key)` - Remove and get the first element in a list
- `rpop(key)` - Remove and get the last element in a list
- `lrange(key, start, stop)` - Get a range of elements from a list

### Set Operations

- `sadd(key, member)` - Add a member to a set
- `srem(key, member)` - Remove a member from a set
- `smembers(key)` - Get all the members in a set
- `sismember(key, member)` - Check if a member is in a set

### Sorted Set Operations

- `zadd(key, score, member)` - Add a member to a sorted set
- `zrem(key, member)` - Remove a member from a sorted set
- `zrange(key, start, stop)` - Get a range of members from a sorted set
- `zrank(key, member)` - Get the rank of a member in a sorted set

### Connection Operations

- `ping()` - Ping the server
- `quit()` - Close the connection
- `info()` - Get information and statistics about the server

For a complete list of available methods, refer to the [ioredis documentation](https://github.com/luin/ioredis/blob/master/API.md).

## License

MIT
