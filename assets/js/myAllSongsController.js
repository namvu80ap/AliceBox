'use strict';

/* Controllers */

/* App Module */

var myAllSongsController = angular.module('myAllSongsController', ['ngResource']);

myAllSongsController.controller('myAllSongsController', ['$rootScope', '$scope', '$location' ,'$log', '$http', 'player' , 'aliceBootbox', 
  function($rootScope , $scope , $location , $log ,$http , player , aliceBootbox ) {
  
    $rootScope.location = 'myAllSongs';
    $scope.permissions = [ {name:'world', value:'World'}, {name:'friend', value:'Friend'}, {name:'me', value:'Private'} ];

    /*******************************************
    * FRIENDS FUNCTIONs
    *******************************************/
    $scope.friendRequest = function( friendId ){
        $http.post('/friend/friendRequest', { friendId : friendId } ).success( function( data , status, headers, config){
            //waitting response
            $rootScope.userInfo.friendList.push( friendId );
        });
    };


    /*******************************************
    * SONG COMMENTS FUNCTIONs
    *******************************************/
    $scope.viewSongComment = function( Song ){ 
        $http.post('/comment/getCommentList', { songId : Song.id } ).success( function( data , status, headers, config){
            Song.comments = data;
        });
        Song.viewSongComment = ( Song.viewSongComment )? false : true ;
    };

    $scope.loadMoreComment = function( Song ){ 
        Song.loadingMoreCmt = true;
        if( !Song.cmtPage ){ Song.cmtPage = 1; }
        Song.cmtPage++;
        $http.post('/comment/getCommentList', { songId : Song.id , cmtPage : Song.cmtPage } ).success( function( data , status, headers, config){
            var newList = data.concat( Song.comments );
            Song.comments = newList;
            Song.loadingMoreCmt = false;
        });
    };

    $scope.isViewSongComment = function( Song ){ 
        return ( Song.viewSongComment )? false : true ;
    };

    $scope.addNewComment = function( Song ){
        if( Song.newComment && Song.newComment.trim() != "" ){
            Song.addingComment = true;
            $http.post('/comment/addComment', { songId : Song.id , content : Song.newComment.trim() } ).success( function( data , status, headers, config){
                Song.newComment = "";
                Song.addingComment = false;
            });
        }
    }

    /********************************************
    * HANDLE SOCKET IO REQ AND RES
    ********************************************/
    var socket = io.connect();
    socket.on('songListenCntUpdated', function songListenCnt( res ) {
        // console.log(' songListenCntUpdated ', res );
        if( $scope.currentPlaylist.songs && $scope.currentPlaylist.songs.length > 0 ){
            for( var i = 0 ; i < $scope.currentPlaylist.songs.length ; i++ ){
                if( $scope.currentPlaylist.songs[i].id == res.songId ){                    
                    $scope.currentPlaylist.songs[i].listenCnt = res.listenCnt ;
                    $scope.$apply();
                    break;
                }
            }
        }
    });
    socket.on('songAddedCntUpdated', function songListenCnt( res ) {
        // console.log(' songListenCntUpdated ', res );
        if( $scope.currentPlaylist.songs && $scope.currentPlaylist.songs.length > 0 ){
            for( var i = 0 ; i < $scope.currentPlaylist.songs.length ; i++ ){
                if( $scope.currentPlaylist.songs[i].id == res.songId ){                    
                    $scope.currentPlaylist.songs[i].addCnt = res.addCnt ;
                    $scope.$apply();
                    break;
                }
            }
        }
    });
    socket.on('songCommentCntUpdated', function songCommentCnt( res ) {
        console.log( res );
        if( $scope.currentPlaylist.songs && $scope.currentPlaylist.songs.length > 0 ){
            for( var i = 0 ; i < $scope.currentPlaylist.songs.length ; i++ ){
                if( $scope.currentPlaylist.songs[i].id == res.songId ){                    
                    $scope.currentPlaylist.songs[i].commentCnt = res.commentCnt ;

                    if( !$scope.currentPlaylist.songs[i].comments  ){
                        $scope.currentPlaylist.songs[i].comments = [ res.newComment ];
                    }else{
                        $scope.currentPlaylist.songs[i].comments.push( res.newComment );
                    }
                    
                    $scope.$apply();
                    break;
                }
            }
        }
    });


    /************ Default loading data ***************/
    $http.post('/getMyAllSongs', {} ).success(function(data, status, headers, config){
       $scope.currentPlaylist = {};
       $scope.currentPlaylist.songs = data;
       $scope.currentPlaylist.playingMethod = "arrow-right";
       /****INIT PLAYER*******/
       player.init( $scope );
    });

    $scope.removeMySong = function( song , index ){
        $('#loading_modal').modal('show');
        $http.post('/myAllSongs/removeMySong', { song : song } ).success(function(data, status, headers, config){
             $http.post('/getMyAllSongs', {} ).success(function(songs, status, headers, config){
                $scope.currentPlaylist.songs = songs;
                
                player.currentScope = $scope;
                player.playlist = $scope.currentPlaylist;
                //Default currentSong is first in the list;
                if( player.currentSongIndex > index && player.currentSongIndex > 0 ){
                        player.currentSongIndex--;
                        player.currentSong = player.playlist.songs[ player.currentSongIndex ];
                }

                $('#loading_modal').modal('hide');
                
             });
        });   
    }
  
  

    /******* SCOPE FUNCTIONS *********************/
    $scope.updatePlayMethod = function( playingMethod ){
        if( playingMethod !== $scope.currentPlaylist.playingMethod ){
            $scope.currentPlaylist.playingMethod = playingMethod;
        }
    }
    
    $scope.goUpdateMySong = function( song ){
        $scope.editSong = song;
        $('#updateMySong').modal('show');
    }
    
    $scope.updateMySong = function(){
        $http.post('/updateMySong', { song : $scope.editSong } ).success(function(data, status, headers, config){
             $http.post('/getMyAllSongs', {} ).success(function(songs, status, headers, config){
                $scope.currentPlaylist.songs = songs;
             });
        });
        $('#updateMySong').modal('hide');
    }
 
    /********************************************
     * MUST NEED WHEN USE PLAYER CONTROL
     ********************************************/
    $scope.play = function() {
        player.play();
        $scope.playing = player.playing;   
    };
    
    $scope.stop = function() {
        player.stop();
        $scope.playing = player.playing;
    };
 
    $scope.pause = function() {
        player.pause();
        $scope.playing = player.playing;
    };
    
    $scope.playPrev = function() {
        player.playPrev();
        $scope.playing = player.playing;
    };
    
    $scope.playNext = function() {
        player.playNext();
        $scope.playing = player.playing;
    };
    
    $scope.wait = function( wait ){
        if( wait ){
            $('#loading_modal').modal('show');
        }
        else{
            $('#loading_modal').modal('hide');
        }
    };
    
    $scope.error = function( text ){
        aliceBootbox.dialog( text , "Loading error !!" );
    }

    $scope.curentPlayingMinutes = function(){
        if( player.currentScope.progress > 0 ){
            return $scope.convertToMinute( parseInt(player.currentScope.progress) );
        }
        else{ 
            return "00:00";
        }
    };
    $scope.curentDurationMinutes = function(){
        if( player.currentDuration() > 0 ){
            return $scope.convertToMinute( player.currentDuration() );
        }
        else{ 
            return "00:00";
        }
    };
    
    $scope.convertToMinute = function( seconds ){
       if( seconds && seconds > 0 ){ 
            var minutes = Math.floor( seconds/60 );
            var leftSeconds = seconds - ( minutes * 60 );
            
            if( minutes < 10 ){ minutes = "0" + minutes.toString() }
            if( leftSeconds < 10 ){ leftSeconds = "0" + leftSeconds.toString() }

            return minutes + ":" + leftSeconds ;
        }else{
            return "00:00";
        }
    };
    
    $scope.viewSongDetails = function( Song ){
        Song.showDetails = !Song.showDetails;
        if( !Song.listenCnt ){
            $http.post('/songLifeInfo/getSongLifeBySongId', { songId : Song.id } )
                      .success(function(data, status, headers, config){
                // console.log( data.songInfo.listenCnt );
                Song.listenCnt = data.songInfo.listenCnt;
                Song.addCnt = data.songInfo.addCnt;
                Song.commentCnt = data.songInfo.commentCnt;
                Song.shareBy = data.songInfo.shareBy;
            });
        }
        return Song.showDetails;
    };
    
    $scope.isActive = function( index ){
        if( player.currentSongIndex == index ){
            return "active";
        }
    };
    
    $scope.playThisSong = function( index ){
        if( player.currentSongIndex != index ){
            player.playAt(index);
            $scope.playing = player.playing;
            $scope.progress = player.currentTime();
        }
    }
    /*********************END ADD PLAYER***************************/
 
}]);

