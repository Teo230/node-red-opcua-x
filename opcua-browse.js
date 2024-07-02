module.exports = function (RED) {

    var core = require('./core');

    function opcUaBrowseNode(args) {
        RED.nodes.createNode(this, args);

        let node = this;

        node.name = args.name;
        node.nodeId = args.nodeid;

        // Read Input Arg node
        node.on('input', function (msg) {

            // Override nodeId from incoming node if not defined on read node
            if (!args.nodeId && msg.nodeId) node.nodeId = msg.nodeId;

            browseNode();
        });

        async function browseNode() {
            const browseResult = await core.opcSession.browse(node.nodeId);

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