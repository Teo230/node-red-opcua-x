import { ErrorCallback } from "async";
import { ExecuteOptions } from "./execute_openssl";
export declare function createRandomFile(randomFile: string, options: ExecuteOptions, callback: (err?: Error) => void): void;
export declare function createRandomFileIfNotExist(randomFile: string, options: ExecuteOptions, callback: ErrorCallback): void;
export declare function useRandFile(): boolean;
