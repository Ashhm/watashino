import { DiscoveryService } from '@golevelup/nestjs-discovery';
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { Class } from 'type-fest';
import { QueueProcessor } from './interfaces';
import { QUEUE_JOB_PROCESSOR_METADATA_KEY, QUEUE_PROCESSOR_METADATA_KEY } from './constants/metadata.constants';

interface QueueHandlerDescriptor {
  options: { skipOnFailure: boolean };
  instance: InstanceType<Class<QueueProcessor>>;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  handler: Function;
}

interface QueueProcessorRegistry {
  [queueName: string]: {
    [jobName: string]: QueueHandlerDescriptor[];
  };
}

@Injectable()
export class QueueProcessorRegistryService implements OnApplicationBootstrap {
  private readonly registry: QueueProcessorRegistry = {};

  private readonly registryLoader: Promise<void>;

  private registryResolver: (value: void) => void;

  private isRegistryLoaded = false;

  constructor(private readonly discoveryService: DiscoveryService) {
    this.registryLoader = new Promise((resolve) => {
      this.registryResolver = () => {
        this.isRegistryLoaded = true;
        resolve();
      };
    });
  }

  public async getHandlerDescriptors(queueName: string, jobName: string): Promise<QueueHandlerDescriptor[]> {
    if (!this.isRegistryLoaded) {
      await this.registryLoader;
    }
    return this.getFromRegistry(queueName, jobName);
  }

  private getFromRegistry(queueName: string, jobName: string): QueueHandlerDescriptor[] {
    return this.registry[queueName]?.[jobName] || [];
  }

  private addToRegistry(queueName: string, jobName: string, queueProcessors: QueueHandlerDescriptor): void {
    if (!this.registry[queueName]) {
      this.registry[queueName] = {};
    }
    if (!this.registry[queueName][jobName]) {
      this.registry[queueName][jobName] = [];
    }
    this.registry[queueName][jobName].push(queueProcessors);
  }

  public async onApplicationBootstrap(): Promise<void> {
    const providersWithMeta = await this.discoveryService.providersWithMetaAtKey(QUEUE_PROCESSOR_METADATA_KEY);
    await Promise.all(
      providersWithMeta.map(async (providerWithMeta) => {
        const {
          discoveredClass: { instance, injectType },
        } = providerWithMeta;
        const methodsWithMeta = await this.discoveryService.providerMethodsWithMetaAtKey<{
          queueName: string;
          jobName: string;
        }>(QUEUE_JOB_PROCESSOR_METADATA_KEY, (item) => {
          return item.injectType === injectType;
        });
        methodsWithMeta.forEach((methodWithMeta) => {
          const { queueName, jobName } = methodWithMeta.meta;
          this.addToRegistry(queueName, jobName, {
            options: { skipOnFailure: false },
            instance: instance as InstanceType<Class<QueueProcessor>>,
            handler: methodWithMeta.discoveredMethod.handler,
          });
        });
      }),
    );
    this.registryResolver();
  }
}
