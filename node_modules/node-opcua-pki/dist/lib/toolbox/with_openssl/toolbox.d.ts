import { Filename } from "../common";
import { ExecuteOptions } from "./execute_openssl";
export declare function generateStaticConfig(configPath: string, options?: ExecuteOptions): string;
/**
 *   calculate the public key from private key
 *   openssl rsa -pubout -in private_key.pem
 *
 * @method getPublicKeyFromPrivateKey
 * @param privateKeyFilename
 * @param publicKeyFilename
 * @param callback
 */
export declare function getPublicKeyFromPrivateKey(privateKeyFilename: string, publicKeyFilename: string, callback: (err: Error | null) => void): void;
/**
 * extract public key from a certificate
 *   openssl x509 -pubkey -in certificate.pem -nottext
 *
 * @method getPublicKeyFromCertificate
 * @param certificateFilename
 * @param publicKeyFilename
 * @param callback
 */
export declare function getPublicKeyFromCertificate(certificateFilename: string, publicKeyFilename: string, callback: (err: Error | null) => void): void;
export declare function x509Date(date?: Date): string;
/**
 * @param certificate - the certificate file in PEM format, file must exist
 * @param callback
 */
export declare function dumpCertificate(certificate: Filename, callback: (err: Error | null, output?: string) => void): void;
export declare function toDer(certificatePem: string, callback: (err: Error | null, output?: string) => void): void;
export declare function fingerprint(certificatePem: string, callback: (err: Error | null, output?: string) => void): void;
