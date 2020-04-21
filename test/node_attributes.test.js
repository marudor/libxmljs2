const libxml = require('../index');

describe('node attributes', () => {
  it('basic', () => {
    // reading a node is implied during all tests
    const doc = new libxml.Document();
    const elem = doc.node('name').attr({ to: 'wongfoo' });

    expect(elem.attr('to').value()).toBe('wongfoo');
  });

  it('null', () => {
    const doc = new libxml.Document();
    const elem = doc.node('name');

    expect(elem.attr('to')).toBe(null);
  });

  it('assign_object', () => {
    const doc = new libxml.Document();
    const elem = doc.node('name');

    elem.attr({ to: 'wongfoo' });
    expect(elem.attr('to').value()).toBe('wongfoo');
  });

  it('change', () => {
    const doc = new libxml.Document();
    const elem = doc.node('name').attr({ to: 'wongfoo' });

    expect(elem.attr('to').value()).toBe('wongfoo');
    elem.attr({ to: 'julie newmar' });
    expect(elem.attr('to').value()).toBe('julie newmar');
  });

  it('attrs', () => {
    const doc = new libxml.Document();
    const elem = doc.node('root');

    expect(elem.attrs()).toEqual([]);

    elem.attr({ foo: 'bar' }).attr({ bar: 'baz' }).attr({ baz: 'foo' });

    const attrs = [elem.attr('foo'), elem.attr('bar'), elem.attr('baz')];

    for (let i = 0; i < 3; i += 1) {
      expect(elem.attrs()[i]).toBe(attrs[i]);
    }
  });

  it('siblings', () => {
    const doc = new libxml.Document();
    const elem = doc
      .node('root')
      .attr({ foo: 'bar' })
      .attr({ bar: 'baz' })
      .attr({ baz: 'foo' });

    expect(elem.attr('bar').nextSibling()).toBe(elem.attr('baz'));
    expect(elem.attr('bar').prevSibling()).toBe(elem.attr('foo'));
    expect(elem.attr('foo').prevSibling()).toBe(null);
    expect(elem.attr('baz').nextSibling()).toBe(null);
  });

  it('getters', () => {
    const doc = new libxml.Document();
    const elem = doc.node('root').attr({ foo: 'bar' });

    // get node
    expect(elem.attr('foo').parent()).toBe(elem);
    // get document
    expect(elem.attr('foo').doc()).toBe(doc);
  });
});
