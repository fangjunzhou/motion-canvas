import {Input, InputSelect} from '../controls';
import {useSubscribableValue} from '../../hooks';
import type {StringMetaField} from '@motion-canvas/core/lib/meta';
import {MetaFieldGroup} from './MetaFieldGroup';

export interface StringMetaFieldViewProps {
  field: StringMetaField;
  finishEdit?: () => void;
}

export function StringMetaFieldView({
  field,
  finishEdit,
}: StringMetaFieldViewProps) {
  const value = useSubscribableValue(field.onChanged);
  const presets = field.getPresets();

  return (
    <MetaFieldGroup field={field}>
      {presets.length > 0 ? (
        <InputSelect
          value={value}
          onChange={value => {
            field.set(value);
            if (finishEdit) {
              finishEdit();
            }
          }}
          options={presets}
        />
      ) : (
        <Input
          value={value}
          onChange={event => {
            field.set((event.target as HTMLInputElement).value);
            if (finishEdit) {
              finishEdit();
            }
          }}
        />
      )}
    </MetaFieldGroup>
  );
}
