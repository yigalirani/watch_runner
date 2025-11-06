## Watch Runner

Module to add watch functionality to your node scripts. Usefull to move that logic away from your `package.json`

### Install

```bash
npm install @yigal/watch_runner
```

### Example 1 `watch_biome.ts`:
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

### Example 2 `watch_esbuild.ts`
You can also use a function as `cmd`:
```typescript
import * as esbuild from 'esbuild'
import {run} from '@yigal/watch_runner'
async function cmd(){
  await esbuild.build({ 
    entryPoints: ['src/index.ts'],
    platform: 'node',
    bundle: true,
    outdir: './dist', 
    sourcemap: true,
    target: 'node10',
    minifySyntax:false,
  })
} 
 
await run({cmd,title:'build',watchfiles:['src','package.json','tsconfig.json']})
```