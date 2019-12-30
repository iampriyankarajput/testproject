
(function () {
  'use strict';
  angular.module('WebApp').directive('navBar', navBar);
  function navBar() {
    return {
      restrict: 'E',
      templateUrl: '/views/nav/menus.html'
    };
  }
})();