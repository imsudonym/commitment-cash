import { ElectrumNetworkProvider, Contract, SignatureTemplate } from 'cashscript';
import { binToHex } from '@bitauth/libauth';
import { defaultNetwork, P2PKH_DUST, TX_FEE } from './constants.js';
import { pkHashToCashAddr, pubkeyToPkHash } from './utils.js';

import { readFile } from 'fs/promises';
const raw = await readFile(new URL('../contracts/solo-commitment-artifact.json', import.meta.url), 'utf-8');
const commitmentArtifact = JSON.parse(raw);

export class Commitment {
    constructor (opts) {
        const params = opts?.params
        this.params = {
            ownerPkHash: params?.ownerPkHash,
            arbiterPkHash: params?.arbiterPkHash,
            expiration: params?.expiration, 
            claimAmount: params?.claimAmount,
            timestamp: params?.timestamp
        }
        this.network = opts?.options?.network || defaultNetwork
    }

    get contractCreationParams () {
        return {
            ownerPkHash: this.params?.ownerPkHash,
            arbiterPkHash: this.params?.arbiterPkHash,
            expiration: this.params?.expiration, 
            claimAmount: this.params?.claimAmount
        }
    }

    get fundingAmounts () {
        return {
            claimAmount: Math.max(this.params?.claimAmount, P2PKH_DUST),
            txFee: TX_FEE
        }
    }

    getContract () {
        const provider = new ElectrumNetworkProvider(this.network);
        const opts = { provider }

        const artifact = commitmentArtifact
        const contractParams = [
            this.contractCreationParams.ownerPkHash,
            this.contractCreationParams.arbiterPkHash,
            BigInt(this.contractCreationParams.expiration),
            BigInt(this.contractCreationParams.claimAmount)
        ]

        const contract = new Contract(artifact, contractParams, opts);

        // if (contract.opcount > 201) throw new Error(`Opcount must be at most 201. Got ${contract.opcount}`)
        if (contract.bytesize > 520) throw new Error(`Bytesize must be at most 520. Got ${contract.bytesize}`)
        return contract
    }

    async release (arbiterWif) {
        const contract = this.getContract()
        const balance = BigInt(await contract.getBalance())

        if (balance == 0) {
            console.log('Contract balance is 0')
            return 
        }

        const arbiterSig = new SignatureTemplate(arbiterWif)
        const arbiterPubkey = binToHex(arbiterSig.getPublicKey())
        const arbiterPkHash = pubkeyToPkHash(arbiterPubkey)

        if (arbiterPkHash != this.params.arbiterPkHash) {
            throw new Error ('Private key must be from arbiter')
        }

        const txFee = BigInt(this.fundingAmounts.txFee)
        let claimAmount = BigInt(this.fundingAmounts.claimAmount)
        let changeAmount = balance - claimAmount - txFee

        if (changeAmount < P2PKH_DUST) {
            claimAmount += changeAmount
            changeAmount = 0
        }

        console.log('balance:', balance)
        console.log('claim amount:', claimAmount)
        console.log('change amount:', changeAmount)

        const outputs = [
            {to: pkHashToCashAddr(this.params.ownerPkHash), amount: claimAmount}
        ]

        if (changeAmount > 0) {
            outputs.push({to: contract.address, amount: changeAmount})
        }
        
        console.log('outputs:', outputs)

        const result = await contract.functions
            .release(arbiterPubkey, arbiterSig, BigInt(txFee))
            .to(outputs)
            .withHardcodedFee(BigInt(txFee))
            .send()
        
        console.log('result:', result)
    }

    async cancel (callerWif) {
        const contract = this.getContract()
        const balance = BigInt(await contract.getBalance())

        if (balance == 0) {
            console.log('Contract balance is 0')
            return 
        }

        const callerSig = new SignatureTemplate(callerWif)
        const callerPubkey = binToHex(callerSig.getPublicKey())
        const callerPkHash = pubkeyToPkHash(callerPubkey)

         if (callerPkHash != this.params.ownerPkHash && callerPkHash != this.params.arbiterPkHash) {
            throw new Error ('Private key must be from owner or arbiter')
        }

        const txFee = BigInt(this.fundingAmounts.txFee)
        const remainingFunds = balance - txFee
        const refundAmount = (remainingFunds * 70n) / 100n
        const sweepAmount = remainingFunds - refundAmount

        console.log('balance:', balance)
        console.log('refundAmount:', refundAmount)
        console.log('sweepAmount:', sweepAmount)

        const outputs = [
            {to: pkHashToCashAddr(this.params.ownerPkHash), amount: refundAmount},
            {to: pkHashToCashAddr(this.params.arbiterPkHash), amount: sweepAmount},
        ]
        
        console.log('outputs:', outputs)

        const result = await contract.functions
            .cancel(callerPubkey, callerSig, BigInt(txFee))
            .to(outputs)
            .withHardcodedFee(BigInt(txFee))
            .send()
        
        console.log('result:', result)
    }

    async sweep (arbiterWif) {
        const contract = this.getContract()
        const balance = BigInt(await contract.getBalance())

        if (balance == 0) {
            console.log('Contract balance is 0')
            return 
        }

        const arbiterSig = new SignatureTemplate(arbiterWif)
        const arbiterPubkey = binToHex(arbiterSig.getPublicKey())
        const arbiterPkHash = pubkeyToPkHash(arbiterPubkey)

        if (arbiterPkHash != this.params.arbiterPkHash) {
            throw new Error ('Private key must be from arbiter')
        }

        const txFee = BigInt(this.fundingAmounts.txFee)
        const claimAmount = balance - txFee

        const outputs = [
            {to: pkHashToCashAddr(this.params.ownerPkHash), amount: claimAmount}
        ]

        console.log('outputs:', outputs)

        const result = await contract.functions
            .sweep(arbiterPubkey, arbiterSig)
            .to(outputs)
            .withHardcodedFee(BigInt(txFee))
            .send()
        
        console.log('result:', result)

    }
}