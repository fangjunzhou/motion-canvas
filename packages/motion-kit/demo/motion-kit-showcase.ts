import {makeProject} from '@canvas-commons/core';

import card from './scenes/motion-kit-card?scene';
import composition from './scenes/motion-kit-composition?scene';
import themes from './scenes/motion-kit-themes?scene';

export default makeProject({
  name: 'Motion Kit Showcase',
  scenes: [themes, composition, card],
});
