import {useScene} from './useScene';
import {useThread} from './useThread';

/**
 * Register a property event and get its property value.
 *
 * @param name - The name of the event.
 * @param defaultProperty - the default property value.
 *
 * @returns The property value of the event in seconds.
 */
export function useProperty<T>(name: string, defaultProperty: T): T {
  const scene = useScene();
  const thread = useThread();
  return scene.propertyEvents.register<T>(name, thread.time(), defaultProperty);
}
