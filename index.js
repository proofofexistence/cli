#!/usr/bin/env node --harmony
var fs = require('fs')
var minimist = require('minimist')
var crypto = require('crypto')
var colors = require('colors/safe')
const btcConvert = require('bitcoin-convert')

var APIClient = require('./client')
const logger = require('./logger')

var argv = minimist(process.argv, {
  alias: {
    v: 'version',
    h: 'host',
    p: 'port',
    n: 'network',
    vv: 'verbose',
    u: 'update'
  },
  default: {
    p: null,
    h: 'http://proofofexistence.com',
    n: 'testnet'
  },
  boolean: ['version', 'help', 'verbose']
})


const version = require('./package').version
const filename = argv._[2]
const url = `${argv.host}${argv.port ? ":" + argv.port : ''}`

if (argv.verbose) {
    logger.level('debug')
}

console.log(colors.white("Proof of Existence - Verify your documents"))

if (argv.version) {
  console.log(version)
  process.exit(0)
}

if (argv.help || (process.stdin.isTTY && !filename)) {
  console.error(
    'Usage: proofx [filename] [options]\n\n' +
    '  --update,-u         Fetch latest status from the blockchain\n' +
    '  --host,-h           URL of the proofx instance\n' +
    '  --port,-p           Port where proofx is running\n' +
    '  --verbose,-vv       Print out more logs\n' +
    '  --version,-v        Print out the installed version\n' +
    '  --help              Show this help\n'
  )
  process.exit(1)
}

// get data from file or pipe
var input
var algo = 'sha256';
var shasum = crypto.createHash(algo);

if (filename === '-' || !filename) {
  input = process.stdin
} else if (fs.existsSync(filename)) {
  console.error(colors.gray('Hashing content from file: %s'), filename)
  input = fs.createReadStream(filename)
} else {
  console.error(colors.red('Sorry, file: %s does not exist'), filename)
  process.exit(2)
}

var data = ''
input.on('data', function(chunk) {
  data += chunk;
  shasum.update(chunk)
})
input.on('end', function() {
  const hash = shasum.digest('hex');
  console.log(colors.green("Hash OK (sha256)"))
  logger.debug(hash)
  register(hash)
})

function isValidSHA256(sha256) {
  var re = /\b[A-Fa-f0-9]{64}\b/
  return re.test(sha256)
}

// connect to API
var api = new APIClient({baseUrl:url});

function register(sha256) {
  if (!isValidSHA256(sha256)) {
    console.log(colors.red('Please pass a valid hash.'))
    process.exit(0)
  }

  console.log(colors.gray(`Connection to ${url}...\n`))

  api.register(sha256,
    resp => {
      const {success, reason} = resp

      if (success) { // new record
        const {
          pay_address,
          price
        } = resp

        console.log(
          colors.green('New file registered!')
        )

        showStatus(
          Object.assign({},
            resp,
            {
              status: "paymentRequired",
              payment_address: pay_address
            }
          ))

      } else if (success === false && reason === 'existing') { // record already exist in local DB

        console.log(
          colors.yellow('This file exists in our registery\n')
        )

        // update by default
        api.updateStatus(sha256,
          resp => showStatus(resp)
        )

      }
    },
    err => console.log(err)
  )
}

function showStatus(resp) {
  const {
    payment_address,
    price,
    pending,
    tx,
    txstamp,
    blockstamp,
    status
  } = resp

  const mBTCPrice = btcConvert(price, 'Satoshi', 'mBTC')

  switch (status) {
    case "paymentRequired":
      console.log(
           `Please pay the fee for the certification to continue\nSend ${colors.green(mBTCPrice+ ' mBTC')} to ${colors.green(payment_address)}
           `
       )
      break;
    case "confirming":
      console.log(
        colors.green(
          `Congrats! The transaction has been succesfully recorded.\n`
        )
        +
        `\nNow we just need to wait for the block to be confirmed by the miners.\nYour transaction id is ${colors.green(tx)}.\nCheck progresses at http://insight.proofofexistence.com/tx/${tx}`

       )
      break;
    case "confirmed":
      console.log(
         `This document is already confirmed. The transaction id is ${tx} in the block ${blockstamp}.`
       )
      break;
    default:

  }
}
