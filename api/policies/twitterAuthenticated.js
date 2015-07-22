/**
* Allow any authenticated user.
*/
var passport = require('passport');
var bcrypt = require('bcrypt');

module.exports = function(req, res, next){
   
   if (req.session.user){
    console.log("=========Authenticated Twitter Account");
    return next();
   }
   
   passport.authenticate('twitter', { successRedirect: '/',
                                    failureRedirect: '/login' } , function( err, user, info ){
                                    
   console.log("---> authenticate twitter");
   
   if (user) {
//      console.log("=====> user");
//      sails.log(user);
//      req.session.user = user;
//      return res.redirect('/home');
      
      async.waterfall([
            function(callback){
                Member.find()
                    .where( { "loginUser.id" : user.id, memberAuthenType : "twitter" } )
                    .exec( function( err, users ){
                        if( err ){ console.log(err); }
                        callback(null, users);
                 } );
            },
            function( users, callback){
                if( !users || users.length == 0 ){
                    Member.create( { name :  user.username , memberAuthenType : "twitter" , loginUser : user , themeType : "default" }, function( err , model ){
                      if( err ){ 
                          sails.log( "ERROR:" );
                          sails.log( err ); 
                      };
//                      sails.log( "---> CREATE USER SUCCESS" + model );
                      callback(null, model );
                    });
                }else{
                    callback(null, users );
                }
            }
        ], 
        function (err, user) {

            if( user instanceof Array ){
                req.session.user = user[0];
            }
            else{
                req.session.user = user;
            }
            

             // CREATE USER TOKEN FOR SECURITY
            var salt = bcrypt.genSaltSync(7);
            req.session.userToken = bcrypt.hashSync( sails.config.session.secret + req.session.user.id , salt );
            sails.log.debug( "req.session.userToken" );
            sails.log.debug( req.session.userToken );

            return res.redirect('/home');
        });
        
   }
   else{
       console.log("===redirect");
    return res.redirect('/login');
   }
   
   })(req, res, next);
};
