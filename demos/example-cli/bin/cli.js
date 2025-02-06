#!/usr/bin/env node --no-deprecation
import 'source-map-support/register.js'; // required for cross platform source map support, other options didn't work across OSes.

import { main } from '../dist/index.js';

main();
