import BCHJS from "@psf/bch-js";
import crypto from 'crypto'
import base58 from 'bs58'
import {
  ripemd160,
  binToHex,
  hexToBin,
  decodePrivateKeyWif
} from "@bitauth/libauth"

const bchjs = new BCHJS()

export function sha256(data='', encoding='utf8') {
  const _sha256 = crypto.createHash('sha256')
  _sha256.update(Buffer.from(data, encoding))
  return _sha256.digest().toString('hex')
}

export function pubkeyToPkHash(pubkey='') {
  return binToHex(ripemd160.hash(hexToBin(sha256(pubkey, 'hex'))))
}

export function pkHashToCashAddr(pkHash='', isChipnet=false) {
  const address = bchjs.Address.toCashAddress(
    hash160ToLegacyAddress(Buffer.from(pkHash, 'hex'))
  )
  if (!isChipnet) return address
  return convertCashAddress(address, true, false)
}

export function wifToPrivKey (wif) {
    const decoded = decodePrivateKeyWif(wif);
    const privateKey = decoded.privateKey;
    console.log('32-byte private key (hex):', Buffer.from(privateKey).toString('hex'));
    return privateKey
}

export function hash160ToLegacyAddress(hash160=Buffer.from([])) {
  const versionByte = Buffer.from([0x00]); // Version byte for legacy addresses

  // Step 2: Prepend version byte
  const data = Buffer.concat([versionByte, hash160]);

  // Step 3: Append checksum
  const checksum = bchjs.Crypto.sha256(bchjs.Crypto.sha256(data)).slice(0, 4);
  const dataWithChecksum = Buffer.concat([data, checksum]);

  // Step 5: Base58 encode the data with checksum
  const legacyAddress = base58.encode(dataWithChecksum);

  return legacyAddress;
}

export function estimateBlockHeight(currentHeight, currentTimestamp, targetTimestamp, avgBlockTimeSec = 600) {
  const timeDiff = (currentTimestamp - targetTimestamp) / 1000; // in seconds
  const blockDiff = Math.round(timeDiff / avgBlockTimeSec);
  return currentHeight - blockDiff;
}