(function() {
    'use strict';

    var app = angular.module('app');
    app.controller('VideochatController',
        ['$scope', '$window', 'sendData', 'hangup', 'setStreamHandler', 'setDataChannelHandler', VideochatController]);
    app.directive('videochat', function() {
        return {
            restrict: 'E',
            templateUrl: 'angular/videochat/videochat.html',
            controller: VideochatController,
            controllerAs: 'videochatController',
            link: function(scope, element, attrs) {
                var videos = element.find('video');
                scope.localVideo = videos[0];
                scope.remoteVideo = videos[1];
            }
        };
    });


    function VideochatController($scope, $window, sendData, hangup, setStreamHandler, setDataChannelHandler) {
        var self = this;

        // --- public properties

        this.sendText = '';
        this.receivedText = '';
        this.dataChannelReady = false;

        this.sendData = function() {
            sendData(self.sendText);
        };

        this.hangup = function() {
            hangup();
        };


        // --- initialisation
        {
            $window.onbeforeunload = function(e){
                self.hangup();
            };

            setStreamHandler({
                'localStreamAdded': gotLocalStream,
                'remoteStreamAdded': gotRemoteStream,
                'remoteStreamRemoved': lostRemoteStream
            });

            setDataChannelHandler({
                'sendChannelStateChanged': handleSendChannelStateChange,
                'receiveChannelDataReceived': handleMessage
            });
        }


        // --- private functions

        function gotLocalStream(stream) {
            attachMediaStream($scope.localVideo, stream);
        }

        function gotRemoteStream(stream) {
            attachMediaStream($scope.remoteVideo, stream);
            console.log('Remote stream attached!!.');
        }

        function lostRemoteStream(event) {
            console.log('Remote stream removed. Event: ', event);
        }

        function handleMessage(message) {
            self.receivedText = message;
            if (!$scope.$$phase) {
                $scope.$digest();
            }
        }

        function handleSendChannelStateChange(readyState) {
            self.dataChannelReady = (readyState == "open");
            if (!$scope.$$phase) {
                $scope.$digest();
            }
        }
    }
})();