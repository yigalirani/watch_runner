import {run,eslint_linting_code} from '../src/index.ts'
run({
  cmd:'set timing=1&npx eslint . --debug --color ',
  watchfiles:[
    'src',
    'bin',
    'package.json',
    'eslint.config.mjs',
    'tsconfig.json'
    
  ],
  filter:eslint_linting_code
})  
