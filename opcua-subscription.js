// See example https://github.com/node-opcua/node-opcua/blob/af235f19e9e353fa748c11009b1300f76026fb28/packages/playground/client_with_simple_subscription.js#L83
module.exports = function (RED) {

    const {
        GetClient,
        IsValidNodeId,
    } = require('./core');
    const {
        ClientMonitoredItem,
        AttributeIds,
        TimestampsToReturn
    } = require('node-opcua');

    function opcUaSubscriptionNode(args) {
        RED.nodes.createNode(this, args);

        let node = this;
        let monitoredItem = new ClientMonitoredItem();

        node.samplingInterval = args.samplingInterval;

        node.on('input', function (msg) {

            node.opcuax_client_id = msg.opcuax_client_id;
            const client = GetClient(node.opcuax_client_id);

            if (!client) {
                node.error("OPC UA Client not defined");
                return;
            }

            if (client.session == undefined) {
                node.error("Session not found");
                return;
            }

            // Override nodeId from incoming node if not defined on read node
            node.nodeId = msg.opcuax_subscribe?.nodeId;
            if (!node.nodeId) node.nodeId = args.nodeId;

            if (!node.nodeId) {
                node.error("NodeId not defined");
                return;
            }

            const isValid = IsValidNodeId(node.nodeId);
            if (!isValid) {
                node.error(node.nodeId + " is not a valid NodeId");
                return;
            }

            if(msg.opcuax_subscribe?.samplingInterval != undefined) node.samplingInterval = msg.opcuax_subscribe.samplingInterval;

            monitorItem(client);
        });
        node.on('close', onNodeClosed);
        node.on('error', onNodeError);

        async function onNodeClosed(done) {
            if (monitoredItem?.monitoredItemId) {
                monitoredItem.removeListener("changed", onMonitoredItemDataChanged);
                // await monitoredItem.terminate(); //TODO - Not working
                monitoredItem = null;
            }

            done();
        }

        async function onNodeError() {
            if (monitoredItem?.monitoredItemId) {
                monitoredItem.removeListener("changed", onMonitoredItemDataChanged);
                // await monitoredItem.terminate(); //TODO - Not working
                monitoredItem = null;
            }
        }

        function monitorItem(client) {
            const subscription = client.session.subscription;

            const itemToMonitor = {
                nodeId: node.nodeId,
                attributeId: AttributeIds.Value
            };

            const parameters = {
                samplingInterval: node.samplingInterval,
                discardOldest: true,
                queueSize: 10
            };

            monitoredItem = ClientMonitoredItem.create(
                subscription,
                itemToMonitor,
                parameters,
                TimestampsToReturn.Both
            );

            monitoredItem.on("changed", onMonitoredItemDataChanged);
        }

        function onMonitoredItemDataChanged(dataValue) {
            const dataValueString = JSON.stringify(dataValue);
            const dataValueObj = JSON.parse(dataValueString);
            node.send({
                payload: node.payload,
                opcuax_client_id: node.opcuax_client_id,
                opcuax_subscribe: {
                    nodeId: node.nodeId,
                    result: dataValueObj
                }
            });
        }
    }

    RED.nodes.registerType("opcua-subscription", opcUaSubscriptionNode);
}