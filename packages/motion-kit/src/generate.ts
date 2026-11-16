import {fileURLToPath} from 'node:url';
import {buildCatalog} from './build';
import {catalog} from './catalog';

const Result = await buildCatalog(
  catalog,
  fileURLToPath(new URL('../', import.meta.url)),
);
console.info(
  `Built ${catalog.items.length} Motion Kit items in ${Result.directory}`,
);
