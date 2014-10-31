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

    var config = [{
        allowed: []
    }, {
        allowed: [/.*/]
    }];

    var listeners = [];

    function checkRule(requestRule) {
        if (!requestRule) {
            return level > 0;
        }
        return (function () {
            for (var i = 0; i <= level; i++) {
                var rules = config[i].allowed;
                for (var j = 0; j < rules.length; j++) {
                    if (rules[j].test(requestRule)) {
                        return true;
                    }
                }
            }
            return false;
        }());
    }

    var guard = function guard(requestRule) {
        return function () {
            if (arguments.length === 0) {
                if (requestRule) {
                    return checkRule(requestRule);
                }
                return config[level].request(function (err, result) {
                    if (!err) {
                        guard.setLevel(level + 1);
                    }
                });
            }
            if (arguments.length === 1) {
                var callback = arguments[0];
                if (checkRule(requestRule)) {
                    return callback;
                } else {
                    return config[level].request.bind(null,
                        function (err, result) {
                            if (!err) {
                                guard.setLevel(level + 1);
                            }
                            if (callback) {
                                callback(err, result);
                            }
                        });
                }
            }
            if (arguments.length === 2) {
                return checkRule(requestRule) ? arguments[0] : arguments[1];
            }
        };
    };

    guard.setup = function (newConfig) {
        if (typeof newConfig === 'function') {
            config = [{
                allowed: [],
                request: newConfig
            }, {
                allowed: [/.*/]
            }];
        } else {
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
        }
        return config;
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
