const sinon = require('sinon')
const chai = require('chai')
const { assert } = chai
// const { Promise2: Promise } = require('../src/promise')
const Promise = require('../src/promiseTeacher')
const sinonChai = require('sinon-chai')
chai.use(sinonChai)

describe('Promise', () => {
  it('是一个类', () => {
    assert.isFunction(Promise)
    assert.isObject(Promise.prototype)
  })
  it('new Promise()如果接受的不是一个函数就报错', () => {
    assert.throw(() => {
      new Promise()
    })
    assert.throw(() => {
      new Promise(1)
    })
    assert.throw(() => {
      new Promise(false)
    })
  })
  it('new Promise(fn) 会生成一个对象, 对象有 then 方法', () => {
    // console.log('-------------')
    // console.log(Promise2.prototype.then)
    const promise = new Promise(() => {})
    assert.isFunction(promise.then)
  })
  it('new Promise(fn) 中的fn, fn为executor, 立即执行', () => {
    const fn = sinon.fake()
    new Promise(fn)
    assert(fn.called)
  })
  it('new Promise(fn) 中的fn执行的时候接受resolve和reject两个函数', done => {
    new Promise((resolve, reject) => {
      assert.isFunction(resolve)
      assert.isFunction(reject)
      done()
    })
  })
  it('promise.then(onFulfilled) 中的onFulfilled会在resolve被调用时执行', done => {
    const onFulfilled = sinon.fake()
    const promise = new Promise((resolve, reject) => {
      assert.isFalse(onFulfilled.called)
      resolve()
      setTimeout(() => {
        assert.isTrue(onFulfilled.called)
        done()
      })
    })
    promise.then(onFulfilled)
  })
  it('promise.then(null, onRejected) 中的onRejected会在reject被调用时执行', done => {
    const onRejected = sinon.fake()
    const promise = new Promise((resolve, reject) => {
      assert.isFalse(onRejected.called)
      reject()
      setTimeout(() => {
        assert.isTrue(onRejected.called)
        console
        done()
      })
    })
    promise.then(null, onRejected)
  })
  describe('2.2 then 方法', done => {
    it('2.2.1 onFulfilled和onRejected都是可选的参数', done => {
      const promise = new Promise(resolve => {
        resolve()
      })
      promise.then(false, null)
      setTimeout(() => {
        assert(1 === 1)
        done()
      })
    })
    it('2.2.2 如果onFulfilled是函数', done => {
      const onFulfilled = sinon.fake()
      const promise = new Promise(resolve => {
        resolve(233)
        resolve(2333)
      })
      promise.then(onFulfilled)
      setTimeout(() => {
        assert(promise.state === 'fulfilled')
        assert(onFulfilled.calledOnce)
        assert(onFulfilled.calledWith(233))
        done()
      })
    })
    it('2.2.3 如果onRejected是函数', done => {
      const onRejected = sinon.fake()
      const promise = new Promise((resolve, reject) => {
        reject(233)
        reject(2333)
      })
      promise.then(null, onRejected)
      setTimeout(() => {
        assert(promise.state === 'rejected')
        assert(onRejected.calledOnce)
        assert(onRejected.calledWith(233))
        done()
      })
    })
    it('2.2.4 在执行上下文堆栈（execution context）仅包含平台代码之前，不得调用 onFulfilled和onRejected. 意思就是同步代码执行完之前不得调用onFulfilled和onRejected', done => {
      const onRejected = sinon.fake()
      const promise1 = new Promise((resolve, reject) => {
        reject(2333)
      })
      promise1.then(null, onRejected)
      assert.isFalse(onRejected.called)
      setTimeout(() => {
        assert.isTrue(onRejected.called)
      })

      const onFulfilled = sinon.fake()
      const promise2 = new Promise((resolve, reject) => {
        resolve(2333)
      })
      promise2.then(onFulfilled)
      assert.isFalse(onFulfilled.called)
      setTimeout(() => {
        assert.isTrue(onFulfilled.called)
        done()
      })
    })
    it('2.2.5 onFulfilled和onRejected必须被当做函数调用(也就是说没有this)', done => {
      const promise = new Promise(resolve => {
        resolve()
      })
      promise.then(function() {
        // 这里必须要用 function, 箭头函数的话 this 会往上一个执行上下文找
        'use strict'
        console.log('--------')
        console.log(this)
        assert(this === undefined)
        done()
      })
    })
    describe('2.2.6 then可以在同一个promise里被多次调用', () => {
      it('2.2.6.1 如果/当 promise 完成执行（fulfilled）,各个相应的onFulfilled回调 必须根据最原始的then 顺序来调用', done => {
        const promise = new Promise(resolve => {
          resolve(2333)
        })
        const fakes = [sinon.fake(), sinon.fake(), sinon.fake()]
        fakes.forEach(fake => promise.then(fake))
        setTimeout(() => {
          assert(fakes[0].called)
          assert(fakes[1].called)
          assert(fakes[2].called)
          assert(fakes[1].calledAfter(fakes[0]))
          assert(fakes[2].calledAfter(fakes[1]))
          done()
        })
      })
      it('2.2.6.2 如果/当 promise 被拒绝（rejected）,各个相应的onRejected回调 必须根据最原始的then 顺序来调用', done => {
        const promise = new Promise((resolve, reject) => {
          reject(2333)
        })
        const fakes = [sinon.fake(), sinon.fake(), sinon.fake()]
        fakes.forEach(fake => promise.then(null, fake))
        setTimeout(() => {
          assert(fakes[0].called)
          assert(fakes[1].called)
          assert(fakes[2].called)
          assert(fakes[1].calledAfter(fakes[0]))
          assert(fakes[2].calledAfter(fakes[1]))
          done()
        })
      })
    })
    it('2.2.7 then必须返回一个Promise', done => {
      const promise = new Promise(resolve => {
        resolve()
      })
      const promise2 = promise.then()
      assert(promise2 instanceof Promise)
      done()
    })
    it('2.2.7.1 如果onFulfilled或onRejected返回一个值x, 运行 Promise Resolution Procedure [[Resolve]](promise2, x)', done => {
      const promise = new Promise(resolve => {
        resolve()
      })
      const promise2 = promise.then(() => 'success')
      assert(promise2 instanceof Promise)
      done()
    })
    it('2.3.1 如果promise和x引用同一个对象，则用TypeError作为原因拒绝（reject）promise', done => {
      const promise = new Promise(resolve => resolve(2333))
      assert.throw(() => {
        const promise2 = promise.then(num => promise.then())
        done()
      })
    })
    it('2.3.2 如果x是一个promise,采用promise的状态', done => {
      const promise = new Promise(resolve => {
        resolve()
      })
      const promise2 = promise.then(() => new Promise(resolve => resolve(2333)))
      promise2.then(num => {
        assert(num === 2333)
        done()
      })
    })
    describe('2.3.3 另外，如果x是个对象或者方法', done => {
      it('2.3.3.2 如果取回的x.then属性的结果为一个异常e,用e作为原因reject promise', done => {
        new Promise(resolve => {
          resolve()
        })
          .then(() => {
            const obj = {}
            Object.defineProperty(obj, 'then', {
              get() {
                throw new Error('xxx')
              }
            })
            return obj
          })
          .then(null, err => {
            assert((err.message = 'xxx'))
            done()
          })
      })
      it('2.3.3.3.1 如果then是一个方法，把x当作this来调用它， 第一个参数为 resolvePromise，第二个参数为rejectPromise', done => {
        class Thenable {
          constructor(num) {
            this.num = num
          }
          then(resolve, reject) {
            // 1 秒后使用 this.num*2 进行 resolve
            setTimeout(() => resolve(this.num * 2), 100)
          }
        }

        new Promise(resolve => resolve(1))
          .then(result => {
            return new Thenable(result)
          })
          .then(num => {
            assert(num === 2)
            done()
          })
      })
      it('2.3.3.3.2 如果then是一个方法，把x当作this来调用它， 第一个参数为 resolvePromise，第二个参数为rejectPromise', done => {
        class Thenable {
          constructor(num) {
            this.num = num
          }
          then(resolve, reject) {
            // 1 秒后使用 this.num*2 进行 resolve
            setTimeout(() => reject(this.num * 2), 100)
          }
        }

        new Promise(resolve => resolve(1))
          .then(result => {
            return new Thenable(result)
          })
          .then(null, num => {
            assert(num === 2)
            done()
          })
      })
      it('2.3.3.3.3 如果resolvePromise和 rejectPromise都被调用，或者对同一个参数进行多次调用，第一次调用执行，任何进一步的调用都被忽略', (done) => {
        class Thenable {
          constructor(num) {
            this.num = num
          }
          then(resolve, reject) {
            resolve(this.num * 2)
            resolve(this.num * 3)
          }
        }

        new Promise(resolve => resolve(1))
          .then(result => {
            return new Thenable(result)
          })
          .then(num => {
            assert(num === 2)
            done()
          })
      })
      it('2.3.3.3.4.1 如果调用then抛出一个异常e, 且resolvePromise或 rejectPromise已被调用，忽略该异常', (done) => {
        class Thenable {
          constructor(num) {
            this.num = num
          }
          then(resolve, reject) {
            resolve(Promise.resolve(this.num * 2))
            throw new Error('xxx')
          }
        }

        new Promise(resolve => resolve(1))
          .then(result => {
            return new Thenable(result)
          })
          .then(num => {
            assert(num === 2)
            done()
          })
      })
      it('2.3.3.3.4.2 如果调用then抛出一个异常e, 且resolvePromise或 rejectPromise没被调用，用e作为reason拒绝（reject）promise', (done) => {
        class Thenable {
          constructor(num) {
            this.num = num
          }
          then(resolve, reject) {
            throw new Error('xxx')
          }
        }

        new Promise(resolve => resolve(1))
          .then(result => {
            return new Thenable(result)
          })
          .then(null, e => {
            assert(e.message === 'xxx')
            done()
          })
      })
      it('2.3.3.4 如果then不是一个函数，用x完成(fulfill)promise', done => {
        new Promise(resolve => resolve())
          .then(() => ({ then: 2333 }))
          .then(obj => {
            assert(obj.then === 2333)
            done()
          })
      })
    })
    it('2.3.4 如果 x既不是对象也不是函数，用x完成(fulfill)promise', done => {
      new Promise(resolve => resolve())
        .then(() => 2333)
        .then(num => {
          assert(num === 2333)
          done()
        })
    })
    it('2.2.7.2 如果onFulfilled或onRejected抛出一个异常e,promise2 必须被拒绝（rejected）并把e当作原因', done => {
      new Promise(resolve => resolve())
        .then(() => {
          throw new Error('xxx')
        })
        .then(null, e => {
          assert(e.message === 'xxx')
          done()
        })
    })
    it('2.2.7.3 如果onFulfilled不是一个方法，并且promise1已经完成（fulfilled）, promise2必须使用与promise1相同的值来完成（fulfiled）', done => {
      new Promise(resolve => resolve(2333)).then(null).then(num => {
        assert(num === 2333)
        done()
      })
    })
    it('2.2.7.4 如果onRejected不是一个方法，并且promise1已经被拒绝（rejected）, promise2必须使用与promise1相同的原因来拒绝（rejected）', done => {
      new Promise((resolve, reject) => reject(2333)).then().then(null, num => {
        assert(num === 2333)
        done()
      })
    })
    describe('new Promise里', done => {
      xit('resolve自己', done => {})
      it('resolve了一个resolved promise', done => {
        const promise = new Promise((resolve, reject) => {
          resolve(Promise.resolve(2333))
        })
        promise.then(num => {
          assert(num === 2333)
          done()
        })
      })
      it('resolve了一个 rejected promise', done => {
        const promise = new Promise((resolve, reject) => {
          resolve(Promise.reject(2333))
        })
        promise.then(null, num => {
          assert(num === 2333)
          done()
        })
      })
      it('resolve reject reject promise', done => {
        const promise = new Promise((resolve, reject) => {
          resolve(Promise.reject(Promise.reject(2333)))
        })
        promise.then(null, innerPromise => {
          innerPromise.then(null, num => {
            assert(num === 2333)
            done()
          })
        })
      })
      it('resolve 后 throw Error', (done) => {
        new Promise((resolve) => {
          resolve(2333)
          throw new Error('xxx')
        }).then(
          (num) => {
            assert(num === 2333)
            done()
          },
          (e) => {
            console.log(e.message)
          }
        )
      })
      it('直接throw Error, 不调用resolve和reject', (done) => {
        new Promise((resolve) => {
          throw new Error('xxx')
        }).then(null, e => {
          assert(e.message === 'xxx')
          done()
        })
      })
    })
  })
})
