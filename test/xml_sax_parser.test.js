const fs = require('fs');

const libxml = require('../index');

describe('xml sax parser', () => {
  function clone(obj) {
    if (obj == null || typeof obj != 'object') return obj;

    const temp = new obj.constructor();

    // eslint-disable-next-line guard-for-in,no-caller
    for (const key in obj) temp[key] = arguments.callee(obj[key]);

    return temp;
  }

  const callbackTest = {
    startDocument: [],
    endDocument: [],

    startElementNS: [],
    endElementNS: [],

    characters: [],
    cdata: [],

    comment: [],

    warning: [],
    error: [],
  };

  const callbackControl = {
    startDocument: [[]],

    endDocument: [[]],

    startElementNS: [
      ['error', [], null, null, []],
      [
        'stream',
        [
          ['to', '', '', 'example.com'],
          ['version', '', '', '1.0'],
        ],
        'stream',
        'http://etherx.jabber.org/streams',
        [
          [null, 'jabber:client'],
          ['stream', 'http://etherx.jabber.org/streams'],
        ],
      ],
      [
        'message',
        [
          ['type', '', '', 'chat'],
          ['to', '', '', 'n@d'],
          ['from', '', '', 'n@d/r'],
          ['id', '', '', 'id1'],
        ],
        null,
        'jabber:client',
        [],
      ],
      ['x', [['name', '', '', 'abc & xyz']], null, 'jabber:client', []],
      ['body', [], null, 'jabber:client', []],
      [
        'html',
        [],
        null,
        'http://jabber.org/protocol/xhtml-im',
        [[null, 'http://jabber.org/protocol/xhtml-im']],
      ],
      [
        'body',
        [],
        null,
        'http://www.w3.org/1999/xhtml',
        [[null, 'http://www.w3.org/1999/xhtml']],
      ],
      ['prefixed', [], 'stream', 'http://etherx.jabber.org/streams', []],
    ],

    endElementNS: [
      ['x', null, 'jabber:client'],
      ['body', null, 'jabber:client'],
      ['body', null, 'http://www.w3.org/1999/xhtml'],
      ['html', null, 'http://jabber.org/protocol/xhtml-im'],
      ['message', null, 'jabber:client'],
      ['prefixed', 'stream', 'http://etherx.jabber.org/streams'],
      ['stream', 'stream', 'http://etherx.jabber.org/streams'],
    ],

    characters: [['ABC '], ['&'], ['&'], [' XYZ'], ['exit'], ['exit']],

    cdata: [[' some cdata ']],

    comment: [[' comment ']],

    warning: [["xmlParsePITarget: invalid name prefix 'xml'\n"]],

    error: [['Premature end of data in tag error line 2\n']],
  };

  function createParser(parserType, callbacks) {
    // can connect by passing in as arguments to constructor
    const parser = new libxml[parserType]({
      startDocument(...args) {
        callbacks.startDocument.push(args);
      },
      endDocument(...args) {
        callbacks.endDocument.push(args);
      },
      startElementNS(...args) {
        // p({e: elem, a: attrs, p: prefix, u: uri, n: namespaces});
        callbacks.startElementNS.push(args);
      },
      endElementNS(...args) {
        callbacks.endElementNS.push(args);
      },
      characters(chars) {
        if (!chars.match(/^[\s\n\r]+$/)) {
          callbacks.characters.push([chars]);
        }
      },
      comment(...args) {
        callbacks.comment.push(args);
      },
      warning(...args) {
        callbacks.warning.push(args);
      },
      error(...args) {
        callbacks.error.push(args);
      },
    });

    // can also connect directly because it is an event emitter
    parser.on('cdata', (...args) => {
      callbacks.cdata.push(args);
    });

    return parser;
  }

  const filename = `${__dirname}/fixtures/sax_parser.xml`;

  it('sax', () => {
    const callbacks = clone(callbackTest);
    // eslint-disable-next-line no-sync
    const str = fs.readFileSync(filename, 'utf8');
    const parser = createParser('SaxParser', callbacks);

    parser.parseString(str);
    expect(callbackControl).toEqual(callbacks);
  });

  it('sax_push_chunked', () => {
    const callbacks = clone(callbackTest);
    // eslint-disable-next-line no-sync
    const str_ary = fs.readFileSync(filename, 'utf8').split('\n');
    const parser = createParser('SaxPushParser', callbacks);

    for (let i = 0; i < str_ary.length; i += 1) {
      parser.push(str_ary[i], i + 1 === str_ary.length);
    }

    const control = clone(callbackControl);

    control.error = [['Extra content at the end of the document\n']];
    expect(control).toEqual(callbacks);
  });

  // eslint-disable-next-line jest/expect-expect
  it('string_parser', () => {
    const callbacks = clone(callbackTest);
    // eslint-disable-next-line no-sync
    const str = fs.readFileSync(filename, 'utf8');
    const parser = createParser('SaxParser', callbacks);

    // test that the parser can be reused after a gc run
    for (let i = 0; i < 10; i += 1) {
      global.gc();
      parser.parseString(str);
    }
  });
});
