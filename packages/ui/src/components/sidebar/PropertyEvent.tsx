import {Pane} from '../tabs';
import {usePropertyInspection} from '../../contexts';
import {
  isType,
  MetaField,
  NumberMetaField,
  Vector2,
  Vector2MetaField,
} from '@motion-canvas/core';
import {Separator} from '../controls';
import {MetaFieldView} from '../meta';

export function PropertiesEvent() {
  const {event, scene} = usePropertyInspection();

  return (
    <Pane title="Property Event Inspector" id="property-event-pane">
      <Separator size={1} />
      {event
        ? Object.entries(event.property).map(([key, value]) => {
            let metaField = new MetaField(key, value);
            if (isType(value)) {
              switch (value.toSymbol()) {
                case Vector2.symbol:
                  metaField = new Vector2MetaField(key, value as Vector2);
                  break;

                default:
                  break;
              }
            } else if (typeof value === 'number') {
              metaField = new NumberMetaField(key, value);
            }

            metaField.onChanged.subscribe(val => {
              event.property[key] = val;
              scene.reload();
            });

            return <MetaFieldView field={metaField} />;
          })
        : 'Click on a property event on the track to view its properties.'}
    </Pane>
  );
}
