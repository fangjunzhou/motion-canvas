import {makeScene2D, Txt} from '@canvas-commons/2d';
import {createRef, waitFor} from '@canvas-commons/core';
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../registry/components/Card';
import {PaperStack, PaperStackItem} from '../registry/components/PaperStack';
import {defaultTheme} from '../registry/foundations/theme';

export default makeScene2D(function* (view) {
  const stack = createRef<PaperStack>();
  view.fill(defaultTheme.colors.background);
  view.add(
    <PaperStack ref={stack} visibleCount={0} offset={[40, 32]}>
      {['Block the poses.', 'Set the timing.', 'Refine the motion.'].map(
        (text, index) => (
          <PaperStackItem width={800} height={400}>
            <CardHeader>
              <CardTitle text={`Pass ${index + 1}`} />
              <CardDescription text={text} />
            </CardHeader>
            <CardContent>
              <Txt
                fill={defaultTheme.colors.foreground}
                text="Each pass builds on the one before it."
                textWrap
              />
            </CardContent>
          </PaperStackItem>
        ),
      )}
    </PaperStack>,
  );
  yield* stack().show(3);
  yield* waitFor(1);
  yield* stack().focus(1);
  yield* waitFor(1);
  yield* stack().focus(2);
  yield* waitFor(1);
  yield* stack().focus(0);
  yield* waitFor(1);
});
