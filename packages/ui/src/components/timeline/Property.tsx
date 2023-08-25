import styles from './Timeline.module.scss';

import type {Scene} from '@motion-canvas/core/lib/scenes';
import type {PropertyEvent} from '@motion-canvas/core/lib/scenes/propertyEvents';
import {usePropertyInspection, useTimelineContext} from '../../contexts';
import {useCallback, useState} from 'preact/hooks';
import {useDocumentEvent} from '../../hooks';

interface PropertyProps {
  time: number;
  events: PropertyEvent[];
  scene: Scene;
}

export function Property({time, events, scene}: PropertyProps) {
  const {framesToPercents} = useTimelineContext();
  const {setEvents, setScene} = usePropertyInspection();

  const [isPressing, setPressing] = useState(true);
  // Disable drop seek when press down.
  useDocumentEvent(
    'mouseup',
    useCallback(
      event => {
        if (isPressing) {
          event.stopPropagation();
          setPressing(false);
        }
      },
      [isPressing],
    ),
    isPressing,
    true,
  );

  return (
    <>
      <div
        onMouseDown={e => {
          if (e.button === 0) {
            e.preventDefault();
            setPressing(true);
            setEvents(events);
            setScene(scene);
          }
        }}
        className={styles.labelClip}
        data-name={
          events.length === 1
            ? events[0].property.name
            : `${events[0].property.name} +${events.length - 1}`
        }
        style={{
          left: `${framesToPercents(
            scene.firstFrame + scene.playback.secondsToFrames(time),
          )}%`,
        }}
      />
      <div
        className={styles.labelClipTarget}
        style={{
          left: `${framesToPercents(
            scene.firstFrame + scene.playback.secondsToFrames(time),
          )}%`,
        }}
      />
    </>
  );
}
