/**
 * Static reference data, bundled at build time. Only the high score table
 * is dynamic (served through the PHP API) — everything else here is
 * read-only game content, so a build-time import is simpler than a runtime
 * fetch and needs no CORS handling.
 */
import stationsData from '../../data/stations.json';
import rulesData from '../../data/rules.json';
import commentaryData from '../../data/commentary.json';

export { stationsData, rulesData, commentaryData };
