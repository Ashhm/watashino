import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { BULL_BOARD_ADAPTER, BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { DynamicModule, Module, NestModule } from '@nestjs/common';
import { FactoryProvider } from '@nestjs/common/interfaces/modules/provider.interface';
import { ConfigModule, registerAs } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';
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
  monitor?: boolean;
}

interface RegisterSchedulerOptions {
  name: string;
  config?: PartialDeep<SchedulerConfig>;
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
    queues?: (RegisterQueueOptions | string)[];
    schedulers?: (RegisterSchedulerOptions | string)[];
    flowProducers?: (RegisterQueueOptions | string)[];
    processors?: string[];
  }) {
    const queueRegisterOptions = this.normalizeQueueOptions<RegisterQueueOptions>(queues);
    const schedulerRegisterOptions = this.normalizeQueueOptions<RegisterSchedulerOptions>(schedulers);
    const flowProducerRegisterOptions = this.normalizeQueueOptions<RegisterQueueOptions>(flowProducers);
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

  private static normalizeQueueOptions<T extends RegisterQueueOptions | RegisterSchedulerOptions>(
    queueOptions: (string | T)[] = [],
  ): T[] {
    return queueOptions.map((queue) => {
      if (typeof queue === 'string') {
        return { name: queue } as T;
      }
      return queue;
    });
  }

  private static createProcessors(queueNames: string[] = []): FactoryProvider[] {
    return queueNames.map(processorProviderFactory);
  }

  private static createSchedulerDispatchers(options: RegisterSchedulerOptions[]): FactoryProvider[] {
    return options.map(({ name }) => schedulerDispatcherProviderFactory(name));
  }

  private static createConfigModule(
    options: RegisterQueueOptions | RegisterSchedulerOptions,
    Config: typeof BaseQueueConfig | typeof SchedulerConfig,
  ) {
    const { name, config } = options;
    return ConfigModule.forFeature(registerAs(name, async () => _.merge(await buildConfigFromEnv(Config), config)));
  }

  private static createQueueModule(options: RegisterQueueOptions | RegisterSchedulerOptions): DynamicModule {
    const { name } = options;
    return BullModule.registerQueueAsync({
      name,
      useFactory: (connectionOptions: ConnectionOptions) => {
        return {
          name,
          connection: connectionOptions,
        };
      },
      inject: [MODULE_OPTIONS_TOKEN],
    });
  }

  private static createFlowProducerModule(registerQueueOptions: RegisterQueueOptions): DynamicModule {
    const { name } = registerQueueOptions;
    return BullModule.registerFlowProducerAsync({
      name,
      useFactory: (connectionOptions: ConnectionOptions) => {
        return {
          name,
          connection: connectionOptions,
        };
      },
    });
  }

  private static createBoardModule(options: RegisterQueueOptions | RegisterSchedulerOptions): DynamicModule {
    const { name } = options;
    return BullBoardModule.forFeature({ name, adapter: BullMQAdapter });
  }

  // Workaround https://github.com/felixmosh/bull-board/issues/617
  public configure() {
    const serverAdapter = this.moduleRef.get(BULL_BOARD_ADAPTER, { strict: false });
    serverAdapter.setBasePath('/system/queues');
  }
}
