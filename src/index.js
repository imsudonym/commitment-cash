import { Commitment } from "./js/solo-commitment.js";
import { estimateBlockHeight, pubkeyToPkHash } from "./js/utils.js";
import dotenv from 'dotenv';

dotenv.config();

const OWNER_WIF = process.env.OWNER_WIF
const OWNER_PUBKEY = process.env.OWNER_PUBKEY
const ARBITER_WIF = process.env.ARBITER_WIF
const ARBITER_PUBKEY = process.env.ARBITER_PUBKEY

const ACTION = process.argv[2]; // 'balance' | 'release' | 'sweep'
const EXPIRATION_BLOCK = process.argv[3];

run();

async function run () {
    console.log('ACTION:', ACTION)

    let currentBlock
    let currentBlockTime

    await fetch('https://api.blockchair.com/bitcoin-cash/stats')
    .then(response => response.json())
    .then(data => {
        currentBlock = data.data.best_block_height;
        console.log("Current BCH Block Height:", currentBlock);

        currentBlockTime = new Date(data.data.best_block_time + 'Z');
        console.log("Current BCH Block Time:", currentBlockTime);
    })
    .catch(error => {
        console.error("Error fetching from Blockchair:", error);
    });


    // expiration date
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    const expirationDate = fiveMinutesFromNow
    const expirationBlock = EXPIRATION_BLOCK || estimateBlockHeight(currentBlock, currentBlockTime, expirationDate)

    const ownerPkHash = pubkeyToPkHash(OWNER_PUBKEY)
    const arbiterPkHash = pubkeyToPkHash(ARBITER_PUBKEY)
    const claimAmount = 1000

    console.log('------- contract parameters --------')
    console.log('expirationDate:', expirationDate)
    console.log('expirationBlock:', expirationBlock)

    console.log('ownerPkHash:', ownerPkHash)
    console.log('arbiterPkHash:', arbiterPkHash)
    console.log('claimAmount:', claimAmount)

    console.log('------- contract --------')

    const commitment = new Commitment({
        params: {
            ownerPkHash: ownerPkHash,
            arbiterPkHash: arbiterPkHash,
            expiration: expirationBlock, 
            claimAmount: claimAmount
        }
    })
    const contract = commitment.getContract()
    const utxos = await contract.getUtxos()
    console.log('address:', contract.address)
    console.log('utxos:', utxos)

    if (ACTION == 'balance') {
        console.log('-------- checking contract balance --------')
        const balance = await contract.getBalance()
        console.log('balance:', balance)
    }

    if (ACTION == 'release') {
        console.log('-------- releasing ', claimAmount, ' satoshis --------')
        commitment.release(OWNER_WIF, ARBITER_WIF)
    }

    if (ACTION == 'sweep') {
        console.log('-------- sweeping unclaimed funds --------')
        commitment.sweep(ARBITER_WIF)
    }
}