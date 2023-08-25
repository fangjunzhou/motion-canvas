import {Input} from '../controls';
import {MoveCallback, useDrag, useSubscribableValue} from '../../hooks';
import {Vector2MetaField} from '@motion-canvas/core/lib/meta';
import {MetaFieldGroup} from './MetaFieldGroup';
import {useCallback, useLayoutEffect, useState} from 'preact/hooks';
import {Vector2} from '@motion-canvas/core';

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
  const [vec2, setVec2] = useState(value);

  useLayoutEffect(() => {
    setVec2(value);
  }, [value]);

  const [handleDragX] = useDrag(
    useCallback(
      (dx, dy, x, y) => {
        const newVec = vec2.addX(dx);
        field.set(newVec);
        setVec2(newVec);
        if (onMove) {
          onMove(dx, dy, x, y);
        }
      },
      [vec2],
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
        const newVec = vec2.addY(dx);
        field.set(newVec);
        setVec2(newVec);
        if (onMove) {
          onMove(dx, dy, x, y);
        }
      },
      [vec2],
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
        value={vec2.x}
        onChange={event => {
          const x = parseInt((event.target as HTMLInputElement).value);
          setVec2(new Vector2(x, vec2.y));
          field.set([x, vec2.y]);
          if (finishEdit) {
            finishEdit();
          }
        }}
        onMouseDown={handleDragX}
      />
      <Input
        type="number"
        value={vec2.y}
        onChange={event => {
          const y = parseInt((event.target as HTMLInputElement).value);
          setVec2(new Vector2(vec2.x, y));
          field.set([vec2.x, y]);
          if (finishEdit) {
            finishEdit();
          }
        }}
        onMouseDown={handleDragY}
      />
    </MetaFieldGroup>
  );
}
