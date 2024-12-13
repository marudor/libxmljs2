const libxml = require('../index');

describe('namespace', () => {
  it('create', () => {
    const doc = new libxml.Document();
    const elem = doc.node('name1');
    const ns = elem.defineNamespace('http://my-namespace.com');

    expect(ns).toBeTruthy();
    expect(elem.namespace()).toBe(null);
    expect(ns.prefix()).toBe(null);
    expect(ns.href()).toBe('http://my-namespace.com');
  });

  it('set', () => {
    const doc = new libxml.Document();
    const elem = doc.node('name1');

    // this will set a namespace on the node
    const ns = elem.namespace('http://my-namespace.com').namespace();

    expect(ns).toBeTruthy();
    expect(elem.namespace()).toBe(ns);
    expect(elem.namespace().prefix()).toBe(null);
    expect(elem.namespace().href()).toBe('http://my-namespace.com');
  });

  it('with prefix', () => {
    const doc = new libxml.Document();
    const elem = doc.node('name1');
    const ns = elem.defineNamespace('pref', 'http://my-namespace.com');

    expect(elem.namespace()).toBe(null);
    expect(ns.prefix()).toBe('pref');
    expect(ns.href()).toBe('http://my-namespace.com');

    // this should detect existing namespace object
    const ns2 = elem.namespace('pref', 'http://my-namespace.com').namespace();

    expect(ns2).toBeTruthy();
    expect(ns2).toBe(ns);
    expect(elem.namespace()).toBe(ns);
    expect(elem.namespace().prefix()).toBe('pref');
    expect(elem.namespace().href()).toBe('http://my-namespace.com');
  });

  it('from parsing', () => {
    let doc = libxml.parseXml(
      '<?xml version="1.0" encoding="UTF-8"?>' +
        '<name1 xmlns="http://my-namespace.com"/>'
    );
    let elem = doc.root();

    expect(elem.namespace()).toBeTruthy();
    expect(elem.namespace().prefix()).toBe(null);
    expect(elem.namespace().href()).toBe('http://my-namespace.com');

    // no prefix from parsing
    doc = libxml.parseXml(
      '<?xml version="1.0" encoding="UTF-8"?>' +
        '<name1 xmlns:pref="http://my-namespace.com"/>'
    );
    elem = doc.root();

    expect(!elem.namespace()).toBeTruthy();

    doc = libxml.parseXml(
      '<?xml version="1.0" encoding="UTF-8"?>' +
        '<pref:name1 xmlns:pref="http://my-namespace.com"/>'
    );
    elem = doc.root();

    expect(elem.namespace()).toBeTruthy();
    expect(elem.namespace().prefix()).toBe('pref');
    expect(elem.namespace().href()).toBe('http://my-namespace.com');
  });

  it('existing', () => {
    let doc = new libxml.Document();
    let elem = doc.node('name1');
    let ns = elem.defineNamespace('http://my-namespace.com');

    elem.namespace('http://my-namespace.com');
    expect(ns).toBeTruthy();
    expect(elem.namespace()).toBe(ns);

    doc = new libxml.Document();
    elem = doc.node('name1');
    ns = elem.defineNamespace('pref', 'http://my-namespace.com');

    elem.namespace('pref', 'http://my-namespace.com');
    expect(ns).toBeTruthy();
    expect(elem.namespace()).toBe(ns);
  });
  it('remove', () => {
    const doc = new libxml.Document();
    const elem = doc.node('name1');
    const ns = elem.namespace('http://my-namespace.com').namespace();

    expect(ns).toBeTruthy();
    expect(ns === elem.namespace()).toBeTruthy();
    elem.namespace(null);
    expect(!elem.namespace()).toBeTruthy();
  });

  it('all', () => {
    const document = new libxml.Document();
    const root = document.node('root');
    const list = [];

    list.push(root.namespace('com', 'http://example.com').namespace());
    list.push(root.namespace('net', 'http://example.net').namespace());
    list.push(root.namespace('http://example.org').namespace());

    expect(
      root.namespaces().every((ns, index) => {
        return (
          ns.href() === list[index].href() &&
          ns.prefix() === list[index].prefix()
        );
      })
    ).toBeTruthy();
    expect(list.length).toBe(root.namespaces().length);
  });

  it('empty', () => {
    const document = new libxml.Document();
    const root = document.node('root');

    expect(0).toBe(root.namespaces().length);
  });

  it('nested', () => {
    const document = new libxml.Document();
    const root = document.node('root');

    root.namespace('com', 'http://example.com');
    expect(1).toBe(root.namespaces().length);

    const child = root.node('child');

    child.namespace('net', 'http://example.net');
    expect(2).toBe(child.namespaces().length); // <child xmlns:net="http://example.net"/> + root

    root.namespace('http://example.org');
    expect(3).toBe(child.namespaces().length); // child's namespace + root's two namespaces
  });

  it('xmlns', () => {
    const str =
      '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body><div>BACON</div><div>ROCKS</div><p>WUT?</p></body></html>';
    const doc = libxml.parseXmlString(str);

    const divs = doc.find('//xmlns:div', 'http://www.w3.org/1999/xhtml');

    expect(2).toBe(divs.length);

    const div = doc.get('//xmlns:div', 'http://www.w3.org/1999/xhtml');

    expect(div != null).toBeTruthy();
    const exp = doc.root().child(1).child(0);

    expect(exp != null).toBeTruthy();
    expect(exp.toString()).toBe(div.toString());
  });

  it('custom ns', () => {
    const str =
      '<html xmlns:bacon="http://www.example.com/fake/uri"><head></head><body><bacon:div>BACON</bacon:div><bacon:div>ROCKS</bacon:div><p>WUT?</p></body></html>';
    const doc = libxml.parseXmlString(str);

    const divs = doc.find('//bacon:div', {
      bacon: 'http://www.example.com/fake/uri',
    });

    expect(2).toBe(divs.length);

    const div = doc.get('//bacon:div', {
      bacon: 'http://www.example.com/fake/uri',
    });

    expect(div != null).toBeTruthy();
    const exp = doc.root().child(1).child(0);

    expect(exp != null).toBeTruthy();
    expect(exp.toString()).toBe(div.toString());
  });

  it('local namespace', () => {
    const str =
      '<html xmlns="urn:example" xmlns:ex1="urn:example:1"><body xmlns:ex2="urn:example:2"/></html>';
    const doc = libxml.parseXmlString(str);

    expect(doc).toBeTruthy();
    const root = doc.root();

    expect(root).toBeTruthy();
    let decls = root.namespaces(true);

    expect(decls).toBeTruthy();
    expect(decls.length).toBe(2);
    decls.forEach((n) => {
      if (n.prefix() == null) {
        expect(n.href()).toBe('urn:example');
      } else if (n.prefix() === 'ex1') {
        expect(n.href()).toBe('urn:example:1');
      } else {
        expect(false).toBeTruthy();
      }
    });
    // body has a namespace, from the default declaration on html.
    const body = root.get('ex:body', { ex: 'urn:example' });

    expect(body).toBeTruthy();
    decls = body.namespaces(true);
    expect(decls.length).toBe(1);
    expect(decls[0].href()).toBe('urn:example:2');

    // Make sure default behavior still works,
    // and doesn't get turned on by mistake
    decls = body.namespaces();
    expect(decls.length).toBe(3);
    decls = body.namespaces(false);
    expect(decls.length).toBe(3);
    decls = body.namespaces(0);
    expect(decls.length).toBe(3);
    decls = body.namespaces(1);
    expect(decls.length).toBe(3);
  });
});
