module.exports = function (RED) {

    var core = require('./core');

    function opcUaStatusNode(config) {

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

                if(state){
                    node.status({fill:"green",shape:"dot",text:"connected"});
                }else{
                    node.status({fill:"red",shape:"ring",text:"disconnected"});
                }
                
                var msg = { payload: state ? 'connected' : 'disconnected' };

                node.send(msg);
            });
        }

    }

    RED.nodes.registerType("opcua-status", opcUaStatusNode);
}