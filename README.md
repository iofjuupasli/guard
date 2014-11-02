[![Coverage Status](https://img.shields.io/coveralls/iofjuupasli/guard.svg)](https://coveralls.io/r/iofjuupasli/guard?branch=master)
[![Build Status](https://travis-ci.org/iofjuupasli/guard.svg?branch=master)](https://travis-ci.org/iofjuupasli/guard)

guard
=====

Utility to split opportunities by the account level (free\pro\enterprise\etc.) for frontend and node

Examples
=============

Without any config
--------------

```js

```

Request callback (unauth/auth)
--------------

```js

```

Several access level and rules (unauth/auth/pro/admin)
--------------

```js

```

As middleware
--------------

```js

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
    setup(req: (done: () => any) => any) : void;
    setup(config: Array<{request?: (done: () => any) => any; allowed: Array<any>}>) : void;

    getLevel() : number;
    setLevel(level : number) : void;

    listen(listener : (newLevel) => any) : () => void;
}

interface GuardConstructor {
    () : Guard;
    new () : Guard;
    (req: (done: () => any) => any) : Guard;
    new (req: (done: () => any) => any) : Guard;
    (config: Array<{request?: (done: () => any) => any; allowed: Array<any>}>) : Guard;
    new (config: Array<{request?: (done: () => any) => any; allowed: Array<any>}>) : Guard;
}

declare module "guard" {
    export = Guard;
}
declare var Guard : GuardConstructor;

```
