import type {Scene} from '@motion-canvas/core/lib/scenes';
import {Property} from './Property';
import {useSubscribableValue} from '../../hooks';
import {useTimelineContext} from '../../contexts';
import {PropertyEvent} from '@motion-canvas/core/lib/scenes/propertyEvents';
import {useLayoutEffect, useState} from 'preact/hooks';

interface PropertyGroupProps {
  scene: Scene;
}

export function PropertyGroup({scene}: PropertyGroupProps) {
  const {firstVisibleFrame, lastVisibleFrame} = useTimelineContext();
  const events = useSubscribableValue(scene.propertyEvents.onChanged);
  const cached = useSubscribableValue(scene.onCacheChanged);
  const isVisible =
    cached.lastFrame >= firstVisibleFrame &&
    cached.firstFrame <= lastVisibleFrame;

  // Group all the events by time.
  const [eventGroups, setEventGroups] = useState(
    new Map<number, PropertyEvent[]>(),
  );
  useLayoutEffect(() => {
    eventGroups.clear();
    events.forEach(event => {
      if (!eventGroups.has(event.time)) {
        eventGroups.set(event.time, []);
      }
      eventGroups.get(event.time).push(event);
    });
    setEventGroups(eventGroups);
  }, [events]);

  return (
    <>
      {isVisible &&
        Array.from(eventGroups).map(([time, events]) => (
          <Property key={time} time={time} events={events} scene={scene} />
        ))}
    </>
  );
}
