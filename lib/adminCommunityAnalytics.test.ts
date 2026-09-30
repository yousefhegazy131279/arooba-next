import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarizeCommunityActivity, type ActivityProfile } from './adminCommunityAnalytics';

test('community activity counts distinct participants and ranks writers and readers separately', () => {
  const profiles = new Map<string, ActivityProfile>([
    ['writer', { full_name: 'كاتبة', username: 'writer', community_role: 'writer' }],
    ['reader', { full_name: 'قارئ', username: 'reader', community_role: 'reader' }],
    ['unassigned', { full_name: null, username: null, community_role: null }],
  ]);
  const result = summarizeCommunityActivity(
    [{ user_id: 'writer' }, { user_id: 'reader' }],
    [{ user_id: 'reader' }, { user_id: 'reader' }, { user_id: 'unassigned' }],
    [{ user_id: 'reader' }, { user_id: 'writer' }], profiles,
  );
  assert.equal(result.participants, 3);
  assert.deepEqual(result.topWriters.map(({ id, score }) => ({ id, score })), [{ id: 'writer', score: 4 }]);
  assert.deepEqual(result.topReaders.map(({ id, score }) => ({ id, score })), [{ id: 'reader', score: 8 }]);
});
