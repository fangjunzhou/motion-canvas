import type {ThreadGenerator} from '@canvas-commons/core';
import type {MotionMethods} from '../registry/motion/contracts';

export function* introduce(component: MotionMethods): ThreadGenerator {
  if (component.enter) {
    yield* component.enter(0.4);
  }
}
