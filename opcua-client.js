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

        let node = this;

        node.connectionId = args.id;
        node.name = args.name; //unique name identifier
        node.host = args.host; //opc.tcp

        // Setup client
        const authOption = {
            securityPolicy: SecurityPolicy[args.securitypolicy],
            securityMode: MessageSecurityMode[args.messagesecurity],
        }

        node.debug('Setup opc client for ' + node.name);
        CreateOpcUaClient(node.connectionId, node.name, authOption);

        // Connect client
        connect();

        node.on('close', onNodeClosed);
        node.on('error', onNodeError);

        //#region Methods

        async function connect() {
            const userOption = {
                type: args.anonymous ? UserTokenType.Anonymous : UserTokenType.UserName,
                userName:  args.username,
                password: args.password
            }
            await Connect(node.connectionId, node.host, userOption);
        }

        async function onNodeClosed(done){
            await Close(node.connectionId);
            done();
        }

        function onNodeError(){
            Close(node.connectionId);
        }

        //#endregion
    }

    RED.nodes.registerType("opcua-client", opcUaClientNode);
}