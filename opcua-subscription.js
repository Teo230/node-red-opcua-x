module.exports = function (RED) {

    var core = require('./core');
    var opcua = require('node-opcua');

    function opcUaSubscriptionNode(args) {

        RED.nodes.createNode(this, args);
        const opcuaclientnode = RED.nodes.getNode(args.client);
        const existingClient = core.opcClients[opcuaclientnode.connectionId];
        let subscription = existingClient.session.subscription;

        let node = this;
        node.nodeId = args.nodeid;

        node.on('close', onNodeClosed);

        monitorItem(subscription);

        async function onNodeClosed(done) {
            await core.closeSubscription(opcuaclientnode.session);
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

            const monitoredItem = opcua.ClientMonitoredItem.create(
                subscription,
                itemToMonitor,
                parameters,
                TimestampsToReturn.Both
            );

            monitoredItem.on("changed", (dataValue) => {
                const dataValueString = JSON.stringify(dataValue);
                const dataValueObj = JSON.parse(dataValueString);
                node.send({ payload: dataValueObj });
            });
        }
    }

    RED.nodes.registerType("opcua-subscription", opcUaSubscriptionNode);
}