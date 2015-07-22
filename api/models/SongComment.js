/**
 * SongComment
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

	attributes: {
        
        songId : {
        	type : 'string',
         	required : true,
         	index : true
        },

        content: {
	     	type : 'string',
         	required : true,
         	index : true
	    },

	    by: {
	    	type : 'json',  //{ userId, username }
	    	required : true,
         	index : true	
	    },

	    like: {
	    	type : 'integer'
	    }
    }
};