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
                var args = arguments;
                if (checkAccess(feature)) {
                    setTimeout(function () {
                        callback.apply(null, args);
                    }, 0);
                    return;
                }
                requestQueue.push(callback);
                if (isRequesting) {
                    return;
                }
                isRequesting = true;
                if (config[level].request) {
                    config[level].request(requestHandler);
                }

                function requestHandler(err) {
                    isRequesting = false;
                    if (err) {
                        requestQueue = [];
                        return;
                    }
                    guard.setLevel(level + 1);
                    while (requestQueue.length) {
                        var nextRequest = requestQueue.shift();
                        if (feature != null) {
                            guard(feature, nextRequest).apply(null, args);
                        } else {
                            guard(nextRequest).apply(null, args);
                        }
                    }
                }
            };
        }

        var guard = function guard() {
            if (arguments.length === 0) {
                return checkAccess();
            }
            if (arguments.length === 1) {
                if (_.isFunction(arguments[0])) {
                    return reqThenCallback(null, arguments[0]);
                } else {
                    return checkAccess(arguments[0]);
                }
            }
            if (!_.isFunction(arguments[1])) {
                throw new TypeError();
            }
            return reqThenCallback(arguments[0], arguments[1]);
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
