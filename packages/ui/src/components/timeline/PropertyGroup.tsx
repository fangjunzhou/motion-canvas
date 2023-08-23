import type {Scene} from '@motion-canvas/core/lib/scenes';
import {Property} from './Property';
import {useSubscribableValue} from '../../hooks';
import {useTimelineContext} from '../../contexts';

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

  return (
    <>
      {isVisible &&
        events.map(event => (
          <Property key={event.name} event={event} scene={scene} />
        ))}
    </>
  );
}
