import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { Queue } from 'bullmq';
import { SchedulerService } from './scheduler.service';
import { SCHEDULER_QUEUE } from './scheduler.constants';

describe('SchedulerService', () => {
  let service: SchedulerService;
  let mockQueue: Partial<Queue>;

  beforeEach(async () => {
    mockQueue = {
      upsertJobScheduler: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulerService,
        {
          provide: DiscoveryService,
          useValue: {
            getProviders: jest.fn().mockReturnValue([]),
            getControllers: jest.fn().mockReturnValue([]),
          },
        },
        {
          provide: MetadataScanner,
          useValue: {
            getAllMethodNames: jest.fn().mockReturnValue([]),
          },
        },
        {
          provide: Reflector,
          useValue: {
            get: jest.fn().mockReturnValue(null),
          },
        },
        {
          provide: getQueueToken(SCHEDULER_QUEUE),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<SchedulerService>(SchedulerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleJob', () => {
    it('should log a warning when no handler is found', async () => {
      const loggerWarnSpy = jest.spyOn(service['logger'], 'warn');

      await service.handleJob('non-existent-job', {});

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'No handler found for scheduled job: non-existent-job'
      );
    });

    it('should call the handler method with the provided data', async () => {
      const mockHandler = {
        testMethod: jest.fn().mockResolvedValue(undefined),
      };

      // Manually set a handler in the private map
      service['handlers'].set('test-job', {
        instance: mockHandler,
        methodName: 'testMethod',
      });

      const testData = { key: 'value' };
      await service.handleJob('test-job', testData);

      expect(mockHandler.testMethod).toHaveBeenCalledWith(testData);
    });
  });
});
