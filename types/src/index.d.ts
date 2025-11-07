type FilterFunc = (line: string) => string | true | false;
export declare const eslint_linting_code: FilterFunc;
export declare function run({ cmd, title, watchfiles, filter }: {
    cmd: string | (() => Promise<void>);
    title?: string;
    watchfiles?: string[];
    filter?: FilterFunc;
}): Promise<void>;
export {};
