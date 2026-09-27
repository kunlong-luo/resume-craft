import { zlibSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import {
  decryptSharePayload,
  deserializeShareState,
  encryptShareState,
  getSharePayloadFromLocation,
  parseSharePayload,
  serializeCompressedShareState,
  serializeShareState,
  SHARE_PASSWORD_MIN_LENGTH,
  SHARE_PBKDF2_ITERATIONS,
} from '../lib/share-utils';
import type { ResumeSettings } from '../types';

const settings: ResumeSettings = {
  themeColor: 'indigo',
  fontSize: 'standard',
  fontFamily: 'sans',
  margin: 'standard',
  layoutMode: 'split',
  h2Style: 'accent-line',
  topAccentLine: true,
  lineHeight: 1.6,
  blockGap: 1,
  letterSpacing: 0,
  showPageBreakLine: true,
  templateLayout: 'single',
  lang: 'zh',
};

function decodeOuterEnvelope(encoded: string) {
  let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return JSON.parse(new TextDecoder().decode(bytes));
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function encodeOuterEnvelope(value: unknown) {
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(value)));
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

async function encryptLegacyV2(markdown: string, password: string) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(encoder.encode(password)),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: toArrayBuffer(salt),
      iterations: SHARE_PBKDF2_ITERATIONS,
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt'],
  );
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: toArrayBuffer(iv),
      additionalData: toArrayBuffer(encoder.encode('resume-craft-share-v2')),
      tagLength: 128,
    },
    key,
    toArrayBuffer(
      encoder.encode(
        JSON.stringify({
          m: markdown,
          s: settings,
        }),
      ),
    ),
  );

  return encodeOuterEnvelope({
    v: 2,
    a: 'A256GCM',
    k: 'PBKDF2-SHA256',
    i: SHARE_PBKDF2_ITERATIONS,
    s: bytesToBase64Url(salt),
    n: bytesToBase64Url(iv),
    c: bytesToBase64Url(new Uint8Array(ciphertext)),
    l: settings.lang,
  });
}

