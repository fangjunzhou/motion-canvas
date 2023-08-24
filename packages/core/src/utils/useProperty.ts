import {MetaField} from '../meta';
import {useScene} from './useScene';
import {useThread} from './useThread';

/**
 * Register a property event and get its property value.
 *
 * @param defaultProperty - the default property value.
 *
 * @returns The property value of the event in seconds.
 */
export function useProperty<T extends MetaField<any>>(defaultProperty: T): T {
  const scene = useScene();
  const thread = useThread();
  return scene.propertyEvents.register<T>(thread.time(), defaultProperty);
}
