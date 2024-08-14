"use strict";
(() => {
  // node_modules/i18next/dist/esm/i18next.js
  var consoleLogger = {
    type: "logger",
    log(args) {
      this.output("log", args);
    },
    warn(args) {
      this.output("warn", args);
    },
    error(args) {
      this.output("error", args);
    },
    output(type, args) {
      if (console && console[type]) console[type].apply(console, args);
    }
  };
  var Logger = class _Logger {
    constructor(concreteLogger) {
      let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      this.init(concreteLogger, options);
    }
    init(concreteLogger) {
      let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      this.prefix = options.prefix || "i18next:";
      this.logger = concreteLogger || consoleLogger;
      this.options = options;
      this.debug = options.debug;
    }
    log() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      return this.forward(args, "log", "", true);
    }
    warn() {
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }
      return this.forward(args, "warn", "", true);
    }
    error() {
      for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }
      return this.forward(args, "error", "");
    }
    deprecate() {
      for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
      }
      return this.forward(args, "warn", "WARNING DEPRECATED: ", true);
    }
    forward(args, lvl, prefix, debugOnly) {
      if (debugOnly && !this.debug) return null;
      if (typeof args[0] === "string") args[0] = `${prefix}${this.prefix} ${args[0]}`;
      return this.logger[lvl](args);
    }
    create(moduleName) {
      return new _Logger(this.logger, {
        ...{
          prefix: `${this.prefix}:${moduleName}:`
        },
        ...this.options
      });
    }
    clone(options) {
      options = options || this.options;
      options.prefix = options.prefix || this.prefix;
      return new _Logger(this.logger, options);
    }
  };
  var baseLogger = new Logger();
  var EventEmitter = class {
    constructor() {
      this.observers = {};
    }
    on(events, listener) {
      events.split(" ").forEach((event) => {
        if (!this.observers[event]) this.observers[event] = /* @__PURE__ */ new Map();
        const numListeners = this.observers[event].get(listener) || 0;
        this.observers[event].set(listener, numListeners + 1);
      });
      return this;
    }
    off(event, listener) {
      if (!this.observers[event]) return;
      if (!listener) {
        delete this.observers[event];
        return;
      }
      this.observers[event].delete(listener);
    }
    emit(event) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }
      if (this.observers[event]) {
        const cloned = Array.from(this.observers[event].entries());
        cloned.forEach((_ref) => {
          let [observer, numTimesAdded] = _ref;
          for (let i = 0; i < numTimesAdded; i++) {
            observer(...args);
          }
        });
      }
      if (this.observers["*"]) {
        const cloned = Array.from(this.observers["*"].entries());
        cloned.forEach((_ref2) => {
          let [observer, numTimesAdded] = _ref2;
          for (let i = 0; i < numTimesAdded; i++) {
            observer.apply(observer, [event, ...args]);
          }
        });
      }
    }
  };
  var defer = () => {
    let res;
    let rej;
    const promise = new Promise((resolve, reject) => {
      res = resolve;
      rej = reject;
    });
    promise.resolve = res;
    promise.reject = rej;
    return promise;
  };
  var makeString = (object) => {
    if (object == null) return "";
    return "" + object;
  };
  var copy = (a, s, t2) => {
    a.forEach((m) => {
      if (s[m]) t2[m] = s[m];
    });
  };
  var lastOfPathSeparatorRegExp = /###/g;
  var cleanKey = (key) => key && key.indexOf("###") > -1 ? key.replace(lastOfPathSeparatorRegExp, ".") : key;
  var canNotTraverseDeeper = (object) => !object || typeof object === "string";
  var getLastOfPath = (object, path2, Empty) => {
    const stack = typeof path2 !== "string" ? path2 : path2.split(".");
    let stackIndex = 0;
    while (stackIndex < stack.length - 1) {
      if (canNotTraverseDeeper(object)) return {};
      const key = cleanKey(stack[stackIndex]);
      if (!object[key] && Empty) object[key] = new Empty();
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        object = object[key];
      } else {
        object = {};
      }
      ++stackIndex;
    }
    if (canNotTraverseDeeper(object)) return {};
    return {
      obj: object,
      k: cleanKey(stack[stackIndex])
    };
  };
  var setPath = (object, path2, newValue) => {
    const {
      obj,
      k
    } = getLastOfPath(object, path2, Object);
    if (obj !== void 0 || path2.length === 1) {
      obj[k] = newValue;
      return;
    }
    let e = path2[path2.length - 1];
    let p = path2.slice(0, path2.length - 1);
    let last = getLastOfPath(object, p, Object);
    while (last.obj === void 0 && p.length) {
      e = `${p[p.length - 1]}.${e}`;
      p = p.slice(0, p.length - 1);
      last = getLastOfPath(object, p, Object);
      if (last && last.obj && typeof last.obj[`${last.k}.${e}`] !== "undefined") {
        last.obj = void 0;
      }
    }
    last.obj[`${last.k}.${e}`] = newValue;
  };
  var pushPath = (object, path2, newValue, concat) => {
    const {
      obj,
      k
    } = getLastOfPath(object, path2, Object);
    obj[k] = obj[k] || [];
    obj[k].push(newValue);
  };
  var getPath = (object, path2) => {
    const {
      obj,
      k
    } = getLastOfPath(object, path2);
    if (!obj) return void 0;
    return obj[k];
  };
  var getPathWithDefaults = (data, defaultData, key) => {
    const value = getPath(data, key);
    if (value !== void 0) {
      return value;
    }
    return getPath(defaultData, key);
  };
  var deepExtend = (target, source, overwrite) => {
    for (const prop in source) {
      if (prop !== "__proto__" && prop !== "constructor") {
        if (prop in target) {
          if (typeof target[prop] === "string" || target[prop] instanceof String || typeof source[prop] === "string" || source[prop] instanceof String) {
            if (overwrite) target[prop] = source[prop];
          } else {
            deepExtend(target[prop], source[prop], overwrite);
          }
        } else {
          target[prop] = source[prop];
        }
      }
    }
    return target;
  };
  var regexEscape = (str) => str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  var _entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#x2F;"
  };
  var escape = (data) => {
    if (typeof data === "string") {
      return data.replace(/[&<>"'\/]/g, (s) => _entityMap[s]);
    }
    return data;
  };
  var RegExpCache = class {
    constructor(capacity) {
      this.capacity = capacity;
      this.regExpMap = /* @__PURE__ */ new Map();
      this.regExpQueue = [];
    }
    getRegExp(pattern) {
      const regExpFromCache = this.regExpMap.get(pattern);
      if (regExpFromCache !== void 0) {
        return regExpFromCache;
      }
      const regExpNew = new RegExp(pattern);
      if (this.regExpQueue.length === this.capacity) {
        this.regExpMap.delete(this.regExpQueue.shift());
      }
      this.regExpMap.set(pattern, regExpNew);
      this.regExpQueue.push(pattern);
      return regExpNew;
    }
  };
  var chars = [" ", ",", "?", "!", ";"];
  var looksLikeObjectPathRegExpCache = new RegExpCache(20);
  var looksLikeObjectPath = (key, nsSeparator, keySeparator) => {
    nsSeparator = nsSeparator || "";
    keySeparator = keySeparator || "";
    const possibleChars = chars.filter((c) => nsSeparator.indexOf(c) < 0 && keySeparator.indexOf(c) < 0);
    if (possibleChars.length === 0) return true;
    const r = looksLikeObjectPathRegExpCache.getRegExp(`(${possibleChars.map((c) => c === "?" ? "\\?" : c).join("|")})`);
    let matched = !r.test(key);
    if (!matched) {
      const ki = key.indexOf(keySeparator);
      if (ki > 0 && !r.test(key.substring(0, ki))) {
        matched = true;
      }
    }
    return matched;
  };
  var deepFind = function(obj, path2) {
    let keySeparator = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : ".";
    if (!obj) return void 0;
    if (obj[path2]) return obj[path2];
    const tokens = path2.split(keySeparator);
    let current = obj;
    for (let i = 0; i < tokens.length; ) {
      if (!current || typeof current !== "object") {
        return void 0;
      }
      let next;
      let nextPath = "";
      for (let j = i; j < tokens.length; ++j) {
        if (j !== i) {
          nextPath += keySeparator;
        }
        nextPath += tokens[j];
        next = current[nextPath];
        if (next !== void 0) {
          if (["string", "number", "boolean"].indexOf(typeof next) > -1 && j < tokens.length - 1) {
            continue;
          }
          i += j - i + 1;
          break;
        }
      }
      current = next;
    }
    return current;
  };
  var getCleanedCode = (code) => {
    if (code && code.indexOf("_") > 0) return code.replace("_", "-");
    return code;
  };
  var ResourceStore = class extends EventEmitter {
    constructor(data) {
      let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
        ns: ["translation"],
        defaultNS: "translation"
      };
      super();
      this.data = data || {};
      this.options = options;
      if (this.options.keySeparator === void 0) {
        this.options.keySeparator = ".";
      }
      if (this.options.ignoreJSONStructure === void 0) {
        this.options.ignoreJSONStructure = true;
      }
    }
    addNamespaces(ns) {
      if (this.options.ns.indexOf(ns) < 0) {
        this.options.ns.push(ns);
      }
    }
    removeNamespaces(ns) {
      const index = this.options.ns.indexOf(ns);
      if (index > -1) {
        this.options.ns.splice(index, 1);
      }
    }
    getResource(lng, ns, key) {
      let options = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {};
      const keySeparator = options.keySeparator !== void 0 ? options.keySeparator : this.options.keySeparator;
      const ignoreJSONStructure = options.ignoreJSONStructure !== void 0 ? options.ignoreJSONStructure : this.options.ignoreJSONStructure;
      let path2;
      if (lng.indexOf(".") > -1) {
        path2 = lng.split(".");
      } else {
        path2 = [lng, ns];
        if (key) {
          if (Array.isArray(key)) {
            path2.push(...key);
          } else if (typeof key === "string" && keySeparator) {
            path2.push(...key.split(keySeparator));
          } else {
            path2.push(key);
          }
        }
      }
      const result = getPath(this.data, path2);
      if (!result && !ns && !key && lng.indexOf(".") > -1) {
        lng = path2[0];
        ns = path2[1];
        key = path2.slice(2).join(".");
      }
      if (result || !ignoreJSONStructure || typeof key !== "string") return result;
      return deepFind(this.data && this.data[lng] && this.data[lng][ns], key, keySeparator);
    }
    addResource(lng, ns, key, value) {
      let options = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : {
        silent: false
      };
      const keySeparator = options.keySeparator !== void 0 ? options.keySeparator : this.options.keySeparator;
      let path2 = [lng, ns];
      if (key) path2 = path2.concat(keySeparator ? key.split(keySeparator) : key);
      if (lng.indexOf(".") > -1) {
        path2 = lng.split(".");
        value = ns;
        ns = path2[1];
      }
      this.addNamespaces(ns);
      setPath(this.data, path2, value);
      if (!options.silent) this.emit("added", lng, ns, key, value);
    }
    addResources(lng, ns, resources) {
      let options = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {
        silent: false
      };
      for (const m in resources) {
        if (typeof resources[m] === "string" || Array.isArray(resources[m])) this.addResource(lng, ns, m, resources[m], {
          silent: true
        });
      }
      if (!options.silent) this.emit("added", lng, ns, resources);
    }
    addResourceBundle(lng, ns, resources, deep, overwrite) {
      let options = arguments.length > 5 && arguments[5] !== void 0 ? arguments[5] : {
        silent: false,
        skipCopy: false
      };
      let path2 = [lng, ns];
      if (lng.indexOf(".") > -1) {
        path2 = lng.split(".");
        deep = resources;
        resources = ns;
        ns = path2[1];
      }
      this.addNamespaces(ns);
      let pack = getPath(this.data, path2) || {};
      if (!options.skipCopy) resources = JSON.parse(JSON.stringify(resources));
      if (deep) {
        deepExtend(pack, resources, overwrite);
      } else {
        pack = {
          ...pack,
          ...resources
        };
      }
      setPath(this.data, path2, pack);
      if (!options.silent) this.emit("added", lng, ns, resources);
    }
    removeResourceBundle(lng, ns) {
      if (this.hasResourceBundle(lng, ns)) {
        delete this.data[lng][ns];
      }
      this.removeNamespaces(ns);
      this.emit("removed", lng, ns);
    }
    hasResourceBundle(lng, ns) {
      return this.getResource(lng, ns) !== void 0;
    }
    getResourceBundle(lng, ns) {
      if (!ns) ns = this.options.defaultNS;
      if (this.options.compatibilityAPI === "v1") return {
        ...{},
        ...this.getResource(lng, ns)
      };
      return this.getResource(lng, ns);
    }
    getDataByLanguage(lng) {
      return this.data[lng];
    }
    hasLanguageSomeTranslations(lng) {
      const data = this.getDataByLanguage(lng);
      const n = data && Object.keys(data) || [];
      return !!n.find((v) => data[v] && Object.keys(data[v]).length > 0);
    }
    toJSON() {
      return this.data;
    }
  };
  var postProcessor = {
    processors: {},
    addPostProcessor(module) {
      this.processors[module.name] = module;
    },
    handle(processors, value, key, options, translator) {
      processors.forEach((processor) => {
        if (this.processors[processor]) value = this.processors[processor].process(value, key, options, translator);
      });
      return value;
    }
  };
  var checkedLoadedFor = {};
  var Translator = class _Translator extends EventEmitter {
    constructor(services) {
      let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      super();
      copy(["resourceStore", "languageUtils", "pluralResolver", "interpolator", "backendConnector", "i18nFormat", "utils"], services, this);
      this.options = options;
      if (this.options.keySeparator === void 0) {
        this.options.keySeparator = ".";
      }
      this.logger = baseLogger.create("translator");
    }
    changeLanguage(lng) {
      if (lng) this.language = lng;
    }
    exists(key) {
      let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
        interpolation: {}
      };
      if (key === void 0 || key === null) {
        return false;
      }
      const resolved = this.resolve(key, options);
      return resolved && resolved.res !== void 0;
    }
    extractFromKey(key, options) {
      let nsSeparator = options.nsSeparator !== void 0 ? options.nsSeparator : this.options.nsSeparator;
      if (nsSeparator === void 0) nsSeparator = ":";
      const keySeparator = options.keySeparator !== void 0 ? options.keySeparator : this.options.keySeparator;
      let namespaces = options.ns || this.options.defaultNS || [];
      const wouldCheckForNsInKey = nsSeparator && key.indexOf(nsSeparator) > -1;
      const seemsNaturalLanguage = !this.options.userDefinedKeySeparator && !options.keySeparator && !this.options.userDefinedNsSeparator && !options.nsSeparator && !looksLikeObjectPath(key, nsSeparator, keySeparator);
      if (wouldCheckForNsInKey && !seemsNaturalLanguage) {
        const m = key.match(this.interpolator.nestingRegexp);
        if (m && m.length > 0) {
          return {
            key,
            namespaces
          };
        }
        const parts = key.split(nsSeparator);
        if (nsSeparator !== keySeparator || nsSeparator === keySeparator && this.options.ns.indexOf(parts[0]) > -1) namespaces = parts.shift();
        key = parts.join(keySeparator);
      }
      if (typeof namespaces === "string") namespaces = [namespaces];
      return {
        key,
        namespaces
      };
    }
    translate(keys, options, lastKey) {
      if (typeof options !== "object" && this.options.overloadTranslationOptionHandler) {
        options = this.options.overloadTranslationOptionHandler(arguments);
      }
      if (typeof options === "object") options = {
        ...options
      };
      if (!options) options = {};
      if (keys === void 0 || keys === null) return "";
      if (!Array.isArray(keys)) keys = [String(keys)];
      const returnDetails = options.returnDetails !== void 0 ? options.returnDetails : this.options.returnDetails;
      const keySeparator = options.keySeparator !== void 0 ? options.keySeparator : this.options.keySeparator;
      const {
        key,
        namespaces
      } = this.extractFromKey(keys[keys.length - 1], options);
      const namespace = namespaces[namespaces.length - 1];
      const lng = options.lng || this.language;
      const appendNamespaceToCIMode = options.appendNamespaceToCIMode || this.options.appendNamespaceToCIMode;
      if (lng && lng.toLowerCase() === "cimode") {
        if (appendNamespaceToCIMode) {
          const nsSeparator = options.nsSeparator || this.options.nsSeparator;
          if (returnDetails) {
            return {
              res: `${namespace}${nsSeparator}${key}`,
              usedKey: key,
              exactUsedKey: key,
              usedLng: lng,
              usedNS: namespace,
              usedParams: this.getUsedParamsDetails(options)
            };
          }
          return `${namespace}${nsSeparator}${key}`;
        }
        if (returnDetails) {
          return {
            res: key,
            usedKey: key,
            exactUsedKey: key,
            usedLng: lng,
            usedNS: namespace,
            usedParams: this.getUsedParamsDetails(options)
          };
        }
        return key;
      }
      const resolved = this.resolve(keys, options);
      let res = resolved && resolved.res;
      const resUsedKey = resolved && resolved.usedKey || key;
      const resExactUsedKey = resolved && resolved.exactUsedKey || key;
      const resType = Object.prototype.toString.apply(res);
      const noObject = ["[object Number]", "[object Function]", "[object RegExp]"];
      const joinArrays = options.joinArrays !== void 0 ? options.joinArrays : this.options.joinArrays;
      const handleAsObjectInI18nFormat = !this.i18nFormat || this.i18nFormat.handleAsObject;
      const handleAsObject = typeof res !== "string" && typeof res !== "boolean" && typeof res !== "number";
      if (handleAsObjectInI18nFormat && res && handleAsObject && noObject.indexOf(resType) < 0 && !(typeof joinArrays === "string" && Array.isArray(res))) {
        if (!options.returnObjects && !this.options.returnObjects) {
          if (!this.options.returnedObjectHandler) {
            this.logger.warn("accessing an object - but returnObjects options is not enabled!");
          }
          const r = this.options.returnedObjectHandler ? this.options.returnedObjectHandler(resUsedKey, res, {
            ...options,
            ns: namespaces
          }) : `key '${key} (${this.language})' returned an object instead of string.`;
          if (returnDetails) {
            resolved.res = r;
            resolved.usedParams = this.getUsedParamsDetails(options);
            return resolved;
          }
          return r;
        }
        if (keySeparator) {
          const resTypeIsArray = Array.isArray(res);
          const copy2 = resTypeIsArray ? [] : {};
          const newKeyToUse = resTypeIsArray ? resExactUsedKey : resUsedKey;
          for (const m in res) {
            if (Object.prototype.hasOwnProperty.call(res, m)) {
              const deepKey = `${newKeyToUse}${keySeparator}${m}`;
              copy2[m] = this.translate(deepKey, {
                ...options,
                ...{
                  joinArrays: false,
                  ns: namespaces
                }
              });
              if (copy2[m] === deepKey) copy2[m] = res[m];
            }
          }
          res = copy2;
        }
      } else if (handleAsObjectInI18nFormat && typeof joinArrays === "string" && Array.isArray(res)) {
        res = res.join(joinArrays);
        if (res) res = this.extendTranslation(res, keys, options, lastKey);
      } else {
        let usedDefault = false;
        let usedKey = false;
        const needsPluralHandling = options.count !== void 0 && typeof options.count !== "string";
        const hasDefaultValue = _Translator.hasDefaultValue(options);
        const defaultValueSuffix = needsPluralHandling ? this.pluralResolver.getSuffix(lng, options.count, options) : "";
        const defaultValueSuffixOrdinalFallback = options.ordinal && needsPluralHandling ? this.pluralResolver.getSuffix(lng, options.count, {
          ordinal: false
        }) : "";
        const needsZeroSuffixLookup = needsPluralHandling && !options.ordinal && options.count === 0 && this.pluralResolver.shouldUseIntlApi();
        const defaultValue = needsZeroSuffixLookup && options[`defaultValue${this.options.pluralSeparator}zero`] || options[`defaultValue${defaultValueSuffix}`] || options[`defaultValue${defaultValueSuffixOrdinalFallback}`] || options.defaultValue;
        if (!this.isValidLookup(res) && hasDefaultValue) {
          usedDefault = true;
          res = defaultValue;
        }
        if (!this.isValidLookup(res)) {
          usedKey = true;
          res = key;
        }
        const missingKeyNoValueFallbackToKey = options.missingKeyNoValueFallbackToKey || this.options.missingKeyNoValueFallbackToKey;
        const resForMissing = missingKeyNoValueFallbackToKey && usedKey ? void 0 : res;
        const updateMissing = hasDefaultValue && defaultValue !== res && this.options.updateMissing;
        if (usedKey || usedDefault || updateMissing) {
          this.logger.log(updateMissing ? "updateKey" : "missingKey", lng, namespace, key, updateMissing ? defaultValue : res);
          if (keySeparator) {
            const fk = this.resolve(key, {
              ...options,
              keySeparator: false
            });
            if (fk && fk.res) this.logger.warn("Seems the loaded translations were in flat JSON format instead of nested. Either set keySeparator: false on init or make sure your translations are published in nested format.");
          }
          let lngs = [];
          const fallbackLngs = this.languageUtils.getFallbackCodes(this.options.fallbackLng, options.lng || this.language);
          if (this.options.saveMissingTo === "fallback" && fallbackLngs && fallbackLngs[0]) {
            for (let i = 0; i < fallbackLngs.length; i++) {
              lngs.push(fallbackLngs[i]);
            }
          } else if (this.options.saveMissingTo === "all") {
            lngs = this.languageUtils.toResolveHierarchy(options.lng || this.language);
          } else {
            lngs.push(options.lng || this.language);
          }
          const send = (l, k, specificDefaultValue) => {
            const defaultForMissing = hasDefaultValue && specificDefaultValue !== res ? specificDefaultValue : resForMissing;
            if (this.options.missingKeyHandler) {
              this.options.missingKeyHandler(l, namespace, k, defaultForMissing, updateMissing, options);
            } else if (this.backendConnector && this.backendConnector.saveMissing) {
              this.backendConnector.saveMissing(l, namespace, k, defaultForMissing, updateMissing, options);
            }
            this.emit("missingKey", l, namespace, k, res);
          };
          if (this.options.saveMissing) {
            if (this.options.saveMissingPlurals && needsPluralHandling) {
              lngs.forEach((language) => {
                const suffixes = this.pluralResolver.getSuffixes(language, options);
                if (needsZeroSuffixLookup && options[`defaultValue${this.options.pluralSeparator}zero`] && suffixes.indexOf(`${this.options.pluralSeparator}zero`) < 0) {
                  suffixes.push(`${this.options.pluralSeparator}zero`);
                }
                suffixes.forEach((suffix) => {
                  send([language], key + suffix, options[`defaultValue${suffix}`] || defaultValue);
                });
              });
            } else {
              send(lngs, key, defaultValue);
            }
          }
        }
        res = this.extendTranslation(res, keys, options, resolved, lastKey);
        if (usedKey && res === key && this.options.appendNamespaceToMissingKey) res = `${namespace}:${key}`;
        if ((usedKey || usedDefault) && this.options.parseMissingKeyHandler) {
          if (this.options.compatibilityAPI !== "v1") {
            res = this.options.parseMissingKeyHandler(this.options.appendNamespaceToMissingKey ? `${namespace}:${key}` : key, usedDefault ? res : void 0);
          } else {
            res = this.options.parseMissingKeyHandler(res);
          }
        }
      }
      if (returnDetails) {
        resolved.res = res;
        resolved.usedParams = this.getUsedParamsDetails(options);
        return resolved;
      }
      return res;
    }
    extendTranslation(res, key, options, resolved, lastKey) {
      var _this = this;
      if (this.i18nFormat && this.i18nFormat.parse) {
        res = this.i18nFormat.parse(res, {
          ...this.options.interpolation.defaultVariables,
          ...options
        }, options.lng || this.language || resolved.usedLng, resolved.usedNS, resolved.usedKey, {
          resolved
        });
      } else if (!options.skipInterpolation) {
        if (options.interpolation) this.interpolator.init({
          ...options,
          ...{
            interpolation: {
              ...this.options.interpolation,
              ...options.interpolation
            }
          }
        });
        const skipOnVariables = typeof res === "string" && (options && options.interpolation && options.interpolation.skipOnVariables !== void 0 ? options.interpolation.skipOnVariables : this.options.interpolation.skipOnVariables);
        let nestBef;
        if (skipOnVariables) {
          const nb = res.match(this.interpolator.nestingRegexp);
          nestBef = nb && nb.length;
        }
        let data = options.replace && typeof options.replace !== "string" ? options.replace : options;
        if (this.options.interpolation.defaultVariables) data = {
          ...this.options.interpolation.defaultVariables,
          ...data
        };
        res = this.interpolator.interpolate(res, data, options.lng || this.language || resolved.usedLng, options);
        if (skipOnVariables) {
          const na = res.match(this.interpolator.nestingRegexp);
          const nestAft = na && na.length;
          if (nestBef < nestAft) options.nest = false;
        }
        if (!options.lng && this.options.compatibilityAPI !== "v1" && resolved && resolved.res) options.lng = this.language || resolved.usedLng;
        if (options.nest !== false) res = this.interpolator.nest(res, function() {
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          if (lastKey && lastKey[0] === args[0] && !options.context) {
            _this.logger.warn(`It seems you are nesting recursively key: ${args[0]} in key: ${key[0]}`);
            return null;
          }
          return _this.translate(...args, key);
        }, options);
        if (options.interpolation) this.interpolator.reset();
      }
      const postProcess = options.postProcess || this.options.postProcess;
      const postProcessorNames = typeof postProcess === "string" ? [postProcess] : postProcess;
      if (res !== void 0 && res !== null && postProcessorNames && postProcessorNames.length && options.applyPostProcessor !== false) {
        res = postProcessor.handle(postProcessorNames, res, key, this.options && this.options.postProcessPassResolved ? {
          i18nResolved: {
            ...resolved,
            usedParams: this.getUsedParamsDetails(options)
          },
          ...options
        } : options, this);
      }
      return res;
    }
    resolve(keys) {
      let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      let found;
      let usedKey;
      let exactUsedKey;
      let usedLng;
      let usedNS;
      if (typeof keys === "string") keys = [keys];
      keys.forEach((k) => {
        if (this.isValidLookup(found)) return;
        const extracted = this.extractFromKey(k, options);
        const key = extracted.key;
        usedKey = key;
        let namespaces = extracted.namespaces;
        if (this.options.fallbackNS) namespaces = namespaces.concat(this.options.fallbackNS);
        const needsPluralHandling = options.count !== void 0 && typeof options.count !== "string";
        const needsZeroSuffixLookup = needsPluralHandling && !options.ordinal && options.count === 0 && this.pluralResolver.shouldUseIntlApi();
        const needsContextHandling = options.context !== void 0 && (typeof options.context === "string" || typeof options.context === "number") && options.context !== "";
        const codes = options.lngs ? options.lngs : this.languageUtils.toResolveHierarchy(options.lng || this.language, options.fallbackLng);
        namespaces.forEach((ns) => {
          if (this.isValidLookup(found)) return;
          usedNS = ns;
          if (!checkedLoadedFor[`${codes[0]}-${ns}`] && this.utils && this.utils.hasLoadedNamespace && !this.utils.hasLoadedNamespace(usedNS)) {
            checkedLoadedFor[`${codes[0]}-${ns}`] = true;
            this.logger.warn(`key "${usedKey}" for languages "${codes.join(", ")}" won't get resolved as namespace "${usedNS}" was not yet loaded`, "This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!");
          }
          codes.forEach((code) => {
            if (this.isValidLookup(found)) return;
            usedLng = code;
            const finalKeys = [key];
            if (this.i18nFormat && this.i18nFormat.addLookupKeys) {
              this.i18nFormat.addLookupKeys(finalKeys, key, code, ns, options);
            } else {
              let pluralSuffix;
              if (needsPluralHandling) pluralSuffix = this.pluralResolver.getSuffix(code, options.count, options);
              const zeroSuffix = `${this.options.pluralSeparator}zero`;
              const ordinalPrefix = `${this.options.pluralSeparator}ordinal${this.options.pluralSeparator}`;
              if (needsPluralHandling) {
                finalKeys.push(key + pluralSuffix);
                if (options.ordinal && pluralSuffix.indexOf(ordinalPrefix) === 0) {
                  finalKeys.push(key + pluralSuffix.replace(ordinalPrefix, this.options.pluralSeparator));
                }
                if (needsZeroSuffixLookup) {
                  finalKeys.push(key + zeroSuffix);
                }
              }
              if (needsContextHandling) {
                const contextKey = `${key}${this.options.contextSeparator}${options.context}`;
                finalKeys.push(contextKey);
                if (needsPluralHandling) {
                  finalKeys.push(contextKey + pluralSuffix);
                  if (options.ordinal && pluralSuffix.indexOf(ordinalPrefix) === 0) {
                    finalKeys.push(contextKey + pluralSuffix.replace(ordinalPrefix, this.options.pluralSeparator));
                  }
                  if (needsZeroSuffixLookup) {
                    finalKeys.push(contextKey + zeroSuffix);
                  }
                }
              }
            }
            let possibleKey;
            while (possibleKey = finalKeys.pop()) {
              if (!this.isValidLookup(found)) {
                exactUsedKey = possibleKey;
                found = this.getResource(code, ns, possibleKey, options);
              }
            }
          });
        });
      });
      return {
        res: found,
        usedKey,
        exactUsedKey,
        usedLng,
        usedNS
      };
    }
    isValidLookup(res) {
      return res !== void 0 && !(!this.options.returnNull && res === null) && !(!this.options.returnEmptyString && res === "");
    }
    getResource(code, ns, key) {
      let options = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {};
      if (this.i18nFormat && this.i18nFormat.getResource) return this.i18nFormat.getResource(code, ns, key, options);
      return this.resourceStore.getResource(code, ns, key, options);
    }
    getUsedParamsDetails() {
      let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      const optionsKeys = ["defaultValue", "ordinal", "context", "replace", "lng", "lngs", "fallbackLng", "ns", "keySeparator", "nsSeparator", "returnObjects", "returnDetails", "joinArrays", "postProcess", "interpolation"];
      const useOptionsReplaceForData = options.replace && typeof options.replace !== "string";
      let data = useOptionsReplaceForData ? options.replace : options;
      if (useOptionsReplaceForData && typeof options.count !== "undefined") {
        data.count = options.count;
      }
      if (this.options.interpolation.defaultVariables) {
        data = {
          ...this.options.interpolation.defaultVariables,
          ...data
        };
      }
      if (!useOptionsReplaceForData) {
        data = {
          ...data
        };
        for (const key of optionsKeys) {
          delete data[key];
        }
      }
      return data;
    }
    static hasDefaultValue(options) {
      const prefix = "defaultValue";
      for (const option in options) {
        if (Object.prototype.hasOwnProperty.call(options, option) && prefix === option.substring(0, prefix.length) && void 0 !== options[option]) {
          return true;
        }
      }
      return false;
    }
  };
  var capitalize = (string) => string.charAt(0).toUpperCase() + string.slice(1);
  var LanguageUtil = class {
    constructor(options) {
      this.options = options;
      this.supportedLngs = this.options.supportedLngs || false;
      this.logger = baseLogger.create("languageUtils");
    }
    getScriptPartFromCode(code) {
      code = getCleanedCode(code);
      if (!code || code.indexOf("-") < 0) return null;
      const p = code.split("-");
      if (p.length === 2) return null;
      p.pop();
      if (p[p.length - 1].toLowerCase() === "x") return null;
      return this.formatLanguageCode(p.join("-"));
    }
    getLanguagePartFromCode(code) {
      code = getCleanedCode(code);
      if (!code || code.indexOf("-") < 0) return code;
      const p = code.split("-");
      return this.formatLanguageCode(p[0]);
    }
    formatLanguageCode(code) {
      if (typeof code === "string" && code.indexOf("-") > -1) {
        const specialCases = ["hans", "hant", "latn", "cyrl", "cans", "mong", "arab"];
        let p = code.split("-");
        if (this.options.lowerCaseLng) {
          p = p.map((part) => part.toLowerCase());
        } else if (p.length === 2) {
          p[0] = p[0].toLowerCase();
          p[1] = p[1].toUpperCase();
          if (specialCases.indexOf(p[1].toLowerCase()) > -1) p[1] = capitalize(p[1].toLowerCase());
        } else if (p.length === 3) {
          p[0] = p[0].toLowerCase();
          if (p[1].length === 2) p[1] = p[1].toUpperCase();
          if (p[0] !== "sgn" && p[2].length === 2) p[2] = p[2].toUpperCase();
          if (specialCases.indexOf(p[1].toLowerCase()) > -1) p[1] = capitalize(p[1].toLowerCase());
          if (specialCases.indexOf(p[2].toLowerCase()) > -1) p[2] = capitalize(p[2].toLowerCase());
        }
        return p.join("-");
      }
      return this.options.cleanCode || this.options.lowerCaseLng ? code.toLowerCase() : code;
    }
    isSupportedCode(code) {
      if (this.options.load === "languageOnly" || this.options.nonExplicitSupportedLngs) {
        code = this.getLanguagePartFromCode(code);
      }
      return !this.supportedLngs || !this.supportedLngs.length || this.supportedLngs.indexOf(code) > -1;
    }
    getBestMatchFromCodes(codes) {
      if (!codes) return null;
      let found;
      codes.forEach((code) => {
        if (found) return;
        const cleanedLng = this.formatLanguageCode(code);
        if (!this.options.supportedLngs || this.isSupportedCode(cleanedLng)) found = cleanedLng;
      });
      if (!found && this.options.supportedLngs) {
        codes.forEach((code) => {
          if (found) return;
          const lngOnly = this.getLanguagePartFromCode(code);
          if (this.isSupportedCode(lngOnly)) return found = lngOnly;
          found = this.options.supportedLngs.find((supportedLng) => {
            if (supportedLng === lngOnly) return supportedLng;
            if (supportedLng.indexOf("-") < 0 && lngOnly.indexOf("-") < 0) return;
            if (supportedLng.indexOf("-") > 0 && lngOnly.indexOf("-") < 0 && supportedLng.substring(0, supportedLng.indexOf("-")) === lngOnly) return supportedLng;
            if (supportedLng.indexOf(lngOnly) === 0 && lngOnly.length > 1) return supportedLng;
          });
        });
      }
      if (!found) found = this.getFallbackCodes(this.options.fallbackLng)[0];
      return found;
    }
    getFallbackCodes(fallbacks, code) {
      if (!fallbacks) return [];
      if (typeof fallbacks === "function") fallbacks = fallbacks(code);
      if (typeof fallbacks === "string") fallbacks = [fallbacks];
      if (Array.isArray(fallbacks)) return fallbacks;
      if (!code) return fallbacks.default || [];
      let found = fallbacks[code];
      if (!found) found = fallbacks[this.getScriptPartFromCode(code)];
      if (!found) found = fallbacks[this.formatLanguageCode(code)];
      if (!found) found = fallbacks[this.getLanguagePartFromCode(code)];
      if (!found) found = fallbacks.default;
      return found || [];
    }
    toResolveHierarchy(code, fallbackCode) {
      const fallbackCodes = this.getFallbackCodes(fallbackCode || this.options.fallbackLng || [], code);
      const codes = [];
      const addCode = (c) => {
        if (!c) return;
        if (this.isSupportedCode(c)) {
          codes.push(c);
        } else {
          this.logger.warn(`rejecting language code not found in supportedLngs: ${c}`);
        }
      };
      if (typeof code === "string" && (code.indexOf("-") > -1 || code.indexOf("_") > -1)) {
        if (this.options.load !== "languageOnly") addCode(this.formatLanguageCode(code));
        if (this.options.load !== "languageOnly" && this.options.load !== "currentOnly") addCode(this.getScriptPartFromCode(code));
        if (this.options.load !== "currentOnly") addCode(this.getLanguagePartFromCode(code));
      } else if (typeof code === "string") {
        addCode(this.formatLanguageCode(code));
      }
      fallbackCodes.forEach((fc) => {
        if (codes.indexOf(fc) < 0) addCode(this.formatLanguageCode(fc));
      });
      return codes;
    }
  };
  var sets = [{
    lngs: ["ach", "ak", "am", "arn", "br", "fil", "gun", "ln", "mfe", "mg", "mi", "oc", "pt", "pt-BR", "tg", "tl", "ti", "tr", "uz", "wa"],
    nr: [1, 2],
    fc: 1
  }, {
    lngs: ["af", "an", "ast", "az", "bg", "bn", "ca", "da", "de", "dev", "el", "en", "eo", "es", "et", "eu", "fi", "fo", "fur", "fy", "gl", "gu", "ha", "hi", "hu", "hy", "ia", "it", "kk", "kn", "ku", "lb", "mai", "ml", "mn", "mr", "nah", "nap", "nb", "ne", "nl", "nn", "no", "nso", "pa", "pap", "pms", "ps", "pt-PT", "rm", "sco", "se", "si", "so", "son", "sq", "sv", "sw", "ta", "te", "tk", "ur", "yo"],
    nr: [1, 2],
    fc: 2
  }, {
    lngs: ["ay", "bo", "cgg", "fa", "ht", "id", "ja", "jbo", "ka", "km", "ko", "ky", "lo", "ms", "sah", "su", "th", "tt", "ug", "vi", "wo", "zh"],
    nr: [1],
    fc: 3
  }, {
    lngs: ["be", "bs", "cnr", "dz", "hr", "ru", "sr", "uk"],
    nr: [1, 2, 5],
    fc: 4
  }, {
    lngs: ["ar"],
    nr: [0, 1, 2, 3, 11, 100],
    fc: 5
  }, {
    lngs: ["cs", "sk"],
    nr: [1, 2, 5],
    fc: 6
  }, {
    lngs: ["csb", "pl"],
    nr: [1, 2, 5],
    fc: 7
  }, {
    lngs: ["cy"],
    nr: [1, 2, 3, 8],
    fc: 8
  }, {
    lngs: ["fr"],
    nr: [1, 2],
    fc: 9
  }, {
    lngs: ["ga"],
    nr: [1, 2, 3, 7, 11],
    fc: 10
  }, {
    lngs: ["gd"],
    nr: [1, 2, 3, 20],
    fc: 11
  }, {
    lngs: ["is"],
    nr: [1, 2],
    fc: 12
  }, {
    lngs: ["jv"],
    nr: [0, 1],
    fc: 13
  }, {
    lngs: ["kw"],
    nr: [1, 2, 3, 4],
    fc: 14
  }, {
    lngs: ["lt"],
    nr: [1, 2, 10],
    fc: 15
  }, {
    lngs: ["lv"],
    nr: [1, 2, 0],
    fc: 16
  }, {
    lngs: ["mk"],
    nr: [1, 2],
    fc: 17
  }, {
    lngs: ["mnk"],
    nr: [0, 1, 2],
    fc: 18
  }, {
    lngs: ["mt"],
    nr: [1, 2, 11, 20],
    fc: 19
  }, {
    lngs: ["or"],
    nr: [2, 1],
    fc: 2
  }, {
    lngs: ["ro"],
    nr: [1, 2, 20],
    fc: 20
  }, {
    lngs: ["sl"],
    nr: [5, 1, 2, 3],
    fc: 21
  }, {
    lngs: ["he", "iw"],
    nr: [1, 2, 20, 21],
    fc: 22
  }];
  var _rulesPluralsTypes = {
    1: (n) => Number(n > 1),
    2: (n) => Number(n != 1),
    3: (n) => 0,
    4: (n) => Number(n % 10 == 1 && n % 100 != 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2),
    5: (n) => Number(n == 0 ? 0 : n == 1 ? 1 : n == 2 ? 2 : n % 100 >= 3 && n % 100 <= 10 ? 3 : n % 100 >= 11 ? 4 : 5),
    6: (n) => Number(n == 1 ? 0 : n >= 2 && n <= 4 ? 1 : 2),
    7: (n) => Number(n == 1 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2),
    8: (n) => Number(n == 1 ? 0 : n == 2 ? 1 : n != 8 && n != 11 ? 2 : 3),
    9: (n) => Number(n >= 2),
    10: (n) => Number(n == 1 ? 0 : n == 2 ? 1 : n < 7 ? 2 : n < 11 ? 3 : 4),
    11: (n) => Number(n == 1 || n == 11 ? 0 : n == 2 || n == 12 ? 1 : n > 2 && n < 20 ? 2 : 3),
    12: (n) => Number(n % 10 != 1 || n % 100 == 11),
    13: (n) => Number(n !== 0),
    14: (n) => Number(n == 1 ? 0 : n == 2 ? 1 : n == 3 ? 2 : 3),
    15: (n) => Number(n % 10 == 1 && n % 100 != 11 ? 0 : n % 10 >= 2 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2),
    16: (n) => Number(n % 10 == 1 && n % 100 != 11 ? 0 : n !== 0 ? 1 : 2),
    17: (n) => Number(n == 1 || n % 10 == 1 && n % 100 != 11 ? 0 : 1),
    18: (n) => Number(n == 0 ? 0 : n == 1 ? 1 : 2),
    19: (n) => Number(n == 1 ? 0 : n == 0 || n % 100 > 1 && n % 100 < 11 ? 1 : n % 100 > 10 && n % 100 < 20 ? 2 : 3),
    20: (n) => Number(n == 1 ? 0 : n == 0 || n % 100 > 0 && n % 100 < 20 ? 1 : 2),
    21: (n) => Number(n % 100 == 1 ? 1 : n % 100 == 2 ? 2 : n % 100 == 3 || n % 100 == 4 ? 3 : 0),
    22: (n) => Number(n == 1 ? 0 : n == 2 ? 1 : (n < 0 || n > 10) && n % 10 == 0 ? 2 : 3)
  };
  var nonIntlVersions = ["v1", "v2", "v3"];
  var intlVersions = ["v4"];
  var suffixesOrder = {
    zero: 0,
    one: 1,
    two: 2,
    few: 3,
    many: 4,
    other: 5
  };
  var createRules = () => {
    const rules = {};
    sets.forEach((set) => {
      set.lngs.forEach((l) => {
        rules[l] = {
          numbers: set.nr,
          plurals: _rulesPluralsTypes[set.fc]
        };
      });
    });
    return rules;
  };
  var PluralResolver = class {
    constructor(languageUtils) {
      let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      this.languageUtils = languageUtils;
      this.options = options;
      this.logger = baseLogger.create("pluralResolver");
      if ((!this.options.compatibilityJSON || intlVersions.includes(this.options.compatibilityJSON)) && (typeof Intl === "undefined" || !Intl.PluralRules)) {
        this.options.compatibilityJSON = "v3";
        this.logger.error("Your environment seems not to be Intl API compatible, use an Intl.PluralRules polyfill. Will fallback to the compatibilityJSON v3 format handling.");
      }
      this.rules = createRules();
    }
    addRule(lng, obj) {
      this.rules[lng] = obj;
    }
    getRule(code) {
      let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      if (this.shouldUseIntlApi()) {
        try {
          return new Intl.PluralRules(getCleanedCode(code === "dev" ? "en" : code), {
            type: options.ordinal ? "ordinal" : "cardinal"
          });
        } catch (err) {
          return;
        }
      }
      return this.rules[code] || this.rules[this.languageUtils.getLanguagePartFromCode(code)];
    }
    needsPlural(code) {
      let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      const rule = this.getRule(code, options);
      if (this.shouldUseIntlApi()) {
        return rule && rule.resolvedOptions().pluralCategories.length > 1;
      }
      return rule && rule.numbers.length > 1;
    }
    getPluralFormsOfKey(code, key) {
      let options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
      return this.getSuffixes(code, options).map((suffix) => `${key}${suffix}`);
    }
    getSuffixes(code) {
      let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      const rule = this.getRule(code, options);
      if (!rule) {
        return [];
      }
      if (this.shouldUseIntlApi()) {
        return rule.resolvedOptions().pluralCategories.sort((pluralCategory1, pluralCategory2) => suffixesOrder[pluralCategory1] - suffixesOrder[pluralCategory2]).map((pluralCategory) => `${this.options.prepend}${options.ordinal ? `ordinal${this.options.prepend}` : ""}${pluralCategory}`);
      }
      return rule.numbers.map((number) => this.getSuffix(code, number, options));
    }
    getSuffix(code, count) {
      let options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
      const rule = this.getRule(code, options);
      if (rule) {
        if (this.shouldUseIntlApi()) {
          return `${this.options.prepend}${options.ordinal ? `ordinal${this.options.prepend}` : ""}${rule.select(count)}`;
        }
        return this.getSuffixRetroCompatible(rule, count);
      }
      this.logger.warn(`no plural rule found for: ${code}`);
      return "";
    }
    getSuffixRetroCompatible(rule, count) {
      const idx = rule.noAbs ? rule.plurals(count) : rule.plurals(Math.abs(count));
      let suffix = rule.numbers[idx];
      if (this.options.simplifyPluralSuffix && rule.numbers.length === 2 && rule.numbers[0] === 1) {
        if (suffix === 2) {
          suffix = "plural";
        } else if (suffix === 1) {
          suffix = "";
        }
      }
      const returnSuffix = () => this.options.prepend && suffix.toString() ? this.options.prepend + suffix.toString() : suffix.toString();
      if (this.options.compatibilityJSON === "v1") {
        if (suffix === 1) return "";
        if (typeof suffix === "number") return `_plural_${suffix.toString()}`;
        return returnSuffix();
      } else if (this.options.compatibilityJSON === "v2") {
        return returnSuffix();
      } else if (this.options.simplifyPluralSuffix && rule.numbers.length === 2 && rule.numbers[0] === 1) {
        return returnSuffix();
      }
      return this.options.prepend && idx.toString() ? this.options.prepend + idx.toString() : idx.toString();
    }
    shouldUseIntlApi() {
      return !nonIntlVersions.includes(this.options.compatibilityJSON);
    }
  };
  var deepFindWithDefaults = function(data, defaultData, key) {
    let keySeparator = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : ".";
    let ignoreJSONStructure = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : true;
    let path2 = getPathWithDefaults(data, defaultData, key);
    if (!path2 && ignoreJSONStructure && typeof key === "string") {
      path2 = deepFind(data, key, keySeparator);
      if (path2 === void 0) path2 = deepFind(defaultData, key, keySeparator);
    }
    return path2;
  };
  var regexSafe = (val) => val.replace(/\$/g, "$$$$");
  var Interpolator = class {
    constructor() {
      let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      this.logger = baseLogger.create("interpolator");
      this.options = options;
      this.format = options.interpolation && options.interpolation.format || ((value) => value);
      this.init(options);
    }
    init() {
      let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      if (!options.interpolation) options.interpolation = {
        escapeValue: true
      };
      const {
        escape: escape$1,
        escapeValue,
        useRawValueToEscape,
        prefix,
        prefixEscaped,
        suffix,
        suffixEscaped,
        formatSeparator,
        unescapeSuffix,
        unescapePrefix,
        nestingPrefix,
        nestingPrefixEscaped,
        nestingSuffix,
        nestingSuffixEscaped,
        nestingOptionsSeparator,
        maxReplaces,
        alwaysFormat
      } = options.interpolation;
      this.escape = escape$1 !== void 0 ? escape$1 : escape;
      this.escapeValue = escapeValue !== void 0 ? escapeValue : true;
      this.useRawValueToEscape = useRawValueToEscape !== void 0 ? useRawValueToEscape : false;
      this.prefix = prefix ? regexEscape(prefix) : prefixEscaped || "{{";
      this.suffix = suffix ? regexEscape(suffix) : suffixEscaped || "}}";
      this.formatSeparator = formatSeparator || ",";
      this.unescapePrefix = unescapeSuffix ? "" : unescapePrefix || "-";
      this.unescapeSuffix = this.unescapePrefix ? "" : unescapeSuffix || "";
      this.nestingPrefix = nestingPrefix ? regexEscape(nestingPrefix) : nestingPrefixEscaped || regexEscape("$t(");
      this.nestingSuffix = nestingSuffix ? regexEscape(nestingSuffix) : nestingSuffixEscaped || regexEscape(")");
      this.nestingOptionsSeparator = nestingOptionsSeparator || ",";
      this.maxReplaces = maxReplaces || 1e3;
      this.alwaysFormat = alwaysFormat !== void 0 ? alwaysFormat : false;
      this.resetRegExp();
    }
    reset() {
      if (this.options) this.init(this.options);
    }
    resetRegExp() {
      const getOrResetRegExp = (existingRegExp, pattern) => {
        if (existingRegExp && existingRegExp.source === pattern) {
          existingRegExp.lastIndex = 0;
          return existingRegExp;
        }
        return new RegExp(pattern, "g");
      };
      this.regexp = getOrResetRegExp(this.regexp, `${this.prefix}(.+?)${this.suffix}`);
      this.regexpUnescape = getOrResetRegExp(this.regexpUnescape, `${this.prefix}${this.unescapePrefix}(.+?)${this.unescapeSuffix}${this.suffix}`);
      this.nestingRegexp = getOrResetRegExp(this.nestingRegexp, `${this.nestingPrefix}(.+?)${this.nestingSuffix}`);
    }
    interpolate(str, data, lng, options) {
      let match;
      let value;
      let replaces;
      const defaultData = this.options && this.options.interpolation && this.options.interpolation.defaultVariables || {};
      const handleFormat = (key) => {
        if (key.indexOf(this.formatSeparator) < 0) {
          const path2 = deepFindWithDefaults(data, defaultData, key, this.options.keySeparator, this.options.ignoreJSONStructure);
          return this.alwaysFormat ? this.format(path2, void 0, lng, {
            ...options,
            ...data,
            interpolationkey: key
          }) : path2;
        }
        const p = key.split(this.formatSeparator);
        const k = p.shift().trim();
        const f = p.join(this.formatSeparator).trim();
        return this.format(deepFindWithDefaults(data, defaultData, k, this.options.keySeparator, this.options.ignoreJSONStructure), f, lng, {
          ...options,
          ...data,
          interpolationkey: k
        });
      };
      this.resetRegExp();
      const missingInterpolationHandler = options && options.missingInterpolationHandler || this.options.missingInterpolationHandler;
      const skipOnVariables = options && options.interpolation && options.interpolation.skipOnVariables !== void 0 ? options.interpolation.skipOnVariables : this.options.interpolation.skipOnVariables;
      const todos = [{
        regex: this.regexpUnescape,
        safeValue: (val) => regexSafe(val)
      }, {
        regex: this.regexp,
        safeValue: (val) => this.escapeValue ? regexSafe(this.escape(val)) : regexSafe(val)
      }];
      todos.forEach((todo) => {
        replaces = 0;
        while (match = todo.regex.exec(str)) {
          const matchedVar = match[1].trim();
          value = handleFormat(matchedVar);
          if (value === void 0) {
            if (typeof missingInterpolationHandler === "function") {
              const temp = missingInterpolationHandler(str, match, options);
              value = typeof temp === "string" ? temp : "";
            } else if (options && Object.prototype.hasOwnProperty.call(options, matchedVar)) {
              value = "";
            } else if (skipOnVariables) {
              value = match[0];
              continue;
            } else {
              this.logger.warn(`missed to pass in variable ${matchedVar} for interpolating ${str}`);
              value = "";
            }
          } else if (typeof value !== "string" && !this.useRawValueToEscape) {
            value = makeString(value);
          }
          const safeValue = todo.safeValue(value);
          str = str.replace(match[0], safeValue);
          if (skipOnVariables) {
            todo.regex.lastIndex += value.length;
            todo.regex.lastIndex -= match[0].length;
          } else {
            todo.regex.lastIndex = 0;
          }
          replaces++;
          if (replaces >= this.maxReplaces) {
            break;
          }
        }
      });
      return str;
    }
    nest(str, fc) {
      let options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
      let match;
      let value;
      let clonedOptions;
      const handleHasOptions = (key, inheritedOptions) => {
        const sep = this.nestingOptionsSeparator;
        if (key.indexOf(sep) < 0) return key;
        const c = key.split(new RegExp(`${sep}[ ]*{`));
        let optionsString = `{${c[1]}`;
        key = c[0];
        optionsString = this.interpolate(optionsString, clonedOptions);
        const matchedSingleQuotes = optionsString.match(/'/g);
        const matchedDoubleQuotes = optionsString.match(/"/g);
        if (matchedSingleQuotes && matchedSingleQuotes.length % 2 === 0 && !matchedDoubleQuotes || matchedDoubleQuotes.length % 2 !== 0) {
          optionsString = optionsString.replace(/'/g, '"');
        }
        try {
          clonedOptions = JSON.parse(optionsString);
          if (inheritedOptions) clonedOptions = {
            ...inheritedOptions,
            ...clonedOptions
          };
        } catch (e) {
          this.logger.warn(`failed parsing options string in nesting for key ${key}`, e);
          return `${key}${sep}${optionsString}`;
        }
        if (clonedOptions.defaultValue && clonedOptions.defaultValue.indexOf(this.prefix) > -1) delete clonedOptions.defaultValue;
        return key;
      };
      while (match = this.nestingRegexp.exec(str)) {
        let formatters = [];
        clonedOptions = {
          ...options
        };
        clonedOptions = clonedOptions.replace && typeof clonedOptions.replace !== "string" ? clonedOptions.replace : clonedOptions;
        clonedOptions.applyPostProcessor = false;
        delete clonedOptions.defaultValue;
        let doReduce = false;
        if (match[0].indexOf(this.formatSeparator) !== -1 && !/{.*}/.test(match[1])) {
          const r = match[1].split(this.formatSeparator).map((elem) => elem.trim());
          match[1] = r.shift();
          formatters = r;
          doReduce = true;
        }
        value = fc(handleHasOptions.call(this, match[1].trim(), clonedOptions), clonedOptions);
        if (value && match[0] === str && typeof value !== "string") return value;
        if (typeof value !== "string") value = makeString(value);
        if (!value) {
          this.logger.warn(`missed to resolve ${match[1]} for nesting ${str}`);
          value = "";
        }
        if (doReduce) {
          value = formatters.reduce((v, f) => this.format(v, f, options.lng, {
            ...options,
            interpolationkey: match[1].trim()
          }), value.trim());
        }
        str = str.replace(match[0], value);
        this.regexp.lastIndex = 0;
      }
      return str;
    }
  };
  var parseFormatStr = (formatStr) => {
    let formatName = formatStr.toLowerCase().trim();
    const formatOptions = {};
    if (formatStr.indexOf("(") > -1) {
      const p = formatStr.split("(");
      formatName = p[0].toLowerCase().trim();
      const optStr = p[1].substring(0, p[1].length - 1);
      if (formatName === "currency" && optStr.indexOf(":") < 0) {
        if (!formatOptions.currency) formatOptions.currency = optStr.trim();
      } else if (formatName === "relativetime" && optStr.indexOf(":") < 0) {
        if (!formatOptions.range) formatOptions.range = optStr.trim();
      } else {
        const opts = optStr.split(";");
        opts.forEach((opt) => {
          if (opt) {
            const [key, ...rest] = opt.split(":");
            const val = rest.join(":").trim().replace(/^'+|'+$/g, "");
            const trimmedKey = key.trim();
            if (!formatOptions[trimmedKey]) formatOptions[trimmedKey] = val;
            if (val === "false") formatOptions[trimmedKey] = false;
            if (val === "true") formatOptions[trimmedKey] = true;
            if (!isNaN(val)) formatOptions[trimmedKey] = parseInt(val, 10);
          }
        });
      }
    }
    return {
      formatName,
      formatOptions
    };
  };
  var createCachedFormatter = (fn) => {
    const cache = {};
    return (val, lng, options) => {
      const key = lng + JSON.stringify(options);
      let formatter = cache[key];
      if (!formatter) {
        formatter = fn(getCleanedCode(lng), options);
        cache[key] = formatter;
      }
      return formatter(val);
    };
  };
  var Formatter = class {
    constructor() {
      let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      this.logger = baseLogger.create("formatter");
      this.options = options;
      this.formats = {
        number: createCachedFormatter((lng, opt) => {
          const formatter = new Intl.NumberFormat(lng, {
            ...opt
          });
          return (val) => formatter.format(val);
        }),
        currency: createCachedFormatter((lng, opt) => {
          const formatter = new Intl.NumberFormat(lng, {
            ...opt,
            style: "currency"
          });
          return (val) => formatter.format(val);
        }),
        datetime: createCachedFormatter((lng, opt) => {
          const formatter = new Intl.DateTimeFormat(lng, {
            ...opt
          });
          return (val) => formatter.format(val);
        }),
        relativetime: createCachedFormatter((lng, opt) => {
          const formatter = new Intl.RelativeTimeFormat(lng, {
            ...opt
          });
          return (val) => formatter.format(val, opt.range || "day");
        }),
        list: createCachedFormatter((lng, opt) => {
          const formatter = new Intl.ListFormat(lng, {
            ...opt
          });
          return (val) => formatter.format(val);
        })
      };
      this.init(options);
    }
    init(services) {
      let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
        interpolation: {}
      };
      const iOpts = options.interpolation;
      this.formatSeparator = iOpts.formatSeparator ? iOpts.formatSeparator : iOpts.formatSeparator || ",";
    }
    add(name, fc) {
      this.formats[name.toLowerCase().trim()] = fc;
    }
    addCached(name, fc) {
      this.formats[name.toLowerCase().trim()] = createCachedFormatter(fc);
    }
    format(value, format, lng) {
      let options = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {};
      const formats = format.split(this.formatSeparator);
      if (formats.length > 1 && formats[0].indexOf("(") > 1 && formats[0].indexOf(")") < 0 && formats.find((f) => f.indexOf(")") > -1)) {
        const lastIndex = formats.findIndex((f) => f.indexOf(")") > -1);
        formats[0] = [formats[0], ...formats.splice(1, lastIndex)].join(this.formatSeparator);
      }
      const result = formats.reduce((mem, f) => {
        const {
          formatName,
          formatOptions
        } = parseFormatStr(f);
        if (this.formats[formatName]) {
          let formatted = mem;
          try {
            const valOptions = options && options.formatParams && options.formatParams[options.interpolationkey] || {};
            const l = valOptions.locale || valOptions.lng || options.locale || options.lng || lng;
            formatted = this.formats[formatName](mem, l, {
              ...formatOptions,
              ...options,
              ...valOptions
            });
          } catch (error) {
            this.logger.warn(error);
          }
          return formatted;
        } else {
          this.logger.warn(`there was no format function for ${formatName}`);
        }
        return mem;
      }, value);
      return result;
    }
  };
  var removePending = (q, name) => {
    if (q.pending[name] !== void 0) {
      delete q.pending[name];
      q.pendingCount--;
    }
  };
  var Connector = class extends EventEmitter {
    constructor(backend, store, services) {
      let options = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {};
      super();
      this.backend = backend;
      this.store = store;
      this.services = services;
      this.languageUtils = services.languageUtils;
      this.options = options;
      this.logger = baseLogger.create("backendConnector");
      this.waitingReads = [];
      this.maxParallelReads = options.maxParallelReads || 10;
      this.readingCalls = 0;
      this.maxRetries = options.maxRetries >= 0 ? options.maxRetries : 5;
      this.retryTimeout = options.retryTimeout >= 1 ? options.retryTimeout : 350;
      this.state = {};
      this.queue = [];
      if (this.backend && this.backend.init) {
        this.backend.init(services, options.backend, options);
      }
    }
    queueLoad(languages, namespaces, options, callback) {
      const toLoad = {};
      const pending = {};
      const toLoadLanguages = {};
      const toLoadNamespaces = {};
      languages.forEach((lng) => {
        let hasAllNamespaces = true;
        namespaces.forEach((ns) => {
          const name = `${lng}|${ns}`;
          if (!options.reload && this.store.hasResourceBundle(lng, ns)) {
            this.state[name] = 2;
          } else if (this.state[name] < 0) ;
          else if (this.state[name] === 1) {
            if (pending[name] === void 0) pending[name] = true;
          } else {
            this.state[name] = 1;
            hasAllNamespaces = false;
            if (pending[name] === void 0) pending[name] = true;
            if (toLoad[name] === void 0) toLoad[name] = true;
            if (toLoadNamespaces[ns] === void 0) toLoadNamespaces[ns] = true;
          }
        });
        if (!hasAllNamespaces) toLoadLanguages[lng] = true;
      });
      if (Object.keys(toLoad).length || Object.keys(pending).length) {
        this.queue.push({
          pending,
          pendingCount: Object.keys(pending).length,
          loaded: {},
          errors: [],
          callback
        });
      }
      return {
        toLoad: Object.keys(toLoad),
        pending: Object.keys(pending),
        toLoadLanguages: Object.keys(toLoadLanguages),
        toLoadNamespaces: Object.keys(toLoadNamespaces)
      };
    }
    loaded(name, err, data) {
      const s = name.split("|");
      const lng = s[0];
      const ns = s[1];
      if (err) this.emit("failedLoading", lng, ns, err);
      if (data) {
        this.store.addResourceBundle(lng, ns, data, void 0, void 0, {
          skipCopy: true
        });
      }
      this.state[name] = err ? -1 : 2;
      const loaded = {};
      this.queue.forEach((q) => {
        pushPath(q.loaded, [lng], ns);
        removePending(q, name);
        if (err) q.errors.push(err);
        if (q.pendingCount === 0 && !q.done) {
          Object.keys(q.loaded).forEach((l) => {
            if (!loaded[l]) loaded[l] = {};
            const loadedKeys = q.loaded[l];
            if (loadedKeys.length) {
              loadedKeys.forEach((n) => {
                if (loaded[l][n] === void 0) loaded[l][n] = true;
              });
            }
          });
          q.done = true;
          if (q.errors.length) {
            q.callback(q.errors);
          } else {
            q.callback();
          }
        }
      });
      this.emit("loaded", loaded);
      this.queue = this.queue.filter((q) => !q.done);
    }
    read(lng, ns, fcName) {
      let tried = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 0;
      let wait = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : this.retryTimeout;
      let callback = arguments.length > 5 ? arguments[5] : void 0;
      if (!lng.length) return callback(null, {});
      if (this.readingCalls >= this.maxParallelReads) {
        this.waitingReads.push({
          lng,
          ns,
          fcName,
          tried,
          wait,
          callback
        });
        return;
      }
      this.readingCalls++;
      const resolver = (err, data) => {
        this.readingCalls--;
        if (this.waitingReads.length > 0) {
          const next = this.waitingReads.shift();
          this.read(next.lng, next.ns, next.fcName, next.tried, next.wait, next.callback);
        }
        if (err && data && tried < this.maxRetries) {
          setTimeout(() => {
            this.read.call(this, lng, ns, fcName, tried + 1, wait * 2, callback);
          }, wait);
          return;
        }
        callback(err, data);
      };
      const fc = this.backend[fcName].bind(this.backend);
      if (fc.length === 2) {
        try {
          const r = fc(lng, ns);
          if (r && typeof r.then === "function") {
            r.then((data) => resolver(null, data)).catch(resolver);
          } else {
            resolver(null, r);
          }
        } catch (err) {
          resolver(err);
        }
        return;
      }
      return fc(lng, ns, resolver);
    }
    prepareLoading(languages, namespaces) {
      let options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
      let callback = arguments.length > 3 ? arguments[3] : void 0;
      if (!this.backend) {
        this.logger.warn("No backend was added via i18next.use. Will not load resources.");
        return callback && callback();
      }
      if (typeof languages === "string") languages = this.languageUtils.toResolveHierarchy(languages);
      if (typeof namespaces === "string") namespaces = [namespaces];
      const toLoad = this.queueLoad(languages, namespaces, options, callback);
      if (!toLoad.toLoad.length) {
        if (!toLoad.pending.length) callback();
        return null;
      }
      toLoad.toLoad.forEach((name) => {
        this.loadOne(name);
      });
    }
    load(languages, namespaces, callback) {
      this.prepareLoading(languages, namespaces, {}, callback);
    }
    reload(languages, namespaces, callback) {
      this.prepareLoading(languages, namespaces, {
        reload: true
      }, callback);
    }
    loadOne(name) {
      let prefix = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "";
      const s = name.split("|");
      const lng = s[0];
      const ns = s[1];
      this.read(lng, ns, "read", void 0, void 0, (err, data) => {
        if (err) this.logger.warn(`${prefix}loading namespace ${ns} for language ${lng} failed`, err);
        if (!err && data) this.logger.log(`${prefix}loaded namespace ${ns} for language ${lng}`, data);
        this.loaded(name, err, data);
      });
    }
    saveMissing(languages, namespace, key, fallbackValue, isUpdate) {
      let options = arguments.length > 5 && arguments[5] !== void 0 ? arguments[5] : {};
      let clb = arguments.length > 6 && arguments[6] !== void 0 ? arguments[6] : () => {
      };
      if (this.services.utils && this.services.utils.hasLoadedNamespace && !this.services.utils.hasLoadedNamespace(namespace)) {
        this.logger.warn(`did not save key "${key}" as the namespace "${namespace}" was not yet loaded`, "This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!");
        return;
      }
      if (key === void 0 || key === null || key === "") return;
      if (this.backend && this.backend.create) {
        const opts = {
          ...options,
          isUpdate
        };
        const fc = this.backend.create.bind(this.backend);
        if (fc.length < 6) {
          try {
            let r;
            if (fc.length === 5) {
              r = fc(languages, namespace, key, fallbackValue, opts);
            } else {
              r = fc(languages, namespace, key, fallbackValue);
            }
            if (r && typeof r.then === "function") {
              r.then((data) => clb(null, data)).catch(clb);
            } else {
              clb(null, r);
            }
          } catch (err) {
            clb(err);
          }
        } else {
          fc(languages, namespace, key, fallbackValue, clb, opts);
        }
      }
      if (!languages || !languages[0]) return;
      this.store.addResource(languages[0], namespace, key, fallbackValue);
    }
  };
  var get = () => ({
    debug: false,
    initImmediate: true,
    ns: ["translation"],
    defaultNS: ["translation"],
    fallbackLng: ["dev"],
    fallbackNS: false,
    supportedLngs: false,
    nonExplicitSupportedLngs: false,
    load: "all",
    preload: false,
    simplifyPluralSuffix: true,
    keySeparator: ".",
    nsSeparator: ":",
    pluralSeparator: "_",
    contextSeparator: "_",
    partialBundledLanguages: false,
    saveMissing: false,
    updateMissing: false,
    saveMissingTo: "fallback",
    saveMissingPlurals: true,
    missingKeyHandler: false,
    missingInterpolationHandler: false,
    postProcess: false,
    postProcessPassResolved: false,
    returnNull: false,
    returnEmptyString: true,
    returnObjects: false,
    joinArrays: false,
    returnedObjectHandler: false,
    parseMissingKeyHandler: false,
    appendNamespaceToMissingKey: false,
    appendNamespaceToCIMode: false,
    overloadTranslationOptionHandler: (args) => {
      let ret = {};
      if (typeof args[1] === "object") ret = args[1];
      if (typeof args[1] === "string") ret.defaultValue = args[1];
      if (typeof args[2] === "string") ret.tDescription = args[2];
      if (typeof args[2] === "object" || typeof args[3] === "object") {
        const options = args[3] || args[2];
        Object.keys(options).forEach((key) => {
          ret[key] = options[key];
        });
      }
      return ret;
    },
    interpolation: {
      escapeValue: true,
      format: (value) => value,
      prefix: "{{",
      suffix: "}}",
      formatSeparator: ",",
      unescapePrefix: "-",
      nestingPrefix: "$t(",
      nestingSuffix: ")",
      nestingOptionsSeparator: ",",
      maxReplaces: 1e3,
      skipOnVariables: true
    }
  });
  var transformOptions = (options) => {
    if (typeof options.ns === "string") options.ns = [options.ns];
    if (typeof options.fallbackLng === "string") options.fallbackLng = [options.fallbackLng];
    if (typeof options.fallbackNS === "string") options.fallbackNS = [options.fallbackNS];
    if (options.supportedLngs && options.supportedLngs.indexOf("cimode") < 0) {
      options.supportedLngs = options.supportedLngs.concat(["cimode"]);
    }
    return options;
  };
  var noop = () => {
  };
  var bindMemberFunctions = (inst) => {
    const mems = Object.getOwnPropertyNames(Object.getPrototypeOf(inst));
    mems.forEach((mem) => {
      if (typeof inst[mem] === "function") {
        inst[mem] = inst[mem].bind(inst);
      }
    });
  };
  var I18n = class _I18n extends EventEmitter {
    constructor() {
      let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      let callback = arguments.length > 1 ? arguments[1] : void 0;
      super();
      this.options = transformOptions(options);
      this.services = {};
      this.logger = baseLogger;
      this.modules = {
        external: []
      };
      bindMemberFunctions(this);
      if (callback && !this.isInitialized && !options.isClone) {
        if (!this.options.initImmediate) {
          this.init(options, callback);
          return this;
        }
        setTimeout(() => {
          this.init(options, callback);
        }, 0);
      }
    }
    init() {
      var _this = this;
      let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      let callback = arguments.length > 1 ? arguments[1] : void 0;
      this.isInitializing = true;
      if (typeof options === "function") {
        callback = options;
        options = {};
      }
      if (!options.defaultNS && options.defaultNS !== false && options.ns) {
        if (typeof options.ns === "string") {
          options.defaultNS = options.ns;
        } else if (options.ns.indexOf("translation") < 0) {
          options.defaultNS = options.ns[0];
        }
      }
      const defOpts = get();
      this.options = {
        ...defOpts,
        ...this.options,
        ...transformOptions(options)
      };
      if (this.options.compatibilityAPI !== "v1") {
        this.options.interpolation = {
          ...defOpts.interpolation,
          ...this.options.interpolation
        };
      }
      if (options.keySeparator !== void 0) {
        this.options.userDefinedKeySeparator = options.keySeparator;
      }
      if (options.nsSeparator !== void 0) {
        this.options.userDefinedNsSeparator = options.nsSeparator;
      }
      const createClassOnDemand = (ClassOrObject) => {
        if (!ClassOrObject) return null;
        if (typeof ClassOrObject === "function") return new ClassOrObject();
        return ClassOrObject;
      };
      if (!this.options.isClone) {
        if (this.modules.logger) {
          baseLogger.init(createClassOnDemand(this.modules.logger), this.options);
        } else {
          baseLogger.init(null, this.options);
        }
        let formatter;
        if (this.modules.formatter) {
          formatter = this.modules.formatter;
        } else if (typeof Intl !== "undefined") {
          formatter = Formatter;
        }
        const lu = new LanguageUtil(this.options);
        this.store = new ResourceStore(this.options.resources, this.options);
        const s = this.services;
        s.logger = baseLogger;
        s.resourceStore = this.store;
        s.languageUtils = lu;
        s.pluralResolver = new PluralResolver(lu, {
          prepend: this.options.pluralSeparator,
          compatibilityJSON: this.options.compatibilityJSON,
          simplifyPluralSuffix: this.options.simplifyPluralSuffix
        });
        if (formatter && (!this.options.interpolation.format || this.options.interpolation.format === defOpts.interpolation.format)) {
          s.formatter = createClassOnDemand(formatter);
          s.formatter.init(s, this.options);
          this.options.interpolation.format = s.formatter.format.bind(s.formatter);
        }
        s.interpolator = new Interpolator(this.options);
        s.utils = {
          hasLoadedNamespace: this.hasLoadedNamespace.bind(this)
        };
        s.backendConnector = new Connector(createClassOnDemand(this.modules.backend), s.resourceStore, s, this.options);
        s.backendConnector.on("*", function(event) {
          for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
          }
          _this.emit(event, ...args);
        });
        if (this.modules.languageDetector) {
          s.languageDetector = createClassOnDemand(this.modules.languageDetector);
          if (s.languageDetector.init) s.languageDetector.init(s, this.options.detection, this.options);
        }
        if (this.modules.i18nFormat) {
          s.i18nFormat = createClassOnDemand(this.modules.i18nFormat);
          if (s.i18nFormat.init) s.i18nFormat.init(this);
        }
        this.translator = new Translator(this.services, this.options);
        this.translator.on("*", function(event) {
          for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
            args[_key2 - 1] = arguments[_key2];
          }
          _this.emit(event, ...args);
        });
        this.modules.external.forEach((m) => {
          if (m.init) m.init(this);
        });
      }
      this.format = this.options.interpolation.format;
      if (!callback) callback = noop;
      if (this.options.fallbackLng && !this.services.languageDetector && !this.options.lng) {
        const codes = this.services.languageUtils.getFallbackCodes(this.options.fallbackLng);
        if (codes.length > 0 && codes[0] !== "dev") this.options.lng = codes[0];
      }
      if (!this.services.languageDetector && !this.options.lng) {
        this.logger.warn("init: no languageDetector is used and no lng is defined");
      }
      const storeApi = ["getResource", "hasResourceBundle", "getResourceBundle", "getDataByLanguage"];
      storeApi.forEach((fcName) => {
        this[fcName] = function() {
          return _this.store[fcName](...arguments);
        };
      });
      const storeApiChained = ["addResource", "addResources", "addResourceBundle", "removeResourceBundle"];
      storeApiChained.forEach((fcName) => {
        this[fcName] = function() {
          _this.store[fcName](...arguments);
          return _this;
        };
      });
      const deferred = defer();
      const load = () => {
        const finish = (err, t2) => {
          this.isInitializing = false;
          if (this.isInitialized && !this.initializedStoreOnce) this.logger.warn("init: i18next is already initialized. You should call init just once!");
          this.isInitialized = true;
          if (!this.options.isClone) this.logger.log("initialized", this.options);
          this.emit("initialized", this.options);
          deferred.resolve(t2);
          callback(err, t2);
        };
        if (this.languages && this.options.compatibilityAPI !== "v1" && !this.isInitialized) return finish(null, this.t.bind(this));
        this.changeLanguage(this.options.lng, finish);
      };
      if (this.options.resources || !this.options.initImmediate) {
        load();
      } else {
        setTimeout(load, 0);
      }
      return deferred;
    }
    loadResources(language) {
      let callback = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : noop;
      let usedCallback = callback;
      const usedLng = typeof language === "string" ? language : this.language;
      if (typeof language === "function") usedCallback = language;
      if (!this.options.resources || this.options.partialBundledLanguages) {
        if (usedLng && usedLng.toLowerCase() === "cimode" && (!this.options.preload || this.options.preload.length === 0)) return usedCallback();
        const toLoad = [];
        const append = (lng) => {
          if (!lng) return;
          if (lng === "cimode") return;
          const lngs = this.services.languageUtils.toResolveHierarchy(lng);
          lngs.forEach((l) => {
            if (l === "cimode") return;
            if (toLoad.indexOf(l) < 0) toLoad.push(l);
          });
        };
        if (!usedLng) {
          const fallbacks = this.services.languageUtils.getFallbackCodes(this.options.fallbackLng);
          fallbacks.forEach((l) => append(l));
        } else {
          append(usedLng);
        }
        if (this.options.preload) {
          this.options.preload.forEach((l) => append(l));
        }
        this.services.backendConnector.load(toLoad, this.options.ns, (e) => {
          if (!e && !this.resolvedLanguage && this.language) this.setResolvedLanguage(this.language);
          usedCallback(e);
        });
      } else {
        usedCallback(null);
      }
    }
    reloadResources(lngs, ns, callback) {
      const deferred = defer();
      if (!lngs) lngs = this.languages;
      if (!ns) ns = this.options.ns;
      if (!callback) callback = noop;
      this.services.backendConnector.reload(lngs, ns, (err) => {
        deferred.resolve();
        callback(err);
      });
      return deferred;
    }
    use(module) {
      if (!module) throw new Error("You are passing an undefined module! Please check the object you are passing to i18next.use()");
      if (!module.type) throw new Error("You are passing a wrong module! Please check the object you are passing to i18next.use()");
      if (module.type === "backend") {
        this.modules.backend = module;
      }
      if (module.type === "logger" || module.log && module.warn && module.error) {
        this.modules.logger = module;
      }
      if (module.type === "languageDetector") {
        this.modules.languageDetector = module;
      }
      if (module.type === "i18nFormat") {
        this.modules.i18nFormat = module;
      }
      if (module.type === "postProcessor") {
        postProcessor.addPostProcessor(module);
      }
      if (module.type === "formatter") {
        this.modules.formatter = module;
      }
      if (module.type === "3rdParty") {
        this.modules.external.push(module);
      }
      return this;
    }
    setResolvedLanguage(l) {
      if (!l || !this.languages) return;
      if (["cimode", "dev"].indexOf(l) > -1) return;
      for (let li = 0; li < this.languages.length; li++) {
        const lngInLngs = this.languages[li];
        if (["cimode", "dev"].indexOf(lngInLngs) > -1) continue;
        if (this.store.hasLanguageSomeTranslations(lngInLngs)) {
          this.resolvedLanguage = lngInLngs;
          break;
        }
      }
    }
    changeLanguage(lng, callback) {
      var _this2 = this;
      this.isLanguageChangingTo = lng;
      const deferred = defer();
      this.emit("languageChanging", lng);
      const setLngProps = (l) => {
        this.language = l;
        this.languages = this.services.languageUtils.toResolveHierarchy(l);
        this.resolvedLanguage = void 0;
        this.setResolvedLanguage(l);
      };
      const done = (err, l) => {
        if (l) {
          setLngProps(l);
          this.translator.changeLanguage(l);
          this.isLanguageChangingTo = void 0;
          this.emit("languageChanged", l);
          this.logger.log("languageChanged", l);
        } else {
          this.isLanguageChangingTo = void 0;
        }
        deferred.resolve(function() {
          return _this2.t(...arguments);
        });
        if (callback) callback(err, function() {
          return _this2.t(...arguments);
        });
      };
      const setLng = (lngs) => {
        if (!lng && !lngs && this.services.languageDetector) lngs = [];
        const l = typeof lngs === "string" ? lngs : this.services.languageUtils.getBestMatchFromCodes(lngs);
        if (l) {
          if (!this.language) {
            setLngProps(l);
          }
          if (!this.translator.language) this.translator.changeLanguage(l);
          if (this.services.languageDetector && this.services.languageDetector.cacheUserLanguage) this.services.languageDetector.cacheUserLanguage(l);
        }
        this.loadResources(l, (err) => {
          done(err, l);
        });
      };
      if (!lng && this.services.languageDetector && !this.services.languageDetector.async) {
        setLng(this.services.languageDetector.detect());
      } else if (!lng && this.services.languageDetector && this.services.languageDetector.async) {
        if (this.services.languageDetector.detect.length === 0) {
          this.services.languageDetector.detect().then(setLng);
        } else {
          this.services.languageDetector.detect(setLng);
        }
      } else {
        setLng(lng);
      }
      return deferred;
    }
    getFixedT(lng, ns, keyPrefix) {
      var _this3 = this;
      const fixedT = function(key, opts) {
        let options;
        if (typeof opts !== "object") {
          for (var _len3 = arguments.length, rest = new Array(_len3 > 2 ? _len3 - 2 : 0), _key3 = 2; _key3 < _len3; _key3++) {
            rest[_key3 - 2] = arguments[_key3];
          }
          options = _this3.options.overloadTranslationOptionHandler([key, opts].concat(rest));
        } else {
          options = {
            ...opts
          };
        }
        options.lng = options.lng || fixedT.lng;
        options.lngs = options.lngs || fixedT.lngs;
        options.ns = options.ns || fixedT.ns;
        if (options.keyPrefix !== "") options.keyPrefix = options.keyPrefix || keyPrefix || fixedT.keyPrefix;
        const keySeparator = _this3.options.keySeparator || ".";
        let resultKey;
        if (options.keyPrefix && Array.isArray(key)) {
          resultKey = key.map((k) => `${options.keyPrefix}${keySeparator}${k}`);
        } else {
          resultKey = options.keyPrefix ? `${options.keyPrefix}${keySeparator}${key}` : key;
        }
        return _this3.t(resultKey, options);
      };
      if (typeof lng === "string") {
        fixedT.lng = lng;
      } else {
        fixedT.lngs = lng;
      }
      fixedT.ns = ns;
      fixedT.keyPrefix = keyPrefix;
      return fixedT;
    }
    t() {
      return this.translator && this.translator.translate(...arguments);
    }
    exists() {
      return this.translator && this.translator.exists(...arguments);
    }
    setDefaultNamespace(ns) {
      this.options.defaultNS = ns;
    }
    hasLoadedNamespace(ns) {
      let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      if (!this.isInitialized) {
        this.logger.warn("hasLoadedNamespace: i18next was not initialized", this.languages);
        return false;
      }
      if (!this.languages || !this.languages.length) {
        this.logger.warn("hasLoadedNamespace: i18n.languages were undefined or empty", this.languages);
        return false;
      }
      const lng = options.lng || this.resolvedLanguage || this.languages[0];
      const fallbackLng = this.options ? this.options.fallbackLng : false;
      const lastLng = this.languages[this.languages.length - 1];
      if (lng.toLowerCase() === "cimode") return true;
      const loadNotPending = (l, n) => {
        const loadState2 = this.services.backendConnector.state[`${l}|${n}`];
        return loadState2 === -1 || loadState2 === 2;
      };
      if (options.precheck) {
        const preResult = options.precheck(this, loadNotPending);
        if (preResult !== void 0) return preResult;
      }
      if (this.hasResourceBundle(lng, ns)) return true;
      if (!this.services.backendConnector.backend || this.options.resources && !this.options.partialBundledLanguages) return true;
      if (loadNotPending(lng, ns) && (!fallbackLng || loadNotPending(lastLng, ns))) return true;
      return false;
    }
    loadNamespaces(ns, callback) {
      const deferred = defer();
      if (!this.options.ns) {
        if (callback) callback();
        return Promise.resolve();
      }
      if (typeof ns === "string") ns = [ns];
      ns.forEach((n) => {
        if (this.options.ns.indexOf(n) < 0) this.options.ns.push(n);
      });
      this.loadResources((err) => {
        deferred.resolve();
        if (callback) callback(err);
      });
      return deferred;
    }
    loadLanguages(lngs, callback) {
      const deferred = defer();
      if (typeof lngs === "string") lngs = [lngs];
      const preloaded = this.options.preload || [];
      const newLngs = lngs.filter((lng) => preloaded.indexOf(lng) < 0 && this.services.languageUtils.isSupportedCode(lng));
      if (!newLngs.length) {
        if (callback) callback();
        return Promise.resolve();
      }
      this.options.preload = preloaded.concat(newLngs);
      this.loadResources((err) => {
        deferred.resolve();
        if (callback) callback(err);
      });
      return deferred;
    }
    dir(lng) {
      if (!lng) lng = this.resolvedLanguage || (this.languages && this.languages.length > 0 ? this.languages[0] : this.language);
      if (!lng) return "rtl";
      const rtlLngs = ["ar", "shu", "sqr", "ssh", "xaa", "yhd", "yud", "aao", "abh", "abv", "acm", "acq", "acw", "acx", "acy", "adf", "ads", "aeb", "aec", "afb", "ajp", "apc", "apd", "arb", "arq", "ars", "ary", "arz", "auz", "avl", "ayh", "ayl", "ayn", "ayp", "bbz", "pga", "he", "iw", "ps", "pbt", "pbu", "pst", "prp", "prd", "ug", "ur", "ydd", "yds", "yih", "ji", "yi", "hbo", "men", "xmn", "fa", "jpr", "peo", "pes", "prs", "dv", "sam", "ckb"];
      const languageUtils = this.services && this.services.languageUtils || new LanguageUtil(get());
      return rtlLngs.indexOf(languageUtils.getLanguagePartFromCode(lng)) > -1 || lng.toLowerCase().indexOf("-arab") > 1 ? "rtl" : "ltr";
    }
    static createInstance() {
      let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      let callback = arguments.length > 1 ? arguments[1] : void 0;
      return new _I18n(options, callback);
    }
    cloneInstance() {
      let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      let callback = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : noop;
      const forkResourceStore = options.forkResourceStore;
      if (forkResourceStore) delete options.forkResourceStore;
      const mergedOptions = {
        ...this.options,
        ...options,
        ...{
          isClone: true
        }
      };
      const clone = new _I18n(mergedOptions);
      if (options.debug !== void 0 || options.prefix !== void 0) {
        clone.logger = clone.logger.clone(options);
      }
      const membersToCopy = ["store", "services", "language"];
      membersToCopy.forEach((m) => {
        clone[m] = this[m];
      });
      clone.services = {
        ...this.services
      };
      clone.services.utils = {
        hasLoadedNamespace: clone.hasLoadedNamespace.bind(clone)
      };
      if (forkResourceStore) {
        clone.store = new ResourceStore(this.store.data, mergedOptions);
        clone.services.resourceStore = clone.store;
      }
      clone.translator = new Translator(clone.services, mergedOptions);
      clone.translator.on("*", function(event) {
        for (var _len4 = arguments.length, args = new Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
          args[_key4 - 1] = arguments[_key4];
        }
        clone.emit(event, ...args);
      });
      clone.init(mergedOptions, callback);
      clone.translator.options = mergedOptions;
      clone.translator.backendConnector.services.utils = {
        hasLoadedNamespace: clone.hasLoadedNamespace.bind(clone)
      };
      return clone;
    }
    toJSON() {
      return {
        options: this.options,
        store: this.store,
        language: this.language,
        languages: this.languages,
        resolvedLanguage: this.resolvedLanguage
      };
    }
  };
  var instance = I18n.createInstance();
  instance.createInstance = I18n.createInstance;
  var createInstance = instance.createInstance;
  var dir = instance.dir;
  var init = instance.init;
  var loadResources = instance.loadResources;
  var reloadResources = instance.reloadResources;
  var use = instance.use;
  var changeLanguage = instance.changeLanguage;
  var getFixedT = instance.getFixedT;
  var t = instance.t;
  var exists = instance.exists;
  var setDefaultNamespace = instance.setDefaultNamespace;
  var hasLoadedNamespace = instance.hasLoadedNamespace;
  var loadNamespaces = instance.loadNamespaces;
  var loadLanguages = instance.loadLanguages;

  // node_modules/@babel/runtime/helpers/esm/classCallCheck.js
  function _classCallCheck(a, n) {
    if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
  }

  // node_modules/@babel/runtime/helpers/esm/typeof.js
  function _typeof(o) {
    "@babel/helpers - typeof";
    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
      return typeof o2;
    } : function(o2) {
      return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
    }, _typeof(o);
  }

  // node_modules/@babel/runtime/helpers/esm/toPrimitive.js
  function toPrimitive(t2, r) {
    if ("object" != _typeof(t2) || !t2) return t2;
    var e = t2[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t2, r || "default");
      if ("object" != _typeof(i)) return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t2);
  }

  // node_modules/@babel/runtime/helpers/esm/toPropertyKey.js
  function toPropertyKey(t2) {
    var i = toPrimitive(t2, "string");
    return "symbol" == _typeof(i) ? i : i + "";
  }

  // node_modules/@babel/runtime/helpers/esm/createClass.js
  function _defineProperties(e, r) {
    for (var t2 = 0; t2 < r.length; t2++) {
      var o = r[t2];
      o.enumerable = o.enumerable || false, o.configurable = true, "value" in o && (o.writable = true), Object.defineProperty(e, toPropertyKey(o.key), o);
    }
  }
  function _createClass(e, r, t2) {
    return r && _defineProperties(e.prototype, r), t2 && _defineProperties(e, t2), Object.defineProperty(e, "prototype", {
      writable: false
    }), e;
  }

  // node_modules/i18next-browser-languagedetector/dist/esm/i18nextBrowserLanguageDetector.js
  var arr = [];
  var each = arr.forEach;
  var slice = arr.slice;
  function defaults(obj) {
    each.call(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  }
  var fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
  var serializeCookie = function serializeCookie2(name, val, options) {
    var opt = options || {};
    opt.path = opt.path || "/";
    var value = encodeURIComponent(val);
    var str = "".concat(name, "=").concat(value);
    if (opt.maxAge > 0) {
      var maxAge = opt.maxAge - 0;
      if (Number.isNaN(maxAge)) throw new Error("maxAge should be a Number");
      str += "; Max-Age=".concat(Math.floor(maxAge));
    }
    if (opt.domain) {
      if (!fieldContentRegExp.test(opt.domain)) {
        throw new TypeError("option domain is invalid");
      }
      str += "; Domain=".concat(opt.domain);
    }
    if (opt.path) {
      if (!fieldContentRegExp.test(opt.path)) {
        throw new TypeError("option path is invalid");
      }
      str += "; Path=".concat(opt.path);
    }
    if (opt.expires) {
      if (typeof opt.expires.toUTCString !== "function") {
        throw new TypeError("option expires is invalid");
      }
      str += "; Expires=".concat(opt.expires.toUTCString());
    }
    if (opt.httpOnly) str += "; HttpOnly";
    if (opt.secure) str += "; Secure";
    if (opt.sameSite) {
      var sameSite = typeof opt.sameSite === "string" ? opt.sameSite.toLowerCase() : opt.sameSite;
      switch (sameSite) {
        case true:
          str += "; SameSite=Strict";
          break;
        case "lax":
          str += "; SameSite=Lax";
          break;
        case "strict":
          str += "; SameSite=Strict";
          break;
        case "none":
          str += "; SameSite=None";
          break;
        default:
          throw new TypeError("option sameSite is invalid");
      }
    }
    return str;
  };
  var cookie = {
    create: function create(name, value, minutes, domain) {
      var cookieOptions = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : {
        path: "/",
        sameSite: "strict"
      };
      if (minutes) {
        cookieOptions.expires = /* @__PURE__ */ new Date();
        cookieOptions.expires.setTime(cookieOptions.expires.getTime() + minutes * 60 * 1e3);
      }
      if (domain) cookieOptions.domain = domain;
      document.cookie = serializeCookie(name, encodeURIComponent(value), cookieOptions);
    },
    read: function read(name) {
      var nameEQ = "".concat(name, "=");
      var ca = document.cookie.split(";");
      for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === " ") c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
      }
      return null;
    },
    remove: function remove(name) {
      this.create(name, "", -1);
    }
  };
  var cookie$1 = {
    name: "cookie",
    lookup: function lookup(options) {
      var found;
      if (options.lookupCookie && typeof document !== "undefined") {
        var c = cookie.read(options.lookupCookie);
        if (c) found = c;
      }
      return found;
    },
    cacheUserLanguage: function cacheUserLanguage(lng, options) {
      if (options.lookupCookie && typeof document !== "undefined") {
        cookie.create(options.lookupCookie, lng, options.cookieMinutes, options.cookieDomain, options.cookieOptions);
      }
    }
  };
  var querystring = {
    name: "querystring",
    lookup: function lookup2(options) {
      var found;
      if (typeof window !== "undefined") {
        var search = window.location.search;
        if (!window.location.search && window.location.hash && window.location.hash.indexOf("?") > -1) {
          search = window.location.hash.substring(window.location.hash.indexOf("?"));
        }
        var query = search.substring(1);
        var params = query.split("&");
        for (var i = 0; i < params.length; i++) {
          var pos = params[i].indexOf("=");
          if (pos > 0) {
            var key = params[i].substring(0, pos);
            if (key === options.lookupQuerystring) {
              found = params[i].substring(pos + 1);
            }
          }
        }
      }
      return found;
    }
  };
  var hasLocalStorageSupport = null;
  var localStorageAvailable = function localStorageAvailable2() {
    if (hasLocalStorageSupport !== null) return hasLocalStorageSupport;
    try {
      hasLocalStorageSupport = window !== "undefined" && window.localStorage !== null;
      var testKey = "i18next.translate.boo";
      window.localStorage.setItem(testKey, "foo");
      window.localStorage.removeItem(testKey);
    } catch (e) {
      hasLocalStorageSupport = false;
    }
    return hasLocalStorageSupport;
  };
  var localStorage = {
    name: "localStorage",
    lookup: function lookup3(options) {
      var found;
      if (options.lookupLocalStorage && localStorageAvailable()) {
        var lng = window.localStorage.getItem(options.lookupLocalStorage);
        if (lng) found = lng;
      }
      return found;
    },
    cacheUserLanguage: function cacheUserLanguage2(lng, options) {
      if (options.lookupLocalStorage && localStorageAvailable()) {
        window.localStorage.setItem(options.lookupLocalStorage, lng);
      }
    }
  };
  var hasSessionStorageSupport = null;
  var sessionStorageAvailable = function sessionStorageAvailable2() {
    if (hasSessionStorageSupport !== null) return hasSessionStorageSupport;
    try {
      hasSessionStorageSupport = window !== "undefined" && window.sessionStorage !== null;
      var testKey = "i18next.translate.boo";
      window.sessionStorage.setItem(testKey, "foo");
      window.sessionStorage.removeItem(testKey);
    } catch (e) {
      hasSessionStorageSupport = false;
    }
    return hasSessionStorageSupport;
  };
  var sessionStorage = {
    name: "sessionStorage",
    lookup: function lookup4(options) {
      var found;
      if (options.lookupSessionStorage && sessionStorageAvailable()) {
        var lng = window.sessionStorage.getItem(options.lookupSessionStorage);
        if (lng) found = lng;
      }
      return found;
    },
    cacheUserLanguage: function cacheUserLanguage3(lng, options) {
      if (options.lookupSessionStorage && sessionStorageAvailable()) {
        window.sessionStorage.setItem(options.lookupSessionStorage, lng);
      }
    }
  };
  var navigator$1 = {
    name: "navigator",
    lookup: function lookup5(options) {
      var found = [];
      if (typeof navigator !== "undefined") {
        if (navigator.languages) {
          for (var i = 0; i < navigator.languages.length; i++) {
            found.push(navigator.languages[i]);
          }
        }
        if (navigator.userLanguage) {
          found.push(navigator.userLanguage);
        }
        if (navigator.language) {
          found.push(navigator.language);
        }
      }
      return found.length > 0 ? found : void 0;
    }
  };
  var htmlTag = {
    name: "htmlTag",
    lookup: function lookup6(options) {
      var found;
      var htmlTag2 = options.htmlTag || (typeof document !== "undefined" ? document.documentElement : null);
      if (htmlTag2 && typeof htmlTag2.getAttribute === "function") {
        found = htmlTag2.getAttribute("lang");
      }
      return found;
    }
  };
  var path = {
    name: "path",
    lookup: function lookup7(options) {
      var found;
      if (typeof window !== "undefined") {
        var language = window.location.pathname.match(/\/([a-zA-Z-]*)/g);
        if (language instanceof Array) {
          if (typeof options.lookupFromPathIndex === "number") {
            if (typeof language[options.lookupFromPathIndex] !== "string") {
              return void 0;
            }
            found = language[options.lookupFromPathIndex].replace("/", "");
          } else {
            found = language[0].replace("/", "");
          }
        }
      }
      return found;
    }
  };
  var subdomain = {
    name: "subdomain",
    lookup: function lookup8(options) {
      var lookupFromSubdomainIndex = typeof options.lookupFromSubdomainIndex === "number" ? options.lookupFromSubdomainIndex + 1 : 1;
      var language = typeof window !== "undefined" && window.location && window.location.hostname && window.location.hostname.match(/^(\w{2,5})\.(([a-z0-9-]{1,63}\.[a-z]{2,6})|localhost)/i);
      if (!language) return void 0;
      return language[lookupFromSubdomainIndex];
    }
  };
  function getDefaults() {
    return {
      order: ["querystring", "cookie", "localStorage", "sessionStorage", "navigator", "htmlTag"],
      lookupQuerystring: "lng",
      lookupCookie: "i18next",
      lookupLocalStorage: "i18nextLng",
      lookupSessionStorage: "i18nextLng",
      // cache user language
      caches: ["localStorage"],
      excludeCacheFor: ["cimode"],
      // cookieMinutes: 10,
      // cookieDomain: 'myDomain'
      convertDetectedLanguage: function convertDetectedLanguage(l) {
        return l;
      }
    };
  }
  var Browser = /* @__PURE__ */ function() {
    function Browser2(services) {
      var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      _classCallCheck(this, Browser2);
      this.type = "languageDetector";
      this.detectors = {};
      this.init(services, options);
    }
    _createClass(Browser2, [{
      key: "init",
      value: function init2(services) {
        var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        var i18nOptions = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
        this.services = services || {
          languageUtils: {}
        };
        this.options = defaults(options, this.options || {}, getDefaults());
        if (typeof this.options.convertDetectedLanguage === "string" && this.options.convertDetectedLanguage.indexOf("15897") > -1) {
          this.options.convertDetectedLanguage = function(l) {
            return l.replace("-", "_");
          };
        }
        if (this.options.lookupFromUrlIndex) this.options.lookupFromPathIndex = this.options.lookupFromUrlIndex;
        this.i18nOptions = i18nOptions;
        this.addDetector(cookie$1);
        this.addDetector(querystring);
        this.addDetector(localStorage);
        this.addDetector(sessionStorage);
        this.addDetector(navigator$1);
        this.addDetector(htmlTag);
        this.addDetector(path);
        this.addDetector(subdomain);
      }
    }, {
      key: "addDetector",
      value: function addDetector(detector) {
        this.detectors[detector.name] = detector;
        return this;
      }
    }, {
      key: "detect",
      value: function detect(detectionOrder) {
        var _this = this;
        if (!detectionOrder) detectionOrder = this.options.order;
        var detected = [];
        detectionOrder.forEach(function(detectorName) {
          if (_this.detectors[detectorName]) {
            var lookup9 = _this.detectors[detectorName].lookup(_this.options);
            if (lookup9 && typeof lookup9 === "string") lookup9 = [lookup9];
            if (lookup9) detected = detected.concat(lookup9);
          }
        });
        detected = detected.map(function(d) {
          return _this.options.convertDetectedLanguage(d);
        });
        if (this.services.languageUtils.getBestMatchFromCodes) return detected;
        return detected.length > 0 ? detected[0] : null;
      }
    }, {
      key: "cacheUserLanguage",
      value: function cacheUserLanguage4(lng, caches) {
        var _this2 = this;
        if (!caches) caches = this.options.caches;
        if (!caches) return;
        if (this.options.excludeCacheFor && this.options.excludeCacheFor.indexOf(lng) > -1) return;
        caches.forEach(function(cacheName) {
          if (_this2.detectors[cacheName]) _this2.detectors[cacheName].cacheUserLanguage(lng, _this2.options);
        });
      }
    }]);
    return Browser2;
  }();
  Browser.type = "languageDetector";

  // node_modules/@atomicjolt/lti-client/dist/libs/constants.js
  var STATE_KEY_PREFIX = "aj_lti";

  // node_modules/@atomicjolt/lti-client/dist/libs/capabilities.js
  function getCapabilities() {
    return new Promise((resolve, reject) => {
      let parent = window.parent || window.opener;
      const timeout = setTimeout(() => {
        console.log(instance.t("capabilities request timeout"));
        reject(new Error(instance.t("Timeout while waiting for capabilities response")));
      }, 1e3);
      const receiveMessage = (event) => {
        if (typeof event.data === "object" && event.data.subject === "lti.capabilities.response" && event.data.message_id === "aj-lti-caps") {
          removeEventListener("message", receiveMessage);
          clearTimeout(timeout);
          if (event.data.error) {
            console.error(event.data.error.code);
            console.error(event.data.error.message);
            reject(new Error(event.data.errormessage));
            return;
          }
          resolve(event.data.supported_messages);
        }
      };
      window.addEventListener("message", receiveMessage);
      parent.postMessage({
        "subject": "lti.capabilities",
        "message_id": "aj-lti-caps"
      }, "*");
    });
  }
  async function getCapability(subject) {
    const caps = await getCapabilities();
    if (caps) {
      return caps.find((element) => element.subject == subject) || null;
    }
    return null;
  }

  // node_modules/@atomicjolt/lti-client/dist/libs/platform_storage.js
  async function getTargetFrame(storageParams) {
    let target = storageParams.target;
    if (target == null) {
      const cap = await getCapability("lti.get_data");
      target = cap?.frame;
    }
    if (target == null) {
      target = "_parent";
    }
    const parent = window.parent || window.opener;
    return target === "_parent" ? parent : parent.frames[target] || parent;
  }
  function loadState(state, storageParams) {
    return new Promise((resolve, reject) => {
      let platformOrigin = new URL(storageParams.platformOIDCUrl).origin;
      if (storageParams.originSupportBroken) {
        platformOrigin = "*";
      }
      const timeout = setTimeout(() => {
        console.log(instance.t("postMessage timeout"));
        reject(new Error(instance.t("Timeout while waiting for platform response")));
      }, 2e3);
      const receiveMessage = (event) => {
        if (typeof event.data === "object" && event.data.subject === "lti.get_data.response" && event.data.message_id === state && (event.origin === platformOrigin || platformOrigin === "*")) {
          removeEventListener("message", receiveMessage);
          clearTimeout(timeout);
          if (event.data.error) {
            console.error(event.data.error.code);
            console.error(event.data.error.message);
            reject(new Error(event.data.errormessage));
          }
          resolve(event.data.value);
        }
      };
      window.addEventListener("message", receiveMessage);
      getTargetFrame(storageParams).then((targetFrame) => targetFrame.postMessage({
        subject: "lti.get_data",
        message_id: state,
        key: `${STATE_KEY_PREFIX}${state}`
      }, platformOrigin)).catch((e) => {
        console.log(instance.t("Could not find target frame"));
        console.log(e);
        reject(new Error(instance.t("Could not find target frame")));
      });
    });
  }

  // node_modules/@atomicjolt/lti-client/dist/client/launch.js
  async function validateLaunch(settings) {
    if (settings.ltiStorageParams) {
      try {
        console.log("Using postMessage state validation");
        const state = await loadState(settings.state, settings.ltiStorageParams);
        if (state == settings.state) {
          return true;
        }
        return false;
      } catch (e) {
        console.error(e);
        return false;
      }
    }
    return false;
  }
  async function ltiLaunch(settings) {
    if (!settings.stateVerified) {
      const result = await validateLaunch(settings);
      return result;
    }
    return true;
  }

  // node_modules/@atomicjolt/lti-types/dist/index.js
  var LtiVersions;
  (function(LtiVersions2) {
    LtiVersions2["v1_3_0"] = "1.3.0";
  })(LtiVersions || (LtiVersions = {}));
  var DocumentTargets;
  (function(DocumentTargets2) {
    DocumentTargets2["iframe"] = "iframe";
    DocumentTargets2["window"] = "window";
    DocumentTargets2["embed"] = "embed";
  })(DocumentTargets || (DocumentTargets = {}));
  var AcceptTypes;
  (function(AcceptTypes2) {
    AcceptTypes2["link"] = "link";
    AcceptTypes2["file"] = "file";
    AcceptTypes2["html"] = "html";
    AcceptTypes2["ltiResourceLink"] = "ltiResourceLink";
    AcceptTypes2["image"] = "image";
  })(AcceptTypes || (AcceptTypes = {}));
  var MessageTypes;
  (function(MessageTypes2) {
    MessageTypes2["LtiResourceLinkRequest"] = "LtiResourceLinkRequest";
    MessageTypes2["LtiDeepLinkingRequest"] = "LtiDeepLinkingRequest";
  })(MessageTypes || (MessageTypes = {}));
  var Roles;
  (function(Roles2) {
    Roles2["AdministratorSystemRole"] = "http://purl.imsglobal.org/vocab/lis/v2/system/person#Administrator";
    Roles2["NoneSystemRole"] = "http://purl.imsglobal.org/vocab/lis/v2/system/person#None";
    Roles2["AccountAdminSystemRole"] = "http://purl.imsglobal.org/vocab/lis/v2/system/person#AccountAdmin";
    Roles2["CreatorSystemRole"] = "http://purl.imsglobal.org/vocab/lis/v2/system/person#Creator";
    Roles2["SysAdminSystemRole"] = "http://purl.imsglobal.org/vocab/lis/v2/system/person#SysAdmin";
    Roles2["SysSupportSystemRole"] = "http://purl.imsglobal.org/vocab/lis/v2/system/person#SysSupport";
    Roles2["UserSystemRole"] = "http://purl.imsglobal.org/vocab/lis/v2/system/person#User";
    Roles2["AdministratorInstitutionRole"] = "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Administrator";
    Roles2["FacultyInstitutionRole"] = "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Faculty";
    Roles2["GuestInstitutionRole"] = "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Guest";
    Roles2["NoneInstitutionRole"] = "http://purl.imsglobal.org/vocab/lis/v2/institution/person#None";
    Roles2["OtherInstitutionRole"] = "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Other";
    Roles2["StaffInstitutionRole"] = "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Staff";
    Roles2["StudentInstitutionRole"] = "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Student";
    Roles2["AlumniInstitutionRole"] = "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Alumni";
    Roles2["InstructorInstitutionRole"] = "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Instructor";
    Roles2["LearnerInstitutionRole"] = "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Learner";
    Roles2["MemberInstitutionRole"] = "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Member";
    Roles2["MentorInstitutionRole"] = "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Mentor";
    Roles2["ObserverInstitutionRole"] = "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Observer";
    Roles2["ProspectiveStudentInstitutionRole"] = "http://purl.imsglobal.org/vocab/lis/v2/institution/person#ProspectiveStudent";
    Roles2["AdministratorContextRole"] = "http://purl.imsglobal.org/vocab/lis/v2/membership#Administrator";
    Roles2["ContentDeveloperContextRole"] = "http://purl.imsglobal.org/vocab/lis/v2/membership#ContentDeveloper";
    Roles2["InstructorContextRole"] = "http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor";
    Roles2["LearnerContextRole"] = "http://purl.imsglobal.org/vocab/lis/v2/membership#Learner";
    Roles2["MentorContextRole"] = "http://purl.imsglobal.org/vocab/lis/v2/membership#Mentor";
    Roles2["ManagerContextRole"] = "http://purl.imsglobal.org/vocab/lis/v2/membership#Manager";
    Roles2["MemberContextRole"] = "http://purl.imsglobal.org/vocab/lis/v2/membership#Member";
    Roles2["OfficerContextRole"] = "http://purl.imsglobal.org/vocab/lis/v2/membership#Officer";
  })(Roles || (Roles = {}));
  var AGSScopes;
  (function(AGSScopes2) {
    AGSScopes2["lineItem"] = "https://purl.imsglobal.org/spec/lti-ags/scope/lineitem";
    AGSScopes2["resultReadOnly"] = "https://purl.imsglobal.org/spec/lti-ags/scope/result.readonly";
    AGSScopes2["score"] = "https://purl.imsglobal.org/spec/lti-ags/scope/score";
    AGSScopes2["lineItemReadOnly"] = "https://purl.imsglobal.org/spec/lti-ags/scope/lineitem.readonly";
  })(AGSScopes || (AGSScopes = {}));
  var MemberStatus;
  (function(MemberStatus2) {
    MemberStatus2[MemberStatus2["Active"] = 0] = "Active";
    MemberStatus2[MemberStatus2["Inactive"] = 1] = "Inactive";
    MemberStatus2[MemberStatus2["Deleted"] = 2] = "Deleted";
  })(MemberStatus || (MemberStatus = {}));

  // client/app.ts
  var launchSettings = window.LAUNCH_SETTINGS;
  ltiLaunch(launchSettings).then((valid) => {
    if (valid) {
      document.body.innerHTML = `
      <h1>Hello World</h1>
    `;
      const jwt = launchSettings.jwt;
      if (launchSettings.deepLinking) {
        document.body.innerHTML += `
        <h2>Deep Linking</h2>
        <button id="deep-linking-button">Deep Link</button>
        <form id="deep-linking-form" method="post">
          <input id="deep-link-jwt" type="hidden" name="JWT" value="" />
          <button id="deep-link-submit" type="submit" style="display:none;">Submit</button>
        </form>
      `;
        const deepLinkingButton = document.getElementById("deep-linking-button");
        if (deepLinkingButton) {
          deepLinkingButton.addEventListener("click", () => {
            const deepLink = {
              type: "html",
              html: "<h2>Just saying hi!</h2>",
              title: "Hello World",
              text: "A simple hello world example"
            };
            fetch("/lti_services/sign_deep_link", {
              method: "POST",
              body: JSON.stringify([deepLink]),
              headers: {
                "Authorization": `Bearer ${jwt}`,
                "Content-Type": "application/json"
              }
            }).then((response) => {
              console.log(response);
              return response.json();
            }).then((data) => {
              console.log(data);
              const form = document.getElementById("deep-linking-form");
              form?.setAttribute("action", launchSettings?.deepLinking?.deep_link_return_url || "");
              const field = document.getElementById("deep-link-jwt");
              field?.setAttribute("value", data.jwt);
              form?.submit();
            }).catch((error) => {
              console.error("Error:", error);
            });
          });
        }
      }
      fetch("/lti_services/names_and_roles", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${jwt}`,
          "Content-Type": "application/json"
        }
      }).then((response) => response.json()).then((data) => console.log(data)).catch((error) => {
        console.error("Error:", error);
      });
    } else {
      document.body.innerHTML = "Failed to launch";
    }
  });
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2kxOG5leHQvZGlzdC9lc20vaTE4bmV4dC5qcyIsICIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQGJhYmVsL3J1bnRpbWUvaGVscGVycy9lc20vY2xhc3NDYWxsQ2hlY2suanMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvZXNtL3R5cGVvZi5qcyIsICIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQGJhYmVsL3J1bnRpbWUvaGVscGVycy9lc20vdG9QcmltaXRpdmUuanMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvZXNtL3RvUHJvcGVydHlLZXkuanMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvZXNtL2NyZWF0ZUNsYXNzLmpzIiwgIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9pMThuZXh0LWJyb3dzZXItbGFuZ3VhZ2VkZXRlY3Rvci9kaXN0L2VzbS9pMThuZXh0QnJvd3Nlckxhbmd1YWdlRGV0ZWN0b3IuanMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BhdG9taWNqb2x0L2x0aS1jbGllbnQvc3JjL2xpYnMvY29uc3RhbnRzLnRzIiwgIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9AYXRvbWljam9sdC9sdGktY2xpZW50L3NyYy9saWJzL2NhcGFiaWxpdGllcy50cyIsICIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQGF0b21pY2pvbHQvbHRpLWNsaWVudC9zcmMvbGlicy9wbGF0Zm9ybV9zdG9yYWdlLnRzIiwgIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9AYXRvbWljam9sdC9sdGktY2xpZW50L3NyYy9jbGllbnQvbGF1bmNoLnRzIiwgIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9AYXRvbWljam9sdC9sdGktdHlwZXMvc3JjL2luZGV4LnRzIiwgIi4uLy4uLy4uL2NsaWVudC9hcHAudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IGNvbnNvbGVMb2dnZXIgPSB7XG4gIHR5cGU6ICdsb2dnZXInLFxuICBsb2coYXJncykge1xuICAgIHRoaXMub3V0cHV0KCdsb2cnLCBhcmdzKTtcbiAgfSxcbiAgd2FybihhcmdzKSB7XG4gICAgdGhpcy5vdXRwdXQoJ3dhcm4nLCBhcmdzKTtcbiAgfSxcbiAgZXJyb3IoYXJncykge1xuICAgIHRoaXMub3V0cHV0KCdlcnJvcicsIGFyZ3MpO1xuICB9LFxuICBvdXRwdXQodHlwZSwgYXJncykge1xuICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGVbdHlwZV0pIGNvbnNvbGVbdHlwZV0uYXBwbHkoY29uc29sZSwgYXJncyk7XG4gIH1cbn07XG5jbGFzcyBMb2dnZXIge1xuICBjb25zdHJ1Y3Rvcihjb25jcmV0ZUxvZ2dlcikge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB7fTtcbiAgICB0aGlzLmluaXQoY29uY3JldGVMb2dnZXIsIG9wdGlvbnMpO1xuICB9XG4gIGluaXQoY29uY3JldGVMb2dnZXIpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge307XG4gICAgdGhpcy5wcmVmaXggPSBvcHRpb25zLnByZWZpeCB8fCAnaTE4bmV4dDonO1xuICAgIHRoaXMubG9nZ2VyID0gY29uY3JldGVMb2dnZXIgfHwgY29uc29sZUxvZ2dlcjtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMuZGVidWcgPSBvcHRpb25zLmRlYnVnO1xuICB9XG4gIGxvZygpIHtcbiAgICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IG5ldyBBcnJheShfbGVuKSwgX2tleSA9IDA7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcbiAgICAgIGFyZ3NbX2tleV0gPSBhcmd1bWVudHNbX2tleV07XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmZvcndhcmQoYXJncywgJ2xvZycsICcnLCB0cnVlKTtcbiAgfVxuICB3YXJuKCkge1xuICAgIGZvciAodmFyIF9sZW4yID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IG5ldyBBcnJheShfbGVuMiksIF9rZXkyID0gMDsgX2tleTIgPCBfbGVuMjsgX2tleTIrKykge1xuICAgICAgYXJnc1tfa2V5Ml0gPSBhcmd1bWVudHNbX2tleTJdO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5mb3J3YXJkKGFyZ3MsICd3YXJuJywgJycsIHRydWUpO1xuICB9XG4gIGVycm9yKCkge1xuICAgIGZvciAodmFyIF9sZW4zID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IG5ldyBBcnJheShfbGVuMyksIF9rZXkzID0gMDsgX2tleTMgPCBfbGVuMzsgX2tleTMrKykge1xuICAgICAgYXJnc1tfa2V5M10gPSBhcmd1bWVudHNbX2tleTNdO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5mb3J3YXJkKGFyZ3MsICdlcnJvcicsICcnKTtcbiAgfVxuICBkZXByZWNhdGUoKSB7XG4gICAgZm9yICh2YXIgX2xlbjQgPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gbmV3IEFycmF5KF9sZW40KSwgX2tleTQgPSAwOyBfa2V5NCA8IF9sZW40OyBfa2V5NCsrKSB7XG4gICAgICBhcmdzW19rZXk0XSA9IGFyZ3VtZW50c1tfa2V5NF07XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmZvcndhcmQoYXJncywgJ3dhcm4nLCAnV0FSTklORyBERVBSRUNBVEVEOiAnLCB0cnVlKTtcbiAgfVxuICBmb3J3YXJkKGFyZ3MsIGx2bCwgcHJlZml4LCBkZWJ1Z09ubHkpIHtcbiAgICBpZiAoZGVidWdPbmx5ICYmICF0aGlzLmRlYnVnKSByZXR1cm4gbnVsbDtcbiAgICBpZiAodHlwZW9mIGFyZ3NbMF0gPT09ICdzdHJpbmcnKSBhcmdzWzBdID0gYCR7cHJlZml4fSR7dGhpcy5wcmVmaXh9ICR7YXJnc1swXX1gO1xuICAgIHJldHVybiB0aGlzLmxvZ2dlcltsdmxdKGFyZ3MpO1xuICB9XG4gIGNyZWF0ZShtb2R1bGVOYW1lKSB7XG4gICAgcmV0dXJuIG5ldyBMb2dnZXIodGhpcy5sb2dnZXIsIHtcbiAgICAgIC4uLntcbiAgICAgICAgcHJlZml4OiBgJHt0aGlzLnByZWZpeH06JHttb2R1bGVOYW1lfTpgXG4gICAgICB9LFxuICAgICAgLi4udGhpcy5vcHRpb25zXG4gICAgfSk7XG4gIH1cbiAgY2xvbmUob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHRoaXMub3B0aW9ucztcbiAgICBvcHRpb25zLnByZWZpeCA9IG9wdGlvbnMucHJlZml4IHx8IHRoaXMucHJlZml4O1xuICAgIHJldHVybiBuZXcgTG9nZ2VyKHRoaXMubG9nZ2VyLCBvcHRpb25zKTtcbiAgfVxufVxudmFyIGJhc2VMb2dnZXIgPSBuZXcgTG9nZ2VyKCk7XG5cbmNsYXNzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMub2JzZXJ2ZXJzID0ge307XG4gIH1cbiAgb24oZXZlbnRzLCBsaXN0ZW5lcikge1xuICAgIGV2ZW50cy5zcGxpdCgnICcpLmZvckVhY2goZXZlbnQgPT4ge1xuICAgICAgaWYgKCF0aGlzLm9ic2VydmVyc1tldmVudF0pIHRoaXMub2JzZXJ2ZXJzW2V2ZW50XSA9IG5ldyBNYXAoKTtcbiAgICAgIGNvbnN0IG51bUxpc3RlbmVycyA9IHRoaXMub2JzZXJ2ZXJzW2V2ZW50XS5nZXQobGlzdGVuZXIpIHx8IDA7XG4gICAgICB0aGlzLm9ic2VydmVyc1tldmVudF0uc2V0KGxpc3RlbmVyLCBudW1MaXN0ZW5lcnMgKyAxKTtcbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBvZmYoZXZlbnQsIGxpc3RlbmVyKSB7XG4gICAgaWYgKCF0aGlzLm9ic2VydmVyc1tldmVudF0pIHJldHVybjtcbiAgICBpZiAoIWxpc3RlbmVyKSB7XG4gICAgICBkZWxldGUgdGhpcy5vYnNlcnZlcnNbZXZlbnRdO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLm9ic2VydmVyc1tldmVudF0uZGVsZXRlKGxpc3RlbmVyKTtcbiAgfVxuICBlbWl0KGV2ZW50KSB7XG4gICAgZm9yICh2YXIgX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBuZXcgQXJyYXkoX2xlbiA+IDEgPyBfbGVuIC0gMSA6IDApLCBfa2V5ID0gMTsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgICAgYXJnc1tfa2V5IC0gMV0gPSBhcmd1bWVudHNbX2tleV07XG4gICAgfVxuICAgIGlmICh0aGlzLm9ic2VydmVyc1tldmVudF0pIHtcbiAgICAgIGNvbnN0IGNsb25lZCA9IEFycmF5LmZyb20odGhpcy5vYnNlcnZlcnNbZXZlbnRdLmVudHJpZXMoKSk7XG4gICAgICBjbG9uZWQuZm9yRWFjaChfcmVmID0+IHtcbiAgICAgICAgbGV0IFtvYnNlcnZlciwgbnVtVGltZXNBZGRlZF0gPSBfcmVmO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVRpbWVzQWRkZWQ7IGkrKykge1xuICAgICAgICAgIG9ic2VydmVyKC4uLmFyZ3MpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKHRoaXMub2JzZXJ2ZXJzWycqJ10pIHtcbiAgICAgIGNvbnN0IGNsb25lZCA9IEFycmF5LmZyb20odGhpcy5vYnNlcnZlcnNbJyonXS5lbnRyaWVzKCkpO1xuICAgICAgY2xvbmVkLmZvckVhY2goX3JlZjIgPT4ge1xuICAgICAgICBsZXQgW29ic2VydmVyLCBudW1UaW1lc0FkZGVkXSA9IF9yZWYyO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVRpbWVzQWRkZWQ7IGkrKykge1xuICAgICAgICAgIG9ic2VydmVyLmFwcGx5KG9ic2VydmVyLCBbZXZlbnQsIC4uLmFyZ3NdKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG59XG5cbmNvbnN0IGRlZmVyID0gKCkgPT4ge1xuICBsZXQgcmVzO1xuICBsZXQgcmVqO1xuICBjb25zdCBwcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIHJlcyA9IHJlc29sdmU7XG4gICAgcmVqID0gcmVqZWN0O1xuICB9KTtcbiAgcHJvbWlzZS5yZXNvbHZlID0gcmVzO1xuICBwcm9taXNlLnJlamVjdCA9IHJlajtcbiAgcmV0dXJuIHByb21pc2U7XG59O1xuY29uc3QgbWFrZVN0cmluZyA9IG9iamVjdCA9PiB7XG4gIGlmIChvYmplY3QgPT0gbnVsbCkgcmV0dXJuICcnO1xuICByZXR1cm4gJycgKyBvYmplY3Q7XG59O1xuY29uc3QgY29weSA9IChhLCBzLCB0KSA9PiB7XG4gIGEuZm9yRWFjaChtID0+IHtcbiAgICBpZiAoc1ttXSkgdFttXSA9IHNbbV07XG4gIH0pO1xufTtcbmNvbnN0IGxhc3RPZlBhdGhTZXBhcmF0b3JSZWdFeHAgPSAvIyMjL2c7XG5jb25zdCBjbGVhbktleSA9IGtleSA9PiBrZXkgJiYga2V5LmluZGV4T2YoJyMjIycpID4gLTEgPyBrZXkucmVwbGFjZShsYXN0T2ZQYXRoU2VwYXJhdG9yUmVnRXhwLCAnLicpIDoga2V5O1xuY29uc3QgY2FuTm90VHJhdmVyc2VEZWVwZXIgPSBvYmplY3QgPT4gIW9iamVjdCB8fCB0eXBlb2Ygb2JqZWN0ID09PSAnc3RyaW5nJztcbmNvbnN0IGdldExhc3RPZlBhdGggPSAob2JqZWN0LCBwYXRoLCBFbXB0eSkgPT4ge1xuICBjb25zdCBzdGFjayA9IHR5cGVvZiBwYXRoICE9PSAnc3RyaW5nJyA/IHBhdGggOiBwYXRoLnNwbGl0KCcuJyk7XG4gIGxldCBzdGFja0luZGV4ID0gMDtcbiAgd2hpbGUgKHN0YWNrSW5kZXggPCBzdGFjay5sZW5ndGggLSAxKSB7XG4gICAgaWYgKGNhbk5vdFRyYXZlcnNlRGVlcGVyKG9iamVjdCkpIHJldHVybiB7fTtcbiAgICBjb25zdCBrZXkgPSBjbGVhbktleShzdGFja1tzdGFja0luZGV4XSk7XG4gICAgaWYgKCFvYmplY3Rba2V5XSAmJiBFbXB0eSkgb2JqZWN0W2tleV0gPSBuZXcgRW1wdHkoKTtcbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwga2V5KSkge1xuICAgICAgb2JqZWN0ID0gb2JqZWN0W2tleV07XG4gICAgfSBlbHNlIHtcbiAgICAgIG9iamVjdCA9IHt9O1xuICAgIH1cbiAgICArK3N0YWNrSW5kZXg7XG4gIH1cbiAgaWYgKGNhbk5vdFRyYXZlcnNlRGVlcGVyKG9iamVjdCkpIHJldHVybiB7fTtcbiAgcmV0dXJuIHtcbiAgICBvYmo6IG9iamVjdCxcbiAgICBrOiBjbGVhbktleShzdGFja1tzdGFja0luZGV4XSlcbiAgfTtcbn07XG5jb25zdCBzZXRQYXRoID0gKG9iamVjdCwgcGF0aCwgbmV3VmFsdWUpID0+IHtcbiAgY29uc3Qge1xuICAgIG9iaixcbiAgICBrXG4gIH0gPSBnZXRMYXN0T2ZQYXRoKG9iamVjdCwgcGF0aCwgT2JqZWN0KTtcbiAgaWYgKG9iaiAhPT0gdW5kZWZpbmVkIHx8IHBhdGgubGVuZ3RoID09PSAxKSB7XG4gICAgb2JqW2tdID0gbmV3VmFsdWU7XG4gICAgcmV0dXJuO1xuICB9XG4gIGxldCBlID0gcGF0aFtwYXRoLmxlbmd0aCAtIDFdO1xuICBsZXQgcCA9IHBhdGguc2xpY2UoMCwgcGF0aC5sZW5ndGggLSAxKTtcbiAgbGV0IGxhc3QgPSBnZXRMYXN0T2ZQYXRoKG9iamVjdCwgcCwgT2JqZWN0KTtcbiAgd2hpbGUgKGxhc3Qub2JqID09PSB1bmRlZmluZWQgJiYgcC5sZW5ndGgpIHtcbiAgICBlID0gYCR7cFtwLmxlbmd0aCAtIDFdfS4ke2V9YDtcbiAgICBwID0gcC5zbGljZSgwLCBwLmxlbmd0aCAtIDEpO1xuICAgIGxhc3QgPSBnZXRMYXN0T2ZQYXRoKG9iamVjdCwgcCwgT2JqZWN0KTtcbiAgICBpZiAobGFzdCAmJiBsYXN0Lm9iaiAmJiB0eXBlb2YgbGFzdC5vYmpbYCR7bGFzdC5rfS4ke2V9YF0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBsYXN0Lm9iaiA9IHVuZGVmaW5lZDtcbiAgICB9XG4gIH1cbiAgbGFzdC5vYmpbYCR7bGFzdC5rfS4ke2V9YF0gPSBuZXdWYWx1ZTtcbn07XG5jb25zdCBwdXNoUGF0aCA9IChvYmplY3QsIHBhdGgsIG5ld1ZhbHVlLCBjb25jYXQpID0+IHtcbiAgY29uc3Qge1xuICAgIG9iaixcbiAgICBrXG4gIH0gPSBnZXRMYXN0T2ZQYXRoKG9iamVjdCwgcGF0aCwgT2JqZWN0KTtcbiAgb2JqW2tdID0gb2JqW2tdIHx8IFtdO1xuICBvYmpba10ucHVzaChuZXdWYWx1ZSk7XG59O1xuY29uc3QgZ2V0UGF0aCA9IChvYmplY3QsIHBhdGgpID0+IHtcbiAgY29uc3Qge1xuICAgIG9iaixcbiAgICBrXG4gIH0gPSBnZXRMYXN0T2ZQYXRoKG9iamVjdCwgcGF0aCk7XG4gIGlmICghb2JqKSByZXR1cm4gdW5kZWZpbmVkO1xuICByZXR1cm4gb2JqW2tdO1xufTtcbmNvbnN0IGdldFBhdGhXaXRoRGVmYXVsdHMgPSAoZGF0YSwgZGVmYXVsdERhdGEsIGtleSkgPT4ge1xuICBjb25zdCB2YWx1ZSA9IGdldFBhdGgoZGF0YSwga2V5KTtcbiAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbiAgcmV0dXJuIGdldFBhdGgoZGVmYXVsdERhdGEsIGtleSk7XG59O1xuY29uc3QgZGVlcEV4dGVuZCA9ICh0YXJnZXQsIHNvdXJjZSwgb3ZlcndyaXRlKSA9PiB7XG4gIGZvciAoY29uc3QgcHJvcCBpbiBzb3VyY2UpIHtcbiAgICBpZiAocHJvcCAhPT0gJ19fcHJvdG9fXycgJiYgcHJvcCAhPT0gJ2NvbnN0cnVjdG9yJykge1xuICAgICAgaWYgKHByb3AgaW4gdGFyZ2V0KSB7XG4gICAgICAgIGlmICh0eXBlb2YgdGFyZ2V0W3Byb3BdID09PSAnc3RyaW5nJyB8fCB0YXJnZXRbcHJvcF0gaW5zdGFuY2VvZiBTdHJpbmcgfHwgdHlwZW9mIHNvdXJjZVtwcm9wXSA9PT0gJ3N0cmluZycgfHwgc291cmNlW3Byb3BdIGluc3RhbmNlb2YgU3RyaW5nKSB7XG4gICAgICAgICAgaWYgKG92ZXJ3cml0ZSkgdGFyZ2V0W3Byb3BdID0gc291cmNlW3Byb3BdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRlZXBFeHRlbmQodGFyZ2V0W3Byb3BdLCBzb3VyY2VbcHJvcF0sIG92ZXJ3cml0ZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRhcmdldFtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRhcmdldDtcbn07XG5jb25zdCByZWdleEVzY2FwZSA9IHN0ciA9PiBzdHIucmVwbGFjZSgvW1xcLVxcW1xcXVxcL1xce1xcfVxcKFxcKVxcKlxcK1xcP1xcLlxcXFxcXF5cXCRcXHxdL2csICdcXFxcJCYnKTtcbnZhciBfZW50aXR5TWFwID0ge1xuICAnJic6ICcmYW1wOycsXG4gICc8JzogJyZsdDsnLFxuICAnPic6ICcmZ3Q7JyxcbiAgJ1wiJzogJyZxdW90OycsXG4gIFwiJ1wiOiAnJiMzOTsnLFxuICAnLyc6ICcmI3gyRjsnXG59O1xuY29uc3QgZXNjYXBlID0gZGF0YSA9PiB7XG4gIGlmICh0eXBlb2YgZGF0YSA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gZGF0YS5yZXBsYWNlKC9bJjw+XCInXFwvXS9nLCBzID0+IF9lbnRpdHlNYXBbc10pO1xuICB9XG4gIHJldHVybiBkYXRhO1xufTtcbmNsYXNzIFJlZ0V4cENhY2hlIHtcbiAgY29uc3RydWN0b3IoY2FwYWNpdHkpIHtcbiAgICB0aGlzLmNhcGFjaXR5ID0gY2FwYWNpdHk7XG4gICAgdGhpcy5yZWdFeHBNYXAgPSBuZXcgTWFwKCk7XG4gICAgdGhpcy5yZWdFeHBRdWV1ZSA9IFtdO1xuICB9XG4gIGdldFJlZ0V4cChwYXR0ZXJuKSB7XG4gICAgY29uc3QgcmVnRXhwRnJvbUNhY2hlID0gdGhpcy5yZWdFeHBNYXAuZ2V0KHBhdHRlcm4pO1xuICAgIGlmIChyZWdFeHBGcm9tQ2FjaGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHJlZ0V4cEZyb21DYWNoZTtcbiAgICB9XG4gICAgY29uc3QgcmVnRXhwTmV3ID0gbmV3IFJlZ0V4cChwYXR0ZXJuKTtcbiAgICBpZiAodGhpcy5yZWdFeHBRdWV1ZS5sZW5ndGggPT09IHRoaXMuY2FwYWNpdHkpIHtcbiAgICAgIHRoaXMucmVnRXhwTWFwLmRlbGV0ZSh0aGlzLnJlZ0V4cFF1ZXVlLnNoaWZ0KCkpO1xuICAgIH1cbiAgICB0aGlzLnJlZ0V4cE1hcC5zZXQocGF0dGVybiwgcmVnRXhwTmV3KTtcbiAgICB0aGlzLnJlZ0V4cFF1ZXVlLnB1c2gocGF0dGVybik7XG4gICAgcmV0dXJuIHJlZ0V4cE5ldztcbiAgfVxufVxuY29uc3QgY2hhcnMgPSBbJyAnLCAnLCcsICc/JywgJyEnLCAnOyddO1xuY29uc3QgbG9va3NMaWtlT2JqZWN0UGF0aFJlZ0V4cENhY2hlID0gbmV3IFJlZ0V4cENhY2hlKDIwKTtcbmNvbnN0IGxvb2tzTGlrZU9iamVjdFBhdGggPSAoa2V5LCBuc1NlcGFyYXRvciwga2V5U2VwYXJhdG9yKSA9PiB7XG4gIG5zU2VwYXJhdG9yID0gbnNTZXBhcmF0b3IgfHwgJyc7XG4gIGtleVNlcGFyYXRvciA9IGtleVNlcGFyYXRvciB8fCAnJztcbiAgY29uc3QgcG9zc2libGVDaGFycyA9IGNoYXJzLmZpbHRlcihjID0+IG5zU2VwYXJhdG9yLmluZGV4T2YoYykgPCAwICYmIGtleVNlcGFyYXRvci5pbmRleE9mKGMpIDwgMCk7XG4gIGlmIChwb3NzaWJsZUNoYXJzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHRydWU7XG4gIGNvbnN0IHIgPSBsb29rc0xpa2VPYmplY3RQYXRoUmVnRXhwQ2FjaGUuZ2V0UmVnRXhwKGAoJHtwb3NzaWJsZUNoYXJzLm1hcChjID0+IGMgPT09ICc/JyA/ICdcXFxcPycgOiBjKS5qb2luKCd8Jyl9KWApO1xuICBsZXQgbWF0Y2hlZCA9ICFyLnRlc3Qoa2V5KTtcbiAgaWYgKCFtYXRjaGVkKSB7XG4gICAgY29uc3Qga2kgPSBrZXkuaW5kZXhPZihrZXlTZXBhcmF0b3IpO1xuICAgIGlmIChraSA+IDAgJiYgIXIudGVzdChrZXkuc3Vic3RyaW5nKDAsIGtpKSkpIHtcbiAgICAgIG1hdGNoZWQgPSB0cnVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbWF0Y2hlZDtcbn07XG5jb25zdCBkZWVwRmluZCA9IGZ1bmN0aW9uIChvYmosIHBhdGgpIHtcbiAgbGV0IGtleVNlcGFyYXRvciA9IGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzJdIDogJy4nO1xuICBpZiAoIW9iaikgcmV0dXJuIHVuZGVmaW5lZDtcbiAgaWYgKG9ialtwYXRoXSkgcmV0dXJuIG9ialtwYXRoXTtcbiAgY29uc3QgdG9rZW5zID0gcGF0aC5zcGxpdChrZXlTZXBhcmF0b3IpO1xuICBsZXQgY3VycmVudCA9IG9iajtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOykge1xuICAgIGlmICghY3VycmVudCB8fCB0eXBlb2YgY3VycmVudCAhPT0gJ29iamVjdCcpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGxldCBuZXh0O1xuICAgIGxldCBuZXh0UGF0aCA9ICcnO1xuICAgIGZvciAobGV0IGogPSBpOyBqIDwgdG9rZW5zLmxlbmd0aDsgKytqKSB7XG4gICAgICBpZiAoaiAhPT0gaSkge1xuICAgICAgICBuZXh0UGF0aCArPSBrZXlTZXBhcmF0b3I7XG4gICAgICB9XG4gICAgICBuZXh0UGF0aCArPSB0b2tlbnNbal07XG4gICAgICBuZXh0ID0gY3VycmVudFtuZXh0UGF0aF07XG4gICAgICBpZiAobmV4dCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmIChbJ3N0cmluZycsICdudW1iZXInLCAnYm9vbGVhbiddLmluZGV4T2YodHlwZW9mIG5leHQpID4gLTEgJiYgaiA8IHRva2Vucy5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaSArPSBqIC0gaSArIDE7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBjdXJyZW50ID0gbmV4dDtcbiAgfVxuICByZXR1cm4gY3VycmVudDtcbn07XG5jb25zdCBnZXRDbGVhbmVkQ29kZSA9IGNvZGUgPT4ge1xuICBpZiAoY29kZSAmJiBjb2RlLmluZGV4T2YoJ18nKSA+IDApIHJldHVybiBjb2RlLnJlcGxhY2UoJ18nLCAnLScpO1xuICByZXR1cm4gY29kZTtcbn07XG5cbmNsYXNzIFJlc291cmNlU3RvcmUgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICBjb25zdHJ1Y3RvcihkYXRhKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IHtcbiAgICAgIG5zOiBbJ3RyYW5zbGF0aW9uJ10sXG4gICAgICBkZWZhdWx0TlM6ICd0cmFuc2xhdGlvbidcbiAgICB9O1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5kYXRhID0gZGF0YSB8fCB7fTtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIGlmICh0aGlzLm9wdGlvbnMua2V5U2VwYXJhdG9yID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5rZXlTZXBhcmF0b3IgPSAnLic7XG4gICAgfVxuICAgIGlmICh0aGlzLm9wdGlvbnMuaWdub3JlSlNPTlN0cnVjdHVyZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLm9wdGlvbnMuaWdub3JlSlNPTlN0cnVjdHVyZSA9IHRydWU7XG4gICAgfVxuICB9XG4gIGFkZE5hbWVzcGFjZXMobnMpIHtcbiAgICBpZiAodGhpcy5vcHRpb25zLm5zLmluZGV4T2YobnMpIDwgMCkge1xuICAgICAgdGhpcy5vcHRpb25zLm5zLnB1c2gobnMpO1xuICAgIH1cbiAgfVxuICByZW1vdmVOYW1lc3BhY2VzKG5zKSB7XG4gICAgY29uc3QgaW5kZXggPSB0aGlzLm9wdGlvbnMubnMuaW5kZXhPZihucyk7XG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5ucy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgfVxuICBnZXRSZXNvdXJjZShsbmcsIG5zLCBrZXkpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAzICYmIGFyZ3VtZW50c1szXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzNdIDoge307XG4gICAgY29uc3Qga2V5U2VwYXJhdG9yID0gb3B0aW9ucy5rZXlTZXBhcmF0b3IgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMua2V5U2VwYXJhdG9yIDogdGhpcy5vcHRpb25zLmtleVNlcGFyYXRvcjtcbiAgICBjb25zdCBpZ25vcmVKU09OU3RydWN0dXJlID0gb3B0aW9ucy5pZ25vcmVKU09OU3RydWN0dXJlICE9PSB1bmRlZmluZWQgPyBvcHRpb25zLmlnbm9yZUpTT05TdHJ1Y3R1cmUgOiB0aGlzLm9wdGlvbnMuaWdub3JlSlNPTlN0cnVjdHVyZTtcbiAgICBsZXQgcGF0aDtcbiAgICBpZiAobG5nLmluZGV4T2YoJy4nKSA+IC0xKSB7XG4gICAgICBwYXRoID0gbG5nLnNwbGl0KCcuJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBhdGggPSBbbG5nLCBuc107XG4gICAgICBpZiAoa2V5KSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGtleSkpIHtcbiAgICAgICAgICBwYXRoLnB1c2goLi4ua2V5KTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Yga2V5ID09PSAnc3RyaW5nJyAmJiBrZXlTZXBhcmF0b3IpIHtcbiAgICAgICAgICBwYXRoLnB1c2goLi4ua2V5LnNwbGl0KGtleVNlcGFyYXRvcikpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBhdGgucHVzaChrZXkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IHJlc3VsdCA9IGdldFBhdGgodGhpcy5kYXRhLCBwYXRoKTtcbiAgICBpZiAoIXJlc3VsdCAmJiAhbnMgJiYgIWtleSAmJiBsbmcuaW5kZXhPZignLicpID4gLTEpIHtcbiAgICAgIGxuZyA9IHBhdGhbMF07XG4gICAgICBucyA9IHBhdGhbMV07XG4gICAgICBrZXkgPSBwYXRoLnNsaWNlKDIpLmpvaW4oJy4nKTtcbiAgICB9XG4gICAgaWYgKHJlc3VsdCB8fCAhaWdub3JlSlNPTlN0cnVjdHVyZSB8fCB0eXBlb2Yga2V5ICE9PSAnc3RyaW5nJykgcmV0dXJuIHJlc3VsdDtcbiAgICByZXR1cm4gZGVlcEZpbmQodGhpcy5kYXRhICYmIHRoaXMuZGF0YVtsbmddICYmIHRoaXMuZGF0YVtsbmddW25zXSwga2V5LCBrZXlTZXBhcmF0b3IpO1xuICB9XG4gIGFkZFJlc291cmNlKGxuZywgbnMsIGtleSwgdmFsdWUpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiA0ICYmIGFyZ3VtZW50c1s0XSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzRdIDoge1xuICAgICAgc2lsZW50OiBmYWxzZVxuICAgIH07XG4gICAgY29uc3Qga2V5U2VwYXJhdG9yID0gb3B0aW9ucy5rZXlTZXBhcmF0b3IgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMua2V5U2VwYXJhdG9yIDogdGhpcy5vcHRpb25zLmtleVNlcGFyYXRvcjtcbiAgICBsZXQgcGF0aCA9IFtsbmcsIG5zXTtcbiAgICBpZiAoa2V5KSBwYXRoID0gcGF0aC5jb25jYXQoa2V5U2VwYXJhdG9yID8ga2V5LnNwbGl0KGtleVNlcGFyYXRvcikgOiBrZXkpO1xuICAgIGlmIChsbmcuaW5kZXhPZignLicpID4gLTEpIHtcbiAgICAgIHBhdGggPSBsbmcuc3BsaXQoJy4nKTtcbiAgICAgIHZhbHVlID0gbnM7XG4gICAgICBucyA9IHBhdGhbMV07XG4gICAgfVxuICAgIHRoaXMuYWRkTmFtZXNwYWNlcyhucyk7XG4gICAgc2V0UGF0aCh0aGlzLmRhdGEsIHBhdGgsIHZhbHVlKTtcbiAgICBpZiAoIW9wdGlvbnMuc2lsZW50KSB0aGlzLmVtaXQoJ2FkZGVkJywgbG5nLCBucywga2V5LCB2YWx1ZSk7XG4gIH1cbiAgYWRkUmVzb3VyY2VzKGxuZywgbnMsIHJlc291cmNlcykge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDMgJiYgYXJndW1lbnRzWzNdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbM10gOiB7XG4gICAgICBzaWxlbnQ6IGZhbHNlXG4gICAgfTtcbiAgICBmb3IgKGNvbnN0IG0gaW4gcmVzb3VyY2VzKSB7XG4gICAgICBpZiAodHlwZW9mIHJlc291cmNlc1ttXSA9PT0gJ3N0cmluZycgfHwgQXJyYXkuaXNBcnJheShyZXNvdXJjZXNbbV0pKSB0aGlzLmFkZFJlc291cmNlKGxuZywgbnMsIG0sIHJlc291cmNlc1ttXSwge1xuICAgICAgICBzaWxlbnQ6IHRydWVcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAoIW9wdGlvbnMuc2lsZW50KSB0aGlzLmVtaXQoJ2FkZGVkJywgbG5nLCBucywgcmVzb3VyY2VzKTtcbiAgfVxuICBhZGRSZXNvdXJjZUJ1bmRsZShsbmcsIG5zLCByZXNvdXJjZXMsIGRlZXAsIG92ZXJ3cml0ZSkge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDUgJiYgYXJndW1lbnRzWzVdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbNV0gOiB7XG4gICAgICBzaWxlbnQ6IGZhbHNlLFxuICAgICAgc2tpcENvcHk6IGZhbHNlXG4gICAgfTtcbiAgICBsZXQgcGF0aCA9IFtsbmcsIG5zXTtcbiAgICBpZiAobG5nLmluZGV4T2YoJy4nKSA+IC0xKSB7XG4gICAgICBwYXRoID0gbG5nLnNwbGl0KCcuJyk7XG4gICAgICBkZWVwID0gcmVzb3VyY2VzO1xuICAgICAgcmVzb3VyY2VzID0gbnM7XG4gICAgICBucyA9IHBhdGhbMV07XG4gICAgfVxuICAgIHRoaXMuYWRkTmFtZXNwYWNlcyhucyk7XG4gICAgbGV0IHBhY2sgPSBnZXRQYXRoKHRoaXMuZGF0YSwgcGF0aCkgfHwge307XG4gICAgaWYgKCFvcHRpb25zLnNraXBDb3B5KSByZXNvdXJjZXMgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHJlc291cmNlcykpO1xuICAgIGlmIChkZWVwKSB7XG4gICAgICBkZWVwRXh0ZW5kKHBhY2ssIHJlc291cmNlcywgb3ZlcndyaXRlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcGFjayA9IHtcbiAgICAgICAgLi4ucGFjayxcbiAgICAgICAgLi4ucmVzb3VyY2VzXG4gICAgICB9O1xuICAgIH1cbiAgICBzZXRQYXRoKHRoaXMuZGF0YSwgcGF0aCwgcGFjayk7XG4gICAgaWYgKCFvcHRpb25zLnNpbGVudCkgdGhpcy5lbWl0KCdhZGRlZCcsIGxuZywgbnMsIHJlc291cmNlcyk7XG4gIH1cbiAgcmVtb3ZlUmVzb3VyY2VCdW5kbGUobG5nLCBucykge1xuICAgIGlmICh0aGlzLmhhc1Jlc291cmNlQnVuZGxlKGxuZywgbnMpKSB7XG4gICAgICBkZWxldGUgdGhpcy5kYXRhW2xuZ11bbnNdO1xuICAgIH1cbiAgICB0aGlzLnJlbW92ZU5hbWVzcGFjZXMobnMpO1xuICAgIHRoaXMuZW1pdCgncmVtb3ZlZCcsIGxuZywgbnMpO1xuICB9XG4gIGhhc1Jlc291cmNlQnVuZGxlKGxuZywgbnMpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRSZXNvdXJjZShsbmcsIG5zKSAhPT0gdW5kZWZpbmVkO1xuICB9XG4gIGdldFJlc291cmNlQnVuZGxlKGxuZywgbnMpIHtcbiAgICBpZiAoIW5zKSBucyA9IHRoaXMub3B0aW9ucy5kZWZhdWx0TlM7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5jb21wYXRpYmlsaXR5QVBJID09PSAndjEnKSByZXR1cm4ge1xuICAgICAgLi4ue30sXG4gICAgICAuLi50aGlzLmdldFJlc291cmNlKGxuZywgbnMpXG4gICAgfTtcbiAgICByZXR1cm4gdGhpcy5nZXRSZXNvdXJjZShsbmcsIG5zKTtcbiAgfVxuICBnZXREYXRhQnlMYW5ndWFnZShsbmcpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhW2xuZ107XG4gIH1cbiAgaGFzTGFuZ3VhZ2VTb21lVHJhbnNsYXRpb25zKGxuZykge1xuICAgIGNvbnN0IGRhdGEgPSB0aGlzLmdldERhdGFCeUxhbmd1YWdlKGxuZyk7XG4gICAgY29uc3QgbiA9IGRhdGEgJiYgT2JqZWN0LmtleXMoZGF0YSkgfHwgW107XG4gICAgcmV0dXJuICEhbi5maW5kKHYgPT4gZGF0YVt2XSAmJiBPYmplY3Qua2V5cyhkYXRhW3ZdKS5sZW5ndGggPiAwKTtcbiAgfVxuICB0b0pTT04oKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YTtcbiAgfVxufVxuXG52YXIgcG9zdFByb2Nlc3NvciA9IHtcbiAgcHJvY2Vzc29yczoge30sXG4gIGFkZFBvc3RQcm9jZXNzb3IobW9kdWxlKSB7XG4gICAgdGhpcy5wcm9jZXNzb3JzW21vZHVsZS5uYW1lXSA9IG1vZHVsZTtcbiAgfSxcbiAgaGFuZGxlKHByb2Nlc3NvcnMsIHZhbHVlLCBrZXksIG9wdGlvbnMsIHRyYW5zbGF0b3IpIHtcbiAgICBwcm9jZXNzb3JzLmZvckVhY2gocHJvY2Vzc29yID0+IHtcbiAgICAgIGlmICh0aGlzLnByb2Nlc3NvcnNbcHJvY2Vzc29yXSkgdmFsdWUgPSB0aGlzLnByb2Nlc3NvcnNbcHJvY2Vzc29yXS5wcm9jZXNzKHZhbHVlLCBrZXksIG9wdGlvbnMsIHRyYW5zbGF0b3IpO1xuICAgIH0pO1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxufTtcblxuY29uc3QgY2hlY2tlZExvYWRlZEZvciA9IHt9O1xuY2xhc3MgVHJhbnNsYXRvciBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yKHNlcnZpY2VzKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IHt9O1xuICAgIHN1cGVyKCk7XG4gICAgY29weShbJ3Jlc291cmNlU3RvcmUnLCAnbGFuZ3VhZ2VVdGlscycsICdwbHVyYWxSZXNvbHZlcicsICdpbnRlcnBvbGF0b3InLCAnYmFja2VuZENvbm5lY3RvcicsICdpMThuRm9ybWF0JywgJ3V0aWxzJ10sIHNlcnZpY2VzLCB0aGlzKTtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIGlmICh0aGlzLm9wdGlvbnMua2V5U2VwYXJhdG9yID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5rZXlTZXBhcmF0b3IgPSAnLic7XG4gICAgfVxuICAgIHRoaXMubG9nZ2VyID0gYmFzZUxvZ2dlci5jcmVhdGUoJ3RyYW5zbGF0b3InKTtcbiAgfVxuICBjaGFuZ2VMYW5ndWFnZShsbmcpIHtcbiAgICBpZiAobG5nKSB0aGlzLmxhbmd1YWdlID0gbG5nO1xuICB9XG4gIGV4aXN0cyhrZXkpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge1xuICAgICAgaW50ZXJwb2xhdGlvbjoge31cbiAgICB9O1xuICAgIGlmIChrZXkgPT09IHVuZGVmaW5lZCB8fCBrZXkgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3QgcmVzb2x2ZWQgPSB0aGlzLnJlc29sdmUoa2V5LCBvcHRpb25zKTtcbiAgICByZXR1cm4gcmVzb2x2ZWQgJiYgcmVzb2x2ZWQucmVzICE9PSB1bmRlZmluZWQ7XG4gIH1cbiAgZXh0cmFjdEZyb21LZXkoa2V5LCBvcHRpb25zKSB7XG4gICAgbGV0IG5zU2VwYXJhdG9yID0gb3B0aW9ucy5uc1NlcGFyYXRvciAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy5uc1NlcGFyYXRvciA6IHRoaXMub3B0aW9ucy5uc1NlcGFyYXRvcjtcbiAgICBpZiAobnNTZXBhcmF0b3IgPT09IHVuZGVmaW5lZCkgbnNTZXBhcmF0b3IgPSAnOic7XG4gICAgY29uc3Qga2V5U2VwYXJhdG9yID0gb3B0aW9ucy5rZXlTZXBhcmF0b3IgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMua2V5U2VwYXJhdG9yIDogdGhpcy5vcHRpb25zLmtleVNlcGFyYXRvcjtcbiAgICBsZXQgbmFtZXNwYWNlcyA9IG9wdGlvbnMubnMgfHwgdGhpcy5vcHRpb25zLmRlZmF1bHROUyB8fCBbXTtcbiAgICBjb25zdCB3b3VsZENoZWNrRm9yTnNJbktleSA9IG5zU2VwYXJhdG9yICYmIGtleS5pbmRleE9mKG5zU2VwYXJhdG9yKSA+IC0xO1xuICAgIGNvbnN0IHNlZW1zTmF0dXJhbExhbmd1YWdlID0gIXRoaXMub3B0aW9ucy51c2VyRGVmaW5lZEtleVNlcGFyYXRvciAmJiAhb3B0aW9ucy5rZXlTZXBhcmF0b3IgJiYgIXRoaXMub3B0aW9ucy51c2VyRGVmaW5lZE5zU2VwYXJhdG9yICYmICFvcHRpb25zLm5zU2VwYXJhdG9yICYmICFsb29rc0xpa2VPYmplY3RQYXRoKGtleSwgbnNTZXBhcmF0b3IsIGtleVNlcGFyYXRvcik7XG4gICAgaWYgKHdvdWxkQ2hlY2tGb3JOc0luS2V5ICYmICFzZWVtc05hdHVyYWxMYW5ndWFnZSkge1xuICAgICAgY29uc3QgbSA9IGtleS5tYXRjaCh0aGlzLmludGVycG9sYXRvci5uZXN0aW5nUmVnZXhwKTtcbiAgICAgIGlmIChtICYmIG0ubGVuZ3RoID4gMCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGtleSxcbiAgICAgICAgICBuYW1lc3BhY2VzXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBjb25zdCBwYXJ0cyA9IGtleS5zcGxpdChuc1NlcGFyYXRvcik7XG4gICAgICBpZiAobnNTZXBhcmF0b3IgIT09IGtleVNlcGFyYXRvciB8fCBuc1NlcGFyYXRvciA9PT0ga2V5U2VwYXJhdG9yICYmIHRoaXMub3B0aW9ucy5ucy5pbmRleE9mKHBhcnRzWzBdKSA+IC0xKSBuYW1lc3BhY2VzID0gcGFydHMuc2hpZnQoKTtcbiAgICAgIGtleSA9IHBhcnRzLmpvaW4oa2V5U2VwYXJhdG9yKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBuYW1lc3BhY2VzID09PSAnc3RyaW5nJykgbmFtZXNwYWNlcyA9IFtuYW1lc3BhY2VzXTtcbiAgICByZXR1cm4ge1xuICAgICAga2V5LFxuICAgICAgbmFtZXNwYWNlc1xuICAgIH07XG4gIH1cbiAgdHJhbnNsYXRlKGtleXMsIG9wdGlvbnMsIGxhc3RLZXkpIHtcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMgIT09ICdvYmplY3QnICYmIHRoaXMub3B0aW9ucy5vdmVybG9hZFRyYW5zbGF0aW9uT3B0aW9uSGFuZGxlcikge1xuICAgICAgb3B0aW9ucyA9IHRoaXMub3B0aW9ucy5vdmVybG9hZFRyYW5zbGF0aW9uT3B0aW9uSGFuZGxlcihhcmd1bWVudHMpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdvYmplY3QnKSBvcHRpb25zID0ge1xuICAgICAgLi4ub3B0aW9uc1xuICAgIH07XG4gICAgaWYgKCFvcHRpb25zKSBvcHRpb25zID0ge307XG4gICAgaWYgKGtleXMgPT09IHVuZGVmaW5lZCB8fCBrZXlzID09PSBudWxsKSByZXR1cm4gJyc7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGtleXMpKSBrZXlzID0gW1N0cmluZyhrZXlzKV07XG4gICAgY29uc3QgcmV0dXJuRGV0YWlscyA9IG9wdGlvbnMucmV0dXJuRGV0YWlscyAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy5yZXR1cm5EZXRhaWxzIDogdGhpcy5vcHRpb25zLnJldHVybkRldGFpbHM7XG4gICAgY29uc3Qga2V5U2VwYXJhdG9yID0gb3B0aW9ucy5rZXlTZXBhcmF0b3IgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMua2V5U2VwYXJhdG9yIDogdGhpcy5vcHRpb25zLmtleVNlcGFyYXRvcjtcbiAgICBjb25zdCB7XG4gICAgICBrZXksXG4gICAgICBuYW1lc3BhY2VzXG4gICAgfSA9IHRoaXMuZXh0cmFjdEZyb21LZXkoa2V5c1trZXlzLmxlbmd0aCAtIDFdLCBvcHRpb25zKTtcbiAgICBjb25zdCBuYW1lc3BhY2UgPSBuYW1lc3BhY2VzW25hbWVzcGFjZXMubGVuZ3RoIC0gMV07XG4gICAgY29uc3QgbG5nID0gb3B0aW9ucy5sbmcgfHwgdGhpcy5sYW5ndWFnZTtcbiAgICBjb25zdCBhcHBlbmROYW1lc3BhY2VUb0NJTW9kZSA9IG9wdGlvbnMuYXBwZW5kTmFtZXNwYWNlVG9DSU1vZGUgfHwgdGhpcy5vcHRpb25zLmFwcGVuZE5hbWVzcGFjZVRvQ0lNb2RlO1xuICAgIGlmIChsbmcgJiYgbG5nLnRvTG93ZXJDYXNlKCkgPT09ICdjaW1vZGUnKSB7XG4gICAgICBpZiAoYXBwZW5kTmFtZXNwYWNlVG9DSU1vZGUpIHtcbiAgICAgICAgY29uc3QgbnNTZXBhcmF0b3IgPSBvcHRpb25zLm5zU2VwYXJhdG9yIHx8IHRoaXMub3B0aW9ucy5uc1NlcGFyYXRvcjtcbiAgICAgICAgaWYgKHJldHVybkRldGFpbHMpIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzOiBgJHtuYW1lc3BhY2V9JHtuc1NlcGFyYXRvcn0ke2tleX1gLFxuICAgICAgICAgICAgdXNlZEtleToga2V5LFxuICAgICAgICAgICAgZXhhY3RVc2VkS2V5OiBrZXksXG4gICAgICAgICAgICB1c2VkTG5nOiBsbmcsXG4gICAgICAgICAgICB1c2VkTlM6IG5hbWVzcGFjZSxcbiAgICAgICAgICAgIHVzZWRQYXJhbXM6IHRoaXMuZ2V0VXNlZFBhcmFtc0RldGFpbHMob3B0aW9ucylcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBgJHtuYW1lc3BhY2V9JHtuc1NlcGFyYXRvcn0ke2tleX1gO1xuICAgICAgfVxuICAgICAgaWYgKHJldHVybkRldGFpbHMpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICByZXM6IGtleSxcbiAgICAgICAgICB1c2VkS2V5OiBrZXksXG4gICAgICAgICAgZXhhY3RVc2VkS2V5OiBrZXksXG4gICAgICAgICAgdXNlZExuZzogbG5nLFxuICAgICAgICAgIHVzZWROUzogbmFtZXNwYWNlLFxuICAgICAgICAgIHVzZWRQYXJhbXM6IHRoaXMuZ2V0VXNlZFBhcmFtc0RldGFpbHMob3B0aW9ucylcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBrZXk7XG4gICAgfVxuICAgIGNvbnN0IHJlc29sdmVkID0gdGhpcy5yZXNvbHZlKGtleXMsIG9wdGlvbnMpO1xuICAgIGxldCByZXMgPSByZXNvbHZlZCAmJiByZXNvbHZlZC5yZXM7XG4gICAgY29uc3QgcmVzVXNlZEtleSA9IHJlc29sdmVkICYmIHJlc29sdmVkLnVzZWRLZXkgfHwga2V5O1xuICAgIGNvbnN0IHJlc0V4YWN0VXNlZEtleSA9IHJlc29sdmVkICYmIHJlc29sdmVkLmV4YWN0VXNlZEtleSB8fCBrZXk7XG4gICAgY29uc3QgcmVzVHlwZSA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuYXBwbHkocmVzKTtcbiAgICBjb25zdCBub09iamVjdCA9IFsnW29iamVjdCBOdW1iZXJdJywgJ1tvYmplY3QgRnVuY3Rpb25dJywgJ1tvYmplY3QgUmVnRXhwXSddO1xuICAgIGNvbnN0IGpvaW5BcnJheXMgPSBvcHRpb25zLmpvaW5BcnJheXMgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMuam9pbkFycmF5cyA6IHRoaXMub3B0aW9ucy5qb2luQXJyYXlzO1xuICAgIGNvbnN0IGhhbmRsZUFzT2JqZWN0SW5JMThuRm9ybWF0ID0gIXRoaXMuaTE4bkZvcm1hdCB8fCB0aGlzLmkxOG5Gb3JtYXQuaGFuZGxlQXNPYmplY3Q7XG4gICAgY29uc3QgaGFuZGxlQXNPYmplY3QgPSB0eXBlb2YgcmVzICE9PSAnc3RyaW5nJyAmJiB0eXBlb2YgcmVzICE9PSAnYm9vbGVhbicgJiYgdHlwZW9mIHJlcyAhPT0gJ251bWJlcic7XG4gICAgaWYgKGhhbmRsZUFzT2JqZWN0SW5JMThuRm9ybWF0ICYmIHJlcyAmJiBoYW5kbGVBc09iamVjdCAmJiBub09iamVjdC5pbmRleE9mKHJlc1R5cGUpIDwgMCAmJiAhKHR5cGVvZiBqb2luQXJyYXlzID09PSAnc3RyaW5nJyAmJiBBcnJheS5pc0FycmF5KHJlcykpKSB7XG4gICAgICBpZiAoIW9wdGlvbnMucmV0dXJuT2JqZWN0cyAmJiAhdGhpcy5vcHRpb25zLnJldHVybk9iamVjdHMpIHtcbiAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnMucmV0dXJuZWRPYmplY3RIYW5kbGVyKSB7XG4gICAgICAgICAgdGhpcy5sb2dnZXIud2FybignYWNjZXNzaW5nIGFuIG9iamVjdCAtIGJ1dCByZXR1cm5PYmplY3RzIG9wdGlvbnMgaXMgbm90IGVuYWJsZWQhJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgciA9IHRoaXMub3B0aW9ucy5yZXR1cm5lZE9iamVjdEhhbmRsZXIgPyB0aGlzLm9wdGlvbnMucmV0dXJuZWRPYmplY3RIYW5kbGVyKHJlc1VzZWRLZXksIHJlcywge1xuICAgICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgICAgbnM6IG5hbWVzcGFjZXNcbiAgICAgICAgfSkgOiBga2V5ICcke2tleX0gKCR7dGhpcy5sYW5ndWFnZX0pJyByZXR1cm5lZCBhbiBvYmplY3QgaW5zdGVhZCBvZiBzdHJpbmcuYDtcbiAgICAgICAgaWYgKHJldHVybkRldGFpbHMpIHtcbiAgICAgICAgICByZXNvbHZlZC5yZXMgPSByO1xuICAgICAgICAgIHJlc29sdmVkLnVzZWRQYXJhbXMgPSB0aGlzLmdldFVzZWRQYXJhbXNEZXRhaWxzKG9wdGlvbnMpO1xuICAgICAgICAgIHJldHVybiByZXNvbHZlZDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcjtcbiAgICAgIH1cbiAgICAgIGlmIChrZXlTZXBhcmF0b3IpIHtcbiAgICAgICAgY29uc3QgcmVzVHlwZUlzQXJyYXkgPSBBcnJheS5pc0FycmF5KHJlcyk7XG4gICAgICAgIGNvbnN0IGNvcHkgPSByZXNUeXBlSXNBcnJheSA/IFtdIDoge307XG4gICAgICAgIGNvbnN0IG5ld0tleVRvVXNlID0gcmVzVHlwZUlzQXJyYXkgPyByZXNFeGFjdFVzZWRLZXkgOiByZXNVc2VkS2V5O1xuICAgICAgICBmb3IgKGNvbnN0IG0gaW4gcmVzKSB7XG4gICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChyZXMsIG0pKSB7XG4gICAgICAgICAgICBjb25zdCBkZWVwS2V5ID0gYCR7bmV3S2V5VG9Vc2V9JHtrZXlTZXBhcmF0b3J9JHttfWA7XG4gICAgICAgICAgICBjb3B5W21dID0gdGhpcy50cmFuc2xhdGUoZGVlcEtleSwge1xuICAgICAgICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICAgICAgICAuLi57XG4gICAgICAgICAgICAgICAgam9pbkFycmF5czogZmFsc2UsXG4gICAgICAgICAgICAgICAgbnM6IG5hbWVzcGFjZXNcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoY29weVttXSA9PT0gZGVlcEtleSkgY29weVttXSA9IHJlc1ttXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmVzID0gY29weTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGhhbmRsZUFzT2JqZWN0SW5JMThuRm9ybWF0ICYmIHR5cGVvZiBqb2luQXJyYXlzID09PSAnc3RyaW5nJyAmJiBBcnJheS5pc0FycmF5KHJlcykpIHtcbiAgICAgIHJlcyA9IHJlcy5qb2luKGpvaW5BcnJheXMpO1xuICAgICAgaWYgKHJlcykgcmVzID0gdGhpcy5leHRlbmRUcmFuc2xhdGlvbihyZXMsIGtleXMsIG9wdGlvbnMsIGxhc3RLZXkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgdXNlZERlZmF1bHQgPSBmYWxzZTtcbiAgICAgIGxldCB1c2VkS2V5ID0gZmFsc2U7XG4gICAgICBjb25zdCBuZWVkc1BsdXJhbEhhbmRsaW5nID0gb3B0aW9ucy5jb3VudCAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBvcHRpb25zLmNvdW50ICE9PSAnc3RyaW5nJztcbiAgICAgIGNvbnN0IGhhc0RlZmF1bHRWYWx1ZSA9IFRyYW5zbGF0b3IuaGFzRGVmYXVsdFZhbHVlKG9wdGlvbnMpO1xuICAgICAgY29uc3QgZGVmYXVsdFZhbHVlU3VmZml4ID0gbmVlZHNQbHVyYWxIYW5kbGluZyA/IHRoaXMucGx1cmFsUmVzb2x2ZXIuZ2V0U3VmZml4KGxuZywgb3B0aW9ucy5jb3VudCwgb3B0aW9ucykgOiAnJztcbiAgICAgIGNvbnN0IGRlZmF1bHRWYWx1ZVN1ZmZpeE9yZGluYWxGYWxsYmFjayA9IG9wdGlvbnMub3JkaW5hbCAmJiBuZWVkc1BsdXJhbEhhbmRsaW5nID8gdGhpcy5wbHVyYWxSZXNvbHZlci5nZXRTdWZmaXgobG5nLCBvcHRpb25zLmNvdW50LCB7XG4gICAgICAgIG9yZGluYWw6IGZhbHNlXG4gICAgICB9KSA6ICcnO1xuICAgICAgY29uc3QgbmVlZHNaZXJvU3VmZml4TG9va3VwID0gbmVlZHNQbHVyYWxIYW5kbGluZyAmJiAhb3B0aW9ucy5vcmRpbmFsICYmIG9wdGlvbnMuY291bnQgPT09IDAgJiYgdGhpcy5wbHVyYWxSZXNvbHZlci5zaG91bGRVc2VJbnRsQXBpKCk7XG4gICAgICBjb25zdCBkZWZhdWx0VmFsdWUgPSBuZWVkc1plcm9TdWZmaXhMb29rdXAgJiYgb3B0aW9uc1tgZGVmYXVsdFZhbHVlJHt0aGlzLm9wdGlvbnMucGx1cmFsU2VwYXJhdG9yfXplcm9gXSB8fCBvcHRpb25zW2BkZWZhdWx0VmFsdWUke2RlZmF1bHRWYWx1ZVN1ZmZpeH1gXSB8fCBvcHRpb25zW2BkZWZhdWx0VmFsdWUke2RlZmF1bHRWYWx1ZVN1ZmZpeE9yZGluYWxGYWxsYmFja31gXSB8fCBvcHRpb25zLmRlZmF1bHRWYWx1ZTtcbiAgICAgIGlmICghdGhpcy5pc1ZhbGlkTG9va3VwKHJlcykgJiYgaGFzRGVmYXVsdFZhbHVlKSB7XG4gICAgICAgIHVzZWREZWZhdWx0ID0gdHJ1ZTtcbiAgICAgICAgcmVzID0gZGVmYXVsdFZhbHVlO1xuICAgICAgfVxuICAgICAgaWYgKCF0aGlzLmlzVmFsaWRMb29rdXAocmVzKSkge1xuICAgICAgICB1c2VkS2V5ID0gdHJ1ZTtcbiAgICAgICAgcmVzID0ga2V5O1xuICAgICAgfVxuICAgICAgY29uc3QgbWlzc2luZ0tleU5vVmFsdWVGYWxsYmFja1RvS2V5ID0gb3B0aW9ucy5taXNzaW5nS2V5Tm9WYWx1ZUZhbGxiYWNrVG9LZXkgfHwgdGhpcy5vcHRpb25zLm1pc3NpbmdLZXlOb1ZhbHVlRmFsbGJhY2tUb0tleTtcbiAgICAgIGNvbnN0IHJlc0Zvck1pc3NpbmcgPSBtaXNzaW5nS2V5Tm9WYWx1ZUZhbGxiYWNrVG9LZXkgJiYgdXNlZEtleSA/IHVuZGVmaW5lZCA6IHJlcztcbiAgICAgIGNvbnN0IHVwZGF0ZU1pc3NpbmcgPSBoYXNEZWZhdWx0VmFsdWUgJiYgZGVmYXVsdFZhbHVlICE9PSByZXMgJiYgdGhpcy5vcHRpb25zLnVwZGF0ZU1pc3Npbmc7XG4gICAgICBpZiAodXNlZEtleSB8fCB1c2VkRGVmYXVsdCB8fCB1cGRhdGVNaXNzaW5nKSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLmxvZyh1cGRhdGVNaXNzaW5nID8gJ3VwZGF0ZUtleScgOiAnbWlzc2luZ0tleScsIGxuZywgbmFtZXNwYWNlLCBrZXksIHVwZGF0ZU1pc3NpbmcgPyBkZWZhdWx0VmFsdWUgOiByZXMpO1xuICAgICAgICBpZiAoa2V5U2VwYXJhdG9yKSB7XG4gICAgICAgICAgY29uc3QgZmsgPSB0aGlzLnJlc29sdmUoa2V5LCB7XG4gICAgICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICAgICAga2V5U2VwYXJhdG9yOiBmYWxzZVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGlmIChmayAmJiBmay5yZXMpIHRoaXMubG9nZ2VyLndhcm4oJ1NlZW1zIHRoZSBsb2FkZWQgdHJhbnNsYXRpb25zIHdlcmUgaW4gZmxhdCBKU09OIGZvcm1hdCBpbnN0ZWFkIG9mIG5lc3RlZC4gRWl0aGVyIHNldCBrZXlTZXBhcmF0b3I6IGZhbHNlIG9uIGluaXQgb3IgbWFrZSBzdXJlIHlvdXIgdHJhbnNsYXRpb25zIGFyZSBwdWJsaXNoZWQgaW4gbmVzdGVkIGZvcm1hdC4nKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgbG5ncyA9IFtdO1xuICAgICAgICBjb25zdCBmYWxsYmFja0xuZ3MgPSB0aGlzLmxhbmd1YWdlVXRpbHMuZ2V0RmFsbGJhY2tDb2Rlcyh0aGlzLm9wdGlvbnMuZmFsbGJhY2tMbmcsIG9wdGlvbnMubG5nIHx8IHRoaXMubGFuZ3VhZ2UpO1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNhdmVNaXNzaW5nVG8gPT09ICdmYWxsYmFjaycgJiYgZmFsbGJhY2tMbmdzICYmIGZhbGxiYWNrTG5nc1swXSkge1xuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmFsbGJhY2tMbmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBsbmdzLnB1c2goZmFsbGJhY2tMbmdzW2ldKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLnNhdmVNaXNzaW5nVG8gPT09ICdhbGwnKSB7XG4gICAgICAgICAgbG5ncyA9IHRoaXMubGFuZ3VhZ2VVdGlscy50b1Jlc29sdmVIaWVyYXJjaHkob3B0aW9ucy5sbmcgfHwgdGhpcy5sYW5ndWFnZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbG5ncy5wdXNoKG9wdGlvbnMubG5nIHx8IHRoaXMubGFuZ3VhZ2UpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHNlbmQgPSAobCwgaywgc3BlY2lmaWNEZWZhdWx0VmFsdWUpID0+IHtcbiAgICAgICAgICBjb25zdCBkZWZhdWx0Rm9yTWlzc2luZyA9IGhhc0RlZmF1bHRWYWx1ZSAmJiBzcGVjaWZpY0RlZmF1bHRWYWx1ZSAhPT0gcmVzID8gc3BlY2lmaWNEZWZhdWx0VmFsdWUgOiByZXNGb3JNaXNzaW5nO1xuICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMubWlzc2luZ0tleUhhbmRsZXIpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5taXNzaW5nS2V5SGFuZGxlcihsLCBuYW1lc3BhY2UsIGssIGRlZmF1bHRGb3JNaXNzaW5nLCB1cGRhdGVNaXNzaW5nLCBvcHRpb25zKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuYmFja2VuZENvbm5lY3RvciAmJiB0aGlzLmJhY2tlbmRDb25uZWN0b3Iuc2F2ZU1pc3NpbmcpIHtcbiAgICAgICAgICAgIHRoaXMuYmFja2VuZENvbm5lY3Rvci5zYXZlTWlzc2luZyhsLCBuYW1lc3BhY2UsIGssIGRlZmF1bHRGb3JNaXNzaW5nLCB1cGRhdGVNaXNzaW5nLCBvcHRpb25zKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5lbWl0KCdtaXNzaW5nS2V5JywgbCwgbmFtZXNwYWNlLCBrLCByZXMpO1xuICAgICAgICB9O1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNhdmVNaXNzaW5nKSB7XG4gICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zYXZlTWlzc2luZ1BsdXJhbHMgJiYgbmVlZHNQbHVyYWxIYW5kbGluZykge1xuICAgICAgICAgICAgbG5ncy5mb3JFYWNoKGxhbmd1YWdlID0+IHtcbiAgICAgICAgICAgICAgY29uc3Qgc3VmZml4ZXMgPSB0aGlzLnBsdXJhbFJlc29sdmVyLmdldFN1ZmZpeGVzKGxhbmd1YWdlLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgaWYgKG5lZWRzWmVyb1N1ZmZpeExvb2t1cCAmJiBvcHRpb25zW2BkZWZhdWx0VmFsdWUke3RoaXMub3B0aW9ucy5wbHVyYWxTZXBhcmF0b3J9emVyb2BdICYmIHN1ZmZpeGVzLmluZGV4T2YoYCR7dGhpcy5vcHRpb25zLnBsdXJhbFNlcGFyYXRvcn16ZXJvYCkgPCAwKSB7XG4gICAgICAgICAgICAgICAgc3VmZml4ZXMucHVzaChgJHt0aGlzLm9wdGlvbnMucGx1cmFsU2VwYXJhdG9yfXplcm9gKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBzdWZmaXhlcy5mb3JFYWNoKHN1ZmZpeCA9PiB7XG4gICAgICAgICAgICAgICAgc2VuZChbbGFuZ3VhZ2VdLCBrZXkgKyBzdWZmaXgsIG9wdGlvbnNbYGRlZmF1bHRWYWx1ZSR7c3VmZml4fWBdIHx8IGRlZmF1bHRWYWx1ZSk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlbmQobG5ncywga2V5LCBkZWZhdWx0VmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmVzID0gdGhpcy5leHRlbmRUcmFuc2xhdGlvbihyZXMsIGtleXMsIG9wdGlvbnMsIHJlc29sdmVkLCBsYXN0S2V5KTtcbiAgICAgIGlmICh1c2VkS2V5ICYmIHJlcyA9PT0ga2V5ICYmIHRoaXMub3B0aW9ucy5hcHBlbmROYW1lc3BhY2VUb01pc3NpbmdLZXkpIHJlcyA9IGAke25hbWVzcGFjZX06JHtrZXl9YDtcbiAgICAgIGlmICgodXNlZEtleSB8fCB1c2VkRGVmYXVsdCkgJiYgdGhpcy5vcHRpb25zLnBhcnNlTWlzc2luZ0tleUhhbmRsZXIpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5jb21wYXRpYmlsaXR5QVBJICE9PSAndjEnKSB7XG4gICAgICAgICAgcmVzID0gdGhpcy5vcHRpb25zLnBhcnNlTWlzc2luZ0tleUhhbmRsZXIodGhpcy5vcHRpb25zLmFwcGVuZE5hbWVzcGFjZVRvTWlzc2luZ0tleSA/IGAke25hbWVzcGFjZX06JHtrZXl9YCA6IGtleSwgdXNlZERlZmF1bHQgPyByZXMgOiB1bmRlZmluZWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlcyA9IHRoaXMub3B0aW9ucy5wYXJzZU1pc3NpbmdLZXlIYW5kbGVyKHJlcyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHJldHVybkRldGFpbHMpIHtcbiAgICAgIHJlc29sdmVkLnJlcyA9IHJlcztcbiAgICAgIHJlc29sdmVkLnVzZWRQYXJhbXMgPSB0aGlzLmdldFVzZWRQYXJhbXNEZXRhaWxzKG9wdGlvbnMpO1xuICAgICAgcmV0dXJuIHJlc29sdmVkO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xuICB9XG4gIGV4dGVuZFRyYW5zbGF0aW9uKHJlcywga2V5LCBvcHRpb25zLCByZXNvbHZlZCwgbGFzdEtleSkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgaWYgKHRoaXMuaTE4bkZvcm1hdCAmJiB0aGlzLmkxOG5Gb3JtYXQucGFyc2UpIHtcbiAgICAgIHJlcyA9IHRoaXMuaTE4bkZvcm1hdC5wYXJzZShyZXMsIHtcbiAgICAgICAgLi4udGhpcy5vcHRpb25zLmludGVycG9sYXRpb24uZGVmYXVsdFZhcmlhYmxlcyxcbiAgICAgICAgLi4ub3B0aW9uc1xuICAgICAgfSwgb3B0aW9ucy5sbmcgfHwgdGhpcy5sYW5ndWFnZSB8fCByZXNvbHZlZC51c2VkTG5nLCByZXNvbHZlZC51c2VkTlMsIHJlc29sdmVkLnVzZWRLZXksIHtcbiAgICAgICAgcmVzb2x2ZWRcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoIW9wdGlvbnMuc2tpcEludGVycG9sYXRpb24pIHtcbiAgICAgIGlmIChvcHRpb25zLmludGVycG9sYXRpb24pIHRoaXMuaW50ZXJwb2xhdG9yLmluaXQoe1xuICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICAuLi57XG4gICAgICAgICAgaW50ZXJwb2xhdGlvbjoge1xuICAgICAgICAgICAgLi4udGhpcy5vcHRpb25zLmludGVycG9sYXRpb24sXG4gICAgICAgICAgICAuLi5vcHRpb25zLmludGVycG9sYXRpb25cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgY29uc3Qgc2tpcE9uVmFyaWFibGVzID0gdHlwZW9mIHJlcyA9PT0gJ3N0cmluZycgJiYgKG9wdGlvbnMgJiYgb3B0aW9ucy5pbnRlcnBvbGF0aW9uICYmIG9wdGlvbnMuaW50ZXJwb2xhdGlvbi5za2lwT25WYXJpYWJsZXMgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMuaW50ZXJwb2xhdGlvbi5za2lwT25WYXJpYWJsZXMgOiB0aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbi5za2lwT25WYXJpYWJsZXMpO1xuICAgICAgbGV0IG5lc3RCZWY7XG4gICAgICBpZiAoc2tpcE9uVmFyaWFibGVzKSB7XG4gICAgICAgIGNvbnN0IG5iID0gcmVzLm1hdGNoKHRoaXMuaW50ZXJwb2xhdG9yLm5lc3RpbmdSZWdleHApO1xuICAgICAgICBuZXN0QmVmID0gbmIgJiYgbmIubGVuZ3RoO1xuICAgICAgfVxuICAgICAgbGV0IGRhdGEgPSBvcHRpb25zLnJlcGxhY2UgJiYgdHlwZW9mIG9wdGlvbnMucmVwbGFjZSAhPT0gJ3N0cmluZycgPyBvcHRpb25zLnJlcGxhY2UgOiBvcHRpb25zO1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5pbnRlcnBvbGF0aW9uLmRlZmF1bHRWYXJpYWJsZXMpIGRhdGEgPSB7XG4gICAgICAgIC4uLnRoaXMub3B0aW9ucy5pbnRlcnBvbGF0aW9uLmRlZmF1bHRWYXJpYWJsZXMsXG4gICAgICAgIC4uLmRhdGFcbiAgICAgIH07XG4gICAgICByZXMgPSB0aGlzLmludGVycG9sYXRvci5pbnRlcnBvbGF0ZShyZXMsIGRhdGEsIG9wdGlvbnMubG5nIHx8IHRoaXMubGFuZ3VhZ2UgfHwgcmVzb2x2ZWQudXNlZExuZywgb3B0aW9ucyk7XG4gICAgICBpZiAoc2tpcE9uVmFyaWFibGVzKSB7XG4gICAgICAgIGNvbnN0IG5hID0gcmVzLm1hdGNoKHRoaXMuaW50ZXJwb2xhdG9yLm5lc3RpbmdSZWdleHApO1xuICAgICAgICBjb25zdCBuZXN0QWZ0ID0gbmEgJiYgbmEubGVuZ3RoO1xuICAgICAgICBpZiAobmVzdEJlZiA8IG5lc3RBZnQpIG9wdGlvbnMubmVzdCA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKCFvcHRpb25zLmxuZyAmJiB0aGlzLm9wdGlvbnMuY29tcGF0aWJpbGl0eUFQSSAhPT0gJ3YxJyAmJiByZXNvbHZlZCAmJiByZXNvbHZlZC5yZXMpIG9wdGlvbnMubG5nID0gdGhpcy5sYW5ndWFnZSB8fCByZXNvbHZlZC51c2VkTG5nO1xuICAgICAgaWYgKG9wdGlvbnMubmVzdCAhPT0gZmFsc2UpIHJlcyA9IHRoaXMuaW50ZXJwb2xhdG9yLm5lc3QocmVzLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gbmV3IEFycmF5KF9sZW4pLCBfa2V5ID0gMDsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgICAgICAgIGFyZ3NbX2tleV0gPSBhcmd1bWVudHNbX2tleV07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxhc3RLZXkgJiYgbGFzdEtleVswXSA9PT0gYXJnc1swXSAmJiAhb3B0aW9ucy5jb250ZXh0KSB7XG4gICAgICAgICAgX3RoaXMubG9nZ2VyLndhcm4oYEl0IHNlZW1zIHlvdSBhcmUgbmVzdGluZyByZWN1cnNpdmVseSBrZXk6ICR7YXJnc1swXX0gaW4ga2V5OiAke2tleVswXX1gKTtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX3RoaXMudHJhbnNsYXRlKC4uLmFyZ3MsIGtleSk7XG4gICAgICB9LCBvcHRpb25zKTtcbiAgICAgIGlmIChvcHRpb25zLmludGVycG9sYXRpb24pIHRoaXMuaW50ZXJwb2xhdG9yLnJlc2V0KCk7XG4gICAgfVxuICAgIGNvbnN0IHBvc3RQcm9jZXNzID0gb3B0aW9ucy5wb3N0UHJvY2VzcyB8fCB0aGlzLm9wdGlvbnMucG9zdFByb2Nlc3M7XG4gICAgY29uc3QgcG9zdFByb2Nlc3Nvck5hbWVzID0gdHlwZW9mIHBvc3RQcm9jZXNzID09PSAnc3RyaW5nJyA/IFtwb3N0UHJvY2Vzc10gOiBwb3N0UHJvY2VzcztcbiAgICBpZiAocmVzICE9PSB1bmRlZmluZWQgJiYgcmVzICE9PSBudWxsICYmIHBvc3RQcm9jZXNzb3JOYW1lcyAmJiBwb3N0UHJvY2Vzc29yTmFtZXMubGVuZ3RoICYmIG9wdGlvbnMuYXBwbHlQb3N0UHJvY2Vzc29yICE9PSBmYWxzZSkge1xuICAgICAgcmVzID0gcG9zdFByb2Nlc3Nvci5oYW5kbGUocG9zdFByb2Nlc3Nvck5hbWVzLCByZXMsIGtleSwgdGhpcy5vcHRpb25zICYmIHRoaXMub3B0aW9ucy5wb3N0UHJvY2Vzc1Bhc3NSZXNvbHZlZCA/IHtcbiAgICAgICAgaTE4blJlc29sdmVkOiB7XG4gICAgICAgICAgLi4ucmVzb2x2ZWQsXG4gICAgICAgICAgdXNlZFBhcmFtczogdGhpcy5nZXRVc2VkUGFyYW1zRGV0YWlscyhvcHRpb25zKVxuICAgICAgICB9LFxuICAgICAgICAuLi5vcHRpb25zXG4gICAgICB9IDogb3B0aW9ucywgdGhpcyk7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG4gIH1cbiAgcmVzb2x2ZShrZXlzKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IHt9O1xuICAgIGxldCBmb3VuZDtcbiAgICBsZXQgdXNlZEtleTtcbiAgICBsZXQgZXhhY3RVc2VkS2V5O1xuICAgIGxldCB1c2VkTG5nO1xuICAgIGxldCB1c2VkTlM7XG4gICAgaWYgKHR5cGVvZiBrZXlzID09PSAnc3RyaW5nJykga2V5cyA9IFtrZXlzXTtcbiAgICBrZXlzLmZvckVhY2goayA9PiB7XG4gICAgICBpZiAodGhpcy5pc1ZhbGlkTG9va3VwKGZvdW5kKSkgcmV0dXJuO1xuICAgICAgY29uc3QgZXh0cmFjdGVkID0gdGhpcy5leHRyYWN0RnJvbUtleShrLCBvcHRpb25zKTtcbiAgICAgIGNvbnN0IGtleSA9IGV4dHJhY3RlZC5rZXk7XG4gICAgICB1c2VkS2V5ID0ga2V5O1xuICAgICAgbGV0IG5hbWVzcGFjZXMgPSBleHRyYWN0ZWQubmFtZXNwYWNlcztcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuZmFsbGJhY2tOUykgbmFtZXNwYWNlcyA9IG5hbWVzcGFjZXMuY29uY2F0KHRoaXMub3B0aW9ucy5mYWxsYmFja05TKTtcbiAgICAgIGNvbnN0IG5lZWRzUGx1cmFsSGFuZGxpbmcgPSBvcHRpb25zLmNvdW50ICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIG9wdGlvbnMuY291bnQgIT09ICdzdHJpbmcnO1xuICAgICAgY29uc3QgbmVlZHNaZXJvU3VmZml4TG9va3VwID0gbmVlZHNQbHVyYWxIYW5kbGluZyAmJiAhb3B0aW9ucy5vcmRpbmFsICYmIG9wdGlvbnMuY291bnQgPT09IDAgJiYgdGhpcy5wbHVyYWxSZXNvbHZlci5zaG91bGRVc2VJbnRsQXBpKCk7XG4gICAgICBjb25zdCBuZWVkc0NvbnRleHRIYW5kbGluZyA9IG9wdGlvbnMuY29udGV4dCAhPT0gdW5kZWZpbmVkICYmICh0eXBlb2Ygb3B0aW9ucy5jb250ZXh0ID09PSAnc3RyaW5nJyB8fCB0eXBlb2Ygb3B0aW9ucy5jb250ZXh0ID09PSAnbnVtYmVyJykgJiYgb3B0aW9ucy5jb250ZXh0ICE9PSAnJztcbiAgICAgIGNvbnN0IGNvZGVzID0gb3B0aW9ucy5sbmdzID8gb3B0aW9ucy5sbmdzIDogdGhpcy5sYW5ndWFnZVV0aWxzLnRvUmVzb2x2ZUhpZXJhcmNoeShvcHRpb25zLmxuZyB8fCB0aGlzLmxhbmd1YWdlLCBvcHRpb25zLmZhbGxiYWNrTG5nKTtcbiAgICAgIG5hbWVzcGFjZXMuZm9yRWFjaChucyA9PiB7XG4gICAgICAgIGlmICh0aGlzLmlzVmFsaWRMb29rdXAoZm91bmQpKSByZXR1cm47XG4gICAgICAgIHVzZWROUyA9IG5zO1xuICAgICAgICBpZiAoIWNoZWNrZWRMb2FkZWRGb3JbYCR7Y29kZXNbMF19LSR7bnN9YF0gJiYgdGhpcy51dGlscyAmJiB0aGlzLnV0aWxzLmhhc0xvYWRlZE5hbWVzcGFjZSAmJiAhdGhpcy51dGlscy5oYXNMb2FkZWROYW1lc3BhY2UodXNlZE5TKSkge1xuICAgICAgICAgIGNoZWNrZWRMb2FkZWRGb3JbYCR7Y29kZXNbMF19LSR7bnN9YF0gPSB0cnVlO1xuICAgICAgICAgIHRoaXMubG9nZ2VyLndhcm4oYGtleSBcIiR7dXNlZEtleX1cIiBmb3IgbGFuZ3VhZ2VzIFwiJHtjb2Rlcy5qb2luKCcsICcpfVwiIHdvbid0IGdldCByZXNvbHZlZCBhcyBuYW1lc3BhY2UgXCIke3VzZWROU31cIiB3YXMgbm90IHlldCBsb2FkZWRgLCAnVGhpcyBtZWFucyBzb21ldGhpbmcgSVMgV1JPTkcgaW4geW91ciBzZXR1cC4gWW91IGFjY2VzcyB0aGUgdCBmdW5jdGlvbiBiZWZvcmUgaTE4bmV4dC5pbml0IC8gaTE4bmV4dC5sb2FkTmFtZXNwYWNlIC8gaTE4bmV4dC5jaGFuZ2VMYW5ndWFnZSB3YXMgZG9uZS4gV2FpdCBmb3IgdGhlIGNhbGxiYWNrIG9yIFByb21pc2UgdG8gcmVzb2x2ZSBiZWZvcmUgYWNjZXNzaW5nIGl0ISEhJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29kZXMuZm9yRWFjaChjb2RlID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5pc1ZhbGlkTG9va3VwKGZvdW5kKSkgcmV0dXJuO1xuICAgICAgICAgIHVzZWRMbmcgPSBjb2RlO1xuICAgICAgICAgIGNvbnN0IGZpbmFsS2V5cyA9IFtrZXldO1xuICAgICAgICAgIGlmICh0aGlzLmkxOG5Gb3JtYXQgJiYgdGhpcy5pMThuRm9ybWF0LmFkZExvb2t1cEtleXMpIHtcbiAgICAgICAgICAgIHRoaXMuaTE4bkZvcm1hdC5hZGRMb29rdXBLZXlzKGZpbmFsS2V5cywga2V5LCBjb2RlLCBucywgb3B0aW9ucyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxldCBwbHVyYWxTdWZmaXg7XG4gICAgICAgICAgICBpZiAobmVlZHNQbHVyYWxIYW5kbGluZykgcGx1cmFsU3VmZml4ID0gdGhpcy5wbHVyYWxSZXNvbHZlci5nZXRTdWZmaXgoY29kZSwgb3B0aW9ucy5jb3VudCwgb3B0aW9ucyk7XG4gICAgICAgICAgICBjb25zdCB6ZXJvU3VmZml4ID0gYCR7dGhpcy5vcHRpb25zLnBsdXJhbFNlcGFyYXRvcn16ZXJvYDtcbiAgICAgICAgICAgIGNvbnN0IG9yZGluYWxQcmVmaXggPSBgJHt0aGlzLm9wdGlvbnMucGx1cmFsU2VwYXJhdG9yfW9yZGluYWwke3RoaXMub3B0aW9ucy5wbHVyYWxTZXBhcmF0b3J9YDtcbiAgICAgICAgICAgIGlmIChuZWVkc1BsdXJhbEhhbmRsaW5nKSB7XG4gICAgICAgICAgICAgIGZpbmFsS2V5cy5wdXNoKGtleSArIHBsdXJhbFN1ZmZpeCk7XG4gICAgICAgICAgICAgIGlmIChvcHRpb25zLm9yZGluYWwgJiYgcGx1cmFsU3VmZml4LmluZGV4T2Yob3JkaW5hbFByZWZpeCkgPT09IDApIHtcbiAgICAgICAgICAgICAgICBmaW5hbEtleXMucHVzaChrZXkgKyBwbHVyYWxTdWZmaXgucmVwbGFjZShvcmRpbmFsUHJlZml4LCB0aGlzLm9wdGlvbnMucGx1cmFsU2VwYXJhdG9yKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKG5lZWRzWmVyb1N1ZmZpeExvb2t1cCkge1xuICAgICAgICAgICAgICAgIGZpbmFsS2V5cy5wdXNoKGtleSArIHplcm9TdWZmaXgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobmVlZHNDb250ZXh0SGFuZGxpbmcpIHtcbiAgICAgICAgICAgICAgY29uc3QgY29udGV4dEtleSA9IGAke2tleX0ke3RoaXMub3B0aW9ucy5jb250ZXh0U2VwYXJhdG9yfSR7b3B0aW9ucy5jb250ZXh0fWA7XG4gICAgICAgICAgICAgIGZpbmFsS2V5cy5wdXNoKGNvbnRleHRLZXkpO1xuICAgICAgICAgICAgICBpZiAobmVlZHNQbHVyYWxIYW5kbGluZykge1xuICAgICAgICAgICAgICAgIGZpbmFsS2V5cy5wdXNoKGNvbnRleHRLZXkgKyBwbHVyYWxTdWZmaXgpO1xuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLm9yZGluYWwgJiYgcGx1cmFsU3VmZml4LmluZGV4T2Yob3JkaW5hbFByZWZpeCkgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgIGZpbmFsS2V5cy5wdXNoKGNvbnRleHRLZXkgKyBwbHVyYWxTdWZmaXgucmVwbGFjZShvcmRpbmFsUHJlZml4LCB0aGlzLm9wdGlvbnMucGx1cmFsU2VwYXJhdG9yKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChuZWVkc1plcm9TdWZmaXhMb29rdXApIHtcbiAgICAgICAgICAgICAgICAgIGZpbmFsS2V5cy5wdXNoKGNvbnRleHRLZXkgKyB6ZXJvU3VmZml4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgbGV0IHBvc3NpYmxlS2V5O1xuICAgICAgICAgIHdoaWxlIChwb3NzaWJsZUtleSA9IGZpbmFsS2V5cy5wb3AoKSkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmlzVmFsaWRMb29rdXAoZm91bmQpKSB7XG4gICAgICAgICAgICAgIGV4YWN0VXNlZEtleSA9IHBvc3NpYmxlS2V5O1xuICAgICAgICAgICAgICBmb3VuZCA9IHRoaXMuZ2V0UmVzb3VyY2UoY29kZSwgbnMsIHBvc3NpYmxlS2V5LCBvcHRpb25zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHJlczogZm91bmQsXG4gICAgICB1c2VkS2V5LFxuICAgICAgZXhhY3RVc2VkS2V5LFxuICAgICAgdXNlZExuZyxcbiAgICAgIHVzZWROU1xuICAgIH07XG4gIH1cbiAgaXNWYWxpZExvb2t1cChyZXMpIHtcbiAgICByZXR1cm4gcmVzICE9PSB1bmRlZmluZWQgJiYgISghdGhpcy5vcHRpb25zLnJldHVybk51bGwgJiYgcmVzID09PSBudWxsKSAmJiAhKCF0aGlzLm9wdGlvbnMucmV0dXJuRW1wdHlTdHJpbmcgJiYgcmVzID09PSAnJyk7XG4gIH1cbiAgZ2V0UmVzb3VyY2UoY29kZSwgbnMsIGtleSkge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDMgJiYgYXJndW1lbnRzWzNdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbM10gOiB7fTtcbiAgICBpZiAodGhpcy5pMThuRm9ybWF0ICYmIHRoaXMuaTE4bkZvcm1hdC5nZXRSZXNvdXJjZSkgcmV0dXJuIHRoaXMuaTE4bkZvcm1hdC5nZXRSZXNvdXJjZShjb2RlLCBucywga2V5LCBvcHRpb25zKTtcbiAgICByZXR1cm4gdGhpcy5yZXNvdXJjZVN0b3JlLmdldFJlc291cmNlKGNvZGUsIG5zLCBrZXksIG9wdGlvbnMpO1xuICB9XG4gIGdldFVzZWRQYXJhbXNEZXRhaWxzKCkge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiB7fTtcbiAgICBjb25zdCBvcHRpb25zS2V5cyA9IFsnZGVmYXVsdFZhbHVlJywgJ29yZGluYWwnLCAnY29udGV4dCcsICdyZXBsYWNlJywgJ2xuZycsICdsbmdzJywgJ2ZhbGxiYWNrTG5nJywgJ25zJywgJ2tleVNlcGFyYXRvcicsICduc1NlcGFyYXRvcicsICdyZXR1cm5PYmplY3RzJywgJ3JldHVybkRldGFpbHMnLCAnam9pbkFycmF5cycsICdwb3N0UHJvY2VzcycsICdpbnRlcnBvbGF0aW9uJ107XG4gICAgY29uc3QgdXNlT3B0aW9uc1JlcGxhY2VGb3JEYXRhID0gb3B0aW9ucy5yZXBsYWNlICYmIHR5cGVvZiBvcHRpb25zLnJlcGxhY2UgIT09ICdzdHJpbmcnO1xuICAgIGxldCBkYXRhID0gdXNlT3B0aW9uc1JlcGxhY2VGb3JEYXRhID8gb3B0aW9ucy5yZXBsYWNlIDogb3B0aW9ucztcbiAgICBpZiAodXNlT3B0aW9uc1JlcGxhY2VGb3JEYXRhICYmIHR5cGVvZiBvcHRpb25zLmNvdW50ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgZGF0YS5jb3VudCA9IG9wdGlvbnMuY291bnQ7XG4gICAgfVxuICAgIGlmICh0aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbi5kZWZhdWx0VmFyaWFibGVzKSB7XG4gICAgICBkYXRhID0ge1xuICAgICAgICAuLi50aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbi5kZWZhdWx0VmFyaWFibGVzLFxuICAgICAgICAuLi5kYXRhXG4gICAgICB9O1xuICAgIH1cbiAgICBpZiAoIXVzZU9wdGlvbnNSZXBsYWNlRm9yRGF0YSkge1xuICAgICAgZGF0YSA9IHtcbiAgICAgICAgLi4uZGF0YVxuICAgICAgfTtcbiAgICAgIGZvciAoY29uc3Qga2V5IG9mIG9wdGlvbnNLZXlzKSB7XG4gICAgICAgIGRlbGV0ZSBkYXRhW2tleV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkYXRhO1xuICB9XG4gIHN0YXRpYyBoYXNEZWZhdWx0VmFsdWUob3B0aW9ucykge1xuICAgIGNvbnN0IHByZWZpeCA9ICdkZWZhdWx0VmFsdWUnO1xuICAgIGZvciAoY29uc3Qgb3B0aW9uIGluIG9wdGlvbnMpIHtcbiAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob3B0aW9ucywgb3B0aW9uKSAmJiBwcmVmaXggPT09IG9wdGlvbi5zdWJzdHJpbmcoMCwgcHJlZml4Lmxlbmd0aCkgJiYgdW5kZWZpbmVkICE9PSBvcHRpb25zW29wdGlvbl0pIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5jb25zdCBjYXBpdGFsaXplID0gc3RyaW5nID0+IHN0cmluZy5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHN0cmluZy5zbGljZSgxKTtcbmNsYXNzIExhbmd1YWdlVXRpbCB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMuc3VwcG9ydGVkTG5ncyA9IHRoaXMub3B0aW9ucy5zdXBwb3J0ZWRMbmdzIHx8IGZhbHNlO1xuICAgIHRoaXMubG9nZ2VyID0gYmFzZUxvZ2dlci5jcmVhdGUoJ2xhbmd1YWdlVXRpbHMnKTtcbiAgfVxuICBnZXRTY3JpcHRQYXJ0RnJvbUNvZGUoY29kZSkge1xuICAgIGNvZGUgPSBnZXRDbGVhbmVkQ29kZShjb2RlKTtcbiAgICBpZiAoIWNvZGUgfHwgY29kZS5pbmRleE9mKCctJykgPCAwKSByZXR1cm4gbnVsbDtcbiAgICBjb25zdCBwID0gY29kZS5zcGxpdCgnLScpO1xuICAgIGlmIChwLmxlbmd0aCA9PT0gMikgcmV0dXJuIG51bGw7XG4gICAgcC5wb3AoKTtcbiAgICBpZiAocFtwLmxlbmd0aCAtIDFdLnRvTG93ZXJDYXNlKCkgPT09ICd4JykgcmV0dXJuIG51bGw7XG4gICAgcmV0dXJuIHRoaXMuZm9ybWF0TGFuZ3VhZ2VDb2RlKHAuam9pbignLScpKTtcbiAgfVxuICBnZXRMYW5ndWFnZVBhcnRGcm9tQ29kZShjb2RlKSB7XG4gICAgY29kZSA9IGdldENsZWFuZWRDb2RlKGNvZGUpO1xuICAgIGlmICghY29kZSB8fCBjb2RlLmluZGV4T2YoJy0nKSA8IDApIHJldHVybiBjb2RlO1xuICAgIGNvbnN0IHAgPSBjb2RlLnNwbGl0KCctJyk7XG4gICAgcmV0dXJuIHRoaXMuZm9ybWF0TGFuZ3VhZ2VDb2RlKHBbMF0pO1xuICB9XG4gIGZvcm1hdExhbmd1YWdlQ29kZShjb2RlKSB7XG4gICAgaWYgKHR5cGVvZiBjb2RlID09PSAnc3RyaW5nJyAmJiBjb2RlLmluZGV4T2YoJy0nKSA+IC0xKSB7XG4gICAgICBjb25zdCBzcGVjaWFsQ2FzZXMgPSBbJ2hhbnMnLCAnaGFudCcsICdsYXRuJywgJ2N5cmwnLCAnY2FucycsICdtb25nJywgJ2FyYWInXTtcbiAgICAgIGxldCBwID0gY29kZS5zcGxpdCgnLScpO1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5sb3dlckNhc2VMbmcpIHtcbiAgICAgICAgcCA9IHAubWFwKHBhcnQgPT4gcGFydC50b0xvd2VyQ2FzZSgpKTtcbiAgICAgIH0gZWxzZSBpZiAocC5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgcFswXSA9IHBbMF0udG9Mb3dlckNhc2UoKTtcbiAgICAgICAgcFsxXSA9IHBbMV0udG9VcHBlckNhc2UoKTtcbiAgICAgICAgaWYgKHNwZWNpYWxDYXNlcy5pbmRleE9mKHBbMV0udG9Mb3dlckNhc2UoKSkgPiAtMSkgcFsxXSA9IGNhcGl0YWxpemUocFsxXS50b0xvd2VyQ2FzZSgpKTtcbiAgICAgIH0gZWxzZSBpZiAocC5sZW5ndGggPT09IDMpIHtcbiAgICAgICAgcFswXSA9IHBbMF0udG9Mb3dlckNhc2UoKTtcbiAgICAgICAgaWYgKHBbMV0ubGVuZ3RoID09PSAyKSBwWzFdID0gcFsxXS50b1VwcGVyQ2FzZSgpO1xuICAgICAgICBpZiAocFswXSAhPT0gJ3NnbicgJiYgcFsyXS5sZW5ndGggPT09IDIpIHBbMl0gPSBwWzJdLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgIGlmIChzcGVjaWFsQ2FzZXMuaW5kZXhPZihwWzFdLnRvTG93ZXJDYXNlKCkpID4gLTEpIHBbMV0gPSBjYXBpdGFsaXplKHBbMV0udG9Mb3dlckNhc2UoKSk7XG4gICAgICAgIGlmIChzcGVjaWFsQ2FzZXMuaW5kZXhPZihwWzJdLnRvTG93ZXJDYXNlKCkpID4gLTEpIHBbMl0gPSBjYXBpdGFsaXplKHBbMl0udG9Mb3dlckNhc2UoKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcC5qb2luKCctJyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLm9wdGlvbnMuY2xlYW5Db2RlIHx8IHRoaXMub3B0aW9ucy5sb3dlckNhc2VMbmcgPyBjb2RlLnRvTG93ZXJDYXNlKCkgOiBjb2RlO1xuICB9XG4gIGlzU3VwcG9ydGVkQ29kZShjb2RlKSB7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5sb2FkID09PSAnbGFuZ3VhZ2VPbmx5JyB8fCB0aGlzLm9wdGlvbnMubm9uRXhwbGljaXRTdXBwb3J0ZWRMbmdzKSB7XG4gICAgICBjb2RlID0gdGhpcy5nZXRMYW5ndWFnZVBhcnRGcm9tQ29kZShjb2RlKTtcbiAgICB9XG4gICAgcmV0dXJuICF0aGlzLnN1cHBvcnRlZExuZ3MgfHwgIXRoaXMuc3VwcG9ydGVkTG5ncy5sZW5ndGggfHwgdGhpcy5zdXBwb3J0ZWRMbmdzLmluZGV4T2YoY29kZSkgPiAtMTtcbiAgfVxuICBnZXRCZXN0TWF0Y2hGcm9tQ29kZXMoY29kZXMpIHtcbiAgICBpZiAoIWNvZGVzKSByZXR1cm4gbnVsbDtcbiAgICBsZXQgZm91bmQ7XG4gICAgY29kZXMuZm9yRWFjaChjb2RlID0+IHtcbiAgICAgIGlmIChmb3VuZCkgcmV0dXJuO1xuICAgICAgY29uc3QgY2xlYW5lZExuZyA9IHRoaXMuZm9ybWF0TGFuZ3VhZ2VDb2RlKGNvZGUpO1xuICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuc3VwcG9ydGVkTG5ncyB8fCB0aGlzLmlzU3VwcG9ydGVkQ29kZShjbGVhbmVkTG5nKSkgZm91bmQgPSBjbGVhbmVkTG5nO1xuICAgIH0pO1xuICAgIGlmICghZm91bmQgJiYgdGhpcy5vcHRpb25zLnN1cHBvcnRlZExuZ3MpIHtcbiAgICAgIGNvZGVzLmZvckVhY2goY29kZSA9PiB7XG4gICAgICAgIGlmIChmb3VuZCkgcmV0dXJuO1xuICAgICAgICBjb25zdCBsbmdPbmx5ID0gdGhpcy5nZXRMYW5ndWFnZVBhcnRGcm9tQ29kZShjb2RlKTtcbiAgICAgICAgaWYgKHRoaXMuaXNTdXBwb3J0ZWRDb2RlKGxuZ09ubHkpKSByZXR1cm4gZm91bmQgPSBsbmdPbmx5O1xuICAgICAgICBmb3VuZCA9IHRoaXMub3B0aW9ucy5zdXBwb3J0ZWRMbmdzLmZpbmQoc3VwcG9ydGVkTG5nID0+IHtcbiAgICAgICAgICBpZiAoc3VwcG9ydGVkTG5nID09PSBsbmdPbmx5KSByZXR1cm4gc3VwcG9ydGVkTG5nO1xuICAgICAgICAgIGlmIChzdXBwb3J0ZWRMbmcuaW5kZXhPZignLScpIDwgMCAmJiBsbmdPbmx5LmluZGV4T2YoJy0nKSA8IDApIHJldHVybjtcbiAgICAgICAgICBpZiAoc3VwcG9ydGVkTG5nLmluZGV4T2YoJy0nKSA+IDAgJiYgbG5nT25seS5pbmRleE9mKCctJykgPCAwICYmIHN1cHBvcnRlZExuZy5zdWJzdHJpbmcoMCwgc3VwcG9ydGVkTG5nLmluZGV4T2YoJy0nKSkgPT09IGxuZ09ubHkpIHJldHVybiBzdXBwb3J0ZWRMbmc7XG4gICAgICAgICAgaWYgKHN1cHBvcnRlZExuZy5pbmRleE9mKGxuZ09ubHkpID09PSAwICYmIGxuZ09ubHkubGVuZ3RoID4gMSkgcmV0dXJuIHN1cHBvcnRlZExuZztcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKCFmb3VuZCkgZm91bmQgPSB0aGlzLmdldEZhbGxiYWNrQ29kZXModGhpcy5vcHRpb25zLmZhbGxiYWNrTG5nKVswXTtcbiAgICByZXR1cm4gZm91bmQ7XG4gIH1cbiAgZ2V0RmFsbGJhY2tDb2RlcyhmYWxsYmFja3MsIGNvZGUpIHtcbiAgICBpZiAoIWZhbGxiYWNrcykgcmV0dXJuIFtdO1xuICAgIGlmICh0eXBlb2YgZmFsbGJhY2tzID09PSAnZnVuY3Rpb24nKSBmYWxsYmFja3MgPSBmYWxsYmFja3MoY29kZSk7XG4gICAgaWYgKHR5cGVvZiBmYWxsYmFja3MgPT09ICdzdHJpbmcnKSBmYWxsYmFja3MgPSBbZmFsbGJhY2tzXTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShmYWxsYmFja3MpKSByZXR1cm4gZmFsbGJhY2tzO1xuICAgIGlmICghY29kZSkgcmV0dXJuIGZhbGxiYWNrcy5kZWZhdWx0IHx8IFtdO1xuICAgIGxldCBmb3VuZCA9IGZhbGxiYWNrc1tjb2RlXTtcbiAgICBpZiAoIWZvdW5kKSBmb3VuZCA9IGZhbGxiYWNrc1t0aGlzLmdldFNjcmlwdFBhcnRGcm9tQ29kZShjb2RlKV07XG4gICAgaWYgKCFmb3VuZCkgZm91bmQgPSBmYWxsYmFja3NbdGhpcy5mb3JtYXRMYW5ndWFnZUNvZGUoY29kZSldO1xuICAgIGlmICghZm91bmQpIGZvdW5kID0gZmFsbGJhY2tzW3RoaXMuZ2V0TGFuZ3VhZ2VQYXJ0RnJvbUNvZGUoY29kZSldO1xuICAgIGlmICghZm91bmQpIGZvdW5kID0gZmFsbGJhY2tzLmRlZmF1bHQ7XG4gICAgcmV0dXJuIGZvdW5kIHx8IFtdO1xuICB9XG4gIHRvUmVzb2x2ZUhpZXJhcmNoeShjb2RlLCBmYWxsYmFja0NvZGUpIHtcbiAgICBjb25zdCBmYWxsYmFja0NvZGVzID0gdGhpcy5nZXRGYWxsYmFja0NvZGVzKGZhbGxiYWNrQ29kZSB8fCB0aGlzLm9wdGlvbnMuZmFsbGJhY2tMbmcgfHwgW10sIGNvZGUpO1xuICAgIGNvbnN0IGNvZGVzID0gW107XG4gICAgY29uc3QgYWRkQ29kZSA9IGMgPT4ge1xuICAgICAgaWYgKCFjKSByZXR1cm47XG4gICAgICBpZiAodGhpcy5pc1N1cHBvcnRlZENvZGUoYykpIHtcbiAgICAgICAgY29kZXMucHVzaChjKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLndhcm4oYHJlamVjdGluZyBsYW5ndWFnZSBjb2RlIG5vdCBmb3VuZCBpbiBzdXBwb3J0ZWRMbmdzOiAke2N9YCk7XG4gICAgICB9XG4gICAgfTtcbiAgICBpZiAodHlwZW9mIGNvZGUgPT09ICdzdHJpbmcnICYmIChjb2RlLmluZGV4T2YoJy0nKSA+IC0xIHx8IGNvZGUuaW5kZXhPZignXycpID4gLTEpKSB7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmxvYWQgIT09ICdsYW5ndWFnZU9ubHknKSBhZGRDb2RlKHRoaXMuZm9ybWF0TGFuZ3VhZ2VDb2RlKGNvZGUpKTtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMubG9hZCAhPT0gJ2xhbmd1YWdlT25seScgJiYgdGhpcy5vcHRpb25zLmxvYWQgIT09ICdjdXJyZW50T25seScpIGFkZENvZGUodGhpcy5nZXRTY3JpcHRQYXJ0RnJvbUNvZGUoY29kZSkpO1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5sb2FkICE9PSAnY3VycmVudE9ubHknKSBhZGRDb2RlKHRoaXMuZ2V0TGFuZ3VhZ2VQYXJ0RnJvbUNvZGUoY29kZSkpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGNvZGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICBhZGRDb2RlKHRoaXMuZm9ybWF0TGFuZ3VhZ2VDb2RlKGNvZGUpKTtcbiAgICB9XG4gICAgZmFsbGJhY2tDb2Rlcy5mb3JFYWNoKGZjID0+IHtcbiAgICAgIGlmIChjb2Rlcy5pbmRleE9mKGZjKSA8IDApIGFkZENvZGUodGhpcy5mb3JtYXRMYW5ndWFnZUNvZGUoZmMpKTtcbiAgICB9KTtcbiAgICByZXR1cm4gY29kZXM7XG4gIH1cbn1cblxubGV0IHNldHMgPSBbe1xuICBsbmdzOiBbJ2FjaCcsICdhaycsICdhbScsICdhcm4nLCAnYnInLCAnZmlsJywgJ2d1bicsICdsbicsICdtZmUnLCAnbWcnLCAnbWknLCAnb2MnLCAncHQnLCAncHQtQlInLCAndGcnLCAndGwnLCAndGknLCAndHInLCAndXonLCAnd2EnXSxcbiAgbnI6IFsxLCAyXSxcbiAgZmM6IDFcbn0sIHtcbiAgbG5nczogWydhZicsICdhbicsICdhc3QnLCAnYXonLCAnYmcnLCAnYm4nLCAnY2EnLCAnZGEnLCAnZGUnLCAnZGV2JywgJ2VsJywgJ2VuJywgJ2VvJywgJ2VzJywgJ2V0JywgJ2V1JywgJ2ZpJywgJ2ZvJywgJ2Z1cicsICdmeScsICdnbCcsICdndScsICdoYScsICdoaScsICdodScsICdoeScsICdpYScsICdpdCcsICdraycsICdrbicsICdrdScsICdsYicsICdtYWknLCAnbWwnLCAnbW4nLCAnbXInLCAnbmFoJywgJ25hcCcsICduYicsICduZScsICdubCcsICdubicsICdubycsICduc28nLCAncGEnLCAncGFwJywgJ3BtcycsICdwcycsICdwdC1QVCcsICdybScsICdzY28nLCAnc2UnLCAnc2knLCAnc28nLCAnc29uJywgJ3NxJywgJ3N2JywgJ3N3JywgJ3RhJywgJ3RlJywgJ3RrJywgJ3VyJywgJ3lvJ10sXG4gIG5yOiBbMSwgMl0sXG4gIGZjOiAyXG59LCB7XG4gIGxuZ3M6IFsnYXknLCAnYm8nLCAnY2dnJywgJ2ZhJywgJ2h0JywgJ2lkJywgJ2phJywgJ2pibycsICdrYScsICdrbScsICdrbycsICdreScsICdsbycsICdtcycsICdzYWgnLCAnc3UnLCAndGgnLCAndHQnLCAndWcnLCAndmknLCAnd28nLCAnemgnXSxcbiAgbnI6IFsxXSxcbiAgZmM6IDNcbn0sIHtcbiAgbG5nczogWydiZScsICdicycsICdjbnInLCAnZHonLCAnaHInLCAncnUnLCAnc3InLCAndWsnXSxcbiAgbnI6IFsxLCAyLCA1XSxcbiAgZmM6IDRcbn0sIHtcbiAgbG5nczogWydhciddLFxuICBucjogWzAsIDEsIDIsIDMsIDExLCAxMDBdLFxuICBmYzogNVxufSwge1xuICBsbmdzOiBbJ2NzJywgJ3NrJ10sXG4gIG5yOiBbMSwgMiwgNV0sXG4gIGZjOiA2XG59LCB7XG4gIGxuZ3M6IFsnY3NiJywgJ3BsJ10sXG4gIG5yOiBbMSwgMiwgNV0sXG4gIGZjOiA3XG59LCB7XG4gIGxuZ3M6IFsnY3knXSxcbiAgbnI6IFsxLCAyLCAzLCA4XSxcbiAgZmM6IDhcbn0sIHtcbiAgbG5nczogWydmciddLFxuICBucjogWzEsIDJdLFxuICBmYzogOVxufSwge1xuICBsbmdzOiBbJ2dhJ10sXG4gIG5yOiBbMSwgMiwgMywgNywgMTFdLFxuICBmYzogMTBcbn0sIHtcbiAgbG5nczogWydnZCddLFxuICBucjogWzEsIDIsIDMsIDIwXSxcbiAgZmM6IDExXG59LCB7XG4gIGxuZ3M6IFsnaXMnXSxcbiAgbnI6IFsxLCAyXSxcbiAgZmM6IDEyXG59LCB7XG4gIGxuZ3M6IFsnanYnXSxcbiAgbnI6IFswLCAxXSxcbiAgZmM6IDEzXG59LCB7XG4gIGxuZ3M6IFsna3cnXSxcbiAgbnI6IFsxLCAyLCAzLCA0XSxcbiAgZmM6IDE0XG59LCB7XG4gIGxuZ3M6IFsnbHQnXSxcbiAgbnI6IFsxLCAyLCAxMF0sXG4gIGZjOiAxNVxufSwge1xuICBsbmdzOiBbJ2x2J10sXG4gIG5yOiBbMSwgMiwgMF0sXG4gIGZjOiAxNlxufSwge1xuICBsbmdzOiBbJ21rJ10sXG4gIG5yOiBbMSwgMl0sXG4gIGZjOiAxN1xufSwge1xuICBsbmdzOiBbJ21uayddLFxuICBucjogWzAsIDEsIDJdLFxuICBmYzogMThcbn0sIHtcbiAgbG5nczogWydtdCddLFxuICBucjogWzEsIDIsIDExLCAyMF0sXG4gIGZjOiAxOVxufSwge1xuICBsbmdzOiBbJ29yJ10sXG4gIG5yOiBbMiwgMV0sXG4gIGZjOiAyXG59LCB7XG4gIGxuZ3M6IFsncm8nXSxcbiAgbnI6IFsxLCAyLCAyMF0sXG4gIGZjOiAyMFxufSwge1xuICBsbmdzOiBbJ3NsJ10sXG4gIG5yOiBbNSwgMSwgMiwgM10sXG4gIGZjOiAyMVxufSwge1xuICBsbmdzOiBbJ2hlJywgJ2l3J10sXG4gIG5yOiBbMSwgMiwgMjAsIDIxXSxcbiAgZmM6IDIyXG59XTtcbmxldCBfcnVsZXNQbHVyYWxzVHlwZXMgPSB7XG4gIDE6IG4gPT4gTnVtYmVyKG4gPiAxKSxcbiAgMjogbiA9PiBOdW1iZXIobiAhPSAxKSxcbiAgMzogbiA9PiAwLFxuICA0OiBuID0+IE51bWJlcihuICUgMTAgPT0gMSAmJiBuICUgMTAwICE9IDExID8gMCA6IG4gJSAxMCA+PSAyICYmIG4gJSAxMCA8PSA0ICYmIChuICUgMTAwIDwgMTAgfHwgbiAlIDEwMCA+PSAyMCkgPyAxIDogMiksXG4gIDU6IG4gPT4gTnVtYmVyKG4gPT0gMCA/IDAgOiBuID09IDEgPyAxIDogbiA9PSAyID8gMiA6IG4gJSAxMDAgPj0gMyAmJiBuICUgMTAwIDw9IDEwID8gMyA6IG4gJSAxMDAgPj0gMTEgPyA0IDogNSksXG4gIDY6IG4gPT4gTnVtYmVyKG4gPT0gMSA/IDAgOiBuID49IDIgJiYgbiA8PSA0ID8gMSA6IDIpLFxuICA3OiBuID0+IE51bWJlcihuID09IDEgPyAwIDogbiAlIDEwID49IDIgJiYgbiAlIDEwIDw9IDQgJiYgKG4gJSAxMDAgPCAxMCB8fCBuICUgMTAwID49IDIwKSA/IDEgOiAyKSxcbiAgODogbiA9PiBOdW1iZXIobiA9PSAxID8gMCA6IG4gPT0gMiA/IDEgOiBuICE9IDggJiYgbiAhPSAxMSA/IDIgOiAzKSxcbiAgOTogbiA9PiBOdW1iZXIobiA+PSAyKSxcbiAgMTA6IG4gPT4gTnVtYmVyKG4gPT0gMSA/IDAgOiBuID09IDIgPyAxIDogbiA8IDcgPyAyIDogbiA8IDExID8gMyA6IDQpLFxuICAxMTogbiA9PiBOdW1iZXIobiA9PSAxIHx8IG4gPT0gMTEgPyAwIDogbiA9PSAyIHx8IG4gPT0gMTIgPyAxIDogbiA+IDIgJiYgbiA8IDIwID8gMiA6IDMpLFxuICAxMjogbiA9PiBOdW1iZXIobiAlIDEwICE9IDEgfHwgbiAlIDEwMCA9PSAxMSksXG4gIDEzOiBuID0+IE51bWJlcihuICE9PSAwKSxcbiAgMTQ6IG4gPT4gTnVtYmVyKG4gPT0gMSA/IDAgOiBuID09IDIgPyAxIDogbiA9PSAzID8gMiA6IDMpLFxuICAxNTogbiA9PiBOdW1iZXIobiAlIDEwID09IDEgJiYgbiAlIDEwMCAhPSAxMSA/IDAgOiBuICUgMTAgPj0gMiAmJiAobiAlIDEwMCA8IDEwIHx8IG4gJSAxMDAgPj0gMjApID8gMSA6IDIpLFxuICAxNjogbiA9PiBOdW1iZXIobiAlIDEwID09IDEgJiYgbiAlIDEwMCAhPSAxMSA/IDAgOiBuICE9PSAwID8gMSA6IDIpLFxuICAxNzogbiA9PiBOdW1iZXIobiA9PSAxIHx8IG4gJSAxMCA9PSAxICYmIG4gJSAxMDAgIT0gMTEgPyAwIDogMSksXG4gIDE4OiBuID0+IE51bWJlcihuID09IDAgPyAwIDogbiA9PSAxID8gMSA6IDIpLFxuICAxOTogbiA9PiBOdW1iZXIobiA9PSAxID8gMCA6IG4gPT0gMCB8fCBuICUgMTAwID4gMSAmJiBuICUgMTAwIDwgMTEgPyAxIDogbiAlIDEwMCA+IDEwICYmIG4gJSAxMDAgPCAyMCA/IDIgOiAzKSxcbiAgMjA6IG4gPT4gTnVtYmVyKG4gPT0gMSA/IDAgOiBuID09IDAgfHwgbiAlIDEwMCA+IDAgJiYgbiAlIDEwMCA8IDIwID8gMSA6IDIpLFxuICAyMTogbiA9PiBOdW1iZXIobiAlIDEwMCA9PSAxID8gMSA6IG4gJSAxMDAgPT0gMiA/IDIgOiBuICUgMTAwID09IDMgfHwgbiAlIDEwMCA9PSA0ID8gMyA6IDApLFxuICAyMjogbiA9PiBOdW1iZXIobiA9PSAxID8gMCA6IG4gPT0gMiA/IDEgOiAobiA8IDAgfHwgbiA+IDEwKSAmJiBuICUgMTAgPT0gMCA/IDIgOiAzKVxufTtcbmNvbnN0IG5vbkludGxWZXJzaW9ucyA9IFsndjEnLCAndjInLCAndjMnXTtcbmNvbnN0IGludGxWZXJzaW9ucyA9IFsndjQnXTtcbmNvbnN0IHN1ZmZpeGVzT3JkZXIgPSB7XG4gIHplcm86IDAsXG4gIG9uZTogMSxcbiAgdHdvOiAyLFxuICBmZXc6IDMsXG4gIG1hbnk6IDQsXG4gIG90aGVyOiA1XG59O1xuY29uc3QgY3JlYXRlUnVsZXMgPSAoKSA9PiB7XG4gIGNvbnN0IHJ1bGVzID0ge307XG4gIHNldHMuZm9yRWFjaChzZXQgPT4ge1xuICAgIHNldC5sbmdzLmZvckVhY2gobCA9PiB7XG4gICAgICBydWxlc1tsXSA9IHtcbiAgICAgICAgbnVtYmVyczogc2V0Lm5yLFxuICAgICAgICBwbHVyYWxzOiBfcnVsZXNQbHVyYWxzVHlwZXNbc2V0LmZjXVxuICAgICAgfTtcbiAgICB9KTtcbiAgfSk7XG4gIHJldHVybiBydWxlcztcbn07XG5jbGFzcyBQbHVyYWxSZXNvbHZlciB7XG4gIGNvbnN0cnVjdG9yKGxhbmd1YWdlVXRpbHMpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge307XG4gICAgdGhpcy5sYW5ndWFnZVV0aWxzID0gbGFuZ3VhZ2VVdGlscztcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMubG9nZ2VyID0gYmFzZUxvZ2dlci5jcmVhdGUoJ3BsdXJhbFJlc29sdmVyJyk7XG4gICAgaWYgKCghdGhpcy5vcHRpb25zLmNvbXBhdGliaWxpdHlKU09OIHx8IGludGxWZXJzaW9ucy5pbmNsdWRlcyh0aGlzLm9wdGlvbnMuY29tcGF0aWJpbGl0eUpTT04pKSAmJiAodHlwZW9mIEludGwgPT09ICd1bmRlZmluZWQnIHx8ICFJbnRsLlBsdXJhbFJ1bGVzKSkge1xuICAgICAgdGhpcy5vcHRpb25zLmNvbXBhdGliaWxpdHlKU09OID0gJ3YzJztcbiAgICAgIHRoaXMubG9nZ2VyLmVycm9yKCdZb3VyIGVudmlyb25tZW50IHNlZW1zIG5vdCB0byBiZSBJbnRsIEFQSSBjb21wYXRpYmxlLCB1c2UgYW4gSW50bC5QbHVyYWxSdWxlcyBwb2x5ZmlsbC4gV2lsbCBmYWxsYmFjayB0byB0aGUgY29tcGF0aWJpbGl0eUpTT04gdjMgZm9ybWF0IGhhbmRsaW5nLicpO1xuICAgIH1cbiAgICB0aGlzLnJ1bGVzID0gY3JlYXRlUnVsZXMoKTtcbiAgfVxuICBhZGRSdWxlKGxuZywgb2JqKSB7XG4gICAgdGhpcy5ydWxlc1tsbmddID0gb2JqO1xuICB9XG4gIGdldFJ1bGUoY29kZSkge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB7fTtcbiAgICBpZiAodGhpcy5zaG91bGRVc2VJbnRsQXBpKCkpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBuZXcgSW50bC5QbHVyYWxSdWxlcyhnZXRDbGVhbmVkQ29kZShjb2RlID09PSAnZGV2JyA/ICdlbicgOiBjb2RlKSwge1xuICAgICAgICAgIHR5cGU6IG9wdGlvbnMub3JkaW5hbCA/ICdvcmRpbmFsJyA6ICdjYXJkaW5hbCdcbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5ydWxlc1tjb2RlXSB8fCB0aGlzLnJ1bGVzW3RoaXMubGFuZ3VhZ2VVdGlscy5nZXRMYW5ndWFnZVBhcnRGcm9tQ29kZShjb2RlKV07XG4gIH1cbiAgbmVlZHNQbHVyYWwoY29kZSkge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB7fTtcbiAgICBjb25zdCBydWxlID0gdGhpcy5nZXRSdWxlKGNvZGUsIG9wdGlvbnMpO1xuICAgIGlmICh0aGlzLnNob3VsZFVzZUludGxBcGkoKSkge1xuICAgICAgcmV0dXJuIHJ1bGUgJiYgcnVsZS5yZXNvbHZlZE9wdGlvbnMoKS5wbHVyYWxDYXRlZ29yaWVzLmxlbmd0aCA+IDE7XG4gICAgfVxuICAgIHJldHVybiBydWxlICYmIHJ1bGUubnVtYmVycy5sZW5ndGggPiAxO1xuICB9XG4gIGdldFBsdXJhbEZvcm1zT2ZLZXkoY29kZSwga2V5KSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6IHt9O1xuICAgIHJldHVybiB0aGlzLmdldFN1ZmZpeGVzKGNvZGUsIG9wdGlvbnMpLm1hcChzdWZmaXggPT4gYCR7a2V5fSR7c3VmZml4fWApO1xuICB9XG4gIGdldFN1ZmZpeGVzKGNvZGUpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge307XG4gICAgY29uc3QgcnVsZSA9IHRoaXMuZ2V0UnVsZShjb2RlLCBvcHRpb25zKTtcbiAgICBpZiAoIXJ1bGUpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgaWYgKHRoaXMuc2hvdWxkVXNlSW50bEFwaSgpKSB7XG4gICAgICByZXR1cm4gcnVsZS5yZXNvbHZlZE9wdGlvbnMoKS5wbHVyYWxDYXRlZ29yaWVzLnNvcnQoKHBsdXJhbENhdGVnb3J5MSwgcGx1cmFsQ2F0ZWdvcnkyKSA9PiBzdWZmaXhlc09yZGVyW3BsdXJhbENhdGVnb3J5MV0gLSBzdWZmaXhlc09yZGVyW3BsdXJhbENhdGVnb3J5Ml0pLm1hcChwbHVyYWxDYXRlZ29yeSA9PiBgJHt0aGlzLm9wdGlvbnMucHJlcGVuZH0ke29wdGlvbnMub3JkaW5hbCA/IGBvcmRpbmFsJHt0aGlzLm9wdGlvbnMucHJlcGVuZH1gIDogJyd9JHtwbHVyYWxDYXRlZ29yeX1gKTtcbiAgICB9XG4gICAgcmV0dXJuIHJ1bGUubnVtYmVycy5tYXAobnVtYmVyID0+IHRoaXMuZ2V0U3VmZml4KGNvZGUsIG51bWJlciwgb3B0aW9ucykpO1xuICB9XG4gIGdldFN1ZmZpeChjb2RlLCBjb3VudCkge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMl0gOiB7fTtcbiAgICBjb25zdCBydWxlID0gdGhpcy5nZXRSdWxlKGNvZGUsIG9wdGlvbnMpO1xuICAgIGlmIChydWxlKSB7XG4gICAgICBpZiAodGhpcy5zaG91bGRVc2VJbnRsQXBpKCkpIHtcbiAgICAgICAgcmV0dXJuIGAke3RoaXMub3B0aW9ucy5wcmVwZW5kfSR7b3B0aW9ucy5vcmRpbmFsID8gYG9yZGluYWwke3RoaXMub3B0aW9ucy5wcmVwZW5kfWAgOiAnJ30ke3J1bGUuc2VsZWN0KGNvdW50KX1gO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuZ2V0U3VmZml4UmV0cm9Db21wYXRpYmxlKHJ1bGUsIGNvdW50KTtcbiAgICB9XG4gICAgdGhpcy5sb2dnZXIud2Fybihgbm8gcGx1cmFsIHJ1bGUgZm91bmQgZm9yOiAke2NvZGV9YCk7XG4gICAgcmV0dXJuICcnO1xuICB9XG4gIGdldFN1ZmZpeFJldHJvQ29tcGF0aWJsZShydWxlLCBjb3VudCkge1xuICAgIGNvbnN0IGlkeCA9IHJ1bGUubm9BYnMgPyBydWxlLnBsdXJhbHMoY291bnQpIDogcnVsZS5wbHVyYWxzKE1hdGguYWJzKGNvdW50KSk7XG4gICAgbGV0IHN1ZmZpeCA9IHJ1bGUubnVtYmVyc1tpZHhdO1xuICAgIGlmICh0aGlzLm9wdGlvbnMuc2ltcGxpZnlQbHVyYWxTdWZmaXggJiYgcnVsZS5udW1iZXJzLmxlbmd0aCA9PT0gMiAmJiBydWxlLm51bWJlcnNbMF0gPT09IDEpIHtcbiAgICAgIGlmIChzdWZmaXggPT09IDIpIHtcbiAgICAgICAgc3VmZml4ID0gJ3BsdXJhbCc7XG4gICAgICB9IGVsc2UgaWYgKHN1ZmZpeCA9PT0gMSkge1xuICAgICAgICBzdWZmaXggPSAnJztcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgcmV0dXJuU3VmZml4ID0gKCkgPT4gdGhpcy5vcHRpb25zLnByZXBlbmQgJiYgc3VmZml4LnRvU3RyaW5nKCkgPyB0aGlzLm9wdGlvbnMucHJlcGVuZCArIHN1ZmZpeC50b1N0cmluZygpIDogc3VmZml4LnRvU3RyaW5nKCk7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5jb21wYXRpYmlsaXR5SlNPTiA9PT0gJ3YxJykge1xuICAgICAgaWYgKHN1ZmZpeCA9PT0gMSkgcmV0dXJuICcnO1xuICAgICAgaWYgKHR5cGVvZiBzdWZmaXggPT09ICdudW1iZXInKSByZXR1cm4gYF9wbHVyYWxfJHtzdWZmaXgudG9TdHJpbmcoKX1gO1xuICAgICAgcmV0dXJuIHJldHVyblN1ZmZpeCgpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLmNvbXBhdGliaWxpdHlKU09OID09PSAndjInKSB7XG4gICAgICByZXR1cm4gcmV0dXJuU3VmZml4KCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLm9wdGlvbnMuc2ltcGxpZnlQbHVyYWxTdWZmaXggJiYgcnVsZS5udW1iZXJzLmxlbmd0aCA9PT0gMiAmJiBydWxlLm51bWJlcnNbMF0gPT09IDEpIHtcbiAgICAgIHJldHVybiByZXR1cm5TdWZmaXgoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5wcmVwZW5kICYmIGlkeC50b1N0cmluZygpID8gdGhpcy5vcHRpb25zLnByZXBlbmQgKyBpZHgudG9TdHJpbmcoKSA6IGlkeC50b1N0cmluZygpO1xuICB9XG4gIHNob3VsZFVzZUludGxBcGkoKSB7XG4gICAgcmV0dXJuICFub25JbnRsVmVyc2lvbnMuaW5jbHVkZXModGhpcy5vcHRpb25zLmNvbXBhdGliaWxpdHlKU09OKTtcbiAgfVxufVxuXG5jb25zdCBkZWVwRmluZFdpdGhEZWZhdWx0cyA9IGZ1bmN0aW9uIChkYXRhLCBkZWZhdWx0RGF0YSwga2V5KSB7XG4gIGxldCBrZXlTZXBhcmF0b3IgPSBhcmd1bWVudHMubGVuZ3RoID4gMyAmJiBhcmd1bWVudHNbM10gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1szXSA6ICcuJztcbiAgbGV0IGlnbm9yZUpTT05TdHJ1Y3R1cmUgPSBhcmd1bWVudHMubGVuZ3RoID4gNCAmJiBhcmd1bWVudHNbNF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1s0XSA6IHRydWU7XG4gIGxldCBwYXRoID0gZ2V0UGF0aFdpdGhEZWZhdWx0cyhkYXRhLCBkZWZhdWx0RGF0YSwga2V5KTtcbiAgaWYgKCFwYXRoICYmIGlnbm9yZUpTT05TdHJ1Y3R1cmUgJiYgdHlwZW9mIGtleSA9PT0gJ3N0cmluZycpIHtcbiAgICBwYXRoID0gZGVlcEZpbmQoZGF0YSwga2V5LCBrZXlTZXBhcmF0b3IpO1xuICAgIGlmIChwYXRoID09PSB1bmRlZmluZWQpIHBhdGggPSBkZWVwRmluZChkZWZhdWx0RGF0YSwga2V5LCBrZXlTZXBhcmF0b3IpO1xuICB9XG4gIHJldHVybiBwYXRoO1xufTtcbmNvbnN0IHJlZ2V4U2FmZSA9IHZhbCA9PiB2YWwucmVwbGFjZSgvXFwkL2csICckJCQkJyk7XG5jbGFzcyBJbnRlcnBvbGF0b3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDoge307XG4gICAgdGhpcy5sb2dnZXIgPSBiYXNlTG9nZ2VyLmNyZWF0ZSgnaW50ZXJwb2xhdG9yJyk7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLmZvcm1hdCA9IG9wdGlvbnMuaW50ZXJwb2xhdGlvbiAmJiBvcHRpb25zLmludGVycG9sYXRpb24uZm9ybWF0IHx8ICh2YWx1ZSA9PiB2YWx1ZSk7XG4gICAgdGhpcy5pbml0KG9wdGlvbnMpO1xuICB9XG4gIGluaXQoKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IHt9O1xuICAgIGlmICghb3B0aW9ucy5pbnRlcnBvbGF0aW9uKSBvcHRpb25zLmludGVycG9sYXRpb24gPSB7XG4gICAgICBlc2NhcGVWYWx1ZTogdHJ1ZVxuICAgIH07XG4gICAgY29uc3Qge1xuICAgICAgZXNjYXBlOiBlc2NhcGUkMSxcbiAgICAgIGVzY2FwZVZhbHVlLFxuICAgICAgdXNlUmF3VmFsdWVUb0VzY2FwZSxcbiAgICAgIHByZWZpeCxcbiAgICAgIHByZWZpeEVzY2FwZWQsXG4gICAgICBzdWZmaXgsXG4gICAgICBzdWZmaXhFc2NhcGVkLFxuICAgICAgZm9ybWF0U2VwYXJhdG9yLFxuICAgICAgdW5lc2NhcGVTdWZmaXgsXG4gICAgICB1bmVzY2FwZVByZWZpeCxcbiAgICAgIG5lc3RpbmdQcmVmaXgsXG4gICAgICBuZXN0aW5nUHJlZml4RXNjYXBlZCxcbiAgICAgIG5lc3RpbmdTdWZmaXgsXG4gICAgICBuZXN0aW5nU3VmZml4RXNjYXBlZCxcbiAgICAgIG5lc3RpbmdPcHRpb25zU2VwYXJhdG9yLFxuICAgICAgbWF4UmVwbGFjZXMsXG4gICAgICBhbHdheXNGb3JtYXRcbiAgICB9ID0gb3B0aW9ucy5pbnRlcnBvbGF0aW9uO1xuICAgIHRoaXMuZXNjYXBlID0gZXNjYXBlJDEgIT09IHVuZGVmaW5lZCA/IGVzY2FwZSQxIDogZXNjYXBlO1xuICAgIHRoaXMuZXNjYXBlVmFsdWUgPSBlc2NhcGVWYWx1ZSAhPT0gdW5kZWZpbmVkID8gZXNjYXBlVmFsdWUgOiB0cnVlO1xuICAgIHRoaXMudXNlUmF3VmFsdWVUb0VzY2FwZSA9IHVzZVJhd1ZhbHVlVG9Fc2NhcGUgIT09IHVuZGVmaW5lZCA/IHVzZVJhd1ZhbHVlVG9Fc2NhcGUgOiBmYWxzZTtcbiAgICB0aGlzLnByZWZpeCA9IHByZWZpeCA/IHJlZ2V4RXNjYXBlKHByZWZpeCkgOiBwcmVmaXhFc2NhcGVkIHx8ICd7eyc7XG4gICAgdGhpcy5zdWZmaXggPSBzdWZmaXggPyByZWdleEVzY2FwZShzdWZmaXgpIDogc3VmZml4RXNjYXBlZCB8fCAnfX0nO1xuICAgIHRoaXMuZm9ybWF0U2VwYXJhdG9yID0gZm9ybWF0U2VwYXJhdG9yIHx8ICcsJztcbiAgICB0aGlzLnVuZXNjYXBlUHJlZml4ID0gdW5lc2NhcGVTdWZmaXggPyAnJyA6IHVuZXNjYXBlUHJlZml4IHx8ICctJztcbiAgICB0aGlzLnVuZXNjYXBlU3VmZml4ID0gdGhpcy51bmVzY2FwZVByZWZpeCA/ICcnIDogdW5lc2NhcGVTdWZmaXggfHwgJyc7XG4gICAgdGhpcy5uZXN0aW5nUHJlZml4ID0gbmVzdGluZ1ByZWZpeCA/IHJlZ2V4RXNjYXBlKG5lc3RpbmdQcmVmaXgpIDogbmVzdGluZ1ByZWZpeEVzY2FwZWQgfHwgcmVnZXhFc2NhcGUoJyR0KCcpO1xuICAgIHRoaXMubmVzdGluZ1N1ZmZpeCA9IG5lc3RpbmdTdWZmaXggPyByZWdleEVzY2FwZShuZXN0aW5nU3VmZml4KSA6IG5lc3RpbmdTdWZmaXhFc2NhcGVkIHx8IHJlZ2V4RXNjYXBlKCcpJyk7XG4gICAgdGhpcy5uZXN0aW5nT3B0aW9uc1NlcGFyYXRvciA9IG5lc3RpbmdPcHRpb25zU2VwYXJhdG9yIHx8ICcsJztcbiAgICB0aGlzLm1heFJlcGxhY2VzID0gbWF4UmVwbGFjZXMgfHwgMTAwMDtcbiAgICB0aGlzLmFsd2F5c0Zvcm1hdCA9IGFsd2F5c0Zvcm1hdCAhPT0gdW5kZWZpbmVkID8gYWx3YXlzRm9ybWF0IDogZmFsc2U7XG4gICAgdGhpcy5yZXNldFJlZ0V4cCgpO1xuICB9XG4gIHJlc2V0KCkge1xuICAgIGlmICh0aGlzLm9wdGlvbnMpIHRoaXMuaW5pdCh0aGlzLm9wdGlvbnMpO1xuICB9XG4gIHJlc2V0UmVnRXhwKCkge1xuICAgIGNvbnN0IGdldE9yUmVzZXRSZWdFeHAgPSAoZXhpc3RpbmdSZWdFeHAsIHBhdHRlcm4pID0+IHtcbiAgICAgIGlmIChleGlzdGluZ1JlZ0V4cCAmJiBleGlzdGluZ1JlZ0V4cC5zb3VyY2UgPT09IHBhdHRlcm4pIHtcbiAgICAgICAgZXhpc3RpbmdSZWdFeHAubGFzdEluZGV4ID0gMDtcbiAgICAgICAgcmV0dXJuIGV4aXN0aW5nUmVnRXhwO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBSZWdFeHAocGF0dGVybiwgJ2cnKTtcbiAgICB9O1xuICAgIHRoaXMucmVnZXhwID0gZ2V0T3JSZXNldFJlZ0V4cCh0aGlzLnJlZ2V4cCwgYCR7dGhpcy5wcmVmaXh9KC4rPykke3RoaXMuc3VmZml4fWApO1xuICAgIHRoaXMucmVnZXhwVW5lc2NhcGUgPSBnZXRPclJlc2V0UmVnRXhwKHRoaXMucmVnZXhwVW5lc2NhcGUsIGAke3RoaXMucHJlZml4fSR7dGhpcy51bmVzY2FwZVByZWZpeH0oLis/KSR7dGhpcy51bmVzY2FwZVN1ZmZpeH0ke3RoaXMuc3VmZml4fWApO1xuICAgIHRoaXMubmVzdGluZ1JlZ2V4cCA9IGdldE9yUmVzZXRSZWdFeHAodGhpcy5uZXN0aW5nUmVnZXhwLCBgJHt0aGlzLm5lc3RpbmdQcmVmaXh9KC4rPykke3RoaXMubmVzdGluZ1N1ZmZpeH1gKTtcbiAgfVxuICBpbnRlcnBvbGF0ZShzdHIsIGRhdGEsIGxuZywgb3B0aW9ucykge1xuICAgIGxldCBtYXRjaDtcbiAgICBsZXQgdmFsdWU7XG4gICAgbGV0IHJlcGxhY2VzO1xuICAgIGNvbnN0IGRlZmF1bHREYXRhID0gdGhpcy5vcHRpb25zICYmIHRoaXMub3B0aW9ucy5pbnRlcnBvbGF0aW9uICYmIHRoaXMub3B0aW9ucy5pbnRlcnBvbGF0aW9uLmRlZmF1bHRWYXJpYWJsZXMgfHwge307XG4gICAgY29uc3QgaGFuZGxlRm9ybWF0ID0ga2V5ID0+IHtcbiAgICAgIGlmIChrZXkuaW5kZXhPZih0aGlzLmZvcm1hdFNlcGFyYXRvcikgPCAwKSB7XG4gICAgICAgIGNvbnN0IHBhdGggPSBkZWVwRmluZFdpdGhEZWZhdWx0cyhkYXRhLCBkZWZhdWx0RGF0YSwga2V5LCB0aGlzLm9wdGlvbnMua2V5U2VwYXJhdG9yLCB0aGlzLm9wdGlvbnMuaWdub3JlSlNPTlN0cnVjdHVyZSk7XG4gICAgICAgIHJldHVybiB0aGlzLmFsd2F5c0Zvcm1hdCA/IHRoaXMuZm9ybWF0KHBhdGgsIHVuZGVmaW5lZCwgbG5nLCB7XG4gICAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgICAuLi5kYXRhLFxuICAgICAgICAgIGludGVycG9sYXRpb25rZXk6IGtleVxuICAgICAgICB9KSA6IHBhdGg7XG4gICAgICB9XG4gICAgICBjb25zdCBwID0ga2V5LnNwbGl0KHRoaXMuZm9ybWF0U2VwYXJhdG9yKTtcbiAgICAgIGNvbnN0IGsgPSBwLnNoaWZ0KCkudHJpbSgpO1xuICAgICAgY29uc3QgZiA9IHAuam9pbih0aGlzLmZvcm1hdFNlcGFyYXRvcikudHJpbSgpO1xuICAgICAgcmV0dXJuIHRoaXMuZm9ybWF0KGRlZXBGaW5kV2l0aERlZmF1bHRzKGRhdGEsIGRlZmF1bHREYXRhLCBrLCB0aGlzLm9wdGlvbnMua2V5U2VwYXJhdG9yLCB0aGlzLm9wdGlvbnMuaWdub3JlSlNPTlN0cnVjdHVyZSksIGYsIGxuZywge1xuICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICAuLi5kYXRhLFxuICAgICAgICBpbnRlcnBvbGF0aW9ua2V5OiBrXG4gICAgICB9KTtcbiAgICB9O1xuICAgIHRoaXMucmVzZXRSZWdFeHAoKTtcbiAgICBjb25zdCBtaXNzaW5nSW50ZXJwb2xhdGlvbkhhbmRsZXIgPSBvcHRpb25zICYmIG9wdGlvbnMubWlzc2luZ0ludGVycG9sYXRpb25IYW5kbGVyIHx8IHRoaXMub3B0aW9ucy5taXNzaW5nSW50ZXJwb2xhdGlvbkhhbmRsZXI7XG4gICAgY29uc3Qgc2tpcE9uVmFyaWFibGVzID0gb3B0aW9ucyAmJiBvcHRpb25zLmludGVycG9sYXRpb24gJiYgb3B0aW9ucy5pbnRlcnBvbGF0aW9uLnNraXBPblZhcmlhYmxlcyAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy5pbnRlcnBvbGF0aW9uLnNraXBPblZhcmlhYmxlcyA6IHRoaXMub3B0aW9ucy5pbnRlcnBvbGF0aW9uLnNraXBPblZhcmlhYmxlcztcbiAgICBjb25zdCB0b2RvcyA9IFt7XG4gICAgICByZWdleDogdGhpcy5yZWdleHBVbmVzY2FwZSxcbiAgICAgIHNhZmVWYWx1ZTogdmFsID0+IHJlZ2V4U2FmZSh2YWwpXG4gICAgfSwge1xuICAgICAgcmVnZXg6IHRoaXMucmVnZXhwLFxuICAgICAgc2FmZVZhbHVlOiB2YWwgPT4gdGhpcy5lc2NhcGVWYWx1ZSA/IHJlZ2V4U2FmZSh0aGlzLmVzY2FwZSh2YWwpKSA6IHJlZ2V4U2FmZSh2YWwpXG4gICAgfV07XG4gICAgdG9kb3MuZm9yRWFjaCh0b2RvID0+IHtcbiAgICAgIHJlcGxhY2VzID0gMDtcbiAgICAgIHdoaWxlIChtYXRjaCA9IHRvZG8ucmVnZXguZXhlYyhzdHIpKSB7XG4gICAgICAgIGNvbnN0IG1hdGNoZWRWYXIgPSBtYXRjaFsxXS50cmltKCk7XG4gICAgICAgIHZhbHVlID0gaGFuZGxlRm9ybWF0KG1hdGNoZWRWYXIpO1xuICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGlmICh0eXBlb2YgbWlzc2luZ0ludGVycG9sYXRpb25IYW5kbGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjb25zdCB0ZW1wID0gbWlzc2luZ0ludGVycG9sYXRpb25IYW5kbGVyKHN0ciwgbWF0Y2gsIG9wdGlvbnMpO1xuICAgICAgICAgICAgdmFsdWUgPSB0eXBlb2YgdGVtcCA9PT0gJ3N0cmluZycgPyB0ZW1wIDogJyc7XG4gICAgICAgICAgfSBlbHNlIGlmIChvcHRpb25zICYmIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvcHRpb25zLCBtYXRjaGVkVmFyKSkge1xuICAgICAgICAgICAgdmFsdWUgPSAnJztcbiAgICAgICAgICB9IGVsc2UgaWYgKHNraXBPblZhcmlhYmxlcykge1xuICAgICAgICAgICAgdmFsdWUgPSBtYXRjaFswXTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmxvZ2dlci53YXJuKGBtaXNzZWQgdG8gcGFzcyBpbiB2YXJpYWJsZSAke21hdGNoZWRWYXJ9IGZvciBpbnRlcnBvbGF0aW5nICR7c3RyfWApO1xuICAgICAgICAgICAgdmFsdWUgPSAnJztcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJyAmJiAhdGhpcy51c2VSYXdWYWx1ZVRvRXNjYXBlKSB7XG4gICAgICAgICAgdmFsdWUgPSBtYWtlU3RyaW5nKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzYWZlVmFsdWUgPSB0b2RvLnNhZmVWYWx1ZSh2YWx1ZSk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKG1hdGNoWzBdLCBzYWZlVmFsdWUpO1xuICAgICAgICBpZiAoc2tpcE9uVmFyaWFibGVzKSB7XG4gICAgICAgICAgdG9kby5yZWdleC5sYXN0SW5kZXggKz0gdmFsdWUubGVuZ3RoO1xuICAgICAgICAgIHRvZG8ucmVnZXgubGFzdEluZGV4IC09IG1hdGNoWzBdLmxlbmd0aDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0b2RvLnJlZ2V4Lmxhc3RJbmRleCA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgcmVwbGFjZXMrKztcbiAgICAgICAgaWYgKHJlcGxhY2VzID49IHRoaXMubWF4UmVwbGFjZXMpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBzdHI7XG4gIH1cbiAgbmVzdChzdHIsIGZjKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6IHt9O1xuICAgIGxldCBtYXRjaDtcbiAgICBsZXQgdmFsdWU7XG4gICAgbGV0IGNsb25lZE9wdGlvbnM7XG4gICAgY29uc3QgaGFuZGxlSGFzT3B0aW9ucyA9IChrZXksIGluaGVyaXRlZE9wdGlvbnMpID0+IHtcbiAgICAgIGNvbnN0IHNlcCA9IHRoaXMubmVzdGluZ09wdGlvbnNTZXBhcmF0b3I7XG4gICAgICBpZiAoa2V5LmluZGV4T2Yoc2VwKSA8IDApIHJldHVybiBrZXk7XG4gICAgICBjb25zdCBjID0ga2V5LnNwbGl0KG5ldyBSZWdFeHAoYCR7c2VwfVsgXSp7YCkpO1xuICAgICAgbGV0IG9wdGlvbnNTdHJpbmcgPSBgeyR7Y1sxXX1gO1xuICAgICAga2V5ID0gY1swXTtcbiAgICAgIG9wdGlvbnNTdHJpbmcgPSB0aGlzLmludGVycG9sYXRlKG9wdGlvbnNTdHJpbmcsIGNsb25lZE9wdGlvbnMpO1xuICAgICAgY29uc3QgbWF0Y2hlZFNpbmdsZVF1b3RlcyA9IG9wdGlvbnNTdHJpbmcubWF0Y2goLycvZyk7XG4gICAgICBjb25zdCBtYXRjaGVkRG91YmxlUXVvdGVzID0gb3B0aW9uc1N0cmluZy5tYXRjaCgvXCIvZyk7XG4gICAgICBpZiAobWF0Y2hlZFNpbmdsZVF1b3RlcyAmJiBtYXRjaGVkU2luZ2xlUXVvdGVzLmxlbmd0aCAlIDIgPT09IDAgJiYgIW1hdGNoZWREb3VibGVRdW90ZXMgfHwgbWF0Y2hlZERvdWJsZVF1b3Rlcy5sZW5ndGggJSAyICE9PSAwKSB7XG4gICAgICAgIG9wdGlvbnNTdHJpbmcgPSBvcHRpb25zU3RyaW5nLnJlcGxhY2UoLycvZywgJ1wiJyk7XG4gICAgICB9XG4gICAgICB0cnkge1xuICAgICAgICBjbG9uZWRPcHRpb25zID0gSlNPTi5wYXJzZShvcHRpb25zU3RyaW5nKTtcbiAgICAgICAgaWYgKGluaGVyaXRlZE9wdGlvbnMpIGNsb25lZE9wdGlvbnMgPSB7XG4gICAgICAgICAgLi4uaW5oZXJpdGVkT3B0aW9ucyxcbiAgICAgICAgICAuLi5jbG9uZWRPcHRpb25zXG4gICAgICAgIH07XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLndhcm4oYGZhaWxlZCBwYXJzaW5nIG9wdGlvbnMgc3RyaW5nIGluIG5lc3RpbmcgZm9yIGtleSAke2tleX1gLCBlKTtcbiAgICAgICAgcmV0dXJuIGAke2tleX0ke3NlcH0ke29wdGlvbnNTdHJpbmd9YDtcbiAgICAgIH1cbiAgICAgIGlmIChjbG9uZWRPcHRpb25zLmRlZmF1bHRWYWx1ZSAmJiBjbG9uZWRPcHRpb25zLmRlZmF1bHRWYWx1ZS5pbmRleE9mKHRoaXMucHJlZml4KSA+IC0xKSBkZWxldGUgY2xvbmVkT3B0aW9ucy5kZWZhdWx0VmFsdWU7XG4gICAgICByZXR1cm4ga2V5O1xuICAgIH07XG4gICAgd2hpbGUgKG1hdGNoID0gdGhpcy5uZXN0aW5nUmVnZXhwLmV4ZWMoc3RyKSkge1xuICAgICAgbGV0IGZvcm1hdHRlcnMgPSBbXTtcbiAgICAgIGNsb25lZE9wdGlvbnMgPSB7XG4gICAgICAgIC4uLm9wdGlvbnNcbiAgICAgIH07XG4gICAgICBjbG9uZWRPcHRpb25zID0gY2xvbmVkT3B0aW9ucy5yZXBsYWNlICYmIHR5cGVvZiBjbG9uZWRPcHRpb25zLnJlcGxhY2UgIT09ICdzdHJpbmcnID8gY2xvbmVkT3B0aW9ucy5yZXBsYWNlIDogY2xvbmVkT3B0aW9ucztcbiAgICAgIGNsb25lZE9wdGlvbnMuYXBwbHlQb3N0UHJvY2Vzc29yID0gZmFsc2U7XG4gICAgICBkZWxldGUgY2xvbmVkT3B0aW9ucy5kZWZhdWx0VmFsdWU7XG4gICAgICBsZXQgZG9SZWR1Y2UgPSBmYWxzZTtcbiAgICAgIGlmIChtYXRjaFswXS5pbmRleE9mKHRoaXMuZm9ybWF0U2VwYXJhdG9yKSAhPT0gLTEgJiYgIS97Lip9Ly50ZXN0KG1hdGNoWzFdKSkge1xuICAgICAgICBjb25zdCByID0gbWF0Y2hbMV0uc3BsaXQodGhpcy5mb3JtYXRTZXBhcmF0b3IpLm1hcChlbGVtID0+IGVsZW0udHJpbSgpKTtcbiAgICAgICAgbWF0Y2hbMV0gPSByLnNoaWZ0KCk7XG4gICAgICAgIGZvcm1hdHRlcnMgPSByO1xuICAgICAgICBkb1JlZHVjZSA9IHRydWU7XG4gICAgICB9XG4gICAgICB2YWx1ZSA9IGZjKGhhbmRsZUhhc09wdGlvbnMuY2FsbCh0aGlzLCBtYXRjaFsxXS50cmltKCksIGNsb25lZE9wdGlvbnMpLCBjbG9uZWRPcHRpb25zKTtcbiAgICAgIGlmICh2YWx1ZSAmJiBtYXRjaFswXSA9PT0gc3RyICYmIHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycpIHJldHVybiB2YWx1ZTtcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSB2YWx1ZSA9IG1ha2VTdHJpbmcodmFsdWUpO1xuICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICB0aGlzLmxvZ2dlci53YXJuKGBtaXNzZWQgdG8gcmVzb2x2ZSAke21hdGNoWzFdfSBmb3IgbmVzdGluZyAke3N0cn1gKTtcbiAgICAgICAgdmFsdWUgPSAnJztcbiAgICAgIH1cbiAgICAgIGlmIChkb1JlZHVjZSkge1xuICAgICAgICB2YWx1ZSA9IGZvcm1hdHRlcnMucmVkdWNlKCh2LCBmKSA9PiB0aGlzLmZvcm1hdCh2LCBmLCBvcHRpb25zLmxuZywge1xuICAgICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgICAgaW50ZXJwb2xhdGlvbmtleTogbWF0Y2hbMV0udHJpbSgpXG4gICAgICAgIH0pLCB2YWx1ZS50cmltKCkpO1xuICAgICAgfVxuICAgICAgc3RyID0gc3RyLnJlcGxhY2UobWF0Y2hbMF0sIHZhbHVlKTtcbiAgICAgIHRoaXMucmVnZXhwLmxhc3RJbmRleCA9IDA7XG4gICAgfVxuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuY29uc3QgcGFyc2VGb3JtYXRTdHIgPSBmb3JtYXRTdHIgPT4ge1xuICBsZXQgZm9ybWF0TmFtZSA9IGZvcm1hdFN0ci50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcbiAgY29uc3QgZm9ybWF0T3B0aW9ucyA9IHt9O1xuICBpZiAoZm9ybWF0U3RyLmluZGV4T2YoJygnKSA+IC0xKSB7XG4gICAgY29uc3QgcCA9IGZvcm1hdFN0ci5zcGxpdCgnKCcpO1xuICAgIGZvcm1hdE5hbWUgPSBwWzBdLnRvTG93ZXJDYXNlKCkudHJpbSgpO1xuICAgIGNvbnN0IG9wdFN0ciA9IHBbMV0uc3Vic3RyaW5nKDAsIHBbMV0ubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGZvcm1hdE5hbWUgPT09ICdjdXJyZW5jeScgJiYgb3B0U3RyLmluZGV4T2YoJzonKSA8IDApIHtcbiAgICAgIGlmICghZm9ybWF0T3B0aW9ucy5jdXJyZW5jeSkgZm9ybWF0T3B0aW9ucy5jdXJyZW5jeSA9IG9wdFN0ci50cmltKCk7XG4gICAgfSBlbHNlIGlmIChmb3JtYXROYW1lID09PSAncmVsYXRpdmV0aW1lJyAmJiBvcHRTdHIuaW5kZXhPZignOicpIDwgMCkge1xuICAgICAgaWYgKCFmb3JtYXRPcHRpb25zLnJhbmdlKSBmb3JtYXRPcHRpb25zLnJhbmdlID0gb3B0U3RyLnRyaW0oKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3Qgb3B0cyA9IG9wdFN0ci5zcGxpdCgnOycpO1xuICAgICAgb3B0cy5mb3JFYWNoKG9wdCA9PiB7XG4gICAgICAgIGlmIChvcHQpIHtcbiAgICAgICAgICBjb25zdCBba2V5LCAuLi5yZXN0XSA9IG9wdC5zcGxpdCgnOicpO1xuICAgICAgICAgIGNvbnN0IHZhbCA9IHJlc3Quam9pbignOicpLnRyaW0oKS5yZXBsYWNlKC9eJyt8JyskL2csICcnKTtcbiAgICAgICAgICBjb25zdCB0cmltbWVkS2V5ID0ga2V5LnRyaW0oKTtcbiAgICAgICAgICBpZiAoIWZvcm1hdE9wdGlvbnNbdHJpbW1lZEtleV0pIGZvcm1hdE9wdGlvbnNbdHJpbW1lZEtleV0gPSB2YWw7XG4gICAgICAgICAgaWYgKHZhbCA9PT0gJ2ZhbHNlJykgZm9ybWF0T3B0aW9uc1t0cmltbWVkS2V5XSA9IGZhbHNlO1xuICAgICAgICAgIGlmICh2YWwgPT09ICd0cnVlJykgZm9ybWF0T3B0aW9uc1t0cmltbWVkS2V5XSA9IHRydWU7XG4gICAgICAgICAgaWYgKCFpc05hTih2YWwpKSBmb3JtYXRPcHRpb25zW3RyaW1tZWRLZXldID0gcGFyc2VJbnQodmFsLCAxMCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4ge1xuICAgIGZvcm1hdE5hbWUsXG4gICAgZm9ybWF0T3B0aW9uc1xuICB9O1xufTtcbmNvbnN0IGNyZWF0ZUNhY2hlZEZvcm1hdHRlciA9IGZuID0+IHtcbiAgY29uc3QgY2FjaGUgPSB7fTtcbiAgcmV0dXJuICh2YWwsIGxuZywgb3B0aW9ucykgPT4ge1xuICAgIGNvbnN0IGtleSA9IGxuZyArIEpTT04uc3RyaW5naWZ5KG9wdGlvbnMpO1xuICAgIGxldCBmb3JtYXR0ZXIgPSBjYWNoZVtrZXldO1xuICAgIGlmICghZm9ybWF0dGVyKSB7XG4gICAgICBmb3JtYXR0ZXIgPSBmbihnZXRDbGVhbmVkQ29kZShsbmcpLCBvcHRpb25zKTtcbiAgICAgIGNhY2hlW2tleV0gPSBmb3JtYXR0ZXI7XG4gICAgfVxuICAgIHJldHVybiBmb3JtYXR0ZXIodmFsKTtcbiAgfTtcbn07XG5jbGFzcyBGb3JtYXR0ZXIge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDoge307XG4gICAgdGhpcy5sb2dnZXIgPSBiYXNlTG9nZ2VyLmNyZWF0ZSgnZm9ybWF0dGVyJyk7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLmZvcm1hdHMgPSB7XG4gICAgICBudW1iZXI6IGNyZWF0ZUNhY2hlZEZvcm1hdHRlcigobG5nLCBvcHQpID0+IHtcbiAgICAgICAgY29uc3QgZm9ybWF0dGVyID0gbmV3IEludGwuTnVtYmVyRm9ybWF0KGxuZywge1xuICAgICAgICAgIC4uLm9wdFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHZhbCA9PiBmb3JtYXR0ZXIuZm9ybWF0KHZhbCk7XG4gICAgICB9KSxcbiAgICAgIGN1cnJlbmN5OiBjcmVhdGVDYWNoZWRGb3JtYXR0ZXIoKGxuZywgb3B0KSA9PiB7XG4gICAgICAgIGNvbnN0IGZvcm1hdHRlciA9IG5ldyBJbnRsLk51bWJlckZvcm1hdChsbmcsIHtcbiAgICAgICAgICAuLi5vcHQsXG4gICAgICAgICAgc3R5bGU6ICdjdXJyZW5jeSdcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB2YWwgPT4gZm9ybWF0dGVyLmZvcm1hdCh2YWwpO1xuICAgICAgfSksXG4gICAgICBkYXRldGltZTogY3JlYXRlQ2FjaGVkRm9ybWF0dGVyKChsbmcsIG9wdCkgPT4ge1xuICAgICAgICBjb25zdCBmb3JtYXR0ZXIgPSBuZXcgSW50bC5EYXRlVGltZUZvcm1hdChsbmcsIHtcbiAgICAgICAgICAuLi5vcHRcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB2YWwgPT4gZm9ybWF0dGVyLmZvcm1hdCh2YWwpO1xuICAgICAgfSksXG4gICAgICByZWxhdGl2ZXRpbWU6IGNyZWF0ZUNhY2hlZEZvcm1hdHRlcigobG5nLCBvcHQpID0+IHtcbiAgICAgICAgY29uc3QgZm9ybWF0dGVyID0gbmV3IEludGwuUmVsYXRpdmVUaW1lRm9ybWF0KGxuZywge1xuICAgICAgICAgIC4uLm9wdFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHZhbCA9PiBmb3JtYXR0ZXIuZm9ybWF0KHZhbCwgb3B0LnJhbmdlIHx8ICdkYXknKTtcbiAgICAgIH0pLFxuICAgICAgbGlzdDogY3JlYXRlQ2FjaGVkRm9ybWF0dGVyKChsbmcsIG9wdCkgPT4ge1xuICAgICAgICBjb25zdCBmb3JtYXR0ZXIgPSBuZXcgSW50bC5MaXN0Rm9ybWF0KGxuZywge1xuICAgICAgICAgIC4uLm9wdFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHZhbCA9PiBmb3JtYXR0ZXIuZm9ybWF0KHZhbCk7XG4gICAgICB9KVxuICAgIH07XG4gICAgdGhpcy5pbml0KG9wdGlvbnMpO1xuICB9XG4gIGluaXQoc2VydmljZXMpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge1xuICAgICAgaW50ZXJwb2xhdGlvbjoge31cbiAgICB9O1xuICAgIGNvbnN0IGlPcHRzID0gb3B0aW9ucy5pbnRlcnBvbGF0aW9uO1xuICAgIHRoaXMuZm9ybWF0U2VwYXJhdG9yID0gaU9wdHMuZm9ybWF0U2VwYXJhdG9yID8gaU9wdHMuZm9ybWF0U2VwYXJhdG9yIDogaU9wdHMuZm9ybWF0U2VwYXJhdG9yIHx8ICcsJztcbiAgfVxuICBhZGQobmFtZSwgZmMpIHtcbiAgICB0aGlzLmZvcm1hdHNbbmFtZS50b0xvd2VyQ2FzZSgpLnRyaW0oKV0gPSBmYztcbiAgfVxuICBhZGRDYWNoZWQobmFtZSwgZmMpIHtcbiAgICB0aGlzLmZvcm1hdHNbbmFtZS50b0xvd2VyQ2FzZSgpLnRyaW0oKV0gPSBjcmVhdGVDYWNoZWRGb3JtYXR0ZXIoZmMpO1xuICB9XG4gIGZvcm1hdCh2YWx1ZSwgZm9ybWF0LCBsbmcpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAzICYmIGFyZ3VtZW50c1szXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzNdIDoge307XG4gICAgY29uc3QgZm9ybWF0cyA9IGZvcm1hdC5zcGxpdCh0aGlzLmZvcm1hdFNlcGFyYXRvcik7XG4gICAgaWYgKGZvcm1hdHMubGVuZ3RoID4gMSAmJiBmb3JtYXRzWzBdLmluZGV4T2YoJygnKSA+IDEgJiYgZm9ybWF0c1swXS5pbmRleE9mKCcpJykgPCAwICYmIGZvcm1hdHMuZmluZChmID0+IGYuaW5kZXhPZignKScpID4gLTEpKSB7XG4gICAgICBjb25zdCBsYXN0SW5kZXggPSBmb3JtYXRzLmZpbmRJbmRleChmID0+IGYuaW5kZXhPZignKScpID4gLTEpO1xuICAgICAgZm9ybWF0c1swXSA9IFtmb3JtYXRzWzBdLCAuLi5mb3JtYXRzLnNwbGljZSgxLCBsYXN0SW5kZXgpXS5qb2luKHRoaXMuZm9ybWF0U2VwYXJhdG9yKTtcbiAgICB9XG4gICAgY29uc3QgcmVzdWx0ID0gZm9ybWF0cy5yZWR1Y2UoKG1lbSwgZikgPT4ge1xuICAgICAgY29uc3Qge1xuICAgICAgICBmb3JtYXROYW1lLFxuICAgICAgICBmb3JtYXRPcHRpb25zXG4gICAgICB9ID0gcGFyc2VGb3JtYXRTdHIoZik7XG4gICAgICBpZiAodGhpcy5mb3JtYXRzW2Zvcm1hdE5hbWVdKSB7XG4gICAgICAgIGxldCBmb3JtYXR0ZWQgPSBtZW07XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgdmFsT3B0aW9ucyA9IG9wdGlvbnMgJiYgb3B0aW9ucy5mb3JtYXRQYXJhbXMgJiYgb3B0aW9ucy5mb3JtYXRQYXJhbXNbb3B0aW9ucy5pbnRlcnBvbGF0aW9ua2V5XSB8fCB7fTtcbiAgICAgICAgICBjb25zdCBsID0gdmFsT3B0aW9ucy5sb2NhbGUgfHwgdmFsT3B0aW9ucy5sbmcgfHwgb3B0aW9ucy5sb2NhbGUgfHwgb3B0aW9ucy5sbmcgfHwgbG5nO1xuICAgICAgICAgIGZvcm1hdHRlZCA9IHRoaXMuZm9ybWF0c1tmb3JtYXROYW1lXShtZW0sIGwsIHtcbiAgICAgICAgICAgIC4uLmZvcm1hdE9wdGlvbnMsXG4gICAgICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICAgICAgLi4udmFsT3B0aW9uc1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIHRoaXMubG9nZ2VyLndhcm4oZXJyb3IpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmb3JtYXR0ZWQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmxvZ2dlci53YXJuKGB0aGVyZSB3YXMgbm8gZm9ybWF0IGZ1bmN0aW9uIGZvciAke2Zvcm1hdE5hbWV9YCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbWVtO1xuICAgIH0sIHZhbHVlKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG59XG5cbmNvbnN0IHJlbW92ZVBlbmRpbmcgPSAocSwgbmFtZSkgPT4ge1xuICBpZiAocS5wZW5kaW5nW25hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICBkZWxldGUgcS5wZW5kaW5nW25hbWVdO1xuICAgIHEucGVuZGluZ0NvdW50LS07XG4gIH1cbn07XG5jbGFzcyBDb25uZWN0b3IgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICBjb25zdHJ1Y3RvcihiYWNrZW5kLCBzdG9yZSwgc2VydmljZXMpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAzICYmIGFyZ3VtZW50c1szXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzNdIDoge307XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmJhY2tlbmQgPSBiYWNrZW5kO1xuICAgIHRoaXMuc3RvcmUgPSBzdG9yZTtcbiAgICB0aGlzLnNlcnZpY2VzID0gc2VydmljZXM7XG4gICAgdGhpcy5sYW5ndWFnZVV0aWxzID0gc2VydmljZXMubGFuZ3VhZ2VVdGlscztcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMubG9nZ2VyID0gYmFzZUxvZ2dlci5jcmVhdGUoJ2JhY2tlbmRDb25uZWN0b3InKTtcbiAgICB0aGlzLndhaXRpbmdSZWFkcyA9IFtdO1xuICAgIHRoaXMubWF4UGFyYWxsZWxSZWFkcyA9IG9wdGlvbnMubWF4UGFyYWxsZWxSZWFkcyB8fCAxMDtcbiAgICB0aGlzLnJlYWRpbmdDYWxscyA9IDA7XG4gICAgdGhpcy5tYXhSZXRyaWVzID0gb3B0aW9ucy5tYXhSZXRyaWVzID49IDAgPyBvcHRpb25zLm1heFJldHJpZXMgOiA1O1xuICAgIHRoaXMucmV0cnlUaW1lb3V0ID0gb3B0aW9ucy5yZXRyeVRpbWVvdXQgPj0gMSA/IG9wdGlvbnMucmV0cnlUaW1lb3V0IDogMzUwO1xuICAgIHRoaXMuc3RhdGUgPSB7fTtcbiAgICB0aGlzLnF1ZXVlID0gW107XG4gICAgaWYgKHRoaXMuYmFja2VuZCAmJiB0aGlzLmJhY2tlbmQuaW5pdCkge1xuICAgICAgdGhpcy5iYWNrZW5kLmluaXQoc2VydmljZXMsIG9wdGlvbnMuYmFja2VuZCwgb3B0aW9ucyk7XG4gICAgfVxuICB9XG4gIHF1ZXVlTG9hZChsYW5ndWFnZXMsIG5hbWVzcGFjZXMsIG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gICAgY29uc3QgdG9Mb2FkID0ge307XG4gICAgY29uc3QgcGVuZGluZyA9IHt9O1xuICAgIGNvbnN0IHRvTG9hZExhbmd1YWdlcyA9IHt9O1xuICAgIGNvbnN0IHRvTG9hZE5hbWVzcGFjZXMgPSB7fTtcbiAgICBsYW5ndWFnZXMuZm9yRWFjaChsbmcgPT4ge1xuICAgICAgbGV0IGhhc0FsbE5hbWVzcGFjZXMgPSB0cnVlO1xuICAgICAgbmFtZXNwYWNlcy5mb3JFYWNoKG5zID0+IHtcbiAgICAgICAgY29uc3QgbmFtZSA9IGAke2xuZ318JHtuc31gO1xuICAgICAgICBpZiAoIW9wdGlvbnMucmVsb2FkICYmIHRoaXMuc3RvcmUuaGFzUmVzb3VyY2VCdW5kbGUobG5nLCBucykpIHtcbiAgICAgICAgICB0aGlzLnN0YXRlW25hbWVdID0gMjtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlW25hbWVdIDwgMCkgOyBlbHNlIGlmICh0aGlzLnN0YXRlW25hbWVdID09PSAxKSB7XG4gICAgICAgICAgaWYgKHBlbmRpbmdbbmFtZV0gPT09IHVuZGVmaW5lZCkgcGVuZGluZ1tuYW1lXSA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5zdGF0ZVtuYW1lXSA9IDE7XG4gICAgICAgICAgaGFzQWxsTmFtZXNwYWNlcyA9IGZhbHNlO1xuICAgICAgICAgIGlmIChwZW5kaW5nW25hbWVdID09PSB1bmRlZmluZWQpIHBlbmRpbmdbbmFtZV0gPSB0cnVlO1xuICAgICAgICAgIGlmICh0b0xvYWRbbmFtZV0gPT09IHVuZGVmaW5lZCkgdG9Mb2FkW25hbWVdID0gdHJ1ZTtcbiAgICAgICAgICBpZiAodG9Mb2FkTmFtZXNwYWNlc1tuc10gPT09IHVuZGVmaW5lZCkgdG9Mb2FkTmFtZXNwYWNlc1tuc10gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGlmICghaGFzQWxsTmFtZXNwYWNlcykgdG9Mb2FkTGFuZ3VhZ2VzW2xuZ10gPSB0cnVlO1xuICAgIH0pO1xuICAgIGlmIChPYmplY3Qua2V5cyh0b0xvYWQpLmxlbmd0aCB8fCBPYmplY3Qua2V5cyhwZW5kaW5nKS5sZW5ndGgpIHtcbiAgICAgIHRoaXMucXVldWUucHVzaCh7XG4gICAgICAgIHBlbmRpbmcsXG4gICAgICAgIHBlbmRpbmdDb3VudDogT2JqZWN0LmtleXMocGVuZGluZykubGVuZ3RoLFxuICAgICAgICBsb2FkZWQ6IHt9LFxuICAgICAgICBlcnJvcnM6IFtdLFxuICAgICAgICBjYWxsYmFja1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICB0b0xvYWQ6IE9iamVjdC5rZXlzKHRvTG9hZCksXG4gICAgICBwZW5kaW5nOiBPYmplY3Qua2V5cyhwZW5kaW5nKSxcbiAgICAgIHRvTG9hZExhbmd1YWdlczogT2JqZWN0LmtleXModG9Mb2FkTGFuZ3VhZ2VzKSxcbiAgICAgIHRvTG9hZE5hbWVzcGFjZXM6IE9iamVjdC5rZXlzKHRvTG9hZE5hbWVzcGFjZXMpXG4gICAgfTtcbiAgfVxuICBsb2FkZWQobmFtZSwgZXJyLCBkYXRhKSB7XG4gICAgY29uc3QgcyA9IG5hbWUuc3BsaXQoJ3wnKTtcbiAgICBjb25zdCBsbmcgPSBzWzBdO1xuICAgIGNvbnN0IG5zID0gc1sxXTtcbiAgICBpZiAoZXJyKSB0aGlzLmVtaXQoJ2ZhaWxlZExvYWRpbmcnLCBsbmcsIG5zLCBlcnIpO1xuICAgIGlmIChkYXRhKSB7XG4gICAgICB0aGlzLnN0b3JlLmFkZFJlc291cmNlQnVuZGxlKGxuZywgbnMsIGRhdGEsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB7XG4gICAgICAgIHNraXBDb3B5OiB0cnVlXG4gICAgICB9KTtcbiAgICB9XG4gICAgdGhpcy5zdGF0ZVtuYW1lXSA9IGVyciA/IC0xIDogMjtcbiAgICBjb25zdCBsb2FkZWQgPSB7fTtcbiAgICB0aGlzLnF1ZXVlLmZvckVhY2gocSA9PiB7XG4gICAgICBwdXNoUGF0aChxLmxvYWRlZCwgW2xuZ10sIG5zKTtcbiAgICAgIHJlbW92ZVBlbmRpbmcocSwgbmFtZSk7XG4gICAgICBpZiAoZXJyKSBxLmVycm9ycy5wdXNoKGVycik7XG4gICAgICBpZiAocS5wZW5kaW5nQ291bnQgPT09IDAgJiYgIXEuZG9uZSkge1xuICAgICAgICBPYmplY3Qua2V5cyhxLmxvYWRlZCkuZm9yRWFjaChsID0+IHtcbiAgICAgICAgICBpZiAoIWxvYWRlZFtsXSkgbG9hZGVkW2xdID0ge307XG4gICAgICAgICAgY29uc3QgbG9hZGVkS2V5cyA9IHEubG9hZGVkW2xdO1xuICAgICAgICAgIGlmIChsb2FkZWRLZXlzLmxlbmd0aCkge1xuICAgICAgICAgICAgbG9hZGVkS2V5cy5mb3JFYWNoKG4gPT4ge1xuICAgICAgICAgICAgICBpZiAobG9hZGVkW2xdW25dID09PSB1bmRlZmluZWQpIGxvYWRlZFtsXVtuXSA9IHRydWU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBxLmRvbmUgPSB0cnVlO1xuICAgICAgICBpZiAocS5lcnJvcnMubGVuZ3RoKSB7XG4gICAgICAgICAgcS5jYWxsYmFjayhxLmVycm9ycyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcS5jYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy5lbWl0KCdsb2FkZWQnLCBsb2FkZWQpO1xuICAgIHRoaXMucXVldWUgPSB0aGlzLnF1ZXVlLmZpbHRlcihxID0+ICFxLmRvbmUpO1xuICB9XG4gIHJlYWQobG5nLCBucywgZmNOYW1lKSB7XG4gICAgbGV0IHRyaWVkID0gYXJndW1lbnRzLmxlbmd0aCA+IDMgJiYgYXJndW1lbnRzWzNdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbM10gOiAwO1xuICAgIGxldCB3YWl0ID0gYXJndW1lbnRzLmxlbmd0aCA+IDQgJiYgYXJndW1lbnRzWzRdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbNF0gOiB0aGlzLnJldHJ5VGltZW91dDtcbiAgICBsZXQgY2FsbGJhY2sgPSBhcmd1bWVudHMubGVuZ3RoID4gNSA/IGFyZ3VtZW50c1s1XSA6IHVuZGVmaW5lZDtcbiAgICBpZiAoIWxuZy5sZW5ndGgpIHJldHVybiBjYWxsYmFjayhudWxsLCB7fSk7XG4gICAgaWYgKHRoaXMucmVhZGluZ0NhbGxzID49IHRoaXMubWF4UGFyYWxsZWxSZWFkcykge1xuICAgICAgdGhpcy53YWl0aW5nUmVhZHMucHVzaCh7XG4gICAgICAgIGxuZyxcbiAgICAgICAgbnMsXG4gICAgICAgIGZjTmFtZSxcbiAgICAgICAgdHJpZWQsXG4gICAgICAgIHdhaXQsXG4gICAgICAgIGNhbGxiYWNrXG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5yZWFkaW5nQ2FsbHMrKztcbiAgICBjb25zdCByZXNvbHZlciA9IChlcnIsIGRhdGEpID0+IHtcbiAgICAgIHRoaXMucmVhZGluZ0NhbGxzLS07XG4gICAgICBpZiAodGhpcy53YWl0aW5nUmVhZHMubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCBuZXh0ID0gdGhpcy53YWl0aW5nUmVhZHMuc2hpZnQoKTtcbiAgICAgICAgdGhpcy5yZWFkKG5leHQubG5nLCBuZXh0Lm5zLCBuZXh0LmZjTmFtZSwgbmV4dC50cmllZCwgbmV4dC53YWl0LCBuZXh0LmNhbGxiYWNrKTtcbiAgICAgIH1cbiAgICAgIGlmIChlcnIgJiYgZGF0YSAmJiB0cmllZCA8IHRoaXMubWF4UmV0cmllcykge1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICB0aGlzLnJlYWQuY2FsbCh0aGlzLCBsbmcsIG5zLCBmY05hbWUsIHRyaWVkICsgMSwgd2FpdCAqIDIsIGNhbGxiYWNrKTtcbiAgICAgICAgfSwgd2FpdCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNhbGxiYWNrKGVyciwgZGF0YSk7XG4gICAgfTtcbiAgICBjb25zdCBmYyA9IHRoaXMuYmFja2VuZFtmY05hbWVdLmJpbmQodGhpcy5iYWNrZW5kKTtcbiAgICBpZiAoZmMubGVuZ3RoID09PSAyKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByID0gZmMobG5nLCBucyk7XG4gICAgICAgIGlmIChyICYmIHR5cGVvZiByLnRoZW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICByLnRoZW4oZGF0YSA9PiByZXNvbHZlcihudWxsLCBkYXRhKSkuY2F0Y2gocmVzb2x2ZXIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc29sdmVyKG51bGwsIHIpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgcmVzb2x2ZXIoZXJyKTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmV0dXJuIGZjKGxuZywgbnMsIHJlc29sdmVyKTtcbiAgfVxuICBwcmVwYXJlTG9hZGluZyhsYW5ndWFnZXMsIG5hbWVzcGFjZXMpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzJdIDoge307XG4gICAgbGV0IGNhbGxiYWNrID0gYXJndW1lbnRzLmxlbmd0aCA+IDMgPyBhcmd1bWVudHNbM10gOiB1bmRlZmluZWQ7XG4gICAgaWYgKCF0aGlzLmJhY2tlbmQpIHtcbiAgICAgIHRoaXMubG9nZ2VyLndhcm4oJ05vIGJhY2tlbmQgd2FzIGFkZGVkIHZpYSBpMThuZXh0LnVzZS4gV2lsbCBub3QgbG9hZCByZXNvdXJjZXMuJyk7XG4gICAgICByZXR1cm4gY2FsbGJhY2sgJiYgY2FsbGJhY2soKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBsYW5ndWFnZXMgPT09ICdzdHJpbmcnKSBsYW5ndWFnZXMgPSB0aGlzLmxhbmd1YWdlVXRpbHMudG9SZXNvbHZlSGllcmFyY2h5KGxhbmd1YWdlcyk7XG4gICAgaWYgKHR5cGVvZiBuYW1lc3BhY2VzID09PSAnc3RyaW5nJykgbmFtZXNwYWNlcyA9IFtuYW1lc3BhY2VzXTtcbiAgICBjb25zdCB0b0xvYWQgPSB0aGlzLnF1ZXVlTG9hZChsYW5ndWFnZXMsIG5hbWVzcGFjZXMsIG9wdGlvbnMsIGNhbGxiYWNrKTtcbiAgICBpZiAoIXRvTG9hZC50b0xvYWQubGVuZ3RoKSB7XG4gICAgICBpZiAoIXRvTG9hZC5wZW5kaW5nLmxlbmd0aCkgY2FsbGJhY2soKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICB0b0xvYWQudG9Mb2FkLmZvckVhY2gobmFtZSA9PiB7XG4gICAgICB0aGlzLmxvYWRPbmUobmFtZSk7XG4gICAgfSk7XG4gIH1cbiAgbG9hZChsYW5ndWFnZXMsIG5hbWVzcGFjZXMsIGNhbGxiYWNrKSB7XG4gICAgdGhpcy5wcmVwYXJlTG9hZGluZyhsYW5ndWFnZXMsIG5hbWVzcGFjZXMsIHt9LCBjYWxsYmFjayk7XG4gIH1cbiAgcmVsb2FkKGxhbmd1YWdlcywgbmFtZXNwYWNlcywgY2FsbGJhY2spIHtcbiAgICB0aGlzLnByZXBhcmVMb2FkaW5nKGxhbmd1YWdlcywgbmFtZXNwYWNlcywge1xuICAgICAgcmVsb2FkOiB0cnVlXG4gICAgfSwgY2FsbGJhY2spO1xuICB9XG4gIGxvYWRPbmUobmFtZSkge1xuICAgIGxldCBwcmVmaXggPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6ICcnO1xuICAgIGNvbnN0IHMgPSBuYW1lLnNwbGl0KCd8Jyk7XG4gICAgY29uc3QgbG5nID0gc1swXTtcbiAgICBjb25zdCBucyA9IHNbMV07XG4gICAgdGhpcy5yZWFkKGxuZywgbnMsICdyZWFkJywgdW5kZWZpbmVkLCB1bmRlZmluZWQsIChlcnIsIGRhdGEpID0+IHtcbiAgICAgIGlmIChlcnIpIHRoaXMubG9nZ2VyLndhcm4oYCR7cHJlZml4fWxvYWRpbmcgbmFtZXNwYWNlICR7bnN9IGZvciBsYW5ndWFnZSAke2xuZ30gZmFpbGVkYCwgZXJyKTtcbiAgICAgIGlmICghZXJyICYmIGRhdGEpIHRoaXMubG9nZ2VyLmxvZyhgJHtwcmVmaXh9bG9hZGVkIG5hbWVzcGFjZSAke25zfSBmb3IgbGFuZ3VhZ2UgJHtsbmd9YCwgZGF0YSk7XG4gICAgICB0aGlzLmxvYWRlZChuYW1lLCBlcnIsIGRhdGEpO1xuICAgIH0pO1xuICB9XG4gIHNhdmVNaXNzaW5nKGxhbmd1YWdlcywgbmFtZXNwYWNlLCBrZXksIGZhbGxiYWNrVmFsdWUsIGlzVXBkYXRlKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gNSAmJiBhcmd1bWVudHNbNV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1s1XSA6IHt9O1xuICAgIGxldCBjbGIgPSBhcmd1bWVudHMubGVuZ3RoID4gNiAmJiBhcmd1bWVudHNbNl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1s2XSA6ICgpID0+IHt9O1xuICAgIGlmICh0aGlzLnNlcnZpY2VzLnV0aWxzICYmIHRoaXMuc2VydmljZXMudXRpbHMuaGFzTG9hZGVkTmFtZXNwYWNlICYmICF0aGlzLnNlcnZpY2VzLnV0aWxzLmhhc0xvYWRlZE5hbWVzcGFjZShuYW1lc3BhY2UpKSB7XG4gICAgICB0aGlzLmxvZ2dlci53YXJuKGBkaWQgbm90IHNhdmUga2V5IFwiJHtrZXl9XCIgYXMgdGhlIG5hbWVzcGFjZSBcIiR7bmFtZXNwYWNlfVwiIHdhcyBub3QgeWV0IGxvYWRlZGAsICdUaGlzIG1lYW5zIHNvbWV0aGluZyBJUyBXUk9ORyBpbiB5b3VyIHNldHVwLiBZb3UgYWNjZXNzIHRoZSB0IGZ1bmN0aW9uIGJlZm9yZSBpMThuZXh0LmluaXQgLyBpMThuZXh0LmxvYWROYW1lc3BhY2UgLyBpMThuZXh0LmNoYW5nZUxhbmd1YWdlIHdhcyBkb25lLiBXYWl0IGZvciB0aGUgY2FsbGJhY2sgb3IgUHJvbWlzZSB0byByZXNvbHZlIGJlZm9yZSBhY2Nlc3NpbmcgaXQhISEnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGtleSA9PT0gdW5kZWZpbmVkIHx8IGtleSA9PT0gbnVsbCB8fCBrZXkgPT09ICcnKSByZXR1cm47XG4gICAgaWYgKHRoaXMuYmFja2VuZCAmJiB0aGlzLmJhY2tlbmQuY3JlYXRlKSB7XG4gICAgICBjb25zdCBvcHRzID0ge1xuICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICBpc1VwZGF0ZVxuICAgICAgfTtcbiAgICAgIGNvbnN0IGZjID0gdGhpcy5iYWNrZW5kLmNyZWF0ZS5iaW5kKHRoaXMuYmFja2VuZCk7XG4gICAgICBpZiAoZmMubGVuZ3RoIDwgNikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGxldCByO1xuICAgICAgICAgIGlmIChmYy5sZW5ndGggPT09IDUpIHtcbiAgICAgICAgICAgIHIgPSBmYyhsYW5ndWFnZXMsIG5hbWVzcGFjZSwga2V5LCBmYWxsYmFja1ZhbHVlLCBvcHRzKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgciA9IGZjKGxhbmd1YWdlcywgbmFtZXNwYWNlLCBrZXksIGZhbGxiYWNrVmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAociAmJiB0eXBlb2Ygci50aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByLnRoZW4oZGF0YSA9PiBjbGIobnVsbCwgZGF0YSkpLmNhdGNoKGNsYik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNsYihudWxsLCByKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIGNsYihlcnIpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmYyhsYW5ndWFnZXMsIG5hbWVzcGFjZSwga2V5LCBmYWxsYmFja1ZhbHVlLCBjbGIsIG9wdHMpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIWxhbmd1YWdlcyB8fCAhbGFuZ3VhZ2VzWzBdKSByZXR1cm47XG4gICAgdGhpcy5zdG9yZS5hZGRSZXNvdXJjZShsYW5ndWFnZXNbMF0sIG5hbWVzcGFjZSwga2V5LCBmYWxsYmFja1ZhbHVlKTtcbiAgfVxufVxuXG5jb25zdCBnZXQgPSAoKSA9PiAoe1xuICBkZWJ1ZzogZmFsc2UsXG4gIGluaXRJbW1lZGlhdGU6IHRydWUsXG4gIG5zOiBbJ3RyYW5zbGF0aW9uJ10sXG4gIGRlZmF1bHROUzogWyd0cmFuc2xhdGlvbiddLFxuICBmYWxsYmFja0xuZzogWydkZXYnXSxcbiAgZmFsbGJhY2tOUzogZmFsc2UsXG4gIHN1cHBvcnRlZExuZ3M6IGZhbHNlLFxuICBub25FeHBsaWNpdFN1cHBvcnRlZExuZ3M6IGZhbHNlLFxuICBsb2FkOiAnYWxsJyxcbiAgcHJlbG9hZDogZmFsc2UsXG4gIHNpbXBsaWZ5UGx1cmFsU3VmZml4OiB0cnVlLFxuICBrZXlTZXBhcmF0b3I6ICcuJyxcbiAgbnNTZXBhcmF0b3I6ICc6JyxcbiAgcGx1cmFsU2VwYXJhdG9yOiAnXycsXG4gIGNvbnRleHRTZXBhcmF0b3I6ICdfJyxcbiAgcGFydGlhbEJ1bmRsZWRMYW5ndWFnZXM6IGZhbHNlLFxuICBzYXZlTWlzc2luZzogZmFsc2UsXG4gIHVwZGF0ZU1pc3Npbmc6IGZhbHNlLFxuICBzYXZlTWlzc2luZ1RvOiAnZmFsbGJhY2snLFxuICBzYXZlTWlzc2luZ1BsdXJhbHM6IHRydWUsXG4gIG1pc3NpbmdLZXlIYW5kbGVyOiBmYWxzZSxcbiAgbWlzc2luZ0ludGVycG9sYXRpb25IYW5kbGVyOiBmYWxzZSxcbiAgcG9zdFByb2Nlc3M6IGZhbHNlLFxuICBwb3N0UHJvY2Vzc1Bhc3NSZXNvbHZlZDogZmFsc2UsXG4gIHJldHVybk51bGw6IGZhbHNlLFxuICByZXR1cm5FbXB0eVN0cmluZzogdHJ1ZSxcbiAgcmV0dXJuT2JqZWN0czogZmFsc2UsXG4gIGpvaW5BcnJheXM6IGZhbHNlLFxuICByZXR1cm5lZE9iamVjdEhhbmRsZXI6IGZhbHNlLFxuICBwYXJzZU1pc3NpbmdLZXlIYW5kbGVyOiBmYWxzZSxcbiAgYXBwZW5kTmFtZXNwYWNlVG9NaXNzaW5nS2V5OiBmYWxzZSxcbiAgYXBwZW5kTmFtZXNwYWNlVG9DSU1vZGU6IGZhbHNlLFxuICBvdmVybG9hZFRyYW5zbGF0aW9uT3B0aW9uSGFuZGxlcjogYXJncyA9PiB7XG4gICAgbGV0IHJldCA9IHt9O1xuICAgIGlmICh0eXBlb2YgYXJnc1sxXSA9PT0gJ29iamVjdCcpIHJldCA9IGFyZ3NbMV07XG4gICAgaWYgKHR5cGVvZiBhcmdzWzFdID09PSAnc3RyaW5nJykgcmV0LmRlZmF1bHRWYWx1ZSA9IGFyZ3NbMV07XG4gICAgaWYgKHR5cGVvZiBhcmdzWzJdID09PSAnc3RyaW5nJykgcmV0LnREZXNjcmlwdGlvbiA9IGFyZ3NbMl07XG4gICAgaWYgKHR5cGVvZiBhcmdzWzJdID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgYXJnc1szXSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSBhcmdzWzNdIHx8IGFyZ3NbMl07XG4gICAgICBPYmplY3Qua2V5cyhvcHRpb25zKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgIHJldFtrZXldID0gb3B0aW9uc1trZXldO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH0sXG4gIGludGVycG9sYXRpb246IHtcbiAgICBlc2NhcGVWYWx1ZTogdHJ1ZSxcbiAgICBmb3JtYXQ6IHZhbHVlID0+IHZhbHVlLFxuICAgIHByZWZpeDogJ3t7JyxcbiAgICBzdWZmaXg6ICd9fScsXG4gICAgZm9ybWF0U2VwYXJhdG9yOiAnLCcsXG4gICAgdW5lc2NhcGVQcmVmaXg6ICctJyxcbiAgICBuZXN0aW5nUHJlZml4OiAnJHQoJyxcbiAgICBuZXN0aW5nU3VmZml4OiAnKScsXG4gICAgbmVzdGluZ09wdGlvbnNTZXBhcmF0b3I6ICcsJyxcbiAgICBtYXhSZXBsYWNlczogMTAwMCxcbiAgICBza2lwT25WYXJpYWJsZXM6IHRydWVcbiAgfVxufSk7XG5jb25zdCB0cmFuc2Zvcm1PcHRpb25zID0gb3B0aW9ucyA9PiB7XG4gIGlmICh0eXBlb2Ygb3B0aW9ucy5ucyA9PT0gJ3N0cmluZycpIG9wdGlvbnMubnMgPSBbb3B0aW9ucy5uc107XG4gIGlmICh0eXBlb2Ygb3B0aW9ucy5mYWxsYmFja0xuZyA9PT0gJ3N0cmluZycpIG9wdGlvbnMuZmFsbGJhY2tMbmcgPSBbb3B0aW9ucy5mYWxsYmFja0xuZ107XG4gIGlmICh0eXBlb2Ygb3B0aW9ucy5mYWxsYmFja05TID09PSAnc3RyaW5nJykgb3B0aW9ucy5mYWxsYmFja05TID0gW29wdGlvbnMuZmFsbGJhY2tOU107XG4gIGlmIChvcHRpb25zLnN1cHBvcnRlZExuZ3MgJiYgb3B0aW9ucy5zdXBwb3J0ZWRMbmdzLmluZGV4T2YoJ2NpbW9kZScpIDwgMCkge1xuICAgIG9wdGlvbnMuc3VwcG9ydGVkTG5ncyA9IG9wdGlvbnMuc3VwcG9ydGVkTG5ncy5jb25jYXQoWydjaW1vZGUnXSk7XG4gIH1cbiAgcmV0dXJuIG9wdGlvbnM7XG59O1xuXG5jb25zdCBub29wID0gKCkgPT4ge307XG5jb25zdCBiaW5kTWVtYmVyRnVuY3Rpb25zID0gaW5zdCA9PiB7XG4gIGNvbnN0IG1lbXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhPYmplY3QuZ2V0UHJvdG90eXBlT2YoaW5zdCkpO1xuICBtZW1zLmZvckVhY2gobWVtID0+IHtcbiAgICBpZiAodHlwZW9mIGluc3RbbWVtXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgaW5zdFttZW1dID0gaW5zdFttZW1dLmJpbmQoaW5zdCk7XG4gICAgfVxuICB9KTtcbn07XG5jbGFzcyBJMThuIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IHt9O1xuICAgIGxldCBjYWxsYmFjayA9IGFyZ3VtZW50cy5sZW5ndGggPiAxID8gYXJndW1lbnRzWzFdIDogdW5kZWZpbmVkO1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5vcHRpb25zID0gdHJhbnNmb3JtT3B0aW9ucyhvcHRpb25zKTtcbiAgICB0aGlzLnNlcnZpY2VzID0ge307XG4gICAgdGhpcy5sb2dnZXIgPSBiYXNlTG9nZ2VyO1xuICAgIHRoaXMubW9kdWxlcyA9IHtcbiAgICAgIGV4dGVybmFsOiBbXVxuICAgIH07XG4gICAgYmluZE1lbWJlckZ1bmN0aW9ucyh0aGlzKTtcbiAgICBpZiAoY2FsbGJhY2sgJiYgIXRoaXMuaXNJbml0aWFsaXplZCAmJiAhb3B0aW9ucy5pc0Nsb25lKSB7XG4gICAgICBpZiAoIXRoaXMub3B0aW9ucy5pbml0SW1tZWRpYXRlKSB7XG4gICAgICAgIHRoaXMuaW5pdChvcHRpb25zLCBjYWxsYmFjayk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuaW5pdChvcHRpb25zLCBjYWxsYmFjayk7XG4gICAgICB9LCAwKTtcbiAgICB9XG4gIH1cbiAgaW5pdCgpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiB7fTtcbiAgICBsZXQgY2FsbGJhY2sgPSBhcmd1bWVudHMubGVuZ3RoID4gMSA/IGFyZ3VtZW50c1sxXSA6IHVuZGVmaW5lZDtcbiAgICB0aGlzLmlzSW5pdGlhbGl6aW5nID0gdHJ1ZTtcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNhbGxiYWNrID0gb3B0aW9ucztcbiAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICB9XG4gICAgaWYgKCFvcHRpb25zLmRlZmF1bHROUyAmJiBvcHRpb25zLmRlZmF1bHROUyAhPT0gZmFsc2UgJiYgb3B0aW9ucy5ucykge1xuICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLm5zID09PSAnc3RyaW5nJykge1xuICAgICAgICBvcHRpb25zLmRlZmF1bHROUyA9IG9wdGlvbnMubnM7XG4gICAgICB9IGVsc2UgaWYgKG9wdGlvbnMubnMuaW5kZXhPZigndHJhbnNsYXRpb24nKSA8IDApIHtcbiAgICAgICAgb3B0aW9ucy5kZWZhdWx0TlMgPSBvcHRpb25zLm5zWzBdO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBkZWZPcHRzID0gZ2V0KCk7XG4gICAgdGhpcy5vcHRpb25zID0ge1xuICAgICAgLi4uZGVmT3B0cyxcbiAgICAgIC4uLnRoaXMub3B0aW9ucyxcbiAgICAgIC4uLnRyYW5zZm9ybU9wdGlvbnMob3B0aW9ucylcbiAgICB9O1xuICAgIGlmICh0aGlzLm9wdGlvbnMuY29tcGF0aWJpbGl0eUFQSSAhPT0gJ3YxJykge1xuICAgICAgdGhpcy5vcHRpb25zLmludGVycG9sYXRpb24gPSB7XG4gICAgICAgIC4uLmRlZk9wdHMuaW50ZXJwb2xhdGlvbixcbiAgICAgICAgLi4udGhpcy5vcHRpb25zLmludGVycG9sYXRpb25cbiAgICAgIH07XG4gICAgfVxuICAgIGlmIChvcHRpb25zLmtleVNlcGFyYXRvciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLm9wdGlvbnMudXNlckRlZmluZWRLZXlTZXBhcmF0b3IgPSBvcHRpb25zLmtleVNlcGFyYXRvcjtcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMubnNTZXBhcmF0b3IgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5vcHRpb25zLnVzZXJEZWZpbmVkTnNTZXBhcmF0b3IgPSBvcHRpb25zLm5zU2VwYXJhdG9yO1xuICAgIH1cbiAgICBjb25zdCBjcmVhdGVDbGFzc09uRGVtYW5kID0gQ2xhc3NPck9iamVjdCA9PiB7XG4gICAgICBpZiAoIUNsYXNzT3JPYmplY3QpIHJldHVybiBudWxsO1xuICAgICAgaWYgKHR5cGVvZiBDbGFzc09yT2JqZWN0ID09PSAnZnVuY3Rpb24nKSByZXR1cm4gbmV3IENsYXNzT3JPYmplY3QoKTtcbiAgICAgIHJldHVybiBDbGFzc09yT2JqZWN0O1xuICAgIH07XG4gICAgaWYgKCF0aGlzLm9wdGlvbnMuaXNDbG9uZSkge1xuICAgICAgaWYgKHRoaXMubW9kdWxlcy5sb2dnZXIpIHtcbiAgICAgICAgYmFzZUxvZ2dlci5pbml0KGNyZWF0ZUNsYXNzT25EZW1hbmQodGhpcy5tb2R1bGVzLmxvZ2dlciksIHRoaXMub3B0aW9ucyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBiYXNlTG9nZ2VyLmluaXQobnVsbCwgdGhpcy5vcHRpb25zKTtcbiAgICAgIH1cbiAgICAgIGxldCBmb3JtYXR0ZXI7XG4gICAgICBpZiAodGhpcy5tb2R1bGVzLmZvcm1hdHRlcikge1xuICAgICAgICBmb3JtYXR0ZXIgPSB0aGlzLm1vZHVsZXMuZm9ybWF0dGVyO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgSW50bCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZm9ybWF0dGVyID0gRm9ybWF0dGVyO1xuICAgICAgfVxuICAgICAgY29uc3QgbHUgPSBuZXcgTGFuZ3VhZ2VVdGlsKHRoaXMub3B0aW9ucyk7XG4gICAgICB0aGlzLnN0b3JlID0gbmV3IFJlc291cmNlU3RvcmUodGhpcy5vcHRpb25zLnJlc291cmNlcywgdGhpcy5vcHRpb25zKTtcbiAgICAgIGNvbnN0IHMgPSB0aGlzLnNlcnZpY2VzO1xuICAgICAgcy5sb2dnZXIgPSBiYXNlTG9nZ2VyO1xuICAgICAgcy5yZXNvdXJjZVN0b3JlID0gdGhpcy5zdG9yZTtcbiAgICAgIHMubGFuZ3VhZ2VVdGlscyA9IGx1O1xuICAgICAgcy5wbHVyYWxSZXNvbHZlciA9IG5ldyBQbHVyYWxSZXNvbHZlcihsdSwge1xuICAgICAgICBwcmVwZW5kOiB0aGlzLm9wdGlvbnMucGx1cmFsU2VwYXJhdG9yLFxuICAgICAgICBjb21wYXRpYmlsaXR5SlNPTjogdGhpcy5vcHRpb25zLmNvbXBhdGliaWxpdHlKU09OLFxuICAgICAgICBzaW1wbGlmeVBsdXJhbFN1ZmZpeDogdGhpcy5vcHRpb25zLnNpbXBsaWZ5UGx1cmFsU3VmZml4XG4gICAgICB9KTtcbiAgICAgIGlmIChmb3JtYXR0ZXIgJiYgKCF0aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbi5mb3JtYXQgfHwgdGhpcy5vcHRpb25zLmludGVycG9sYXRpb24uZm9ybWF0ID09PSBkZWZPcHRzLmludGVycG9sYXRpb24uZm9ybWF0KSkge1xuICAgICAgICBzLmZvcm1hdHRlciA9IGNyZWF0ZUNsYXNzT25EZW1hbmQoZm9ybWF0dGVyKTtcbiAgICAgICAgcy5mb3JtYXR0ZXIuaW5pdChzLCB0aGlzLm9wdGlvbnMpO1xuICAgICAgICB0aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbi5mb3JtYXQgPSBzLmZvcm1hdHRlci5mb3JtYXQuYmluZChzLmZvcm1hdHRlcik7XG4gICAgICB9XG4gICAgICBzLmludGVycG9sYXRvciA9IG5ldyBJbnRlcnBvbGF0b3IodGhpcy5vcHRpb25zKTtcbiAgICAgIHMudXRpbHMgPSB7XG4gICAgICAgIGhhc0xvYWRlZE5hbWVzcGFjZTogdGhpcy5oYXNMb2FkZWROYW1lc3BhY2UuYmluZCh0aGlzKVxuICAgICAgfTtcbiAgICAgIHMuYmFja2VuZENvbm5lY3RvciA9IG5ldyBDb25uZWN0b3IoY3JlYXRlQ2xhc3NPbkRlbWFuZCh0aGlzLm1vZHVsZXMuYmFja2VuZCksIHMucmVzb3VyY2VTdG9yZSwgcywgdGhpcy5vcHRpb25zKTtcbiAgICAgIHMuYmFja2VuZENvbm5lY3Rvci5vbignKicsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IG5ldyBBcnJheShfbGVuID4gMSA/IF9sZW4gLSAxIDogMCksIF9rZXkgPSAxOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG4gICAgICAgICAgYXJnc1tfa2V5IC0gMV0gPSBhcmd1bWVudHNbX2tleV07XG4gICAgICAgIH1cbiAgICAgICAgX3RoaXMuZW1pdChldmVudCwgLi4uYXJncyk7XG4gICAgICB9KTtcbiAgICAgIGlmICh0aGlzLm1vZHVsZXMubGFuZ3VhZ2VEZXRlY3Rvcikge1xuICAgICAgICBzLmxhbmd1YWdlRGV0ZWN0b3IgPSBjcmVhdGVDbGFzc09uRGVtYW5kKHRoaXMubW9kdWxlcy5sYW5ndWFnZURldGVjdG9yKTtcbiAgICAgICAgaWYgKHMubGFuZ3VhZ2VEZXRlY3Rvci5pbml0KSBzLmxhbmd1YWdlRGV0ZWN0b3IuaW5pdChzLCB0aGlzLm9wdGlvbnMuZGV0ZWN0aW9uLCB0aGlzLm9wdGlvbnMpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMubW9kdWxlcy5pMThuRm9ybWF0KSB7XG4gICAgICAgIHMuaTE4bkZvcm1hdCA9IGNyZWF0ZUNsYXNzT25EZW1hbmQodGhpcy5tb2R1bGVzLmkxOG5Gb3JtYXQpO1xuICAgICAgICBpZiAocy5pMThuRm9ybWF0LmluaXQpIHMuaTE4bkZvcm1hdC5pbml0KHRoaXMpO1xuICAgICAgfVxuICAgICAgdGhpcy50cmFuc2xhdG9yID0gbmV3IFRyYW5zbGF0b3IodGhpcy5zZXJ2aWNlcywgdGhpcy5vcHRpb25zKTtcbiAgICAgIHRoaXMudHJhbnNsYXRvci5vbignKicsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBmb3IgKHZhciBfbGVuMiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBuZXcgQXJyYXkoX2xlbjIgPiAxID8gX2xlbjIgLSAxIDogMCksIF9rZXkyID0gMTsgX2tleTIgPCBfbGVuMjsgX2tleTIrKykge1xuICAgICAgICAgIGFyZ3NbX2tleTIgLSAxXSA9IGFyZ3VtZW50c1tfa2V5Ml07XG4gICAgICAgIH1cbiAgICAgICAgX3RoaXMuZW1pdChldmVudCwgLi4uYXJncyk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMubW9kdWxlcy5leHRlcm5hbC5mb3JFYWNoKG0gPT4ge1xuICAgICAgICBpZiAobS5pbml0KSBtLmluaXQodGhpcyk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgdGhpcy5mb3JtYXQgPSB0aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbi5mb3JtYXQ7XG4gICAgaWYgKCFjYWxsYmFjaykgY2FsbGJhY2sgPSBub29wO1xuICAgIGlmICh0aGlzLm9wdGlvbnMuZmFsbGJhY2tMbmcgJiYgIXRoaXMuc2VydmljZXMubGFuZ3VhZ2VEZXRlY3RvciAmJiAhdGhpcy5vcHRpb25zLmxuZykge1xuICAgICAgY29uc3QgY29kZXMgPSB0aGlzLnNlcnZpY2VzLmxhbmd1YWdlVXRpbHMuZ2V0RmFsbGJhY2tDb2Rlcyh0aGlzLm9wdGlvbnMuZmFsbGJhY2tMbmcpO1xuICAgICAgaWYgKGNvZGVzLmxlbmd0aCA+IDAgJiYgY29kZXNbMF0gIT09ICdkZXYnKSB0aGlzLm9wdGlvbnMubG5nID0gY29kZXNbMF07XG4gICAgfVxuICAgIGlmICghdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZURldGVjdG9yICYmICF0aGlzLm9wdGlvbnMubG5nKSB7XG4gICAgICB0aGlzLmxvZ2dlci53YXJuKCdpbml0OiBubyBsYW5ndWFnZURldGVjdG9yIGlzIHVzZWQgYW5kIG5vIGxuZyBpcyBkZWZpbmVkJyk7XG4gICAgfVxuICAgIGNvbnN0IHN0b3JlQXBpID0gWydnZXRSZXNvdXJjZScsICdoYXNSZXNvdXJjZUJ1bmRsZScsICdnZXRSZXNvdXJjZUJ1bmRsZScsICdnZXREYXRhQnlMYW5ndWFnZSddO1xuICAgIHN0b3JlQXBpLmZvckVhY2goZmNOYW1lID0+IHtcbiAgICAgIHRoaXNbZmNOYW1lXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIF90aGlzLnN0b3JlW2ZjTmFtZV0oLi4uYXJndW1lbnRzKTtcbiAgICAgIH07XG4gICAgfSk7XG4gICAgY29uc3Qgc3RvcmVBcGlDaGFpbmVkID0gWydhZGRSZXNvdXJjZScsICdhZGRSZXNvdXJjZXMnLCAnYWRkUmVzb3VyY2VCdW5kbGUnLCAncmVtb3ZlUmVzb3VyY2VCdW5kbGUnXTtcbiAgICBzdG9yZUFwaUNoYWluZWQuZm9yRWFjaChmY05hbWUgPT4ge1xuICAgICAgdGhpc1tmY05hbWVdID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBfdGhpcy5zdG9yZVtmY05hbWVdKC4uLmFyZ3VtZW50cyk7XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICAgIH07XG4gICAgfSk7XG4gICAgY29uc3QgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIGNvbnN0IGxvYWQgPSAoKSA9PiB7XG4gICAgICBjb25zdCBmaW5pc2ggPSAoZXJyLCB0KSA9PiB7XG4gICAgICAgIHRoaXMuaXNJbml0aWFsaXppbmcgPSBmYWxzZTtcbiAgICAgICAgaWYgKHRoaXMuaXNJbml0aWFsaXplZCAmJiAhdGhpcy5pbml0aWFsaXplZFN0b3JlT25jZSkgdGhpcy5sb2dnZXIud2FybignaW5pdDogaTE4bmV4dCBpcyBhbHJlYWR5IGluaXRpYWxpemVkLiBZb3Ugc2hvdWxkIGNhbGwgaW5pdCBqdXN0IG9uY2UhJyk7XG4gICAgICAgIHRoaXMuaXNJbml0aWFsaXplZCA9IHRydWU7XG4gICAgICAgIGlmICghdGhpcy5vcHRpb25zLmlzQ2xvbmUpIHRoaXMubG9nZ2VyLmxvZygnaW5pdGlhbGl6ZWQnLCB0aGlzLm9wdGlvbnMpO1xuICAgICAgICB0aGlzLmVtaXQoJ2luaXRpYWxpemVkJywgdGhpcy5vcHRpb25zKTtcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSh0KTtcbiAgICAgICAgY2FsbGJhY2soZXJyLCB0KTtcbiAgICAgIH07XG4gICAgICBpZiAodGhpcy5sYW5ndWFnZXMgJiYgdGhpcy5vcHRpb25zLmNvbXBhdGliaWxpdHlBUEkgIT09ICd2MScgJiYgIXRoaXMuaXNJbml0aWFsaXplZCkgcmV0dXJuIGZpbmlzaChudWxsLCB0aGlzLnQuYmluZCh0aGlzKSk7XG4gICAgICB0aGlzLmNoYW5nZUxhbmd1YWdlKHRoaXMub3B0aW9ucy5sbmcsIGZpbmlzaCk7XG4gICAgfTtcbiAgICBpZiAodGhpcy5vcHRpb25zLnJlc291cmNlcyB8fCAhdGhpcy5vcHRpb25zLmluaXRJbW1lZGlhdGUpIHtcbiAgICAgIGxvYWQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2V0VGltZW91dChsb2FkLCAwKTtcbiAgICB9XG4gICAgcmV0dXJuIGRlZmVycmVkO1xuICB9XG4gIGxvYWRSZXNvdXJjZXMobGFuZ3VhZ2UpIHtcbiAgICBsZXQgY2FsbGJhY2sgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IG5vb3A7XG4gICAgbGV0IHVzZWRDYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgIGNvbnN0IHVzZWRMbmcgPSB0eXBlb2YgbGFuZ3VhZ2UgPT09ICdzdHJpbmcnID8gbGFuZ3VhZ2UgOiB0aGlzLmxhbmd1YWdlO1xuICAgIGlmICh0eXBlb2YgbGFuZ3VhZ2UgPT09ICdmdW5jdGlvbicpIHVzZWRDYWxsYmFjayA9IGxhbmd1YWdlO1xuICAgIGlmICghdGhpcy5vcHRpb25zLnJlc291cmNlcyB8fCB0aGlzLm9wdGlvbnMucGFydGlhbEJ1bmRsZWRMYW5ndWFnZXMpIHtcbiAgICAgIGlmICh1c2VkTG5nICYmIHVzZWRMbmcudG9Mb3dlckNhc2UoKSA9PT0gJ2NpbW9kZScgJiYgKCF0aGlzLm9wdGlvbnMucHJlbG9hZCB8fCB0aGlzLm9wdGlvbnMucHJlbG9hZC5sZW5ndGggPT09IDApKSByZXR1cm4gdXNlZENhbGxiYWNrKCk7XG4gICAgICBjb25zdCB0b0xvYWQgPSBbXTtcbiAgICAgIGNvbnN0IGFwcGVuZCA9IGxuZyA9PiB7XG4gICAgICAgIGlmICghbG5nKSByZXR1cm47XG4gICAgICAgIGlmIChsbmcgPT09ICdjaW1vZGUnKSByZXR1cm47XG4gICAgICAgIGNvbnN0IGxuZ3MgPSB0aGlzLnNlcnZpY2VzLmxhbmd1YWdlVXRpbHMudG9SZXNvbHZlSGllcmFyY2h5KGxuZyk7XG4gICAgICAgIGxuZ3MuZm9yRWFjaChsID0+IHtcbiAgICAgICAgICBpZiAobCA9PT0gJ2NpbW9kZScpIHJldHVybjtcbiAgICAgICAgICBpZiAodG9Mb2FkLmluZGV4T2YobCkgPCAwKSB0b0xvYWQucHVzaChsKTtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuICAgICAgaWYgKCF1c2VkTG5nKSB7XG4gICAgICAgIGNvbnN0IGZhbGxiYWNrcyA9IHRoaXMuc2VydmljZXMubGFuZ3VhZ2VVdGlscy5nZXRGYWxsYmFja0NvZGVzKHRoaXMub3B0aW9ucy5mYWxsYmFja0xuZyk7XG4gICAgICAgIGZhbGxiYWNrcy5mb3JFYWNoKGwgPT4gYXBwZW5kKGwpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFwcGVuZCh1c2VkTG5nKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLm9wdGlvbnMucHJlbG9hZCkge1xuICAgICAgICB0aGlzLm9wdGlvbnMucHJlbG9hZC5mb3JFYWNoKGwgPT4gYXBwZW5kKGwpKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuc2VydmljZXMuYmFja2VuZENvbm5lY3Rvci5sb2FkKHRvTG9hZCwgdGhpcy5vcHRpb25zLm5zLCBlID0+IHtcbiAgICAgICAgaWYgKCFlICYmICF0aGlzLnJlc29sdmVkTGFuZ3VhZ2UgJiYgdGhpcy5sYW5ndWFnZSkgdGhpcy5zZXRSZXNvbHZlZExhbmd1YWdlKHRoaXMubGFuZ3VhZ2UpO1xuICAgICAgICB1c2VkQ2FsbGJhY2soZSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdXNlZENhbGxiYWNrKG51bGwpO1xuICAgIH1cbiAgfVxuICByZWxvYWRSZXNvdXJjZXMobG5ncywgbnMsIGNhbGxiYWNrKSB7XG4gICAgY29uc3QgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIGlmICghbG5ncykgbG5ncyA9IHRoaXMubGFuZ3VhZ2VzO1xuICAgIGlmICghbnMpIG5zID0gdGhpcy5vcHRpb25zLm5zO1xuICAgIGlmICghY2FsbGJhY2spIGNhbGxiYWNrID0gbm9vcDtcbiAgICB0aGlzLnNlcnZpY2VzLmJhY2tlbmRDb25uZWN0b3IucmVsb2FkKGxuZ3MsIG5zLCBlcnIgPT4ge1xuICAgICAgZGVmZXJyZWQucmVzb2x2ZSgpO1xuICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICB9KTtcbiAgICByZXR1cm4gZGVmZXJyZWQ7XG4gIH1cbiAgdXNlKG1vZHVsZSkge1xuICAgIGlmICghbW9kdWxlKSB0aHJvdyBuZXcgRXJyb3IoJ1lvdSBhcmUgcGFzc2luZyBhbiB1bmRlZmluZWQgbW9kdWxlISBQbGVhc2UgY2hlY2sgdGhlIG9iamVjdCB5b3UgYXJlIHBhc3NpbmcgdG8gaTE4bmV4dC51c2UoKScpO1xuICAgIGlmICghbW9kdWxlLnR5cGUpIHRocm93IG5ldyBFcnJvcignWW91IGFyZSBwYXNzaW5nIGEgd3JvbmcgbW9kdWxlISBQbGVhc2UgY2hlY2sgdGhlIG9iamVjdCB5b3UgYXJlIHBhc3NpbmcgdG8gaTE4bmV4dC51c2UoKScpO1xuICAgIGlmIChtb2R1bGUudHlwZSA9PT0gJ2JhY2tlbmQnKSB7XG4gICAgICB0aGlzLm1vZHVsZXMuYmFja2VuZCA9IG1vZHVsZTtcbiAgICB9XG4gICAgaWYgKG1vZHVsZS50eXBlID09PSAnbG9nZ2VyJyB8fCBtb2R1bGUubG9nICYmIG1vZHVsZS53YXJuICYmIG1vZHVsZS5lcnJvcikge1xuICAgICAgdGhpcy5tb2R1bGVzLmxvZ2dlciA9IG1vZHVsZTtcbiAgICB9XG4gICAgaWYgKG1vZHVsZS50eXBlID09PSAnbGFuZ3VhZ2VEZXRlY3RvcicpIHtcbiAgICAgIHRoaXMubW9kdWxlcy5sYW5ndWFnZURldGVjdG9yID0gbW9kdWxlO1xuICAgIH1cbiAgICBpZiAobW9kdWxlLnR5cGUgPT09ICdpMThuRm9ybWF0Jykge1xuICAgICAgdGhpcy5tb2R1bGVzLmkxOG5Gb3JtYXQgPSBtb2R1bGU7XG4gICAgfVxuICAgIGlmIChtb2R1bGUudHlwZSA9PT0gJ3Bvc3RQcm9jZXNzb3InKSB7XG4gICAgICBwb3N0UHJvY2Vzc29yLmFkZFBvc3RQcm9jZXNzb3IobW9kdWxlKTtcbiAgICB9XG4gICAgaWYgKG1vZHVsZS50eXBlID09PSAnZm9ybWF0dGVyJykge1xuICAgICAgdGhpcy5tb2R1bGVzLmZvcm1hdHRlciA9IG1vZHVsZTtcbiAgICB9XG4gICAgaWYgKG1vZHVsZS50eXBlID09PSAnM3JkUGFydHknKSB7XG4gICAgICB0aGlzLm1vZHVsZXMuZXh0ZXJuYWwucHVzaChtb2R1bGUpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBzZXRSZXNvbHZlZExhbmd1YWdlKGwpIHtcbiAgICBpZiAoIWwgfHwgIXRoaXMubGFuZ3VhZ2VzKSByZXR1cm47XG4gICAgaWYgKFsnY2ltb2RlJywgJ2RldiddLmluZGV4T2YobCkgPiAtMSkgcmV0dXJuO1xuICAgIGZvciAobGV0IGxpID0gMDsgbGkgPCB0aGlzLmxhbmd1YWdlcy5sZW5ndGg7IGxpKyspIHtcbiAgICAgIGNvbnN0IGxuZ0luTG5ncyA9IHRoaXMubGFuZ3VhZ2VzW2xpXTtcbiAgICAgIGlmIChbJ2NpbW9kZScsICdkZXYnXS5pbmRleE9mKGxuZ0luTG5ncykgPiAtMSkgY29udGludWU7XG4gICAgICBpZiAodGhpcy5zdG9yZS5oYXNMYW5ndWFnZVNvbWVUcmFuc2xhdGlvbnMobG5nSW5MbmdzKSkge1xuICAgICAgICB0aGlzLnJlc29sdmVkTGFuZ3VhZ2UgPSBsbmdJbkxuZ3M7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBjaGFuZ2VMYW5ndWFnZShsbmcsIGNhbGxiYWNrKSB7XG4gICAgdmFyIF90aGlzMiA9IHRoaXM7XG4gICAgdGhpcy5pc0xhbmd1YWdlQ2hhbmdpbmdUbyA9IGxuZztcbiAgICBjb25zdCBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgdGhpcy5lbWl0KCdsYW5ndWFnZUNoYW5naW5nJywgbG5nKTtcbiAgICBjb25zdCBzZXRMbmdQcm9wcyA9IGwgPT4ge1xuICAgICAgdGhpcy5sYW5ndWFnZSA9IGw7XG4gICAgICB0aGlzLmxhbmd1YWdlcyA9IHRoaXMuc2VydmljZXMubGFuZ3VhZ2VVdGlscy50b1Jlc29sdmVIaWVyYXJjaHkobCk7XG4gICAgICB0aGlzLnJlc29sdmVkTGFuZ3VhZ2UgPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLnNldFJlc29sdmVkTGFuZ3VhZ2UobCk7XG4gICAgfTtcbiAgICBjb25zdCBkb25lID0gKGVyciwgbCkgPT4ge1xuICAgICAgaWYgKGwpIHtcbiAgICAgICAgc2V0TG5nUHJvcHMobCk7XG4gICAgICAgIHRoaXMudHJhbnNsYXRvci5jaGFuZ2VMYW5ndWFnZShsKTtcbiAgICAgICAgdGhpcy5pc0xhbmd1YWdlQ2hhbmdpbmdUbyA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5lbWl0KCdsYW5ndWFnZUNoYW5nZWQnLCBsKTtcbiAgICAgICAgdGhpcy5sb2dnZXIubG9nKCdsYW5ndWFnZUNoYW5nZWQnLCBsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuaXNMYW5ndWFnZUNoYW5naW5nVG8gPSB1bmRlZmluZWQ7XG4gICAgICB9XG4gICAgICBkZWZlcnJlZC5yZXNvbHZlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIF90aGlzMi50KC4uLmFyZ3VtZW50cyk7XG4gICAgICB9KTtcbiAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soZXJyLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBfdGhpczIudCguLi5hcmd1bWVudHMpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgICBjb25zdCBzZXRMbmcgPSBsbmdzID0+IHtcbiAgICAgIGlmICghbG5nICYmICFsbmdzICYmIHRoaXMuc2VydmljZXMubGFuZ3VhZ2VEZXRlY3RvcikgbG5ncyA9IFtdO1xuICAgICAgY29uc3QgbCA9IHR5cGVvZiBsbmdzID09PSAnc3RyaW5nJyA/IGxuZ3MgOiB0aGlzLnNlcnZpY2VzLmxhbmd1YWdlVXRpbHMuZ2V0QmVzdE1hdGNoRnJvbUNvZGVzKGxuZ3MpO1xuICAgICAgaWYgKGwpIHtcbiAgICAgICAgaWYgKCF0aGlzLmxhbmd1YWdlKSB7XG4gICAgICAgICAgc2V0TG5nUHJvcHMobCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLnRyYW5zbGF0b3IubGFuZ3VhZ2UpIHRoaXMudHJhbnNsYXRvci5jaGFuZ2VMYW5ndWFnZShsKTtcbiAgICAgICAgaWYgKHRoaXMuc2VydmljZXMubGFuZ3VhZ2VEZXRlY3RvciAmJiB0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IuY2FjaGVVc2VyTGFuZ3VhZ2UpIHRoaXMuc2VydmljZXMubGFuZ3VhZ2VEZXRlY3Rvci5jYWNoZVVzZXJMYW5ndWFnZShsKTtcbiAgICAgIH1cbiAgICAgIHRoaXMubG9hZFJlc291cmNlcyhsLCBlcnIgPT4ge1xuICAgICAgICBkb25lKGVyciwgbCk7XG4gICAgICB9KTtcbiAgICB9O1xuICAgIGlmICghbG5nICYmIHRoaXMuc2VydmljZXMubGFuZ3VhZ2VEZXRlY3RvciAmJiAhdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZURldGVjdG9yLmFzeW5jKSB7XG4gICAgICBzZXRMbmcodGhpcy5zZXJ2aWNlcy5sYW5ndWFnZURldGVjdG9yLmRldGVjdCgpKTtcbiAgICB9IGVsc2UgaWYgKCFsbmcgJiYgdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZURldGVjdG9yICYmIHRoaXMuc2VydmljZXMubGFuZ3VhZ2VEZXRlY3Rvci5hc3luYykge1xuICAgICAgaWYgKHRoaXMuc2VydmljZXMubGFuZ3VhZ2VEZXRlY3Rvci5kZXRlY3QubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHRoaXMuc2VydmljZXMubGFuZ3VhZ2VEZXRlY3Rvci5kZXRlY3QoKS50aGVuKHNldExuZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IuZGV0ZWN0KHNldExuZyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHNldExuZyhsbmcpO1xuICAgIH1cbiAgICByZXR1cm4gZGVmZXJyZWQ7XG4gIH1cbiAgZ2V0Rml4ZWRUKGxuZywgbnMsIGtleVByZWZpeCkge1xuICAgIHZhciBfdGhpczMgPSB0aGlzO1xuICAgIGNvbnN0IGZpeGVkVCA9IGZ1bmN0aW9uIChrZXksIG9wdHMpIHtcbiAgICAgIGxldCBvcHRpb25zO1xuICAgICAgaWYgKHR5cGVvZiBvcHRzICE9PSAnb2JqZWN0Jykge1xuICAgICAgICBmb3IgKHZhciBfbGVuMyA9IGFyZ3VtZW50cy5sZW5ndGgsIHJlc3QgPSBuZXcgQXJyYXkoX2xlbjMgPiAyID8gX2xlbjMgLSAyIDogMCksIF9rZXkzID0gMjsgX2tleTMgPCBfbGVuMzsgX2tleTMrKykge1xuICAgICAgICAgIHJlc3RbX2tleTMgLSAyXSA9IGFyZ3VtZW50c1tfa2V5M107XG4gICAgICAgIH1cbiAgICAgICAgb3B0aW9ucyA9IF90aGlzMy5vcHRpb25zLm92ZXJsb2FkVHJhbnNsYXRpb25PcHRpb25IYW5kbGVyKFtrZXksIG9wdHNdLmNvbmNhdChyZXN0KSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvcHRpb25zID0ge1xuICAgICAgICAgIC4uLm9wdHNcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIG9wdGlvbnMubG5nID0gb3B0aW9ucy5sbmcgfHwgZml4ZWRULmxuZztcbiAgICAgIG9wdGlvbnMubG5ncyA9IG9wdGlvbnMubG5ncyB8fCBmaXhlZFQubG5ncztcbiAgICAgIG9wdGlvbnMubnMgPSBvcHRpb25zLm5zIHx8IGZpeGVkVC5ucztcbiAgICAgIGlmIChvcHRpb25zLmtleVByZWZpeCAhPT0gJycpIG9wdGlvbnMua2V5UHJlZml4ID0gb3B0aW9ucy5rZXlQcmVmaXggfHwga2V5UHJlZml4IHx8IGZpeGVkVC5rZXlQcmVmaXg7XG4gICAgICBjb25zdCBrZXlTZXBhcmF0b3IgPSBfdGhpczMub3B0aW9ucy5rZXlTZXBhcmF0b3IgfHwgJy4nO1xuICAgICAgbGV0IHJlc3VsdEtleTtcbiAgICAgIGlmIChvcHRpb25zLmtleVByZWZpeCAmJiBBcnJheS5pc0FycmF5KGtleSkpIHtcbiAgICAgICAgcmVzdWx0S2V5ID0ga2V5Lm1hcChrID0+IGAke29wdGlvbnMua2V5UHJlZml4fSR7a2V5U2VwYXJhdG9yfSR7a31gKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdEtleSA9IG9wdGlvbnMua2V5UHJlZml4ID8gYCR7b3B0aW9ucy5rZXlQcmVmaXh9JHtrZXlTZXBhcmF0b3J9JHtrZXl9YCA6IGtleTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBfdGhpczMudChyZXN1bHRLZXksIG9wdGlvbnMpO1xuICAgIH07XG4gICAgaWYgKHR5cGVvZiBsbmcgPT09ICdzdHJpbmcnKSB7XG4gICAgICBmaXhlZFQubG5nID0gbG5nO1xuICAgIH0gZWxzZSB7XG4gICAgICBmaXhlZFQubG5ncyA9IGxuZztcbiAgICB9XG4gICAgZml4ZWRULm5zID0gbnM7XG4gICAgZml4ZWRULmtleVByZWZpeCA9IGtleVByZWZpeDtcbiAgICByZXR1cm4gZml4ZWRUO1xuICB9XG4gIHQoKSB7XG4gICAgcmV0dXJuIHRoaXMudHJhbnNsYXRvciAmJiB0aGlzLnRyYW5zbGF0b3IudHJhbnNsYXRlKC4uLmFyZ3VtZW50cyk7XG4gIH1cbiAgZXhpc3RzKCkge1xuICAgIHJldHVybiB0aGlzLnRyYW5zbGF0b3IgJiYgdGhpcy50cmFuc2xhdG9yLmV4aXN0cyguLi5hcmd1bWVudHMpO1xuICB9XG4gIHNldERlZmF1bHROYW1lc3BhY2UobnMpIHtcbiAgICB0aGlzLm9wdGlvbnMuZGVmYXVsdE5TID0gbnM7XG4gIH1cbiAgaGFzTG9hZGVkTmFtZXNwYWNlKG5zKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IHt9O1xuICAgIGlmICghdGhpcy5pc0luaXRpYWxpemVkKSB7XG4gICAgICB0aGlzLmxvZ2dlci53YXJuKCdoYXNMb2FkZWROYW1lc3BhY2U6IGkxOG5leHQgd2FzIG5vdCBpbml0aWFsaXplZCcsIHRoaXMubGFuZ3VhZ2VzKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLmxhbmd1YWdlcyB8fCAhdGhpcy5sYW5ndWFnZXMubGVuZ3RoKSB7XG4gICAgICB0aGlzLmxvZ2dlci53YXJuKCdoYXNMb2FkZWROYW1lc3BhY2U6IGkxOG4ubGFuZ3VhZ2VzIHdlcmUgdW5kZWZpbmVkIG9yIGVtcHR5JywgdGhpcy5sYW5ndWFnZXMpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCBsbmcgPSBvcHRpb25zLmxuZyB8fCB0aGlzLnJlc29sdmVkTGFuZ3VhZ2UgfHwgdGhpcy5sYW5ndWFnZXNbMF07XG4gICAgY29uc3QgZmFsbGJhY2tMbmcgPSB0aGlzLm9wdGlvbnMgPyB0aGlzLm9wdGlvbnMuZmFsbGJhY2tMbmcgOiBmYWxzZTtcbiAgICBjb25zdCBsYXN0TG5nID0gdGhpcy5sYW5ndWFnZXNbdGhpcy5sYW5ndWFnZXMubGVuZ3RoIC0gMV07XG4gICAgaWYgKGxuZy50b0xvd2VyQ2FzZSgpID09PSAnY2ltb2RlJykgcmV0dXJuIHRydWU7XG4gICAgY29uc3QgbG9hZE5vdFBlbmRpbmcgPSAobCwgbikgPT4ge1xuICAgICAgY29uc3QgbG9hZFN0YXRlID0gdGhpcy5zZXJ2aWNlcy5iYWNrZW5kQ29ubmVjdG9yLnN0YXRlW2Ake2x9fCR7bn1gXTtcbiAgICAgIHJldHVybiBsb2FkU3RhdGUgPT09IC0xIHx8IGxvYWRTdGF0ZSA9PT0gMjtcbiAgICB9O1xuICAgIGlmIChvcHRpb25zLnByZWNoZWNrKSB7XG4gICAgICBjb25zdCBwcmVSZXN1bHQgPSBvcHRpb25zLnByZWNoZWNrKHRoaXMsIGxvYWROb3RQZW5kaW5nKTtcbiAgICAgIGlmIChwcmVSZXN1bHQgIT09IHVuZGVmaW5lZCkgcmV0dXJuIHByZVJlc3VsdDtcbiAgICB9XG4gICAgaWYgKHRoaXMuaGFzUmVzb3VyY2VCdW5kbGUobG5nLCBucykpIHJldHVybiB0cnVlO1xuICAgIGlmICghdGhpcy5zZXJ2aWNlcy5iYWNrZW5kQ29ubmVjdG9yLmJhY2tlbmQgfHwgdGhpcy5vcHRpb25zLnJlc291cmNlcyAmJiAhdGhpcy5vcHRpb25zLnBhcnRpYWxCdW5kbGVkTGFuZ3VhZ2VzKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAobG9hZE5vdFBlbmRpbmcobG5nLCBucykgJiYgKCFmYWxsYmFja0xuZyB8fCBsb2FkTm90UGVuZGluZyhsYXN0TG5nLCBucykpKSByZXR1cm4gdHJ1ZTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgbG9hZE5hbWVzcGFjZXMobnMsIGNhbGxiYWNrKSB7XG4gICAgY29uc3QgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIGlmICghdGhpcy5vcHRpb25zLm5zKSB7XG4gICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKCk7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgbnMgPT09ICdzdHJpbmcnKSBucyA9IFtuc107XG4gICAgbnMuZm9yRWFjaChuID0+IHtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMubnMuaW5kZXhPZihuKSA8IDApIHRoaXMub3B0aW9ucy5ucy5wdXNoKG4pO1xuICAgIH0pO1xuICAgIHRoaXMubG9hZFJlc291cmNlcyhlcnIgPT4ge1xuICAgICAgZGVmZXJyZWQucmVzb2x2ZSgpO1xuICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjayhlcnIpO1xuICAgIH0pO1xuICAgIHJldHVybiBkZWZlcnJlZDtcbiAgfVxuICBsb2FkTGFuZ3VhZ2VzKGxuZ3MsIGNhbGxiYWNrKSB7XG4gICAgY29uc3QgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIGlmICh0eXBlb2YgbG5ncyA9PT0gJ3N0cmluZycpIGxuZ3MgPSBbbG5nc107XG4gICAgY29uc3QgcHJlbG9hZGVkID0gdGhpcy5vcHRpb25zLnByZWxvYWQgfHwgW107XG4gICAgY29uc3QgbmV3TG5ncyA9IGxuZ3MuZmlsdGVyKGxuZyA9PiBwcmVsb2FkZWQuaW5kZXhPZihsbmcpIDwgMCAmJiB0aGlzLnNlcnZpY2VzLmxhbmd1YWdlVXRpbHMuaXNTdXBwb3J0ZWRDb2RlKGxuZykpO1xuICAgIGlmICghbmV3TG5ncy5sZW5ndGgpIHtcbiAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soKTtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG4gICAgdGhpcy5vcHRpb25zLnByZWxvYWQgPSBwcmVsb2FkZWQuY29uY2F0KG5ld0xuZ3MpO1xuICAgIHRoaXMubG9hZFJlc291cmNlcyhlcnIgPT4ge1xuICAgICAgZGVmZXJyZWQucmVzb2x2ZSgpO1xuICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjayhlcnIpO1xuICAgIH0pO1xuICAgIHJldHVybiBkZWZlcnJlZDtcbiAgfVxuICBkaXIobG5nKSB7XG4gICAgaWYgKCFsbmcpIGxuZyA9IHRoaXMucmVzb2x2ZWRMYW5ndWFnZSB8fCAodGhpcy5sYW5ndWFnZXMgJiYgdGhpcy5sYW5ndWFnZXMubGVuZ3RoID4gMCA/IHRoaXMubGFuZ3VhZ2VzWzBdIDogdGhpcy5sYW5ndWFnZSk7XG4gICAgaWYgKCFsbmcpIHJldHVybiAncnRsJztcbiAgICBjb25zdCBydGxMbmdzID0gWydhcicsICdzaHUnLCAnc3FyJywgJ3NzaCcsICd4YWEnLCAneWhkJywgJ3l1ZCcsICdhYW8nLCAnYWJoJywgJ2FidicsICdhY20nLCAnYWNxJywgJ2FjdycsICdhY3gnLCAnYWN5JywgJ2FkZicsICdhZHMnLCAnYWViJywgJ2FlYycsICdhZmInLCAnYWpwJywgJ2FwYycsICdhcGQnLCAnYXJiJywgJ2FycScsICdhcnMnLCAnYXJ5JywgJ2FyeicsICdhdXonLCAnYXZsJywgJ2F5aCcsICdheWwnLCAnYXluJywgJ2F5cCcsICdiYnonLCAncGdhJywgJ2hlJywgJ2l3JywgJ3BzJywgJ3BidCcsICdwYnUnLCAncHN0JywgJ3BycCcsICdwcmQnLCAndWcnLCAndXInLCAneWRkJywgJ3lkcycsICd5aWgnLCAnamknLCAneWknLCAnaGJvJywgJ21lbicsICd4bW4nLCAnZmEnLCAnanByJywgJ3BlbycsICdwZXMnLCAncHJzJywgJ2R2JywgJ3NhbScsICdja2InXTtcbiAgICBjb25zdCBsYW5ndWFnZVV0aWxzID0gdGhpcy5zZXJ2aWNlcyAmJiB0aGlzLnNlcnZpY2VzLmxhbmd1YWdlVXRpbHMgfHwgbmV3IExhbmd1YWdlVXRpbChnZXQoKSk7XG4gICAgcmV0dXJuIHJ0bExuZ3MuaW5kZXhPZihsYW5ndWFnZVV0aWxzLmdldExhbmd1YWdlUGFydEZyb21Db2RlKGxuZykpID4gLTEgfHwgbG5nLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignLWFyYWInKSA+IDEgPyAncnRsJyA6ICdsdHInO1xuICB9XG4gIHN0YXRpYyBjcmVhdGVJbnN0YW5jZSgpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDoge307XG4gICAgbGV0IGNhbGxiYWNrID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgPyBhcmd1bWVudHNbMV0gOiB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIG5ldyBJMThuKG9wdGlvbnMsIGNhbGxiYWNrKTtcbiAgfVxuICBjbG9uZUluc3RhbmNlKCkge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiB7fTtcbiAgICBsZXQgY2FsbGJhY2sgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IG5vb3A7XG4gICAgY29uc3QgZm9ya1Jlc291cmNlU3RvcmUgPSBvcHRpb25zLmZvcmtSZXNvdXJjZVN0b3JlO1xuICAgIGlmIChmb3JrUmVzb3VyY2VTdG9yZSkgZGVsZXRlIG9wdGlvbnMuZm9ya1Jlc291cmNlU3RvcmU7XG4gICAgY29uc3QgbWVyZ2VkT3B0aW9ucyA9IHtcbiAgICAgIC4uLnRoaXMub3B0aW9ucyxcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAuLi57XG4gICAgICAgIGlzQ2xvbmU6IHRydWVcbiAgICAgIH1cbiAgICB9O1xuICAgIGNvbnN0IGNsb25lID0gbmV3IEkxOG4obWVyZ2VkT3B0aW9ucyk7XG4gICAgaWYgKG9wdGlvbnMuZGVidWcgIT09IHVuZGVmaW5lZCB8fCBvcHRpb25zLnByZWZpeCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjbG9uZS5sb2dnZXIgPSBjbG9uZS5sb2dnZXIuY2xvbmUob3B0aW9ucyk7XG4gICAgfVxuICAgIGNvbnN0IG1lbWJlcnNUb0NvcHkgPSBbJ3N0b3JlJywgJ3NlcnZpY2VzJywgJ2xhbmd1YWdlJ107XG4gICAgbWVtYmVyc1RvQ29weS5mb3JFYWNoKG0gPT4ge1xuICAgICAgY2xvbmVbbV0gPSB0aGlzW21dO1xuICAgIH0pO1xuICAgIGNsb25lLnNlcnZpY2VzID0ge1xuICAgICAgLi4udGhpcy5zZXJ2aWNlc1xuICAgIH07XG4gICAgY2xvbmUuc2VydmljZXMudXRpbHMgPSB7XG4gICAgICBoYXNMb2FkZWROYW1lc3BhY2U6IGNsb25lLmhhc0xvYWRlZE5hbWVzcGFjZS5iaW5kKGNsb25lKVxuICAgIH07XG4gICAgaWYgKGZvcmtSZXNvdXJjZVN0b3JlKSB7XG4gICAgICBjbG9uZS5zdG9yZSA9IG5ldyBSZXNvdXJjZVN0b3JlKHRoaXMuc3RvcmUuZGF0YSwgbWVyZ2VkT3B0aW9ucyk7XG4gICAgICBjbG9uZS5zZXJ2aWNlcy5yZXNvdXJjZVN0b3JlID0gY2xvbmUuc3RvcmU7XG4gICAgfVxuICAgIGNsb25lLnRyYW5zbGF0b3IgPSBuZXcgVHJhbnNsYXRvcihjbG9uZS5zZXJ2aWNlcywgbWVyZ2VkT3B0aW9ucyk7XG4gICAgY2xvbmUudHJhbnNsYXRvci5vbignKicsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgZm9yICh2YXIgX2xlbjQgPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gbmV3IEFycmF5KF9sZW40ID4gMSA/IF9sZW40IC0gMSA6IDApLCBfa2V5NCA9IDE7IF9rZXk0IDwgX2xlbjQ7IF9rZXk0KyspIHtcbiAgICAgICAgYXJnc1tfa2V5NCAtIDFdID0gYXJndW1lbnRzW19rZXk0XTtcbiAgICAgIH1cbiAgICAgIGNsb25lLmVtaXQoZXZlbnQsIC4uLmFyZ3MpO1xuICAgIH0pO1xuICAgIGNsb25lLmluaXQobWVyZ2VkT3B0aW9ucywgY2FsbGJhY2spO1xuICAgIGNsb25lLnRyYW5zbGF0b3Iub3B0aW9ucyA9IG1lcmdlZE9wdGlvbnM7XG4gICAgY2xvbmUudHJhbnNsYXRvci5iYWNrZW5kQ29ubmVjdG9yLnNlcnZpY2VzLnV0aWxzID0ge1xuICAgICAgaGFzTG9hZGVkTmFtZXNwYWNlOiBjbG9uZS5oYXNMb2FkZWROYW1lc3BhY2UuYmluZChjbG9uZSlcbiAgICB9O1xuICAgIHJldHVybiBjbG9uZTtcbiAgfVxuICB0b0pTT04oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9wdGlvbnM6IHRoaXMub3B0aW9ucyxcbiAgICAgIHN0b3JlOiB0aGlzLnN0b3JlLFxuICAgICAgbGFuZ3VhZ2U6IHRoaXMubGFuZ3VhZ2UsXG4gICAgICBsYW5ndWFnZXM6IHRoaXMubGFuZ3VhZ2VzLFxuICAgICAgcmVzb2x2ZWRMYW5ndWFnZTogdGhpcy5yZXNvbHZlZExhbmd1YWdlXG4gICAgfTtcbiAgfVxufVxuY29uc3QgaW5zdGFuY2UgPSBJMThuLmNyZWF0ZUluc3RhbmNlKCk7XG5pbnN0YW5jZS5jcmVhdGVJbnN0YW5jZSA9IEkxOG4uY3JlYXRlSW5zdGFuY2U7XG5cbmNvbnN0IGNyZWF0ZUluc3RhbmNlID0gaW5zdGFuY2UuY3JlYXRlSW5zdGFuY2U7XG5jb25zdCBkaXIgPSBpbnN0YW5jZS5kaXI7XG5jb25zdCBpbml0ID0gaW5zdGFuY2UuaW5pdDtcbmNvbnN0IGxvYWRSZXNvdXJjZXMgPSBpbnN0YW5jZS5sb2FkUmVzb3VyY2VzO1xuY29uc3QgcmVsb2FkUmVzb3VyY2VzID0gaW5zdGFuY2UucmVsb2FkUmVzb3VyY2VzO1xuY29uc3QgdXNlID0gaW5zdGFuY2UudXNlO1xuY29uc3QgY2hhbmdlTGFuZ3VhZ2UgPSBpbnN0YW5jZS5jaGFuZ2VMYW5ndWFnZTtcbmNvbnN0IGdldEZpeGVkVCA9IGluc3RhbmNlLmdldEZpeGVkVDtcbmNvbnN0IHQgPSBpbnN0YW5jZS50O1xuY29uc3QgZXhpc3RzID0gaW5zdGFuY2UuZXhpc3RzO1xuY29uc3Qgc2V0RGVmYXVsdE5hbWVzcGFjZSA9IGluc3RhbmNlLnNldERlZmF1bHROYW1lc3BhY2U7XG5jb25zdCBoYXNMb2FkZWROYW1lc3BhY2UgPSBpbnN0YW5jZS5oYXNMb2FkZWROYW1lc3BhY2U7XG5jb25zdCBsb2FkTmFtZXNwYWNlcyA9IGluc3RhbmNlLmxvYWROYW1lc3BhY2VzO1xuY29uc3QgbG9hZExhbmd1YWdlcyA9IGluc3RhbmNlLmxvYWRMYW5ndWFnZXM7XG5cbmV4cG9ydCB7IGNoYW5nZUxhbmd1YWdlLCBjcmVhdGVJbnN0YW5jZSwgaW5zdGFuY2UgYXMgZGVmYXVsdCwgZGlyLCBleGlzdHMsIGdldEZpeGVkVCwgaGFzTG9hZGVkTmFtZXNwYWNlLCBpbml0LCBsb2FkTGFuZ3VhZ2VzLCBsb2FkTmFtZXNwYWNlcywgbG9hZFJlc291cmNlcywgcmVsb2FkUmVzb3VyY2VzLCBzZXREZWZhdWx0TmFtZXNwYWNlLCB0LCB1c2UgfTtcbiIsICJmdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soYSwgbikge1xuICBpZiAoIShhIGluc3RhbmNlb2YgbikpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7XG59XG5leHBvcnQgeyBfY2xhc3NDYWxsQ2hlY2sgYXMgZGVmYXVsdCB9OyIsICJmdW5jdGlvbiBfdHlwZW9mKG8pIHtcbiAgXCJAYmFiZWwvaGVscGVycyAtIHR5cGVvZlwiO1xuXG4gIHJldHVybiBfdHlwZW9mID0gXCJmdW5jdGlvblwiID09IHR5cGVvZiBTeW1ib2wgJiYgXCJzeW1ib2xcIiA9PSB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID8gZnVuY3Rpb24gKG8pIHtcbiAgICByZXR1cm4gdHlwZW9mIG87XG4gIH0gOiBmdW5jdGlvbiAobykge1xuICAgIHJldHVybiBvICYmIFwiZnVuY3Rpb25cIiA9PSB0eXBlb2YgU3ltYm9sICYmIG8uY29uc3RydWN0b3IgPT09IFN5bWJvbCAmJiBvICE9PSBTeW1ib2wucHJvdG90eXBlID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvO1xuICB9LCBfdHlwZW9mKG8pO1xufVxuZXhwb3J0IHsgX3R5cGVvZiBhcyBkZWZhdWx0IH07IiwgImltcG9ydCBfdHlwZW9mIGZyb20gXCIuL3R5cGVvZi5qc1wiO1xuZnVuY3Rpb24gdG9QcmltaXRpdmUodCwgcikge1xuICBpZiAoXCJvYmplY3RcIiAhPSBfdHlwZW9mKHQpIHx8ICF0KSByZXR1cm4gdDtcbiAgdmFyIGUgPSB0W1N5bWJvbC50b1ByaW1pdGl2ZV07XG4gIGlmICh2b2lkIDAgIT09IGUpIHtcbiAgICB2YXIgaSA9IGUuY2FsbCh0LCByIHx8IFwiZGVmYXVsdFwiKTtcbiAgICBpZiAoXCJvYmplY3RcIiAhPSBfdHlwZW9mKGkpKSByZXR1cm4gaTtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQEB0b1ByaW1pdGl2ZSBtdXN0IHJldHVybiBhIHByaW1pdGl2ZSB2YWx1ZS5cIik7XG4gIH1cbiAgcmV0dXJuIChcInN0cmluZ1wiID09PSByID8gU3RyaW5nIDogTnVtYmVyKSh0KTtcbn1cbmV4cG9ydCB7IHRvUHJpbWl0aXZlIGFzIGRlZmF1bHQgfTsiLCAiaW1wb3J0IF90eXBlb2YgZnJvbSBcIi4vdHlwZW9mLmpzXCI7XG5pbXBvcnQgdG9QcmltaXRpdmUgZnJvbSBcIi4vdG9QcmltaXRpdmUuanNcIjtcbmZ1bmN0aW9uIHRvUHJvcGVydHlLZXkodCkge1xuICB2YXIgaSA9IHRvUHJpbWl0aXZlKHQsIFwic3RyaW5nXCIpO1xuICByZXR1cm4gXCJzeW1ib2xcIiA9PSBfdHlwZW9mKGkpID8gaSA6IGkgKyBcIlwiO1xufVxuZXhwb3J0IHsgdG9Qcm9wZXJ0eUtleSBhcyBkZWZhdWx0IH07IiwgImltcG9ydCB0b1Byb3BlcnR5S2V5IGZyb20gXCIuL3RvUHJvcGVydHlLZXkuanNcIjtcbmZ1bmN0aW9uIF9kZWZpbmVQcm9wZXJ0aWVzKGUsIHIpIHtcbiAgZm9yICh2YXIgdCA9IDA7IHQgPCByLmxlbmd0aDsgdCsrKSB7XG4gICAgdmFyIG8gPSByW3RdO1xuICAgIG8uZW51bWVyYWJsZSA9IG8uZW51bWVyYWJsZSB8fCAhMSwgby5jb25maWd1cmFibGUgPSAhMCwgXCJ2YWx1ZVwiIGluIG8gJiYgKG8ud3JpdGFibGUgPSAhMCksIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlLCB0b1Byb3BlcnR5S2V5KG8ua2V5KSwgbyk7XG4gIH1cbn1cbmZ1bmN0aW9uIF9jcmVhdGVDbGFzcyhlLCByLCB0KSB7XG4gIHJldHVybiByICYmIF9kZWZpbmVQcm9wZXJ0aWVzKGUucHJvdG90eXBlLCByKSwgdCAmJiBfZGVmaW5lUHJvcGVydGllcyhlLCB0KSwgT2JqZWN0LmRlZmluZVByb3BlcnR5KGUsIFwicHJvdG90eXBlXCIsIHtcbiAgICB3cml0YWJsZTogITFcbiAgfSksIGU7XG59XG5leHBvcnQgeyBfY3JlYXRlQ2xhc3MgYXMgZGVmYXVsdCB9OyIsICJpbXBvcnQgX2NsYXNzQ2FsbENoZWNrIGZyb20gJ0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvZXNtL2NsYXNzQ2FsbENoZWNrJztcbmltcG9ydCBfY3JlYXRlQ2xhc3MgZnJvbSAnQGJhYmVsL3J1bnRpbWUvaGVscGVycy9lc20vY3JlYXRlQ2xhc3MnO1xuXG52YXIgYXJyID0gW107XG52YXIgZWFjaCA9IGFyci5mb3JFYWNoO1xudmFyIHNsaWNlID0gYXJyLnNsaWNlO1xuZnVuY3Rpb24gZGVmYXVsdHMob2JqKSB7XG4gIGVhY2guY2FsbChzbGljZS5jYWxsKGFyZ3VtZW50cywgMSksIGZ1bmN0aW9uIChzb3VyY2UpIHtcbiAgICBpZiAoc291cmNlKSB7XG4gICAgICBmb3IgKHZhciBwcm9wIGluIHNvdXJjZSkge1xuICAgICAgICBpZiAob2JqW3Byb3BdID09PSB1bmRlZmluZWQpIG9ialtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb2JqO1xufVxuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29udHJvbC1yZWdleFxudmFyIGZpZWxkQ29udGVudFJlZ0V4cCA9IC9eW1xcdTAwMDlcXHUwMDIwLVxcdTAwN2VcXHUwMDgwLVxcdTAwZmZdKyQvO1xudmFyIHNlcmlhbGl6ZUNvb2tpZSA9IGZ1bmN0aW9uIHNlcmlhbGl6ZUNvb2tpZShuYW1lLCB2YWwsIG9wdGlvbnMpIHtcbiAgdmFyIG9wdCA9IG9wdGlvbnMgfHwge307XG4gIG9wdC5wYXRoID0gb3B0LnBhdGggfHwgJy8nO1xuICB2YXIgdmFsdWUgPSBlbmNvZGVVUklDb21wb25lbnQodmFsKTtcbiAgdmFyIHN0ciA9IFwiXCIuY29uY2F0KG5hbWUsIFwiPVwiKS5jb25jYXQodmFsdWUpO1xuICBpZiAob3B0Lm1heEFnZSA+IDApIHtcbiAgICB2YXIgbWF4QWdlID0gb3B0Lm1heEFnZSAtIDA7XG4gICAgaWYgKE51bWJlci5pc05hTihtYXhBZ2UpKSB0aHJvdyBuZXcgRXJyb3IoJ21heEFnZSBzaG91bGQgYmUgYSBOdW1iZXInKTtcbiAgICBzdHIgKz0gXCI7IE1heC1BZ2U9XCIuY29uY2F0KE1hdGguZmxvb3IobWF4QWdlKSk7XG4gIH1cbiAgaWYgKG9wdC5kb21haW4pIHtcbiAgICBpZiAoIWZpZWxkQ29udGVudFJlZ0V4cC50ZXN0KG9wdC5kb21haW4pKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdvcHRpb24gZG9tYWluIGlzIGludmFsaWQnKTtcbiAgICB9XG4gICAgc3RyICs9IFwiOyBEb21haW49XCIuY29uY2F0KG9wdC5kb21haW4pO1xuICB9XG4gIGlmIChvcHQucGF0aCkge1xuICAgIGlmICghZmllbGRDb250ZW50UmVnRXhwLnRlc3Qob3B0LnBhdGgpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdvcHRpb24gcGF0aCBpcyBpbnZhbGlkJyk7XG4gICAgfVxuICAgIHN0ciArPSBcIjsgUGF0aD1cIi5jb25jYXQob3B0LnBhdGgpO1xuICB9XG4gIGlmIChvcHQuZXhwaXJlcykge1xuICAgIGlmICh0eXBlb2Ygb3B0LmV4cGlyZXMudG9VVENTdHJpbmcgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ29wdGlvbiBleHBpcmVzIGlzIGludmFsaWQnKTtcbiAgICB9XG4gICAgc3RyICs9IFwiOyBFeHBpcmVzPVwiLmNvbmNhdChvcHQuZXhwaXJlcy50b1VUQ1N0cmluZygpKTtcbiAgfVxuICBpZiAob3B0Lmh0dHBPbmx5KSBzdHIgKz0gJzsgSHR0cE9ubHknO1xuICBpZiAob3B0LnNlY3VyZSkgc3RyICs9ICc7IFNlY3VyZSc7XG4gIGlmIChvcHQuc2FtZVNpdGUpIHtcbiAgICB2YXIgc2FtZVNpdGUgPSB0eXBlb2Ygb3B0LnNhbWVTaXRlID09PSAnc3RyaW5nJyA/IG9wdC5zYW1lU2l0ZS50b0xvd2VyQ2FzZSgpIDogb3B0LnNhbWVTaXRlO1xuICAgIHN3aXRjaCAoc2FtZVNpdGUpIHtcbiAgICAgIGNhc2UgdHJ1ZTpcbiAgICAgICAgc3RyICs9ICc7IFNhbWVTaXRlPVN0cmljdCc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnbGF4JzpcbiAgICAgICAgc3RyICs9ICc7IFNhbWVTaXRlPUxheCc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnc3RyaWN0JzpcbiAgICAgICAgc3RyICs9ICc7IFNhbWVTaXRlPVN0cmljdCc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnbm9uZSc6XG4gICAgICAgIHN0ciArPSAnOyBTYW1lU2l0ZT1Ob25lJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdvcHRpb24gc2FtZVNpdGUgaXMgaW52YWxpZCcpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufTtcbnZhciBjb29raWUgPSB7XG4gIGNyZWF0ZTogZnVuY3Rpb24gY3JlYXRlKG5hbWUsIHZhbHVlLCBtaW51dGVzLCBkb21haW4pIHtcbiAgICB2YXIgY29va2llT3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiA0ICYmIGFyZ3VtZW50c1s0XSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzRdIDoge1xuICAgICAgcGF0aDogJy8nLFxuICAgICAgc2FtZVNpdGU6ICdzdHJpY3QnXG4gICAgfTtcbiAgICBpZiAobWludXRlcykge1xuICAgICAgY29va2llT3B0aW9ucy5leHBpcmVzID0gbmV3IERhdGUoKTtcbiAgICAgIGNvb2tpZU9wdGlvbnMuZXhwaXJlcy5zZXRUaW1lKGNvb2tpZU9wdGlvbnMuZXhwaXJlcy5nZXRUaW1lKCkgKyBtaW51dGVzICogNjAgKiAxMDAwKTtcbiAgICB9XG4gICAgaWYgKGRvbWFpbikgY29va2llT3B0aW9ucy5kb21haW4gPSBkb21haW47XG4gICAgZG9jdW1lbnQuY29va2llID0gc2VyaWFsaXplQ29va2llKG5hbWUsIGVuY29kZVVSSUNvbXBvbmVudCh2YWx1ZSksIGNvb2tpZU9wdGlvbnMpO1xuICB9LFxuICByZWFkOiBmdW5jdGlvbiByZWFkKG5hbWUpIHtcbiAgICB2YXIgbmFtZUVRID0gXCJcIi5jb25jYXQobmFtZSwgXCI9XCIpO1xuICAgIHZhciBjYSA9IGRvY3VtZW50LmNvb2tpZS5zcGxpdCgnOycpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2EubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBjID0gY2FbaV07XG4gICAgICB3aGlsZSAoYy5jaGFyQXQoMCkgPT09ICcgJykgYyA9IGMuc3Vic3RyaW5nKDEsIGMubGVuZ3RoKTtcbiAgICAgIGlmIChjLmluZGV4T2YobmFtZUVRKSA9PT0gMCkgcmV0dXJuIGMuc3Vic3RyaW5nKG5hbWVFUS5sZW5ndGgsIGMubGVuZ3RoKTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH0sXG4gIHJlbW92ZTogZnVuY3Rpb24gcmVtb3ZlKG5hbWUpIHtcbiAgICB0aGlzLmNyZWF0ZShuYW1lLCAnJywgLTEpO1xuICB9XG59O1xudmFyIGNvb2tpZSQxID0ge1xuICBuYW1lOiAnY29va2llJyxcbiAgbG9va3VwOiBmdW5jdGlvbiBsb29rdXAob3B0aW9ucykge1xuICAgIHZhciBmb3VuZDtcbiAgICBpZiAob3B0aW9ucy5sb29rdXBDb29raWUgJiYgdHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgdmFyIGMgPSBjb29raWUucmVhZChvcHRpb25zLmxvb2t1cENvb2tpZSk7XG4gICAgICBpZiAoYykgZm91bmQgPSBjO1xuICAgIH1cbiAgICByZXR1cm4gZm91bmQ7XG4gIH0sXG4gIGNhY2hlVXNlckxhbmd1YWdlOiBmdW5jdGlvbiBjYWNoZVVzZXJMYW5ndWFnZShsbmcsIG9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucy5sb29rdXBDb29raWUgJiYgdHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgY29va2llLmNyZWF0ZShvcHRpb25zLmxvb2t1cENvb2tpZSwgbG5nLCBvcHRpb25zLmNvb2tpZU1pbnV0ZXMsIG9wdGlvbnMuY29va2llRG9tYWluLCBvcHRpb25zLmNvb2tpZU9wdGlvbnMpO1xuICAgIH1cbiAgfVxufTtcblxudmFyIHF1ZXJ5c3RyaW5nID0ge1xuICBuYW1lOiAncXVlcnlzdHJpbmcnLFxuICBsb29rdXA6IGZ1bmN0aW9uIGxvb2t1cChvcHRpb25zKSB7XG4gICAgdmFyIGZvdW5kO1xuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgdmFyIHNlYXJjaCA9IHdpbmRvdy5sb2NhdGlvbi5zZWFyY2g7XG4gICAgICBpZiAoIXdpbmRvdy5sb2NhdGlvbi5zZWFyY2ggJiYgd2luZG93LmxvY2F0aW9uLmhhc2ggJiYgd2luZG93LmxvY2F0aW9uLmhhc2guaW5kZXhPZignPycpID4gLTEpIHtcbiAgICAgICAgc2VhcmNoID0gd2luZG93LmxvY2F0aW9uLmhhc2guc3Vic3RyaW5nKHdpbmRvdy5sb2NhdGlvbi5oYXNoLmluZGV4T2YoJz8nKSk7XG4gICAgICB9XG4gICAgICB2YXIgcXVlcnkgPSBzZWFyY2guc3Vic3RyaW5nKDEpO1xuICAgICAgdmFyIHBhcmFtcyA9IHF1ZXJ5LnNwbGl0KCcmJyk7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhcmFtcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgcG9zID0gcGFyYW1zW2ldLmluZGV4T2YoJz0nKTtcbiAgICAgICAgaWYgKHBvcyA+IDApIHtcbiAgICAgICAgICB2YXIga2V5ID0gcGFyYW1zW2ldLnN1YnN0cmluZygwLCBwb3MpO1xuICAgICAgICAgIGlmIChrZXkgPT09IG9wdGlvbnMubG9va3VwUXVlcnlzdHJpbmcpIHtcbiAgICAgICAgICAgIGZvdW5kID0gcGFyYW1zW2ldLnN1YnN0cmluZyhwb3MgKyAxKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZvdW5kO1xuICB9XG59O1xuXG52YXIgaGFzTG9jYWxTdG9yYWdlU3VwcG9ydCA9IG51bGw7XG52YXIgbG9jYWxTdG9yYWdlQXZhaWxhYmxlID0gZnVuY3Rpb24gbG9jYWxTdG9yYWdlQXZhaWxhYmxlKCkge1xuICBpZiAoaGFzTG9jYWxTdG9yYWdlU3VwcG9ydCAhPT0gbnVsbCkgcmV0dXJuIGhhc0xvY2FsU3RvcmFnZVN1cHBvcnQ7XG4gIHRyeSB7XG4gICAgaGFzTG9jYWxTdG9yYWdlU3VwcG9ydCA9IHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LmxvY2FsU3RvcmFnZSAhPT0gbnVsbDtcbiAgICB2YXIgdGVzdEtleSA9ICdpMThuZXh0LnRyYW5zbGF0ZS5ib28nO1xuICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbSh0ZXN0S2V5LCAnZm9vJyk7XG4gICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKHRlc3RLZXkpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgaGFzTG9jYWxTdG9yYWdlU3VwcG9ydCA9IGZhbHNlO1xuICB9XG4gIHJldHVybiBoYXNMb2NhbFN0b3JhZ2VTdXBwb3J0O1xufTtcbnZhciBsb2NhbFN0b3JhZ2UgPSB7XG4gIG5hbWU6ICdsb2NhbFN0b3JhZ2UnLFxuICBsb29rdXA6IGZ1bmN0aW9uIGxvb2t1cChvcHRpb25zKSB7XG4gICAgdmFyIGZvdW5kO1xuICAgIGlmIChvcHRpb25zLmxvb2t1cExvY2FsU3RvcmFnZSAmJiBsb2NhbFN0b3JhZ2VBdmFpbGFibGUoKSkge1xuICAgICAgdmFyIGxuZyA9IHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShvcHRpb25zLmxvb2t1cExvY2FsU3RvcmFnZSk7XG4gICAgICBpZiAobG5nKSBmb3VuZCA9IGxuZztcbiAgICB9XG4gICAgcmV0dXJuIGZvdW5kO1xuICB9LFxuICBjYWNoZVVzZXJMYW5ndWFnZTogZnVuY3Rpb24gY2FjaGVVc2VyTGFuZ3VhZ2UobG5nLCBvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMubG9va3VwTG9jYWxTdG9yYWdlICYmIGxvY2FsU3RvcmFnZUF2YWlsYWJsZSgpKSB7XG4gICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0ob3B0aW9ucy5sb29rdXBMb2NhbFN0b3JhZ2UsIGxuZyk7XG4gICAgfVxuICB9XG59O1xuXG52YXIgaGFzU2Vzc2lvblN0b3JhZ2VTdXBwb3J0ID0gbnVsbDtcbnZhciBzZXNzaW9uU3RvcmFnZUF2YWlsYWJsZSA9IGZ1bmN0aW9uIHNlc3Npb25TdG9yYWdlQXZhaWxhYmxlKCkge1xuICBpZiAoaGFzU2Vzc2lvblN0b3JhZ2VTdXBwb3J0ICE9PSBudWxsKSByZXR1cm4gaGFzU2Vzc2lvblN0b3JhZ2VTdXBwb3J0O1xuICB0cnkge1xuICAgIGhhc1Nlc3Npb25TdG9yYWdlU3VwcG9ydCA9IHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LnNlc3Npb25TdG9yYWdlICE9PSBudWxsO1xuICAgIHZhciB0ZXN0S2V5ID0gJ2kxOG5leHQudHJhbnNsYXRlLmJvbyc7XG4gICAgd2luZG93LnNlc3Npb25TdG9yYWdlLnNldEl0ZW0odGVzdEtleSwgJ2ZvbycpO1xuICAgIHdpbmRvdy5zZXNzaW9uU3RvcmFnZS5yZW1vdmVJdGVtKHRlc3RLZXkpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgaGFzU2Vzc2lvblN0b3JhZ2VTdXBwb3J0ID0gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIGhhc1Nlc3Npb25TdG9yYWdlU3VwcG9ydDtcbn07XG52YXIgc2Vzc2lvblN0b3JhZ2UgPSB7XG4gIG5hbWU6ICdzZXNzaW9uU3RvcmFnZScsXG4gIGxvb2t1cDogZnVuY3Rpb24gbG9va3VwKG9wdGlvbnMpIHtcbiAgICB2YXIgZm91bmQ7XG4gICAgaWYgKG9wdGlvbnMubG9va3VwU2Vzc2lvblN0b3JhZ2UgJiYgc2Vzc2lvblN0b3JhZ2VBdmFpbGFibGUoKSkge1xuICAgICAgdmFyIGxuZyA9IHdpbmRvdy5zZXNzaW9uU3RvcmFnZS5nZXRJdGVtKG9wdGlvbnMubG9va3VwU2Vzc2lvblN0b3JhZ2UpO1xuICAgICAgaWYgKGxuZykgZm91bmQgPSBsbmc7XG4gICAgfVxuICAgIHJldHVybiBmb3VuZDtcbiAgfSxcbiAgY2FjaGVVc2VyTGFuZ3VhZ2U6IGZ1bmN0aW9uIGNhY2hlVXNlckxhbmd1YWdlKGxuZywgb3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zLmxvb2t1cFNlc3Npb25TdG9yYWdlICYmIHNlc3Npb25TdG9yYWdlQXZhaWxhYmxlKCkpIHtcbiAgICAgIHdpbmRvdy5zZXNzaW9uU3RvcmFnZS5zZXRJdGVtKG9wdGlvbnMubG9va3VwU2Vzc2lvblN0b3JhZ2UsIGxuZyk7XG4gICAgfVxuICB9XG59O1xuXG52YXIgbmF2aWdhdG9yJDEgPSB7XG4gIG5hbWU6ICduYXZpZ2F0b3InLFxuICBsb29rdXA6IGZ1bmN0aW9uIGxvb2t1cChvcHRpb25zKSB7XG4gICAgdmFyIGZvdW5kID0gW107XG4gICAgaWYgKHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBpZiAobmF2aWdhdG9yLmxhbmd1YWdlcykge1xuICAgICAgICAvLyBjaHJvbWUgb25seTsgbm90IGFuIGFycmF5LCBzbyBjYW4ndCB1c2UgLnB1c2guYXBwbHkgaW5zdGVhZCBvZiBpdGVyYXRpbmdcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuYXZpZ2F0b3IubGFuZ3VhZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgZm91bmQucHVzaChuYXZpZ2F0b3IubGFuZ3VhZ2VzW2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKG5hdmlnYXRvci51c2VyTGFuZ3VhZ2UpIHtcbiAgICAgICAgZm91bmQucHVzaChuYXZpZ2F0b3IudXNlckxhbmd1YWdlKTtcbiAgICAgIH1cbiAgICAgIGlmIChuYXZpZ2F0b3IubGFuZ3VhZ2UpIHtcbiAgICAgICAgZm91bmQucHVzaChuYXZpZ2F0b3IubGFuZ3VhZ2UpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZm91bmQubGVuZ3RoID4gMCA/IGZvdW5kIDogdW5kZWZpbmVkO1xuICB9XG59O1xuXG52YXIgaHRtbFRhZyA9IHtcbiAgbmFtZTogJ2h0bWxUYWcnLFxuICBsb29rdXA6IGZ1bmN0aW9uIGxvb2t1cChvcHRpb25zKSB7XG4gICAgdmFyIGZvdW5kO1xuICAgIHZhciBodG1sVGFnID0gb3B0aW9ucy5odG1sVGFnIHx8ICh0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnID8gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IDogbnVsbCk7XG4gICAgaWYgKGh0bWxUYWcgJiYgdHlwZW9mIGh0bWxUYWcuZ2V0QXR0cmlidXRlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBmb3VuZCA9IGh0bWxUYWcuZ2V0QXR0cmlidXRlKCdsYW5nJyk7XG4gICAgfVxuICAgIHJldHVybiBmb3VuZDtcbiAgfVxufTtcblxudmFyIHBhdGggPSB7XG4gIG5hbWU6ICdwYXRoJyxcbiAgbG9va3VwOiBmdW5jdGlvbiBsb29rdXAob3B0aW9ucykge1xuICAgIHZhciBmb3VuZDtcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHZhciBsYW5ndWFnZSA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5tYXRjaCgvXFwvKFthLXpBLVotXSopL2cpO1xuICAgICAgaWYgKGxhbmd1YWdlIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmxvb2t1cEZyb21QYXRoSW5kZXggPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBsYW5ndWFnZVtvcHRpb25zLmxvb2t1cEZyb21QYXRoSW5kZXhdICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICB9XG4gICAgICAgICAgZm91bmQgPSBsYW5ndWFnZVtvcHRpb25zLmxvb2t1cEZyb21QYXRoSW5kZXhdLnJlcGxhY2UoJy8nLCAnJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZm91bmQgPSBsYW5ndWFnZVswXS5yZXBsYWNlKCcvJywgJycpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmb3VuZDtcbiAgfVxufTtcblxudmFyIHN1YmRvbWFpbiA9IHtcbiAgbmFtZTogJ3N1YmRvbWFpbicsXG4gIGxvb2t1cDogZnVuY3Rpb24gbG9va3VwKG9wdGlvbnMpIHtcbiAgICAvLyBJZiBnaXZlbiBnZXQgdGhlIHN1YmRvbWFpbiBpbmRleCBlbHNlIDFcbiAgICB2YXIgbG9va3VwRnJvbVN1YmRvbWFpbkluZGV4ID0gdHlwZW9mIG9wdGlvbnMubG9va3VwRnJvbVN1YmRvbWFpbkluZGV4ID09PSAnbnVtYmVyJyA/IG9wdGlvbnMubG9va3VwRnJvbVN1YmRvbWFpbkluZGV4ICsgMSA6IDE7XG4gICAgLy8gZ2V0IGFsbCBtYXRjaGVzIGlmIHdpbmRvdy5sb2NhdGlvbi4gaXMgZXhpc3RpbmdcbiAgICAvLyBmaXJzdCBpdGVtIG9mIG1hdGNoIGlzIHRoZSBtYXRjaCBpdHNlbGYgYW5kIHRoZSBzZWNvbmQgaXMgdGhlIGZpcnN0IGdyb3VwIG1hY2h0IHdoaWNoIHNvdWxkIGJlIHRoZSBmaXJzdCBzdWJkb21haW4gbWF0Y2hcbiAgICAvLyBpcyB0aGUgaG9zdG5hbWUgbm8gcHVibGljIGRvbWFpbiBnZXQgdGhlIG9yIG9wdGlvbiBvZiBsb2NhbGhvc3RcbiAgICB2YXIgbGFuZ3VhZ2UgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cubG9jYXRpb24gJiYgd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lICYmIHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZS5tYXRjaCgvXihcXHd7Miw1fSlcXC4oKFthLXowLTktXXsxLDYzfVxcLlthLXpdezIsNn0pfGxvY2FsaG9zdCkvaSk7XG5cbiAgICAvLyBpZiB0aGVyZSBpcyBubyBtYXRjaCAobnVsbCkgcmV0dXJuIHVuZGVmaW5lZFxuICAgIGlmICghbGFuZ3VhZ2UpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgLy8gcmV0dXJuIHRoZSBnaXZlbiBncm91cCBtYXRjaFxuICAgIHJldHVybiBsYW5ndWFnZVtsb29rdXBGcm9tU3ViZG9tYWluSW5kZXhdO1xuICB9XG59O1xuXG5mdW5jdGlvbiBnZXREZWZhdWx0cygpIHtcbiAgcmV0dXJuIHtcbiAgICBvcmRlcjogWydxdWVyeXN0cmluZycsICdjb29raWUnLCAnbG9jYWxTdG9yYWdlJywgJ3Nlc3Npb25TdG9yYWdlJywgJ25hdmlnYXRvcicsICdodG1sVGFnJ10sXG4gICAgbG9va3VwUXVlcnlzdHJpbmc6ICdsbmcnLFxuICAgIGxvb2t1cENvb2tpZTogJ2kxOG5leHQnLFxuICAgIGxvb2t1cExvY2FsU3RvcmFnZTogJ2kxOG5leHRMbmcnLFxuICAgIGxvb2t1cFNlc3Npb25TdG9yYWdlOiAnaTE4bmV4dExuZycsXG4gICAgLy8gY2FjaGUgdXNlciBsYW5ndWFnZVxuICAgIGNhY2hlczogWydsb2NhbFN0b3JhZ2UnXSxcbiAgICBleGNsdWRlQ2FjaGVGb3I6IFsnY2ltb2RlJ10sXG4gICAgLy8gY29va2llTWludXRlczogMTAsXG4gICAgLy8gY29va2llRG9tYWluOiAnbXlEb21haW4nXG5cbiAgICBjb252ZXJ0RGV0ZWN0ZWRMYW5ndWFnZTogZnVuY3Rpb24gY29udmVydERldGVjdGVkTGFuZ3VhZ2UobCkge1xuICAgICAgcmV0dXJuIGw7XG4gICAgfVxuICB9O1xufVxudmFyIEJyb3dzZXIgPSAvKiNfX1BVUkVfXyovZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBCcm93c2VyKHNlcnZpY2VzKSB7XG4gICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IHt9O1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBCcm93c2VyKTtcbiAgICB0aGlzLnR5cGUgPSAnbGFuZ3VhZ2VEZXRlY3Rvcic7XG4gICAgdGhpcy5kZXRlY3RvcnMgPSB7fTtcbiAgICB0aGlzLmluaXQoc2VydmljZXMsIG9wdGlvbnMpO1xuICB9XG4gIF9jcmVhdGVDbGFzcyhCcm93c2VyLCBbe1xuICAgIGtleTogXCJpbml0XCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGluaXQoc2VydmljZXMpIHtcbiAgICAgIHZhciBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB7fTtcbiAgICAgIHZhciBpMThuT3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzJdIDoge307XG4gICAgICB0aGlzLnNlcnZpY2VzID0gc2VydmljZXMgfHwge1xuICAgICAgICBsYW5ndWFnZVV0aWxzOiB7fVxuICAgICAgfTsgLy8gdGhpcyB3YXkgdGhlIGxhbmd1YWdlIGRldGVjdG9yIGNhbiBiZSB1c2VkIHdpdGhvdXQgaTE4bmV4dFxuICAgICAgdGhpcy5vcHRpb25zID0gZGVmYXVsdHMob3B0aW9ucywgdGhpcy5vcHRpb25zIHx8IHt9LCBnZXREZWZhdWx0cygpKTtcbiAgICAgIGlmICh0eXBlb2YgdGhpcy5vcHRpb25zLmNvbnZlcnREZXRlY3RlZExhbmd1YWdlID09PSAnc3RyaW5nJyAmJiB0aGlzLm9wdGlvbnMuY29udmVydERldGVjdGVkTGFuZ3VhZ2UuaW5kZXhPZignMTU4OTcnKSA+IC0xKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5jb252ZXJ0RGV0ZWN0ZWRMYW5ndWFnZSA9IGZ1bmN0aW9uIChsKSB7XG4gICAgICAgICAgcmV0dXJuIGwucmVwbGFjZSgnLScsICdfJyk7XG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIC8vIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmxvb2t1cEZyb21VcmxJbmRleCkgdGhpcy5vcHRpb25zLmxvb2t1cEZyb21QYXRoSW5kZXggPSB0aGlzLm9wdGlvbnMubG9va3VwRnJvbVVybEluZGV4O1xuICAgICAgdGhpcy5pMThuT3B0aW9ucyA9IGkxOG5PcHRpb25zO1xuICAgICAgdGhpcy5hZGREZXRlY3Rvcihjb29raWUkMSk7XG4gICAgICB0aGlzLmFkZERldGVjdG9yKHF1ZXJ5c3RyaW5nKTtcbiAgICAgIHRoaXMuYWRkRGV0ZWN0b3IobG9jYWxTdG9yYWdlKTtcbiAgICAgIHRoaXMuYWRkRGV0ZWN0b3Ioc2Vzc2lvblN0b3JhZ2UpO1xuICAgICAgdGhpcy5hZGREZXRlY3RvcihuYXZpZ2F0b3IkMSk7XG4gICAgICB0aGlzLmFkZERldGVjdG9yKGh0bWxUYWcpO1xuICAgICAgdGhpcy5hZGREZXRlY3RvcihwYXRoKTtcbiAgICAgIHRoaXMuYWRkRGV0ZWN0b3Ioc3ViZG9tYWluKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiYWRkRGV0ZWN0b3JcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gYWRkRGV0ZWN0b3IoZGV0ZWN0b3IpIHtcbiAgICAgIHRoaXMuZGV0ZWN0b3JzW2RldGVjdG9yLm5hbWVdID0gZGV0ZWN0b3I7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiZGV0ZWN0XCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGRldGVjdChkZXRlY3Rpb25PcmRlcikge1xuICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgIGlmICghZGV0ZWN0aW9uT3JkZXIpIGRldGVjdGlvbk9yZGVyID0gdGhpcy5vcHRpb25zLm9yZGVyO1xuICAgICAgdmFyIGRldGVjdGVkID0gW107XG4gICAgICBkZXRlY3Rpb25PcmRlci5mb3JFYWNoKGZ1bmN0aW9uIChkZXRlY3Rvck5hbWUpIHtcbiAgICAgICAgaWYgKF90aGlzLmRldGVjdG9yc1tkZXRlY3Rvck5hbWVdKSB7XG4gICAgICAgICAgdmFyIGxvb2t1cCA9IF90aGlzLmRldGVjdG9yc1tkZXRlY3Rvck5hbWVdLmxvb2t1cChfdGhpcy5vcHRpb25zKTtcbiAgICAgICAgICBpZiAobG9va3VwICYmIHR5cGVvZiBsb29rdXAgPT09ICdzdHJpbmcnKSBsb29rdXAgPSBbbG9va3VwXTtcbiAgICAgICAgICBpZiAobG9va3VwKSBkZXRlY3RlZCA9IGRldGVjdGVkLmNvbmNhdChsb29rdXApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGRldGVjdGVkID0gZGV0ZWN0ZWQubWFwKGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIHJldHVybiBfdGhpcy5vcHRpb25zLmNvbnZlcnREZXRlY3RlZExhbmd1YWdlKGQpO1xuICAgICAgfSk7XG4gICAgICBpZiAodGhpcy5zZXJ2aWNlcy5sYW5ndWFnZVV0aWxzLmdldEJlc3RNYXRjaEZyb21Db2RlcykgcmV0dXJuIGRldGVjdGVkOyAvLyBuZXcgaTE4bmV4dCB2MTkuNS4wXG4gICAgICByZXR1cm4gZGV0ZWN0ZWQubGVuZ3RoID4gMCA/IGRldGVjdGVkWzBdIDogbnVsbDsgLy8gYSBsaXR0bGUgYmFja3dhcmQgY29tcGF0aWJpbGl0eVxuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJjYWNoZVVzZXJMYW5ndWFnZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBjYWNoZVVzZXJMYW5ndWFnZShsbmcsIGNhY2hlcykge1xuICAgICAgdmFyIF90aGlzMiA9IHRoaXM7XG4gICAgICBpZiAoIWNhY2hlcykgY2FjaGVzID0gdGhpcy5vcHRpb25zLmNhY2hlcztcbiAgICAgIGlmICghY2FjaGVzKSByZXR1cm47XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmV4Y2x1ZGVDYWNoZUZvciAmJiB0aGlzLm9wdGlvbnMuZXhjbHVkZUNhY2hlRm9yLmluZGV4T2YobG5nKSA+IC0xKSByZXR1cm47XG4gICAgICBjYWNoZXMuZm9yRWFjaChmdW5jdGlvbiAoY2FjaGVOYW1lKSB7XG4gICAgICAgIGlmIChfdGhpczIuZGV0ZWN0b3JzW2NhY2hlTmFtZV0pIF90aGlzMi5kZXRlY3RvcnNbY2FjaGVOYW1lXS5jYWNoZVVzZXJMYW5ndWFnZShsbmcsIF90aGlzMi5vcHRpb25zKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfV0pO1xuICByZXR1cm4gQnJvd3Nlcjtcbn0oKTtcbkJyb3dzZXIudHlwZSA9ICdsYW5ndWFnZURldGVjdG9yJztcblxuZXhwb3J0IHsgQnJvd3NlciBhcyBkZWZhdWx0IH07XG4iLCAiZXhwb3J0IGNvbnN0IFNUQVRFX0tFWV9QUkVGSVggPSAnYWpfbHRpJztcbmV4cG9ydCBjb25zdCBNQUlOX0NPTlRFTlRfSUQgPSAnbWFpbi1jb250ZW50JztcbiIsICJpbXBvcnQgaTE4bmV4dCBmcm9tIFwiaTE4bmV4dFwiO1xuaW1wb3J0IHsgQ2FwYWJpbGl0eSB9IGZyb20gJy4uLy4uL3R5cGVzJztcblxuZXhwb3J0IGZ1bmN0aW9uIGdldENhcGFiaWxpdGllcygpOiBQcm9taXNlPENhcGFiaWxpdHlbXT4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGxldCBwYXJlbnQgPSB3aW5kb3cucGFyZW50IHx8IHdpbmRvdy5vcGVuZXI7XG4gICAgXG4gICAgY29uc3QgdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgY29uc29sZS5sb2coaTE4bmV4dC50KCdjYXBhYmlsaXRpZXMgcmVxdWVzdCB0aW1lb3V0JykpO1xuICAgICAgcmVqZWN0KG5ldyBFcnJvcihpMThuZXh0LnQoJ1RpbWVvdXQgd2hpbGUgd2FpdGluZyBmb3IgY2FwYWJpbGl0aWVzIHJlc3BvbnNlJykpKTtcbiAgICB9LCAxMDAwKTtcblxuICAgIGNvbnN0IHJlY2VpdmVNZXNzYWdlID0gKGV2ZW50OiBNZXNzYWdlRXZlbnQpID0+IHtcbiAgICAgIGlmIChcbiAgICAgICAgdHlwZW9mIGV2ZW50LmRhdGEgPT09ICdvYmplY3QnICYmXG4gICAgICAgIGV2ZW50LmRhdGEuc3ViamVjdCA9PT0gJ2x0aS5jYXBhYmlsaXRpZXMucmVzcG9uc2UnICYmXG4gICAgICAgIGV2ZW50LmRhdGEubWVzc2FnZV9pZCA9PT0gJ2FqLWx0aS1jYXBzJ1xuICAgICAgKSB7XG4gICAgICAgIHJlbW92ZUV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCByZWNlaXZlTWVzc2FnZSk7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcblxuICAgICAgICBpZiAoZXZlbnQuZGF0YS5lcnJvcikge1xuICAgICAgICAgIC8vIGhhbmRsZSBlcnJvcnNcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGV2ZW50LmRhdGEuZXJyb3IuY29kZSk7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihldmVudC5kYXRhLmVycm9yLm1lc3NhZ2UpO1xuICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoZXZlbnQuZGF0YS5lcnJvcm1lc3NhZ2UpKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcmVzb2x2ZShldmVudC5kYXRhLnN1cHBvcnRlZF9tZXNzYWdlcyk7XG4gICAgICB9XG4gICAgfTtcbiAgICBcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIHJlY2VpdmVNZXNzYWdlKTtcbiAgICBwYXJlbnQucG9zdE1lc3NhZ2UoXG4gICAgICB7XG4gICAgICAgICdzdWJqZWN0JzogJ2x0aS5jYXBhYmlsaXRpZXMnLFxuICAgICAgICAnbWVzc2FnZV9pZCc6ICdhai1sdGktY2FwcycsXG4gICAgICB9LFxuICAgICAgJyonXG4gICAgKVxuICAgIC8vIFBsYXRmb3JtIHdpbGwgcG9zdCBhIG1lc3NhZ2UgYmFjayBvciB3ZSdsbCB0aW1lb3V0XG4gIH0pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0Q2FwYWJpbGl0eShzdWJqZWN0OiBTdHJpbmcpOiBQcm9taXNlPENhcGFiaWxpdHl8bnVsbD4ge1xuICBjb25zdCBjYXBzID0gYXdhaXQgZ2V0Q2FwYWJpbGl0aWVzKCk7XG4gIGlmIChjYXBzKSB7XG4gICAgcmV0dXJuIGNhcHMuZmluZChcbiAgICAgIChlbGVtZW50KSA9PiBlbGVtZW50LnN1YmplY3QgPT0gc3ViamVjdFxuICAgICkgfHwgbnVsbFxuICB9XG4gIHJldHVybiBudWxsO1xufVxuIiwgImltcG9ydCBpMThuZXh0IGZyb20gXCJpMThuZXh0XCI7XG5pbXBvcnQgeyBTVEFURV9LRVlfUFJFRklYIH0gZnJvbSAnLi9jb25zdGFudHMnO1xuaW1wb3J0IHsgTFRJU3RvcmFnZVBhcmFtcywgSW5pdFNldHRpbmdzIH0gZnJvbSAnLi4vLi4vdHlwZXMnO1xuaW1wb3J0IHsgc2V0Q29va2llICB9IGZyb20gJy4vY29va2llcyc7XG5pbXBvcnQgeyBzaG93TGF1bmNoTmV3V2luZG93IH0gZnJvbSAnLi4vaHRtbC9sYXVuY2hfbmV3X3dpbmRvdyc7XG5pbXBvcnQgeyBnZXRDYXBhYmlsaXR5IH0gZnJvbSBcIi4uL2xpYnMvY2FwYWJpbGl0aWVzXCI7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRUYXJnZXRGcmFtZShzdG9yYWdlUGFyYW1zOiBMVElTdG9yYWdlUGFyYW1zKTogUHJvbWlzZTxXaW5kb3c+IHtcbiAgICBsZXQgdGFyZ2V0ID0gc3RvcmFnZVBhcmFtcy50YXJnZXQ7XG4gICAgaWYgKHRhcmdldCA9PSBudWxsKSB7XG4gICAgICBjb25zdCBjYXAgPSBhd2FpdCBnZXRDYXBhYmlsaXR5KCdsdGkuZ2V0X2RhdGEnKTtcbiAgICAgIHRhcmdldCA9IGNhcD8uZnJhbWU7XG4gICAgfVxuICAgIGlmICh0YXJnZXQgPT0gbnVsbCkge1xuICAgICAgdGFyZ2V0ID0gXCJfcGFyZW50XCJcbiAgICB9XG4gICAgY29uc3QgcGFyZW50ID0gd2luZG93LnBhcmVudCB8fCB3aW5kb3cub3BlbmVyO1xuICAgIHJldHVybiB0YXJnZXQgPT09IFwiX3BhcmVudFwiID8gcGFyZW50IDogcGFyZW50LmZyYW1lc1t0YXJnZXQgYXMgYW55XSB8fCBwYXJlbnQ7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzdG9yZVN0YXRlKHN0YXRlOiBzdHJpbmcsIHN0b3JhZ2VQYXJhbXM6IExUSVN0b3JhZ2VQYXJhbXMpOiBQcm9taXNlPHZvaWQ+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBsZXQgcGxhdGZvcm1PcmlnaW4gPSBuZXcgVVJMKHN0b3JhZ2VQYXJhbXMucGxhdGZvcm1PSURDVXJsKS5vcmlnaW47XG5cbiAgICBpZiAoc3RvcmFnZVBhcmFtcy5vcmlnaW5TdXBwb3J0QnJva2VuKSB7XG4gICAgICAvLyBUaGUgc3BlYyByZXF1aXJlcyB0aGF0IHRoZSBtZXNzYWdlJ3MgdGFyZ2V0IG9yaWdpbiBiZSBzZXQgdG8gdGhlIHBsYXRmb3JtJ3MgT0lEQyBBdXRob3JpemF0aW9uIHVybFxuICAgICAgLy8gYnV0IENhbnZhcyBkb2VzIG5vdCB5ZXQgc3VwcG9ydCB0aGlzLCBzbyB3ZSBoYXZlIHRvIHVzZSAnKicuXG4gICAgICBwbGF0Zm9ybU9yaWdpbiA9ICcqJztcbiAgICB9XG5cbiAgICBsZXQgdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgY29uc29sZS5lcnJvcihcInBvc3RNZXNzYWdlIHRpbWVvdXRcIik7XG4gICAgICByZWplY3QobmV3IEVycm9yKGkxOG5leHQudCgnVGltZW91dCB3aGlsZSB3YWl0aW5nIGZvciBwbGF0Zm9ybSByZXNwb25zZScpKSk7XG4gICAgfSwgMjAwMCk7XG5cbiAgICBsZXQgcmVjZWl2ZU1lc3NhZ2UgPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgICAgaWYgKHR5cGVvZiBldmVudC5kYXRhID09PSBcIm9iamVjdFwiICYmXG4gICAgICAgIGV2ZW50LmRhdGEuc3ViamVjdCA9PT0gXCJsdGkucHV0X2RhdGEucmVzcG9uc2VcIiAmJlxuICAgICAgICBldmVudC5kYXRhLm1lc3NhZ2VfaWQgPT09IHN0YXRlICYmXG4gICAgICAgIChldmVudC5vcmlnaW4gPT09IHBsYXRmb3JtT3JpZ2luIHx8XG4gICAgICAgICAgKHN0b3JhZ2VQYXJhbXMub3JpZ2luU3VwcG9ydEJyb2tlbiAmJiBwbGF0Zm9ybU9yaWdpbiA9PT0gXCIqXCIpKSkge1xuXG4gICAgICAgIHJlbW92ZUV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCByZWNlaXZlTWVzc2FnZSk7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcblxuICAgICAgICBpZiAoZXZlbnQuZGF0YS5lcnJvcikge1xuICAgICAgICAgIC8vIGhhbmRsZSBlcnJvcnNcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGV2ZW50LmRhdGEuZXJyb3IuY29kZSk7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihldmVudC5kYXRhLmVycm9yLm1lc3NhZ2UpO1xuICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoZXZlbnQuZGF0YS5lcnJvcm1lc3NhZ2UpKTtcbiAgICAgICAgfVxuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgcmVjZWl2ZU1lc3NhZ2UpO1xuICAgIGdldFRhcmdldEZyYW1lKHN0b3JhZ2VQYXJhbXMpXG4gICAgICAudGhlbiggdGFyZ2V0RnJhbWUgPT5cbiAgICAgICAgIHRhcmdldEZyYW1lPy5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgIFwic3ViamVjdFwiOiBcImx0aS5wdXRfZGF0YVwiLFxuICAgICAgICAgICBcIm1lc3NhZ2VfaWRcIjogc3RhdGUsXG4gICAgICAgICAgIFwia2V5XCI6IGAke1NUQVRFX0tFWV9QUkVGSVh9JHtzdGF0ZX1gLFxuICAgICAgICAgICBcInZhbHVlXCI6IHN0YXRlLFxuICAgICAgICAgfSwgcGxhdGZvcm1PcmlnaW4pXG4gICAgICAgICkuY2F0Y2goIChlOiB1bmtub3duKSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coaTE4bmV4dC50KCdDb3VsZCBub3QgZmluZCB0YXJnZXQgZnJhbWUnKSk7XG4gICAgICAgICAgY29uc29sZS5sb2coZSk7XG4gICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihpMThuZXh0LnQoJ0NvdWxkIG5vdCBmaW5kIHRhcmdldCBmcmFtZScpKSk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuXG4gICAgLy8gUGxhdGZvcm0gc2hvdWxkIHBvc3QgYSBtZXNzYWdlIGJhY2tcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNTdG9yYWdlQWNjZXNzQVBJKCkge1xuICByZXR1cm4gdHlwZW9mIGRvY3VtZW50Lmhhc1N0b3JhZ2VBY2Nlc3MgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgZG9jdW1lbnQucmVxdWVzdFN0b3JhZ2VBY2Nlc3MgPT09ICdmdW5jdGlvbic7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0cnlSZXF1ZXN0U3RvcmFnZUFjY2VzcyhzZXR0aW5nczogSW5pdFNldHRpbmdzKSB7XG4gIGRvY3VtZW50LnJlcXVlc3RTdG9yYWdlQWNjZXNzKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICAvLyBXZSBzaG91bGQgaGF2ZSBjb29raWVzIG5vd1xuICAgICAgc2V0Q29va2llKHNldHRpbmdzKTtcbiAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZXBsYWNlKHNldHRpbmdzLnJlc3BvbnNlVXJsKTtcbiAgICB9KVxuICAgIC5jYXRjaCgoZSkgPT4ge1xuICAgICAgY29uc29sZS5sb2coZSk7XG4gICAgICBzaG93TGF1bmNoTmV3V2luZG93KHNldHRpbmdzLCB7IHNob3dTdG9yYWdlQWNjZXNzRGVuaWVkOiB0cnVlLCBkaXNhYmxlTGF1bmNoOiB0cnVlLCBzaG93UmVxdWVzdFN0b3JhZ2VBY2Nlc3M6IGZhbHNlIH0pO1xuICAgIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbG9hZFN0YXRlKHN0YXRlOiBzdHJpbmcsIHN0b3JhZ2VQYXJhbXM6IExUSVN0b3JhZ2VQYXJhbXMpOiBQcm9taXNlPHN0cmluZz4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGxldCBwbGF0Zm9ybU9yaWdpbiA9IG5ldyBVUkwoc3RvcmFnZVBhcmFtcy5wbGF0Zm9ybU9JRENVcmwpLm9yaWdpbjtcblxuICAgIGlmIChzdG9yYWdlUGFyYW1zLm9yaWdpblN1cHBvcnRCcm9rZW4pIHtcbiAgICAgIC8vIFRoZSBzcGVjIHJlcXVpcmVzIHRoYXQgdGhlIG1lc3NhZ2UncyB0YXJnZXQgb3JpZ2luIGJlIHNldCB0byB0aGUgcGxhdGZvcm0ncyBPSURDIEF1dGhvcml6YXRpb24gdXJsXG4gICAgICAvLyBidXQgQ2FudmFzIGRvZXMgbm90IHlldCBzdXBwb3J0IHRoaXMsIHNvIHdlIGhhdmUgdG8gdXNlICcqJy5cbiAgICAgIHBsYXRmb3JtT3JpZ2luID0gJyonO1xuICAgIH1cblxuICAgIGNvbnN0IHRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGkxOG5leHQudCgncG9zdE1lc3NhZ2UgdGltZW91dCcpKTtcbiAgICAgIHJlamVjdChuZXcgRXJyb3IoaTE4bmV4dC50KCdUaW1lb3V0IHdoaWxlIHdhaXRpbmcgZm9yIHBsYXRmb3JtIHJlc3BvbnNlJykpKTtcbiAgICB9LCAyMDAwKTtcblxuICAgIGNvbnN0IHJlY2VpdmVNZXNzYWdlID0gKGV2ZW50OiBNZXNzYWdlRXZlbnQpID0+IHtcbiAgICAgIGlmIChcbiAgICAgICAgdHlwZW9mIGV2ZW50LmRhdGEgPT09ICdvYmplY3QnICYmXG4gICAgICAgIGV2ZW50LmRhdGEuc3ViamVjdCA9PT0gJ2x0aS5nZXRfZGF0YS5yZXNwb25zZScgJiZcbiAgICAgICAgZXZlbnQuZGF0YS5tZXNzYWdlX2lkID09PSBzdGF0ZSAmJlxuICAgICAgICAoZXZlbnQub3JpZ2luID09PSBwbGF0Zm9ybU9yaWdpbiB8fCBwbGF0Zm9ybU9yaWdpbiA9PT0gJyonKVxuICAgICAgKSB7XG4gICAgICAgIHJlbW92ZUV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCByZWNlaXZlTWVzc2FnZSk7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcblxuICAgICAgICBpZiAoZXZlbnQuZGF0YS5lcnJvcikge1xuICAgICAgICAgIC8vIGhhbmRsZSBlcnJvcnNcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGV2ZW50LmRhdGEuZXJyb3IuY29kZSk7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihldmVudC5kYXRhLmVycm9yLm1lc3NhZ2UpO1xuICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoZXZlbnQuZGF0YS5lcnJvcm1lc3NhZ2UpKTtcbiAgICAgICAgfVxuICAgICAgICByZXNvbHZlKGV2ZW50LmRhdGEudmFsdWUpO1xuICAgICAgfVxuICAgIH07XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCByZWNlaXZlTWVzc2FnZSk7XG4gICAgZ2V0VGFyZ2V0RnJhbWUoc3RvcmFnZVBhcmFtcylcbiAgICAgIC50aGVuKCB0YXJnZXRGcmFtZSA9PlxuICAgICAgICB0YXJnZXRGcmFtZS5wb3N0TWVzc2FnZShcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzdWJqZWN0OiAnbHRpLmdldF9kYXRhJyxcbiAgICAgICAgICAgIG1lc3NhZ2VfaWQ6IHN0YXRlLFxuICAgICAgICAgICAga2V5OiBgJHtTVEFURV9LRVlfUFJFRklYfSR7c3RhdGV9YCxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHBsYXRmb3JtT3JpZ2luKVxuICAgICAgICApLmNhdGNoKCAoZTogdW5rbm93bikgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coaTE4bmV4dC50KCdDb3VsZCBub3QgZmluZCB0YXJnZXQgZnJhbWUnKSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlKTtcbiAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoaTE4bmV4dC50KCdDb3VsZCBub3QgZmluZCB0YXJnZXQgZnJhbWUnKSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAvLyBQbGF0Zm9ybSB3aWxsIHBvc3QgYSBtZXNzYWdlIGJhY2tcbiAgfSk7XG59XG4iLCAiaW1wb3J0IHsgTGF1bmNoU2V0dGluZ3MgfSBmcm9tICcuLi8uLi90eXBlcyc7XG5pbXBvcnQgeyBsb2FkU3RhdGUgfSBmcm9tIFwiLi4vbGlicy9wbGF0Zm9ybV9zdG9yYWdlXCI7XG5cbmFzeW5jIGZ1bmN0aW9uIHZhbGlkYXRlTGF1bmNoKHNldHRpbmdzOiBMYXVuY2hTZXR0aW5ncyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICBpZiAoc2V0dGluZ3MubHRpU3RvcmFnZVBhcmFtcykge1xuICAgIC8vIFdlIGhhdmUgbHRpIHBvc3RNZXNzYWdlIHN0b3JhZ2VcbiAgICB0cnkge1xuICAgICAgY29uc29sZS5sb2coXCJVc2luZyBwb3N0TWVzc2FnZSBzdGF0ZSB2YWxpZGF0aW9uXCIpO1xuICAgICAgY29uc3Qgc3RhdGUgPSBhd2FpdCBsb2FkU3RhdGUoc2V0dGluZ3Muc3RhdGUsIHNldHRpbmdzLmx0aVN0b3JhZ2VQYXJhbXMpO1xuICAgICAgaWYgKHN0YXRlID09IHNldHRpbmdzLnN0YXRlKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGx0aUxhdW5jaChzZXR0aW5nczogTGF1bmNoU2V0dGluZ3MpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgaWYgKCFzZXR0aW5ncy5zdGF0ZVZlcmlmaWVkKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdmFsaWRhdGVMYXVuY2goc2V0dGluZ3MpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG4iLCBudWxsLCAiaW1wb3J0IHsgbHRpTGF1bmNoIH0gZnJvbSAnQGF0b21pY2pvbHQvbHRpLWNsaWVudCc7XG5pbXBvcnQgdHlwZSB7IExhdW5jaFNldHRpbmdzIH0gZnJvbSAnQGF0b21pY2pvbHQvbHRpLWNsaWVudC90eXBlcyc7XG5cbmNvbnN0IGxhdW5jaFNldHRpbmdzOiBMYXVuY2hTZXR0aW5ncyA9IHdpbmRvdy5MQVVOQ0hfU0VUVElOR1M7XG5sdGlMYXVuY2gobGF1bmNoU2V0dGluZ3MpLnRoZW4oKHZhbGlkKSA9PiB7XG4gIGlmICh2YWxpZCkge1xuICAgIGRvY3VtZW50LmJvZHkuaW5uZXJIVE1MID0gYFxuICAgICAgPGgxPkhlbGxvIFdvcmxkPC9oMT5cbiAgICBgO1xuXG4gICAgY29uc3Qgand0ID0gbGF1bmNoU2V0dGluZ3Muand0OyBcblxuICAgIC8vIERlZXAgTGlua2luZyBleGFtcGxlXG4gICAgaWYgKGxhdW5jaFNldHRpbmdzLmRlZXBMaW5raW5nKSB7XG4gICAgICBkb2N1bWVudC5ib2R5LmlubmVySFRNTCArPSBgXG4gICAgICAgIDxoMj5EZWVwIExpbmtpbmc8L2gyPlxuICAgICAgICA8YnV0dG9uIGlkPVwiZGVlcC1saW5raW5nLWJ1dHRvblwiPkRlZXAgTGluazwvYnV0dG9uPlxuICAgICAgICA8Zm9ybSBpZD1cImRlZXAtbGlua2luZy1mb3JtXCIgbWV0aG9kPVwicG9zdFwiPlxuICAgICAgICAgIDxpbnB1dCBpZD1cImRlZXAtbGluay1qd3RcIiB0eXBlPVwiaGlkZGVuXCIgbmFtZT1cIkpXVFwiIHZhbHVlPVwiXCIgLz5cbiAgICAgICAgICA8YnV0dG9uIGlkPVwiZGVlcC1saW5rLXN1Ym1pdFwiIHR5cGU9XCJzdWJtaXRcIiBzdHlsZT1cImRpc3BsYXk6bm9uZTtcIj5TdWJtaXQ8L2J1dHRvbj5cbiAgICAgICAgPC9mb3JtPlxuICAgICAgYDtcbiAgICAgIGNvbnN0IGRlZXBMaW5raW5nQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RlZXAtbGlua2luZy1idXR0b24nKTtcbiAgICAgIGlmIChkZWVwTGlua2luZ0J1dHRvbikge1xuICAgICAgICBkZWVwTGlua2luZ0J1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgICBjb25zdCBkZWVwTGluayA9IHtcbiAgICAgICAgICAgIHR5cGU6ICdodG1sJyxcbiAgICAgICAgICAgIGh0bWw6ICc8aDI+SnVzdCBzYXlpbmcgaGkhPC9oMj4nLFxuICAgICAgICAgICAgdGl0bGU6ICdIZWxsbyBXb3JsZCcsXG4gICAgICAgICAgICB0ZXh0OiAnQSBzaW1wbGUgaGVsbG8gd29ybGQgZXhhbXBsZScsXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGZldGNoKCcvbHRpX3NlcnZpY2VzL3NpZ25fZGVlcF9saW5rJywge1xuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShbZGVlcExpbmtdKSxcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgJ0F1dGhvcml6YXRpb24nOiBgQmVhcmVyICR7and0fWAsXG4gICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xuICAgICAgICAgICAgY29uc3QgZm9ybSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZWVwLWxpbmtpbmctZm9ybScpIGFzIEhUTUxGb3JtRWxlbWVudDtcbiAgICAgICAgICAgIGZvcm0/LnNldEF0dHJpYnV0ZSgnYWN0aW9uJywgbGF1bmNoU2V0dGluZ3M/LmRlZXBMaW5raW5nPy5kZWVwX2xpbmtfcmV0dXJuX3VybCB8fCAnJyk7XG4gICAgICAgICAgICBjb25zdCBmaWVsZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZWVwLWxpbmstand0Jyk7XG4gICAgICAgICAgICBmaWVsZD8uc2V0QXR0cmlidXRlKCd2YWx1ZScsIGRhdGEuand0KTtcbiAgICAgICAgICAgIGZvcm0/LnN1Ym1pdCgpOyAgICAgICAgICAgIFxuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3I6JywgZXJyb3IpO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEV4YW1wbGUgb2YgY2FsbGluZyB0aGUgbmFtZXMgYW5kIHJvbGVzIHNlcnZpY2VcbiAgICBmZXRjaCgnL2x0aV9zZXJ2aWNlcy9uYW1lc19hbmRfcm9sZXMnLCB7XG4gICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHtqd3R9YCxcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ1xuICAgICAgfVxuICAgIH0pXG4gICAgLnRoZW4ocmVzcG9uc2UgPT4gcmVzcG9uc2UuanNvbigpKVxuICAgIC50aGVuKGRhdGEgPT4gY29uc29sZS5sb2coZGF0YSkpXG4gICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3I6JywgZXJyb3IpO1xuICAgIH0pO1xuICAgIFxuICB9IGVsc2Uge1xuICAgIGRvY3VtZW50LmJvZHkuaW5uZXJIVE1MID0gJ0ZhaWxlZCB0byBsYXVuY2gnO1xuICB9XG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7OztBQUFBLE1BQU0sZ0JBQWdCO0FBQUEsSUFDcEIsTUFBTTtBQUFBLElBQ04sSUFBSSxNQUFNO0FBQ1IsV0FBSyxPQUFPLE9BQU8sSUFBSTtBQUFBLElBQ3pCO0FBQUEsSUFDQSxLQUFLLE1BQU07QUFDVCxXQUFLLE9BQU8sUUFBUSxJQUFJO0FBQUEsSUFDMUI7QUFBQSxJQUNBLE1BQU0sTUFBTTtBQUNWLFdBQUssT0FBTyxTQUFTLElBQUk7QUFBQSxJQUMzQjtBQUFBLElBQ0EsT0FBTyxNQUFNLE1BQU07QUFDakIsVUFBSSxXQUFXLFFBQVEsSUFBSSxFQUFHLFNBQVEsSUFBSSxFQUFFLE1B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LEdBQUcsT0FBSyxPQUFPLEtBQUssQ0FBQztBQUFBLElBQ3JCLElBQUksT0FBSyxPQUFPLEtBQUssSUFBSSxJQUFJLEtBQUssSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksS0FBSyxJQUFJLENBQUM7QUFBQSxJQUNwRSxJQUFJLE9BQUssT0FBTyxLQUFLLEtBQUssS0FBSyxLQUFLLElBQUksS0FBSyxLQUFLLEtBQUssS0FBSyxJQUFJLElBQUksS0FBSyxJQUFJLEtBQUssSUFBSSxDQUFDO0FBQUEsSUFDdkYsSUFBSSxPQUFLLE9BQU8sSUFBSSxNQUFNLEtBQUssSUFBSSxPQUFPLEVBQUU7QUFBQSxJQUM1QyxJQUFJLE9BQUssT0FBTyxNQUFNLENBQUM7QUFBQSxJQUN2QixJQUFJLE9BQUssT0FBTyxLQUFLLElBQUksSUFBSSxLQUFLLElBQUksSUFBSSxLQUFLLElBQUksSUFBSSxDQUFDO0FBQUEsSUFDeEQsSUFBSSxPQUFLLE9BQU8sSUFBSSxNQUFNLEtBQUssSUFBSSxPQUFPLEtBQUssSUFBSSxJQUFJLE1BQU0sTUFBTSxJQUFJLE1BQU0sTUFBTSxJQUFJLE9BQU8sTUFBTSxJQUFJLENBQUM7QUFBQSxJQUN6RyxJQUFJLE9BQUssT0FBTyxJQUFJLE1BQU0sS0FBSyxJQUFJLE9BQU8sS0FBSyxJQUFJLE1BQU0sSUFBSSxJQUFJLENBQUM7QUFBQSxJQUNsRSxJQUFJLE9BQUssT0FBTyxLQUFLLEtBQUssSUFBSSxNQUFNLEtBQUssSUFBSSxPQUFPLEtBQUssSUFBSSxDQUFDO0FBQUEsSUFDOUQsSUFBSSxPQUFLLE9BQU8sS0FBSyxJQUFJLElBQUksS0FBSyxJQUFJLElBQUksQ0FBQztBQUFBLElBQzNDLElBQUksT0FBSyxPQUFPLEtBQUssSUFBSSxJQUFJLEtBQUssS0FBSyxJQUFJLE1BQU0sS0FBSyxJQUFJLE1BQU0sS0FBSyxJQUFJLElBQUksTUFBTSxNQUFNLElBQUksTUFBTSxLQUFLLElBQUksQ0FBQztBQUFBLElBQzdHLElBQUksT0FBSyxPQUFPLEtBQUssSUFBSSxJQUFJLEtBQUssS0FB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QixTQUFTLE1BQU07QUFDaEQsa0JBQU0sV0FBVztBQUFBLGNBQ2YsTUFBTTtBQUFBLGNBQ04sTUFBTTtBQUFBLGNBQ04sT0FBTztBQUFBLGNBQ1AsTUFBTTtBQUFBLFlBQ1I7QUFFQSxrQkFBTSxnQ0FBZ0M7QUFBQSxjQUNwQyxRQUFRO0FBQUEsY0FDUixNQUFNLEtBQUssVUFBVSxDQUFDLFFBQVEsQ0FBQztBQUFBLGNBQy9CLFNBQVM7QUFBQSxnQkFDUCxpQkFBaUIsVUFBVSxHQUFHO0FBQUEsZ0JBQzlCLGdCQUFnQjtBQUFBLGNBQ2xCO0FBQUEsWUFDRixDQUFDLEVBQ0EsS0FBSyxjQUFZO0FBQ2hCLHNCQUFRLElBQUksUUFBUTtBQUNwQixxQkFBTyxTQUFTLEtBQUs7QUFBQSxZQUN2QixDQUFDLEVBQ0EsS0FBSyxVQUFRO0FBQ1osc0JBQVEsSUFBSSxJQUFJO0FBQ2hCLG9CQUFNLE9BQU8sU0FBUyxlQUFlLG1CQUFtQjtBQUN4RCxvQkFBTSxhQUFhLFVBQVUsZ0JBQWdCLGFBQWEsd0JBQXdCLEVBQUU7QUFDcEYsb0JBQU0sUUFBUSxTQUFTLGVBQWUsZUFBZTtBQUNyRCxxQkFBTyxhQUFhLFNBQVMsS0FBSyxHQUFHO0FBQ3JDLG9CQUFNLE9BQU87QUFBQSxZQUNmLENBQUMsRUFDQSxNQUFNLENBQUMsVUFBVTtBQUNoQixzQkFBUSxNQUFNLFVBQVUsS0FBSztBQUFBLFlBQy9CLENBQUM7QUFBQSxVQUVILENBQUM7QUFBQSxRQUNIO0FBQUEsTUFDRjtBQUdBLFlBQU0saUNBQWlDO0FBQUEsUUFDckMsUUFBUTtBQUFBLFFBQ1IsU0FBUztBQUFBLFVBQ1AsaUJBQWlCLFVBQVUsR0FBRztBQUFBLFVBQzlCLGdCQUFnQjtBQUFBLFFBQ2xCO0FBQUEsTUFDRixDQUFDLEVBQ0EsS0FBSyxjQUFZLFNBQVMsS0FBSyxDQUFDLEVBQ2hDLEtBQUssVUFBUSxRQUFRLElBQUksSUFBSSxDQUFDLEVBQzlCLE1BQU0sQ0FBQyxVQUFVO0FBQ2hCLGdCQUFRLE1BQU0sVUFBVSxLQUFLO0FBQUEsTUFDL0IsQ0FBQztBQUFBLElBRUgsT0FBTztBQUNMLGVBQVMsS0FBSyxZQUFZO0FBQUEsSUFDNUI7QUFBQSxFQUNGLENBQUM7IiwKICAibmFtZXMiOiBbInQiLCAicGF0aCIsICJjb3B5IiwgImxvYWRTdGF0ZSIsICJvIiwgInQiLCAidCIsICJ0IiwgInNlcmlhbGl6ZUNvb2tpZSIsICJsb29rdXAiLCAibG9jYWxTdG9yYWdlQXZhaWxhYmxlIiwgImNhY2hlVXNlckxhbmd1YWdlIiwgInNlc3Npb25TdG9yYWdlQXZhaWxhYmxlIiwgImh0bWxUYWciLCAiQnJvd3NlciIsICJpbml0IiwgIkx0aVZlcnNpb25zIiwgIkRvY3VtZW50VGFyZ2V0cyIsICJBY2NlcHRUeXBlcyIsICJNZXNzYWdlVHlwZXMiLCAiUm9sZXMiLCAiQUdTU2NvcGVzIiwgIk1lbWJlclN0YXR1cyJdCn0K
