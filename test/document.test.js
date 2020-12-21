const libxml = require('../index');

describe('document', () => {
  const VALIDATE_RSS_TOLERANCE = 1;

  function rssAfterGarbageCollection(maxCycles = 10) {
    let rss = libxml.memoryUsage();
    let freedMemory = 0;

    do {
      global.gc();

      const rssAfterGc = libxml.memoryUsage();

      freedMemory = rss - rssAfterGc;
      rss = rssAfterGc;

      // eslint-disable-next-line no-param-reassign
      maxCycles -= 1;
    } while (freedMemory !== 0 && maxCycles > 0);

    return rss;
  }

  it('getDtd', () => {
    let doc = libxml.parseXmlString(
      '<?xml version="1.0" encoding="UTF-8"?>\n<root></root>'
    );
    let dtd = doc.getDtd();

    expect(dtd).toBeNull();
    doc = libxml.parseXmlString(
      '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE html>\n<root></root>'
    );
    dtd = doc.getDtd();
    expect('html').toBe(dtd.name);
    expect(dtd.externalId).toBeNull();
    expect(dtd.systemId).toBeNull();
    doc = libxml.parseXmlString(
      '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE html SYSTEM "http://www.w3.org/TR/html4/strict.dtd">\n<root></root>'
    );
    dtd = doc.getDtd();
    expect('html').toBe(dtd.name);
    expect(dtd.externalId).toBeNull();
    expect('http://www.w3.org/TR/html4/strict.dtd').toBe(dtd.systemId);
    doc = libxml.parseXmlString(
      '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">\n<root></root>'
    );
    dtd = doc.getDtd();
    expect('html').toBe(dtd.name);
    expect('-//W3C//DTD HTML 4.01//EN').toBe(dtd.externalId);
    expect('http://www.w3.org/TR/html4/strict.dtd').toBe(dtd.systemId);
  });

  it('setDtd', () => {
    const doc = new libxml.Document();

    doc.setDtd('html');
    expect('<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE html>\n').toBe(
      doc.toString()
    );
    doc.setDtd('html', 'bacon', 'bacon');
    expect(
      '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE html PUBLIC "bacon" "bacon">\n'
    ).toBe(doc.toString());
    doc.setDtd('html', null);
    expect('<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE html>\n').toBe(
      doc.toString()
    );
    expect(() => {
      doc.setDtd(5);
    }).toThrow();
    expect('<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE html>\n').toBe(
      doc.toString()
    );
    expect(() => {
      doc.setDtd();
    }).toThrow();
    expect('<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE html>\n').toBe(
      doc.toString()
    );
  });

  it('blank', () => {
    const doc = new libxml.Document();

    expect('1.0').toBe(doc.version());
    expect('utf8').toBe(doc.encoding());
  });

  it('version', () => {
    const doc = new libxml.Document('2.0');

    expect('2.0').toBe(doc.version());
    expect('utf8').toBe(doc.encoding());
  });

  it('type', () => {
    const doc = new libxml.Document('2.0');

    expect('document').toBe(doc.type());
  });

  it('full', () => {
    const doc = new libxml.Document('2.0', 'UTF-8');

    expect('2.0').toBe(doc.version());
    expect('UTF-8').toBe(doc.encoding());
  });

  it('null root', () => {
    const doc = new libxml.Document();

    expect(doc.root()).toBeNull();
  });

  it('new root', () => {
    const doc = new libxml.Document();
    const root = doc.node('root');

    expect('root').toBe(root.name());
    expect(root).toBe(doc.root());

    root.node('child').parent().node('child');
    expect(doc.root().name()).toBe(doc.get('/root').name());
  });

  it('one child', () => {
    const doc = new libxml.Document();

    doc.node('root').node('child-one').parent().node('child-two');

    expect('child-one').toBe(doc.child(0).name());
    expect('child-two').toBe(doc.child(1).name());
  });

  it('root children', () => {
    const doc = new libxml.Document();

    doc.node('root').node('child-one').parent().node('child-two');
    expect('child-one').toBe(doc.childNodes()[0].name());
    expect('child-two').toBe(doc.childNodes()[1].name());
  });

  it('xpath', () => {
    const doc = new libxml.Document();

    doc.node('root').node('child').parent().node('child');
    expect(2).toBe(doc.find('child').length);
  });

  it('xpath child', () => {
    const doc = new libxml.Document();

    doc.node('root').node('child-one').parent().node('child-two');
    expect('child-one').toBe(doc.get('child-one').name());
    expect('child-two').toBe(doc.get('child-two').name());
  });

  it('toString', () => {
    const control = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<root>',
      '  <child to="wongfoo">',
      '    <grandchild from="julie numar">with love</grandchild>',
      '  </child>',
      '  <sibling>with content!</sibling>',
      '</root>',
      '',
    ].join('\n');

    const doc = new libxml.Document();
    const root = doc.node('root');

    root
      .node('child')
      .attr({ to: 'wongfoo' })
      .node('grandchild', 'with love')
      .attr({ from: 'julie numar' });
    root.node('sibling', 'with content!');
    expect(control).toBe(doc.toString());
  });

  it('add child nodes', () => {
    const doc1_string = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<root><child to="wongfoo"><grandchild from="julie numar">with love</grandchild></child><sibling>with content!</sibling></root>',
    ].join('\n');

    const doc2_string = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<root><child to="wongfoo"></child><sibling>with content!</sibling></root>',
    ].join('\n');

    const doc1 = libxml.parseXml(doc1_string);
    const doc2 = libxml.parseXml(doc2_string);

    doc2.child(0).addChild(doc1.child(0).child(0));
    expect(doc1.toString()).toBe(doc2.toString());
  });

  it('add cdata nodes', () => {
    const doc1_string = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<root><child to="wongfoo"/></root>',
    ].join('\n');

    const expected_string = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<root>',
      '  <child to="wongfoo"><![CDATA[<p>Bacon</p>]]></child>',
      '</root>',
      '' /* Why?!? */,
    ].join('\n');

    const doc1 = libxml.parseXml(doc1_string);

    doc1.child(0).cdata('<p>Bacon</p>');
    expect(doc1.toString()).toBe(expected_string);
  });

  it('cloned node', () => {
    const gchild_string =
      '<grandchild from="julie numar">with love</grandchild>';
    const doc1_string = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<root><child to="wongfoo">${gchild_string}</child><sibling>with content!</sibling></root>`,
      '',
    ].join('\n');

    const doc2_string = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<root><child to="wongfoo"/><sibling>with content!</sibling></root>',
      '',
    ].join('\n');

    const doc1 = libxml.parseXml(doc1_string);
    const doc2 = libxml.parseXml(doc2_string);

    const gchild = doc1.child(0).child(0); // the element to operate on

    doc2.child(0).addChild(gchild); // add gchild clone to doc2, implicit clone

    expect(doc1.toString()).toBe(doc2.toString()); // both documents should be the same

    expect(gchild).not.toBe(doc2.child(0).child(0)); // these nodes should be different (cloned)

    gchild.remove();

    expect(doc2_string).toBe(doc1.toString(false)); // doc1 should be the same as doc2 str (raw output)
    expect(doc1_string).toBe(doc2.toString(false)); // doc2 should be the same as doc1 str (raw output)
  });

  it('validate', () => {
    const xsd =
      '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"><xs:element name="comment" type="xs:string"/></xs:schema>';
    const xml_valid = '<?xml version="1.0"?><comment>A comment</comment>';
    const xml_invalid = '<?xml version="1.0"?><commentt>A comment</commentt>';

    const xsdDoc = libxml.parseXml(xsd);
    const xmlDocValid = libxml.parseXml(xml_valid);
    const xmlDocInvalid = libxml.parseXml(xml_invalid);

    expect(xmlDocValid.validate(xsdDoc)).toBe(true);
    expect(xmlDocValid.validationErrors.length).toBe(0);

    expect(xmlDocInvalid.validate(xsdDoc)).toBe(false);
    expect(xmlDocInvalid.validationErrors.length).toBe(1);
  });

  it('rngValidate', () => {
    // see http://relaxng.org/ for more infos about RELAX NG

    const rng =
      '<element name="addressBook" xmlns="http://relaxng.org/ns/structure/1.0">' +
      '<zeroOrMore>' +
      '<element name="card">' +
      '<element name="name">' +
      '<text/>' +
      '</element>' +
      '<element name="email">' +
      '<text/>' +
      '</element>' +
      '</element>' +
      '</zeroOrMore>' +
      '</element>';

    const xml_valid =
      '<addressBook>' +
      '<card>' +
      '<name>John Smith</name>' +
      '<email>js@example.com</email>' +
      '</card>' +
      '<card>' +
      '<name>Fred Bloggs</name>' +
      '<email>fb@example.net</email>' +
      '</card>' +
      '</addressBook>';

    const xml_invalid =
      '<addressBook>' +
      '<card>' +
      '<Name>John Smith</Name>' +
      '<email>js@example.com</email>' +
      '</card>' +
      '<card>' +
      '<name>Fred Bloggs</name>' +
      '<email>fb@example.net</email>' +
      '</card>' +
      '</addressBook>';

    const rngDoc = libxml.parseXml(rng);
    const xmlDocValid = libxml.parseXml(xml_valid);
    const xmlDocInvalid = libxml.parseXml(xml_invalid);

    expect(() => xmlDocValid.rngValidate()).toThrow('Must pass xsd');
    expect(() => xmlDocValid.rngValidate(undefined)).toThrow('Must pass xsd');
    expect(() => xmlDocValid.rngValidate(null)).toThrow('Must pass xsd');
    expect(() => xmlDocValid.rngValidate(0)).toThrow('Must pass XmlDocument');
    expect(xmlDocValid.rngValidate(rngDoc)).toBe(true);
    expect(xmlDocValid.validationErrors.length).toBe(0);

    expect(xmlDocInvalid.rngValidate(rngDoc)).toBe(false);
    expect(xmlDocInvalid.validationErrors.length).toBe(1);
  });

  it('schematronValidate', () => {
    const sch =
      '<schema xmlns="http://purl.oclc.org/dsdl/schematron" queryBinding="xslt2">' +
      '<pattern id="errors">' +
      '<rule context="//addr">' +
      '<assert test="state[last()=1] or @nullFlavor">All //addr elements MUST have element state.</assert>' +
      '<assert test="streetAddressLine or @nullFlavor">All //addr elements MUST have element streetAddressLine</assert>' +
      '</rule>' +
      '</pattern>' +
      '</schema>';

    const xml_valid =
      '<ClinicalDocument>' +
      '<recordTarget>' +
      '<patientRole>' +
      '<addr use="H">' +
      '<state>24</state>' +
      '<streetAddressLine>example street</streetAddressLine>' +
      '</addr>' +
      '</patientRole>' +
      '</recordTarget>' +
      '</ClinicalDocument>';

    const xml_invalid =
      '<ClinicalDocument>' +
      '<recordTarget>' +
      '<patientRole>' +
      '<addr use="H">' +
      '<state>24</state>' +
      '</addr>' +
      '</patientRole>' +
      '</recordTarget>' +
      '</ClinicalDocument>';

    const schDoc = libxml.parseXml(sch);
    const xmlDocValid = libxml.parseXml(xml_valid);
    const xmlDocInvalid = libxml.parseXml(xml_invalid);

    expect(() => xmlDocValid.schematronValidate()).toThrow('Must pass schema');
    expect(() => xmlDocValid.schematronValidate(undefined)).toThrow(
      'Must pass schema'
    );
    expect(() => xmlDocValid.schematronValidate(null)).toThrow(
      'Must pass schema'
    );
    expect(() => xmlDocValid.schematronValidate(0)).toThrow(
      'Must pass XmlDocument'
    );
    expect(xmlDocValid.schematronValidate(schDoc)).toBe(true);
    expect(xmlDocValid.validationErrors.length).toBe(0);

    expect(xmlDocInvalid.schematronValidate(schDoc)).toBe(false);
    expect(xmlDocInvalid.validationErrors.length).toBe(1);
  });

  it('validate memory usage', () => {
    const xsd =
      '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"><xs:element name="comment" type="xs:string"/></xs:schema>';
    const xml = '<?xml version="1.0"?><comment>A comment</comment>';

    const xsdDoc = libxml.parseXml(xsd);
    const xmlDoc = libxml.parseXml(xml);

    const rssBefore = rssAfterGarbageCollection();

    for (let i = 0; i < 10000; i += 1) {
      xmlDoc.validate(xsdDoc);
    }
    expect(
      rssAfterGarbageCollection() - rssBefore < VALIDATE_RSS_TOLERANCE
    ).toBeTruthy();
  });

  it('validate inputs', () => {
    const xml = '<?xml version="1.0"?><comment>A comment</comment>';
    const xmlDoc = libxml.parseXml(xml);

    expect(() => {
      xmlDoc.validate();
    }).toThrow();
    expect(() => {
      xmlDoc.validate('foo');
    }).toThrow();
    expect(() => {
      xmlDoc.validate(123);
    }).toThrow();
    expect(() => {
      xmlDoc.validate({});
    }).toThrow();
    expect(() => {
      xmlDoc.rngValidate();
    }).toThrow();
    expect(() => {
      xmlDoc.rngValidate('foo');
    }).toThrow();
  });

  it('fromHtml', () => {
    const html = '<p>A paragraph with <span>inline tags</span></p>';
    const header =
      '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd">\n<html><body>';
    const footer = '</body></html>\n';
    const parsedHtml = libxml.Document.fromHtml(html);

    expect(header + html + footer).toBe(parsedHtml.toString());
  });

  it('fromHtmlFragment', () => {
    const html = '<p>A paragraph with <span>inline tags</span></p>';
    const parsedHtml = libxml.Document.fromHtmlFragment(html);

    expect(`${html}\n`).toBe(parsedHtml.toString());
  });

  it('validate rng memory usage', () => {
    const rng =
      '<element name="addressBook" xmlns="http://relaxng.org/ns/structure/1.0">' +
      '<zeroOrMore>' +
      '<element name="card">' +
      '<element name="name">' +
      '<text/>' +
      '</element>' +
      '<element name="email">' +
      '<text/>' +
      '</element>' +
      '</element>' +
      '</zeroOrMore>' +
      '</element>';

    const xml_valid =
      '<addressBook>' +
      '<card>' +
      '<name>John Smith</name>' +
      '<email>js@example.com</email>' +
      '</card>' +
      '<card>' +
      '<name>Fred Bloggs</name>' +
      '<email>fb@example.net</email>' +
      '</card>' +
      '</addressBook>';

    const rngDoc = libxml.parseXml(rng);
    const xmlDoc = libxml.parseXml(xml_valid);

    const rssBefore = rssAfterGarbageCollection();

    for (let i = 0; i < 10000; i += 1) {
      xmlDoc.rngValidate(rngDoc);
    }
    expect(
      rssAfterGarbageCollection() - rssBefore < VALIDATE_RSS_TOLERANCE
    ).toBeTruthy();
  });

  describe('errors', () => {
    it('empty html doc', () => {
      function assertDocRootError(func) {
        expect(func).toThrow(/Document has no root element/);
      }

      const xml_only_comments = '<!-- empty -->';
      const doc = libxml.parseHtmlString(xml_only_comments);

      expect(null).toBe(doc.root());

      assertDocRootError(() => {
        doc.get('*');
      });

      assertDocRootError(() => {
        doc.find('*');
      });

      assertDocRootError(() => {
        doc.child(1);
      });

      assertDocRootError(() => {
        doc.childNodes();
      });

      assertDocRootError(() => {
        doc.namespaces();
      });
    });
  });
});
