var assert = require('assert');
const utils = require('./utils')


describe('Validate Hash', function() {
  const validHash = "fa3646680587863650b75be0adc4c8aa9ba2c2b84100331b77b1b125272cf9a6"

  it('should recognize a valid hash from unvalid ones', function(){
    assert.equal(utils.isValidSHA256(validHash), true);
    assert.equal(utils.isValidSHA256("blabla"), false);
  });

  it('should not consider hash inside a larger string as valid', function(){
    assert.equal(utils.isValidSHA256(`bla${validHash}`), false);
  });

  it('should not be case sensitive', function(){
    assert.equal(utils.isValidSHA256(validHash.toUpperCase()), true);
  });
});
