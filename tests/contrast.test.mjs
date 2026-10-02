import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { colors, names } from '../src/puzzleGenerator.mjs';

const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8');

const ruleFor = (selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`(?:^|\\n)${escaped} \\{([^}]+)\\}`));
  assert.ok(match, `Missing CSS rule: ${selector}`);
  return match[1];
};

const rgb = (hex) => hex.match(/[0-9a-f]{2}/gi).map((pair) => parseInt(pair, 16) / 255);
const mix = (first, second, weight) => first.map((channel, index) => channel * weight + second[index] * (1 - weight));
const luminance = (color) => color
  .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
  .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
const contrast = (first, second) => {
  const values = [luminance(first), luminance(second)];
  return (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05);
};

test('small box identifiers and selected labels share theme-aware ink without changing box hues', () => {
  assert.match(ruleFor('.box'), /--box-label-ink: color-mix\(in srgb, var\(--box-color\) \d+%, var\(--ink\)\)/);
  for (const selector of ['.box-identity b', '.box.is-selected .box-choice']) {
    assert.match(ruleFor(selector), /color: var\(--box-label-ink\);/);
    assert.doesNotMatch(ruleFor(selector), /(?:^|;)\s*color: var\(--box-color\);/);
  }
  assert.match(ruleFor('.box-identity b'), /border: 1px solid var\(--box-color\);/);
  assert.match(ruleFor('.box-lid'), /background: var\(--box-color\);/);
});

test('every box label passes normal-text contrast in both themes and every card state', () => {
  // Shared v2 theme colors from https://jehlp.net/site-theme/v2/base.css.
  // Keep these fixtures in sync if the shared paper/ink tokens change.
  const themes = {
    light: { paper: '#fbfaf7', ink: '#181817' },
    dark: { paper: '#131412', ink: '#eeeae1' },
  };
  const weight = Number(ruleFor('.box').match(/var\(--box-color\) (\d+)%/)[1]) / 100;
  const states = ['.box-body', '.box.is-selected .box-body', '.box.has-gem .box-body'];

  for (const [theme, { paper, ink }] of Object.entries(themes)) {
    for (const [index, color] of colors.entries()) {
      const foreground = mix(rgb(color), rgb(ink), weight);
      for (const selector of states) {
        const backgroundMix = ruleFor(selector).match(/background: color-mix\(in srgb, var\(--box-color\) (\d+)%, var\(--paper\)\)/);
        assert.ok(backgroundMix, `Missing background mix for ${selector}`);
        const background = mix(rgb(color), rgb(paper), Number(backgroundMix[1]) / 100);
        const ratio = contrast(foreground, background);
        assert.ok(ratio >= 4.5, `${theme} ${names[index]} ${selector}: ${ratio.toFixed(2)}:1 is below 4.5:1`);
      }
    }
  }
});
