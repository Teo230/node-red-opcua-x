module.exports = function (RED) {

    var core = require('./core');
    var opcua = require('node-opcua');

    function opcUaReadNode(args) {

        RED.nodes.createNode(this, args);
        const opcuaclientnode = RED.nodes.getNode(args.client);

        var node = this;

        node.name = args.name;
        node.nodeId = args.nodeid;

        // Read Input Arg node
        node.on('input', function (msg) {
            const existingClient = core.opcClients[opcuaclientnode.connectionId];
            if(!existingClient){
                node.error("OPC UA Client not defined");
                return;
            }

            if(existingClient.clientState == "reconnecting") return;
            if(existingClient.clientState == "disconnected") return;

            // Override nodeId from incoming node if not defined on read node
            if (!args.nodeId && msg.nodeId) node.nodeId = msg.nodeId;

            readNode(existingClient);
        });

        async function readNode(opcClient) {
            const nodeToRead = {
                nodeId: node.nodeId,
                attributeId: opcua.AttributeIds.Value
            };
            const dataValue = await opcClient.session.read(nodeToRead);
            const dataValueString = JSON.stringify(dataValue);
            const dataValueObj = JSON.parse(dataValueString);
            node.send({ payload: dataValueObj });
        }
    }

    RED.nodes.registerType("opcua-read", opcUaReadNode);
}