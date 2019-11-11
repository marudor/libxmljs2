const libxml = require('../index');

describe('text node', () => {
  it('text', () => {
    const doc = libxml.parseXml('<?xml version="1.0"?><root>child</root>');

    expect(doc.child(0).type()).toBe('text');
    expect(doc.child(0).name()).toBe('text');
  });

  it('comment', () => {
    const doc = libxml.parseXml(
      '<?xml version="1.0"?><root><!-- comment --></root>'
    );

    expect(doc.child(0).type()).toBe('comment');
    expect(doc.child(0).name()).toBe('comment');
  });

  it('cdata', () => {
    const doc = libxml.parseXml(
      '<?xml version="1.0"?><root><![CDATA[cdata text]]></root>'
    );

    expect(doc.child(0).type()).toBe('cdata');
    expect(doc.child(0).name()).toBe(undefined);
  });
});
