const { assert } = require('chai')
const { Promise2: Promise } = require('../src/promise')

describe('Promise', () => {
  it('是一个类', () => {
    assert.isFunction(Promise)
    assert.isObject(Promise.prototype)
  })
})