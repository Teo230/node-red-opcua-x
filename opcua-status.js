module.exports = function (RED) {

    var core = require('./core');

    function OpcUaStatusNode(config) {

        RED.nodes.createNode(this, config);

        const storage = core.storage;
        let node = this;
        let state = false;

        setInterval(checkServerConnection, 5000);

        function checkServerConnection() {
            if (storage === null || storage === undefined) return;

            storage.getItem("client-connected").then((value) => {
                if (state === value) return;
                state = value;
                var msg = { payload: state ? 'connected' : 'disconnected' };
                node.send(msg);
            });
        }

    }

    RED.nodes.registerType("opcua-status", OpcUaStatusNode);
}