"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmAllConditions = exports.acknowledgeAllConditions = exports.findActiveConditions = exports.confirmCondition = exports.acknowledgeCondition = void 0;
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
const node_opcua_service_filter_1 = require("node-opcua-service-filter");
const node_opcua_service_read_1 = require("node-opcua-service-read");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const node_opcua_variant_1 = require("node-opcua-variant");
const node_opcua_debug_1 = require("node-opcua-debug");
const client_alarm_1 = require("./client_alarm");
const client_alarm_tools_extractConditionFields_1 = require("./client_alarm_tools_extractConditionFields");
const client_tools_1 = require("./client_tools");
const doDebug = (0, node_opcua_debug_1.checkDebugFlag)(__filename);
const debugLog = (0, node_opcua_debug_1.make_debugLog)(__filename);
const errorLog = (0, node_opcua_debug_1.make_errorLog)(__filename);
/**
 *
 * @param session
 * @param eventStuff
 * @param comment
 */
async function acknowledgeCondition(session, eventStuff, comment) {
    try {
        const conditionId = eventStuff.conditionId.value;
        const eventId = eventStuff.eventId.value;
        return await session.acknowledgeCondition(conditionId, eventId, comment);
    }
    catch (err) {
        errorLog("Acknowledging alarm has failed !", err);
        return node_opcua_status_code_1.StatusCodes.BadInternalError;
    }
}
exports.acknowledgeCondition = acknowledgeCondition;
async function confirmCondition(session, eventStuff, comment) {
    try {
        const conditionId = eventStuff.conditionId.value;
        const eventId = eventStuff.eventId.value;
        return await session.confirmCondition(conditionId, eventId, comment);
    }
    catch (err) {
        errorLog("Acknowledging alarm has failed !", err);
        return node_opcua_status_code_1.StatusCodes.BadInternalError;
    }
}
exports.confirmCondition = confirmCondition;
/**
 * Enumerate all events
 * @param session
 */
async function findActiveConditions(session) {
    const request = {
        maxNotificationsPerPublish: 10000,
        priority: 6,
        publishingEnabled: true,
        requestedLifetimeCount: 1000,
        requestedMaxKeepAliveCount: 100,
        requestedPublishingInterval: 100
    };
    const subscription = await session.createSubscription2(request);
    const itemToMonitor = {
        attributeId: node_opcua_service_read_1.AttributeIds.EventNotifier,
        nodeId: (0, node_opcua_nodeid_1.resolveNodeId)("Server") // i=2253
    };
    const fields = await (0, client_alarm_tools_extractConditionFields_1.extractConditionFields)(session, "AcknowledgeableConditionType");
    // note: we may want to have this select clause
    //  Or(OfType("AcknowledgeableConditionType"), OfType("RefreshStartEventType"), OfType("RefreshEndEventType"))
    const eventFilter = (0, node_opcua_service_filter_1.constructEventFilter)(fields);
    const monitoringParameters = {
        discardOldest: false,
        filter: eventFilter,
        queueSize: 100,
        samplingInterval: 0
    };
    const event_monitoringItem = await subscription.monitor(itemToMonitor, monitoringParameters, node_opcua_service_read_1.TimestampsToReturn.Both);
    const acknowledgeableConditions = [];
    let refreshStartEventHasBeenReceived = false;
    let RefreshEndEventHasBeenReceived = false;
    const RefreshStartEventType = (0, node_opcua_nodeid_1.resolveNodeId)("RefreshStartEventType").toString();
    const RefreshEndEventType = (0, node_opcua_nodeid_1.resolveNodeId)("RefreshEndEventType").toString();
    const promise = new Promise((resolve, reject) => {
        // now create a event monitored Item
        event_monitoringItem.on("changed", (_eventFields) => {
            const eventFields = _eventFields;
            try {
                if (RefreshEndEventHasBeenReceived) {
                    return;
                }
                // dumpEvent(session, fields, eventFields);
                const pojo = (0, client_alarm_1.fieldsToJson)(fields, eventFields);
                // make sure we only start recording event after the RefreshStartEvent has been received
                if (!refreshStartEventHasBeenReceived) {
                    if (pojo.eventType.value.toString() === RefreshStartEventType) {
                        refreshStartEventHasBeenReceived = true;
                    }
                    return;
                }
                if (pojo.eventType.value.toString() === RefreshEndEventType) {
                    RefreshEndEventHasBeenReceived = true;
                    resolve();
                    return;
                }
                if (!pojo.conditionId.value) {
                    // not a Acknowledgeable condition
                    return;
                }
                if (pojo.ackedState.id.dataType === node_opcua_variant_1.DataType.Boolean) {
                    acknowledgeableConditions.push(pojo);
                }
            }
            catch (err) {
                errorLog("Error !!", err);
            }
        });
        // async call without waiting !
        try {
            (0, client_tools_1.callConditionRefresh)(subscription);
        }
        catch (err) {
            // it is possible that server do not implement conditionRefresh ...
            debugLog("Server may not implement conditionRefresh", err);
        }
    });
    await promise;
    // now shut down subscription
    await subscription.terminate();
    return acknowledgeableConditions;
}
exports.findActiveConditions = findActiveConditions;
async function acknowledgeAllConditions(session, message) {
    try {
        let conditions = await findActiveConditions(session);
        if (conditions.length === 0) {
            debugLog("Warning: cannot find conditions ");
        }
        // filter acknowledgeable conditions (no acked yet)
        conditions = conditions.filter((pojo) => pojo.ackedState.id.value === false);
        const promises = [];
        for (const eventStuff of conditions) {
            promises.push(acknowledgeCondition(session, eventStuff, message));
        }
        const result = await Promise.all(promises);
        // istanbul ignore next
        if (doDebug) {
            debugLog("Acked all results: ", result.map((e) => e.toString()).join(" "));
        }
    }
    catch (err) {
        errorLog("Error", err);
    }
}
exports.acknowledgeAllConditions = acknowledgeAllConditions;
async function confirmAllConditions(session, message) {
    try {
        let conditions = await findActiveConditions(session);
        if (conditions.length === 0) {
            debugLog("Warning: cannot find conditions ");
        }
        // filter acknowledgeable conditions (no acked yet)
        conditions = conditions.filter((pojo) => pojo.confirmedState.id.value === false);
        const promises = [];
        for (const eventStuff of conditions) {
            promises.push(confirmCondition(session, eventStuff, message));
        }
        const result = await Promise.all(promises);
        // istanbul ignore next
        if (doDebug) {
            debugLog("Confirm all results: ", result.map((e) => e.toString()).join(" "));
        }
    }
    catch (err) {
        errorLog("Error", err);
    }
}
exports.confirmAllConditions = confirmAllConditions;
//# sourceMappingURL=client_alarm_tools_acknowledge_all_conditions.js.map