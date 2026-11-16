import type {ThreadGenerator, TimingFunction} from '@canvas-commons/core';

/**
 * A scene-scheduled animation. Duration is in seconds; calling it does not play it.
 *
 * @example
 * ```ts
 * yield* component.enter(0.4, easeOutCubic);
 * ```
 */
export type MotionMethod = (
  duration?: number,
  easing?: TimingFunction,
) => ThreadGenerator;

/**
 * Optional capabilities. Implement only methods that make sense for a component.
 * Methods animate existing state and leave scene timing to their caller.
 *
 * @example
 * ```ts
 * function* introduce(component: MotionMethods): ThreadGenerator {
 *   if (component.enter) yield* component.enter(0.4);
 * }
 * ```
 */
export interface MotionMethods {
  readonly enter?: MotionMethod;
  readonly exit?: MotionMethod;
  readonly emphasize?: MotionMethod;
}
