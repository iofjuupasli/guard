guard
=====

Utility to split opportunities by the account level (free\pro\enterprise\etc.) for frontend and node

Example usage
=============

```js
guard.setup([{
    // string converted to regex, with replace '*' to '.*' and placing '^' and '$'
    allowed: ['profile:create', 'profile:login', /^account:.*$/],
    request: function (next) {
        // request function to get next level of access
        // for example you can show popup with login/register form
        if (confirm('login?')) {
            next();
        } else {
            next('unauth');
        }
    }
}, {
    // you can use any structure of access rules as you want
    // so it's only example
    // in this example '@' used as shortcut for 'currentUser'
    allowed: ['profile:read', '@:profile:*', '@:message:*', 'message:read', 'emoticons:read'],
    request: function (next) {
        if (confirm('Want to pay?')) {
            next();
        } else {
            next('not payed');
        }
    }
}, {
    allowed: ['emoticons:*'],
    request: function (next) {
        if (confirm('Are you admin?')) {
            next();
        } else {
            next('You arent admin');
        }
    }
}, {
    allowed: ['*']
}]);

// subscribe to level switching
// returns func to unsubscibe
var unsubscribe = guard.listen(function (newLevel) {
    console.log('switched to ', newLevel);
});
unsubscribe();

// just call request to access next level
guard();

// if 'foo:bar' allowed returns true, else false
guard('foo:bar');

// if 'foo:bar' allowed calls callback
// else calls request to next level of access
// and if it's success calls provided callback
guard('foo:bar', function (err) {
    if (!err) {
        alert('private action!');
    }
});

// if 'foo:bar' allowed returns second argument, else third
guard('foo:bar', 'Text for cool user', 'Text for unauth user');


// set and get level of access
guard.getLevel();
guard.setLevel(1);
guard.getLevel();

```

Use as middleware for express
===

```js
function guardMiddleware(ruleName) {
    return function (req, res, next) {
        if (guard(ruleName)) {
            next();
        } else {
            res.sendStatus(401);
        }
    };
}

app.get('/profile', guardMiddleware('@:profile:read'), function (req, res) {
    res.send('Your profile');
});

```
