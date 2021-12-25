import './App.css';
import { useState } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import * as web3sol from '@solana/web3.js';
import {
  Program, Provider, web3
} from '@project-serum/anchor';

import * as anchor from '@project-serum/anchor';

import * as spl from '@solana/spl-token';

import idl from './myidl.json';
import accountsJson from './accounts.json';

import { getPhantomWallet } from '@solana/wallet-adapter-wallets';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { min } from 'bn.js';
import { copyFileSync } from 'fs';
import { off } from 'process';
import { token } from '@project-serum/anchor/dist/cjs/utils';


let pdaRentAddress = new anchor.web3.PublicKey(accountsJson.config.pda_rent_account);
let marketPlace = new anchor.web3.PublicKey(accountsJson.config.marketplace_revenue_address);
let creator0 = new anchor.web3.PublicKey(accountsJson.nft.creator0);
let creator1 = new anchor.web3.PublicKey(accountsJson.nft.creator1);

let creator2 = new anchor.web3.PublicKey(accountsJson.nft.creator2);
let creator3 = new anchor.web3.PublicKey(accountsJson.nft.creator3);
let creator4 = new anchor.web3.PublicKey(accountsJson.nft.creator4);
let offer_price = parseFloat(accountsJson.nft.offer_price);

let offervalid = new anchor.BN(parseInt(accountsJson.nft.offer_valid));

let initializer = new anchor.web3.PublicKey(accountsJson.config.contract_initializer);

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
//console.log('address of program', programID.toString());

//let offer = anchor.web3.Keypair.generate();
let offerMk = new anchor.web3.PublicKey(accountsJson.nft.maker);


let nftPubKey = new anchor.web3.PublicKey(accountsJson.nft.mint);

let TOKEN_METADATA_PROGRAM_ID  = new anchor.web3.PublicKey(accountsJson.config.token_metadata_program);

