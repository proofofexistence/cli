var crypto = require('crypto')
var colors = require('colors/safe')

var algo = 'sha256';
var shasum = crypto.createHash(algo);

// check for valid hash
function isValidSHA256(sha256) {
  var re = /\b^[A-Fa-f0-9]{64}$\b/
  return re.test(sha256)
}

// take a file or a hash, and returns a hash
function hashFile(input, callback) {
  var data = ''
  input.on('data', function(chunk) {
    data += chunk;
    shasum.update(chunk)
  })
  input.on('end', function() {
    const hash = shasum.digest('hex');
    console.log(colors.gray("File hash OK (sha256)"))
    callback(hash)
  })
}

module.exports = {
  isValidSHA256: isValidSHA256,
  hashFile: hashFile
}
