const libxml = require('../index');

describe('pi', () => {
  it('invalid new', () => {
    const doc = new libxml.Document();

    expect(() => libxml.ProcessingInstruction(doc, '')).toThrow(
      "Class constructor ProcessingInstruction cannot be invoked without 'new'"
    );
    expect(() => new libxml.ProcessingInstruction(undefined, '')).toThrow(
      'document argument required'
    );
    expect(() => new libxml.ProcessingInstruction(doc)).toThrow(
      'name argument must be of type string'
    );
    expect(() => new libxml.ProcessingInstruction(doc, 1)).toThrow(
      'name argument must be of type string'
    );
    expect(() => new libxml.ProcessingInstruction(doc, '', 1)).toThrow(
      'content argument must be of type string'
    );
  });
  it('new', () => {
    const doc = new libxml.Document();
    const pi = new libxml.ProcessingInstruction(doc, 'mypi', 'mycontent');

    doc.root(new libxml.Element(doc, 'myelem'));
    doc.root().addPrevSibling(pi);

    expect(pi).toBe(doc.root().prevSibling());
    expect(pi.name()).toBe('mypi');
    expect(pi.text()).toBe('mycontent');
  });

  it('name', () => {
    const doc = new libxml.Document();
    const pi = new libxml.ProcessingInstruction(doc, 'mypi');

    pi.name('mynewpi');
    expect(pi.name()).toBe('mynewpi');
  });

  it('text', () => {
    const doc = new libxml.Document();
    const pi = new libxml.ProcessingInstruction(doc, 'mypi');

    pi.text('pi3');
    expect(pi.text()).toBe('pi3');
  });
});
