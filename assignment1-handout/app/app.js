require('dotenv').config();
const express = require('express');
const config = require('./config/config');
const compression = require ('compression');
const helmet = require('helmet');
const https= require("https");
const fs = require('fs')




const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const MongoStore = require('connect-mongo');
const mongoSanitize = require('express-mongo-sanitize');

const Redis = require('ioredis');
const connectRedis = require('connect-redis');

const redisStore = connectRedis(session);
const redisClient = new Redis("redis://assignment1-cluster.s0uqnp.ng.0001.usw2.cache.amazonaws.com:6379")/*({
	socket: {
		port: 6379,
		host: "redis://assignment1-cluster.s0uqnp.ng.0001.usw2.cache.amazonaws.com"
	}
})*/;

const User = require("./models/user");

const userRouter = require('./routes/user.routes');
const postRouter = require('./routes/post.routes');


const app = express();

app.set('view engine', 'ejs');
app.use(helmet());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(compression());
app.use(mongoSanitize());
app.use(express.static('public'));

  
app.set('trust proxy', 1); // trust first proxy

const port = config.get('port') || 443;
const blogDB = config.get('db.name')

const blog_db_url =
	'mongodb://' + config.get('db.db_url') +
	'?retryWrites=true&w=majority';

const dbConnection = mongoose.connect(blog_db_url, (err) => {
  if(err){
    console.log(err)
  }
});

app.use(
	session({
		secret: 'testsecret',
		resave: false,
    		store: new redisStore({client: redisClient}),
		saveUninitialized: false,
		cookie: { secure: 'auto' }
	})
);



app.use(passport.initialize());
app.use(passport.session());

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
	done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	User.findById(id, function(err, user) {
		done(err, user);
	});
});

app.use(function(req, res, next) {
	res.locals.isAuthenticated=req.isAuthenticated();
	next();
});

app.use('/user', userRouter);

app.use('/post', postRouter);

app.all('*', function(req, res) {
  res.redirect("/post/about");
});

const server = https.createServer({
	key: fs.readFileSync('example.key'),
	cert: fs.readFileSync('example.crt')
}, app).listen(port,() => {
console.log('Listening ...Server started on port ' + port);
})

module.exports = app;
