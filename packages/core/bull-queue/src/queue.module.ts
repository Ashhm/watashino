import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { BULL_BOARD_ADAPTER, BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { DynamicModule, Module, NestModule } from '@nestjs/common';
import { FactoryProvider } from '@nestjs/common/interfaces/modules/provider.interface';
import { ConfigModule, registerAs } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';
import { QueueBaseOptions } from 'bullmq';
import { PartialDeep } from 'type-fest';
import { BaseQueueConfig, FlowProducerConfig, QueueConfig, SchedulerConfig } from './config';
import { processorProviderFactory, ProcessorRegistryModule } from './processor';
import { buildConfigFromEnv } from './utils';
import { ConnectionOptions } from 'bullmq/dist/esm/interfaces/redis-options';
import { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } from './queue.module-definition';
import { schedulerDispatcherProviderFactory } from './dispatcher';
import _ = require('lodash');

interface RegisterQueueOptions {
  name: string;
  config?: PartialDeep<BaseQueueConfig>;
  options?: Omit<QueueBaseOptions, 'connection'>;
  monitor?: boolean;
}

@Module({
  imports: [
    BullBoardModule.forRoot({
      route: '/system/queues',
      adapter: ExpressAdapter,
    }),
    ProcessorRegistryModule,
  ],
  providers: [],
  exports: [ProcessorRegistryModule],
})
export class QueueModule extends ConfigurableModuleClass implements NestModule {
  constructor(private readonly moduleRef: ModuleRef) {
    super();
  }

  public static forFeature({
    queues,
    schedulers,
    flowProducers,
    processors,
  }: {
    queues?: RegisterQueueOptions[] | string[];
    schedulers?: RegisterQueueOptions[] | string[];
    flowProducers?: RegisterQueueOptions[] | string[];
    processors?: string[];
  }) {
    const queueRegisterOptions = this.normalizeQueueOptions(queues);
    const schedulerRegisterOptions = this.normalizeQueueOptions(schedulers);
    const flowProducerRegisterOptions = this.normalizeQueueOptions(flowProducers);
    const queueConfigModules = queueRegisterOptions.map((queue) => this.createConfigModule(queue, QueueConfig));
    const schedulerConfigModules = schedulerRegisterOptions.map((scheduler) =>
      this.createConfigModule(scheduler, SchedulerConfig),
    );
    const flowProducerConfigModules = flowProducerRegisterOptions.map((flowProducer) =>
      this.createConfigModule(flowProducer, FlowProducerConfig),
    );
    const bullBoardModules = [
      ...queueRegisterOptions,
      ...schedulerRegisterOptions,
      ...flowProducerRegisterOptions,
    ].reduce((acc: DynamicModule[], queue) => {
      if (queue.monitor) {
        acc.push(this.createBoardModule(queue));
      }
      return acc;
    }, []);
    const queueModules = queueRegisterOptions.map(this.createQueueModule);
    const schedulerModules = schedulerRegisterOptions.map(this.createQueueModule);
    const schedulerDispatchersProviders = this.createSchedulerDispatchers(schedulerRegisterOptions);
    const flowProducerModules = flowProducerRegisterOptions.map(this.createFlowProducerModule);
    const flowQueueModules = flowProducerRegisterOptions.map(this.createQueueModule);
    const processorProviders = this.createProcessors(processors);
    const exportedModules = [
      ...queueConfigModules,
      ...schedulerConfigModules,
      ...flowProducerConfigModules,
      ...queueModules,
      ...schedulerModules,
      ...flowProducerModules,
      ...flowQueueModules,
    ];
    return {
      module: QueueModule,
      imports: [...exportedModules, ...bullBoardModules],
      providers: [...schedulerDispatchersProviders, ...processorProviders],
      exports: exportedModules,
    };
  }

  private static normalizeQueueOptions(queueOptions: (string | RegisterQueueOptions)[] = []): RegisterQueueOptions[] {
    return queueOptions.map((queue) => {
      if (typeof queue === 'string') {
        return { name: queue };
      }
      return queue;
    });
  }

  private static createProcessors(queueNames: string[] = []): FactoryProvider[] {
    return queueNames.map(processorProviderFactory);
  }

  private static createSchedulerDispatchers(registerQueueOptions: RegisterQueueOptions[]): FactoryProvider[] {
    return registerQueueOptions.map(({ name }) => schedulerDispatcherProviderFactory(name));
  }

  private static createConfigModule(
    registerQueueOptions: RegisterQueueOptions,
    Config: typeof BaseQueueConfig | typeof SchedulerConfig,
  ) {
    const { name, config } = registerQueueOptions;
    return ConfigModule.forFeature(registerAs(name, async () => _.merge(await buildConfigFromEnv(Config), config)));
  }

  private static createQueueModule(registerQueueOptions: RegisterQueueOptions): DynamicModule {
    const { name, options = {} } = registerQueueOptions;
    return BullModule.registerQueueAsync({
      name,
      useFactory: (connectionOptions: ConnectionOptions) => {
        return {
          name,
          connection: connectionOptions,
          ...options,
        };
      },
      inject: [MODULE_OPTIONS_TOKEN],
    });
  }

  private static createFlowProducerModule(registerQueueOptions: RegisterQueueOptions): DynamicModule {
    const { name, options = {} } = registerQueueOptions;
    return BullModule.registerFlowProducerAsync({
      name,
      useFactory: (connectionOptions: ConnectionOptions) => {
        return {
          name,
          connection: connectionOptions,
          ...options,
        };
      },
    });
  }

  private static createBoardModule(registerQueueOptions: RegisterQueueOptions): DynamicModule {
    const { name } = registerQueueOptions;
    return BullBoardModule.forFeature({ name, adapter: BullMQAdapter });
  }

  // Workaround https://github.com/felixmosh/bull-board/issues/617
  public configure() {
    const serverAdapter = this.moduleRef.get(BULL_BOARD_ADAPTER, { strict: false });
    serverAdapter.setBasePath('/system/queues');
  }
}
