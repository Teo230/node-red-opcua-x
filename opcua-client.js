module.exports = function (RED) {

    var core = require('./core');
    var opcua = require('node-opcua');

    // constructor
    function opcUaClientNode(args) {
        RED.nodes.createNode(this, args);

        let node = this;

        node.connectionId = args.id;
        node.name = args.name; //unique name identifier
        node.host = args.host; //opc.tcp

        // Setup client
        const authOption = {
            securityPolicy: opcua.SecurityPolicy[args.securitypolicy],
            securityMode: opcua.MessageSecurityMode[args.messagesecurity],
        }

        node.debug('Setup opc client for ' + node.name);
        const opcClient = core.createOpcUaClient(node.connectionId, node.name, authOption);

        // Connect client
        connect();

        node.on('close', onNodeClosed);
        node.on('error', onNodeError);

        //#region Methods

        async function connect() {
            const userOption = {
                type: args.anonymous ? opcua.UserTokenType.Anonymous : opcua.UserTokenType.UserName,
                userName:  args.username,
                password: args.password
            }
            await core.connect(node.connectionId, node.host, userOption);
        }

        async function onNodeClosed(done){
            await core.close(node.connectionId);
            done();
        }

        function onNodeError(){
            core.close(node.connectionId);
        }

        //#endregion
    }

    RED.nodes.registerType("opcua-client", opcUaClientNode);
}