module.exports = function(RED) {

    function ReadOpcUaNode(args) {

        RED.nodes.createNode(this,args);
        const clientNode = RED.nodes.getNode(args.client);

        var node = this;

        node.name = args.name;
        node.nodeId = args.nodeid;

        // Read Input Arg node
        node.on('input', function(msg) {
            
            // Override nodeId from incoming node if not defined on read node
            if(!args.nodeId && msg.nodeId) node.nodeId = msg.nodeId;

            var value = node.client.session;
            node.send(msg);
        });
    }
    RED.nodes.registerType("opcua-read",ReadOpcUaNode);

}