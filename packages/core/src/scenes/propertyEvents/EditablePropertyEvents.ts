import type {Scene} from '../Scene';
import type {PropertyEvents} from './PropertyEvents';
import type {PropertyEvent} from './PropertyEvent';
import {ValueDispatcher} from '../../events';
import {MetaField} from '../../meta';
import {SerializedPropertyEvent} from './SerializedPropertyEvent';

/**
 * Manages time events during editing.
 */
export class EditablePropertyEvents implements PropertyEvents {
  public get onChanged() {
    return this.events.subscribable;
  }
  private readonly events = new ValueDispatcher<PropertyEvent[]>([]);

  private registeredEvents: Record<string, PropertyEvent> = {};
  private serializedRegisteredEvents: Record<string, SerializedPropertyEvent> =
    {};
  private lookup: Record<string, PropertyEvent> = {};
  private serializedLookup: Record<string, SerializedPropertyEvent> = {};
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
    if (
      !this.serializedRegisteredEvents[name] ||
      this.serializedRegisteredEvents[name].serializedProperty === property
    ) {
      return;
    }
    this.serializedRegisteredEvents[name] = {
      ...this.serializedRegisteredEvents[name],
      serializedProperty: property,
    };
    this.events.current = Object.values(this.registeredEvents);
    this.didEventsChange = true;
    this.scene.reload();
  }

  public register<T extends MetaField<any>>(
    initialTime: number,
    initialVal: T,
  ): T {
    const name = initialVal.name;

    if (this.collisionLookup.has(name)) {
      this.scene.logger.error({
        message: `name "${name}" has already been used for another event name.`,
        stack: new Error().stack,
      });
      return initialVal;
    }

    this.collisionLookup.add(name);
    if (!this.lookup[name]) {
      // Check serialization buffer.
      if (this.serializedLookup[name]) {
        initialVal.set(this.serializedLookup[name].serializedProperty);
      } else {
        this.didEventsChange = true;
      }
      this.lookup[name] = {
        time: initialTime,
        property: initialVal,
      };
    } else {
      let changed = false;
      const event = this.lookup[name];

      // Event time change.
      if (event.time !== initialTime) {
        this.didEventsChange = true;
        event.time = initialTime;
        changed = true;
      }

      if (changed) {
        this.lookup[name] = event;
      }
    }

    this.registeredEvents[name] = this.lookup[name];
    this.serializedRegisteredEvents[name] = {
      name: this.lookup[name].property.name,
      serializedProperty: this.lookup[name].property.serialize(),
    };

    return this.lookup[name].property as T;
  }

  /**
   * Called when the parent scene gets reloaded.
   */
  private handleReload = () => {
    this.registeredEvents = {};
    this.serializedRegisteredEvents = {};
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
      this.previousReference = Object.values(this.serializedRegisteredEvents);
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
      // If the value is not registered, save to the buffer for future deserialization.
      this.serializedLookup[event.name] = event;
      // Deserialize.
      if (this.lookup[event.name]) {
        this.lookup[event.name].property.set(event);
      }
    }
  }
}
