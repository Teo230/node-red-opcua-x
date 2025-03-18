const { SessionContext, NodeId, DataType } = require('node-opcua');

module.exports = function (RED) {
    const {
        GetClient,
        IsValidNodeId
    } = require('./core');
    const {
        ClientSession,
        ReferenceTypeIds,
        BrowseDirection,
        AttributeIds
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
            const methodBrowseData = await session.browse(node.nodeId);

            let castInputArgs = [];
            const nodeToRead = {
                nodeId: methodBrowseData.references[0].nodeId,
                attributeId: AttributeIds.Value
            };
            const methodInputArgs = (await session.read(nodeToRead)).value.value;
            methodInputArgs.forEach(inputArgDef => { 
                const index = methodInputArgs.indexOf(inputArgDef);
                const argument = node.inputArguments[index];
                if (argument) {
                    argument.dataType = DataType[inputArgDef.dataType.value];
                    castInputArgs.push({ dataType: argument.dataType, value: argument.value == 'true' ? true : false }); //TODO - To handle for each type
                } else {
                    node.error("Input argument " + index + " not found in node input arguments");
                }
            });

            const methodToCall = {
                objectId: parentNodeId,
                methodId: node.nodeId,
                inputArguments: castInputArgs
            };

            const result = await session.call(methodToCall);
            const statusCode = result.statusCode;
            if (!statusCode.isGood()) {
                node.error("Something went wrong on call node with NodeId " + node.nodeId + ": " + statusCode._description);
                return;
            }

            const outArgs = result.outputArguments;

            sendResult(statusCode, outArgs);
        }

        function sendResult(statusCode, outArgs) {
            node.send({
                payload: node.payload,
                opcuax_client_id: node.opcuax_client_id,
                opcuax_call: {
                    nodeId: node.nodeId,
                    statusCode: statusCode,
                    outputArguments: outArgs
                }
            });
        }
    }

    RED.nodes.registerType("opcua-method", opcUaMethodNode);

}