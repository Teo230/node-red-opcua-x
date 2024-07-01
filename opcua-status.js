module.exports = function (RED) {

    //variables placed here are shared by all nodes
    var storage = require('node-persist');

    function OpcUaStatusNode(config) {

        RED.nodes.createNode(this, config);
        let node = this;

        //Initialize persist storage
        storage.init({ dir: `${RED.settings.userDir}/opcua-x/persist` });

        setInterval(checkServerConnection, 5000);

        function checkServerConnection() {
            state = false;
            if (storage !== null && storage !== undefined) {
                storage.getItem("client-connected").then((value) =>{
                    state = value;
                });
            }
            var msg = { payload: state };
            node.send(msg);
        }

    }
    RED.nodes.registerType("opcua-status", OpcUaStatusNode);

}