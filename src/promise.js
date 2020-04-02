function nextTick(fn) {
  if (process && process.nextTick) {
    process.nextTick(fn)
  } else {
    queueMicrotask(fn)
  }
}

class Promise {
  // state = 'pending'
  // onFulfilled = []
  // onRejected = []

  constructor(fn) {
    this.state = 'pending'
    this.onFulfilled = []
    this.onRejected = []
    this.promise2 = []
    this.callback = {
      onFulfilled: [],
      onRejected: [],
      promise2: []
    }
    if (typeof fn !== 'function') {
      throw new Error('构造函数里必须传一个函数')
      return
    }
    fn(this.resolve.bind(this), this.reject.bind(this))
  }

  resolveWith(x) {
    const promise2 = this
    if (x === promise2) {
      promise2.reject(new TypeError())
    } else if (x instanceof Promise) {
      if (x.state === 'pending') {
      }
    } else if (x instanceof Object) {
      try {
        const then = x.then
      } catch (e) {
        return promise2.reject(e)
      }
      if (then instanceof Function) {
        // then.call(x, )'
        try {
          x.then(
            y => {
              promise2.resolve(y)
            },
            r => {
              promise2.reject(r)
            }
          )
        } catch (e) {
          promise2.reject(e)
        }
      } else {
        promise2.resolve(x)
      }
    } else {
      promise2.resolve(x)
    }
  }

  resolve(result) {
    if (this.state !== 'pending') {
      return
    } // 保证了只调用一次onFulfilled
    this.state = 'fulfilled'
    // 保证了在 resolve 以及同步代码之后调用
    nextTick(() => {
      this.onFulfilled.forEach(resolveHandler => {
        const x = resolveHandler.call(undefined, result)
        this.promise2.resolveWith(x)
      })
      // if (typeof this.onFulfilled === 'function') {
      //   this.onFulfilled.call(undefined, result)
      // }
    })
  }

  reject(reason) {
    if (this.state !== 'pending') {
      return
    } // 保证了只调用一次onRejected
    this.state = 'rejected'
    // 保证了在 reject 以及同步代码之后调用
    nextTick(() => {
      this.onRejected.forEach(rejectHandler => {
        rejectHandler.call(undefined, reason)
      })
      if (typeof this.onRejected === 'function') {
        this.onRejected.call(undefined, reason)
      }
    })
  }

  then(onFulfilled, onRejected) {
    if (typeof onFulfilled === 'function') {
      this.onFulfilled.push(onFulfilled)
    }
    if (typeof onRejected === 'function') {
      this.onRejected.push(onRejected)
    }
    this.promise2 = new Promise(() => {})
    return this.promise2
  }
}

module.exports = Promise

const promise = new Promise((resolve, reject) => {
  resolve(2333)
})
const promise1 = promise.then(num => num + 1)
const promise2 = promise.then(num => num + 2)
const promise3 = promise.then(num => num + 3)