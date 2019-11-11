const libxml = require('../index');

describe('comment', () => {
  it('new', () => {
    const doc = libxml.Document();
    const comm = libxml.Comment(doc, 'comment1');

    doc.root(comm);
    expect('comment1').toBe(comm.text());
  });

  it('text', () => {
    const doc = libxml.Document();
    const comm = libxml.Comment(doc);

    comm.text('comment2');
    expect('comment2').toBe(comm.text());
  });

  it('textWithSpecialCharacters', () => {
    const doc = libxml.Document();
    const comm = libxml.Comment(doc);
    const theText = 'my comment <has> special ch&r&cters';

    comm.text(theText);
    expect(theText).toBe(comm.text());
  });

  it('toStringWithSpecialCharacters', () => {
    const doc = libxml.Document();
    const comm = libxml.Comment(doc);
    const theText = 'my comment <has> special ch&r&cters';

    comm.text(theText);
    expect(`<!--${theText}-->`).toBe(comm.toString());
  });
});
