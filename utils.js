// cehck for valid hash
function isValidSHA256(sha256) {
  var re = /\b^[A-Fa-f0-9]{64}$\b/
  return re.test(sha256)
}

module.exports = {
  isValidSHA256: isValidSHA256
}
