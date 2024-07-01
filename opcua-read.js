module.exports = function(RED) {

    function ReadOpcUaNode(args) {

        RED.nodes.createNode(this,args);
        var node = this;

        node.name = args.name;
        node.client = args.client;
        node.nodeId = args.nodeId;

        // Read Input Arg node
        node.on('input', function(msg) {
            msg.payload = "Hello World";
            node.send(msg);
        });
    }
    RED.nodes.registerType("opcua-read",ReadOpcUaNode);

}