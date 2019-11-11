const pkg = require('../package');
const libxml = require('..');

describe('main', () => {
  it('constants', () => {
    expect(typeof libxml.version == 'string').toBeTruthy();
    expect(libxml.version).toBe(pkg.version);
    expect(typeof libxml.libxml_version == 'string').toBeTruthy();
    expect(typeof libxml.libxml_parser_version == 'string').toBeTruthy();
    expect(typeof libxml.libxml_debug_enabled == 'boolean').toBeTruthy();
  });

  it('memoryUsage', () => {
    expect(typeof libxml.memoryUsage() === 'number').toBeTruthy();
  });
});
