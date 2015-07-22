'use strict';

/* App Module */

var aliceBoxApp = angular.module('aliceBoxApp', [
  'ngRoute', 'localization', 'ngSanitize', 'ui.bootstrap', 'angularMoment',
  'mainPageController','flowUploadPageController','myAllSongsController' , 'myPlaylistController' , 
  'myAlbumController' , 'myArtistController' ,  'myProfileController'
]).run( function( $rootScope, $location, $http ,$window , localize ) {

    $rootScope.location = '';
    $rootScope.unreadCnt = 0 ;

    /************************************
    * COMMON SOCKET IO HANDER
    ************************************/
    var socket = io.connect();
    
    
    socket.on('newFriendRequest', function newUserOnline( res ) {
        if( res.friendIds[0] == $rootScope.userInfo.id || res.friendIds[1] == $rootScope.userInfo.id ){
          console.log(' newFriendRequest ', res );
          if( !$rootScope.userInfo.friendListData ){ $rootScope.userInfo.friendListData = []; }
          if( !$rootScope.userInfo.onlineFriendIds ){ $rootScope.userInfo.onlineFriendIds = []; }
          if( !$rootScope.userInfo.friendList ){ $rootScope.userInfo.friendList = []; }
          if( !$rootScope.userInfo.newFriendReq ){ $rootScope.userInfo.newFriendReq = 0; }
          
          $rootScope.userInfo.friendListData.push( res ) ;
          // console.log(' rootScope.userInfo.friendListData ', $rootScope.userInfo.friendListData );
          $rootScope.userInfo.onlineFriendIds.push( res.requestId ) ;
          $rootScope.userInfo.friendList.push( res.requestId ) ;
          $rootScope.userInfo.newFriendReq++;
          $rootScope.$apply();
        }
    });

    socket.on('newFriendAccepted', function newUserOnline( friend ) {
        if( friend.friendIds[0] == $rootScope.userInfo.id || friend.friendIds[1] == $rootScope.userInfo.id ){
          if( !$rootScope.userInfo.friendListData ){ $rootScope.userInfo.friendListData = []; }
          if( !$rootScope.userInfo.onlineFriendIds ){ $rootScope.userInfo.onlineFriendIds = []; }
          if( !$rootScope.userInfo.friendList ){ $rootScope.userInfo.friendList = []; }
          if( !$rootScope.userInfo.newFriendReq ){ $rootScope.userInfo.newFriendReq = 0; }
          
          $rootScope.userInfo.friendListData.push( friend ) ;
          console.log(' rootScope.userInfo.friendListData ', $rootScope.userInfo.friendListData );
          $rootScope.userInfo.onlineFriendIds.push( friend.friendInfo.friendId ) ;
          $rootScope.userInfo.friendList.push( friend.friendInfo.friendId ) ;
          $rootScope.$apply();
        }
    });

    socket.on('newOnlineFriend', function newUserOnline( res ) {
      if( $rootScope.userInfo.onlineFriendIds.indexOf( res.userId ) < 0 ){
        $rootScope.userInfo.onlineFriendIds.push( res.userId );
        $rootScope.$apply();
      }
    });

    socket.on('userGetOffline', function newUserOnline( res ) {
      var index = $rootScope.userInfo.onlineFriendIds.indexOf( res.userId );
      if( index >= 0 ){
        $rootScope.userInfo.onlineFriendIds.splice( index , 1 );
        $rootScope.$apply();
      }
    });

    socket.on('newFriendMessage', function newUserOnline( res ) {
      if( res.sentBy && $rootScope.userInfo.friendList.indexOf( res.sentBy ) >= 0 ){
        $rootScope.userInfo.newMsgCnt++;
        for (var i = 0; i < $rootScope.userInfo.friendListData.length; i++) {
            if( $rootScope.userInfo.friendListData[i].id == res.friendId ){

              if( !$rootScope.userInfo.friendListData[i].friendMsgList ){
                $rootScope.userInfo.friendListData[i].friendMsgList = [];
              }

              //Cnt up new msg
              $rootScope.userInfo.friendListData[i].newMsgCnt.userId =  $rootScope.userInfo.id;
              if( !$rootScope.userInfo.friendListData[i].newMsgCnt.cnt ){
                $rootScope.userInfo.friendListData[i].newMsgCnt.cnt = 0;
              }
              $rootScope.userInfo.friendListData[i].newMsgCnt.cnt++;

              $rootScope.userInfo.friendListData[i].friendMsgList.push( res );
              
              console.log( $rootScope.userInfo.friendListData[i].newMsgCnt.cnt );
              $rootScope.$apply();
              
              break;
            }
         }; 
      }
    });

    /******************************* END SOCKET HANDLE *******************************/

    $http.post('/getUserInfo', {} ).success(function( user , status, headers, config){

        /*********** MASTER USER_INFO *************/
        $rootScope.userInfo = user;
        // socket.post('/socketio/joinOnlineRoom', { user : user}, function (response) {
        // });
        
        /***** GET FRIENDLIST **********/
        $http.post('/friend/friendList', {} ).success( function( data , status, headers, config){
            //PREPARE COMMON USERINFO

            $rootScope.userInfo.friendListData = data.friendList ;            
            $rootScope.userInfo.onlineFriendIds = data.onlineFriendIds ;
            $rootScope.userInfo.friendList = [];
            $rootScope.userInfo.newFriendReq = 0;
            $rootScope.userInfo.newMsgCnt = 0;

            //Check friend list
            for( var i = 0 ; i < data.friendList.length ; i++){
                //FriendIdList
                if( data.friendList[i].friendIds[0] != $rootScope.userInfo.id ){
                    $rootScope.userInfo.friendList.push( data.friendList[i].friendIds[0] );
                }else{
                    $rootScope.userInfo.friendList.push( data.friendList[i].friendIds[1] );
                }
                //New req
                if( data.friendList[i].accepted == 'W' && data.friendList[i].requestId != $rootScope.userInfo.id ){
                    $rootScope.userInfo.newFriendReq++;
                }

                if( data.friendList[i].newMsgCnt && data.friendList[i].newMsgCnt.userId == $rootScope.userInfo.id ){
                  $rootScope.userInfo.newMsgCnt += data.friendList[i].newMsgCnt.cnt;
                }

            }

        });

        //Set last time read message
        if( !$rootScope.userInfo.readMessageTime ){
          var yesterday = new Date();
          $rootScope.showWelcome = true;
          $rootScope.readMessageTime = yesterday.setDate( yesterday.getDate() - 365 );
        }
        else{
          $rootScope.readMessageTime = new Date( $rootScope.userInfo.readMessageTime );
        }

        //SET LOCALE
        if( user.myLocale ){
            localize.setLanguage( user.myLocale );
        }
        //SET THEME
        switch ( $rootScope.userInfo.themeType ){
            case "default":
                $rootScope.themes = 'css/themes.css';
                break;
            case "amethyst":
                $rootScope.themes = 'css/themes/amethyst.css';
                break;
            case "dragon":
                $rootScope.themes = 'css/themes/dragon.css';
                break;
            case "emerald":
                $rootScope.themes = 'css/themes/emerald.css';
                break;
            case "grass":
                $rootScope.themes = 'css/themes/grass.css';
                break;
            case "river":
                $rootScope.themes = 'css/themes/river.css';
                break;
        }
        
    });

    $http.post('/systemMessage/dailySystemMessage', {} ).success(function( msgs , status, headers, config){
        $rootScope.sysemMessage = msgs; 
        msgs.forEach( function(item) {
          var dateInt =  new Date(item.updatedAt);
          if( $rootScope.readMessageTime < dateInt ){
            $rootScope.unreadCnt++;
          }
        });
    });

    $http.post('/systemMessage/dailyNotifyMessage', {} ).success(function( msgs , status, headers, config){
        $rootScope.notifyMessage = msgs;
        msgs.forEach( function(item) {
          var dateInt =  new Date(item.updatedAt);
          if( $rootScope.readMessageTime < dateInt ){
            $rootScope.unreadCnt++;
          }
        });
    });

    $http.post('/systemMessage/dailyAdvertiseMessage', {} ).success(function( msgs , status, headers, config){
        $rootScope.advertiseMsg = msgs;
    });


    /**************************************************************
    * Commond Public Functions in Root Scope
    * 
    *
    ***************************************************************/

    $rootScope.mstUpdateTheme = function( themesName ){
        $http.post('/updateThemes', { themesName : themesName } ).success(function( user , status, headers, config){
            $rootScope.userInfo = user;
            $window.location.reload();
        });
    };
    
    /**** LANGUAGE ******/
    $rootScope.setLanguage = function( language ) {
        localize.setLanguage( language );
        $http.post('/updateLocale', { myLocale : language } ).success(function( user , status, headers, config){
            $rootScope.userInfo = user;
        });
    };
    
    /***** UPDATE READMESSAGE TIME *****/
    $rootScope.updateReadMessageTime = function(){
        
        var lastMsg  = new Date( $rootScope.sysemMessage[0].updatedAt ).getTime();
        var lastNotify = new Date( $rootScope.notifyMessage[0].updatedAt ).getTime();
        var nowInt = ( lastMsg >  lastNotify ) ? lastMsg : lastNotify ;

        $http.post('/member/updateReadSystemMessage', { readMessageTime : nowInt } ).success(function( user , status, headers, config){
            $rootScope.userInfo.readMessageTime = user.readMessageTime;
            $rootScope.unreadCnt = 0;
        });
    }

    /******* OPEN ADVERTISEMENT LINK ******/
    $rootScope.openAdwindown = function( ){
        $window.open( 'https://alicebox.mobi' );
    }

    /******* HANDLE CHANGE PAGE *******/
    $rootScope.goChangePage = function( ){
        console.log( $rootScope.location );  
        switch( $rootScope.location ){
            case 'home' :
              if( angular.element('#mainController').scope() ){
                angular.element('#mainController').scope().stop();
              }
              break;
            case 'myAllSongs' :
              if( angular.element('#myAllSongsController').scope() ){
                angular.element('#myAllSongsController').scope().stop();
              }
              break;
            case 'myAlbum' :
              if( angular.element('#myAlbumController').scope() ){
                angular.element('#myAlbumController').scope().stop();
              }
              break;
            case 'myArtist' :
              if( angular.element('#myArtistController').scope() ){
                angular.element('#myArtistController').scope().stop();
              }
              break;
            case 'myPlaylist' :
              if( angular.element('#myPlaylistController').scope() ){
                angular.element('#myPlaylistController').scope().stop();
              }
              break;
        }
        
    }


    /******* HANDLE FRIENDs REQUEST and FRIENDs MESSAGE  ********/
    $rootScope.openFriendMessagePopup = function(){
      $('#modalUserMessageController').modal('show'); 
    };

    $rootScope.acceptRequest = function( friend , index ){  
      if( friend.requestId != $rootScope.userInfo.id ){
        $http.post('/friend/acceptRequest', { friendRequestId : friend.id } ).success( function( data , status, headers, config){
          //$rootScope.userInfo.friendListData.splice( index , 1 );
          $rootScope.userInfo.newFriendReq--;          
          data.friendInfo = friend.friendInfo;
          for( var i = 0 ; i < $rootScope.userInfo.friendListData.length ; i++ ){
            if( $rootScope.userInfo.friendListData[i].id == data.id ){
              $rootScope.userInfo.friendListData.splice( i , 1 );
              $rootScope.userInfo.friendListData.unshift( data ); 
              break;
            }
          }
          
          // $rootScope.userInfo.friendListData.unshift( data );
        });
      }
    }; 

    
    $rootScope.sendFriendMessage = function( friend ){
      if( friend.newContent && friend.newContent.trim() != '' ){
        friend.addingMsg = true;
        $http.post('/friend/sendFriendMsg', { friendId : friend.id , content : friend.newContent , sendTo : friend.friendInfo.friendId } ).success( function( friendMsg , status, headers, config){
          if( !friend.friendMsgList ){ friend.friendMsgList = []; }
          friend.friendMsgList.push( friendMsg );
          friend.addingMsg = false;
          friend.newContent = '';
        });
      }
    };


    $rootScope.getFriendMsgList = function( friend , isCollapse ){  
        if( friend.id && friend.id != '' && isCollapse ){
          $http.post('/friend/getFriendMsgList', { friendId : friend.id, msgPage : 1 } ).success( function( friendMsgList , status, headers, config){
            friend.friendMsgList = friendMsgList;
            if( friend.newMsgCnt.userId == $rootScope.userInfo.id ){
              if( friend.newMsgCnt.cnt > 0 ){
                $rootScope.userInfo.newMsgCnt -= friend.newMsgCnt.cnt;
              }
              friend.newMsgCnt = {};
            }
            
          });
        }
    };

    $rootScope.loadMoreFriendMsgList = function( friend ){
      friend.loadingMoreMsg = true;
      if( !friend.msgPage ){ friend.msgPage = 1; }
      friend.msgPage++;
        if( friend.id && friend.id != '' ){
          $http.post('/friend/getFriendMsgList', { friendId : friend.id, msgPage : friend.msgPage } ).success( function( friendMsgList , status, headers, config){
            var newList = friendMsgList.concat( friend.friendMsgList );
          friend.friendMsgList = newList;
            friend.loadingMoreMsg = false;
          });
        }
    };

    //Convert big number into friendly number ( ex: 1000 = 1k )
    $rootScope.convertScaleNumberStr = function( n , d ){
        var x, p;
        x = ('' + n ).length ;
        p = Math.pow;
        d = p( 10, d );
        x -= x % 3 ;
        return Math.round( n * d / p(10,x) )/d + " kMGTPE"[x/3] ;
    }

});

