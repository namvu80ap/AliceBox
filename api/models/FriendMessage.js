/**
 * FriendMessage
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    attributes: {

        friendId : {
                type : 'string', // ObjectId of Friend Collection
                required : true,
                index : true
        },

        content: {
                type : 'string',
                required : true,
                index : true
        },

        sentBy: {
                type : 'string',
                required : true,
                index : true
        },

        del : {
                type : 'array', //( [ id1 , id2 ])
                index : true
        }
    }
};