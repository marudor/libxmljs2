const libxml = require('../index');

describe('text', () => {
  it('invalid_new', () => {
    const doc = new libxml.Document();

    expect(() => libxml.Text(doc, '')).toThrow(
      "Class constructor Text cannot be invoked without 'new'"
    );
    expect(() => new libxml.Text(undefined, '')).toThrow(
      'document argument required'
    );
    expect(() => new libxml.Text({}, '')).toThrow(
      'document argument must be an instance of Document'
    );
    expect(() => new libxml.Text(doc)).toThrow(
      'content argument must be of type string'
    );
    expect(() => new libxml.Text(doc, 1)).toThrow(
      'content argument must be of type string'
    );
  });

  it('new', () => {
    const doc = new libxml.Document();
    const elem = new libxml.Text(doc, 'node content');

    doc.root(elem);
    expect(elem.text()).toBe('node content');
  });

  it('setters', () => {
    const doc = new libxml.Document();
    const elem = new libxml.Text(doc, 'node content');

    // change content
    expect(elem.text()).toBe('node content');
    elem.text('content && more content <>');
    expect(elem.text()).toBe('content &amp;&amp; more content &lt;&gt;');
  });

  it('getters', () => {
    const doc = new libxml.Document();
    const elem = new libxml.Text(doc, 'getters');

    expect(elem.type()).toBe('text');
  });

  it('remove', () => {
    const doc = new libxml.Document();
    const elem = new libxml.Text(doc, 'node content');

    doc.root(elem);
    expect(doc.toString()).toBe(
      '<?xml version="1.0" encoding="UTF-8"?>\nnode content\n'
    );
    elem.remove();
    expect(doc.toString()).toBe('<?xml version="1.0" encoding="UTF-8"?>\n');
  });

  it('toString', () => {
    const doc = new libxml.Document();
    const elem = new libxml.Text(doc, 'node content');

    doc.root(elem);
    expect(elem.toString()).toBe('node content');
  });

  it('addChild', () => {
    const doc = new libxml.Document();

    const newTextNode = new libxml.Text(doc, 'my text');
    const newElement = new libxml.Element(doc, 'div');

    newElement.addChild(newTextNode);
    doc.root(newElement);
    expect(newElement.toString()).toBe('<div>my text</div>');
  });

  it('addChildEscaping', () => {
    const doc = libxml.parseXmlString('<p></p>');

    doc.root().addChild(new libxml.Text(doc, 'x&x'));

    expect(doc.root().toString()).toBe('<p>x&amp;x</p>');
  });

  it('addSiblings', () => {
    const doc = new libxml.Document();

    const parentNode = new libxml.Element(doc, 'div');
    const child = parentNode.node('child', "i'm a child");
    const prevTextNode = new libxml.Text(doc, 'before text');
    const nextTextNode = new libxml.Text(doc, 'after text');

    child.addPrevSibling(prevTextNode);
    child.addNextSibling(nextTextNode);

    expect(parentNode.toString()).toBe(
      "<div>before text<child>i'm a child</child>after text</div>"
    );
  });

  it('add_prev_sibling_merge_text', () => {
    const str = '<foo>bar<baz/></foo>';
    const doc = libxml.parseXml(str);
    const bar = doc.root().childNodes()[0];

    const qux = new libxml.Text(doc, 'qux');

    bar.addPrevSibling(qux);
    // added text is merged into existing child node

    const children = doc.root().childNodes();

    expect(children.length).toBe(2);
    expect('quxbar').toBe(children[0].text());
    expect(children[0] !== qux).toBeTruthy();

    // passed node is not changed
    expect(doc).toBe(qux.parent());
    expect('qux').toBe(qux.text());
  });

  it('add_next_sibling_merge_text', () => {
    const str = '<foo>bar<baz/></foo>';
    const doc = libxml.parseXml(str);
    const bar = doc.root().childNodes()[0];

    const qux = new libxml.Text(doc, 'qux');

    bar.addNextSibling(qux);

    const children = doc.root().childNodes();

    expect(children.length).toBe(2);
    expect('barqux').toBe(children[0].text());
    expect(children[0] !== qux).toBeTruthy();

    expect(doc).toBe(qux.parent());
    expect('qux').toBe(qux.text());
  });

  describe('path()', () => {
    it('returns the full path of the text node', () => {
      const str = '<foo>bar</foo>';
      const doc = libxml.parseXml(str);
      const bar = doc.root().childNodes()[0];

      expect(bar.path()).toBe('/foo/text()');
    });
  });

  describe('name()', () => {
    it('returns the name of the text node', () => {
      const str = '<foo>bar</foo>';
      const doc = libxml.parseXml(str);
      const bar = doc.root().childNodes()[0];

      expect(bar.name()).toBe('text');
    });
  });
});
