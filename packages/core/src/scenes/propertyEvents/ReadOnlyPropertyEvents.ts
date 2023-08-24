import type {Scene} from '../Scene';
import type {PropertyEvent} from './PropertyEvent';
import type {PropertyEvents} from './PropertyEvents';
import {ValueDispatcher} from '../../events';
import {MetaField} from '../../meta';

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

  public updateScene(): void {
    // do nothing
  }

  public updateAndSaveScene(): void {
    // do nothing
  }

  public register<T extends MetaField<any>>(
    initialTime: number,
    initialVal: T,
  ): T {
    const name = initialVal.name;
    let property = this.lookup.get(name)?.property;
    if (property === undefined) {
      const event = this.scene.meta.propertyEvents
        .get()
        .find(event => event.name === name);
      if (event) {
        initialVal.set(event.serializedProperty);
      }
      property = initialVal;
      this.lookup.set(name, {
        time: initialTime,
        property: property as T,
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
