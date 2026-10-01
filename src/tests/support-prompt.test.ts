import { describe, expect, it } from 'vitest';
import {
  isOfficialHostedApp,
  shouldShowSupportPrompt,
} from '../lib/support-prompt';

describe('support prompt', () => {
  it('only enables the prompt on the official GitHub Pages app', () => {
    expect(isOfficialHostedApp('kunlong-luo.github.io', '/resume-craft/')).toBe(true);
    expect(isOfficialHostedApp('localhost', '/resume-craft/')).toBe(false);
    expect(isOfficialHostedApp('127.0.0.1', '/resume-craft/')).toBe(false);
    expect(isOfficialHostedApp('example.com', '/resume-craft/')).toBe(false);
    expect(isOfficialHostedApp('kunlong-luo.github.io', '/resume-craft-copy/')).toBe(false);
  });

  it('never interrupts before the first completed PDF export', () => {
    expect(shouldShowSupportPrompt({
      hostname: 'kunlong-luo.github.io',
      pathname: '/resume-craft/',
      prompted: false,
      exportCount: 0,
    })).toBe(false);
  });

  it('becomes eligible after the first completed PDF export', () => {
    expect(shouldShowSupportPrompt({
      hostname: 'kunlong-luo.github.io',
      pathname: '/resume-craft/',
      prompted: false,
      exportCount: 1,
    })).toBe(true);
  });

  it('never shows again after the one-time prompt has been handled', () => {
    expect(shouldShowSupportPrompt({
      hostname: 'kunlong-luo.github.io',
      pathname: '/resume-craft/',
      prompted: true,
      exportCount: 1,
    })).toBe(false);

    expect(shouldShowSupportPrompt({
      hostname: 'kunlong-luo.github.io',
      pathname: '/resume-craft/',
      prompted: true,
      exportCount: 99,
    })).toBe(false);
  });
});
