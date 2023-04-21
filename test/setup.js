const libxml = require('../index');

if (!global.gc) {
  throw new Error('must run with --expose_gc for memory management tests');
}

function collectGarbage(minCycles = 3, maxCycles = 15) {
  let cycles = 0;
  let freedRss = 0;
  let lastFreedRss = 0;
  let usage = process.memoryUsage();

  do {
    global.gc();

    const usageAfterGc = process.memoryUsage();

    lastFreedRss = freedRss;
    freedRss = lastFreedRss + usage.rss - usageAfterGc.rss;
    usage = usageAfterGc;

    cycles += 1;
  } while (cycles < minCycles || (freedRss !== 0 && cycles < maxCycles));

  return usage;
}

afterEach(() => {
  collectGarbage(8);
  // Memory leak test
  // eslint-disable-next-line jest/no-standalone-expect
  expect(libxml.nodeCount()).not.toBeGreaterThan(0);
});
