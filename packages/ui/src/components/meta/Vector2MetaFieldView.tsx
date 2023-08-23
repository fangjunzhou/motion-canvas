import {Input} from '../controls';
import {useDrag, useSubscribableValue} from '../../hooks';
import {Vector2MetaField} from '@motion-canvas/core/lib/meta';
import {MetaFieldGroup} from './MetaFieldGroup';
import {useCallback} from 'preact/hooks';

export interface Vector2MetaFieldViewProps {
  field: Vector2MetaField;
}

export function Vector2MetaFieldView({field}: Vector2MetaFieldViewProps) {
  const value = useSubscribableValue(field.onChanged);
  const [handleDragX] = useDrag(
    useCallback(
      dx => {
        field.set([value.x + dx, value.y]);
      },
      [value],
    ),
    null,
    null,
    false,
  );
  const [handleDragY] = useDrag(
    useCallback(
      dx => {
        field.set([value.x, value.y + dx]);
      },
      [value],
    ),
    null,
    null,
    false,
  );

  return (
    <MetaFieldGroup field={field}>
      <Input
        type="number"
        value={value.x}
        onChange={event => {
          const x = parseInt((event.target as HTMLInputElement).value);
          field.set([x, value.y]);
        }}
        onMouseDown={handleDragX}
      />
      <Input
        type="number"
        value={value.y}
        onChange={event => {
          const y = parseInt((event.target as HTMLInputElement).value);
          field.set([value.x, y]);
        }}
        onMouseDown={handleDragY}
      />
    </MetaFieldGroup>
  );
}
