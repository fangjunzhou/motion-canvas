import styles from './Timeline.module.scss';

import type {Scene} from '@motion-canvas/core/lib/scenes';
import type {PropertyEvent} from '@motion-canvas/core/lib/scenes/propertyEvents';
import {
  useApplication,
  usePropertyInspection,
  useTimelineContext,
} from '../../contexts';
import {useCallback, useState} from 'preact/hooks';
import {useDocumentEvent} from '../../hooks';

interface PropertyProps {
  event: PropertyEvent;
  scene: Scene;
}

export function Property({event, scene}: PropertyProps) {
  const {framesToPercents} = useTimelineContext();
  const {player} = useApplication();
  const {setEvent, setScene} = usePropertyInspection();

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
            // Seek to the property event.
            e.preventDefault();
            player.requestSeek(
              scene.firstFrame + player.status.secondsToFrames(event.time),
            );
            setPressing(true);
            setEvent(event);
            setScene(scene);
          }
        }}
        className={styles.labelClip}
        data-name={event.name}
        style={{
          left: `${framesToPercents(
            scene.firstFrame + scene.playback.secondsToFrames(event.time),
          )}%`,
        }}
      />
      <div
        className={styles.labelClipTarget}
        style={{
          left: `${framesToPercents(
            scene.firstFrame + scene.playback.secondsToFrames(event.time),
          )}%`,
        }}
      />
    </>
  );
}
