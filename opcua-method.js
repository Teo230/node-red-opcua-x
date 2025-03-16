const { SessionContext, NodeId } = require('node-opcua');

module.exports = function (RED) {
    const {
        GetClient,
        IsValidNodeId
    } = require('./core');
    const {
        ClientSession,
        ReferenceTypeIds,
        BrowseDirection
    } = require('node-opcua')

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

            call(session);
        });

        /**
         * 
         * @param {ClientSession} session 
         * @returns {NodeId | undefined}
         */
        async function getParentNodeId(session) {
            const parentNode = await session.browse({
                nodeId: node.nodeId,
                referenceTypeId: ReferenceTypeIds.HasComponent,
                browseDirection: BrowseDirection.Inverse
            });
            
            if (parentNode.references.length > 0) {
                return parentNode.references[0].nodeId;
            } else {
                node.error("Parent NodeId not found by browsing 'ComponentOf' reference");
                return undefined;
            }
        }

        //TODO - Handle Input/output arguments
        async function call(session) {

            const parentNodeId = await getParentNodeId(session);

            const methodToCall = {
                objectId: parentNodeId,
                methodId: node.nodeId,
                inputArguments: []
            };

            const result = await session.call(methodToCall);
            const statusCode = result.statusCode;
            if (!statusCode.isGood()) {
                node.error("Something went wrong on call node with NodeId " + node.nodeId + ": " + statusCode._description);
                return;
            }

            const outArgs = result.outputArguments;

            sendResult(statusCode);
        }

        function sendResult(statusCode) {
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