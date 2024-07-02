module.exports = function (RED) {

    var core = require('./core');

    // constructor
    function opcUaClientNode(args) {
        RED.nodes.createNode(this, args);

        let node = this;

        //Initialize persist storage
        core.storage.init({dir: `${RED.settings.userDir}/cache/node-red-opcua-x`});

        node.name = args.name; //unique name identifier
        node.host = args.host; //opc.tcp

        // Setup client
        node.debug('Setup opc client for ' + node.name);
        const opcClient = core.createOpcUaClient(node.name);

        // Connect client
        connect();

        //#region Methods

        async function connect() {
            try {

                opcClient.on("abort", () => node.debug("client has aborted"));
                opcClient.on("close", () => node.debug("client has closed"));
                opcClient.on("connection_reestablished", () => sendClientConnectionStatus(true));
                opcClient.on("connection_lost", () => sendClientConnectionStatus(false));
                opcClient.on("start_reconnection", () => node.debug("client is trying to reconnect"));
                opcClient.on("after_reconnection", () => node.debug("client start reconnection"));
        
                await core.connect(node.host);
                sendClientConnectionStatus(true);

                core.opcSession.on("session_closed", () => node.debug("session has closed"));
                // core.opcSession.on("keepalive", () => node.debug("session keepalive"));
                // core.opcSession.on("keepalive_failure", () => node.debug("session keepalive failure"));

            } catch (err) {
                node.error(err);
            }
        }

        function sendClientConnectionStatus(connected) {
            if (connected) node.debug("client has reconnected");
            else node.debug("client has lost connection");
            core.storage.setItem("client-connected", connected);
        }

        //#endregion
    }

    RED.nodes.registerType("opcua-client", opcUaClientNode);
}