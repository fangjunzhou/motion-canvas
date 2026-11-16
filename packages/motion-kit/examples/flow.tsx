import {makeScene2D} from '@canvas-commons/2d';
import {waitFor} from '@canvas-commons/core';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../registry/components/Card';
import {Flow} from '../registry/components/Flow';
import {defaultTheme} from '../registry/foundations/theme';
export default makeScene2D(function* (view) {
  view.fill(defaultTheme.colors.background);
  const flow = new Flow({
    theme: defaultTheme,
    opacity: 0,
    width: 1600,
    connections: [{label: 'Process'}, {label: 'Deliver'}],
    children: ['Input', 'Transform', 'Output'].map(title => (
      <Card theme={defaultTheme} grow={1} basis={0} minWidth={0}>
        <CardHeader>
          <CardTitle text={title} />
        </CardHeader>
        <CardContent />
      </Card>
    )),
  });
  view.add(flow);
  yield* flow.enter();
  yield* flow.emphasize(1);
  yield* waitFor(2);
});
