/*jshint expr:true, node:true*/
/*global describe, it, beforeEach*/
'use strict';

var chai = require('chai');
var spies = require('chai-spies');
chai.use(spies);
chai.should();

var Guard = require('../guard');

function successRequest(done) {
    done();
}

function asyncSuccess(done) {
    setTimeout(function () {
        done();
    }, 0);
}

function failRequest(done) {
    done('error');
}

function noop() {}

describe('guard', function () {
    it('shoul exist', function () {
        Guard.should.exist;
        Guard().should.exist;
    });
    describe('instance', function () {
        function asWithoutConfig(config) {
            var guard;
            beforeEach(function () {
                guard = Guard(config);
            });
            it('forbids by default', function () {
                guard().should.be.false;
            });
            it('forbids any rule by default', function () {
                guard('anyRule').should.be.false;
            });
            describe('when level setted >0', function () {
                beforeEach(function () {
                    guard.setLevel(1);
                });
                it('allows empty rule', function () {
                    guard().should.be.true;
                });
                it('allows any rule', function () {
                    guard('anyRule').should.be.true;
                });
                it('returns same handler', function () {
                    guard(noop).should.equal(noop);
                });
                it('returns same handler for any rule', function () {
                    guard('anyRule', noop).should.equal(noop);
                });
                it('returns handler with same signature', function () {
                    var spy = chai.spy(noop);
                    var arg = 'smth';
                    guard(spy)(arg);
                    spy.should.have.been.called.with(arg);
                });
            });
        }
        describe('w/o config', function () {
            asWithoutConfig();
        });
        describe('with request fn config', function () {
            describe('with success request', function () {
                var guard, spy, requestSpy;
                beforeEach(function () {
                    requestSpy = chai.spy(successRequest);
                    guard = Guard(requestSpy);
                    spy = chai.spy(noop);
                });
                asWithoutConfig(successRequest);
                it('allows and level increase when handler provided',
                    function () {
                        guard(spy)();
                        guard.getLevel().should.equal(1);
                        spy.should.have.been.called.once;
                        requestSpy.should.have.been.called.once;
                    });
                it('returns handler that accept args as provided handler',
                    function () {
                        var arg = 'smth';
                        guard(spy)(arg);
                        spy.should.have.been.called.with(arg);
                    });
            });
            describe('with fail request', function () {
                var guard, spy, requestSpy;
                beforeEach(function () {
                    requestSpy = chai.spy(failRequest);
                    guard = Guard(requestSpy);
                    spy = chai.spy(noop);
                });
                asWithoutConfig(failRequest);
                it('forbid with handler provided', function () {
                    guard(spy)();
                    guard.getLevel().should.equal(0);
                    spy.should.have.not.been.called();
                    requestSpy.should.have.been.called.once;
                });
            });
            describe('with async success request', function () {
                describe('when called with handler >1 times', function () {
                    var guard, requestSpy, spy1, spy2;
                    beforeEach(function (done) {
                        requestSpy = chai.spy(function (requestDone) {
                            setTimeout(function () {
                                requestDone();
                                done();
                            }, 0);
                        });
                        guard = Guard(requestSpy);
                        spy1 = chai.spy(noop);
                        spy2 = chai.spy(noop);
                        guard(spy1)();
                        guard(spy2)();
                    });
                    it('calls request only once', function () {
                        requestSpy.should.have.been.called.once;
                    });
                    it('calls all provided handler', function () {
                        spy1.should.have.been.called.once;
                        spy2.should.have.been.called.once;
                    });
                });
            });
        });
        describe('with 2 levels config', function () {
            var guard, levelZeroReqSpy, levelOneReqSpy, spy;
            beforeEach(function () {
                levelZeroReqSpy = chai.spy(successRequest);
                levelOneReqSpy = chai.spy(successRequest);
                guard = Guard([{
                    allowed: ['zero'],
                    request: levelZeroReqSpy
                }, {
                    allowed: ['one'],
                    request: levelOneReqSpy
                }, {
                    allowed: ['*']
                }]);
                spy = chai.spy(noop);
            });
            describe('when on 0 level', function () {
                it('allows rules on 0 level', function () {
                    guard('zero').should.be.true;
                });
                it('request for 1 level when request for 1 level rule',
                    function () {
                        guard('one', spy)();
                        levelZeroReqSpy.should.have.been.called.once;
                        spy.should.have.been.called.once;
                        levelOneReqSpy.should.not.have.been.called();
                    });
                it('request for 1 then 2 level when request for 2 level rule',
                    function () {
                        guard('two', spy)();
                        levelZeroReqSpy.should.have.been.called.once;
                        levelOneReqSpy.should.have.been.called.once;
                        spy.should.have.been.called.once;
                    });
                it('forbids rules on >0 level', function () {
                    guard('one').should.be.false;
                    guard('two').should.be.false;
                });
            });
            describe('when on 1 level', function () {
                beforeEach(function () {
                    guard.setLevel(1);
                });
                it('allows rules on 0 and 1 level', function () {
                    guard('zero').should.be.true;
                    guard('one').should.be.true;
                });
                it('request for 2 level when request for 2 level rule',
                    function () {
                        guard('two', spy)();
                        levelZeroReqSpy.should.not.have.been.called();
                        levelOneReqSpy.should.have.been.called.once;
                        spy.should.have.been.called.once;
                    });
                it('forbids rules on >1 level', function () {
                    guard('two').should.be.false;
                });
            });
        });
        describe('with invalid args', function () {
            it('throws TypeError', function () {
                var guard = Guard();
                guard.bind(null, 'rule', 'invalidType').should.throw(TypeError);
            });
        });

        /// OLD TESTS
        it('should forbid on 0 level w/o feature specified', function () {
            var guard = Guard();
            guard().should.be.false;
        });
        it('should allow on > 0 level w/o feature specified', function () {
            var guard = Guard();
            guard.setLevel(1);
            guard().should.be.true;
        });
        it('with any rule should forbidden by default', function () {
            var guard = Guard();
            guard('anyRule').should.be.false;
        });
        it('with any rule should be allowed when authorized', function () {
            var guard = Guard();
            guard.setLevel(1);
            guard('anyRule').should.be.true;
        });
        it('should ignore callback on 0 level', function () {
            var guard = Guard();
            var spy = chai.spy(noop);
            guard(spy)();
            spy.should.have.not.been.called();
        });
        it('should call callback on > 0 level', function () {
            var guard = Guard();
            var spy = chai.spy(noop);
            guard.setLevel(1);
            guard(spy)();
            spy.should.have.been.called.once;
        });
        it('should increase level when next level request success',
            function () {
                var requestSpy = chai.spy(successRequest);
                var guard = Guard(requestSpy);
                guard.getLevel().should.equal(0);
                guard.request();
                requestSpy.should.have.been.called();
                guard.getLevel().should.equal(1);
            });
        it('should save level when next level request fails', function () {
            var requestSpy = chai.spy(failRequest);
            var guard = Guard(requestSpy);
            guard.getLevel().should.equal(0);
            guard.request();
            requestSpy.should.have.been.called();
            guard.getLevel().should.equal(0);
        });
        it('should return private callback if authorized', function () {
            var requestSpy = chai.spy(successRequest);
            var guard = Guard(requestSpy);
            guard.request();
            requestSpy.should.have.been.called();
            guard(noop).should.equal(noop);
        });
        it('should calls private callback after request', function () {
            var requestSpy = chai.spy(successRequest);
            var guard = Guard(requestSpy);
            var spy = chai.spy(noop);
            guard(spy)();
            requestSpy.should.have.been.called.once;
            spy.should.have.been.called.once;
        });
        it('shouldn\'t call request when already requesting', function (done) {
            var requestSpy = chai.spy(asyncSuccess);
            var guard = Guard(requestSpy);
            var spy = chai.spy(function () {
                spy.should.have.been.called.once;
            });
            guard(spy)();
            requestSpy.should.have.been.called.once;
            var secondCallbackSpy = chai.spy(function () {
                spy.should.have.been.called.once;
                requestSpy.should.have.been.called.once;
                secondCallbackSpy.should.have.been.called.once;
                done();
            });
            guard(secondCallbackSpy)();
        });
        it('should call request and then callback if feature not allowed',
            function () {
                var requestSpy = chai.spy(successRequest);
                var guard = Guard(requestSpy);
                var spy = chai.spy(noop);
                guard('check', spy)();
                spy.should.have.been.called.once;
                requestSpy.should.have.been.called.once;
            });
        it('should throw when args invalid', function () {
            var guard = Guard();
            guard.bind(null, 'anyRule', 'invalidType').should.throw(TypeError);
        });
        it('should ignore rest args', function () {
            Guard(successRequest)
                .bind(null, 'anyRule', noop, 'else').should.not.throw();
        });
        it('should call all request on path to private feature', function () {
            var firstRequest = chai.spy(successRequest);
            var secondRequest = chai.spy(successRequest);
            var guard = Guard([{
                allowed: [],
                request: firstRequest
            }, {
                allowed: [],
                request: secondRequest
            }, {
                allowed: ['*']
            }]);
            var spy = chai.spy(noop);
            guard('private', spy)();
            firstRequest.should.have.been.called.once;
            secondRequest.should.have.been.called.once;
            spy.should.have.been.called.once;
        });
    });
    describe('constructor', function () {
        it('should use "*" rule as any regexp', function () {
            var guard = Guard([{
                allowed: ['one.*.three']
            }]);
            guard('one.two.three').should.be.true;
        });
        it('should use regexp for rules', function () {
            var guard = Guard([{
                allowed: [/(one|two)/]
            }]);
            guard('one').should.be.true;
            guard('two').should.be.true;
            guard('three').should.be.false;
        });
    });
    describe('listen', function () {
        it('should call listeners on level change', function () {
            var guard = Guard();
            var spy = chai.spy(noop);
            guard.listen(spy);
            guard.setLevel(1);
            spy.should.have.been.called.once;
        });
        it('shouldn\'t call listeners after unsubscribe', function () {
            var guard = Guard();
            var spy = chai.spy(noop);
            var unsubscribe = guard.listen(spy);
            unsubscribe();
            guard.setLevel(1);
            spy.should.have.not.been.called;
        });
        it('should unsubscribe only once', function () {
            var guard = Guard();
            var spy = chai.spy(noop);
            var unsubscribe = guard.listen(spy);
            unsubscribe();
            unsubscribe();
            guard.setLevel(1);
            spy.should.have.not.been.called;
        });
    });
    describe('request', function () {
        it('should throw when invalid args', function () {
            Guard().request
                .bind(null, 'shouldBeAFunction').should.throw(TypeError);
        });
        it('should request then call callback', function () {
            var guard = Guard(successRequest);
            var spy = chai.spy(noop);
            guard.request(spy);
            spy.should.have.been.called.once;
            guard.getLevel().should.equal(1);
        });
    });
});
