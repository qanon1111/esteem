var fs = require('fs');

var app = angular.module('steem', [
	'ionic', 
	'ngStorage', 
	'ngCordova',
  'wiz.markdown',
  'rzModule'
	//'ionic.contrib.ui.ionThread'
]);
var steemRPC = require("steem-rpc");
if (localStorage.getItem("socketUrl") === null) {
  localStorage.setItem("socketUrl", "wss://steemit.com/wspa");
}
window.Api = steemRPC.Client.get({url:localStorage.socketUrl}, true);
window.steemJS = require("steemjs-lib");

require('./services')(app);
require('./controllers')(app);

app.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider, $sceDelegateProvider) {
  $stateProvider

  .state('app', {
    url: '/app',
    abstract: true,
    template: fs.readFileSync(__dirname + '/templates/menu.html', 'utf8'),
    //templateUrl: 'templates/menu.html',
    controller: 'AppCtrl'
  })

  .state('app.settings', {
    url: '/settings',
    views: {
      'menuContent': {
        //templateUrl: 'templates/settings.html'
        template: fs.readFileSync(__dirname + '/templates/settings.html', 'utf8'),
        controller: 'SettingsCtrl'
      }
    }
  })

  .state('app.send', {
    url: '/send',
    views: {
      'menuContent': {
        //templateUrl: 'templates/settings.html'
        template: fs.readFileSync(__dirname + '/templates/send.html', 'utf8'),
        controller: 'SendCtrl'

      }
    }
  })

  .state('app.follow', {
    url: '/follow',
    views: {
      'menuContent': {
        //templateUrl: 'templates/follow.html',
        template: fs.readFileSync(__dirname + '/templates/follow.html', 'utf8'),
        controller: 'FollowCtrl'
      }
    }
  })


  .state('app.exchange', {
    url: '/exchange/:username',
    views: {
      'menuContent': {
      	template: fs.readFileSync(__dirname + '/templates/exchange.html', 'utf8'),
        //templateUrl: 'templates/exchange.html',
        controller: 'ExchangeCtrl'
      }
    }
  })

  .state('app.profile', {
    url: '/profile/:username',
    views: {
      'menuContent': {
        //templateUrl: 'templates/profile.html',
        template: fs.readFileSync(__dirname + '/templates/profile.html', 'utf8'),
        controller: "ProfileCtrl"
      }
    }
  })

  .state('app.posts', {
    url: '/posts/:tags',
    views: {
      'menuContent': {
        //templateUrl: 'templates/posts.html',
        template: fs.readFileSync(__dirname + '/templates/posts.html', 'utf8'),
        controller: 'PostsCtrl'
      }
    }
  })
  
  .state('app.bookmark', {
    url: '/bookmark',
    views: {
      'menuContent': {
        //templateUrl: 'templates/post.html',
        template: fs.readFileSync(__dirname + '/templates/bookmarks.html', 'utf8'),
        controller: 'BookmarkCtrl'
      }
    }
  })

  .state('app.single', {
    url: '/single',
    views: {
      'menuContent': {
        //templateUrl: 'templates/post.html',
        template: fs.readFileSync(__dirname + '/templates/post.html', 'utf8'),
        controller: 'PostCtrl'
      }
    }
  });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/posts/');
  $ionicConfigProvider.navBar.alignTitle('left')
  $ionicConfigProvider.backButton.text('').icon('ion-ios-arrow-back');
  $ionicConfigProvider.views.swipeBackEnabled(false);
  //$sceDelegateProvider.resourceUrlWhitelist(['self', new RegExp('^(http[s]?):\/\/(w{3}.)?youtube\.com/.+$')]);
});

