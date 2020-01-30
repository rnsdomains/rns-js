# rns-js
RNS JavaScript library.

```
npm i web3 @rsksmart/rns
```

## Basic usage

```javascript
import Web3 from 'web3'
import RNS from '@rsksmart/rns'

const web3 = new Web3('https://public-node.rsk.co')
const rns = new RNS(web3)

rns.addr('domain.rsk').then(console.log)
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
