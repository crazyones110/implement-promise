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

    // if (result instanceof Promise) {
    //   this.handleResult(result)
    // }

    // 保证了在 resolve 以及同步代码之后调用
    nextTick(() => {
      if (this.state === 'fulfilled') {
        // 遍历callbak, 调用所有的 onFulfilled
        // FIXME on 改了所以, 这里的遍历方式也得改
        this.on.forEach(({ onFulfilled, onRejected, nextPromise }) => {
          if (typeof onFulfilled === 'function') {
            if (onFulfilled.called) {
              return
            }
            onFulfilled.called = true
            let x
            try {
              x = onFulfilled.call(undefined, this.value)
            } catch (e) {
              nextPromise.reject(e)
              return
            }
            nextPromise.resolveWith(x)
          } else {
            nextPromise.resolveWith(this.value)
          }
        })
        return
      }
      if (this.state === 'rejected') {
        // FIXME on 改了所以, 这里的遍历方式也得改
        this.on.forEach(({ onFulfilled, onRejected, nextPromise }) => {
          if (typeof onRejected === 'function') {
            if (onRejected.called) {
              return
            }
            onRejected.called = true
            let x
            try {
              x = onRejected.call(undefined, this.value)
            } catch (e) {
              nextPromise.reject(e)
              return
            }
            nextPromise.resolveWith(x)
          } else {
            nextPromise.reject(this.value)
          }
        })
      }
    })
  }

  reject(reason) {
    if (this.state !== 'pending') {
      // TODO 试试看这种方法行不行, 不行就只能用闭包的方式了
      return // 保证了只调用一次onRejected
    }
    this.value = reason
    this.state = 'rejected'
    // 保证了在 reject 以及同步代码之后调用
    nextTick(() => {
      this.on.forEach(({ onFulfilled, onRejected, nextPromise }) => {
        if (typeof onRejected === 'function') {
          if (onRejected.called) {
            return
          }
          onRejected.called = true
          let x
          try {
            x = onRejected.call(undefined, this.value)
          } catch (e) {
            nextPromise.reject(e)
            return
          }
          nextPromise.resolveWith(x)
        } else {
          nextPromise.reject(this.value)
        }
      })
    })
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
      nextPromise,
    })
    // TODO 其实 then 做的事情和 resolve 和 reject 做的事情是一样的, 只不过是加了个判断
    // TODO 不使用splice(0)方法的话就一定要加标记, 加标记的话遍历on数组或者只调用自己的都可以
    nextTick(() => {
      if (this.state === 'fulfilled') {
        if (typeof onFulfilled === 'function') {
          if (onFulfilled.called) {
            return
          }
          onFulfilled.called = true
          let x
          try {
            x = onFulfilled.call(undefined, this.value)
          } catch (e) {
            nextPromise.reject(e)
            return
          }
          nextPromise.resolveWith(x)
        } else {
          nextPromise.resolve(this.value)
        }
        return
      }
      if (this.state === 'rejected') {
        nextTick(() => {
          if (typeof onRejected === 'function') {
            if (onRejected.called) {
              return
            }
            onRejected.called = true
            let x
            try {
              x = onRejected.call(undefined, this.value)
            } catch (e) {
              nextPromise.reject(e)
              return
            }
            nextPromise.resolveWith(x)
          } else {
            nextPromise.reject(this.value)
          }
        })
        return
      }
      // nextPromise 必须和 onFulfilled 和 onRejected 一一对应
      // 因为有可能出现这样的代码 new Promise(resolve => resolve(3)).then().then(num => console.log(num))
      return nextPromise
    })
    return nextPromise
  }

  resolveWithSelf() {
    this.reject(new TypeError())
  }

  // 是 promise 的话就用resolve, 因为是promise的话一定有一个定下来的value
  resolveWithPromise(x) {
    // x.then(
    //   result => {
    //     this.resolve(result)
    //   },
    //   reason => {
    //     this.reject(reason)
    //   }
    // )
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
