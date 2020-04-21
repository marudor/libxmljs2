const libxml = require('../index');

if (!global.gc) {
  throw new Error('must run with --expose_gc for ref integrity tests');
}

describe('ref integrity', () => {
  function makeDocument() {
    const body =
      "<?xml version='1.0' encoding='UTF-8'?>\n" +
      '<root><outer><middle><inner><left/><center/><right/></inner></middle></outer></root>';

    return libxml.parseXml(body);
  }

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

  it('gc', () => {
    const doc = new libxml.Document();

    doc.node('root').node('child').node('grandchild').parent().node('child2');
    global.gc();
    expect(doc).toBeTruthy();
    global.gc();
    expect(doc.root()).toBeTruthy();
    global.gc();
    expect('child').toBe(doc.root().childNodes()[0].name());
  });

  it('references', () => {
    const nodes = libxml
      .parseXml('<root> <child> <grandchildren/> </child> <child2/> </root>')
      .childNodes();

    global.gc();

    expect(nodes[0].doc()).toBeTruthy();
    expect(nodes[1].name()).toBe('child');
  });

  // test that double-freeing XmlNode's doesn't cause a segfault
  it('double_free', () => {
    let children = null;

    // stick this portion of code into a self-executing function so
    // its internal variables can be garbage collected
    (function internal() {
      const html = '<html><body><div><span></span></div></body></html>';
      const doc = libxml.parseHtml(html);

      doc.find('//div').forEach((tag) => {
        // provide a reference to childNodes so they are exposed as XmlNodes
        // and therefore subject to V8's garbage collection
        children = tag.childNodes();
        tag.remove();
      });
    })();

    global.gc();
    expect(children[0].attrs()).toBeTruthy();
  });

  // eslint-disable-next-line jest/expect-expect
  it('freed_namespace_unwrappable', () => {
    const doc = libxml.parseXml(
      "<?xml version='1.0' encoding='UTF-8'?><root></root>"
    );
    let el = new libxml.Element(doc, 'foo');
    // eslint-disable-next-line no-unused-vars
    let ns = el.namespace('bar', null);

    el = null;
    global.gc();
    ns = null;
    global.gc();
  });

  it('unlinked_tree_persistence_parent_proxied_first', () => {
    const doc = makeDocument();
    let parent_node = doc.get('//middle');
    const child_node = doc.get('//inner');

    parent_node.remove();
    parent_node = null;
    collectGarbage();

    expect(child_node.name()).toBe('inner'); // works with >= v0.14.3
  });

  it('unlinked_tree_proxied_leaf_persistent_ancestor_first', () => {
    const doc = makeDocument();
    let ancestor = doc.get('//middle');
    const leaf = doc.get('//center');

    ancestor.remove();
    ancestor = null;
    collectGarbage();

    expect(leaf.name()).toBe('center'); // fails with v0.14.3, v0.15
  });

  it('unlinked_tree_proxied_leaf_persistent_descendant_first', () => {
    const doc = makeDocument();
    const leaf = doc.get('//center');
    let ancestor = doc.get('//middle');

    ancestor.remove(); // make check here?
    ancestor = null;
    collectGarbage();

    expect(leaf.name()).toBe('center');
  });

  it('unlinked_tree_persistence_child_proxied_first', () => {
    const doc = makeDocument();
    const child_node = doc.get('//inner');
    let parent_node = doc.get('//middle');

    parent_node.remove();
    parent_node = null;
    collectGarbage();

    expect(child_node.name()).toBe('inner'); // fails with v0.14.3, v0.15
  });

  it('unlinked_tree_leaf_persistence_with_proxied_ancestor', () => {
    const doc = makeDocument();
    const proxied_ancestor = doc.get('//inner');
    let leaf = doc.get('//center');

    doc.get('//middle').remove();
    leaf = null;
    collectGarbage();

    leaf = proxied_ancestor.get('.//center');
    expect(leaf.name()).toBe('center');
  });
  it('unlinked_tree_leaf_persistence_with_peer_proxy', () => {
    const doc = makeDocument();
    let leaf = doc.get('//left');
    const peer = doc.get('//right');

    doc.get('//middle').remove();
    leaf = null;
    collectGarbage();

    leaf = peer.parent().get('./left');
    expect(leaf.name()).toBe('left');
  });

  it('set_text_clobbering_children', () => {
    const doc = libxml.parseHtml(
      '<root><child><inner>old</inner></child></root>'
    );
    const child = doc.get('//child');
    const inner = doc.get('//inner');

    child.text('new');

    expect(inner.parent()).toBe(doc);
    expect(inner.text()).toBe('old');
  });
});
