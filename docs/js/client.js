var connectSettings = {
    name: null,
    serverType: null,
    localReceivePort: null,
    localSendPort: null,
    printIncoming: true,
    printOutgoing: true
}
var thisNode = {
    dap: 'none'
}

// use this to keep track of incoming username and TTS for populating the incoming data table
var receivedData = {

}
var ws;

localforage.getItem('connectSettings').then(function(value) {
    if(value){
        connectSettings = value
        // set form input values
        document.getElementById('usernameInput').value = connectSettings.name
        document.getElementById('serverType').value = connectSettings.serverType
        document.getElementById('localReceivePort').value = connectSettings.localReceivePort
        document.getElementById('localSendPort').value = connectSettings.localSendPort
        document.getElementById('printIncoming').checked = connectSettings.printIncoming
        document.getElementById('printOutgoing').checked = connectSettings.printOutgoing
    } else {
        document.getElementById('serverType').value = 'Public'
        document.getElementById('localReceivePort').value = 7404
        document.getElementById('localSendPort').value = 7403
        document.getElementById('printIncoming').checked = true
        document.getElementById('printOutgoing').checked = true
    }

   

}).catch(function(err) {
    // This code runs if there were any errors
    console.log(err);
});

const connectButton = document.getElementById("connectButton");
connectButton.addEventListener("click", function() {
    //   document.getElementById("demo").innerHTML = "Hello World";

    connectSettings.name = document.getElementById("usernameInput").value;
    connectSettings.serverType = document.getElementById("serverType").value;
    switch(connectSettings.serverType){
        case 'Public':
            connectSettings.host = "ws://allhands-stable.herokuapp.com/8081"
        break
        default: console.log('no switch case for chosen server type')
    }
    connectSettings.localReceivePort = document.getElementById("localReceivePort").value;
    connectSettings.localSendPort = document.getElementById("localSendPort").value;

    connectSettings.printIncoming = document.getElementById("printIncoming").checked;
    connectSettings.printOutgoing = document.getElementById("printOutgoing").checked;

    localforage.setItem('connectSettings', connectSettings).then(function (value) {
        // Do other things once the value has been saved.
    }).catch(function(err) {
        // This code runs if there were any errors
        console.log(err);
    });

    // change 'connect button' status to connecting...
    $("#connectButton").removeClass("btn-primary").addClass("btn-warning");
    $("#connectButton").text("Connecting...")
    ws = new WebSocket(connectSettings.host);
    // event emmited when connected
    ws.onopen = function () {
        console.log('websocket is connected ...')

        // change 'connect button' status to connected
        $("#connectButton").removeClass("btn-warning").addClass("btn-success");
        $("#connectButton").text("Connected")
        // sending a send event to websocket server
        // ws.send('connected')

        // send thisNode object to the server for tracking
        let handShake = JSON.stringify({
            cmd: 'thisNode',
            date: Date.now(),
            data: {
                name: connectSettings.name,
                dap: 'none'
            }
        })
        ws.send(handShake)
        
    }
    // event emmited when receiving message 
    ws.onmessage = function (ev) {
        let msg = JSON.parse(ev.data)
        
        switch(msg.cmd){
            case 'ping':

            break

            case 'pingReport':

            break

            case 'locationReport':

            break

            case 'OSC':
                // prevent data loopback from server broadcast (i.e. we don't ewant to receive our own)
                if(msg.addressPattern.split('/')[1] != connectSettings.name){
                    // check if this message belongs to our room or user isn't using a room 
                    if(thisNode.dap == msg.dap){
                        // send via osc
                        // localSend.send(msg.addressPattern, msg.typeTagString, (err) => {
                        //     if (err) console.error(err);
                        // }); 
                        if(connectSettings.printIncoming == true){
                            
                            console.log('incoming: ', msg.addressPattern, msg.typeTagString)
                            var senderName = msg.addressPattern.split('/')[1]
                            var AP_ID = msg.addressPattern.replace(/\//g, '-')
                            var newDate = new Date()
                            var timeStamp = `${newDate.getHours()}:${newDate.getMinutes()}:${newDate.getSeconds()}:${newDate.getMilliseconds()}`
                            if(!receivedData[senderName]){
                                receivedData[senderName] = {}
                                
    
                            } else {
                                if(!receivedData[senderName][msg.addressPattern]){
                                    receivedData[senderName][msg.addressPattern] = true
                                    var markup = `<tr>
                                        <td>${senderName}</td>
                                        <td>${msg.addressPattern}</td>
                                        <td id="${AP_ID}">${msg.typeTagString}</td>
                                        <td id="${AP_ID}_ts">${timeStamp}</td>
                                    </tr>`;
                                    $("#incomingDataTable").append(markup);
                                } else {
                                    // update the table row
                                    $(`#${AP_ID}`).text(msg.typeTagString);
                                    $(`#${AP_ID}_ts`).text(timeStamp);
                                }
                                
                                
                                
                            }
                            
                            console.log(receivedData)

                           
                        }   
                        // if the local ws server is enabled at startup, pack the OSC message as a json object
                        // if(localWSstate == true){
                        // let apSplit = msg.addressPattern.split('/')
                        // apSplit.shift()
                        
                        // let oscObject = {
                        //     cmd: "OSC",
                        //     dap: thisNode.dap,
                        //     data: {},
                        //     date: Date.now(),
                        // }
                        
                        // // create a nested path from the addressPattern 
                        // let createNestedObject = function( base, names, value ) {
                        //     // If a value is given, remove the last name and keep it for later:
                        //     let lastName = arguments.length === 3 ? names.pop() : false;
                        
                        //     // Walk the hierarchy, creating new objects where needed.
                        //     // If the lastName was removed, then the last object is not set yet:
                        //     for( let i = 0; i < names.length; i++ ) {
                        //         base = base[ names[i] ] = base[ names[i] ] || {};
                        //     }
                        
                        //     // If a value was given, set it to the last name:
                        //     if( lastName ) base = base[ lastName ] = value;
                        
                        //     // Return the last object in the hierarchy:
                        //     return base;
                        // };
                        
                        // let obj = {}; 
                        // createNestedObject( obj, apSplit, msg.typeTagString )
                        // // add nested path to outgoing osc object
                        // oscObject.data = obj    
                        // // send it to local apps!        
                        // localBroadcast(JSON.stringify(oscObject))
                        // }
                    }
                }
            break

            default: 
        }
    }
    ws.onerror = function(error){
        console.log(error)
    }
});