var express = require('express'),
   http = require('http'),
   bodyParser = require('body-parser'),
   cookieParser = require('cookie-parser'),
   fs = require('fs'),
   path = require('path'),
   _ = require('underscore-node'),
   cons = require('consolidate'),
   Config = require('./config/config'),
   root = fs.realpathSync('.'),
   app = express();
require('./models');
require('./lib/database');
require('./lib/logger').Logger;
const ProductController = require('./controllers/ProductController');

// //configuring vendor based middlewares
// app.use('/views', express.static(__dirname + '/views/'));
// app.use('/assets', express.static(__dirname + '/assets/'));
// app.use('/styles', express.static(__dirname + '/release/styles/'));
// app.use('/fonts', express.static(__dirname + '/release/fonts/'));
// app.use('/maps', express.static(__dirname + '/release/maps/'));
// app.use('/node_modules', express.static(__dirname + '/node_modules/'));
// app.use('/bower_components', express.static(__dirname + '/bower_components/')); //handling the statics - assets (js, css, images)
// app.use('/scripts', express.static(__dirname + '/release/scripts/'));
// app.use('/src', express.static(__dirname + '/src/'));
// app.use('/lib', express.static(__dirname + '/lib/'));

app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({
   extended: false
}));

app.all('*', function (req, res, next) {
   res.header("Access-Control-Allow-Origin", "*");
   res.header('Access-Control-Allow-Headers', 'Content-Type,X-Requested-With');
   res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
   next();
});

//rendering engine
app.set('views', './');
app.engine('html', cons.underscore);
app.set('view engine', 'html');
require('./routes')(app);

app.get('/add', function (req, res) {
   res.sendFile(path.join(root, 'views/product/add.html'));
});

app.get('/platform/*', function (req, res) {
   res.sendFile(path.join(root, 'views/home.html'));
});

//SERVER LISTENING
var port = Config.server.port || 3003;
var server = app.listen(port, function () {
   var host = server.address().address;
   var port = server.address().port;     //Route to Frontend to make socket connection
   console.log('Node server running at http://%s:%s. API in use: %s', host, port, app.get('env'));
});


