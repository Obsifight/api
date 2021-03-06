// =======================
// INIT =================
// =======================
var pmx = require('pmx').init({
  http: true, // HTTP routes logging (default: true)
  errors: true, // Exceptions loggin (default: true)
  custom_probes: true, // Auto expose JS Loop Latency and HTTP req/s as custom metrics
  network: true, // Network monitoring at the application level
  ports: true  // Shows which ports your app is listening on (default: false)
})
pmx.http()

var express = require('express')
var app = express()

app.use(express.static('public'))

// =======================
// Sessions (optionnal) ==
// =======================
var session = require('express-session')
app.set('trust proxy', 1) // trust first proxy
var sessionHandler = session({
  secret: 'oGKdTGBHmCQgB4UNme',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
})

app.use(function(req, res, next) {
  if (req.path.indexOf('/socials/twitter') !== -1) {
    return sessionHandler(req, res, next)
  }
  next()
})

// =======================
// Body & Accept =========
// =======================
var bodyParser = require('body-parser')
app.use(bodyParser.json())

// handle accept
app.use(function (req, res, next) {
  if (!req.accepts('json')) {
    res.status(400)
    res.json({status: false, error: 'API only accept JSON.'})
    return
  }
  next()
})

// =======================
// PMX Stats =============
// =======================
var probe = pmx.probe()
// The counter will start at 0
var counter = probe.counter({
  name: 'Current req processed'
})

app.use(function (req, res, next) {
  counter.inc()
  req.on('end', function () {
    counter.dec()
  })
  next()
})

// =======================
// config ================
// =======================

var auth = require('./app/auth')
global.config = require('./app/config/global')
global.config.host = (process.env.NODE_ENV === 'production') ? 'http://api.obsifight.net' : 'http://localhost:' + config.port

// =======================
// routes ================
// =======================

// index
app.get('/', function (req, res) {
  return res.json({
    name: 'obsiapi',
    version: require('fs').readFileSync('./VERSION').toString().trim(),
    author: 'Eywek',
    environement: (process.env.NODE_ENV === 'production') ? 'production' : 'development'
  })
})

// configured
var routes = require('./app/config/routes')
for (var route in routes) {
  // get method
  if (route.split(' ').length > 1) {
    var method = route.split(' ')[0]
    var url = route.split(' ')[1]
  } else {
    var method = 'get'
    var url = route
  }
  // get controller & method
  if (typeof routes[route] === 'string') { // not protected
    var controller = routes[route].split('.')[0]
    var action = routes[route].split('.')[1]
  } else { // protected
    var controller = routes[route].function.split('.')[0]
    var action = routes[route].function.split('.')[1]

    if (routes[route].protected) {
      // init protected route
      app[method](url, auth, require('./app/controller/' + controller)[action])
      continue
    }
  }
  // init route
  app[method](url, require('./app/controller/' + controller)[action])
}

// =======================
// Database ==============
// =======================
global.db = require('./vendors/db').setConfig(require('./app/config/db'))
global.currentDB = 'web_v' + config.currentVersion

var fs = require('fs')
fs.readdir('./app/models', function (err, files) {
  if (err) return false
  files.forEach(function (file) {
    global[file.split('.js')[0]] = require('./app/models/' + file)
  })
})

// =======================
// Errors ================
// =======================
app.use(function (req, res, next) {
  res.status(404)

  // respond with json
  res.json({status: false, error: 'Method not found.'})
})

app.use(function (err, req, res, next) {
  console.error(err)
  res.status(500).json({status: false, error: 'An error has occured.'})
})

// =======================
// PMX ================
// =======================
var meter = probe.meter({
  name: 'req/min',
  samples: 1,
  timeframe: 60
})

// =======================
// Listen ================
// =======================
app.listen(config.port, function () {
  meter.mark()
  console.log('App listen on port ' + config.port)
})
