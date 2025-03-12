module.exports = function (RED) {

    const {
        GetClient,
        IsValidNodeId
    } = require('./core');
    const {
        AttributeIds,
        StatusCodes,
        StatusCode
    } = require('node-opcua');

    function opcUaReadNode(args) {

        RED.nodes.createNode(this, args);
        const opcuaclientnode = RED.nodes.getNode(args.client);
        const opcClient = GetClient(opcuaclientnode.connectionId);

        var node = this;

        node.name = args.name;
        node.nodeId = args.nodeid;

        // Read Input Arg node
        node.on('input', function (msg) {
            if(opcClient.clientState == "reconnecting") return;
            if(opcClient.clientState == "disconnected") return;

            if (opcClient.session == undefined) {
                node.error("Session not found");
                return;
            }
            
            // Override nodeId from incoming node if not defined on read node
            if (!args.nodeId && msg.nodeId) node.nodeId = msg.nodeId;

            const isValid = IsValidNodeId(node.nodeId);
            if(!isValid){
                node.error(node.nodeId + " is not a valid NodeId");
                return;
            }

            readNode();
        });

        async function readNode() {
            const nodeToRead = {
                nodeId: node.nodeId,
                attributeId: AttributeIds.Value
            };
            const dataValue = await opcClient.session.read(nodeToRead);
            
            if(!dataValue.statusCode.isGood()){
                node.error("Something went wrong on read NodeId " + node.nodeId);
                return;
            }
            
            const dataValueString = JSON.stringify(dataValue);
            const dataValueObj = JSON.parse(dataValueString);
            node.send({ payload: dataValueObj });
        }
    }

    RED.nodes.registerType("opcua-read", opcUaReadNode);
}