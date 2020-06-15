const libxml = require('../index');

describe('text node', () => {
  it('text', () => {
    const doc = libxml.parseXml('<?xml version="1.0"?><root>child</root>');
    const text = doc.child(0);

    expect(text.type()).toBe('text');
    expect(text).toBeInstanceOf(libxml.Text);
  });

  it('comment', () => {
    const doc = libxml.parseXml(
      '<?xml version="1.0"?><root><!-- comment --></root>'
    );
    const comment = doc.child(0);

    expect(comment.type()).toBe('comment');
    expect(comment).toBeInstanceOf(libxml.Comment);
  });

  it('cdata', () => {
    const doc = libxml.parseXml(
      '<?xml version="1.0"?><root><![CDATA[cdata text]]></root>'
    );
    const cdata = doc.child(0);

    expect(cdata.type()).toBe('cdata');
    expect(cdata).toBeInstanceOf(libxml.Element); // We don't have a wrapper type for CDATA yet.
  });

  it('pi', () => {
    const doc = libxml.parseXml('<?xml version="1.0"?><root><?foo ?></root>');
    const pi = doc.child(0);

    expect(pi.type()).toBe('pi');
    expect(pi).toBeInstanceOf(libxml.ProcessingInstruction);
  });
});
