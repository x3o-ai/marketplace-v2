# EventBus Import Error Debug Guide

## Error Analysis:
```
TypeError: import_event_bus.EventBus is not a constructor
```

## Common Fixes:

### 1. Check Export Type in EventBus Module:
```typescript
// If EventBus is exported as default:
export default class EventBus { ... }

// Import as:
import EventBus from './event-bus'

// If EventBus is exported as named:
export class EventBus { ... }

// Import as:
import { EventBus } from './event-bus'
```

### 2. Fix Mixed Module Systems:
```typescript
// In day0-day1-dev-server.ts, try:
import { EventBus } from './event-bus'
// OR
import EventBus from './event-bus'
// OR for CommonJS compatibility:
const { EventBus } = require('./event-bus')
```

### 3. Check tsconfig.json Module Settings:
```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

### 4. Quick Fix for Line 95:
```typescript
// Instead of:
this.eventBus = new EventBus(this.logger);

// Try:
import EventBusClass from './event-bus'
this.eventBus = new EventBusClass(this.logger);

// Or:
const EventBusConstructor = require('./event-bus').EventBus || require('./event-bus').default;
this.eventBus = new EventBusConstructor(this.logger);
```

### 5. Check event-bus.ts Export:
```typescript
// Make sure your event-bus file exports properly:
export class EventBus {
  constructor(logger: any) {
    // constructor logic
  }
}

// OR as default:
export default class EventBus {
  constructor(logger: any) {
    // constructor logic  
  }
}
```

## Debugging Steps:
1. Check the actual event-bus file export syntax
2. Verify import statement matches export type
3. Ensure TypeScript compilation is working
4. Check for circular dependencies
5. Verify file paths are correct

This should resolve the EventBus constructor error.