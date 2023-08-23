import {Pane} from '../tabs';
import {usePropertyInspection} from '../../contexts';
import {AutoField} from '../fields';
import {Group, Label, Separator} from '../controls';

export function PropertiesEvent() {
  const {event} = usePropertyInspection();

  return (
    <Pane title="Property Event Inspector" id="property-event-pane">
      <Separator size={1} />
      {event
        ? Object.entries(event.property).map(([key, value]) => (
            <Group>
              <Label>{key}</Label>
              <AutoField value={value} />
            </Group>
          ))
        : 'Click on a property event on the track to view its properties.'}
    </Pane>
  );
}
