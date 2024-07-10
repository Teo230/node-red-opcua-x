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

const EventEmitter = require('events');
core.eventEmitter = core.eventEmitter || new EventEmitter()

core.createOpcUaClient = function (connectionId, name, authOption) {
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
        keepAliveInterval: 1000,
        connectionStrategy: connectionStrategy,
        securityMode: authOption.securityMode,
        securityPolicy: authOption.securityPolicy,
        endpointMustExist: false
    });
    core.opcClients[connectionId] = newClient;

    return newClient;
}

core.connect = async function (connectionId, host, userOption) {
    const existingClient = core.opcClients[connectionId];

    if (!existingClient) return;

    existingClient.on("abort", () => updateClientConnectionStatus(connectionId, "disconnected"));
    existingClient.on("close", () => updateClientConnectionStatus(connectionId, "disconnected"));
    existingClient.on("connection_reestablished", () => updateClientConnectionStatus(connectionId, "connected"));
    existingClient.on("connection_lost", () => updateClientConnectionStatus(connectionId, "disconnected"));
    existingClient.on("start_reconnection", () => updateClientConnectionStatus(connectionId, "reconnecting"));
    existingClient.on("after_reconnection", () => updateClientConnectionStatus(connectionId, "reconnecting"));

    try {
        await existingClient.connect(host);

        const session = await existingClient.createSession(userOption);
        core.eventEmitter.emit('session_created', connectionId);
        // session.on("session_closed", (statusCode) => {
        //     console.log(" Session has been closed with statusCode = ", statusCode.toString());
        // })
        // session.on("session_restored", () => {
        //     console.log(" Session has been restored");
        // });
        // session.on("keepalive", (lastKnownServerState) => {
        //     console.log("KeepAlive lastKnownServerState", core.opcua.ServerState[lastKnownServerState]);
        // });
        // session.on("keepalive_failure", () => {
        //     console.log("KeepAlive failure");
        // });
        existingClient['session'] = session;
        core.createSubscription(connectionId, session);
    }
    catch (err) {
        console.error(err.message);
        updateClientConnectionStatus(connectionId, "disconnected");
        return;
    }

    // if all went well, set status connected!
    updateClientConnectionStatus(connectionId, "connected");
}

core.close = async function (connectionId) {
    let existingClient = core.opcClients[connectionId];
    if (!existingClient) return;

    try {
        await closeSession(existingClient);

        // detach all events before destroy client
        existingClient.removeListener("abort", () => updateClientConnectionStatus(connectionId, "disconnected"));
        existingClient.removeListener("close", () => updateClientConnectionStatus(connectionId, "disconnected"));
        existingClient.removeListener("connection_reestablished", () => updateClientConnectionStatus(connectionId, "connected"));
        existingClient.removeListener("connection_lost", () => updateClientConnectionStatus(connectionId, "disconnected"));
        existingClient.removeListener("start_reconnection", () => updateClientConnectionStatus(connectionId, "reconnecting"));
        existingClient.removeListener("after_reconnection", () => updateClientConnectionStatus(connectionId, "reconnecting"));

        if (!existingClient.isReconnecting) {
            existingClient.disconnect();
        }

        existingClient = null;
        core.opcClients[connectionId] = null;

    } catch (err) {
        console.error(err.message);
    }
}

async function closeSession(client) {
    let session = client.session;
    if (!session) return;

    await core.closeSubscription(session);

    await session.close();
    session = null;
    client.session = null;
}

core.closeSubscription = async function(session){
    let subscription = session.subscription;
    if(!subscription) return;

    await subscription.terminate();
    subscription = null;
    session.subscription = null;
}

core.createSubscription = function (connectionId, session) {
    if (session.subscription) return session.subscription;

    const subscriptionOptions = {
        requestedPublishingInterval: 1000,
        requestedLifetimeCount: 100,
        requestedMaxKeepAliveCount: 10,
        maxNotificationsPerPublish: 100,
        publishingEnabled: true,
        priority: 10
    };

    const subscription = core.opcua.ClientSubscription.create(session, subscriptionOptions);
    session['subscription'] = subscription;
    core.eventEmitter.emit('subscription_created', connectionId);

    return subscription;
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