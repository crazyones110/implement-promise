const Promise = require('./promiseTeacher')

// new Promise(resolve => {
//   resolve(Promise.resolve(Promise.resolve(2333)))
// }).then(num => console.log(num), num => console.log(num + 1))

new Promise(resolve => {
  // 不存在插队的情况呀, 因为函数执行先执行参数呀
  resolve(Promise.reject(2333))
}).then(null, num => {
  console.log(num)
}).then(num => console.log(num))

// const promise = new Promise(resolve => resolve(2333))
// promise.then(num => console.log(num))
// console.log('--------')

// const promise = new Promise((resolve, reject) => reject(2333))
// console.log(promise)
// promise.then(null, num => console.log(num))
// console.log('--------')

var promise = new Promise(resolve => resolve(2333))
queueMicrotask(() => {
  promise.then(console.log)
})