aliceBoxApp.config(['$routeProvider',
  function($routeProvider) {
   
    $routeProvider.
      when('/home', {
        templateUrl: '/templates/main.html',
        controller: 'mainController'
      })
      // route for the about page
      .when('/upload', {
        templateUrl : '/templates/upload.html',
        controller  : 'flowUploadController'
      })
      .when('/myAllSongs', {
        templateUrl : '/templates/allSongs.html',
        controller  : 'myAllSongsController'
      })
      .when('/myPlaylist', {
        templateUrl : '/templates/myPlaylist.html',
        controller  : 'myPlaylistController'
      })
      .when('/myAlbum', {
        templateUrl : '/templates/myAlbum.html',
        controller  : 'myAlbumController'
      })
      .when('/myArtist', {
        templateUrl : '/templates/myArtist.html',
        controller  : 'myArtistController'
      })
      .when('/myProfile', {
        templateUrl : '/templates/myProfile.html',
        controller  : 'myProfileController'
      })
      .otherwise({
        redirectTo: '/home'
      });
  }]);

/***************************************
 * BOOTBOX ALERT, COMFIRM SERVICES
 ***************************************/
aliceBoxApp.factory('aliceBootbox', function() {
    var aliceBootbox = { };
  
    aliceBootbox.dialog = function( message , title ){
        bootbox.dialog({
          message: message,
          title: title,
          buttons: {
            danger: {
              label: "Close",
              className: "btn-danger",
              callback: function() {
                //Do something
              }
            }
          }
        });
    }
    
return aliceBootbox;
});

