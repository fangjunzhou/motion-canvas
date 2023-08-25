import type {NumberMetaField} from '@motion-canvas/core/lib/meta';
import {Input, InputSelect} from '../controls';
import {MoveCallback, useDrag, useSubscribableValue} from '../../hooks';
import {MetaFieldGroup} from './MetaFieldGroup';
import {useCallback, useLayoutEffect, useState} from 'preact/hooks';

export interface NumberMetaFieldViewProps {
  field: NumberMetaField;
  finishEdit?: () => void;
  onMove?: MoveCallback;
}

export function NumberMetaFieldView({
  field,
  finishEdit,
  onMove,
}: NumberMetaFieldViewProps) {
  const value = useSubscribableValue(field.onChanged);
  const [fieldValue, setFieldValue] = useState(value);
  const presets = field.getPresets();

  useLayoutEffect(() => {
    setFieldValue(value);
  }, [value]);

  const [handleDrag] = useDrag(
    useCallback(
      (dx, dy, x, y) => {
        field.set(value + dx);
        setFieldValue(field.get());
        if (onMove) {
          onMove(dx, dy, x, y);
        }
      },
      [field, fieldValue],
    ),
    useCallback(() => {
      if (finishEdit) {
        finishEdit();
      }
    }, []),
    null,
    false,
  );

  return (
    <MetaFieldGroup field={field}>
      {presets.length ? (
        <InputSelect
          type="number"
          value={fieldValue}
          onChange={value => {
            setFieldValue(value);
            field.set(value);
            if (finishEdit) {
              finishEdit();
            }
          }}
          options={presets}
        />
      ) : (
        <Input
          type="number"
          value={fieldValue}
          onChange={event => {
            setFieldValue(parseFloat((event.target as HTMLInputElement).value));
            field.set((event.target as HTMLInputElement).value);
            finishEdit();
          }}
          onMouseDown={handleDrag}
        />
      )}
    </MetaFieldGroup>
  );
}
