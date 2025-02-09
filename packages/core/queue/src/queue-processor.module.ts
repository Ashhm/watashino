import { DiscoveryModule } from '@golevelup/nestjs-discovery';
import { Module } from '@nestjs/common';
import { QueueProcessorRegistryService } from './queue-processor-registry.service';

@Module({
  imports: [DiscoveryModule],
  providers: [QueueProcessorRegistryService],
  exports: [QueueProcessorRegistryService],
})
export class QueueProcessorModule {}
