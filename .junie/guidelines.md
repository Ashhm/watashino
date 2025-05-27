# Watashino Project Guidelines

This document provides guidelines for developers working on the Watashino project.

## Build/Configuration Instructions

### Prerequisites

- Node.js (version specified in package.json)
- npm or yarn

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Building the Project

The project uses NX for build management. To build all packages:

```bash
npx nx run-many -t build
```

To build a specific package:

```bash
npx nx build @watashino/scheduler
```

### Configuration

The project uses NestJS's ConfigModule for configuration. Environment variables can be used to configure the application:

```typescript
// Example configuration
ConfigModule.forRoot({
  isGlobal: true,
  load: [appConfig],
}),
```

> **Note:** The queue core package has been removed and will be reimplemented later. References to queue-related functionality in this documentation will be updated once the new implementation is available.

## Testing Information

### Running Tests

The project uses Jest for testing. To run all tests:

```bash
npx nx run-many -t test
```

To run tests for a specific package:

```bash
npx nx test @watashino/scheduler
```

### Writing Tests

Tests should be placed next to the files they are testing, with the same name as the file being tested but with a `.spec.ts` suffix. For example, if you have a file called `scheduler.service.ts`, the test file should be called `scheduler.service.spec.ts` and placed in the same directory. The project uses NestJS's testing utilities for creating test modules.

For integration tests or tests that don't test a specific file, place them in a `tests` directory within the package.

#### Example Test

Here's an example of a simple test for a service:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { ExampleService } from './example.service';

describe('ExampleService', () => {
  let service: ExampleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExampleService,
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
      ],
    }).compile();

    service = module.get<ExampleService>(ExampleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processData', () => {
    it('should log a warning when no handler is found', async () => {
      const loggerWarnSpy = jest.spyOn(service['logger'], 'warn');

      await service.processData('unknown-type', {});

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'No handler found for data type: unknown-type'
      );
    });

    it('should call the handler method with the provided data', async () => {
      const mockHandler = {
        testMethod: jest.fn().mockResolvedValue(undefined),
      };

      // Manually set a handler in the private map
      service['handlers'].set('test-type', {
        instance: mockHandler,
        methodName: 'testMethod',
      });

      const testData = { key: 'value' };
      await service.processData('test-type', testData);

      expect(mockHandler.testMethod).toHaveBeenCalledWith(testData);
    });
  });
});
```

### Integration Tests

For integration tests that require external services, create appropriate test helpers to manage the lifecycle of these services during tests. Integration tests should be placed in a `tests` directory within the package.

## Code Style and Development Guidelines

### Code Style

The project uses Prettier and ESLint for code formatting and linting:

- **Prettier Configuration**:
  - Single quotes
  - Trailing commas
  - Print width: 120 characters

- **ESLint Configuration**:
  - Uses NX's ESLint configurations
  - Enforces module boundaries

### TypeScript Guidelines

- Use proper type annotations to avoid TypeScript errors
- Avoid using `any` type; use more specific types instead
- When accessing static properties from instance methods, define a proper constructor type:
  ```typescript
  // Define a type for the constructor that includes static properties
  type MyClassConstructor = {
    staticProperty: string;
    new (): MyClass;
  };

  // Then use it to access static properties in a type-safe way
  const staticValue = (this.constructor as MyClassConstructor).staticProperty;
  ```
- Use `Record<string, unknown>` instead of `any` for objects with unknown structure
- Use `Partial<Type>` for mock objects in tests

### NestJS Guidelines

- Follow NestJS's module structure with providers, controllers, and imports
- Use dependency injection for services and other providers
- Use decorators for defining metadata

### Testing Guidelines

- Mock external dependencies in unit tests
- Use NestJS's testing utilities for creating test modules
- Write integration tests for code that interacts with external services
- Use descriptive test names that explain what is being tested

### Project Structure

- The project is organized as a monorepo using NX
- Packages are located in the `packages` directory
- Each package has its own configuration files (tsconfig.json, jest.config.ts, etc.)
- Tests are placed next to the files they are testing, with a `.spec.ts` suffix
