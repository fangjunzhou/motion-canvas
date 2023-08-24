import type {SubscribableValueEvent} from '../../events';
import {MetaField} from '../../meta';
import type {PropertyEvent} from './PropertyEvent';

/**
 * An interface for classes managing the property events.
 */
export interface PropertyEvents {
  /**
   * Triggered when property events change.
   *
   * @eventProperty
   */
  get onChanged(): SubscribableValueEvent<PropertyEvent[]>;
  /**
   * Change the property value of the given event.
   *
   * @param name - The name of the event.
   * @param property - The serialized property object.
   */
  set(name: string, property: any): void;
  /**
   * Register a property event.
   *
   * @param initialTime - Time in seconds, relative to the beginning of the
   *                      scene, at which the event was registered.
   * @param initialVal - The default value of the property.
   *
   * @returns The property of the event.
   *
   * @internal
   */
  register<T extends MetaField<any>>(initialTime: number, initialVal: T): T;
}
