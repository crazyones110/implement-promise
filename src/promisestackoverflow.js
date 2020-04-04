function MyPromise(executor) {
  this.state = 'pending'
  this.value = undefined
  // A list of "clients" that need to be notified when a state
  //   change event occurs. These event-consumers are the promises
  //   that are returned by the calls to the `then` method.
  this.consumers = []
  executor(this.resolve.bind(this), this.reject.bind(this))
}

MyPromise.resolve = function(value) {
  return new MyPromise(resolve => resolve(value))
}
MyPromise.reject = function(reason) {
  return new MyPromise((resolve, reject) => reject(reason))
}

// 2.1.1.1: provide only two ways to transition
MyPromise.prototype.fulfill = function(value) {
  if (this.state !== 'pending') return // 2.1.2.1, 2.1.3.1: cannot transition anymore
  this.state = 'fulfilled' // 2.1.1.1: can transition
  this.value = value // 2.1.2.2: must have a value
  this.broadcast()
}

MyPromise.prototype.reject = function(reason) {
  if (this.state !== 'pending') return // 2.1.2.1, 2.1.3.1: cannot transition anymore
  this.state = 'rejected' // 2.1.1.1: can transition
  this.value = reason // 2.1.3.2: must have a reason
  this.broadcast()
}

// A promise’s then method accepts two arguments:
MyPromise.prototype.then = function(onFulfilled, onRejected) {
  var consumer = new MyPromise(function() {})
  // 2.2.1.1 ignore onFulfilled if not a function
  consumer.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null
  // 2.2.1.2 ignore onRejected if not a function
  consumer.onRejected = typeof onRejected === 'function' ? onRejected : null
  // 2.2.6.1, 2.2.6.2: .then() may be called multiple times on the same promise
  this.consumers.push(consumer)
  // It might be that the promise was already resolved...
  this.broadcast()
  // 2.2.7: .then() must return a promise
  return consumer
}

MyPromise.prototype.broadcast = function() {
  var promise = this
  // 2.2.2.1, 2.2.2.2, 2.2.3.1, 2.2.3.2 called after promise is resolved
  if (this.state === 'pending') return
  // 2.2.6.1, 2.2.6.2 all respective callbacks must execute
  var callbackName = this.state == 'fulfilled' ? 'onFulfilled' : 'onRejected'
  var resolver = this.state == 'fulfilled' ? 'resolve' : 'reject'
  // 2.2.4 onFulfilled/onRejected must be called asynchronously
  setTimeout(function() {
    // 2.2.6.1, 2.2.6.2 traverse in order, 2.2.2.3, 2.2.3.3 called only once
    promise.consumers.splice(0).forEach(function(consumer) {
      try {
        var callback = consumer[callbackName]
        // 2.2.1.1, 2.2.1.2 ignore callback if not a function, else
        // 2.2.5 call callback as plain function without context
        if (callback) {
          // 2.2.7.1. execute the Promise Resolution Procedure:
          consumer.resolve(callback(promise.value))
        } else {
          // 2.2.7.3 resolve in same way as current promise
          consumer[resolver](promise.value)
        }
      } catch (e) {
        // 2.2.7.2
        consumer.reject(e)
      }
    })
  })
}

// The Promise Resolution Procedure: will treat values that are thenables/promises
// and will eventually call either fulfill or reject/throw.
MyPromise.prototype.resolve = function(x) {
  var wasCalled, then
  // 2.3.1
  if (this === x) {
    throw new TypeError('Circular reference: promise value is promise itself')
  }
  // 2.3.2
  if (x instanceof MyPromise) {
    // 2.3.2.1, 2.3.2.2, 2.3.2.3
    x.then(this.resolve.bind(this), this.reject.bind(this))
  } else if (x === Object(x)) {
    // 2.3.3
    try {
      // 2.3.3.1
      then = x.then
      if (typeof then === 'function') {
        // 2.3.3.3
        then.call(
          x,
          function resolve(y) {
            // 2.3.3.3.3 don't allow multiple calls
            // 防止用户 resolve 两次
            if (wasCalled) return
            wasCalled = true
            // 2.3.3.3.1 recurse
            this.resolve(y)
          }.bind(this),
          function reject(reasonY) {
            // 2.3.3.3.3 don't allow multiple calls
            if (wasCalled) return
            wasCalled = true
            // 2.3.3.3.2
            this.reject(reasonY)
          }.bind(this)
        )
      } else {
        // 2.3.3.4
        this.fulfill(x)
      }
    } catch (e) {
      // 2.3.3.3.4.1 ignore if call was made
      if (wasCalled) return
      // 2.3.3.2 or 2.3.3.3.4.2
      this.reject(e)
    }
  } else {
    // 2.3.4
    this.fulfill(x)
  }
}

new MyPromise((resolve, reject) => {
  resolve(MyPromise.reject(MyPromise.reject(2333)))
}).then(null, innerPromise => {
  innerPromise.then(null, console.log)
})
// MyPromise.reject(2333).then(null, console.log)