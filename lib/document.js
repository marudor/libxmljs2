/* eslint-disable no-underscore-dangle */
const bindings = require('./bindings');

const Element = require('./element');

function assertRoot(doc) {
  if (!doc.root()) {
    throw new Error('Document has no root element');
  }
}

const Document = bindings.Document;

Document.prototype = bindings.Document.prototype;

// / add a child node to the document
// / this will set the document root
Document.prototype.node = function node(name, content) {
  return this.root(Element(this, name, content));
};

// / xpath search
// / @return array of matching elements
Document.prototype.find = function find(xpath, ns_uri) {
  assertRoot(this);

  return this.root().find(xpath, ns_uri);
};

// / xpath search
// / @return first element matching
Document.prototype.get = function get(xpath, ns_uri) {
  assertRoot(this);

  return this.root().get(xpath, ns_uri);
};

// / @return a given child
Document.prototype.child = function child(id) {
  if (id === undefined || typeof id !== 'number') {
    throw new Error('id argument required for #child');
  }

  assertRoot(this);

  return this.root().child(id);
};

// / @return an Array of child nodes of the document root
Document.prototype.childNodes = function childNodes() {
  assertRoot(this);

  return this.root().childNodes();
};

Document.prototype.setDtd = function setDtd(name, ext, sys) {
  if (!name) {
    throw new Error('Must pass in a DTD name');
  } else if (typeof name !== 'string') {
    throw new Error('Must pass in a valid DTD name');
  }

  const params = [name];

  if (typeof ext !== 'undefined') {
    params.push(ext);
  }
  if (ext && typeof sys !== 'undefined') {
    params.push(sys);
  }

  return this._setDtd(...params);
};

// / @return array of namespaces in document
Document.prototype.namespaces = function namespaces() {
  assertRoot(this);

  return this.root().namespaces();
};

module.exports = Document;

// / parse a string into a html document
// / @param string html string to parse
// / @param {encoding:string, baseUrl:string} opts html string to parse
// / @return a Document
module.exports.fromHtml = function fromHtml(string, opts = {}) {
  // if for some reason user did not specify an object for the options
  if (typeof opts !== 'object') {
    throw new Error('fromHtml options must be an object');
  }

  return bindings.fromHtml(string, opts);
};

// / parse a string into a html document fragment
// / @param string html string to parse
// / @param {encoding:string, baseUrl:string} opts html string to parse
// / @return a Document
module.exports.fromHtmlFragment = function fromHtmlFragment(string, opts = {}) {
  // if for some reason user did not specify an object for the options
  if (typeof opts !== 'object') {
    throw new Error('fromHtmlFragment options must be an object');
  }

  opts.doctype = false;
  opts.implied = false;

  return bindings.fromHtml(string, opts);
};

// / parse a string into a xml document
// / @param string xml string to parse
// / @return a Document
module.exports.fromXml = function fromXml(string, options = {}) {
  return bindings.fromXml(string, options);
};
