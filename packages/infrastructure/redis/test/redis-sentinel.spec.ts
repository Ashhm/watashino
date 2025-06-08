import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { RedisModule, RedisClient } from '../src';
import { INestApplication } from '@nestjs/common';
import * as path from 'path';
import { DockerComposeEnvironment, Wait, StartedDockerComposeEnvironment } from 'testcontainers';

describe('Redis Sentinel Module (e2e)', () => {
  let redisClient: RedisClient;
  let moduleRef: TestingModule;
  let app: INestApplication;
  let environment: StartedDockerComposeEnvironment;
  const dockerComposeFilePath = path.resolve(__dirname, '../../../../system/docker');
  const composeFile = 'redis-sentinel.docker-compose.yaml';

  beforeAll(async () => {
    console.log('Starting Redis Sentinel cluster...');

    environment = await new DockerComposeEnvironment(dockerComposeFilePath, composeFile)
      .withWaitStrategy('redis-master', Wait.forHealthCheck())
      .withWaitStrategy('redis-slave-1', Wait.forHealthCheck())
      .withWaitStrategy('redis-slave-2', Wait.forHealthCheck())
      .withWaitStrategy('redis-sentinel-1', Wait.forLogMessage('Sentinel ID'))
      .withWaitStrategy('redis-sentinel-2', Wait.forLogMessage('Sentinel ID'))
      .withWaitStrategy('redis-sentinel-3', Wait.forLogMessage('Sentinel ID'))
      .up();

    console.log('Redis Sentinel cluster is ready!');

    // Wait longer for sentinel discovery and master election
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Get the mapped ports from the environment
    const sentinel1Container = environment.getContainer('redis-sentinel-1');
    const sentinel2Container = environment.getContainer('redis-sentinel-2');
    const sentinel3Container = environment.getContainer('redis-sentinel-3');

    const sentinel1Port = sentinel1Container.getMappedPort(26379);
    const sentinel2Port = sentinel2Container.getMappedPort(26379);
    const sentinel3Port = sentinel3Container.getMappedPort(26379);

    console.log(`Sentinel ports: ${sentinel1Port}, ${sentinel2Port}, ${sentinel3Port}`);

    // Set environment variables for Redis configuration
    process.env['REDIS_MODE'] = 'sentinel';
    process.env['REDIS_NODES'] = `localhost:${sentinel1Port},localhost:${sentinel2Port},localhost:${sentinel3Port}`;
    process.env['REDIS_SENTINEL_NAME'] = 'mymaster';
    process.env['REDIS_PASSWORD'] = 'redispassword';
    process.env['REDIS_DB'] = '0';

    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        RedisModule,
      ],
    }).compile();

    // Get Redis client
    redisClient = moduleRef.get(RedisClient);

    app = moduleRef.createNestApplication();
    app.enableShutdownHooks();
    await app.init();
  }, 300000);

  afterAll(async () => {
    await app.close();
    await environment.down();
  }, 300000);

  it('should be defined', () => {
    expect(redisClient).toBeDefined();
  });

  it('should ping successfully', async () => {
    const result = await redisClient.ping();
    expect(result).toBe('PONG');
  });

  it('should set and get a value', async () => {
    const key = 'test-sentinel-key';
    const value = 'test-sentinel-value';

    const setResult = await redisClient.set(key, value);
    expect(setResult).toBe('OK');

    const getResult = await redisClient.get(key);
    expect(getResult).toBe(value);
  });

  it('should return null for non-existent key', async () => {
    const key = 'non-existent-sentinel-key';

    const getResult = await redisClient.get(key);
    expect(getResult).toBeNull();
  });

  it('should handle setting and getting complex objects', async () => {
    const key = 'complex-sentinel-object';
    const value = {
      name: 'test-sentinel',
      nested: {
        value: 123,
      },
      array: [1, 2, 3],
    };

    const setResult = await redisClient.set(key, JSON.stringify(value));
    expect(setResult).toBe('OK');

    const getResult = await redisClient.get(key);
    const parsedResult = JSON.parse(getResult as string);
    expect(parsedResult).toEqual(value);
  });

  it('should handle Redis info command', async () => {
    const info = await redisClient.info();
    expect(info).toContain('redis_version');
  });
});
