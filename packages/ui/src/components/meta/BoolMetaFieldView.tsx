import {Checkbox} from '../controls';
import {useSubscribableValue} from '../../hooks';
import type {BoolMetaField} from '@motion-canvas/core/lib/meta';
import {MetaFieldGroup} from './MetaFieldGroup';

export interface BoolMetaFieldViewProps {
  field: BoolMetaField;
  finishEdit?: () => void;
}

export function BoolMetaFieldView({field, finishEdit}: BoolMetaFieldViewProps) {
  const value = useSubscribableValue(field.onChanged);

  return (
    <MetaFieldGroup field={field}>
      <Checkbox
        checked={value}
        onChange={() => {
          field.set(!value);
          if (finishEdit) {
            finishEdit();
          }
        }}
      />
    </MetaFieldGroup>
  );
}
