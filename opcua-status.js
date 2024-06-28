module.exports = function(RED) {

    function OpcUaStatusNode(config) {

        RED.nodes.createNode(this,config);

        //TODO
        // var state = this.flow.get("server-status");
        // var msg = {payload: state};
        // this.send(msg);
    }
    RED.nodes.registerType("opcua-status",OpcUaStatusNode);

}