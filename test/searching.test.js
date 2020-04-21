const libxml = require('../index');

describe('searching', () => {
  it('get', () => {
    const doc = new libxml.Document();
    const root = doc.node('root');
    const child = root.node('child');
    const grandchild = child.node('grandchild');

    // on document
    expect(doc.get('child')).toBe(child);

    // nested
    expect(doc.get('child').get('grandchild')).toBe(grandchild);
  });

  it('get_missing', () => {
    const doc = new libxml.Document();

    doc.node('root');

    const missing = doc.get('missing/text()');

    expect(missing).toBeUndefined();
  });

  it('get_attr', () => {
    let doc = new libxml.Document();
    const root = doc.node('root');
    const child = root.node('child');

    child.attr('attr', 'val');
    const attr = child.attr('attr');

    // on document
    expect(doc.get('//@attr')).toBe(attr);
    expect(doc.get('//@attr').value()).toBe('val');

    // nested
    expect(doc.get('child').get('@attr')).toBe(attr);
    expect(doc.get('child').get('@attr').value()).toBe('val');

    // check again after re-parsign the doc
    doc = libxml.parseXml(doc.toString());
    expect(doc.get('//@attr').value()).toBe('val');
    expect(doc.get('child').get('@attr').value()).toBe('val');
    expect(doc.get('//@attr').node()).toBe(doc.get('child'));
  });

  it('get_non_nodeset', () => {
    const doc = new libxml.Document();

    doc.node('root');

    expect(doc.get('true()')).toBe(true);
    expect(doc.get('false()')).toBe(false);
    expect('Hello, world!').toBe(doc.get('"Hello, world!"'));
    expect(doc.get('1.23')).toBe(1.23);
  });

  it('find', () => {
    const children = [];
    const doc = new libxml.Document();
    const root = doc.node('root');

    children.push(root.node('child'));
    children.push(root.node('child'));

    const results = doc.find('child');

    expect(children.length).toBe(2);
    expect(results.length).toBe(2);

    for (let child = 0; child < children.length; child += 1) {
      expect(results[child]).toBe(children[child]);
    }
  });

  const uri = 'nsuri';
  const prefix = 'pefname';

  // non prefixed namespaces
  describe('namespace', () => {
    it('get', () => {
      const doc = new libxml.Document();
      const root = doc.node('root');
      const child = root.node('child');
      const grandchild = child.node('grandchild');

      grandchild.namespace(uri);

      // on document
      expect(doc.get('child')).toBe(child);

      // nested
      expect(grandchild).toBe(doc.get('child').get('xmlns:grandchild', uri));
    });
    it('find', () => {
      const children = [];
      const doc = new libxml.Document();
      const root = doc.node('root');

      children.push(root.node('child'));
      children.push(root.node('child'));

      const ns = children[0].namespace(uri).namespace();

      children[1].namespace(ns);

      const results = doc.find('xmlns:child', uri);

      expect(children.length).toBe(2);
      expect(results.length).toBe(2);
      for (let child = 0; child < children.length; child += 1) {
        expect(results[child]).toBe(children[child]);
      }
    });
  });

  describe('prefixed namespace', () => {
    it('get', () => {
      const doc = new libxml.Document();
      const root = doc.node('root');
      const child = root.node('child');
      const grandchild = child.node('grandchild');

      grandchild.namespace(prefix, uri);

      // on document
      expect(doc.get('child')).toBe(child);

      const ns_params = {
        pefname: uri,
      };

      // nested
      expect(grandchild).toBe(
        doc.get('child').get('pefname:grandchild', ns_params)
      );
    });
    it('find', () => {
      const children = [];
      const doc = new libxml.Document();
      const root = doc.node('root');

      children.push(root.node('child'));
      children.push(root.node('child'));

      const ns = children[0].namespace(prefix, uri).namespace();

      children[1].namespace(ns);

      const ns_params = {
        pefname: uri,
      };

      const results = doc.find('pefname:child', ns_params);

      expect(children.length).toBe(2);
      expect(results.length).toBe(2);
      for (let child = 0; child < children.length; child += 1) {
        expect(results[child]).toBe(children[child]);
      }
    });
  });
});
