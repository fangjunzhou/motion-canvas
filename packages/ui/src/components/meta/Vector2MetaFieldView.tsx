import {Input} from '../controls';
import {useDrag, useSubscribableValue} from '../../hooks';
import {Vector2MetaField} from '@motion-canvas/core/lib/meta';
import {MetaFieldGroup} from './MetaFieldGroup';
import {useCallback, useState} from 'preact/hooks';

export interface Vector2MetaFieldViewProps {
  field: Vector2MetaField;
}

export function Vector2MetaFieldView({field}: Vector2MetaFieldViewProps) {
  const value = useSubscribableValue(field.onChanged);
  const [xValue, setXValue] = useState(value.x);
  const [yValue, setYValue] = useState(value.y);
  const [handleDragX] = useDrag(
    useCallback(
      dx => {
        setXValue(xValue + dx);
      },
      [xValue],
    ),
    useCallback(() => {
      field.set([xValue, yValue]);
    }, [field, xValue, yValue]),
    null,
    false,
  );
  const [handleDragY] = useDrag(
    useCallback(
      dx => {
        setYValue(yValue + dx);
      },
      [yValue],
    ),
    useCallback(() => {
      field.set([xValue, yValue]);
    }, [field, xValue, yValue]),
    null,
    false,
  );

  return (
    <MetaFieldGroup field={field}>
      <Input
        type="number"
        value={xValue}
        onChange={event => {
          const x = parseInt((event.target as HTMLInputElement).value);
          field.set([x, value.y]);
        }}
        onMouseDown={handleDragX}
      />
      <Input
        type="number"
        value={yValue}
        onChange={event => {
          const y = parseInt((event.target as HTMLInputElement).value);
          field.set([value.x, y]);
        }}
        onMouseDown={handleDragY}
      />
    </MetaFieldGroup>
  );
}
