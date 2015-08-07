(function(){
    var nonAngularDeps = angular.module('NonAngularDeps', []);

    nonAngularDeps.value('Signaling', com.selfip.mcopeland.rtc.Signaling);
    nonAngularDeps.value('RTC', com.selfip.mcopeland.rtc.RTC);

    nonAngularDeps.service('login', ['Signaling', 'RTC', function(Signaling, RTC) {
        "use strict";
        return function(username, callTargetsListener) {
            RTC.init(new Signaling(username, callTargetsListener, io.connect(window.location.href)));
        };
    }]);

    nonAngularDeps.service('logout', function() {
        "use strict";
        return function() {
            // TODO: call ChatRoom.hangup()
            throw new Error('Not implemented');
        };
    });

    nonAngularDeps.service('call', ['RTC', function(RTC) {
        "use strict";
        return function() {
            RTC.call();
        };
    }]);

    nonAngularDeps.service('sendData', ['RTC', function(RTC) {
        "use strict";
        return function(data) {
            RTC.sendData(data);
        };
    }]);

    nonAngularDeps.service('hangup', ['RTC', function(RTC) {
        "use strict";
        return function() {
            RTC.hangup();
        };
    }]);

    nonAngularDeps.service('setStreamHandler', ['RTC', function(RTC) {
        "use strict";
        return function(streamHandler) {
            RTC.setLocalStreamAdded(streamHandler.localStreamAdded);
            RTC.setRemoteStreamAdded(streamHandler.remoteStreamAdded);
            RTC.setRemoteStreamRemoved(streamHandler.remoteStreamRemoved);
        };
    }]);

    nonAngularDeps.service('setDataChannelHandler', ['RTC', function(RTC) {
        "use strict";
        return function(dataChannelHandler) {
            RTC.setSendChannelStateChanged(dataChannelHandler.sendChannelStateChanged);
            RTC.setReceiveChannelOnMessage(dataChannelHandler.receiveChannelDataReceived);
        };
    }]);
})();