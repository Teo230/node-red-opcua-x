module.exports = function (RED) {

    var core = require('./core');

    function opcUaBrowseNode(args) {
        RED.nodes.createNode(this, args);
        const opcuaclientnode = RED.nodes.getNode(args.client);

        let node = this;

        node.name = args.name;
        node.nodeId = args.nodeid;

        // Read Input Arg node
        node.on('input', function (msg) {
            const existingClient = core.opcClients[opcuaclientnode.connectionId];
            if(!existingClient){
                node.error("OPC UA Client not defined");
                return;
            }

            // Override nodeId from incoming node if not defined on read node
            if (!args.nodeId && msg.nodeId) node.nodeId = msg.nodeId;

            browseNode(existingClient);
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