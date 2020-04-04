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
    // this.onFulfilled = []
    // this.onRejected = []
    // this.promise2 = []
    this.callback = {
      onFulfilled: [],
      onRejected: [],
      promise2: []
    }
    // [{onFulfilled, onRejected, nextPromise}, {onFulfilled, onRejected, nextPromise}]
    this.on = [] // TODO 修改数组定义
    this.value = undefined
    if (typeof fn !== 'function') {
      throw new Error('构造函数里必须传一个函数')
      return
    }
    // FIXME 这里是 resolveWith
    fn(this.resolve.bind(this), this.reject.bind(this))
  }

  handleResult(result) {
    if (result instanceof Promise) {
      result.then(
        y => {
          this.state === 'fulfilled'
          if (y instanceof Promise) {
            // y 可能又是一个 promise
            this.handleResult(y)
          } else {
            this.value = y
          }
        },
        r => {
          this.value = r
          this.state = 'rejected'
        }
      )
    }
  }

  // FIXME resolve 只有在 resolveWith 里才能出现
  resolve(result) {
    if (this.state !== 'pending') {
      return // 保证了只调用一次onFulfilled
    }
    this.value = result
    this.state = 'fulfilled'

    if (result instanceof Promise) {
      this.handleResult(result)
    }

    // 保证了在 resolve 以及同步代码之后调用
    nextTick(() => {
      if (this.state === 'fulfilled') {
        // 遍历callbak, 调用所有的 onFulfilled
        // FIXME on 改了所以, 这里的遍历方式也得改
        this.callback.onFulfilled.forEach((resolveHandler, index) => {
          //#region
          // if (typeof resolveHandler === 'function') {
          //   // let x
          //   try {
          //     // 这里的 result 需要进行处理
          //     if (result === this) {
          //       this.reject(new TypeError())
          //     } else if (result instanceof Promise) {
          //       console.log('应该进入这里才对')
          //       console.log('-------------')
          //       result.then(
          //         y => {
          //           x = resolveHandler.call(undefined, y)
          //         },
          //         r => {
          //           x = this.callback.onRejected[index].call(undefined, r)
          //           // x = resolveHandler.call(undefined, r)
          //         }
          //       )
          //     } else if (result instanceof Object) {
          //       let then
          //       try {
          //         then = result.then
          //       } catch (e) {
          //         this.reject(e)
          //         return
          //       }
          //       if (then instanceof Function) {
          //         // this.resolveWithThenable(result)
          //         try {
          //           result.then(
          //             y => {
          //               x = resolveHandler.call(undefined, y)
          //             },
          //             r => {
          //               x = resolveHandler.call(undefined, r)
          //             }
          //           )
          //         } catch (e) {
          //           this.reject(e)
          //         }
          //       } else {
          //         x = resolveHandler.call(undefined, result)
          //       }
          //     } else {
          //       x = resolveHandler.call(undefined, result)
          //     }
          //   } catch (e) {
          //     this.callback.promise2[index].reject(e)
          //     return
          //   }
          //   this.callback.promise2[index].resolveWith(x)
          // } else {
          //   this.callback.promise2[index].resolveWith(result)
          // }
          //#endregion
          if (typeof resolveHandler === 'function') {
            let x
            try {
              x = resolveHandler.call(undefined, this.value)
            } catch (e) {
              this.callback.promise2[index].reject(e)
              return
            }
            this.callback.promise2[index].resolveWith(x)
          } else {
            this.callback.promise2[index].resolve(this.value)
          }
        })
        return
      }
      if (this.state === 'rejected') {
        // FIXME on 改了所以, 这里的遍历方式也得改
        this.callback.onRejected.forEach((rejectHandler, index) => {
          if (typeof rejectHandler === 'function') {
            let x
            try {
              x = rejectHandler.call(undefined, this.value)
            } catch (e) {
              this.callback.promise2[index].reject(e)
              return
            }
            this.callback.promise2[index].resolveWith(x)
          } else {
            this.callback.promise2[index].reject(this.value)
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
      this.callback.onRejected.forEach((rejectHandler, index) => {
        if (typeof rejectHandler === 'function') {
          let x
          try {
            x = rejectHandler.call(undefined, reason)
          } catch (e) {
            this.callback.promise2[index].reject(e)
            return
          }
          this.callback.promise2[index].resolveWith(x)
        } else {
          this.callback.promise2[index].reject(reason)
        }
      })
    })
  }

  then(onFulfilled, onRejected) {
    const nextPromise = new Promise(() => {})
    // TODO 其实 then 做的事情和 resolve 和 reject 做的事情是一样的, 只不过是加了个判断
    nextTick(() => {
      if (this.state === 'fulfilled') {
        if (typeof onFulfilled === 'function') {
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
      // 运行到这里说明 state 是 pending
      this.callback.onFulfilled.push(onFulfilled)
      this.callback.onRejected.push(onRejected)
      this.callback.promise2.push(nextPromise)
      // nextPromise 必须和 onFulfilled 和 onRejected 一一对应
      // 因为有可能出现这样的代码 new Promise(resolve => resolve(3)).then().then(num => console.log(num))
      return nextPromise

    })
    return nextPromise
  }

  resolveWithSelf() {
    this.reject(new TypeError())
  }

  resolveWithPromise(x) {
    x.then(
      result => {
        this.resolve(result)
      },
      reason => {
        this.reject(reason)
      }
    )
  }

  resolveWithThenable(x) {
    try {
      // x.then(
      //   y => {
      //     promise2.resolveWith(y)
      //   },
      //   r => {
      //     promise2.reject(r)
      //   }
      // )
      x.then(this.resolveWith.bind(this), this.reject.bind(this))
    } catch (e) {
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
    const promise2 = this
    if (x === promise2) {
      promise2.resolveWithSelf()
    } else if (x instanceof Promise) {
      promise2.resolveWithPromise(x)
    } else if (x instanceof Object) {
      promise2.resolveWithObject(x)
    } else {
      promise2.resolve(x)
    }
  }

  static resolve(result) {
    return new Promise(resolve => resolve(result))
  }

  static reject(reason) {
    return new Promise((resolve, reject) => reject(reason))
  }
}

module.exports = Promise
