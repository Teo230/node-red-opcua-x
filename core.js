'use strict'
/**
 * Nested namespace settings.
 *
 * @type {}
 *
 * @Namespace core
 */
var core = core || { opcClients: [] }
core.opcua = core.opcua || require('node-opcua')
core.opcClients = core.opcClients || {}

core.createOpcUaClient = function (connectionId, name) {
    // caused the connect method to fail after one single unsuccessful retry
    const connectionStrategy = {
        initialDelay: 1000,
        maxDelay: 10000,
        maxRetry: 100
    };

    const existingClient = core.opcClients[connectionId];
    if (existingClient) return existingClient;

    const newClient = core.opcua.OPCUAClient.create({
        applicationName: name,
        keepSessionAlive: true,
        keepAliveInterval: 5000,
        connectionStrategy: connectionStrategy,
        securityMode: core.opcua.MessageSecurityMode.None, // TODO
        securityPolicy: core.opcua.SecurityPolicy.None, //TODO
        endpointMustExist: false
    });
    core.opcClients[connectionId] = newClient;

    return newClient;
}

core.connect = async function (connectionId, host) {
    const existingClient = core.opcClients[connectionId];
    if (!existingClient) return;

    existingClient.on("abort", () => updateClientConnectionStatus(connectionId, "disconnected"));
    existingClient.on("close", () => updateClientConnectionStatus(connectionId, "disconnected"));
    existingClient.on("connection_reestablished", () => updateClientConnectionStatus(connectionId, "connected"));
    existingClient.on("connection_lost", () => updateClientConnectionStatus(connectionId, "disconnected"));
    existingClient.on("start_reconnection", () => updateClientConnectionStatus(connectionId, "reconnecting"));
    existingClient.on("after_reconnection", () => updateClientConnectionStatus(connectionId, "reconnecting"));

    try{
        await existingClient.connect(host);

        const session = await existingClient.createSession();
        session.on("session_closed", () => updateClientConnectionStatus(connectionId, "disconnected"));
        // session.on("keepalive", () => node.debug(connectionId, "session keepalive"));
        // session.on("keepalive_failure", () => node.debug(connectionId, "session keepalive failure"));    
        existingClient['session'] = session;
    }
    catch(err){
        console.error(err);
        updateClientConnectionStatus(connectionId, "disconnected");
        return;
    }

    // if all went well, set status connected!
    updateClientConnectionStatus(connectionId, "connected");
}

core.close = async function (connectionId) {
    let existingClient = core.opcClients[connectionId];
    if (!existingClient) return;

    let session = existingClient.session;
    if (!session) return;

    try{
        session.removeListener("session_closed", () => updateClientConnectionStatus(connectionId, "disconnected"));

        await session.close();

        session = null;
        existingClient.session = null;

        // detach all events before destroy client
        existingClient.removeListener("abort", () => updateClientConnectionStatus(connectionId, "disconnected"));
        existingClient.removeListener("close", () => updateClientConnectionStatus(connectionId, "disconnected"));
        existingClient.removeListener("connection_reestablished", () => updateClientConnectionStatus(connectionId, "connected"));
        existingClient.removeListener("connection_lost", () => updateClientConnectionStatus(connectionId, "disconnected"));
        existingClient.removeListener("start_reconnection", () => updateClientConnectionStatus(connectionId, "reconnecting"));
        existingClient.removeListener("after_reconnection", () => updateClientConnectionStatus(connectionId, "reconnecting"));
    
        if(!existingClient.isReconnecting){
            existingClient.disconnect();
        }

        existingClient = null;
        core.opcClients[connectionId] = null;

    }catch(err){
        console.error(err);
    }
}

function updateClientConnectionStatus(connectionId, status) {
    const existingClient = core.opcClients[connectionId];
    if (!existingClient) return;

    switch (status) {
        case "connected":
            console.debug(existingClient.applicationName + ":client has reconnected");
            break;
        case "reconnecting":
            console.debug(existingClient.applicationName + ":client is trying to reconnect");
            break
        case "disconnected":
            console.debug(existingClient.applicationName + ":client has lost connection");
            break;
    }

    existingClient['clientState'] = status;
}

module.exports = core