import {Scene} from '@motion-canvas/core';
import {PropertyEvent} from '@motion-canvas/core/lib/scenes/propertyEvents';
import {ComponentChildren, createContext} from 'preact';
import {useContext, useMemo, useState} from 'preact/hooks';

export interface PropertyInspectionState {
  event: PropertyEvent | null;
  scene: Scene | null;
  setEvent: (event: PropertyEvent | null) => void;
  setScene: (scene: Scene | null) => void;
}

const PropertyInspectionContext = createContext<PropertyInspectionState>({
  event: null,
  scene: null,
  setEvent: () => {
    throw new Error('setEvent not implemented');
  },
  setScene: () => {
    throw new Error('setScene not implemented');
  },
});

export function PropertyInspectionProvider({
  children,
}: {
  children: ComponentChildren;
}) {
  const [event, setEvent] = useState<PropertyEvent | null>(null);
  const [scene, setScene] = useState<Scene | null>(null);

  const state = useMemo(
    () => ({
      event,
      scene,
      setEvent,
      setScene,
    }),
    [event, scene],
  );

  return (
    <PropertyInspectionContext.Provider value={state}>
      {children}
    </PropertyInspectionContext.Provider>
  );
}

export function usePropertyInspection() {
  return useContext(PropertyInspectionContext);
}
