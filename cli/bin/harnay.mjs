#!/usr/bin/env node
import { main } from '../src/main.mjs';

main(process.argv.slice(2)).then(
  (code) => process.exit(code ?? 0),
  (error) => {
    console.error(`\nharnay: ${error?.userMessage ?? error?.message ?? error}`);
    process.exit(1);
  },
);
