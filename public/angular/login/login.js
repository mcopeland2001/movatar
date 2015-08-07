(function() {
    'use strict';

    var app = angular.module('app');
    app.controller('LoginController',
        ['$scope', '$filter', 'login', 'logout', 'call', LoginController]);
    app.directive('login', function() {
        return {
            restrict: 'E',
            templateUrl: 'angular/login/login.html',
            controller: LoginController,
            controllerAs: 'loginController'
        };
    });

    function LoginController($scope, $filter, login, logout, call) {
        'use strict';
        var self = this;
        this.loggedIn = false;
        this.username = '';
        this.callTargets = [];

        this.login = function () {
            login(self.username, callTargetsListener);
            self.loggedIn = true;
        };

        this.logout = function () {
            logout();
            self.loggedIn = false;
        };

        this.call = function() {
            call();
        };

        function callTargetsListener(newCallTargets) {
            console.log('Call targets received: ' + newCallTargets);
            self.callTargets = $filter('filter')(newCallTargets, function (v, i) {
                return v != self.username
            });
            $scope.$apply();
        }
    }
})();