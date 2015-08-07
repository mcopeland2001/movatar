(function() {
    'use strict';


    // -- media configuration

    // PeerConnection ICE protocol configuration (either Firefox or Chrome)
    var pc_config = webrtcDetectedBrowser === 'firefox' ?
    {'iceServers':[{'url':'stun:23.21.150.121'}]} : // IP address
    {'iceServers': [{'url': 'stun:stun.l.google.com:19302'}]};
    var pc_constraints = {'optional': [{'DtlsSrtpKeyAgreement': true}]};
    var sdp_constraints = {};

    // user media constraints
    var media_constraints = {video: true, audio: {
        "mandatory": {
            "googEchoCancellation": "true",
            "googAutoGainControl": "true",
            "googNoiseSuppression": "true",
            "googHighpassFilter": "true"
        },
        "optional": []
    }};

    // -- end media configuration


    var Namespace = namespace('com.selfip.mcopeland.rtc');




    /**
     * Implementation of the JavaScript Session Establishment Protocol
     */
    function Session(sdp_constraints, mediaHandler, jsepMessageHandler, logHandler) {

        var thisSession = this;
        var peerConnection = null;
        var media = new Media(pc_config, pc_constraints, mediaHandler);

        // -- public interface

        this.handleJsepMessage = function(message) {
            console.log('Received JSEP message:', message);
            if (message.type === 'offer') {
                if(!media.isStarted) {
                    media.start();
                }
                peerConnection.setRemoteDescription(new RTCSessionDescription(message));
                doAnswer();
            } else if (message.type === 'answer') {
                peerConnection.setRemoteDescription(new RTCSessionDescription(message));
            } else if (message.type === 'candidate') {
                var candidate = new RTCIceCandidate({sdpMLineIndex: message.label, candidate: message.candidate});
                peerConnection.addIceCandidate(candidate);
            } else if (message === 'bye') {       // TODO: move 'bye' message handling to chat room
                console.log('Session terminated.');
                media.stop();
            }
        };

        this.call = function() {
            media.start();
        };

        this.hangup = function() {
            console.log('Hanging up.');
            media.stop();
            jsepMessageHandler('bye');       // TODO: 'bye' is not a jsep message. leave to chat room.
        };

        this.sendData = function(data) {
            media.sendChannel.send(data);
        };

        this.createOffer = function() {
            console.log('Creating Offer...');
            peerConnection.onicecandidate = handleIceCandidate;
            peerConnection.createOffer(setLocalAndSendMessage, onSignalingError, sdp_constraints);
        };


        // -- private internals

        function onSignalingError(error) {
            console.log('Failed to create signaling message : ' + error.name);
        }

        function setLocalAndSendMessage(sessionDescription) {
            peerConnection.setLocalDescription(sessionDescription);
            jsepMessageHandler(sessionDescription);
        }

        function doAnswer() {
            console.log('Sending answer to peer.');
            peerConnection.createAnswer(setLocalAndSendMessage, onSignalingError, sdp_constraints);
        }

        function handleIceCandidate(event) {
            console.log('handleIceCandidate event: ', event);
            if (event.candidate) {
                jsepMessageHandler({type: 'candidate',label: event.candidate.sdpMLineIndex,
                    id: event.candidate.sdpMid,candidate: event.candidate.candidate});
            } else {
                console.log('End of candidates.');
            }
        }


        // -- media handling

        function Media(pc_config, pc_constraints, mediaHandler) {
            var self = this;

            this.sendChannel = null;
            this.receiveChannel = null;
            this.getUserMedia = getUserMedia;           // TODO: remove? or use?
            this.isStarted = false;


            // -- public interface

            this.start = function() {
                if (!self.isStarted) {
                    getUserMedia(media_constraints, handleUserMedia, handleUserMediaError);
                    console.log('Getting user media with constraints', media_constraints);
                    self.isStarted = true;
                }
            };

            this.stop = function() {
                self.isStarted = false;
                if (self.sendChannel) self.sendChannel.close();
                if (self.receiveChannel) self.receiveChannel.close();
                if (peerConnection) peerConnection.close();
                init();
            };

            this.createPeerConnection = function() {
                try {
                    peerConnection = new RTCPeerConnection(pc_config, pc_constraints);
                    log('Created RTCPeerConnnection with:\n' + ' config: \'' + JSON.stringify(pc_config) + '\';\n' +
                        ' constraints: \'' + JSON.stringify(pc_constraints) + '\'.');
                } catch (e) {
                    log('Failed to create PeerConnection, exception: ' + e.message);
                    return;
                }
                peerConnection.onaddstream = handleRemoteStreamAdded;
                peerConnection.onremovestream = handleRemoteStreamRemoved;
                try {
                    self.sendChannel = peerConnection.createDataChannel("sendDataChannel", {reliable: true});
                    trace('Created send data channel');
                } catch (e) {
                    trace('createDataChannel() failed with exception: ' + e.message);
                }
                self.sendChannel.onopen = handleSendChannelStateChange;
                self.sendChannel.onclose = handleSendChannelStateChange;
                peerConnection.ondatachannel = gotReceiveChannel;
            };


            // -- Constructor
            {
                init();
            }


            // -- private internals

            function init() {
                self.createPeerConnection();
            }

            function gotReceiveChannel(event) {
                trace('Receive Channel Callback');
                self.receiveChannel = event.channel;
                self.receiveChannel.onopen = handleReceiveChannelStateChange;
                self.receiveChannel.onclose = handleReceiveChannelStateChange;
                self.receiveChannel.onmessage = handleMessage;
            }

            function handleRemoteStreamAdded(event) {
                log('Remote stream received: ' + event.stream);
                mediaHandler.remoteStreamAdded(event.stream);
            }

            function handleRemoteStreamRemoved(event) {
                mediaHandler.remoteStreamRemoved(event);
                self.stop();
            }

            function log(msg) {
                logHandler(msg);
            }

            function handleUserMedia(stream) {
                console.log('Adding local stream.');
                peerConnection.addStream(stream);
                mediaHandler.localStreamAdded(stream);
                thisSession.createOffer();
            }

            function handleUserMediaError(error){
                console.log('navigator.getUserMedia error: ', error);
            }

            // data channel handlers
            function handleSendChannelStateChange() {
                var readyState = self.sendChannel.readyState;
                trace('Send channel state is: ' + readyState);
                mediaHandler.sendChannelStateChanged(readyState);
            }
            function handleReceiveChannelStateChange() {
                var readyState = self.receiveChannel.readyState;
                trace('Receive channel state is: ' + readyState);
            }
            function handleMessage(event) {
                mediaHandler.receiveChannelOnMessage(event.data);
            }
        }
    }


    Namespace.RTC = new (function() {

        var mediaHandler = {     // Handler object for media events
            localStreamAdded: function(stream) {console.log('local stream added handler not implemented.')},
            remoteStreamAdded: function(stream) {console.log('remote stream added handler not implemented.')},
            remoteStreamRemoved: function(event) {console.log('remote stream removed event handler not implemented.')},
            sendChannelStateChanged: function(state) {console.log('send channel state changed handler not implemented.')},
            receiveChannelOnMessage: function(message) {console.log('receive channel on-message handler not implemented.')}
        };

        var callState = new function() {
            var _inCall = false;
            var callStateHandler = null;    // Handler of the form function(inCall){}
            this.setCallStateHandler = function(handler) {
                callStateHandler = handler;
            };
            Object.defineProperty(this, 'inCall', {
                get: function() {
                    return _inCall;
                },
                set: function(inCall) {
                    _inCall = inCall;
                    callStateHandler && callStateHandler(_inCall);    // TODO: only call handler if inCall != _inCall
                }
            });
        };


        var session = null;
        var signaling = null;

        Object.defineProperty(this, 'inCall', {
            get: function() {
                return callState.inCall;
            }
        });

        this.init = function(signalingObj) {
            if(!(signalingObj instanceof Namespace.Signaling)) {
                alert('Error: Incompatible signaling. Check console for details.');
                throw new Error('object signaling must implement com.selfip.mcopeland.Signaling');
            }   // TODO: call prototype.init()
            signalingObj.setJsepMessageHandler(jsepToSession);
            signaling = signalingObj;
        };

        this.call = function() {
            getSession(true).call();
        };

        this.hangup = function() {
            try {
                getSession(false).hangup();
                session = null;
            } finally {
                callState.inCall = false;
                if(signaling != null) {
                    signaling.log('hanging up...');
                    signaling.hangup();    // TODO: add to Signaling interface and implement with bye message in ChatRoom
                }
            }
        };

        this.sendData = function(data){
            getSession(false).sendData(data);
        };

        this.setLocalStreamAdded = function(handler) {
            mediaHandler.localStreamAdded = handler;
        };

        this.setRemoteStreamAdded = function(handler) {
            mediaHandler.remoteStreamAdded = handler;
        };

        this.setRemoteStreamRemoved = function(handler) {
            mediaHandler.remoteStreamRemoved = handler;
        };

        this.setSendChannelStateChanged = function(handler) {
            mediaHandler.sendChannelStateChanged = handler;
        };

        this.setReceiveChannelOnMessage = function(handler) {
            mediaHandler.receiveChannelOnMessage = handler;
        };

        this.setCallStateHandler = function(handler) {
            callState.setCallStateHandler(handler);
        };


        // -- private

        /**
         * Gets the existing session if there is one. Otherwise, if the argument is true,
         * creates a new session and, if the argument is false, throws an error.
         */
        function getSession(createIfNecessary) {
            if(session != null) {
                return session;
            } else {
                session = new Session(sdp_constraints, mediaHandler, jsepToSignaling, logHandler);
                callState.inCall = true;
                return session;
            }
        }

        function jsepToSession(message) {
            getSession(true).handleJsepMessage(message);
        }

        function jsepToSignaling(message) {
            signaling.sendJsepMessage(message);
        }

        function logHandler(message) {
            signaling.log(message);
        }
    });

    Namespace.RTC.prototype = new Namespace.RTCInterface();
})();