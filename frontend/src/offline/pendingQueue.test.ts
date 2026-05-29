import { describe, it, expect } from 'vitest';
import {
  enqueuePending,
  listPending,
  countPending,
  removePending,
  markPendingError,
  clearPending,
} from './pendingQueue';

const KEY = 'worklog:pendingEntries';

// localStorage is cleared after each test by the global setup.
describe('pendingQueue', () => {
  it('enqueues and lists entries with a generated id', () => {
    const entry = enqueuePending({ a: 1 });
    expect(entry.id).toBeTruthy();
    expect(countPending()).toBe(1);
    expect(listPending()[0].payload).toEqual({ a: 1 });
  });

  it('removes an entry by id', () => {
    const first = enqueuePending({ a: 1 });
    enqueuePending({ b: 2 });
    removePending(first.id);
    expect(countPending()).toBe(1);
    expect(listPending()[0].payload).toEqual({ b: 2 });
  });

  it('records lastError without removing the entry', () => {
    const entry = enqueuePending({ a: 1 });
    markPendingError(entry.id, 'boom');
    expect(countPending()).toBe(1);
    expect(listPending()[0].lastError).toBe('boom');
  });

  it('persists a versioned envelope', () => {
    enqueuePending({ a: 1 });
    const raw = JSON.parse(localStorage.getItem(KEY)!);
    expect(raw.version).toBe(1);
    expect(Array.isArray(raw.entries)).toBe(true);
  });

  it('discards a legacy bare-array payload from an older build', () => {
    localStorage.setItem(KEY, JSON.stringify([{ id: 'x', payload: {}, savedAt: 'z' }]));
    expect(listPending()).toEqual([]);
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('discards a mismatched version', () => {
    localStorage.setItem(KEY, JSON.stringify({ version: 999, entries: [{ id: 'x' }] }));
    expect(listPending()).toEqual([]);
  });

  it('clears the whole queue', () => {
    enqueuePending({ a: 1 });
    clearPending();
    expect(countPending()).toBe(0);
  });
});
