const fs = require('fs');
const libxml = require('../index');

describe('xml parser', () => {
  it('parse', () => {
    const filename = `${__dirname}/fixtures/parser.xml`;
    // eslint-disable-next-line no-sync
    const str = fs.readFileSync(filename, 'utf8');

    const doc = libxml.parseXml(str);

    expect(doc.version()).toBe('1.0');
    expect(doc.encoding()).toBe('UTF-8');
    expect(doc.root().name()).toBe('root');
    expect(doc.get('child').name()).toBe('child');
    expect(doc.get('child').get('grandchild').name()).toBe('grandchild');
    expect(doc.get('child/grandchild').text()).toBe('with love');
    expect(doc.get('sibling').name()).toBe('sibling');
    expect(doc.get('sibling').line()).toBe(6);
    expect(doc.get('child').attr('to').line()).toBe(3);
    expect(doc.get('sibling').text()).toBe('with content!');
    expect(doc.toString()).toBe(str);
  });

  it('parse_buffer', () => {
    const filename = `${__dirname}/fixtures/parser-utf16.xml`;
    // eslint-disable-next-line no-sync
    const buf = fs.readFileSync(filename);

    const doc = libxml.parseXml(buf);

    expect(doc.version()).toBe('1.0');
    expect(doc.encoding()).toBe('UTF-16');
    expect(doc.root().name()).toBe('root');
  });

  it('parse_synonym', () => {
    expect(libxml.parseXml).toBe(libxml.parseXmlString);
  });

  it('recoverable_parse', () => {
    const filename = `${__dirname}/fixtures/warnings/ent9.xml`;
    // eslint-disable-next-line no-sync
    const str = fs.readFileSync(filename, 'utf8');

    const doc = libxml.parseXml(str);

    expect(doc.errors.length).toBe(1);
    const err = doc.errors.shift();

    expect(3).toBe(err.domain);
    expect(13).toBe(err.column);
    expect(1).toBe(err.line);
    expect(201).toBe(err.code);
    expect('prefix').toBe(err.str1);
  });

  it('baseurl_xml', () => {
    if (/^win/.test(process.platform)) {
      // libxml won't resolve the path on Windows

      return;
    }

    const str =
      '<!DOCTYPE example SYSTEM "baseurl.dtd">\n<example msg="&happy;"/>\n';

    // First verify it fails when we don't give baseUrl
    let doc = libxml.Document.fromXml(str, {
      dtdvalid: true,
      nonet: true,
    });

    expect(doc.errors.length > 0).toBeTruthy();

    // Now it should work
    doc = libxml.Document.fromXml(str, {
      dtdvalid: true,
      nonet: true,
      baseUrl: `${__dirname}/fixtures/example.xml`,
    });

    expect(!doc.errors || doc.errors.length === 0).toBeTruthy();
  });

  it('fatal_error', () => {
    const filename = `${__dirname}/fixtures/errors/comment.xml`;
    // eslint-disable-next-line no-sync
    const str = fs.readFileSync(filename, 'utf8');
    let err = null;

    try {
      libxml.parseXml(str);
    } catch (e) {
      err = e;
    }

    const errorControl = {
      domain: 1,
      code: 4,
      message: "Start tag expected, '<' not found\n",
      level: 3,
      file: null,
      line: 5,
      str1: null,
      str2: null,
      str3: null,
      int1: null,
      column: 10,
    };

    expect(err.code).toBe(errorControl.code);
  });

  it('text path', () => {
    const xml = '<?xml version="1.0" encoding="utf-8"?><Name>Test</Name>';
    const doc = libxml.parseXmlString(xml);
    const text = doc.get('/Name').childNodes()[0];

    expect(text.type()).toEqual('text');
    expect(text.path()).toEqual('/Name/text()');
  });

  it('parse_options', () => {
    function test_parser_option(input, options, expected) {
      let output = libxml.parseXml(input, options).toString();

      output = output.replace(
        /^<\?xml version="1.0" encoding="UTF-8"\?>\n/,
        ''
      );
      output = output.replace(/\n$/, '');
      expect(expected).toBe(output);
    }

    test_parser_option('<x>&</x>', { recover: true }, '<x/>'); // without this option, this document would raise an exception during parsing
    test_parser_option(
      "<!DOCTYPE x [ <!ENTITY foo 'bar'> ]> <x>&foo;</x>",
      { noent: true },
      '<!DOCTYPE x [\n<!ENTITY foo "bar">\n]>\n<x>bar</x>'
    ); // foo => bar
    test_parser_option('<x> <a>123</a> </x>', {}, '<x> <a>123</a> </x>'); // no indentation even though the toString() default called for formatting
    test_parser_option(
      '<x> <a>123</a> </x>',
      { noblanks: true },
      '<x>\n  <a>123</a>\n</x>'
    ); // ah, now we have indentation!
    test_parser_option('<x><![CDATA[hi]]></x>', {}, '<x><![CDATA[hi]]></x>'); // normally CDATA stays as CDATA
    test_parser_option('<x><![CDATA[hi]]></x>', { nocdata: true }, '<x>hi</x>'); // but here CDATA is removed!
  });
});
