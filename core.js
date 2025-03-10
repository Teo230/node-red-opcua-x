const { EventEmitter } = require('events')
const {
    OPCUAClient,
    ClientSubscription,
    NodeId
} = require('node-opcua')

const opcClients = [];
const eventEmitter = new EventEmitter();

function CreateOpcUaClient(connectionId, name, authOption) {

    const connectionStrategy = {
        initialDelay: 1000,
        maxDelay: 10000,
        maxRetry: 100
    };

    const client = opcClients[connectionId];
    if (client) return client;

    const newClient = OPCUAClient.create({
        applicationName: name,
        keepSessionAlive: true,
        keepAliveInterval: 1000,
        connectionStrategy: connectionStrategy,
        securityMode: authOption.securityMode,
        securityPolicy: authOption.securityPolicy,
        endpointMustExist: false
    });
    opcClients[connectionId] = newClient;

    return newClient;
}

async function Connect(connectionId, host, userOption) {
    const client = opcClients[connectionId];

    if (!client) return;

    _attachClientListeners(client);

    try {
        await client.connect(host);

        const session = await client.createSession(userOption);

        _attachSessionListeners(session);

        client['session'] = session;
        CreateSubscription(connectionId, session);
    }
    catch (err) {
        console.error(err.message);
        return;
    }
}

async function Close(connectionId) {
    const client = opcClients[connectionId];
    if (!client) return;

    try {
        await _closeSession(client);

        _removeClientListeners(client);

        if (!client.isReconnecting) {
            client.disconnect();
        }

        client = null;
        opcClients[connectionId] = null;

    } catch (err) {
        console.error(err.message);
    }
}

async function CloseSubscription(session) {
    const subscription = session.subscription;
    if (!subscription) return;

    await subscription.terminate();
    subscription = null;
}

function CreateSubscription(connectionId, session) {
    if (session.subscription) return session.subscription;

    const subscriptionOptions = {
        requestedPublishingInterval: 1000,
        requestedLifetimeCount: 100,
        requestedMaxKeepAliveCount: 10,
        maxNotificationsPerPublish: 100,
        publishingEnabled: true,
        priority: 10
    };

    const subscription = ClientSubscription.create(session, subscriptionOptions);
    session['subscription'] = subscription;
    eventEmitter.emit('subscription_created', connectionId);

    return subscription;
}

function IsValidNodeId(nodeId) {
    try {
        _ = NodeId.resolveNodeId(nodeId);
        return true;
    }
    catch {
        return false;
    }
}

function GetClient(connectionId){
    return opcClients[connectionId];
}

//#region private

async function _closeSession(client) {
    const session = client.session;
    if (!session) return;

    _removeSessionListeners(session);

    await CloseSubscription(session);

    await session.close();
    session = null;
}

function _attachClientListeners(client) {
    client.on("connected", () => _notifyClientState(client));
    client.on("abort", () => _notifyClientState(client));
    client.on("close", () => _notifyClientState(client));
    client.on("connection_reestablished", () => _notifyClientState(client));
    client.on("connection_lost", () => _notifyClientState(client));
    client.on("start_reconnection", () => _notifyClientState(client));
}

function _removeClientListeners(client) {
    client.removeListener("connected", () => _notifyClientState(client));
    client.removeListener("abort", () => _notifyClientState(client));
    client.removeListener("close", () => _notifyClientState(client));
    client.removeListener("connection_reestablished", () => _notifyClientState(client));
    client.removeListener("connection_lost", () => _notifyClientState(client));
    client.removeListener("start_reconnection", () => _notifyClientState(client));
}

function _attachSessionListeners(session) {
    session.on("session_restored", () => _updateSessionState(session, "restored"));
    session.on("session_closed", () => _updateSessionState(session, "closed"));
    session.on("keepalive", () => _updateSessionState(session, "keepalive"));
    session.on("keepalive_failure", () => _updateSessionState(session, "keepalive_failed"));
}

function _removeSessionListeners(session) {
    session.removeListener("session_restored", () => _updateSessionState(session, "restored"));
    session.removeListener("session_closed", () => _updateSessionState(session, "closed"));
    session.removeListener("keepalive", () => _updateSessionState(session, "keepalive"));
    session.removeListener("keepalive_failure", () => _updateSessionState(session, "keepalive_failed"));
}

function _notifyClientState(client) {
    console.debug(client.applicationName + ": " + client._internalState);
    eventEmitter.emit('client_state', client);
}

function _updateSessionState(session, state) {

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

    eventEmitter.emit('session_state', session, state);
}

//#endregion

//#region export

module.exports = {
    CreateOpcUaClient,
    Connect,
    Close,
    CloseSubscription,
    CreateSubscription,
    GetClient,
    IsValidNodeId,
    eventEmitter
}

//#endregion