// The run order of eras. To add an era (70s, 10s), copy an era file,
// change its data, and add it to this list — no other code changes needed.
import era80s from './era80s.js';
import era90s from './era90s.js';
import era00s from './era00s.js';

export const ERAS = [era80s, era90s, era00s];
