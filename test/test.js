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
                it('allows handler calling', function (done) {
                    guard(done)();
                });
                it('allows handler calling for any rule', function (done) {
                    guard('anyRule', done)();
                });
                it('returns handler with same signature', function (done) {
                    var arg = 'smth';
                    var spy = chai.spy(function (arg1) {
                        arg1.should.equal(arg);
                        done();
                    });
                    guard(spy)(arg);
                });
            });
        }
        describe('w/o config', function () {
            asWithoutConfig();
            it('ignores forbiden handlers', function (done) {
                var guard = Guard();
                var spy = chai.spy(noop);
                guard('anyRule', spy)();
                setTimeout(function () {
                    spy.should.have.not.been.called();
                    done();
                }, 0);
            });
        });
        describe('with request fn config', function () {
            describe('with success request', function () {
                var guard, requestSpy;
                beforeEach(function () {
                    requestSpy = chai.spy(successRequest);
                    guard = Guard(requestSpy);
                });
                asWithoutConfig(successRequest);
                it('allows and level increase when handler provided',
                    function (done) {
                        var spy = chai.spy(function () {
                            guard.getLevel().should.equal(1);
                            requestSpy.should.have.been.called.once;
                            done();
                        });
                        guard(spy)();
                    });
                it('returns handler that accept args as provided handler',
                    function (done) {
                        var arg = 'smth';
                        var spy = chai.spy(function (arg1) {
                            arg1.should.equal(arg);
                            done();
                        });
                        guard(spy)(arg);
                    });
            });
            describe('with fail request', function () {
                var guard, requestSpy;
                beforeEach(function () {
                    requestSpy = chai.spy(failRequest);
                    guard = Guard(requestSpy);
                });
                asWithoutConfig(failRequest);
                it('forbid with handler provided', function (done) {
                    var spy = chai.spy(noop);
                    guard(spy)();
                    setTimeout(function () {
                        guard.getLevel().should.equal(0);
                        spy.should.have.not.been.called();
                        requestSpy.should.have.been.called.once;
                        done();
                    }, 0);
                });
            });
            describe('with async success request', function () {
                describe('when called with handler >1 times', function () {
                    var guard, requestSpy, spy1, spy2;
                    beforeEach(function (done) {
                        requestSpy = chai.spy(function (requestDone) {
                            setTimeout(function () {
                                requestDone();
                                setTimeout(function () {
                                    done();
                                }, 0);
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
            var guard, levelZeroReqSpy, levelOneReqSpy;
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
            });
            describe('when on 0 level', function () {
                it('allows rules on 0 level', function () {
                    guard('zero').should.be.true;
                });
                it('request for 1 level when request for 1 level rule',
                    function (done) {
                        var spy = chai.spy(function () {
                            levelZeroReqSpy.should.have.been.called.once;
                            spy.should.have.been.called.once;
                            levelOneReqSpy.should.not.have.been.called();
                            done();
                        });
                        guard('one', spy)();
                    });
                it('request for 1 then 2 level when request 2 level rule',
                    function (done) {
                        var spy = chai.spy(function () {
                            levelZeroReqSpy.should.have.been.called.once;
                            levelOneReqSpy.should.have.been.called.once;
                            spy.should.have.been.called.once;
                            done();
                        });
                        guard('two', spy)();
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
                    function (done) {
                        var spy = chai.spy(function () {
                            levelZeroReqSpy.should.not.have.been.called();
                            levelOneReqSpy.should.have.been.called.once;
                            spy.should.have.been.called.once;
                            done();
                        });
                        guard('two', spy)();
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
    });
    describe('constructor', function () {
        it('uses "*" rule as any regexp', function () {
            var guard = Guard([{
                allowed: ['one.*.three']
            }]);
            guard('one.two.three').should.be.true;
        });
        it('uses regexp for rules', function () {
            var guard = Guard([{
                allowed: [/(one|two)/]
            }]);
            guard('one').should.be.true;
            guard('two').should.be.true;
            guard('three').should.be.false;
        });
    });
    describe('listen', function () {
        it('calls listeners on level change', function () {
            var guard = Guard();
            var spy = chai.spy(noop);
            guard.listen(spy);
            guard.setLevel(1);
            spy.should.have.been.called.once;
        });
        it('doesn\'t call listeners after unsubscribe', function () {
            var guard = Guard();
            var spy = chai.spy(noop);
            var unsubscribe = guard.listen(spy);
            unsubscribe();
            guard.setLevel(1);
            spy.should.have.not.been.called;
        });
        it('unsubscribes only once', function () {
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
        it('throws when invalid args', function () {
            Guard().request
                .bind(null, 'shouldBeAFunction').should.throw(TypeError);
        });
        it('requests then call callback', function (done) {
            var guard = Guard(successRequest);
            var spy = chai.spy(function () {
                spy.should.have.been.called.once;
                guard.getLevel().should.equal(1);
                done();
            });
            guard.request(spy);
        });
        it('requests w/o callback', function (done) {
            var guard = Guard(successRequest);
            guard.request();
            setTimeout(function () {
                guard.getLevel().should.equal(1);
                done();
            }, 0);
        });
    });
});
