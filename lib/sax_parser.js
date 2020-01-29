const events = require('events');

const bindings = require('./bindings');

const SaxParser = function SaxParser(callbacks) {
  const parser = new bindings.SaxParser();

  // attach callbacks
  for (const callback in callbacks) {
    parser.on(callback, callbacks[callback]);
  }

  return parser;
};

// Overriding the prototype, like util.inherit, wipes out the native binding.
// Copy over the methods instead.
for (const k in events.EventEmitter.prototype)
  bindings.SaxParser.prototype[k] = events.EventEmitter.prototype[k];

const SaxPushParser = function SaxPushParser(callbacks) {
  const parser = new bindings.SaxPushParser();

  // attach callbacks
  for (const callback in callbacks) {
    parser.on(callback, callbacks[callback]);
  }

  return parser;
};

// Overriding the prototype, like util.inherit, wipes out the native binding.
// Copy over the methods instead.
for (const k in events.EventEmitter.prototype)
  bindings.SaxPushParser.prototype[k] = events.EventEmitter.prototype[k];

module.exports.SaxParser = SaxParser;
module.exports.SaxPushParser = SaxPushParser;
