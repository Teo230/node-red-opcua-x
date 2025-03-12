module.exports = function (RED) {

    const {
        CreateOpcUaServer,
        CloseServer,
        InitializeServer,
        GetServer
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

            const serverEndpoint = GetServer().getEndpointUrl();
            node.log("OPC UA Server started at " + serverEndpoint);

            node.status({ text: serverEndpoint });
        }

        async function onNodeClosed(done){
            await CloseServer();
            node.status({ text: "" });
            done();
        }

        async function onNodeError(){
            node.status({ text: "" });
            await CloseServer();
        }

        //#endregion
    }

    RED.nodes.registerType("opcua-server", opcUaSeverNode);
}