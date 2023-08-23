import styles from './Timeline.module.scss';

import {useScenes} from '../../hooks';
import {PropertyGroup} from './PropertyGroup';

export function PropertyTrack() {
  const scenes = useScenes();

  return (
    <div className={styles.labelTrack}>
      {scenes.map(scene => (
        <PropertyGroup key={scene.name} scene={scene} />
      ))}
    </div>
  );
}
