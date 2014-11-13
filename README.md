[![Coverage Status](https://img.shields.io/coveralls/iofjuupasli/guard.svg)](https://coveralls.io/r/iofjuupasli/guard?branch=master)
[![Build Status](https://travis-ci.org/iofjuupasli/guard.svg?branch=master)](https://travis-ci.org/iofjuupasli/guard)

guard
=====

Utility to split opportunities by the account level (free\pro\enterprise\etc.) for frontend and node

Install
=============
### With bower
```
bower i -S guard
```
### With npm
```
npm i -S guard-bit
```
### File
Save [guard.min.js](https://raw.githubusercontent.com/iofjuupasli/guard/v1.0.4/guard.min.js) or [guard.js](https://raw.githubusercontent.com/iofjuupasli/guard/v1.0.4/guard.js) to your assets folder

Examples
=============

Without any config
--------------

```js
var guard = Guard();
// level === 0 by default
// getters
guard(); // false
guard('anyRule'); // false

// handlers
guard(function () {
    console.log('called!');
})(); // nothing logged
guard('anyRule', function () {
    console.log('called!');
})(); // nothing logged

guard.setLevel(1);

// getters
guard(); // true
guard('anyRule'); // true

// handlers
guard(function () {
    console.log('called!');
})(); // 'called!'
guard('anyRule', function () {
    console.log('called!');
})(); // 'called!'

```

Request callback (unauth/auth)
--------------

```js
var guard = Guard(function (done) {
    // show there popup with login/register form
    // call done when you are logged in
    // call done with error when you are closed popup with forms
    setTimeout(function () {
        if (confirm('Give access?')) {
            done();
        } else {
            done('error');
        }
    }, 100);
});

// level === 0 (unauthorized) by default
// getters
guard(); // false
guard('anyRule'); // false

// handlers
// calls request provided in constructor
// and after request success calls callback
guard(function (message) {
    console.log(message);
})('called!'); // 'called' after login success (100ms)

// request called only once (only one login popup)
// but when it's done both callbacks will call
guard('anyRule', function () {
    console.log('called!');
})(); // 'called' after 100ms
// awesome!


// onward suppose 100ms passed and we are on 1 level

// getters
guard(); // true
guard('anyRule'); // true

// handlers
guard(function () {
    console.log('called!');
})(); // 'called!'
guard('anyRule', function () {
    console.log('called!');
})(); // 'called!'


```

Several access level and rules (unauth/auth/pro/admin)
--------------

```js
var guard = Guard([{
    allowed: ['profile:create'],
    request: function (done) {
        if (confirm('Are you a User?')) {
            done();
        } else {
            done('error');
        }
    }
}, {
    // '*' means 'any'
    // '@' is short for 'currentUser'
    // but you can use any rule name convention that you prefer
    allowed: ['@:profile:*'],
    request: function (done) {
        if (confirm('Are you an Admin?')) {
            done();
        } else {
            done('error');
        }
    }
}, {
    allowed: ['*']
}]);

// level === 0 (unauthorized) by default
// getters
guard(); // false
guard('profile:create'); // true

// handlers
guard(function (message) {
    console.log(message);
})('called!'); // 'called' after login success
// level === 1
guard('@:profile:read', function () {
    console.log('My Profile');
})(); // 'My Profile' immediately (but async)

guard('adminFeature', function () {
    console.log('called!');
})(); // 'called' after admin request success
// level === 2

guard.setLevel(0);

guard('adminFeature', function (laugh) {
    console.log(laugh + ' I\'m an Admin!');
})('Ha!');
// calls request to user (login popup)
// after it's success, calls admin request
// after admin request success calls callback

```

As middleware
--------------

```js
function guardMiddleware(rule) {
    return function (req, res, next) {
        if (guard(rule)) {
            next();
        } else {
            res.sendStatus(401);
        }
    }
}

app.get('/profile', guardMiddleware('@:profile:read'),
    function (req, res) {
        res.send('Your profile');
    });

```

More useful methods
--------------
```js
var guard = Guard(function (done) {
    console.log('Request for Auth')
    done();
});

guard.listen(function (newLevel) {
    console.log('now on level ' + newLevel);
});

var unsubscribe = guard.listen(function (newLevel) {
    console.log('second listener!');
});

// request for next level
guard.request();
// 'Request for Auth'
// 'now on level 1'
// 'second listener!'

unsubscribe();

// get current level
guard.getLevel();
// 1

guard.setLevel(0);
// 'now on level 0'

guard.request(function () {
    console.log('after success uplevel');
});
// 'Request for Auth'
// 'now on level 1'
// 'after success uplevel'

// it's possible to set new config on same instance
// config in same form as in constructor
guard.setup(config);

```

API (TypeScript)
===============

```typescript
interface Guard {
    () : boolean;
    (feature : string) : boolean;
    (callback : (...any) => any) : (...any) => void;
    (feature : string, callback : (...any) => any) : (...any) => void;

    request() : void;
    request(callback : (...any) => any);

    setup() : void;
    setup(req: (done: (error? : any) => any) => any) : void;
    setup(config: Array<{request?: (done: (error? : any) => any) => any; allowed: Array<any>}>) : void;

    getLevel() : number;
    setLevel(level : number) : void;

    listen(listener : (newLevel) => any) : () => void;
}

interface GuardConstructor {
    () : Guard;
    new () : Guard;
    (req: (done: (error? : any) => any) => any) : Guard;
    new (req: (done: (error? : any) => any) => any) : Guard;
    (config: Array<{request?: (done: (error? : any) => any) => any; allowed: Array<any>}>) : Guard;
    new (config: Array<{request?: (done: (error? : any) => any) => any; allowed: Array<any>}>) : Guard;
}

declare module "guard" {
    export = Guard;
}
declare var Guard : GuardConstructor;

```

Versions
==================
It uses semver.
Current version is 1.x.x. It means that API is stable. Whooa!
