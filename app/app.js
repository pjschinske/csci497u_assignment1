require('dotenv').config();
const express = require('express');
const config = require('./config/config');
const compression = require ('compression');
const helmet = require('helmet');
const https= require("https");
const fs = require('fs');

const { Client } = require('pg');
const Redis = require('ioredis');


const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');


const User = require("./models/user");

const userRouter = require('./routes/user.routes');
const postRouter = require('./routes/post.routes');


const app = express();

app.set('view engine', 'ejs');
app.use(helmet());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(compression());
app.use(express.static('public'));

  
app.set('trust proxy', 1); // trust first proxy

const port = config.get('port') || 3000;
// const blogDB = config.get('db.name')

// const blog_db_url =
// 	config.get('db.db_url') +
// 	config.get('db.password') +
// 	config.get('db.host') +
// 	blogDB +
// 	'?retryWrites=true&w=majority';

// const dbConnection = mongoose.connect(blog_db_url, (err) => {
//   if(err){
//     console.log(err)
//   }
// });


const client = new Client({
	user: 'masterUsername',
	password: 'CSCI497U',
	host: 'assigment1-db.c1ajbx5t9ub9.us-west-2.rds.amazonaws.com',
	database: 'schinske_roundy_DB',
	port: 5432
});

client.connect((err) => {
	if(err){
		console.log(err)
	}
});

app.use(
	session({
		secret: config.get('secret'),
		resave: false,
		// store: MongoStore.create({
		// 	mongoUrl: blog_db_url,
		// 	ttl: 2 * 24 * 60 * 60
		// }),
		store: new Redis({
			port: 6379,
			host: 'schinske-roundy-elasticache.yiseuo.0001.usw2.cache.amazonaws.com'
			// username ,
			// password 
		}),
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

const server = https.createServer(/*{
	key: fs.readFileSync('server.key'),		//SSL certificate stuff would go here
	cert: fs.readFileSync('server.cert')
}, */app).listen(port,() => {
console.log('Listening ...Server started on port ' + port);
});

module.exports = app;