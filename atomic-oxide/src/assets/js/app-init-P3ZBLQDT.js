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
  var MAIN_CONTENT_ID = "main-content";

  // node_modules/@atomicjolt/lti-client/dist/libs/cookies.js
  function hasCookie(settings) {
    if (document.cookie) {
      return document.cookie.match(`(^|;)\\s*${settings.openIdCookiePrefix}` + settings.state);
    }
    return false;
  }
  function setCookie(settings) {
    document.cookie = settings.openIdCookiePrefix + settings.state + "=1; path=/; max-age=60; SameSite=None;";
  }

  // node_modules/@atomicjolt/lti-client/dist/html/privacy.js
  function privacyHtml(settings) {
    return instance.t(settings.privacyPolicyMessage || `We use cookies for login and security.`) + " " + instance.t(`Learn more in our <a href='{{url}}' target='_blank'>privacy policy</a>.`);
  }

  // node_modules/@atomicjolt/lti-client/dist/html/launch_new_window.js
  function launchNewWindow(settings) {
    window.open(settings.relaunchInitUrl);
    showLaunchNewWindow(settings, { disableLaunch: true, showRequestStorageAccess: false, showStorageAccessDenied: false });
  }
  function showLaunchNewWindow(settings, options) {
    const { disableLaunch, showRequestStorageAccess, showStorageAccessDenied } = options;
    const container = document.getElementById(MAIN_CONTENT_ID);
    if (!container) {
      throw instance.t("Could not find main-content element");
    }
    container.innerHTML = `
    <div class="aj-centered-message">
      <h1 class="aj-title">
        <i class="material-icons-outlined aj-icon" aria-hidden="true">cookie_off</i>
        ${instance.t("Cookies Required")}
      </h1>
      <p class="aj-text">
        ${privacyHtml(settings)} </p>
      <p class="aj-text">
        ${instance.t("Please click the button below to reload in a new window.")}
      </p>
      <button id="button_launch_new_window" class="aj-btn aj-btn--blue" ${disableLaunch ? 'disabled=""' : ""} >
        ${instance.t("Open in a new window")}
      </button>
      </a>
      ${showRequestStorageAccess ? `
        <div id="request_storage_access">
          <p class="aj-text">
            ${instance.t("If you have used this application before, your browser may allow you to <a id='request_storage_access_link' href='#'>enable cookies</a> and prevent this message in the future.")}
          </p>
        </div>
      ` : ""}
      ${showStorageAccessDenied ? `
      <div id="request_storage_access_error" class="u-flex">
        <i class="material-icons-outlined aj-icon" aria-hidden="true">warning</i>
        <p class="aj-text">
        ${instance.t("The browser prevented access.  Try launching in a new window first and then clicking this option again next time. If that doesn't work check your privacy settings. Some browsers will prevent all third party cookies.")}
        </p>
      </div>
      ` : ""}
    </div>
  `;
    document.getElementById("button_launch_new_window").onclick = () => launchNewWindow(settings);
    if (showRequestStorageAccess) {
      document.getElementById("request_storage_access_link").onclick = () => tryRequestStorageAccess(settings);
    }
  }

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
  async function storeState(state, storageParams) {
    return new Promise((resolve, reject) => {
      let platformOrigin = new URL(storageParams.platformOIDCUrl).origin;
      if (storageParams.originSupportBroken) {
        platformOrigin = "*";
      }
      let timeout = setTimeout(() => {
        console.error("postMessage timeout");
        reject(new Error(instance.t("Timeout while waiting for platform response")));
      }, 2e3);
      let receiveMessage = (event) => {
        if (typeof event.data === "object" && event.data.subject === "lti.put_data.response" && event.data.message_id === state && (event.origin === platformOrigin || storageParams.originSupportBroken && platformOrigin === "*")) {
          removeEventListener("message", receiveMessage);
          clearTimeout(timeout);
          if (event.data.error) {
            console.error(event.data.error.code);
            console.error(event.data.error.message);
            reject(new Error(event.data.errormessage));
          }
          resolve();
        }
      };
      window.addEventListener("message", receiveMessage);
      getTargetFrame(storageParams).then((targetFrame) => targetFrame?.postMessage({
        "subject": "lti.put_data",
        "message_id": state,
        "key": `${STATE_KEY_PREFIX}${state}`,
        "value": state
      }, platformOrigin)).catch((e) => {
        console.log(instance.t("Could not find target frame"));
        console.log(e);
        reject(new Error(instance.t("Could not find target frame")));
      });
    });
  }
  function hasStorageAccessAPI() {
    return typeof document.hasStorageAccess === "function" && typeof document.requestStorageAccess === "function";
  }
  function tryRequestStorageAccess(settings) {
    document.requestStorageAccess().then(() => {
      setCookie(settings);
      window.location.replace(settings.responseUrl);
    }).catch((e) => {
      console.log(e);
      showLaunchNewWindow(settings, { showStorageAccessDenied: true, disableLaunch: true, showRequestStorageAccess: false });
    });
  }

  // node_modules/@atomicjolt/lti-client/dist/html/cookie_error.js
  function showCookieError(settings) {
    const container = document.getElementById(MAIN_CONTENT_ID);
    if (!container) {
      throw instance.t("Could not find main-content element");
    }
    container.innerHTML = `
    <div id="cookie_error" class="aj-centered-message">
      <h1 class="aj-title">
        <i class="material-icons-outlined aj-icon" aria-hidden="true">cookie_off</i>
        ${instance.t("Cookies Required")}
      </h1>
      <p class="aj-text">
        ${privacyHtml(settings)}
      </p>
      <p class="aj-text">
        ${instance.t("Please check your browser settings and enable cookies.")}
      </p>
    </div>
  `;
  }

  // node_modules/@atomicjolt/lti-client/dist/libs/lti_storage_launch.js
  async function ltiStorageLaunch(settings) {
    let submitToPlatform = () => {
      window.location.replace(settings.responseUrl);
    };
    if (hasCookie(settings)) {
      return submitToPlatform();
    }
    if (settings.ltiStorageParams) {
      try {
        await storeState(settings.state, settings.ltiStorageParams);
        return submitToPlatform();
      } catch (e) {
        console.error(e);
      }
    }
    if (window.self !== window.top) {
      let showRequestStorageAccess = false;
      if (hasStorageAccessAPI()) {
        try {
          let hasAccess = await document.hasStorageAccess();
          if (!hasAccess) {
            showRequestStorageAccess = true;
          }
        } catch (e) {
          console.log(e);
        }
      }
      showLaunchNewWindow(settings, { showRequestStorageAccess, disableLaunch: false, showStorageAccessDenied: false });
    } else {
      showCookieError(settings);
    }
  }

  // node_modules/@atomicjolt/lti-client/dist/locale/es.json
  var es_default = {
    "Cookies Required": "Galletas requeridas",
    "There was an error launching the LTI tool. Please reload and try again.": "Hubo un error al iniciar la herramienta LTI. Vuelva a cargar y vuelva a intentarlo.",
    "Please click the button below to reload in a new window.": "Haga clic en el bot\xF3n de abajo para recargar en una nueva ventana.",
    "Open in a new window": "Abrir en una nueva ventana",
    "If you have used this application before, your browser may allow you to <a id='request_storage_access_link' href='#'>enable cookies</a> and prevent this message in the future.": "Si ha utilizado esta aplicaci\xF3n anteriormente, su navegador puede permitirle <a id='request_storage_access_link' href='#'>habilitar cookies</a> y evitar este mensaje en el futuro.",
    "The browser prevented access.  Try launching in a new window first and then clicking this option again next time. If that doesn't work check your privacy settings. Some browsers will prevent all third party cookies.": "El navegador impidi\xF3 el acceso. Intente iniciar primero en una nueva ventana y luego vuelva a hacer clic en esta opci\xF3n la pr\xF3xima vez. Si eso no funciona, verifique su configuraci\xF3n de privacidad. Algunos navegadores evitar\xE1n todas las cookies de terceros.",
    "We use cookies for login and security.": "Usamos cookies para inicio de sesi\xF3n y seguridad.",
    "Learn more in our <a href='{{url}}' target='_blank'>privacy policy</a>.": "Obt\xE9n m\xE1s informaci\xF3n en nuestra <a href='{{url}}' target='_blank'>pol\xEDtica de privacidad</a>.",
    "Please check your browser settings and enable cookies.": "Verifique la configuraci\xF3n de su navegador y habilite las cookies."
  };

  // node_modules/@atomicjolt/lti-client/dist/locale/fr.json
  var fr_default = {
    "Cookies Required": "Cookies n\xE9cessaires",
    "There was an error launching the LTI tool. Please reload and try again.": "Une erreur s'est produite lors du lancement de l'outil LTI. Veuillez recharger et r\xE9essayer.",
    "Please click the button below to reload in a new window.": "Veuillez cliquer sur le bouton ci-dessous pour recharger dans une nouvelle fen\xEAtre.",
    "Open in a new window": "Ouvrir dans une nouvelle fen\xEAtre",
    "If you have used this application before, your browser may allow you to <a id='request_storage_access_link' href='#'>enable cookies</a> and prevent this message in the future.": "Si vous avez d\xE9j\xE0 utilis\xE9 cette application, votre navigateur peut vous permettre d'<a id='request_storage_access_link' href='#'>activer les cookies</a> et emp\xEAcher ce message \xE0 l'avenir.",
    "The browser prevented access.  Try launching in a new window first and then clicking this option again next time. If that doesn't work check your privacy settings. Some browsers will prevent all third party cookies.": "Le navigateur a emp\xEAch\xE9 l'acc\xE8s. Essayez d'abord de lancer dans une nouvelle fen\xEAtre, puis cliquez \xE0 nouveau sur cette option la prochaine fois. Si cela ne fonctionne pas, v\xE9rifiez vos param\xE8tres de confidentialit\xE9. Certains navigateurs emp\xEAcheront tous les cookies tiers.",
    "We use cookies for login and security.": "Nous utilisons des cookies pour la connexion et la s\xE9curit\xE9.",
    "Learn more in our <a href='{{url}}' target='_blank'>privacy policy</a>.": "En savoir plus dans notre <a href='{{url}}' target='_blank'>politique de confidentialit\xE9</a>.",
    "Please check your browser settings and enable cookies.": "Veuillez v\xE9rifier les param\xE8tres de votre navigateur et activer les cookies."
  };

  // node_modules/@atomicjolt/lti-client/dist/client/init.js
  function showError() {
    const container = document.getElementById(MAIN_CONTENT_ID);
    if (!container) {
      throw "Could not find main-content element";
    }
    container.innerHTML += `
    <div class="u-flex aj-centered-message">
      <i class="material-icons-outlined aj-icon" aria-hidden="true">warning</i>
      <p class="aj-text translate">
        ${instance.t("There was an error launching the LTI tool. Please reload and try again.")}
      </p>
    </div>
  `;
  }
  function initOIDCLaunch(settings) {
    let isLaunched = false;
    instance.use(Browser).init({
      detection: { order: ["querystring", "navigator"] },
      fallbackLng: "en",
      keySeparator: false
    });
    instance.addResourceBundle("es", "translation", es_default);
    instance.addResourceBundle("fr", "translation", fr_default);
    instance.changeLanguage();
    window.addEventListener("load", () => {
      ltiStorageLaunch(settings);
      isLaunched = true;
    });
    setTimeout(() => {
      if (!isLaunched) {
        showError();
      }
    }, 5e3);
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

  // client/app-init.ts
  var initSettings = window.INIT_SETTINGS;
  initOIDCLaunch(initSettings);
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2kxOG5leHQvZGlzdC9lc20vaTE4bmV4dC5qcyIsICIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQGJhYmVsL3J1bnRpbWUvaGVscGVycy9lc20vY2xhc3NDYWxsQ2hlY2suanMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvZXNtL3R5cGVvZi5qcyIsICIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQGJhYmVsL3J1bnRpbWUvaGVscGVycy9lc20vdG9QcmltaXRpdmUuanMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvZXNtL3RvUHJvcGVydHlLZXkuanMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvZXNtL2NyZWF0ZUNsYXNzLmpzIiwgIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9pMThuZXh0LWJyb3dzZXItbGFuZ3VhZ2VkZXRlY3Rvci9kaXN0L2VzbS9pMThuZXh0QnJvd3Nlckxhbmd1YWdlRGV0ZWN0b3IuanMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BhdG9taWNqb2x0L2x0aS1jbGllbnQvc3JjL2xpYnMvY29uc3RhbnRzLnRzIiwgIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9AYXRvbWljam9sdC9sdGktY2xpZW50L3NyYy9saWJzL2Nvb2tpZXMudHMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BhdG9taWNqb2x0L2x0aS1jbGllbnQvc3JjL2h0bWwvcHJpdmFjeS50cyIsICIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQGF0b21pY2pvbHQvbHRpLWNsaWVudC9zcmMvaHRtbC9sYXVuY2hfbmV3X3dpbmRvdy50cyIsICIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQGF0b21pY2pvbHQvbHRpLWNsaWVudC9zcmMvbGlicy9jYXBhYmlsaXRpZXMudHMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BhdG9taWNqb2x0L2x0aS1jbGllbnQvc3JjL2xpYnMvcGxhdGZvcm1fc3RvcmFnZS50cyIsICIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQGF0b21pY2pvbHQvbHRpLWNsaWVudC9zcmMvaHRtbC9jb29raWVfZXJyb3IudHMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BhdG9taWNqb2x0L2x0aS1jbGllbnQvc3JjL2xpYnMvbHRpX3N0b3JhZ2VfbGF1bmNoLnRzIiwgIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9AYXRvbWljam9sdC9sdGktY2xpZW50L2Rpc3QvbG9jYWxlL2VzLmpzb24iLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BhdG9taWNqb2x0L2x0aS1jbGllbnQvZGlzdC9sb2NhbGUvZnIuanNvbiIsICIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQGF0b21pY2pvbHQvbHRpLWNsaWVudC9zcmMvY2xpZW50L2luaXQudHMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BhdG9taWNqb2x0L2x0aS10eXBlcy9zcmMvaW5kZXgudHMiLCAiLi4vLi4vLi4vY2xpZW50L2FwcC1pbml0LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBjb25zb2xlTG9nZ2VyID0ge1xuICB0eXBlOiAnbG9nZ2VyJyxcbiAgbG9nKGFyZ3MpIHtcbiAgICB0aGlzLm91dHB1dCgnbG9nJywgYXJncyk7XG4gIH0sXG4gIHdhcm4oYXJncykge1xuICAgIHRoaXMub3V0cHV0KCd3YXJuJywgYXJncyk7XG4gIH0sXG4gIGVycm9yKGFyZ3MpIHtcbiAgICB0aGlzLm91dHB1dCgnZXJyb3InLCBhcmdzKTtcbiAgfSxcbiAgb3V0cHV0KHR5cGUsIGFyZ3MpIHtcbiAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlW3R5cGVdKSBjb25zb2xlW3R5cGVdLmFwcGx5KGNvbnNvbGUsIGFyZ3MpO1xuICB9XG59O1xuY2xhc3MgTG9nZ2VyIHtcbiAgY29uc3RydWN0b3IoY29uY3JldGVMb2dnZXIpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge307XG4gICAgdGhpcy5pbml0KGNvbmNyZXRlTG9nZ2VyLCBvcHRpb25zKTtcbiAgfVxuICBpbml0KGNvbmNyZXRlTG9nZ2VyKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IHt9O1xuICAgIHRoaXMucHJlZml4ID0gb3B0aW9ucy5wcmVmaXggfHwgJ2kxOG5leHQ6JztcbiAgICB0aGlzLmxvZ2dlciA9IGNvbmNyZXRlTG9nZ2VyIHx8IGNvbnNvbGVMb2dnZXI7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLmRlYnVnID0gb3B0aW9ucy5kZWJ1ZztcbiAgfVxuICBsb2coKSB7XG4gICAgZm9yICh2YXIgX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBuZXcgQXJyYXkoX2xlbiksIF9rZXkgPSAwOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG4gICAgICBhcmdzW19rZXldID0gYXJndW1lbnRzW19rZXldO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5mb3J3YXJkKGFyZ3MsICdsb2cnLCAnJywgdHJ1ZSk7XG4gIH1cbiAgd2FybigpIHtcbiAgICBmb3IgKHZhciBfbGVuMiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBuZXcgQXJyYXkoX2xlbjIpLCBfa2V5MiA9IDA7IF9rZXkyIDwgX2xlbjI7IF9rZXkyKyspIHtcbiAgICAgIGFyZ3NbX2tleTJdID0gYXJndW1lbnRzW19rZXkyXTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZm9yd2FyZChhcmdzLCAnd2FybicsICcnLCB0cnVlKTtcbiAgfVxuICBlcnJvcigpIHtcbiAgICBmb3IgKHZhciBfbGVuMyA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBuZXcgQXJyYXkoX2xlbjMpLCBfa2V5MyA9IDA7IF9rZXkzIDwgX2xlbjM7IF9rZXkzKyspIHtcbiAgICAgIGFyZ3NbX2tleTNdID0gYXJndW1lbnRzW19rZXkzXTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZm9yd2FyZChhcmdzLCAnZXJyb3InLCAnJyk7XG4gIH1cbiAgZGVwcmVjYXRlKCkge1xuICAgIGZvciAodmFyIF9sZW40ID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IG5ldyBBcnJheShfbGVuNCksIF9rZXk0ID0gMDsgX2tleTQgPCBfbGVuNDsgX2tleTQrKykge1xuICAgICAgYXJnc1tfa2V5NF0gPSBhcmd1bWVudHNbX2tleTRdO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5mb3J3YXJkKGFyZ3MsICd3YXJuJywgJ1dBUk5JTkcgREVQUkVDQVRFRDogJywgdHJ1ZSk7XG4gIH1cbiAgZm9yd2FyZChhcmdzLCBsdmwsIHByZWZpeCwgZGVidWdPbmx5KSB7XG4gICAgaWYgKGRlYnVnT25seSAmJiAhdGhpcy5kZWJ1ZykgcmV0dXJuIG51bGw7XG4gICAgaWYgKHR5cGVvZiBhcmdzWzBdID09PSAnc3RyaW5nJykgYXJnc1swXSA9IGAke3ByZWZpeH0ke3RoaXMucHJlZml4fSAke2FyZ3NbMF19YDtcbiAgICByZXR1cm4gdGhpcy5sb2dnZXJbbHZsXShhcmdzKTtcbiAgfVxuICBjcmVhdGUobW9kdWxlTmFtZSkge1xuICAgIHJldHVybiBuZXcgTG9nZ2VyKHRoaXMubG9nZ2VyLCB7XG4gICAgICAuLi57XG4gICAgICAgIHByZWZpeDogYCR7dGhpcy5wcmVmaXh9OiR7bW9kdWxlTmFtZX06YFxuICAgICAgfSxcbiAgICAgIC4uLnRoaXMub3B0aW9uc1xuICAgIH0pO1xuICB9XG4gIGNsb25lKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB0aGlzLm9wdGlvbnM7XG4gICAgb3B0aW9ucy5wcmVmaXggPSBvcHRpb25zLnByZWZpeCB8fCB0aGlzLnByZWZpeDtcbiAgICByZXR1cm4gbmV3IExvZ2dlcih0aGlzLmxvZ2dlciwgb3B0aW9ucyk7XG4gIH1cbn1cbnZhciBiYXNlTG9nZ2VyID0gbmV3IExvZ2dlcigpO1xuXG5jbGFzcyBFdmVudEVtaXR0ZXIge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLm9ic2VydmVycyA9IHt9O1xuICB9XG4gIG9uKGV2ZW50cywgbGlzdGVuZXIpIHtcbiAgICBldmVudHMuc3BsaXQoJyAnKS5mb3JFYWNoKGV2ZW50ID0+IHtcbiAgICAgIGlmICghdGhpcy5vYnNlcnZlcnNbZXZlbnRdKSB0aGlzLm9ic2VydmVyc1tldmVudF0gPSBuZXcgTWFwKCk7XG4gICAgICBjb25zdCBudW1MaXN0ZW5lcnMgPSB0aGlzLm9ic2VydmVyc1tldmVudF0uZ2V0KGxpc3RlbmVyKSB8fCAwO1xuICAgICAgdGhpcy5vYnNlcnZlcnNbZXZlbnRdLnNldChsaXN0ZW5lciwgbnVtTGlzdGVuZXJzICsgMSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgb2ZmKGV2ZW50LCBsaXN0ZW5lcikge1xuICAgIGlmICghdGhpcy5vYnNlcnZlcnNbZXZlbnRdKSByZXR1cm47XG4gICAgaWYgKCFsaXN0ZW5lcikge1xuICAgICAgZGVsZXRlIHRoaXMub2JzZXJ2ZXJzW2V2ZW50XTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5vYnNlcnZlcnNbZXZlbnRdLmRlbGV0ZShsaXN0ZW5lcik7XG4gIH1cbiAgZW1pdChldmVudCkge1xuICAgIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gbmV3IEFycmF5KF9sZW4gPiAxID8gX2xlbiAtIDEgOiAwKSwgX2tleSA9IDE7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcbiAgICAgIGFyZ3NbX2tleSAtIDFdID0gYXJndW1lbnRzW19rZXldO1xuICAgIH1cbiAgICBpZiAodGhpcy5vYnNlcnZlcnNbZXZlbnRdKSB7XG4gICAgICBjb25zdCBjbG9uZWQgPSBBcnJheS5mcm9tKHRoaXMub2JzZXJ2ZXJzW2V2ZW50XS5lbnRyaWVzKCkpO1xuICAgICAgY2xvbmVkLmZvckVhY2goX3JlZiA9PiB7XG4gICAgICAgIGxldCBbb2JzZXJ2ZXIsIG51bVRpbWVzQWRkZWRdID0gX3JlZjtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1UaW1lc0FkZGVkOyBpKyspIHtcbiAgICAgICAgICBvYnNlcnZlciguLi5hcmdzKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIGlmICh0aGlzLm9ic2VydmVyc1snKiddKSB7XG4gICAgICBjb25zdCBjbG9uZWQgPSBBcnJheS5mcm9tKHRoaXMub2JzZXJ2ZXJzWycqJ10uZW50cmllcygpKTtcbiAgICAgIGNsb25lZC5mb3JFYWNoKF9yZWYyID0+IHtcbiAgICAgICAgbGV0IFtvYnNlcnZlciwgbnVtVGltZXNBZGRlZF0gPSBfcmVmMjtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1UaW1lc0FkZGVkOyBpKyspIHtcbiAgICAgICAgICBvYnNlcnZlci5hcHBseShvYnNlcnZlciwgW2V2ZW50LCAuLi5hcmdzXSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufVxuXG5jb25zdCBkZWZlciA9ICgpID0+IHtcbiAgbGV0IHJlcztcbiAgbGV0IHJlajtcbiAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICByZXMgPSByZXNvbHZlO1xuICAgIHJlaiA9IHJlamVjdDtcbiAgfSk7XG4gIHByb21pc2UucmVzb2x2ZSA9IHJlcztcbiAgcHJvbWlzZS5yZWplY3QgPSByZWo7XG4gIHJldHVybiBwcm9taXNlO1xufTtcbmNvbnN0IG1ha2VTdHJpbmcgPSBvYmplY3QgPT4ge1xuICBpZiAob2JqZWN0ID09IG51bGwpIHJldHVybiAnJztcbiAgcmV0dXJuICcnICsgb2JqZWN0O1xufTtcbmNvbnN0IGNvcHkgPSAoYSwgcywgdCkgPT4ge1xuICBhLmZvckVhY2gobSA9PiB7XG4gICAgaWYgKHNbbV0pIHRbbV0gPSBzW21dO1xuICB9KTtcbn07XG5jb25zdCBsYXN0T2ZQYXRoU2VwYXJhdG9yUmVnRXhwID0gLyMjIy9nO1xuY29uc3QgY2xlYW5LZXkgPSBrZXkgPT4ga2V5ICYmIGtleS5pbmRleE9mKCcjIyMnKSA+IC0xID8ga2V5LnJlcGxhY2UobGFzdE9mUGF0aFNlcGFyYXRvclJlZ0V4cCwgJy4nKSA6IGtleTtcbmNvbnN0IGNhbk5vdFRyYXZlcnNlRGVlcGVyID0gb2JqZWN0ID0+ICFvYmplY3QgfHwgdHlwZW9mIG9iamVjdCA9PT0gJ3N0cmluZyc7XG5jb25zdCBnZXRMYXN0T2ZQYXRoID0gKG9iamVjdCwgcGF0aCwgRW1wdHkpID0+IHtcbiAgY29uc3Qgc3RhY2sgPSB0eXBlb2YgcGF0aCAhPT0gJ3N0cmluZycgPyBwYXRoIDogcGF0aC5zcGxpdCgnLicpO1xuICBsZXQgc3RhY2tJbmRleCA9IDA7XG4gIHdoaWxlIChzdGFja0luZGV4IDwgc3RhY2subGVuZ3RoIC0gMSkge1xuICAgIGlmIChjYW5Ob3RUcmF2ZXJzZURlZXBlcihvYmplY3QpKSByZXR1cm4ge307XG4gICAgY29uc3Qga2V5ID0gY2xlYW5LZXkoc3RhY2tbc3RhY2tJbmRleF0pO1xuICAgIGlmICghb2JqZWN0W2tleV0gJiYgRW1wdHkpIG9iamVjdFtrZXldID0gbmV3IEVtcHR5KCk7XG4gICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIGtleSkpIHtcbiAgICAgIG9iamVjdCA9IG9iamVjdFtrZXldO1xuICAgIH0gZWxzZSB7XG4gICAgICBvYmplY3QgPSB7fTtcbiAgICB9XG4gICAgKytzdGFja0luZGV4O1xuICB9XG4gIGlmIChjYW5Ob3RUcmF2ZXJzZURlZXBlcihvYmplY3QpKSByZXR1cm4ge307XG4gIHJldHVybiB7XG4gICAgb2JqOiBvYmplY3QsXG4gICAgazogY2xlYW5LZXkoc3RhY2tbc3RhY2tJbmRleF0pXG4gIH07XG59O1xuY29uc3Qgc2V0UGF0aCA9IChvYmplY3QsIHBhdGgsIG5ld1ZhbHVlKSA9PiB7XG4gIGNvbnN0IHtcbiAgICBvYmosXG4gICAga1xuICB9ID0gZ2V0TGFzdE9mUGF0aChvYmplY3QsIHBhdGgsIE9iamVjdCk7XG4gIGlmIChvYmogIT09IHVuZGVmaW5lZCB8fCBwYXRoLmxlbmd0aCA9PT0gMSkge1xuICAgIG9ialtrXSA9IG5ld1ZhbHVlO1xuICAgIHJldHVybjtcbiAgfVxuICBsZXQgZSA9IHBhdGhbcGF0aC5sZW5ndGggLSAxXTtcbiAgbGV0IHAgPSBwYXRoLnNsaWNlKDAsIHBhdGgubGVuZ3RoIC0gMSk7XG4gIGxldCBsYXN0ID0gZ2V0TGFzdE9mUGF0aChvYmplY3QsIHAsIE9iamVjdCk7XG4gIHdoaWxlIChsYXN0Lm9iaiA9PT0gdW5kZWZpbmVkICYmIHAubGVuZ3RoKSB7XG4gICAgZSA9IGAke3BbcC5sZW5ndGggLSAxXX0uJHtlfWA7XG4gICAgcCA9IHAuc2xpY2UoMCwgcC5sZW5ndGggLSAxKTtcbiAgICBsYXN0ID0gZ2V0TGFzdE9mUGF0aChvYmplY3QsIHAsIE9iamVjdCk7XG4gICAgaWYgKGxhc3QgJiYgbGFzdC5vYmogJiYgdHlwZW9mIGxhc3Qub2JqW2Ake2xhc3Qua30uJHtlfWBdICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgbGFzdC5vYmogPSB1bmRlZmluZWQ7XG4gICAgfVxuICB9XG4gIGxhc3Qub2JqW2Ake2xhc3Qua30uJHtlfWBdID0gbmV3VmFsdWU7XG59O1xuY29uc3QgcHVzaFBhdGggPSAob2JqZWN0LCBwYXRoLCBuZXdWYWx1ZSwgY29uY2F0KSA9PiB7XG4gIGNvbnN0IHtcbiAgICBvYmosXG4gICAga1xuICB9ID0gZ2V0TGFzdE9mUGF0aChvYmplY3QsIHBhdGgsIE9iamVjdCk7XG4gIG9ialtrXSA9IG9ialtrXSB8fCBbXTtcbiAgb2JqW2tdLnB1c2gobmV3VmFsdWUpO1xufTtcbmNvbnN0IGdldFBhdGggPSAob2JqZWN0LCBwYXRoKSA9PiB7XG4gIGNvbnN0IHtcbiAgICBvYmosXG4gICAga1xuICB9ID0gZ2V0TGFzdE9mUGF0aChvYmplY3QsIHBhdGgpO1xuICBpZiAoIW9iaikgcmV0dXJuIHVuZGVmaW5lZDtcbiAgcmV0dXJuIG9ialtrXTtcbn07XG5jb25zdCBnZXRQYXRoV2l0aERlZmF1bHRzID0gKGRhdGEsIGRlZmF1bHREYXRhLCBrZXkpID0+IHtcbiAgY29uc3QgdmFsdWUgPSBnZXRQYXRoKGRhdGEsIGtleSk7XG4gIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG4gIHJldHVybiBnZXRQYXRoKGRlZmF1bHREYXRhLCBrZXkpO1xufTtcbmNvbnN0IGRlZXBFeHRlbmQgPSAodGFyZ2V0LCBzb3VyY2UsIG92ZXJ3cml0ZSkgPT4ge1xuICBmb3IgKGNvbnN0IHByb3AgaW4gc291cmNlKSB7XG4gICAgaWYgKHByb3AgIT09ICdfX3Byb3RvX18nICYmIHByb3AgIT09ICdjb25zdHJ1Y3RvcicpIHtcbiAgICAgIGlmIChwcm9wIGluIHRhcmdldCkge1xuICAgICAgICBpZiAodHlwZW9mIHRhcmdldFtwcm9wXSA9PT0gJ3N0cmluZycgfHwgdGFyZ2V0W3Byb3BdIGluc3RhbmNlb2YgU3RyaW5nIHx8IHR5cGVvZiBzb3VyY2VbcHJvcF0gPT09ICdzdHJpbmcnIHx8IHNvdXJjZVtwcm9wXSBpbnN0YW5jZW9mIFN0cmluZykge1xuICAgICAgICAgIGlmIChvdmVyd3JpdGUpIHRhcmdldFtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkZWVwRXh0ZW5kKHRhcmdldFtwcm9wXSwgc291cmNlW3Byb3BdLCBvdmVyd3JpdGUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0YXJnZXRbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiB0YXJnZXQ7XG59O1xuY29uc3QgcmVnZXhFc2NhcGUgPSBzdHIgPT4gc3RyLnJlcGxhY2UoL1tcXC1cXFtcXF1cXC9cXHtcXH1cXChcXClcXCpcXCtcXD9cXC5cXFxcXFxeXFwkXFx8XS9nLCAnXFxcXCQmJyk7XG52YXIgX2VudGl0eU1hcCA9IHtcbiAgJyYnOiAnJmFtcDsnLFxuICAnPCc6ICcmbHQ7JyxcbiAgJz4nOiAnJmd0OycsXG4gICdcIic6ICcmcXVvdDsnLFxuICBcIidcIjogJyYjMzk7JyxcbiAgJy8nOiAnJiN4MkY7J1xufTtcbmNvbnN0IGVzY2FwZSA9IGRhdGEgPT4ge1xuICBpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIGRhdGEucmVwbGFjZSgvWyY8PlwiJ1xcL10vZywgcyA9PiBfZW50aXR5TWFwW3NdKTtcbiAgfVxuICByZXR1cm4gZGF0YTtcbn07XG5jbGFzcyBSZWdFeHBDYWNoZSB7XG4gIGNvbnN0cnVjdG9yKGNhcGFjaXR5KSB7XG4gICAgdGhpcy5jYXBhY2l0eSA9IGNhcGFjaXR5O1xuICAgIHRoaXMucmVnRXhwTWFwID0gbmV3IE1hcCgpO1xuICAgIHRoaXMucmVnRXhwUXVldWUgPSBbXTtcbiAgfVxuICBnZXRSZWdFeHAocGF0dGVybikge1xuICAgIGNvbnN0IHJlZ0V4cEZyb21DYWNoZSA9IHRoaXMucmVnRXhwTWFwLmdldChwYXR0ZXJuKTtcbiAgICBpZiAocmVnRXhwRnJvbUNhY2hlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiByZWdFeHBGcm9tQ2FjaGU7XG4gICAgfVxuICAgIGNvbnN0IHJlZ0V4cE5ldyA9IG5ldyBSZWdFeHAocGF0dGVybik7XG4gICAgaWYgKHRoaXMucmVnRXhwUXVldWUubGVuZ3RoID09PSB0aGlzLmNhcGFjaXR5KSB7XG4gICAgICB0aGlzLnJlZ0V4cE1hcC5kZWxldGUodGhpcy5yZWdFeHBRdWV1ZS5zaGlmdCgpKTtcbiAgICB9XG4gICAgdGhpcy5yZWdFeHBNYXAuc2V0KHBhdHRlcm4sIHJlZ0V4cE5ldyk7XG4gICAgdGhpcy5yZWdFeHBRdWV1ZS5wdXNoKHBhdHRlcm4pO1xuICAgIHJldHVybiByZWdFeHBOZXc7XG4gIH1cbn1cbmNvbnN0IGNoYXJzID0gWycgJywgJywnLCAnPycsICchJywgJzsnXTtcbmNvbnN0IGxvb2tzTGlrZU9iamVjdFBhdGhSZWdFeHBDYWNoZSA9IG5ldyBSZWdFeHBDYWNoZSgyMCk7XG5jb25zdCBsb29rc0xpa2VPYmplY3RQYXRoID0gKGtleSwgbnNTZXBhcmF0b3IsIGtleVNlcGFyYXRvcikgPT4ge1xuICBuc1NlcGFyYXRvciA9IG5zU2VwYXJhdG9yIHx8ICcnO1xuICBrZXlTZXBhcmF0b3IgPSBrZXlTZXBhcmF0b3IgfHwgJyc7XG4gIGNvbnN0IHBvc3NpYmxlQ2hhcnMgPSBjaGFycy5maWx0ZXIoYyA9PiBuc1NlcGFyYXRvci5pbmRleE9mKGMpIDwgMCAmJiBrZXlTZXBhcmF0b3IuaW5kZXhPZihjKSA8IDApO1xuICBpZiAocG9zc2libGVDaGFycy5sZW5ndGggPT09IDApIHJldHVybiB0cnVlO1xuICBjb25zdCByID0gbG9va3NMaWtlT2JqZWN0UGF0aFJlZ0V4cENhY2hlLmdldFJlZ0V4cChgKCR7cG9zc2libGVDaGFycy5tYXAoYyA9PiBjID09PSAnPycgPyAnXFxcXD8nIDogYykuam9pbignfCcpfSlgKTtcbiAgbGV0IG1hdGNoZWQgPSAhci50ZXN0KGtleSk7XG4gIGlmICghbWF0Y2hlZCkge1xuICAgIGNvbnN0IGtpID0ga2V5LmluZGV4T2Yoa2V5U2VwYXJhdG9yKTtcbiAgICBpZiAoa2kgPiAwICYmICFyLnRlc3Qoa2V5LnN1YnN0cmluZygwLCBraSkpKSB7XG4gICAgICBtYXRjaGVkID0gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG1hdGNoZWQ7XG59O1xuY29uc3QgZGVlcEZpbmQgPSBmdW5jdGlvbiAob2JqLCBwYXRoKSB7XG4gIGxldCBrZXlTZXBhcmF0b3IgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6ICcuJztcbiAgaWYgKCFvYmopIHJldHVybiB1bmRlZmluZWQ7XG4gIGlmIChvYmpbcGF0aF0pIHJldHVybiBvYmpbcGF0aF07XG4gIGNvbnN0IHRva2VucyA9IHBhdGguc3BsaXQoa2V5U2VwYXJhdG9yKTtcbiAgbGV0IGN1cnJlbnQgPSBvYmo7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdG9rZW5zLmxlbmd0aDspIHtcbiAgICBpZiAoIWN1cnJlbnQgfHwgdHlwZW9mIGN1cnJlbnQgIT09ICdvYmplY3QnKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBsZXQgbmV4dDtcbiAgICBsZXQgbmV4dFBhdGggPSAnJztcbiAgICBmb3IgKGxldCBqID0gaTsgaiA8IHRva2Vucy5sZW5ndGg7ICsraikge1xuICAgICAgaWYgKGogIT09IGkpIHtcbiAgICAgICAgbmV4dFBhdGggKz0ga2V5U2VwYXJhdG9yO1xuICAgICAgfVxuICAgICAgbmV4dFBhdGggKz0gdG9rZW5zW2pdO1xuICAgICAgbmV4dCA9IGN1cnJlbnRbbmV4dFBhdGhdO1xuICAgICAgaWYgKG5leHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAoWydzdHJpbmcnLCAnbnVtYmVyJywgJ2Jvb2xlYW4nXS5pbmRleE9mKHR5cGVvZiBuZXh0KSA+IC0xICYmIGogPCB0b2tlbnMubGVuZ3RoIC0gMSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGkgKz0gaiAtIGkgKyAxO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgY3VycmVudCA9IG5leHQ7XG4gIH1cbiAgcmV0dXJuIGN1cnJlbnQ7XG59O1xuY29uc3QgZ2V0Q2xlYW5lZENvZGUgPSBjb2RlID0+IHtcbiAgaWYgKGNvZGUgJiYgY29kZS5pbmRleE9mKCdfJykgPiAwKSByZXR1cm4gY29kZS5yZXBsYWNlKCdfJywgJy0nKTtcbiAgcmV0dXJuIGNvZGU7XG59O1xuXG5jbGFzcyBSZXNvdXJjZVN0b3JlIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgY29uc3RydWN0b3IoZGF0YSkge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB7XG4gICAgICBuczogWyd0cmFuc2xhdGlvbiddLFxuICAgICAgZGVmYXVsdE5TOiAndHJhbnNsYXRpb24nXG4gICAgfTtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuZGF0YSA9IGRhdGEgfHwge307XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICBpZiAodGhpcy5vcHRpb25zLmtleVNlcGFyYXRvciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLm9wdGlvbnMua2V5U2VwYXJhdG9yID0gJy4nO1xuICAgIH1cbiAgICBpZiAodGhpcy5vcHRpb25zLmlnbm9yZUpTT05TdHJ1Y3R1cmUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5vcHRpb25zLmlnbm9yZUpTT05TdHJ1Y3R1cmUgPSB0cnVlO1xuICAgIH1cbiAgfVxuICBhZGROYW1lc3BhY2VzKG5zKSB7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5ucy5pbmRleE9mKG5zKSA8IDApIHtcbiAgICAgIHRoaXMub3B0aW9ucy5ucy5wdXNoKG5zKTtcbiAgICB9XG4gIH1cbiAgcmVtb3ZlTmFtZXNwYWNlcyhucykge1xuICAgIGNvbnN0IGluZGV4ID0gdGhpcy5vcHRpb25zLm5zLmluZGV4T2YobnMpO1xuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICB0aGlzLm9wdGlvbnMubnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG4gIH1cbiAgZ2V0UmVzb3VyY2UobG5nLCBucywga2V5KSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMyAmJiBhcmd1bWVudHNbM10gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1szXSA6IHt9O1xuICAgIGNvbnN0IGtleVNlcGFyYXRvciA9IG9wdGlvbnMua2V5U2VwYXJhdG9yICE9PSB1bmRlZmluZWQgPyBvcHRpb25zLmtleVNlcGFyYXRvciA6IHRoaXMub3B0aW9ucy5rZXlTZXBhcmF0b3I7XG4gICAgY29uc3QgaWdub3JlSlNPTlN0cnVjdHVyZSA9IG9wdGlvbnMuaWdub3JlSlNPTlN0cnVjdHVyZSAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy5pZ25vcmVKU09OU3RydWN0dXJlIDogdGhpcy5vcHRpb25zLmlnbm9yZUpTT05TdHJ1Y3R1cmU7XG4gICAgbGV0IHBhdGg7XG4gICAgaWYgKGxuZy5pbmRleE9mKCcuJykgPiAtMSkge1xuICAgICAgcGF0aCA9IGxuZy5zcGxpdCgnLicpO1xuICAgIH0gZWxzZSB7XG4gICAgICBwYXRoID0gW2xuZywgbnNdO1xuICAgICAgaWYgKGtleSkge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShrZXkpKSB7XG4gICAgICAgICAgcGF0aC5wdXNoKC4uLmtleSk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGtleSA9PT0gJ3N0cmluZycgJiYga2V5U2VwYXJhdG9yKSB7XG4gICAgICAgICAgcGF0aC5wdXNoKC4uLmtleS5zcGxpdChrZXlTZXBhcmF0b3IpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwYXRoLnB1c2goa2V5KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCByZXN1bHQgPSBnZXRQYXRoKHRoaXMuZGF0YSwgcGF0aCk7XG4gICAgaWYgKCFyZXN1bHQgJiYgIW5zICYmICFrZXkgJiYgbG5nLmluZGV4T2YoJy4nKSA+IC0xKSB7XG4gICAgICBsbmcgPSBwYXRoWzBdO1xuICAgICAgbnMgPSBwYXRoWzFdO1xuICAgICAga2V5ID0gcGF0aC5zbGljZSgyKS5qb2luKCcuJyk7XG4gICAgfVxuICAgIGlmIChyZXN1bHQgfHwgIWlnbm9yZUpTT05TdHJ1Y3R1cmUgfHwgdHlwZW9mIGtleSAhPT0gJ3N0cmluZycpIHJldHVybiByZXN1bHQ7XG4gICAgcmV0dXJuIGRlZXBGaW5kKHRoaXMuZGF0YSAmJiB0aGlzLmRhdGFbbG5nXSAmJiB0aGlzLmRhdGFbbG5nXVtuc10sIGtleSwga2V5U2VwYXJhdG9yKTtcbiAgfVxuICBhZGRSZXNvdXJjZShsbmcsIG5zLCBrZXksIHZhbHVlKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gNCAmJiBhcmd1bWVudHNbNF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1s0XSA6IHtcbiAgICAgIHNpbGVudDogZmFsc2VcbiAgICB9O1xuICAgIGNvbnN0IGtleVNlcGFyYXRvciA9IG9wdGlvbnMua2V5U2VwYXJhdG9yICE9PSB1bmRlZmluZWQgPyBvcHRpb25zLmtleVNlcGFyYXRvciA6IHRoaXMub3B0aW9ucy5rZXlTZXBhcmF0b3I7XG4gICAgbGV0IHBhdGggPSBbbG5nLCBuc107XG4gICAgaWYgKGtleSkgcGF0aCA9IHBhdGguY29uY2F0KGtleVNlcGFyYXRvciA/IGtleS5zcGxpdChrZXlTZXBhcmF0b3IpIDoga2V5KTtcbiAgICBpZiAobG5nLmluZGV4T2YoJy4nKSA+IC0xKSB7XG4gICAgICBwYXRoID0gbG5nLnNwbGl0KCcuJyk7XG4gICAgICB2YWx1ZSA9IG5zO1xuICAgICAgbnMgPSBwYXRoWzFdO1xuICAgIH1cbiAgICB0aGlzLmFkZE5hbWVzcGFjZXMobnMpO1xuICAgIHNldFBhdGgodGhpcy5kYXRhLCBwYXRoLCB2YWx1ZSk7XG4gICAgaWYgKCFvcHRpb25zLnNpbGVudCkgdGhpcy5lbWl0KCdhZGRlZCcsIGxuZywgbnMsIGtleSwgdmFsdWUpO1xuICB9XG4gIGFkZFJlc291cmNlcyhsbmcsIG5zLCByZXNvdXJjZXMpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAzICYmIGFyZ3VtZW50c1szXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzNdIDoge1xuICAgICAgc2lsZW50OiBmYWxzZVxuICAgIH07XG4gICAgZm9yIChjb25zdCBtIGluIHJlc291cmNlcykge1xuICAgICAgaWYgKHR5cGVvZiByZXNvdXJjZXNbbV0gPT09ICdzdHJpbmcnIHx8IEFycmF5LmlzQXJyYXkocmVzb3VyY2VzW21dKSkgdGhpcy5hZGRSZXNvdXJjZShsbmcsIG5zLCBtLCByZXNvdXJjZXNbbV0sIHtcbiAgICAgICAgc2lsZW50OiB0cnVlXG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKCFvcHRpb25zLnNpbGVudCkgdGhpcy5lbWl0KCdhZGRlZCcsIGxuZywgbnMsIHJlc291cmNlcyk7XG4gIH1cbiAgYWRkUmVzb3VyY2VCdW5kbGUobG5nLCBucywgcmVzb3VyY2VzLCBkZWVwLCBvdmVyd3JpdGUpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiA1ICYmIGFyZ3VtZW50c1s1XSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzVdIDoge1xuICAgICAgc2lsZW50OiBmYWxzZSxcbiAgICAgIHNraXBDb3B5OiBmYWxzZVxuICAgIH07XG4gICAgbGV0IHBhdGggPSBbbG5nLCBuc107XG4gICAgaWYgKGxuZy5pbmRleE9mKCcuJykgPiAtMSkge1xuICAgICAgcGF0aCA9IGxuZy5zcGxpdCgnLicpO1xuICAgICAgZGVlcCA9IHJlc291cmNlcztcbiAgICAgIHJlc291cmNlcyA9IG5zO1xuICAgICAgbnMgPSBwYXRoWzFdO1xuICAgIH1cbiAgICB0aGlzLmFkZE5hbWVzcGFjZXMobnMpO1xuICAgIGxldCBwYWNrID0gZ2V0UGF0aCh0aGlzLmRhdGEsIHBhdGgpIHx8IHt9O1xuICAgIGlmICghb3B0aW9ucy5za2lwQ29weSkgcmVzb3VyY2VzID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShyZXNvdXJjZXMpKTtcbiAgICBpZiAoZGVlcCkge1xuICAgICAgZGVlcEV4dGVuZChwYWNrLCByZXNvdXJjZXMsIG92ZXJ3cml0ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBhY2sgPSB7XG4gICAgICAgIC4uLnBhY2ssXG4gICAgICAgIC4uLnJlc291cmNlc1xuICAgICAgfTtcbiAgICB9XG4gICAgc2V0UGF0aCh0aGlzLmRhdGEsIHBhdGgsIHBhY2spO1xuICAgIGlmICghb3B0aW9ucy5zaWxlbnQpIHRoaXMuZW1pdCgnYWRkZWQnLCBsbmcsIG5zLCByZXNvdXJjZXMpO1xuICB9XG4gIHJlbW92ZVJlc291cmNlQnVuZGxlKGxuZywgbnMpIHtcbiAgICBpZiAodGhpcy5oYXNSZXNvdXJjZUJ1bmRsZShsbmcsIG5zKSkge1xuICAgICAgZGVsZXRlIHRoaXMuZGF0YVtsbmddW25zXTtcbiAgICB9XG4gICAgdGhpcy5yZW1vdmVOYW1lc3BhY2VzKG5zKTtcbiAgICB0aGlzLmVtaXQoJ3JlbW92ZWQnLCBsbmcsIG5zKTtcbiAgfVxuICBoYXNSZXNvdXJjZUJ1bmRsZShsbmcsIG5zKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UmVzb3VyY2UobG5nLCBucykgIT09IHVuZGVmaW5lZDtcbiAgfVxuICBnZXRSZXNvdXJjZUJ1bmRsZShsbmcsIG5zKSB7XG4gICAgaWYgKCFucykgbnMgPSB0aGlzLm9wdGlvbnMuZGVmYXVsdE5TO1xuICAgIGlmICh0aGlzLm9wdGlvbnMuY29tcGF0aWJpbGl0eUFQSSA9PT0gJ3YxJykgcmV0dXJuIHtcbiAgICAgIC4uLnt9LFxuICAgICAgLi4udGhpcy5nZXRSZXNvdXJjZShsbmcsIG5zKVxuICAgIH07XG4gICAgcmV0dXJuIHRoaXMuZ2V0UmVzb3VyY2UobG5nLCBucyk7XG4gIH1cbiAgZ2V0RGF0YUJ5TGFuZ3VhZ2UobG5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YVtsbmddO1xuICB9XG4gIGhhc0xhbmd1YWdlU29tZVRyYW5zbGF0aW9ucyhsbmcpIHtcbiAgICBjb25zdCBkYXRhID0gdGhpcy5nZXREYXRhQnlMYW5ndWFnZShsbmcpO1xuICAgIGNvbnN0IG4gPSBkYXRhICYmIE9iamVjdC5rZXlzKGRhdGEpIHx8IFtdO1xuICAgIHJldHVybiAhIW4uZmluZCh2ID0+IGRhdGFbdl0gJiYgT2JqZWN0LmtleXMoZGF0YVt2XSkubGVuZ3RoID4gMCk7XG4gIH1cbiAgdG9KU09OKCkge1xuICAgIHJldHVybiB0aGlzLmRhdGE7XG4gIH1cbn1cblxudmFyIHBvc3RQcm9jZXNzb3IgPSB7XG4gIHByb2Nlc3NvcnM6IHt9LFxuICBhZGRQb3N0UHJvY2Vzc29yKG1vZHVsZSkge1xuICAgIHRoaXMucHJvY2Vzc29yc1ttb2R1bGUubmFtZV0gPSBtb2R1bGU7XG4gIH0sXG4gIGhhbmRsZShwcm9jZXNzb3JzLCB2YWx1ZSwga2V5LCBvcHRpb25zLCB0cmFuc2xhdG9yKSB7XG4gICAgcHJvY2Vzc29ycy5mb3JFYWNoKHByb2Nlc3NvciA9PiB7XG4gICAgICBpZiAodGhpcy5wcm9jZXNzb3JzW3Byb2Nlc3Nvcl0pIHZhbHVlID0gdGhpcy5wcm9jZXNzb3JzW3Byb2Nlc3Nvcl0ucHJvY2Vzcyh2YWx1ZSwga2V5LCBvcHRpb25zLCB0cmFuc2xhdG9yKTtcbiAgICB9KTtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbn07XG5cbmNvbnN0IGNoZWNrZWRMb2FkZWRGb3IgPSB7fTtcbmNsYXNzIFRyYW5zbGF0b3IgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICBjb25zdHJ1Y3RvcihzZXJ2aWNlcykge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB7fTtcbiAgICBzdXBlcigpO1xuICAgIGNvcHkoWydyZXNvdXJjZVN0b3JlJywgJ2xhbmd1YWdlVXRpbHMnLCAncGx1cmFsUmVzb2x2ZXInLCAnaW50ZXJwb2xhdG9yJywgJ2JhY2tlbmRDb25uZWN0b3InLCAnaTE4bkZvcm1hdCcsICd1dGlscyddLCBzZXJ2aWNlcywgdGhpcyk7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICBpZiAodGhpcy5vcHRpb25zLmtleVNlcGFyYXRvciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLm9wdGlvbnMua2V5U2VwYXJhdG9yID0gJy4nO1xuICAgIH1cbiAgICB0aGlzLmxvZ2dlciA9IGJhc2VMb2dnZXIuY3JlYXRlKCd0cmFuc2xhdG9yJyk7XG4gIH1cbiAgY2hhbmdlTGFuZ3VhZ2UobG5nKSB7XG4gICAgaWYgKGxuZykgdGhpcy5sYW5ndWFnZSA9IGxuZztcbiAgfVxuICBleGlzdHMoa2V5KSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IHtcbiAgICAgIGludGVycG9sYXRpb246IHt9XG4gICAgfTtcbiAgICBpZiAoa2V5ID09PSB1bmRlZmluZWQgfHwga2V5ID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNvbnN0IHJlc29sdmVkID0gdGhpcy5yZXNvbHZlKGtleSwgb3B0aW9ucyk7XG4gICAgcmV0dXJuIHJlc29sdmVkICYmIHJlc29sdmVkLnJlcyAhPT0gdW5kZWZpbmVkO1xuICB9XG4gIGV4dHJhY3RGcm9tS2V5KGtleSwgb3B0aW9ucykge1xuICAgIGxldCBuc1NlcGFyYXRvciA9IG9wdGlvbnMubnNTZXBhcmF0b3IgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMubnNTZXBhcmF0b3IgOiB0aGlzLm9wdGlvbnMubnNTZXBhcmF0b3I7XG4gICAgaWYgKG5zU2VwYXJhdG9yID09PSB1bmRlZmluZWQpIG5zU2VwYXJhdG9yID0gJzonO1xuICAgIGNvbnN0IGtleVNlcGFyYXRvciA9IG9wdGlvbnMua2V5U2VwYXJhdG9yICE9PSB1bmRlZmluZWQgPyBvcHRpb25zLmtleVNlcGFyYXRvciA6IHRoaXMub3B0aW9ucy5rZXlTZXBhcmF0b3I7XG4gICAgbGV0IG5hbWVzcGFjZXMgPSBvcHRpb25zLm5zIHx8IHRoaXMub3B0aW9ucy5kZWZhdWx0TlMgfHwgW107XG4gICAgY29uc3Qgd291bGRDaGVja0Zvck5zSW5LZXkgPSBuc1NlcGFyYXRvciAmJiBrZXkuaW5kZXhPZihuc1NlcGFyYXRvcikgPiAtMTtcbiAgICBjb25zdCBzZWVtc05hdHVyYWxMYW5ndWFnZSA9ICF0aGlzLm9wdGlvbnMudXNlckRlZmluZWRLZXlTZXBhcmF0b3IgJiYgIW9wdGlvbnMua2V5U2VwYXJhdG9yICYmICF0aGlzLm9wdGlvbnMudXNlckRlZmluZWROc1NlcGFyYXRvciAmJiAhb3B0aW9ucy5uc1NlcGFyYXRvciAmJiAhbG9va3NMaWtlT2JqZWN0UGF0aChrZXksIG5zU2VwYXJhdG9yLCBrZXlTZXBhcmF0b3IpO1xuICAgIGlmICh3b3VsZENoZWNrRm9yTnNJbktleSAmJiAhc2VlbXNOYXR1cmFsTGFuZ3VhZ2UpIHtcbiAgICAgIGNvbnN0IG0gPSBrZXkubWF0Y2godGhpcy5pbnRlcnBvbGF0b3IubmVzdGluZ1JlZ2V4cCk7XG4gICAgICBpZiAobSAmJiBtLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBrZXksXG4gICAgICAgICAgbmFtZXNwYWNlc1xuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgY29uc3QgcGFydHMgPSBrZXkuc3BsaXQobnNTZXBhcmF0b3IpO1xuICAgICAgaWYgKG5zU2VwYXJhdG9yICE9PSBrZXlTZXBhcmF0b3IgfHwgbnNTZXBhcmF0b3IgPT09IGtleVNlcGFyYXRvciAmJiB0aGlzLm9wdGlvbnMubnMuaW5kZXhPZihwYXJ0c1swXSkgPiAtMSkgbmFtZXNwYWNlcyA9IHBhcnRzLnNoaWZ0KCk7XG4gICAgICBrZXkgPSBwYXJ0cy5qb2luKGtleVNlcGFyYXRvcik7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgbmFtZXNwYWNlcyA9PT0gJ3N0cmluZycpIG5hbWVzcGFjZXMgPSBbbmFtZXNwYWNlc107XG4gICAgcmV0dXJuIHtcbiAgICAgIGtleSxcbiAgICAgIG5hbWVzcGFjZXNcbiAgICB9O1xuICB9XG4gIHRyYW5zbGF0ZShrZXlzLCBvcHRpb25zLCBsYXN0S2V5KSB7XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zICE9PSAnb2JqZWN0JyAmJiB0aGlzLm9wdGlvbnMub3ZlcmxvYWRUcmFuc2xhdGlvbk9wdGlvbkhhbmRsZXIpIHtcbiAgICAgIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnMub3ZlcmxvYWRUcmFuc2xhdGlvbk9wdGlvbkhhbmRsZXIoYXJndW1lbnRzKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnb2JqZWN0Jykgb3B0aW9ucyA9IHtcbiAgICAgIC4uLm9wdGlvbnNcbiAgICB9O1xuICAgIGlmICghb3B0aW9ucykgb3B0aW9ucyA9IHt9O1xuICAgIGlmIChrZXlzID09PSB1bmRlZmluZWQgfHwga2V5cyA9PT0gbnVsbCkgcmV0dXJuICcnO1xuICAgIGlmICghQXJyYXkuaXNBcnJheShrZXlzKSkga2V5cyA9IFtTdHJpbmcoa2V5cyldO1xuICAgIGNvbnN0IHJldHVybkRldGFpbHMgPSBvcHRpb25zLnJldHVybkRldGFpbHMgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMucmV0dXJuRGV0YWlscyA6IHRoaXMub3B0aW9ucy5yZXR1cm5EZXRhaWxzO1xuICAgIGNvbnN0IGtleVNlcGFyYXRvciA9IG9wdGlvbnMua2V5U2VwYXJhdG9yICE9PSB1bmRlZmluZWQgPyBvcHRpb25zLmtleVNlcGFyYXRvciA6IHRoaXMub3B0aW9ucy5rZXlTZXBhcmF0b3I7XG4gICAgY29uc3Qge1xuICAgICAga2V5LFxuICAgICAgbmFtZXNwYWNlc1xuICAgIH0gPSB0aGlzLmV4dHJhY3RGcm9tS2V5KGtleXNba2V5cy5sZW5ndGggLSAxXSwgb3B0aW9ucyk7XG4gICAgY29uc3QgbmFtZXNwYWNlID0gbmFtZXNwYWNlc1tuYW1lc3BhY2VzLmxlbmd0aCAtIDFdO1xuICAgIGNvbnN0IGxuZyA9IG9wdGlvbnMubG5nIHx8IHRoaXMubGFuZ3VhZ2U7XG4gICAgY29uc3QgYXBwZW5kTmFtZXNwYWNlVG9DSU1vZGUgPSBvcHRpb25zLmFwcGVuZE5hbWVzcGFjZVRvQ0lNb2RlIHx8IHRoaXMub3B0aW9ucy5hcHBlbmROYW1lc3BhY2VUb0NJTW9kZTtcbiAgICBpZiAobG5nICYmIGxuZy50b0xvd2VyQ2FzZSgpID09PSAnY2ltb2RlJykge1xuICAgICAgaWYgKGFwcGVuZE5hbWVzcGFjZVRvQ0lNb2RlKSB7XG4gICAgICAgIGNvbnN0IG5zU2VwYXJhdG9yID0gb3B0aW9ucy5uc1NlcGFyYXRvciB8fCB0aGlzLm9wdGlvbnMubnNTZXBhcmF0b3I7XG4gICAgICAgIGlmIChyZXR1cm5EZXRhaWxzKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlczogYCR7bmFtZXNwYWNlfSR7bnNTZXBhcmF0b3J9JHtrZXl9YCxcbiAgICAgICAgICAgIHVzZWRLZXk6IGtleSxcbiAgICAgICAgICAgIGV4YWN0VXNlZEtleToga2V5LFxuICAgICAgICAgICAgdXNlZExuZzogbG5nLFxuICAgICAgICAgICAgdXNlZE5TOiBuYW1lc3BhY2UsXG4gICAgICAgICAgICB1c2VkUGFyYW1zOiB0aGlzLmdldFVzZWRQYXJhbXNEZXRhaWxzKG9wdGlvbnMpXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYCR7bmFtZXNwYWNlfSR7bnNTZXBhcmF0b3J9JHtrZXl9YDtcbiAgICAgIH1cbiAgICAgIGlmIChyZXR1cm5EZXRhaWxzKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgcmVzOiBrZXksXG4gICAgICAgICAgdXNlZEtleToga2V5LFxuICAgICAgICAgIGV4YWN0VXNlZEtleToga2V5LFxuICAgICAgICAgIHVzZWRMbmc6IGxuZyxcbiAgICAgICAgICB1c2VkTlM6IG5hbWVzcGFjZSxcbiAgICAgICAgICB1c2VkUGFyYW1zOiB0aGlzLmdldFVzZWRQYXJhbXNEZXRhaWxzKG9wdGlvbnMpXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICByZXR1cm4ga2V5O1xuICAgIH1cbiAgICBjb25zdCByZXNvbHZlZCA9IHRoaXMucmVzb2x2ZShrZXlzLCBvcHRpb25zKTtcbiAgICBsZXQgcmVzID0gcmVzb2x2ZWQgJiYgcmVzb2x2ZWQucmVzO1xuICAgIGNvbnN0IHJlc1VzZWRLZXkgPSByZXNvbHZlZCAmJiByZXNvbHZlZC51c2VkS2V5IHx8IGtleTtcbiAgICBjb25zdCByZXNFeGFjdFVzZWRLZXkgPSByZXNvbHZlZCAmJiByZXNvbHZlZC5leGFjdFVzZWRLZXkgfHwga2V5O1xuICAgIGNvbnN0IHJlc1R5cGUgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmFwcGx5KHJlcyk7XG4gICAgY29uc3Qgbm9PYmplY3QgPSBbJ1tvYmplY3QgTnVtYmVyXScsICdbb2JqZWN0IEZ1bmN0aW9uXScsICdbb2JqZWN0IFJlZ0V4cF0nXTtcbiAgICBjb25zdCBqb2luQXJyYXlzID0gb3B0aW9ucy5qb2luQXJyYXlzICE9PSB1bmRlZmluZWQgPyBvcHRpb25zLmpvaW5BcnJheXMgOiB0aGlzLm9wdGlvbnMuam9pbkFycmF5cztcbiAgICBjb25zdCBoYW5kbGVBc09iamVjdEluSTE4bkZvcm1hdCA9ICF0aGlzLmkxOG5Gb3JtYXQgfHwgdGhpcy5pMThuRm9ybWF0LmhhbmRsZUFzT2JqZWN0O1xuICAgIGNvbnN0IGhhbmRsZUFzT2JqZWN0ID0gdHlwZW9mIHJlcyAhPT0gJ3N0cmluZycgJiYgdHlwZW9mIHJlcyAhPT0gJ2Jvb2xlYW4nICYmIHR5cGVvZiByZXMgIT09ICdudW1iZXInO1xuICAgIGlmIChoYW5kbGVBc09iamVjdEluSTE4bkZvcm1hdCAmJiByZXMgJiYgaGFuZGxlQXNPYmplY3QgJiYgbm9PYmplY3QuaW5kZXhPZihyZXNUeXBlKSA8IDAgJiYgISh0eXBlb2Ygam9pbkFycmF5cyA9PT0gJ3N0cmluZycgJiYgQXJyYXkuaXNBcnJheShyZXMpKSkge1xuICAgICAgaWYgKCFvcHRpb25zLnJldHVybk9iamVjdHMgJiYgIXRoaXMub3B0aW9ucy5yZXR1cm5PYmplY3RzKSB7XG4gICAgICAgIGlmICghdGhpcy5vcHRpb25zLnJldHVybmVkT2JqZWN0SGFuZGxlcikge1xuICAgICAgICAgIHRoaXMubG9nZ2VyLndhcm4oJ2FjY2Vzc2luZyBhbiBvYmplY3QgLSBidXQgcmV0dXJuT2JqZWN0cyBvcHRpb25zIGlzIG5vdCBlbmFibGVkIScpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHIgPSB0aGlzLm9wdGlvbnMucmV0dXJuZWRPYmplY3RIYW5kbGVyID8gdGhpcy5vcHRpb25zLnJldHVybmVkT2JqZWN0SGFuZGxlcihyZXNVc2VkS2V5LCByZXMsIHtcbiAgICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICAgIG5zOiBuYW1lc3BhY2VzXG4gICAgICAgIH0pIDogYGtleSAnJHtrZXl9ICgke3RoaXMubGFuZ3VhZ2V9KScgcmV0dXJuZWQgYW4gb2JqZWN0IGluc3RlYWQgb2Ygc3RyaW5nLmA7XG4gICAgICAgIGlmIChyZXR1cm5EZXRhaWxzKSB7XG4gICAgICAgICAgcmVzb2x2ZWQucmVzID0gcjtcbiAgICAgICAgICByZXNvbHZlZC51c2VkUGFyYW1zID0gdGhpcy5nZXRVc2VkUGFyYW1zRGV0YWlscyhvcHRpb25zKTtcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZWQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHI7XG4gICAgICB9XG4gICAgICBpZiAoa2V5U2VwYXJhdG9yKSB7XG4gICAgICAgIGNvbnN0IHJlc1R5cGVJc0FycmF5ID0gQXJyYXkuaXNBcnJheShyZXMpO1xuICAgICAgICBjb25zdCBjb3B5ID0gcmVzVHlwZUlzQXJyYXkgPyBbXSA6IHt9O1xuICAgICAgICBjb25zdCBuZXdLZXlUb1VzZSA9IHJlc1R5cGVJc0FycmF5ID8gcmVzRXhhY3RVc2VkS2V5IDogcmVzVXNlZEtleTtcbiAgICAgICAgZm9yIChjb25zdCBtIGluIHJlcykge1xuICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocmVzLCBtKSkge1xuICAgICAgICAgICAgY29uc3QgZGVlcEtleSA9IGAke25ld0tleVRvVXNlfSR7a2V5U2VwYXJhdG9yfSR7bX1gO1xuICAgICAgICAgICAgY29weVttXSA9IHRoaXMudHJhbnNsYXRlKGRlZXBLZXksIHtcbiAgICAgICAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgICAgICAgLi4ue1xuICAgICAgICAgICAgICAgIGpvaW5BcnJheXM6IGZhbHNlLFxuICAgICAgICAgICAgICAgIG5zOiBuYW1lc3BhY2VzXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGNvcHlbbV0gPT09IGRlZXBLZXkpIGNvcHlbbV0gPSByZXNbbV07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJlcyA9IGNvcHk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChoYW5kbGVBc09iamVjdEluSTE4bkZvcm1hdCAmJiB0eXBlb2Ygam9pbkFycmF5cyA9PT0gJ3N0cmluZycgJiYgQXJyYXkuaXNBcnJheShyZXMpKSB7XG4gICAgICByZXMgPSByZXMuam9pbihqb2luQXJyYXlzKTtcbiAgICAgIGlmIChyZXMpIHJlcyA9IHRoaXMuZXh0ZW5kVHJhbnNsYXRpb24ocmVzLCBrZXlzLCBvcHRpb25zLCBsYXN0S2V5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IHVzZWREZWZhdWx0ID0gZmFsc2U7XG4gICAgICBsZXQgdXNlZEtleSA9IGZhbHNlO1xuICAgICAgY29uc3QgbmVlZHNQbHVyYWxIYW5kbGluZyA9IG9wdGlvbnMuY291bnQgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2Ygb3B0aW9ucy5jb3VudCAhPT0gJ3N0cmluZyc7XG4gICAgICBjb25zdCBoYXNEZWZhdWx0VmFsdWUgPSBUcmFuc2xhdG9yLmhhc0RlZmF1bHRWYWx1ZShvcHRpb25zKTtcbiAgICAgIGNvbnN0IGRlZmF1bHRWYWx1ZVN1ZmZpeCA9IG5lZWRzUGx1cmFsSGFuZGxpbmcgPyB0aGlzLnBsdXJhbFJlc29sdmVyLmdldFN1ZmZpeChsbmcsIG9wdGlvbnMuY291bnQsIG9wdGlvbnMpIDogJyc7XG4gICAgICBjb25zdCBkZWZhdWx0VmFsdWVTdWZmaXhPcmRpbmFsRmFsbGJhY2sgPSBvcHRpb25zLm9yZGluYWwgJiYgbmVlZHNQbHVyYWxIYW5kbGluZyA/IHRoaXMucGx1cmFsUmVzb2x2ZXIuZ2V0U3VmZml4KGxuZywgb3B0aW9ucy5jb3VudCwge1xuICAgICAgICBvcmRpbmFsOiBmYWxzZVxuICAgICAgfSkgOiAnJztcbiAgICAgIGNvbnN0IG5lZWRzWmVyb1N1ZmZpeExvb2t1cCA9IG5lZWRzUGx1cmFsSGFuZGxpbmcgJiYgIW9wdGlvbnMub3JkaW5hbCAmJiBvcHRpb25zLmNvdW50ID09PSAwICYmIHRoaXMucGx1cmFsUmVzb2x2ZXIuc2hvdWxkVXNlSW50bEFwaSgpO1xuICAgICAgY29uc3QgZGVmYXVsdFZhbHVlID0gbmVlZHNaZXJvU3VmZml4TG9va3VwICYmIG9wdGlvbnNbYGRlZmF1bHRWYWx1ZSR7dGhpcy5vcHRpb25zLnBsdXJhbFNlcGFyYXRvcn16ZXJvYF0gfHwgb3B0aW9uc1tgZGVmYXVsdFZhbHVlJHtkZWZhdWx0VmFsdWVTdWZmaXh9YF0gfHwgb3B0aW9uc1tgZGVmYXVsdFZhbHVlJHtkZWZhdWx0VmFsdWVTdWZmaXhPcmRpbmFsRmFsbGJhY2t9YF0gfHwgb3B0aW9ucy5kZWZhdWx0VmFsdWU7XG4gICAgICBpZiAoIXRoaXMuaXNWYWxpZExvb2t1cChyZXMpICYmIGhhc0RlZmF1bHRWYWx1ZSkge1xuICAgICAgICB1c2VkRGVmYXVsdCA9IHRydWU7XG4gICAgICAgIHJlcyA9IGRlZmF1bHRWYWx1ZTtcbiAgICAgIH1cbiAgICAgIGlmICghdGhpcy5pc1ZhbGlkTG9va3VwKHJlcykpIHtcbiAgICAgICAgdXNlZEtleSA9IHRydWU7XG4gICAgICAgIHJlcyA9IGtleTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG1pc3NpbmdLZXlOb1ZhbHVlRmFsbGJhY2tUb0tleSA9IG9wdGlvbnMubWlzc2luZ0tleU5vVmFsdWVGYWxsYmFja1RvS2V5IHx8IHRoaXMub3B0aW9ucy5taXNzaW5nS2V5Tm9WYWx1ZUZhbGxiYWNrVG9LZXk7XG4gICAgICBjb25zdCByZXNGb3JNaXNzaW5nID0gbWlzc2luZ0tleU5vVmFsdWVGYWxsYmFja1RvS2V5ICYmIHVzZWRLZXkgPyB1bmRlZmluZWQgOiByZXM7XG4gICAgICBjb25zdCB1cGRhdGVNaXNzaW5nID0gaGFzRGVmYXVsdFZhbHVlICYmIGRlZmF1bHRWYWx1ZSAhPT0gcmVzICYmIHRoaXMub3B0aW9ucy51cGRhdGVNaXNzaW5nO1xuICAgICAgaWYgKHVzZWRLZXkgfHwgdXNlZERlZmF1bHQgfHwgdXBkYXRlTWlzc2luZykge1xuICAgICAgICB0aGlzLmxvZ2dlci5sb2codXBkYXRlTWlzc2luZyA/ICd1cGRhdGVLZXknIDogJ21pc3NpbmdLZXknLCBsbmcsIG5hbWVzcGFjZSwga2V5LCB1cGRhdGVNaXNzaW5nID8gZGVmYXVsdFZhbHVlIDogcmVzKTtcbiAgICAgICAgaWYgKGtleVNlcGFyYXRvcikge1xuICAgICAgICAgIGNvbnN0IGZrID0gdGhpcy5yZXNvbHZlKGtleSwge1xuICAgICAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgICAgIGtleVNlcGFyYXRvcjogZmFsc2VcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBpZiAoZmsgJiYgZmsucmVzKSB0aGlzLmxvZ2dlci53YXJuKCdTZWVtcyB0aGUgbG9hZGVkIHRyYW5zbGF0aW9ucyB3ZXJlIGluIGZsYXQgSlNPTiBmb3JtYXQgaW5zdGVhZCBvZiBuZXN0ZWQuIEVpdGhlciBzZXQga2V5U2VwYXJhdG9yOiBmYWxzZSBvbiBpbml0IG9yIG1ha2Ugc3VyZSB5b3VyIHRyYW5zbGF0aW9ucyBhcmUgcHVibGlzaGVkIGluIG5lc3RlZCBmb3JtYXQuJyk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGxuZ3MgPSBbXTtcbiAgICAgICAgY29uc3QgZmFsbGJhY2tMbmdzID0gdGhpcy5sYW5ndWFnZVV0aWxzLmdldEZhbGxiYWNrQ29kZXModGhpcy5vcHRpb25zLmZhbGxiYWNrTG5nLCBvcHRpb25zLmxuZyB8fCB0aGlzLmxhbmd1YWdlKTtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zYXZlTWlzc2luZ1RvID09PSAnZmFsbGJhY2snICYmIGZhbGxiYWNrTG5ncyAmJiBmYWxsYmFja0xuZ3NbMF0pIHtcbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZhbGxiYWNrTG5ncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbG5ncy5wdXNoKGZhbGxiYWNrTG5nc1tpXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5zYXZlTWlzc2luZ1RvID09PSAnYWxsJykge1xuICAgICAgICAgIGxuZ3MgPSB0aGlzLmxhbmd1YWdlVXRpbHMudG9SZXNvbHZlSGllcmFyY2h5KG9wdGlvbnMubG5nIHx8IHRoaXMubGFuZ3VhZ2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxuZ3MucHVzaChvcHRpb25zLmxuZyB8fCB0aGlzLmxhbmd1YWdlKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzZW5kID0gKGwsIGssIHNwZWNpZmljRGVmYXVsdFZhbHVlKSA9PiB7XG4gICAgICAgICAgY29uc3QgZGVmYXVsdEZvck1pc3NpbmcgPSBoYXNEZWZhdWx0VmFsdWUgJiYgc3BlY2lmaWNEZWZhdWx0VmFsdWUgIT09IHJlcyA/IHNwZWNpZmljRGVmYXVsdFZhbHVlIDogcmVzRm9yTWlzc2luZztcbiAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLm1pc3NpbmdLZXlIYW5kbGVyKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMubWlzc2luZ0tleUhhbmRsZXIobCwgbmFtZXNwYWNlLCBrLCBkZWZhdWx0Rm9yTWlzc2luZywgdXBkYXRlTWlzc2luZywgb3B0aW9ucyk7XG4gICAgICAgICAgfSBlbHNlIGlmICh0aGlzLmJhY2tlbmRDb25uZWN0b3IgJiYgdGhpcy5iYWNrZW5kQ29ubmVjdG9yLnNhdmVNaXNzaW5nKSB7XG4gICAgICAgICAgICB0aGlzLmJhY2tlbmRDb25uZWN0b3Iuc2F2ZU1pc3NpbmcobCwgbmFtZXNwYWNlLCBrLCBkZWZhdWx0Rm9yTWlzc2luZywgdXBkYXRlTWlzc2luZywgb3B0aW9ucyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuZW1pdCgnbWlzc2luZ0tleScsIGwsIG5hbWVzcGFjZSwgaywgcmVzKTtcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zYXZlTWlzc2luZykge1xuICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2F2ZU1pc3NpbmdQbHVyYWxzICYmIG5lZWRzUGx1cmFsSGFuZGxpbmcpIHtcbiAgICAgICAgICAgIGxuZ3MuZm9yRWFjaChsYW5ndWFnZSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IHN1ZmZpeGVzID0gdGhpcy5wbHVyYWxSZXNvbHZlci5nZXRTdWZmaXhlcyhsYW5ndWFnZSwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgIGlmIChuZWVkc1plcm9TdWZmaXhMb29rdXAgJiYgb3B0aW9uc1tgZGVmYXVsdFZhbHVlJHt0aGlzLm9wdGlvbnMucGx1cmFsU2VwYXJhdG9yfXplcm9gXSAmJiBzdWZmaXhlcy5pbmRleE9mKGAke3RoaXMub3B0aW9ucy5wbHVyYWxTZXBhcmF0b3J9emVyb2ApIDwgMCkge1xuICAgICAgICAgICAgICAgIHN1ZmZpeGVzLnB1c2goYCR7dGhpcy5vcHRpb25zLnBsdXJhbFNlcGFyYXRvcn16ZXJvYCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgc3VmZml4ZXMuZm9yRWFjaChzdWZmaXggPT4ge1xuICAgICAgICAgICAgICAgIHNlbmQoW2xhbmd1YWdlXSwga2V5ICsgc3VmZml4LCBvcHRpb25zW2BkZWZhdWx0VmFsdWUke3N1ZmZpeH1gXSB8fCBkZWZhdWx0VmFsdWUpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZW5kKGxuZ3MsIGtleSwgZGVmYXVsdFZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJlcyA9IHRoaXMuZXh0ZW5kVHJhbnNsYXRpb24ocmVzLCBrZXlzLCBvcHRpb25zLCByZXNvbHZlZCwgbGFzdEtleSk7XG4gICAgICBpZiAodXNlZEtleSAmJiByZXMgPT09IGtleSAmJiB0aGlzLm9wdGlvbnMuYXBwZW5kTmFtZXNwYWNlVG9NaXNzaW5nS2V5KSByZXMgPSBgJHtuYW1lc3BhY2V9OiR7a2V5fWA7XG4gICAgICBpZiAoKHVzZWRLZXkgfHwgdXNlZERlZmF1bHQpICYmIHRoaXMub3B0aW9ucy5wYXJzZU1pc3NpbmdLZXlIYW5kbGVyKSB7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuY29tcGF0aWJpbGl0eUFQSSAhPT0gJ3YxJykge1xuICAgICAgICAgIHJlcyA9IHRoaXMub3B0aW9ucy5wYXJzZU1pc3NpbmdLZXlIYW5kbGVyKHRoaXMub3B0aW9ucy5hcHBlbmROYW1lc3BhY2VUb01pc3NpbmdLZXkgPyBgJHtuYW1lc3BhY2V9OiR7a2V5fWAgOiBrZXksIHVzZWREZWZhdWx0ID8gcmVzIDogdW5kZWZpbmVkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXMgPSB0aGlzLm9wdGlvbnMucGFyc2VNaXNzaW5nS2V5SGFuZGxlcihyZXMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChyZXR1cm5EZXRhaWxzKSB7XG4gICAgICByZXNvbHZlZC5yZXMgPSByZXM7XG4gICAgICByZXNvbHZlZC51c2VkUGFyYW1zID0gdGhpcy5nZXRVc2VkUGFyYW1zRGV0YWlscyhvcHRpb25zKTtcbiAgICAgIHJldHVybiByZXNvbHZlZDtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbiAgfVxuICBleHRlbmRUcmFuc2xhdGlvbihyZXMsIGtleSwgb3B0aW9ucywgcmVzb2x2ZWQsIGxhc3RLZXkpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIGlmICh0aGlzLmkxOG5Gb3JtYXQgJiYgdGhpcy5pMThuRm9ybWF0LnBhcnNlKSB7XG4gICAgICByZXMgPSB0aGlzLmkxOG5Gb3JtYXQucGFyc2UocmVzLCB7XG4gICAgICAgIC4uLnRoaXMub3B0aW9ucy5pbnRlcnBvbGF0aW9uLmRlZmF1bHRWYXJpYWJsZXMsXG4gICAgICAgIC4uLm9wdGlvbnNcbiAgICAgIH0sIG9wdGlvbnMubG5nIHx8IHRoaXMubGFuZ3VhZ2UgfHwgcmVzb2x2ZWQudXNlZExuZywgcmVzb2x2ZWQudXNlZE5TLCByZXNvbHZlZC51c2VkS2V5LCB7XG4gICAgICAgIHJlc29sdmVkXG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKCFvcHRpb25zLnNraXBJbnRlcnBvbGF0aW9uKSB7XG4gICAgICBpZiAob3B0aW9ucy5pbnRlcnBvbGF0aW9uKSB0aGlzLmludGVycG9sYXRvci5pbml0KHtcbiAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgLi4ue1xuICAgICAgICAgIGludGVycG9sYXRpb246IHtcbiAgICAgICAgICAgIC4uLnRoaXMub3B0aW9ucy5pbnRlcnBvbGF0aW9uLFxuICAgICAgICAgICAgLi4ub3B0aW9ucy5pbnRlcnBvbGF0aW9uXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGNvbnN0IHNraXBPblZhcmlhYmxlcyA9IHR5cGVvZiByZXMgPT09ICdzdHJpbmcnICYmIChvcHRpb25zICYmIG9wdGlvbnMuaW50ZXJwb2xhdGlvbiAmJiBvcHRpb25zLmludGVycG9sYXRpb24uc2tpcE9uVmFyaWFibGVzICE9PSB1bmRlZmluZWQgPyBvcHRpb25zLmludGVycG9sYXRpb24uc2tpcE9uVmFyaWFibGVzIDogdGhpcy5vcHRpb25zLmludGVycG9sYXRpb24uc2tpcE9uVmFyaWFibGVzKTtcbiAgICAgIGxldCBuZXN0QmVmO1xuICAgICAgaWYgKHNraXBPblZhcmlhYmxlcykge1xuICAgICAgICBjb25zdCBuYiA9IHJlcy5tYXRjaCh0aGlzLmludGVycG9sYXRvci5uZXN0aW5nUmVnZXhwKTtcbiAgICAgICAgbmVzdEJlZiA9IG5iICYmIG5iLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIGxldCBkYXRhID0gb3B0aW9ucy5yZXBsYWNlICYmIHR5cGVvZiBvcHRpb25zLnJlcGxhY2UgIT09ICdzdHJpbmcnID8gb3B0aW9ucy5yZXBsYWNlIDogb3B0aW9ucztcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbi5kZWZhdWx0VmFyaWFibGVzKSBkYXRhID0ge1xuICAgICAgICAuLi50aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbi5kZWZhdWx0VmFyaWFibGVzLFxuICAgICAgICAuLi5kYXRhXG4gICAgICB9O1xuICAgICAgcmVzID0gdGhpcy5pbnRlcnBvbGF0b3IuaW50ZXJwb2xhdGUocmVzLCBkYXRhLCBvcHRpb25zLmxuZyB8fCB0aGlzLmxhbmd1YWdlIHx8IHJlc29sdmVkLnVzZWRMbmcsIG9wdGlvbnMpO1xuICAgICAgaWYgKHNraXBPblZhcmlhYmxlcykge1xuICAgICAgICBjb25zdCBuYSA9IHJlcy5tYXRjaCh0aGlzLmludGVycG9sYXRvci5uZXN0aW5nUmVnZXhwKTtcbiAgICAgICAgY29uc3QgbmVzdEFmdCA9IG5hICYmIG5hLmxlbmd0aDtcbiAgICAgICAgaWYgKG5lc3RCZWYgPCBuZXN0QWZ0KSBvcHRpb25zLm5lc3QgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmICghb3B0aW9ucy5sbmcgJiYgdGhpcy5vcHRpb25zLmNvbXBhdGliaWxpdHlBUEkgIT09ICd2MScgJiYgcmVzb2x2ZWQgJiYgcmVzb2x2ZWQucmVzKSBvcHRpb25zLmxuZyA9IHRoaXMubGFuZ3VhZ2UgfHwgcmVzb2x2ZWQudXNlZExuZztcbiAgICAgIGlmIChvcHRpb25zLm5lc3QgIT09IGZhbHNlKSByZXMgPSB0aGlzLmludGVycG9sYXRvci5uZXN0KHJlcywgZnVuY3Rpb24gKCkge1xuICAgICAgICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IG5ldyBBcnJheShfbGVuKSwgX2tleSA9IDA7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcbiAgICAgICAgICBhcmdzW19rZXldID0gYXJndW1lbnRzW19rZXldO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsYXN0S2V5ICYmIGxhc3RLZXlbMF0gPT09IGFyZ3NbMF0gJiYgIW9wdGlvbnMuY29udGV4dCkge1xuICAgICAgICAgIF90aGlzLmxvZ2dlci53YXJuKGBJdCBzZWVtcyB5b3UgYXJlIG5lc3RpbmcgcmVjdXJzaXZlbHkga2V5OiAke2FyZ3NbMF19IGluIGtleTogJHtrZXlbMF19YCk7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF90aGlzLnRyYW5zbGF0ZSguLi5hcmdzLCBrZXkpO1xuICAgICAgfSwgb3B0aW9ucyk7XG4gICAgICBpZiAob3B0aW9ucy5pbnRlcnBvbGF0aW9uKSB0aGlzLmludGVycG9sYXRvci5yZXNldCgpO1xuICAgIH1cbiAgICBjb25zdCBwb3N0UHJvY2VzcyA9IG9wdGlvbnMucG9zdFByb2Nlc3MgfHwgdGhpcy5vcHRpb25zLnBvc3RQcm9jZXNzO1xuICAgIGNvbnN0IHBvc3RQcm9jZXNzb3JOYW1lcyA9IHR5cGVvZiBwb3N0UHJvY2VzcyA9PT0gJ3N0cmluZycgPyBbcG9zdFByb2Nlc3NdIDogcG9zdFByb2Nlc3M7XG4gICAgaWYgKHJlcyAhPT0gdW5kZWZpbmVkICYmIHJlcyAhPT0gbnVsbCAmJiBwb3N0UHJvY2Vzc29yTmFtZXMgJiYgcG9zdFByb2Nlc3Nvck5hbWVzLmxlbmd0aCAmJiBvcHRpb25zLmFwcGx5UG9zdFByb2Nlc3NvciAhPT0gZmFsc2UpIHtcbiAgICAgIHJlcyA9IHBvc3RQcm9jZXNzb3IuaGFuZGxlKHBvc3RQcm9jZXNzb3JOYW1lcywgcmVzLCBrZXksIHRoaXMub3B0aW9ucyAmJiB0aGlzLm9wdGlvbnMucG9zdFByb2Nlc3NQYXNzUmVzb2x2ZWQgPyB7XG4gICAgICAgIGkxOG5SZXNvbHZlZDoge1xuICAgICAgICAgIC4uLnJlc29sdmVkLFxuICAgICAgICAgIHVzZWRQYXJhbXM6IHRoaXMuZ2V0VXNlZFBhcmFtc0RldGFpbHMob3B0aW9ucylcbiAgICAgICAgfSxcbiAgICAgICAgLi4ub3B0aW9uc1xuICAgICAgfSA6IG9wdGlvbnMsIHRoaXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xuICB9XG4gIHJlc29sdmUoa2V5cykge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB7fTtcbiAgICBsZXQgZm91bmQ7XG4gICAgbGV0IHVzZWRLZXk7XG4gICAgbGV0IGV4YWN0VXNlZEtleTtcbiAgICBsZXQgdXNlZExuZztcbiAgICBsZXQgdXNlZE5TO1xuICAgIGlmICh0eXBlb2Yga2V5cyA9PT0gJ3N0cmluZycpIGtleXMgPSBba2V5c107XG4gICAga2V5cy5mb3JFYWNoKGsgPT4ge1xuICAgICAgaWYgKHRoaXMuaXNWYWxpZExvb2t1cChmb3VuZCkpIHJldHVybjtcbiAgICAgIGNvbnN0IGV4dHJhY3RlZCA9IHRoaXMuZXh0cmFjdEZyb21LZXkoaywgb3B0aW9ucyk7XG4gICAgICBjb25zdCBrZXkgPSBleHRyYWN0ZWQua2V5O1xuICAgICAgdXNlZEtleSA9IGtleTtcbiAgICAgIGxldCBuYW1lc3BhY2VzID0gZXh0cmFjdGVkLm5hbWVzcGFjZXM7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmZhbGxiYWNrTlMpIG5hbWVzcGFjZXMgPSBuYW1lc3BhY2VzLmNvbmNhdCh0aGlzLm9wdGlvbnMuZmFsbGJhY2tOUyk7XG4gICAgICBjb25zdCBuZWVkc1BsdXJhbEhhbmRsaW5nID0gb3B0aW9ucy5jb3VudCAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBvcHRpb25zLmNvdW50ICE9PSAnc3RyaW5nJztcbiAgICAgIGNvbnN0IG5lZWRzWmVyb1N1ZmZpeExvb2t1cCA9IG5lZWRzUGx1cmFsSGFuZGxpbmcgJiYgIW9wdGlvbnMub3JkaW5hbCAmJiBvcHRpb25zLmNvdW50ID09PSAwICYmIHRoaXMucGx1cmFsUmVzb2x2ZXIuc2hvdWxkVXNlSW50bEFwaSgpO1xuICAgICAgY29uc3QgbmVlZHNDb250ZXh0SGFuZGxpbmcgPSBvcHRpb25zLmNvbnRleHQgIT09IHVuZGVmaW5lZCAmJiAodHlwZW9mIG9wdGlvbnMuY29udGV4dCA9PT0gJ3N0cmluZycgfHwgdHlwZW9mIG9wdGlvbnMuY29udGV4dCA9PT0gJ251bWJlcicpICYmIG9wdGlvbnMuY29udGV4dCAhPT0gJyc7XG4gICAgICBjb25zdCBjb2RlcyA9IG9wdGlvbnMubG5ncyA/IG9wdGlvbnMubG5ncyA6IHRoaXMubGFuZ3VhZ2VVdGlscy50b1Jlc29sdmVIaWVyYXJjaHkob3B0aW9ucy5sbmcgfHwgdGhpcy5sYW5ndWFnZSwgb3B0aW9ucy5mYWxsYmFja0xuZyk7XG4gICAgICBuYW1lc3BhY2VzLmZvckVhY2gobnMgPT4ge1xuICAgICAgICBpZiAodGhpcy5pc1ZhbGlkTG9va3VwKGZvdW5kKSkgcmV0dXJuO1xuICAgICAgICB1c2VkTlMgPSBucztcbiAgICAgICAgaWYgKCFjaGVja2VkTG9hZGVkRm9yW2Ake2NvZGVzWzBdfS0ke25zfWBdICYmIHRoaXMudXRpbHMgJiYgdGhpcy51dGlscy5oYXNMb2FkZWROYW1lc3BhY2UgJiYgIXRoaXMudXRpbHMuaGFzTG9hZGVkTmFtZXNwYWNlKHVzZWROUykpIHtcbiAgICAgICAgICBjaGVja2VkTG9hZGVkRm9yW2Ake2NvZGVzWzBdfS0ke25zfWBdID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLmxvZ2dlci53YXJuKGBrZXkgXCIke3VzZWRLZXl9XCIgZm9yIGxhbmd1YWdlcyBcIiR7Y29kZXMuam9pbignLCAnKX1cIiB3b24ndCBnZXQgcmVzb2x2ZWQgYXMgbmFtZXNwYWNlIFwiJHt1c2VkTlN9XCIgd2FzIG5vdCB5ZXQgbG9hZGVkYCwgJ1RoaXMgbWVhbnMgc29tZXRoaW5nIElTIFdST05HIGluIHlvdXIgc2V0dXAuIFlvdSBhY2Nlc3MgdGhlIHQgZnVuY3Rpb24gYmVmb3JlIGkxOG5leHQuaW5pdCAvIGkxOG5leHQubG9hZE5hbWVzcGFjZSAvIGkxOG5leHQuY2hhbmdlTGFuZ3VhZ2Ugd2FzIGRvbmUuIFdhaXQgZm9yIHRoZSBjYWxsYmFjayBvciBQcm9taXNlIHRvIHJlc29sdmUgYmVmb3JlIGFjY2Vzc2luZyBpdCEhIScpO1xuICAgICAgICB9XG4gICAgICAgIGNvZGVzLmZvckVhY2goY29kZSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMuaXNWYWxpZExvb2t1cChmb3VuZCkpIHJldHVybjtcbiAgICAgICAgICB1c2VkTG5nID0gY29kZTtcbiAgICAgICAgICBjb25zdCBmaW5hbEtleXMgPSBba2V5XTtcbiAgICAgICAgICBpZiAodGhpcy5pMThuRm9ybWF0ICYmIHRoaXMuaTE4bkZvcm1hdC5hZGRMb29rdXBLZXlzKSB7XG4gICAgICAgICAgICB0aGlzLmkxOG5Gb3JtYXQuYWRkTG9va3VwS2V5cyhmaW5hbEtleXMsIGtleSwgY29kZSwgbnMsIG9wdGlvbnMpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZXQgcGx1cmFsU3VmZml4O1xuICAgICAgICAgICAgaWYgKG5lZWRzUGx1cmFsSGFuZGxpbmcpIHBsdXJhbFN1ZmZpeCA9IHRoaXMucGx1cmFsUmVzb2x2ZXIuZ2V0U3VmZml4KGNvZGUsIG9wdGlvbnMuY291bnQsIG9wdGlvbnMpO1xuICAgICAgICAgICAgY29uc3QgemVyb1N1ZmZpeCA9IGAke3RoaXMub3B0aW9ucy5wbHVyYWxTZXBhcmF0b3J9emVyb2A7XG4gICAgICAgICAgICBjb25zdCBvcmRpbmFsUHJlZml4ID0gYCR7dGhpcy5vcHRpb25zLnBsdXJhbFNlcGFyYXRvcn1vcmRpbmFsJHt0aGlzLm9wdGlvbnMucGx1cmFsU2VwYXJhdG9yfWA7XG4gICAgICAgICAgICBpZiAobmVlZHNQbHVyYWxIYW5kbGluZykge1xuICAgICAgICAgICAgICBmaW5hbEtleXMucHVzaChrZXkgKyBwbHVyYWxTdWZmaXgpO1xuICAgICAgICAgICAgICBpZiAob3B0aW9ucy5vcmRpbmFsICYmIHBsdXJhbFN1ZmZpeC5pbmRleE9mKG9yZGluYWxQcmVmaXgpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgZmluYWxLZXlzLnB1c2goa2V5ICsgcGx1cmFsU3VmZml4LnJlcGxhY2Uob3JkaW5hbFByZWZpeCwgdGhpcy5vcHRpb25zLnBsdXJhbFNlcGFyYXRvcikpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChuZWVkc1plcm9TdWZmaXhMb29rdXApIHtcbiAgICAgICAgICAgICAgICBmaW5hbEtleXMucHVzaChrZXkgKyB6ZXJvU3VmZml4KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5lZWRzQ29udGV4dEhhbmRsaW5nKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGNvbnRleHRLZXkgPSBgJHtrZXl9JHt0aGlzLm9wdGlvbnMuY29udGV4dFNlcGFyYXRvcn0ke29wdGlvbnMuY29udGV4dH1gO1xuICAgICAgICAgICAgICBmaW5hbEtleXMucHVzaChjb250ZXh0S2V5KTtcbiAgICAgICAgICAgICAgaWYgKG5lZWRzUGx1cmFsSGFuZGxpbmcpIHtcbiAgICAgICAgICAgICAgICBmaW5hbEtleXMucHVzaChjb250ZXh0S2V5ICsgcGx1cmFsU3VmZml4KTtcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5vcmRpbmFsICYmIHBsdXJhbFN1ZmZpeC5pbmRleE9mKG9yZGluYWxQcmVmaXgpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICBmaW5hbEtleXMucHVzaChjb250ZXh0S2V5ICsgcGx1cmFsU3VmZml4LnJlcGxhY2Uob3JkaW5hbFByZWZpeCwgdGhpcy5vcHRpb25zLnBsdXJhbFNlcGFyYXRvcikpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobmVlZHNaZXJvU3VmZml4TG9va3VwKSB7XG4gICAgICAgICAgICAgICAgICBmaW5hbEtleXMucHVzaChjb250ZXh0S2V5ICsgemVyb1N1ZmZpeCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGxldCBwb3NzaWJsZUtleTtcbiAgICAgICAgICB3aGlsZSAocG9zc2libGVLZXkgPSBmaW5hbEtleXMucG9wKCkpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5pc1ZhbGlkTG9va3VwKGZvdW5kKSkge1xuICAgICAgICAgICAgICBleGFjdFVzZWRLZXkgPSBwb3NzaWJsZUtleTtcbiAgICAgICAgICAgICAgZm91bmQgPSB0aGlzLmdldFJlc291cmNlKGNvZGUsIG5zLCBwb3NzaWJsZUtleSwgb3B0aW9ucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiB7XG4gICAgICByZXM6IGZvdW5kLFxuICAgICAgdXNlZEtleSxcbiAgICAgIGV4YWN0VXNlZEtleSxcbiAgICAgIHVzZWRMbmcsXG4gICAgICB1c2VkTlNcbiAgICB9O1xuICB9XG4gIGlzVmFsaWRMb29rdXAocmVzKSB7XG4gICAgcmV0dXJuIHJlcyAhPT0gdW5kZWZpbmVkICYmICEoIXRoaXMub3B0aW9ucy5yZXR1cm5OdWxsICYmIHJlcyA9PT0gbnVsbCkgJiYgISghdGhpcy5vcHRpb25zLnJldHVybkVtcHR5U3RyaW5nICYmIHJlcyA9PT0gJycpO1xuICB9XG4gIGdldFJlc291cmNlKGNvZGUsIG5zLCBrZXkpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAzICYmIGFyZ3VtZW50c1szXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzNdIDoge307XG4gICAgaWYgKHRoaXMuaTE4bkZvcm1hdCAmJiB0aGlzLmkxOG5Gb3JtYXQuZ2V0UmVzb3VyY2UpIHJldHVybiB0aGlzLmkxOG5Gb3JtYXQuZ2V0UmVzb3VyY2UoY29kZSwgbnMsIGtleSwgb3B0aW9ucyk7XG4gICAgcmV0dXJuIHRoaXMucmVzb3VyY2VTdG9yZS5nZXRSZXNvdXJjZShjb2RlLCBucywga2V5LCBvcHRpb25zKTtcbiAgfVxuICBnZXRVc2VkUGFyYW1zRGV0YWlscygpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDoge307XG4gICAgY29uc3Qgb3B0aW9uc0tleXMgPSBbJ2RlZmF1bHRWYWx1ZScsICdvcmRpbmFsJywgJ2NvbnRleHQnLCAncmVwbGFjZScsICdsbmcnLCAnbG5ncycsICdmYWxsYmFja0xuZycsICducycsICdrZXlTZXBhcmF0b3InLCAnbnNTZXBhcmF0b3InLCAncmV0dXJuT2JqZWN0cycsICdyZXR1cm5EZXRhaWxzJywgJ2pvaW5BcnJheXMnLCAncG9zdFByb2Nlc3MnLCAnaW50ZXJwb2xhdGlvbiddO1xuICAgIGNvbnN0IHVzZU9wdGlvbnNSZXBsYWNlRm9yRGF0YSA9IG9wdGlvbnMucmVwbGFjZSAmJiB0eXBlb2Ygb3B0aW9ucy5yZXBsYWNlICE9PSAnc3RyaW5nJztcbiAgICBsZXQgZGF0YSA9IHVzZU9wdGlvbnNSZXBsYWNlRm9yRGF0YSA/IG9wdGlvbnMucmVwbGFjZSA6IG9wdGlvbnM7XG4gICAgaWYgKHVzZU9wdGlvbnNSZXBsYWNlRm9yRGF0YSAmJiB0eXBlb2Ygb3B0aW9ucy5jb3VudCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGRhdGEuY291bnQgPSBvcHRpb25zLmNvdW50O1xuICAgIH1cbiAgICBpZiAodGhpcy5vcHRpb25zLmludGVycG9sYXRpb24uZGVmYXVsdFZhcmlhYmxlcykge1xuICAgICAgZGF0YSA9IHtcbiAgICAgICAgLi4udGhpcy5vcHRpb25zLmludGVycG9sYXRpb24uZGVmYXVsdFZhcmlhYmxlcyxcbiAgICAgICAgLi4uZGF0YVxuICAgICAgfTtcbiAgICB9XG4gICAgaWYgKCF1c2VPcHRpb25zUmVwbGFjZUZvckRhdGEpIHtcbiAgICAgIGRhdGEgPSB7XG4gICAgICAgIC4uLmRhdGFcbiAgICAgIH07XG4gICAgICBmb3IgKGNvbnN0IGtleSBvZiBvcHRpb25zS2V5cykge1xuICAgICAgICBkZWxldGUgZGF0YVtrZXldO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZGF0YTtcbiAgfVxuICBzdGF0aWMgaGFzRGVmYXVsdFZhbHVlKG9wdGlvbnMpIHtcbiAgICBjb25zdCBwcmVmaXggPSAnZGVmYXVsdFZhbHVlJztcbiAgICBmb3IgKGNvbnN0IG9wdGlvbiBpbiBvcHRpb25zKSB7XG4gICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9wdGlvbnMsIG9wdGlvbikgJiYgcHJlZml4ID09PSBvcHRpb24uc3Vic3RyaW5nKDAsIHByZWZpeC5sZW5ndGgpICYmIHVuZGVmaW5lZCAhPT0gb3B0aW9uc1tvcHRpb25dKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuY29uc3QgY2FwaXRhbGl6ZSA9IHN0cmluZyA9PiBzdHJpbmcuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHJpbmcuc2xpY2UoMSk7XG5jbGFzcyBMYW5ndWFnZVV0aWwge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLnN1cHBvcnRlZExuZ3MgPSB0aGlzLm9wdGlvbnMuc3VwcG9ydGVkTG5ncyB8fCBmYWxzZTtcbiAgICB0aGlzLmxvZ2dlciA9IGJhc2VMb2dnZXIuY3JlYXRlKCdsYW5ndWFnZVV0aWxzJyk7XG4gIH1cbiAgZ2V0U2NyaXB0UGFydEZyb21Db2RlKGNvZGUpIHtcbiAgICBjb2RlID0gZ2V0Q2xlYW5lZENvZGUoY29kZSk7XG4gICAgaWYgKCFjb2RlIHx8IGNvZGUuaW5kZXhPZignLScpIDwgMCkgcmV0dXJuIG51bGw7XG4gICAgY29uc3QgcCA9IGNvZGUuc3BsaXQoJy0nKTtcbiAgICBpZiAocC5sZW5ndGggPT09IDIpIHJldHVybiBudWxsO1xuICAgIHAucG9wKCk7XG4gICAgaWYgKHBbcC5sZW5ndGggLSAxXS50b0xvd2VyQ2FzZSgpID09PSAneCcpIHJldHVybiBudWxsO1xuICAgIHJldHVybiB0aGlzLmZvcm1hdExhbmd1YWdlQ29kZShwLmpvaW4oJy0nKSk7XG4gIH1cbiAgZ2V0TGFuZ3VhZ2VQYXJ0RnJvbUNvZGUoY29kZSkge1xuICAgIGNvZGUgPSBnZXRDbGVhbmVkQ29kZShjb2RlKTtcbiAgICBpZiAoIWNvZGUgfHwgY29kZS5pbmRleE9mKCctJykgPCAwKSByZXR1cm4gY29kZTtcbiAgICBjb25zdCBwID0gY29kZS5zcGxpdCgnLScpO1xuICAgIHJldHVybiB0aGlzLmZvcm1hdExhbmd1YWdlQ29kZShwWzBdKTtcbiAgfVxuICBmb3JtYXRMYW5ndWFnZUNvZGUoY29kZSkge1xuICAgIGlmICh0eXBlb2YgY29kZSA9PT0gJ3N0cmluZycgJiYgY29kZS5pbmRleE9mKCctJykgPiAtMSkge1xuICAgICAgY29uc3Qgc3BlY2lhbENhc2VzID0gWydoYW5zJywgJ2hhbnQnLCAnbGF0bicsICdjeXJsJywgJ2NhbnMnLCAnbW9uZycsICdhcmFiJ107XG4gICAgICBsZXQgcCA9IGNvZGUuc3BsaXQoJy0nKTtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMubG93ZXJDYXNlTG5nKSB7XG4gICAgICAgIHAgPSBwLm1hcChwYXJ0ID0+IHBhcnQudG9Mb3dlckNhc2UoKSk7XG4gICAgICB9IGVsc2UgaWYgKHAubGVuZ3RoID09PSAyKSB7XG4gICAgICAgIHBbMF0gPSBwWzBdLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIHBbMV0gPSBwWzFdLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgIGlmIChzcGVjaWFsQ2FzZXMuaW5kZXhPZihwWzFdLnRvTG93ZXJDYXNlKCkpID4gLTEpIHBbMV0gPSBjYXBpdGFsaXplKHBbMV0udG9Mb3dlckNhc2UoKSk7XG4gICAgICB9IGVsc2UgaWYgKHAubGVuZ3RoID09PSAzKSB7XG4gICAgICAgIHBbMF0gPSBwWzBdLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGlmIChwWzFdLmxlbmd0aCA9PT0gMikgcFsxXSA9IHBbMV0udG9VcHBlckNhc2UoKTtcbiAgICAgICAgaWYgKHBbMF0gIT09ICdzZ24nICYmIHBbMl0ubGVuZ3RoID09PSAyKSBwWzJdID0gcFsyXS50b1VwcGVyQ2FzZSgpO1xuICAgICAgICBpZiAoc3BlY2lhbENhc2VzLmluZGV4T2YocFsxXS50b0xvd2VyQ2FzZSgpKSA+IC0xKSBwWzFdID0gY2FwaXRhbGl6ZShwWzFdLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgICBpZiAoc3BlY2lhbENhc2VzLmluZGV4T2YocFsyXS50b0xvd2VyQ2FzZSgpKSA+IC0xKSBwWzJdID0gY2FwaXRhbGl6ZShwWzJdLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHAuam9pbignLScpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLmNsZWFuQ29kZSB8fCB0aGlzLm9wdGlvbnMubG93ZXJDYXNlTG5nID8gY29kZS50b0xvd2VyQ2FzZSgpIDogY29kZTtcbiAgfVxuICBpc1N1cHBvcnRlZENvZGUoY29kZSkge1xuICAgIGlmICh0aGlzLm9wdGlvbnMubG9hZCA9PT0gJ2xhbmd1YWdlT25seScgfHwgdGhpcy5vcHRpb25zLm5vbkV4cGxpY2l0U3VwcG9ydGVkTG5ncykge1xuICAgICAgY29kZSA9IHRoaXMuZ2V0TGFuZ3VhZ2VQYXJ0RnJvbUNvZGUoY29kZSk7XG4gICAgfVxuICAgIHJldHVybiAhdGhpcy5zdXBwb3J0ZWRMbmdzIHx8ICF0aGlzLnN1cHBvcnRlZExuZ3MubGVuZ3RoIHx8IHRoaXMuc3VwcG9ydGVkTG5ncy5pbmRleE9mKGNvZGUpID4gLTE7XG4gIH1cbiAgZ2V0QmVzdE1hdGNoRnJvbUNvZGVzKGNvZGVzKSB7XG4gICAgaWYgKCFjb2RlcykgcmV0dXJuIG51bGw7XG4gICAgbGV0IGZvdW5kO1xuICAgIGNvZGVzLmZvckVhY2goY29kZSA9PiB7XG4gICAgICBpZiAoZm91bmQpIHJldHVybjtcbiAgICAgIGNvbnN0IGNsZWFuZWRMbmcgPSB0aGlzLmZvcm1hdExhbmd1YWdlQ29kZShjb2RlKTtcbiAgICAgIGlmICghdGhpcy5vcHRpb25zLnN1cHBvcnRlZExuZ3MgfHwgdGhpcy5pc1N1cHBvcnRlZENvZGUoY2xlYW5lZExuZykpIGZvdW5kID0gY2xlYW5lZExuZztcbiAgICB9KTtcbiAgICBpZiAoIWZvdW5kICYmIHRoaXMub3B0aW9ucy5zdXBwb3J0ZWRMbmdzKSB7XG4gICAgICBjb2Rlcy5mb3JFYWNoKGNvZGUgPT4ge1xuICAgICAgICBpZiAoZm91bmQpIHJldHVybjtcbiAgICAgICAgY29uc3QgbG5nT25seSA9IHRoaXMuZ2V0TGFuZ3VhZ2VQYXJ0RnJvbUNvZGUoY29kZSk7XG4gICAgICAgIGlmICh0aGlzLmlzU3VwcG9ydGVkQ29kZShsbmdPbmx5KSkgcmV0dXJuIGZvdW5kID0gbG5nT25seTtcbiAgICAgICAgZm91bmQgPSB0aGlzLm9wdGlvbnMuc3VwcG9ydGVkTG5ncy5maW5kKHN1cHBvcnRlZExuZyA9PiB7XG4gICAgICAgICAgaWYgKHN1cHBvcnRlZExuZyA9PT0gbG5nT25seSkgcmV0dXJuIHN1cHBvcnRlZExuZztcbiAgICAgICAgICBpZiAoc3VwcG9ydGVkTG5nLmluZGV4T2YoJy0nKSA8IDAgJiYgbG5nT25seS5pbmRleE9mKCctJykgPCAwKSByZXR1cm47XG4gICAgICAgICAgaWYgKHN1cHBvcnRlZExuZy5pbmRleE9mKCctJykgPiAwICYmIGxuZ09ubHkuaW5kZXhPZignLScpIDwgMCAmJiBzdXBwb3J0ZWRMbmcuc3Vic3RyaW5nKDAsIHN1cHBvcnRlZExuZy5pbmRleE9mKCctJykpID09PSBsbmdPbmx5KSByZXR1cm4gc3VwcG9ydGVkTG5nO1xuICAgICAgICAgIGlmIChzdXBwb3J0ZWRMbmcuaW5kZXhPZihsbmdPbmx5KSA9PT0gMCAmJiBsbmdPbmx5Lmxlbmd0aCA+IDEpIHJldHVybiBzdXBwb3J0ZWRMbmc7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGlmICghZm91bmQpIGZvdW5kID0gdGhpcy5nZXRGYWxsYmFja0NvZGVzKHRoaXMub3B0aW9ucy5mYWxsYmFja0xuZylbMF07XG4gICAgcmV0dXJuIGZvdW5kO1xuICB9XG4gIGdldEZhbGxiYWNrQ29kZXMoZmFsbGJhY2tzLCBjb2RlKSB7XG4gICAgaWYgKCFmYWxsYmFja3MpIHJldHVybiBbXTtcbiAgICBpZiAodHlwZW9mIGZhbGxiYWNrcyA9PT0gJ2Z1bmN0aW9uJykgZmFsbGJhY2tzID0gZmFsbGJhY2tzKGNvZGUpO1xuICAgIGlmICh0eXBlb2YgZmFsbGJhY2tzID09PSAnc3RyaW5nJykgZmFsbGJhY2tzID0gW2ZhbGxiYWNrc107XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZmFsbGJhY2tzKSkgcmV0dXJuIGZhbGxiYWNrcztcbiAgICBpZiAoIWNvZGUpIHJldHVybiBmYWxsYmFja3MuZGVmYXVsdCB8fCBbXTtcbiAgICBsZXQgZm91bmQgPSBmYWxsYmFja3NbY29kZV07XG4gICAgaWYgKCFmb3VuZCkgZm91bmQgPSBmYWxsYmFja3NbdGhpcy5nZXRTY3JpcHRQYXJ0RnJvbUNvZGUoY29kZSldO1xuICAgIGlmICghZm91bmQpIGZvdW5kID0gZmFsbGJhY2tzW3RoaXMuZm9ybWF0TGFuZ3VhZ2VDb2RlKGNvZGUpXTtcbiAgICBpZiAoIWZvdW5kKSBmb3VuZCA9IGZhbGxiYWNrc1t0aGlzLmdldExhbmd1YWdlUGFydEZyb21Db2RlKGNvZGUpXTtcbiAgICBpZiAoIWZvdW5kKSBmb3VuZCA9IGZhbGxiYWNrcy5kZWZhdWx0O1xuICAgIHJldHVybiBmb3VuZCB8fCBbXTtcbiAgfVxuICB0b1Jlc29sdmVIaWVyYXJjaHkoY29kZSwgZmFsbGJhY2tDb2RlKSB7XG4gICAgY29uc3QgZmFsbGJhY2tDb2RlcyA9IHRoaXMuZ2V0RmFsbGJhY2tDb2RlcyhmYWxsYmFja0NvZGUgfHwgdGhpcy5vcHRpb25zLmZhbGxiYWNrTG5nIHx8IFtdLCBjb2RlKTtcbiAgICBjb25zdCBjb2RlcyA9IFtdO1xuICAgIGNvbnN0IGFkZENvZGUgPSBjID0+IHtcbiAgICAgIGlmICghYykgcmV0dXJuO1xuICAgICAgaWYgKHRoaXMuaXNTdXBwb3J0ZWRDb2RlKGMpKSB7XG4gICAgICAgIGNvZGVzLnB1c2goYyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmxvZ2dlci53YXJuKGByZWplY3RpbmcgbGFuZ3VhZ2UgY29kZSBub3QgZm91bmQgaW4gc3VwcG9ydGVkTG5nczogJHtjfWApO1xuICAgICAgfVxuICAgIH07XG4gICAgaWYgKHR5cGVvZiBjb2RlID09PSAnc3RyaW5nJyAmJiAoY29kZS5pbmRleE9mKCctJykgPiAtMSB8fCBjb2RlLmluZGV4T2YoJ18nKSA+IC0xKSkge1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5sb2FkICE9PSAnbGFuZ3VhZ2VPbmx5JykgYWRkQ29kZSh0aGlzLmZvcm1hdExhbmd1YWdlQ29kZShjb2RlKSk7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmxvYWQgIT09ICdsYW5ndWFnZU9ubHknICYmIHRoaXMub3B0aW9ucy5sb2FkICE9PSAnY3VycmVudE9ubHknKSBhZGRDb2RlKHRoaXMuZ2V0U2NyaXB0UGFydEZyb21Db2RlKGNvZGUpKTtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMubG9hZCAhPT0gJ2N1cnJlbnRPbmx5JykgYWRkQ29kZSh0aGlzLmdldExhbmd1YWdlUGFydEZyb21Db2RlKGNvZGUpKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBjb2RlID09PSAnc3RyaW5nJykge1xuICAgICAgYWRkQ29kZSh0aGlzLmZvcm1hdExhbmd1YWdlQ29kZShjb2RlKSk7XG4gICAgfVxuICAgIGZhbGxiYWNrQ29kZXMuZm9yRWFjaChmYyA9PiB7XG4gICAgICBpZiAoY29kZXMuaW5kZXhPZihmYykgPCAwKSBhZGRDb2RlKHRoaXMuZm9ybWF0TGFuZ3VhZ2VDb2RlKGZjKSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGNvZGVzO1xuICB9XG59XG5cbmxldCBzZXRzID0gW3tcbiAgbG5nczogWydhY2gnLCAnYWsnLCAnYW0nLCAnYXJuJywgJ2JyJywgJ2ZpbCcsICdndW4nLCAnbG4nLCAnbWZlJywgJ21nJywgJ21pJywgJ29jJywgJ3B0JywgJ3B0LUJSJywgJ3RnJywgJ3RsJywgJ3RpJywgJ3RyJywgJ3V6JywgJ3dhJ10sXG4gIG5yOiBbMSwgMl0sXG4gIGZjOiAxXG59LCB7XG4gIGxuZ3M6IFsnYWYnLCAnYW4nLCAnYXN0JywgJ2F6JywgJ2JnJywgJ2JuJywgJ2NhJywgJ2RhJywgJ2RlJywgJ2RldicsICdlbCcsICdlbicsICdlbycsICdlcycsICdldCcsICdldScsICdmaScsICdmbycsICdmdXInLCAnZnknLCAnZ2wnLCAnZ3UnLCAnaGEnLCAnaGknLCAnaHUnLCAnaHknLCAnaWEnLCAnaXQnLCAna2snLCAna24nLCAna3UnLCAnbGInLCAnbWFpJywgJ21sJywgJ21uJywgJ21yJywgJ25haCcsICduYXAnLCAnbmInLCAnbmUnLCAnbmwnLCAnbm4nLCAnbm8nLCAnbnNvJywgJ3BhJywgJ3BhcCcsICdwbXMnLCAncHMnLCAncHQtUFQnLCAncm0nLCAnc2NvJywgJ3NlJywgJ3NpJywgJ3NvJywgJ3NvbicsICdzcScsICdzdicsICdzdycsICd0YScsICd0ZScsICd0aycsICd1cicsICd5byddLFxuICBucjogWzEsIDJdLFxuICBmYzogMlxufSwge1xuICBsbmdzOiBbJ2F5JywgJ2JvJywgJ2NnZycsICdmYScsICdodCcsICdpZCcsICdqYScsICdqYm8nLCAna2EnLCAna20nLCAna28nLCAna3knLCAnbG8nLCAnbXMnLCAnc2FoJywgJ3N1JywgJ3RoJywgJ3R0JywgJ3VnJywgJ3ZpJywgJ3dvJywgJ3poJ10sXG4gIG5yOiBbMV0sXG4gIGZjOiAzXG59LCB7XG4gIGxuZ3M6IFsnYmUnLCAnYnMnLCAnY25yJywgJ2R6JywgJ2hyJywgJ3J1JywgJ3NyJywgJ3VrJ10sXG4gIG5yOiBbMSwgMiwgNV0sXG4gIGZjOiA0XG59LCB7XG4gIGxuZ3M6IFsnYXInXSxcbiAgbnI6IFswLCAxLCAyLCAzLCAxMSwgMTAwXSxcbiAgZmM6IDVcbn0sIHtcbiAgbG5nczogWydjcycsICdzayddLFxuICBucjogWzEsIDIsIDVdLFxuICBmYzogNlxufSwge1xuICBsbmdzOiBbJ2NzYicsICdwbCddLFxuICBucjogWzEsIDIsIDVdLFxuICBmYzogN1xufSwge1xuICBsbmdzOiBbJ2N5J10sXG4gIG5yOiBbMSwgMiwgMywgOF0sXG4gIGZjOiA4XG59LCB7XG4gIGxuZ3M6IFsnZnInXSxcbiAgbnI6IFsxLCAyXSxcbiAgZmM6IDlcbn0sIHtcbiAgbG5nczogWydnYSddLFxuICBucjogWzEsIDIsIDMsIDcsIDExXSxcbiAgZmM6IDEwXG59LCB7XG4gIGxuZ3M6IFsnZ2QnXSxcbiAgbnI6IFsxLCAyLCAzLCAyMF0sXG4gIGZjOiAxMVxufSwge1xuICBsbmdzOiBbJ2lzJ10sXG4gIG5yOiBbMSwgMl0sXG4gIGZjOiAxMlxufSwge1xuICBsbmdzOiBbJ2p2J10sXG4gIG5yOiBbMCwgMV0sXG4gIGZjOiAxM1xufSwge1xuICBsbmdzOiBbJ2t3J10sXG4gIG5yOiBbMSwgMiwgMywgNF0sXG4gIGZjOiAxNFxufSwge1xuICBsbmdzOiBbJ2x0J10sXG4gIG5yOiBbMSwgMiwgMTBdLFxuICBmYzogMTVcbn0sIHtcbiAgbG5nczogWydsdiddLFxuICBucjogWzEsIDIsIDBdLFxuICBmYzogMTZcbn0sIHtcbiAgbG5nczogWydtayddLFxuICBucjogWzEsIDJdLFxuICBmYzogMTdcbn0sIHtcbiAgbG5nczogWydtbmsnXSxcbiAgbnI6IFswLCAxLCAyXSxcbiAgZmM6IDE4XG59LCB7XG4gIGxuZ3M6IFsnbXQnXSxcbiAgbnI6IFsxLCAyLCAxMSwgMjBdLFxuICBmYzogMTlcbn0sIHtcbiAgbG5nczogWydvciddLFxuICBucjogWzIsIDFdLFxuICBmYzogMlxufSwge1xuICBsbmdzOiBbJ3JvJ10sXG4gIG5yOiBbMSwgMiwgMjBdLFxuICBmYzogMjBcbn0sIHtcbiAgbG5nczogWydzbCddLFxuICBucjogWzUsIDEsIDIsIDNdLFxuICBmYzogMjFcbn0sIHtcbiAgbG5nczogWydoZScsICdpdyddLFxuICBucjogWzEsIDIsIDIwLCAyMV0sXG4gIGZjOiAyMlxufV07XG5sZXQgX3J1bGVzUGx1cmFsc1R5cGVzID0ge1xuICAxOiBuID0+IE51bWJlcihuID4gMSksXG4gIDI6IG4gPT4gTnVtYmVyKG4gIT0gMSksXG4gIDM6IG4gPT4gMCxcbiAgNDogbiA9PiBOdW1iZXIobiAlIDEwID09IDEgJiYgbiAlIDEwMCAhPSAxMSA/IDAgOiBuICUgMTAgPj0gMiAmJiBuICUgMTAgPD0gNCAmJiAobiAlIDEwMCA8IDEwIHx8IG4gJSAxMDAgPj0gMjApID8gMSA6IDIpLFxuICA1OiBuID0+IE51bWJlcihuID09IDAgPyAwIDogbiA9PSAxID8gMSA6IG4gPT0gMiA/IDIgOiBuICUgMTAwID49IDMgJiYgbiAlIDEwMCA8PSAxMCA/IDMgOiBuICUgMTAwID49IDExID8gNCA6IDUpLFxuICA2OiBuID0+IE51bWJlcihuID09IDEgPyAwIDogbiA+PSAyICYmIG4gPD0gNCA/IDEgOiAyKSxcbiAgNzogbiA9PiBOdW1iZXIobiA9PSAxID8gMCA6IG4gJSAxMCA+PSAyICYmIG4gJSAxMCA8PSA0ICYmIChuICUgMTAwIDwgMTAgfHwgbiAlIDEwMCA+PSAyMCkgPyAxIDogMiksXG4gIDg6IG4gPT4gTnVtYmVyKG4gPT0gMSA/IDAgOiBuID09IDIgPyAxIDogbiAhPSA4ICYmIG4gIT0gMTEgPyAyIDogMyksXG4gIDk6IG4gPT4gTnVtYmVyKG4gPj0gMiksXG4gIDEwOiBuID0+IE51bWJlcihuID09IDEgPyAwIDogbiA9PSAyID8gMSA6IG4gPCA3ID8gMiA6IG4gPCAxMSA/IDMgOiA0KSxcbiAgMTE6IG4gPT4gTnVtYmVyKG4gPT0gMSB8fCBuID09IDExID8gMCA6IG4gPT0gMiB8fCBuID09IDEyID8gMSA6IG4gPiAyICYmIG4gPCAyMCA/IDIgOiAzKSxcbiAgMTI6IG4gPT4gTnVtYmVyKG4gJSAxMCAhPSAxIHx8IG4gJSAxMDAgPT0gMTEpLFxuICAxMzogbiA9PiBOdW1iZXIobiAhPT0gMCksXG4gIDE0OiBuID0+IE51bWJlcihuID09IDEgPyAwIDogbiA9PSAyID8gMSA6IG4gPT0gMyA/IDIgOiAzKSxcbiAgMTU6IG4gPT4gTnVtYmVyKG4gJSAxMCA9PSAxICYmIG4gJSAxMDAgIT0gMTEgPyAwIDogbiAlIDEwID49IDIgJiYgKG4gJSAxMDAgPCAxMCB8fCBuICUgMTAwID49IDIwKSA/IDEgOiAyKSxcbiAgMTY6IG4gPT4gTnVtYmVyKG4gJSAxMCA9PSAxICYmIG4gJSAxMDAgIT0gMTEgPyAwIDogbiAhPT0gMCA/IDEgOiAyKSxcbiAgMTc6IG4gPT4gTnVtYmVyKG4gPT0gMSB8fCBuICUgMTAgPT0gMSAmJiBuICUgMTAwICE9IDExID8gMCA6IDEpLFxuICAxODogbiA9PiBOdW1iZXIobiA9PSAwID8gMCA6IG4gPT0gMSA/IDEgOiAyKSxcbiAgMTk6IG4gPT4gTnVtYmVyKG4gPT0gMSA/IDAgOiBuID09IDAgfHwgbiAlIDEwMCA+IDEgJiYgbiAlIDEwMCA8IDExID8gMSA6IG4gJSAxMDAgPiAxMCAmJiBuICUgMTAwIDwgMjAgPyAyIDogMyksXG4gIDIwOiBuID0+IE51bWJlcihuID09IDEgPyAwIDogbiA9PSAwIHx8IG4gJSAxMDAgPiAwICYmIG4gJSAxMDAgPCAyMCA/IDEgOiAyKSxcbiAgMjE6IG4gPT4gTnVtYmVyKG4gJSAxMDAgPT0gMSA/IDEgOiBuICUgMTAwID09IDIgPyAyIDogbiAlIDEwMCA9PSAzIHx8IG4gJSAxMDAgPT0gNCA/IDMgOiAwKSxcbiAgMjI6IG4gPT4gTnVtYmVyKG4gPT0gMSA/IDAgOiBuID09IDIgPyAxIDogKG4gPCAwIHx8IG4gPiAxMCkgJiYgbiAlIDEwID09IDAgPyAyIDogMylcbn07XG5jb25zdCBub25JbnRsVmVyc2lvbnMgPSBbJ3YxJywgJ3YyJywgJ3YzJ107XG5jb25zdCBpbnRsVmVyc2lvbnMgPSBbJ3Y0J107XG5jb25zdCBzdWZmaXhlc09yZGVyID0ge1xuICB6ZXJvOiAwLFxuICBvbmU6IDEsXG4gIHR3bzogMixcbiAgZmV3OiAzLFxuICBtYW55OiA0LFxuICBvdGhlcjogNVxufTtcbmNvbnN0IGNyZWF0ZVJ1bGVzID0gKCkgPT4ge1xuICBjb25zdCBydWxlcyA9IHt9O1xuICBzZXRzLmZvckVhY2goc2V0ID0+IHtcbiAgICBzZXQubG5ncy5mb3JFYWNoKGwgPT4ge1xuICAgICAgcnVsZXNbbF0gPSB7XG4gICAgICAgIG51bWJlcnM6IHNldC5ucixcbiAgICAgICAgcGx1cmFsczogX3J1bGVzUGx1cmFsc1R5cGVzW3NldC5mY11cbiAgICAgIH07XG4gICAgfSk7XG4gIH0pO1xuICByZXR1cm4gcnVsZXM7XG59O1xuY2xhc3MgUGx1cmFsUmVzb2x2ZXIge1xuICBjb25zdHJ1Y3RvcihsYW5ndWFnZVV0aWxzKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IHt9O1xuICAgIHRoaXMubGFuZ3VhZ2VVdGlscyA9IGxhbmd1YWdlVXRpbHM7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLmxvZ2dlciA9IGJhc2VMb2dnZXIuY3JlYXRlKCdwbHVyYWxSZXNvbHZlcicpO1xuICAgIGlmICgoIXRoaXMub3B0aW9ucy5jb21wYXRpYmlsaXR5SlNPTiB8fCBpbnRsVmVyc2lvbnMuaW5jbHVkZXModGhpcy5vcHRpb25zLmNvbXBhdGliaWxpdHlKU09OKSkgJiYgKHR5cGVvZiBJbnRsID09PSAndW5kZWZpbmVkJyB8fCAhSW50bC5QbHVyYWxSdWxlcykpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5jb21wYXRpYmlsaXR5SlNPTiA9ICd2Myc7XG4gICAgICB0aGlzLmxvZ2dlci5lcnJvcignWW91ciBlbnZpcm9ubWVudCBzZWVtcyBub3QgdG8gYmUgSW50bCBBUEkgY29tcGF0aWJsZSwgdXNlIGFuIEludGwuUGx1cmFsUnVsZXMgcG9seWZpbGwuIFdpbGwgZmFsbGJhY2sgdG8gdGhlIGNvbXBhdGliaWxpdHlKU09OIHYzIGZvcm1hdCBoYW5kbGluZy4nKTtcbiAgICB9XG4gICAgdGhpcy5ydWxlcyA9IGNyZWF0ZVJ1bGVzKCk7XG4gIH1cbiAgYWRkUnVsZShsbmcsIG9iaikge1xuICAgIHRoaXMucnVsZXNbbG5nXSA9IG9iajtcbiAgfVxuICBnZXRSdWxlKGNvZGUpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge307XG4gICAgaWYgKHRoaXMuc2hvdWxkVXNlSW50bEFwaSgpKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gbmV3IEludGwuUGx1cmFsUnVsZXMoZ2V0Q2xlYW5lZENvZGUoY29kZSA9PT0gJ2RldicgPyAnZW4nIDogY29kZSksIHtcbiAgICAgICAgICB0eXBlOiBvcHRpb25zLm9yZGluYWwgPyAnb3JkaW5hbCcgOiAnY2FyZGluYWwnXG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXMucnVsZXNbY29kZV0gfHwgdGhpcy5ydWxlc1t0aGlzLmxhbmd1YWdlVXRpbHMuZ2V0TGFuZ3VhZ2VQYXJ0RnJvbUNvZGUoY29kZSldO1xuICB9XG4gIG5lZWRzUGx1cmFsKGNvZGUpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge307XG4gICAgY29uc3QgcnVsZSA9IHRoaXMuZ2V0UnVsZShjb2RlLCBvcHRpb25zKTtcbiAgICBpZiAodGhpcy5zaG91bGRVc2VJbnRsQXBpKCkpIHtcbiAgICAgIHJldHVybiBydWxlICYmIHJ1bGUucmVzb2x2ZWRPcHRpb25zKCkucGx1cmFsQ2F0ZWdvcmllcy5sZW5ndGggPiAxO1xuICAgIH1cbiAgICByZXR1cm4gcnVsZSAmJiBydWxlLm51bWJlcnMubGVuZ3RoID4gMTtcbiAgfVxuICBnZXRQbHVyYWxGb3Jtc09mS2V5KGNvZGUsIGtleSkge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMl0gOiB7fTtcbiAgICByZXR1cm4gdGhpcy5nZXRTdWZmaXhlcyhjb2RlLCBvcHRpb25zKS5tYXAoc3VmZml4ID0+IGAke2tleX0ke3N1ZmZpeH1gKTtcbiAgfVxuICBnZXRTdWZmaXhlcyhjb2RlKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IHt9O1xuICAgIGNvbnN0IHJ1bGUgPSB0aGlzLmdldFJ1bGUoY29kZSwgb3B0aW9ucyk7XG4gICAgaWYgKCFydWxlKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIGlmICh0aGlzLnNob3VsZFVzZUludGxBcGkoKSkge1xuICAgICAgcmV0dXJuIHJ1bGUucmVzb2x2ZWRPcHRpb25zKCkucGx1cmFsQ2F0ZWdvcmllcy5zb3J0KChwbHVyYWxDYXRlZ29yeTEsIHBsdXJhbENhdGVnb3J5MikgPT4gc3VmZml4ZXNPcmRlcltwbHVyYWxDYXRlZ29yeTFdIC0gc3VmZml4ZXNPcmRlcltwbHVyYWxDYXRlZ29yeTJdKS5tYXAocGx1cmFsQ2F0ZWdvcnkgPT4gYCR7dGhpcy5vcHRpb25zLnByZXBlbmR9JHtvcHRpb25zLm9yZGluYWwgPyBgb3JkaW5hbCR7dGhpcy5vcHRpb25zLnByZXBlbmR9YCA6ICcnfSR7cGx1cmFsQ2F0ZWdvcnl9YCk7XG4gICAgfVxuICAgIHJldHVybiBydWxlLm51bWJlcnMubWFwKG51bWJlciA9PiB0aGlzLmdldFN1ZmZpeChjb2RlLCBudW1iZXIsIG9wdGlvbnMpKTtcbiAgfVxuICBnZXRTdWZmaXgoY29kZSwgY291bnQpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzJdIDoge307XG4gICAgY29uc3QgcnVsZSA9IHRoaXMuZ2V0UnVsZShjb2RlLCBvcHRpb25zKTtcbiAgICBpZiAocnVsZSkge1xuICAgICAgaWYgKHRoaXMuc2hvdWxkVXNlSW50bEFwaSgpKSB7XG4gICAgICAgIHJldHVybiBgJHt0aGlzLm9wdGlvbnMucHJlcGVuZH0ke29wdGlvbnMub3JkaW5hbCA/IGBvcmRpbmFsJHt0aGlzLm9wdGlvbnMucHJlcGVuZH1gIDogJyd9JHtydWxlLnNlbGVjdChjb3VudCl9YDtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmdldFN1ZmZpeFJldHJvQ29tcGF0aWJsZShydWxlLCBjb3VudCk7XG4gICAgfVxuICAgIHRoaXMubG9nZ2VyLndhcm4oYG5vIHBsdXJhbCBydWxlIGZvdW5kIGZvcjogJHtjb2RlfWApO1xuICAgIHJldHVybiAnJztcbiAgfVxuICBnZXRTdWZmaXhSZXRyb0NvbXBhdGlibGUocnVsZSwgY291bnQpIHtcbiAgICBjb25zdCBpZHggPSBydWxlLm5vQWJzID8gcnVsZS5wbHVyYWxzKGNvdW50KSA6IHJ1bGUucGx1cmFscyhNYXRoLmFicyhjb3VudCkpO1xuICAgIGxldCBzdWZmaXggPSBydWxlLm51bWJlcnNbaWR4XTtcbiAgICBpZiAodGhpcy5vcHRpb25zLnNpbXBsaWZ5UGx1cmFsU3VmZml4ICYmIHJ1bGUubnVtYmVycy5sZW5ndGggPT09IDIgJiYgcnVsZS5udW1iZXJzWzBdID09PSAxKSB7XG4gICAgICBpZiAoc3VmZml4ID09PSAyKSB7XG4gICAgICAgIHN1ZmZpeCA9ICdwbHVyYWwnO1xuICAgICAgfSBlbHNlIGlmIChzdWZmaXggPT09IDEpIHtcbiAgICAgICAgc3VmZml4ID0gJyc7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IHJldHVyblN1ZmZpeCA9ICgpID0+IHRoaXMub3B0aW9ucy5wcmVwZW5kICYmIHN1ZmZpeC50b1N0cmluZygpID8gdGhpcy5vcHRpb25zLnByZXBlbmQgKyBzdWZmaXgudG9TdHJpbmcoKSA6IHN1ZmZpeC50b1N0cmluZygpO1xuICAgIGlmICh0aGlzLm9wdGlvbnMuY29tcGF0aWJpbGl0eUpTT04gPT09ICd2MScpIHtcbiAgICAgIGlmIChzdWZmaXggPT09IDEpIHJldHVybiAnJztcbiAgICAgIGlmICh0eXBlb2Ygc3VmZml4ID09PSAnbnVtYmVyJykgcmV0dXJuIGBfcGx1cmFsXyR7c3VmZml4LnRvU3RyaW5nKCl9YDtcbiAgICAgIHJldHVybiByZXR1cm5TdWZmaXgoKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5jb21wYXRpYmlsaXR5SlNPTiA9PT0gJ3YyJykge1xuICAgICAgcmV0dXJuIHJldHVyblN1ZmZpeCgpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLnNpbXBsaWZ5UGx1cmFsU3VmZml4ICYmIHJ1bGUubnVtYmVycy5sZW5ndGggPT09IDIgJiYgcnVsZS5udW1iZXJzWzBdID09PSAxKSB7XG4gICAgICByZXR1cm4gcmV0dXJuU3VmZml4KCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLm9wdGlvbnMucHJlcGVuZCAmJiBpZHgudG9TdHJpbmcoKSA/IHRoaXMub3B0aW9ucy5wcmVwZW5kICsgaWR4LnRvU3RyaW5nKCkgOiBpZHgudG9TdHJpbmcoKTtcbiAgfVxuICBzaG91bGRVc2VJbnRsQXBpKCkge1xuICAgIHJldHVybiAhbm9uSW50bFZlcnNpb25zLmluY2x1ZGVzKHRoaXMub3B0aW9ucy5jb21wYXRpYmlsaXR5SlNPTik7XG4gIH1cbn1cblxuY29uc3QgZGVlcEZpbmRXaXRoRGVmYXVsdHMgPSBmdW5jdGlvbiAoZGF0YSwgZGVmYXVsdERhdGEsIGtleSkge1xuICBsZXQga2V5U2VwYXJhdG9yID0gYXJndW1lbnRzLmxlbmd0aCA+IDMgJiYgYXJndW1lbnRzWzNdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbM10gOiAnLic7XG4gIGxldCBpZ25vcmVKU09OU3RydWN0dXJlID0gYXJndW1lbnRzLmxlbmd0aCA+IDQgJiYgYXJndW1lbnRzWzRdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbNF0gOiB0cnVlO1xuICBsZXQgcGF0aCA9IGdldFBhdGhXaXRoRGVmYXVsdHMoZGF0YSwgZGVmYXVsdERhdGEsIGtleSk7XG4gIGlmICghcGF0aCAmJiBpZ25vcmVKU09OU3RydWN0dXJlICYmIHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnKSB7XG4gICAgcGF0aCA9IGRlZXBGaW5kKGRhdGEsIGtleSwga2V5U2VwYXJhdG9yKTtcbiAgICBpZiAocGF0aCA9PT0gdW5kZWZpbmVkKSBwYXRoID0gZGVlcEZpbmQoZGVmYXVsdERhdGEsIGtleSwga2V5U2VwYXJhdG9yKTtcbiAgfVxuICByZXR1cm4gcGF0aDtcbn07XG5jb25zdCByZWdleFNhZmUgPSB2YWwgPT4gdmFsLnJlcGxhY2UoL1xcJC9nLCAnJCQkJCcpO1xuY2xhc3MgSW50ZXJwb2xhdG9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IHt9O1xuICAgIHRoaXMubG9nZ2VyID0gYmFzZUxvZ2dlci5jcmVhdGUoJ2ludGVycG9sYXRvcicpO1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy5mb3JtYXQgPSBvcHRpb25zLmludGVycG9sYXRpb24gJiYgb3B0aW9ucy5pbnRlcnBvbGF0aW9uLmZvcm1hdCB8fCAodmFsdWUgPT4gdmFsdWUpO1xuICAgIHRoaXMuaW5pdChvcHRpb25zKTtcbiAgfVxuICBpbml0KCkge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiB7fTtcbiAgICBpZiAoIW9wdGlvbnMuaW50ZXJwb2xhdGlvbikgb3B0aW9ucy5pbnRlcnBvbGF0aW9uID0ge1xuICAgICAgZXNjYXBlVmFsdWU6IHRydWVcbiAgICB9O1xuICAgIGNvbnN0IHtcbiAgICAgIGVzY2FwZTogZXNjYXBlJDEsXG4gICAgICBlc2NhcGVWYWx1ZSxcbiAgICAgIHVzZVJhd1ZhbHVlVG9Fc2NhcGUsXG4gICAgICBwcmVmaXgsXG4gICAgICBwcmVmaXhFc2NhcGVkLFxuICAgICAgc3VmZml4LFxuICAgICAgc3VmZml4RXNjYXBlZCxcbiAgICAgIGZvcm1hdFNlcGFyYXRvcixcbiAgICAgIHVuZXNjYXBlU3VmZml4LFxuICAgICAgdW5lc2NhcGVQcmVmaXgsXG4gICAgICBuZXN0aW5nUHJlZml4LFxuICAgICAgbmVzdGluZ1ByZWZpeEVzY2FwZWQsXG4gICAgICBuZXN0aW5nU3VmZml4LFxuICAgICAgbmVzdGluZ1N1ZmZpeEVzY2FwZWQsXG4gICAgICBuZXN0aW5nT3B0aW9uc1NlcGFyYXRvcixcbiAgICAgIG1heFJlcGxhY2VzLFxuICAgICAgYWx3YXlzRm9ybWF0XG4gICAgfSA9IG9wdGlvbnMuaW50ZXJwb2xhdGlvbjtcbiAgICB0aGlzLmVzY2FwZSA9IGVzY2FwZSQxICE9PSB1bmRlZmluZWQgPyBlc2NhcGUkMSA6IGVzY2FwZTtcbiAgICB0aGlzLmVzY2FwZVZhbHVlID0gZXNjYXBlVmFsdWUgIT09IHVuZGVmaW5lZCA/IGVzY2FwZVZhbHVlIDogdHJ1ZTtcbiAgICB0aGlzLnVzZVJhd1ZhbHVlVG9Fc2NhcGUgPSB1c2VSYXdWYWx1ZVRvRXNjYXBlICE9PSB1bmRlZmluZWQgPyB1c2VSYXdWYWx1ZVRvRXNjYXBlIDogZmFsc2U7XG4gICAgdGhpcy5wcmVmaXggPSBwcmVmaXggPyByZWdleEVzY2FwZShwcmVmaXgpIDogcHJlZml4RXNjYXBlZCB8fCAne3snO1xuICAgIHRoaXMuc3VmZml4ID0gc3VmZml4ID8gcmVnZXhFc2NhcGUoc3VmZml4KSA6IHN1ZmZpeEVzY2FwZWQgfHwgJ319JztcbiAgICB0aGlzLmZvcm1hdFNlcGFyYXRvciA9IGZvcm1hdFNlcGFyYXRvciB8fCAnLCc7XG4gICAgdGhpcy51bmVzY2FwZVByZWZpeCA9IHVuZXNjYXBlU3VmZml4ID8gJycgOiB1bmVzY2FwZVByZWZpeCB8fCAnLSc7XG4gICAgdGhpcy51bmVzY2FwZVN1ZmZpeCA9IHRoaXMudW5lc2NhcGVQcmVmaXggPyAnJyA6IHVuZXNjYXBlU3VmZml4IHx8ICcnO1xuICAgIHRoaXMubmVzdGluZ1ByZWZpeCA9IG5lc3RpbmdQcmVmaXggPyByZWdleEVzY2FwZShuZXN0aW5nUHJlZml4KSA6IG5lc3RpbmdQcmVmaXhFc2NhcGVkIHx8IHJlZ2V4RXNjYXBlKCckdCgnKTtcbiAgICB0aGlzLm5lc3RpbmdTdWZmaXggPSBuZXN0aW5nU3VmZml4ID8gcmVnZXhFc2NhcGUobmVzdGluZ1N1ZmZpeCkgOiBuZXN0aW5nU3VmZml4RXNjYXBlZCB8fCByZWdleEVzY2FwZSgnKScpO1xuICAgIHRoaXMubmVzdGluZ09wdGlvbnNTZXBhcmF0b3IgPSBuZXN0aW5nT3B0aW9uc1NlcGFyYXRvciB8fCAnLCc7XG4gICAgdGhpcy5tYXhSZXBsYWNlcyA9IG1heFJlcGxhY2VzIHx8IDEwMDA7XG4gICAgdGhpcy5hbHdheXNGb3JtYXQgPSBhbHdheXNGb3JtYXQgIT09IHVuZGVmaW5lZCA/IGFsd2F5c0Zvcm1hdCA6IGZhbHNlO1xuICAgIHRoaXMucmVzZXRSZWdFeHAoKTtcbiAgfVxuICByZXNldCgpIHtcbiAgICBpZiAodGhpcy5vcHRpb25zKSB0aGlzLmluaXQodGhpcy5vcHRpb25zKTtcbiAgfVxuICByZXNldFJlZ0V4cCgpIHtcbiAgICBjb25zdCBnZXRPclJlc2V0UmVnRXhwID0gKGV4aXN0aW5nUmVnRXhwLCBwYXR0ZXJuKSA9PiB7XG4gICAgICBpZiAoZXhpc3RpbmdSZWdFeHAgJiYgZXhpc3RpbmdSZWdFeHAuc291cmNlID09PSBwYXR0ZXJuKSB7XG4gICAgICAgIGV4aXN0aW5nUmVnRXhwLmxhc3RJbmRleCA9IDA7XG4gICAgICAgIHJldHVybiBleGlzdGluZ1JlZ0V4cDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgUmVnRXhwKHBhdHRlcm4sICdnJyk7XG4gICAgfTtcbiAgICB0aGlzLnJlZ2V4cCA9IGdldE9yUmVzZXRSZWdFeHAodGhpcy5yZWdleHAsIGAke3RoaXMucHJlZml4fSguKz8pJHt0aGlzLnN1ZmZpeH1gKTtcbiAgICB0aGlzLnJlZ2V4cFVuZXNjYXBlID0gZ2V0T3JSZXNldFJlZ0V4cCh0aGlzLnJlZ2V4cFVuZXNjYXBlLCBgJHt0aGlzLnByZWZpeH0ke3RoaXMudW5lc2NhcGVQcmVmaXh9KC4rPykke3RoaXMudW5lc2NhcGVTdWZmaXh9JHt0aGlzLnN1ZmZpeH1gKTtcbiAgICB0aGlzLm5lc3RpbmdSZWdleHAgPSBnZXRPclJlc2V0UmVnRXhwKHRoaXMubmVzdGluZ1JlZ2V4cCwgYCR7dGhpcy5uZXN0aW5nUHJlZml4fSguKz8pJHt0aGlzLm5lc3RpbmdTdWZmaXh9YCk7XG4gIH1cbiAgaW50ZXJwb2xhdGUoc3RyLCBkYXRhLCBsbmcsIG9wdGlvbnMpIHtcbiAgICBsZXQgbWF0Y2g7XG4gICAgbGV0IHZhbHVlO1xuICAgIGxldCByZXBsYWNlcztcbiAgICBjb25zdCBkZWZhdWx0RGF0YSA9IHRoaXMub3B0aW9ucyAmJiB0aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbiAmJiB0aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbi5kZWZhdWx0VmFyaWFibGVzIHx8IHt9O1xuICAgIGNvbnN0IGhhbmRsZUZvcm1hdCA9IGtleSA9PiB7XG4gICAgICBpZiAoa2V5LmluZGV4T2YodGhpcy5mb3JtYXRTZXBhcmF0b3IpIDwgMCkge1xuICAgICAgICBjb25zdCBwYXRoID0gZGVlcEZpbmRXaXRoRGVmYXVsdHMoZGF0YSwgZGVmYXVsdERhdGEsIGtleSwgdGhpcy5vcHRpb25zLmtleVNlcGFyYXRvciwgdGhpcy5vcHRpb25zLmlnbm9yZUpTT05TdHJ1Y3R1cmUpO1xuICAgICAgICByZXR1cm4gdGhpcy5hbHdheXNGb3JtYXQgPyB0aGlzLmZvcm1hdChwYXRoLCB1bmRlZmluZWQsIGxuZywge1xuICAgICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgICAgLi4uZGF0YSxcbiAgICAgICAgICBpbnRlcnBvbGF0aW9ua2V5OiBrZXlcbiAgICAgICAgfSkgOiBwYXRoO1xuICAgICAgfVxuICAgICAgY29uc3QgcCA9IGtleS5zcGxpdCh0aGlzLmZvcm1hdFNlcGFyYXRvcik7XG4gICAgICBjb25zdCBrID0gcC5zaGlmdCgpLnRyaW0oKTtcbiAgICAgIGNvbnN0IGYgPSBwLmpvaW4odGhpcy5mb3JtYXRTZXBhcmF0b3IpLnRyaW0oKTtcbiAgICAgIHJldHVybiB0aGlzLmZvcm1hdChkZWVwRmluZFdpdGhEZWZhdWx0cyhkYXRhLCBkZWZhdWx0RGF0YSwgaywgdGhpcy5vcHRpb25zLmtleVNlcGFyYXRvciwgdGhpcy5vcHRpb25zLmlnbm9yZUpTT05TdHJ1Y3R1cmUpLCBmLCBsbmcsIHtcbiAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgLi4uZGF0YSxcbiAgICAgICAgaW50ZXJwb2xhdGlvbmtleToga1xuICAgICAgfSk7XG4gICAgfTtcbiAgICB0aGlzLnJlc2V0UmVnRXhwKCk7XG4gICAgY29uc3QgbWlzc2luZ0ludGVycG9sYXRpb25IYW5kbGVyID0gb3B0aW9ucyAmJiBvcHRpb25zLm1pc3NpbmdJbnRlcnBvbGF0aW9uSGFuZGxlciB8fCB0aGlzLm9wdGlvbnMubWlzc2luZ0ludGVycG9sYXRpb25IYW5kbGVyO1xuICAgIGNvbnN0IHNraXBPblZhcmlhYmxlcyA9IG9wdGlvbnMgJiYgb3B0aW9ucy5pbnRlcnBvbGF0aW9uICYmIG9wdGlvbnMuaW50ZXJwb2xhdGlvbi5za2lwT25WYXJpYWJsZXMgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMuaW50ZXJwb2xhdGlvbi5za2lwT25WYXJpYWJsZXMgOiB0aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbi5za2lwT25WYXJpYWJsZXM7XG4gICAgY29uc3QgdG9kb3MgPSBbe1xuICAgICAgcmVnZXg6IHRoaXMucmVnZXhwVW5lc2NhcGUsXG4gICAgICBzYWZlVmFsdWU6IHZhbCA9PiByZWdleFNhZmUodmFsKVxuICAgIH0sIHtcbiAgICAgIHJlZ2V4OiB0aGlzLnJlZ2V4cCxcbiAgICAgIHNhZmVWYWx1ZTogdmFsID0+IHRoaXMuZXNjYXBlVmFsdWUgPyByZWdleFNhZmUodGhpcy5lc2NhcGUodmFsKSkgOiByZWdleFNhZmUodmFsKVxuICAgIH1dO1xuICAgIHRvZG9zLmZvckVhY2godG9kbyA9PiB7XG4gICAgICByZXBsYWNlcyA9IDA7XG4gICAgICB3aGlsZSAobWF0Y2ggPSB0b2RvLnJlZ2V4LmV4ZWMoc3RyKSkge1xuICAgICAgICBjb25zdCBtYXRjaGVkVmFyID0gbWF0Y2hbMV0udHJpbSgpO1xuICAgICAgICB2YWx1ZSA9IGhhbmRsZUZvcm1hdChtYXRjaGVkVmFyKTtcbiAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBpZiAodHlwZW9mIG1pc3NpbmdJbnRlcnBvbGF0aW9uSGFuZGxlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY29uc3QgdGVtcCA9IG1pc3NpbmdJbnRlcnBvbGF0aW9uSGFuZGxlcihzdHIsIG1hdGNoLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHZhbHVlID0gdHlwZW9mIHRlbXAgPT09ICdzdHJpbmcnID8gdGVtcCA6ICcnO1xuICAgICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucyAmJiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob3B0aW9ucywgbWF0Y2hlZFZhcikpIHtcbiAgICAgICAgICAgIHZhbHVlID0gJyc7XG4gICAgICAgICAgfSBlbHNlIGlmIChza2lwT25WYXJpYWJsZXMpIHtcbiAgICAgICAgICAgIHZhbHVlID0gbWF0Y2hbMF07XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5sb2dnZXIud2FybihgbWlzc2VkIHRvIHBhc3MgaW4gdmFyaWFibGUgJHttYXRjaGVkVmFyfSBmb3IgaW50ZXJwb2xhdGluZyAke3N0cn1gKTtcbiAgICAgICAgICAgIHZhbHVlID0gJyc7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycgJiYgIXRoaXMudXNlUmF3VmFsdWVUb0VzY2FwZSkge1xuICAgICAgICAgIHZhbHVlID0gbWFrZVN0cmluZyh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc2FmZVZhbHVlID0gdG9kby5zYWZlVmFsdWUodmFsdWUpO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZShtYXRjaFswXSwgc2FmZVZhbHVlKTtcbiAgICAgICAgaWYgKHNraXBPblZhcmlhYmxlcykge1xuICAgICAgICAgIHRvZG8ucmVnZXgubGFzdEluZGV4ICs9IHZhbHVlLmxlbmd0aDtcbiAgICAgICAgICB0b2RvLnJlZ2V4Lmxhc3RJbmRleCAtPSBtYXRjaFswXS5sZW5ndGg7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdG9kby5yZWdleC5sYXN0SW5kZXggPSAwO1xuICAgICAgICB9XG4gICAgICAgIHJlcGxhY2VzKys7XG4gICAgICAgIGlmIChyZXBsYWNlcyA+PSB0aGlzLm1heFJlcGxhY2VzKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gc3RyO1xuICB9XG4gIG5lc3Qoc3RyLCBmYykge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMl0gOiB7fTtcbiAgICBsZXQgbWF0Y2g7XG4gICAgbGV0IHZhbHVlO1xuICAgIGxldCBjbG9uZWRPcHRpb25zO1xuICAgIGNvbnN0IGhhbmRsZUhhc09wdGlvbnMgPSAoa2V5LCBpbmhlcml0ZWRPcHRpb25zKSA9PiB7XG4gICAgICBjb25zdCBzZXAgPSB0aGlzLm5lc3RpbmdPcHRpb25zU2VwYXJhdG9yO1xuICAgICAgaWYgKGtleS5pbmRleE9mKHNlcCkgPCAwKSByZXR1cm4ga2V5O1xuICAgICAgY29uc3QgYyA9IGtleS5zcGxpdChuZXcgUmVnRXhwKGAke3NlcH1bIF0qe2ApKTtcbiAgICAgIGxldCBvcHRpb25zU3RyaW5nID0gYHske2NbMV19YDtcbiAgICAgIGtleSA9IGNbMF07XG4gICAgICBvcHRpb25zU3RyaW5nID0gdGhpcy5pbnRlcnBvbGF0ZShvcHRpb25zU3RyaW5nLCBjbG9uZWRPcHRpb25zKTtcbiAgICAgIGNvbnN0IG1hdGNoZWRTaW5nbGVRdW90ZXMgPSBvcHRpb25zU3RyaW5nLm1hdGNoKC8nL2cpO1xuICAgICAgY29uc3QgbWF0Y2hlZERvdWJsZVF1b3RlcyA9IG9wdGlvbnNTdHJpbmcubWF0Y2goL1wiL2cpO1xuICAgICAgaWYgKG1hdGNoZWRTaW5nbGVRdW90ZXMgJiYgbWF0Y2hlZFNpbmdsZVF1b3Rlcy5sZW5ndGggJSAyID09PSAwICYmICFtYXRjaGVkRG91YmxlUXVvdGVzIHx8IG1hdGNoZWREb3VibGVRdW90ZXMubGVuZ3RoICUgMiAhPT0gMCkge1xuICAgICAgICBvcHRpb25zU3RyaW5nID0gb3B0aW9uc1N0cmluZy5yZXBsYWNlKC8nL2csICdcIicpO1xuICAgICAgfVxuICAgICAgdHJ5IHtcbiAgICAgICAgY2xvbmVkT3B0aW9ucyA9IEpTT04ucGFyc2Uob3B0aW9uc1N0cmluZyk7XG4gICAgICAgIGlmIChpbmhlcml0ZWRPcHRpb25zKSBjbG9uZWRPcHRpb25zID0ge1xuICAgICAgICAgIC4uLmluaGVyaXRlZE9wdGlvbnMsXG4gICAgICAgICAgLi4uY2xvbmVkT3B0aW9uc1xuICAgICAgICB9O1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICB0aGlzLmxvZ2dlci53YXJuKGBmYWlsZWQgcGFyc2luZyBvcHRpb25zIHN0cmluZyBpbiBuZXN0aW5nIGZvciBrZXkgJHtrZXl9YCwgZSk7XG4gICAgICAgIHJldHVybiBgJHtrZXl9JHtzZXB9JHtvcHRpb25zU3RyaW5nfWA7XG4gICAgICB9XG4gICAgICBpZiAoY2xvbmVkT3B0aW9ucy5kZWZhdWx0VmFsdWUgJiYgY2xvbmVkT3B0aW9ucy5kZWZhdWx0VmFsdWUuaW5kZXhPZih0aGlzLnByZWZpeCkgPiAtMSkgZGVsZXRlIGNsb25lZE9wdGlvbnMuZGVmYXVsdFZhbHVlO1xuICAgICAgcmV0dXJuIGtleTtcbiAgICB9O1xuICAgIHdoaWxlIChtYXRjaCA9IHRoaXMubmVzdGluZ1JlZ2V4cC5leGVjKHN0cikpIHtcbiAgICAgIGxldCBmb3JtYXR0ZXJzID0gW107XG4gICAgICBjbG9uZWRPcHRpb25zID0ge1xuICAgICAgICAuLi5vcHRpb25zXG4gICAgICB9O1xuICAgICAgY2xvbmVkT3B0aW9ucyA9IGNsb25lZE9wdGlvbnMucmVwbGFjZSAmJiB0eXBlb2YgY2xvbmVkT3B0aW9ucy5yZXBsYWNlICE9PSAnc3RyaW5nJyA/IGNsb25lZE9wdGlvbnMucmVwbGFjZSA6IGNsb25lZE9wdGlvbnM7XG4gICAgICBjbG9uZWRPcHRpb25zLmFwcGx5UG9zdFByb2Nlc3NvciA9IGZhbHNlO1xuICAgICAgZGVsZXRlIGNsb25lZE9wdGlvbnMuZGVmYXVsdFZhbHVlO1xuICAgICAgbGV0IGRvUmVkdWNlID0gZmFsc2U7XG4gICAgICBpZiAobWF0Y2hbMF0uaW5kZXhPZih0aGlzLmZvcm1hdFNlcGFyYXRvcikgIT09IC0xICYmICEvey4qfS8udGVzdChtYXRjaFsxXSkpIHtcbiAgICAgICAgY29uc3QgciA9IG1hdGNoWzFdLnNwbGl0KHRoaXMuZm9ybWF0U2VwYXJhdG9yKS5tYXAoZWxlbSA9PiBlbGVtLnRyaW0oKSk7XG4gICAgICAgIG1hdGNoWzFdID0gci5zaGlmdCgpO1xuICAgICAgICBmb3JtYXR0ZXJzID0gcjtcbiAgICAgICAgZG9SZWR1Y2UgPSB0cnVlO1xuICAgICAgfVxuICAgICAgdmFsdWUgPSBmYyhoYW5kbGVIYXNPcHRpb25zLmNhbGwodGhpcywgbWF0Y2hbMV0udHJpbSgpLCBjbG9uZWRPcHRpb25zKSwgY2xvbmVkT3B0aW9ucyk7XG4gICAgICBpZiAodmFsdWUgJiYgbWF0Y2hbMF0gPT09IHN0ciAmJiB0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSByZXR1cm4gdmFsdWU7XG4gICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJykgdmFsdWUgPSBtYWtlU3RyaW5nKHZhbHVlKTtcbiAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgdGhpcy5sb2dnZXIud2FybihgbWlzc2VkIHRvIHJlc29sdmUgJHttYXRjaFsxXX0gZm9yIG5lc3RpbmcgJHtzdHJ9YCk7XG4gICAgICAgIHZhbHVlID0gJyc7XG4gICAgICB9XG4gICAgICBpZiAoZG9SZWR1Y2UpIHtcbiAgICAgICAgdmFsdWUgPSBmb3JtYXR0ZXJzLnJlZHVjZSgodiwgZikgPT4gdGhpcy5mb3JtYXQodiwgZiwgb3B0aW9ucy5sbmcsIHtcbiAgICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICAgIGludGVycG9sYXRpb25rZXk6IG1hdGNoWzFdLnRyaW0oKVxuICAgICAgICB9KSwgdmFsdWUudHJpbSgpKTtcbiAgICAgIH1cbiAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKG1hdGNoWzBdLCB2YWx1ZSk7XG4gICAgICB0aGlzLnJlZ2V4cC5sYXN0SW5kZXggPSAwO1xuICAgIH1cbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cbmNvbnN0IHBhcnNlRm9ybWF0U3RyID0gZm9ybWF0U3RyID0+IHtcbiAgbGV0IGZvcm1hdE5hbWUgPSBmb3JtYXRTdHIudG9Mb3dlckNhc2UoKS50cmltKCk7XG4gIGNvbnN0IGZvcm1hdE9wdGlvbnMgPSB7fTtcbiAgaWYgKGZvcm1hdFN0ci5pbmRleE9mKCcoJykgPiAtMSkge1xuICAgIGNvbnN0IHAgPSBmb3JtYXRTdHIuc3BsaXQoJygnKTtcbiAgICBmb3JtYXROYW1lID0gcFswXS50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcbiAgICBjb25zdCBvcHRTdHIgPSBwWzFdLnN1YnN0cmluZygwLCBwWzFdLmxlbmd0aCAtIDEpO1xuICAgIGlmIChmb3JtYXROYW1lID09PSAnY3VycmVuY3knICYmIG9wdFN0ci5pbmRleE9mKCc6JykgPCAwKSB7XG4gICAgICBpZiAoIWZvcm1hdE9wdGlvbnMuY3VycmVuY3kpIGZvcm1hdE9wdGlvbnMuY3VycmVuY3kgPSBvcHRTdHIudHJpbSgpO1xuICAgIH0gZWxzZSBpZiAoZm9ybWF0TmFtZSA9PT0gJ3JlbGF0aXZldGltZScgJiYgb3B0U3RyLmluZGV4T2YoJzonKSA8IDApIHtcbiAgICAgIGlmICghZm9ybWF0T3B0aW9ucy5yYW5nZSkgZm9ybWF0T3B0aW9ucy5yYW5nZSA9IG9wdFN0ci50cmltKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IG9wdHMgPSBvcHRTdHIuc3BsaXQoJzsnKTtcbiAgICAgIG9wdHMuZm9yRWFjaChvcHQgPT4ge1xuICAgICAgICBpZiAob3B0KSB7XG4gICAgICAgICAgY29uc3QgW2tleSwgLi4ucmVzdF0gPSBvcHQuc3BsaXQoJzonKTtcbiAgICAgICAgICBjb25zdCB2YWwgPSByZXN0LmpvaW4oJzonKS50cmltKCkucmVwbGFjZSgvXicrfCcrJC9nLCAnJyk7XG4gICAgICAgICAgY29uc3QgdHJpbW1lZEtleSA9IGtleS50cmltKCk7XG4gICAgICAgICAgaWYgKCFmb3JtYXRPcHRpb25zW3RyaW1tZWRLZXldKSBmb3JtYXRPcHRpb25zW3RyaW1tZWRLZXldID0gdmFsO1xuICAgICAgICAgIGlmICh2YWwgPT09ICdmYWxzZScpIGZvcm1hdE9wdGlvbnNbdHJpbW1lZEtleV0gPSBmYWxzZTtcbiAgICAgICAgICBpZiAodmFsID09PSAndHJ1ZScpIGZvcm1hdE9wdGlvbnNbdHJpbW1lZEtleV0gPSB0cnVlO1xuICAgICAgICAgIGlmICghaXNOYU4odmFsKSkgZm9ybWF0T3B0aW9uc1t0cmltbWVkS2V5XSA9IHBhcnNlSW50KHZhbCwgMTApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBmb3JtYXROYW1lLFxuICAgIGZvcm1hdE9wdGlvbnNcbiAgfTtcbn07XG5jb25zdCBjcmVhdGVDYWNoZWRGb3JtYXR0ZXIgPSBmbiA9PiB7XG4gIGNvbnN0IGNhY2hlID0ge307XG4gIHJldHVybiAodmFsLCBsbmcsIG9wdGlvbnMpID0+IHtcbiAgICBjb25zdCBrZXkgPSBsbmcgKyBKU09OLnN0cmluZ2lmeShvcHRpb25zKTtcbiAgICBsZXQgZm9ybWF0dGVyID0gY2FjaGVba2V5XTtcbiAgICBpZiAoIWZvcm1hdHRlcikge1xuICAgICAgZm9ybWF0dGVyID0gZm4oZ2V0Q2xlYW5lZENvZGUobG5nKSwgb3B0aW9ucyk7XG4gICAgICBjYWNoZVtrZXldID0gZm9ybWF0dGVyO1xuICAgIH1cbiAgICByZXR1cm4gZm9ybWF0dGVyKHZhbCk7XG4gIH07XG59O1xuY2xhc3MgRm9ybWF0dGVyIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IHt9O1xuICAgIHRoaXMubG9nZ2VyID0gYmFzZUxvZ2dlci5jcmVhdGUoJ2Zvcm1hdHRlcicpO1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy5mb3JtYXRzID0ge1xuICAgICAgbnVtYmVyOiBjcmVhdGVDYWNoZWRGb3JtYXR0ZXIoKGxuZywgb3B0KSA9PiB7XG4gICAgICAgIGNvbnN0IGZvcm1hdHRlciA9IG5ldyBJbnRsLk51bWJlckZvcm1hdChsbmcsIHtcbiAgICAgICAgICAuLi5vcHRcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB2YWwgPT4gZm9ybWF0dGVyLmZvcm1hdCh2YWwpO1xuICAgICAgfSksXG4gICAgICBjdXJyZW5jeTogY3JlYXRlQ2FjaGVkRm9ybWF0dGVyKChsbmcsIG9wdCkgPT4ge1xuICAgICAgICBjb25zdCBmb3JtYXR0ZXIgPSBuZXcgSW50bC5OdW1iZXJGb3JtYXQobG5nLCB7XG4gICAgICAgICAgLi4ub3B0LFxuICAgICAgICAgIHN0eWxlOiAnY3VycmVuY3knXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdmFsID0+IGZvcm1hdHRlci5mb3JtYXQodmFsKTtcbiAgICAgIH0pLFxuICAgICAgZGF0ZXRpbWU6IGNyZWF0ZUNhY2hlZEZvcm1hdHRlcigobG5nLCBvcHQpID0+IHtcbiAgICAgICAgY29uc3QgZm9ybWF0dGVyID0gbmV3IEludGwuRGF0ZVRpbWVGb3JtYXQobG5nLCB7XG4gICAgICAgICAgLi4ub3B0XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdmFsID0+IGZvcm1hdHRlci5mb3JtYXQodmFsKTtcbiAgICAgIH0pLFxuICAgICAgcmVsYXRpdmV0aW1lOiBjcmVhdGVDYWNoZWRGb3JtYXR0ZXIoKGxuZywgb3B0KSA9PiB7XG4gICAgICAgIGNvbnN0IGZvcm1hdHRlciA9IG5ldyBJbnRsLlJlbGF0aXZlVGltZUZvcm1hdChsbmcsIHtcbiAgICAgICAgICAuLi5vcHRcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB2YWwgPT4gZm9ybWF0dGVyLmZvcm1hdCh2YWwsIG9wdC5yYW5nZSB8fCAnZGF5Jyk7XG4gICAgICB9KSxcbiAgICAgIGxpc3Q6IGNyZWF0ZUNhY2hlZEZvcm1hdHRlcigobG5nLCBvcHQpID0+IHtcbiAgICAgICAgY29uc3QgZm9ybWF0dGVyID0gbmV3IEludGwuTGlzdEZvcm1hdChsbmcsIHtcbiAgICAgICAgICAuLi5vcHRcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB2YWwgPT4gZm9ybWF0dGVyLmZvcm1hdCh2YWwpO1xuICAgICAgfSlcbiAgICB9O1xuICAgIHRoaXMuaW5pdChvcHRpb25zKTtcbiAgfVxuICBpbml0KHNlcnZpY2VzKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IHtcbiAgICAgIGludGVycG9sYXRpb246IHt9XG4gICAgfTtcbiAgICBjb25zdCBpT3B0cyA9IG9wdGlvbnMuaW50ZXJwb2xhdGlvbjtcbiAgICB0aGlzLmZvcm1hdFNlcGFyYXRvciA9IGlPcHRzLmZvcm1hdFNlcGFyYXRvciA/IGlPcHRzLmZvcm1hdFNlcGFyYXRvciA6IGlPcHRzLmZvcm1hdFNlcGFyYXRvciB8fCAnLCc7XG4gIH1cbiAgYWRkKG5hbWUsIGZjKSB7XG4gICAgdGhpcy5mb3JtYXRzW25hbWUudG9Mb3dlckNhc2UoKS50cmltKCldID0gZmM7XG4gIH1cbiAgYWRkQ2FjaGVkKG5hbWUsIGZjKSB7XG4gICAgdGhpcy5mb3JtYXRzW25hbWUudG9Mb3dlckNhc2UoKS50cmltKCldID0gY3JlYXRlQ2FjaGVkRm9ybWF0dGVyKGZjKTtcbiAgfVxuICBmb3JtYXQodmFsdWUsIGZvcm1hdCwgbG5nKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMyAmJiBhcmd1bWVudHNbM10gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1szXSA6IHt9O1xuICAgIGNvbnN0IGZvcm1hdHMgPSBmb3JtYXQuc3BsaXQodGhpcy5mb3JtYXRTZXBhcmF0b3IpO1xuICAgIGlmIChmb3JtYXRzLmxlbmd0aCA+IDEgJiYgZm9ybWF0c1swXS5pbmRleE9mKCcoJykgPiAxICYmIGZvcm1hdHNbMF0uaW5kZXhPZignKScpIDwgMCAmJiBmb3JtYXRzLmZpbmQoZiA9PiBmLmluZGV4T2YoJyknKSA+IC0xKSkge1xuICAgICAgY29uc3QgbGFzdEluZGV4ID0gZm9ybWF0cy5maW5kSW5kZXgoZiA9PiBmLmluZGV4T2YoJyknKSA+IC0xKTtcbiAgICAgIGZvcm1hdHNbMF0gPSBbZm9ybWF0c1swXSwgLi4uZm9ybWF0cy5zcGxpY2UoMSwgbGFzdEluZGV4KV0uam9pbih0aGlzLmZvcm1hdFNlcGFyYXRvcik7XG4gICAgfVxuICAgIGNvbnN0IHJlc3VsdCA9IGZvcm1hdHMucmVkdWNlKChtZW0sIGYpID0+IHtcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgZm9ybWF0TmFtZSxcbiAgICAgICAgZm9ybWF0T3B0aW9uc1xuICAgICAgfSA9IHBhcnNlRm9ybWF0U3RyKGYpO1xuICAgICAgaWYgKHRoaXMuZm9ybWF0c1tmb3JtYXROYW1lXSkge1xuICAgICAgICBsZXQgZm9ybWF0dGVkID0gbWVtO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IHZhbE9wdGlvbnMgPSBvcHRpb25zICYmIG9wdGlvbnMuZm9ybWF0UGFyYW1zICYmIG9wdGlvbnMuZm9ybWF0UGFyYW1zW29wdGlvbnMuaW50ZXJwb2xhdGlvbmtleV0gfHwge307XG4gICAgICAgICAgY29uc3QgbCA9IHZhbE9wdGlvbnMubG9jYWxlIHx8IHZhbE9wdGlvbnMubG5nIHx8IG9wdGlvbnMubG9jYWxlIHx8IG9wdGlvbnMubG5nIHx8IGxuZztcbiAgICAgICAgICBmb3JtYXR0ZWQgPSB0aGlzLmZvcm1hdHNbZm9ybWF0TmFtZV0obWVtLCBsLCB7XG4gICAgICAgICAgICAuLi5mb3JtYXRPcHRpb25zLFxuICAgICAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgICAgIC4uLnZhbE9wdGlvbnNcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICB0aGlzLmxvZ2dlci53YXJuKGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZm9ybWF0dGVkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5sb2dnZXIud2FybihgdGhlcmUgd2FzIG5vIGZvcm1hdCBmdW5jdGlvbiBmb3IgJHtmb3JtYXROYW1lfWApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1lbTtcbiAgICB9LCB2YWx1ZSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxufVxuXG5jb25zdCByZW1vdmVQZW5kaW5nID0gKHEsIG5hbWUpID0+IHtcbiAgaWYgKHEucGVuZGluZ1tuYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgZGVsZXRlIHEucGVuZGluZ1tuYW1lXTtcbiAgICBxLnBlbmRpbmdDb3VudC0tO1xuICB9XG59O1xuY2xhc3MgQ29ubmVjdG9yIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgY29uc3RydWN0b3IoYmFja2VuZCwgc3RvcmUsIHNlcnZpY2VzKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMyAmJiBhcmd1bWVudHNbM10gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1szXSA6IHt9O1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5iYWNrZW5kID0gYmFja2VuZDtcbiAgICB0aGlzLnN0b3JlID0gc3RvcmU7XG4gICAgdGhpcy5zZXJ2aWNlcyA9IHNlcnZpY2VzO1xuICAgIHRoaXMubGFuZ3VhZ2VVdGlscyA9IHNlcnZpY2VzLmxhbmd1YWdlVXRpbHM7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLmxvZ2dlciA9IGJhc2VMb2dnZXIuY3JlYXRlKCdiYWNrZW5kQ29ubmVjdG9yJyk7XG4gICAgdGhpcy53YWl0aW5nUmVhZHMgPSBbXTtcbiAgICB0aGlzLm1heFBhcmFsbGVsUmVhZHMgPSBvcHRpb25zLm1heFBhcmFsbGVsUmVhZHMgfHwgMTA7XG4gICAgdGhpcy5yZWFkaW5nQ2FsbHMgPSAwO1xuICAgIHRoaXMubWF4UmV0cmllcyA9IG9wdGlvbnMubWF4UmV0cmllcyA+PSAwID8gb3B0aW9ucy5tYXhSZXRyaWVzIDogNTtcbiAgICB0aGlzLnJldHJ5VGltZW91dCA9IG9wdGlvbnMucmV0cnlUaW1lb3V0ID49IDEgPyBvcHRpb25zLnJldHJ5VGltZW91dCA6IDM1MDtcbiAgICB0aGlzLnN0YXRlID0ge307XG4gICAgdGhpcy5xdWV1ZSA9IFtdO1xuICAgIGlmICh0aGlzLmJhY2tlbmQgJiYgdGhpcy5iYWNrZW5kLmluaXQpIHtcbiAgICAgIHRoaXMuYmFja2VuZC5pbml0KHNlcnZpY2VzLCBvcHRpb25zLmJhY2tlbmQsIG9wdGlvbnMpO1xuICAgIH1cbiAgfVxuICBxdWV1ZUxvYWQobGFuZ3VhZ2VzLCBuYW1lc3BhY2VzLCBvcHRpb25zLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IHRvTG9hZCA9IHt9O1xuICAgIGNvbnN0IHBlbmRpbmcgPSB7fTtcbiAgICBjb25zdCB0b0xvYWRMYW5ndWFnZXMgPSB7fTtcbiAgICBjb25zdCB0b0xvYWROYW1lc3BhY2VzID0ge307XG4gICAgbGFuZ3VhZ2VzLmZvckVhY2gobG5nID0+IHtcbiAgICAgIGxldCBoYXNBbGxOYW1lc3BhY2VzID0gdHJ1ZTtcbiAgICAgIG5hbWVzcGFjZXMuZm9yRWFjaChucyA9PiB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBgJHtsbmd9fCR7bnN9YDtcbiAgICAgICAgaWYgKCFvcHRpb25zLnJlbG9hZCAmJiB0aGlzLnN0b3JlLmhhc1Jlc291cmNlQnVuZGxlKGxuZywgbnMpKSB7XG4gICAgICAgICAgdGhpcy5zdGF0ZVtuYW1lXSA9IDI7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0ZVtuYW1lXSA8IDApIDsgZWxzZSBpZiAodGhpcy5zdGF0ZVtuYW1lXSA9PT0gMSkge1xuICAgICAgICAgIGlmIChwZW5kaW5nW25hbWVdID09PSB1bmRlZmluZWQpIHBlbmRpbmdbbmFtZV0gPSB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuc3RhdGVbbmFtZV0gPSAxO1xuICAgICAgICAgIGhhc0FsbE5hbWVzcGFjZXMgPSBmYWxzZTtcbiAgICAgICAgICBpZiAocGVuZGluZ1tuYW1lXSA9PT0gdW5kZWZpbmVkKSBwZW5kaW5nW25hbWVdID0gdHJ1ZTtcbiAgICAgICAgICBpZiAodG9Mb2FkW25hbWVdID09PSB1bmRlZmluZWQpIHRvTG9hZFtuYW1lXSA9IHRydWU7XG4gICAgICAgICAgaWYgKHRvTG9hZE5hbWVzcGFjZXNbbnNdID09PSB1bmRlZmluZWQpIHRvTG9hZE5hbWVzcGFjZXNbbnNdID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBpZiAoIWhhc0FsbE5hbWVzcGFjZXMpIHRvTG9hZExhbmd1YWdlc1tsbmddID0gdHJ1ZTtcbiAgICB9KTtcbiAgICBpZiAoT2JqZWN0LmtleXModG9Mb2FkKS5sZW5ndGggfHwgT2JqZWN0LmtleXMocGVuZGluZykubGVuZ3RoKSB7XG4gICAgICB0aGlzLnF1ZXVlLnB1c2goe1xuICAgICAgICBwZW5kaW5nLFxuICAgICAgICBwZW5kaW5nQ291bnQ6IE9iamVjdC5rZXlzKHBlbmRpbmcpLmxlbmd0aCxcbiAgICAgICAgbG9hZGVkOiB7fSxcbiAgICAgICAgZXJyb3JzOiBbXSxcbiAgICAgICAgY2FsbGJhY2tcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgdG9Mb2FkOiBPYmplY3Qua2V5cyh0b0xvYWQpLFxuICAgICAgcGVuZGluZzogT2JqZWN0LmtleXMocGVuZGluZyksXG4gICAgICB0b0xvYWRMYW5ndWFnZXM6IE9iamVjdC5rZXlzKHRvTG9hZExhbmd1YWdlcyksXG4gICAgICB0b0xvYWROYW1lc3BhY2VzOiBPYmplY3Qua2V5cyh0b0xvYWROYW1lc3BhY2VzKVxuICAgIH07XG4gIH1cbiAgbG9hZGVkKG5hbWUsIGVyciwgZGF0YSkge1xuICAgIGNvbnN0IHMgPSBuYW1lLnNwbGl0KCd8Jyk7XG4gICAgY29uc3QgbG5nID0gc1swXTtcbiAgICBjb25zdCBucyA9IHNbMV07XG4gICAgaWYgKGVycikgdGhpcy5lbWl0KCdmYWlsZWRMb2FkaW5nJywgbG5nLCBucywgZXJyKTtcbiAgICBpZiAoZGF0YSkge1xuICAgICAgdGhpcy5zdG9yZS5hZGRSZXNvdXJjZUJ1bmRsZShsbmcsIG5zLCBkYXRhLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwge1xuICAgICAgICBza2lwQ29weTogdHJ1ZVxuICAgICAgfSk7XG4gICAgfVxuICAgIHRoaXMuc3RhdGVbbmFtZV0gPSBlcnIgPyAtMSA6IDI7XG4gICAgY29uc3QgbG9hZGVkID0ge307XG4gICAgdGhpcy5xdWV1ZS5mb3JFYWNoKHEgPT4ge1xuICAgICAgcHVzaFBhdGgocS5sb2FkZWQsIFtsbmddLCBucyk7XG4gICAgICByZW1vdmVQZW5kaW5nKHEsIG5hbWUpO1xuICAgICAgaWYgKGVycikgcS5lcnJvcnMucHVzaChlcnIpO1xuICAgICAgaWYgKHEucGVuZGluZ0NvdW50ID09PSAwICYmICFxLmRvbmUpIHtcbiAgICAgICAgT2JqZWN0LmtleXMocS5sb2FkZWQpLmZvckVhY2gobCA9PiB7XG4gICAgICAgICAgaWYgKCFsb2FkZWRbbF0pIGxvYWRlZFtsXSA9IHt9O1xuICAgICAgICAgIGNvbnN0IGxvYWRlZEtleXMgPSBxLmxvYWRlZFtsXTtcbiAgICAgICAgICBpZiAobG9hZGVkS2V5cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGxvYWRlZEtleXMuZm9yRWFjaChuID0+IHtcbiAgICAgICAgICAgICAgaWYgKGxvYWRlZFtsXVtuXSA9PT0gdW5kZWZpbmVkKSBsb2FkZWRbbF1bbl0gPSB0cnVlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcS5kb25lID0gdHJ1ZTtcbiAgICAgICAgaWYgKHEuZXJyb3JzLmxlbmd0aCkge1xuICAgICAgICAgIHEuY2FsbGJhY2socS5lcnJvcnMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHEuY2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuZW1pdCgnbG9hZGVkJywgbG9hZGVkKTtcbiAgICB0aGlzLnF1ZXVlID0gdGhpcy5xdWV1ZS5maWx0ZXIocSA9PiAhcS5kb25lKTtcbiAgfVxuICByZWFkKGxuZywgbnMsIGZjTmFtZSkge1xuICAgIGxldCB0cmllZCA9IGFyZ3VtZW50cy5sZW5ndGggPiAzICYmIGFyZ3VtZW50c1szXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzNdIDogMDtcbiAgICBsZXQgd2FpdCA9IGFyZ3VtZW50cy5sZW5ndGggPiA0ICYmIGFyZ3VtZW50c1s0XSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzRdIDogdGhpcy5yZXRyeVRpbWVvdXQ7XG4gICAgbGV0IGNhbGxiYWNrID0gYXJndW1lbnRzLmxlbmd0aCA+IDUgPyBhcmd1bWVudHNbNV0gOiB1bmRlZmluZWQ7XG4gICAgaWYgKCFsbmcubGVuZ3RoKSByZXR1cm4gY2FsbGJhY2sobnVsbCwge30pO1xuICAgIGlmICh0aGlzLnJlYWRpbmdDYWxscyA+PSB0aGlzLm1heFBhcmFsbGVsUmVhZHMpIHtcbiAgICAgIHRoaXMud2FpdGluZ1JlYWRzLnB1c2goe1xuICAgICAgICBsbmcsXG4gICAgICAgIG5zLFxuICAgICAgICBmY05hbWUsXG4gICAgICAgIHRyaWVkLFxuICAgICAgICB3YWl0LFxuICAgICAgICBjYWxsYmFja1xuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMucmVhZGluZ0NhbGxzKys7XG4gICAgY29uc3QgcmVzb2x2ZXIgPSAoZXJyLCBkYXRhKSA9PiB7XG4gICAgICB0aGlzLnJlYWRpbmdDYWxscy0tO1xuICAgICAgaWYgKHRoaXMud2FpdGluZ1JlYWRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3QgbmV4dCA9IHRoaXMud2FpdGluZ1JlYWRzLnNoaWZ0KCk7XG4gICAgICAgIHRoaXMucmVhZChuZXh0LmxuZywgbmV4dC5ucywgbmV4dC5mY05hbWUsIG5leHQudHJpZWQsIG5leHQud2FpdCwgbmV4dC5jYWxsYmFjayk7XG4gICAgICB9XG4gICAgICBpZiAoZXJyICYmIGRhdGEgJiYgdHJpZWQgPCB0aGlzLm1heFJldHJpZXMpIHtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgdGhpcy5yZWFkLmNhbGwodGhpcywgbG5nLCBucywgZmNOYW1lLCB0cmllZCArIDEsIHdhaXQgKiAyLCBjYWxsYmFjayk7XG4gICAgICAgIH0sIHdhaXQpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjYWxsYmFjayhlcnIsIGRhdGEpO1xuICAgIH07XG4gICAgY29uc3QgZmMgPSB0aGlzLmJhY2tlbmRbZmNOYW1lXS5iaW5kKHRoaXMuYmFja2VuZCk7XG4gICAgaWYgKGZjLmxlbmd0aCA9PT0gMikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgciA9IGZjKGxuZywgbnMpO1xuICAgICAgICBpZiAociAmJiB0eXBlb2Ygci50aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgci50aGVuKGRhdGEgPT4gcmVzb2x2ZXIobnVsbCwgZGF0YSkpLmNhdGNoKHJlc29sdmVyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNvbHZlcihudWxsLCByKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHJlc29sdmVyKGVycik7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHJldHVybiBmYyhsbmcsIG5zLCByZXNvbHZlcik7XG4gIH1cbiAgcHJlcGFyZUxvYWRpbmcobGFuZ3VhZ2VzLCBuYW1lc3BhY2VzKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6IHt9O1xuICAgIGxldCBjYWxsYmFjayA9IGFyZ3VtZW50cy5sZW5ndGggPiAzID8gYXJndW1lbnRzWzNdIDogdW5kZWZpbmVkO1xuICAgIGlmICghdGhpcy5iYWNrZW5kKSB7XG4gICAgICB0aGlzLmxvZ2dlci53YXJuKCdObyBiYWNrZW5kIHdhcyBhZGRlZCB2aWEgaTE4bmV4dC51c2UuIFdpbGwgbm90IGxvYWQgcmVzb3VyY2VzLicpO1xuICAgICAgcmV0dXJuIGNhbGxiYWNrICYmIGNhbGxiYWNrKCk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgbGFuZ3VhZ2VzID09PSAnc3RyaW5nJykgbGFuZ3VhZ2VzID0gdGhpcy5sYW5ndWFnZVV0aWxzLnRvUmVzb2x2ZUhpZXJhcmNoeShsYW5ndWFnZXMpO1xuICAgIGlmICh0eXBlb2YgbmFtZXNwYWNlcyA9PT0gJ3N0cmluZycpIG5hbWVzcGFjZXMgPSBbbmFtZXNwYWNlc107XG4gICAgY29uc3QgdG9Mb2FkID0gdGhpcy5xdWV1ZUxvYWQobGFuZ3VhZ2VzLCBuYW1lc3BhY2VzLCBvcHRpb25zLCBjYWxsYmFjayk7XG4gICAgaWYgKCF0b0xvYWQudG9Mb2FkLmxlbmd0aCkge1xuICAgICAgaWYgKCF0b0xvYWQucGVuZGluZy5sZW5ndGgpIGNhbGxiYWNrKCk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgdG9Mb2FkLnRvTG9hZC5mb3JFYWNoKG5hbWUgPT4ge1xuICAgICAgdGhpcy5sb2FkT25lKG5hbWUpO1xuICAgIH0pO1xuICB9XG4gIGxvYWQobGFuZ3VhZ2VzLCBuYW1lc3BhY2VzLCBjYWxsYmFjaykge1xuICAgIHRoaXMucHJlcGFyZUxvYWRpbmcobGFuZ3VhZ2VzLCBuYW1lc3BhY2VzLCB7fSwgY2FsbGJhY2spO1xuICB9XG4gIHJlbG9hZChsYW5ndWFnZXMsIG5hbWVzcGFjZXMsIGNhbGxiYWNrKSB7XG4gICAgdGhpcy5wcmVwYXJlTG9hZGluZyhsYW5ndWFnZXMsIG5hbWVzcGFjZXMsIHtcbiAgICAgIHJlbG9hZDogdHJ1ZVxuICAgIH0sIGNhbGxiYWNrKTtcbiAgfVxuICBsb2FkT25lKG5hbWUpIHtcbiAgICBsZXQgcHJlZml4ID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiAnJztcbiAgICBjb25zdCBzID0gbmFtZS5zcGxpdCgnfCcpO1xuICAgIGNvbnN0IGxuZyA9IHNbMF07XG4gICAgY29uc3QgbnMgPSBzWzFdO1xuICAgIHRoaXMucmVhZChsbmcsIG5zLCAncmVhZCcsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCAoZXJyLCBkYXRhKSA9PiB7XG4gICAgICBpZiAoZXJyKSB0aGlzLmxvZ2dlci53YXJuKGAke3ByZWZpeH1sb2FkaW5nIG5hbWVzcGFjZSAke25zfSBmb3IgbGFuZ3VhZ2UgJHtsbmd9IGZhaWxlZGAsIGVycik7XG4gICAgICBpZiAoIWVyciAmJiBkYXRhKSB0aGlzLmxvZ2dlci5sb2coYCR7cHJlZml4fWxvYWRlZCBuYW1lc3BhY2UgJHtuc30gZm9yIGxhbmd1YWdlICR7bG5nfWAsIGRhdGEpO1xuICAgICAgdGhpcy5sb2FkZWQobmFtZSwgZXJyLCBkYXRhKTtcbiAgICB9KTtcbiAgfVxuICBzYXZlTWlzc2luZyhsYW5ndWFnZXMsIG5hbWVzcGFjZSwga2V5LCBmYWxsYmFja1ZhbHVlLCBpc1VwZGF0ZSkge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDUgJiYgYXJndW1lbnRzWzVdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbNV0gOiB7fTtcbiAgICBsZXQgY2xiID0gYXJndW1lbnRzLmxlbmd0aCA+IDYgJiYgYXJndW1lbnRzWzZdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbNl0gOiAoKSA9PiB7fTtcbiAgICBpZiAodGhpcy5zZXJ2aWNlcy51dGlscyAmJiB0aGlzLnNlcnZpY2VzLnV0aWxzLmhhc0xvYWRlZE5hbWVzcGFjZSAmJiAhdGhpcy5zZXJ2aWNlcy51dGlscy5oYXNMb2FkZWROYW1lc3BhY2UobmFtZXNwYWNlKSkge1xuICAgICAgdGhpcy5sb2dnZXIud2FybihgZGlkIG5vdCBzYXZlIGtleSBcIiR7a2V5fVwiIGFzIHRoZSBuYW1lc3BhY2UgXCIke25hbWVzcGFjZX1cIiB3YXMgbm90IHlldCBsb2FkZWRgLCAnVGhpcyBtZWFucyBzb21ldGhpbmcgSVMgV1JPTkcgaW4geW91ciBzZXR1cC4gWW91IGFjY2VzcyB0aGUgdCBmdW5jdGlvbiBiZWZvcmUgaTE4bmV4dC5pbml0IC8gaTE4bmV4dC5sb2FkTmFtZXNwYWNlIC8gaTE4bmV4dC5jaGFuZ2VMYW5ndWFnZSB3YXMgZG9uZS4gV2FpdCBmb3IgdGhlIGNhbGxiYWNrIG9yIFByb21pc2UgdG8gcmVzb2x2ZSBiZWZvcmUgYWNjZXNzaW5nIGl0ISEhJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChrZXkgPT09IHVuZGVmaW5lZCB8fCBrZXkgPT09IG51bGwgfHwga2V5ID09PSAnJykgcmV0dXJuO1xuICAgIGlmICh0aGlzLmJhY2tlbmQgJiYgdGhpcy5iYWNrZW5kLmNyZWF0ZSkge1xuICAgICAgY29uc3Qgb3B0cyA9IHtcbiAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgaXNVcGRhdGVcbiAgICAgIH07XG4gICAgICBjb25zdCBmYyA9IHRoaXMuYmFja2VuZC5jcmVhdGUuYmluZCh0aGlzLmJhY2tlbmQpO1xuICAgICAgaWYgKGZjLmxlbmd0aCA8IDYpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBsZXQgcjtcbiAgICAgICAgICBpZiAoZmMubGVuZ3RoID09PSA1KSB7XG4gICAgICAgICAgICByID0gZmMobGFuZ3VhZ2VzLCBuYW1lc3BhY2UsIGtleSwgZmFsbGJhY2tWYWx1ZSwgb3B0cyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHIgPSBmYyhsYW5ndWFnZXMsIG5hbWVzcGFjZSwga2V5LCBmYWxsYmFja1ZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHIgJiYgdHlwZW9mIHIudGhlbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgci50aGVuKGRhdGEgPT4gY2xiKG51bGwsIGRhdGEpKS5jYXRjaChjbGIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjbGIobnVsbCwgcik7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICBjbGIoZXJyKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZmMobGFuZ3VhZ2VzLCBuYW1lc3BhY2UsIGtleSwgZmFsbGJhY2tWYWx1ZSwgY2xiLCBvcHRzKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFsYW5ndWFnZXMgfHwgIWxhbmd1YWdlc1swXSkgcmV0dXJuO1xuICAgIHRoaXMuc3RvcmUuYWRkUmVzb3VyY2UobGFuZ3VhZ2VzWzBdLCBuYW1lc3BhY2UsIGtleSwgZmFsbGJhY2tWYWx1ZSk7XG4gIH1cbn1cblxuY29uc3QgZ2V0ID0gKCkgPT4gKHtcbiAgZGVidWc6IGZhbHNlLFxuICBpbml0SW1tZWRpYXRlOiB0cnVlLFxuICBuczogWyd0cmFuc2xhdGlvbiddLFxuICBkZWZhdWx0TlM6IFsndHJhbnNsYXRpb24nXSxcbiAgZmFsbGJhY2tMbmc6IFsnZGV2J10sXG4gIGZhbGxiYWNrTlM6IGZhbHNlLFxuICBzdXBwb3J0ZWRMbmdzOiBmYWxzZSxcbiAgbm9uRXhwbGljaXRTdXBwb3J0ZWRMbmdzOiBmYWxzZSxcbiAgbG9hZDogJ2FsbCcsXG4gIHByZWxvYWQ6IGZhbHNlLFxuICBzaW1wbGlmeVBsdXJhbFN1ZmZpeDogdHJ1ZSxcbiAga2V5U2VwYXJhdG9yOiAnLicsXG4gIG5zU2VwYXJhdG9yOiAnOicsXG4gIHBsdXJhbFNlcGFyYXRvcjogJ18nLFxuICBjb250ZXh0U2VwYXJhdG9yOiAnXycsXG4gIHBhcnRpYWxCdW5kbGVkTGFuZ3VhZ2VzOiBmYWxzZSxcbiAgc2F2ZU1pc3Npbmc6IGZhbHNlLFxuICB1cGRhdGVNaXNzaW5nOiBmYWxzZSxcbiAgc2F2ZU1pc3NpbmdUbzogJ2ZhbGxiYWNrJyxcbiAgc2F2ZU1pc3NpbmdQbHVyYWxzOiB0cnVlLFxuICBtaXNzaW5nS2V5SGFuZGxlcjogZmFsc2UsXG4gIG1pc3NpbmdJbnRlcnBvbGF0aW9uSGFuZGxlcjogZmFsc2UsXG4gIHBvc3RQcm9jZXNzOiBmYWxzZSxcbiAgcG9zdFByb2Nlc3NQYXNzUmVzb2x2ZWQ6IGZhbHNlLFxuICByZXR1cm5OdWxsOiBmYWxzZSxcbiAgcmV0dXJuRW1wdHlTdHJpbmc6IHRydWUsXG4gIHJldHVybk9iamVjdHM6IGZhbHNlLFxuICBqb2luQXJyYXlzOiBmYWxzZSxcbiAgcmV0dXJuZWRPYmplY3RIYW5kbGVyOiBmYWxzZSxcbiAgcGFyc2VNaXNzaW5nS2V5SGFuZGxlcjogZmFsc2UsXG4gIGFwcGVuZE5hbWVzcGFjZVRvTWlzc2luZ0tleTogZmFsc2UsXG4gIGFwcGVuZE5hbWVzcGFjZVRvQ0lNb2RlOiBmYWxzZSxcbiAgb3ZlcmxvYWRUcmFuc2xhdGlvbk9wdGlvbkhhbmRsZXI6IGFyZ3MgPT4ge1xuICAgIGxldCByZXQgPSB7fTtcbiAgICBpZiAodHlwZW9mIGFyZ3NbMV0gPT09ICdvYmplY3QnKSByZXQgPSBhcmdzWzFdO1xuICAgIGlmICh0eXBlb2YgYXJnc1sxXSA9PT0gJ3N0cmluZycpIHJldC5kZWZhdWx0VmFsdWUgPSBhcmdzWzFdO1xuICAgIGlmICh0eXBlb2YgYXJnc1syXSA9PT0gJ3N0cmluZycpIHJldC50RGVzY3JpcHRpb24gPSBhcmdzWzJdO1xuICAgIGlmICh0eXBlb2YgYXJnc1syXSA9PT0gJ29iamVjdCcgfHwgdHlwZW9mIGFyZ3NbM10gPT09ICdvYmplY3QnKSB7XG4gICAgICBjb25zdCBvcHRpb25zID0gYXJnc1szXSB8fCBhcmdzWzJdO1xuICAgICAgT2JqZWN0LmtleXMob3B0aW9ucykuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICByZXRba2V5XSA9IG9wdGlvbnNba2V5XTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9LFxuICBpbnRlcnBvbGF0aW9uOiB7XG4gICAgZXNjYXBlVmFsdWU6IHRydWUsXG4gICAgZm9ybWF0OiB2YWx1ZSA9PiB2YWx1ZSxcbiAgICBwcmVmaXg6ICd7eycsXG4gICAgc3VmZml4OiAnfX0nLFxuICAgIGZvcm1hdFNlcGFyYXRvcjogJywnLFxuICAgIHVuZXNjYXBlUHJlZml4OiAnLScsXG4gICAgbmVzdGluZ1ByZWZpeDogJyR0KCcsXG4gICAgbmVzdGluZ1N1ZmZpeDogJyknLFxuICAgIG5lc3RpbmdPcHRpb25zU2VwYXJhdG9yOiAnLCcsXG4gICAgbWF4UmVwbGFjZXM6IDEwMDAsXG4gICAgc2tpcE9uVmFyaWFibGVzOiB0cnVlXG4gIH1cbn0pO1xuY29uc3QgdHJhbnNmb3JtT3B0aW9ucyA9IG9wdGlvbnMgPT4ge1xuICBpZiAodHlwZW9mIG9wdGlvbnMubnMgPT09ICdzdHJpbmcnKSBvcHRpb25zLm5zID0gW29wdGlvbnMubnNdO1xuICBpZiAodHlwZW9mIG9wdGlvbnMuZmFsbGJhY2tMbmcgPT09ICdzdHJpbmcnKSBvcHRpb25zLmZhbGxiYWNrTG5nID0gW29wdGlvbnMuZmFsbGJhY2tMbmddO1xuICBpZiAodHlwZW9mIG9wdGlvbnMuZmFsbGJhY2tOUyA9PT0gJ3N0cmluZycpIG9wdGlvbnMuZmFsbGJhY2tOUyA9IFtvcHRpb25zLmZhbGxiYWNrTlNdO1xuICBpZiAob3B0aW9ucy5zdXBwb3J0ZWRMbmdzICYmIG9wdGlvbnMuc3VwcG9ydGVkTG5ncy5pbmRleE9mKCdjaW1vZGUnKSA8IDApIHtcbiAgICBvcHRpb25zLnN1cHBvcnRlZExuZ3MgPSBvcHRpb25zLnN1cHBvcnRlZExuZ3MuY29uY2F0KFsnY2ltb2RlJ10pO1xuICB9XG4gIHJldHVybiBvcHRpb25zO1xufTtcblxuY29uc3Qgbm9vcCA9ICgpID0+IHt9O1xuY29uc3QgYmluZE1lbWJlckZ1bmN0aW9ucyA9IGluc3QgPT4ge1xuICBjb25zdCBtZW1zID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoT2JqZWN0LmdldFByb3RvdHlwZU9mKGluc3QpKTtcbiAgbWVtcy5mb3JFYWNoKG1lbSA9PiB7XG4gICAgaWYgKHR5cGVvZiBpbnN0W21lbV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGluc3RbbWVtXSA9IGluc3RbbWVtXS5iaW5kKGluc3QpO1xuICAgIH1cbiAgfSk7XG59O1xuY2xhc3MgSTE4biBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiB7fTtcbiAgICBsZXQgY2FsbGJhY2sgPSBhcmd1bWVudHMubGVuZ3RoID4gMSA/IGFyZ3VtZW50c1sxXSA6IHVuZGVmaW5lZDtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMub3B0aW9ucyA9IHRyYW5zZm9ybU9wdGlvbnMob3B0aW9ucyk7XG4gICAgdGhpcy5zZXJ2aWNlcyA9IHt9O1xuICAgIHRoaXMubG9nZ2VyID0gYmFzZUxvZ2dlcjtcbiAgICB0aGlzLm1vZHVsZXMgPSB7XG4gICAgICBleHRlcm5hbDogW11cbiAgICB9O1xuICAgIGJpbmRNZW1iZXJGdW5jdGlvbnModGhpcyk7XG4gICAgaWYgKGNhbGxiYWNrICYmICF0aGlzLmlzSW5pdGlhbGl6ZWQgJiYgIW9wdGlvbnMuaXNDbG9uZSkge1xuICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuaW5pdEltbWVkaWF0ZSkge1xuICAgICAgICB0aGlzLmluaXQob3B0aW9ucywgY2FsbGJhY2spO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLmluaXQob3B0aW9ucywgY2FsbGJhY2spO1xuICAgICAgfSwgMCk7XG4gICAgfVxuICB9XG4gIGluaXQoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDoge307XG4gICAgbGV0IGNhbGxiYWNrID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgPyBhcmd1bWVudHNbMV0gOiB1bmRlZmluZWQ7XG4gICAgdGhpcy5pc0luaXRpYWxpemluZyA9IHRydWU7XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjYWxsYmFjayA9IG9wdGlvbnM7XG4gICAgICBvcHRpb25zID0ge307XG4gICAgfVxuICAgIGlmICghb3B0aW9ucy5kZWZhdWx0TlMgJiYgb3B0aW9ucy5kZWZhdWx0TlMgIT09IGZhbHNlICYmIG9wdGlvbnMubnMpIHtcbiAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5ucyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgb3B0aW9ucy5kZWZhdWx0TlMgPSBvcHRpb25zLm5zO1xuICAgICAgfSBlbHNlIGlmIChvcHRpb25zLm5zLmluZGV4T2YoJ3RyYW5zbGF0aW9uJykgPCAwKSB7XG4gICAgICAgIG9wdGlvbnMuZGVmYXVsdE5TID0gb3B0aW9ucy5uc1swXTtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgZGVmT3B0cyA9IGdldCgpO1xuICAgIHRoaXMub3B0aW9ucyA9IHtcbiAgICAgIC4uLmRlZk9wdHMsXG4gICAgICAuLi50aGlzLm9wdGlvbnMsXG4gICAgICAuLi50cmFuc2Zvcm1PcHRpb25zKG9wdGlvbnMpXG4gICAgfTtcbiAgICBpZiAodGhpcy5vcHRpb25zLmNvbXBhdGliaWxpdHlBUEkgIT09ICd2MScpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5pbnRlcnBvbGF0aW9uID0ge1xuICAgICAgICAuLi5kZWZPcHRzLmludGVycG9sYXRpb24sXG4gICAgICAgIC4uLnRoaXMub3B0aW9ucy5pbnRlcnBvbGF0aW9uXG4gICAgICB9O1xuICAgIH1cbiAgICBpZiAob3B0aW9ucy5rZXlTZXBhcmF0b3IgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5vcHRpb25zLnVzZXJEZWZpbmVkS2V5U2VwYXJhdG9yID0gb3B0aW9ucy5rZXlTZXBhcmF0b3I7XG4gICAgfVxuICAgIGlmIChvcHRpb25zLm5zU2VwYXJhdG9yICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMub3B0aW9ucy51c2VyRGVmaW5lZE5zU2VwYXJhdG9yID0gb3B0aW9ucy5uc1NlcGFyYXRvcjtcbiAgICB9XG4gICAgY29uc3QgY3JlYXRlQ2xhc3NPbkRlbWFuZCA9IENsYXNzT3JPYmplY3QgPT4ge1xuICAgICAgaWYgKCFDbGFzc09yT2JqZWN0KSByZXR1cm4gbnVsbDtcbiAgICAgIGlmICh0eXBlb2YgQ2xhc3NPck9iamVjdCA9PT0gJ2Z1bmN0aW9uJykgcmV0dXJuIG5ldyBDbGFzc09yT2JqZWN0KCk7XG4gICAgICByZXR1cm4gQ2xhc3NPck9iamVjdDtcbiAgICB9O1xuICAgIGlmICghdGhpcy5vcHRpb25zLmlzQ2xvbmUpIHtcbiAgICAgIGlmICh0aGlzLm1vZHVsZXMubG9nZ2VyKSB7XG4gICAgICAgIGJhc2VMb2dnZXIuaW5pdChjcmVhdGVDbGFzc09uRGVtYW5kKHRoaXMubW9kdWxlcy5sb2dnZXIpLCB0aGlzLm9wdGlvbnMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYmFzZUxvZ2dlci5pbml0KG51bGwsIHRoaXMub3B0aW9ucyk7XG4gICAgICB9XG4gICAgICBsZXQgZm9ybWF0dGVyO1xuICAgICAgaWYgKHRoaXMubW9kdWxlcy5mb3JtYXR0ZXIpIHtcbiAgICAgICAgZm9ybWF0dGVyID0gdGhpcy5tb2R1bGVzLmZvcm1hdHRlcjtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIEludGwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGZvcm1hdHRlciA9IEZvcm1hdHRlcjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGx1ID0gbmV3IExhbmd1YWdlVXRpbCh0aGlzLm9wdGlvbnMpO1xuICAgICAgdGhpcy5zdG9yZSA9IG5ldyBSZXNvdXJjZVN0b3JlKHRoaXMub3B0aW9ucy5yZXNvdXJjZXMsIHRoaXMub3B0aW9ucyk7XG4gICAgICBjb25zdCBzID0gdGhpcy5zZXJ2aWNlcztcbiAgICAgIHMubG9nZ2VyID0gYmFzZUxvZ2dlcjtcbiAgICAgIHMucmVzb3VyY2VTdG9yZSA9IHRoaXMuc3RvcmU7XG4gICAgICBzLmxhbmd1YWdlVXRpbHMgPSBsdTtcbiAgICAgIHMucGx1cmFsUmVzb2x2ZXIgPSBuZXcgUGx1cmFsUmVzb2x2ZXIobHUsIHtcbiAgICAgICAgcHJlcGVuZDogdGhpcy5vcHRpb25zLnBsdXJhbFNlcGFyYXRvcixcbiAgICAgICAgY29tcGF0aWJpbGl0eUpTT046IHRoaXMub3B0aW9ucy5jb21wYXRpYmlsaXR5SlNPTixcbiAgICAgICAgc2ltcGxpZnlQbHVyYWxTdWZmaXg6IHRoaXMub3B0aW9ucy5zaW1wbGlmeVBsdXJhbFN1ZmZpeFxuICAgICAgfSk7XG4gICAgICBpZiAoZm9ybWF0dGVyICYmICghdGhpcy5vcHRpb25zLmludGVycG9sYXRpb24uZm9ybWF0IHx8IHRoaXMub3B0aW9ucy5pbnRlcnBvbGF0aW9uLmZvcm1hdCA9PT0gZGVmT3B0cy5pbnRlcnBvbGF0aW9uLmZvcm1hdCkpIHtcbiAgICAgICAgcy5mb3JtYXR0ZXIgPSBjcmVhdGVDbGFzc09uRGVtYW5kKGZvcm1hdHRlcik7XG4gICAgICAgIHMuZm9ybWF0dGVyLmluaXQocywgdGhpcy5vcHRpb25zKTtcbiAgICAgICAgdGhpcy5vcHRpb25zLmludGVycG9sYXRpb24uZm9ybWF0ID0gcy5mb3JtYXR0ZXIuZm9ybWF0LmJpbmQocy5mb3JtYXR0ZXIpO1xuICAgICAgfVxuICAgICAgcy5pbnRlcnBvbGF0b3IgPSBuZXcgSW50ZXJwb2xhdG9yKHRoaXMub3B0aW9ucyk7XG4gICAgICBzLnV0aWxzID0ge1xuICAgICAgICBoYXNMb2FkZWROYW1lc3BhY2U6IHRoaXMuaGFzTG9hZGVkTmFtZXNwYWNlLmJpbmQodGhpcylcbiAgICAgIH07XG4gICAgICBzLmJhY2tlbmRDb25uZWN0b3IgPSBuZXcgQ29ubmVjdG9yKGNyZWF0ZUNsYXNzT25EZW1hbmQodGhpcy5tb2R1bGVzLmJhY2tlbmQpLCBzLnJlc291cmNlU3RvcmUsIHMsIHRoaXMub3B0aW9ucyk7XG4gICAgICBzLmJhY2tlbmRDb25uZWN0b3Iub24oJyonLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgZm9yICh2YXIgX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBuZXcgQXJyYXkoX2xlbiA+IDEgPyBfbGVuIC0gMSA6IDApLCBfa2V5ID0gMTsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgICAgICAgIGFyZ3NbX2tleSAtIDFdID0gYXJndW1lbnRzW19rZXldO1xuICAgICAgICB9XG4gICAgICAgIF90aGlzLmVtaXQoZXZlbnQsIC4uLmFyZ3MpO1xuICAgICAgfSk7XG4gICAgICBpZiAodGhpcy5tb2R1bGVzLmxhbmd1YWdlRGV0ZWN0b3IpIHtcbiAgICAgICAgcy5sYW5ndWFnZURldGVjdG9yID0gY3JlYXRlQ2xhc3NPbkRlbWFuZCh0aGlzLm1vZHVsZXMubGFuZ3VhZ2VEZXRlY3Rvcik7XG4gICAgICAgIGlmIChzLmxhbmd1YWdlRGV0ZWN0b3IuaW5pdCkgcy5sYW5ndWFnZURldGVjdG9yLmluaXQocywgdGhpcy5vcHRpb25zLmRldGVjdGlvbiwgdGhpcy5vcHRpb25zKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLm1vZHVsZXMuaTE4bkZvcm1hdCkge1xuICAgICAgICBzLmkxOG5Gb3JtYXQgPSBjcmVhdGVDbGFzc09uRGVtYW5kKHRoaXMubW9kdWxlcy5pMThuRm9ybWF0KTtcbiAgICAgICAgaWYgKHMuaTE4bkZvcm1hdC5pbml0KSBzLmkxOG5Gb3JtYXQuaW5pdCh0aGlzKTtcbiAgICAgIH1cbiAgICAgIHRoaXMudHJhbnNsYXRvciA9IG5ldyBUcmFuc2xhdG9yKHRoaXMuc2VydmljZXMsIHRoaXMub3B0aW9ucyk7XG4gICAgICB0aGlzLnRyYW5zbGF0b3Iub24oJyonLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgZm9yICh2YXIgX2xlbjIgPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gbmV3IEFycmF5KF9sZW4yID4gMSA/IF9sZW4yIC0gMSA6IDApLCBfa2V5MiA9IDE7IF9rZXkyIDwgX2xlbjI7IF9rZXkyKyspIHtcbiAgICAgICAgICBhcmdzW19rZXkyIC0gMV0gPSBhcmd1bWVudHNbX2tleTJdO1xuICAgICAgICB9XG4gICAgICAgIF90aGlzLmVtaXQoZXZlbnQsIC4uLmFyZ3MpO1xuICAgICAgfSk7XG4gICAgICB0aGlzLm1vZHVsZXMuZXh0ZXJuYWwuZm9yRWFjaChtID0+IHtcbiAgICAgICAgaWYgKG0uaW5pdCkgbS5pbml0KHRoaXMpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHRoaXMuZm9ybWF0ID0gdGhpcy5vcHRpb25zLmludGVycG9sYXRpb24uZm9ybWF0O1xuICAgIGlmICghY2FsbGJhY2spIGNhbGxiYWNrID0gbm9vcDtcbiAgICBpZiAodGhpcy5vcHRpb25zLmZhbGxiYWNrTG5nICYmICF0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IgJiYgIXRoaXMub3B0aW9ucy5sbmcpIHtcbiAgICAgIGNvbnN0IGNvZGVzID0gdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZVV0aWxzLmdldEZhbGxiYWNrQ29kZXModGhpcy5vcHRpb25zLmZhbGxiYWNrTG5nKTtcbiAgICAgIGlmIChjb2Rlcy5sZW5ndGggPiAwICYmIGNvZGVzWzBdICE9PSAnZGV2JykgdGhpcy5vcHRpb25zLmxuZyA9IGNvZGVzWzBdO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuc2VydmljZXMubGFuZ3VhZ2VEZXRlY3RvciAmJiAhdGhpcy5vcHRpb25zLmxuZykge1xuICAgICAgdGhpcy5sb2dnZXIud2FybignaW5pdDogbm8gbGFuZ3VhZ2VEZXRlY3RvciBpcyB1c2VkIGFuZCBubyBsbmcgaXMgZGVmaW5lZCcpO1xuICAgIH1cbiAgICBjb25zdCBzdG9yZUFwaSA9IFsnZ2V0UmVzb3VyY2UnLCAnaGFzUmVzb3VyY2VCdW5kbGUnLCAnZ2V0UmVzb3VyY2VCdW5kbGUnLCAnZ2V0RGF0YUJ5TGFuZ3VhZ2UnXTtcbiAgICBzdG9yZUFwaS5mb3JFYWNoKGZjTmFtZSA9PiB7XG4gICAgICB0aGlzW2ZjTmFtZV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBfdGhpcy5zdG9yZVtmY05hbWVdKC4uLmFyZ3VtZW50cyk7XG4gICAgICB9O1xuICAgIH0pO1xuICAgIGNvbnN0IHN0b3JlQXBpQ2hhaW5lZCA9IFsnYWRkUmVzb3VyY2UnLCAnYWRkUmVzb3VyY2VzJywgJ2FkZFJlc291cmNlQnVuZGxlJywgJ3JlbW92ZVJlc291cmNlQnVuZGxlJ107XG4gICAgc3RvcmVBcGlDaGFpbmVkLmZvckVhY2goZmNOYW1lID0+IHtcbiAgICAgIHRoaXNbZmNOYW1lXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgX3RoaXMuc3RvcmVbZmNOYW1lXSguLi5hcmd1bWVudHMpO1xuICAgICAgICByZXR1cm4gX3RoaXM7XG4gICAgICB9O1xuICAgIH0pO1xuICAgIGNvbnN0IGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBjb25zdCBsb2FkID0gKCkgPT4ge1xuICAgICAgY29uc3QgZmluaXNoID0gKGVyciwgdCkgPT4ge1xuICAgICAgICB0aGlzLmlzSW5pdGlhbGl6aW5nID0gZmFsc2U7XG4gICAgICAgIGlmICh0aGlzLmlzSW5pdGlhbGl6ZWQgJiYgIXRoaXMuaW5pdGlhbGl6ZWRTdG9yZU9uY2UpIHRoaXMubG9nZ2VyLndhcm4oJ2luaXQ6IGkxOG5leHQgaXMgYWxyZWFkeSBpbml0aWFsaXplZC4gWW91IHNob3VsZCBjYWxsIGluaXQganVzdCBvbmNlIScpO1xuICAgICAgICB0aGlzLmlzSW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5pc0Nsb25lKSB0aGlzLmxvZ2dlci5sb2coJ2luaXRpYWxpemVkJywgdGhpcy5vcHRpb25zKTtcbiAgICAgICAgdGhpcy5lbWl0KCdpbml0aWFsaXplZCcsIHRoaXMub3B0aW9ucyk7XG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUodCk7XG4gICAgICAgIGNhbGxiYWNrKGVyciwgdCk7XG4gICAgICB9O1xuICAgICAgaWYgKHRoaXMubGFuZ3VhZ2VzICYmIHRoaXMub3B0aW9ucy5jb21wYXRpYmlsaXR5QVBJICE9PSAndjEnICYmICF0aGlzLmlzSW5pdGlhbGl6ZWQpIHJldHVybiBmaW5pc2gobnVsbCwgdGhpcy50LmJpbmQodGhpcykpO1xuICAgICAgdGhpcy5jaGFuZ2VMYW5ndWFnZSh0aGlzLm9wdGlvbnMubG5nLCBmaW5pc2gpO1xuICAgIH07XG4gICAgaWYgKHRoaXMub3B0aW9ucy5yZXNvdXJjZXMgfHwgIXRoaXMub3B0aW9ucy5pbml0SW1tZWRpYXRlKSB7XG4gICAgICBsb2FkKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNldFRpbWVvdXQobG9hZCwgMCk7XG4gICAgfVxuICAgIHJldHVybiBkZWZlcnJlZDtcbiAgfVxuICBsb2FkUmVzb3VyY2VzKGxhbmd1YWdlKSB7XG4gICAgbGV0IGNhbGxiYWNrID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiBub29wO1xuICAgIGxldCB1c2VkQ2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICBjb25zdCB1c2VkTG5nID0gdHlwZW9mIGxhbmd1YWdlID09PSAnc3RyaW5nJyA/IGxhbmd1YWdlIDogdGhpcy5sYW5ndWFnZTtcbiAgICBpZiAodHlwZW9mIGxhbmd1YWdlID09PSAnZnVuY3Rpb24nKSB1c2VkQ2FsbGJhY2sgPSBsYW5ndWFnZTtcbiAgICBpZiAoIXRoaXMub3B0aW9ucy5yZXNvdXJjZXMgfHwgdGhpcy5vcHRpb25zLnBhcnRpYWxCdW5kbGVkTGFuZ3VhZ2VzKSB7XG4gICAgICBpZiAodXNlZExuZyAmJiB1c2VkTG5nLnRvTG93ZXJDYXNlKCkgPT09ICdjaW1vZGUnICYmICghdGhpcy5vcHRpb25zLnByZWxvYWQgfHwgdGhpcy5vcHRpb25zLnByZWxvYWQubGVuZ3RoID09PSAwKSkgcmV0dXJuIHVzZWRDYWxsYmFjaygpO1xuICAgICAgY29uc3QgdG9Mb2FkID0gW107XG4gICAgICBjb25zdCBhcHBlbmQgPSBsbmcgPT4ge1xuICAgICAgICBpZiAoIWxuZykgcmV0dXJuO1xuICAgICAgICBpZiAobG5nID09PSAnY2ltb2RlJykgcmV0dXJuO1xuICAgICAgICBjb25zdCBsbmdzID0gdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZVV0aWxzLnRvUmVzb2x2ZUhpZXJhcmNoeShsbmcpO1xuICAgICAgICBsbmdzLmZvckVhY2gobCA9PiB7XG4gICAgICAgICAgaWYgKGwgPT09ICdjaW1vZGUnKSByZXR1cm47XG4gICAgICAgICAgaWYgKHRvTG9hZC5pbmRleE9mKGwpIDwgMCkgdG9Mb2FkLnB1c2gobCk7XG4gICAgICAgIH0pO1xuICAgICAgfTtcbiAgICAgIGlmICghdXNlZExuZykge1xuICAgICAgICBjb25zdCBmYWxsYmFja3MgPSB0aGlzLnNlcnZpY2VzLmxhbmd1YWdlVXRpbHMuZ2V0RmFsbGJhY2tDb2Rlcyh0aGlzLm9wdGlvbnMuZmFsbGJhY2tMbmcpO1xuICAgICAgICBmYWxsYmFja3MuZm9yRWFjaChsID0+IGFwcGVuZChsKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhcHBlbmQodXNlZExuZyk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5vcHRpb25zLnByZWxvYWQpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLnByZWxvYWQuZm9yRWFjaChsID0+IGFwcGVuZChsKSk7XG4gICAgICB9XG4gICAgICB0aGlzLnNlcnZpY2VzLmJhY2tlbmRDb25uZWN0b3IubG9hZCh0b0xvYWQsIHRoaXMub3B0aW9ucy5ucywgZSA9PiB7XG4gICAgICAgIGlmICghZSAmJiAhdGhpcy5yZXNvbHZlZExhbmd1YWdlICYmIHRoaXMubGFuZ3VhZ2UpIHRoaXMuc2V0UmVzb2x2ZWRMYW5ndWFnZSh0aGlzLmxhbmd1YWdlKTtcbiAgICAgICAgdXNlZENhbGxiYWNrKGUpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHVzZWRDYWxsYmFjayhudWxsKTtcbiAgICB9XG4gIH1cbiAgcmVsb2FkUmVzb3VyY2VzKGxuZ3MsIG5zLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBpZiAoIWxuZ3MpIGxuZ3MgPSB0aGlzLmxhbmd1YWdlcztcbiAgICBpZiAoIW5zKSBucyA9IHRoaXMub3B0aW9ucy5ucztcbiAgICBpZiAoIWNhbGxiYWNrKSBjYWxsYmFjayA9IG5vb3A7XG4gICAgdGhpcy5zZXJ2aWNlcy5iYWNrZW5kQ29ubmVjdG9yLnJlbG9hZChsbmdzLCBucywgZXJyID0+IHtcbiAgICAgIGRlZmVycmVkLnJlc29sdmUoKTtcbiAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgfSk7XG4gICAgcmV0dXJuIGRlZmVycmVkO1xuICB9XG4gIHVzZShtb2R1bGUpIHtcbiAgICBpZiAoIW1vZHVsZSkgdGhyb3cgbmV3IEVycm9yKCdZb3UgYXJlIHBhc3NpbmcgYW4gdW5kZWZpbmVkIG1vZHVsZSEgUGxlYXNlIGNoZWNrIHRoZSBvYmplY3QgeW91IGFyZSBwYXNzaW5nIHRvIGkxOG5leHQudXNlKCknKTtcbiAgICBpZiAoIW1vZHVsZS50eXBlKSB0aHJvdyBuZXcgRXJyb3IoJ1lvdSBhcmUgcGFzc2luZyBhIHdyb25nIG1vZHVsZSEgUGxlYXNlIGNoZWNrIHRoZSBvYmplY3QgeW91IGFyZSBwYXNzaW5nIHRvIGkxOG5leHQudXNlKCknKTtcbiAgICBpZiAobW9kdWxlLnR5cGUgPT09ICdiYWNrZW5kJykge1xuICAgICAgdGhpcy5tb2R1bGVzLmJhY2tlbmQgPSBtb2R1bGU7XG4gICAgfVxuICAgIGlmIChtb2R1bGUudHlwZSA9PT0gJ2xvZ2dlcicgfHwgbW9kdWxlLmxvZyAmJiBtb2R1bGUud2FybiAmJiBtb2R1bGUuZXJyb3IpIHtcbiAgICAgIHRoaXMubW9kdWxlcy5sb2dnZXIgPSBtb2R1bGU7XG4gICAgfVxuICAgIGlmIChtb2R1bGUudHlwZSA9PT0gJ2xhbmd1YWdlRGV0ZWN0b3InKSB7XG4gICAgICB0aGlzLm1vZHVsZXMubGFuZ3VhZ2VEZXRlY3RvciA9IG1vZHVsZTtcbiAgICB9XG4gICAgaWYgKG1vZHVsZS50eXBlID09PSAnaTE4bkZvcm1hdCcpIHtcbiAgICAgIHRoaXMubW9kdWxlcy5pMThuRm9ybWF0ID0gbW9kdWxlO1xuICAgIH1cbiAgICBpZiAobW9kdWxlLnR5cGUgPT09ICdwb3N0UHJvY2Vzc29yJykge1xuICAgICAgcG9zdFByb2Nlc3Nvci5hZGRQb3N0UHJvY2Vzc29yKG1vZHVsZSk7XG4gICAgfVxuICAgIGlmIChtb2R1bGUudHlwZSA9PT0gJ2Zvcm1hdHRlcicpIHtcbiAgICAgIHRoaXMubW9kdWxlcy5mb3JtYXR0ZXIgPSBtb2R1bGU7XG4gICAgfVxuICAgIGlmIChtb2R1bGUudHlwZSA9PT0gJzNyZFBhcnR5Jykge1xuICAgICAgdGhpcy5tb2R1bGVzLmV4dGVybmFsLnB1c2gobW9kdWxlKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgc2V0UmVzb2x2ZWRMYW5ndWFnZShsKSB7XG4gICAgaWYgKCFsIHx8ICF0aGlzLmxhbmd1YWdlcykgcmV0dXJuO1xuICAgIGlmIChbJ2NpbW9kZScsICdkZXYnXS5pbmRleE9mKGwpID4gLTEpIHJldHVybjtcbiAgICBmb3IgKGxldCBsaSA9IDA7IGxpIDwgdGhpcy5sYW5ndWFnZXMubGVuZ3RoOyBsaSsrKSB7XG4gICAgICBjb25zdCBsbmdJbkxuZ3MgPSB0aGlzLmxhbmd1YWdlc1tsaV07XG4gICAgICBpZiAoWydjaW1vZGUnLCAnZGV2J10uaW5kZXhPZihsbmdJbkxuZ3MpID4gLTEpIGNvbnRpbnVlO1xuICAgICAgaWYgKHRoaXMuc3RvcmUuaGFzTGFuZ3VhZ2VTb21lVHJhbnNsYXRpb25zKGxuZ0luTG5ncykpIHtcbiAgICAgICAgdGhpcy5yZXNvbHZlZExhbmd1YWdlID0gbG5nSW5MbmdzO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgY2hhbmdlTGFuZ3VhZ2UobG5nLCBjYWxsYmFjaykge1xuICAgIHZhciBfdGhpczIgPSB0aGlzO1xuICAgIHRoaXMuaXNMYW5ndWFnZUNoYW5naW5nVG8gPSBsbmc7XG4gICAgY29uc3QgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIHRoaXMuZW1pdCgnbGFuZ3VhZ2VDaGFuZ2luZycsIGxuZyk7XG4gICAgY29uc3Qgc2V0TG5nUHJvcHMgPSBsID0+IHtcbiAgICAgIHRoaXMubGFuZ3VhZ2UgPSBsO1xuICAgICAgdGhpcy5sYW5ndWFnZXMgPSB0aGlzLnNlcnZpY2VzLmxhbmd1YWdlVXRpbHMudG9SZXNvbHZlSGllcmFyY2h5KGwpO1xuICAgICAgdGhpcy5yZXNvbHZlZExhbmd1YWdlID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5zZXRSZXNvbHZlZExhbmd1YWdlKGwpO1xuICAgIH07XG4gICAgY29uc3QgZG9uZSA9IChlcnIsIGwpID0+IHtcbiAgICAgIGlmIChsKSB7XG4gICAgICAgIHNldExuZ1Byb3BzKGwpO1xuICAgICAgICB0aGlzLnRyYW5zbGF0b3IuY2hhbmdlTGFuZ3VhZ2UobCk7XG4gICAgICAgIHRoaXMuaXNMYW5ndWFnZUNoYW5naW5nVG8gPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuZW1pdCgnbGFuZ3VhZ2VDaGFuZ2VkJywgbCk7XG4gICAgICAgIHRoaXMubG9nZ2VyLmxvZygnbGFuZ3VhZ2VDaGFuZ2VkJywgbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmlzTGFuZ3VhZ2VDaGFuZ2luZ1RvID0gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgICAgZGVmZXJyZWQucmVzb2x2ZShmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBfdGhpczIudCguLi5hcmd1bWVudHMpO1xuICAgICAgfSk7XG4gICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKGVyciwgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gX3RoaXMyLnQoLi4uYXJndW1lbnRzKTtcbiAgICAgIH0pO1xuICAgIH07XG4gICAgY29uc3Qgc2V0TG5nID0gbG5ncyA9PiB7XG4gICAgICBpZiAoIWxuZyAmJiAhbG5ncyAmJiB0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IpIGxuZ3MgPSBbXTtcbiAgICAgIGNvbnN0IGwgPSB0eXBlb2YgbG5ncyA9PT0gJ3N0cmluZycgPyBsbmdzIDogdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZVV0aWxzLmdldEJlc3RNYXRjaEZyb21Db2RlcyhsbmdzKTtcbiAgICAgIGlmIChsKSB7XG4gICAgICAgIGlmICghdGhpcy5sYW5ndWFnZSkge1xuICAgICAgICAgIHNldExuZ1Byb3BzKGwpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy50cmFuc2xhdG9yLmxhbmd1YWdlKSB0aGlzLnRyYW5zbGF0b3IuY2hhbmdlTGFuZ3VhZ2UobCk7XG4gICAgICAgIGlmICh0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IgJiYgdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZURldGVjdG9yLmNhY2hlVXNlckxhbmd1YWdlKSB0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IuY2FjaGVVc2VyTGFuZ3VhZ2UobCk7XG4gICAgICB9XG4gICAgICB0aGlzLmxvYWRSZXNvdXJjZXMobCwgZXJyID0+IHtcbiAgICAgICAgZG9uZShlcnIsIGwpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgICBpZiAoIWxuZyAmJiB0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IgJiYgIXRoaXMuc2VydmljZXMubGFuZ3VhZ2VEZXRlY3Rvci5hc3luYykge1xuICAgICAgc2V0TG5nKHRoaXMuc2VydmljZXMubGFuZ3VhZ2VEZXRlY3Rvci5kZXRlY3QoKSk7XG4gICAgfSBlbHNlIGlmICghbG5nICYmIHRoaXMuc2VydmljZXMubGFuZ3VhZ2VEZXRlY3RvciAmJiB0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IuYXN5bmMpIHtcbiAgICAgIGlmICh0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IuZGV0ZWN0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICB0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IuZGV0ZWN0KCkudGhlbihzZXRMbmcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZURldGVjdG9yLmRldGVjdChzZXRMbmcpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzZXRMbmcobG5nKTtcbiAgICB9XG4gICAgcmV0dXJuIGRlZmVycmVkO1xuICB9XG4gIGdldEZpeGVkVChsbmcsIG5zLCBrZXlQcmVmaXgpIHtcbiAgICB2YXIgX3RoaXMzID0gdGhpcztcbiAgICBjb25zdCBmaXhlZFQgPSBmdW5jdGlvbiAoa2V5LCBvcHRzKSB7XG4gICAgICBsZXQgb3B0aW9ucztcbiAgICAgIGlmICh0eXBlb2Ygb3B0cyAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgZm9yICh2YXIgX2xlbjMgPSBhcmd1bWVudHMubGVuZ3RoLCByZXN0ID0gbmV3IEFycmF5KF9sZW4zID4gMiA/IF9sZW4zIC0gMiA6IDApLCBfa2V5MyA9IDI7IF9rZXkzIDwgX2xlbjM7IF9rZXkzKyspIHtcbiAgICAgICAgICByZXN0W19rZXkzIC0gMl0gPSBhcmd1bWVudHNbX2tleTNdO1xuICAgICAgICB9XG4gICAgICAgIG9wdGlvbnMgPSBfdGhpczMub3B0aW9ucy5vdmVybG9hZFRyYW5zbGF0aW9uT3B0aW9uSGFuZGxlcihba2V5LCBvcHRzXS5jb25jYXQocmVzdCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3B0aW9ucyA9IHtcbiAgICAgICAgICAuLi5vcHRzXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBvcHRpb25zLmxuZyA9IG9wdGlvbnMubG5nIHx8IGZpeGVkVC5sbmc7XG4gICAgICBvcHRpb25zLmxuZ3MgPSBvcHRpb25zLmxuZ3MgfHwgZml4ZWRULmxuZ3M7XG4gICAgICBvcHRpb25zLm5zID0gb3B0aW9ucy5ucyB8fCBmaXhlZFQubnM7XG4gICAgICBpZiAob3B0aW9ucy5rZXlQcmVmaXggIT09ICcnKSBvcHRpb25zLmtleVByZWZpeCA9IG9wdGlvbnMua2V5UHJlZml4IHx8IGtleVByZWZpeCB8fCBmaXhlZFQua2V5UHJlZml4O1xuICAgICAgY29uc3Qga2V5U2VwYXJhdG9yID0gX3RoaXMzLm9wdGlvbnMua2V5U2VwYXJhdG9yIHx8ICcuJztcbiAgICAgIGxldCByZXN1bHRLZXk7XG4gICAgICBpZiAob3B0aW9ucy5rZXlQcmVmaXggJiYgQXJyYXkuaXNBcnJheShrZXkpKSB7XG4gICAgICAgIHJlc3VsdEtleSA9IGtleS5tYXAoayA9PiBgJHtvcHRpb25zLmtleVByZWZpeH0ke2tleVNlcGFyYXRvcn0ke2t9YCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHRLZXkgPSBvcHRpb25zLmtleVByZWZpeCA/IGAke29wdGlvbnMua2V5UHJlZml4fSR7a2V5U2VwYXJhdG9yfSR7a2V5fWAgOiBrZXk7XG4gICAgICB9XG4gICAgICByZXR1cm4gX3RoaXMzLnQocmVzdWx0S2V5LCBvcHRpb25zKTtcbiAgICB9O1xuICAgIGlmICh0eXBlb2YgbG5nID09PSAnc3RyaW5nJykge1xuICAgICAgZml4ZWRULmxuZyA9IGxuZztcbiAgICB9IGVsc2Uge1xuICAgICAgZml4ZWRULmxuZ3MgPSBsbmc7XG4gICAgfVxuICAgIGZpeGVkVC5ucyA9IG5zO1xuICAgIGZpeGVkVC5rZXlQcmVmaXggPSBrZXlQcmVmaXg7XG4gICAgcmV0dXJuIGZpeGVkVDtcbiAgfVxuICB0KCkge1xuICAgIHJldHVybiB0aGlzLnRyYW5zbGF0b3IgJiYgdGhpcy50cmFuc2xhdG9yLnRyYW5zbGF0ZSguLi5hcmd1bWVudHMpO1xuICB9XG4gIGV4aXN0cygpIHtcbiAgICByZXR1cm4gdGhpcy50cmFuc2xhdG9yICYmIHRoaXMudHJhbnNsYXRvci5leGlzdHMoLi4uYXJndW1lbnRzKTtcbiAgfVxuICBzZXREZWZhdWx0TmFtZXNwYWNlKG5zKSB7XG4gICAgdGhpcy5vcHRpb25zLmRlZmF1bHROUyA9IG5zO1xuICB9XG4gIGhhc0xvYWRlZE5hbWVzcGFjZShucykge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB7fTtcbiAgICBpZiAoIXRoaXMuaXNJbml0aWFsaXplZCkge1xuICAgICAgdGhpcy5sb2dnZXIud2FybignaGFzTG9hZGVkTmFtZXNwYWNlOiBpMThuZXh0IHdhcyBub3QgaW5pdGlhbGl6ZWQnLCB0aGlzLmxhbmd1YWdlcyk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICghdGhpcy5sYW5ndWFnZXMgfHwgIXRoaXMubGFuZ3VhZ2VzLmxlbmd0aCkge1xuICAgICAgdGhpcy5sb2dnZXIud2FybignaGFzTG9hZGVkTmFtZXNwYWNlOiBpMThuLmxhbmd1YWdlcyB3ZXJlIHVuZGVmaW5lZCBvciBlbXB0eScsIHRoaXMubGFuZ3VhZ2VzKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3QgbG5nID0gb3B0aW9ucy5sbmcgfHwgdGhpcy5yZXNvbHZlZExhbmd1YWdlIHx8IHRoaXMubGFuZ3VhZ2VzWzBdO1xuICAgIGNvbnN0IGZhbGxiYWNrTG5nID0gdGhpcy5vcHRpb25zID8gdGhpcy5vcHRpb25zLmZhbGxiYWNrTG5nIDogZmFsc2U7XG4gICAgY29uc3QgbGFzdExuZyA9IHRoaXMubGFuZ3VhZ2VzW3RoaXMubGFuZ3VhZ2VzLmxlbmd0aCAtIDFdO1xuICAgIGlmIChsbmcudG9Mb3dlckNhc2UoKSA9PT0gJ2NpbW9kZScpIHJldHVybiB0cnVlO1xuICAgIGNvbnN0IGxvYWROb3RQZW5kaW5nID0gKGwsIG4pID0+IHtcbiAgICAgIGNvbnN0IGxvYWRTdGF0ZSA9IHRoaXMuc2VydmljZXMuYmFja2VuZENvbm5lY3Rvci5zdGF0ZVtgJHtsfXwke259YF07XG4gICAgICByZXR1cm4gbG9hZFN0YXRlID09PSAtMSB8fCBsb2FkU3RhdGUgPT09IDI7XG4gICAgfTtcbiAgICBpZiAob3B0aW9ucy5wcmVjaGVjaykge1xuICAgICAgY29uc3QgcHJlUmVzdWx0ID0gb3B0aW9ucy5wcmVjaGVjayh0aGlzLCBsb2FkTm90UGVuZGluZyk7XG4gICAgICBpZiAocHJlUmVzdWx0ICE9PSB1bmRlZmluZWQpIHJldHVybiBwcmVSZXN1bHQ7XG4gICAgfVxuICAgIGlmICh0aGlzLmhhc1Jlc291cmNlQnVuZGxlKGxuZywgbnMpKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAoIXRoaXMuc2VydmljZXMuYmFja2VuZENvbm5lY3Rvci5iYWNrZW5kIHx8IHRoaXMub3B0aW9ucy5yZXNvdXJjZXMgJiYgIXRoaXMub3B0aW9ucy5wYXJ0aWFsQnVuZGxlZExhbmd1YWdlcykgcmV0dXJuIHRydWU7XG4gICAgaWYgKGxvYWROb3RQZW5kaW5nKGxuZywgbnMpICYmICghZmFsbGJhY2tMbmcgfHwgbG9hZE5vdFBlbmRpbmcobGFzdExuZywgbnMpKSkgcmV0dXJuIHRydWU7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGxvYWROYW1lc3BhY2VzKG5zLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBpZiAoIXRoaXMub3B0aW9ucy5ucykge1xuICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjaygpO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIG5zID09PSAnc3RyaW5nJykgbnMgPSBbbnNdO1xuICAgIG5zLmZvckVhY2gobiA9PiB7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLm5zLmluZGV4T2YobikgPCAwKSB0aGlzLm9wdGlvbnMubnMucHVzaChuKTtcbiAgICB9KTtcbiAgICB0aGlzLmxvYWRSZXNvdXJjZXMoZXJyID0+IHtcbiAgICAgIGRlZmVycmVkLnJlc29sdmUoKTtcbiAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soZXJyKTtcbiAgICB9KTtcbiAgICByZXR1cm4gZGVmZXJyZWQ7XG4gIH1cbiAgbG9hZExhbmd1YWdlcyhsbmdzLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBpZiAodHlwZW9mIGxuZ3MgPT09ICdzdHJpbmcnKSBsbmdzID0gW2xuZ3NdO1xuICAgIGNvbnN0IHByZWxvYWRlZCA9IHRoaXMub3B0aW9ucy5wcmVsb2FkIHx8IFtdO1xuICAgIGNvbnN0IG5ld0xuZ3MgPSBsbmdzLmZpbHRlcihsbmcgPT4gcHJlbG9hZGVkLmluZGV4T2YobG5nKSA8IDAgJiYgdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZVV0aWxzLmlzU3VwcG9ydGVkQ29kZShsbmcpKTtcbiAgICBpZiAoIW5ld0xuZ3MubGVuZ3RoKSB7XG4gICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKCk7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuICAgIHRoaXMub3B0aW9ucy5wcmVsb2FkID0gcHJlbG9hZGVkLmNvbmNhdChuZXdMbmdzKTtcbiAgICB0aGlzLmxvYWRSZXNvdXJjZXMoZXJyID0+IHtcbiAgICAgIGRlZmVycmVkLnJlc29sdmUoKTtcbiAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soZXJyKTtcbiAgICB9KTtcbiAgICByZXR1cm4gZGVmZXJyZWQ7XG4gIH1cbiAgZGlyKGxuZykge1xuICAgIGlmICghbG5nKSBsbmcgPSB0aGlzLnJlc29sdmVkTGFuZ3VhZ2UgfHwgKHRoaXMubGFuZ3VhZ2VzICYmIHRoaXMubGFuZ3VhZ2VzLmxlbmd0aCA+IDAgPyB0aGlzLmxhbmd1YWdlc1swXSA6IHRoaXMubGFuZ3VhZ2UpO1xuICAgIGlmICghbG5nKSByZXR1cm4gJ3J0bCc7XG4gICAgY29uc3QgcnRsTG5ncyA9IFsnYXInLCAnc2h1JywgJ3NxcicsICdzc2gnLCAneGFhJywgJ3loZCcsICd5dWQnLCAnYWFvJywgJ2FiaCcsICdhYnYnLCAnYWNtJywgJ2FjcScsICdhY3cnLCAnYWN4JywgJ2FjeScsICdhZGYnLCAnYWRzJywgJ2FlYicsICdhZWMnLCAnYWZiJywgJ2FqcCcsICdhcGMnLCAnYXBkJywgJ2FyYicsICdhcnEnLCAnYXJzJywgJ2FyeScsICdhcnonLCAnYXV6JywgJ2F2bCcsICdheWgnLCAnYXlsJywgJ2F5bicsICdheXAnLCAnYmJ6JywgJ3BnYScsICdoZScsICdpdycsICdwcycsICdwYnQnLCAncGJ1JywgJ3BzdCcsICdwcnAnLCAncHJkJywgJ3VnJywgJ3VyJywgJ3lkZCcsICd5ZHMnLCAneWloJywgJ2ppJywgJ3lpJywgJ2hibycsICdtZW4nLCAneG1uJywgJ2ZhJywgJ2pwcicsICdwZW8nLCAncGVzJywgJ3BycycsICdkdicsICdzYW0nLCAnY2tiJ107XG4gICAgY29uc3QgbGFuZ3VhZ2VVdGlscyA9IHRoaXMuc2VydmljZXMgJiYgdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZVV0aWxzIHx8IG5ldyBMYW5ndWFnZVV0aWwoZ2V0KCkpO1xuICAgIHJldHVybiBydGxMbmdzLmluZGV4T2YobGFuZ3VhZ2VVdGlscy5nZXRMYW5ndWFnZVBhcnRGcm9tQ29kZShsbmcpKSA+IC0xIHx8IGxuZy50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJy1hcmFiJykgPiAxID8gJ3J0bCcgOiAnbHRyJztcbiAgfVxuICBzdGF0aWMgY3JlYXRlSW5zdGFuY2UoKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IHt9O1xuICAgIGxldCBjYWxsYmFjayA9IGFyZ3VtZW50cy5sZW5ndGggPiAxID8gYXJndW1lbnRzWzFdIDogdW5kZWZpbmVkO1xuICAgIHJldHVybiBuZXcgSTE4bihvcHRpb25zLCBjYWxsYmFjayk7XG4gIH1cbiAgY2xvbmVJbnN0YW5jZSgpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDoge307XG4gICAgbGV0IGNhbGxiYWNrID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiBub29wO1xuICAgIGNvbnN0IGZvcmtSZXNvdXJjZVN0b3JlID0gb3B0aW9ucy5mb3JrUmVzb3VyY2VTdG9yZTtcbiAgICBpZiAoZm9ya1Jlc291cmNlU3RvcmUpIGRlbGV0ZSBvcHRpb25zLmZvcmtSZXNvdXJjZVN0b3JlO1xuICAgIGNvbnN0IG1lcmdlZE9wdGlvbnMgPSB7XG4gICAgICAuLi50aGlzLm9wdGlvbnMsXG4gICAgICAuLi5vcHRpb25zLFxuICAgICAgLi4ue1xuICAgICAgICBpc0Nsb25lOiB0cnVlXG4gICAgICB9XG4gICAgfTtcbiAgICBjb25zdCBjbG9uZSA9IG5ldyBJMThuKG1lcmdlZE9wdGlvbnMpO1xuICAgIGlmIChvcHRpb25zLmRlYnVnICE9PSB1bmRlZmluZWQgfHwgb3B0aW9ucy5wcmVmaXggIT09IHVuZGVmaW5lZCkge1xuICAgICAgY2xvbmUubG9nZ2VyID0gY2xvbmUubG9nZ2VyLmNsb25lKG9wdGlvbnMpO1xuICAgIH1cbiAgICBjb25zdCBtZW1iZXJzVG9Db3B5ID0gWydzdG9yZScsICdzZXJ2aWNlcycsICdsYW5ndWFnZSddO1xuICAgIG1lbWJlcnNUb0NvcHkuZm9yRWFjaChtID0+IHtcbiAgICAgIGNsb25lW21dID0gdGhpc1ttXTtcbiAgICB9KTtcbiAgICBjbG9uZS5zZXJ2aWNlcyA9IHtcbiAgICAgIC4uLnRoaXMuc2VydmljZXNcbiAgICB9O1xuICAgIGNsb25lLnNlcnZpY2VzLnV0aWxzID0ge1xuICAgICAgaGFzTG9hZGVkTmFtZXNwYWNlOiBjbG9uZS5oYXNMb2FkZWROYW1lc3BhY2UuYmluZChjbG9uZSlcbiAgICB9O1xuICAgIGlmIChmb3JrUmVzb3VyY2VTdG9yZSkge1xuICAgICAgY2xvbmUuc3RvcmUgPSBuZXcgUmVzb3VyY2VTdG9yZSh0aGlzLnN0b3JlLmRhdGEsIG1lcmdlZE9wdGlvbnMpO1xuICAgICAgY2xvbmUuc2VydmljZXMucmVzb3VyY2VTdG9yZSA9IGNsb25lLnN0b3JlO1xuICAgIH1cbiAgICBjbG9uZS50cmFuc2xhdG9yID0gbmV3IFRyYW5zbGF0b3IoY2xvbmUuc2VydmljZXMsIG1lcmdlZE9wdGlvbnMpO1xuICAgIGNsb25lLnRyYW5zbGF0b3Iub24oJyonLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgIGZvciAodmFyIF9sZW40ID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IG5ldyBBcnJheShfbGVuNCA+IDEgPyBfbGVuNCAtIDEgOiAwKSwgX2tleTQgPSAxOyBfa2V5NCA8IF9sZW40OyBfa2V5NCsrKSB7XG4gICAgICAgIGFyZ3NbX2tleTQgLSAxXSA9IGFyZ3VtZW50c1tfa2V5NF07XG4gICAgICB9XG4gICAgICBjbG9uZS5lbWl0KGV2ZW50LCAuLi5hcmdzKTtcbiAgICB9KTtcbiAgICBjbG9uZS5pbml0KG1lcmdlZE9wdGlvbnMsIGNhbGxiYWNrKTtcbiAgICBjbG9uZS50cmFuc2xhdG9yLm9wdGlvbnMgPSBtZXJnZWRPcHRpb25zO1xuICAgIGNsb25lLnRyYW5zbGF0b3IuYmFja2VuZENvbm5lY3Rvci5zZXJ2aWNlcy51dGlscyA9IHtcbiAgICAgIGhhc0xvYWRlZE5hbWVzcGFjZTogY2xvbmUuaGFzTG9hZGVkTmFtZXNwYWNlLmJpbmQoY2xvbmUpXG4gICAgfTtcbiAgICByZXR1cm4gY2xvbmU7XG4gIH1cbiAgdG9KU09OKCkge1xuICAgIHJldHVybiB7XG4gICAgICBvcHRpb25zOiB0aGlzLm9wdGlvbnMsXG4gICAgICBzdG9yZTogdGhpcy5zdG9yZSxcbiAgICAgIGxhbmd1YWdlOiB0aGlzLmxhbmd1YWdlLFxuICAgICAgbGFuZ3VhZ2VzOiB0aGlzLmxhbmd1YWdlcyxcbiAgICAgIHJlc29sdmVkTGFuZ3VhZ2U6IHRoaXMucmVzb2x2ZWRMYW5ndWFnZVxuICAgIH07XG4gIH1cbn1cbmNvbnN0IGluc3RhbmNlID0gSTE4bi5jcmVhdGVJbnN0YW5jZSgpO1xuaW5zdGFuY2UuY3JlYXRlSW5zdGFuY2UgPSBJMThuLmNyZWF0ZUluc3RhbmNlO1xuXG5jb25zdCBjcmVhdGVJbnN0YW5jZSA9IGluc3RhbmNlLmNyZWF0ZUluc3RhbmNlO1xuY29uc3QgZGlyID0gaW5zdGFuY2UuZGlyO1xuY29uc3QgaW5pdCA9IGluc3RhbmNlLmluaXQ7XG5jb25zdCBsb2FkUmVzb3VyY2VzID0gaW5zdGFuY2UubG9hZFJlc291cmNlcztcbmNvbnN0IHJlbG9hZFJlc291cmNlcyA9IGluc3RhbmNlLnJlbG9hZFJlc291cmNlcztcbmNvbnN0IHVzZSA9IGluc3RhbmNlLnVzZTtcbmNvbnN0IGNoYW5nZUxhbmd1YWdlID0gaW5zdGFuY2UuY2hhbmdlTGFuZ3VhZ2U7XG5jb25zdCBnZXRGaXhlZFQgPSBpbnN0YW5jZS5nZXRGaXhlZFQ7XG5jb25zdCB0ID0gaW5zdGFuY2UudDtcbmNvbnN0IGV4aXN0cyA9IGluc3RhbmNlLmV4aXN0cztcbmNvbnN0IHNldERlZmF1bHROYW1lc3BhY2UgPSBpbnN0YW5jZS5zZXREZWZhdWx0TmFtZXNwYWNlO1xuY29uc3QgaGFzTG9hZGVkTmFtZXNwYWNlID0gaW5zdGFuY2UuaGFzTG9hZGVkTmFtZXNwYWNlO1xuY29uc3QgbG9hZE5hbWVzcGFjZXMgPSBpbnN0YW5jZS5sb2FkTmFtZXNwYWNlcztcbmNvbnN0IGxvYWRMYW5ndWFnZXMgPSBpbnN0YW5jZS5sb2FkTGFuZ3VhZ2VzO1xuXG5leHBvcnQgeyBjaGFuZ2VMYW5ndWFnZSwgY3JlYXRlSW5zdGFuY2UsIGluc3RhbmNlIGFzIGRlZmF1bHQsIGRpciwgZXhpc3RzLCBnZXRGaXhlZFQsIGhhc0xvYWRlZE5hbWVzcGFjZSwgaW5pdCwgbG9hZExhbmd1YWdlcywgbG9hZE5hbWVzcGFjZXMsIGxvYWRSZXNvdXJjZXMsIHJlbG9hZFJlc291cmNlcywgc2V0RGVmYXVsdE5hbWVzcGFjZSwgdCwgdXNlIH07XG4iLCAiZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGEsIG4pIHtcbiAgaWYgKCEoYSBpbnN0YW5jZW9mIG4pKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpO1xufVxuZXhwb3J0IHsgX2NsYXNzQ2FsbENoZWNrIGFzIGRlZmF1bHQgfTsiLCAiZnVuY3Rpb24gX3R5cGVvZihvKSB7XG4gIFwiQGJhYmVsL2hlbHBlcnMgLSB0eXBlb2ZcIjtcblxuICByZXR1cm4gX3R5cGVvZiA9IFwiZnVuY3Rpb25cIiA9PSB0eXBlb2YgU3ltYm9sICYmIFwic3ltYm9sXCIgPT0gdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA/IGZ1bmN0aW9uIChvKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBvO1xuICB9IDogZnVuY3Rpb24gKG8pIHtcbiAgICByZXR1cm4gbyAmJiBcImZ1bmN0aW9uXCIgPT0gdHlwZW9mIFN5bWJvbCAmJiBvLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgJiYgbyAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2YgbztcbiAgfSwgX3R5cGVvZihvKTtcbn1cbmV4cG9ydCB7IF90eXBlb2YgYXMgZGVmYXVsdCB9OyIsICJpbXBvcnQgX3R5cGVvZiBmcm9tIFwiLi90eXBlb2YuanNcIjtcbmZ1bmN0aW9uIHRvUHJpbWl0aXZlKHQsIHIpIHtcbiAgaWYgKFwib2JqZWN0XCIgIT0gX3R5cGVvZih0KSB8fCAhdCkgcmV0dXJuIHQ7XG4gIHZhciBlID0gdFtTeW1ib2wudG9QcmltaXRpdmVdO1xuICBpZiAodm9pZCAwICE9PSBlKSB7XG4gICAgdmFyIGkgPSBlLmNhbGwodCwgciB8fCBcImRlZmF1bHRcIik7XG4gICAgaWYgKFwib2JqZWN0XCIgIT0gX3R5cGVvZihpKSkgcmV0dXJuIGk7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkBAdG9QcmltaXRpdmUgbXVzdCByZXR1cm4gYSBwcmltaXRpdmUgdmFsdWUuXCIpO1xuICB9XG4gIHJldHVybiAoXCJzdHJpbmdcIiA9PT0gciA/IFN0cmluZyA6IE51bWJlcikodCk7XG59XG5leHBvcnQgeyB0b1ByaW1pdGl2ZSBhcyBkZWZhdWx0IH07IiwgImltcG9ydCBfdHlwZW9mIGZyb20gXCIuL3R5cGVvZi5qc1wiO1xuaW1wb3J0IHRvUHJpbWl0aXZlIGZyb20gXCIuL3RvUHJpbWl0aXZlLmpzXCI7XG5mdW5jdGlvbiB0b1Byb3BlcnR5S2V5KHQpIHtcbiAgdmFyIGkgPSB0b1ByaW1pdGl2ZSh0LCBcInN0cmluZ1wiKTtcbiAgcmV0dXJuIFwic3ltYm9sXCIgPT0gX3R5cGVvZihpKSA/IGkgOiBpICsgXCJcIjtcbn1cbmV4cG9ydCB7IHRvUHJvcGVydHlLZXkgYXMgZGVmYXVsdCB9OyIsICJpbXBvcnQgdG9Qcm9wZXJ0eUtleSBmcm9tIFwiLi90b1Byb3BlcnR5S2V5LmpzXCI7XG5mdW5jdGlvbiBfZGVmaW5lUHJvcGVydGllcyhlLCByKSB7XG4gIGZvciAodmFyIHQgPSAwOyB0IDwgci5sZW5ndGg7IHQrKykge1xuICAgIHZhciBvID0gclt0XTtcbiAgICBvLmVudW1lcmFibGUgPSBvLmVudW1lcmFibGUgfHwgITEsIG8uY29uZmlndXJhYmxlID0gITAsIFwidmFsdWVcIiBpbiBvICYmIChvLndyaXRhYmxlID0gITApLCBPYmplY3QuZGVmaW5lUHJvcGVydHkoZSwgdG9Qcm9wZXJ0eUtleShvLmtleSksIG8pO1xuICB9XG59XG5mdW5jdGlvbiBfY3JlYXRlQ2xhc3MoZSwgciwgdCkge1xuICByZXR1cm4gciAmJiBfZGVmaW5lUHJvcGVydGllcyhlLnByb3RvdHlwZSwgciksIHQgJiYgX2RlZmluZVByb3BlcnRpZXMoZSwgdCksIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlLCBcInByb3RvdHlwZVwiLCB7XG4gICAgd3JpdGFibGU6ICExXG4gIH0pLCBlO1xufVxuZXhwb3J0IHsgX2NyZWF0ZUNsYXNzIGFzIGRlZmF1bHQgfTsiLCAiaW1wb3J0IF9jbGFzc0NhbGxDaGVjayBmcm9tICdAYmFiZWwvcnVudGltZS9oZWxwZXJzL2VzbS9jbGFzc0NhbGxDaGVjayc7XG5pbXBvcnQgX2NyZWF0ZUNsYXNzIGZyb20gJ0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvZXNtL2NyZWF0ZUNsYXNzJztcblxudmFyIGFyciA9IFtdO1xudmFyIGVhY2ggPSBhcnIuZm9yRWFjaDtcbnZhciBzbGljZSA9IGFyci5zbGljZTtcbmZ1bmN0aW9uIGRlZmF1bHRzKG9iaikge1xuICBlYWNoLmNhbGwoc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLCBmdW5jdGlvbiAoc291cmNlKSB7XG4gICAgaWYgKHNvdXJjZSkge1xuICAgICAgZm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpIHtcbiAgICAgICAgaWYgKG9ialtwcm9wXSA9PT0gdW5kZWZpbmVkKSBvYmpbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG4gICAgICB9XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG9iajtcbn1cblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnRyb2wtcmVnZXhcbnZhciBmaWVsZENvbnRlbnRSZWdFeHAgPSAvXltcXHUwMDA5XFx1MDAyMC1cXHUwMDdlXFx1MDA4MC1cXHUwMGZmXSskLztcbnZhciBzZXJpYWxpemVDb29raWUgPSBmdW5jdGlvbiBzZXJpYWxpemVDb29raWUobmFtZSwgdmFsLCBvcHRpb25zKSB7XG4gIHZhciBvcHQgPSBvcHRpb25zIHx8IHt9O1xuICBvcHQucGF0aCA9IG9wdC5wYXRoIHx8ICcvJztcbiAgdmFyIHZhbHVlID0gZW5jb2RlVVJJQ29tcG9uZW50KHZhbCk7XG4gIHZhciBzdHIgPSBcIlwiLmNvbmNhdChuYW1lLCBcIj1cIikuY29uY2F0KHZhbHVlKTtcbiAgaWYgKG9wdC5tYXhBZ2UgPiAwKSB7XG4gICAgdmFyIG1heEFnZSA9IG9wdC5tYXhBZ2UgLSAwO1xuICAgIGlmIChOdW1iZXIuaXNOYU4obWF4QWdlKSkgdGhyb3cgbmV3IEVycm9yKCdtYXhBZ2Ugc2hvdWxkIGJlIGEgTnVtYmVyJyk7XG4gICAgc3RyICs9IFwiOyBNYXgtQWdlPVwiLmNvbmNhdChNYXRoLmZsb29yKG1heEFnZSkpO1xuICB9XG4gIGlmIChvcHQuZG9tYWluKSB7XG4gICAgaWYgKCFmaWVsZENvbnRlbnRSZWdFeHAudGVzdChvcHQuZG9tYWluKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignb3B0aW9uIGRvbWFpbiBpcyBpbnZhbGlkJyk7XG4gICAgfVxuICAgIHN0ciArPSBcIjsgRG9tYWluPVwiLmNvbmNhdChvcHQuZG9tYWluKTtcbiAgfVxuICBpZiAob3B0LnBhdGgpIHtcbiAgICBpZiAoIWZpZWxkQ29udGVudFJlZ0V4cC50ZXN0KG9wdC5wYXRoKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignb3B0aW9uIHBhdGggaXMgaW52YWxpZCcpO1xuICAgIH1cbiAgICBzdHIgKz0gXCI7IFBhdGg9XCIuY29uY2F0KG9wdC5wYXRoKTtcbiAgfVxuICBpZiAob3B0LmV4cGlyZXMpIHtcbiAgICBpZiAodHlwZW9mIG9wdC5leHBpcmVzLnRvVVRDU3RyaW5nICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdvcHRpb24gZXhwaXJlcyBpcyBpbnZhbGlkJyk7XG4gICAgfVxuICAgIHN0ciArPSBcIjsgRXhwaXJlcz1cIi5jb25jYXQob3B0LmV4cGlyZXMudG9VVENTdHJpbmcoKSk7XG4gIH1cbiAgaWYgKG9wdC5odHRwT25seSkgc3RyICs9ICc7IEh0dHBPbmx5JztcbiAgaWYgKG9wdC5zZWN1cmUpIHN0ciArPSAnOyBTZWN1cmUnO1xuICBpZiAob3B0LnNhbWVTaXRlKSB7XG4gICAgdmFyIHNhbWVTaXRlID0gdHlwZW9mIG9wdC5zYW1lU2l0ZSA9PT0gJ3N0cmluZycgPyBvcHQuc2FtZVNpdGUudG9Mb3dlckNhc2UoKSA6IG9wdC5zYW1lU2l0ZTtcbiAgICBzd2l0Y2ggKHNhbWVTaXRlKSB7XG4gICAgICBjYXNlIHRydWU6XG4gICAgICAgIHN0ciArPSAnOyBTYW1lU2l0ZT1TdHJpY3QnO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2xheCc6XG4gICAgICAgIHN0ciArPSAnOyBTYW1lU2l0ZT1MYXgnO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3N0cmljdCc6XG4gICAgICAgIHN0ciArPSAnOyBTYW1lU2l0ZT1TdHJpY3QnO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ25vbmUnOlxuICAgICAgICBzdHIgKz0gJzsgU2FtZVNpdGU9Tm9uZSc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignb3B0aW9uIHNhbWVTaXRlIGlzIGludmFsaWQnKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG52YXIgY29va2llID0ge1xuICBjcmVhdGU6IGZ1bmN0aW9uIGNyZWF0ZShuYW1lLCB2YWx1ZSwgbWludXRlcywgZG9tYWluKSB7XG4gICAgdmFyIGNvb2tpZU9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gNCAmJiBhcmd1bWVudHNbNF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1s0XSA6IHtcbiAgICAgIHBhdGg6ICcvJyxcbiAgICAgIHNhbWVTaXRlOiAnc3RyaWN0J1xuICAgIH07XG4gICAgaWYgKG1pbnV0ZXMpIHtcbiAgICAgIGNvb2tpZU9wdGlvbnMuZXhwaXJlcyA9IG5ldyBEYXRlKCk7XG4gICAgICBjb29raWVPcHRpb25zLmV4cGlyZXMuc2V0VGltZShjb29raWVPcHRpb25zLmV4cGlyZXMuZ2V0VGltZSgpICsgbWludXRlcyAqIDYwICogMTAwMCk7XG4gICAgfVxuICAgIGlmIChkb21haW4pIGNvb2tpZU9wdGlvbnMuZG9tYWluID0gZG9tYWluO1xuICAgIGRvY3VtZW50LmNvb2tpZSA9IHNlcmlhbGl6ZUNvb2tpZShuYW1lLCBlbmNvZGVVUklDb21wb25lbnQodmFsdWUpLCBjb29raWVPcHRpb25zKTtcbiAgfSxcbiAgcmVhZDogZnVuY3Rpb24gcmVhZChuYW1lKSB7XG4gICAgdmFyIG5hbWVFUSA9IFwiXCIuY29uY2F0KG5hbWUsIFwiPVwiKTtcbiAgICB2YXIgY2EgPSBkb2N1bWVudC5jb29raWUuc3BsaXQoJzsnKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgYyA9IGNhW2ldO1xuICAgICAgd2hpbGUgKGMuY2hhckF0KDApID09PSAnICcpIGMgPSBjLnN1YnN0cmluZygxLCBjLmxlbmd0aCk7XG4gICAgICBpZiAoYy5pbmRleE9mKG5hbWVFUSkgPT09IDApIHJldHVybiBjLnN1YnN0cmluZyhuYW1lRVEubGVuZ3RoLCBjLmxlbmd0aCk7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9LFxuICByZW1vdmU6IGZ1bmN0aW9uIHJlbW92ZShuYW1lKSB7XG4gICAgdGhpcy5jcmVhdGUobmFtZSwgJycsIC0xKTtcbiAgfVxufTtcbnZhciBjb29raWUkMSA9IHtcbiAgbmFtZTogJ2Nvb2tpZScsXG4gIGxvb2t1cDogZnVuY3Rpb24gbG9va3VwKG9wdGlvbnMpIHtcbiAgICB2YXIgZm91bmQ7XG4gICAgaWYgKG9wdGlvbnMubG9va3VwQ29va2llICYmIHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHZhciBjID0gY29va2llLnJlYWQob3B0aW9ucy5sb29rdXBDb29raWUpO1xuICAgICAgaWYgKGMpIGZvdW5kID0gYztcbiAgICB9XG4gICAgcmV0dXJuIGZvdW5kO1xuICB9LFxuICBjYWNoZVVzZXJMYW5ndWFnZTogZnVuY3Rpb24gY2FjaGVVc2VyTGFuZ3VhZ2UobG5nLCBvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMubG9va3VwQ29va2llICYmIHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGNvb2tpZS5jcmVhdGUob3B0aW9ucy5sb29rdXBDb29raWUsIGxuZywgb3B0aW9ucy5jb29raWVNaW51dGVzLCBvcHRpb25zLmNvb2tpZURvbWFpbiwgb3B0aW9ucy5jb29raWVPcHRpb25zKTtcbiAgICB9XG4gIH1cbn07XG5cbnZhciBxdWVyeXN0cmluZyA9IHtcbiAgbmFtZTogJ3F1ZXJ5c3RyaW5nJyxcbiAgbG9va3VwOiBmdW5jdGlvbiBsb29rdXAob3B0aW9ucykge1xuICAgIHZhciBmb3VuZDtcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHZhciBzZWFyY2ggPSB3aW5kb3cubG9jYXRpb24uc2VhcmNoO1xuICAgICAgaWYgKCF3aW5kb3cubG9jYXRpb24uc2VhcmNoICYmIHdpbmRvdy5sb2NhdGlvbi5oYXNoICYmIHdpbmRvdy5sb2NhdGlvbi5oYXNoLmluZGV4T2YoJz8nKSA+IC0xKSB7XG4gICAgICAgIHNlYXJjaCA9IHdpbmRvdy5sb2NhdGlvbi5oYXNoLnN1YnN0cmluZyh3aW5kb3cubG9jYXRpb24uaGFzaC5pbmRleE9mKCc/JykpO1xuICAgICAgfVxuICAgICAgdmFyIHF1ZXJ5ID0gc2VhcmNoLnN1YnN0cmluZygxKTtcbiAgICAgIHZhciBwYXJhbXMgPSBxdWVyeS5zcGxpdCgnJicpO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXJhbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHBvcyA9IHBhcmFtc1tpXS5pbmRleE9mKCc9Jyk7XG4gICAgICAgIGlmIChwb3MgPiAwKSB7XG4gICAgICAgICAgdmFyIGtleSA9IHBhcmFtc1tpXS5zdWJzdHJpbmcoMCwgcG9zKTtcbiAgICAgICAgICBpZiAoa2V5ID09PSBvcHRpb25zLmxvb2t1cFF1ZXJ5c3RyaW5nKSB7XG4gICAgICAgICAgICBmb3VuZCA9IHBhcmFtc1tpXS5zdWJzdHJpbmcocG9zICsgMSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmb3VuZDtcbiAgfVxufTtcblxudmFyIGhhc0xvY2FsU3RvcmFnZVN1cHBvcnQgPSBudWxsO1xudmFyIGxvY2FsU3RvcmFnZUF2YWlsYWJsZSA9IGZ1bmN0aW9uIGxvY2FsU3RvcmFnZUF2YWlsYWJsZSgpIHtcbiAgaWYgKGhhc0xvY2FsU3RvcmFnZVN1cHBvcnQgIT09IG51bGwpIHJldHVybiBoYXNMb2NhbFN0b3JhZ2VTdXBwb3J0O1xuICB0cnkge1xuICAgIGhhc0xvY2FsU3RvcmFnZVN1cHBvcnQgPSB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5sb2NhbFN0b3JhZ2UgIT09IG51bGw7XG4gICAgdmFyIHRlc3RLZXkgPSAnaTE4bmV4dC50cmFuc2xhdGUuYm9vJztcbiAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0odGVzdEtleSwgJ2ZvbycpO1xuICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSh0ZXN0S2V5KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGhhc0xvY2FsU3RvcmFnZVN1cHBvcnQgPSBmYWxzZTtcbiAgfVxuICByZXR1cm4gaGFzTG9jYWxTdG9yYWdlU3VwcG9ydDtcbn07XG52YXIgbG9jYWxTdG9yYWdlID0ge1xuICBuYW1lOiAnbG9jYWxTdG9yYWdlJyxcbiAgbG9va3VwOiBmdW5jdGlvbiBsb29rdXAob3B0aW9ucykge1xuICAgIHZhciBmb3VuZDtcbiAgICBpZiAob3B0aW9ucy5sb29rdXBMb2NhbFN0b3JhZ2UgJiYgbG9jYWxTdG9yYWdlQXZhaWxhYmxlKCkpIHtcbiAgICAgIHZhciBsbmcgPSB3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0ob3B0aW9ucy5sb29rdXBMb2NhbFN0b3JhZ2UpO1xuICAgICAgaWYgKGxuZykgZm91bmQgPSBsbmc7XG4gICAgfVxuICAgIHJldHVybiBmb3VuZDtcbiAgfSxcbiAgY2FjaGVVc2VyTGFuZ3VhZ2U6IGZ1bmN0aW9uIGNhY2hlVXNlckxhbmd1YWdlKGxuZywgb3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zLmxvb2t1cExvY2FsU3RvcmFnZSAmJiBsb2NhbFN0b3JhZ2VBdmFpbGFibGUoKSkge1xuICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKG9wdGlvbnMubG9va3VwTG9jYWxTdG9yYWdlLCBsbmcpO1xuICAgIH1cbiAgfVxufTtcblxudmFyIGhhc1Nlc3Npb25TdG9yYWdlU3VwcG9ydCA9IG51bGw7XG52YXIgc2Vzc2lvblN0b3JhZ2VBdmFpbGFibGUgPSBmdW5jdGlvbiBzZXNzaW9uU3RvcmFnZUF2YWlsYWJsZSgpIHtcbiAgaWYgKGhhc1Nlc3Npb25TdG9yYWdlU3VwcG9ydCAhPT0gbnVsbCkgcmV0dXJuIGhhc1Nlc3Npb25TdG9yYWdlU3VwcG9ydDtcbiAgdHJ5IHtcbiAgICBoYXNTZXNzaW9uU3RvcmFnZVN1cHBvcnQgPSB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5zZXNzaW9uU3RvcmFnZSAhPT0gbnVsbDtcbiAgICB2YXIgdGVzdEtleSA9ICdpMThuZXh0LnRyYW5zbGF0ZS5ib28nO1xuICAgIHdpbmRvdy5zZXNzaW9uU3RvcmFnZS5zZXRJdGVtKHRlc3RLZXksICdmb28nKTtcbiAgICB3aW5kb3cuc2Vzc2lvblN0b3JhZ2UucmVtb3ZlSXRlbSh0ZXN0S2V5KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGhhc1Nlc3Npb25TdG9yYWdlU3VwcG9ydCA9IGZhbHNlO1xuICB9XG4gIHJldHVybiBoYXNTZXNzaW9uU3RvcmFnZVN1cHBvcnQ7XG59O1xudmFyIHNlc3Npb25TdG9yYWdlID0ge1xuICBuYW1lOiAnc2Vzc2lvblN0b3JhZ2UnLFxuICBsb29rdXA6IGZ1bmN0aW9uIGxvb2t1cChvcHRpb25zKSB7XG4gICAgdmFyIGZvdW5kO1xuICAgIGlmIChvcHRpb25zLmxvb2t1cFNlc3Npb25TdG9yYWdlICYmIHNlc3Npb25TdG9yYWdlQXZhaWxhYmxlKCkpIHtcbiAgICAgIHZhciBsbmcgPSB3aW5kb3cuc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShvcHRpb25zLmxvb2t1cFNlc3Npb25TdG9yYWdlKTtcbiAgICAgIGlmIChsbmcpIGZvdW5kID0gbG5nO1xuICAgIH1cbiAgICByZXR1cm4gZm91bmQ7XG4gIH0sXG4gIGNhY2hlVXNlckxhbmd1YWdlOiBmdW5jdGlvbiBjYWNoZVVzZXJMYW5ndWFnZShsbmcsIG9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucy5sb29rdXBTZXNzaW9uU3RvcmFnZSAmJiBzZXNzaW9uU3RvcmFnZUF2YWlsYWJsZSgpKSB7XG4gICAgICB3aW5kb3cuc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbShvcHRpb25zLmxvb2t1cFNlc3Npb25TdG9yYWdlLCBsbmcpO1xuICAgIH1cbiAgfVxufTtcblxudmFyIG5hdmlnYXRvciQxID0ge1xuICBuYW1lOiAnbmF2aWdhdG9yJyxcbiAgbG9va3VwOiBmdW5jdGlvbiBsb29rdXAob3B0aW9ucykge1xuICAgIHZhciBmb3VuZCA9IFtdO1xuICAgIGlmICh0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgaWYgKG5hdmlnYXRvci5sYW5ndWFnZXMpIHtcbiAgICAgICAgLy8gY2hyb21lIG9ubHk7IG5vdCBhbiBhcnJheSwgc28gY2FuJ3QgdXNlIC5wdXNoLmFwcGx5IGluc3RlYWQgb2YgaXRlcmF0aW5nXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbmF2aWdhdG9yLmxhbmd1YWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGZvdW5kLnB1c2gobmF2aWdhdG9yLmxhbmd1YWdlc1tpXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChuYXZpZ2F0b3IudXNlckxhbmd1YWdlKSB7XG4gICAgICAgIGZvdW5kLnB1c2gobmF2aWdhdG9yLnVzZXJMYW5ndWFnZSk7XG4gICAgICB9XG4gICAgICBpZiAobmF2aWdhdG9yLmxhbmd1YWdlKSB7XG4gICAgICAgIGZvdW5kLnB1c2gobmF2aWdhdG9yLmxhbmd1YWdlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZvdW5kLmxlbmd0aCA+IDAgPyBmb3VuZCA6IHVuZGVmaW5lZDtcbiAgfVxufTtcblxudmFyIGh0bWxUYWcgPSB7XG4gIG5hbWU6ICdodG1sVGFnJyxcbiAgbG9va3VwOiBmdW5jdGlvbiBsb29rdXAob3B0aW9ucykge1xuICAgIHZhciBmb3VuZDtcbiAgICB2YXIgaHRtbFRhZyA9IG9wdGlvbnMuaHRtbFRhZyB8fCAodHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyA/IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCA6IG51bGwpO1xuICAgIGlmIChodG1sVGFnICYmIHR5cGVvZiBodG1sVGFnLmdldEF0dHJpYnV0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgZm91bmQgPSBodG1sVGFnLmdldEF0dHJpYnV0ZSgnbGFuZycpO1xuICAgIH1cbiAgICByZXR1cm4gZm91bmQ7XG4gIH1cbn07XG5cbnZhciBwYXRoID0ge1xuICBuYW1lOiAncGF0aCcsXG4gIGxvb2t1cDogZnVuY3Rpb24gbG9va3VwKG9wdGlvbnMpIHtcbiAgICB2YXIgZm91bmQ7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB2YXIgbGFuZ3VhZ2UgPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUubWF0Y2goL1xcLyhbYS16QS1aLV0qKS9nKTtcbiAgICAgIGlmIChsYW5ndWFnZSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5sb29rdXBGcm9tUGF0aEluZGV4ID09PSAnbnVtYmVyJykge1xuICAgICAgICAgIGlmICh0eXBlb2YgbGFuZ3VhZ2Vbb3B0aW9ucy5sb29rdXBGcm9tUGF0aEluZGV4XSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIGZvdW5kID0gbGFuZ3VhZ2Vbb3B0aW9ucy5sb29rdXBGcm9tUGF0aEluZGV4XS5yZXBsYWNlKCcvJywgJycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGZvdW5kID0gbGFuZ3VhZ2VbMF0ucmVwbGFjZSgnLycsICcnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZm91bmQ7XG4gIH1cbn07XG5cbnZhciBzdWJkb21haW4gPSB7XG4gIG5hbWU6ICdzdWJkb21haW4nLFxuICBsb29rdXA6IGZ1bmN0aW9uIGxvb2t1cChvcHRpb25zKSB7XG4gICAgLy8gSWYgZ2l2ZW4gZ2V0IHRoZSBzdWJkb21haW4gaW5kZXggZWxzZSAxXG4gICAgdmFyIGxvb2t1cEZyb21TdWJkb21haW5JbmRleCA9IHR5cGVvZiBvcHRpb25zLmxvb2t1cEZyb21TdWJkb21haW5JbmRleCA9PT0gJ251bWJlcicgPyBvcHRpb25zLmxvb2t1cEZyb21TdWJkb21haW5JbmRleCArIDEgOiAxO1xuICAgIC8vIGdldCBhbGwgbWF0Y2hlcyBpZiB3aW5kb3cubG9jYXRpb24uIGlzIGV4aXN0aW5nXG4gICAgLy8gZmlyc3QgaXRlbSBvZiBtYXRjaCBpcyB0aGUgbWF0Y2ggaXRzZWxmIGFuZCB0aGUgc2Vjb25kIGlzIHRoZSBmaXJzdCBncm91cCBtYWNodCB3aGljaCBzb3VsZCBiZSB0aGUgZmlyc3Qgc3ViZG9tYWluIG1hdGNoXG4gICAgLy8gaXMgdGhlIGhvc3RuYW1lIG5vIHB1YmxpYyBkb21haW4gZ2V0IHRoZSBvciBvcHRpb24gb2YgbG9jYWxob3N0XG4gICAgdmFyIGxhbmd1YWdlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LmxvY2F0aW9uICYmIHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZSAmJiB3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUubWF0Y2goL14oXFx3ezIsNX0pXFwuKChbYS16MC05LV17MSw2M31cXC5bYS16XXsyLDZ9KXxsb2NhbGhvc3QpL2kpO1xuXG4gICAgLy8gaWYgdGhlcmUgaXMgbm8gbWF0Y2ggKG51bGwpIHJldHVybiB1bmRlZmluZWRcbiAgICBpZiAoIWxhbmd1YWdlKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgIC8vIHJldHVybiB0aGUgZ2l2ZW4gZ3JvdXAgbWF0Y2hcbiAgICByZXR1cm4gbGFuZ3VhZ2VbbG9va3VwRnJvbVN1YmRvbWFpbkluZGV4XTtcbiAgfVxufTtcblxuZnVuY3Rpb24gZ2V0RGVmYXVsdHMoKSB7XG4gIHJldHVybiB7XG4gICAgb3JkZXI6IFsncXVlcnlzdHJpbmcnLCAnY29va2llJywgJ2xvY2FsU3RvcmFnZScsICdzZXNzaW9uU3RvcmFnZScsICduYXZpZ2F0b3InLCAnaHRtbFRhZyddLFxuICAgIGxvb2t1cFF1ZXJ5c3RyaW5nOiAnbG5nJyxcbiAgICBsb29rdXBDb29raWU6ICdpMThuZXh0JyxcbiAgICBsb29rdXBMb2NhbFN0b3JhZ2U6ICdpMThuZXh0TG5nJyxcbiAgICBsb29rdXBTZXNzaW9uU3RvcmFnZTogJ2kxOG5leHRMbmcnLFxuICAgIC8vIGNhY2hlIHVzZXIgbGFuZ3VhZ2VcbiAgICBjYWNoZXM6IFsnbG9jYWxTdG9yYWdlJ10sXG4gICAgZXhjbHVkZUNhY2hlRm9yOiBbJ2NpbW9kZSddLFxuICAgIC8vIGNvb2tpZU1pbnV0ZXM6IDEwLFxuICAgIC8vIGNvb2tpZURvbWFpbjogJ215RG9tYWluJ1xuXG4gICAgY29udmVydERldGVjdGVkTGFuZ3VhZ2U6IGZ1bmN0aW9uIGNvbnZlcnREZXRlY3RlZExhbmd1YWdlKGwpIHtcbiAgICAgIHJldHVybiBsO1xuICAgIH1cbiAgfTtcbn1cbnZhciBCcm93c2VyID0gLyojX19QVVJFX18qL2Z1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gQnJvd3NlcihzZXJ2aWNlcykge1xuICAgIHZhciBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB7fTtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgQnJvd3Nlcik7XG4gICAgdGhpcy50eXBlID0gJ2xhbmd1YWdlRGV0ZWN0b3InO1xuICAgIHRoaXMuZGV0ZWN0b3JzID0ge307XG4gICAgdGhpcy5pbml0KHNlcnZpY2VzLCBvcHRpb25zKTtcbiAgfVxuICBfY3JlYXRlQ2xhc3MoQnJvd3NlciwgW3tcbiAgICBrZXk6IFwiaW5pdFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBpbml0KHNlcnZpY2VzKSB7XG4gICAgICB2YXIgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge307XG4gICAgICB2YXIgaTE4bk9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6IHt9O1xuICAgICAgdGhpcy5zZXJ2aWNlcyA9IHNlcnZpY2VzIHx8IHtcbiAgICAgICAgbGFuZ3VhZ2VVdGlsczoge31cbiAgICAgIH07IC8vIHRoaXMgd2F5IHRoZSBsYW5ndWFnZSBkZXRlY3RvciBjYW4gYmUgdXNlZCB3aXRob3V0IGkxOG5leHRcbiAgICAgIHRoaXMub3B0aW9ucyA9IGRlZmF1bHRzKG9wdGlvbnMsIHRoaXMub3B0aW9ucyB8fCB7fSwgZ2V0RGVmYXVsdHMoKSk7XG4gICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5jb252ZXJ0RGV0ZWN0ZWRMYW5ndWFnZSA9PT0gJ3N0cmluZycgJiYgdGhpcy5vcHRpb25zLmNvbnZlcnREZXRlY3RlZExhbmd1YWdlLmluZGV4T2YoJzE1ODk3JykgPiAtMSkge1xuICAgICAgICB0aGlzLm9wdGlvbnMuY29udmVydERldGVjdGVkTGFuZ3VhZ2UgPSBmdW5jdGlvbiAobCkge1xuICAgICAgICAgIHJldHVybiBsLnJlcGxhY2UoJy0nLCAnXycpO1xuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICAvLyBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eVxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5sb29rdXBGcm9tVXJsSW5kZXgpIHRoaXMub3B0aW9ucy5sb29rdXBGcm9tUGF0aEluZGV4ID0gdGhpcy5vcHRpb25zLmxvb2t1cEZyb21VcmxJbmRleDtcbiAgICAgIHRoaXMuaTE4bk9wdGlvbnMgPSBpMThuT3B0aW9ucztcbiAgICAgIHRoaXMuYWRkRGV0ZWN0b3IoY29va2llJDEpO1xuICAgICAgdGhpcy5hZGREZXRlY3RvcihxdWVyeXN0cmluZyk7XG4gICAgICB0aGlzLmFkZERldGVjdG9yKGxvY2FsU3RvcmFnZSk7XG4gICAgICB0aGlzLmFkZERldGVjdG9yKHNlc3Npb25TdG9yYWdlKTtcbiAgICAgIHRoaXMuYWRkRGV0ZWN0b3IobmF2aWdhdG9yJDEpO1xuICAgICAgdGhpcy5hZGREZXRlY3RvcihodG1sVGFnKTtcbiAgICAgIHRoaXMuYWRkRGV0ZWN0b3IocGF0aCk7XG4gICAgICB0aGlzLmFkZERldGVjdG9yKHN1YmRvbWFpbik7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImFkZERldGVjdG9yXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGFkZERldGVjdG9yKGRldGVjdG9yKSB7XG4gICAgICB0aGlzLmRldGVjdG9yc1tkZXRlY3Rvci5uYW1lXSA9IGRldGVjdG9yO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImRldGVjdFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBkZXRlY3QoZGV0ZWN0aW9uT3JkZXIpIHtcbiAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICBpZiAoIWRldGVjdGlvbk9yZGVyKSBkZXRlY3Rpb25PcmRlciA9IHRoaXMub3B0aW9ucy5vcmRlcjtcbiAgICAgIHZhciBkZXRlY3RlZCA9IFtdO1xuICAgICAgZGV0ZWN0aW9uT3JkZXIuZm9yRWFjaChmdW5jdGlvbiAoZGV0ZWN0b3JOYW1lKSB7XG4gICAgICAgIGlmIChfdGhpcy5kZXRlY3RvcnNbZGV0ZWN0b3JOYW1lXSkge1xuICAgICAgICAgIHZhciBsb29rdXAgPSBfdGhpcy5kZXRlY3RvcnNbZGV0ZWN0b3JOYW1lXS5sb29rdXAoX3RoaXMub3B0aW9ucyk7XG4gICAgICAgICAgaWYgKGxvb2t1cCAmJiB0eXBlb2YgbG9va3VwID09PSAnc3RyaW5nJykgbG9va3VwID0gW2xvb2t1cF07XG4gICAgICAgICAgaWYgKGxvb2t1cCkgZGV0ZWN0ZWQgPSBkZXRlY3RlZC5jb25jYXQobG9va3VwKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBkZXRlY3RlZCA9IGRldGVjdGVkLm1hcChmdW5jdGlvbiAoZCkge1xuICAgICAgICByZXR1cm4gX3RoaXMub3B0aW9ucy5jb252ZXJ0RGV0ZWN0ZWRMYW5ndWFnZShkKTtcbiAgICAgIH0pO1xuICAgICAgaWYgKHRoaXMuc2VydmljZXMubGFuZ3VhZ2VVdGlscy5nZXRCZXN0TWF0Y2hGcm9tQ29kZXMpIHJldHVybiBkZXRlY3RlZDsgLy8gbmV3IGkxOG5leHQgdjE5LjUuMFxuICAgICAgcmV0dXJuIGRldGVjdGVkLmxlbmd0aCA+IDAgPyBkZXRlY3RlZFswXSA6IG51bGw7IC8vIGEgbGl0dGxlIGJhY2t3YXJkIGNvbXBhdGliaWxpdHlcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiY2FjaGVVc2VyTGFuZ3VhZ2VcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gY2FjaGVVc2VyTGFuZ3VhZ2UobG5nLCBjYWNoZXMpIHtcbiAgICAgIHZhciBfdGhpczIgPSB0aGlzO1xuICAgICAgaWYgKCFjYWNoZXMpIGNhY2hlcyA9IHRoaXMub3B0aW9ucy5jYWNoZXM7XG4gICAgICBpZiAoIWNhY2hlcykgcmV0dXJuO1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5leGNsdWRlQ2FjaGVGb3IgJiYgdGhpcy5vcHRpb25zLmV4Y2x1ZGVDYWNoZUZvci5pbmRleE9mKGxuZykgPiAtMSkgcmV0dXJuO1xuICAgICAgY2FjaGVzLmZvckVhY2goZnVuY3Rpb24gKGNhY2hlTmFtZSkge1xuICAgICAgICBpZiAoX3RoaXMyLmRldGVjdG9yc1tjYWNoZU5hbWVdKSBfdGhpczIuZGV0ZWN0b3JzW2NhY2hlTmFtZV0uY2FjaGVVc2VyTGFuZ3VhZ2UobG5nLCBfdGhpczIub3B0aW9ucyk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1dKTtcbiAgcmV0dXJuIEJyb3dzZXI7XG59KCk7XG5Ccm93c2VyLnR5cGUgPSAnbGFuZ3VhZ2VEZXRlY3Rvcic7XG5cbmV4cG9ydCB7IEJyb3dzZXIgYXMgZGVmYXVsdCB9O1xuIiwgImV4cG9ydCBjb25zdCBTVEFURV9LRVlfUFJFRklYID0gJ2FqX2x0aSc7XG5leHBvcnQgY29uc3QgTUFJTl9DT05URU5UX0lEID0gJ21haW4tY29udGVudCc7XG4iLCAiaW1wb3J0IHsgSW5pdFNldHRpbmdzIH0gZnJvbSAnLi4vLi4vdHlwZXMnO1xuXG5leHBvcnQgZnVuY3Rpb24gaGFzQ29va2llKHNldHRpbmdzOiBJbml0U2V0dGluZ3MpIHtcbiAgaWYgKGRvY3VtZW50LmNvb2tpZSkge1xuICAgIHJldHVybiBkb2N1bWVudC5jb29raWUubWF0Y2goYChefDspXFxcXHMqJHtzZXR0aW5ncy5vcGVuSWRDb29raWVQcmVmaXh9YCArIHNldHRpbmdzLnN0YXRlKTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRDb29raWUoc2V0dGluZ3M6IEluaXRTZXR0aW5ncykge1xuICBkb2N1bWVudC5jb29raWUgPSBzZXR0aW5ncy5vcGVuSWRDb29raWVQcmVmaXggKyBzZXR0aW5ncy5zdGF0ZSArICc9MTsgcGF0aD0vOyBtYXgtYWdlPTYwOyBTYW1lU2l0ZT1Ob25lOydcbn1cbiIsICJpbXBvcnQgaTE4bmV4dCBmcm9tIFwiaTE4bmV4dFwiO1xuaW1wb3J0IHsgSW5pdFNldHRpbmdzIH0gZnJvbSAnLi4vLi4vdHlwZXMnO1xuXG5leHBvcnQgZnVuY3Rpb24gcHJpdmFjeUh0bWwoc2V0dGluZ3M6IEluaXRTZXR0aW5ncykge1xuICByZXR1cm4gaTE4bmV4dC50KHNldHRpbmdzLnByaXZhY3lQb2xpY3lNZXNzYWdlIHx8IGBXZSB1c2UgY29va2llcyBmb3IgbG9naW4gYW5kIHNlY3VyaXR5LmApICsgJyAnXG4gICAgKyBpMThuZXh0LnQoYExlYXJuIG1vcmUgaW4gb3VyIDxhIGhyZWY9J3t7dXJsfX0nIHRhcmdldD0nX2JsYW5rJz5wcml2YWN5IHBvbGljeTwvYT4uYCk7XG59XG4iLCAiaW1wb3J0IGkxOG5leHQgZnJvbSBcImkxOG5leHRcIjtcbmltcG9ydCB7IEluaXRTZXR0aW5ncyB9IGZyb20gJy4uLy4uL3R5cGVzJztcbmltcG9ydCB7IHByaXZhY3lIdG1sIH0gZnJvbSAnLi9wcml2YWN5JztcbmltcG9ydCB7IE1BSU5fQ09OVEVOVF9JRCB9IGZyb20gJy4uL2xpYnMvY29uc3RhbnRzJztcbmltcG9ydCB7IHRyeVJlcXVlc3RTdG9yYWdlQWNjZXNzIH0gZnJvbSAnLi4vbGlicy9wbGF0Zm9ybV9zdG9yYWdlJztcblxuZXhwb3J0IGZ1bmN0aW9uIGxhdW5jaE5ld1dpbmRvdyhzZXR0aW5nczogSW5pdFNldHRpbmdzKSB7XG4gIHdpbmRvdy5vcGVuKHNldHRpbmdzLnJlbGF1bmNoSW5pdFVybCk7XG4gIHNob3dMYXVuY2hOZXdXaW5kb3coc2V0dGluZ3MsIHsgZGlzYWJsZUxhdW5jaDogdHJ1ZSwgc2hvd1JlcXVlc3RTdG9yYWdlQWNjZXNzOiBmYWxzZSwgc2hvd1N0b3JhZ2VBY2Nlc3NEZW5pZWQ6IGZhbHNlIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2hvd0xhdW5jaE5ld1dpbmRvdyhzZXR0aW5nczogSW5pdFNldHRpbmdzLCBvcHRpb25zOiB7IGRpc2FibGVMYXVuY2g6IGJvb2xlYW4sIHNob3dSZXF1ZXN0U3RvcmFnZUFjY2VzczogYm9vbGVhbiwgc2hvd1N0b3JhZ2VBY2Nlc3NEZW5pZWQ6IGJvb2xlYW4gfSkge1xuICBjb25zdCB7IGRpc2FibGVMYXVuY2gsIHNob3dSZXF1ZXN0U3RvcmFnZUFjY2Vzcywgc2hvd1N0b3JhZ2VBY2Nlc3NEZW5pZWQgfSA9IG9wdGlvbnM7XG4gIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKE1BSU5fQ09OVEVOVF9JRCk7XG4gIGlmICghY29udGFpbmVyKSB7XG4gICAgdGhyb3cgaTE4bmV4dC50KCdDb3VsZCBub3QgZmluZCBtYWluLWNvbnRlbnQgZWxlbWVudCcpO1xuICB9XG4gIGNvbnRhaW5lci5pbm5lckhUTUwgPSBgXG4gICAgPGRpdiBjbGFzcz1cImFqLWNlbnRlcmVkLW1lc3NhZ2VcIj5cbiAgICAgIDxoMSBjbGFzcz1cImFqLXRpdGxlXCI+XG4gICAgICAgIDxpIGNsYXNzPVwibWF0ZXJpYWwtaWNvbnMtb3V0bGluZWQgYWotaWNvblwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPmNvb2tpZV9vZmY8L2k+XG4gICAgICAgICR7aTE4bmV4dC50KFwiQ29va2llcyBSZXF1aXJlZFwiKX1cbiAgICAgIDwvaDE+XG4gICAgICA8cCBjbGFzcz1cImFqLXRleHRcIj5cbiAgICAgICAgJHtwcml2YWN5SHRtbChzZXR0aW5ncyl9IDwvcD5cbiAgICAgIDxwIGNsYXNzPVwiYWotdGV4dFwiPlxuICAgICAgICAke2kxOG5leHQudCgnUGxlYXNlIGNsaWNrIHRoZSBidXR0b24gYmVsb3cgdG8gcmVsb2FkIGluIGEgbmV3IHdpbmRvdy4nKX1cbiAgICAgIDwvcD5cbiAgICAgIDxidXR0b24gaWQ9XCJidXR0b25fbGF1bmNoX25ld193aW5kb3dcIiBjbGFzcz1cImFqLWJ0biBhai1idG4tLWJsdWVcIiAke2Rpc2FibGVMYXVuY2ggPyAnZGlzYWJsZWQ9XCJcIicgOiAnJ30gPlxuICAgICAgICAke2kxOG5leHQudCgnT3BlbiBpbiBhIG5ldyB3aW5kb3cnKX1cbiAgICAgIDwvYnV0dG9uPlxuICAgICAgPC9hPlxuICAgICAgJHtzaG93UmVxdWVzdFN0b3JhZ2VBY2Nlc3MgPyBgXG4gICAgICAgIDxkaXYgaWQ9XCJyZXF1ZXN0X3N0b3JhZ2VfYWNjZXNzXCI+XG4gICAgICAgICAgPHAgY2xhc3M9XCJhai10ZXh0XCI+XG4gICAgICAgICAgICAke2kxOG5leHQudChcIklmIHlvdSBoYXZlIHVzZWQgdGhpcyBhcHBsaWNhdGlvbiBiZWZvcmUsIHlvdXIgYnJvd3NlciBtYXkgYWxsb3cgeW91IHRvIDxhIGlkPSdyZXF1ZXN0X3N0b3JhZ2VfYWNjZXNzX2xpbmsnIGhyZWY9JyMnPmVuYWJsZSBjb29raWVzPC9hPiBhbmQgcHJldmVudCB0aGlzIG1lc3NhZ2UgaW4gdGhlIGZ1dHVyZS5cIil9XG4gICAgICAgICAgPC9wPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIGA6ICcnfVxuICAgICAgJHtzaG93U3RvcmFnZUFjY2Vzc0RlbmllZCA/IGBcbiAgICAgIDxkaXYgaWQ9XCJyZXF1ZXN0X3N0b3JhZ2VfYWNjZXNzX2Vycm9yXCIgY2xhc3M9XCJ1LWZsZXhcIj5cbiAgICAgICAgPGkgY2xhc3M9XCJtYXRlcmlhbC1pY29ucy1vdXRsaW5lZCBhai1pY29uXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+d2FybmluZzwvaT5cbiAgICAgICAgPHAgY2xhc3M9XCJhai10ZXh0XCI+XG4gICAgICAgICR7aTE4bmV4dC50KCdUaGUgYnJvd3NlciBwcmV2ZW50ZWQgYWNjZXNzLiAgVHJ5IGxhdW5jaGluZyBpbiBhIG5ldyB3aW5kb3cgZmlyc3QgYW5kIHRoZW4gY2xpY2tpbmcgdGhpcyBvcHRpb24gYWdhaW4gbmV4dCB0aW1lLiBJZiB0aGF0IGRvZXNuXFwndCB3b3JrIGNoZWNrIHlvdXIgcHJpdmFjeSBzZXR0aW5ncy4gU29tZSBicm93c2VycyB3aWxsIHByZXZlbnQgYWxsIHRoaXJkIHBhcnR5IGNvb2tpZXMuJyl9XG4gICAgICAgIDwvcD5cbiAgICAgIDwvZGl2PlxuICAgICAgYDogJyd9XG4gICAgPC9kaXY+XG4gIGA7XG5cbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJidXR0b25fbGF1bmNoX25ld193aW5kb3dcIikhLm9uY2xpY2sgPSAoKSA9PiBsYXVuY2hOZXdXaW5kb3coc2V0dGluZ3MpO1xuXG4gIGlmIChzaG93UmVxdWVzdFN0b3JhZ2VBY2Nlc3MpIHtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInJlcXVlc3Rfc3RvcmFnZV9hY2Nlc3NfbGlua1wiKSEuXG4gICAgICBvbmNsaWNrID0gKCkgPT4gdHJ5UmVxdWVzdFN0b3JhZ2VBY2Nlc3Moc2V0dGluZ3MpO1xuICB9XG59XG4iLCAiaW1wb3J0IGkxOG5leHQgZnJvbSBcImkxOG5leHRcIjtcbmltcG9ydCB7IENhcGFiaWxpdHkgfSBmcm9tICcuLi8uLi90eXBlcyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDYXBhYmlsaXRpZXMoKTogUHJvbWlzZTxDYXBhYmlsaXR5W10+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBsZXQgcGFyZW50ID0gd2luZG93LnBhcmVudCB8fCB3aW5kb3cub3BlbmVyO1xuICAgIFxuICAgIGNvbnN0IHRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGkxOG5leHQudCgnY2FwYWJpbGl0aWVzIHJlcXVlc3QgdGltZW91dCcpKTtcbiAgICAgIHJlamVjdChuZXcgRXJyb3IoaTE4bmV4dC50KCdUaW1lb3V0IHdoaWxlIHdhaXRpbmcgZm9yIGNhcGFiaWxpdGllcyByZXNwb25zZScpKSk7XG4gICAgfSwgMTAwMCk7XG5cbiAgICBjb25zdCByZWNlaXZlTWVzc2FnZSA9IChldmVudDogTWVzc2FnZUV2ZW50KSA9PiB7XG4gICAgICBpZiAoXG4gICAgICAgIHR5cGVvZiBldmVudC5kYXRhID09PSAnb2JqZWN0JyAmJlxuICAgICAgICBldmVudC5kYXRhLnN1YmplY3QgPT09ICdsdGkuY2FwYWJpbGl0aWVzLnJlc3BvbnNlJyAmJlxuICAgICAgICBldmVudC5kYXRhLm1lc3NhZ2VfaWQgPT09ICdhai1sdGktY2FwcydcbiAgICAgICkge1xuICAgICAgICByZW1vdmVFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgcmVjZWl2ZU1lc3NhZ2UpO1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG5cbiAgICAgICAgaWYgKGV2ZW50LmRhdGEuZXJyb3IpIHtcbiAgICAgICAgICAvLyBoYW5kbGUgZXJyb3JzXG4gICAgICAgICAgY29uc29sZS5lcnJvcihldmVudC5kYXRhLmVycm9yLmNvZGUpO1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXZlbnQuZGF0YS5lcnJvci5tZXNzYWdlKTtcbiAgICAgICAgICByZWplY3QobmV3IEVycm9yKGV2ZW50LmRhdGEuZXJyb3JtZXNzYWdlKSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHJlc29sdmUoZXZlbnQuZGF0YS5zdXBwb3J0ZWRfbWVzc2FnZXMpO1xuICAgICAgfVxuICAgIH07XG4gICAgXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCByZWNlaXZlTWVzc2FnZSk7XG4gICAgcGFyZW50LnBvc3RNZXNzYWdlKFxuICAgICAge1xuICAgICAgICAnc3ViamVjdCc6ICdsdGkuY2FwYWJpbGl0aWVzJyxcbiAgICAgICAgJ21lc3NhZ2VfaWQnOiAnYWotbHRpLWNhcHMnLFxuICAgICAgfSxcbiAgICAgICcqJ1xuICAgIClcbiAgICAvLyBQbGF0Zm9ybSB3aWxsIHBvc3QgYSBtZXNzYWdlIGJhY2sgb3Igd2UnbGwgdGltZW91dFxuICB9KTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldENhcGFiaWxpdHkoc3ViamVjdDogU3RyaW5nKTogUHJvbWlzZTxDYXBhYmlsaXR5fG51bGw+IHtcbiAgY29uc3QgY2FwcyA9IGF3YWl0IGdldENhcGFiaWxpdGllcygpO1xuICBpZiAoY2Fwcykge1xuICAgIHJldHVybiBjYXBzLmZpbmQoXG4gICAgICAoZWxlbWVudCkgPT4gZWxlbWVudC5zdWJqZWN0ID09IHN1YmplY3RcbiAgICApIHx8IG51bGxcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cbiIsICJpbXBvcnQgaTE4bmV4dCBmcm9tIFwiaTE4bmV4dFwiO1xuaW1wb3J0IHsgU1RBVEVfS0VZX1BSRUZJWCB9IGZyb20gJy4vY29uc3RhbnRzJztcbmltcG9ydCB7IExUSVN0b3JhZ2VQYXJhbXMsIEluaXRTZXR0aW5ncyB9IGZyb20gJy4uLy4uL3R5cGVzJztcbmltcG9ydCB7IHNldENvb2tpZSAgfSBmcm9tICcuL2Nvb2tpZXMnO1xuaW1wb3J0IHsgc2hvd0xhdW5jaE5ld1dpbmRvdyB9IGZyb20gJy4uL2h0bWwvbGF1bmNoX25ld193aW5kb3cnO1xuaW1wb3J0IHsgZ2V0Q2FwYWJpbGl0eSB9IGZyb20gXCIuLi9saWJzL2NhcGFiaWxpdGllc1wiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0VGFyZ2V0RnJhbWUoc3RvcmFnZVBhcmFtczogTFRJU3RvcmFnZVBhcmFtcyk6IFByb21pc2U8V2luZG93PiB7XG4gICAgbGV0IHRhcmdldCA9IHN0b3JhZ2VQYXJhbXMudGFyZ2V0O1xuICAgIGlmICh0YXJnZXQgPT0gbnVsbCkge1xuICAgICAgY29uc3QgY2FwID0gYXdhaXQgZ2V0Q2FwYWJpbGl0eSgnbHRpLmdldF9kYXRhJyk7XG4gICAgICB0YXJnZXQgPSBjYXA/LmZyYW1lO1xuICAgIH1cbiAgICBpZiAodGFyZ2V0ID09IG51bGwpIHtcbiAgICAgIHRhcmdldCA9IFwiX3BhcmVudFwiXG4gICAgfVxuICAgIGNvbnN0IHBhcmVudCA9IHdpbmRvdy5wYXJlbnQgfHwgd2luZG93Lm9wZW5lcjtcbiAgICByZXR1cm4gdGFyZ2V0ID09PSBcIl9wYXJlbnRcIiA/IHBhcmVudCA6IHBhcmVudC5mcmFtZXNbdGFyZ2V0IGFzIGFueV0gfHwgcGFyZW50O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3RvcmVTdGF0ZShzdGF0ZTogc3RyaW5nLCBzdG9yYWdlUGFyYW1zOiBMVElTdG9yYWdlUGFyYW1zKTogUHJvbWlzZTx2b2lkPiB7XG4gIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgbGV0IHBsYXRmb3JtT3JpZ2luID0gbmV3IFVSTChzdG9yYWdlUGFyYW1zLnBsYXRmb3JtT0lEQ1VybCkub3JpZ2luO1xuXG4gICAgaWYgKHN0b3JhZ2VQYXJhbXMub3JpZ2luU3VwcG9ydEJyb2tlbikge1xuICAgICAgLy8gVGhlIHNwZWMgcmVxdWlyZXMgdGhhdCB0aGUgbWVzc2FnZSdzIHRhcmdldCBvcmlnaW4gYmUgc2V0IHRvIHRoZSBwbGF0Zm9ybSdzIE9JREMgQXV0aG9yaXphdGlvbiB1cmxcbiAgICAgIC8vIGJ1dCBDYW52YXMgZG9lcyBub3QgeWV0IHN1cHBvcnQgdGhpcywgc28gd2UgaGF2ZSB0byB1c2UgJyonLlxuICAgICAgcGxhdGZvcm1PcmlnaW4gPSAnKic7XG4gICAgfVxuXG4gICAgbGV0IHRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJwb3N0TWVzc2FnZSB0aW1lb3V0XCIpO1xuICAgICAgcmVqZWN0KG5ldyBFcnJvcihpMThuZXh0LnQoJ1RpbWVvdXQgd2hpbGUgd2FpdGluZyBmb3IgcGxhdGZvcm0gcmVzcG9uc2UnKSkpO1xuICAgIH0sIDIwMDApO1xuXG4gICAgbGV0IHJlY2VpdmVNZXNzYWdlID0gKGV2ZW50OiBhbnkpID0+IHtcbiAgICAgIGlmICh0eXBlb2YgZXZlbnQuZGF0YSA9PT0gXCJvYmplY3RcIiAmJlxuICAgICAgICBldmVudC5kYXRhLnN1YmplY3QgPT09IFwibHRpLnB1dF9kYXRhLnJlc3BvbnNlXCIgJiZcbiAgICAgICAgZXZlbnQuZGF0YS5tZXNzYWdlX2lkID09PSBzdGF0ZSAmJlxuICAgICAgICAoZXZlbnQub3JpZ2luID09PSBwbGF0Zm9ybU9yaWdpbiB8fFxuICAgICAgICAgIChzdG9yYWdlUGFyYW1zLm9yaWdpblN1cHBvcnRCcm9rZW4gJiYgcGxhdGZvcm1PcmlnaW4gPT09IFwiKlwiKSkpIHtcblxuICAgICAgICByZW1vdmVFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgcmVjZWl2ZU1lc3NhZ2UpO1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG5cbiAgICAgICAgaWYgKGV2ZW50LmRhdGEuZXJyb3IpIHtcbiAgICAgICAgICAvLyBoYW5kbGUgZXJyb3JzXG4gICAgICAgICAgY29uc29sZS5lcnJvcihldmVudC5kYXRhLmVycm9yLmNvZGUpO1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXZlbnQuZGF0YS5lcnJvci5tZXNzYWdlKTtcbiAgICAgICAgICByZWplY3QobmV3IEVycm9yKGV2ZW50LmRhdGEuZXJyb3JtZXNzYWdlKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIHJlY2VpdmVNZXNzYWdlKTtcbiAgICBnZXRUYXJnZXRGcmFtZShzdG9yYWdlUGFyYW1zKVxuICAgICAgLnRoZW4oIHRhcmdldEZyYW1lID0+XG4gICAgICAgICB0YXJnZXRGcmFtZT8ucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICBcInN1YmplY3RcIjogXCJsdGkucHV0X2RhdGFcIixcbiAgICAgICAgICAgXCJtZXNzYWdlX2lkXCI6IHN0YXRlLFxuICAgICAgICAgICBcImtleVwiOiBgJHtTVEFURV9LRVlfUFJFRklYfSR7c3RhdGV9YCxcbiAgICAgICAgICAgXCJ2YWx1ZVwiOiBzdGF0ZSxcbiAgICAgICAgIH0sIHBsYXRmb3JtT3JpZ2luKVxuICAgICAgICApLmNhdGNoKCAoZTogdW5rbm93bikgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGkxOG5leHQudCgnQ291bGQgbm90IGZpbmQgdGFyZ2V0IGZyYW1lJykpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKGUpO1xuICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoaTE4bmV4dC50KCdDb3VsZCBub3QgZmluZCB0YXJnZXQgZnJhbWUnKSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcblxuICAgIC8vIFBsYXRmb3JtIHNob3VsZCBwb3N0IGEgbWVzc2FnZSBiYWNrXG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFzU3RvcmFnZUFjY2Vzc0FQSSgpIHtcbiAgcmV0dXJuIHR5cGVvZiBkb2N1bWVudC5oYXNTdG9yYWdlQWNjZXNzID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGRvY3VtZW50LnJlcXVlc3RTdG9yYWdlQWNjZXNzID09PSAnZnVuY3Rpb24nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdHJ5UmVxdWVzdFN0b3JhZ2VBY2Nlc3Moc2V0dGluZ3M6IEluaXRTZXR0aW5ncykge1xuICBkb2N1bWVudC5yZXF1ZXN0U3RvcmFnZUFjY2VzcygpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgLy8gV2Ugc2hvdWxkIGhhdmUgY29va2llcyBub3dcbiAgICAgIHNldENvb2tpZShzZXR0aW5ncyk7XG4gICAgICB3aW5kb3cubG9jYXRpb24ucmVwbGFjZShzZXR0aW5ncy5yZXNwb25zZVVybCk7XG4gICAgfSlcbiAgICAuY2F0Y2goKGUpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGUpO1xuICAgICAgc2hvd0xhdW5jaE5ld1dpbmRvdyhzZXR0aW5ncywgeyBzaG93U3RvcmFnZUFjY2Vzc0RlbmllZDogdHJ1ZSwgZGlzYWJsZUxhdW5jaDogdHJ1ZSwgc2hvd1JlcXVlc3RTdG9yYWdlQWNjZXNzOiBmYWxzZSB9KTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRTdGF0ZShzdGF0ZTogc3RyaW5nLCBzdG9yYWdlUGFyYW1zOiBMVElTdG9yYWdlUGFyYW1zKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBsZXQgcGxhdGZvcm1PcmlnaW4gPSBuZXcgVVJMKHN0b3JhZ2VQYXJhbXMucGxhdGZvcm1PSURDVXJsKS5vcmlnaW47XG5cbiAgICBpZiAoc3RvcmFnZVBhcmFtcy5vcmlnaW5TdXBwb3J0QnJva2VuKSB7XG4gICAgICAvLyBUaGUgc3BlYyByZXF1aXJlcyB0aGF0IHRoZSBtZXNzYWdlJ3MgdGFyZ2V0IG9yaWdpbiBiZSBzZXQgdG8gdGhlIHBsYXRmb3JtJ3MgT0lEQyBBdXRob3JpemF0aW9uIHVybFxuICAgICAgLy8gYnV0IENhbnZhcyBkb2VzIG5vdCB5ZXQgc3VwcG9ydCB0aGlzLCBzbyB3ZSBoYXZlIHRvIHVzZSAnKicuXG4gICAgICBwbGF0Zm9ybU9yaWdpbiA9ICcqJztcbiAgICB9XG5cbiAgICBjb25zdCB0aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhpMThuZXh0LnQoJ3Bvc3RNZXNzYWdlIHRpbWVvdXQnKSk7XG4gICAgICByZWplY3QobmV3IEVycm9yKGkxOG5leHQudCgnVGltZW91dCB3aGlsZSB3YWl0aW5nIGZvciBwbGF0Zm9ybSByZXNwb25zZScpKSk7XG4gICAgfSwgMjAwMCk7XG5cbiAgICBjb25zdCByZWNlaXZlTWVzc2FnZSA9IChldmVudDogTWVzc2FnZUV2ZW50KSA9PiB7XG4gICAgICBpZiAoXG4gICAgICAgIHR5cGVvZiBldmVudC5kYXRhID09PSAnb2JqZWN0JyAmJlxuICAgICAgICBldmVudC5kYXRhLnN1YmplY3QgPT09ICdsdGkuZ2V0X2RhdGEucmVzcG9uc2UnICYmXG4gICAgICAgIGV2ZW50LmRhdGEubWVzc2FnZV9pZCA9PT0gc3RhdGUgJiZcbiAgICAgICAgKGV2ZW50Lm9yaWdpbiA9PT0gcGxhdGZvcm1PcmlnaW4gfHwgcGxhdGZvcm1PcmlnaW4gPT09ICcqJylcbiAgICAgICkge1xuICAgICAgICByZW1vdmVFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgcmVjZWl2ZU1lc3NhZ2UpO1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG5cbiAgICAgICAgaWYgKGV2ZW50LmRhdGEuZXJyb3IpIHtcbiAgICAgICAgICAvLyBoYW5kbGUgZXJyb3JzXG4gICAgICAgICAgY29uc29sZS5lcnJvcihldmVudC5kYXRhLmVycm9yLmNvZGUpO1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXZlbnQuZGF0YS5lcnJvci5tZXNzYWdlKTtcbiAgICAgICAgICByZWplY3QobmV3IEVycm9yKGV2ZW50LmRhdGEuZXJyb3JtZXNzYWdlKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmVzb2x2ZShldmVudC5kYXRhLnZhbHVlKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgcmVjZWl2ZU1lc3NhZ2UpO1xuICAgIGdldFRhcmdldEZyYW1lKHN0b3JhZ2VQYXJhbXMpXG4gICAgICAudGhlbiggdGFyZ2V0RnJhbWUgPT5cbiAgICAgICAgdGFyZ2V0RnJhbWUucG9zdE1lc3NhZ2UoXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3ViamVjdDogJ2x0aS5nZXRfZGF0YScsXG4gICAgICAgICAgICBtZXNzYWdlX2lkOiBzdGF0ZSxcbiAgICAgICAgICAgIGtleTogYCR7U1RBVEVfS0VZX1BSRUZJWH0ke3N0YXRlfWAsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBwbGF0Zm9ybU9yaWdpbilcbiAgICAgICAgKS5jYXRjaCggKGU6IHVua25vd24pID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGkxOG5leHQudCgnQ291bGQgbm90IGZpbmQgdGFyZ2V0IGZyYW1lJykpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coZSk7XG4gICAgICAgICAgICByZWplY3QobmV3IEVycm9yKGkxOG5leHQudCgnQ291bGQgbm90IGZpbmQgdGFyZ2V0IGZyYW1lJykpKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgLy8gUGxhdGZvcm0gd2lsbCBwb3N0IGEgbWVzc2FnZSBiYWNrXG4gIH0pO1xufVxuIiwgImltcG9ydCBpMThuZXh0IGZyb20gXCJpMThuZXh0XCI7XG5pbXBvcnQgeyBJbml0U2V0dGluZ3MgfSBmcm9tICcuLi8uLi90eXBlcyc7XG5pbXBvcnQgeyBwcml2YWN5SHRtbCB9IGZyb20gXCIuL3ByaXZhY3lcIjtcbmltcG9ydCB7IE1BSU5fQ09OVEVOVF9JRCB9IGZyb20gJy4uL2xpYnMvY29uc3RhbnRzJztcblxuZXhwb3J0IGZ1bmN0aW9uIHNob3dDb29raWVFcnJvcihzZXR0aW5nczogSW5pdFNldHRpbmdzKSB7XG4gIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKE1BSU5fQ09OVEVOVF9JRCk7XG5cbiAgaWYgKCFjb250YWluZXIpIHtcbiAgICB0aHJvdyBpMThuZXh0LnQoJ0NvdWxkIG5vdCBmaW5kIG1haW4tY29udGVudCBlbGVtZW50Jyk7XG4gIH1cblxuICBjb250YWluZXIuaW5uZXJIVE1MID0gYFxuICAgIDxkaXYgaWQ9XCJjb29raWVfZXJyb3JcIiBjbGFzcz1cImFqLWNlbnRlcmVkLW1lc3NhZ2VcIj5cbiAgICAgIDxoMSBjbGFzcz1cImFqLXRpdGxlXCI+XG4gICAgICAgIDxpIGNsYXNzPVwibWF0ZXJpYWwtaWNvbnMtb3V0bGluZWQgYWotaWNvblwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPmNvb2tpZV9vZmY8L2k+XG4gICAgICAgICR7aTE4bmV4dC50KFwiQ29va2llcyBSZXF1aXJlZFwiKX1cbiAgICAgIDwvaDE+XG4gICAgICA8cCBjbGFzcz1cImFqLXRleHRcIj5cbiAgICAgICAgJHtwcml2YWN5SHRtbChzZXR0aW5ncyl9XG4gICAgICA8L3A+XG4gICAgICA8cCBjbGFzcz1cImFqLXRleHRcIj5cbiAgICAgICAgJHtpMThuZXh0LnQoXCJQbGVhc2UgY2hlY2sgeW91ciBicm93c2VyIHNldHRpbmdzIGFuZCBlbmFibGUgY29va2llcy5cIil9XG4gICAgICA8L3A+XG4gICAgPC9kaXY+XG4gIGA7XG59XG4iLCAiaW1wb3J0IHsgSW5pdFNldHRpbmdzIH0gZnJvbSAnLi4vLi4vdHlwZXMnO1xuaW1wb3J0IHsgaGFzU3RvcmFnZUFjY2Vzc0FQSSB9IGZyb20gXCIuL3BsYXRmb3JtX3N0b3JhZ2VcIjtcbmltcG9ydCB7IGhhc0Nvb2tpZSB9IGZyb20gXCIuL2Nvb2tpZXNcIjtcbmltcG9ydCB7IHN0b3JlU3RhdGUgfSBmcm9tIFwiLi9wbGF0Zm9ybV9zdG9yYWdlXCI7XG5pbXBvcnQgeyBzaG93TGF1bmNoTmV3V2luZG93IH0gZnJvbSBcIi4uL2h0bWwvbGF1bmNoX25ld193aW5kb3dcIjtcbmltcG9ydCB7IHNob3dDb29raWVFcnJvciB9IGZyb20gXCIuLi9odG1sL2Nvb2tpZV9lcnJvclwiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbHRpU3RvcmFnZUxhdW5jaChzZXR0aW5nczogSW5pdFNldHRpbmdzKSB7XG4gIGxldCBzdWJtaXRUb1BsYXRmb3JtID0gKCkgPT4geyB3aW5kb3cubG9jYXRpb24ucmVwbGFjZShzZXR0aW5ncy5yZXNwb25zZVVybCkgfTtcblxuICBpZiAoaGFzQ29va2llKHNldHRpbmdzKSkge1xuICAgIC8vIFdlIGhhdmUgY29va2llc1xuICAgIHJldHVybiBzdWJtaXRUb1BsYXRmb3JtKCk7XG4gIH1cblxuICBpZiAoc2V0dGluZ3MubHRpU3RvcmFnZVBhcmFtcykge1xuICAgIC8vIFdlIGhhdmUgbHRpIHBvc3RNZXNzYWdlIHN0b3JhZ2VcbiAgICB0cnkge1xuICAgICAgYXdhaXQgc3RvcmVTdGF0ZShzZXR0aW5ncy5zdGF0ZSwgc2V0dGluZ3MubHRpU3RvcmFnZVBhcmFtcyk7XG4gICAgICByZXR1cm4gc3VibWl0VG9QbGF0Zm9ybSgpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKHdpbmRvdy5zZWxmICE9PSB3aW5kb3cudG9wKSB7XG4gICAgbGV0IHNob3dSZXF1ZXN0U3RvcmFnZUFjY2VzcyA9IGZhbHNlO1xuICAgIGlmIChoYXNTdG9yYWdlQWNjZXNzQVBJKCkpIHtcbiAgICAgIC8vIFdlIGhhdmUgc3RvcmFnZSBhY2Nlc3MgQVBJLCB3aGljaCB3aWxsIHdvcmsgZm9yIFNhZmFyaSBhcyBsb25nIGFzIHRoZVxuICAgICAgLy8gdXNlciBhbHJlYWR5IGhhcyB1c2VkIHRoZSBhcHBsaWNhdGlvbiBpbiB0aGUgdG9wIGxheWVyIGFuZCBpdCBzZXQgYSBjb29raWUuXG4gICAgICB0cnkge1xuICAgICAgICBsZXQgaGFzQWNjZXNzID0gYXdhaXQgZG9jdW1lbnQuaGFzU3RvcmFnZUFjY2VzcygpO1xuICAgICAgICBpZiAoIWhhc0FjY2Vzcykge1xuICAgICAgICAgIHNob3dSZXF1ZXN0U3RvcmFnZUFjY2VzcyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICBjb25zb2xlLmxvZyhlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgc2hvd0xhdW5jaE5ld1dpbmRvdyhzZXR0aW5ncywgeyBzaG93UmVxdWVzdFN0b3JhZ2VBY2Nlc3MsIGRpc2FibGVMYXVuY2g6IGZhbHNlLCBzaG93U3RvcmFnZUFjY2Vzc0RlbmllZDogZmFsc2UgfSk7XG4gIH0gZWxzZSB7XG4gICAgc2hvd0Nvb2tpZUVycm9yKHNldHRpbmdzKTtcbiAgfVxufVxuIiwgIntcbiAgICBcIkNvb2tpZXMgUmVxdWlyZWRcIjogXCJHYWxsZXRhcyByZXF1ZXJpZGFzXCIsXG4gICAgXCJUaGVyZSB3YXMgYW4gZXJyb3IgbGF1bmNoaW5nIHRoZSBMVEkgdG9vbC4gUGxlYXNlIHJlbG9hZCBhbmQgdHJ5IGFnYWluLlwiOiBcIkh1Ym8gdW4gZXJyb3IgYWwgaW5pY2lhciBsYSBoZXJyYW1pZW50YSBMVEkuIFZ1ZWx2YSBhIGNhcmdhciB5IHZ1ZWx2YSBhIGludGVudGFybG8uXCIsXG4gICAgXCJQbGVhc2UgY2xpY2sgdGhlIGJ1dHRvbiBiZWxvdyB0byByZWxvYWQgaW4gYSBuZXcgd2luZG93LlwiOiBcIkhhZ2EgY2xpYyBlbiBlbCBib3RcdTAwRjNuIGRlIGFiYWpvIHBhcmEgcmVjYXJnYXIgZW4gdW5hIG51ZXZhIHZlbnRhbmEuXCIsXG4gICAgXCJPcGVuIGluIGEgbmV3IHdpbmRvd1wiOiBcIkFicmlyIGVuIHVuYSBudWV2YSB2ZW50YW5hXCIsXG4gICAgXCJJZiB5b3UgaGF2ZSB1c2VkIHRoaXMgYXBwbGljYXRpb24gYmVmb3JlLCB5b3VyIGJyb3dzZXIgbWF5IGFsbG93IHlvdSB0byA8YSBpZD0ncmVxdWVzdF9zdG9yYWdlX2FjY2Vzc19saW5rJyBocmVmPScjJz5lbmFibGUgY29va2llczwvYT4gYW5kIHByZXZlbnQgdGhpcyBtZXNzYWdlIGluIHRoZSBmdXR1cmUuXCI6IFwiU2kgaGEgdXRpbGl6YWRvIGVzdGEgYXBsaWNhY2lcdTAwRjNuIGFudGVyaW9ybWVudGUsIHN1IG5hdmVnYWRvciBwdWVkZSBwZXJtaXRpcmxlIDxhIGlkPSdyZXF1ZXN0X3N0b3JhZ2VfYWNjZXNzX2xpbmsnIGhyZWY9JyMnPmhhYmlsaXRhciBjb29raWVzPC9hPiB5IGV2aXRhciBlc3RlIG1lbnNhamUgZW4gZWwgZnV0dXJvLlwiLFxuICAgIFwiVGhlIGJyb3dzZXIgcHJldmVudGVkIGFjY2Vzcy4gIFRyeSBsYXVuY2hpbmcgaW4gYSBuZXcgd2luZG93IGZpcnN0IGFuZCB0aGVuIGNsaWNraW5nIHRoaXMgb3B0aW9uIGFnYWluIG5leHQgdGltZS4gSWYgdGhhdCBkb2Vzbid0IHdvcmsgY2hlY2sgeW91ciBwcml2YWN5IHNldHRpbmdzLiBTb21lIGJyb3dzZXJzIHdpbGwgcHJldmVudCBhbGwgdGhpcmQgcGFydHkgY29va2llcy5cIjogXCJFbCBuYXZlZ2Fkb3IgaW1waWRpXHUwMEYzIGVsIGFjY2Vzby4gSW50ZW50ZSBpbmljaWFyIHByaW1lcm8gZW4gdW5hIG51ZXZhIHZlbnRhbmEgeSBsdWVnbyB2dWVsdmEgYSBoYWNlciBjbGljIGVuIGVzdGEgb3BjaVx1MDBGM24gbGEgcHJcdTAwRjN4aW1hIHZlei4gU2kgZXNvIG5vIGZ1bmNpb25hLCB2ZXJpZmlxdWUgc3UgY29uZmlndXJhY2lcdTAwRjNuIGRlIHByaXZhY2lkYWQuIEFsZ3Vub3MgbmF2ZWdhZG9yZXMgZXZpdGFyXHUwMEUxbiB0b2RhcyBsYXMgY29va2llcyBkZSB0ZXJjZXJvcy5cIixcbiAgICBcIldlIHVzZSBjb29raWVzIGZvciBsb2dpbiBhbmQgc2VjdXJpdHkuXCI6IFwiVXNhbW9zIGNvb2tpZXMgcGFyYSBpbmljaW8gZGUgc2VzaVx1MDBGM24geSBzZWd1cmlkYWQuXCIsXG4gICAgXCJMZWFybiBtb3JlIGluIG91ciA8YSBocmVmPSd7e3VybH19JyB0YXJnZXQ9J19ibGFuayc+cHJpdmFjeSBwb2xpY3k8L2E+LlwiOiBcIk9idFx1MDBFOW4gbVx1MDBFMXMgaW5mb3JtYWNpXHUwMEYzbiBlbiBudWVzdHJhIDxhIGhyZWY9J3t7dXJsfX0nIHRhcmdldD0nX2JsYW5rJz5wb2xcdTAwRUR0aWNhIGRlIHByaXZhY2lkYWQ8L2E+LlwiLFxuICAgIFwiUGxlYXNlIGNoZWNrIHlvdXIgYnJvd3NlciBzZXR0aW5ncyBhbmQgZW5hYmxlIGNvb2tpZXMuXCI6IFwiVmVyaWZpcXVlIGxhIGNvbmZpZ3VyYWNpXHUwMEYzbiBkZSBzdSBuYXZlZ2Fkb3IgeSBoYWJpbGl0ZSBsYXMgY29va2llcy5cIlxufVxuIiwgIntcbiAgICBcIkNvb2tpZXMgUmVxdWlyZWRcIjogXCJDb29raWVzIG5cdTAwRTljZXNzYWlyZXNcIixcbiAgICBcIlRoZXJlIHdhcyBhbiBlcnJvciBsYXVuY2hpbmcgdGhlIExUSSB0b29sLiBQbGVhc2UgcmVsb2FkIGFuZCB0cnkgYWdhaW4uXCI6IFwiVW5lIGVycmV1ciBzJ2VzdCBwcm9kdWl0ZSBsb3JzIGR1IGxhbmNlbWVudCBkZSBsJ291dGlsIExUSS4gVmV1aWxsZXogcmVjaGFyZ2VyIGV0IHJcdTAwRTllc3NheWVyLlwiLFxuICAgIFwiUGxlYXNlIGNsaWNrIHRoZSBidXR0b24gYmVsb3cgdG8gcmVsb2FkIGluIGEgbmV3IHdpbmRvdy5cIjogXCJWZXVpbGxleiBjbGlxdWVyIHN1ciBsZSBib3V0b24gY2ktZGVzc291cyBwb3VyIHJlY2hhcmdlciBkYW5zIHVuZSBub3V2ZWxsZSBmZW5cdTAwRUF0cmUuXCIsXG4gICAgXCJPcGVuIGluIGEgbmV3IHdpbmRvd1wiOiBcIk91dnJpciBkYW5zIHVuZSBub3V2ZWxsZSBmZW5cdTAwRUF0cmVcIixcbiAgICBcIklmIHlvdSBoYXZlIHVzZWQgdGhpcyBhcHBsaWNhdGlvbiBiZWZvcmUsIHlvdXIgYnJvd3NlciBtYXkgYWxsb3cgeW91IHRvIDxhIGlkPSdyZXF1ZXN0X3N0b3JhZ2VfYWNjZXNzX2xpbmsnIGhyZWY9JyMnPmVuYWJsZSBjb29raWVzPC9hPiBhbmQgcHJldmVudCB0aGlzIG1lc3NhZ2UgaW4gdGhlIGZ1dHVyZS5cIjogXCJTaSB2b3VzIGF2ZXogZFx1MDBFOWpcdTAwRTAgdXRpbGlzXHUwMEU5IGNldHRlIGFwcGxpY2F0aW9uLCB2b3RyZSBuYXZpZ2F0ZXVyIHBldXQgdm91cyBwZXJtZXR0cmUgZCc8YSBpZD0ncmVxdWVzdF9zdG9yYWdlX2FjY2Vzc19saW5rJyBocmVmPScjJz5hY3RpdmVyIGxlcyBjb29raWVzPC9hPiBldCBlbXBcdTAwRUFjaGVyIGNlIG1lc3NhZ2UgXHUwMEUwIGwnYXZlbmlyLlwiLFxuICAgIFwiVGhlIGJyb3dzZXIgcHJldmVudGVkIGFjY2Vzcy4gIFRyeSBsYXVuY2hpbmcgaW4gYSBuZXcgd2luZG93IGZpcnN0IGFuZCB0aGVuIGNsaWNraW5nIHRoaXMgb3B0aW9uIGFnYWluIG5leHQgdGltZS4gSWYgdGhhdCBkb2Vzbid0IHdvcmsgY2hlY2sgeW91ciBwcml2YWN5IHNldHRpbmdzLiBTb21lIGJyb3dzZXJzIHdpbGwgcHJldmVudCBhbGwgdGhpcmQgcGFydHkgY29va2llcy5cIjogXCJMZSBuYXZpZ2F0ZXVyIGEgZW1wXHUwMEVBY2hcdTAwRTkgbCdhY2NcdTAwRThzLiBFc3NheWV6IGQnYWJvcmQgZGUgbGFuY2VyIGRhbnMgdW5lIG5vdXZlbGxlIGZlblx1MDBFQXRyZSwgcHVpcyBjbGlxdWV6IFx1MDBFMCBub3V2ZWF1IHN1ciBjZXR0ZSBvcHRpb24gbGEgcHJvY2hhaW5lIGZvaXMuIFNpIGNlbGEgbmUgZm9uY3Rpb25uZSBwYXMsIHZcdTAwRTlyaWZpZXogdm9zIHBhcmFtXHUwMEU4dHJlcyBkZSBjb25maWRlbnRpYWxpdFx1MDBFOS4gQ2VydGFpbnMgbmF2aWdhdGV1cnMgZW1wXHUwMEVBY2hlcm9udCB0b3VzIGxlcyBjb29raWVzIHRpZXJzLlwiLFxuICAgIFwiV2UgdXNlIGNvb2tpZXMgZm9yIGxvZ2luIGFuZCBzZWN1cml0eS5cIjogXCJOb3VzIHV0aWxpc29ucyBkZXMgY29va2llcyBwb3VyIGxhIGNvbm5leGlvbiBldCBsYSBzXHUwMEU5Y3VyaXRcdTAwRTkuXCIsXG4gICAgXCJMZWFybiBtb3JlIGluIG91ciA8YSBocmVmPSd7e3VybH19JyB0YXJnZXQ9J19ibGFuayc+cHJpdmFjeSBwb2xpY3k8L2E+LlwiOiBcIkVuIHNhdm9pciBwbHVzIGRhbnMgbm90cmUgPGEgaHJlZj0ne3t1cmx9fScgdGFyZ2V0PSdfYmxhbmsnPnBvbGl0aXF1ZSBkZSBjb25maWRlbnRpYWxpdFx1MDBFOTwvYT4uXCIsXG4gICAgXCJQbGVhc2UgY2hlY2sgeW91ciBicm93c2VyIHNldHRpbmdzIGFuZCBlbmFibGUgY29va2llcy5cIjogXCJWZXVpbGxleiB2XHUwMEU5cmlmaWVyIGxlcyBwYXJhbVx1MDBFOHRyZXMgZGUgdm90cmUgbmF2aWdhdGV1ciBldCBhY3RpdmVyIGxlcyBjb29raWVzLlwiXG59XG4iLCAiaW1wb3J0IGkxOG5leHQgZnJvbSBcImkxOG5leHRcIjtcbmltcG9ydCBMYW5ndWFnZURldGVjdG9yIGZyb20gJ2kxOG5leHQtYnJvd3Nlci1sYW5ndWFnZWRldGVjdG9yJztcbmltcG9ydCB7IGx0aVN0b3JhZ2VMYXVuY2ggfSBmcm9tIFwiLi4vbGlicy9sdGlfc3RvcmFnZV9sYXVuY2hcIjtcbmltcG9ydCBlcyBmcm9tIFwiLi4vbG9jYWxlL2VzLmpzb25cIjtcbmltcG9ydCBmciBmcm9tIFwiLi4vbG9jYWxlL2ZyLmpzb25cIjtcbmltcG9ydCB7IE1BSU5fQ09OVEVOVF9JRCB9IGZyb20gXCIuLi9saWJzL2NvbnN0YW50c1wiO1xuaW1wb3J0IHsgSW5pdFNldHRpbmdzIH0gZnJvbSBcIi4uLy4uL3R5cGVzXCI7XG5cbmZ1bmN0aW9uIHNob3dFcnJvcigpIHtcbiAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoTUFJTl9DT05URU5UX0lEKTtcbiAgaWYgKCFjb250YWluZXIpIHtcbiAgICB0aHJvdyAnQ291bGQgbm90IGZpbmQgbWFpbi1jb250ZW50IGVsZW1lbnQnO1xuICB9XG4gIGNvbnRhaW5lci5pbm5lckhUTUwgKz0gYFxuICAgIDxkaXYgY2xhc3M9XCJ1LWZsZXggYWotY2VudGVyZWQtbWVzc2FnZVwiPlxuICAgICAgPGkgY2xhc3M9XCJtYXRlcmlhbC1pY29ucy1vdXRsaW5lZCBhai1pY29uXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+d2FybmluZzwvaT5cbiAgICAgIDxwIGNsYXNzPVwiYWotdGV4dCB0cmFuc2xhdGVcIj5cbiAgICAgICAgJHtpMThuZXh0LnQoXCJUaGVyZSB3YXMgYW4gZXJyb3IgbGF1bmNoaW5nIHRoZSBMVEkgdG9vbC4gUGxlYXNlIHJlbG9hZCBhbmQgdHJ5IGFnYWluLlwiKX1cbiAgICAgIDwvcD5cbiAgICA8L2Rpdj5cbiAgYDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluaXRPSURDTGF1bmNoKHNldHRpbmdzOiBJbml0U2V0dGluZ3MpIHtcbiAgbGV0IGlzTGF1bmNoZWQgPSBmYWxzZTtcblxuICBpMThuZXh0XG4gIC51c2UoTGFuZ3VhZ2VEZXRlY3RvcilcbiAgLmluaXQoe1xuICAgICAgZGV0ZWN0aW9uOiB7IG9yZGVyOiBbJ3F1ZXJ5c3RyaW5nJywgJ25hdmlnYXRvciddIH0sXG4gICAgICBmYWxsYmFja0xuZzogJ2VuJyxcbiAgICAgIGtleVNlcGFyYXRvcjogZmFsc2UsXG4gIH0pO1xuXG4gIGkxOG5leHQuYWRkUmVzb3VyY2VCdW5kbGUoJ2VzJywgJ3RyYW5zbGF0aW9uJywgZXMpO1xuICBpMThuZXh0LmFkZFJlc291cmNlQnVuZGxlKCdmcicsICd0cmFuc2xhdGlvbicsIGZyKTtcbiAgaTE4bmV4dC5jaGFuZ2VMYW5ndWFnZSgpO1xuXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCAoKSA9PiB7XG4gICAgbHRpU3RvcmFnZUxhdW5jaChzZXR0aW5ncyk7XG4gICAgaXNMYXVuY2hlZCA9IHRydWU7XG4gIH0pO1xuXG4gIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIGlmICghaXNMYXVuY2hlZCkge1xuICAgICAgc2hvd0Vycm9yKCk7XG4gICAgfVxuICB9LCA1MDAwKTtcbn1cbiIsIG51bGwsICJpbXBvcnQgeyBpbml0T0lEQ0xhdW5jaCB9IGZyb20gJ0BhdG9taWNqb2x0L2x0aS1jbGllbnQnO1xuaW1wb3J0IHR5cGUgeyBJbml0U2V0dGluZ3MgfSBmcm9tICdAYXRvbWljam9sdC9sdGktY2xpZW50L3R5cGVzJztcblxuY29uc3QgaW5pdFNldHRpbmdzOiBJbml0U2V0dGluZ3MgPSB3aW5kb3cuSU5JVF9TRVRUSU5HUztcbmluaXRPSURDTGF1bmNoKGluaXRTZXR0aW5ncyk7XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7QUFBQSxNQUFNLGdCQUFnQjtBQUFBLElBQ3BCLE1BQU07QUFBQSxJQUNOLElBQUksTUFBTTtBQUNSLFdBQUssT0FBTyxPQUFPLElBQUk7QUFBQSxJQUN6QjtBQUFBLElBQ0EsS0FBSyxNQUFNO0FBQ1QsV0FBSyxPQUFPLFFBQVEsSUFBSTtBQUFBLElBQzFC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QUFNLE1BQU0sSUFBSSxPQUFPLE1BQU0sSUFBSSxDQUFDO0FBQUEsSUFDakcsR0FBRyxPQUFLLE9BQU8sS0FBSyxJQUFJLElBQUksS0FBSyxJQUFJLElBQUksS0FBSyxLQUFLLEtBQUssS0FBSyxJQUFJLENBQUM7QUFBQSxJQUNsRSxHQUFHLE9BQUssT0FBTyxLQUFLLENBQUM7QUFBQSxJQUNyQixJQUFJLE9BQUssT0FBTyxLQUFLLElBQUksSUFBSSxLQUFLLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLEtBQUssSUFBSSxDQUFDO0FBQUEsSUFDcEUsSUFBSSxPQUFLLE9BQU8sS0FBSyxLQUFLLEtBQUssS0FBSyxJQUFJLEtBQUssS0FBSyxLQUFLLEtBQUssSUFBSSxJQUFJLEtBQUssSUFBSSxLQUFLLElBQUksQ0FBQztBQUFBLElBQ3ZGLElBQUksT0FBSyxPQUFPLElBQUksTUFBTSxLQUFLLElBQUksT0FBTyxFQUFFO0FBQUEsSUFDNUMsSUFBSSxPQUFLLE9BQU8sTUFBTSxDQUFDO0FBQUEsSUFDdkIsSUFBSSxPQUFLLE9BQU8sS0FBSyxJQUFJLElBQUksS0FBSyxJQUFJLElBQUksS0FBSyxJQUFJLElBQUksQ0FBQztBQUFBLElBQ3hELElBQUksT0FBSyxPQUFPLElBQUksTUFBTSxLQUFLLElBQUksT0FBTyxLQUFLLElBQUksSUFBSSxNQUFNLE1BQU0sSUFBSSxNQUFNLE1BQU0sSUFBSSxPQUFPLE1BQU0sSUFBSSxDQUFDO0FBQUEsSUFDekcsSUFBSSxPQUFLLE9BQU8sSUFBSSxNQUFNLEtBQUssSUFBSSxPQUFPLEtBQUssSUFBSSxNQUFNLElBQUksSUFBSSxDQUFDO0FBQUEsSUFDbEUsSUFBSSxPQUFLLE9BQU8sS0FBSyxLQUFLLElBQUksTUFBTSxLQUFLLElBQUksT0FBTyxLQUFLLElBQUksQ0FBQztBQUFBLElBQzlELElBQUksT0FBSyxPQUFPLEtBQUssSUFBSSxJQUFJLEtBQUssSUFBSSxJQUFJLENBQUM7QUFBQSxJQUMzQyxJQUFJLE9BQUssT0FBTyxLQUFLLElBQUksSUFBSSxLQUFL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QUFBLDBCQUFBLElBQUE7QUFDQSxJQUFBQSxPQUFBLDZCQUFBLElBQUE7QUFDQSxJQUFBQSxPQUFBLHVCQUFBLElBQUE7QUFDQSxJQUFBQSxPQUFBLG9CQUFBLElBQUE7QUFDQSxJQUFBQSxPQUFBLG1CQUFBLElBQUE7QUFHQSxJQUFBQSxPQUFBLG9CQUFBLElBQUE7QUFDQSxJQUFBQSxPQUFBLG1CQUFBLElBQUE7QUFDQSxJQUFBQSxPQUFBLG9CQUFBLElBQUE7RUFDRixHQXpDWSxVQUFBLFFBQUssQ0FBQSxFQUFBO0FBdUhqQixNQUFZO0FBQVosR0FBQSxTQUFZQyxZQUFTO0FBQ25CLElBQUFBLFdBQUEsVUFBQSxJQUFBO0FBQ0EsSUFBQUEsV0FBQSxnQkFBQSxJQUFBO0FBQ0EsSUFBQUEsV0FBQSxPQUFBLElBQUE7QUFDQSxJQUFBQSxXQUFBLGtCQUFBLElBQUE7RUFDRixHQUxZLGNBQUEsWUFBUyxDQUFBLEVBQUE7QUFpTHJCLE1BQVk7QUFBWixHQUFBLFNBQVlDLGVBQVk7QUFDdEIsSUFBQUEsY0FBQUEsY0FBQSxRQUFBLElBQUEsQ0FBQSxJQUFBO0FBQ0EsSUFBQUEsY0FBQUEsY0FBQSxVQUFBLElBQUEsQ0FBQSxJQUFBO0FBQ0EsSUFBQUEsY0FBQUEsY0FBQSxTQUFBLElBQUEsQ0FBQSxJQUFBO0VBQ0YsR0FKWSxpQkFBQSxlQUFZLENBQUEsRUFBQTs7O0FDblp4QixNQUFNLGVBQTZCLE9BQU87QUFDMUMsaUJBQWUsWUFBWTsiLAogICJuYW1lcyI6IFsidCIsICJwYXRoIiwgImNvcHkiLCAibG9hZFN0YXRlIiwgIm8iLCAidCIsICJ0IiwgInQiLCAic2VyaWFsaXplQ29va2llIiwgImxvb2t1cCIsICJsb2NhbFN0b3JhZ2VBdmFpbGFibGUiLCAiY2FjaGVVc2VyTGFuZ3VhZ2UiLCAic2Vzc2lvblN0b3JhZ2VBdmFpbGFibGUiLCAiaHRtbFRhZyIsICJCcm93c2VyIiwgImluaXQiLCAiTHRpVmVyc2lvbnMiLCAiRG9jdW1lbnRUYXJnZXRzIiwgIkFjY2VwdFR5cGVzIiwgIk1lc3NhZ2VUeXBlcyIsICJSb2xlcyIsICJBR1NTY29wZXMiLCAiTWVtYmVyU3RhdHVzIl0KfQo=
