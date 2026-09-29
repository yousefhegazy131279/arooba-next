/** In an Arabic spread the earlier page is on the right. Never reverse the source. */
export function bookSpread(page: number, total: number, single = false) {
  const safe = Math.max(0, Math.min(Math.max(0, total - 1), Math.floor(page)));
  const right = single ? safe : Math.floor(safe / 2) * 2;
  return { right, left: !single && right + 1 < total ? right + 1 : null };
}

export function adjacentSpread(page: number, total: number, single: boolean, direction: 1 | -1) {
  const { right } = bookSpread(page, total, single);
  const target = right + direction * (single ? 1 : 2);
  return target >= 0 && target < total ? target : null;
}