function App() {
  const [supply, setSupply] = useState(null);
  const [price, setPrice] = useState(null);
  const [number, setNumber] = useState(1);
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

  async function initContract() {
    const provider = await getProvider();
    const program = new Program(idl, programID, provider);
    console.log(program.programId.toString())

    console.log(program.provider);



    console.log('wallet ', program.provider.wallet.publicKey.toString());

    const [dataAccAddress, dataAccAddressBump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("data")],
      program.programId
    );

    console.log("DATAACC ADDRESS is", dataAccAddress.toString());
    const [backupdataAccAddress, backupdataAccAddressBump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("backup_data")],
      program.programId
    );
    const accounts = {
      dataAcc: dataAccAddress,
      backupDataAcc: backupdataAccAddress,
      payer: program.provider.wallet.publicKey,
      beneficiary: marketPlace,
      tokenProgram:spl.TOKEN_PROGRAM_ID,
      systemProgram:anchor.web3.SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      pdaRentAccount: pdaRentAddress
    }

    let mkCut =  new anchor.BN(25);

    console.log("LOGGING DICT", accounts.dataAcc.toString());

    const tx = await program.rpc.new(dataAccAddressBump,  mkCut, {
      accounts: accounts,
      signers: []
    })

    console.log(tx);

  }

  async function updatePda() {
    const provider = await getProvider();
    const program = new Program(idl, programID, provider);
    console.log(program.programId.toString())

    console.log(program.provider);


    console.log('wallet ', program.provider.wallet.publicKey.toString());

    const [dataAccAddress, dataAccAddressBump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("data")],
      program.programId
    );
    const [backupdataAccAddress, backupdataAccAddressBump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("backup_data")],
      program.programId
    );

    const accounts = {
      dataAcc: dataAccAddress,
      backupdataAccAddress: backupdataAccAddress,
      payer: program.provider.wallet.publicKey,
      tokenProgram:spl.TOKEN_PROGRAM_ID,
      systemProgram:anchor.web3.SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      pdaRent: new anchor.web3.PublicKey(accountsJson.config.pda_rent),
      initializer: initializer,
    }

    const tx = await program.rpc.updatePda({
      accounts: accounts,
      signers: []
    })

    console.log(tx);

  }

  async function makeOfferForNft() {

    const provider = await getProvider();
    const program = new Program(idl, programID, provider);
    console.log(program.programId.toString())

    console.log(program.provider);

    
    console.log('wallet ', program.provider.wallet.publicKey.toString())

   
    
    let NFTTokenMint = nftPubKey;
    let NFTTokenAccount = await spl.Token.getAssociatedTokenAddress(
      spl.ASSOCIATED_TOKEN_PROGRAM_ID,
      spl.TOKEN_PROGRAM_ID,
      NFTTokenMint,
      program.provider.wallet.publicKey,
    );
    let offervalid = new anchor.BN(1639899829);
    let offer_valid_buffer = offervalid.toArrayLike(Buffer, 'be', 8);
    console.log(offer_valid_buffer)
    console.log(program.provider.wallet.publicKey.toBuffer());

    const [offerBufferAddress, offerBufferAddressBump] = await anchor.web3.PublicKey.findProgramAddress(
      [program.provider.wallet.publicKey.toBuffer(), NFTTokenMint.toBuffer(), offervalid.toArrayLike(Buffer, 'be', 8)],
      program.programId
    );
    

    const [dataAccAddress, dataAccAddressBump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("data")],
      program.programId
    );

    console.log("Offer BUffer Address is", offerBufferAddress.toString())

    offerMk = program.provider.wallet.publicKey;
    const accounts = {
      offer:offerBufferAddress,
      offerMaker: program.provider.wallet.publicKey,
      nftMint: NFTTokenMint,
      offerMakersNftAccount:NFTTokenAccount,
      dataAcc: dataAccAddress,

      tokenProgram:spl.TOKEN_PROGRAM_ID,
      systemProgram:anchor.web3.SystemProgram.programId,
      associatedTokenProgram:spl.ASSOCIATED_TOKEN_PROGRAM_ID,
      rent:anchor.web3.SYSVAR_RENT_PUBKEY,
      clock:anchor.web3.SYSVAR_CLOCK_PUBKEY,
    }



    let offerAmount =  new anchor.BN(offer_price * 10 ** 9);

    console.log("offervalid is", offervalid.toString());

    const tx = await program.rpc.makeOfferForNft(offerBufferAddressBump, offervalid, offerAmount, {
      accounts: accounts,
      signers: []
    })
    console.log(tx);

  }

  async function AcceptOffer() {

    const provider = await getProvider();
    const program = new Program(idl, programID, provider);
    console.log(program.programId.toString())

    console.log(program.provider);


    console.log('wallet ', program.provider.wallet.publicKey.toString())

 
    let NFTTokenMint = nftPubKey;
    let NFTTokenAccount = await spl.Token.getAssociatedTokenAddress(
      spl.ASSOCIATED_TOKEN_PROGRAM_ID,
      spl.TOKEN_PROGRAM_ID,
      NFTTokenMint,
      program.provider.wallet.publicKey,
    );
    
  
    let OfferMakerNFTTokenAccount = await spl.Token.getAssociatedTokenAddress(
      spl.ASSOCIATED_TOKEN_PROGRAM_ID,
      spl.TOKEN_PROGRAM_ID,
      NFTTokenMint,
      offerMk,
    );
    console.log("Offer Taker NFT Account ATA", NFTTokenAccount.toString());
    console.log("Offer Maker ATA", OfferMakerNFTTokenAccount.toString());
      let temp = offerMk;
    const [offerBufferAddress, offerBufferAddressBump] = await anchor.web3.PublicKey.findProgramAddress(
      [temp.toBuffer(), NFTTokenMint.toBuffer(), offervalid.toArrayLike(Buffer, 'be', 8)],
      program.programId
    );

    const [stickBufferAddress, stickBufferAddressBump] = await anchor.web3.PublicKey.findProgramAddress(
      [temp.toBuffer(), NFTTokenMint.toBuffer(), program.provider.wallet.publicKey.toBuffer(), offervalid.toArrayLike(Buffer, 'be', 8)],
      program.programId
    );

    console.log("Offer BUffer Address is", offerBufferAddress.toString())
  

  
    const [metaDataAcc, metaDataAccBump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        NFTTokenMint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );
    console.log("metaDataAcc is", metaDataAcc.toString());
    let info = await program.provider.connection.getAccountInfo(metaDataAcc);
    console.log("IInfo is", info);

    const [dataAccAddress, dataAccAddressBump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("data")],
      program.programId
    );

    console.log("OfferTakers NFT Token is", NFTTokenAccount.toString());
    console.log("OfferMakrsNftAccount is ", OfferMakerNFTTokenAccount.toString())


    const accounts = {
      offer:offerBufferAddress,
      stick:stickBufferAddress,
      nftMint:NFTTokenMint,
      offerMaker:offerMk,
      offerTaker: program.provider.wallet.publicKey,
      offerTakersNftToken:NFTTokenAccount,
      offerMakersNftAccount:OfferMakerNFTTokenAccount,
      associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
      tokenMetadataAccount: metaDataAcc,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      marketMaker:marketPlace,
      tokenProgram:spl.TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      clock:anchor.web3.SYSVAR_CLOCK_PUBKEY,
   
     
      dataAcc: dataAccAddress,
      creator0: creator0,
      creator1: creator1,
      creator2: creator2,
      creator3: creator3,
      creator4: creator4,
    }
    //console.log(accounts.rent.toString(), accounts.tokenProgram.toString(), accounts.systemProgram.toString(), accounts.associatedTokenProgram.toString());

    const tx = await program.rpc.accept( offerBufferAddressBump, stickBufferAddressBump, dataAccAddressBump, offervalid, {
      accounts: accounts,
      signers: []
    });
    console.log(tx);

    // while ((await program.provider.connection.getSignatureStatus(tx)).value.confirmations === 0) {
    //   // console.log('sign status', await program.provider.connection.getSignatureStatus(tx1));
    // }



    // const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    // console.log('account: ', account);
    // setValue(account.count.toString());
  }

  async function CancelOffer() {

    const provider = await getProvider();
    const program = new Program(idl, programID, provider);
    console.log(program.programId.toString())

    console.log(program.provider);


    console.log('wallet ', program.provider.wallet.publicKey.toString())

    const idk = await program.account.offer.all();
    console.log(idk);


    let NFTTokenMint = nftPubKey;
    let NFTTokenAccount = await spl.Token.getAssociatedTokenAddress(
      spl.ASSOCIATED_TOKEN_PROGRAM_ID,
      spl.TOKEN_PROGRAM_ID,
      NFTTokenMint,
      program.provider.wallet.publicKey,
    );

    let offerMakerAccount = new anchor.web3.PublicKey(accountsJson.nft.maker);
    const [offerBufferAddress, offerBufferAddressBump] = await anchor.web3.PublicKey.findProgramAddress(
      [offerMakerAccount.toBuffer(), NFTTokenMint.toBuffer()],
      program.programId
    );

    console.log("Offer BUffer Address is", offerBufferAddress.toString())
    



    const [dataAccAddress, dataAccAddressBump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("data")],
      program.programId
    );


    const accounts = {
      offer:offerBufferAddress,
      offerMaker: offerMk,
      nftMint: NFTTokenMint,
      associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
      tokenProgram:spl.TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      dataAcc: dataAccAddress,
      clock:anchor.web3.SYSVAR_CLOCK_PUBKEY,
    }
    //console.log(accounts.rent.toString(), accounts.tokenProgram.toString(), accounts.systemProgram.toString(), accounts.associatedTokenProgram.toString());
    const tx = await program.rpc.cancel( offerBufferAddressBump, offervalid, {
      accounts: accounts,
      signers: []
    });
    console.log(tx);

    // while ((await program.provider.connection.getSignatureStatus(tx)).value.confirmations === 0) {
    //   // console.log('sign status', await program.provider.connection.getSignatureStatus(tx1));
    // }



    // const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    // console.log('account: ', account);
    // setValue(account.count.toString());
  }






  async function ClosePDA() {

    const provider = await getProvider();
    const program = new Program(idl, programID, provider);
    console.log(program.programId.toString())

    console.log(program.provider);


    console.log('wallet ', program.provider.wallet.publicKey.toString())

    const idk = await program.account.offer.all();
    console.log(idk);

    let offer = idk[0];
    // offer.account.maker;


    let NFTTokenMint = new anchor.web3.PublicKey(offer.account.mint);
    let offerMakerAccount = new anchor.web3.PublicKey(offer.account.maker);

    const [offerBufferAddress, offerBufferAddressBump] = await anchor.web3.PublicKey.findProgramAddress([offerMakerAccount.toBuffer(), NFTTokenMint.toBuffer(), offervalid.toArrayLike(Buffer, 'be', 8)], program.programId);

    console.log("Offer BUffer Address is", offerBufferAddress.toString())

    const [backupdataAccAddress, backupdataAccAddressBump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("backup_data")],
      program.programId
    );


    const accounts = {
      offer:offerBufferAddress,
      systemProgram: anchor.web3.SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      backupDataAcc: backupdataAccAddress,
      pdaRent: pdaRentAddress,
    }
    //console.log(accounts.rent.toString(), accounts.tokenProgram.toString(), accounts.systemProgram.toString(), accounts.associatedTokenProgram.toString());
    const tx = await program.rpc.closeOfferPda(  {
      accounts: accounts,
      signers: []
    });
    console.log(tx);

    // while ((await program.provider.connection.getSignatureStatus(tx)).value.confirmations === 0) {
    //   // console.log('sign status', await program.provider.connection.getSignatureStatus(tx1));
    // }



    // const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    // console.log('account: ', account);
    // setValue(account.count.toString());
  }

  async function CloseStickPDA() {

    const provider = await getProvider();
    const program = new Program(idl, programID, provider);
    console.log(program.programId.toString())

    console.log(program.provider);


    console.log('wallet ', program.provider.wallet.publicKey.toString())

    const idk = await program.account.stick.all();
    console.log(idk);

    let offer = idk[0];
    // offer.account.maker;

    // console.log(i)


    let NFTTokenMint = new anchor.web3.PublicKey(offer.account.mint);
    let offerMakerAccount = new anchor.web3.PublicKey(offer.account.maker);
    let offerTakerAccount = new anchor.web3.PublicKey(offer.account.taker);

    const [stickBufferAddress, stickBufferAddressBump] = await anchor.web3.PublicKey.findProgramAddress([offerMakerAccount.toBuffer(), NFTTokenMint.toBuffer(), offerTakerAccount.toBuffer(), offervalid.toArrayLike(Buffer, 'be', 8)], program.programId);

  

    const [backupdataAccAddress, backupdataAccAddressBump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("backup_data")],
      program.programId
    );


    const accounts = {
      stick:stickBufferAddress,
      systemProgram: anchor.web3.SystemProgram.programId,
      clock:anchor.web3.SYSVAR_CLOCK_PUBKEY,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      backupDataAcc: backupdataAccAddress,
      pdaRent: pdaRentAddress,
    }
    //console.log(accounts.rent.toString(), accounts.tokenProgram.toString(), accounts.systemProgram.toString(), accounts.associatedTokenProgram.toString());
    const tx = await program.rpc.closeStickPda(  {
      accounts: accounts,
      signers: []
    });
    console.log(tx);
  }




  if (!wallet.connected) {
    /* If the user's wallet is not connected, display connect wallet button. */
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
        <WalletMultiButton />
      </div>
    )
  } else {
    return (
      <div className="App">
        <div>

          <button onClick={initContract}>INIT CONTRACT</button>
          <br/>
          <br/>
          <button onClick={updatePda}> UPDATE PDA</button>
          <br/>
          <br/>
          <button onClick={makeOfferForNft}>Make Offer For NFT</button>
          <br/>
          <br/>
          <button onClick={AcceptOffer}>Accept Offer</button>
          <br/>
          <br/>
          <br/>
          <br/>
          <button onClick={ClosePDA}>Close PDA</button>
          <br/>
          <br/>
          <button onClick={CloseStickPDA}>Close Stick PDA</button>
          <br/>
          <br/>
          <button onClick={CancelOffer}>Cancel Offer</button>

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