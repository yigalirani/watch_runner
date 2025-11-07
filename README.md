## Watch Runner

Module to add watch functionality to your node scripts. Usefull to move that logic away from your `package.json`

### Install

```bash
npm install @yigal/watch_runner
```

### Example `watch_biome.ts`:
Rerun an npx command on change of specified `watchfiles`:
```typescript
import {run} from '@yigal/watch_runner.ts'
await run({
  cmd:'npx biome lint',
  watchfiles:[
    'src',
    'biome.json',
    'package.json'
  ]
})
```