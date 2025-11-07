import {run} from '../src/index.ts'
void run({
  cmd:'npx tsc ',
  watchfiles:[
    'src',
    'bin',
    'package.json',
    'eslint.config.mjs',
    'tsconfig.json'
  ]
})  
