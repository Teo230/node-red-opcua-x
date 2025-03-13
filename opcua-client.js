module.exports = function (RED) {

    const {
        CreateOpcUaClient,
        Connect,
        Close,
    } = require('./core');
    const {
        SecurityPolicy,
        MessageSecurityMode,
        UserTokenType
    } = require('node-opcua');

    // constructor
    function opcUaClientNode(args) {
        RED.nodes.createNode(this, args);

        if(args.name === undefined) return;
        if(args.host === undefined) return;
        if(args.securitypolicy === undefined) return;
        if(args.messagesecurity === undefined) return;

        let node = this;
        let state = "disconnected";

        node.connectionId = args.id;
        node.name = args.name; //unique name identifier
        node.host = args.host; //opc.tcp

        // Setup client
        const authOption = {
            securityPolicy: SecurityPolicy[args.securitypolicy],
            securityMode: MessageSecurityMode[args.messagesecurity],
        }

        node.debug('Setup opc client for ' + node.name);
        const client = CreateOpcUaClient(node.connectionId, node.name, authOption);

        // Connect client
        connect();
        setInterval(checkServerConnection, 1000);

        node.on('close', onNodeClosed);
        node.on('error', onNodeError);

        //#region Methods

        async function connect() {
            const userOption = {
                type: args.anonymous ? UserTokenType.Anonymous : UserTokenType.UserName,
                userName: args.username,
                password: args.password
            }
            await Connect(node.connectionId, node.host, userOption);

            sendData();
        }

        function checkServerConnection() {
            if (client) {
                if (state === client._internalState) return;
                state = client._internalState;

                switch (state) {
                    case "connected":
                        node.status({ fill: "green", shape: "dot", text: state });
                        break;
                    default:
                        node.status({ fill: "yellow", shape: "ring", text: state });
                }
            } else {
                state = "disconnected";
                node.status({ fill: "red", shape: "ring", text: state });
            }
        }

        async function onNodeClosed(done) {
            await Close(node.connectionId);
            done();
        }

        function onNodeError() {
            Close(node.connectionId);
        }

        function sendData(){
            // node.send({
            //     paylaod: {
            //         clientName: client.clientName,
            //         sessionName: client.session.name
            //     }
            // });
        }

        //#endregion
    }

    RED.nodes.registerType("opcua-client", opcUaClientNode);
}