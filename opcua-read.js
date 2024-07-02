module.exports = function (RED) {

    var core = require('./core');
    var opcua = require('node-opcua');

    function ReadOpcUaNode(args) {

        RED.nodes.createNode(this, args);

        var node = this;

        node.name = args.name;
        node.nodeId = args.nodeid;

        // Read Input Arg node
        node.on('input', function (msg) {

            // Override nodeId from incoming node if not defined on read node
            if (!args.nodeId && msg.nodeId) node.nodeId = msg.nodeId;

            readNode();
        });

        async function readNode() {
            const nodeToRead = {
                nodeId: node.nodeId,
                attributeId: opcua.AttributeIds.Value
            };
            const dataValue = await core.opcSession.read(nodeToRead);
            const value = dataValue.value;
            const statusCode = dataValue.statusCode;
            node.send({ payload: value });
        }
    }

    RED.nodes.registerType("opcua-read", ReadOpcUaNode);
}