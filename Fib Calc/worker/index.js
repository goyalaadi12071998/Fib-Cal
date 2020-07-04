const keys = require('./keys');
const redis = require('redis');

const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
});

const sub = redisClient.duplicate();

function fib(index) {
    if(index < 2){
        return 1;
    }
    return fib(index-1)+fib(index-2);
}

sub.on('message',async function(channel,message){
    redisClient.hset('values',message,fib(parseInt(message)));
});

sub.subscribe('insert');

//Because of slow solution it gives a better reason to use redis to make the application complex