import './App.css';
import { useState } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import {
  Program, Provider, web3
} from '@project-serum/anchor';

import * as anchor from '@project-serum/anchor';

import * as spl from '@solana/spl-token';

import idl from './myidl.json';

import { getPhantomWallet } from '@solana/wallet-adapter-wallets';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';



const wallets = [
  /* view list of available wallets at https://github.com/solana-labs/wallet-adapter#wallets */
  getPhantomWallet()
]

const { SystemProgram, Keypair } = web3;
/* create an account  */
const baseAccount = Keypair.generate();
const opts = {
  preflightCommitment: "processed"
}
const programID = new PublicKey(idl.metadata.address);

function App() {
  const [value, setValue] = useState(null);
  const wallet = useWallet();

  async function getProvider() {
    /* create the provider and return it to the caller */
    /* network set to local network for now */
    const network = "https://api.devnet.solana.com";
    const connection = new Connection(network, opts.preflightCommitment);

    const provider = new Provider(
      connection, wallet, opts.preflightCommitment,
    );
    return provider;
  }

  // async function createCounter() {    
  //   const provider = await getProvider()
  //   /* create the program interface combining the idl, program ID, and provider */
  //   const program = new Program(idl, programID, provider);
  //   try {
  //     /* interact with the program via rpc */
  //     await program.rpc.create({
  //       accounts: {
  //         baseAccount: baseAccount.publicKey,
  //         user: provider.wallet.publicKey,
  //         systemProgram: SystemProgram.programId,
  //       },
  //       signers: [baseAccount]
  //     });

  //     const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  //     console.log('account: ', account);
  //     setValue(account.count.toString());
  //   } catch (err) {
  //     console.log("Transaction error: ", err);
  //   }
  // }

  async function initializeContract() {    
    const provider = await getProvider()

    /* create the program interface combining the idl, program ID, and provider */
    const program = new Program(idl, programID, provider);

    console.log(program.provider.wallet);
    console.log(wallet);

    console.log(wallet.publicKey.toString());
    console.log(program.provider.wallet.publicKey.toString());
   
    try {
      const [mint, mintBump] = await anchor.web3.PublicKey.findProgramAddress([Buffer.from("mint")], program.programId);
      const [mintAuthority, mintAuthorityBump] = await anchor.web3.PublicKey.findProgramAddress([Buffer.from("mint-authority")], program.programId);
      /* interact with the program via rpc */

      console.log(mint)
      console.log(mintAuthority)
      console.log("Logging SPL")
      console.log(spl)
      
      const tx = await program.rpc.initialize(mintBump, mintAuthorityBump, {
        accounts: {
          //mint: mint.publicKey,
          mint: mint,
          wallet: program.provider.wallet.publicKey,
          mintAuthority: mintAuthority,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: spl.TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY
        }
        //instruction: []
        //signers: [mint]
      });
      console.log("TX is ");
      console.log(tx);
      // const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
      // console.log('account: ', account);
      // setValue(account.count.toString());
    } catch (err) {
       console.log("Transaction error: ", err);
    }
  }

  async function increment() {
    const provider = await getProvider();
    const program = new Program(idl, programID, provider);
    await program.rpc.increment({
      accounts: {
        baseAccount: baseAccount.publicKey
      }
    });

    const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    console.log('account: ', account);
    setValue(account.count.toString());
  }

  if (!wallet.connected) {
    /* If the user's wallet is not connected, display connect wallet button. */
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop:'100px' }}>
        <WalletMultiButton />
      </div>
    )
  } else {
    return (
      <div className="App">
        <div>
          {
            !value && (<button onClick={initializeContract}>Create counter</button>)
          }
          {
            value && <button onClick={increment}>Increment counter</button>
          }

          {
            value && value >= Number(0) ? (
              <h2>{value}</h2>
            ) : (
              <h3>Please create the counter.</h3>
            )
          }
        </div>
      </div>
    );
  }
}

const AppWithProvider = () => (
  <ConnectionProvider endpoint="https://api.devnet.solana.com">
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <App />
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
)

export default AppWithProvider;