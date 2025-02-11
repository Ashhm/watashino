import { InternalServerErrorException } from '@nestjs/common';
import { validate } from 'class-validator';

export async function validateConfig<T extends object>(config: T) {
  const errors = await validate(config, {
    skipMissingProperties: false,
    whitelist: true,
  });
  if (errors.length > 0) {
    throw new InternalServerErrorException(errors.toString());
  }
  return config;
}
