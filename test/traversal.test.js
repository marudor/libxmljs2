const libxml = require('../index');

describe('traversal', () => {
  it('built', () => {
    const doc = new libxml.Document();
    const child = doc.node('root').node('child');
    const sibling = doc.root().node('sibling');
    const gchild = child.node('grandchild');

    // access document
    expect(gchild.doc()).toBe(doc);
    expect(doc.root().parent()).toBe(doc);

    expect(gchild.parent()).toBe(child);
    expect(doc.child(0).child(0)).toBe(gchild);

    expect(doc.child(1)).toBe(sibling);
  });

  it('children', () => {
    const children = [];
    const doc = new libxml.Document();
    const root = doc.node('root');

    children.push(root.node('child'));
    children.push(root.node('sibling1'));
    children.push(root.node('sibling2'));

    expect(doc.childNodes().length).toBe(children.length);
    for (let i = 0; i < children.length; i += 1) {
      expect(doc.child(i)).toBe(children[i]);
    }
  });

  it('siblings', () => {
    const children = [];
    const doc = new libxml.Document();
    const root = doc.node('root');

    children.push(root.node('prevSibling'));
    children.push(root.node('child'));
    children.push(root.node('nextSibling'));
    expect(children[1].prevSibling()).toBe(children[0]);
    expect(children[1].nextSibling()).toBe(children[2]);
    expect(children[0].prevSibling()).toBe(null);
    expect(children[2].nextSibling()).toBe(null);
  });

  it('parsed', () => {
    const doc = libxml.parseXml(
      '<?xml version="1.0"?>' +
        '<root><child><grandchild /></child><sibling/></root>'
    );

    expect(doc.child(0).doc()).toBe(doc);
    expect(doc.child(1).doc()).toBe(doc);
    expect(doc.child(0).child(0).doc()).toBe(doc);
    expect(doc.root().parent()).toBe(doc);

    // down and back up
    expect(doc.child(0).child(0).parent().name()).toBe('child');

    // propertly access inner nodes
    expect(doc.child(0).child(0).name()).toBe('grandchild');

    // sibling nodes
    expect(doc.child(1).name()).toBe('sibling');
  });

  it('parsed_children', () => {
    const doc = libxml.parseXml(
      '<?xml version="1.0"?>' +
        '<root><prevSibling /><child /><nextSibling /></root>'
    );
    const children = ['prevSibling', 'child', 'nextSibling'];

    // childNodes
    expect(doc.childNodes().length).toBe(3);
    for (let i = 0; i < children.length; i += 1) {
      expect(doc.child(i).name()).toBe(children[i]);
    }

    // check prev/next sibling
    let child = doc.child(1);

    expect(child.name()).toBe('child');
    expect(child.prevSibling().name()).toBe(children[0]);
    expect(child.nextSibling().name()).toBe(children[2]);
    expect(child.prevSibling().prevSibling()).toBe(null);
    expect(child.nextSibling().nextSibling()).toBe(null);

    // prev/next Element
    child = doc.child(1);

    expect(child.name()).toBe('child');
    expect(child.prevElement().name()).toBe(children[0]);
    expect(child.nextElement().name()).toBe(children[2]);
    expect(child.prevElement().prevElement()).toBe(null);
    expect(child.nextElement().nextElement()).toBe(null);
  });
});
