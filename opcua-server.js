module.exports = function (RED) {

    const {
        DataType,
    } = require('node-opcua');

    const {
        CreateOpcUaServer,
        CloseServer,
        GetServer,
        AddVariable
    } = require("./core");


    //constructor
    function opcUaSeverNode(args) {
        RED.nodes.createNode(this, args);

        let node = this;

        if (args.resourcePath === undefined) return;
        if (args.port === undefined) return;

        node.resourcePath = args.resourcePath;
        node.port = args.port;

        startServer();

        node.on('close', onNodeClosed);
        node.on('error', onNodeError);

        //#region Methods

        async function startServer() {

            const server = CreateOpcUaServer(node.resourcePath, node.port);
            await server.initialize();

            const addressSpace = server.engine.addressSpace;
            const namespace = addressSpace.getOwnNamespace();

            // declare a new object
            const simNode = namespace.addObject({
                organizedBy: addressSpace.rootFolder.objects,
                browseName: "SIM"
            });

            createHierarchyTree(simNode, namespace);

            await server.start();

            const serverEndpoint = server.getEndpointUrl();
            node.log("OPC UA Server started at " + serverEndpoint);

            node.status({ text: serverEndpoint });
        }

        function createHierarchyTree(parentNode, namespace) {

            const scalarFolder = namespace.addObject({
                organizedBy: parentNode,
                browseName: "Scalar",
                typeDefinition: "FolderType"
            });

            //Scalar values
            AddVariable(namespace, scalarFolder, DataType[DataType.Boolean], DataType.Boolean);
            AddVariable(namespace, scalarFolder, DataType[DataType.SByte], DataType.SByte);
            AddVariable(namespace, scalarFolder, DataType[DataType.Byte], DataType.Byte);
            AddVariable(namespace, scalarFolder, DataType[DataType.Int16], DataType.Int16);
            AddVariable(namespace, scalarFolder, DataType[DataType.UInt16], DataType.UInt16);
            AddVariable(namespace, scalarFolder, DataType[DataType.Int32], DataType.Int32);
            AddVariable(namespace, scalarFolder, DataType[DataType.UInt32], DataType.UInt32);
            AddVariable(namespace, scalarFolder, DataType[DataType.Int64], DataType.Int64);
            AddVariable(namespace, scalarFolder, DataType[DataType.UInt64], DataType.UInt64);
            AddVariable(namespace, scalarFolder, DataType[DataType.Float], DataType.Float);
            AddVariable(namespace, scalarFolder, DataType[DataType.Double], DataType.Double);
            AddVariable(namespace, scalarFolder, DataType[DataType.String], DataType.String);
            AddVariable(namespace, scalarFolder, DataType[DataType.DateTime], DataType.DateTime);
            AddVariable(namespace, scalarFolder, DataType[DataType.Guid], DataType.Guid);
            AddVariable(namespace, scalarFolder, DataType[DataType.ByteString], DataType.ByteString);
            AddVariable(namespace, scalarFolder, DataType[DataType.XmlElement], DataType.XmlElement);
            AddVariable(namespace, scalarFolder, DataType[DataType.LocalizedText], DataType.LocalizedText);
            AddVariable(namespace, scalarFolder, DataType[DataType.QualifiedName], DataType.QualifiedName);
            AddVariable(namespace, scalarFolder, DataType[DataType.NodeId], DataType.NodeId);
        }

        async function onNodeClosed(done) {
            await CloseServer();
            node.status({ text: "" });
            done();
        }

        async function onNodeError() {
            node.status({ text: "" });
            await CloseServer();
        }

        //#endregion
    }

    RED.nodes.registerType("opcua-server", opcUaSeverNode);
}