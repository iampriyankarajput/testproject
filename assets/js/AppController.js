// import { stringToSign } from "knox/lib/auth";

var app = angular.module('WebApp', ['ngRoute']);
app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.
        when('/platform/', {
            templateUrl: '/views/product/list.html',
            controller: 'ProductController'
        }).
        when("/platform/add", {
            templateUrl: '/views/product/add.html',
            controller: 'ProductAddController'
        })
}]);

app.controller('AppController', function ($scope) {
    console.log("Home controller"); 
});
app.controller('ProductController', function ($scope, ProductService,$window) {
    $scope.getList = function () {
        ProductService.getProducts().then(function (data) {
            $scope.products = data.data.data;
        });
    };
});
app.controller('ProductAddController', function ($scope,  $location,$timeout, ProductService) {
  
    $scope.successMessage = '';
    $scope.errorMessage = '';
    $scope.requestSent = false;
    $scope.addProduct = function () {
        if($scope.Product.name&&$scope.Product.country) {
            $scope.successMessage = '';
            $scope.errorMessage = '';
            $scope.requestSent = true;
        var opts = {
            name: $scope.Product.name,
            color: $scope.Product.country
        };
        ProductService.addProduct(opts).then(function (data) {
            $scope.successMessage = 'Product has been added successfully';
            $scope.requestSent = false;
            $timeout(function () {
                $scope.requestSent = true;
                $scope.successMessage = '';
                $location.path('/platform');
            }, 4000);
        });
        } else {
            $scope.requestSent = false;
            $scope.errorMessage = 'Please fill all the details';
            $timeout(function () {
                $scope.errorMessage = '';
            }, 4000); 
          
        }
    };

});



