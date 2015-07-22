/**
 * Local environment settings
 *
 * While you're developing your app, this config file should include
 * any settings specifically for your development computer (db passwords, etc.)
 * When you're ready to deploy your app in production, you can use this file
 * for configuration options on the server where it will be deployed.
 *
 *
 * PLEASE NOTE: 
 *		This file is included in your .gitignore, so if you're using git 
 *		as a version control solution for your Sails app, keep in mind that
 *		this file won't be committed to your repository!
 *
 *		Good news is, that means you can specify configuration for your local
 *		machine in this file without inadvertently committing personal information
 *		(like database passwords) to the repo.  Plus, this prevents other members
 *		of your team from commiting their local configuration changes on top of yours.
 *
 *
 * For more information, check out:
 * http://sailsjs.org/#documentation
 */
var Dropbox = require("dropbox");
var fs = require('fs');
module.exports = {


  // The `port` setting determines which TCP port your app will be deployed on
  // Ports are a transport-layer concept designed to allow many different
  // networking applications run at the same time on a single computer.
  // More about ports: http://en.wikipedia.org/wiki/Port_(computer_networking)
  // 
  // By default, if it's set, Sails uses the `PORT` environment variable.
  // Otherwise it falls back to port 1337.
  //
  // In production, you'll probably want to change this setting 
  // to 80 (http://) or 443 (https://) if you have an SSL certificate

  //port: process.env.PORT || 1338,
  port: process.env.PORT || 1337,



  // The runtime "environment" of your Sails app is either 'development' or 'production'.
  //
  // In development, your Sails app will go out of its way to help you
  // (for instance you will receive more descriptive error and debugging output)
  //
  // In production, Sails configures itself (and its dependencies) to optimize performance.
  // You should always put your app in production mode before you deploy it to a server-
  // This helps ensure that your Sails app remains stable, performant, and scalable.
  // 
  // By default, Sails sets its environment using the `NODE_ENV` environment variable.
  // If NODE_ENV is not set, Sails will run in the 'development' environment.

  environment: process.env.NODE_ENV || 'development',
  
  
  /*****************************************************************************
   * ALL CONFIG FOR ALICEBOX
   *
   ****************************************************************************/
  AliceBox : {
    //PROJECT INFO
    PROJECT_NAME: 'AliceBox',
    AUTHOR: 'NamVu',
    SERVER_HOST : {
      NAME : "alicebox.mobi",
      //IP : 'http://54.213.237.201:1338'
      //IP : 'https://192.168.0.13:1337'
      //IP : 'https://10.10.7.122:1337'
      IP : 'https://alicebox.mobi'
    },
    
    //DROPBOX
    DROPBOX_KEY : 'h6zidp1y35hwif0',
    DROPBOX_SECRET : 'gnmor3foz0vp7t8',
    DROPBOX_AUTH_DRIVER : new Dropbox.AuthDriver.NodeServer(8191)
    
  },
          
  express: { serverOptions : {
    key: fs.readFileSync('my-private-decrypted.key'),
    cert: fs.readFileSync('my.alicebox.crt')
  }}
  
  
};
