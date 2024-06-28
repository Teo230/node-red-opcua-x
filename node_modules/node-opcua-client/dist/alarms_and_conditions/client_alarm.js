"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fieldsToJson = exports.ClientAlarm = void 0;
const events_1 = require("events");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_debug_1 = require("node-opcua-debug");
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
const node_opcua_utils_1 = require("node-opcua-utils");
const node_opcua_variant_1 = require("node-opcua-variant");
const warningLog = (0, node_opcua_debug_1.make_warningLog)(__filename);
/**
 * describes a OPCUA Alarm as seen in the client side
 */
class ClientAlarm extends events_1.EventEmitter {
    constructor(eventFields) {
        super();
        this.conditionId = (0, node_opcua_nodeid_1.resolveNodeId)(eventFields.conditionId.value);
        this.eventType = (0, node_opcua_nodeid_1.resolveNodeId)(eventFields.eventType.value);
        this.eventId = eventFields.eventId.value;
        this.fields = eventFields;
        this.update(eventFields);
    }
    async acknowledge(session, comment) {
        return await session.acknowledgeCondition(this.conditionId, this.eventId, comment);
    }
    async confirm(session, comment) {
        return await session.confirmCondition(this.conditionId, this.eventId, comment);
    }
    update(eventFields) {
        (0, node_opcua_assert_1.assert)(this.conditionId.toString() === (0, node_opcua_nodeid_1.resolveNodeId)(eventFields.conditionId.value).toString());
        (0, node_opcua_assert_1.assert)(this.eventType.toString() === (0, node_opcua_nodeid_1.resolveNodeId)(eventFields.eventType.value).toString());
        this.eventId = eventFields.eventId.value;
        this.fields = eventFields;
    }
    getRetain() {
        return this.fields.retain.value;
    }
    toString() {
        return (this.constructor.name +
            ": " +
            this.conditionId.toString() +
            " " +
            this.eventType.toString() +
            " " +
            Object.entries(this.fields)
                .filter(([key, value]) => value.dataType !== node_opcua_variant_1.DataType.Null)
                .map(([key, value]) => key.padEnd(30) + "=" + value.toString())
                .join("\n") +
            "\n\n");
    }
    getField(fieldName) {
        return this.fields[fieldName] || null;
    }
}
exports.ClientAlarm = ClientAlarm;
/**
 * @private
 */
function fieldsToJson(fields, eventFields, flat) {
    function setProperty(_data, fieldName, value) {
        let name;
        if (!fieldName || value === null) {
            return;
        }
        if (!flat) {
            const f = fieldName.split(".");
            if (f.length === 1) {
                fieldName = (0, node_opcua_utils_1.lowerFirstLetter)(fieldName);
                _data[fieldName] = value;
            }
            else {
                for (let i = 0; i < f.length - 1; i++) {
                    name = (0, node_opcua_utils_1.lowerFirstLetter)(f[i]);
                    _data[name] = _data[name] || {};
                    _data = _data[name];
                }
                name = (0, node_opcua_utils_1.lowerFirstLetter)(f[f.length - 1]);
                _data[name] = value;
            }
        }
        else {
            const name = fieldName.split(".").map(node_opcua_utils_1.lowerFirstLetter).join(".");
            _data[name] = value;
        }
    }
    if (fields.length > eventFields.length) {
        warningLog("warning fields.length !==  eventFields.length", fields.length, eventFields.length);
    }
    const data = {};
    for (let index = 0; index < fields.length; index++) {
        const variant = eventFields[index];
        setProperty(data, fields[index], variant);
    }
    return data;
}
exports.fieldsToJson = fieldsToJson;
//# sourceMappingURL=client_alarm.js.map