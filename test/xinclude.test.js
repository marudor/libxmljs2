const libxml = require('../index');
const path = require('path');

describe('xinclude', () => {
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n<root xmlns:xi="http://www.w3.org/2001/XInclude"><xi:include href="fixtures/parser.xml" /></root>';
  const txt =
    '<?xml version="1.0" encoding="UTF-8"?>\n<root xmlns:xi="http://www.w3.org/2001/XInclude"><xi:include href="fixtures/include.txt" parse="text" /></root>';

  const baseUrl = `${path.resolve(__dirname)}/`;

  it('xinclude', () => {
    const doc = libxml.parseXmlString(xml, {
      baseUrl,
      xinclude: true,
      noxincnode: true,
    });
    const child = doc.get('//child');

    expect(child).toBeTruthy();
    expect(child.name()).toBe('child');
  });

  it('xincnode', () => {
    const doc = libxml.parseXmlString(xml, {
      baseUrl,
      xinclude: true,
      noxincnode: false,
    });
    const xincnode = doc.root().child(0);

    expect(xincnode).toBeTruthy();
    expect('include').toBe(xincnode.name());
    expect('xinclude_start').toBe(xincnode.type());
  });

  it('xincludeText', () => {
    const doc = libxml.parseXmlString(txt, {
      baseUrl,
      xinclude: true,
      noxincnode: true,
    });

    expect(doc.root().text()).toBe('Lorem ipsum dolor sit amet\n');
  });

  it('xincludeDisabled', () => {
    const doc = libxml.parseXmlString(xml, {
      baseUrl,
    });
    const include = doc.get('//xi:include', {
      xi: 'http://www.w3.org/2001/XInclude',
    });

    expect(include).toBeTruthy();
  });
});
