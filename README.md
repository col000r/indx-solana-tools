A live version of this project is hosted at [INDX.at](https://indx.at/tools)\
For an NFT collection that was created with these tools, visit [Gusts of Wind](https://gustsofwind.com)

## INDX Solana Tools

Easy tools for working with the **Solana** blockchain. (Works with *devnet*, *testnet* and *mainnet*!)
* [Create Key-Pairs](https://indx.at/tools/keygen)
* [Create Tokens](https://indx.at/tools/tokens)
* [Create NFT collections](https://indx.at/tools/nfts)

- [x] Every individual tool is built as a progressive web app (NextJS) and runs in your local browser.
- [x] No secret keys ever leave your system. (They're only used to sign transactions)
- [x] The NFT page saves relevant data in localStorage so you can continue to work on the same project across sessions.

## Getting Started

### Install

```bash
yarn install
```

### Configure a private RPC

* Get a private RPC at [QuickNode](https://www.quicknode.com/) (or your local Solana RPC dealer).
* Open *next.config.js* 
* uncomment and fill in `PRIVATE_MAINNET_RPC: 'https://your-private-mainnet-rpc-url'` (requires a restart, if already running)

You only need to do this for *mainnet*. The public RPC only allows you to do the most basic stuff and will give you errors like "failed to get balance of account xyz", etc.


### Run for Development

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.


## Additional Info

* If the *Airdrop* button stops working, it's usually because you've used it too much. Try again in 24 hours. (Look at the browser console for error details)