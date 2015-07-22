module.exports = {

    /************************************
    * JOIN USER INTO SOCKET IO
    * This function is deprecated
    *************************************/
    joinOnlineRoom: function ( req, res )
    {   
        //Update cnt to client via socket io
        var socket = req.socket;
        var io = sails.io;
        // socket.join('onlineRoom');
        // socket.broadcast.to('onlineRoom').emit('newUserOnline', { newOnlineUserId: req.session.user.id , newOnlineUserName : req.session.user.name });
        
    }
    
};