app.run(function($ionicPlatform, $rootScope, $localStorage, $interval, $ionicPopup, $ionicLoading, $cordovaSplashscreen, $ionicModal, $timeout, $cordovaToast, APIs, $state) {
  $rootScope.$storage = $localStorage;
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
    setTimeout(function() {
      (new Steem(localStorage.socketUrl)).getCurrentMedianHistoryPrice(function(e,r){
        $rootScope.$storage.base = r.base.substring(r.base.length-4,-4);
        (new Steem(localStorage.socketUrl)).getDynamicGlobalProperties(function(e,r){
          $rootScope.$storage.steem_per_mvests = (Number(r.total_vesting_fund_steem.substring(0, r.total_vesting_fund_steem.length - 6)) / Number(r.total_vesting_shares.substring(0, r.total_vesting_shares.length - 6))) * 1e6;
        });
      });
    }, 10);
    if (!$rootScope.$storage.view) {
      $rootScope.$storage.view = 'compact';
    }
    if (!$rootScope.$storage.filter) {
      $rootScope.$storage.filter = "trending";
    }
    if (navigator.splashscreen) {
      setTimeout(function() {
        navigator.splashscreen.hide();  
      }, 1000);
    }
    console.log("app start ready");
    setTimeout(function() {
      if ($rootScope.$storage.pincode) {
        $rootScope.$broadcast("pin:check");
      }  
    }, 1000);
    $rootScope.showAlert = function(title, msg) {
      var alertPopup = $ionicPopup.alert({
        title: title,
        template: msg
      });
      if (msg.indexOf("error")>-1) {
        //window.Api.initPromise.then(function(response) {
        console.log("broadcast error");
        //});
      }
      return alertPopup/*.then(function(res) {
        console.log('Thank you ...');
      });*/
    };
    $rootScope.showMessage = function(title, msg) {
      if (window.cordova) {
        $cordovaToast.showShortBottom(title+": "+msg).then(function(success) {
          // success
          console.log("toast"+success);
        }, function (error) {
          // error
          console.log("toast"+error);
        });  
      } else {
        $rootScope.showAlert(title, msg);
      }
    };
    $rootScope.$on('show:loading', function(event, args){
      console.log('show:loading');
      $ionicLoading.show({
        noBackdrop : true,
        template: '<ion-spinner></ion-spinner>'
      });
    });
    $rootScope.$on('hide:loading', function(event, args){
      console.log('hide:loading');
      $ionicLoading.hide();
    });

    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){ 
      console.log("from "+fromState.name+" to "+toState.name);
    });

    $ionicPlatform.on('resume', function(){
      console.log("app resume");
      if (!angular.isDefined($rootScope.timeint)) {
        window.Api.initPromise.then(function(response) {
          console.log("Api ready state change: "+angular.toJson(response));
          $rootScope.timeint = $interval(function(){
            window.Api.database_api().exec("get_dynamic_global_properties", []).then(function(response){
              console.log("get_dynamic_global_properties " + response.head_block_number);
            });
          }, 15000);
        });
      }
      if ($rootScope.$storage.pincode) {
        $rootScope.$broadcast("pin:check");
      }
    });
    $ionicPlatform.on('pause', function(){
      console.log("app pause");
      if (angular.isDefined($rootScope.timeint)) {
        console.log("cancel interval");
        $interval.cancel($rootScope.timeint);
        $rootScope.timeint = undefined;
      }
    });
    
    $ionicPlatform.on('offline', function(){
      console.log("app offline");
    });

    $rootScope.init = function() {
      $rootScope.passcode = "";
      if (!$rootScope.$$phase) {
        $rootScope.$apply();
      }
    };
 
    $rootScope.add = function(value) {
      $rootScope.pinerror = "";
      if($rootScope.passcode.length < 4) {
        $rootScope.passcode = $rootScope.passcode + value;
        if($rootScope.passcode.length == 4) {
          $timeout(function() {
            console.log("PIN "+$rootScope.passcode);
            if ($rootScope.pintype == 3) {
              if ($rootScope.$storage.pincode == $rootScope.passcode) {
                $rootScope.passcode = "";
                $rootScope.closePin();
              } else {
                $rootScope.pintry += 1;
                $rootScope.pinerror = "NOT MATCH"+"("+$rootScope.pintry+")"; 
                if ($rootScope.pintry>3) {
                  $rootScope.$storage.pincode = undefined;
                  $rootScope.pintry = 0;
                  $rootScope.$broadcast("pin:failed");
                  $rootScope.closePin();  
                }
              }
            }
            if ($rootScope.pintype == 0) {
              console.log("type 0: set pin");
              if ($rootScope.$storage.pincode) {
                $rootScope.$broadcast("pin:check");
                $rootScope.closePin();
              } else {
                $rootScope.$storage.pincode = $rootScope.passcode;  
                $rootScope.pinsubtitle = "Confirm PIN";
                $rootScope.passcode = "";
                $rootScope.pintype = 3;
                $rootScope.pintry = 0;
              }
            }
            if ($rootScope.pintype == 1) {
              console.log("type 1: check pin");                  
              if ($rootScope.$storage.pincode == $rootScope.passcode){
                $rootScope.$broadcast('pin:correct');
                $rootScope.passcode = "";
                $rootScope.closePin();
              } else {
                $rootScope.pintry += 1;
                $rootScope.pinerror = "INCORRECT"+"("+$rootScope.pintry+")"; 
                if ($rootScope.pintry>3) {
                  $rootScope.$storage.$reset();
                  $rootScope.closePin();  
                }
              }
            }
            
          }, 50);
        }
      }
    };
 
    $rootScope.delete = function() {
      $rootScope.pinerror = "";
      if($rootScope.passcode.length > 0) {
        $rootScope.passcode = $rootScope.passcode.substring(0, $rootScope.passcode.length - 1);
      }
    }

    $ionicModal.fromTemplateUrl('templates/pincode.html', {
      scope: $rootScope
    }).then(function(modal) {
      $rootScope.pinmodal = modal;
    });
    $rootScope.closePin = function() {
      $rootScope.pinmodal.hide();
    };
    $rootScope.openPin = function(type) {
      $rootScope.passcode = "";
      if (type == 0) {
        $rootScope.pintype = 0;
        $rootScope.pintitle = "Set PIN";
        $rootScope.pinsubtitle = "Set PIN";
      }
      if (type == 1) {
        $rootScope.pintype = 1;
        $rootScope.pintry = 0;
        $rootScope.pintitle = "Enter PIN";
        $rootScope.pinsubtitle = "Enter PIN";
      }
      $rootScope.pinmodal.show();
    };
    $rootScope.$on("pin:new", function(){
      $rootScope.openPin(0);
    });
    $rootScope.$on("pin:check", function(){
      $rootScope.openPin(1);
    });


    $rootScope.getContentAndOpen = function(author, permlink) {
    (new Steem(localStorage.socketUrl)).getContent(author, permlink, function(err, result){
      //console.log(err);
      //console.log(result);
      if (!err) {
        for (var j = result.active_votes.length - 1; j >= 0; j--) {
          if (result.active_votes[j].voter === $rootScope.$storage.user.username) {
            if (result.active_votes[j].percent > 0) {
              result.upvoted = true;  
            } else if (result.active_votes[j].percent < 0) {
              result.downvoted = true;  
            } else {
              result.downvoted = false;  
              result.upvoted = false;  
            }
          }
        }
        $rootScope.$storage.sitem = result;
        $state.go('app.single');
      }
      if (!$rootScope.$$phase) {
        $rootScope.$apply();
      }
    });
    $rootScope.$broadcast('hide:loading');
  };

    if (window.cordova) {
      if (ionic.Platform.isAndroid()) {
        //FCMPlugin.getToken( successCallback(token), errorCallback(err) );
        //Keep in mind the function will return null if the token has not been established yet.
        FCMPlugin.getToken(
          function(token){
            console.log("device "+token);
            $rootScope.$storage.deviceid = token;
            if ($rootScope.$storage.user) {
              APIs.saveSubscription(token, $rootScope.$storage.user.username, "").then(function(res){
                console.log(angular.toJson(res));
              });
            } else {
              APIs.saveSubscription(token, "", "").then(function(res){
                console.log(angular.toJson(res));
              });
            }
          },
          function(err){
            console.log('error retrieving token: ' + err);
          }
        );


        //FCMPlugin.onNotification( onNotificationCallback(data), successCallback(msg), errorCallback(err) )
        //Here you define your application behaviour based on the notification data.
        FCMPlugin.onNotification(
          function(data){
            if(data.wasTapped){
              //Notification was received on device tray and tapped by the user.
              //alert( JSON.stringify(data) );
              if (data.author && data.permlink) {
                var alertPopup = $ionicPopup.alert({
                  title: data.title,
                  template: data.body + ", opening post"
                });
                alertPopup.then(function(res) {
                  console.log('Thank you for seeing alert from tray');
                  $rootScope.getContentAndOpen(data.author, data.permlink);
                  
                });
              }
            }else{
              //Notification was received in foreground. Maybe the user needs to be notified.
              //alert( JSON.stringify(data) );
              if (data.author && data.permlink) {
                $rootScope.showMessage(data.title, data.body+" "+data.permlink);
              } else {
                $rootScope.showMessage(data.title, data.body);
              }
            }
          },
          function(msg){
            console.log('onNotification callback successfully registered: ' + msg);
            //alert("msg "+JSON.stringify(msg));
          },
          function(err){
            console.log('Error registering onNotification callback: ' + err);
          }
        );  
      }
      
    }

  });
});