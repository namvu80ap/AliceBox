'use strict';

var maxListSongs = 20;

/* Controllers */

/**
 *
 * TODO: Bug on update playlist, the current playlist not update in player
 */
/* App Module */

var flowUploadPageController = angular.module('flowUploadPageController', ['ngResource','angularFileUpload']);

flowUploadPageController.controller('flowUploadController', ['$rootScope', '$scope', '$location' ,'$log', '$http' , '$fileUploader',
  function($rootScope, $scope , $location , $log ,$http , $fileUploader ) {
    
    $rootScope.location = 'upload';
    
    //CHECK HAS DROPBOX ID
    $http.post('/isHasDropboxId', {} ).success(function(data, status, headers, config){
        if( !data.isHas ){
          $location.path("/home");
          $scope.$apply();
        }
    });
    
//    $scope.test = "HELLO";
    
    $http.post('/getPlaylist', {} ).success(function(data, status, headers, config){
        $scope.playlists = data;
        data.forEach( function( playlist ){ 
            if( playlist.isSelected ){
                $scope.playlistId = [playlist.id];
            }
        });
    });
    
    
    var uploader = $scope.uploader = $fileUploader.create({
        scope: $scope,                          // to automatically update the html. Default: $rootScope
        url: 'flowUpload',
//        formData: [
//            { albumId: '',
//              shareTo: ''
//            }
//        ],
        filters: [
            function ( item ) {                    // first user filter
                console.info('filter1');
                return true;
            }
        ]
    });

    $scope.countSongs = maxListSongs - $scope.uploader.queue.length ;

    //Prepare Default Permission
    $scope.permissions = [ {name:'world', value:'World'}, 
                           {name:'friend', value:'Friend'},
                           {name:'me', value:'Private'} ];
    $scope.defaultPer = $scope.permissions[2].name;
    
    $scope.changePermission = function(){
        console.log( "============>>>>>" );
        if( $scope.defaultPer != 'me'  ){
            bootbox.dialog({
              message: "Are you sure this song belong to you and you have your full permissions to share the Song ?",
              title: "Please comfirm the Song's Lisence, if you want to share your songs !",
              buttons: {
                danger: {
                  label: "Yes, I do !!",
                  className: "btn-danger",
                  callback: function() {
                    console.log("OK");
                  }
                },
                main: {
                  label: "No, I don't .",
                  className: "btn-default",
                  callback: function() {
                    console.log("NO");
                    $scope.defaultPer = 'me';
                    $scope.$apply();
                  }
                }
              }
            }); 
        }  
    };

    // ADDING FILTERS
    
    uploader.filters.push(function (item) { // second user filter
        
        var isAccept = true;
        
        //CHECK PLAYLIST SIZE
        $scope.playlists.forEach( function( playlist ){ 
            $scope.playlistId.forEach( function( playlistId ){
                if( playlist.id === playlistId && playlist.songs.length + $scope.uploader.queue.length >= maxListSongs  ){
                    bootbox.dialog({
                        message: "Warning, Can not add more songs into playlist!!",
                        title: "Too much Songs in " + playlist.name + " .",
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
                    isAccept = false;
                }
            })        
        });
        
        var type = uploader.isHTML5 ? item.type : '/' + item.value.slice(item.value.lastIndexOf('.') + 1);
            
            /**** TODO - Hardcode special case: In Firefox ( mp3 = audio/mpeg )***/
            if( type == "audio/mpeg" ){ type = "mpeg/mp3" }

            type = '|' + type.toLowerCase().slice(type.lastIndexOf('/') + 1) + '|';

        if( isAccept ){
            isAccept = ( '|mp3|x-m4a|m4p|wma|wav|audio|'.indexOf(type) !== -1 ); /// SOME ORTHER FILES TYPE http://en.wikipedia.org/wiki/Audio_file_format
            if( !isAccept ){
                bootbox.dialog({
                    message: "Warning, Can not play this file!!",
                    title: "Not accept file.",
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
        }
        return isAccept;
    });

    // REGISTER HANDLERS
    
    
    uploader.bind('afteraddingfile', function (event, item) {
        item.formData = [{ playlist : $scope.playlistId , shareTo : $scope.defaultPer } ];
        // console.info('After adding a file', item);
    });

    uploader.bind('afteraddingall', function (event, items) {
        // console.info('After adding all files', items);
    });

    uploader.bind('beforeupload', function (event, item) {
        // console.info('Before upload', item);
    });

    uploader.bind('progress', function (event, item, progress) {
        $('#loading_modal').modal('show');
        // console.info('Progress: ' + progress, item);
    });

    uploader.bind('success', function (event, xhr, item, response) {
        // console.info('Success', xhr, item, response);
    });

    uploader.bind('cancel', function (event, xhr, item) {
        // console.info('Cancel', xhr, item);
    });

    uploader.bind('error', function (event, xhr, item, response) {
        // console.info('Error', xhr, item, response);
    });

    uploader.bind('complete', function (event, xhr, item, response) {
       // console.info('Complete', xhr, item, response);
    });

    uploader.bind('progressall', function (event, progress) {
        console.info('Total progress: ' + progress);
    });

    uploader.bind('completeall', function (event, items) {
        $('#loading_modal').modal('hide');
        bootbox.confirm("All songs uploaded to you dropbox. Thank you for using AliceBox.", function(result) {
            if( result ){
                $location.path("/home");
                $scope.$apply();
            }
        });
        console.info('Complete all', items);
    });
   
}]);