describe('privacy-preserving share links', () => {
  it('prefers fragment payloads and keeps legacy query links compatible', () => {
    expect(
      getSharePayloadFromLocation('?share=legacy', '#share=fragment'),
    ).toBe('fragment');

    expect(
      getSharePayloadFromLocation('?share=legacy', ''),
    ).toBe('legacy');
  });

  it('round-trips legacy/public share state without requiring a backend', () => {
    const encoded = serializeShareState({
      markdown: '# Candidate\n\nPrivate resume content',
      settings,
      passwordHash: 'legacy-client-side-code',
    });

    const decoded = deserializeShareState(encoded);

    expect(decoded?.markdown).toBe('# Candidate\n\nPrivate resume content');
    expect(decoded?.settings.themeColor).toBe('indigo');
    expect(decoded?.passwordHash).toBe('legacy-client-side-code');

    const parsed = parseSharePayload(encoded);
    expect(parsed?.kind).toBe('plain');
  });

  it('round-trips compressed v3 public shares and makes long resumes materially shorter', () => {
    const markdown = [
      '# Candidate',
      '',
      ...Array.from(
        { length: 180 },
        (_, index) =>
          `- Built a distributed resume workflow with measurable impact ${index % 8} and reusable platform components.`,
      ),
    ].join('\n');

    const legacy = serializeShareState({ markdown, settings });
    const compressed = serializeCompressedShareState({ markdown, settings });
    const envelope = decodeOuterEnvelope(compressed);

    expect(envelope.v).toBe(3);
    expect(envelope.a).toBe('PLAIN');
    expect(envelope.z).toBe('ZLIB');
    expect(compressed.length).toBeLessThan(legacy.length * 0.55);

    const parsed = parseSharePayload(compressed);
    expect(parsed?.kind).toBe('plain');
    if (!parsed || parsed.kind !== 'plain') {
      throw new Error('Expected compressed plain share payload');
    }
    expect(parsed.state.markdown).toBe(markdown);
    expect(parsed.state.settings.themeColor).toBe('indigo');
  });

  it('rejects compressed v3 payloads that inflate beyond the safety limit', () => {
    const oversizedJson = JSON.stringify({
      m: 'A'.repeat(8_100_000),
      s: settings,
    });
    const compressed = zlibSync(new TextEncoder().encode(oversizedJson), {
      level: 9,
    });
    const encoded = encodeOuterEnvelope({
      v: 3,
      a: 'PLAIN',
      z: 'ZLIB',
      d: bytesToBase64Url(compressed),
      l: 'zh',
    });

    expect(encoded.length).toBeLessThan(3_000_000);
    expect(parseSharePayload(encoded)).toBeNull();
  });


  it('sanitizes malformed legacy settings instead of trusting URL payload types', () => {
    const malformedSettings = {
      ...settings,
      themeColor: 'not-a-theme',
      fontFamily: 'unknown-font',
      lineHeight: 999,
      blockGap: -20,
      letterSpacing: 9,
      customColor: 'javascript:alert(1)',
    } as unknown as ResumeSettings;

    const encoded = serializeShareState({
      markdown: '# Candidate',
      settings: malformedSettings,
    });

    const decoded = deserializeShareState(encoded);

    expect(decoded?.settings.themeColor).toBe('indigo');
    expect(decoded?.settings.fontFamily).toBe('sans');
    expect(decoded?.settings.lineHeight).toBe(2.5);
    expect(decoded?.settings.blockGap).toBe(0);
    expect(decoded?.settings.letterSpacing).toBe(2);
    expect(decoded?.settings.customColor).toBe('#4F46E5');
  });

  it('rejects oversized share payloads before decoding them', () => {
    expect(parseSharePayload('A'.repeat(3_000_001))).toBeNull();
  });

  it('encrypts protected shares without putting the password or plaintext in the envelope', async () => {
    const password = 'correct horse battery staple';
    const markdown = '# Candidate\n\nSecret resume content';

    const encoded = await encryptShareState(
      {
        markdown,
        settings,
      },
      password,
    );

    const envelope = decodeOuterEnvelope(encoded);
    const serializedEnvelope = JSON.stringify(envelope);

    expect(envelope.v).toBe(3);
    expect(envelope.a).toBe('A256GCM');
    expect(envelope.k).toBe('PBKDF2-SHA256');
    expect(envelope.z).toBe('ZLIB');
    expect(serializedEnvelope).not.toContain(password);
    expect(serializedEnvelope).not.toContain('Secret resume content');

    const parsed = parseSharePayload(encoded);
    expect(parsed?.kind).toBe('encrypted');

    if (!parsed || parsed.kind !== 'encrypted') {
      throw new Error('Expected encrypted share payload');
    }

    const decrypted = await decryptSharePayload(parsed.payload, password);
    expect(decrypted?.markdown).toBe(markdown);
    expect(decrypted?.settings.themeColor).toBe('indigo');
    expect(decrypted?.passwordHash).toBeUndefined();
  });

  it('continues to decrypt legacy v2 encrypted share links', async () => {
    const password = 'legacy compatible password';
    const markdown = '# Candidate\n\nLegacy encrypted content';
    const encoded = await encryptLegacyV2(markdown, password);

    const parsed = parseSharePayload(encoded);
    expect(parsed?.kind).toBe('encrypted');
    if (!parsed || parsed.kind !== 'encrypted') {
      throw new Error('Expected legacy v2 encrypted share payload');
    }

    expect(parsed.payload.version).toBe(2);
    expect(parsed.payload.compression).toBeUndefined();

    const decrypted = await decryptSharePayload(parsed.payload, password);
    expect(decrypted?.markdown).toBe(markdown);
    expect(decrypted?.settings.themeColor).toBe('indigo');
  });


  it('normalizes settings before encrypting protected shares', async () => {
    const malformedSettings = {
      ...settings,
      themeColor: 'invalid-theme',
      margin: 'impossible-margin',
      lineHeight: 42,
    } as unknown as ResumeSettings;

    const password = 'validation password';
    const encoded = await encryptShareState(
      {
        markdown: '# Candidate',
        settings: malformedSettings,
      },
      password,
    );

    const parsed = parseSharePayload(encoded);
    if (!parsed || parsed.kind !== 'encrypted') {
      throw new Error('Expected encrypted share payload');
    }

    const decrypted = await decryptSharePayload(parsed.payload, password);

    expect(decrypted?.settings.themeColor).toBe('indigo');
    expect(decrypted?.settings.margin).toBe('standard');
    expect(decrypted?.settings.lineHeight).toBe(2.5);
  });

  it('rejects an incorrect password', async () => {
    const encoded = await encryptShareState(
      {
        markdown: '# Candidate',
        settings,
      },
      'a sufficiently strong password',
    );

    const parsed = parseSharePayload(encoded);
    if (!parsed || parsed.kind !== 'encrypted') {
      throw new Error('Expected encrypted share payload');
    }

    await expect(
      decryptSharePayload(parsed.payload, 'wrong password value'),
    ).resolves.toBeNull();
  });

  it('rejects tampered AES-GCM ciphertext', async () => {
    const encoded = await encryptShareState(
      {
        markdown: '# Candidate',
        settings,
      },
      'another strong password',
    );

    const parsed = parseSharePayload(encoded);
    if (!parsed || parsed.kind !== 'encrypted') {
      throw new Error('Expected encrypted share payload');
    }

    const original = parsed.payload.ciphertext;
    const firstChar = original[0];
    const tamperedCiphertext =
      (firstChar === 'A' ? 'B' : 'A') + original.slice(1);

    await expect(
      decryptSharePayload(
        {
          ...parsed.payload,
          ciphertext: tamperedCiphertext,
        },
        'another strong password',
      ),
    ).resolves.toBeNull();
  });

  it('rejects weak encryption passwords instead of silently falling back to plaintext', async () => {
    await expect(
      encryptShareState(
        {
          markdown: '# Candidate',
          settings,
        },
        'x'.repeat(SHARE_PASSWORD_MIN_LENGTH - 1),
      ),
    ).rejects.toThrow();
  });
});
