(function() {
    'use strict';

    var app = angular.module('app', ['NonAngularDeps']);
    app.controller('MainController', ['$scope', 'RTC', MainController]);

    function MainController($scope, RTC) {
        'use strict';

        $scope.inCall = false;


        RTC.setCallStateHandler(inCallStateChange);

        function inCallStateChange(inCall) {
            console.log('inCallStateChange executing...', 'inCall = ' + inCall);
            $scope.inCall = inCall;
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        }
    }

})();