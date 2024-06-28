module.exports = function (RED) {

    var opcua = require('node-opcua');

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

        node.name = args.name; //unique name identifier
        node.host = args.host; //opc.tcp

        // Setup client
        setupClient();

        node.client.on('connection_reestablished', onClientReconnected);
        node.client.on('connected', onClientConnected);
        node.client.on('close', onClientDisconnected);

        // Connect client
        connect();

        //#region Methods

        function setupClient() {
            console.debug('Setup opc client for ' + node.name);
            node.client = opcua.OPCUAClient.create({
                applicationName: node.name,
                keepSessionAlive: true,
                keepAliveInterval: 5000,
                connectionStrategy: node.connectionStrategy,
                securityMode: opcua.MessageSecurityMode.None, // TODO
                securityPolicy: opcua.SecurityPolicy.None, //TODO
                endpointMustExist: false
            });
        }

        async function connect() {
            await node.client.connect(node.host);
            await createSession();
        }

        async function createSession() {
            node.session = await node.client.createSession();

            node.session.on('keepalive', checkServerStatus);
            node.session.on('session_closed', onSessionClosed);
            node.session.on('statusChanged', onSessionStatusChanged);
        }

        function checkServerStatus(status){
            let state = opcua.EnumServerState[status]
            node.debug('Server status: ' + state);

            // flow.set("server-status", state); // TO FIX, use context to pass state to opcua-status node
        }

        function onSessionClosed(){
            node.debug('Session closed');
        }

        function onSessionStatusChanged(status){
            let state = opcua.EnumServerState[status];
            node.debug('Session status: ' + state);
        }

        function onClientReconnected(){
            node.warn('!!! Client Reconnected !!!');
        }

        function onClientConnected() {
            node.debug('Connected');
        }

        function onClientDisconnected() {
            node.debug('Disconnected');
        }

        //#endregion
    }

    RED.nodes.registerType("opcua-client", opcUaClientNode);
}