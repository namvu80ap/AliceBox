'use strict';

/* Controllers */
/*TODO - HardCode Config : Constant para*/
var maxListSongs = 20;
var maxListPlaylist = 10;

/**
 *
 * TODO: Bug on update playlist, the current playlist not update in player
 */

var mainPageController = angular.module('mainPageController', ['uiSlider', 'ngResource', 'ui.bootstrap', 'adaptive.detection', 'ngTouch']);


mainPageController.controller('mainController', ['$rootScope' ,'$scope', '$log', '$http' ,'player', '$detection', 'aliceBootbox',
  function($rootScope, $scope, $log ,$http , player , $detection , aliceBootbox  ) {
    
    $rootScope.location = 'home';


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
        $http.post('/comment/getCommentList', { songId : Song.id , cmtPage : 1 } ).success( function( data , status, headers, config){
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
    

    /********************************************
     * DEDAULT ON PAGE_LOAD
     ********************************************/
    $scope.Search={ word : "" , permission : "world" };
    $scope.newPlaylist = { name : "" };
    /**
     * Get All Playlist when page on load
     */
    $http.post('/getPlaylist', {} ).success(function(data, status, headers, config){
        $scope.Playlists = data;
        //Find the currentPlaylist
        data.forEach( function( playlist ){ 
            if( playlist.isSelected ){
                $http.post('/Playlist/getSelectPlaylist', { playlistId : playlist.id } ).success(function(data, status, headers, config){
                    $scope.currentPlaylist = data;
                    /****INIT PLAYER*******/
                    player.init( $scope );
                });
            }
        });
    });
    
    
    $http.post('/getUserInfo', {} ).success(function(data, status, headers, config){
        $scope.User = data;
    });
   
   
    /***********************************
     * HOME PAGE FUNCTIONS
     **********************************/
    
    /**
     * Func Search Song
     */
    $scope.searchSong = function( songs ){ 

        if( $scope.Search.word.trim() != "" ){

            var searchParam = { word : $scope.Search.word, permission : $scope.Search.permission , songs : songs };
            if( searchParam.permission == 'friend' ){
                searchParam.friendList = $rootScope.userInfo.friendList;
            }
            

            $http.post('/searchSong', searchParam ).success(function(data, status, headers, config){
               $scope.SearchedSongs = data;
            });
        }
        else{
            $scope.SearchedSongs = [];
        }
    }
    
    $scope.changeSearchPermission = function( permission ){     
        $scope.Search.permission = permission;
        $scope.searchSong( [] );
    }
    
    $scope.addPlaylist = function(){
        if( $scope.Playlists.length >= maxListPlaylist ){
           aliceBootbox.dialog( "Warning, Can not add more than " + maxListPlaylist + " playlists!!",
                                "Have too much playlist." );
           return;
        }
        bootbox.prompt("Playlist's name : ", function(result) {                
            if( result != null && result.trim() != "" ){
              $http.post('/addPlaylist', { playlistName : result } ).success(function(data, status, headers, config){
                 $scope.Playlists = data;
              });
            }
        });
    }
    
    $scope.changeSelectPlaylist = function( changedPlaylistId ){
        if( changedPlaylistId != $scope.currentPlaylist.id ){
            $http.post('/changeSelectPlaylist', { playlistId : $scope.currentPlaylist.id , changedPlaylistId : changedPlaylistId } ).success(function(data, status, headers, config){
                   $scope.currentPlaylist = data;
                   player.updatePlaylist( data );
            });
        }
    };
    
    $scope.selectPlaylist = function( playlist ){
        $scope.currentPlayList = playlist ;
    };
    
    $scope.addSongsToPlaylist = function( songsToPlayList ){
        //Check number of song
        if($scope.currentPlaylist && $scope.currentPlaylist.songs.length >= maxListSongs ){
           aliceBootbox.dialog( "Warning, Can not add more than " + maxListSongs + " songs!!" 
                                , "Have too much song in this playlist." );           
           return;
        }
        
        $('#loading_modal').modal('show');
        $http.post('/addSongsToPlaylist', { songsToPlayList : songsToPlayList, playlistId : $scope.currentPlaylist.id  } )
             .success(function(data, status, headers, config){
                    $scope.currentPlaylist = data;
                    player.init( $scope );
                    $('#loading_modal').modal('hide');
            $http.post('/songLifeInfo/updateAddCnt',{ songId : songsToPlayList.id }).success( function( data, status, headers, config ){

            } );
        });
    };
    
    $scope.removeASongFromPlaylist = function( songId , index ){
        $('#loading_modal').modal('show');
        $http.post('/removeASongFromPlaylist', { songId : songId , playlistId : $scope.currentPlaylist.id } )
             .success(function(data, status, headers, config){
                    $scope.currentPlaylist = data;
                    
                    player.currentScope = $scope;
                    player.playlist = $scope.currentPlaylist;
                    //Default currentSong is first in the list;
                    if( player.currentSongIndex > index && player.currentSongIndex > 0 ){
                            player.currentSongIndex--;
                            player.currentSong = player.playlist.songs[ player.currentSongIndex ];
                    }
                    
                    $('#loading_modal').modal('hide');
        });
    };
    
    $scope.updatePlayMethod = function( playingMethod ){
        if( playingMethod !== $scope.currentPlaylist.playingMethod ){
            $http.post('/updatePlayingMethod', { playingMethod : playingMethod , playlistId : $scope.currentPlaylist.id } )
                 .success(function(data, status, headers, config){
                        player.updatePlaylist( data );
            });
        }
    }
    
    /********************************************
     * PLAYER CONTROL
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
        if( player.currentScope && player.currentScope.progress > 0 ){
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
    
}]);

