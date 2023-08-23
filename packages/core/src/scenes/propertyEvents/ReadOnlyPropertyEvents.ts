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

  public register<T extends Record<string, any>>(
    name: string,
    initialTime: number,
    initialVal: T,
  ): T {
    let property = this.lookup.get(name)?.property;
    if (property === undefined) {
      const event = this.scene.meta.propertyEvents
        .get()
        .find(event => event.name === name);
      property = event ? event.property : initialVal;
      this.lookup.set(name, {
        name: name,
        time: initialTime,
        property: property as T,
      });
    }

    Object.entries(initialVal).forEach(([key]) => {
      if (typeof initialVal[key] === 'object') {
        Object.assign(initialVal[key], this.lookup.get(name)?.property[key]);
      } else {
        (initialVal as Record<string, any>)[key] =
          this.lookup.get(name)?.property[key];
      }
    });

    return initialVal;
  }

  /**
   * Called when the parent scene gets reloaded.
   */
  private handleReload = () => {
    this.lookup.clear();
  };
}
