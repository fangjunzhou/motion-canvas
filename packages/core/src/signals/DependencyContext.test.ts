import {afterEach, describe, expect, test} from 'vitest';
import {DependencyContext} from '../index';

function deferred() {
  let resolve = () => {};
  const promise = new Promise<void>(done => {
    resolve = done;
  });
  return {promise, resolve};
}

describe('DependencyContext resource consumption', () => {
  afterEach(async () => {
    await DependencyContext.consumePromises();
  });

  test('an awaited resource is no longer reported as unconsumed', async () => {
    const resource = deferred();
    const handle = DependencyContext.collectPromise(resource.promise);
    const consuming = DependencyContext.consumePromises();
    try {
      expect(DependencyContext.hasPromises()).toBe(false);
      expect(await DependencyContext.consumePromises()).toEqual([]);
    } finally {
      resource.resolve();
      expect(await consuming).toEqual([handle]);
    }
  });

  test('resources collected during an await remain available to their caller', async () => {
    const resource = deferred();
    DependencyContext.collectPromise(resource.promise);
    const consuming = DependencyContext.consumePromises();
    const later = DependencyContext.collectPromise(Promise.resolve('later'));
    resource.resolve();
    await consuming;

    expect(DependencyContext.hasPromises()).toBe(true);
    expect(await DependencyContext.consumePromises()).toEqual([later]);
    expect(later.value).toBe('later');
    expect(DependencyContext.hasPromises()).toBe(false);
  });

  test('unawaited resources still trigger the pending-resource check', async () => {
    const handle = DependencyContext.collectPromise(Promise.resolve('ready'));
    await handle.promise;

    expect(DependencyContext.hasPromises()).toBe(true);
    expect(await DependencyContext.consumePromises()).toEqual([handle]);
  });
});
