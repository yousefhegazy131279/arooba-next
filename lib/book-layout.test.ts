import test from 'node:test';
import assert from 'node:assert/strict';
import { bookSpread, adjacentSpread } from './book-layout';

test('Arabic spreads put the earlier page on the right, including even-page deep links', () => {
  assert.deepEqual(bookSpread(4, 13), { right: 4, left: 5 });
  assert.deepEqual(bookSpread(5, 13), { right: 4, left: 5 });
  assert.deepEqual(bookSpread(12, 13), { right: 12, left: null });
  assert.equal(adjacentSpread(0, 13, false, -1), null);
  assert.equal(adjacentSpread(12, 13, false, 1), null);
});

test('turning through odd and even length books visits every page once without dropping the last leaf', () => {
  for (const total of [1, 2, 3, 12, 13, 100]) {
    const visited: number[] = [];
    let index: number | null = 0;
    while (index !== null) {
      const spread = bookSpread(index, total);
      visited.push(spread.right);
      if (spread.left !== null) visited.push(spread.left);
      index = adjacentSpread(index, total, false, 1);
    }
    assert.deepEqual(visited, Array.from({ length: total }, (_, i) => i));
  }
});

test('mobile turns one page at a time and changing to a spread keeps the saved page visible', () => {
  assert.deepEqual(bookSpread(5, 13, true), { right: 5, left: null });
  assert.equal(adjacentSpread(5, 13, true, 1), 6);
  assert.equal(adjacentSpread(5, 13, true, -1), 4);
  const desktop = bookSpread(5, 13);
  assert.ok(desktop.right === 5 || desktop.left === 5);
  assert.equal(adjacentSpread(5, 13, false, 1), 6);
});
