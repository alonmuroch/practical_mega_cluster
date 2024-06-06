import forge from 'node-forge';

export function GenerateOperator() {
    const pki = forge.pki;

    const keys = pki.rsa.generateKeyPair(2048);

    const pk = pki.publicKeyToPem(keys.publicKey);
    const sk = pki.privateKeyToPem(keys.privateKey);

    return { pk, sk };
}

export function encodePK(pk) {
    return convertPemToHex(pk);
}

// Function to convert PEM format to Hex
export function convertPemToHex(pem: string): string {
    const base64 = pem
        .replace(/-----BEGIN PUBLIC KEY-----/, '')
        .replace(/-----END PUBLIC KEY-----/, '')
        .replace(/\s+/g, '');
    const binary = forge.util.decode64(base64);
    return forge.util.binary.hex.encode(binary);
}

// Function to convert Hex to PEM format
function convertHexToPem(hex: string): string {
    const binary = forge.util.hexToBytes(hex);
    const base64 = forge.util.encode64(binary);
    return `-----BEGIN PUBLIC KEY-----\n${base64.match(/.{1,64}/g)?.join('\n')}\n-----END PUBLIC KEY-----`;
}

// Function to convert PEM to public key object
function convertPemToPublicKey(pem: string): forge.pki.PublicKey {
    const pki = forge.pki;
    return pki.publicKeyFromPem(pem);
}
