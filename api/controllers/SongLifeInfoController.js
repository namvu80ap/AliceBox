module.exports = {

    updateListenCnt : function ( req, res )
    {
        //Update cnt to client via socket io
        var socket = req.socket;
        var io = sails.io;

        SongLifeInfo.findOne( { songId : req.body.songId } , function( err , songInfo ){
            // sails.log.debug( songInfo );
            if( songInfo && songInfo.songId != '' ){
                songInfo.listenCnt++;
                songInfo.save( function( err , obj ){ 
                    if( err ){
                        saisl.log.debug( err );
                    }
                    res.json( obj );
                });
                
                //Send res via websocket
                io.sockets.emit( 'songListenCntUpdated', { songId: songInfo.songId , listenCnt : songInfo.listenCnt } );

            }else{ 
                res.json({});
            }
        });
    },
    
    getSongLifeByListId : function ( req, res )
    {
        SongLifeInfo.find( { songId : req.body.songIds } , function( err , songInfos ){
            // sails.log.debug( songInfos );
            res.json( { songInfos : songInfos } );
        });
    },

    getSongLifeBySongId : function ( req, res )
    {
        SongLifeInfo.findOne( { songId : req.body.songId } , function( err , songInfo ){
            // sails.log.debug( songInfo );
            Song.findOne({ id : req.body.songId } , function( err , song ){
                Member.findOne( { id : song.userId } , function( err , member ){
                    songInfo.shareBy = { userId : member.id , name : member.name };
                    res.json( { songInfo : songInfo } );
                })
            });
        });
    },

    updateAddCnt : function ( req, res )
    {
        //Update cnt to client via socket io
        var socket = req.socket;
        var io = sails.io;

        SongLifeInfo.findOne( { songId : req.body.songId } ).done( function( err , songInfo ){
            // sails.log.debug( songInfo );
            if( songInfo && songInfo.songId != '' ){
                songInfo.addCnt++;
                // sails.log.debug(  "songInfo ====>");
                // sails.log.debug(  songInfo );
                songInfo.save( function( err , obj ){ 
                    if( err ){
                        saisl.log.debug( err );
                    }
                    res.json( obj );
                });

                //Send res via websocket
                io.sockets.emit( 'songAddedCntUpdated', { songId: songInfo.songId , addCnt : songInfo.addCnt } );

            }else{ 
                res.json({});
            }
        });
    }
    
};