
import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
type FilterFunc=(line:string)=>string|true|false //string-show just the string  +line number, true show as is, false dont show

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
  start_message:string
  constructor(filter:FilterFunc,start_message:string){
    this.filter=filter
    this.start_message=start_message
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
    console.log(this.start_message,'=================================================================')
    this.start_time=Date.now()
  }
  elapsed(){
    return `elapsed=${Date.now()-this.start_time}ms`
  }
  flush(){
    this.print_filtered(this.last_line)
  }
  close(code:number|null){
    this.flush()
    console.warn(`exited,code=${code},${this.elapsed()}`);
  }
  error(err:unknown){
    this.flush()
    console.warn(`failed,err=${err},${this.elapsed()}`);
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
    child.on("close", (code) => {
      worker_listener.close(code)
      resolve(null);
    });

    child.on("exit", (err) => {
      worker_listener.error(err)
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
  cmd:string|(()=>Promise<void>)
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
    const worker_listener=new WorkerListenr(filter,`starting ${effective_title||''}: ${reason}`)
    try{
      if (typeof cmd==='string')
        controller=run_cmd({cmd:cmd,worker_listener})
      else
        console.log('todo: run function')
        //await cmd()
    }catch(ex){
      worker_listener.error(ex)  
      //console.log(`failed ${effective_title||''} ${duration} ms: ${String(ex)}`)      
    }
    return controller
  }
  let controller=runit('initial')
  for (const filename of watchfiles){
    watch(filename,{},(eventType, changed_file) => {
      const changed=`changed: ${filename}/${changed_file} `
      console.log(changed);
      last_changed=Date.now()
      filename_changed=changed
    }) 
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
