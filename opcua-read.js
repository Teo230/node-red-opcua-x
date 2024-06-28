module.exports = function(RED) {

    function ReadOpcUaNode(config) {

        RED.nodes.createNode(this,config);
        var node = this;

        // Read Input Arg node
        node.on('input', function(msg) {
            msg.payload = "Hello World";
            node.send(msg);
        });
    }
    RED.nodes.registerType("opcua-read",ReadOpcUaNode);

}