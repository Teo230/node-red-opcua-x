import { BaseNode, UAMethod, UAObject, UAVariable, CloneFilter } from "node-opcua-address-space-base";
export declare class MandatoryChildOrRequestedOptionalFilter implements CloneFilter {
    private readonly instance;
    private readonly optionalsMap;
    private readonly references;
    constructor(instance: BaseNode, optionalsMap: any);
    shouldKeep(node: BaseNode): boolean;
    filterFor(childInstance: UAVariable | UAObject | UAMethod): CloneFilter;
}
