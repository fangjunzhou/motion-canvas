import type {Scene} from '../Scene';
import type {PropertyEvent} from './PropertyEvent';
import type {PropertyEvents} from './PropertyEvents';
import {ValueDispatcher} from '../../events';

/**
 * Manages property events during rendering and presentation.
 */
export class ReadOnlyPropertyEvents implements PropertyEvents {
  public get onChanged() {
    return this.events.subscribable;
  }
  private readonly events = new ValueDispatcher<PropertyEvent[]>([]);
  private lookup = new Map<string, PropertyEvent>();

  public constructor(private readonly scene: Scene) {
    scene.onReloaded.subscribe(this.handleReload);
  }

  public set() {
    // do nothing
  }

  public register<T>(name: string, initialTime: number, initialVal: T): T {
    let property = this.lookup.get(name)?.property;
    if (property === undefined) {
      const event = this.scene.meta.propertyEvents
        .get()
        .find(event => event.name === name);
      property = event ? event.property : initialVal;
      this.lookup.set(name, {
        name: name,
        time: initialTime,
        property: property,
      });
    }

    return property as T;
  }

  /**
   * Called when the parent scene gets reloaded.
   */
  private handleReload = () => {
    this.lookup.clear();
  };
}
