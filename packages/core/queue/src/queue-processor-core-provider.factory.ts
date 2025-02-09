import { WorkerHost } from '@nestjs/bullmq';
import { PROCESSOR_METADATA } from '@nestjs/bullmq/dist/bull.constants';
import { Logger, SetMetadata } from '@nestjs/common';
import { SCOPE_OPTIONS_METADATA } from '@nestjs/common/constants';
import { FactoryProvider } from '@nestjs/common/interfaces/modules/provider.interface';
import { ModuleRef } from '@nestjs/core';
import { Job } from 'bullmq';
import { QueueProcessorRegistryService } from './queue-processor-registry.service';
import { getProcessorCoreToken } from './utils';

export function queueProcessorCoreProviderFactory(queueName: string): FactoryProvider {
  const providerToken = getProcessorCoreToken(queueName);
  return {
    provide: providerToken,
    useFactory: (moduleRef: ModuleRef, registry: QueueProcessorRegistryService) => {
      try {
        const provider = moduleRef.get(providerToken);
        if (provider) {
          return provider;
        }
      } catch (err) {
        Logger.error(err, 'Error while getting queue processor provider');
        throw err;
      }

      class Processor extends WorkerHost {
        public override async process(job: Job, token?: string): Promise<unknown> {
          const registeredHandlers = await registry.getHandlerDescriptors(queueName, job.name);
          return Promise.all(
            registeredHandlers.map((registeredHandler) => {
              return registeredHandler.handler.call(registeredHandler.instance, job, token);
            }),
          );
        }
      }
      SetMetadata(SCOPE_OPTIONS_METADATA, { name: queueName })(Processor);
      SetMetadata(PROCESSOR_METADATA, { name: queueName })(Processor);
      return new Processor();
    },
    inject: [ModuleRef, QueueProcessorRegistryService],
  };
}
