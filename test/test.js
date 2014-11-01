/*jshint expr:true*/
var chai = require('chai');
var spies = require('chai-spies');
chai.use(spies);
var should = chai.should();

var Guard = require('../index');

function successRequest(next) {
    next();
}

function asyncSuccess(next) {
    setTimeout(function () {
        next();
    }, 0);
}

function failRequest(next) {
    next('Error');
}

function asyncFail(next) {
    setTimeout(function () {
        next('Error');
    }, 0);
}

function noop() {}

describe('guard', function () {
    it('shoul exist', function () {
        Guard.should.exist;
        Guard().should.exist;
    });
    describe('instance', function () {
        it('any rule should forbidden by default', function () {
            var guard = Guard();
            var anyRule = 'rule';
            guard(anyRule)().should.be.false;
        });
        it('should increase level when next level request success', function () {
            var requestSpy = chai.spy(successRequest);
            var guard = Guard(requestSpy);
            guard.getLevel().should.equal(0);
            guard()();
            requestSpy.should.have.been.called();
            guard.getLevel().should.equal(1);
        });
        it('should save level when next level request fails', function () {
            var requestSpy = chai.spy(failRequest);
            var guard = Guard(requestSpy);
            guard.getLevel().should.equal(0);
            guard()();
            requestSpy.should.have.been.called();
            guard.getLevel().should.equal(0);
        });
        it('should return private callback if authorized', function () {
            var requestSpy = chai.spy(successRequest);
            var guard = Guard(requestSpy);
            guard()();
            requestSpy.should.have.been.called();
            guard()(noop).should.equal(noop);
        });
        it('should calls private callback after request', function () {
            var requestSpy = chai.spy(successRequest);
            var guard = Guard(requestSpy);
            var spy = chai.spy(noop);
            guard()(spy)();
            requestSpy.should.have.been.called.once;
            spy.should.have.been.called.once;
        });
        it('shouldn\'t call request when already requesting', function (done) {
            var requestSpy = chai.spy(asyncSuccess);
            var guard = Guard(requestSpy);
            var spy = chai.spy(function () {
                spy.should.have.been.called.once;
            });
            guard()(spy)();
            requestSpy.should.have.been.called.once;
            var secondCallbackSpy = chai.spy(function () {
                spy.should.have.been.called.once;
                requestSpy.should.have.been.called.once;
                secondCallbackSpy.should.have.been.called.once;
                done();
            });
            guard()(secondCallbackSpy)();
        });
        it('should return second value when unauthorized', function () {
            var guard = Guard();
            var first = {};
            var second = {};
            guard()(first, second).should.equal(second);
        });
        it('should return first value when authorized', function () {
            var guard = Guard(successRequest);
            var first = {};
            var second = {};
            guard()();
            guard()(first, second).should.equal(first);
        });
        it('should throw when unexpected args', function () {
            var guard = Guard();
            guard().bind(null, {}, {}, {}).should.throw();
        });
    });
    describe('constructor', function () {
        it('should use "*" rule as any regexp', function () {
            var guard = Guard([{
                allowed: ['one.*.three']
            }]);
            guard('one.two.three')().should.be.true;
        });
        it('should use regexp for rules', function () {
            var guard = Guard([{
                allowed: [/(one|two)/]
            }]);
            guard('one')().should.be.true;
            guard('two')().should.be.true;
            guard('three')().should.be.false;
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
    });
});
