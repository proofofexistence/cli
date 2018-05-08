#!/usr/bin/env node --harmony
var fs = require('fs')
var minimist = require('minimist')
var colors = require('colors/safe')

const btcConvert = require('bitcoin-convert')

const utils = require('./utils')
const APIClient = require('./client')
const logger = require('./logger')

var argv = minimist(process.argv, {
  alias: {
    v: 'version',
    h: 'host',
    p: 'port',
    n: 'network',
    vv: 'verbose'
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

// connect to API
var api = new APIClient({baseUrl:url});

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
    '  --host,-h           URL of the proofx instance\n' +
    '  --port,-p           Port where proofx is running\n' +
    '  --verbose,-vv       Print out more logs\n' +
    '  --version,-v        Print out the installed version\n' +
    '  --help              Show this help\n'
  )
  process.exit(1)
}

// check if is a hash
if (utils.isValidSHA256(filename)) { // read existing hash
  console.log(colors.gray("Recognized an existing hash (sha256)"))
  register(filename)
} else if (filename === '-' || !filename) { // read from stdin
  utils.hashFile(process.stdin, function(hash) {
    register(hash);
  })
} else if (fs.existsSync(filename)) { // read data from file
  utils.hashFile(fs.createReadStream(filename), function(hash) {
    register(hash);
  })
} else { // error
  console.error(colors.red('Sorry, file: %s does not exist'), filename)
  process.exit(2)
}

function register(sha256) {
  if (!utils.isValidSHA256(sha256)) {
    console.error(colors.red('Please pass a valid hash.'))
    process.exit(0)
  }

  logger.debug(sha256)
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
          colors.green('New document registered!')
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
          colors.yellow('This document exists in our registery\n')
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
        colors.green('The existence of this document is already confirmed.\n')
        +
        `The transaction id is ${colors.green(tx)} in the block ${blockstamp}.`
       )
      break;
    default:

  }
}
