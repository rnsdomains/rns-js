# rns-js

[![npm version](https://badge.fury.io/js/%40rsksmart%2Frns.svg)](https://badge.fury.io/js/%40rsksmart%2Frns)
[![CircleCI](https://circleci.com/gh/rnsdomains/rns-js.svg?style=svg)](https://circleci.com/gh/rnsdomains/rns-js)

RNS JavaScript library.

```
npm i web3 @rsksmart/rns
```

## Basic usage

Instance de library:

```javascript
import Web3 from 'web3'
import RNS from '@rsksmart/rns'

const web3 = new Web3('https://public-node.rsk.co')
const rns = new RNS(web3)
```

Get an address:
```javascript
rns.addr('testing.rsk').then(console.log)
```

Get Bitcoin address:
```javascript
rns.addr('testing.rsk', '0x80000000')
```

Check if `example.testing.rsk` subdomain is available:
```javascript
rns.isSubdomainAvailable('testing.rsk', 'example')
```

## Advanced usage

Use Web3 `Contract` directly

```javascript
async function myCustomGetOwner(domain) {
  const web3 = new Web3('https://public-node.rsk.co')
  const rns = new RNS(web3)

  await rns.compose()

  const owner = await rns.contracts.registry.methods.owner(domain).call()

  return owner;
}
```

## Run for development

Install dependencies:

```
git clone git@github.com:rnsdomains/rns-js.git
cd rns-js
npm i
```

Run tests:

```
npm test
```

Try out your development, create a testing project:

```
# in rns-js folder
npm run build
npm link
cd ..
mkdir rns-js-test
cd rns-js-test
npm init
npm i web3
npm link @rsksmart/rns
```

## Versioning

- `master` branch point to latest release.
- `develop` branch contains changes that will apply next release. The first commit after release bumps to next version.
- Other branches (feature branches) point to `develop`.

Find releases scopes in [milestones](https://github.com/rnsdomains/rns-js/milestones)
