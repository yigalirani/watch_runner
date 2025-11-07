import * as esbuild from 'esbuild'
import {run} from '../src/index.ts'
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
 
run({
  cmd,
  title:'build',
  watchfiles:[
    'src',
    'package.json',
    'tsconfig.json'
  ]
})
