/**
* Allow any authenticated user.
*/
// var passport = require('passport');
var bcrypt = require('bcrypt');


module.exports = function(req, res, next){
   
   if (req.session.user){

        /**************************************************************
        * HANDLE TOKEN or AUTHENTICATE the request from client
        **************************************************************/
        //sails.log.debug( "AUTHENTICATE req.session.userToken " );
        //sails.log.debug( req.session.userToken );

        var isAuthenticated = bcrypt.compareSync( sails.config.session.secret + req.session.user.id , req.session.userToken ); 
        //sails.log.debug( "isAuthenticated" );
        //sails.log.debug( isAuthenticated );
        if( !isAuthenticated ){
          delete req.session.user;
          return res.redirect('/login');
        }


        //CHECK APP CONFIG
        if( !sails.config.AliceBox.MAINTENANCE){
        	return next();	
        }
        else{
        	return res.render('maintainance');
        }
   }
   
   else{
        sails.log.debug("=====>False Authenticate");
        return res.redirect('/login');
   }
  
}
