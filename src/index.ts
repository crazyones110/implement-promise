const promise = new Promise<number>(resolve => {
  resolve(3)
})
const promise2 = promise.then()
promise2.then(val => console.log(val))