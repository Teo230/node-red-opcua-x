module.exports = function (RED) {

    var core = require('./core');

    function opcUaStatusNode(config) {

        RED.nodes.createNode(this, config);

        let node = this;
        let state = false;

        setInterval(checkServerConnection, 5000);

        function checkServerConnection() {
            if (state === core.opcClientStatus) return;
            state = core.opcClientStatus;

            switch(state){
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

            var msg = { payload: state };

            node.send(msg);
        }

    }

    RED.nodes.registerType("opcua-status", opcUaStatusNode);
}