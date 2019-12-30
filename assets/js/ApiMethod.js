'use strict';
var token = localStorage.getItem('token') || '';
//Common function to call the Get services
function doGet($q, $http, url) {
   var def = $q.defer();
   $http({
       method: "GET",
       url: url,
       headers : { 'Content-Type': 'application/json; charset=UTF-8', 'token' : token}
   }).then(function (data) {
        def.resolve(data);
    },function (error) {
        validateResponse(error);
        def.reject(error);
    });
   return def.promise;
} 

function doPost($q, $http, url, opts) {
   var def = $q.defer();
   $http({
       method: "POST",
       url: url,
       data    : opts,
       headers : { 'Content-Type': 'application/json; charset=UTF-8','token' : token}
   }).then(function (data) {
    def.resolve(data);
    },function (error) {
        validateResponse(error);
        def.reject(error);
    });
   return def.promise;
}


function validateResponse(res) {
   if(res.data.message == 'No token provided' || res.data.message == 'Failed to authenticate token') {
       window.location = '/';
   }

}