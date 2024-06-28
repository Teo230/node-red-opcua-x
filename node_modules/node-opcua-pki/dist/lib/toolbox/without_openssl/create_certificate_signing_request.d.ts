import { CreateCertificateSigningRequestWithConfigOptions } from "../common";
/**
 * create a certificate signing request
 *
 * @param certificateSigningRequestFilename
 * @param params
 * @param callback
 */
export declare function createCertificateSigningRequestAsync(certificateSigningRequestFilename: string, params: CreateCertificateSigningRequestWithConfigOptions): Promise<void>;
export declare function createCertificateSigningRequest(certificateSigningRequestFilename: string, params: CreateCertificateSigningRequestWithConfigOptions, callback: (err?: Error) => void): void;
