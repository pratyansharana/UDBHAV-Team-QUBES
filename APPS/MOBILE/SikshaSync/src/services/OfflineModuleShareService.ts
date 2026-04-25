export interface ShareableModule {
  id: string;
  title: string;
  content: string;
  hash: string;
}

interface ShareEnvelope {
  v: 1;
  t: 'module-share';
  ts: number;
  ttlMs: number;
  module: ShareableModule;
  checksum: string;
}

export interface EncodeSharePayloadResult {
  payload: string;
  rawJsonSizeBytes: number;
  compressedSizeBytes: number;
  qrPayloadSizeBytes: number;
  fitsSingleQr: boolean;
  maxQrPayloadBytes: number;
}

export interface DecodeSharePayloadResult {
  ok: boolean;
  module?: ShareableModule;
  reason?: string;
}

const PAYLOAD_PREFIX = 'SSM1:';
const MAX_QR_PAYLOAD_BYTES = 2048;
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 7;

const toUtf8Bytes = (value: string): Uint8Array => new TextEncoder().encode(value);
const fromUtf8Bytes = (value: Uint8Array): string => new TextDecoder().decode(value);

const BASE64_TABLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const bytesToBase64 = (bytes: Uint8Array): string => {
  let output = '';

  for (let index = 0; index < bytes.length; index += 3) {
    const byte1 = bytes[index];
    const byte2 = index + 1 < bytes.length ? bytes[index + 1] : 0;
    const byte3 = index + 2 < bytes.length ? bytes[index + 2] : 0;

    const block = (byte1 << 16) | (byte2 << 8) | byte3;

    output += BASE64_TABLE[(block >> 18) & 63];
    output += BASE64_TABLE[(block >> 12) & 63];
    output += index + 1 < bytes.length ? BASE64_TABLE[(block >> 6) & 63] : '=';
    output += index + 2 < bytes.length ? BASE64_TABLE[block & 63] : '=';
  }

  return output;
};

const base64ToBytes = (base64Value: string): Uint8Array => {
  const cleaned = base64Value.replace(/[^A-Za-z0-9+/=]/g, '');
  if (cleaned.length % 4 !== 0) {
    throw new Error('Invalid base64 payload length');
  }

  const output: number[] = [];

  for (let index = 0; index < cleaned.length; index += 4) {
    const c1 = BASE64_TABLE.indexOf(cleaned[index]);
    const c2 = BASE64_TABLE.indexOf(cleaned[index + 1]);
    const c3 = cleaned[index + 2] === '=' ? -1 : BASE64_TABLE.indexOf(cleaned[index + 2]);
    const c4 = cleaned[index + 3] === '=' ? -1 : BASE64_TABLE.indexOf(cleaned[index + 3]);

    if (c1 < 0 || c2 < 0 || c3 < -1 || c4 < -1) {
      throw new Error('Invalid base64 payload data');
    }

    const block = (c1 << 18) | (c2 << 12) | ((Math.max(c3, 0) as number) << 6) | (Math.max(c4, 0) as number);

    output.push((block >> 16) & 255);
    if (c3 !== -1) {
      output.push((block >> 8) & 255);
    }
    if (c4 !== -1) {
      output.push(block & 255);
    }
  }

  return new Uint8Array(output);
};

const stableModuleString = (module: ShareableModule): string =>
  JSON.stringify({
    id: module.id,
    title: module.title,
    content: module.content,
    hash: module.hash,
  });

const fnv1aHash = (value: string): string => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash +=
      (hash << 1) +
      (hash << 4) +
      (hash << 7) +
      (hash << 8) +
      (hash << 24);
  }

  return `h${(hash >>> 0).toString(16).padStart(8, '0')}`;
};

export const computeModuleHash = (input: Pick<ShareableModule, 'id' | 'title' | 'content'>): string =>
  fnv1aHash(`${input.id}|${input.title}|${input.content}`);

