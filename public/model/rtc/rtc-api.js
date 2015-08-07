(function() {
    "use strict";

    var Namespace = namespace('com.selfip.mcopeland.rtc');

    /**
     * An object that inherits from this one and implements the methods is required as the
     * argument to the RTC.init() method.
     */
    Namespace.Signaling = function() {
        var self = this;

        this.sendJsepMessage = function(message) {
            throw new Error('Method not implemented.');
        };

        this.setJsepMessageHandler = function(handler) {
            throw new Error('Method not implemented.');
        };

        this.log = function(array) {                   // TODO: can we get rid of this now we can use fake streams in Canary Dev?
            throw new Error('Method not implemented.');
        };

        this.addCallTargetsListener = function(listener) {
            throw new Error('Method not implemented.');
        };
    };


    Namespace.RTCInterface = function() {

        Object.defineProperty(this, 'inCall', {
            get: function() {
                throw new Error('Method not implemented.');
            }
        });

        this.init = function(signalingObj) {
            if(!(signalingObj instanceof Namespace.Signaling)) {
                alert('Error: Incompatible signaling. Check console for details.');
                throw new Error('object signaling must implement com.selfip.mcopeland.Signaling');
            }
        };

        this.call = function() {
            throw new Error('Method not implemented.');
        };

        this.hangup = function() {
            throw new Error('Method not implemented.');
        };

        this.sendData = function(data){
            throw new Error('Method not implemented.');
        };

        this.setLocalStreamAdded = function(handler) {
            throw new Error('Method not implemented.');
        };

        this.setRemoteStreamAdded = function(handler) {
            throw new Error('Method not implemented.');
        };

        this.setRemoteStreamRemoved = function(handler) {
            throw new Error('Method not implemented.');
        };

        this.setSendChannelStateChanged = function(handler) {
            throw new Error('Method not implemented.');
        };

        this.setReceiveChannelOnMessage = function(handler) {
            throw new Error('Method not implemented.');
        };

        this.setCallStateHandler = function(handler) {
            throw new Error('Method not implemented.');
        };
    };
})();