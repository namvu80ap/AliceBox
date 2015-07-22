/**
 * Friend
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

	attributes: {
        
        friendIds : {
        	type : 'array', //( [ id1 , id2 ])
         	required : true,
         	index : true
        },

        accepted: {
	     	type : 'string', // W:waitting , A:accept, R: refuse
         	required : true,
         	index : true
	    },

	    requestId: {
	    	type : 'string',
         	required : true,
         	index : true
	    },

        newMsgCnt : {
        	type : 'json', //{ userId : id1 , cnt : 1 }
            required : true,
            index : true
        }
    }
};