/**
 * Represents a property event at runtime.
 */
export interface PropertyEvent {
  /**
   * Name of the event.
   */
  name: string;
  /**
   * Time in seconds, relative to the beginning of the scene, at which the event
   * was registered.
   */
  time: number;
  /**
   * Property of the event.
   */
  property: any;
}
