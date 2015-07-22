module.exports = {

    addComment : function ( req, res )
    {
        //Update cnt to client via socket io
        var socket = req.socket;
        var io = sails.io;

    	if( req.body.content && req.body.content != "" ){
            //Add Song Comment
	        SongComment.create( { songId : req.body.songId , content : req.body.content , by : { userId : req.session.user.id , name : req.session.user.name }, like : 0 } )
	        		   .done( function( err, comment ){
			                if( err ){ sails.log( err ); }
			         
                            //Find and Update Song Comment Cnt
                            SongLifeInfo.findOne( { songId : req.body.songId } , function( err , songInfo ){
                                // sails.log.debug( songInfo );
                                if( songInfo && songInfo.songId != '' ){

                                    if( !songInfo.commentCnt ){ songInfo.commentCnt = 1; }
                                    else{ songInfo.commentCnt++; }
                                    
                                    songInfo.save( function( err , obj ){ 
                                        if( err ){
                                            sails.log.debug( err );
                                        }
                                    });
                                    //Send res via websocket
                                    io.sockets.emit( 'songCommentCntUpdated', { songId: songInfo.songId , commentCnt : songInfo.commentCnt , newComment : comment } );

                                }else{ 
                                    
                                }
                            });
                res.json( { success : true } );
	        }); //End create
    	}
    },

    updateComment : function ( req, res )
    {
        
    },
    
    getCommentList : function ( req, res )
    {
    	// sails.log.debug( req.session.user );
        SongComment.find().where( { songId : req.body.songId } )
                          .sort( { createdAt: 'desc' } )
                          .paginate( { page : req.body.cmtPage , limit : 10 } ) //TODO - Hardcode 10 ( maybe make a config param )
                          .exec( function( err, rs ){ 
            if(err){ sails.log(err); }
            //revert list
            rs.reverse();
			res.json( rs );
        });//End Find
    }
    
};