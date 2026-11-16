import {makeProject} from '@canvas-commons/core';

import card from './scenes/motion-kit-card?scene';
import chart from './scenes/motion-kit-chart?scene';
import composition from './scenes/motion-kit-composition?scene';
import effects from './scenes/motion-kit-effects?scene';
import highlight from './scenes/motion-kit-highlight?scene';
import inkArrow from './scenes/motion-kit-ink-arrow?scene';
import paperStack from './scenes/motion-kit-paper-stack?scene';
import themes from './scenes/motion-kit-themes?scene';
import title from './scenes/motion-kit-title?scene';

export default makeProject({
  name: 'Motion Kit Showcase',
  scenes: [
    title,
    themes,
    composition,
    card,
    highlight,
    inkArrow,
    effects,
    paperStack,
    chart,
  ],
});
