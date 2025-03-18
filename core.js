const { EventEmitter } = require('events')
const {
    OPCUAClient,
    ClientSubscription,
    OPCUAServer,
    NodeId,
    Variant,
    StatusCodes,
    DataType,
    AccessLevelFlag,
    UAObject,
    UAVariable,
    VariantArrayType
} = require('node-opcua')

/**@type {EventEmitter} */
const eventEmitter = new EventEmitter();

//#region Client extensions

/**@type {OPCUAClient[]} */
let opcClients = [];

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
        CreateSubscription(session);
    }
    catch (err) {
        console.error(err.message);
        return;
    }
}

async function Close(connectionId) {
    let client = opcClients[connectionId];
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
    let subscription = session.subscription;
    if (!subscription) return;

    await subscription.terminate();
    subscription = null;
}

function CreateSubscription(session) {
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
    return subscription;
}

function GetClient(connectionId) {
    return opcClients[connectionId];
}

//#endregion

//#region Server extensions

/**
 * Creates an OPC UA Server instance.
 *
 * @param {string} resourcePath - The resource path for the OPC UA server.
 * @param {number} port - The port number on which the OPC UA server will listen.
 * @returns {OPCUAServer} The created OPC UA server instance.
 */
function CreateOpcUaServer(resourcePath, port) {
    opcServer = new OPCUAServer({
        port: port,
        resourcePath: resourcePath,
        buildInfo: {
            buildNumber: _generateRandomBuildNumber(),
            buildDate: new Date()
        }
    });

    return opcServer;
}

/**
 * Adds a variable to the OPC UA namespace.
 *
 * @param {object} namespace - The namespace object to which the variable will be added.
 * @param {UAObject} parentNode - The parent node under which the variable will be added.
 * @param {string} browseName - The browse name of the variable.
 * @param {DataType} dataType - The data type of the variable.
 * @returns {UAVariable} - The generated OPC Variable.
 */
function AddVariable(namespace, parentNode, browseName, dataType) {
    return namespace.addVariable({
        componentOf: parentNode,
        browseName: browseName,
        dataType: dataType,
        accessLevel: AccessLevelFlag.CurrentRead | AccessLevelFlag.CurrentWrite,
        value: new Variant({
            dataType: dataType,
            //arrayType: VariantArrayType.Scalar,
            value: _getDefaultValue(dataType)
        })
    });
}

/**
 * Adds a method to the OPC UA namespace.
 *
 * @param {object} namespace - The namespace object to which the method will be added.
 * @param {UAObject} parentNode - The parent node under which the method will be added.
 * @param {string} browseName - The browse name of the method.
 * @param {DataType} dataType - The data type of the input/output argument
 * @returns {UAMethod} - The generated OPC Method.
 */
function AddMethod(namespace, parentNode, browseName, dataType) {
    const method = namespace.addMethod(parentNode, {
        browseName: browseName,
        inputArguments: [
            { name: "Arg0", dataType: dataType, valueRank: -1 },
        ],
        outputArguments: [
            { name: "Arg0", dataType: dataType, valueRank: -1 },
        ]
    });

    method.bindMethod((inputArguments, context, callback) => {
        const callMethodResult = {
            statusCode: StatusCodes.Good,
            outputArguments: [
                new Variant({ dataType: dataType, value: inputArguments[0].value, valueRank: -1, arrayType: VariantArrayType.Scalar }),
            ]
        };
        callback(null, callMethodResult);
    });

    return method;
}

//#endregion

//#region Generic extensions

function IsValidNodeId(nodeId) {
    const regex = /^(ns=\d+;)?(i=\d+|s=[\w\-]+|g=[\da-fA-F\-]+|b=[\da-fA-F]*)$/i;
    return regex.test(nodeId);
}

//#endregion

//#region private

async function _closeSession(client) {
    let session = client.session;
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
    client.on("after_reconnection", () => _notifyClientState(client));
}

function _removeClientListeners(client) {
    client.removeListener("connected", () => _notifyClientState(client));
    client.removeListener("abort", () => _notifyClientState(client));
    client.removeListener("close", () => _notifyClientState(client));
    client.removeListener("connection_reestablished", () => _notifyClientState(client));
    client.removeListener("connection_lost", () => _notifyClientState(client));
    client.removeListener("start_reconnection", () => _notifyClientState(client));
    client.removeListener("after_reconnection", () => _notifyClientState(client));
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
    // console.debug(client.applicationName + ": " + client._internalState);
    eventEmitter.emit('client_state', client);
}

function _updateSessionState(session, state) {

    // switch (state) {
    //     case "restored":
    //         console.debug(session.sessionId + ": session restored");
    //         break
    //     case "closed":
    //         console.debug(session.sessionId + ": session closed");
    //         break;
    //     case "keepalive":
    //         console.debug(session.sessionId + ": session keepalive");
    //         break;
    //     case "keepalive_failed":
    //         console.debug(session.sessionId + ": session keepalive failed");
    //         break;
    // }

    eventEmitter.emit('session_state', session, state);
}

/**
 * 
 * @param {DataType} dataType - The data type of the variable.
 */
function _getDefaultValue(dataType) {

    let defaultValue;
    switch (dataType) {

        case DataType.Double:
        case DataType.Float:
            defaultValue = 0.0;
            break;

        case DataType.Int16:
        case DataType.Int32:
        case DataType.UInt16:
        case DataType.UInt32:
        case DataType.Byte:
        case DataType.SByte:
            defaultValue = 0;
            break;

        case DataType.Int64:
        case DataType.UInt64:
            defaultValue = Number(0n);
            break;

        case DataType.String:
            defaultValue = "";
            break;

        case DataType.Boolean:
            defaultValue = false;
            break;

        case DataType.DateTime:
            defaultValue = new Date();
            break;

        case DataType.Guid:
            defaultValue = "8cae8c9a-a1d6-4e93-b680-d9a20c5a703c";
            break;

        case DataType.ByteString:
            defaultValue = Buffer.alloc(0);
            break;

        case DataType.XmlElement:
            defaultValue = "<xml></xml>";
            break;

        case DataType.LocalizedText:
            defaultValue = { text: "", locale: "" };
            break;

        case DataType.QualifiedName:
            defaultValue = { name: "", namespaceIndex: 0 };
            break;

        case DataType.NodeId:
            defaultValue = new NodeId();
            break;

        default:
            defaultValue = null;
            break;
    }
    return defaultValue;
}

/**
 * Generates a random build number.
 *
 * @returns {string} The generated build number.
 */
function _generateRandomBuildNumber() {
    return Math.floor(Math.random() * 10000).toString();
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
    CreateOpcUaServer,
    AddVariable,
    AddMethod,
    eventEmitter
}

//#endregion