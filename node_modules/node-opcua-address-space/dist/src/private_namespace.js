"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSymbols = exports.setSymbols = exports.getNodeIdManager = void 0;
function getNodeIdManager(ns) {
    const nodeIdManager = ns._nodeIdManager;
    return nodeIdManager;
}
exports.getNodeIdManager = getNodeIdManager;
function setSymbols(ns, symbols) {
    const nodeIdManager = getNodeIdManager(ns);
    ns.addressSpace.getOwnNamespace().registerSymbolicNames = true;
    nodeIdManager.setSymbols(symbols);
}
exports.setSymbols = setSymbols;
function getSymbols(ns) {
    const nodeIdManager = getNodeIdManager(ns);
    return nodeIdManager?.getSymbols() || [];
}
exports.getSymbols = getSymbols;
//# sourceMappingURL=private_namespace.js.map