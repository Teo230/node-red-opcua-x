module.exports = function (RED) {

    var core = require('./core');

    function opcUaStatusNode(config) {

        RED.nodes.createNode(this, config);
        const opcuaclientnode = RED.nodes.getNode(config.client);

        let node = this;
        let state = false;

        setInterval(checkServerConnection, 1000);

        function checkServerConnection() {
            const existingClient = core.opcClients[opcuaclientnode.connectionId];
            if (existingClient) {
                if (state === existingClient.clientState) return;
                state = existingClient.clientState;

                switch (state) {
                    case "connected":
                        node.status({ fill: "green", shape: "dot", text: "connected" });
                        break;
                    case "reconnecting":
                        node.status({ fill: "yellow", shape: "ring", text: "reconnecting" });
                        break;
                    case "disconnected":
                    default:
                        node.status({ fill: "red", shape: "ring", text: "disconnected" });
                }
            } else {
                state = "disconnected";
            }

            var msg = { payload: state };
            node.send(msg);
        }

    }

    RED.nodes.registerType("opcua-status", opcUaStatusNode);
}