/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
const bindings = require('./bindings');

// / create a new element on the given document
// / @param doc the Document to create the element for
// / @param name the element name
// / @param {String} [content] element content
// / @constructor
function Element(doc, name, content) {
  if (!doc) {
    throw new Error('document argument required');
  } else if (!(doc instanceof bindings.Document)) {
    throw new Error('document argument must be an instance of Document');
  } else if (!name) {
    throw new Error('name argument required');
  }

  return new bindings.Element(doc, name, content);
}

Element.prototype = bindings.Element.prototype;

Element.prototype.attr = function attr(...args) {
  if (args.length === 1) {
    const arg = args[0];

    if (typeof arg === 'object') {
      // object setter
      // iterate keys/value to set attributes
      for (const k in arg) {
        this._attr(k, arg[k]);
      }

      return this;
    } else if (typeof arg === 'string') {
      // getter
      return this._attr(arg);
    }
  } else if (args.length === 2) {
    // 2 arg setter
    const name = args[0];
    const value = args[1];

    this._attr(name, value);

    return this;
  }
};

// / helper method to attach a new node to this element
// / @param name the element name
// / @param {String} [content] element content
Element.prototype.node = function node(name, content) {
  const elem = Element(this.doc(), name, content);

  this.addChild(elem);

  return elem;
};

Element.prototype.get = function get(...args) {
  const res = this.find(...args);

  if (Array.isArray(res)) {
    return res[0];
  }

  return res;
};

Element.prototype.defineNamespace = function defineNamespace(prefix, href) {
  // if no prefix specified
  if (!href) {
    href = prefix;
    prefix = null;
  }

  return new bindings.Namespace(this, prefix, href);
};

module.exports = Element;
