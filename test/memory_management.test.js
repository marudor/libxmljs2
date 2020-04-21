const libxml = require('../index');

if (!global.gc) {
  throw new Error('must run with --expose_gc for memory management tests');
}

describe('memory management', () => {
  function collectGarbage(minCycles = 3, maxCycles = 10) {
    let cycles = 0;
    let freedRss = 0;
    let usage = process.memoryUsage();

    do {
      global.gc();

      const usageAfterGc = process.memoryUsage();

      freedRss = usage.rss - usageAfterGc.rss;
      usage = usageAfterGc;

      cycles += 1;
    } while (cycles < minCycles || (freedRss !== 0 && cycles < maxCycles));

    return usage;
  }

  beforeEach(() => {
    collectGarbage();
  });

  function makeDocument() {
    const body =
      "<?xml version='1.0' encoding='UTF-8'?>\n" +
      '<root><outer><middle><inner><center/></inner></middle></outer></root>';

    return libxml.parseXml(body);
  }

  it('inaccessible document freed', () => {
    return new Promise((done) => {
      const xml_memory_before_document = libxml.memoryUsage();

      for (let i = 0; i < 10; i += 1) {
        makeDocument();
      }
      process.nextTick(() => {
        collectGarbage();
        expect(libxml.memoryUsage() <= xml_memory_before_document).toBeTruthy();
        done();
      });
    });
  });

  it('inaccessible document freed when node freed', () =>
    new Promise((done) => {
      const xml_memory_before_document = libxml.memoryUsage();
      let nodes = [];

      for (let i = 0; i < 10; i += 1) {
        nodes.push(makeDocument().get('//center'));
      }
      nodes = null;
      process.nextTick(() => {
        collectGarbage();
        expect(libxml.memoryUsage() <= xml_memory_before_document).toBeTruthy();
        done();
      });
    }));

  it('inaccessible document freed after middle nodes proxies', () =>
    new Promise((done) => {
      const xml_memory_before_document = libxml.memoryUsage();
      let doc = makeDocument();
      // eslint-disable-next-line no-unused-vars
      let middle = doc.get('//middle');
      let inner = doc.get('//inner');

      inner.remove(); // v0.14.3, v0.15: proxy ref'd parent but can't unref when destroyed
      doc = middle = inner = null;
      process.nextTick(() => {
        collectGarbage();
        expect(libxml.memoryUsage() <= xml_memory_before_document).toBeTruthy();
        done();
      });
    }));

  it('inaccessible tree freed', () =>
    new Promise((done) => {
      const doc = makeDocument();
      const xml_memory_after_document = libxml.memoryUsage();

      doc.get('//middle').remove();
      process.nextTick(() => {
        collectGarbage();
        expect(libxml.memoryUsage() <= xml_memory_after_document).toBeTruthy();
        done();
      });
    }));

  it('namespace list freed', () => {
    return new Promise((done) => {
      const doc = makeDocument();
      const el = doc.get('//center');

      el.namespace('bar', null);
      const xmlMemBefore = libxml.memoryUsage();

      for (let i; i < 1000; i += 1) {
        el.namespaces();
      }
      process.nextTick(() => {
        collectGarbage();
        expect(libxml.memoryUsage() <= xmlMemBefore).toBeTruthy();
        done();
      });
    });
  });
});
