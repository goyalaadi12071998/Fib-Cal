const keys = require('./keys');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const { Pool } = require('pg');
const pgClient = new Pool({
    user: keys.pgUser,
    host: keys.pgHost,
    database: keys.pgDatabase,
    password: keys.pgPassword,
    port: keys.pgPort
});

pgClient.on('error',async function(){
    console.log('Lost PG Connection');
});

pgClient.query('CREATE TABLE IF NOT EXIST values(number INT)')
        .catch(err=>console.log(err));

const redis = require('redis');
const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
});

const redisPublisher = redisClient.duplicate();

app.get('/',async function(req,res){
    res.send('HI');
});

app.get('/values/all',async function(req,res){
    const values = await pgClient.query('SELECT * from values');
    res.send(values.rows);
});

app.get('/values/current',async function(req,res){
    redisClient.hgetall('values',function(err,values){
        res.send(values);
    });
    //Redis does not have async support so use callbacks
});

app.post('/values',async function(req,res){
    const index = req.body.value;
    if(parseInt(index) > 40){
        return res.status(422).send('Index too high');
    }
    redisClient.hset('values',index,'Nothing Yet!');
    redisPublisher.publish('insert',index);
    pgClient.query('INSERT INTO values(number) VALUES($1)' , [index]);
    res.send({working:true});
});

app.listen(5000,function(){
    console.log('Listening');
});