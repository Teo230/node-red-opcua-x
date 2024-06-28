import { CreateSelfSignCertificateWithConfigParam } from "../common";
/**
 * @param certificate: the filename of the certificate to create
 */
export declare function createSelfSignedCertificate(certificate: string, params: CreateSelfSignCertificateWithConfigParam, callback: (err?: Error | null) => void): void;
