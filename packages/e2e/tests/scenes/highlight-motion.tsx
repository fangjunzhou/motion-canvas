import {makeScene2D} from '@canvas-commons/2d';
import {all, waitFor, type ThreadGenerator} from '@canvas-commons/core';
import example from '../../../motion-kit/examples/highlight';
import {Highlight} from '../../../motion-kit/registry/components/Highlight';
import type {HighlightProbe} from './highlight-motion.probe';

const Published: {resolve: (probe: HighlightProbe) => void} = {
  resolve: () => {},
};
window.highlightProbe = new Promise(resolve => {
  Published.resolve = resolve;
});
export default makeScene2D(function* (view) {
  const samples: HighlightProbe['samples'] = [];
  let running = true;
  yield* all(
    (function* (): ThreadGenerator {
      yield* example.config(view);
      running = false;
    })(),
    (function* (): ThreadGenerator {
      while (running) {
        const marker = view.children().find(node => node instanceof Highlight);
        if (!marker) throw new Error('Missing example highlight.');
        samples.push({
          style: marker.style(),
          progress: marker.progress(),
          width: marker.width(),
          height: marker.height(),
          boxes: marker
            .markerBoxes()
            .map(b => ({x: b.x, y: b.y, width: b.width, height: b.height})),
        });
        yield;
      }
    })(),
  );
  const marker = view.children().find(node => node instanceof Highlight);
  if (!marker) throw new Error('Missing example highlight.');
  const copy = marker.clone({selection: 'missing phrase', seed: 42});
  view.add(copy);
  const missing = copy.markerBoxes().length;
  copy.selection('');
  const empty = copy.markerBoxes().length;
  copy.selection(null);
  const allLines = copy.markerBoxes().length;
  const originalSeed = marker.seed();
  copy.text('Different text');
  const independent =
    marker.seed() === originalSeed && marker.text() !== copy.text();
  yield* marker.erase(0);
  const erased = marker.progress();
  yield* marker.reveal(0);
  const revealed = marker.progress();
  copy.remove();
  copy.dispose();
  Published.resolve({
    samples,
    missing,
    empty,
    allLines,
    independent,
    erased,
    revealed,
  });
  yield* waitFor(0.2);
});
