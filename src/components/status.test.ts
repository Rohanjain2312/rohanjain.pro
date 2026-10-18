import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import good from '../../tests/component/fixtures/status.json';
import { loadStatusFile } from './status-file.ts';
import { bareUrl, dayLabel, embedUrl, parseStatus } from './status.ts';

describe('parseStatus', () => {
  it('accepts the shape status.mjs writes', () => {
    expect(parseStatus(good)).toEqual(good);
  });
  it('treats a missing or malformed file as no status', () => {
    expect(parseStatus(undefined)).toBeUndefined();
    expect(parseStatus('x')).toBeUndefined();
    expect(parseStatus({ ...good, lastUpdated: 'yesterday' })).toBeUndefined();
    expect(
      parseStatus({ ...good, demos: [{ url: 'u', up: 'yes', checkedAt: '2026-10-18' }] }),
    ).toBeUndefined();
    expect(parseStatus({ checkedAt: '2026-10-18', lastUpdated: '2026-10-17' })).toBeUndefined();
  });
});

describe('loadStatusFile', () => {
  it('returns undefined without error when the file is missing', () => {
    expect(loadStatusFile('tests/component/fixtures/no-such-status.json')).toBeUndefined();
  });
  it('reads a valid file', () => {
    expect(existsSync('tests/component/fixtures/status.json')).toBe(true);
    expect(loadStatusFile('tests/component/fixtures/status.json')).toEqual(good);
  });
  it('returns undefined for a file that is not valid JSON', () => {
    expect(loadStatusFile('tests/component/fixtures/not-json.txt')).toBeUndefined();
  });
});

describe('dayLabel', () => {
  it('formats a day', () => {
    expect(dayLabel('2026-10-17')).toBe('Oct 17, 2026');
    expect(() => dayLabel('Oct 17')).toThrow();
  });
});

describe('embedUrl', () => {
  it('derives the hf.space host from the Space address', () => {
    expect(
      embedUrl('https://huggingface.co/spaces/rohanjain2312/trade-settlement-fail-predictor-demo'),
    ).toBe('https://rohanjain2312-trade-settlement-fail-predictor-demo.hf.space');
    expect(embedUrl('https://huggingface.co/spaces/rohanjain2312/FinCompress')).toBe(
      'https://rohanjain2312-fincompress.hf.space',
    );
    expect(embedUrl('https://huggingface.co/spaces/Ab_c/Self.Healing_Agent/')).toBe(
      'https://ab-c-self-healing-agent.hf.space',
    );
  });
  it('rejects anything that is not a Space address', () => {
    expect(embedUrl('https://huggingface.co/rohanjain2312/medical-mistral-7b')).toBeUndefined();
    expect(embedUrl('https://evil.example/spaces/a/b')).toBeUndefined();
    expect(embedUrl('http://huggingface.co/spaces/a/b')).toBeUndefined();
  });
});

describe('bareUrl', () => {
  it('drops the scheme', () => {
    expect(bareUrl('https://huggingface.co/spaces/a/b')).toBe('huggingface.co/spaces/a/b');
  });
});
