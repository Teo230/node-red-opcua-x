module.exports = function (RED) {
    const {
        GetClient,
        IsValidNodeId
    } = require('./core');

    function opcUaMethodNode(args) {
        RED.nodes.createNode(this, args);

        var node = this;

        node.name = args.name;
        node.inputArguments = args.inputArguments || [];
        node.outputArguments = args.outputArguments || [];

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
            node.nodeId = msg.opcuax_call?.nodeId;
            if (!node.nodeId) node.nodeId = args.nodeId;
            if (!node.nodeId) {
                node.error("NodeId not defined");
                return;
            }

            const isValidNodeId = IsValidNodeId(node.nodeId);
            if (!isValidNodeId) {
                node.error(node.nodeId + " is not a valid NodeId");
                return;
            }

            node.parentNodeId = msg.opcuax_call?.parentNodeId;
            if(!node.parentNodeId) node.parentNodeId = args.parentNodeId;
            if (!node.parentNodeId) {
                node.error("Parent NodeId not defined");
                return;
            }

            const isValidParentNodeId = IsValidNodeId(node.parentNodeId);
            if (!isValidParentNodeId) {
                node.error(node.parentNodeId + " is not a valid NodeId");
                return;
            }

            call(session);
        });

        async function call(session) {
            const methodToCall = {
                objectId: node.parentNodeId,
                methodId: node.nodeId,
                inputArguments: []
            };

            const result = await session.call(methodToCall);
            const outArgs = result.outputArgument;
            const statusCode = result.statusCode;
            if (!statusCode.isGood()) {
                node.error("Something went wrong on call node with NodeId " + node.nodeId + ": " + statusCode._description);
                return;
            }

            sendResult(statusCode);
        }

        function sendResult(statusCode){
            node.send({
                payload: node.payload,
                opcuax_client_id: node.opcuax_client_id,
                opcuax_call: {
                    nodeId: node.nodeId,
                    statusCode: statusCode
                }
            });
        }
    }

    RED.nodes.registerType("opcua-method", opcUaMethodNode);

}