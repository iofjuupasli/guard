(function (root, factory) {
    'use strict';
    /* istanbul ignore next */
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof exports === 'object') {
        /* global module */
        module.exports = factory();
    } else {
        root.Guard = factory();
    }
}(this, function () {
    'use strict';
    return function (initConfig) {
        var level = 0;

        var config;

        var listeners = [];

        var isRequesting = false;
        var requestQueue = [];

        var _ = {
            isFunction: function (value) {
                return typeof value == 'function';
            },
            isArray: function (value) {
                return Array.isArray(value);
            },
            isRegExp: function (value) {
                return value instanceof RegExp;
            }
        };

        function checkAccess(requestRule) {
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

        function reqThenCallback(feature, callback) {
            return function () {
                if (!config[level].request) {
                    return;
                }
                var args = arguments;
                requestQueue.push(callback);
                if (isRequesting) {
                    return;
                } else {
                    isRequesting = true;
                }
                config[level].request(function (err) {
                    isRequesting = false;
                    if (err) {
                        requestQueue = [];
                        return;
                    }
                    guard.setLevel(level + 1);
                    while (requestQueue.length) {
                        if (feature) {
                            guard(feature, requestQueue.shift())
                                .apply(null, args);
                        } else {
                            guard(requestQueue.shift()).apply(null, args);
                        }
                    }
                });
            };
        }

        var guard = function guard() {
            if (arguments.length === 0) {
                return checkAccess();
            }
            if (arguments.length === 1) {
                if (_.isFunction(arguments[0])) {
                    if (checkAccess()) {
                        return arguments[0];
                    } else {
                        return reqThenCallback(null, arguments[0]);
                    }
                } else {
                    return checkAccess(arguments[0]);
                }
            }
            if (arguments.length === 2) {
                if (!_.isFunction(arguments[1])) {
                    throw new TypeError();
                }
                if (checkAccess(arguments[0])) {
                    return arguments[1];
                } else {
                    return reqThenCallback(arguments[0], arguments[1]);
                }
            }
        };

        guard.request = function (callback) {
            if (callback && !_.isFunction(callback)) {
                throw new TypeError();
            }
            if (!callback) {
                callback = function () {};
            }
            return reqThenCallback(null, callback)();
        };

        guard.setup = function (newConfig) {
            if (_.isFunction(newConfig)) {
                config = [{
                    allowed: [],
                    request: newConfig
                }, {
                    allowed: [/.*/]
                }];
            } else if (_.isArray(newConfig)) {
                config = newConfig.map(function (val) {
                    return {
                        allowed: val.allowed.map(function (rule) {
                            if (_.isRegExp(rule)) {
                                return rule;
                            }
                            var ruleNorm = '^' + rule.replace('*', '.*') + '$';
                            return new RegExp(ruleNorm);
                        }),
                        request: val.request
                    };
                });
            } else {
                config = [{
                    allowed: []
                }, {
                    allowed: [/.*/]
                }];
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
            listeners.push(listener);
            return function () {
                var i = listeners.indexOf(listener);
                if (i !== -1) {
                    listeners.splice(i, 1);
                }
                listener = null;
            };
        };

        guard.setup(initConfig);

        return guard;
    };
}));
