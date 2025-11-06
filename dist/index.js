import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
export const eslint_linting_code = (line) => {
    if (line.split(' eslintrc:').length > 1)
        return false;
    const split = line.split(' eslint:')[1]; //Linting code for ');
    if (split == null)
        return true;
    const split2 = split.split('Linting code for ')[1];
    if (split2 == null)
        return false;
    return split2;
};
function make_filter_stream(filter) {
    let last_line = '';
    let count = 0;
    function print_filtered(line) {
        const filtered = filter(line);
        if (filtered === false)
            return;
        if (filtered === true) {
            console.log(line);
            return;
        }
        console.log(count++, filtered);
    }
    return {
        write(a) {
            const total_text = last_line + a;
            const lines = total_text.split('\n');
            for (const line of lines.slice(0, -1))
                print_filtered(line);
            last_line = lines.at(-1) || '';
        },
        flush() {
            print_filtered(last_line);
        }
    };
}
function allways_true(_a) {
    return true;
}
async function run_cmd({ cmd, filter = allways_true, }) {
    const filter_stream = make_filter_stream(filter);
    return await new Promise((resolve, reject) => {
        const child = spawn(cmd, {
            shell: true,
            env: { ...process.env, FORCE_COLOR: "1" },
        });
        child.stdout.on("data", (data) => {
            filter_stream.write(String(data));
        });
        child.stderr.on("data", (data) => {
            filter_stream.write(String(data));
        });
        child.on("close", (code) => {
            filter_stream.flush();
            console.warn(`process exited with code ${code}`);
            resolve(null);
        });
        child.on("error", (err) => {
            reject(err);
        });
    });
}
export async function run({ cmd, title, watchfiles = [], filter }) {
    const effective_title = function () {
        if (title != null)
            return title;
        if (typeof cmd === 'string')
            return cmd;
        return '';
    }();
    let last_run = 0;
    let last_changed = 0;
    let filename_changed = '';
    async function runit(reason) {
        last_run = Date.now();
        console.clear();
        console.log(`starting ${effective_title || ''} ${reason}`);
        const start = Date.now();
        try {
            if (typeof cmd === 'string')
                await run_cmd({ cmd: cmd, filter });
            else
                await cmd();
            const end = Date.now();
            const duration = (end - start);
            console.log(`done ${effective_title || ''} ${duration} ms`);
        }
        catch (ex) {
            const end = Date.now();
            const duration = (end - start);
            console.log(`failed ${effective_title || ''} ${duration} ms: ${String(ex)}`);
        }
    }
    await runit('initial');
    for (const filename of watchfiles) {
        watch(filename, {}, (eventType, filename) => {
            //console.log(`changed: ${filename} ,${eventType}`);
            last_changed = Date.now();
            if (filename != null)
                filename_changed = filename;
        });
    }
    setInterval(() => {
        if (last_changed > last_run) {
            void runit(`file changed ${filename_changed}`);
        }
    }, 1000);
}
//# sourceMappingURL=index.js.map