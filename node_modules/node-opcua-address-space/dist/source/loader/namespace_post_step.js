"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promoteObjectsAndVariables = exports.promoteObjectAndVariablesInNamespace = exports.g_promotableObject = void 0;
const node_opcua_data_model_1 = require("node-opcua-data-model");
const node_opcua_debug_1 = require("node-opcua-debug");
const debugLog = (0, node_opcua_debug_1.make_debugLog)(__filename);
const doDebug = (0, node_opcua_debug_1.checkDebugFlag)(__filename);
exports.g_promotableObject = {};
function parentIsObjectOrVariableType(node) {
    if (node.parent && (node.parent.nodeClass === node_opcua_data_model_1.NodeClass.VariableType || node.parent?.nodeClass === node_opcua_data_model_1.NodeClass.ObjectType)) {
        return true;
    }
    if (!node.parent) {
        return false;
    }
    return parentIsObjectOrVariableType(node.parent);
}
async function promoteObjectAndVariablesInNamespace(namespace) {
    const namespaceP = namespace;
    for (const a of namespaceP.nodeIterator()) {
        if (a.nodeClass === node_opcua_data_model_1.NodeClass.Object || a.nodeClass === node_opcua_data_model_1.NodeClass.Variable) {
            // skip object & variable that belong to a ObjectType or VariableType
            const aa = a;
            if (aa.typeDefinition) {
                const promoter = exports.g_promotableObject[aa.typeDefinition.toString()];
                if (promoter) {
                    if (promoter.onInstanceOnly && parentIsObjectOrVariableType(aa)) {
                        continue;
                    }
                    const before = a.constructor.name;
                    promoter.promoter(a);
                    const after = a.constructor.name;
                    // istanbul ignore next
                    if (doDebug) {
                        debugLog(`promoting ${a.browseName.toString()} from ${before} to ${after}`);
                    }
                }
            }
        }
    }
}
exports.promoteObjectAndVariablesInNamespace = promoteObjectAndVariablesInNamespace;
async function promoteObjectsAndVariables(addressSpace) {
    for (const namespace of addressSpace.getNamespaceArray()) {
        promoteObjectAndVariablesInNamespace(namespace);
    }
}
exports.promoteObjectsAndVariables = promoteObjectsAndVariables;
//# sourceMappingURL=namespace_post_step.js.map