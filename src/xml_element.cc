// Copyright 2009, Squish Tech, LLC.

#include <node.h>

#include <cstring>

#include "libxmljs.h"

#include "xml_attribute.h"
#include "xml_document.h"
#include "xml_element.h"
#include "xml_xpath_context.h"

using namespace v8;

namespace libxmljs {

Nan::Persistent<FunctionTemplate> XmlElement::constructor_template;

// doc, name, content
NAN_METHOD(XmlElement::New) {
  Nan::HandleScope scope;

  // if we were created for an existing xml node, then we don't need
  // to create a new node on the document
  if (info.Length() == 0) {
    return info.GetReturnValue().Set(info.This());
  }

  XmlDocument *document = Nan::ObjectWrap::Unwrap<XmlDocument>(
      Nan::To<Object>(info[0]).ToLocalChecked());
  assert(document);

  Nan::Utf8String name(info[1]);

  Local<Value> contentOpt;
  if (info[2]->IsString()) {
    contentOpt = info[2];
  }
  Nan::Utf8String contentRaw(contentOpt);
  const char *content = (contentRaw.length()) ? *contentRaw : NULL;

  xmlChar *encodedContent =
      content
          ? xmlEncodeSpecialChars(document->xml_obj, (const xmlChar *)content)
          : NULL;
  xmlNode *elem = xmlNewDocNode(document->xml_obj, NULL, (const xmlChar *)*name,
                                encodedContent);
  if (encodedContent)
    xmlFree(encodedContent);

  XmlElement *element = new XmlElement(elem);
  elem->_private = element;
  element->Wrap(info.This());

  // this prevents the document from going away
  Nan::Set(info.This(), Nan::New<String>("document").ToLocalChecked(),
           info[0])
      .Check();

  return info.GetReturnValue().Set(info.This());
}

NAN_METHOD(XmlElement::Name) {
  Nan::HandleScope scope;
  XmlElement *element = Nan::ObjectWrap::Unwrap<XmlElement>(info.This());
  assert(element);

  if (info.Length() == 0)
    return info.GetReturnValue().Set(element->get_name());

  Nan::Utf8String name(Nan::To<String>(info[0]).ToLocalChecked());
  element->set_name(*name);
  return info.GetReturnValue().Set(info.This());
}

NAN_METHOD(XmlElement::Attr) {
  Nan::HandleScope scope;
  XmlElement *element = Nan::ObjectWrap::Unwrap<XmlElement>(info.This());
  assert(element);

  // getter
  if (info.Length() == 1) {
    Nan::Utf8String name(info[0]);
    return info.GetReturnValue().Set(element->get_attr(*name));
  }

  // setter
  Nan::Utf8String name(info[0]);
  Nan::Utf8String value(info[1]);
  element->set_attr(*name, *value);

  return info.GetReturnValue().Set(info.This());
}

NAN_METHOD(XmlElement::Attrs) {
  Nan::HandleScope scope;
  XmlElement *element = Nan::ObjectWrap::Unwrap<XmlElement>(info.This());
  assert(element);

  return info.GetReturnValue().Set(element->get_attrs());
}

NAN_METHOD(XmlElement::AddChild) {
  XmlElement *element = Nan::ObjectWrap::Unwrap<XmlElement>(info.This());
  assert(element);

  XmlNode *child = Nan::ObjectWrap::Unwrap<XmlNode>(
      Nan::To<Object>(info[0]).ToLocalChecked());
  assert(child);

  xmlNode *imported_child = element->import_node(child->xml_obj);
  if (imported_child == NULL) {
    return Nan::ThrowError(
        "Could not add child. Failed to copy node to new Document.");
  }

  bool will_merge = element->child_will_merge(imported_child);
  if ((child->xml_obj == imported_child) && will_merge) {
    // merged child will be free, so ensure it is a copy
    imported_child = xmlCopyNode(imported_child, 0);
  }

  element->add_child(imported_child);

  if (!will_merge && (imported_child->_private != NULL)) {
    static_cast<XmlNode *>(imported_child->_private)->ref_wrapped_ancestor();
  }

  return info.GetReturnValue().Set(info.This());
}

NAN_METHOD(XmlElement::AddCData) {
  Nan::HandleScope scope;
  XmlElement *element = Nan::ObjectWrap::Unwrap<XmlElement>(info.This());
  assert(element);

  Local<Value> contentOpt;
  if (info[0]->IsString()) {
    contentOpt = info[0];
  }
  Nan::Utf8String contentRaw(contentOpt);
  const char *content = (contentRaw.length()) ? *contentRaw : NULL;

  xmlNode *elem =
      xmlNewCDataBlock(element->xml_obj->doc, (const xmlChar *)content,
                       xmlStrlen((const xmlChar *)content));

  element->add_cdata(elem);
  return info.GetReturnValue().Set(info.This());
}

NAN_METHOD(XmlElement::Find) {
  Nan::HandleScope scope;
  XmlElement *element = Nan::ObjectWrap::Unwrap<XmlElement>(info.This());
  assert(element);

  Nan::Utf8String xpath(info[0]);

  XmlXpathContext ctxt(element->xml_obj);

  if (info.Length() == 2) {
    if (info[1]->IsString()) {
      Nan::Utf8String uri(info[1]);
      ctxt.register_ns((const xmlChar *)"xmlns", (const xmlChar *)*uri);
    } else if (info[1]->IsObject()) {
      Local<Object> namespaces = Nan::To<Object>(info[1]).ToLocalChecked();
      Local<Array> properties =
          Nan::GetPropertyNames(namespaces).ToLocalChecked();
      for (unsigned int i = 0; i < properties->Length(); i++) {
        Local<String> prop_name =
            Nan::To<String>(
                Nan::Get(properties, Nan::New<Number>(i)).ToLocalChecked())
                .ToLocalChecked();
        Nan::Utf8String prefix(prop_name);
        Nan::Utf8String uri(Nan::Get(namespaces, prop_name).ToLocalChecked());
        ctxt.register_ns((const xmlChar *)*prefix, (const xmlChar *)*uri);
      }
    }
  }

  return info.GetReturnValue().Set(ctxt.evaluate((const xmlChar *)*xpath));
}

NAN_METHOD(XmlElement::NextElement) {
  Nan::HandleScope scope;
  XmlElement *element = Nan::ObjectWrap::Unwrap<XmlElement>(info.This());
  assert(element);

  return info.GetReturnValue().Set(element->get_next_element());
}

NAN_METHOD(XmlElement::PrevElement) {
  Nan::HandleScope scope;
  XmlElement *element = Nan::ObjectWrap::Unwrap<XmlElement>(info.This());
  assert(element);

  return info.GetReturnValue().Set(element->get_prev_element());
}

NAN_METHOD(XmlElement::Text) {
  Nan::HandleScope scope;
  XmlElement *element = Nan::ObjectWrap::Unwrap<XmlElement>(info.This());
  assert(element);

  if (info.Length() == 0) {
    return info.GetReturnValue().Set(element->get_content());
  } else {
    element->set_content(*Nan::Utf8String(info[0]));
  }

  return info.GetReturnValue().Set(info.This());
}

NAN_METHOD(XmlElement::Child) {
  Nan::HandleScope scope;
  XmlElement *element = Nan::ObjectWrap::Unwrap<XmlElement>(info.This());
  assert(element);

  if (info.Length() != 1 || !info[0]->IsInt32()) {
    return Nan::ThrowError("Bad argument: must provide #child() with a number");
  }

  const int32_t idx = Nan::To<int32_t>(info[0]).ToChecked();
  return info.GetReturnValue().Set(element->get_child(idx));
}

NAN_METHOD(XmlElement::ChildNodes) {
  Nan::HandleScope scope;
  XmlElement *element = Nan::ObjectWrap::Unwrap<XmlElement>(info.This());
  assert(element);

  if (info[0]->IsInt32())
    return info.GetReturnValue().Set(
        element->get_child(Nan::To<int32_t>(info[0]).ToChecked()));

  return info.GetReturnValue().Set(element->get_child_nodes());
}

NAN_METHOD(XmlElement::Path) {
  Nan::HandleScope scope;
  XmlElement *element = Nan::ObjectWrap::Unwrap<XmlElement>(info.This());
  assert(element);

  return info.GetReturnValue().Set(element->get_path());
}

NAN_METHOD(XmlElement::AddPrevSibling) {
  XmlElement *element = Nan::ObjectWrap::Unwrap<XmlElement>(info.This());
  assert(element);

  XmlNode *new_sibling = Nan::ObjectWrap::Unwrap<XmlNode>(
      Nan::To<Object>(info[0]).ToLocalChecked());
  assert(new_sibling);

  xmlNode *imported_sibling = element->import_node(new_sibling->xml_obj);
  if (imported_sibling == NULL) {
    return Nan::ThrowError(
        "Could not add sibling. Failed to copy node to new Document.");
  }

  element->add_prev_sibling(imported_sibling);

  if (imported_sibling->_private != NULL) {
    static_cast<XmlNode *>(imported_sibling->_private)->ref_wrapped_ancestor();
  }

  return info.GetReturnValue().Set(info[0]);
}

NAN_METHOD(XmlElement::AddNextSibling) {
  XmlElement *element = Nan::ObjectWrap::Unwrap<XmlElement>(info.This());
  assert(element);

  XmlNode *new_sibling = Nan::ObjectWrap::Unwrap<XmlNode>(
      Nan::To<Object>(info[0]).ToLocalChecked());
  assert(new_sibling);

  xmlNode *imported_sibling = element->import_node(new_sibling->xml_obj);
  if (imported_sibling == NULL) {
    return Nan::ThrowError(
        "Could not add sibling. Failed to copy node to new Document.");
  }

  element->add_next_sibling(imported_sibling);

  if (imported_sibling->_private != NULL) {
    static_cast<XmlNode *>(imported_sibling->_private)->ref_wrapped_ancestor();
  }

  return info.GetReturnValue().Set(info[0]);
}

NAN_METHOD(XmlElement::Replace) {
  XmlElement *element = Nan::ObjectWrap::Unwrap<XmlElement>(info.This());
  assert(element);

  if (info[0]->IsString()) {
    element->replace_text(*Nan::Utf8String(info[0]));
  } else {
    XmlElement *new_sibling = Nan::ObjectWrap::Unwrap<XmlElement>(
        Nan::To<Object>(info[0]).ToLocalChecked());
    assert(new_sibling);

    xmlNode *imported_sibling = element->import_node(new_sibling->xml_obj);
    if (imported_sibling == NULL) {
      return Nan::ThrowError(
          "Could not replace. Failed to copy node to new Document.");
    }
    element->replace_element(imported_sibling);
  }

  return info.GetReturnValue().Set(info[0]);
}

void XmlElement::set_name(const char *name) {
  xmlNodeSetName(xml_obj, (const xmlChar *)name);
}

Local<Value> XmlElement::get_name() {
  Nan::EscapableHandleScope scope;
  if (xml_obj->name)
    return scope.Escape(
        Nan::New<String>((const char *)xml_obj->name).ToLocalChecked());
  else
    return scope.Escape(Nan::Undefined());
}

// TODO(sprsquish) make these work with namespaces
Local<Value> XmlElement::get_attr(const char *name) {
  Nan::EscapableHandleScope scope;
  xmlAttr *attr = xmlHasProp(xml_obj, (const xmlChar *)name);

  // why do we need a reference to the element here?
  if (attr) {
    return scope.Escape(XmlAttribute::New(attr));
  }

  return scope.Escape(Nan::Null());
}

// TODO(sprsquish) make these work with namespaces
void XmlElement::set_attr(const char *name, const char *value) {
  Nan::HandleScope scope;
  XmlAttribute::New(xml_obj, (const xmlChar *)name, (const xmlChar *)value);
}

Local<Value> XmlElement::get_attrs() {
  Nan::EscapableHandleScope scope;
  xmlAttr *attr = xml_obj->properties;

  if (!attr)
    return scope.Escape(Nan::New<Array>(0));

  Local<Array> attributes = Nan::New<Array>();
  Local<Function> push = Local<Function>::Cast(
      Nan::Get(attributes, Nan::New<String>("push").ToLocalChecked())
          .ToLocalChecked());
  Local<Value> argv[1];
  do {
    argv[0] = XmlAttribute::New(attr);
    Nan::Call(push, attributes, 1, argv);
  } while ((attr = attr->next));

  return scope.Escape(attributes);
}

void XmlElement::add_cdata(xmlNode *cdata) { xmlAddChild(xml_obj, cdata); }

Local<Value> XmlElement::get_child(int32_t idx) {
  Nan::EscapableHandleScope scope;
  xmlNode *child = xml_obj->children;

  int32_t i = 0;
  while (child && i < idx) {
    child = child->next;
    ++i;
  }

  if (!child)
    return scope.Escape(Nan::Null());

  return scope.Escape(XmlNode::New(child));
}

Local<Value> XmlElement::get_child_nodes() {
  Nan::EscapableHandleScope scope;

  xmlNode *child = xml_obj->children;
  if (!child)
    return scope.Escape(Nan::New<Array>(0));

  uint32_t len = 0;
  do {
    ++len;
  } while ((child = child->next));

  Local<Array> children = Nan::New<Array>(len);
  child = xml_obj->children;

  uint32_t i = 0;
  do {
    Nan::Set(children, i, XmlNode::New(child));
  } while ((child = child->next) && ++i < len);

  return scope.Escape(children);
}

Local<Value> XmlElement::get_path() {
  Nan::EscapableHandleScope scope;
  xmlChar *path = xmlGetNodePath(xml_obj);
  const char *return_path = path ? reinterpret_cast<char *>(path) : "";
  int str_len = xmlStrlen((const xmlChar *)return_path);
  Local<String> js_obj =
      Nan::New<String>(return_path, str_len).ToLocalChecked();
  xmlFree(path);
  return scope.Escape(js_obj);
}

void XmlElement::unlink_children() {
  xmlNode *cur = xml_obj->children;
  while (cur != NULL) {
    xmlNode *next = cur->next;
    if (cur->_private != NULL) {
      static_cast<XmlNode *>(cur->_private)->unref_wrapped_ancestor();
    }
    xmlUnlinkNode(cur);
    cur = next;
  }
}

void XmlElement::set_content(const char *content) {
  xmlChar *encoded =
      xmlEncodeSpecialChars(xml_obj->doc, (const xmlChar *)content);
  this->unlink_children();
  xmlNodeSetContent(xml_obj, encoded);
  xmlFree(encoded);
}

Local<Value> XmlElement::get_content() {
  Nan::EscapableHandleScope scope;
  xmlChar *content = xmlNodeGetContent(xml_obj);
  if (content) {
    Local<String> ret_content =
        Nan::New<String>((const char *)content).ToLocalChecked();
    xmlFree(content);
    return scope.Escape(ret_content);
  }

  return scope.Escape(Nan::New<String>("").ToLocalChecked());
}

Local<Value> XmlElement::get_next_element() {
  Nan::EscapableHandleScope scope;

  xmlNode *sibling = xml_obj->next;
  if (!sibling)
    return scope.Escape(Nan::Null());

  while (sibling && sibling->type != XML_ELEMENT_NODE)
    sibling = sibling->next;

  if (sibling) {
    return scope.Escape(XmlElement::New(sibling));
  }

  return scope.Escape(Nan::Null());
}

Local<Value> XmlElement::get_prev_element() {
  Nan::EscapableHandleScope scope;

  xmlNode *sibling = xml_obj->prev;
  if (!sibling)
    return scope.Escape(Nan::Null());

  while (sibling && sibling->type != XML_ELEMENT_NODE) {
    sibling = sibling->prev;
  }

  if (sibling) {
    return scope.Escape(XmlElement::New(sibling));
  }

  return scope.Escape(Nan::Null());
}

Local<Object> XmlElement::New(xmlNode *node) {
  Nan::EscapableHandleScope scope;
  if (node->_private) {
    return scope.Escape(static_cast<XmlNode *>(node->_private)->handle());
  }

  XmlElement *element = new XmlElement(node);
  Local<Object> obj =
      Nan::NewInstance(
          Nan::GetFunction(Nan::New(constructor_template)).ToLocalChecked())
          .ToLocalChecked();
  element->Wrap(obj);
  return scope.Escape(obj);
}

XmlElement::XmlElement(xmlNode *node) : XmlNode(node) {}

void XmlElement::replace_element(xmlNode *element) {
  xmlReplaceNode(xml_obj, element);
  if (element->_private != NULL) {
    XmlNode *node = static_cast<XmlNode *>(element->_private);
    node->ref_wrapped_ancestor();
  }
}

void XmlElement::replace_text(const char *content) {
  xmlNodePtr txt = xmlNewDocText(xml_obj->doc, (const xmlChar *)content);
  xmlReplaceNode(xml_obj, txt);
}

bool XmlElement::child_will_merge(xmlNode *child) {
  return ((child->type == XML_TEXT_NODE) && (xml_obj->last != NULL) &&
          (xml_obj->last->type == XML_TEXT_NODE) &&
          (xml_obj->last->name == child->name) && (xml_obj->last != child));
}

void XmlElement::Initialize(Local<Object> target) {
  Nan::HandleScope scope;
  Local<FunctionTemplate> tmpl = Nan::New<FunctionTemplate>(New);
  constructor_template.Reset(tmpl);
  tmpl->Inherit(Nan::New(XmlNode::constructor_template));
  tmpl->InstanceTemplate()->SetInternalFieldCount(1);

  Nan::SetPrototypeMethod(tmpl, "addChild", XmlElement::AddChild);

  Nan::SetPrototypeMethod(tmpl, "cdata", XmlElement::AddCData);

  Nan::SetPrototypeMethod(tmpl, "_attr", XmlElement::Attr);

  Nan::SetPrototypeMethod(tmpl, "attrs", XmlElement::Attrs);

  Nan::SetPrototypeMethod(tmpl, "child", XmlElement::Child);

  Nan::SetPrototypeMethod(tmpl, "childNodes", XmlElement::ChildNodes);

  Nan::SetPrototypeMethod(tmpl, "find", XmlElement::Find);

  Nan::SetPrototypeMethod(tmpl, "nextElement", XmlElement::NextElement);

  Nan::SetPrototypeMethod(tmpl, "prevElement", XmlElement::PrevElement);

  Nan::SetPrototypeMethod(tmpl, "name", XmlElement::Name);

  Nan::SetPrototypeMethod(tmpl, "path", XmlElement::Path);

  Nan::SetPrototypeMethod(tmpl, "text", XmlElement::Text);

  Nan::SetPrototypeMethod(tmpl, "addPrevSibling", XmlElement::AddPrevSibling);

  Nan::SetPrototypeMethod(tmpl, "addNextSibling", XmlElement::AddNextSibling);

  Nan::SetPrototypeMethod(tmpl, "replace", XmlElement::Replace);

  Nan::Set(target, Nan::New<String>("Element").ToLocalChecked(),
           Nan::GetFunction(tmpl).ToLocalChecked());
}

} // namespace libxmljs
