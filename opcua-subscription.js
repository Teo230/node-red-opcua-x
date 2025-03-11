// See example https://github.com/node-opcua/node-opcua/blob/af235f19e9e353fa748c11009b1300f76026fb28/packages/playground/client_with_simple_subscription.js#L83
module.exports = function (RED) {

    const {
        GetClient,
        IsValidNodeId,
        eventEmitter
    } = require('./core');
    const {
        ClientMonitoredItem,
        AttributeIds,
        TimestampsToReturn
    } = require('node-opcua');

    function opcUaSubscriptionNode(args) {

        RED.nodes.createNode(this, args);
        const opcuaclientnode = RED.nodes.getNode(args.client);

        let node = this;
        node.nodeId = args.nodeid;
        node.samplinginterval = args.samplinginterval;

        const isValid = IsValidNodeId(node.nodeId);
        if(!isValid){
            node.error(node.nodeId + " is not a valid NodeId");
            return;
        }

        node.on('close', onNodeClosed);
        let monitoredItem = new ClientMonitoredItem();

        eventEmitter.on('subscription_created', onSubscriptionCreated);

        function onSubscriptionCreated(connectionId) {
            const existingClient = GetClient(connectionId);
            let subscription = existingClient.session.subscription;
            if (monitoredItem?.monitoredItemId) return;
            monitorItem(subscription);
        }

        async function onNodeClosed(done) {
            eventEmitter.removeListener('subscription_created', onSubscriptionCreated);

            if (monitoredItem?.monitoredItemId) {
                monitoredItem.removeListener("changed", onMonitoredItemDataChanged);
                monitoredItem.terminate();
                monitoredItem = null;
            }

            done();
        }

        function monitorItem(subscription) {
            const itemToMonitor = {
                nodeId: node.nodeId,
                attributeId: AttributeIds.Value
            };

            const parameters = {
                samplingInterval: node.samplinginterval,
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

        function onMonitoredItemDataChanged(dataValue){
            const dataValueString = JSON.stringify(dataValue);
            const dataValueObj = JSON.parse(dataValueString);
            node.send({ payload: dataValueObj });
        }
    }

    RED.nodes.registerType("opcua-subscription", opcUaSubscriptionNode);
}