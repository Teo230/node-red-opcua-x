module.exports = function (RED) {

    var core = require('./core');

    function opcUaStatusNode(args) {

        RED.nodes.createNode(this, args);
        const opcuaclientnode = RED.nodes.getNode(args.client);

        let node = this;
        let state = false;

        if(opcuaclientnode == null) return;

        setInterval(checkServerConnection, 1000);

        function checkServerConnection() {
            const existingClient = core.opcClients[opcuaclientnode.connectionId];
            if (existingClient) {
                if (state === existingClient._internalState) return;
                state = existingClient._internalState;

                switch (state) {
                    case "connected":
                        node.status({ fill: "green", shape: "dot", text: "connected" });
                        break;
                    default:
                        node.status({ fill: "yellow", shape: "ring", text: state });

                }
            } else {
                state = "disconnected";
            }

            var msg = { payload: state };
            node.send(msg);
        }

    }

    RED.nodes.registerType("opcua-client-state", opcUaStatusNode);
}