const assert = require('node:assert/strict');
const test = require('node:test');
const {
  getTaskPointBreakdown,
} = require('../services/productivityGameLogic');

test('awards points from priority and estimated workload', () => {
  const points = getTaskPointBreakdown(
    {
      priority: 4,
      estimated_minutes: 75,
      deadline: '2026-06-25T12:00:00.000Z',
    },
    {
      completedAt: '2026-06-22T12:00:00.000Z',
      completionDates: [],
    }
  );

  assert.equal(points.basePoints, 40);
  assert.equal(points.workloadPoints, 15);
  assert.equal(points.earlyBonusPoints, 10);
  assert.equal(points.streakBonusPoints, 0);
  assert.equal(points.totalPoints, 65);
});

test('awards a streak bonus for a new consecutive completion day', () => {
  const points = getTaskPointBreakdown(
    {
      priority: 3,
      estimated_minutes: 30,
      deadline: '2026-06-22T23:59:00.000Z',
    },
    {
      completedAt: '2026-06-22T12:00:00.000Z',
      completionDates: ['2026-06-20', '2026-06-21'],
    }
  );

  assert.equal(points.streakDayCount, 3);
  assert.equal(points.streakBonusPoints, 15);
  assert.equal(points.totalPoints, 60);
});

test('does not award another streak bonus after completing once today', () => {
  const points = getTaskPointBreakdown(
    {
      priority: 2,
      estimated_minutes: 30,
      deadline: '2026-06-22T23:59:00.000Z',
    },
    {
      completedAt: '2026-06-22T12:00:00.000Z',
      completionDates: ['2026-06-21', '2026-06-22'],
    }
  );

  assert.equal(points.streakDayCount, 2);
  assert.equal(points.streakBonusPoints, 0);
  assert.equal(points.totalPoints, 35);
});

test('does not award early bonus after the deadline', () => {
  const points = getTaskPointBreakdown(
    {
      priority: 5,
      estimated_minutes: 0,
      deadline: '2026-06-20T23:59:00.000Z',
    },
    {
      completedAt: '2026-06-22T12:00:00.000Z',
      completionDates: [],
    }
  );

  assert.equal(points.earlyBonusPoints, 0);
  assert.equal(points.totalPoints, 50);
});
