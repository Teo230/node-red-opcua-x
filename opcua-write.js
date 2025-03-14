// See example https://github.com/node-opcua/node-opcua/blob/af235f19e9e353fa748c11009b1300f76026fb28/packages/node-opcua-service-write/test/test_service_write.js
module.exports = function (RED) {

    const {
        GetClient,
        IsValidNodeId
    } = require('./core');
    const {
        AttributeIds,
        DataValue,
        Variant,
    } = require('node-opcua');

    function opcUaWriteNode(args) {
        RED.nodes.createNode(this, args);

        var node = this;

        node.name = args.name;
        node.nodeId = args.nodeId;

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
            node.nodeId = msg.opcuax_write?.nodeId;
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

            node.value = msg.opcuax_write?.value;
            if (!node.value) node.value = args.value;

            write(session);
        });

        async function write(session) {
            const dataType = await session.getBuiltInDataType(node.nodeId);
            const statusCode = await session.write({
                nodeId: node.nodeId,
                attributeId: AttributeIds.Value,
                value: new DataValue({
                    value: new Variant({
                        dataType: dataType,
                        value: node.value
                    })
                })
            });

            if (!statusCode.isGood()) {
                node.error("Something went wrong on write value on NodeId " + node.nodeId);
                return;
            }

            sendResult(statusCode);
        }

        function sendResult(statusCode) {
            node.send({
                payload: node.payload,
                opcuax_client_id: node.opcuax_client_id,
                opcuax_write: {
                    nodeId: node.nodeId,
                    statusCode: statusCode
                }
            });
        }
    }

    RED.nodes.registerType("opcua-write", opcUaWriteNode);
}