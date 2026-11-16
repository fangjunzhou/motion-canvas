import {makeScene2D} from '@canvas-commons/2d';
import {waitFor} from '@canvas-commons/core';
import {List, ListItem} from '../registry/components/List';
import {defaultTheme} from '../registry/foundations/theme';
export default makeScene2D(function* (view) {
  view.fill(defaultTheme.colors.background);
  const list = new List({
    theme: defaultTheme,
    width: 1200,
    children: [
      new ListItem({text: 'Set up a resting layout.'}),
      new ListItem({text: 'Schedule the reveal from the scene.'}),
      new ListItem({
        text: 'Wrapping lines share the marker on the first line.',
      }),
    ],
  });
  view.add(list);
  yield* list.enter();
  yield* waitFor(2);
});
