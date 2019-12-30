/**
* @author p.baboo@huulke.com
* created on 05.09.2017
*/
(function () {
    'use strict';
    angular.module('WebApp').service('ProductService', ProductService);

    function ProductService($q, $http) {
        return {
            getProducts: function (name, category) {
                var def = $q.defer();
                var url = '/api/product';
                doGet($q, $http, url).then(function (data) {
                    def.resolve(data);
                }).catch(function (error) {
                    def.reject(error);
                });
                return def.promise;
            },
            getProductDetail: function (id) {
                var def = $q.defer();
                var url = '/api/product/' + id;
                doGet($q, $http, url).then(function (data) {
                    def.resolve(data);
                }).catch(function (error) {
                    def.reject(error);
                });
                return def.promise;
            },
            addProduct: function (opts) {
                var def = $q.defer();
                var url = '/api/product';
                doPost($q, $http, url, opts).then(function (data) {
                    def.resolve(data);
                }).catch(function (error) {
                    def.reject(error);
                });
                return def.promise;
            },

        };
    }
})();


