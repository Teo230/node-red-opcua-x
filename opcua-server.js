module.exports = function (RED) {

    const {
        CreateOpcUaServer,
        CloseServer,
        InitializeServer
    } = require("./core");

    //constructor
    function opcUaSeverNode(args) {
        RED.nodes.createNode(this, args);

        let node = this;

        startServer();

        node.on('close', onNodeClosed);
        node.on('error', onNodeError);

        //#region Methods

        async function startServer() {
            CreateOpcUaServer();
            await InitializeServer();
        }

        async function onNodeClosed(done){
            await CloseServer();
            done();
        }

        async function onNodeError(){
            await CloseServer();
        }

        //#endregion
    }

    RED.nodes.registerType("opcua-server", opcUaSeverNode);
}