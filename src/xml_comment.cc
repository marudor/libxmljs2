#include <node.h>

#include <cstring>

#include "libxmljs.h"

#include "xml_attribute.h"
#include "xml_comment.h"
#include "xml_document.h"
#include "xml_xpath_context.h"

using namespace v8;

namespace libxmljs {

Nan::Persistent<FunctionTemplate> XmlComment::constructor_template;

// doc, content
NAN_METHOD(XmlComment::New) {
  NAN_CONSTRUCTOR_CHECK(Comment)
  Nan::HandleScope scope;

  // if we were created for an existing xml node, then we don't need
  // to create a new node on the document
  if (info.Length() == 0) {
    return info.GetReturnValue().Set(info.This());
  }

  DOCUMENT_ARG_CHECK

  XmlDocument *document = Nan::ObjectWrap::Unwrap<XmlDocument>(doc);
  assert(document);

  Local<Value> contentOpt;
  if (info[1]->IsString()) {
    contentOpt = info[1];
  }
  Nan::Utf8String contentRaw(contentOpt);
  const char *content = (contentRaw.length()) ? *contentRaw : NULL;

  xmlNode *comm = xmlNewDocComment(document->xml_obj, (xmlChar *)content);

  XmlComment *comment = new XmlComment(comm);
  comm->_private = comment;
  comment->Wrap(info.This());

  // this prevents the document from going away
  Nan::Set(info.This(), Nan::New<String>("document").ToLocalChecked(),
           info[0])
      .Check();

  return info.GetReturnValue().Set(info.This());
}

NAN_METHOD(XmlComment::Text) {
  Nan::HandleScope scope;
  XmlComment *comment = Nan::ObjectWrap::Unwrap<XmlComment>(info.This());
  assert(comment);

  if (info.Length() == 0) {
    return info.GetReturnValue().Set(comment->get_content());
  } else {
    comment->set_content(*Nan::Utf8String(info[0]));
  }

  return info.GetReturnValue().Set(info.This());
}

void XmlComment::set_content(const char *content) {
  xmlNodeSetContent(xml_obj, (xmlChar *)content);
}

Local<Value> XmlComment::get_content() {
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

Local<Object> XmlComment::New(xmlNode *node) {
  Nan::EscapableHandleScope scope;
  if (node->_private) {
    return scope.Escape(static_cast<XmlNode *>(node->_private)->handle());
  }

  XmlComment *comment = new XmlComment(node);
  Local<Object> obj =
      Nan::NewInstance(
          Nan::GetFunction(Nan::New(constructor_template)).ToLocalChecked())
          .ToLocalChecked();
  comment->Wrap(obj);
  return scope.Escape(obj);
}

XmlComment::XmlComment(xmlNode *node) : XmlNode(node) {}

void XmlComment::Initialize(Local<Object> target) {
  Nan::HandleScope scope;
  Local<FunctionTemplate> t =
      Nan::New<FunctionTemplate>(static_cast<NAN_METHOD((*))>(New));
  t->Inherit(Nan::New(XmlNode::constructor_template));
  t->InstanceTemplate()->SetInternalFieldCount(1);
  constructor_template.Reset(t);

  Nan::SetPrototypeMethod(t, "text", XmlComment::Text);

  Nan::Set(target, Nan::New<String>("Comment").ToLocalChecked(),
           Nan::GetFunction(t).ToLocalChecked());
}

} // namespace libxmljs
