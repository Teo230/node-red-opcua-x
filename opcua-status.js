module.exports = function(RED) {

    function OpcUaStatusNode(config) {

        RED.nodes.createNode(this,config);
        var node = this;
        var msg = {payload: "connected"};
        this.send(msg);
    }
    RED.nodes.registerType("opcua-status",OpcUaStatusNode);

}