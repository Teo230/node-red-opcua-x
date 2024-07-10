// See example https://github.com/node-opcua/node-opcua/blob/af235f19e9e353fa748c11009b1300f76026fb28/packages/playground/client_with_simple_subscription.js#L83
module.exports = function (RED) {

    var core = require('./core');
    var opcua = require('node-opcua');

    function opcUaSubscriptionNode(args) {

        RED.nodes.createNode(this, args);
        const opcuaclientnode = RED.nodes.getNode(args.client);

        let node = this;
        node.nodeId = args.nodeid;
        node.on('close', onNodeClosed);
        let monitoredItem = new opcua.ClientMonitoredItem();

        core.eventEmitter.on('subscription_created', onSubscriptionCreated);

        function onSubscriptionCreated(connectionId) {
            const existingClient = core.opcClients[connectionId];
            let subscription = existingClient.session.subscription;
            if (monitoredItem?.monitoredItemId) return;
            monitorItem(subscription);
        }

        async function onNodeClosed(done) {
            core.eventEmitter.removeListener('subscription_created', onSubscriptionCreated);

            if (monitoredItem?.monitoredItemId) {
                monitoredItem.removeListener("changed", onMonitoredItemDataChanged);
                monitoredItem.terminate();
                monitoredItem = null;
            }

            const existingClient = core.opcClients[opcuaclientnode.connectionId];

            if (!existingClient.session) return;
            await core.closeSubscription(existingClient.session);
            done();
        }

        function monitorItem(subscription) {
            const itemToMonitor = {
                nodeId: node.nodeId,
                attributeId: opcua.AttributeIds.Value
            };

            const parameters = {
                samplingInterval: 100,
                discardOldest: true,
                queueSize: 10
            };

            monitoredItem = opcua.ClientMonitoredItem.create(
                subscription,
                itemToMonitor,
                parameters,
                opcua.TimestampsToReturn.Both
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