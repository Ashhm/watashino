import { ConfigModule } from '@nestjs/config';
import { ClassConstructor, instanceToInstance, plainToInstance } from 'class-transformer';
import { ValidationTypes, getMetadataStorage } from 'class-validator';
import { validateConfig } from './validate-config.util';

export async function buildConfigFromEnv<T extends object, C extends ClassConstructor<T>>(mapperCls: C): Promise<T> {
  await ConfigModule.envVariablesLoaded;
  const value = { ...process.env };
  const metadataStorage = getMetadataStorage();
  const targetMetadata = metadataStorage.getTargetValidationMetadatas(mapperCls, '', true, false);
  const groupedMetadata = metadataStorage.groupByPropertyName(targetMetadata);
  // Initialize nested objects with empty objects (one level deep)
  Object.keys(groupedMetadata).forEach((key) => {
    const metadata = groupedMetadata[key];
    metadata.forEach(({ type }) => {
      if (type === ValidationTypes.NESTED_VALIDATION) {
        Object.defineProperty(value, key, {
          enumerable: true,
          configurable: true,
          writable: true,
          value: {},
        });
      }
    });
  });
  const configWithDefault = plainToInstance(mapperCls, value, { exposeDefaultValues: true });
  const transformedConfig = instanceToInstance(configWithDefault, { ignoreDecorators: true });
  return validateConfig(transformedConfig);
}