/*********************************************************
 * THE AUDIO PLAYER FOR MAIN PAGE
 * 
 * 1/The player need scope to display to the view
 ********************************************************/

aliceBoxApp.factory('audio', ['$document', function($document) {
  var audio = $document[0].createElement('audio');
  return audio;
}]);

aliceBoxApp.factory('player', ['audio' , '$rootScope', '$http' , function(audio , $rootScope , $http ) {
    var player = {
        playing: false,
        current: null,
        currentSong: null,
        currentSongIndex: 0,
        ready: false,
        progress:0,
        duration:0,
        
        playlist: null,
        currentScope: null,

        init: function( scope ) {
            
            player.currentScope = scope;
            player.playlist = scope.currentPlaylist;
            
            //Default currentSong is first in the list;
            if( player.playlist && player.playlist.songs.length > 0 ){
                player.currentSong = player.playlist.songs[0];
                player.currentSongIndex = 0;
            }

        },

        reset: function(){
          audio.src = {};
          player.playing = false;
          player.ready = false;
          player.current = null;
        },
        
        updatePlaylist: function( playlist ){
            player.playlist = playlist;
            player.currentScope.currentPlaylist = playlist;
        },
        
        play: function() {
            if( !audio.src || audio.src != player.currentSong.url){
                audio.src = player.currentSong.url ;
            }
            
            audio.play(); // Start playback of the url
            player.playing = true;

            // var socket = io.connect();
            // socket.post('/testsocket',{ name: 'foo'}, function (response) {
            //   // create a new user
            // });

        },

        stop: function() {
            if (player.playing) {
                audio.pause(); // stop playback
                audio.currentTime = 0;
                // Clear the state of the player
                player.playing = false;
                player.ready = false;
                //audio.src = player.currentSong.url;
                player.current = null;
            }
        },

        pause: function() {
            if (player.playing) {
                audio.pause(); // stop playback
                // Clear the state of the player
                player.ready = player.playing = false;
                player.current = null;
            }
        },

        playNext: function(){
           if( player.playlist.songs[ player.currentSongIndex +1 ] ){
               var newCurrentSongIndex = player.currentSongIndex +1 ;
               player.currentSong = player.playlist.songs[ newCurrentSongIndex ];
               player.currentSongIndex = newCurrentSongIndex;
               player.play();
           }
           else{
               player.stop();
           }
        },

        playPrev: function(){
           if( player.playlist.songs[ player.currentSongIndex - 1 ] ){
               var newCurrentSongIndex = player.currentSongIndex - 1 ;
               player.currentSong = player.playlist.songs[ newCurrentSongIndex ];
               player.currentSongIndex = newCurrentSongIndex;
               player.play();
           }
           else{
               player.stop();
               if( player.playing ){
                   player.play();
               }
               
           }
        },
        
        playAt: function( index ){
            player.currentSong = player.playlist.songs[ index ];
            player.currentSongIndex = index;
            player.playing = true;
            player.play();
        },

        currentTime: function() {
            player.currentScope.currentSong = player.currentSong;
            player.currentScope.durationMinutes = player.currentScope.convertToMinute( player.currentScope.duration );
            if( audio.currentTime && audio.currentTime > 0 ){
                return audio.currentTime;
            }else{
                return 0 ;
            }
        },
        currentDuration: function() {
            if( audio.duration && audio.duration > 0){
              return parseInt(audio.duration);  
            }else{
              return 0;
            }
        },
        
        buffered: function(){
            if( audio.buffered.length > 0 && audio.buffered.end(0) && audio.duration >= 0 ){
                return parseInt( (audio.buffered.end(0)/audio.duration) * 100 );
            }
            return 0;
        },

        updateSongListenCnt : function(){
            $http.post('/songLifeInfo/updateListenCnt',{ songId : player.currentSong.id }).success( function( data, status, headers, config ){
            } );
        }

    };

    audio.addEventListener('timeupdate', function() {
        $rootScope.$apply(function() {            
            player.currentScope.progress = player.currentTime();
            // console.log( "==> : " + player.currentDuration() );
            if( player.currentScope.duration <= 0 ){
                player.currentScope.duration = player.currentDuration();
                player.currentScope.currentSong = player.currentSong;
                // player.currentScope.durationMinutes = player.currentScope.convertToMinute( player.currentScope.duration );
            }
        });
    });
    
    audio.addEventListener('loadstart', function() {
        $rootScope.$apply( function(){
            player.currentScope.wait( true );
        }
        );
    });
    
    audio.addEventListener('progress', function() {
        $rootScope.$apply( function(){
            player.currentScope.buffered = player.buffered();
        }
        );
    });
    
    //Update the songs Listen Count when play
    audio.addEventListener('play', function() {
        $rootScope.$apply( function(){
            player.updateSongListenCnt();
        });
        
    });
    
    audio.addEventListener('canplay', function() {
        $rootScope.$apply( function(){
            player.currentScope.wait( false );
            player.currentScope.duration = player.currentDuration();
            player.currentScope.currentSong = player.currentSong;
            player.currentScope.durationMinutes = player.currentScope.convertToMinute( player.currentScope.duration );
        });

        // $http.post('/songLifeInfo/updateAddCnt',{ songId : songsToPlayList.id }).success( function( data, status, headers, config ){

        // } );
    });
    
    audio.addEventListener('ended', function() {
        
        $rootScope.$apply(function(){ 
            switch( player.playlist.playingMethod ){
                case "arrow-right":                        
                    player.playNext();
                    break;
                case "retweet":
                    if( player.currentSongIndex + 1 == player.playlist.songs.length ){
                        player.currentSongIndex = 0;
                        player.currentSong = player.playlist.songs[0];
                        player.play();
                    }
                    else{
                        player.playNext();
                    }
                    break;
                case "random" :
                    var randomIndex = Math.floor( Math.random() * player.playlist.songs.length );
                    player.currentSongIndex = randomIndex;
                    player.currentSong = player.playlist.songs[ randomIndex ];
                    player.play();
                    break;
                case "repeat" :
                    player.play();
                    break;
            }
                
        });
    });

    //ERROR Handler
    audio.addEventListener('error', function(e) {
         switch (e.target.error.code) {
            case e.target.error.MEDIA_ERR_ABORTED:
              player.currentScope.error( "You aborted the audio playback." );
              player.currentScope.wait( false );
              player.currentScope.playing = false;
              player.currentScope.$apply();
              break;
            case e.target.error.MEDIA_ERR_NETWORK:
              player.currentScope.error( "A network error caused the audio download to fail." );
              player.currentScope.wait( false );
              player.currentScope.playing = false;
              player.currentScope.$apply();
              break;
            case e.target.error.MEDIA_ERR_DECODE:
              player.currentScope.error( "The audio playback was aborted due to a corruption problem or because your browser did not support." );
              player.currentScope.wait( false );
              player.currentScope.playing = false;
              player.currentScope.$apply();
              break;
            case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:              
              player.currentScope.error( "Either because the server or network failed or format not support." );
              player.currentScope.wait( false );
              player.currentScope.playing = false;
              player.currentScope.$apply();
              break;
            default:
              player.currentScope.error( "An unknown error occurred." );
              player.currentScope.wait( false );
              player.currentScope.playing = false;
              player.currentScope.$apply();
              break;
         }
    });
    
    return player;
}]);


