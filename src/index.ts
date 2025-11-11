
import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
type FilterFunc=(line:string)=>string|true|false //string-show just the string  +line number, true show as is, false dont show
const green='\x1b[40m\x1b[32m'
const red='\x1b[40m\x1b[31m'
const reset='\x1b[0m'
export const eslint_linting_code:FilterFunc=(line:string)=>{
  if (line.split(' eslintrc:').length>1)
    return false
  const split=line.split(' eslint:')[1]//Linting code for ');
  if (split==null)
    return true
  const split2=split.split('Linting code for ')[1]
  if (split2==null)
    return false
  return split2
}
function waitForAbort(controller: AbortController): Promise<void> {
  const { signal } = controller;
  controller.abort()
  return new Promise<void>((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    signal.addEventListener('abort', () => resolve(), { once: true });
  });
}
class WorkerListenr{
  start_time:number=0
  last_line=''
  count=0
  filter:FilterFunc
  effective_title:string
  reason:string
  constructor(filter:FilterFunc,effective_title:string,reason:string){
    this.reason=reason
    this.filter=filter
    this.effective_title=effective_title
  }
  print_filtered(line:string){
    const filtered=this.filter(line)
    if (filtered===false)
      return 
    if (filtered===true){
      console.log(line)
      return 
    }
    console.log(this.count++,filtered)
  }  
  start(){
    process.stdout.write('\x1Bc'); //clear screen
    console.log('running:',green,this.effective_title,reset) 
    console.log('reason :',green,this.reason,reset)
    console.log('cli    :',green,process.argv.slice(1).join(' '),reset)
    console.log('time   :',green,new Date().toLocaleTimeString('en-US', { hour12: true }),reset)
    this.start_time=Date.now()
  }
  elapsed(){
    return `elapsed: ${Date.now()-this.start_time} ms`
  }
  flush(){
    this.print_filtered(this.last_line)
  }
  exit(code:number){
    this.flush()
    if (code===0)
      console.log(green,'done ok ',reset,this.elapsed())
    else
      console.log(red,'done with fail code',code,reset,this.elapsed())
  }

  error(err:unknown){
    this.flush()
    const message=err instanceof Error?err.message:String(err)
    console.log(red,'failed',message,reset,this.elapsed())
  }
  data(a:string){
    const total_text=this.last_line+a
    const lines=total_text.split('\n')
    for (const  line of lines.slice(0,-1))
      this.print_filtered(line)
  
    this.last_line=lines.at(-1)||''
  }
}

function allways_true(_a:string){
  return true
}

function run_cmd({
  cmd,
  worker_listener
}: {
  cmd: string;
  worker_listener:WorkerListenr
}):AbortController {
  const ans=new AbortController()
  const {signal}=ans
  void new Promise((resolve, _reject) => { 
  
    const child = spawn(cmd, {
      signal,
      shell: true,
      env: { ...process.env, FORCE_COLOR: "1" },  
    });
    child.on('spawn',()=>worker_listener.start())
    child.stdout.on("data", (data:unknown) => worker_listener.data(String(data)))
    child.stderr.on("data", (data:unknown) => worker_listener.data(String(data)))
    child.on("exit", (code) => {
      if (code!=null)
        worker_listener.exit(code)
      resolve(null);
    });

    child.on("error", (err) => {
      worker_listener.error(err)
      resolve(null);
    });
  });
  return ans
}

export  async function run({cmd,title,watchfiles=[],filter=allways_true}:{
  cmd:string
  title?:string
  watchfiles?:string[]
  filter?:FilterFunc
}){
  const effective_title=function(){
    if (title!=null)
      return title
    if (typeof cmd==='string') 
      return cmd
    return ''
  }()
  let last_run=0
  let last_changed=0
  let filename_changed=''
  function runit(reason:string){
    last_run=Date.now()
    let controller=new AbortController()
    const worker_listener=new WorkerListenr(filter,effective_title||'',reason)
    try{
      controller=run_cmd({cmd:cmd,worker_listener})
    }catch(ex){
      worker_listener.error(ex)  
      //console.log(`failed ${effective_title||''} ${duration} ms: ${String(ex)}`)      
    }
    return controller
  }
  let controller=runit('initial')
  for (const filename of watchfiles){
    try{
      console.log(`watching ${filename}`)
      watch(filename,{},(eventType, changed_file) => {
        const changed=`*${filename}/${changed_file} `  
        //console.log(changed);
        last_changed=Date.now()
        filename_changed=changed
      }) 
    }catch(ex){
      console.warn(`file not found, ignoring ${filename}: ${String(ex)}`)  
    }
  }
  while (true) { 
    //console.log('loop',last_changed , last_run,last_changed > last_run)
    if (last_changed > last_run) {  
      await waitForAbort(controller)
      controller= runit(filename_changed)
    }
    await new Promise(r => setTimeout(r, 1000)); // wait 1s before next iteration
  }  
}
