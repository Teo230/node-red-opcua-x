/// <reference types="node" />
/**
 * @module node-opcua-common
 */
import { EventEmitter } from "events";
import { Certificate, PrivateKey } from "node-opcua-crypto";
export interface ICertificateKeyPairProvider {
    getCertificate(): Certificate;
    getCertificateChain(): Certificate;
    getPrivateKey(): PrivateKey;
}
export interface ICertificateKeyPairProviderPriv extends ICertificateKeyPairProvider {
    $$certificate: null | Certificate;
    $$certificateChain: null | Certificate;
    $$privateKey: null | PrivateKey;
}
export interface IOPCUASecureObjectOptions {
    certificateFile?: string;
    privateKeyFile?: string;
}
/**
 * an object that provides a certificate and a privateKey
 * @class OPCUASecureObject
 * @param options
 * @param options.certificateFile {string}
 * @param options.privateKeyFile {string}
 * @constructor
 */
export declare class OPCUASecureObject extends EventEmitter implements ICertificateKeyPairProvider {
    readonly certificateFile: string;
    readonly privateKeyFile: string;
    constructor(options: IOPCUASecureObjectOptions);
    getCertificate(): Certificate;
    getCertificateChain(): Certificate;
    getPrivateKey(): PrivateKey;
}
