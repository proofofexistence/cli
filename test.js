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

describe('Hash Stream', function() {
  it('should reliably hash a file stream', function(){
    var mockedStream = new require('stream').Readable();
    mockedStream._read = function(size) { /* do nothing */ };

    utils.hashFile(mockedStream, function(hash){
      assert.equal(utils.isValidSHA256(hash), true)
      assert.equal(hash, "2609c7c28788898a337c063ff1c3b92275832bddeda014a790d109fad3ba85e2")
    })

    mockedStream.emit('data', 'simple text');
    mockedStream.emit('end');
  })

})
