var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/index.ts
import { spawn } from "child_process";
import { watch } from "fs";
var green = "\x1B[40m\x1B[32m";
var red = "\x1B[40m\x1B[31m";
var reset = "\x1B[0m";
var eslint_linting_code = (line) => {
  if (line.split(" eslintrc:").length > 1)
    return false;
  const split = line.split(" eslint:")[1];
  if (split == null)
    return true;
  const split2 = split.split("Linting code for ")[1];
  if (split2 == null)
    return false;
  return split2;
};
function waitForAbort(controller) {
  const { signal } = controller;
  controller.abort();
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    signal.addEventListener("abort", () => resolve(), { once: true });
  });
}
var WorkerListenr = class {
  constructor(filter, effective_title, reason) {
    __publicField(this, "start_time", 0);
    __publicField(this, "last_line", "");
    __publicField(this, "count", 0);
    __publicField(this, "filter");
    __publicField(this, "effective_title");
    __publicField(this, "reason");
    this.reason = reason;
    this.filter = filter;
    this.effective_title = effective_title;
  }
  print_filtered(line) {
    const filtered = this.filter(line);
    if (filtered === false)
      return;
    if (filtered === true) {
      console.log(line);
      return;
    }
    console.log(this.count++, filtered);
  }
  start() {
    process.stdout.write("\x1Bc");
    console.log("running:", green, this.effective_title, reset);
    console.log("reason :", green, this.reason, reset);
    console.log("cli    :", green, process.argv.slice(1).join(" "), reset);
    console.log("time   :", green, (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", { hour12: true }), reset);
    this.start_time = Date.now();
  }
  elapsed() {
    return `elapsed: ${Date.now() - this.start_time} ms`;
  }
  flush() {
    this.print_filtered(this.last_line);
  }
  exit(code) {
    this.flush();
    if (code === 0)
      console.log(green, "done ok ", reset, this.elapsed());
    else
      console.log(red, "done with fail code", code, reset, this.elapsed());
  }
  error(err) {
    this.flush();
    const message = err instanceof Error ? err.message : String(err);
    console.log(red, "failed", message, reset, this.elapsed());
  }
  data(a) {
    const total_text = this.last_line + a;
    const lines = total_text.split("\n");
    for (const line of lines.slice(0, -1))
      this.print_filtered(line);
    this.last_line = lines.at(-1) || "";
  }
};
function allways_true(_a) {
  return true;
}
function run_cmd({
  cmd,
  worker_listener
}) {
  const ans = new AbortController();
  const { signal } = ans;
  void new Promise((resolve, _reject) => {
    const child = spawn(cmd, {
      signal,
      shell: true,
      env: { ...process.env, FORCE_COLOR: "1" }
    });
    child.on("spawn", () => worker_listener.start());
    child.stdout.on("data", (data) => worker_listener.data(String(data)));
    child.stderr.on("data", (data) => worker_listener.data(String(data)));
    child.on("exit", (code) => {
      if (code != null)
        worker_listener.exit(code);
      resolve(null);
    });
    child.on("error", (err) => {
      worker_listener.error(err);
      resolve(null);
    });
  });
  return ans;
}
async function run({ cmd, title, watchfiles = [], filter = allways_true }) {
  const effective_title = (function() {
    if (title != null)
      return title;
    if (typeof cmd === "string")
      return cmd;
    return "";
  })();
  let last_run = 0;
  let last_changed = 0;
  let filename_changed = "";
  function runit(reason) {
    last_run = Date.now();
    let controller2 = new AbortController();
    const worker_listener = new WorkerListenr(filter, effective_title || "", reason);
    try {
      controller2 = run_cmd({ cmd, worker_listener });
    } catch (ex) {
      worker_listener.error(ex);
    }
    return controller2;
  }
  let controller = runit("initial");
  for (const filename of watchfiles) {
    try {
      console.log(`watching ${filename}`);
      watch(filename, {}, (eventType, changed_file) => {
        const changed = `*${filename}/${changed_file} `;
        last_changed = Date.now();
        filename_changed = changed;
      });
    } catch (ex) {
      console.warn(`file not found, ignoring ${filename}: ${String(ex)}`);
    }
  }
  while (true) {
    if (last_changed > last_run) {
      await waitForAbort(controller);
      controller = runit(filename_changed);
    }
    await new Promise((r) => setTimeout(r, 1e3));
  }
}
export {
  eslint_linting_code,
  run
};
//# sourceMappingURL=index.js.map
