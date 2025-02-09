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
import { BaseQueueConfig, FlowProducerConfig, QueueConfig, SchedulerConfig } from './queue-config';
import { queueProcessorCoreProviderFactory } from './queue-processor-core-provider.factory';
import { QueueProcessorModule } from './queue-processor.module';
import { buildConfigFromEnv } from './utils';
import { ConnectionOptions } from 'bullmq/dist/esm/interfaces/redis-options';
import { REDIS_CONNECTION_TOKEN } from './constants';
import _ = require('lodash');

interface RegisterQueueOptions {
  name: string;
  config?: PartialDeep<BaseQueueConfig>;
  options?: Omit<QueueBaseOptions, 'connection'>;
}

@Module({
  imports: [
    BullBoardModule.forRoot({
      route: '/system/queues',
      adapter: ExpressAdapter,
    }),
    QueueProcessorModule,
  ],
  providers: [],
  exports: [QueueProcessorModule],
})
export class QueueModule implements NestModule {
  constructor(private readonly moduleRef: ModuleRef) {}

  public static forRoot(connection: ConnectionOptions) {
    const connectionProvider = {
      provide: REDIS_CONNECTION_TOKEN,
      useValue: connection,
    };
    return {
      module: QueueModule,
      providers: [connectionProvider],
      exports: [connectionProvider],
    };
  }

  public static register({
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
    // const queueModules = (queues || []).map((queue) => this.registerQueue(queue));
    const queueRegisterOptions = (queues || []).map((queue) => (typeof queue === 'string' ? { name: queue } : queue));
    const schedulerRegisterOptions = (schedulers || []).map((scheduler) =>
      typeof scheduler === 'string' ? { name: scheduler } : scheduler,
    );
    const flowProducerRegisterOptions = (flowProducers || []).map((flowProducer) =>
      typeof flowProducer === 'string' ? { name: flowProducer } : flowProducer,
    );
    const queueConfigModules = queueRegisterOptions.map((queue) => this.createConfigModule(queue, QueueConfig));
    const schedulerConfigModules = schedulerRegisterOptions.map((scheduler) =>
      this.createConfigModule(scheduler, SchedulerConfig),
    );
    const flowProducerConfigModules = flowProducerRegisterOptions.map((flowProducer) =>
      this.createConfigModule(flowProducer, FlowProducerConfig),
    );
    const bullBoardModules = [...queueRegisterOptions, ...schedulerRegisterOptions, ...flowProducerRegisterOptions].map(
      this.createBoardModule,
    );
    const queueModules = queueRegisterOptions.map(this.createQueueModule);
    const schedulerModules = schedulerRegisterOptions.map(this.createQueueModule);
    const flowProducerModules = flowProducerRegisterOptions.map(this.createFlowProducerModule);
    const flowQueueModules = flowProducerRegisterOptions.map(this.createQueueModule);
    const processorProviders = processors ? this.createProcessors(processors) : [];
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
      providers: processorProviders,
      exports: exportedModules,
    };
  }

  private static createProcessors(queueNames: string[]): FactoryProvider[] {
    return queueNames.map(queueProcessorCoreProviderFactory);
  }

  private static createConfigModule(registerQueueOptions: RegisterQueueOptions, Config: typeof BaseQueueConfig) {
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
      inject: [REDIS_CONNECTION_TOKEN],
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
