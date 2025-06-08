import { Test, TestingModule } from '@nestjs/testing';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { ConfigModule } from '@nestjs/config';
import { RedisModule, RedisClient } from '../src';
import { INestApplication } from '@nestjs/common';

describe('Redis Standalone Module (e2e)', () => {
  let container: StartedTestContainer;
  let redisClient: RedisClient;
  let moduleRef: TestingModule;
  let app: INestApplication;

  beforeAll(async () => {
    // Start Redis container
    container = await new GenericContainer('redis:latest').withExposedPorts(6379).start();

    // Get the mapped port
    const redisPort = container.getMappedPort(6379);
    const redisHost = container.getHost();

    // Set environment variables for Redis configuration
    process.env['REDIS_MODE'] = 'standalone';
    process.env['REDIS_HOST'] = redisHost;
    process.env['REDIS_PORT'] = redisPort.toString();
    process.env['REDIS_DB'] = '0';

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
  });

  afterAll(async () => {
    // Clean up
    await app.close();
    await container.stop();
    // process.exit(0);
  });

  it('should be defined', () => {
    expect(redisClient).toBeDefined();
  });

  it('should set and get a value', async () => {
    const key = 'test-key';
    const value = 'test-value';

    // Set value
    const setResult = await redisClient.set(key, value);
    expect(setResult).toBe('OK');

    // Get value
    const getResult = await redisClient.get(key);
    expect(getResult).toBe(value);
  });

  it('should return null for non-existent key', async () => {
    const key = 'non-existent-key';

    // Get value for non-existent key
    const getResult = await redisClient.get(key);
    expect(getResult).toBeNull();
  });

  it('should handle setting and getting complex objects', async () => {
    const key = 'complex-object';
    const value = {
      name: 'test',
      nested: {
        value: 123,
      },
      array: [1, 2, 3],
    };

    // Set complex object (will be stringified)
    const setResult = await redisClient.set(key, JSON.stringify(value));
    expect(setResult).toBe('OK');

    // Get and parse complex object
    const getResult = await redisClient.get(key);
    const parsedResult = JSON.parse(getResult as string);

    expect(parsedResult).toEqual(value);
  });
});
