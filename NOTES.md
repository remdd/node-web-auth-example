#   Notes
- Tutorial from Randal Degges @ node.js meetup
- "Everything You Ever Wanted to Know About Web Authentication in Node"
- [https://www.youtube.com/watch?v=i7of02icPyQ&t=356s]


##  Cookies
### Setting cookies
- Cookies are just strings in HTTP request headers - nothing more!
- The spec uses the "Set-Cookie" header of the request, for eg a website might return the following to a browser after a request is made:

  ``` json
  {
    "Set-Cookie": "session=12345"
  }
  ```

- Multiple cookies are just semicolon separated, eg:

  ``` json
  {
    "Set-Cookie": "cookieA=1; cookieB=2; cookieC=3"
  }
  ```

### Reading cookies
- Following the reecipt of a cookie, the browser will supply the cookie as a "Cookie" header on future requests:

  ``` json
  {
    "User-Agent": "cURL/1.2.3",
    "Accept": "*/*",
    "Host": "localhost:3000",
    "Cookie": "session=12345"
  }
  ```


##  Sessions
"client-sessions" (npm) is one of many alternatives to "express-sessions"
Session secret is kept in env variable and needs to be super secure!

Add user ID from mongodb to session cookie when a request is authenticated (ie following successful login):
`req.session.userId = user._id`
(client-sessions gives us the req.sessions object for this purpose)


##  Passwords
Key things re password hashing:
- Hashed passwords are just plain passwords fed through a function
- The same password always generates the same hash!
- Hashes are one-way - there's no way to retrieve the original password from it
- Use `bcrypt` or `scrypt` or `argon2` - NOT `md5` `sha256`... etc
- There are lots of npm packages using bcrypt, not all created equal - specifically recommends `bcryptjs`


##  Middleware
- Can create custom middleware to add user to req and res.locals whenever a request has a session with userId - make this available to further routes
- Remember to remove password before attaching to req and res.locals!
- ...in fact, best not to retrieve passwords in the first place unless necessary (ie don't when retrieving users in middleware) - need to look into how to do this with mongoose


##  Other
### CSRF
- Defend against CSRF using tokens
- When login *page* is requested, server sends a unique CSRF token back to a hidden input field in the login form, and also stores it in a browser cookie. This is then returned to the server with a POST request. This confirms that the POST request has come from a user that has previously GET requested the login page and has not come from other sources.
- To implement, add `input(type="hidden", name="_csrf", value=csrfToken)` to the login form
- On the server, use `csurf` (npm):

  ``` js
  const csurf = require('csurf')
  app.use(csurf())
  app.get("register", (req, res) => {
    res.render("register", { csrfToken: req.csrfToken })
  })
  app.get("login", (req, res) => {
    res.render("login", { csrfToken: req.csrfToken })
  })
  //  ...and all other places calling render and having a form
  ```

### Best practices
- *Always* use SSL
- User cookie flags:

  ``` js
  app.use(session({
    cookieName: 'session',
    secret: 'some_random_string',
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000,
    httpOnly: true,           //  don't let JS code access cookies
    secure: true,             //  only set cookies over https
    ephemeral: true           //  destroy cookies when the browser closes
  }))
  ```

- Use `helmet` (npm)
- Don't roll your own! Use `passport` etc
