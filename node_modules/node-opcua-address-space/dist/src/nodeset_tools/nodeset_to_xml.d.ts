import { BaseNode } from "node-opcua-address-space-base";
export declare function sortByBrowseName(x: BaseNode, y: BaseNode): number;
type NodeIdString = string;
export interface BuildAliasesData {
    aliases: Record<string, NodeIdString>;
    aliases_visited?: Record<string, unknown>;
}
export interface DumpXMLOptions {
}
export {};
