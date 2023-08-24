import {MetaField} from '../../meta';

/**
 * Represents a property event at runtime.
 */
export interface PropertyEvent {
  /**
   * Time in seconds, relative to the beginning of the scene, at which the event
   * was registered.
   */
  time: number;
  /**
   * Property of the event.
   */
  property: MetaField<any>;
}
