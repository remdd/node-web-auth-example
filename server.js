const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const sessions = require('client-sessions')
const logger = require('tracer').colorConsole()
const bcrypt = require('bcryptjs')

//  Environment config
dotenv.config({ path: '.env' })

//  Configure express
let app = express()
app.set("view engine", "pug")

//  Add express middleware
app.use(bodyParser.urlencoded({
  extended: false
}))

app.use(sessions({
  cookieName: "session",
  secret: process.env.SESSION_SECRET,
  duration: 30 * 60 * 1000          //  30 mins
}))

//  Custom middleware
//  (app.use() sets on *all* routes)
app.use((req, res, next) => {
  logger.log('...custom user middleware...')
  //  If request has no session, just continue 
  if(!(req.session && req.session.userId)) {
    logger.log(`Request has no session data`)
    return next()
  }

  //  Otherwise, retrieve user from DB and attach to req and res.locals
  User.findById(req.session.userId, (err, user) => {
    if(err) {
      logger.error(err)
      return next(err)
    }

    if(!user) {
      logger.warn(`User not found in DB`)
      return next()
    }

    //  Make user info from DB (without password!) available to route
    logger.log(`User ${user.email} added to request`)
    user.password = undefined
    req.user = user
    res.locals.user = user

    next()
  })
})

function loginRequired(req, res, next) {
  logger.log('...login required middleware...')
  if(!req.user) {
    return res.redirect('/login')
  }

  next()
}

//  Connect to DB
require('./db').start()

//  Create user model
let User = mongoose.model("User", new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}))

//  GET endpoints
app.get("/", (req, res) => {
  logger.log(`GET to /`)
  res.render("index")
})

app.get("/register", (req, res) => {
  logger.log(`GET to /register`)
  res.render("register")
})

app.get("/login", (req, res) => {
  logger.log(`GET to /login`)
  res.render("login")
})

app.get("/dashboard", loginRequired, (req, res, next) => {
  logger.log(`GET to /dashboard`)
  res.render("dashboard")
})

//  POST endpoints
app.post("/register", (req, res) => {
  logger.log(`POST to /register: ${JSON.stringify(req.body.email, null, 2)}`)

  //  Hash the password
  let hash = bcrypt.hashSync(req.body.password, process.env.BCRYPT_WORK_FACTOR)
  req.body.password = hash

  let user = new User(req.body)
  user.save((err) => {
    if(err) {
      logger.error(err)
      let error = "Something bad happened! Please try again"

      if(err.code === 11000) {
        error = "That email is already taken, please try another"
      }

      return res.render("register", { error: error })
    }

    res.redirect("/dashboard")
  })
})

app.post("/login", (req, res) => {
  logger.log(`POST to /login: ${JSON.stringify(req.body.email, null, 2)}`)

  User.findOne({ email: req.body.email }, (err, user) => {
    if(err || !user || !bcrypt.compareSync(req.body.password, user.password)) {
      return res.render("login", {
        error: "Incorrect email / password."
      })
    }

    req.session.userId = user._id
    req.session.something = 'something else!'
    res.redirect("/dashboard")
  })
})

//  Start server
app.listen(3010, () => {
  logger.info('Server started')
})
