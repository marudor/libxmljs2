# Libxmljs2

LibXML bindings for [node.js](http://nodejs.org/)
This package was forked as the original one is fairly unmaintained.

```javascript
var libxmljs = require('libxmljs2');
var xml =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<root>' +
  '<child foo="bar">' +
  '<grandchild baz="fizbuzz">grandchild content</grandchild>' +
  '</child>' +
  '<sibling>with content!</sibling>' +
  '</root>';

var xmlDoc = libxmljs.parseXml(xml);

// xpath queries
var gchild = xmlDoc.get('//grandchild');

console.log(gchild.text()); // prints "grandchild content"

var children = xmlDoc.root().childNodes();
var child = children[0];

console.log(child.attr('foo').value()); // prints "bar"
```

## Support

- Docs - [http://github.com/marudor/libxmljs2/wiki](http://github.com/marudor/libxmljs2/wiki)

## API and Examples

Check out the wiki [http://github.com/marudor/libxmljs2/wiki](https://github.com/marudor/libxmljs2/wiki).

See the [examples](https://github.com/marudor/libxmljs2/tree/main/examples) folder.

## Installation via [npm](https://npmjs.org)

```shell
npm install libxmljs2
```

## Contribute

Start by checking out the [open issues](https://github.com/marudor/libxmljs2/issues?labels=&page=1&state=open). Specifically the [desired feature](https://github.com/marudor/libxmljs2/issues?labels=desired+feature&page=1&state=open) ones.

### Requirements

Make sure you have met the requirements for [node-gyp](https://github.com/TooTallNate/node-gyp#installation). You DO NOT need to manually install node-gyp; it comes bundled with node.
