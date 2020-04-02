const Promise = require('./promiseTeacher')

new Promise(resolve => {
  resolve(Promise.resolve(Promise.resolve(2333)))
}).then(num => console.log(num), num => console.log(num + 1))

// new Promise(resolve => {
//   // 不存在插队的情况呀, 因为函数执行先执行参数呀
//   resolve(new Promise((resolve, reject) => reject(2333)))
// }).then(num => console.log(num), num => console.log(num + 1))
