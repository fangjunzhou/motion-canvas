import {MetaField, ObjectMetaField} from '../meta';
import {SerializedTimeEvent} from './timeEvents';
import {Random} from './Random';
import {SerializedPropertyEvent} from './propertyEvents';

/**
 * Create a runtime representation of the scene metadata.
 */
export function createSceneMetadata() {
  return new ObjectMetaField('scene', {
    version: new MetaField('version', 1),
    timeEvents: new MetaField<SerializedTimeEvent[]>('time events', []),
    propertyEvents: new MetaField<SerializedPropertyEvent[]>(
      'property events',
      [],
    ),
    seed: new MetaField('seed', Random.createSeed()),
  });
}

/**
 * A runtime representation of the scene metadata.
 */
export type SceneMetadata = ReturnType<typeof createSceneMetadata>;
