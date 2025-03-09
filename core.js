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

    existingClient.on("connected", () => notifyClientState(existingClient));
    existingClient.on("abort", () => notifyClientState(existingClient));
    existingClient.on("close", () => notifyClientState(existingClient));
    existingClient.on("connection_reestablished", () => notifyClientState(existingClient));
    existingClient.on("connection_lost", () => notifyClientState(existingClient));
    existingClient.on("start_reconnection", () => notifyClientState(existingClient));

    try {
        await existingClient.connect(host);

        const session = await existingClient.createSession(userOption);

        session.on("session_restored", () => updateSessionState(session, "restored"));
        session.on("session_closed", () => updateSessionState(session, "closed"));
        session.on("keepalive", () => updateSessionState(session, "keepalive"));
        session.on("keepalive_failure", () => updateSessionState(session, "keepalive_failed"));

        existingClient['session'] = session;
        core.createSubscription(connectionId, session);
    }
    catch (err) {
        console.error(err.message);
        return;
    }
}

core.close = async function (connectionId) {
    let existingClient = core.opcClients[connectionId];
    if (!existingClient) return;

    try {
        await closeSession(existingClient);

        // detach all events before destroy client
        existingClient.removeListener("connected", () => notifyClientState(existingClient));
        existingClient.removeListener("abort", () => notifyClientState(existingClient));
        existingClient.removeListener("close", () => notifyClientState(existingClient));
        existingClient.removeListener("connection_reestablished", () => notifyClientState(existingClient));
        existingClient.removeListener("connection_lost", () => notifyClientState(existingClient));
        existingClient.removeListener("start_reconnection", () => notifyClientState(existingClient));

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

    session.removeListener("session_restored", () => updateSessionState(session, "restored"));
    session.removeListener("session_closed", () => updateSessionState(session, "closed"));
    session.removeListener("keepalive", () => updateSessionState(session, "keepalive"));
    session.removeListener("keepalive_failure", () => updateSessionState(session, "keepalive_failed"));

    await core.closeSubscription(session);

    await session.close();
    session = null;
    client.session = null;
}

core.closeSubscription = async function (session) {
    let subscription = session.subscription;
    if (!subscription) return;

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

function notifyClientState(client) {
    console.debug(client.applicationName + ": " + client._internalState);
    core.eventEmitter.emit('client_state', client);
}

function updateSessionState(session, state) {

    switch (state) {
        case "restored":
            console.debug(session.sessionId + ": session restored");
            break
        case "closed":
            console.debug(session.sessionId + ": session closed");
            break;
        case "keepalive":
            console.debug(session.sessionId + ": session keepalive");
            break;
        case "keepalive_failed":
            console.debug(session.sessionId + ": session keepalive failed");
            break;
    }

    core.eventEmitter.emit('session_state', session, state);
}

module.exports = core