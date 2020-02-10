const libxml = require('../index');

describe('xml textwriter', () => {
  describe('error handling', () => {
    it('endElement should throw an error if underlying method returned -1', () => {
      const writer = new libxml.TextWriter();

      expect(() => writer.endElement()).toThrow('Failed to end element');
    });
  });
  it('should write an XML preamble to memory', () => {
    let writer;
    // eslint-disable-next-line no-unused-vars
    let count;
    let output;

    writer = new libxml.TextWriter();
    count += writer.startDocument();
    count += writer.endDocument();
    output = writer.outputMemory();
    expect(output).toBe('<?xml version="1.0"?>\n\n');

    writer = new libxml.TextWriter();
    count += writer.startDocument('1.0');
    count += writer.endDocument();
    output = writer.outputMemory();
    expect(output).toBe('<?xml version="1.0"?>\n\n');

    writer = new libxml.TextWriter();
    count += writer.startDocument('1.0', 'UTF-8');
    count += writer.endDocument();
    output = writer.outputMemory();
    expect(output).toBe('<?xml version="1.0" encoding="UTF-8"?>\n\n');

    writer = new libxml.TextWriter();
    count += writer.startDocument('1.0', 'UTF-8', 'yes');
    count += writer.endDocument();
    output = writer.outputMemory();
    expect(output).toBe(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n\n'
    );
  });

  describe('standalone handling', () => {
    it('true === yes', () => {
      const writer = new libxml.TextWriter();

      writer.startDocument('1.0', 'UTF-8', true);
      writer.endDocument();
      expect(writer.outputMemory()).toBe(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n\n'
      );
    });

    it('false === no', () => {
      const writer = new libxml.TextWriter();

      writer.startDocument('1.0', 'UTF-8', false);
      writer.endDocument();
      expect(writer.outputMemory()).toBe(
        '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n\n'
      );
    });

    it('default === no', () => {
      const writer = new libxml.TextWriter();

      writer.startDocument('1.0', 'UTF-8', false);
      writer.endDocument();
      expect(writer.outputMemory()).toBe(
        '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n\n'
      );
    });

    it('falsy === NULL', () => {
      const writer = new libxml.TextWriter();

      writer.startDocument('1.0', 'UTF-8', 0);
      writer.endDocument();
      expect(writer.outputMemory()).toBe(
        '<?xml version="1.0" encoding="UTF-8"?>\n\n'
      );
    });

    it('missing === NULL', () => {
      const writer = new libxml.TextWriter();

      writer.startDocument('1.0', 'UTF-8');
      writer.endDocument();
      expect(writer.outputMemory()).toBe(
        '<?xml version="1.0" encoding="UTF-8"?>\n\n'
      );
    });

    it('undefined === NULL', () => {
      const writer = new libxml.TextWriter();

      writer.startDocument('1.0', 'UTF-8', undefined);
      writer.endDocument();
      expect(writer.outputMemory()).toBe(
        '<?xml version="1.0" encoding="UTF-8"?>\n\n'
      );
    });
  });

  it('should write elements without namespace', () => {
    const writer = new libxml.TextWriter();
    // eslint-disable-next-line no-unused-vars
    let count;

    count += writer.startDocument('1.0', 'UTF-8');
    count += writer.startElementNS(undefined, 'root');
    count += writer.startElementNS(undefined, 'child');
    count += writer.endElement();
    count += writer.endElement();
    count += writer.endDocument();
    const output = writer.outputMemory();

    expect(output).toBe(
      '<?xml version="1.0" encoding="UTF-8"?>\n<root><child/></root>\n'
    );
  });

  it('should write elements with default namespace', () => {
    const writer = new libxml.TextWriter();
    // eslint-disable-next-line no-unused-vars
    let count;

    count += writer.startDocument('1.0', 'UTF-8');
    count += writer.startElementNS(
      undefined,
      'html',
      'http://www.w3.org/1999/xhtml'
    );
    count += writer.startElementNS(undefined, 'head');
    count += writer.endElement();
    count += writer.endElement();
    count += writer.endDocument();
    const output = writer.outputMemory();

    expect(output).toBe(
      '<?xml version="1.0" encoding="UTF-8"?>\n<html xmlns="http://www.w3.org/1999/xhtml"><head/></html>\n'
    );
  });

  it('should write elements with namespace prefix', () => {
    const writer = new libxml.TextWriter();
    // eslint-disable-next-line no-unused-vars
    let count;

    count += writer.startDocument('1.0', 'UTF-8');
    count += writer.startElementNS(
      'html',
      'html',
      'http://www.w3.org/1999/xhtml'
    );
    count += writer.startElementNS('html', 'head');
    count += writer.endElement();
    count += writer.endElement();
    count += writer.endDocument();
    const output = writer.outputMemory();

    expect(output).toBe(
      '<?xml version="1.0" encoding="UTF-8"?>\n<html:html xmlns:html="http://www.w3.org/1999/xhtml"><html:head/></html:html>\n'
    );
  });

  it('should write attributes with default namespace', () => {
    const writer = new libxml.TextWriter();
    // eslint-disable-next-line no-unused-vars
    let count;

    count += writer.startDocument('1.0', 'UTF-8');
    count += writer.startElementNS(undefined, 'root', 'http://example.com');
    count += writer.startAttributeNS(undefined, 'attr', 'http://example.com');
    count += writer.writeString('value');
    count += writer.endAttribute();
    count += writer.endElement();
    count += writer.endDocument();
    const output = writer.outputMemory();

    expect(output).toBe(
      '<?xml version="1.0" encoding="UTF-8"?>\n<root attr="value" xmlns="http://example.com"/>\n'
    );
  });

  it('should write attributes with namespace prefix', () => {
    const writer = new libxml.TextWriter();
    // eslint-disable-next-line no-unused-vars
    let count;

    count += writer.startDocument('1.0', 'UTF-8');
    count += writer.startElementNS(undefined, 'root');
    count += writer.startAttributeNS('pfx', 'attr', 'http://example.com');
    count += writer.writeString('value');
    count += writer.endAttribute();
    count += writer.endElement();
    count += writer.endDocument();
    const output = writer.outputMemory();

    expect(output).toBe(
      '<?xml version="1.0" encoding="UTF-8"?>\n<root pfx:attr="value" xmlns:pfx="http://example.com"/>\n'
    );
  });

  it('should write text node', () => {
    const writer = new libxml.TextWriter();
    // eslint-disable-next-line no-unused-vars
    let count;

    count += writer.startDocument('1.0', 'UTF-8');
    count += writer.startElementNS(undefined, 'root');
    count += writer.writeString('some text here');
    count += writer.endElement();
    count += writer.endDocument();
    const output = writer.outputMemory();

    expect(output).toBe(
      '<?xml version="1.0" encoding="UTF-8"?>\n<root>some text here</root>\n'
    );
  });

  it('should write cdata section', () => {
    const writer = new libxml.TextWriter();
    // eslint-disable-next-line no-unused-vars
    let count;

    count += writer.startDocument('1.0', 'UTF-8');
    count += writer.startElementNS(undefined, 'root');
    count += writer.startCdata();
    count += writer.writeString('some text here');
    count += writer.endCdata();
    count += writer.endElement();
    count += writer.endDocument();
    const output = writer.outputMemory();

    expect(output).toBe(
      '<?xml version="1.0" encoding="UTF-8"?>\n<root><![CDATA[some text here]]></root>\n'
    );
  });

  it('should return the contents of the output buffer when told so', () => {
    const writer = new libxml.TextWriter();
    // eslint-disable-next-line no-unused-vars
    let count;
    let output;

    count += writer.startDocument();
    count += writer.startElementNS(undefined, 'root');
    output = writer.outputMemory();

    expect(output).toBe('<?xml version="1.0"?>\n<root');

    output = writer.outputMemory();
    expect(output).toBe('');

    count += writer.endElement();
    count += writer.endDocument();

    output = writer.outputMemory();
    expect(output).toBe('/>\n');
  });

  it('should not flush the output buffer when told so', () => {
    const writer = new libxml.TextWriter();
    // eslint-disable-next-line no-unused-vars
    let count;
    let output;

    count += writer.startDocument();
    count += writer.startElementNS(undefined, 'root');

    // flush buffer=false, ...
    output = writer.outputMemory(false);
    expect(output).toBe('<?xml version="1.0"?>\n<root');

    // content should be receivable here.
    output = writer.outputMemory(true);
    expect(output).toBe('<?xml version="1.0"?>\n<root');

    // but not here anymore because of recent flush.
    output = writer.outputMemory();
    expect(output).toBe('');
  });
});
