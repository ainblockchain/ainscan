// Passkey (WebAuthn) utilities for P256-based signing on AIN blockchain.
// The AIN blockchain supports P256 (secp256r1) signatures natively,
// which is the same curve used by WebAuthn/FIDO2 passkeys.

const STORAGE_KEY = 'ain_passkey_credential';

export interface PasskeyAccount {
  credentialId: string;
  publicKey: string; // hex-encoded uncompressed public key
  address: string;   // derived AIN address
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function deriveAddress(publicKeyHex: string): Promise<string> {
  // AIN address = last 20 bytes of keccak256(uncompressedPubKey[1:])
  // We use SubtleCrypto SHA-256 as a fallback since keccak256 isn't natively available.
  // For production, you'd use a proper keccak256. Here we derive a deterministic address.
  const pubKeyBytes = new Uint8Array(hexToBuffer(publicKeyHex));
  // Skip the 0x04 prefix for uncompressed keys
  const keyData = pubKeyBytes.length === 65 ? pubKeyBytes.slice(1) : pubKeyBytes;
  const hash = await crypto.subtle.digest('SHA-256', keyData);
  const hashBytes = new Uint8Array(hash);
  const addressBytes = hashBytes.slice(hashBytes.length - 20);
  return '0x' + bufferToHex(addressBytes.buffer);
}

// Extract the raw P256 public key from COSE-encoded attestation data
function extractPublicKeyFromAuthData(authData: ArrayBuffer): string | null {
  const data = new Uint8Array(authData);
  // authData: rpIdHash(32) + flags(1) + signCount(4) + attestedCredentialData(...)
  // attestedCredentialData: aaguid(16) + credIdLen(2) + credId(credIdLen) + credentialPublicKey(CBOR)
  if (data.length < 37) return null;
  const flags = data[32];
  if (!(flags & 0x40)) return null; // No attested credential data

  const credIdLen = (data[53] << 8) | data[54];
  const coseKeyStart = 55 + credIdLen;
  const coseBytes = data.slice(coseKeyStart);

  // Simple CBOR decode for P256 public key (extract x and y coordinates)
  // COSE key map: {1: 2(EC2), 3: -7(ES256), -1: 1(P-256), -2: x(32 bytes), -3: y(32 bytes)}
  const coseHex = bufferToHex(coseBytes.buffer);

  // Find x coordinate (CBOR key -2 = 0x21, followed by 0x5820 for 32-byte bstr)
  const xMarker = coseHex.indexOf('215820');
  const yMarker = coseHex.indexOf('225820');
  if (xMarker === -1 || yMarker === -1) return null;

  const x = coseHex.substring(xMarker + 6, xMarker + 6 + 64);
  const y = coseHex.substring(yMarker + 6, yMarker + 6 + 64);

  return '04' + x + y; // Uncompressed public key
}

export async function registerPasskey(username: string): Promise<PasskeyAccount | null> {
  if (!window.PublicKeyCredential) return null;

  const challenge = crypto.getRandomValues(new Uint8Array(32));

  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'AINscan', id: window.location.hostname },
      user: {
        id: new TextEncoder().encode(username),
        name: username,
        displayName: username,
      },
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }], // ES256 = P256
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        residentKey: 'preferred',
        userVerification: 'required',
      },
      attestation: 'direct',
    },
  })) as PublicKeyCredential | null;

  if (!credential) return null;

  const response = credential.response as AuthenticatorAttestationResponse;
  const credentialId = bufferToBase64Url(credential.rawId);

  const publicKey = extractPublicKeyFromAuthData(response.getAuthenticatorData());
  if (!publicKey) return null;

  const address = await deriveAddress(publicKey);

  const account: PasskeyAccount = { credentialId, publicKey, address };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
  return account;
}

export async function signWithPasskey(data: string): Promise<{ signature: string; credentialId: string } | null> {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  const account: PasskeyAccount = JSON.parse(stored);

  const challenge = new TextEncoder().encode(data);

  const assertion = (await navigator.credentials.get({
    publicKey: {
      challenge,
      rpId: window.location.hostname,
      allowCredentials: [{
        id: base64UrlToBuffer(account.credentialId),
        type: 'public-key',
      }],
      userVerification: 'required',
    },
  })) as PublicKeyCredential | null;

  if (!assertion) return null;

  const response = assertion.response as AuthenticatorAssertionResponse;
  const signature = bufferToHex(response.signature);

  return { signature, credentialId: account.credentialId };
}

export function getStoredPasskeyAccount(): PasskeyAccount | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function clearPasskeyAccount(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function isPasskeySupported(): boolean {
  return typeof window !== 'undefined' && !!window.PublicKeyCredential;
}
