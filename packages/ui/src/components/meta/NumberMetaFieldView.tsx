import type {NumberMetaField} from '@motion-canvas/core/lib/meta';
import {Input, InputSelect} from '../controls';
import {useDrag, useSubscribableValue} from '../../hooks';
import {MetaFieldGroup} from './MetaFieldGroup';
import {useCallback, useState} from 'preact/hooks';

export interface NumberMetaFieldViewProps {
  field: NumberMetaField;
}

export function NumberMetaFieldView({field}: NumberMetaFieldViewProps) {
  const value = useSubscribableValue(field.onChanged);
  const [fieldValue, setFieldValue] = useState(value);
  const presets = field.getPresets();
  const [handleDrag] = useDrag(
    useCallback(
      dx => {
        setFieldValue(fieldValue + dx);
      },
      [fieldValue],
    ),
    useCallback(() => {
      field.set(fieldValue);
    }, [field, fieldValue]),
    null,
    false,
  );

  return (
    <MetaFieldGroup field={field}>
      {presets.length ? (
        <InputSelect
          type="number"
          value={value}
          onChange={value => {
            field.set(value);
          }}
          options={presets}
        />
      ) : (
        <Input
          type="number"
          value={fieldValue}
          onChange={event => {
            field.set((event.target as HTMLInputElement).value);
          }}
          onMouseDown={handleDrag}
        />
      )}
    </MetaFieldGroup>
  );
}
