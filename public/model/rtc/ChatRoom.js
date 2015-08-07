(function() {

    /**
     * Simple chat room that users must first join to enable
     * subsequent peer-to-peer RTC.
     */
    function ChatRoom(username, callTargetsListener, socket) {
        var self = this;
        var room = 'room1';
        this.userJoinedRoomHandler = null;
        var jsepMessageHandler = null;
        var callTargetsListeners = [];
        var callTargets = [];


        // -- implement com.selfip.mcopeland.Signaling interface

        this.sendJsepMessage = function(message) {
            var channeledMessage = {'message': message, 'room': room};
            console.log('Sending JSEP message: ', channeledMessage);
            socket.emit('jsep', channeledMessage);
        };

        this.setJsepMessageHandler = function(handler) {
            jsepMessageHandler = handler;
        };

        this.log = function(message) {
            var channeledMessage = {'message': new Array(username).concat(message), 'room': room};
            socket.emit('log', channeledMessage);
        };

        this.addCallTargetsListener = function(listener) {
            callTargetsListeners.push(listener);
        };

        this.hangup = function() {
            self.log('attempting to leave room...');
            var user_room = {'user': username, 'room': room};
            socket.emit('leave', user_room);
            socket.disconnect();
        };


        // constructor
        {
            // Send 'Create or join' message to signaling server
            if (username) {
                console.log(username + " --> " + 'Create or join room', room);
                var user_room = {'user': username, 'room': room};
                socket.emit('create or join', user_room);
            } else {
                throw new Error('Empty username.');
            }
            self.addCallTargetsListener(callTargetsListener);
            socket.emit('receiveCallTargets');
        }



        // -- private internals

        socket.on('callTargets', function (callTargetEvent) {
            function addCallTargets(newCallTargets) {
                console.log('call targets added: ' + newCallTargets);
                callTargets = callTargets.concat(newCallTargets);
            }
            function removeCallTargets(removedCallTargets) {
                console.log('call targets removed: ' + removedCallTargets);
                var newCallTargets = [];
                for(var i = 0; i < callTargets.length; i++) {
                    var thisCallTarget = callTargets[i];
                    if(removedCallTargets.indexOf(thisCallTarget) == -1)
                        newCallTargets.push(thisCallTarget);
                }
                callTargets = newCallTargets;
            }
            if(callTargetEvent.type === 'added')
                addCallTargets(callTargetEvent.callTargets);
            else if(callTargetEvent.type === 'removed')
                removeCallTargets(callTargetEvent.callTargets);
            else
                throw new Error('Unrecognised call target event type: ' + callTargetEvent.type);
            for(var i  = 0; i < callTargetsListeners.length; i++) {
                callTargetsListeners[i](callTargets);
            }
        });

        // Handle 'created' message coming back from server:
        // this peer is the initiator
        socket.on('created', function (room) {
            console.log('Created room ' + room);
        });

        // Handle 'full' message coming back from server:
        // this peer arrived too late :-(
        socket.on('full', function (room) {
            console.log('Room ' + room + ' is full');
        });

        // Handle 'join' message coming back from server:
        // another peer is joining the channel
        socket.on('join', function (user_room) {
            console.log('User ' + user_room.user + ' made a request to join room ' + room);
            console.log('This peer is the initiator of room ' + room + '!');
        });

        // Handle 'joined' message coming back from server:
        // this is the second peer joining the channel
        socket.on('joined', function (user_room) {
            console.log('User ' + user_room.user + ' has joined room ' + room);
        });

        // JSEP message handling
        socket.on('jsep', function (message) {
            jsepMessageHandler(message);
        });

        // Server-sent log message...
        socket.on('log', function (array) {
            console.log.apply(console, array);
        });

    }

    var Namespace = namespace('com.selfip.mcopeland.rtc');
    ChatRoom.prototype = new Namespace.Signaling();
    Namespace.Signaling = ChatRoom;
})();