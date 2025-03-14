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

        var node = this;

        node.name = args.name;

        // Read Input Arg node
        node.on('input', function (msg) {

            node.opcuax_client_id = msg.opcuax_client_id;
            const client = GetClient(node.opcuax_client_id);

            if (!client) {
                node.error("OPC UA Client not defined");
                return;
            }

            const session = client.session;
            if (session == undefined) {
                node.error("Session not found");
                return;
            }

            // Override nodeId from incoming node if not defined on read node
            node.nodeId = msg.opcuax_read?.nodeId;
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

            readNode(session);
        });

        async function readNode(session) {
            const nodeToRead = {
                nodeId: node.nodeId,
                attributeId: AttributeIds.Value
            };
            const dataValue = await session.read(nodeToRead);
            const statusCode = dataValue.statusCode;

            if (!statusCode.isGood()) {
                node.error("Something went wrong on read node with NodeId " + node.nodeId + ": " + statusCode._description);
                return;
            }

            const dataValueString = JSON.stringify(dataValue);
            const dataValueObj = JSON.parse(dataValueString);

            node.send({
                payload: node.payload,
                opcuax_client_id: node.opcuax_client_id,
                opcuax_read: {
                    nodeId: node.nodeId,
                    result: dataValueObj
                }
            });
        }
    }

    RED.nodes.registerType("opcua-read", opcUaReadNode);
}