export const isShareableModule = (value: unknown): value is ShareableModule => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const typed = value as ShareableModule;
  return (
    typeof typed.id === 'string' && typed.id.trim().length > 0 &&
    typeof typed.title === 'string' && typed.title.trim().length > 0 &&
    typeof typed.content === 'string' && typed.content.trim().length > 0 &&
    typeof typed.hash === 'string' && typed.hash.trim().length > 0
  );
};

export const encodeModuleSharePayload = (
  module: ShareableModule,
  options?: { maxQrPayloadBytes?: number; ttlMs?: number }
): EncodeSharePayloadResult => {
  const maxQrPayloadBytes = options?.maxQrPayloadBytes ?? MAX_QR_PAYLOAD_BYTES;
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;

  const validatedModule: ShareableModule = {
    ...module,
    hash: module.hash || computeModuleHash(module),
  };

  const checksum = fnv1aHash(stableModuleString(validatedModule));
  const envelope: ShareEnvelope = {
    v: 1,
    t: 'module-share',
    ts: Date.now(),
    ttlMs,
    module: validatedModule,
    checksum,
  };

  const json = JSON.stringify(envelope);
  const rawBytes = toUtf8Bytes(json);
  const payloadBytes = rawBytes;
  const payload = `${PAYLOAD_PREFIX}${bytesToBase64(payloadBytes)}`;
  const qrPayloadSizeBytes = toUtf8Bytes(payload).length;

  return {
    payload,
    rawJsonSizeBytes: rawBytes.length,
    compressedSizeBytes: payloadBytes.length,
    qrPayloadSizeBytes,
    fitsSingleQr: qrPayloadSizeBytes <= maxQrPayloadBytes,
    maxQrPayloadBytes,
  };
};

export const decodeModuleSharePayload = (
  payload: string,
  options?: { nowMs?: number; enforceTtl?: boolean }
): DecodeSharePayloadResult => {
  try {
    if (!payload.startsWith(PAYLOAD_PREFIX)) {
      return { ok: false, reason: 'Invalid QR prefix' };
    }

    const base64Value = payload.slice(PAYLOAD_PREFIX.length);
    const payloadBytes = base64ToBytes(base64Value);
    const json = fromUtf8Bytes(payloadBytes);
    const parsed = JSON.parse(json) as Partial<ShareEnvelope>;

    if (parsed.v !== 1 || parsed.t !== 'module-share' || !parsed.module) {
      return { ok: false, reason: 'Unsupported QR payload schema' };
    }

    if (!isShareableModule(parsed.module)) {
      return { ok: false, reason: 'Module schema validation failed' };
    }

    const expectedChecksum = fnv1aHash(stableModuleString(parsed.module));
    if (parsed.checksum !== expectedChecksum) {
      return { ok: false, reason: 'Checksum validation failed' };
    }

    const expectedModuleHash = computeModuleHash(parsed.module);
    if (parsed.module.hash !== expectedModuleHash) {
      return { ok: false, reason: 'Module hash mismatch' };
    }

    const shouldEnforceTtl = options?.enforceTtl ?? true;
    if (shouldEnforceTtl) {
      const nowMs = options?.nowMs ?? Date.now();
      const exportedAt = typeof parsed.ts === 'number' ? parsed.ts : 0;
      const ttlMs = typeof parsed.ttlMs === 'number' ? parsed.ttlMs : DEFAULT_TTL_MS;
      if (exportedAt <= 0 || nowMs - exportedAt > ttlMs) {
        return { ok: false, reason: 'Shared payload expired' };
      }
    }

    return { ok: true, module: parsed.module };
  } catch (error) {
    console.error('OfflineModuleShare decode error', error);
    return { ok: false, reason: 'QR decode/decompress failed' };
  }
};

export const getSingleQrPayloadLimit = (): number => MAX_QR_PAYLOAD_BYTES;
