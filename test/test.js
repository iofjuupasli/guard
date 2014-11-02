/*jshint expr:true*/
var chai = require('chai');
var spies = require('chai-spies');
chai.use(spies);
var should = chai.should();

var Guard = require('../index');

function successRequest(done) {
    done();
}

function asyncSuccess(done) {
    setTimeout(function () {
        done();
    }, 0);
}

function failRequest(done) {

}

function asyncFail(done) {
    setTimeout(function () {

    }, 0);
}

function noop() {}

describe('guard', function () {
    it('shoul exist', function () {
        Guard.should.exist;
        Guard().should.exist;
    });
    describe('instance', function () {
        it('should forbid on 0 level w/o feature specified', function () {
            var guard = Guard();
            guard().should.be.false;
        });
        it('should allow on > 0 level w/o feature specified', function () {
            var guard = Guard();
            guard.setLevel(1);
            guard().should.be.true;
        });
        it('any rule should forbidden by default', function () {
            var guard = Guard();
            guard('anyRule').should.be.false;
        });
        it('any rule should be allowed when authorized', function () {
            var guard = Guard();
            guard.setLevel(1);
            guard('anyRule').should.be.true;
        });
        it('should increase level when next level request success', function () {
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
        it('should call request and then callback if feature not allowed', function () {
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
            Guard(successRequest).bind(null, 'anyRule', noop, 'else').should.not.throw();
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
    });
    describe('request', function () {
        it('should throw when invalid args', function () {
            Guard().request.bind(null, 'shouldBeAFunction').should.throw(TypeError);
        });
        it('should request then call callback', function () {
            var guard = Guard(successRequest);
            var spy = chai.spy(noop);
            guard.request(spy);
            spy.should.have.been.called.once;
            guard.getLevel().should.equal(1);
        });
    })
});
