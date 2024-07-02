'use strict'
/**
 * Nested namespace settings.
 *
 * @type {}
 *
 * @Namespace core
 */
var core = core || { opcClient: {} }
core.opcua = core.opcua || require('node-opcua')
core.storage = core.storage || require('node-persist')
core.opcClient = core.opcClient || new core.opcua.OPCUAClient();
core.opcSession = core.opcSession || null

core.createOpcUaClient = function(name){
    // caused the connect method to fail after one single unsuccessful retry
    const connectionStrategy = {
        initialDelay: 1000,
        maxDelay: 10000,
        maxRetry: 3
    };
    
    core.opcClient = core.opcua.OPCUAClient.create({
        applicationName: name,
        keepSessionAlive: true,
        keepAliveInterval: 5000,
        connectionStrategy: connectionStrategy,
        securityMode: core.opcua.MessageSecurityMode.None, // TODO
        securityPolicy: core.opcua.SecurityPolicy.None, //TODO
        endpointMustExist: false
    });

    return core.opcClient;
}

core.connect = async function(host){
    await core.opcClient.connect(host);
    core.opcSession = await core.opcClient.createSession();
}

core.close = async function(){
    await core.opcSession.close();
    core.opcSession = null;
}

module.exports = core