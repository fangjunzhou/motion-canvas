import {Pane} from '../tabs';
import {usePropertyInspection} from '../../contexts';
import {MetaFieldView} from '../meta';
import {useCallback, useState} from 'preact/hooks';
import {Expandable} from '../fields';

export function PropertiesEvent() {
  const {events, scene} = usePropertyInspection();

  return (
    <Pane title="Property Event Inspector" id="property-event-pane">
      {events
        ? events.map(event => {
            const [property, setProperty] = useState({});

            // Update scene.
            const onPropertyChanged = useCallback(() => {
              if (scene?.isCached()) {
                scene.reload();
              }
            }, [scene]);
            // Save property.
            const onSaveProperty = useCallback(() => {
              scene?.propertyEvents.set(event.property.name, property);
            }, [event, property, scene]);
            // Record property.
            event?.property.onChanged.subscribe(field => {
              setProperty(field);
            });

            return (
              <Expandable title={event.property.name} open>
                <MetaFieldView
                  field={event.property}
                  finishEdit={onSaveProperty}
                  onMove={onPropertyChanged}
                />
              </Expandable>
            );
          })
        : 'Click on a property event on the track to view its properties.'}
    </Pane>
  );
}
