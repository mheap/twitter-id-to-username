var async = require("async");
module.exports = function(logger, redis, twitter){

  var redisUserPrefix = "user:";

  return function checkCached(data, callback){
    // Should we bother checking Redis?
    if (redis){
      // Look these ID's up from Redis, 5 at a time
      async.mapLimit(data, 5, function(item, done){
        redis.get(redisUserPrefix + item, function(err, reply) {
          if (err){
            return callback(err, null);
          }

          if (reply){
            return done(err, {"id": item, "username": reply});
          }

          return done(err, {"id": item});
        });
      }, function(err, result){
        callback(null, result);
      });
    } else {
      // Just return the data in the new format
      var newData = [];
      for (var i in data){
        newData.push({"id": data[i]})
      }
      callback(null, newData);
    }
  }
}

