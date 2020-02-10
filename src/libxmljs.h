// Copyright 2009, Squish Tech, LLC.
#ifndef SRC_LIBXMLJS_H_
#define SRC_LIBXMLJS_H_

#include "nan.h"
#include <node.h>
#include <v8.h>

#define LIBXMLJS_ARGUMENT_TYPE_CHECK(arg, type, err)                           \
  if (!arg->type()) {                                                          \
    return Nan::ThrowTypeError(err);                                           \
  }

#define NAN_CONSTRUCTOR_CHECK(name)                                            \
  if (!info.IsConstructCall()) {                                               \
    Nan::ThrowTypeError("Class constructor " #name                             \
                        " cannot be invoked without 'new'");                   \
    return;                                                                    \
  }

#define DOCUMENT_ARG_CHECK                                                     \
  if (info.Length() == 0 || info[0]->IsNullOrUndefined()) {                    \
    Nan::ThrowError("document argument required");                             \
    return;                                                                    \
  }                                                                            \
  Local<Object> doc = Nan::To<Object>(info[0]).ToLocalChecked();               \
  if (!XmlDocument::constructor_template.Get(Isolate::GetCurrent())            \
           ->HasInstance(doc)) {                                               \
    Nan::ThrowError("document argument must be an instance of Document");      \
    return;                                                                    \
  }

namespace libxmljs {

#ifdef LIBXML_DEBUG_ENABLED
static const bool debugging = true;
#else
static const bool debugging = false;
#endif

// Ensure that libxml is properly initialised and destructed at shutdown
class LibXMLJS {
public:
  LibXMLJS();
  virtual ~LibXMLJS();

private:
  static LibXMLJS instance;
};

} // namespace libxmljs

#endif // SRC_LIBXMLJS_H_
