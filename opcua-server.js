module.exports = function (RED) {

    const {
        CreateOpcUaServer,
        CloseServer
    } = require("./core");
    
    //constructor
    function opcUaSeverNode(args) {
        RED.nodes.createNode(this, args);

        CreateOpcUaServer();

        this.on('close', (done) => {
            CloseServer();
            done();
        });
    }

    RED.nodes.registerType("opcua-server", opcUaSeverNode);
}