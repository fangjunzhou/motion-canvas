import {Pane} from '../tabs';
import {usePropertyInspection} from '../../contexts';
import {Separator} from '../controls';
import {MetaFieldView} from '../meta';

export function PropertiesEvent() {
  const {event, scene} = usePropertyInspection();

  event?.property.onChanged.subscribe(() => {
    scene.propertyEvents.updateAndSaveScene();
  });

  return (
    <Pane title="Property Event Inspector" id="property-event-pane">
      <Separator size={1} />
      {event ? (
        <MetaFieldView field={event.property} />
      ) : (
        'Click on a property event on the track to view its properties.'
      )}
    </Pane>
  );
}
