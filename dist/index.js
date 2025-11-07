"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  eslint_linting_code: () => eslint_linting_code,
  run: () => run
});
module.exports = __toCommonJS(index_exports);
var import_node_child_process = require("child_process");
var import_node_fs = require("fs");
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
var WorkerListenr = class {
  constructor(filter, effective_title) {
    __publicField(this, "start_time", 0);
    __publicField(this, "last_line", "");
    __publicField(this, "count", 0);
    __publicField(this, "filter");
    __publicField(this, "effective_title");
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
    console.clear();
    console.log("=================================================================");
    this.start_time = Date.now();
  }
  elapsed() {
    return `elapsed=${Date.now() - this.start_time}ms`;
  }
  flush() {
    this.print_filtered(this.last_line);
  }
  close(code) {
    this.flush();
    console.warn(`exited,code=${code},${this.elapsed()}`);
  }
  error(err) {
    this.flush();
    console.warn(`failed,err=${err},${this.elapsed()}`);
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
  void new Promise((resolve, reject) => {
    const child = (0, import_node_child_process.spawn)(cmd, {
      signal,
      shell: true,
      env: { ...process.env, FORCE_COLOR: "1" }
    });
    child.on("spawn", () => worker_listener.start());
    child.stdout.on("data", (data) => worker_listener.data(String(data)));
    child.stderr.on("data", (data) => worker_listener.data(String(data)));
    child.on("close", (code) => {
      worker_listener.close(code);
      resolve(null);
    });
    child.on("exit", (err) => {
      worker_listener.error(err);
      resolve(null);
    });
    child.on("error", (err) => {
      worker_listener.error(err);
      resolve(null);
    });
  });
  return ans;
}
function run({ cmd, title, watchfiles = [], filter = allways_true }) {
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
    console.clear();
    console.log(`starting ${effective_title || ""} ${reason}`);
    let controller2 = new AbortController();
    const worker_listener = new WorkerListenr(filter, effective_title);
    try {
      if (typeof cmd === "string")
        controller2 = run_cmd({ cmd, worker_listener });
      else
        console.log("todo: run function");
    } catch (ex) {
      worker_listener.error(ex);
    }
    return controller2;
  }
  let controller = runit("initial");
  for (const filename of watchfiles) {
    (0, import_node_fs.watch)(filename, {}, (eventType, filename2) => {
      last_changed = Date.now();
      if (filename2 != null)
        filename_changed = filename2;
    });
  }
  setInterval(() => {
    if (last_changed > last_run) {
      controller.abort();
      controller = runit(`file changed ${filename_changed}`);
    }
  }, 1e3);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  eslint_linting_code,
  run
});
//# sourceMappingURL=index.js.map
