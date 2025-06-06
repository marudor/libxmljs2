// Copyright 2009, Squish Tech, LLC.

#include <node.h>

#include <cstring>

#include "libxmljs.h"

#include "xml_attribute.h"
#include "xml_document.h"
#include "xml_text.h"
#include "xml_xpath_context.h"

using namespace v8;

namespace libxmljs {

Nan::Persistent<FunctionTemplate> XmlText::constructor_template;

Local<Value> XmlText::get_path() {
  Nan::EscapableHandleScope scope;
  xmlChar *path = xmlGetNodePath(xml_obj);
  const char *return_path = path ? reinterpret_cast<char *>(path) : "";
  int str_len = xmlStrlen((const xmlChar *)return_path);
  Local<String> js_obj =
      Nan::New<String>(return_path, str_len).ToLocalChecked();
  xmlFree(path);
  return scope.Escape(js_obj);
}

// doc, name, content
NAN_METHOD(XmlText::New) {
  NAN_CONSTRUCTOR_CHECK(Text)
  Nan::HandleScope scope;

  // if we were created for an existing xml node, then we don't need
  // to create a new node on the document
  if (info.Length() == 0) {
    return info.GetReturnValue().Set(info.This());
  }

  DOCUMENT_ARG_CHECK
  if (!info[1]->IsString()) {
    Nan::ThrowError("content argument must be of type string");
    return;
  }

  XmlDocument *document = Nan::ObjectWrap::Unwrap<XmlDocument>(doc);
  assert(document);

  Local<Value> contentOpt;
  if (info[1]->IsString()) {
    contentOpt = info[1];
  }
  Nan::Utf8String contentRaw(contentOpt);
  const char *content = (contentRaw.length()) ? *contentRaw : NULL;

  xmlNode *textNode =
      xmlNewDocText(document->xml_obj, (const xmlChar *)content);

  XmlText *element = new XmlText(textNode);
  textNode->_private = element;
  element->Wrap(info.This());

  // this prevents the document from going away
  Nan::Set(info.This(), Nan::New<String>("document").ToLocalChecked(),
           info[0])
      .Check();

  return info.GetReturnValue().Set(info.This());
}

NAN_METHOD(XmlText::NextElement) {
  Nan::HandleScope scope;
  XmlText *element = Nan::ObjectWrap::Unwrap<XmlText>(info.This());
  assert(element);

  return info.GetReturnValue().Set(element->get_next_element());
}

NAN_METHOD(XmlText::PrevElement) {
  Nan::HandleScope scope;
  XmlText *element = Nan::ObjectWrap::Unwrap<XmlText>(info.This());
  assert(element);

  return info.GetReturnValue().Set(element->get_prev_element());
}

NAN_METHOD(XmlText::Text) {
  Nan::HandleScope scope;
  XmlText *element = Nan::ObjectWrap::Unwrap<XmlText>(info.This());
  assert(element);

  if (info.Length() == 0) {
    return info.GetReturnValue().Set(element->get_content());
  } else {
    element->set_content(*Nan::Utf8String(info[0]));
  }

  return info.GetReturnValue().Set(info.This());
}

NAN_METHOD(XmlText::AddPrevSibling) {
  XmlText *text = Nan::ObjectWrap::Unwrap<XmlText>(info.This());
  assert(text);

  XmlNode *new_sibling = Nan::ObjectWrap::Unwrap<XmlNode>(
      Nan::To<Object>(info[0]).ToLocalChecked());
  assert(new_sibling);

  xmlNode *imported_sibling = text->import_node(new_sibling->xml_obj);
  if (imported_sibling == NULL) {
    return Nan::ThrowError(
        "Could not add sibling. Failed to copy node to new Document.");
  } else if ((new_sibling->xml_obj == imported_sibling) &&
             text->prev_sibling_will_merge(imported_sibling)) {
    imported_sibling = xmlCopyNode(imported_sibling, 0);
  }
  text->add_prev_sibling(imported_sibling);

  return info.GetReturnValue().Set(info[0]);
}

NAN_METHOD(XmlText::AddNextSibling) {
  XmlText *text = Nan::ObjectWrap::Unwrap<XmlText>(info.This());
  assert(text);

  XmlNode *new_sibling = Nan::ObjectWrap::Unwrap<XmlNode>(
      Nan::To<Object>(info[0]).ToLocalChecked());
  assert(new_sibling);

  xmlNode *imported_sibling = text->import_node(new_sibling->xml_obj);
  if (imported_sibling == NULL) {
    return Nan::ThrowError(
        "Could not add sibling. Failed to copy node to new Document.");
  } else if ((new_sibling->xml_obj == imported_sibling) &&
             text->next_sibling_will_merge(imported_sibling)) {
    imported_sibling = xmlCopyNode(imported_sibling, 0);
  }
  text->add_next_sibling(imported_sibling);

  return info.GetReturnValue().Set(info[0]);
}

NAN_METHOD(XmlText::Replace) {
  XmlText *element = Nan::ObjectWrap::Unwrap<XmlText>(info.This());
  assert(element);

  if (info[0]->IsString()) {
    element->replace_text(*Nan::Utf8String(info[0]));
  } else {
    XmlText *new_sibling = Nan::ObjectWrap::Unwrap<XmlText>(
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

NAN_METHOD(XmlText::Path) {
  Nan::HandleScope scope;
  XmlText *text = Nan::ObjectWrap::Unwrap<XmlText>(info.This());
  assert(text);

  return info.GetReturnValue().Set(text->get_path());
}

NAN_METHOD(XmlText::Name) {
  Nan::HandleScope scope;
  XmlText *text = Nan::ObjectWrap::Unwrap<XmlText>(info.This());
  assert(text);

  if (info.Length() == 0)
    return info.GetReturnValue().Set(text->get_name());
  return info.GetReturnValue().Set(info.This());
}

void XmlText::set_content(const char *content) {
  xmlChar *encoded =
      xmlEncodeSpecialChars(xml_obj->doc, (const xmlChar *)content);
  xmlNodeSetContent(xml_obj, encoded);
  xmlFree(encoded);
}

Local<Value> XmlText::get_content() {
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

Local<Value> XmlText::get_name() {
  Nan::EscapableHandleScope scope;
  if (xml_obj->name)
    return scope.Escape(
        Nan::New<String>((const char *)xml_obj->name).ToLocalChecked());
  else
    return scope.Escape(Nan::Undefined());
}

Local<Value> XmlText::get_next_element() {
  Nan::EscapableHandleScope scope;

  xmlNode *sibling = xml_obj->next;
  if (!sibling)
    return scope.Escape(Nan::Null());

  while (sibling && sibling->type != XML_ELEMENT_NODE)
    sibling = sibling->next;

  if (sibling) {
    return scope.Escape(XmlText::New(sibling));
  }

  return scope.Escape(Nan::Null());
}

Local<Value> XmlText::get_prev_element() {
  Nan::EscapableHandleScope scope;

  xmlNode *sibling = xml_obj->prev;
  if (!sibling)
    return scope.Escape(Nan::Null());

  while (sibling && sibling->type != XML_ELEMENT_NODE) {
    sibling = sibling->prev;
  }

  if (sibling) {
    return scope.Escape(XmlText::New(sibling));
  }

  return scope.Escape(Nan::Null());
}

Local<Object> XmlText::New(xmlNode *node) {
  Nan::EscapableHandleScope scope;
  if (node->_private) {
    return scope.Escape(static_cast<XmlNode *>(node->_private)->handle());
  }

  XmlText *text = new XmlText(node);
  Local<Object> obj =
      Nan::NewInstance(
          Nan::GetFunction(Nan::New(constructor_template)).ToLocalChecked())
          .ToLocalChecked();
  text->Wrap(obj);
  return scope.Escape(obj);
}

XmlText::XmlText(xmlNode *node) : XmlNode(node) {}

void XmlText::add_prev_sibling(xmlNode *element) {
  xmlAddPrevSibling(xml_obj, element);
}

void XmlText::add_next_sibling(xmlNode *element) {
  xmlAddNextSibling(xml_obj, element);
}

void XmlText::replace_element(xmlNode *element) {
  xmlReplaceNode(xml_obj, element);
}

void XmlText::replace_text(const char *content) {
  xmlNodePtr txt = xmlNewDocText(xml_obj->doc, (const xmlChar *)content);
  xmlReplaceNode(xml_obj, txt);
}

bool XmlText::next_sibling_will_merge(xmlNode *child) {
  return (child->type == XML_TEXT_NODE);
}

bool XmlText::prev_sibling_will_merge(xmlNode *child) {
  return (child->type == XML_TEXT_NODE);
}

void XmlText::Initialize(Local<Object> target) {
  Nan::HandleScope scope;
  Local<FunctionTemplate> tmpl = Nan::New<FunctionTemplate>(New);

  constructor_template.Reset(tmpl);

  tmpl->Inherit(Nan::New(XmlNode::constructor_template));
  tmpl->InstanceTemplate()->SetInternalFieldCount(1);

  Nan::SetPrototypeMethod(tmpl, "nextElement", XmlText::NextElement);

  Nan::SetPrototypeMethod(tmpl, "prevElement", XmlText::PrevElement);

  Nan::SetPrototypeMethod(tmpl, "text", XmlText::Text);

  Nan::SetPrototypeMethod(tmpl, "replace", XmlText::Replace);

  Nan::SetPrototypeMethod(tmpl, "path", XmlText::Path);

  Nan::SetPrototypeMethod(tmpl, "name", XmlText::Name);

  Nan::SetPrototypeMethod(tmpl, "addPrevSibling", XmlText::AddPrevSibling);

  Nan::SetPrototypeMethod(tmpl, "addNextSibling", XmlText::AddNextSibling);

  Nan::Set(target, Nan::New<String>("Text").ToLocalChecked(),
           Nan::GetFunction(tmpl).ToLocalChecked());
}

} // namespace libxmljs
