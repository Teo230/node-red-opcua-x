// See example https://github.com/node-opcua/node-opcua/blob/af235f19e9e353fa748c11009b1300f76026fb28/packages/node-opcua-service-write/test/test_service_write.js
module.exports = function (RED) {

    var core = require('./core');
    var opcua = require('node-opcua');

    function opcUaWriteNode(args) {

        RED.nodes.createNode(this, args);
        const opcuaclientnode = RED.nodes.getNode(args.client);
        const existingClient = core.opcClients[opcuaclientnode.connectionId];

        var node = this;

        node.name = args.name;
        node.nodeId = args.nodeid;

        node.on('input', function (msg) {

            if(existingClient.clientState == "reconnecting") return;
            if(existingClient.clientState == "disconnected") return;

            // Override nodeId from incoming node if not defined on read node
            //if (!args.nodeId && msg.nodeId) node.nodeId = msg.nodeId;

            const value = msg.payload.value;

            write(value);
        });

        async function write(requestValue) {
            const dataType = await existingClient.session.getBuiltInDataType(node.nodeId);
            const resultStatus = await existingClient.session.write({
                nodeId: node.nodeId,
                attributeId: opcua.AttributeIds.Value,
                value: new opcua.DataValue({
                    value: new opcua.Variant({
                        dataType: dataType,
                        value: requestValue
                    })
                })
            });
            node.debug(resultStatus.description);
        }
    }

    RED.nodes.registerType("opcua-write", opcUaWriteNode);
}