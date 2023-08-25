import {Scene} from '@motion-canvas/core';
import {PropertyEvent} from '@motion-canvas/core/lib/scenes/propertyEvents';
import {ComponentChildren, createContext} from 'preact';
import {useContext, useMemo, useState} from 'preact/hooks';

export interface PropertyInspectionState {
  events: PropertyEvent[] | null;
  scene: Scene | null;
  setEvents: (event: PropertyEvent[] | null) => void;
  setScene: (scene: Scene | null) => void;
}

const PropertyInspectionContext = createContext<PropertyInspectionState>({
  events: null,
  scene: null,
  setEvents: () => {
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
  const [events, setEvents] = useState<PropertyEvent[] | null>(null);
  const [scene, setScene] = useState<Scene | null>(null);

  const state = useMemo(
    () => ({
      events,
      scene,
      setEvents,
      setScene,
    }),
    [events, scene],
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
