import type {Scene} from '../Scene';
import type {PropertyEvents} from './PropertyEvents';
import type {PropertyEvent} from './PropertyEvent';
import type {SerializedPropertyEvent} from './SerializedPropertyEvent';
import {ValueDispatcher} from '../../events';

/**
 * Manages time events during editing.
 */
export class EditablePropertyEvents implements PropertyEvents {
  public get onChanged() {
    return this.events.subscribable;
  }
  private readonly events = new ValueDispatcher<PropertyEvent[]>([]);

  private registeredEvents: Record<string, PropertyEvent> = {};
  private lookup: Record<string, PropertyEvent> = {};
  private collisionLookup = new Set<string>();
  private previousReference: SerializedPropertyEvent[] = [];
  private didEventsChange = false;

  public constructor(private readonly scene: Scene) {
    this.previousReference = scene.meta.propertyEvents.get();
    this.load(this.previousReference);

    scene.onReloaded.subscribe(this.handleReload);
    scene.onRecalculated.subscribe(this.handleRecalculated);
    scene.onReset.subscribe(this.handleReset);
    scene.meta.propertyEvents.onChanged.subscribe(
      this.handleMetaChanged,
      false,
    );
  }

  public set(name: string, property: any) {
    if (!this.lookup[name] || this.lookup[name].property === property) {
      return;
    }
    this.lookup[name] = {
      ...this.lookup[name],
      property,
    };
    this.registeredEvents[name] = this.lookup[name];
    this.events.current = Object.values(this.registeredEvents);
    this.didEventsChange = true;
    this.scene.reload();
  }

  public register<T extends object>(
    name: string,
    initialTime: number,
    initialVal: T,
  ): T {
    if (this.collisionLookup.has(name)) {
      this.scene.logger.error({
        message: `name "${name}" has already been used for another event name.`,
        stack: new Error().stack,
      });
      return initialVal;
    }

    this.collisionLookup.add(name);
    if (!this.lookup[name]) {
      this.didEventsChange = true;
      this.lookup[name] = {
        name,
        time: initialTime,
        property: initialVal,
      };
    } else {
      let changed = false;
      const event = {...this.lookup[name]};

      // Event time change.
      if (event.time !== initialTime) {
        event.time = initialTime;
        changed = true;
      }

      // Property keys not fit.
      if (!this.compareKeys(event.property, initialVal)) {
        event.property = initialVal;
        changed = true;
      }

      if (changed) {
        this.lookup[name] = event;
      }
    }

    this.registeredEvents[name] = this.lookup[name];

    Object.assign(initialVal, this.lookup[name].property);

    return initialVal as T;
  }

  private compareKeys(src: object, target: object) {
    const srcKeys = Object.keys(src).sort();
    const targetKeys = Object.keys(target).sort();
    return JSON.stringify(srcKeys) === JSON.stringify(targetKeys);
  }

  /**
   * Called when the parent scene gets reloaded.
   */
  private handleReload = () => {
    this.registeredEvents = {};
    this.collisionLookup.clear();
  };

  /**
   * Called when the parent scene gets recalculated.
   */
  private handleRecalculated = () => {
    this.events.current = Object.values(this.registeredEvents);

    if (
      this.didEventsChange ||
      (this.previousReference?.length ?? 0) !== this.events.current.length
    ) {
      this.didEventsChange = false;
      this.previousReference = Object.values(this.registeredEvents).map(
        event => ({
          name: event.name,
          property: event.property,
        }),
      );
      this.scene.meta.propertyEvents.set(this.previousReference);
    }
  };

  private handleReset = () => {
    this.collisionLookup.clear();
  };

  /**
   * Called when the meta of the parent scene changes.
   */
  private handleMetaChanged = (data: SerializedPropertyEvent[]) => {
    // Ignore the event if `timeEvents` hasn't changed.
    // This may happen when another part of metadata has changed triggering
    // this event.
    if (data === this.previousReference) return;
    this.previousReference = data;
    this.load(data);
    this.scene.reload();
  };

  private load(events: SerializedPropertyEvent[]) {
    for (const event of events) {
      const previous = this.lookup[event.name] ?? {
        name: event.name,
        time: 0,
        property: event.property,
      };

      this.lookup[event.name] = {
        ...previous,
      };
    }
  }
}
