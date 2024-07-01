module.exports = function (RED) {

    //variables placed here are shared by all nodes
    var storage = require('node-persist');
    var opcua = require('node-opcua');

    var opcClient = new opcua.OPCUAClient(); // declare here but assign later to mantain type
    
    // caused the connect method to fail after one single unsuccessful retry
    const connectionStrategy = {
        initialDelay: 1000,
        maxDelay: 10000,
        maxRetry: 100
    };

    // constructor
    function opcUaClientNode(args) {
        RED.nodes.createNode(this, args);

        let node = this;

        //Initialize persist storage
        storage.init({dir: `${RED.settings.userDir}/cache/node-red-opcua-x`});

        node.name = args.name; //unique name identifier
        node.host = args.host; //opc.tcp

        // Setup client
        setupClient();

        opcClient.on("abort", () => node.debug("client has aborted"));
        opcClient.on("close", () => node.debug("client has closed"));
        opcClient.on("connection_reestablished", () => sendClientConnectionStatus(true));
        opcClient.on("connection_lost", () => sendClientConnectionStatus(false));
        opcClient.on("start_reconnection", () => node.debug("client is trying to reconnect"));
        opcClient.on("after_reconnection", () => node.debug("client start reconnection"));

        // Connect client
        connect();

        //#region Methods

        function setupClient() {
            node.debug('Setup opc client for ' + node.name);
            opcClient = opcua.OPCUAClient.create({
                applicationName: node.name,
                keepSessionAlive: true,
                keepAliveInterval: 5000,
                connectionStrategy: connectionStrategy,
                securityMode: opcua.MessageSecurityMode.None, // TODO
                securityPolicy: opcua.SecurityPolicy.None, //TODO
                endpointMustExist: false
            });
        }

        async function connect() {
            try {
                await opcClient.connect(node.host);
                sendClientConnectionStatus(true);
            } catch (err) {
                node.error(err);
            }
            await createSession();
        }

        async function createSession() {
            try {
                node.session = await opcClient.createSession();
            } catch (err) {
                node.error(err);
            }

            node.session.on("session_closed", () => node.debug("session has closed"));
            // node.session.on("keepalive", () => node.debug("session keepalive"));
            // node.session.on("keepalive_failure", () => node.debug("session keepalive failure"));
        }

        function sendClientConnectionStatus(connected) {
            if (connected) node.debug("client has reconnected");
            else node.debug("client has lost connection");
            storage.setItem("client-connected", connected);
        }

        //#endregion
    }

    RED.nodes.registerType("opcua-client", opcUaClientNode);
}