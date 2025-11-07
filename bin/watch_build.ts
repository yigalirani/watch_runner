import {run} from '../src/index.ts'

 
void run({
  cmd:'node bin/run_build.ts',
  title:'build',
  watchfiles:[
    'src',
    'package.json',
    'tsconfig.json'
  ]
})
