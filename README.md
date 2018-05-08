# Proof of Existence CLI

A simple way to register your documents on the BTC blockchain using [http://proofofexistence.com](http://proofofexistence.com).

```
proofx
Usage: proofx [filename] [options]

  --host,-h           URL of the proofx instance
  --port,-p           Port where proofx is running
  --verbose,-vv       Print out more logs
  --version,-v        Print out the installed version
  --help              Show this help
```

### Install

```
npm -g install proofofexistence-cli
```

### Usage examples

Register a file
```
$ proofx myfile
```

Check an existing hash
```
proofx fa3646680587863650b75be0adc4c8aa9ba2c2b84100331b77b1b125272cf9a6
```

Pipe file from stdin
```
$ cat myfile | proofx
```

Use your local instance running at http://localhost:3003
```
proofx myfile -h http://localhost -p 3003
```

See the version number
```
proofx --version
```
