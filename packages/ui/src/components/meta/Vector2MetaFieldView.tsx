import {Input} from '../controls';
import {MoveCallback, useDrag, useSubscribableValue} from '../../hooks';
import {Vector2MetaField} from '@motion-canvas/core/lib/meta';
import {MetaFieldGroup} from './MetaFieldGroup';
import {useCallback, useLayoutEffect, useState} from 'preact/hooks';

export interface Vector2MetaFieldViewProps {
  field: Vector2MetaField;
  finishEdit?: () => void;
  onMove?: MoveCallback;
}

export function Vector2MetaFieldView({
  field,
  finishEdit,
  onMove,
}: Vector2MetaFieldViewProps) {
  const value = useSubscribableValue(field.onChanged);
  const [xValue, setXValue] = useState(value.x);
  const [yValue, setYValue] = useState(value.y);

  useLayoutEffect(() => {
    setXValue(value.x);
    setYValue(value.y);
  }, [value]);

  const [handleDragX] = useDrag(
    useCallback(
      (dx, dy, x, y) => {
        field.set([value.x + dx, value.y]);
        setXValue(field.get().x);
        if (onMove) {
          onMove(dx, dy, x, y);
        }
      },
      [xValue],
    ),
    useCallback(() => {
      if (finishEdit) {
        finishEdit();
      }
    }, []),
    null,
    false,
  );
  const [handleDragY] = useDrag(
    useCallback(
      (dx, dy, x, y) => {
        field.set([value.x, value.y + dx]);
        setYValue(field.get().y);
        if (onMove) {
          onMove(dx, dy, x, y);
        }
      },
      [yValue],
    ),
    useCallback(() => {
      if (finishEdit) {
        finishEdit;
      }
    }, []),
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
          setXValue(x);
          field.set([x, value.y]);
          if (finishEdit) {
            finishEdit();
          }
        }}
        onMouseDown={handleDragX}
      />
      <Input
        type="number"
        value={yValue}
        onChange={event => {
          const y = parseInt((event.target as HTMLInputElement).value);
          setYValue(y);
          field.set([value.x, y]);
          if (finishEdit) {
            finishEdit();
          }
        }}
        onMouseDown={handleDragY}
      />
    </MetaFieldGroup>
  );
}
