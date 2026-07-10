import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { resolveSuggestedHeight } from '../utils/suggestedHeight';
// import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});
});

suite('resolveSuggestedHeight', () => {
	test('auto line height (fontSize default, lineHeight 0/undefined)', () => {
		// Linux/Win: fontSize 14, golden 1.35 => 18.9 -> 19, half -> 10
		assert.strictEqual(resolveSuggestedHeight(undefined, undefined, false), 10);
		assert.strictEqual(resolveSuggestedHeight(14, 0, false), 10);
		// Mac: fontSize 12, golden 1.5 => 18, half -> 9
		assert.strictEqual(resolveSuggestedHeight(undefined, undefined, true), 9);
	});

	test('lineHeight < 8 treated as a multiplier of fontSize', () => {
		// 14 * 1.6 = 22.4 -> 22, half -> 11
		assert.strictEqual(resolveSuggestedHeight(14, 1.6, false), 11);
	});

	test('lineHeight >= 8 treated as pixels', () => {
		// 30px line height, half -> 15
		assert.strictEqual(resolveSuggestedHeight(14, 30, false), 15);
	});

	test('scales with larger fonts', () => {
		// 20 * 1.35 = 27, half -> 14 (round of 13.5)
		assert.strictEqual(resolveSuggestedHeight(20, 0, false), 14);
	});

	test('falls back to platform default on garbage fontSize', () => {
		assert.strictEqual(resolveSuggestedHeight(0, 0, false), 10);
		assert.strictEqual(resolveSuggestedHeight(-5, undefined, true), 9);
	});

	test('never returns less than 1', () => {
		assert.ok(resolveSuggestedHeight(14, 8, false) >= 1);
	});
});
