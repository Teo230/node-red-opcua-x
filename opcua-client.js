module.exports = function (RED) {

    var opcua = require('node-opcua');

    // caused the connect method to fail after one single unsuccessful retry
    const connectionStrategy = {
        initialDelay: 1000,
        maxDelay: 30_000,
        maxRetry: 100
    };

    let node = this;

    //#region Methods

    function setupClient() {
        console.debug('Setup opc client for ' + node.name);
        node.client = opcua.OPCUAClient.create({
            applicationName: node.name,
            keepSessionAlive: true,
            keepAliveInterval: 1000,
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
    }

    function onClientConnected() {
        // node.warn('Connected');
        console.warn('Connected');
    }

    function onClientDisconnected() {
        // node.warn('Disconnected');
        console.warn('Disconnected');
    }

    //#endregion

    function opcUaClientNode(args) {

        RED.nodes.createNode(this, args);

        node.name = args.name; //unique name identifier
        node.host = args.host; //opc.tcp

        // Setup client
        setupClient();

        node.client.on('connected', onClientConnected);
        node.client.on('close', onClientDisconnected);
        node.client.on('')

        // Connect client
        connect();
    }

    RED.nodes.registerType("opcua-client", opcUaClientNode);
}