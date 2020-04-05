function nextTick(fn) {
  if (process && process.nextTick) {
    process.nextTick(fn) // nodejs
  } else {
    queueMicrotask(fn) // 浏览器
  }
}

class Promise {
  // state = 'pending'
  // onFulfilled = []
  // onRejected = []

  constructor(fn) {
    this.state = 'pending'
    // [{onFulfilled, onRejected, nextPromise}, {onFulfilled, onRejected, nextPromise}]
    this.on = []
    this.value = undefined
    if (typeof fn !== 'function') {
      throw new Error('构造函数里必须传一个函数')
      return
    }
    let wasCalled = false
    // TODO 这里也要有一个wasCalled
    // fn(this.resolveWith.bind(this), this.reject.bind(this))
    try {
      fn(
        function (result) {
          if (wasCalled) { return }
          wasCalled = true
          this.resolveWith(result)
        }.bind(this),
        function (reason) {
          if (wasCalled) { return }
          wasCalled = true
          this.reject(reason)
        }.bind(this)
      )
    } catch (e) {
      if (wasCalled) { return }
      this.reject(e)
    }
  }

  // FIXME resolve 只有在 resolveWith 里才能出现
  resolve(result) {
    if (this.state !== 'pending') {
      return // 保证了只调用一次onFulfilled
    }
    this.value = result
    this.state = 'fulfilled'
    this.emit()
  }

  reject(reason) {
    if (this.state !== 'pending') {
      // TODO 试试看这种方法行不行, 不行就只能用闭包的方式了
      return // 保证了只调用一次onRejected
    }
    this.value = reason
    this.state = 'rejected'
    this.emit()
  }

  then(onFulfilled, onRejected) {
    const nextPromise = new Promise(() => {})
    if (typeof onFulfilled === 'function') {
      onFulfilled.called = false
    }
    if (typeof onRejected === 'function') {
      onRejected.called = false
    }
    this.on.push({
      onFulfilled,
      onRejected,
      nextPromise
    })
    this.emit()
    return nextPromise
  }

  emit() {
    if (this.state === 'pending') { return }
    const onName = this.state == 'fulfilled' ? 'onFulfilled' : 'onRejected'
    const resolveOrReject =  this.state == 'fulfilled' ? 'resolveWith' : 'reject'
    nextTick(() => {
      this.on.forEach(listener => {
        const { nextPromise } = listener
        if (typeof listener[onName] === 'function') {
          if (listener[onName].called) {
            return
          }
          listener[onName].called = true
          let x
          try {
            x = listener[onName].call(undefined, this.value)
          } catch (e) {
            nextPromise.reject(e)
            return
          }
          nextPromise.resolveWith(x)
        } else {
          nextPromise[resolveOrReject](this.value)
        }
      })
    })
  }

  resolveWithSelf() {
    this.reject(new TypeError())
  }

  // 是 promise 的话就用resolve, 因为是promise的话一定有一个定下来的value
  resolveWithPromise(x) {
    x.then(this.resolve.bind(this), this.reject.bind(this))
  }

  resolveWithThenable(x) {
    let wasCalled = false
    try {
      // x.then(this.resolveWith.bind(this), this.reject.bind(this))
      x.then(
        function (y) {
          if (wasCalled) {
            return
          }
          wasCalled = true
          this.resolveWith(y)
        }.bind(this),
        function (r) {
          if (wasCalled) {
            return
          }
          wasCalled = true
          this.reject(r)
        }.bind(this)
      )
    } catch (e) {
      if (wasCalled) {
        return
      }
      this.reject(e)
    }
  }

  resolveWithObject(x) {
    let then
    try {
      then = x.then
    } catch (e) {
      this.reject(e)
      return
    }
    if (then instanceof Function) {
      this.resolveWithThenable(x)
    } else {
      this.resolve(x)
    }
  }
  resolveWith(x) {
    const nextPromise = this
    if (x === nextPromise) {
      nextPromise.resolveWithSelf()
    } else if (x instanceof Promise) {
      nextPromise.resolveWithPromise(x)
    } else if (x instanceof Object) {
      nextPromise.resolveWithObject(x)
    } else {
      nextPromise.resolve(x)
    }
  }

  static resolve(result) {
    return new Promise((resolve) => resolve(result))
  }

  static reject(reason) {
    return new Promise((resolve, reject) => reject(reason))
  }
}

module.exports = Promise
