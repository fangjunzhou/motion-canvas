import type {MetaField, ObjectMetaField} from '@motion-canvas/core/lib/meta';
import {MetaFieldView} from './MetaFieldView';
import {MoveCallback, useSubscribableValue} from '../../hooks';

export interface ObjectMetaFieldViewProps {
  field: ObjectMetaField<any>;
  finishEdit?: () => void;
  onMove?: MoveCallback;
}

export function ObjectMetaFieldView({
  field,
  finishEdit,
  onMove,
}: ObjectMetaFieldViewProps) {
  const fields: MetaField<any>[] = useSubscribableValue(field.onFieldsChanged);

  return (
    <>
      {fields.map(subfield => (
        <MetaFieldView
          field={subfield}
          onMove={onMove}
          finishEdit={finishEdit}
        />
      ))}
    </>
  );
}
