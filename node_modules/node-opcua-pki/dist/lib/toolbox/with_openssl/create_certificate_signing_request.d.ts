import { CreateCertificateSigningRequestWithConfigOptions } from "../common";
/**
 * create a certificate signing request
 *
 * @param certificateSigningRequestFilename
 * @param params
 * @param callback
 */
export declare function createCertificateSigningRequest(certificateSigningRequestFilename: string, params: CreateCertificateSigningRequestWithConfigOptions, callback: (err?: Error) => void): void;
export declare const createCertificateSigningRequestAsync: (arg1: string, arg2: CreateCertificateSigningRequestWithConfigOptions) => Promise<void>;
