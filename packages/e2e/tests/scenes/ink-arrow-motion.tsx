import {makeScene2D} from '@canvas-commons/2d';
import {all, cancel, waitFor, type ThreadGenerator} from '@canvas-commons/core';
import example from '../../../motion-kit/examples/ink-arrow';
import {InkArrow} from '../../../motion-kit/registry/components/InkArrow';
import type {InkArrowProbe} from './ink-arrow-motion.probe';
const Published: {resolve: (probe: InkArrowProbe) => void} = {
  resolve: () => {},
};
window.inkArrowProbe = new Promise(resolve => {
  Published.resolve = resolve;
});
export default makeScene2D(function* (view) {
  const samples: InkArrowProbe['samples'] = [];
  let running = true;
  yield* all(
    (function* (): ThreadGenerator {
      yield* example.config(view);
      running = false;
    })(),
    (function* (): ThreadGenerator {
      while (running) {
        const arrow = view.children().find(n => n instanceof InkArrow);
        if (!arrow) {
          throw new Error('Missing arrow.');
        }
        samples.push({progress: arrow.progress(), head: arrow.headProgress()});
        yield;
      }
    })(),
  );
  const arrow = view.children().find(n => n instanceof InkArrow);
  if (!arrow) {
    throw new Error('Missing arrow.');
  }
  const endpoints =
    arrow.pointAt(0).equals(arrow.from()) &&
    arrow.pointAt(1).equals(arrow.to());
  const clamped =
    arrow.pointAt(-1).equals(arrow.from()) &&
    arrow.pointAt(2).equals(arrow.to());
  const copy = arrow.clone({seed: 'different'});
  view.add(copy);
  const independent =
    !copy.pointAt(0.5).equals(arrow.pointAt(0.5)) &&
    copy.progress() === arrow.progress();
  copy.to(copy.from());
  const zeroLength = copy.pointAt(0.5).equals(copy.from());
  copy.remove();
  copy.dispose();
  yield* arrow.erase(0);
  const empty = arrow.progress() === 0 && arrow.headProgress() === 0;
  yield* arrow.reveal(0);
  const zeroDuration =
    empty && arrow.progress() === 1 && arrow.headProgress() === 1;
  const animation: ThreadGenerator = yield arrow.reveal(1);
  yield* waitFor(0.25);
  cancel(animation);
  const before = arrow.progress();
  yield* waitFor(0.2);
  const cancelled =
    before > 0 &&
    before < 1 &&
    arrow.progress() === before &&
    arrow.headProgress() === 0;
  Published.resolve({
    samples,
    endpoints,
    clamped,
    independent,
    zeroLength,
    zeroDuration,
    cancelled,
  });
  yield* waitFor(0.2);
});
