import { EventEmitter } from 'node:events';

export const version: string;
export const libxml_version: string;
export const libxml_parser_version: string;

interface StringMap {
  [key: string]: string;
}

interface ParserOptions {
  recover?: boolean;
  noent?: boolean;
  dtdload?: boolean;
  doctype?: boolean;
  dtdattr?: any;
  dtdvalid?: boolean;
  noerror?: boolean;
  errors?: boolean;
  nowarning?: boolean;
  warnings?: boolean;
  pedantic?: boolean;
  noblanks?: boolean;
  blanks?: boolean;
  sax1?: boolean;
  xinclude?: boolean;
  nonet?: boolean;
  net?: boolean;
  nodict?: boolean;
  dict?: boolean;
  nsclean?: boolean;
  implied?: boolean;
  nocdata?: boolean;
  cdata?: boolean;
  noxincnode?: boolean;
  compact?: boolean;
  old?: boolean;
  nobasefix?: boolean;
  basefix?: boolean;
  huge?: boolean;
  oldsax?: boolean;
  ignore_enc?: boolean;
  big_lines?: boolean;
  baseUrl?: string;
}

export function parseXml(source: string, options?: ParserOptions): Document;
export function parseXmlString(
  source: string,
  options?: ParserOptions
): Document;

export function parseHtml(source: string, options?: ParserOptions): Document;
export function parseHtmlString(
  source: string,
  options?: ParserOptions
): Document;
export function parseHtmlFragment(
  source: string,
  options?: ParserOptions
): Document;

export function memoryUsage(): number;
export function nodeCount(): number;

export class Document {
  /**
   * Create a new XML Document
   * @param version XML document version, defaults to 1.0
   * @param encoding Encoding, defaults to utf8
   */
  constructor(version?: string, encoding?: string);

  errors: SyntaxError[];
  validationErrors: ValidationError[];

  child(idx: number): Node | null;
  childNodes(): Node[];
  encoding(): string;
  encoding(enc: string): this;
  find<T extends Node = Node>(xpath: string, ns_uri?: string): T[];
  find<T extends Node = Node>(xpath: string, namespaces: StringMap): T[];
  get<T extends Node = Node>(xpath: string, ns_uri?: string): T | null;
  get<T extends Node = Node>(xpath: string, namespaces: StringMap): T | null;
  node(name: string, content?: string): Element;
  root(): Element | null;
  root(newRoot: Node): Node;
  toString(formatted?: boolean): string;
  type(): 'document';
  validate(xsdDoc: Document): boolean;
  schematronValidate(schemaDoc: Document): boolean;
  version(): string;
  setDtd(name: string, ext: string, sys: string): void;
  getDtd(): {
    name: string;
    externalId: string;
    systemId: string;
  };
}

export class Node {
  doc(): Document;
  parent(): Element | Document;
  /**
   * The namespace or null in case of comment nodes
   */
  namespace(): Namespace | null;

  /**
   * An array of namespaces that the object belongs to.
   *
   * @param local If it is true, only the namespace declarations local to this
   *              node are returned, rather than all of the namespaces in scope
   *              at this node (including the ones from the parent elements).
   */
  namespaces(local?: boolean): Namespace[];

  prevSibling(): Node | null;
  nextSibling(): Node | null;

  line(): number;
  type(): 'comment' | 'element' | 'text' | 'attribute' | 'pi';
  remove(): this;
  clone(): this;
  /**
   * Serializes the node to a string. The string will contain all contents of the node formatted as XML and can be used to print the node.
   */
  toString(
    format?:
      | boolean
      | {
          declaration: boolean;
          selfCloseEmpty: boolean;
          whitespace: boolean;
          type: 'xml' | 'html' | 'xhtml';
          encoding?:
            | 'HTML'
            | 'ASCII'
            | 'UTF-8'
            | 'UTF-16'
            | 'ISO-Latin-1'
            | 'ISO-8859-1';
        }
  ): string;
}

export class Element extends Node {
  constructor(doc: Document, name: string, content?: string);
  node(name: string, content?: string): Element;
  name(): string;
  name(newName: string): this;
  text(): string;
  text(newText: string): this;
  attr(name: string): Attribute | null; //getter
  attr(name: string, value: string): this; //setter
  attr(attrObject: StringMap): this; //setter using stringMap
  attrs(): Attribute[];
  cdata(data: string): this;

  doc(): Document;
  child(idx: number): Node | null;
  childNodes(): Node[];

  /**
   * @return The original element, not the child.
   */
  addChild(child: Node): this;

  prevElement(): Element | null;
  nextElement(): Element | null;
  addNextSibling<T extends Node>(siblingNode: T): T;
  addPrevSibling<T extends Node>(siblingNode: T): T;

  find<T extends Node = Node>(xpath: string, ns_uri?: string): T[];
  find<T extends Node = Node>(xpath: string, namespaces: StringMap): T[];
  get<T extends Node = Node>(xpath: string, ns_uri?: string): T | null;
  get<T extends Node = Node>(xpath: string, namespaces: StringMap): T | null;

  defineNamespace(prefixOrHref: string, hrefInCaseOfPrefix?: string): Namespace;

  namespace(): Namespace | null;
  namespace(newNamespace: Namespace): this;
  namespace(prefixOrHref: string, hrefInCaseOfPrefix?: string): this;

  replace(replacement: string): string;
  replace<T extends Node>(replacement: T): T;

  path(): string;
}

declare class Attribute extends Node {
  name(): string;
  node(): Element;
  value(): string;
  value(newValue: string): Attribute;
  namespace(): Namespace | null;
}

export class Text extends Node {
  constructor(doc: Document, content: string);

  addNextSibling<T extends Node>(siblingNode: T): T;
  addPrevSibling<T extends Node>(siblingNode: T): T;
  nextElement(): Element | null;
  prevElement(): Element | null;

  replace(replacement: string): string;
  replace<T extends Node>(replacement: T): T;

  text(): string;
  text(newContent: string): this;
}

export class Comment extends Node {
  constructor(doc: Document, content?: string);

  text(): string;
  text(newContent: string): this;
}

export class ProcessingInstruction extends Node {
  constructor(doc: Document, name: string, content?: string);

  name(): string;
  name(newName: string): this;

  text(): string;
  text(newContent: string): this;
}

export class Namespace {
  href(): string;
  prefix(): string;
}

export class SaxParser extends EventEmitter {
  constructor();
  parseString(source: string): boolean;
}

export class SaxPushParser extends EventEmitter {
  constructor();
  push(source: string): boolean;
}

export interface SyntaxError extends Error {
  domain: number | null;
  code: number | null;
  level: number | null;
  file: string | null;
  line: number | null;
  /**
   * 1-based column number, 0 if not applicable/available.
   */
  column: number;

  str1: number | null;
  str2: number | null;
  str3: number | null;
  int1: number | null;
}

export interface ValidationError extends Error {
  domain: number | null;
  code: number | null;
  level: number | null;

  line: number | null;
  /**
   * 1-based column number, 0 if not applicable/available.
   */
  column: number;
}
