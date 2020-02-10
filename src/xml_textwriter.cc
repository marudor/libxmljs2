// Copyright 2011, Squish Tech, LLC.

#include "xml_textwriter.h"
#include "libxmljs.h"

using namespace v8;
namespace libxmljs {

#define THROW_ON_ERROR(text)                                                   \
  if (result == -1) {                                                          \
    Nan::ThrowError(text);                                                     \
    return;                                                                    \
  }

XmlTextWriter::XmlTextWriter() {
  textWriter = NULL;
  writerBuffer = NULL;
}

XmlTextWriter::~XmlTextWriter() {
  if (textWriter) {
    xmlFreeTextWriter(textWriter);
  }
  if (writerBuffer) {
    xmlBufferFree(writerBuffer);
  }
}

NAN_METHOD(XmlTextWriter::NewTextWriter) {
  Nan::HandleScope scope;
  XmlTextWriter *writer = new XmlTextWriter();
  writer->Wrap(info.Holder());
  writer->OpenMemory(info);

  return info.GetReturnValue().Set(info.Holder());
}

NAN_METHOD(XmlTextWriter::OpenMemory) {
  Nan::HandleScope scope;

  XmlTextWriter *writer = Nan::ObjectWrap::Unwrap<XmlTextWriter>(info.Holder());

  writer->writerBuffer = xmlBufferCreate();
  if (!writer->writerBuffer) {
    return Nan::ThrowError("Failed to create memory buffer");
  }

  writer->textWriter = xmlNewTextWriterMemory(writer->writerBuffer, 0);
  if (!writer->textWriter) {
    xmlBufferFree(writer->writerBuffer);
    return Nan::ThrowError("Failed to create buffer writer");
  }

  return info.GetReturnValue().Set(Nan::Undefined());
}

NAN_METHOD(XmlTextWriter::BufferContent) {
  Nan::HandleScope scope;

  XmlTextWriter *writer = Nan::ObjectWrap::Unwrap<XmlTextWriter>(info.Holder());

  // Flush the output buffer of the libxml writer instance in order to push all
  // the content to our writerBuffer.
  xmlTextWriterFlush(writer->textWriter);

  // Receive bytes from the writerBuffer
  const xmlChar *buf = xmlBufferContent(writer->writerBuffer);

  return info.GetReturnValue().Set(
      Nan::New<String>((const char *)buf, xmlBufferLength(writer->writerBuffer))
          .ToLocalChecked());
}

void XmlTextWriter::clearBuffer() {
  // Flush the output buffer of the libxml writer instance in order to push all
  // the content to our writerBuffer.
  xmlTextWriterFlush(textWriter);
  // Clear the memory buffer
  xmlBufferEmpty(writerBuffer);
}

NAN_METHOD(XmlTextWriter::BufferEmpty) {
  Nan::HandleScope scope;

  XmlTextWriter *writer = Nan::ObjectWrap::Unwrap<XmlTextWriter>(info.Holder());

  writer->clearBuffer();

  return info.GetReturnValue().Set(Nan::Undefined());
}

NAN_METHOD(XmlTextWriter::StartDocument) {
  Nan::HandleScope scope;

  XmlTextWriter *writer = Nan::ObjectWrap::Unwrap<XmlTextWriter>(info.Holder());

  Nan::Utf8String version(info[0]);
  Nan::Utf8String encoding(info[1]);
  const char *standalone = NULL;

  if (info[2]->IsBoolean()) {
    const char *wordBool =
        Nan::To<bool>(info[2]).FromMaybe(false) ? "yes" : "no";
    standalone = *Nan::Utf8String(Nan::New<String>(wordBool).ToLocalChecked());
  } else if (info[2]->IsString()) {
    standalone = *Nan::Utf8String(info[2]);
  }

  int result = xmlTextWriterStartDocument(
      writer->textWriter, info[0]->IsUndefined() ? NULL : *version,
      info[1]->IsUndefined() ? NULL : *encoding, standalone);

  THROW_ON_ERROR("Failed to start document");

  return info.GetReturnValue().Set(Nan::New<Number>((double)result));
}

NAN_METHOD(XmlTextWriter::EndDocument) {
  Nan::HandleScope scope;

  XmlTextWriter *writer = Nan::ObjectWrap::Unwrap<XmlTextWriter>(info.Holder());

  int result = xmlTextWriterEndDocument(writer->textWriter);

  THROW_ON_ERROR("Failed to end document");

  return info.GetReturnValue().Set(Nan::New<Number>((double)result));
}

NAN_METHOD(XmlTextWriter::StartElementNS) {
  Nan::HandleScope scope;

  XmlTextWriter *writer = Nan::ObjectWrap::Unwrap<XmlTextWriter>(info.Holder());

  Nan::Utf8String prefix(info[0]);
  Nan::Utf8String name(info[1]);
  Nan::Utf8String namespaceURI(info[2]);

  int result = xmlTextWriterStartElementNS(
      writer->textWriter,
      info[0]->IsUndefined() ? NULL : (const xmlChar *)*prefix,
      info[1]->IsUndefined() ? NULL : (const xmlChar *)*name,
      info[2]->IsUndefined() ? NULL : (const xmlChar *)*namespaceURI);

  THROW_ON_ERROR("Failed to start element");

  return info.GetReturnValue().Set(Nan::New<Number>((double)result));
}

NAN_METHOD(XmlTextWriter::EndElement) {
  Nan::HandleScope scope;

  XmlTextWriter *writer = Nan::ObjectWrap::Unwrap<XmlTextWriter>(info.Holder());

  int result = xmlTextWriterEndElement(writer->textWriter);

  THROW_ON_ERROR("Failed to end element");

  return info.GetReturnValue().Set(Nan::New<Number>((double)result));
}

NAN_METHOD(XmlTextWriter::StartAttributeNS) {
  Nan::HandleScope scope;

  XmlTextWriter *writer = Nan::ObjectWrap::Unwrap<XmlTextWriter>(info.Holder());

  Nan::Utf8String prefix(info[0]);
  Nan::Utf8String name(info[1]);
  Nan::Utf8String namespaceURI(info[2]);

  int result = xmlTextWriterStartAttributeNS(
      writer->textWriter,
      info[0]->IsUndefined() ? NULL : (const xmlChar *)*prefix,
      info[1]->IsUndefined() ? NULL : (const xmlChar *)*name,
      info[2]->IsUndefined() ? NULL : (const xmlChar *)*namespaceURI);

  THROW_ON_ERROR("Failed to start attribute");

  return info.GetReturnValue().Set(Nan::New<Number>((double)result));
}

NAN_METHOD(XmlTextWriter::EndAttribute) {
  Nan::HandleScope scope;

  XmlTextWriter *writer = Nan::ObjectWrap::Unwrap<XmlTextWriter>(info.Holder());

  int result = xmlTextWriterEndAttribute(writer->textWriter);

  THROW_ON_ERROR("Failed to end attribute");

  return info.GetReturnValue().Set(Nan::New<Number>((double)result));
}

NAN_METHOD(XmlTextWriter::StartCdata) {
  Nan::HandleScope scope;

  XmlTextWriter *writer = Nan::ObjectWrap::Unwrap<XmlTextWriter>(info.Holder());

  int result = xmlTextWriterStartCDATA(writer->textWriter);

  THROW_ON_ERROR("Failed to start CDATA section");

  return info.GetReturnValue().Set(Nan::New<Number>((double)result));
}

NAN_METHOD(XmlTextWriter::EndCdata) {
  Nan::HandleScope scope;

  XmlTextWriter *writer = Nan::ObjectWrap::Unwrap<XmlTextWriter>(info.Holder());

  int result = xmlTextWriterEndCDATA(writer->textWriter);

  THROW_ON_ERROR("Failed to end CDATA section");

  return info.GetReturnValue().Set(Nan::New<Number>((double)result));
}

NAN_METHOD(XmlTextWriter::StartComment) {
  Nan::HandleScope scope;

  XmlTextWriter *writer = Nan::ObjectWrap::Unwrap<XmlTextWriter>(info.Holder());

  int result = xmlTextWriterStartComment(writer->textWriter);

  THROW_ON_ERROR("Failed to start Comment section");

  return info.GetReturnValue().Set(Nan::New<Number>((double)result));
}

NAN_METHOD(XmlTextWriter::EndComment) {
  Nan::HandleScope scope;

  XmlTextWriter *writer = Nan::ObjectWrap::Unwrap<XmlTextWriter>(info.Holder());

  int result = xmlTextWriterEndComment(writer->textWriter);

  THROW_ON_ERROR("Failed to end Comment section");

  return info.GetReturnValue().Set(Nan::New<Number>((double)result));
}

NAN_METHOD(XmlTextWriter::WriteString) {
  Nan::HandleScope scope;

  XmlTextWriter *writer = Nan::ObjectWrap::Unwrap<XmlTextWriter>(info.Holder());

  Nan::Utf8String string(info[0]);

  int result =
      xmlTextWriterWriteString(writer->textWriter, (const xmlChar *)*string);

  THROW_ON_ERROR("Failed to write string");

  return info.GetReturnValue().Set(Nan::New<Number>((double)result));
}

NAN_METHOD(XmlTextWriter::OutputMemory) {
  bool clear = info.Length() == 0 || Nan::To<bool>(info[0]).FromMaybe(true);
  XmlTextWriter *writer = Nan::ObjectWrap::Unwrap<XmlTextWriter>(info.Holder());

  BufferContent(info);

  if (clear) {
    writer->clearBuffer();
  }
}

void XmlTextWriter::Initialize(Local<Object> target) {
  Nan::HandleScope scope;

  Local<FunctionTemplate> writer_t = Nan::New<FunctionTemplate>(NewTextWriter);

  Nan::Persistent<FunctionTemplate> xml_writer_template;
  xml_writer_template.Reset(writer_t);

  writer_t->InstanceTemplate()->SetInternalFieldCount(1);

  Nan::SetPrototypeMethod(writer_t, "toString", XmlTextWriter::BufferContent);

  Nan::SetPrototypeMethod(writer_t, "outputMemory",
                          XmlTextWriter::OutputMemory);

  Nan::SetPrototypeMethod(writer_t, "clear", XmlTextWriter::BufferEmpty);

  Nan::SetPrototypeMethod(writer_t, "startDocument",
                          XmlTextWriter::StartDocument);

  Nan::SetPrototypeMethod(writer_t, "endDocument", XmlTextWriter::EndDocument);

  Nan::SetPrototypeMethod(writer_t, "startElementNS",
                          XmlTextWriter::StartElementNS);

  Nan::SetPrototypeMethod(writer_t, "endElement", XmlTextWriter::EndElement);

  Nan::SetPrototypeMethod(writer_t, "startAttributeNS",
                          XmlTextWriter::StartAttributeNS);

  Nan::SetPrototypeMethod(writer_t, "endAttribute",
                          XmlTextWriter::EndAttribute);

  Nan::SetPrototypeMethod(writer_t, "startCdata", XmlTextWriter::StartCdata);

  Nan::SetPrototypeMethod(writer_t, "endCdata", XmlTextWriter::EndCdata);

  Nan::SetPrototypeMethod(writer_t, "startComment",
                          XmlTextWriter::StartComment);

  Nan::SetPrototypeMethod(writer_t, "endComment", XmlTextWriter::EndComment);

  Nan::SetPrototypeMethod(writer_t, "writeString", XmlTextWriter::WriteString);

  Nan::Set(target, Nan::New<String>("TextWriter").ToLocalChecked(),
           Nan::GetFunction(writer_t).ToLocalChecked());
}
} // namespace libxmljs
