var nodeStatic = require('node-static');
var http = require('http');
// Create a node-static server instance
var file = new nodeStatic.Server('./public', {cache: 0});

// We use the http module's createServer function and
// rely on our instance of node-static to serve the files
var app = http.createServer(function (req, res) {
    file.serve(req, res);
}).listen(8181);

// Use socket.io JavaScript library for real-time web applications
var io = require('socket.io').listen(app);

if (io.sockets.numClients !== undefined) {
    throw new Error("io.sockets.numClients already defined: " + io.sockets.numClients);
} else {
    Object.defineProperty(io.sockets, "numClients", {value: function (channel) {
        var numClients = 0;
        for (var id in this.connected)
            if (this.connected[id].rooms.indexOf(channel) !== -1)
                numClients++;
        return numClients;
    },
        writable: false});
}

var callTargets = new CallTargets();

// Let's start managing connections...
io.sockets.on('connection', function (socket) {

    // Handle 'message' messages
    socket.on('jsep', function (channeledMessage) {
        log('S --> got JSEP message: ', channeledMessage);
        // channel-only broadcast...
        log('S --> broadcasting to room ' + channeledMessage.room);
        socket.broadcast.to(channeledMessage.room).emit('jsep', channeledMessage.message);
    });

    socket.on('receiveCallTargets', function() {
        callTargets.addListenerSocket(this);
    });

    socket.on('disconnect', function(){log('S --> socket disconnected.');});

    socket.on('leave', function(user_room){
        log('S --> Request from user ' + user_room.user + ' to leave room', user_room.room);
        callTargets.removeCallTarget(user_room.user);
    });

    socket.on('log', function (channeledMessage) {
        socket.broadcast.to(channeledMessage.room).emit('log', channeledMessage.message);
    });      // TODO: can we get rid of this now?


    function log() {
        var array = [">>> "];
        for (var i = 0; i < arguments.length; i++) {
            array.push(arguments[i]);
        }
        socket.emit('log', array);
    }


    // -- Chat room

    // Handle 'create or join' messages
    socket.on('create or join', function (user_room) {
        var numClients = io.sockets.numClients(user_room.room);
        log('S --> Room ' + user_room.room + ' has ' + numClients + ' client(s)');
        log('S --> Request from user ' + user_room.user + ' to create or join room', user_room.room);
        if (numClients == 0) {    // First client joining -> create room
            socket.join(user_room.room);
            callTargets.addCallTarget(user_room.user);
            socket.emit('created', user_room.room);
        } else {
            io.sockets.in(user_room.room).emit('join', user_room);
            socket.join(user_room.room);
            callTargets.addCallTarget(user_room.user);
            io.sockets.in(user_room.room).emit('joined', user_room);
        }
    });

});

function CallTargets() {

    var callTargets = [];
    var listenerSockets = [];

    var callTargetEventTypes = {
        'TYPE_ADDED': 'added',
        'TYPE_REMOVED': 'removed'
    };
    var EVENT_NAME = 'callTargets';

    function CallTargetEvent(type, callTargets) {
        this.type = type;
        this.callTargets = callTargets;
    }

    this.addCallTarget = function(callTarget) {
        callTargets.push(callTarget);
        sendEventToAllSockets(callTargetEventTypes.TYPE_ADDED, callTarget);
    };

    this.removeCallTarget = function(callTarget) {
        var newCallTargets = [];
        var numCallTargets = callTargets.length;
        for(var i = 0; i < numCallTargets; i++) {
            var thisCallTarget = callTargets[i];
            if(thisCallTarget !== callTarget)
                newCallTargets.push(thisCallTarget);
        }
        callTargets = newCallTargets;
        sendEventToAllSockets(callTargetEventTypes.TYPE_REMOVED, callTarget);
    };

    this.addListenerSocket = function(socket) {
        listenerSockets.push(socket);
        sendEventToSocket(socket, callTargetEventTypes.TYPE_ADDED, callTargets);
    };

    function sendEventToSocket(socket, type, pCallTargets) {
        socket.emit(EVENT_NAME, new CallTargetEvent(type, [].concat(pCallTargets)));
    }

    function sendEventToAllSockets(type, pCallTargets) {
        listenerSockets.forEach(function(socket) {
            sendEventToSocket(socket, type, pCallTargets);
        });
    }
}