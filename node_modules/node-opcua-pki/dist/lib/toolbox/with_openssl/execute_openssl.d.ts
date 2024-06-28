export interface ExecuteOptions {
    cwd?: string;
    hideErrorMessage?: boolean;
}
export declare function execute(cmd: string, options: ExecuteOptions, callback: Callback<string>): void;
export declare function find_openssl(callback: (err: Error | null, opensslPath?: string) => void): void;
export declare function ensure_openssl_installed(callback: (err?: Error) => void): void;
export declare function executeOpensslAsync(cmd: string, options: ExecuteOpenSSLOptions): Promise<string>;
export declare function execute_openssl_no_failure(cmd: string, options: ExecuteOpenSSLOptions, callback: Callback<string>): void;
export interface ExecuteOpenSSLOptions extends ExecuteOptions {
    openssl_conf?: string;
}
type Callback<T> = (err: Error | null, output?: T) => void;
export declare function execute_openssl(cmd: string, options: ExecuteOpenSSLOptions, callback: Callback<string>): void;
export {};
