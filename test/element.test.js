const libxml = require('../index');

describe('element', () => {
  it('new', () => {
    const doc = new libxml.Document();
    const elem = libxml.Element(doc, 'name1');

    doc.root(elem);
    expect(elem.name()).toBe('name1');
    expect(doc.root().name()).toBe('name1');
  });

  it('newWithContent', () => {
    const doc = new libxml.Document();
    const elem = libxml.Element(doc, 'name1', 'content && more content <>');

    doc.root(elem);
    expect(elem.name()).toBe('name1');
    expect(doc.root().name()).toBe('name1');
    expect(elem.text()).toBe('content && more content <>');
  });

  it('setters', () => {
    const doc = new libxml.Document();
    const elem = doc.node('name1');

    // change content
    expect(elem.text()).toBe('');
    elem.text('content && more content <>');
    expect(elem.text()).toBe('content && more content <>');

    // change name
    expect(elem.name()).toBe('name1');
    elem.name('newname');
    expect(elem.name()).toBe('newname');
  });

  it('getters', () => {
    const doc = new libxml.Document();
    const elem = doc.node('name1');

    expect(elem.type()).toBe('element');
    expect(elem.doc()).toBe(doc);
  });

  it('remove', () => {
    const doc = new libxml.Document();
    const elem = doc.node('name1');
    const child = elem.node('child');

    expect(doc.get('/name1/child')).toBeTruthy();

    child.remove();
    expect(doc.get('/name1/child')).not.toBeTruthy();
  });
  it('toString', () => {
    const doc = new libxml.Document();
    const elem = doc.node('name1');

    expect(elem.toString()).toBe('<name1/>');
    elem.node('child');
    expect(elem.toString()).toBe('<name1><child/></name1>');
    expect('<name1><child></child></name1>').toBe(
      elem.toString({ selfCloseEmpty: false })
    );
    expect('<name1><child></child></name1>').toBe(
      elem.toString({ type: 'html' })
    );
    expect('<name1\n  ><child\n  /></name1\n>').toBe(
      elem.toString({ whitespace: true })
    );
    expect('<name1>\n  <child/>\n</name1>').toBe(
      elem.toString({ format: true })
    );
  });

  it('path', () => {
    const doc = new libxml.Document();
    const root = doc.node('root');
    const gchild = root.node('child').node('grandchild');
    const sibling = root.node('child');

    expect(gchild.path()).toBe('/root/child[1]/grandchild');
    expect(sibling.path()).toBe('/root/child[2]');
  });

  it('move', () => {
    const doc = new libxml.Document();
    const elem = doc.node('name1');
    const child = elem.node('child');

    expect(doc.get('/name1/child')).toBeTruthy();

    child.remove();
    const name2 = elem.node('name2');

    name2.addChild(child);
    expect(!doc.get('/name1/child')).toBeTruthy();
    expect(doc.get('/name1/name2/child')).toBeTruthy();
  });

  it('addChild', () => {
    const doc = new libxml.Document();
    const elem = doc.node('name1');
    const newChild = libxml.Element(doc, 'new-child');

    elem.addChild(newChild);
    expect(doc.get('/name1/new-child')).toBeTruthy();
  });

  it('add prev sibling', () => {
    const doc = new libxml.Document();
    const elem = doc.node('name1');

    elem.node('child1');
    const child2 = elem.node('child2');

    expect(2).toBe(elem.childNodes().length);
    const prevSibling = libxml.Element(doc, 'prev-sibling');

    child2.addPrevSibling(prevSibling);
    const children = elem.childNodes();

    expect(children.length).toBe(3);
    expect(children[1].name()).toBe('prev-sibling');
  });

  it('add next sibling', () => {
    const doc = new libxml.Document();
    const elem = doc.node('name1');

    const child1 = elem.node('child1');

    elem.node('child2');

    expect(2).toBe(elem.childNodes().length);
    const nextSibling = libxml.Element(elem.doc(), 'next-sibling');

    child1.addNextSibling(nextSibling);
    const children = elem.childNodes();

    expect(children.length).toBe(3);
    expect(children[1].name()).toBe('next-sibling');
  });

  it('import', () => {
    let doc = new libxml.Document();
    const elem = doc.node('name1');

    const child1 = elem.node('child1');

    doc = child1.doc();

    const newdoc = new libxml.Document();

    newdoc.node('newdoc');

    newdoc.root().addChild(child1);

    expect(newdoc).toBeTruthy();
    expect(doc).not.toBe(newdoc);
    expect(newdoc.root().childNodes()[0].name()).toBe('child1');
    expect(elem.childNodes()[0]).toBe(child1); // child1 is the the first child of elem
  });

  it('clone', () => {
    const doc = new libxml.Document();
    const elem = doc.node('child');
    const elem2 = elem.clone();

    expect(elem2.name()).toBe(elem.name());
    expect(elem2.text()).toBe(elem.text());
    expect(elem2.toString()).toBe(elem.toString());
  });

  it('namespace', () => {
    const str =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<root xmlns:bacon="http://www.example.com/fake/uri"><node bacon:attr-with-ns="attr-with-ns-value" attr-without-ns="attr-withoug-ns-vavlue" /></root>';
    const doc = new libxml.parseXml(str);
    const node = doc.get('node');
    const attrs = node.attrs();

    attrs.forEach((attr) => {
      const name = attr.name();
      const ns = attr.namespace();

      if (name === 'attr-with-ns') {
        expect('bacon').toBe(ns.prefix());
        expect('http://www.example.com/fake/uri').toBe(ns.href());
      } else {
        expect('attr-without-ns').toBe(name);
        expect(null).toBe(ns);
      }
    });
  });

  it('replace', () => {
    const str = '<foo>some <bar/> evening</foo>';
    let doc = libxml.parseXml(str);
    let bar = doc.get('bar');

    bar.replace('enchanted');
    expect('some enchanted evening').toBe(doc.root().text());

    doc = libxml.parseXml(str);
    bar = doc.get('bar');
    bar.replace('<>');
    expect('<foo>some &lt;&gt; evening</foo>').toBe(doc.root().toString());

    doc = libxml.parseXml(str);
    bar = doc.get('bar');
    const enchant = libxml.parseXml('<enchanted/>');

    bar.replace(enchant.root());
    expect('<foo>some <enchanted/> evening</foo>').toBe(doc.root().toString());
    expect(3).toBe(doc.root().childNodes().length);
    expect(doc.root().childNodes()[1].name()).toBe('enchanted');
  });

  it('add child merge text', () => {
    const str = '<foo>bar</foo>';
    const doc = libxml.parseXml(str);
    const foo = doc.root();
    const baz = new libxml.Text(doc, 'baz');

    foo.addChild(baz);

    // added text is merged into existing child node
    expect('barbaz').toBe(foo.text());
    expect(foo.childNodes().length).toBe(1);
    expect(foo.childNodes()[0]).not.toBe(baz);

    // passed node is not changed
    expect(doc).toBe(baz.parent());
    expect('baz').toBe(baz.text());
  });

  it('add cdata', () => {
    const doc = new libxml.Document();
    const element = new libxml.Element(doc, 'name', 'content');
    const cdataResult = element.cdata('cdata');

    expect(cdataResult).toBe(element);
    expect(element.toString()).toContain('[CDATA[cdata]]');
  });
});
