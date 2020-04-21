const libxml = require('../index');

describe('attribute', () => {
  const body =
    "<?xml version='1.0' encoding='UTF-8'?>\n" +
    "<root><node attr-one-key='attr-one-value' attr-two-key='attr-two-value' attr-three-key='attr-three-value' /></root>";

  it('new', () => {
    const doc = libxml.parseXml(body);
    const node = doc.get('node');

    // add new attribute to the node
    node.attr({ 'new-attr-key': 'new-attr-value' });
    expect(node.attr('new-attr-key').value()).toBe('new-attr-value');
  });

  it('create with namespace', () => {
    const doc = new libxml.parseXml(
      "<?xml version='1.0' encoding='UTF-8'?>\n" +
        "<root><node attr-one-key='attr-one-value' attr-two-key='attr-two-value' attr-three-key='attr-three-value' /></root>"
    );
    const node = doc.get('node');

    const attr = node.attr({ 'new-attr-key': 'new-attr-value' });
    const ns = attr.namespace('ns-prefix', 'ns-url').namespace();

    expect(attr).toBeTruthy();
    expect(ns.prefix()).toBe(attr.namespace().prefix());
    expect(ns.href()).toBe(attr.namespace().href());
  });

  it('getters', () => {
    const doc = libxml.parseXml(body);
    const node = doc.get('node');

    expect('attr-one-key').toBe(node.attr('attr-one-key').name());
    expect('attr-one-value').toBe(node.attr('attr-one-key').value());
    expect('node').toBe(node.attr('attr-one-key').node().name());

    // siblings
    expect('attr-one-key').toBe(node.attr('attr-two-key').prevSibling().name());
    expect('attr-three-key').toBe(
      node.attr('attr-two-key').nextSibling().name()
    );
  });

  it('setters', () => {
    const doc = libxml.parseXml(body);
    const node = doc.get('node');

    node.attr('attr-one-key').value('new-value');
    expect(node.attr('attr-one-key').value()).toBe('new-value');
  });

  it('remove', () => {
    const doc = libxml.parseXml(body);
    const node = doc.get('node');

    const attr = node.attr('attr-one-key');

    expect(node.attr('attr-one-key')).toBeTruthy();
    attr.remove();
    expect(!node.attr('attr-one-key')).toBeTruthy();
  });
});
