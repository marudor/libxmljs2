const fs = require('fs');
const libxml = require('../index');

function make_error(object) {
  const err = new Error(object.message);

  err.domain = object.domain;
  err.code = object.code;
  err.level = object.level;
  err.line = object.line;
  err.column = object.column;

  return err;
}

describe('html parser', () => {
  it('parse', () => {
    const filename = `${__dirname}/fixtures/parser.html`;

    function attempt_parse(encoding) {
      // eslint-disable-next-line no-sync
      const str = fs.readFileSync(filename, encoding);

      const doc = libxml.parseHtml(str);

      expect(doc.root().name()).toBe('html');
      expect(doc.get('head/title').text()).toBe('Test HTML document');
      expect(doc.get('body/span').text()).toBe('HTML content!');
    }

    // Parse via a string
    attempt_parse('utf-8');

    // Parse via a Buffer
    attempt_parse(null);
  });

  // Although libxml defaults to a utf-8 encoding, if not specifically specified
  // it will guess the encoding based on meta http-equiv tags available
  // This test shows that the "guessed" encoding can be overridden
  it('parse force encoding', () => {
    const filename = `${__dirname}/fixtures/parser.euc_jp.html`;

    function attempt_parse(encoding, opts) {
      // eslint-disable-next-line no-sync
      const str = fs.readFileSync(filename, encoding);

      const doc = libxml.parseHtml(str, opts);

      expect(doc.root().name()).toBe('html');

      // make sure libxml rewrite the meta charset of this document

      // calling toString on the document ensure that it is converted to the
      // correct internal format and the new meta tag is replaced
      doc.root().toString();
      const fixedCharset = doc.find('/html/head/meta/@content')[0].value();

      expect(
        fixedCharset.indexOf(opts.encoding.toUpperCase()) !== -1
      ).toBeTruthy();

      expect(doc.get('head/title').text()).toBe('テスト');
      expect(doc.get('body/div').text()).toBe('テスト');
    }

    // Parse via a string
    attempt_parse('utf-8', { encoding: 'utf-8' });

    // Parse via a Buffer
    attempt_parse(null, { encoding: 'utf-8' });
  });

  it('parse Synonym', () => {
    expect(libxml.parseHtml).toBe(libxml.parseHtmlString);
  });

  it('recoverable parse', () => {
    const recoverableFile = `${__dirname}/fixtures/warnings/amp.html`;
    // eslint-disable-next-line no-sync
    const str = fs.readFileSync(recoverableFile, 'utf8');
    const recoverableErrors = [
      make_error({
        domain: 5,
        code: 23,
        message: "htmlParseEntityRef: expecting ';'\n",
        level: 2,
        line: 12,
        column: 27,
      }),
      make_error({
        domain: 5,
        code: 68,
        message: 'htmlParseEntityRef: no name\n',
        level: 2,
        line: 12,
        column: 38,
      }),
      make_error({
        domain: 5,
        code: 23,
        message: "htmlParseEntityRef: expecting ';'\n",
        level: 2,
        line: 14,
        column: 4,
      }),
      make_error({
        domain: 5,
        code: 68,
        message: 'htmlParseEntityRef: no name\n',
        level: 2,
        line: 15,
        column: 4,
      }),
    ];

    const doc = libxml.parseHtml(str);

    expect(doc.errors.length).toBe(4);
    for (let i = 0; i < recoverableErrors.length; i += 1) {
      expect(doc.errors[i].domain).toBe(recoverableErrors[i].domain);
      expect(doc.errors[i].code).toBe(recoverableErrors[i].code);
      expect(doc.errors[i].message).toBe(recoverableErrors[i].message);
      expect(doc.errors[i].level).toBe(recoverableErrors[i].level);
      expect(doc.errors[i].line).toBe(recoverableErrors[i].line);
    }
  });

  it('parseOptions', () => {
    let doc = libxml
      .parseHtml('<a/>', { doctype: false, implied: false })
      .toString();

    expect(doc.indexOf('DOCTYPE') === -1).toBeTruthy();
    expect(doc.indexOf('body') === -1).toBeTruthy();
    expect(doc.indexOf('<html>') === -1).toBeTruthy();

    doc = libxml
      .parseHtml('<a/>', { doctype: false, implied: true })
      .toString();
    expect(doc.indexOf('DOCTYPE') === -1).toBeTruthy();
    expect(doc.indexOf('body') > -1).toBeTruthy();
    expect(doc.indexOf('<html>') > -1).toBeTruthy();

    doc = libxml.parseHtml('<a/>', { implied: false }).toString();
    expect(doc.indexOf('DOCTYPE') > -1).toBeTruthy();
    expect(doc.indexOf('body') === -1).toBeTruthy();
    expect(doc.indexOf('<html>') === -1).toBeTruthy();
  });

  it('toString', () => {
    let doc = new libxml.Document();

    expect(doc.toString({ declaration: false }) === null).toBeTruthy();
    expect(
      doc.toString({ declaration: false, type: 'html' }).length === 1
    ).toBeTruthy();

    doc = libxml.parseHtml('<a></a>');
    expect(doc.toString().indexOf('<?xml') === -1).toBeTruthy();
    expect(doc.toString({ type: 'xml' }).indexOf('<?xml') > -1).toBeTruthy();
    expect(doc.toString({ type: 'xhtml' }).indexOf('<?xml') > -1).toBeTruthy();
    expect(
      doc.toString({ type: 'xml', selfCloseEmpty: true }).indexOf('<a/>') > -1
    ).toBeTruthy();
  });
});
