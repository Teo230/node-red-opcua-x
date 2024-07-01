module.exports = function (RED) {

    //variables placed here are shared by all nodes
    var storage = require('node-persist');

    function OpcUaStatusNode(config) {

        RED.nodes.createNode(this, config);
        let node = this;
        let state = false;

        //Initialize persist storage
        storage.init({ dir: `${RED.settings.userDir}/cache/node-red-opcua-x` });

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