(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.guard = factory();
    }
}(this, function () {
    var level = 0;
    var config = null;
    var listeners = [];

    var guard = function guard() {
        if (config === null) {
            throw new Error('config wasnt set');
        }
        if (arguments.length === 0) {
            return config[level].request(function (err, result) {
                if (!err) {
                    guard.setLevel(level + 1);
                }
            });
        }
        if (arguments.length === 1) {
            return guard(arguments[0], true, false);
        }
        if (arguments.length === 2) {
            var callback = arguments[1];
            return guard(arguments[0],
                callback,
                config[level].request.bind(null, function (err, result) {
                    if (!err) {
                        guard.setLevel(level + 1);
                    }
                    if (callback) {
                        callback(err, result);
                    }
                }));
        }
        if (arguments.length === 3) {
            var requestRule = arguments[0];
            var isAllowed = (function () {
                for (var i = 0; i <= level; i++) {
                    var rules = config[i].allowed;
                    for (var j = 0; j < rules.length; j++) {
                        var rule = rules[j];
                        if (rule.test(requestRule)) {
                            return true;
                        }
                    }
                }
            }());
            return isAllowed ? arguments[1] : arguments[2];
        }
    };

    guard.setup = function (newConfig) {
        config = newConfig.map(function (val) {
            return {
                allowed: val.allowed.map(function (rule) {
                    if (rule instanceof RegExp) {
                        return rule;
                    }
                    return new RegExp('^' + rule.replace('*', '.*') + '$');
                }),
                request: val.request
            };
        });
    };

    guard.setLevel = function (newLevel) {
        level = newLevel;
        listeners.forEach(function (listener) {
            listener(newLevel);
        });
    };

    guard.getLevel = function () {
        return level;
    };

    guard.listen = function (listener) {
        var length = listeners.push(listener);
        return function (i) {
            listeners.splice(i, 1);
        }.bind(null, length - 1);
    };

    return guard;
}));
