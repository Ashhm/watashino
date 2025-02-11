import { DiscoveryModule } from '@golevelup/nestjs-discovery';
import { Module } from '@nestjs/common';
import { ProcessorRegistryService } from './processor-registry.service';

@Module({
  imports: [DiscoveryModule],
  providers: [ProcessorRegistryService],
  exports: [ProcessorRegistryService],
})
export class ProcessorRegistryModule {}
