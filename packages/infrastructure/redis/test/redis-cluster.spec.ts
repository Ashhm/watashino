import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { RedisModule, RedisClient } from '../src';
import { INestApplication } from '@nestjs/common';
import * as path from 'path';
import { DockerComposeEnvironment, Wait, StartedDockerComposeEnvironment } from 'testcontainers';

describe('Redis Cluster Module (e2e)', () => {
  let redisClient: RedisClient;
  let moduleRef: TestingModule;
  let app: INestApplication;
  let environment: StartedDockerComposeEnvironment;
  const dockerComposeFilePath = path.resolve(__dirname, '../../../../system/docker');
  const composeFile = 'redis-cluster.docker-compose.yaml';

  beforeAll(async () => {
    console.log('Starting Redis cluster...');

    environment = await new DockerComposeEnvironment(dockerComposeFilePath, composeFile)
      .withWaitStrategy('redis-cluster-0', Wait.forLogMessage('Ready to accept connections'))
      .withWaitStrategy('redis-cluster-1', Wait.forLogMessage('Ready to accept connections'))
      .withWaitStrategy('redis-cluster-2', Wait.forLogMessage('Ready to accept connections'))
      .withWaitStrategy('redis-cluster-3', Wait.forLogMessage('Ready to accept connections'))
      .withWaitStrategy('redis-cluster-4', Wait.forLogMessage('Ready to accept connections'))
      .withWaitStrategy('redis-cluster-5', Wait.forLogMessage('Ready to accept connections'))
      .up();

    // Wait longer for sentinel discovery and master election
    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log('Redis cluster is ready!');

    // Get the mapped ports from the environment
    const cluster0Container = environment.getContainer('redis-cluster-0');
    const cluster1Container = environment.getContainer('redis-cluster-1');
    const cluster2Container = environment.getContainer('redis-cluster-2');
    const cluster3Container = environment.getContainer('redis-cluster-3');
    const cluster4Container = environment.getContainer('redis-cluster-4');
    const cluster5Container = environment.getContainer('redis-cluster-5');

    const cluster0Port = cluster0Container.getMappedPort(6379);
    const cluster1Port = cluster1Container.getMappedPort(6380);
    const cluster2Port = cluster2Container.getMappedPort(6381);
    const cluster3Port = cluster3Container.getMappedPort(6382);
    const cluster4Port = cluster4Container.getMappedPort(6383);
    const cluster5Port = cluster5Container.getMappedPort(6384);

    console.log(
      `Cluster ports: ${cluster0Port}, ${cluster1Port}, ${cluster2Port}, ${cluster3Port}, ${cluster4Port}, ${cluster5Port}`,
    );

    // Set environment variables for Redis configuration
    process.env['REDIS_MODE'] = 'cluster';
    process.env[
      'REDIS_NODES'
    ] = `localhost:${cluster0Port},localhost:${cluster1Port},localhost:${cluster2Port},localhost:${cluster3Port},localhost:${cluster4Port},localhost:${cluster5Port}`;
    process.env['REDIS_PASSWORD'] = '';
    process.env['REDIS_DB'] = '0';
    process.env['REDIS_CLUSTER_MAX_REDIRECTIONS'] = '16';

    // Create test module
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        RedisModule,
      ],
    }).compile();

    // Get Redis client
    redisClient = moduleRef.get<RedisClient>(RedisClient);

    // Start Nest application
    app = moduleRef.createNestApplication();
    app.enableShutdownHooks();
    await app.init();
  }, 60000);

  afterAll(async () => {
    await app.close();
    await environment.down();
  }, 60000);

  it('should be defined', () => {
    expect(redisClient).toBeDefined();
  });

  it('should set and get a value', async () => {
    const key = 'test-cluster-key';
    const value = 'test-cluster-value';

    // Set value
    const setResult = await redisClient.set(key, value);
    expect(setResult).toBe('OK');

    // Get value
    const getResult = await redisClient.get(key);
    expect(getResult).toBe(value);
  });

  it('should return null for non-existent key', async () => {
    const key = 'non-existent-cluster-key';

    // Get value for non-existent key
    const getResult = await redisClient.get(key);
    expect(getResult).toBeNull();
  });

  it('should handle setting and getting complex objects', async () => {
    const key = 'complex-cluster-object';
    const value = {
      name: 'test-cluster',
      nested: {
        value: 123,
      },
      array: [1, 2, 3],
    };

    const setResult = await redisClient.set(key, JSON.stringify(value));
    expect(setResult).toBe('OK');

    // Get and parse complex object
    const getResult = await redisClient.get(key);
    const parsedResult = JSON.parse(getResult as string);

    expect(parsedResult).toEqual(value);
  });
});
