const libxml = require('../index');

describe('pi', () => {
  it('new', () => {
    const doc = libxml.Document();
    const pi = libxml.ProcessingInstruction(doc, 'mypi', 'mycontent');

    doc.root(new libxml.Element(doc, 'myelem'));
    doc.root().addPrevSibling(pi);

    expect(pi).toBe(doc.root().prevSibling());
    expect(pi.name()).toBe('mypi');
    expect(pi.text()).toBe('mycontent');
  });

  it('name', () => {
    const doc = libxml.Document();
    const pi = libxml.ProcessingInstruction(doc, 'mypi');

    pi.name('mynewpi');
    expect(pi.name()).toBe('mynewpi');
  });

  it('text', () => {
    const doc = libxml.Document();
    const pi = libxml.ProcessingInstruction(doc, 'mypi');

    pi.text('pi3');
    expect(pi.text()).toBe('pi3');
  });
});
