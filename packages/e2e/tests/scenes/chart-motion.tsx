import {Node, makeScene2D} from '@canvas-commons/2d';
import {
  all,
  cancel,
  easeInQuad,
  easeOutQuad,
  linear,
  useThread,
  waitFor,
  type ThreadGenerator,
} from '@canvas-commons/core';
import example from '../../../motion-kit/examples/chart';
import {
  Chart,
  ChartAxis,
  ChartLine,
} from '../../../motion-kit/registry/components/Chart';
import {createTheme} from '../../../motion-kit/registry/foundations/theme';
import type {ChartMotionProbe} from './chart-motion.probe';

const Published: {resolve: (probe: ChartMotionProbe) => void} = {
  resolve: () => {},
};
window.chartMotionProbe = new Promise(resolve => {
  Published.resolve = resolve;
});

function canvas(): CanvasRenderingContext2D {
  const element = document.createElement('canvas');
  element.width = 800;
  element.height = 600;
  const context = element.getContext('2d');
  if (!context) throw new Error('Missing chart test canvas.');
  context.translate(400, 300);
  return context;
}
function paint(node: Node): CanvasRenderingContext2D {
  const context = canvas();
  node.render(context);
  return context;
}

export default makeScene2D(function* (view) {
  const labels: ChartMotionProbe['labels'] = [];
  const tips: ChartMotionProbe['tips'] = [];
  const completedAxes = new Set<ChartAxis>();
  let running = true;
  let zeroProgress = false;
  yield* all(
    (function* (): ThreadGenerator {
      yield* example.config(view);
      running = false;
    })(),
    (function* (): ThreadGenerator {
      while (running) {
        const chart = view.children().find(node => node instanceof Chart);
        if (!chart) throw new Error('Missing example chart.');
        for (const axis of chart
          .children()
          .filter((node): node is ChartAxis => node instanceof ChartAxis)) {
          if (completedAxes.has(axis)) continue;
          if (axis.progress() === 1) completedAxes.add(axis);
          const context = canvas();
          const fillText = context.fillText.bind(context);
          context.fillText = (text, x, y, maxWidth) => {
            labels.push({
              text,
              alpha: context.globalAlpha,
              progress: axis.progress(),
            });
            if (maxWidth === undefined) fillText(text, x, y);
            else fillText(text, x, y, maxWidth);
          };
          axis.render(context);
        }
        const line = chart.children().find(node => node instanceof ChartLine);
        if (!line) throw new Error('Missing example data line.');
        if (!zeroProgress && line.progress() === 0) {
          zeroProgress ||= paint(line)
            .getImageData(0, 0, 800, 600)
            .data.every(value => value === 0);
        }
        if (line.progress() > 0 && line.progress() < 1) {
          const p = line.getPointAtPercentage(line.end()).position;
          tips.push({
            progress: line.progress(),
            x: p.x / chart.width() + 0.5,
            y: 0.5 - p.y / chart.height(),
          });
        }
        yield;
      }
    })(),
  );
  const chart = view.children().find(node => node instanceof Chart);
  if (!chart) throw new Error('Missing chart.');
  const line = chart.children().find(node => node instanceof ChartLine);
  if (!line) throw new Error('Missing data line.');
  chart.size([400, 200]);
  for (const child of chart.children()) {
    if (child instanceof ChartAxis) child.opacity(0);
  }
  line.lineWidth(8);
  line.data([
    [0, 1],
    [2, 1],
  ]);
  const image = paint(chart);
  const fullStroke = image.getImageData(400, 197, 1, 1).data[3] > 0;
  const fullCap =
    image.getImageData(602, 200, 1, 1).data[3] > 0 &&
    image.getImageData(197, 200, 1, 1).data[3] > 0;
  line.data([
    [-1, 1],
    [3, 1],
  ]);
  const outside = paint(chart);
  const clippedOutside =
    outside.getImageData(150, 200, 1, 1).data[3] === 0 &&
    outside.getImageData(400, 200, 1, 1).data[3] > 0;
  yield* line.erase(0);
  const empty = paint(line)
    .getImageData(0, 0, 800, 600)
    .data.every(value => value === 0);
  yield* line.reveal(0);
  const zeroDuration = empty && line.progress() === 1;
  const thread: ThreadGenerator = yield line.reveal(1);
  yield* waitFor(0.2);
  cancel(thread);
  const before = line.progress();
  yield* waitFor(0.2);
  const cancelled = before > 0 && before < 1 && line.progress() === before;
  line.progress(0.5);
  const copy = line.clone({progress: 0.25});
  chart.add(copy);
  line.progress(0.75);
  const cloneIndependent =
    Math.abs(copy.getPointAtPercentage(copy.end()).position.x + 100) < 0.001 &&
    Math.abs(line.getPointAtPercentage(line.end()).position.x - 100) < 0.001;
  copy.end(0.2);
  const nativeEnd = copy.end() === 0.2;
  chart.theme(createTheme({motion: {enter: easeInQuad, exit: easeOutQuad}}));
  line.data([
    [0, 0],
    [2, 1],
  ]);
  const timings: ChartMotionProbe['timings'] = [];
  function* sampleTiming(
    phase: 'reveal' | 'erase' | 'linear',
    animation: ThreadGenerator,
  ): ThreadGenerator {
    const started = useThread().time();
    let running = true;
    yield* all(
      (function* (): ThreadGenerator {
        yield* animation;
        running = false;
      })(),
      (function* (): ThreadGenerator {
        while (running) {
          timings.push({
            phase,
            elapsed: Math.min(1, Math.max(0, useThread().time() - started)),
            progress: line.progress(),
            tip:
              line.getPointAtPercentage(line.end()).position.x / chart.width() +
              0.5,
          });
          yield;
        }
      })(),
    );
  }
  yield* sampleTiming('reveal', line.reveal(1));
  yield* sampleTiming('erase', line.erase(1));
  yield* sampleTiming('linear', line.reveal(1, linear));
  Published.resolve({
    labels,
    tips,
    timings,
    fullStroke,
    fullCap,
    clippedOutside,
    zeroProgress,
    zeroDuration,
    cancelled,
    nativeEnd,
    cloneIndependent,
  });
  yield* waitFor(0.1);
});
