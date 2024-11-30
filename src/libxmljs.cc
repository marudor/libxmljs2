// Copyright 2009, Squish Tech, LLC.

#include <v8.h>

#include <libxml/xmlmemory.h>

#include "libxmljs.h"
#include "xml_document.h"
#include "xml_namespace.h"
#include "xml_node.h"
#include "xml_sax_parser.h"
#include "xml_textwriter.h"

using namespace v8;
namespace libxmljs {

// ensure destruction at exit time
// v8 doesn't cleanup its resources
LibXMLJS LibXMLJS::instance;

// track how much memory libxml2 is using
int xml_memory_used = 0;

// How often we report memory usage changes back to V8.
const int nan_adjust_external_memory_threshold = 1024 * 1024;

// track how many nodes haven't been freed
int nodeCount = 0;

void adjustExternalMemory() {
  const int diff = xmlMemUsed() - xml_memory_used;

  if (abs(diff) > nan_adjust_external_memory_threshold) {
    xml_memory_used += diff;
    Nan::AdjustExternalMemory(diff);
  }
}

// wrapper for xmlMemMalloc to update v8's knowledge of memory used
// the GC relies on this information
void *xmlMemMallocWrap(size_t size) {
  void *res = xmlMemMalloc(size);

  // no need to udpate memory if we didn't allocate
  if (!res) {
    return res;
  }

  adjustExternalMemory();
  return res;
}

// wrapper for xmlMemFree to update v8's knowledge of memory used
// the GC relies on this information
void xmlMemFreeWrap(void *p) {
  xmlMemFree(p);

  // if v8 is no longer running, don't try to adjust memory
  // this happens when the v8 vm is shutdown and the program is exiting
  // our cleanup routines for libxml will be called (freeing memory)
  // but v8 is already offline and does not need to be informed
  // trying to adjust after shutdown will result in a fatal error
  if (Isolate::GetCurrent() == 0 || Isolate::GetCurrent()->IsDead()) {
    return;
  }

  adjustExternalMemory();
}

// wrapper for xmlMemRealloc to update v8's knowledge of memory used
void *xmlMemReallocWrap(void *ptr, size_t size) {
  void *res = xmlMemRealloc(ptr, size);

  // if realloc fails, no need to update v8 memory state
  if (!res) {
    return res;
  }

  adjustExternalMemory();
  return res;
}

// wrapper for xmlMemoryStrdupWrap to update v8's knowledge of memory used
char *xmlMemoryStrdupWrap(const char *str) {
  char *res = xmlMemoryStrdup(str);

  // if strdup fails, no need to update v8 memory state
  if (!res) {
    return res;
  }

  adjustExternalMemory();
  return res;
}

void deregisterNsList(xmlNs *ns) {
  while (ns != NULL) {
    if (ns->_private != NULL) {
      XmlNamespace *wrapper = static_cast<XmlNamespace *>(ns->_private);
      wrapper->xml_obj = NULL;
      ns->_private = NULL;
    }
    ns = ns->next;
  }
}

void deregisterNodeNamespaces(xmlNode *xml_obj) {
  xmlNs *ns = NULL;
  if ((xml_obj->type == XML_DOCUMENT_NODE) ||
#ifdef LIBXML_DOCB_ENABLED
      (xml_obj->type == XML_DOCB_DOCUMENT_NODE) ||
#endif
      (xml_obj->type == XML_HTML_DOCUMENT_NODE)) {
    ns = reinterpret_cast<xmlDoc *>(xml_obj)->oldNs;
  } else if ((xml_obj->type == XML_ELEMENT_NODE) ||
             (xml_obj->type == XML_XINCLUDE_START) ||
             (xml_obj->type == XML_XINCLUDE_END)) {
    ns = xml_obj->nsDef;
  }
  if (ns != NULL) {
    deregisterNsList(ns);
  }
}

/*
 * Before libxmljs nodes are freed, they are passed to the deregistration
 * callback, (configured by `xmlDeregisterNodeDefault`).
 *
 * In deregistering each node, we update any wrapper (e.g. `XmlElement`,
 * `XmlAttribute`) to ensure that when it is destroyed, it doesn't try to
 * access the freed memory.
 *
 * Because namespaces (`xmlNs`) attached to nodes are also freed and may be
 * wrapped, it is necessary to update any wrappers (`XmlNamespace`) which have
 * been created for attached namespaces.
 */
void xmlDeregisterNodeCallback(xmlNode *xml_obj) {
  nodeCount--;
  deregisterNodeNamespaces(xml_obj);
  if (xml_obj->_private != NULL) {
    static_cast<XmlNode *>(xml_obj->_private)->xml_obj = NULL;
    xml_obj->_private = NULL;
  }
  return;
}

// this is called for any created nodes
void xmlRegisterNodeCallback(xmlNode *xml_obj) { nodeCount++; }

LibXMLJS::LibXMLJS() {
  // set the callback for when a node is created
  xmlRegisterNodeDefault(xmlRegisterNodeCallback);

  // set the callback for when a node is about to be freed
  xmlDeregisterNodeDefault(xmlDeregisterNodeCallback);

  // populated debugMemSize (see xmlmemory.h/c) and makes the call to
  // xmlMemUsed work, this must happen first!
  xmlMemSetup(xmlMemFreeWrap, xmlMemMallocWrap, xmlMemReallocWrap,
              xmlMemoryStrdupWrap);

  // initialize libxml
  LIBXML_TEST_VERSION;

  // initial memory usage
  xml_memory_used = xmlMemUsed();
}

LibXMLJS::~LibXMLJS() { xmlCleanupParser(); }

Local<Object> listFeatures() {
  Nan::EscapableHandleScope scope;
  Local<Object> target = Nan::New<Object>();
#define FEAT(x)                                                                \
  Nan::Set(target, Nan::New<String>(#x).ToLocalChecked(),                      \
           Nan::New<Boolean>(xmlHasFeature(XML_WITH_##x)))
  // See enum xmlFeature in parser.h
  FEAT(THREAD);
  FEAT(TREE);
  FEAT(OUTPUT);
  FEAT(PUSH);
  FEAT(READER);
  FEAT(PATTERN);
  FEAT(WRITER);
  FEAT(SAX1);
  FEAT(FTP);
  FEAT(HTTP);
  FEAT(VALID);
  FEAT(HTML);
  FEAT(LEGACY);
  FEAT(C14N);
  FEAT(CATALOG);
  FEAT(XPATH);
  FEAT(XPTR);
  FEAT(XINCLUDE);
  FEAT(ICONV);
  FEAT(ISO8859X);
  FEAT(UNICODE);
  FEAT(REGEXP);
  FEAT(AUTOMATA);
  FEAT(EXPR);
  FEAT(SCHEMAS);
  FEAT(SCHEMATRON);
  FEAT(MODULES);
  FEAT(DEBUG);
  FEAT(DEBUG_MEM);
  FEAT(DEBUG_RUN);
  FEAT(ZLIB);
  FEAT(ICU);
  FEAT(LZMA);
  return scope.Escape(target);
}

NAN_METHOD(XmlMemUsed) {
  Nan::HandleScope scope;
  return info.GetReturnValue().Set(Nan::New<Int32>(xmlMemUsed()));
}

NAN_METHOD(XmlNodeCount) {
  Nan::HandleScope scope;
  return info.GetReturnValue().Set(Nan::New<Int32>(nodeCount));
}

NAN_MODULE_INIT(init) {
  Nan::HandleScope scope;

  XmlDocument::Initialize(target);
  XmlSaxParser::Initialize(target);
  XmlTextWriter::Initialize(target);

  Nan::Set(target, Nan::New<String>("libxml_version").ToLocalChecked(),
           Nan::New<String>(LIBXML_DOTTED_VERSION).ToLocalChecked());

  Nan::Set(target, Nan::New<String>("libxml_parser_version").ToLocalChecked(),
           Nan::New<String>(xmlParserVersion).ToLocalChecked());

  Nan::Set(target, Nan::New<String>("libxml_debug_enabled").ToLocalChecked(),
           Nan::New<Boolean>(debugging));

  Nan::Set(target, Nan::New<String>("features").ToLocalChecked(),
           listFeatures());

  Nan::Set(target, Nan::New<String>("libxml").ToLocalChecked(), target);

  Nan::SetMethod(target, "xmlMemUsed", XmlMemUsed);

  Nan::SetMethod(target, "xmlNodeCount", XmlNodeCount);
}

NAN_MODULE_WORKER_ENABLED(xmljs, init)

} // namespace libxmljs
