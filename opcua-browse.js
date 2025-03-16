module.exports = function (RED) {

    const {
        GetClient,
        IsValidNodeId
    } = require('./core');

    function opcUaBrowseNode(args) {
        RED.nodes.createNode(this, args);

        let node = this;

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
            node.nodeId = msg.opcuax_browse?.nodeId;
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

            browseNode(session);
        });

        async function browseNode(session) {
            const browseResult = await session.browse(node.nodeId);

            items = [browseResult.references.length];
            for (const index in browseResult.references) {
                const reference = browseResult.references[index];
                const browseItemString = JSON.stringify(reference);
                const browseItemObj = JSON.parse(browseItemString);
                items[index] = browseItemObj;
            }

            node.send({
                payload: node.payload,
                opcuax_client_id: node.opcuax_client_id,
                opcuax_browse: {
                    nodeId: node.nodeId,
                    result: items
                }
            });
        }

    }

    RED.nodes.registerType("opcua-browse", opcUaBrowseNode);
}