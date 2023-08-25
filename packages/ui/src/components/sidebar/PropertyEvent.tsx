import {Pane} from '../tabs';
import {usePropertyInspection} from '../../contexts';
import {Separator} from '../controls';
import {MetaFieldView} from '../meta';
import {useCallback, useState} from 'preact/hooks';

export function PropertiesEvent() {
  const {event, scene} = usePropertyInspection();
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
    <Pane title="Property Event Inspector" id="property-event-pane">
      <Separator size={1} />
      {event ? (
        <MetaFieldView
          field={event.property}
          finishEdit={onSaveProperty}
          onMove={onPropertyChanged}
        />
      ) : (
        'Click on a property event on the track to view its properties.'
      )}
    </Pane>
  );
}
