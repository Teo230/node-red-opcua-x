module.exports = function (RED) {

    const {
        GetClient,
        IsValidNodeId
    } = require('./core');

    function opcUaBrowseNode(args) {
        RED.nodes.createNode(this, args);
        
        const opcuaclientnode = RED.nodes.getNode(args.client);
        const client = GetClient(opcuaclientnode.connectionId);

        let node = this;

        node.name = args.name;
        node.nodeId = args.nodeId;

        // Read Input Arg node
        node.on('input', function (msg) {

            if (!client) {
                node.error("OPC UA Client not defined");
                return;
            }

            if (client.session == undefined) {
                node.error("Session not found");
                return;
            }

            if(!args.nodeId && !msg.nodeId){
                node.error("NodeId not defined");
                return;
            }

            // Override nodeId from incoming node if not defined on read node
            if (!args.nodeId && msg.nodeId) node.nodeId = msg.nodeId;

            
            const isValid = IsValidNodeId(node.nodeId);
            if(!isValid){
                node.error(node.nodeId + " is not a valid NodeId");
                return;
            }

            browseNode(client);
        });

        async function browseNode(opcClient) {
            const browseResult = await opcClient.session.browse(node.nodeId);

            items = [browseResult.references.length];
            for (const index in browseResult.references) {
                const reference = browseResult.references[index];
                const browseItemString = JSON.stringify(reference);
                const browseItemObj = JSON.parse(browseItemString);
                items[index] = browseItemObj;
            }

            node.send({ payload: items });
        }

    }

    RED.nodes.registerType("opcua-browse", opcUaBrowseNode);
}