module.exports = {

  adapter: 'redis',

  config: {
  // port: 6379,
  // host: 'localhost',
  // password: null,
  port: 10361,
  host: 'pub-redis-10361.us-east-1-4.1.ec2.garantiadata.com',
  password: 'thanhcong',
  options: {

    // low-level configuration
    // (redis driver options)
    parser: 'hiredis',
    return_buffers: false,
    detect_buffers: false,
    socket_nodelay: true,
    no_ready_check: false,
    enable_offline_queue: true
    }
  },

  attributes: {
    socketId: {
      type: 'string',
      index : true
    },
    userId: {
      type: 'string',
      index : true
    },
    name: 'string'
  }

};