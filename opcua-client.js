module.exports = function (RED) {

    var core = require('./core');

    // constructor
    function opcUaClientNode(args) {
        RED.nodes.createNode(this, args);

        let node = this;

        node.name = args.name; //unique name identifier
        node.host = args.host; //opc.tcp

        // Setup client
        node.debug('Setup opc client for ' + node.name);
        const opcClient = core.createOpcUaClient(node.name);

        // Connect client
        connect();

        node.on('close', onNodeClosed);
        node.on('error', onNodeError);

        //#region Methods

        async function connect() {
            try {

                opcClient.on("abort", () => sendClientConnectionStatus("disconnected"));
                opcClient.on("close", () => sendClientConnectionStatus("disconnected"));
                opcClient.on("connection_reestablished", () => sendClientConnectionStatus("connected"));
                opcClient.on("connection_lost", () => sendClientConnectionStatus("disconnected"));
                opcClient.on("start_reconnection", () => sendClientConnectionStatus("reconnecting"));
                opcClient.on("after_reconnection", () => sendClientConnectionStatus("reconnecting"));
        
                await core.connect(node.host);

                core.opcSession.on("session_closed", () => sendClientConnectionStatus("disconnected"));
                // core.opcSession.on("keepalive", () => node.debug("session keepalive"));
                // core.opcSession.on("keepalive_failure", () => node.debug("session keepalive failure"));

            } catch (err) {
                node.error(err);
            }
        }

        function sendClientConnectionStatus(status) {
            switch(status){
                case "connected":
                    node.debug("client has reconnected");
                    break;
                case "reconnecting":
                    node.debug("client is trying to reconnect");
                    break
                case "disconnected":
                    node.debug("client has lost connection");
                    break;
            }

            core.opcClientStatus = status;
        }

        async function onNodeClosed(done){
            try{
                await core.close();
            }catch(err){
                node.error(err);
            }
            done();
        }

        function onNodeError(){
            try{
                core.close();
            }catch(err){
                node.error(err);
            }
        }

        //#endregion
    }

    RED.nodes.registerType("opcua-client", opcUaClientNode);
}