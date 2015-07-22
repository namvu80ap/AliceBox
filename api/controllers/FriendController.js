module.exports = {

    friendRequest: function ( req, res )
    {
        sails.log.debug( "friendRequest" );
        sails.log.debug( req.session.user.id );
        sails.log.debug( req.body.friendId );

        if( req.body.friendId && req.body.friendId != '' && req.body.friendId != req.session.user.id ){
            Friend.findOne( { friendIds : [ req.session.user.id , req.body.friendId ] }).done( function( err , friend ){
                sails.log.debug( "friend" );
                sails.log.debug( friend );
                if( !friend ){
                    Friend.create( { friendIds : [ req.session.user.id , req.body.friendId ] , accepted : 'W' , requestId : req.session.user.id , newMsgCnt : {} }
                    ,function( err , newFriendRequest ){
                        // Responce 1/New FriendId 2/New Request to fromFriend
                        if( err ){ sails.log.debug( err ) }

                        newFriendRequest.friendInfo = { friendId : req.session.user.id , name : req.session.user.name };
                        //Notify friend
                        var io = sails.io;
                        OnlineUser.findOne( { userId : req.body.friendId } , function( err, onlineFriend ){
                            // sails.log.debug("newFriendRequest");
                            // sails.log.debug(newFriendRequest);
                            if( onlineFriend ){
                                io.sockets.socket( onlineFriend.socketId ).emit( "newFriendRequest" , newFriendRequest );
                            }
                        });
                        res.json( { newFriendRequest :  newFriendRequest } );
                    });
                }
            });
        }
    },

    acceptRequest: function ( req, res )
    {
        if( req.body.friendRequestId && req.body.friendRequestId != '' ){
            Friend.findOne( { id : req.body.friendRequestId , accepted : 'W' }).done( function( err , friend ){
                friend.accepted = 'A';
                friend.save( function(err ){
                    if( err ) sails.log.debug( err );
                });

                Member.findOne( { id : req.session.user.id } , function( err , member ){
                    friend.friendInfo = { friendId : member.id , name : member.name };
                    //Say to online friend eccepted
                    var io = sails.io;
                    //SEND TO FRIEND
                    OnlineUser.findOne( { userId : friend.requestId } , function( err, onlineFriend ){
                        if( onlineFriend ){
                                io.sockets.socket( onlineFriend.socketId ).emit( "newFriendAccepted" , friend );
                        }
                    });
                });

                //SEND TO ME
                res.json( friend );
            });
        }
    },

    refuseRequest: function ( req, res )
    {
        if( req.body.friendRequestId && req.body.friendRequestId != '' ){
            Friend.findOne( { id : req.body.friendRequestId , accepted : 'R' }).done( function( err , friend ){
                friend.accepted = 'A';
                friend.save( function(err){
                    if( err ) sails.log.debug( err );
                });
                // Responce
            });
        }
    },


    friendList: function ( req, res )
    {
        Friend.find().where ( { friendIds : req.session.user.id , 
                                // or : [ { accepted : 'W' , requestId : { '!' : req.session.user.id } } , {  accepted : 'A' }  ] } )
                                or : [ { accepted : 'W' } , {  accepted : 'A' }  ] } )
                    .exec( function( err , friendList ){
            
            if( err ) sails.log.debug( err );
            
            /***** TODO ************************************
            * Security PROBLEM
            * Find solution for not return the friendId list
            ***********************************************/
            var friendIdList = [];
            for( var i = 0 ; i < friendList.length ; i++){
                if( friendList[i].friendIds[0] != req.session.user.id ){
                    friendIdList.push( friendList[i].friendIds[0] );
                }else{
                    friendIdList.push( friendList[i].friendIds[1] );
                }
            }
            //TO DO - Refactory the dirty code below
            Member.find( { id : friendIdList } , function( err , members ){
                OnlineUser.find( { userId : friendIdList } , function( err, onlineFriends ){

                    for( var i = 0; i < members.length ; i++ ){
                        for( var j = 0 ; j < friendList.length ; j++){
                            if( friendList[j].friendIds[0] == members[i].id || friendList[j].friendIds[1] == members[i].id ){
                                friendList[j].friendInfo = { friendId : members[i].id , name : members[i].name };
                                break;
                            }
                        }
                    }

                    var onlineFriendIds = [];
                    for (var i = onlineFriends.length - 1; i >= 0; i--) {
                        onlineFriendIds.push( onlineFriends[i].userId );
                    };

                    // sails.log.debug( "friendList--------" );
                    // sails.log.debug( friendList );
                    res.json( { friendList : friendList , onlineFriendIds : onlineFriendIds });
                });
            });
            
        });
    },

    /*************************************************************
    * FUNCTIONs FROM FRIEND MESSAGE
    *
    **************************************************************/
    sendFriendMsg: function ( req , res )
    {
        if( req.body.content && req.body.content.trim() != '' 
            && req.body.friendId && req.body.friendId != '' ){
            FriendMessage.create( { friendId : req.body.friendId ,  content : req.body.content , sentBy : req.session.user.id  , del : [] } 
            , function( err , friendMessage ){


                Friend.findOne( { id : req.body.friendId }).done( function( err , friend ){
                    if( !friend.newMsgCnt.userId || friend.newMsgCnt.userId != req.session.user.id ){
                        if( !friend.newMsgCnt.userId ){ 
                            friend.newMsgCnt.userId = req.body.sendTo;
                        }
                        friend.newMsgCnt.cnt = ( !friend.newMsgCnt.cnt ) ? 1 : friend.newMsgCnt.cnt + 1 ;
                        friend.save( function( error ){ 
                            if( error ){ sails.log.debug( error ); }
                        });
                    };
                });
                //SEND TO USER VIA SOCKET
                var io = sails.io;
                OnlineUser.findOne( { userId : req.body.sendTo } , function( err, onlineFriend ){
                    if( onlineFriend ){
                            io.sockets.socket( onlineFriend.socketId ).emit( "newFriendMessage" , friendMessage );
                    }
                });

                res.json( friendMessage );
            });
        }
    },

    getFriendMsgList: function ( req , res )
    {
        if( req.body.friendId && req.body.friendId != '' ){
            //Update newMsgCnt
            Friend.findOne( { id : req.body.friendId }).done( function( err , friend ){
                if( friend.newMsgCnt.userId == req.session.user.id ){
                    friend.newMsgCnt = {};
                    friend.save( function( error ){ 
                        if( error ){ sails.log.debug(error); }
                    });
                };
            });
            FriendMessage.find( { friendId : req.body.friendId , del : { '!' : req.session.user.id } } )
                         .sort( { createdAt : 'desc' } )
                         .paginate( { page : req.body.msgPage , limit : 10 } ) //TODO - Hardcode 10 ( maybe make a config param )
                         .exec( function( err , friendMsgList ){
                
                //revert list
                friendMsgList.reverse();
                res.json( friendMsgList );
            });
        }
    }
};


