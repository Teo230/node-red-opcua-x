module.exports = function (RED) {
    const {
        GetClient,
        IsValidNodeId
    } = require('./core');

    function opcUaMethodNode(args) {

        RED.nodes.createNode(this, args);
        const opcuaclientnode = RED.nodes.getNode(args.client);
        const existingClient = GetClient(opcuaclientnode.connectionId);

        var node = this;

        node.name = args.name;
        node.nodeId = args.nodeid;

        // Read Input Arg node
        node.on('input', function (msg) {
            if(existingClient.clientState == "reconnecting") return;
            if(existingClient.clientState == "disconnected") return;

            // Override nodeId from incoming node if not defined on read node
            if (!args.nodeId && msg.nodeId) node.nodeId = msg.nodeId;

            const isValid = IsValidNodeId(node.nodeId);
            if(!isValid){
                node.error(node.nodeId + " is not a valid NodeId");
                return;
            }

            method();
        });

        async function method() {

        }
    }

    RED.nodes.registerType("opcua-method", opcUaMethodNode);

}