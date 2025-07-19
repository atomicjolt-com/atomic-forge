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
    showLaunchNewWindow(settings, {
      disableLaunch: true,
      showRequestStorageAccess: false,
      showStorageAccessDenied: false
    });
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
        subject: "lti.capabilities",
        message_id: "aj-lti-caps"
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
        subject: "lti.put_data",
        message_id: state,
        key: `${STATE_KEY_PREFIX}${state}`,
        value: state
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
      showLaunchNewWindow(settings, {
        showStorageAccessDenied: true,
        disableLaunch: true,
        showRequestStorageAccess: false
      });
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
      showLaunchNewWindow(settings, {
        showRequestStorageAccess,
        disableLaunch: false,
        showStorageAccessDenied: false
      });
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
    MessageTypes2["LtiDeepLinkingResponse"] = "LtiDeepLinkingResponse";
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
    MemberStatus2["Active"] = "Active";
    MemberStatus2["Inactive"] = "Inactive";
    MemberStatus2["Deleted"] = "Deleted";
  })(MemberStatus || (MemberStatus = {}));

  // node_modules/@atomicjolt/lti-client/dist/libs/post_message/error.js
  var PostMessageError = class extends Error {
    constructor(type, payload, response) {
      super(`PostMessageError: ${type}`);
      this.type = type;
      this.payload = payload;
      this.response = response;
    }
  };
  var PostMessageErrorType;
  (function(PostMessageErrorType2) {
    PostMessageErrorType2["Timeout"] = "timeout";
    PostMessageErrorType2["ResponseError"] = "response_error";
  })(PostMessageErrorType || (PostMessageErrorType = {}));

  // node_modules/@atomicjolt/lti-client/dist/libs/post_message/client.js
  var DEFAULT_OPTIONS = {
    origin: "*",
    targetFrame: null,
    timeout: 2e3
  };
  var PostMessageClient = class {
    constructor(options) {
      this.defaultOptions = { ...DEFAULT_OPTIONS, ...options };
    }
    /** Send a request to the LTI platform via the postMessage API and recieve back the platforms response
     * If the request times out, a PostMessageError with type Timeout will be thrown
     * If the platform returns an error, a PostMessageError with type ResponseError will be thrown
     */
    async send(payload, options = {}) {
      const allOptions = {
        ...this.defaultOptions,
        ...options
      };
      const frame = await this.findTargetFrame(payload.subject, allOptions.targetFrame ?? null);
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new PostMessageError(PostMessageErrorType.Timeout, payload));
        }, allOptions.timeout);
        const receiveMessage = (event) => {
          if (typeof event.data === "object" && event.data.subject === `${payload.subject}.response` && event.data.message_id === payload.message_id && (event.origin === allOptions.origin || allOptions.origin === "*" && event.origin !== "null")) {
            window.removeEventListener("message", receiveMessage);
            clearTimeout(timeout);
            if (event.data.error) {
              reject(new PostMessageError(PostMessageErrorType.ResponseError, payload, event.data));
            } else {
              resolve(event.data);
            }
          }
        };
        window.addEventListener("message", receiveMessage);
        frame.postMessage(payload, {
          targetOrigin: allOptions.origin
        });
      });
    }
    /** Retrieve the list of message capabilities that the platform supports */
    async getCapabilities() {
      const response = await this.send({ subject: "lti.capabilities", message_id: "lti-caps" }, { origin: "*", targetFrame: window.parent ?? window.opener });
      return response.supported_messages;
    }
    /** Gets the configuration for a capability if the platform supports it, null otherwise   */
    async getCapability(capability) {
      const capabilities = await this.getCapabilities();
      return capabilities.find((c) => c.subject === capability) ?? null;
    }
    /** Generate a unique message id for a request */
    messageId(subject, ...args) {
      const random = Math.random().toString(36).substring(2);
      return `${subject}-${args.join("-")}-${random}`;
    }
    async findTargetFrame(subject, target) {
      if (typeof target !== "string" && target !== null)
        return target;
      if (target == null) {
        const cap = await this.getCapability(subject);
        target = cap?.frame ?? "_parent";
      }
      const parent = window.parent || window.opener;
      if (target === "_parent") {
        return parent;
      } else {
        return parent.frames[target] || parent;
      }
    }
  };
  var PostMessageClientWrapper = class {
    constructor(client) {
      this.client = client ?? new PostMessageClient();
    }
  };
  PostMessageClientWrapper.MessageTypes = null;

  // client/app-init.ts
  var initSettings = window.INIT_SETTINGS;
  initOIDCLaunch(initSettings);
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2kxOG5leHQvZGlzdC9lc20vaTE4bmV4dC5qcyIsICIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQGJhYmVsL3J1bnRpbWUvaGVscGVycy9lc20vY2xhc3NDYWxsQ2hlY2suanMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvZXNtL3R5cGVvZi5qcyIsICIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQGJhYmVsL3J1bnRpbWUvaGVscGVycy9lc20vdG9QcmltaXRpdmUuanMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvZXNtL3RvUHJvcGVydHlLZXkuanMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvZXNtL2NyZWF0ZUNsYXNzLmpzIiwgIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9pMThuZXh0LWJyb3dzZXItbGFuZ3VhZ2VkZXRlY3Rvci9kaXN0L2VzbS9pMThuZXh0QnJvd3Nlckxhbmd1YWdlRGV0ZWN0b3IuanMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BhdG9taWNqb2x0L2x0aS1jbGllbnQvc3JjL2xpYnMvY29uc3RhbnRzLnRzIiwgIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9AYXRvbWljam9sdC9sdGktY2xpZW50L3NyYy9saWJzL2Nvb2tpZXMudHMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BhdG9taWNqb2x0L2x0aS1jbGllbnQvc3JjL2h0bWwvcHJpdmFjeS50cyIsICIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQGF0b21pY2pvbHQvbHRpLWNsaWVudC9zcmMvaHRtbC9sYXVuY2hfbmV3X3dpbmRvdy50cyIsICIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQGF0b21pY2pvbHQvbHRpLWNsaWVudC9zcmMvbGlicy9jYXBhYmlsaXRpZXMudHMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BhdG9taWNqb2x0L2x0aS1jbGllbnQvc3JjL2xpYnMvcGxhdGZvcm1fc3RvcmFnZS50cyIsICIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQGF0b21pY2pvbHQvbHRpLWNsaWVudC9zcmMvaHRtbC9jb29raWVfZXJyb3IudHMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BhdG9taWNqb2x0L2x0aS1jbGllbnQvc3JjL2xpYnMvbHRpX3N0b3JhZ2VfbGF1bmNoLnRzIiwgIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9AYXRvbWljam9sdC9sdGktY2xpZW50L2Rpc3QvbG9jYWxlL2VzLmpzb24iLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BhdG9taWNqb2x0L2x0aS1jbGllbnQvZGlzdC9sb2NhbGUvZnIuanNvbiIsICIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQGF0b21pY2pvbHQvbHRpLWNsaWVudC9zcmMvY2xpZW50L2luaXQudHMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BhdG9taWNqb2x0L2x0aS10eXBlcy9zcmMvaW5kZXgudHMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BhdG9taWNqb2x0L2x0aS1jbGllbnQvc3JjL2xpYnMvcG9zdF9tZXNzYWdlL2Vycm9yLnRzIiwgIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9AYXRvbWljam9sdC9sdGktY2xpZW50L3NyYy9saWJzL3Bvc3RfbWVzc2FnZS9jbGllbnQudHMiLCAiLi4vLi4vLi4vY2xpZW50L2FwcC1pbml0LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBjb25zb2xlTG9nZ2VyID0ge1xuICB0eXBlOiAnbG9nZ2VyJyxcbiAgbG9nKGFyZ3MpIHtcbiAgICB0aGlzLm91dHB1dCgnbG9nJywgYXJncyk7XG4gIH0sXG4gIHdhcm4oYXJncykge1xuICAgIHRoaXMub3V0cHV0KCd3YXJuJywgYXJncyk7XG4gIH0sXG4gIGVycm9yKGFyZ3MpIHtcbiAgICB0aGlzLm91dHB1dCgnZXJyb3InLCBhcmdzKTtcbiAgfSxcbiAgb3V0cHV0KHR5cGUsIGFyZ3MpIHtcbiAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlW3R5cGVdKSBjb25zb2xlW3R5cGVdLmFwcGx5KGNvbnNvbGUsIGFyZ3MpO1xuICB9XG59O1xuY2xhc3MgTG9nZ2VyIHtcbiAgY29uc3RydWN0b3IoY29uY3JldGVMb2dnZXIpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge307XG4gICAgdGhpcy5pbml0KGNvbmNyZXRlTG9nZ2VyLCBvcHRpb25zKTtcbiAgfVxuICBpbml0KGNvbmNyZXRlTG9nZ2VyKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IHt9O1xuICAgIHRoaXMucHJlZml4ID0gb3B0aW9ucy5wcmVmaXggfHwgJ2kxOG5leHQ6JztcbiAgICB0aGlzLmxvZ2dlciA9IGNvbmNyZXRlTG9nZ2VyIHx8IGNvbnNvbGVMb2dnZXI7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLmRlYnVnID0gb3B0aW9ucy5kZWJ1ZztcbiAgfVxuICBsb2coKSB7XG4gICAgZm9yICh2YXIgX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBuZXcgQXJyYXkoX2xlbiksIF9rZXkgPSAwOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG4gICAgICBhcmdzW19rZXldID0gYXJndW1lbnRzW19rZXldO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5mb3J3YXJkKGFyZ3MsICdsb2cnLCAnJywgdHJ1ZSk7XG4gIH1cbiAgd2FybigpIHtcbiAgICBmb3IgKHZhciBfbGVuMiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBuZXcgQXJyYXkoX2xlbjIpLCBfa2V5MiA9IDA7IF9rZXkyIDwgX2xlbjI7IF9rZXkyKyspIHtcbiAgICAgIGFyZ3NbX2tleTJdID0gYXJndW1lbnRzW19rZXkyXTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZm9yd2FyZChhcmdzLCAnd2FybicsICcnLCB0cnVlKTtcbiAgfVxuICBlcnJvcigpIHtcbiAgICBmb3IgKHZhciBfbGVuMyA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBuZXcgQXJyYXkoX2xlbjMpLCBfa2V5MyA9IDA7IF9rZXkzIDwgX2xlbjM7IF9rZXkzKyspIHtcbiAgICAgIGFyZ3NbX2tleTNdID0gYXJndW1lbnRzW19rZXkzXTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZm9yd2FyZChhcmdzLCAnZXJyb3InLCAnJyk7XG4gIH1cbiAgZGVwcmVjYXRlKCkge1xuICAgIGZvciAodmFyIF9sZW40ID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IG5ldyBBcnJheShfbGVuNCksIF9rZXk0ID0gMDsgX2tleTQgPCBfbGVuNDsgX2tleTQrKykge1xuICAgICAgYXJnc1tfa2V5NF0gPSBhcmd1bWVudHNbX2tleTRdO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5mb3J3YXJkKGFyZ3MsICd3YXJuJywgJ1dBUk5JTkcgREVQUkVDQVRFRDogJywgdHJ1ZSk7XG4gIH1cbiAgZm9yd2FyZChhcmdzLCBsdmwsIHByZWZpeCwgZGVidWdPbmx5KSB7XG4gICAgaWYgKGRlYnVnT25seSAmJiAhdGhpcy5kZWJ1ZykgcmV0dXJuIG51bGw7XG4gICAgaWYgKHR5cGVvZiBhcmdzWzBdID09PSAnc3RyaW5nJykgYXJnc1swXSA9IGAke3ByZWZpeH0ke3RoaXMucHJlZml4fSAke2FyZ3NbMF19YDtcbiAgICByZXR1cm4gdGhpcy5sb2dnZXJbbHZsXShhcmdzKTtcbiAgfVxuICBjcmVhdGUobW9kdWxlTmFtZSkge1xuICAgIHJldHVybiBuZXcgTG9nZ2VyKHRoaXMubG9nZ2VyLCB7XG4gICAgICAuLi57XG4gICAgICAgIHByZWZpeDogYCR7dGhpcy5wcmVmaXh9OiR7bW9kdWxlTmFtZX06YFxuICAgICAgfSxcbiAgICAgIC4uLnRoaXMub3B0aW9uc1xuICAgIH0pO1xuICB9XG4gIGNsb25lKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB0aGlzLm9wdGlvbnM7XG4gICAgb3B0aW9ucy5wcmVmaXggPSBvcHRpb25zLnByZWZpeCB8fCB0aGlzLnByZWZpeDtcbiAgICByZXR1cm4gbmV3IExvZ2dlcih0aGlzLmxvZ2dlciwgb3B0aW9ucyk7XG4gIH1cbn1cbnZhciBiYXNlTG9nZ2VyID0gbmV3IExvZ2dlcigpO1xuXG5jbGFzcyBFdmVudEVtaXR0ZXIge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLm9ic2VydmVycyA9IHt9O1xuICB9XG4gIG9uKGV2ZW50cywgbGlzdGVuZXIpIHtcbiAgICBldmVudHMuc3BsaXQoJyAnKS5mb3JFYWNoKGV2ZW50ID0+IHtcbiAgICAgIGlmICghdGhpcy5vYnNlcnZlcnNbZXZlbnRdKSB0aGlzLm9ic2VydmVyc1tldmVudF0gPSBuZXcgTWFwKCk7XG4gICAgICBjb25zdCBudW1MaXN0ZW5lcnMgPSB0aGlzLm9ic2VydmVyc1tldmVudF0uZ2V0KGxpc3RlbmVyKSB8fCAwO1xuICAgICAgdGhpcy5vYnNlcnZlcnNbZXZlbnRdLnNldChsaXN0ZW5lciwgbnVtTGlzdGVuZXJzICsgMSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgb2ZmKGV2ZW50LCBsaXN0ZW5lcikge1xuICAgIGlmICghdGhpcy5vYnNlcnZlcnNbZXZlbnRdKSByZXR1cm47XG4gICAgaWYgKCFsaXN0ZW5lcikge1xuICAgICAgZGVsZXRlIHRoaXMub2JzZXJ2ZXJzW2V2ZW50XTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5vYnNlcnZlcnNbZXZlbnRdLmRlbGV0ZShsaXN0ZW5lcik7XG4gIH1cbiAgZW1pdChldmVudCkge1xuICAgIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gbmV3IEFycmF5KF9sZW4gPiAxID8gX2xlbiAtIDEgOiAwKSwgX2tleSA9IDE7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcbiAgICAgIGFyZ3NbX2tleSAtIDFdID0gYXJndW1lbnRzW19rZXldO1xuICAgIH1cbiAgICBpZiAodGhpcy5vYnNlcnZlcnNbZXZlbnRdKSB7XG4gICAgICBjb25zdCBjbG9uZWQgPSBBcnJheS5mcm9tKHRoaXMub2JzZXJ2ZXJzW2V2ZW50XS5lbnRyaWVzKCkpO1xuICAgICAgY2xvbmVkLmZvckVhY2goX3JlZiA9PiB7XG4gICAgICAgIGxldCBbb2JzZXJ2ZXIsIG51bVRpbWVzQWRkZWRdID0gX3JlZjtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1UaW1lc0FkZGVkOyBpKyspIHtcbiAgICAgICAgICBvYnNlcnZlciguLi5hcmdzKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIGlmICh0aGlzLm9ic2VydmVyc1snKiddKSB7XG4gICAgICBjb25zdCBjbG9uZWQgPSBBcnJheS5mcm9tKHRoaXMub2JzZXJ2ZXJzWycqJ10uZW50cmllcygpKTtcbiAgICAgIGNsb25lZC5mb3JFYWNoKF9yZWYyID0+IHtcbiAgICAgICAgbGV0IFtvYnNlcnZlciwgbnVtVGltZXNBZGRlZF0gPSBfcmVmMjtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1UaW1lc0FkZGVkOyBpKyspIHtcbiAgICAgICAgICBvYnNlcnZlci5hcHBseShvYnNlcnZlciwgW2V2ZW50LCAuLi5hcmdzXSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufVxuXG5jb25zdCBkZWZlciA9ICgpID0+IHtcbiAgbGV0IHJlcztcbiAgbGV0IHJlajtcbiAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICByZXMgPSByZXNvbHZlO1xuICAgIHJlaiA9IHJlamVjdDtcbiAgfSk7XG4gIHByb21pc2UucmVzb2x2ZSA9IHJlcztcbiAgcHJvbWlzZS5yZWplY3QgPSByZWo7XG4gIHJldHVybiBwcm9taXNlO1xufTtcbmNvbnN0IG1ha2VTdHJpbmcgPSBvYmplY3QgPT4ge1xuICBpZiAob2JqZWN0ID09IG51bGwpIHJldHVybiAnJztcbiAgcmV0dXJuICcnICsgb2JqZWN0O1xufTtcbmNvbnN0IGNvcHkgPSAoYSwgcywgdCkgPT4ge1xuICBhLmZvckVhY2gobSA9PiB7XG4gICAgaWYgKHNbbV0pIHRbbV0gPSBzW21dO1xuICB9KTtcbn07XG5jb25zdCBsYXN0T2ZQYXRoU2VwYXJhdG9yUmVnRXhwID0gLyMjIy9nO1xuY29uc3QgY2xlYW5LZXkgPSBrZXkgPT4ga2V5ICYmIGtleS5pbmRleE9mKCcjIyMnKSA+IC0xID8ga2V5LnJlcGxhY2UobGFzdE9mUGF0aFNlcGFyYXRvclJlZ0V4cCwgJy4nKSA6IGtleTtcbmNvbnN0IGNhbk5vdFRyYXZlcnNlRGVlcGVyID0gb2JqZWN0ID0+ICFvYmplY3QgfHwgdHlwZW9mIG9iamVjdCA9PT0gJ3N0cmluZyc7XG5jb25zdCBnZXRMYXN0T2ZQYXRoID0gKG9iamVjdCwgcGF0aCwgRW1wdHkpID0+IHtcbiAgY29uc3Qgc3RhY2sgPSB0eXBlb2YgcGF0aCAhPT0gJ3N0cmluZycgPyBwYXRoIDogcGF0aC5zcGxpdCgnLicpO1xuICBsZXQgc3RhY2tJbmRleCA9IDA7XG4gIHdoaWxlIChzdGFja0luZGV4IDwgc3RhY2subGVuZ3RoIC0gMSkge1xuICAgIGlmIChjYW5Ob3RUcmF2ZXJzZURlZXBlcihvYmplY3QpKSByZXR1cm4ge307XG4gICAgY29uc3Qga2V5ID0gY2xlYW5LZXkoc3RhY2tbc3RhY2tJbmRleF0pO1xuICAgIGlmICghb2JqZWN0W2tleV0gJiYgRW1wdHkpIG9iamVjdFtrZXldID0gbmV3IEVtcHR5KCk7XG4gICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIGtleSkpIHtcbiAgICAgIG9iamVjdCA9IG9iamVjdFtrZXldO1xuICAgIH0gZWxzZSB7XG4gICAgICBvYmplY3QgPSB7fTtcbiAgICB9XG4gICAgKytzdGFja0luZGV4O1xuICB9XG4gIGlmIChjYW5Ob3RUcmF2ZXJzZURlZXBlcihvYmplY3QpKSByZXR1cm4ge307XG4gIHJldHVybiB7XG4gICAgb2JqOiBvYmplY3QsXG4gICAgazogY2xlYW5LZXkoc3RhY2tbc3RhY2tJbmRleF0pXG4gIH07XG59O1xuY29uc3Qgc2V0UGF0aCA9IChvYmplY3QsIHBhdGgsIG5ld1ZhbHVlKSA9PiB7XG4gIGNvbnN0IHtcbiAgICBvYmosXG4gICAga1xuICB9ID0gZ2V0TGFzdE9mUGF0aChvYmplY3QsIHBhdGgsIE9iamVjdCk7XG4gIGlmIChvYmogIT09IHVuZGVmaW5lZCB8fCBwYXRoLmxlbmd0aCA9PT0gMSkge1xuICAgIG9ialtrXSA9IG5ld1ZhbHVlO1xuICAgIHJldHVybjtcbiAgfVxuICBsZXQgZSA9IHBhdGhbcGF0aC5sZW5ndGggLSAxXTtcbiAgbGV0IHAgPSBwYXRoLnNsaWNlKDAsIHBhdGgubGVuZ3RoIC0gMSk7XG4gIGxldCBsYXN0ID0gZ2V0TGFzdE9mUGF0aChvYmplY3QsIHAsIE9iamVjdCk7XG4gIHdoaWxlIChsYXN0Lm9iaiA9PT0gdW5kZWZpbmVkICYmIHAubGVuZ3RoKSB7XG4gICAgZSA9IGAke3BbcC5sZW5ndGggLSAxXX0uJHtlfWA7XG4gICAgcCA9IHAuc2xpY2UoMCwgcC5sZW5ndGggLSAxKTtcbiAgICBsYXN0ID0gZ2V0TGFzdE9mUGF0aChvYmplY3QsIHAsIE9iamVjdCk7XG4gICAgaWYgKGxhc3QgJiYgbGFzdC5vYmogJiYgdHlwZW9mIGxhc3Qub2JqW2Ake2xhc3Qua30uJHtlfWBdICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgbGFzdC5vYmogPSB1bmRlZmluZWQ7XG4gICAgfVxuICB9XG4gIGxhc3Qub2JqW2Ake2xhc3Qua30uJHtlfWBdID0gbmV3VmFsdWU7XG59O1xuY29uc3QgcHVzaFBhdGggPSAob2JqZWN0LCBwYXRoLCBuZXdWYWx1ZSwgY29uY2F0KSA9PiB7XG4gIGNvbnN0IHtcbiAgICBvYmosXG4gICAga1xuICB9ID0gZ2V0TGFzdE9mUGF0aChvYmplY3QsIHBhdGgsIE9iamVjdCk7XG4gIG9ialtrXSA9IG9ialtrXSB8fCBbXTtcbiAgb2JqW2tdLnB1c2gobmV3VmFsdWUpO1xufTtcbmNvbnN0IGdldFBhdGggPSAob2JqZWN0LCBwYXRoKSA9PiB7XG4gIGNvbnN0IHtcbiAgICBvYmosXG4gICAga1xuICB9ID0gZ2V0TGFzdE9mUGF0aChvYmplY3QsIHBhdGgpO1xuICBpZiAoIW9iaikgcmV0dXJuIHVuZGVmaW5lZDtcbiAgcmV0dXJuIG9ialtrXTtcbn07XG5jb25zdCBnZXRQYXRoV2l0aERlZmF1bHRzID0gKGRhdGEsIGRlZmF1bHREYXRhLCBrZXkpID0+IHtcbiAgY29uc3QgdmFsdWUgPSBnZXRQYXRoKGRhdGEsIGtleSk7XG4gIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG4gIHJldHVybiBnZXRQYXRoKGRlZmF1bHREYXRhLCBrZXkpO1xufTtcbmNvbnN0IGRlZXBFeHRlbmQgPSAodGFyZ2V0LCBzb3VyY2UsIG92ZXJ3cml0ZSkgPT4ge1xuICBmb3IgKGNvbnN0IHByb3AgaW4gc291cmNlKSB7XG4gICAgaWYgKHByb3AgIT09ICdfX3Byb3RvX18nICYmIHByb3AgIT09ICdjb25zdHJ1Y3RvcicpIHtcbiAgICAgIGlmIChwcm9wIGluIHRhcmdldCkge1xuICAgICAgICBpZiAodHlwZW9mIHRhcmdldFtwcm9wXSA9PT0gJ3N0cmluZycgfHwgdGFyZ2V0W3Byb3BdIGluc3RhbmNlb2YgU3RyaW5nIHx8IHR5cGVvZiBzb3VyY2VbcHJvcF0gPT09ICdzdHJpbmcnIHx8IHNvdXJjZVtwcm9wXSBpbnN0YW5jZW9mIFN0cmluZykge1xuICAgICAgICAgIGlmIChvdmVyd3JpdGUpIHRhcmdldFtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkZWVwRXh0ZW5kKHRhcmdldFtwcm9wXSwgc291cmNlW3Byb3BdLCBvdmVyd3JpdGUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0YXJnZXRbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiB0YXJnZXQ7XG59O1xuY29uc3QgcmVnZXhFc2NhcGUgPSBzdHIgPT4gc3RyLnJlcGxhY2UoL1tcXC1cXFtcXF1cXC9cXHtcXH1cXChcXClcXCpcXCtcXD9cXC5cXFxcXFxeXFwkXFx8XS9nLCAnXFxcXCQmJyk7XG52YXIgX2VudGl0eU1hcCA9IHtcbiAgJyYnOiAnJmFtcDsnLFxuICAnPCc6ICcmbHQ7JyxcbiAgJz4nOiAnJmd0OycsXG4gICdcIic6ICcmcXVvdDsnLFxuICBcIidcIjogJyYjMzk7JyxcbiAgJy8nOiAnJiN4MkY7J1xufTtcbmNvbnN0IGVzY2FwZSA9IGRhdGEgPT4ge1xuICBpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIGRhdGEucmVwbGFjZSgvWyY8PlwiJ1xcL10vZywgcyA9PiBfZW50aXR5TWFwW3NdKTtcbiAgfVxuICByZXR1cm4gZGF0YTtcbn07XG5jbGFzcyBSZWdFeHBDYWNoZSB7XG4gIGNvbnN0cnVjdG9yKGNhcGFjaXR5KSB7XG4gICAgdGhpcy5jYXBhY2l0eSA9IGNhcGFjaXR5O1xuICAgIHRoaXMucmVnRXhwTWFwID0gbmV3IE1hcCgpO1xuICAgIHRoaXMucmVnRXhwUXVldWUgPSBbXTtcbiAgfVxuICBnZXRSZWdFeHAocGF0dGVybikge1xuICAgIGNvbnN0IHJlZ0V4cEZyb21DYWNoZSA9IHRoaXMucmVnRXhwTWFwLmdldChwYXR0ZXJuKTtcbiAgICBpZiAocmVnRXhwRnJvbUNhY2hlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiByZWdFeHBGcm9tQ2FjaGU7XG4gICAgfVxuICAgIGNvbnN0IHJlZ0V4cE5ldyA9IG5ldyBSZWdFeHAocGF0dGVybik7XG4gICAgaWYgKHRoaXMucmVnRXhwUXVldWUubGVuZ3RoID09PSB0aGlzLmNhcGFjaXR5KSB7XG4gICAgICB0aGlzLnJlZ0V4cE1hcC5kZWxldGUodGhpcy5yZWdFeHBRdWV1ZS5zaGlmdCgpKTtcbiAgICB9XG4gICAgdGhpcy5yZWdFeHBNYXAuc2V0KHBhdHRlcm4sIHJlZ0V4cE5ldyk7XG4gICAgdGhpcy5yZWdFeHBRdWV1ZS5wdXNoKHBhdHRlcm4pO1xuICAgIHJldHVybiByZWdFeHBOZXc7XG4gIH1cbn1cbmNvbnN0IGNoYXJzID0gWycgJywgJywnLCAnPycsICchJywgJzsnXTtcbmNvbnN0IGxvb2tzTGlrZU9iamVjdFBhdGhSZWdFeHBDYWNoZSA9IG5ldyBSZWdFeHBDYWNoZSgyMCk7XG5jb25zdCBsb29rc0xpa2VPYmplY3RQYXRoID0gKGtleSwgbnNTZXBhcmF0b3IsIGtleVNlcGFyYXRvcikgPT4ge1xuICBuc1NlcGFyYXRvciA9IG5zU2VwYXJhdG9yIHx8ICcnO1xuICBrZXlTZXBhcmF0b3IgPSBrZXlTZXBhcmF0b3IgfHwgJyc7XG4gIGNvbnN0IHBvc3NpYmxlQ2hhcnMgPSBjaGFycy5maWx0ZXIoYyA9PiBuc1NlcGFyYXRvci5pbmRleE9mKGMpIDwgMCAmJiBrZXlTZXBhcmF0b3IuaW5kZXhPZihjKSA8IDApO1xuICBpZiAocG9zc2libGVDaGFycy5sZW5ndGggPT09IDApIHJldHVybiB0cnVlO1xuICBjb25zdCByID0gbG9va3NMaWtlT2JqZWN0UGF0aFJlZ0V4cENhY2hlLmdldFJlZ0V4cChgKCR7cG9zc2libGVDaGFycy5tYXAoYyA9PiBjID09PSAnPycgPyAnXFxcXD8nIDogYykuam9pbignfCcpfSlgKTtcbiAgbGV0IG1hdGNoZWQgPSAhci50ZXN0KGtleSk7XG4gIGlmICghbWF0Y2hlZCkge1xuICAgIGNvbnN0IGtpID0ga2V5LmluZGV4T2Yoa2V5U2VwYXJhdG9yKTtcbiAgICBpZiAoa2kgPiAwICYmICFyLnRlc3Qoa2V5LnN1YnN0cmluZygwLCBraSkpKSB7XG4gICAgICBtYXRjaGVkID0gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG1hdGNoZWQ7XG59O1xuY29uc3QgZGVlcEZpbmQgPSBmdW5jdGlvbiAob2JqLCBwYXRoKSB7XG4gIGxldCBrZXlTZXBhcmF0b3IgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6ICcuJztcbiAgaWYgKCFvYmopIHJldHVybiB1bmRlZmluZWQ7XG4gIGlmIChvYmpbcGF0aF0pIHJldHVybiBvYmpbcGF0aF07XG4gIGNvbnN0IHRva2VucyA9IHBhdGguc3BsaXQoa2V5U2VwYXJhdG9yKTtcbiAgbGV0IGN1cnJlbnQgPSBvYmo7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdG9rZW5zLmxlbmd0aDspIHtcbiAgICBpZiAoIWN1cnJlbnQgfHwgdHlwZW9mIGN1cnJlbnQgIT09ICdvYmplY3QnKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBsZXQgbmV4dDtcbiAgICBsZXQgbmV4dFBhdGggPSAnJztcbiAgICBmb3IgKGxldCBqID0gaTsgaiA8IHRva2Vucy5sZW5ndGg7ICsraikge1xuICAgICAgaWYgKGogIT09IGkpIHtcbiAgICAgICAgbmV4dFBhdGggKz0ga2V5U2VwYXJhdG9yO1xuICAgICAgfVxuICAgICAgbmV4dFBhdGggKz0gdG9rZW5zW2pdO1xuICAgICAgbmV4dCA9IGN1cnJlbnRbbmV4dFBhdGhdO1xuICAgICAgaWYgKG5leHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAoWydzdHJpbmcnLCAnbnVtYmVyJywgJ2Jvb2xlYW4nXS5pbmRleE9mKHR5cGVvZiBuZXh0KSA+IC0xICYmIGogPCB0b2tlbnMubGVuZ3RoIC0gMSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGkgKz0gaiAtIGkgKyAxO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgY3VycmVudCA9IG5leHQ7XG4gIH1cbiAgcmV0dXJuIGN1cnJlbnQ7XG59O1xuY29uc3QgZ2V0Q2xlYW5lZENvZGUgPSBjb2RlID0+IHtcbiAgaWYgKGNvZGUgJiYgY29kZS5pbmRleE9mKCdfJykgPiAwKSByZXR1cm4gY29kZS5yZXBsYWNlKCdfJywgJy0nKTtcbiAgcmV0dXJuIGNvZGU7XG59O1xuXG5jbGFzcyBSZXNvdXJjZVN0b3JlIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgY29uc3RydWN0b3IoZGF0YSkge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB7XG4gICAgICBuczogWyd0cmFuc2xhdGlvbiddLFxuICAgICAgZGVmYXVsdE5TOiAndHJhbnNsYXRpb24nXG4gICAgfTtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuZGF0YSA9IGRhdGEgfHwge307XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICBpZiAodGhpcy5vcHRpb25zLmtleVNlcGFyYXRvciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLm9wdGlvbnMua2V5U2VwYXJhdG9yID0gJy4nO1xuICAgIH1cbiAgICBpZiAodGhpcy5vcHRpb25zLmlnbm9yZUpTT05TdHJ1Y3R1cmUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5vcHRpb25zLmlnbm9yZUpTT05TdHJ1Y3R1cmUgPSB0cnVlO1xuICAgIH1cbiAgfVxuICBhZGROYW1lc3BhY2VzKG5zKSB7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5ucy5pbmRleE9mKG5zKSA8IDApIHtcbiAgICAgIHRoaXMub3B0aW9ucy5ucy5wdXNoKG5zKTtcbiAgICB9XG4gIH1cbiAgcmVtb3ZlTmFtZXNwYWNlcyhucykge1xuICAgIGNvbnN0IGluZGV4ID0gdGhpcy5vcHRpb25zLm5zLmluZGV4T2YobnMpO1xuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICB0aGlzLm9wdGlvbnMubnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG4gIH1cbiAgZ2V0UmVzb3VyY2UobG5nLCBucywga2V5KSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMyAmJiBhcmd1bWVudHNbM10gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1szXSA6IHt9O1xuICAgIGNvbnN0IGtleVNlcGFyYXRvciA9IG9wdGlvbnMua2V5U2VwYXJhdG9yICE9PSB1bmRlZmluZWQgPyBvcHRpb25zLmtleVNlcGFyYXRvciA6IHRoaXMub3B0aW9ucy5rZXlTZXBhcmF0b3I7XG4gICAgY29uc3QgaWdub3JlSlNPTlN0cnVjdHVyZSA9IG9wdGlvbnMuaWdub3JlSlNPTlN0cnVjdHVyZSAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy5pZ25vcmVKU09OU3RydWN0dXJlIDogdGhpcy5vcHRpb25zLmlnbm9yZUpTT05TdHJ1Y3R1cmU7XG4gICAgbGV0IHBhdGg7XG4gICAgaWYgKGxuZy5pbmRleE9mKCcuJykgPiAtMSkge1xuICAgICAgcGF0aCA9IGxuZy5zcGxpdCgnLicpO1xuICAgIH0gZWxzZSB7XG4gICAgICBwYXRoID0gW2xuZywgbnNdO1xuICAgICAgaWYgKGtleSkge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShrZXkpKSB7XG4gICAgICAgICAgcGF0aC5wdXNoKC4uLmtleSk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGtleSA9PT0gJ3N0cmluZycgJiYga2V5U2VwYXJhdG9yKSB7XG4gICAgICAgICAgcGF0aC5wdXNoKC4uLmtleS5zcGxpdChrZXlTZXBhcmF0b3IpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwYXRoLnB1c2goa2V5KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCByZXN1bHQgPSBnZXRQYXRoKHRoaXMuZGF0YSwgcGF0aCk7XG4gICAgaWYgKCFyZXN1bHQgJiYgIW5zICYmICFrZXkgJiYgbG5nLmluZGV4T2YoJy4nKSA+IC0xKSB7XG4gICAgICBsbmcgPSBwYXRoWzBdO1xuICAgICAgbnMgPSBwYXRoWzFdO1xuICAgICAga2V5ID0gcGF0aC5zbGljZSgyKS5qb2luKCcuJyk7XG4gICAgfVxuICAgIGlmIChyZXN1bHQgfHwgIWlnbm9yZUpTT05TdHJ1Y3R1cmUgfHwgdHlwZW9mIGtleSAhPT0gJ3N0cmluZycpIHJldHVybiByZXN1bHQ7XG4gICAgcmV0dXJuIGRlZXBGaW5kKHRoaXMuZGF0YSAmJiB0aGlzLmRhdGFbbG5nXSAmJiB0aGlzLmRhdGFbbG5nXVtuc10sIGtleSwga2V5U2VwYXJhdG9yKTtcbiAgfVxuICBhZGRSZXNvdXJjZShsbmcsIG5zLCBrZXksIHZhbHVlKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gNCAmJiBhcmd1bWVudHNbNF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1s0XSA6IHtcbiAgICAgIHNpbGVudDogZmFsc2VcbiAgICB9O1xuICAgIGNvbnN0IGtleVNlcGFyYXRvciA9IG9wdGlvbnMua2V5U2VwYXJhdG9yICE9PSB1bmRlZmluZWQgPyBvcHRpb25zLmtleVNlcGFyYXRvciA6IHRoaXMub3B0aW9ucy5rZXlTZXBhcmF0b3I7XG4gICAgbGV0IHBhdGggPSBbbG5nLCBuc107XG4gICAgaWYgKGtleSkgcGF0aCA9IHBhdGguY29uY2F0KGtleVNlcGFyYXRvciA/IGtleS5zcGxpdChrZXlTZXBhcmF0b3IpIDoga2V5KTtcbiAgICBpZiAobG5nLmluZGV4T2YoJy4nKSA+IC0xKSB7XG4gICAgICBwYXRoID0gbG5nLnNwbGl0KCcuJyk7XG4gICAgICB2YWx1ZSA9IG5zO1xuICAgICAgbnMgPSBwYXRoWzFdO1xuICAgIH1cbiAgICB0aGlzLmFkZE5hbWVzcGFjZXMobnMpO1xuICAgIHNldFBhdGgodGhpcy5kYXRhLCBwYXRoLCB2YWx1ZSk7XG4gICAgaWYgKCFvcHRpb25zLnNpbGVudCkgdGhpcy5lbWl0KCdhZGRlZCcsIGxuZywgbnMsIGtleSwgdmFsdWUpO1xuICB9XG4gIGFkZFJlc291cmNlcyhsbmcsIG5zLCByZXNvdXJjZXMpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAzICYmIGFyZ3VtZW50c1szXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzNdIDoge1xuICAgICAgc2lsZW50OiBmYWxzZVxuICAgIH07XG4gICAgZm9yIChjb25zdCBtIGluIHJlc291cmNlcykge1xuICAgICAgaWYgKHR5cGVvZiByZXNvdXJjZXNbbV0gPT09ICdzdHJpbmcnIHx8IEFycmF5LmlzQXJyYXkocmVzb3VyY2VzW21dKSkgdGhpcy5hZGRSZXNvdXJjZShsbmcsIG5zLCBtLCByZXNvdXJjZXNbbV0sIHtcbiAgICAgICAgc2lsZW50OiB0cnVlXG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKCFvcHRpb25zLnNpbGVudCkgdGhpcy5lbWl0KCdhZGRlZCcsIGxuZywgbnMsIHJlc291cmNlcyk7XG4gIH1cbiAgYWRkUmVzb3VyY2VCdW5kbGUobG5nLCBucywgcmVzb3VyY2VzLCBkZWVwLCBvdmVyd3JpdGUpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiA1ICYmIGFyZ3VtZW50c1s1XSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzVdIDoge1xuICAgICAgc2lsZW50OiBmYWxzZSxcbiAgICAgIHNraXBDb3B5OiBmYWxzZVxuICAgIH07XG4gICAgbGV0IHBhdGggPSBbbG5nLCBuc107XG4gICAgaWYgKGxuZy5pbmRleE9mKCcuJykgPiAtMSkge1xuICAgICAgcGF0aCA9IGxuZy5zcGxpdCgnLicpO1xuICAgICAgZGVlcCA9IHJlc291cmNlcztcbiAgICAgIHJlc291cmNlcyA9IG5zO1xuICAgICAgbnMgPSBwYXRoWzFdO1xuICAgIH1cbiAgICB0aGlzLmFkZE5hbWVzcGFjZXMobnMpO1xuICAgIGxldCBwYWNrID0gZ2V0UGF0aCh0aGlzLmRhdGEsIHBhdGgpIHx8IHt9O1xuICAgIGlmICghb3B0aW9ucy5za2lwQ29weSkgcmVzb3VyY2VzID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShyZXNvdXJjZXMpKTtcbiAgICBpZiAoZGVlcCkge1xuICAgICAgZGVlcEV4dGVuZChwYWNrLCByZXNvdXJjZXMsIG92ZXJ3cml0ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBhY2sgPSB7XG4gICAgICAgIC4uLnBhY2ssXG4gICAgICAgIC4uLnJlc291cmNlc1xuICAgICAgfTtcbiAgICB9XG4gICAgc2V0UGF0aCh0aGlzLmRhdGEsIHBhdGgsIHBhY2spO1xuICAgIGlmICghb3B0aW9ucy5zaWxlbnQpIHRoaXMuZW1pdCgnYWRkZWQnLCBsbmcsIG5zLCByZXNvdXJjZXMpO1xuICB9XG4gIHJlbW92ZVJlc291cmNlQnVuZGxlKGxuZywgbnMpIHtcbiAgICBpZiAodGhpcy5oYXNSZXNvdXJjZUJ1bmRsZShsbmcsIG5zKSkge1xuICAgICAgZGVsZXRlIHRoaXMuZGF0YVtsbmddW25zXTtcbiAgICB9XG4gICAgdGhpcy5yZW1vdmVOYW1lc3BhY2VzKG5zKTtcbiAgICB0aGlzLmVtaXQoJ3JlbW92ZWQnLCBsbmcsIG5zKTtcbiAgfVxuICBoYXNSZXNvdXJjZUJ1bmRsZShsbmcsIG5zKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UmVzb3VyY2UobG5nLCBucykgIT09IHVuZGVmaW5lZDtcbiAgfVxuICBnZXRSZXNvdXJjZUJ1bmRsZShsbmcsIG5zKSB7XG4gICAgaWYgKCFucykgbnMgPSB0aGlzLm9wdGlvbnMuZGVmYXVsdE5TO1xuICAgIGlmICh0aGlzLm9wdGlvbnMuY29tcGF0aWJpbGl0eUFQSSA9PT0gJ3YxJykgcmV0dXJuIHtcbiAgICAgIC4uLnt9LFxuICAgICAgLi4udGhpcy5nZXRSZXNvdXJjZShsbmcsIG5zKVxuICAgIH07XG4gICAgcmV0dXJuIHRoaXMuZ2V0UmVzb3VyY2UobG5nLCBucyk7XG4gIH1cbiAgZ2V0RGF0YUJ5TGFuZ3VhZ2UobG5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YVtsbmddO1xuICB9XG4gIGhhc0xhbmd1YWdlU29tZVRyYW5zbGF0aW9ucyhsbmcpIHtcbiAgICBjb25zdCBkYXRhID0gdGhpcy5nZXREYXRhQnlMYW5ndWFnZShsbmcpO1xuICAgIGNvbnN0IG4gPSBkYXRhICYmIE9iamVjdC5rZXlzKGRhdGEpIHx8IFtdO1xuICAgIHJldHVybiAhIW4uZmluZCh2ID0+IGRhdGFbdl0gJiYgT2JqZWN0LmtleXMoZGF0YVt2XSkubGVuZ3RoID4gMCk7XG4gIH1cbiAgdG9KU09OKCkge1xuICAgIHJldHVybiB0aGlzLmRhdGE7XG4gIH1cbn1cblxudmFyIHBvc3RQcm9jZXNzb3IgPSB7XG4gIHByb2Nlc3NvcnM6IHt9LFxuICBhZGRQb3N0UHJvY2Vzc29yKG1vZHVsZSkge1xuICAgIHRoaXMucHJvY2Vzc29yc1ttb2R1bGUubmFtZV0gPSBtb2R1bGU7XG4gIH0sXG4gIGhhbmRsZShwcm9jZXNzb3JzLCB2YWx1ZSwga2V5LCBvcHRpb25zLCB0cmFuc2xhdG9yKSB7XG4gICAgcHJvY2Vzc29ycy5mb3JFYWNoKHByb2Nlc3NvciA9PiB7XG4gICAgICBpZiAodGhpcy5wcm9jZXNzb3JzW3Byb2Nlc3Nvcl0pIHZhbHVlID0gdGhpcy5wcm9jZXNzb3JzW3Byb2Nlc3Nvcl0ucHJvY2Vzcyh2YWx1ZSwga2V5LCBvcHRpb25zLCB0cmFuc2xhdG9yKTtcbiAgICB9KTtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbn07XG5cbmNvbnN0IGNoZWNrZWRMb2FkZWRGb3IgPSB7fTtcbmNsYXNzIFRyYW5zbGF0b3IgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICBjb25zdHJ1Y3RvcihzZXJ2aWNlcykge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB7fTtcbiAgICBzdXBlcigpO1xuICAgIGNvcHkoWydyZXNvdXJjZVN0b3JlJywgJ2xhbmd1YWdlVXRpbHMnLCAncGx1cmFsUmVzb2x2ZXInLCAnaW50ZXJwb2xhdG9yJywgJ2JhY2tlbmRDb25uZWN0b3InLCAnaTE4bkZvcm1hdCcsICd1dGlscyddLCBzZXJ2aWNlcywgdGhpcyk7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICBpZiAodGhpcy5vcHRpb25zLmtleVNlcGFyYXRvciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLm9wdGlvbnMua2V5U2VwYXJhdG9yID0gJy4nO1xuICAgIH1cbiAgICB0aGlzLmxvZ2dlciA9IGJhc2VMb2dnZXIuY3JlYXRlKCd0cmFuc2xhdG9yJyk7XG4gIH1cbiAgY2hhbmdlTGFuZ3VhZ2UobG5nKSB7XG4gICAgaWYgKGxuZykgdGhpcy5sYW5ndWFnZSA9IGxuZztcbiAgfVxuICBleGlzdHMoa2V5KSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IHtcbiAgICAgIGludGVycG9sYXRpb246IHt9XG4gICAgfTtcbiAgICBpZiAoa2V5ID09PSB1bmRlZmluZWQgfHwga2V5ID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNvbnN0IHJlc29sdmVkID0gdGhpcy5yZXNvbHZlKGtleSwgb3B0aW9ucyk7XG4gICAgcmV0dXJuIHJlc29sdmVkICYmIHJlc29sdmVkLnJlcyAhPT0gdW5kZWZpbmVkO1xuICB9XG4gIGV4dHJhY3RGcm9tS2V5KGtleSwgb3B0aW9ucykge1xuICAgIGxldCBuc1NlcGFyYXRvciA9IG9wdGlvbnMubnNTZXBhcmF0b3IgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMubnNTZXBhcmF0b3IgOiB0aGlzLm9wdGlvbnMubnNTZXBhcmF0b3I7XG4gICAgaWYgKG5zU2VwYXJhdG9yID09PSB1bmRlZmluZWQpIG5zU2VwYXJhdG9yID0gJzonO1xuICAgIGNvbnN0IGtleVNlcGFyYXRvciA9IG9wdGlvbnMua2V5U2VwYXJhdG9yICE9PSB1bmRlZmluZWQgPyBvcHRpb25zLmtleVNlcGFyYXRvciA6IHRoaXMub3B0aW9ucy5rZXlTZXBhcmF0b3I7XG4gICAgbGV0IG5hbWVzcGFjZXMgPSBvcHRpb25zLm5zIHx8IHRoaXMub3B0aW9ucy5kZWZhdWx0TlMgfHwgW107XG4gICAgY29uc3Qgd291bGRDaGVja0Zvck5zSW5LZXkgPSBuc1NlcGFyYXRvciAmJiBrZXkuaW5kZXhPZihuc1NlcGFyYXRvcikgPiAtMTtcbiAgICBjb25zdCBzZWVtc05hdHVyYWxMYW5ndWFnZSA9ICF0aGlzLm9wdGlvbnMudXNlckRlZmluZWRLZXlTZXBhcmF0b3IgJiYgIW9wdGlvbnMua2V5U2VwYXJhdG9yICYmICF0aGlzLm9wdGlvbnMudXNlckRlZmluZWROc1NlcGFyYXRvciAmJiAhb3B0aW9ucy5uc1NlcGFyYXRvciAmJiAhbG9va3NMaWtlT2JqZWN0UGF0aChrZXksIG5zU2VwYXJhdG9yLCBrZXlTZXBhcmF0b3IpO1xuICAgIGlmICh3b3VsZENoZWNrRm9yTnNJbktleSAmJiAhc2VlbXNOYXR1cmFsTGFuZ3VhZ2UpIHtcbiAgICAgIGNvbnN0IG0gPSBrZXkubWF0Y2godGhpcy5pbnRlcnBvbGF0b3IubmVzdGluZ1JlZ2V4cCk7XG4gICAgICBpZiAobSAmJiBtLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBrZXksXG4gICAgICAgICAgbmFtZXNwYWNlc1xuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgY29uc3QgcGFydHMgPSBrZXkuc3BsaXQobnNTZXBhcmF0b3IpO1xuICAgICAgaWYgKG5zU2VwYXJhdG9yICE9PSBrZXlTZXBhcmF0b3IgfHwgbnNTZXBhcmF0b3IgPT09IGtleVNlcGFyYXRvciAmJiB0aGlzLm9wdGlvbnMubnMuaW5kZXhPZihwYXJ0c1swXSkgPiAtMSkgbmFtZXNwYWNlcyA9IHBhcnRzLnNoaWZ0KCk7XG4gICAgICBrZXkgPSBwYXJ0cy5qb2luKGtleVNlcGFyYXRvcik7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgbmFtZXNwYWNlcyA9PT0gJ3N0cmluZycpIG5hbWVzcGFjZXMgPSBbbmFtZXNwYWNlc107XG4gICAgcmV0dXJuIHtcbiAgICAgIGtleSxcbiAgICAgIG5hbWVzcGFjZXNcbiAgICB9O1xuICB9XG4gIHRyYW5zbGF0ZShrZXlzLCBvcHRpb25zLCBsYXN0S2V5KSB7XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zICE9PSAnb2JqZWN0JyAmJiB0aGlzLm9wdGlvbnMub3ZlcmxvYWRUcmFuc2xhdGlvbk9wdGlvbkhhbmRsZXIpIHtcbiAgICAgIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnMub3ZlcmxvYWRUcmFuc2xhdGlvbk9wdGlvbkhhbmRsZXIoYXJndW1lbnRzKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnb2JqZWN0Jykgb3B0aW9ucyA9IHtcbiAgICAgIC4uLm9wdGlvbnNcbiAgICB9O1xuICAgIGlmICghb3B0aW9ucykgb3B0aW9ucyA9IHt9O1xuICAgIGlmIChrZXlzID09PSB1bmRlZmluZWQgfHwga2V5cyA9PT0gbnVsbCkgcmV0dXJuICcnO1xuICAgIGlmICghQXJyYXkuaXNBcnJheShrZXlzKSkga2V5cyA9IFtTdHJpbmcoa2V5cyldO1xuICAgIGNvbnN0IHJldHVybkRldGFpbHMgPSBvcHRpb25zLnJldHVybkRldGFpbHMgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMucmV0dXJuRGV0YWlscyA6IHRoaXMub3B0aW9ucy5yZXR1cm5EZXRhaWxzO1xuICAgIGNvbnN0IGtleVNlcGFyYXRvciA9IG9wdGlvbnMua2V5U2VwYXJhdG9yICE9PSB1bmRlZmluZWQgPyBvcHRpb25zLmtleVNlcGFyYXRvciA6IHRoaXMub3B0aW9ucy5rZXlTZXBhcmF0b3I7XG4gICAgY29uc3Qge1xuICAgICAga2V5LFxuICAgICAgbmFtZXNwYWNlc1xuICAgIH0gPSB0aGlzLmV4dHJhY3RGcm9tS2V5KGtleXNba2V5cy5sZW5ndGggLSAxXSwgb3B0aW9ucyk7XG4gICAgY29uc3QgbmFtZXNwYWNlID0gbmFtZXNwYWNlc1tuYW1lc3BhY2VzLmxlbmd0aCAtIDFdO1xuICAgIGNvbnN0IGxuZyA9IG9wdGlvbnMubG5nIHx8IHRoaXMubGFuZ3VhZ2U7XG4gICAgY29uc3QgYXBwZW5kTmFtZXNwYWNlVG9DSU1vZGUgPSBvcHRpb25zLmFwcGVuZE5hbWVzcGFjZVRvQ0lNb2RlIHx8IHRoaXMub3B0aW9ucy5hcHBlbmROYW1lc3BhY2VUb0NJTW9kZTtcbiAgICBpZiAobG5nICYmIGxuZy50b0xvd2VyQ2FzZSgpID09PSAnY2ltb2RlJykge1xuICAgICAgaWYgKGFwcGVuZE5hbWVzcGFjZVRvQ0lNb2RlKSB7XG4gICAgICAgIGNvbnN0IG5zU2VwYXJhdG9yID0gb3B0aW9ucy5uc1NlcGFyYXRvciB8fCB0aGlzLm9wdGlvbnMubnNTZXBhcmF0b3I7XG4gICAgICAgIGlmIChyZXR1cm5EZXRhaWxzKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlczogYCR7bmFtZXNwYWNlfSR7bnNTZXBhcmF0b3J9JHtrZXl9YCxcbiAgICAgICAgICAgIHVzZWRLZXk6IGtleSxcbiAgICAgICAgICAgIGV4YWN0VXNlZEtleToga2V5LFxuICAgICAgICAgICAgdXNlZExuZzogbG5nLFxuICAgICAgICAgICAgdXNlZE5TOiBuYW1lc3BhY2UsXG4gICAgICAgICAgICB1c2VkUGFyYW1zOiB0aGlzLmdldFVzZWRQYXJhbXNEZXRhaWxzKG9wdGlvbnMpXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYCR7bmFtZXNwYWNlfSR7bnNTZXBhcmF0b3J9JHtrZXl9YDtcbiAgICAgIH1cbiAgICAgIGlmIChyZXR1cm5EZXRhaWxzKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgcmVzOiBrZXksXG4gICAgICAgICAgdXNlZEtleToga2V5LFxuICAgICAgICAgIGV4YWN0VXNlZEtleToga2V5LFxuICAgICAgICAgIHVzZWRMbmc6IGxuZyxcbiAgICAgICAgICB1c2VkTlM6IG5hbWVzcGFjZSxcbiAgICAgICAgICB1c2VkUGFyYW1zOiB0aGlzLmdldFVzZWRQYXJhbXNEZXRhaWxzKG9wdGlvbnMpXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICByZXR1cm4ga2V5O1xuICAgIH1cbiAgICBjb25zdCByZXNvbHZlZCA9IHRoaXMucmVzb2x2ZShrZXlzLCBvcHRpb25zKTtcbiAgICBsZXQgcmVzID0gcmVzb2x2ZWQgJiYgcmVzb2x2ZWQucmVzO1xuICAgIGNvbnN0IHJlc1VzZWRLZXkgPSByZXNvbHZlZCAmJiByZXNvbHZlZC51c2VkS2V5IHx8IGtleTtcbiAgICBjb25zdCByZXNFeGFjdFVzZWRLZXkgPSByZXNvbHZlZCAmJiByZXNvbHZlZC5leGFjdFVzZWRLZXkgfHwga2V5O1xuICAgIGNvbnN0IHJlc1R5cGUgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmFwcGx5KHJlcyk7XG4gICAgY29uc3Qgbm9PYmplY3QgPSBbJ1tvYmplY3QgTnVtYmVyXScsICdbb2JqZWN0IEZ1bmN0aW9uXScsICdbb2JqZWN0IFJlZ0V4cF0nXTtcbiAgICBjb25zdCBqb2luQXJyYXlzID0gb3B0aW9ucy5qb2luQXJyYXlzICE9PSB1bmRlZmluZWQgPyBvcHRpb25zLmpvaW5BcnJheXMgOiB0aGlzLm9wdGlvbnMuam9pbkFycmF5cztcbiAgICBjb25zdCBoYW5kbGVBc09iamVjdEluSTE4bkZvcm1hdCA9ICF0aGlzLmkxOG5Gb3JtYXQgfHwgdGhpcy5pMThuRm9ybWF0LmhhbmRsZUFzT2JqZWN0O1xuICAgIGNvbnN0IGhhbmRsZUFzT2JqZWN0ID0gdHlwZW9mIHJlcyAhPT0gJ3N0cmluZycgJiYgdHlwZW9mIHJlcyAhPT0gJ2Jvb2xlYW4nICYmIHR5cGVvZiByZXMgIT09ICdudW1iZXInO1xuICAgIGlmIChoYW5kbGVBc09iamVjdEluSTE4bkZvcm1hdCAmJiByZXMgJiYgaGFuZGxlQXNPYmplY3QgJiYgbm9PYmplY3QuaW5kZXhPZihyZXNUeXBlKSA8IDAgJiYgISh0eXBlb2Ygam9pbkFycmF5cyA9PT0gJ3N0cmluZycgJiYgQXJyYXkuaXNBcnJheShyZXMpKSkge1xuICAgICAgaWYgKCFvcHRpb25zLnJldHVybk9iamVjdHMgJiYgIXRoaXMub3B0aW9ucy5yZXR1cm5PYmplY3RzKSB7XG4gICAgICAgIGlmICghdGhpcy5vcHRpb25zLnJldHVybmVkT2JqZWN0SGFuZGxlcikge1xuICAgICAgICAgIHRoaXMubG9nZ2VyLndhcm4oJ2FjY2Vzc2luZyBhbiBvYmplY3QgLSBidXQgcmV0dXJuT2JqZWN0cyBvcHRpb25zIGlzIG5vdCBlbmFibGVkIScpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHIgPSB0aGlzLm9wdGlvbnMucmV0dXJuZWRPYmplY3RIYW5kbGVyID8gdGhpcy5vcHRpb25zLnJldHVybmVkT2JqZWN0SGFuZGxlcihyZXNVc2VkS2V5LCByZXMsIHtcbiAgICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICAgIG5zOiBuYW1lc3BhY2VzXG4gICAgICAgIH0pIDogYGtleSAnJHtrZXl9ICgke3RoaXMubGFuZ3VhZ2V9KScgcmV0dXJuZWQgYW4gb2JqZWN0IGluc3RlYWQgb2Ygc3RyaW5nLmA7XG4gICAgICAgIGlmIChyZXR1cm5EZXRhaWxzKSB7XG4gICAgICAgICAgcmVzb2x2ZWQucmVzID0gcjtcbiAgICAgICAgICByZXNvbHZlZC51c2VkUGFyYW1zID0gdGhpcy5nZXRVc2VkUGFyYW1zRGV0YWlscyhvcHRpb25zKTtcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZWQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHI7XG4gICAgICB9XG4gICAgICBpZiAoa2V5U2VwYXJhdG9yKSB7XG4gICAgICAgIGNvbnN0IHJlc1R5cGVJc0FycmF5ID0gQXJyYXkuaXNBcnJheShyZXMpO1xuICAgICAgICBjb25zdCBjb3B5ID0gcmVzVHlwZUlzQXJyYXkgPyBbXSA6IHt9O1xuICAgICAgICBjb25zdCBuZXdLZXlUb1VzZSA9IHJlc1R5cGVJc0FycmF5ID8gcmVzRXhhY3RVc2VkS2V5IDogcmVzVXNlZEtleTtcbiAgICAgICAgZm9yIChjb25zdCBtIGluIHJlcykge1xuICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocmVzLCBtKSkge1xuICAgICAgICAgICAgY29uc3QgZGVlcEtleSA9IGAke25ld0tleVRvVXNlfSR7a2V5U2VwYXJhdG9yfSR7bX1gO1xuICAgICAgICAgICAgY29weVttXSA9IHRoaXMudHJhbnNsYXRlKGRlZXBLZXksIHtcbiAgICAgICAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgICAgICAgLi4ue1xuICAgICAgICAgICAgICAgIGpvaW5BcnJheXM6IGZhbHNlLFxuICAgICAgICAgICAgICAgIG5zOiBuYW1lc3BhY2VzXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGNvcHlbbV0gPT09IGRlZXBLZXkpIGNvcHlbbV0gPSByZXNbbV07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJlcyA9IGNvcHk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChoYW5kbGVBc09iamVjdEluSTE4bkZvcm1hdCAmJiB0eXBlb2Ygam9pbkFycmF5cyA9PT0gJ3N0cmluZycgJiYgQXJyYXkuaXNBcnJheShyZXMpKSB7XG4gICAgICByZXMgPSByZXMuam9pbihqb2luQXJyYXlzKTtcbiAgICAgIGlmIChyZXMpIHJlcyA9IHRoaXMuZXh0ZW5kVHJhbnNsYXRpb24ocmVzLCBrZXlzLCBvcHRpb25zLCBsYXN0S2V5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IHVzZWREZWZhdWx0ID0gZmFsc2U7XG4gICAgICBsZXQgdXNlZEtleSA9IGZhbHNlO1xuICAgICAgY29uc3QgbmVlZHNQbHVyYWxIYW5kbGluZyA9IG9wdGlvbnMuY291bnQgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2Ygb3B0aW9ucy5jb3VudCAhPT0gJ3N0cmluZyc7XG4gICAgICBjb25zdCBoYXNEZWZhdWx0VmFsdWUgPSBUcmFuc2xhdG9yLmhhc0RlZmF1bHRWYWx1ZShvcHRpb25zKTtcbiAgICAgIGNvbnN0IGRlZmF1bHRWYWx1ZVN1ZmZpeCA9IG5lZWRzUGx1cmFsSGFuZGxpbmcgPyB0aGlzLnBsdXJhbFJlc29sdmVyLmdldFN1ZmZpeChsbmcsIG9wdGlvbnMuY291bnQsIG9wdGlvbnMpIDogJyc7XG4gICAgICBjb25zdCBkZWZhdWx0VmFsdWVTdWZmaXhPcmRpbmFsRmFsbGJhY2sgPSBvcHRpb25zLm9yZGluYWwgJiYgbmVlZHNQbHVyYWxIYW5kbGluZyA/IHRoaXMucGx1cmFsUmVzb2x2ZXIuZ2V0U3VmZml4KGxuZywgb3B0aW9ucy5jb3VudCwge1xuICAgICAgICBvcmRpbmFsOiBmYWxzZVxuICAgICAgfSkgOiAnJztcbiAgICAgIGNvbnN0IG5lZWRzWmVyb1N1ZmZpeExvb2t1cCA9IG5lZWRzUGx1cmFsSGFuZGxpbmcgJiYgIW9wdGlvbnMub3JkaW5hbCAmJiBvcHRpb25zLmNvdW50ID09PSAwICYmIHRoaXMucGx1cmFsUmVzb2x2ZXIuc2hvdWxkVXNlSW50bEFwaSgpO1xuICAgICAgY29uc3QgZGVmYXVsdFZhbHVlID0gbmVlZHNaZXJvU3VmZml4TG9va3VwICYmIG9wdGlvbnNbYGRlZmF1bHRWYWx1ZSR7dGhpcy5vcHRpb25zLnBsdXJhbFNlcGFyYXRvcn16ZXJvYF0gfHwgb3B0aW9uc1tgZGVmYXVsdFZhbHVlJHtkZWZhdWx0VmFsdWVTdWZmaXh9YF0gfHwgb3B0aW9uc1tgZGVmYXVsdFZhbHVlJHtkZWZhdWx0VmFsdWVTdWZmaXhPcmRpbmFsRmFsbGJhY2t9YF0gfHwgb3B0aW9ucy5kZWZhdWx0VmFsdWU7XG4gICAgICBpZiAoIXRoaXMuaXNWYWxpZExvb2t1cChyZXMpICYmIGhhc0RlZmF1bHRWYWx1ZSkge1xuICAgICAgICB1c2VkRGVmYXVsdCA9IHRydWU7XG4gICAgICAgIHJlcyA9IGRlZmF1bHRWYWx1ZTtcbiAgICAgIH1cbiAgICAgIGlmICghdGhpcy5pc1ZhbGlkTG9va3VwKHJlcykpIHtcbiAgICAgICAgdXNlZEtleSA9IHRydWU7XG4gICAgICAgIHJlcyA9IGtleTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG1pc3NpbmdLZXlOb1ZhbHVlRmFsbGJhY2tUb0tleSA9IG9wdGlvbnMubWlzc2luZ0tleU5vVmFsdWVGYWxsYmFja1RvS2V5IHx8IHRoaXMub3B0aW9ucy5taXNzaW5nS2V5Tm9WYWx1ZUZhbGxiYWNrVG9LZXk7XG4gICAgICBjb25zdCByZXNGb3JNaXNzaW5nID0gbWlzc2luZ0tleU5vVmFsdWVGYWxsYmFja1RvS2V5ICYmIHVzZWRLZXkgPyB1bmRlZmluZWQgOiByZXM7XG4gICAgICBjb25zdCB1cGRhdGVNaXNzaW5nID0gaGFzRGVmYXVsdFZhbHVlICYmIGRlZmF1bHRWYWx1ZSAhPT0gcmVzICYmIHRoaXMub3B0aW9ucy51cGRhdGVNaXNzaW5nO1xuICAgICAgaWYgKHVzZWRLZXkgfHwgdXNlZERlZmF1bHQgfHwgdXBkYXRlTWlzc2luZykge1xuICAgICAgICB0aGlzLmxvZ2dlci5sb2codXBkYXRlTWlzc2luZyA/ICd1cGRhdGVLZXknIDogJ21pc3NpbmdLZXknLCBsbmcsIG5hbWVzcGFjZSwga2V5LCB1cGRhdGVNaXNzaW5nID8gZGVmYXVsdFZhbHVlIDogcmVzKTtcbiAgICAgICAgaWYgKGtleVNlcGFyYXRvcikge1xuICAgICAgICAgIGNvbnN0IGZrID0gdGhpcy5yZXNvbHZlKGtleSwge1xuICAgICAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgICAgIGtleVNlcGFyYXRvcjogZmFsc2VcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBpZiAoZmsgJiYgZmsucmVzKSB0aGlzLmxvZ2dlci53YXJuKCdTZWVtcyB0aGUgbG9hZGVkIHRyYW5zbGF0aW9ucyB3ZXJlIGluIGZsYXQgSlNPTiBmb3JtYXQgaW5zdGVhZCBvZiBuZXN0ZWQuIEVpdGhlciBzZXQga2V5U2VwYXJhdG9yOiBmYWxzZSBvbiBpbml0IG9yIG1ha2Ugc3VyZSB5b3VyIHRyYW5zbGF0aW9ucyBhcmUgcHVibGlzaGVkIGluIG5lc3RlZCBmb3JtYXQuJyk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGxuZ3MgPSBbXTtcbiAgICAgICAgY29uc3QgZmFsbGJhY2tMbmdzID0gdGhpcy5sYW5ndWFnZVV0aWxzLmdldEZhbGxiYWNrQ29kZXModGhpcy5vcHRpb25zLmZhbGxiYWNrTG5nLCBvcHRpb25zLmxuZyB8fCB0aGlzLmxhbmd1YWdlKTtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zYXZlTWlzc2luZ1RvID09PSAnZmFsbGJhY2snICYmIGZhbGxiYWNrTG5ncyAmJiBmYWxsYmFja0xuZ3NbMF0pIHtcbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZhbGxiYWNrTG5ncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbG5ncy5wdXNoKGZhbGxiYWNrTG5nc1tpXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5zYXZlTWlzc2luZ1RvID09PSAnYWxsJykge1xuICAgICAgICAgIGxuZ3MgPSB0aGlzLmxhbmd1YWdlVXRpbHMudG9SZXNvbHZlSGllcmFyY2h5KG9wdGlvbnMubG5nIHx8IHRoaXMubGFuZ3VhZ2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxuZ3MucHVzaChvcHRpb25zLmxuZyB8fCB0aGlzLmxhbmd1YWdlKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzZW5kID0gKGwsIGssIHNwZWNpZmljRGVmYXVsdFZhbHVlKSA9PiB7XG4gICAgICAgICAgY29uc3QgZGVmYXVsdEZvck1pc3NpbmcgPSBoYXNEZWZhdWx0VmFsdWUgJiYgc3BlY2lmaWNEZWZhdWx0VmFsdWUgIT09IHJlcyA/IHNwZWNpZmljRGVmYXVsdFZhbHVlIDogcmVzRm9yTWlzc2luZztcbiAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLm1pc3NpbmdLZXlIYW5kbGVyKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMubWlzc2luZ0tleUhhbmRsZXIobCwgbmFtZXNwYWNlLCBrLCBkZWZhdWx0Rm9yTWlzc2luZywgdXBkYXRlTWlzc2luZywgb3B0aW9ucyk7XG4gICAgICAgICAgfSBlbHNlIGlmICh0aGlzLmJhY2tlbmRDb25uZWN0b3IgJiYgdGhpcy5iYWNrZW5kQ29ubmVjdG9yLnNhdmVNaXNzaW5nKSB7XG4gICAgICAgICAgICB0aGlzLmJhY2tlbmRDb25uZWN0b3Iuc2F2ZU1pc3NpbmcobCwgbmFtZXNwYWNlLCBrLCBkZWZhdWx0Rm9yTWlzc2luZywgdXBkYXRlTWlzc2luZywgb3B0aW9ucyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuZW1pdCgnbWlzc2luZ0tleScsIGwsIG5hbWVzcGFjZSwgaywgcmVzKTtcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zYXZlTWlzc2luZykge1xuICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2F2ZU1pc3NpbmdQbHVyYWxzICYmIG5lZWRzUGx1cmFsSGFuZGxpbmcpIHtcbiAgICAgICAgICAgIGxuZ3MuZm9yRWFjaChsYW5ndWFnZSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IHN1ZmZpeGVzID0gdGhpcy5wbHVyYWxSZXNvbHZlci5nZXRTdWZmaXhlcyhsYW5ndWFnZSwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgIGlmIChuZWVkc1plcm9TdWZmaXhMb29rdXAgJiYgb3B0aW9uc1tgZGVmYXVsdFZhbHVlJHt0aGlzLm9wdGlvbnMucGx1cmFsU2VwYXJhdG9yfXplcm9gXSAmJiBzdWZmaXhlcy5pbmRleE9mKGAke3RoaXMub3B0aW9ucy5wbHVyYWxTZXBhcmF0b3J9emVyb2ApIDwgMCkge1xuICAgICAgICAgICAgICAgIHN1ZmZpeGVzLnB1c2goYCR7dGhpcy5vcHRpb25zLnBsdXJhbFNlcGFyYXRvcn16ZXJvYCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgc3VmZml4ZXMuZm9yRWFjaChzdWZmaXggPT4ge1xuICAgICAgICAgICAgICAgIHNlbmQoW2xhbmd1YWdlXSwga2V5ICsgc3VmZml4LCBvcHRpb25zW2BkZWZhdWx0VmFsdWUke3N1ZmZpeH1gXSB8fCBkZWZhdWx0VmFsdWUpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZW5kKGxuZ3MsIGtleSwgZGVmYXVsdFZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJlcyA9IHRoaXMuZXh0ZW5kVHJhbnNsYXRpb24ocmVzLCBrZXlzLCBvcHRpb25zLCByZXNvbHZlZCwgbGFzdEtleSk7XG4gICAgICBpZiAodXNlZEtleSAmJiByZXMgPT09IGtleSAmJiB0aGlzLm9wdGlvbnMuYXBwZW5kTmFtZXNwYWNlVG9NaXNzaW5nS2V5KSByZXMgPSBgJHtuYW1lc3BhY2V9OiR7a2V5fWA7XG4gICAgICBpZiAoKHVzZWRLZXkgfHwgdXNlZERlZmF1bHQpICYmIHRoaXMub3B0aW9ucy5wYXJzZU1pc3NpbmdLZXlIYW5kbGVyKSB7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuY29tcGF0aWJpbGl0eUFQSSAhPT0gJ3YxJykge1xuICAgICAgICAgIHJlcyA9IHRoaXMub3B0aW9ucy5wYXJzZU1pc3NpbmdLZXlIYW5kbGVyKHRoaXMub3B0aW9ucy5hcHBlbmROYW1lc3BhY2VUb01pc3NpbmdLZXkgPyBgJHtuYW1lc3BhY2V9OiR7a2V5fWAgOiBrZXksIHVzZWREZWZhdWx0ID8gcmVzIDogdW5kZWZpbmVkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXMgPSB0aGlzLm9wdGlvbnMucGFyc2VNaXNzaW5nS2V5SGFuZGxlcihyZXMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChyZXR1cm5EZXRhaWxzKSB7XG4gICAgICByZXNvbHZlZC5yZXMgPSByZXM7XG4gICAgICByZXNvbHZlZC51c2VkUGFyYW1zID0gdGhpcy5nZXRVc2VkUGFyYW1zRGV0YWlscyhvcHRpb25zKTtcbiAgICAgIHJldHVybiByZXNvbHZlZDtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbiAgfVxuICBleHRlbmRUcmFuc2xhdGlvbihyZXMsIGtleSwgb3B0aW9ucywgcmVzb2x2ZWQsIGxhc3RLZXkpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIGlmICh0aGlzLmkxOG5Gb3JtYXQgJiYgdGhpcy5pMThuRm9ybWF0LnBhcnNlKSB7XG4gICAgICByZXMgPSB0aGlzLmkxOG5Gb3JtYXQucGFyc2UocmVzLCB7XG4gICAgICAgIC4uLnRoaXMub3B0aW9ucy5pbnRlcnBvbGF0aW9uLmRlZmF1bHRWYXJpYWJsZXMsXG4gICAgICAgIC4uLm9wdGlvbnNcbiAgICAgIH0sIG9wdGlvbnMubG5nIHx8IHRoaXMubGFuZ3VhZ2UgfHwgcmVzb2x2ZWQudXNlZExuZywgcmVzb2x2ZWQudXNlZE5TLCByZXNvbHZlZC51c2VkS2V5LCB7XG4gICAgICAgIHJlc29sdmVkXG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKCFvcHRpb25zLnNraXBJbnRlcnBvbGF0aW9uKSB7XG4gICAgICBpZiAob3B0aW9ucy5pbnRlcnBvbGF0aW9uKSB0aGlzLmludGVycG9sYXRvci5pbml0KHtcbiAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgLi4ue1xuICAgICAgICAgIGludGVycG9sYXRpb246IHtcbiAgICAgICAgICAgIC4uLnRoaXMub3B0aW9ucy5pbnRlcnBvbGF0aW9uLFxuICAgICAgICAgICAgLi4ub3B0aW9ucy5pbnRlcnBvbGF0aW9uXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGNvbnN0IHNraXBPblZhcmlhYmxlcyA9IHR5cGVvZiByZXMgPT09ICdzdHJpbmcnICYmIChvcHRpb25zICYmIG9wdGlvbnMuaW50ZXJwb2xhdGlvbiAmJiBvcHRpb25zLmludGVycG9sYXRpb24uc2tpcE9uVmFyaWFibGVzICE9PSB1bmRlZmluZWQgPyBvcHRpb25zLmludGVycG9sYXRpb24uc2tpcE9uVmFyaWFibGVzIDogdGhpcy5vcHRpb25zLmludGVycG9sYXRpb24uc2tpcE9uVmFyaWFibGVzKTtcbiAgICAgIGxldCBuZXN0QmVmO1xuICAgICAgaWYgKHNraXBPblZhcmlhYmxlcykge1xuICAgICAgICBjb25zdCBuYiA9IHJlcy5tYXRjaCh0aGlzLmludGVycG9sYXRvci5uZXN0aW5nUmVnZXhwKTtcbiAgICAgICAgbmVzdEJlZiA9IG5iICYmIG5iLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIGxldCBkYXRhID0gb3B0aW9ucy5yZXBsYWNlICYmIHR5cGVvZiBvcHRpb25zLnJlcGxhY2UgIT09ICdzdHJpbmcnID8gb3B0aW9ucy5yZXBsYWNlIDogb3B0aW9ucztcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbi5kZWZhdWx0VmFyaWFibGVzKSBkYXRhID0ge1xuICAgICAgICAuLi50aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbi5kZWZhdWx0VmFyaWFibGVzLFxuICAgICAgICAuLi5kYXRhXG4gICAgICB9O1xuICAgICAgcmVzID0gdGhpcy5pbnRlcnBvbGF0b3IuaW50ZXJwb2xhdGUocmVzLCBkYXRhLCBvcHRpb25zLmxuZyB8fCB0aGlzLmxhbmd1YWdlIHx8IHJlc29sdmVkLnVzZWRMbmcsIG9wdGlvbnMpO1xuICAgICAgaWYgKHNraXBPblZhcmlhYmxlcykge1xuICAgICAgICBjb25zdCBuYSA9IHJlcy5tYXRjaCh0aGlzLmludGVycG9sYXRvci5uZXN0aW5nUmVnZXhwKTtcbiAgICAgICAgY29uc3QgbmVzdEFmdCA9IG5hICYmIG5hLmxlbmd0aDtcbiAgICAgICAgaWYgKG5lc3RCZWYgPCBuZXN0QWZ0KSBvcHRpb25zLm5lc3QgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmICghb3B0aW9ucy5sbmcgJiYgdGhpcy5vcHRpb25zLmNvbXBhdGliaWxpdHlBUEkgIT09ICd2MScgJiYgcmVzb2x2ZWQgJiYgcmVzb2x2ZWQucmVzKSBvcHRpb25zLmxuZyA9IHRoaXMubGFuZ3VhZ2UgfHwgcmVzb2x2ZWQudXNlZExuZztcbiAgICAgIGlmIChvcHRpb25zLm5lc3QgIT09IGZhbHNlKSByZXMgPSB0aGlzLmludGVycG9sYXRvci5uZXN0KHJlcywgZnVuY3Rpb24gKCkge1xuICAgICAgICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IG5ldyBBcnJheShfbGVuKSwgX2tleSA9IDA7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcbiAgICAgICAgICBhcmdzW19rZXldID0gYXJndW1lbnRzW19rZXldO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsYXN0S2V5ICYmIGxhc3RLZXlbMF0gPT09IGFyZ3NbMF0gJiYgIW9wdGlvbnMuY29udGV4dCkge1xuICAgICAgICAgIF90aGlzLmxvZ2dlci53YXJuKGBJdCBzZWVtcyB5b3UgYXJlIG5lc3RpbmcgcmVjdXJzaXZlbHkga2V5OiAke2FyZ3NbMF19IGluIGtleTogJHtrZXlbMF19YCk7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF90aGlzLnRyYW5zbGF0ZSguLi5hcmdzLCBrZXkpO1xuICAgICAgfSwgb3B0aW9ucyk7XG4gICAgICBpZiAob3B0aW9ucy5pbnRlcnBvbGF0aW9uKSB0aGlzLmludGVycG9sYXRvci5yZXNldCgpO1xuICAgIH1cbiAgICBjb25zdCBwb3N0UHJvY2VzcyA9IG9wdGlvbnMucG9zdFByb2Nlc3MgfHwgdGhpcy5vcHRpb25zLnBvc3RQcm9jZXNzO1xuICAgIGNvbnN0IHBvc3RQcm9jZXNzb3JOYW1lcyA9IHR5cGVvZiBwb3N0UHJvY2VzcyA9PT0gJ3N0cmluZycgPyBbcG9zdFByb2Nlc3NdIDogcG9zdFByb2Nlc3M7XG4gICAgaWYgKHJlcyAhPT0gdW5kZWZpbmVkICYmIHJlcyAhPT0gbnVsbCAmJiBwb3N0UHJvY2Vzc29yTmFtZXMgJiYgcG9zdFByb2Nlc3Nvck5hbWVzLmxlbmd0aCAmJiBvcHRpb25zLmFwcGx5UG9zdFByb2Nlc3NvciAhPT0gZmFsc2UpIHtcbiAgICAgIHJlcyA9IHBvc3RQcm9jZXNzb3IuaGFuZGxlKHBvc3RQcm9jZXNzb3JOYW1lcywgcmVzLCBrZXksIHRoaXMub3B0aW9ucyAmJiB0aGlzLm9wdGlvbnMucG9zdFByb2Nlc3NQYXNzUmVzb2x2ZWQgPyB7XG4gICAgICAgIGkxOG5SZXNvbHZlZDoge1xuICAgICAgICAgIC4uLnJlc29sdmVkLFxuICAgICAgICAgIHVzZWRQYXJhbXM6IHRoaXMuZ2V0VXNlZFBhcmFtc0RldGFpbHMob3B0aW9ucylcbiAgICAgICAgfSxcbiAgICAgICAgLi4ub3B0aW9uc1xuICAgICAgfSA6IG9wdGlvbnMsIHRoaXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xuICB9XG4gIHJlc29sdmUoa2V5cykge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB7fTtcbiAgICBsZXQgZm91bmQ7XG4gICAgbGV0IHVzZWRLZXk7XG4gICAgbGV0IGV4YWN0VXNlZEtleTtcbiAgICBsZXQgdXNlZExuZztcbiAgICBsZXQgdXNlZE5TO1xuICAgIGlmICh0eXBlb2Yga2V5cyA9PT0gJ3N0cmluZycpIGtleXMgPSBba2V5c107XG4gICAga2V5cy5mb3JFYWNoKGsgPT4ge1xuICAgICAgaWYgKHRoaXMuaXNWYWxpZExvb2t1cChmb3VuZCkpIHJldHVybjtcbiAgICAgIGNvbnN0IGV4dHJhY3RlZCA9IHRoaXMuZXh0cmFjdEZyb21LZXkoaywgb3B0aW9ucyk7XG4gICAgICBjb25zdCBrZXkgPSBleHRyYWN0ZWQua2V5O1xuICAgICAgdXNlZEtleSA9IGtleTtcbiAgICAgIGxldCBuYW1lc3BhY2VzID0gZXh0cmFjdGVkLm5hbWVzcGFjZXM7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmZhbGxiYWNrTlMpIG5hbWVzcGFjZXMgPSBuYW1lc3BhY2VzLmNvbmNhdCh0aGlzLm9wdGlvbnMuZmFsbGJhY2tOUyk7XG4gICAgICBjb25zdCBuZWVkc1BsdXJhbEhhbmRsaW5nID0gb3B0aW9ucy5jb3VudCAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBvcHRpb25zLmNvdW50ICE9PSAnc3RyaW5nJztcbiAgICAgIGNvbnN0IG5lZWRzWmVyb1N1ZmZpeExvb2t1cCA9IG5lZWRzUGx1cmFsSGFuZGxpbmcgJiYgIW9wdGlvbnMub3JkaW5hbCAmJiBvcHRpb25zLmNvdW50ID09PSAwICYmIHRoaXMucGx1cmFsUmVzb2x2ZXIuc2hvdWxkVXNlSW50bEFwaSgpO1xuICAgICAgY29uc3QgbmVlZHNDb250ZXh0SGFuZGxpbmcgPSBvcHRpb25zLmNvbnRleHQgIT09IHVuZGVmaW5lZCAmJiAodHlwZW9mIG9wdGlvbnMuY29udGV4dCA9PT0gJ3N0cmluZycgfHwgdHlwZW9mIG9wdGlvbnMuY29udGV4dCA9PT0gJ251bWJlcicpICYmIG9wdGlvbnMuY29udGV4dCAhPT0gJyc7XG4gICAgICBjb25zdCBjb2RlcyA9IG9wdGlvbnMubG5ncyA/IG9wdGlvbnMubG5ncyA6IHRoaXMubGFuZ3VhZ2VVdGlscy50b1Jlc29sdmVIaWVyYXJjaHkob3B0aW9ucy5sbmcgfHwgdGhpcy5sYW5ndWFnZSwgb3B0aW9ucy5mYWxsYmFja0xuZyk7XG4gICAgICBuYW1lc3BhY2VzLmZvckVhY2gobnMgPT4ge1xuICAgICAgICBpZiAodGhpcy5pc1ZhbGlkTG9va3VwKGZvdW5kKSkgcmV0dXJuO1xuICAgICAgICB1c2VkTlMgPSBucztcbiAgICAgICAgaWYgKCFjaGVja2VkTG9hZGVkRm9yW2Ake2NvZGVzWzBdfS0ke25zfWBdICYmIHRoaXMudXRpbHMgJiYgdGhpcy51dGlscy5oYXNMb2FkZWROYW1lc3BhY2UgJiYgIXRoaXMudXRpbHMuaGFzTG9hZGVkTmFtZXNwYWNlKHVzZWROUykpIHtcbiAgICAgICAgICBjaGVja2VkTG9hZGVkRm9yW2Ake2NvZGVzWzBdfS0ke25zfWBdID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLmxvZ2dlci53YXJuKGBrZXkgXCIke3VzZWRLZXl9XCIgZm9yIGxhbmd1YWdlcyBcIiR7Y29kZXMuam9pbignLCAnKX1cIiB3b24ndCBnZXQgcmVzb2x2ZWQgYXMgbmFtZXNwYWNlIFwiJHt1c2VkTlN9XCIgd2FzIG5vdCB5ZXQgbG9hZGVkYCwgJ1RoaXMgbWVhbnMgc29tZXRoaW5nIElTIFdST05HIGluIHlvdXIgc2V0dXAuIFlvdSBhY2Nlc3MgdGhlIHQgZnVuY3Rpb24gYmVmb3JlIGkxOG5leHQuaW5pdCAvIGkxOG5leHQubG9hZE5hbWVzcGFjZSAvIGkxOG5leHQuY2hhbmdlTGFuZ3VhZ2Ugd2FzIGRvbmUuIFdhaXQgZm9yIHRoZSBjYWxsYmFjayBvciBQcm9taXNlIHRvIHJlc29sdmUgYmVmb3JlIGFjY2Vzc2luZyBpdCEhIScpO1xuICAgICAgICB9XG4gICAgICAgIGNvZGVzLmZvckVhY2goY29kZSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMuaXNWYWxpZExvb2t1cChmb3VuZCkpIHJldHVybjtcbiAgICAgICAgICB1c2VkTG5nID0gY29kZTtcbiAgICAgICAgICBjb25zdCBmaW5hbEtleXMgPSBba2V5XTtcbiAgICAgICAgICBpZiAodGhpcy5pMThuRm9ybWF0ICYmIHRoaXMuaTE4bkZvcm1hdC5hZGRMb29rdXBLZXlzKSB7XG4gICAgICAgICAgICB0aGlzLmkxOG5Gb3JtYXQuYWRkTG9va3VwS2V5cyhmaW5hbEtleXMsIGtleSwgY29kZSwgbnMsIG9wdGlvbnMpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZXQgcGx1cmFsU3VmZml4O1xuICAgICAgICAgICAgaWYgKG5lZWRzUGx1cmFsSGFuZGxpbmcpIHBsdXJhbFN1ZmZpeCA9IHRoaXMucGx1cmFsUmVzb2x2ZXIuZ2V0U3VmZml4KGNvZGUsIG9wdGlvbnMuY291bnQsIG9wdGlvbnMpO1xuICAgICAgICAgICAgY29uc3QgemVyb1N1ZmZpeCA9IGAke3RoaXMub3B0aW9ucy5wbHVyYWxTZXBhcmF0b3J9emVyb2A7XG4gICAgICAgICAgICBjb25zdCBvcmRpbmFsUHJlZml4ID0gYCR7dGhpcy5vcHRpb25zLnBsdXJhbFNlcGFyYXRvcn1vcmRpbmFsJHt0aGlzLm9wdGlvbnMucGx1cmFsU2VwYXJhdG9yfWA7XG4gICAgICAgICAgICBpZiAobmVlZHNQbHVyYWxIYW5kbGluZykge1xuICAgICAgICAgICAgICBmaW5hbEtleXMucHVzaChrZXkgKyBwbHVyYWxTdWZmaXgpO1xuICAgICAgICAgICAgICBpZiAob3B0aW9ucy5vcmRpbmFsICYmIHBsdXJhbFN1ZmZpeC5pbmRleE9mKG9yZGluYWxQcmVmaXgpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgZmluYWxLZXlzLnB1c2goa2V5ICsgcGx1cmFsU3VmZml4LnJlcGxhY2Uob3JkaW5hbFByZWZpeCwgdGhpcy5vcHRpb25zLnBsdXJhbFNlcGFyYXRvcikpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChuZWVkc1plcm9TdWZmaXhMb29rdXApIHtcbiAgICAgICAgICAgICAgICBmaW5hbEtleXMucHVzaChrZXkgKyB6ZXJvU3VmZml4KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5lZWRzQ29udGV4dEhhbmRsaW5nKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGNvbnRleHRLZXkgPSBgJHtrZXl9JHt0aGlzLm9wdGlvbnMuY29udGV4dFNlcGFyYXRvcn0ke29wdGlvbnMuY29udGV4dH1gO1xuICAgICAgICAgICAgICBmaW5hbEtleXMucHVzaChjb250ZXh0S2V5KTtcbiAgICAgICAgICAgICAgaWYgKG5lZWRzUGx1cmFsSGFuZGxpbmcpIHtcbiAgICAgICAgICAgICAgICBmaW5hbEtleXMucHVzaChjb250ZXh0S2V5ICsgcGx1cmFsU3VmZml4KTtcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5vcmRpbmFsICYmIHBsdXJhbFN1ZmZpeC5pbmRleE9mKG9yZGluYWxQcmVmaXgpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICBmaW5hbEtleXMucHVzaChjb250ZXh0S2V5ICsgcGx1cmFsU3VmZml4LnJlcGxhY2Uob3JkaW5hbFByZWZpeCwgdGhpcy5vcHRpb25zLnBsdXJhbFNlcGFyYXRvcikpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobmVlZHNaZXJvU3VmZml4TG9va3VwKSB7XG4gICAgICAgICAgICAgICAgICBmaW5hbEtleXMucHVzaChjb250ZXh0S2V5ICsgemVyb1N1ZmZpeCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGxldCBwb3NzaWJsZUtleTtcbiAgICAgICAgICB3aGlsZSAocG9zc2libGVLZXkgPSBmaW5hbEtleXMucG9wKCkpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5pc1ZhbGlkTG9va3VwKGZvdW5kKSkge1xuICAgICAgICAgICAgICBleGFjdFVzZWRLZXkgPSBwb3NzaWJsZUtleTtcbiAgICAgICAgICAgICAgZm91bmQgPSB0aGlzLmdldFJlc291cmNlKGNvZGUsIG5zLCBwb3NzaWJsZUtleSwgb3B0aW9ucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiB7XG4gICAgICByZXM6IGZvdW5kLFxuICAgICAgdXNlZEtleSxcbiAgICAgIGV4YWN0VXNlZEtleSxcbiAgICAgIHVzZWRMbmcsXG4gICAgICB1c2VkTlNcbiAgICB9O1xuICB9XG4gIGlzVmFsaWRMb29rdXAocmVzKSB7XG4gICAgcmV0dXJuIHJlcyAhPT0gdW5kZWZpbmVkICYmICEoIXRoaXMub3B0aW9ucy5yZXR1cm5OdWxsICYmIHJlcyA9PT0gbnVsbCkgJiYgISghdGhpcy5vcHRpb25zLnJldHVybkVtcHR5U3RyaW5nICYmIHJlcyA9PT0gJycpO1xuICB9XG4gIGdldFJlc291cmNlKGNvZGUsIG5zLCBrZXkpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAzICYmIGFyZ3VtZW50c1szXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzNdIDoge307XG4gICAgaWYgKHRoaXMuaTE4bkZvcm1hdCAmJiB0aGlzLmkxOG5Gb3JtYXQuZ2V0UmVzb3VyY2UpIHJldHVybiB0aGlzLmkxOG5Gb3JtYXQuZ2V0UmVzb3VyY2UoY29kZSwgbnMsIGtleSwgb3B0aW9ucyk7XG4gICAgcmV0dXJuIHRoaXMucmVzb3VyY2VTdG9yZS5nZXRSZXNvdXJjZShjb2RlLCBucywga2V5LCBvcHRpb25zKTtcbiAgfVxuICBnZXRVc2VkUGFyYW1zRGV0YWlscygpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDoge307XG4gICAgY29uc3Qgb3B0aW9uc0tleXMgPSBbJ2RlZmF1bHRWYWx1ZScsICdvcmRpbmFsJywgJ2NvbnRleHQnLCAncmVwbGFjZScsICdsbmcnLCAnbG5ncycsICdmYWxsYmFja0xuZycsICducycsICdrZXlTZXBhcmF0b3InLCAnbnNTZXBhcmF0b3InLCAncmV0dXJuT2JqZWN0cycsICdyZXR1cm5EZXRhaWxzJywgJ2pvaW5BcnJheXMnLCAncG9zdFByb2Nlc3MnLCAnaW50ZXJwb2xhdGlvbiddO1xuICAgIGNvbnN0IHVzZU9wdGlvbnNSZXBsYWNlRm9yRGF0YSA9IG9wdGlvbnMucmVwbGFjZSAmJiB0eXBlb2Ygb3B0aW9ucy5yZXBsYWNlICE9PSAnc3RyaW5nJztcbiAgICBsZXQgZGF0YSA9IHVzZU9wdGlvbnNSZXBsYWNlRm9yRGF0YSA/IG9wdGlvbnMucmVwbGFjZSA6IG9wdGlvbnM7XG4gICAgaWYgKHVzZU9wdGlvbnNSZXBsYWNlRm9yRGF0YSAmJiB0eXBlb2Ygb3B0aW9ucy5jb3VudCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGRhdGEuY291bnQgPSBvcHRpb25zLmNvdW50O1xuICAgIH1cbiAgICBpZiAodGhpcy5vcHRpb25zLmludGVycG9sYXRpb24uZGVmYXVsdFZhcmlhYmxlcykge1xuICAgICAgZGF0YSA9IHtcbiAgICAgICAgLi4udGhpcy5vcHRpb25zLmludGVycG9sYXRpb24uZGVmYXVsdFZhcmlhYmxlcyxcbiAgICAgICAgLi4uZGF0YVxuICAgICAgfTtcbiAgICB9XG4gICAgaWYgKCF1c2VPcHRpb25zUmVwbGFjZUZvckRhdGEpIHtcbiAgICAgIGRhdGEgPSB7XG4gICAgICAgIC4uLmRhdGFcbiAgICAgIH07XG4gICAgICBmb3IgKGNvbnN0IGtleSBvZiBvcHRpb25zS2V5cykge1xuICAgICAgICBkZWxldGUgZGF0YVtrZXldO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZGF0YTtcbiAgfVxuICBzdGF0aWMgaGFzRGVmYXVsdFZhbHVlKG9wdGlvbnMpIHtcbiAgICBjb25zdCBwcmVmaXggPSAnZGVmYXVsdFZhbHVlJztcbiAgICBmb3IgKGNvbnN0IG9wdGlvbiBpbiBvcHRpb25zKSB7XG4gICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9wdGlvbnMsIG9wdGlvbikgJiYgcHJlZml4ID09PSBvcHRpb24uc3Vic3RyaW5nKDAsIHByZWZpeC5sZW5ndGgpICYmIHVuZGVmaW5lZCAhPT0gb3B0aW9uc1tvcHRpb25dKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuY29uc3QgY2FwaXRhbGl6ZSA9IHN0cmluZyA9PiBzdHJpbmcuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHJpbmcuc2xpY2UoMSk7XG5jbGFzcyBMYW5ndWFnZVV0aWwge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLnN1cHBvcnRlZExuZ3MgPSB0aGlzLm9wdGlvbnMuc3VwcG9ydGVkTG5ncyB8fCBmYWxzZTtcbiAgICB0aGlzLmxvZ2dlciA9IGJhc2VMb2dnZXIuY3JlYXRlKCdsYW5ndWFnZVV0aWxzJyk7XG4gIH1cbiAgZ2V0U2NyaXB0UGFydEZyb21Db2RlKGNvZGUpIHtcbiAgICBjb2RlID0gZ2V0Q2xlYW5lZENvZGUoY29kZSk7XG4gICAgaWYgKCFjb2RlIHx8IGNvZGUuaW5kZXhPZignLScpIDwgMCkgcmV0dXJuIG51bGw7XG4gICAgY29uc3QgcCA9IGNvZGUuc3BsaXQoJy0nKTtcbiAgICBpZiAocC5sZW5ndGggPT09IDIpIHJldHVybiBudWxsO1xuICAgIHAucG9wKCk7XG4gICAgaWYgKHBbcC5sZW5ndGggLSAxXS50b0xvd2VyQ2FzZSgpID09PSAneCcpIHJldHVybiBudWxsO1xuICAgIHJldHVybiB0aGlzLmZvcm1hdExhbmd1YWdlQ29kZShwLmpvaW4oJy0nKSk7XG4gIH1cbiAgZ2V0TGFuZ3VhZ2VQYXJ0RnJvbUNvZGUoY29kZSkge1xuICAgIGNvZGUgPSBnZXRDbGVhbmVkQ29kZShjb2RlKTtcbiAgICBpZiAoIWNvZGUgfHwgY29kZS5pbmRleE9mKCctJykgPCAwKSByZXR1cm4gY29kZTtcbiAgICBjb25zdCBwID0gY29kZS5zcGxpdCgnLScpO1xuICAgIHJldHVybiB0aGlzLmZvcm1hdExhbmd1YWdlQ29kZShwWzBdKTtcbiAgfVxuICBmb3JtYXRMYW5ndWFnZUNvZGUoY29kZSkge1xuICAgIGlmICh0eXBlb2YgY29kZSA9PT0gJ3N0cmluZycgJiYgY29kZS5pbmRleE9mKCctJykgPiAtMSkge1xuICAgICAgY29uc3Qgc3BlY2lhbENhc2VzID0gWydoYW5zJywgJ2hhbnQnLCAnbGF0bicsICdjeXJsJywgJ2NhbnMnLCAnbW9uZycsICdhcmFiJ107XG4gICAgICBsZXQgcCA9IGNvZGUuc3BsaXQoJy0nKTtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMubG93ZXJDYXNlTG5nKSB7XG4gICAgICAgIHAgPSBwLm1hcChwYXJ0ID0+IHBhcnQudG9Mb3dlckNhc2UoKSk7XG4gICAgICB9IGVsc2UgaWYgKHAubGVuZ3RoID09PSAyKSB7XG4gICAgICAgIHBbMF0gPSBwWzBdLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIHBbMV0gPSBwWzFdLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgIGlmIChzcGVjaWFsQ2FzZXMuaW5kZXhPZihwWzFdLnRvTG93ZXJDYXNlKCkpID4gLTEpIHBbMV0gPSBjYXBpdGFsaXplKHBbMV0udG9Mb3dlckNhc2UoKSk7XG4gICAgICB9IGVsc2UgaWYgKHAubGVuZ3RoID09PSAzKSB7XG4gICAgICAgIHBbMF0gPSBwWzBdLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGlmIChwWzFdLmxlbmd0aCA9PT0gMikgcFsxXSA9IHBbMV0udG9VcHBlckNhc2UoKTtcbiAgICAgICAgaWYgKHBbMF0gIT09ICdzZ24nICYmIHBbMl0ubGVuZ3RoID09PSAyKSBwWzJdID0gcFsyXS50b1VwcGVyQ2FzZSgpO1xuICAgICAgICBpZiAoc3BlY2lhbENhc2VzLmluZGV4T2YocFsxXS50b0xvd2VyQ2FzZSgpKSA+IC0xKSBwWzFdID0gY2FwaXRhbGl6ZShwWzFdLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgICBpZiAoc3BlY2lhbENhc2VzLmluZGV4T2YocFsyXS50b0xvd2VyQ2FzZSgpKSA+IC0xKSBwWzJdID0gY2FwaXRhbGl6ZShwWzJdLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHAuam9pbignLScpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLmNsZWFuQ29kZSB8fCB0aGlzLm9wdGlvbnMubG93ZXJDYXNlTG5nID8gY29kZS50b0xvd2VyQ2FzZSgpIDogY29kZTtcbiAgfVxuICBpc1N1cHBvcnRlZENvZGUoY29kZSkge1xuICAgIGlmICh0aGlzLm9wdGlvbnMubG9hZCA9PT0gJ2xhbmd1YWdlT25seScgfHwgdGhpcy5vcHRpb25zLm5vbkV4cGxpY2l0U3VwcG9ydGVkTG5ncykge1xuICAgICAgY29kZSA9IHRoaXMuZ2V0TGFuZ3VhZ2VQYXJ0RnJvbUNvZGUoY29kZSk7XG4gICAgfVxuICAgIHJldHVybiAhdGhpcy5zdXBwb3J0ZWRMbmdzIHx8ICF0aGlzLnN1cHBvcnRlZExuZ3MubGVuZ3RoIHx8IHRoaXMuc3VwcG9ydGVkTG5ncy5pbmRleE9mKGNvZGUpID4gLTE7XG4gIH1cbiAgZ2V0QmVzdE1hdGNoRnJvbUNvZGVzKGNvZGVzKSB7XG4gICAgaWYgKCFjb2RlcykgcmV0dXJuIG51bGw7XG4gICAgbGV0IGZvdW5kO1xuICAgIGNvZGVzLmZvckVhY2goY29kZSA9PiB7XG4gICAgICBpZiAoZm91bmQpIHJldHVybjtcbiAgICAgIGNvbnN0IGNsZWFuZWRMbmcgPSB0aGlzLmZvcm1hdExhbmd1YWdlQ29kZShjb2RlKTtcbiAgICAgIGlmICghdGhpcy5vcHRpb25zLnN1cHBvcnRlZExuZ3MgfHwgdGhpcy5pc1N1cHBvcnRlZENvZGUoY2xlYW5lZExuZykpIGZvdW5kID0gY2xlYW5lZExuZztcbiAgICB9KTtcbiAgICBpZiAoIWZvdW5kICYmIHRoaXMub3B0aW9ucy5zdXBwb3J0ZWRMbmdzKSB7XG4gICAgICBjb2Rlcy5mb3JFYWNoKGNvZGUgPT4ge1xuICAgICAgICBpZiAoZm91bmQpIHJldHVybjtcbiAgICAgICAgY29uc3QgbG5nT25seSA9IHRoaXMuZ2V0TGFuZ3VhZ2VQYXJ0RnJvbUNvZGUoY29kZSk7XG4gICAgICAgIGlmICh0aGlzLmlzU3VwcG9ydGVkQ29kZShsbmdPbmx5KSkgcmV0dXJuIGZvdW5kID0gbG5nT25seTtcbiAgICAgICAgZm91bmQgPSB0aGlzLm9wdGlvbnMuc3VwcG9ydGVkTG5ncy5maW5kKHN1cHBvcnRlZExuZyA9PiB7XG4gICAgICAgICAgaWYgKHN1cHBvcnRlZExuZyA9PT0gbG5nT25seSkgcmV0dXJuIHN1cHBvcnRlZExuZztcbiAgICAgICAgICBpZiAoc3VwcG9ydGVkTG5nLmluZGV4T2YoJy0nKSA8IDAgJiYgbG5nT25seS5pbmRleE9mKCctJykgPCAwKSByZXR1cm47XG4gICAgICAgICAgaWYgKHN1cHBvcnRlZExuZy5pbmRleE9mKCctJykgPiAwICYmIGxuZ09ubHkuaW5kZXhPZignLScpIDwgMCAmJiBzdXBwb3J0ZWRMbmcuc3Vic3RyaW5nKDAsIHN1cHBvcnRlZExuZy5pbmRleE9mKCctJykpID09PSBsbmdPbmx5KSByZXR1cm4gc3VwcG9ydGVkTG5nO1xuICAgICAgICAgIGlmIChzdXBwb3J0ZWRMbmcuaW5kZXhPZihsbmdPbmx5KSA9PT0gMCAmJiBsbmdPbmx5Lmxlbmd0aCA+IDEpIHJldHVybiBzdXBwb3J0ZWRMbmc7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGlmICghZm91bmQpIGZvdW5kID0gdGhpcy5nZXRGYWxsYmFja0NvZGVzKHRoaXMub3B0aW9ucy5mYWxsYmFja0xuZylbMF07XG4gICAgcmV0dXJuIGZvdW5kO1xuICB9XG4gIGdldEZhbGxiYWNrQ29kZXMoZmFsbGJhY2tzLCBjb2RlKSB7XG4gICAgaWYgKCFmYWxsYmFja3MpIHJldHVybiBbXTtcbiAgICBpZiAodHlwZW9mIGZhbGxiYWNrcyA9PT0gJ2Z1bmN0aW9uJykgZmFsbGJhY2tzID0gZmFsbGJhY2tzKGNvZGUpO1xuICAgIGlmICh0eXBlb2YgZmFsbGJhY2tzID09PSAnc3RyaW5nJykgZmFsbGJhY2tzID0gW2ZhbGxiYWNrc107XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZmFsbGJhY2tzKSkgcmV0dXJuIGZhbGxiYWNrcztcbiAgICBpZiAoIWNvZGUpIHJldHVybiBmYWxsYmFja3MuZGVmYXVsdCB8fCBbXTtcbiAgICBsZXQgZm91bmQgPSBmYWxsYmFja3NbY29kZV07XG4gICAgaWYgKCFmb3VuZCkgZm91bmQgPSBmYWxsYmFja3NbdGhpcy5nZXRTY3JpcHRQYXJ0RnJvbUNvZGUoY29kZSldO1xuICAgIGlmICghZm91bmQpIGZvdW5kID0gZmFsbGJhY2tzW3RoaXMuZm9ybWF0TGFuZ3VhZ2VDb2RlKGNvZGUpXTtcbiAgICBpZiAoIWZvdW5kKSBmb3VuZCA9IGZhbGxiYWNrc1t0aGlzLmdldExhbmd1YWdlUGFydEZyb21Db2RlKGNvZGUpXTtcbiAgICBpZiAoIWZvdW5kKSBmb3VuZCA9IGZhbGxiYWNrcy5kZWZhdWx0O1xuICAgIHJldHVybiBmb3VuZCB8fCBbXTtcbiAgfVxuICB0b1Jlc29sdmVIaWVyYXJjaHkoY29kZSwgZmFsbGJhY2tDb2RlKSB7XG4gICAgY29uc3QgZmFsbGJhY2tDb2RlcyA9IHRoaXMuZ2V0RmFsbGJhY2tDb2RlcyhmYWxsYmFja0NvZGUgfHwgdGhpcy5vcHRpb25zLmZhbGxiYWNrTG5nIHx8IFtdLCBjb2RlKTtcbiAgICBjb25zdCBjb2RlcyA9IFtdO1xuICAgIGNvbnN0IGFkZENvZGUgPSBjID0+IHtcbiAgICAgIGlmICghYykgcmV0dXJuO1xuICAgICAgaWYgKHRoaXMuaXNTdXBwb3J0ZWRDb2RlKGMpKSB7XG4gICAgICAgIGNvZGVzLnB1c2goYyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmxvZ2dlci53YXJuKGByZWplY3RpbmcgbGFuZ3VhZ2UgY29kZSBub3QgZm91bmQgaW4gc3VwcG9ydGVkTG5nczogJHtjfWApO1xuICAgICAgfVxuICAgIH07XG4gICAgaWYgKHR5cGVvZiBjb2RlID09PSAnc3RyaW5nJyAmJiAoY29kZS5pbmRleE9mKCctJykgPiAtMSB8fCBjb2RlLmluZGV4T2YoJ18nKSA+IC0xKSkge1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5sb2FkICE9PSAnbGFuZ3VhZ2VPbmx5JykgYWRkQ29kZSh0aGlzLmZvcm1hdExhbmd1YWdlQ29kZShjb2RlKSk7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmxvYWQgIT09ICdsYW5ndWFnZU9ubHknICYmIHRoaXMub3B0aW9ucy5sb2FkICE9PSAnY3VycmVudE9ubHknKSBhZGRDb2RlKHRoaXMuZ2V0U2NyaXB0UGFydEZyb21Db2RlKGNvZGUpKTtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMubG9hZCAhPT0gJ2N1cnJlbnRPbmx5JykgYWRkQ29kZSh0aGlzLmdldExhbmd1YWdlUGFydEZyb21Db2RlKGNvZGUpKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBjb2RlID09PSAnc3RyaW5nJykge1xuICAgICAgYWRkQ29kZSh0aGlzLmZvcm1hdExhbmd1YWdlQ29kZShjb2RlKSk7XG4gICAgfVxuICAgIGZhbGxiYWNrQ29kZXMuZm9yRWFjaChmYyA9PiB7XG4gICAgICBpZiAoY29kZXMuaW5kZXhPZihmYykgPCAwKSBhZGRDb2RlKHRoaXMuZm9ybWF0TGFuZ3VhZ2VDb2RlKGZjKSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGNvZGVzO1xuICB9XG59XG5cbmxldCBzZXRzID0gW3tcbiAgbG5nczogWydhY2gnLCAnYWsnLCAnYW0nLCAnYXJuJywgJ2JyJywgJ2ZpbCcsICdndW4nLCAnbG4nLCAnbWZlJywgJ21nJywgJ21pJywgJ29jJywgJ3B0JywgJ3B0LUJSJywgJ3RnJywgJ3RsJywgJ3RpJywgJ3RyJywgJ3V6JywgJ3dhJ10sXG4gIG5yOiBbMSwgMl0sXG4gIGZjOiAxXG59LCB7XG4gIGxuZ3M6IFsnYWYnLCAnYW4nLCAnYXN0JywgJ2F6JywgJ2JnJywgJ2JuJywgJ2NhJywgJ2RhJywgJ2RlJywgJ2RldicsICdlbCcsICdlbicsICdlbycsICdlcycsICdldCcsICdldScsICdmaScsICdmbycsICdmdXInLCAnZnknLCAnZ2wnLCAnZ3UnLCAnaGEnLCAnaGknLCAnaHUnLCAnaHknLCAnaWEnLCAnaXQnLCAna2snLCAna24nLCAna3UnLCAnbGInLCAnbWFpJywgJ21sJywgJ21uJywgJ21yJywgJ25haCcsICduYXAnLCAnbmInLCAnbmUnLCAnbmwnLCAnbm4nLCAnbm8nLCAnbnNvJywgJ3BhJywgJ3BhcCcsICdwbXMnLCAncHMnLCAncHQtUFQnLCAncm0nLCAnc2NvJywgJ3NlJywgJ3NpJywgJ3NvJywgJ3NvbicsICdzcScsICdzdicsICdzdycsICd0YScsICd0ZScsICd0aycsICd1cicsICd5byddLFxuICBucjogWzEsIDJdLFxuICBmYzogMlxufSwge1xuICBsbmdzOiBbJ2F5JywgJ2JvJywgJ2NnZycsICdmYScsICdodCcsICdpZCcsICdqYScsICdqYm8nLCAna2EnLCAna20nLCAna28nLCAna3knLCAnbG8nLCAnbXMnLCAnc2FoJywgJ3N1JywgJ3RoJywgJ3R0JywgJ3VnJywgJ3ZpJywgJ3dvJywgJ3poJ10sXG4gIG5yOiBbMV0sXG4gIGZjOiAzXG59LCB7XG4gIGxuZ3M6IFsnYmUnLCAnYnMnLCAnY25yJywgJ2R6JywgJ2hyJywgJ3J1JywgJ3NyJywgJ3VrJ10sXG4gIG5yOiBbMSwgMiwgNV0sXG4gIGZjOiA0XG59LCB7XG4gIGxuZ3M6IFsnYXInXSxcbiAgbnI6IFswLCAxLCAyLCAzLCAxMSwgMTAwXSxcbiAgZmM6IDVcbn0sIHtcbiAgbG5nczogWydjcycsICdzayddLFxuICBucjogWzEsIDIsIDVdLFxuICBmYzogNlxufSwge1xuICBsbmdzOiBbJ2NzYicsICdwbCddLFxuICBucjogWzEsIDIsIDVdLFxuICBmYzogN1xufSwge1xuICBsbmdzOiBbJ2N5J10sXG4gIG5yOiBbMSwgMiwgMywgOF0sXG4gIGZjOiA4XG59LCB7XG4gIGxuZ3M6IFsnZnInXSxcbiAgbnI6IFsxLCAyXSxcbiAgZmM6IDlcbn0sIHtcbiAgbG5nczogWydnYSddLFxuICBucjogWzEsIDIsIDMsIDcsIDExXSxcbiAgZmM6IDEwXG59LCB7XG4gIGxuZ3M6IFsnZ2QnXSxcbiAgbnI6IFsxLCAyLCAzLCAyMF0sXG4gIGZjOiAxMVxufSwge1xuICBsbmdzOiBbJ2lzJ10sXG4gIG5yOiBbMSwgMl0sXG4gIGZjOiAxMlxufSwge1xuICBsbmdzOiBbJ2p2J10sXG4gIG5yOiBbMCwgMV0sXG4gIGZjOiAxM1xufSwge1xuICBsbmdzOiBbJ2t3J10sXG4gIG5yOiBbMSwgMiwgMywgNF0sXG4gIGZjOiAxNFxufSwge1xuICBsbmdzOiBbJ2x0J10sXG4gIG5yOiBbMSwgMiwgMTBdLFxuICBmYzogMTVcbn0sIHtcbiAgbG5nczogWydsdiddLFxuICBucjogWzEsIDIsIDBdLFxuICBmYzogMTZcbn0sIHtcbiAgbG5nczogWydtayddLFxuICBucjogWzEsIDJdLFxuICBmYzogMTdcbn0sIHtcbiAgbG5nczogWydtbmsnXSxcbiAgbnI6IFswLCAxLCAyXSxcbiAgZmM6IDE4XG59LCB7XG4gIGxuZ3M6IFsnbXQnXSxcbiAgbnI6IFsxLCAyLCAxMSwgMjBdLFxuICBmYzogMTlcbn0sIHtcbiAgbG5nczogWydvciddLFxuICBucjogWzIsIDFdLFxuICBmYzogMlxufSwge1xuICBsbmdzOiBbJ3JvJ10sXG4gIG5yOiBbMSwgMiwgMjBdLFxuICBmYzogMjBcbn0sIHtcbiAgbG5nczogWydzbCddLFxuICBucjogWzUsIDEsIDIsIDNdLFxuICBmYzogMjFcbn0sIHtcbiAgbG5nczogWydoZScsICdpdyddLFxuICBucjogWzEsIDIsIDIwLCAyMV0sXG4gIGZjOiAyMlxufV07XG5sZXQgX3J1bGVzUGx1cmFsc1R5cGVzID0ge1xuICAxOiBuID0+IE51bWJlcihuID4gMSksXG4gIDI6IG4gPT4gTnVtYmVyKG4gIT0gMSksXG4gIDM6IG4gPT4gMCxcbiAgNDogbiA9PiBOdW1iZXIobiAlIDEwID09IDEgJiYgbiAlIDEwMCAhPSAxMSA/IDAgOiBuICUgMTAgPj0gMiAmJiBuICUgMTAgPD0gNCAmJiAobiAlIDEwMCA8IDEwIHx8IG4gJSAxMDAgPj0gMjApID8gMSA6IDIpLFxuICA1OiBuID0+IE51bWJlcihuID09IDAgPyAwIDogbiA9PSAxID8gMSA6IG4gPT0gMiA/IDIgOiBuICUgMTAwID49IDMgJiYgbiAlIDEwMCA8PSAxMCA/IDMgOiBuICUgMTAwID49IDExID8gNCA6IDUpLFxuICA2OiBuID0+IE51bWJlcihuID09IDEgPyAwIDogbiA+PSAyICYmIG4gPD0gNCA/IDEgOiAyKSxcbiAgNzogbiA9PiBOdW1iZXIobiA9PSAxID8gMCA6IG4gJSAxMCA+PSAyICYmIG4gJSAxMCA8PSA0ICYmIChuICUgMTAwIDwgMTAgfHwgbiAlIDEwMCA+PSAyMCkgPyAxIDogMiksXG4gIDg6IG4gPT4gTnVtYmVyKG4gPT0gMSA/IDAgOiBuID09IDIgPyAxIDogbiAhPSA4ICYmIG4gIT0gMTEgPyAyIDogMyksXG4gIDk6IG4gPT4gTnVtYmVyKG4gPj0gMiksXG4gIDEwOiBuID0+IE51bWJlcihuID09IDEgPyAwIDogbiA9PSAyID8gMSA6IG4gPCA3ID8gMiA6IG4gPCAxMSA/IDMgOiA0KSxcbiAgMTE6IG4gPT4gTnVtYmVyKG4gPT0gMSB8fCBuID09IDExID8gMCA6IG4gPT0gMiB8fCBuID09IDEyID8gMSA6IG4gPiAyICYmIG4gPCAyMCA/IDIgOiAzKSxcbiAgMTI6IG4gPT4gTnVtYmVyKG4gJSAxMCAhPSAxIHx8IG4gJSAxMDAgPT0gMTEpLFxuICAxMzogbiA9PiBOdW1iZXIobiAhPT0gMCksXG4gIDE0OiBuID0+IE51bWJlcihuID09IDEgPyAwIDogbiA9PSAyID8gMSA6IG4gPT0gMyA/IDIgOiAzKSxcbiAgMTU6IG4gPT4gTnVtYmVyKG4gJSAxMCA9PSAxICYmIG4gJSAxMDAgIT0gMTEgPyAwIDogbiAlIDEwID49IDIgJiYgKG4gJSAxMDAgPCAxMCB8fCBuICUgMTAwID49IDIwKSA/IDEgOiAyKSxcbiAgMTY6IG4gPT4gTnVtYmVyKG4gJSAxMCA9PSAxICYmIG4gJSAxMDAgIT0gMTEgPyAwIDogbiAhPT0gMCA/IDEgOiAyKSxcbiAgMTc6IG4gPT4gTnVtYmVyKG4gPT0gMSB8fCBuICUgMTAgPT0gMSAmJiBuICUgMTAwICE9IDExID8gMCA6IDEpLFxuICAxODogbiA9PiBOdW1iZXIobiA9PSAwID8gMCA6IG4gPT0gMSA/IDEgOiAyKSxcbiAgMTk6IG4gPT4gTnVtYmVyKG4gPT0gMSA/IDAgOiBuID09IDAgfHwgbiAlIDEwMCA+IDEgJiYgbiAlIDEwMCA8IDExID8gMSA6IG4gJSAxMDAgPiAxMCAmJiBuICUgMTAwIDwgMjAgPyAyIDogMyksXG4gIDIwOiBuID0+IE51bWJlcihuID09IDEgPyAwIDogbiA9PSAwIHx8IG4gJSAxMDAgPiAwICYmIG4gJSAxMDAgPCAyMCA/IDEgOiAyKSxcbiAgMjE6IG4gPT4gTnVtYmVyKG4gJSAxMDAgPT0gMSA/IDEgOiBuICUgMTAwID09IDIgPyAyIDogbiAlIDEwMCA9PSAzIHx8IG4gJSAxMDAgPT0gNCA/IDMgOiAwKSxcbiAgMjI6IG4gPT4gTnVtYmVyKG4gPT0gMSA/IDAgOiBuID09IDIgPyAxIDogKG4gPCAwIHx8IG4gPiAxMCkgJiYgbiAlIDEwID09IDAgPyAyIDogMylcbn07XG5jb25zdCBub25JbnRsVmVyc2lvbnMgPSBbJ3YxJywgJ3YyJywgJ3YzJ107XG5jb25zdCBpbnRsVmVyc2lvbnMgPSBbJ3Y0J107XG5jb25zdCBzdWZmaXhlc09yZGVyID0ge1xuICB6ZXJvOiAwLFxuICBvbmU6IDEsXG4gIHR3bzogMixcbiAgZmV3OiAzLFxuICBtYW55OiA0LFxuICBvdGhlcjogNVxufTtcbmNvbnN0IGNyZWF0ZVJ1bGVzID0gKCkgPT4ge1xuICBjb25zdCBydWxlcyA9IHt9O1xuICBzZXRzLmZvckVhY2goc2V0ID0+IHtcbiAgICBzZXQubG5ncy5mb3JFYWNoKGwgPT4ge1xuICAgICAgcnVsZXNbbF0gPSB7XG4gICAgICAgIG51bWJlcnM6IHNldC5ucixcbiAgICAgICAgcGx1cmFsczogX3J1bGVzUGx1cmFsc1R5cGVzW3NldC5mY11cbiAgICAgIH07XG4gICAgfSk7XG4gIH0pO1xuICByZXR1cm4gcnVsZXM7XG59O1xuY2xhc3MgUGx1cmFsUmVzb2x2ZXIge1xuICBjb25zdHJ1Y3RvcihsYW5ndWFnZVV0aWxzKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IHt9O1xuICAgIHRoaXMubGFuZ3VhZ2VVdGlscyA9IGxhbmd1YWdlVXRpbHM7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLmxvZ2dlciA9IGJhc2VMb2dnZXIuY3JlYXRlKCdwbHVyYWxSZXNvbHZlcicpO1xuICAgIGlmICgoIXRoaXMub3B0aW9ucy5jb21wYXRpYmlsaXR5SlNPTiB8fCBpbnRsVmVyc2lvbnMuaW5jbHVkZXModGhpcy5vcHRpb25zLmNvbXBhdGliaWxpdHlKU09OKSkgJiYgKHR5cGVvZiBJbnRsID09PSAndW5kZWZpbmVkJyB8fCAhSW50bC5QbHVyYWxSdWxlcykpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5jb21wYXRpYmlsaXR5SlNPTiA9ICd2Myc7XG4gICAgICB0aGlzLmxvZ2dlci5lcnJvcignWW91ciBlbnZpcm9ubWVudCBzZWVtcyBub3QgdG8gYmUgSW50bCBBUEkgY29tcGF0aWJsZSwgdXNlIGFuIEludGwuUGx1cmFsUnVsZXMgcG9seWZpbGwuIFdpbGwgZmFsbGJhY2sgdG8gdGhlIGNvbXBhdGliaWxpdHlKU09OIHYzIGZvcm1hdCBoYW5kbGluZy4nKTtcbiAgICB9XG4gICAgdGhpcy5ydWxlcyA9IGNyZWF0ZVJ1bGVzKCk7XG4gIH1cbiAgYWRkUnVsZShsbmcsIG9iaikge1xuICAgIHRoaXMucnVsZXNbbG5nXSA9IG9iajtcbiAgfVxuICBnZXRSdWxlKGNvZGUpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge307XG4gICAgaWYgKHRoaXMuc2hvdWxkVXNlSW50bEFwaSgpKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gbmV3IEludGwuUGx1cmFsUnVsZXMoZ2V0Q2xlYW5lZENvZGUoY29kZSA9PT0gJ2RldicgPyAnZW4nIDogY29kZSksIHtcbiAgICAgICAgICB0eXBlOiBvcHRpb25zLm9yZGluYWwgPyAnb3JkaW5hbCcgOiAnY2FyZGluYWwnXG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXMucnVsZXNbY29kZV0gfHwgdGhpcy5ydWxlc1t0aGlzLmxhbmd1YWdlVXRpbHMuZ2V0TGFuZ3VhZ2VQYXJ0RnJvbUNvZGUoY29kZSldO1xuICB9XG4gIG5lZWRzUGx1cmFsKGNvZGUpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge307XG4gICAgY29uc3QgcnVsZSA9IHRoaXMuZ2V0UnVsZShjb2RlLCBvcHRpb25zKTtcbiAgICBpZiAodGhpcy5zaG91bGRVc2VJbnRsQXBpKCkpIHtcbiAgICAgIHJldHVybiBydWxlICYmIHJ1bGUucmVzb2x2ZWRPcHRpb25zKCkucGx1cmFsQ2F0ZWdvcmllcy5sZW5ndGggPiAxO1xuICAgIH1cbiAgICByZXR1cm4gcnVsZSAmJiBydWxlLm51bWJlcnMubGVuZ3RoID4gMTtcbiAgfVxuICBnZXRQbHVyYWxGb3Jtc09mS2V5KGNvZGUsIGtleSkge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMl0gOiB7fTtcbiAgICByZXR1cm4gdGhpcy5nZXRTdWZmaXhlcyhjb2RlLCBvcHRpb25zKS5tYXAoc3VmZml4ID0+IGAke2tleX0ke3N1ZmZpeH1gKTtcbiAgfVxuICBnZXRTdWZmaXhlcyhjb2RlKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IHt9O1xuICAgIGNvbnN0IHJ1bGUgPSB0aGlzLmdldFJ1bGUoY29kZSwgb3B0aW9ucyk7XG4gICAgaWYgKCFydWxlKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIGlmICh0aGlzLnNob3VsZFVzZUludGxBcGkoKSkge1xuICAgICAgcmV0dXJuIHJ1bGUucmVzb2x2ZWRPcHRpb25zKCkucGx1cmFsQ2F0ZWdvcmllcy5zb3J0KChwbHVyYWxDYXRlZ29yeTEsIHBsdXJhbENhdGVnb3J5MikgPT4gc3VmZml4ZXNPcmRlcltwbHVyYWxDYXRlZ29yeTFdIC0gc3VmZml4ZXNPcmRlcltwbHVyYWxDYXRlZ29yeTJdKS5tYXAocGx1cmFsQ2F0ZWdvcnkgPT4gYCR7dGhpcy5vcHRpb25zLnByZXBlbmR9JHtvcHRpb25zLm9yZGluYWwgPyBgb3JkaW5hbCR7dGhpcy5vcHRpb25zLnByZXBlbmR9YCA6ICcnfSR7cGx1cmFsQ2F0ZWdvcnl9YCk7XG4gICAgfVxuICAgIHJldHVybiBydWxlLm51bWJlcnMubWFwKG51bWJlciA9PiB0aGlzLmdldFN1ZmZpeChjb2RlLCBudW1iZXIsIG9wdGlvbnMpKTtcbiAgfVxuICBnZXRTdWZmaXgoY29kZSwgY291bnQpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzJdIDoge307XG4gICAgY29uc3QgcnVsZSA9IHRoaXMuZ2V0UnVsZShjb2RlLCBvcHRpb25zKTtcbiAgICBpZiAocnVsZSkge1xuICAgICAgaWYgKHRoaXMuc2hvdWxkVXNlSW50bEFwaSgpKSB7XG4gICAgICAgIHJldHVybiBgJHt0aGlzLm9wdGlvbnMucHJlcGVuZH0ke29wdGlvbnMub3JkaW5hbCA/IGBvcmRpbmFsJHt0aGlzLm9wdGlvbnMucHJlcGVuZH1gIDogJyd9JHtydWxlLnNlbGVjdChjb3VudCl9YDtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmdldFN1ZmZpeFJldHJvQ29tcGF0aWJsZShydWxlLCBjb3VudCk7XG4gICAgfVxuICAgIHRoaXMubG9nZ2VyLndhcm4oYG5vIHBsdXJhbCBydWxlIGZvdW5kIGZvcjogJHtjb2RlfWApO1xuICAgIHJldHVybiAnJztcbiAgfVxuICBnZXRTdWZmaXhSZXRyb0NvbXBhdGlibGUocnVsZSwgY291bnQpIHtcbiAgICBjb25zdCBpZHggPSBydWxlLm5vQWJzID8gcnVsZS5wbHVyYWxzKGNvdW50KSA6IHJ1bGUucGx1cmFscyhNYXRoLmFicyhjb3VudCkpO1xuICAgIGxldCBzdWZmaXggPSBydWxlLm51bWJlcnNbaWR4XTtcbiAgICBpZiAodGhpcy5vcHRpb25zLnNpbXBsaWZ5UGx1cmFsU3VmZml4ICYmIHJ1bGUubnVtYmVycy5sZW5ndGggPT09IDIgJiYgcnVsZS5udW1iZXJzWzBdID09PSAxKSB7XG4gICAgICBpZiAoc3VmZml4ID09PSAyKSB7XG4gICAgICAgIHN1ZmZpeCA9ICdwbHVyYWwnO1xuICAgICAgfSBlbHNlIGlmIChzdWZmaXggPT09IDEpIHtcbiAgICAgICAgc3VmZml4ID0gJyc7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IHJldHVyblN1ZmZpeCA9ICgpID0+IHRoaXMub3B0aW9ucy5wcmVwZW5kICYmIHN1ZmZpeC50b1N0cmluZygpID8gdGhpcy5vcHRpb25zLnByZXBlbmQgKyBzdWZmaXgudG9TdHJpbmcoKSA6IHN1ZmZpeC50b1N0cmluZygpO1xuICAgIGlmICh0aGlzLm9wdGlvbnMuY29tcGF0aWJpbGl0eUpTT04gPT09ICd2MScpIHtcbiAgICAgIGlmIChzdWZmaXggPT09IDEpIHJldHVybiAnJztcbiAgICAgIGlmICh0eXBlb2Ygc3VmZml4ID09PSAnbnVtYmVyJykgcmV0dXJuIGBfcGx1cmFsXyR7c3VmZml4LnRvU3RyaW5nKCl9YDtcbiAgICAgIHJldHVybiByZXR1cm5TdWZmaXgoKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5jb21wYXRpYmlsaXR5SlNPTiA9PT0gJ3YyJykge1xuICAgICAgcmV0dXJuIHJldHVyblN1ZmZpeCgpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLnNpbXBsaWZ5UGx1cmFsU3VmZml4ICYmIHJ1bGUubnVtYmVycy5sZW5ndGggPT09IDIgJiYgcnVsZS5udW1iZXJzWzBdID09PSAxKSB7XG4gICAgICByZXR1cm4gcmV0dXJuU3VmZml4KCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLm9wdGlvbnMucHJlcGVuZCAmJiBpZHgudG9TdHJpbmcoKSA/IHRoaXMub3B0aW9ucy5wcmVwZW5kICsgaWR4LnRvU3RyaW5nKCkgOiBpZHgudG9TdHJpbmcoKTtcbiAgfVxuICBzaG91bGRVc2VJbnRsQXBpKCkge1xuICAgIHJldHVybiAhbm9uSW50bFZlcnNpb25zLmluY2x1ZGVzKHRoaXMub3B0aW9ucy5jb21wYXRpYmlsaXR5SlNPTik7XG4gIH1cbn1cblxuY29uc3QgZGVlcEZpbmRXaXRoRGVmYXVsdHMgPSBmdW5jdGlvbiAoZGF0YSwgZGVmYXVsdERhdGEsIGtleSkge1xuICBsZXQga2V5U2VwYXJhdG9yID0gYXJndW1lbnRzLmxlbmd0aCA+IDMgJiYgYXJndW1lbnRzWzNdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbM10gOiAnLic7XG4gIGxldCBpZ25vcmVKU09OU3RydWN0dXJlID0gYXJndW1lbnRzLmxlbmd0aCA+IDQgJiYgYXJndW1lbnRzWzRdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbNF0gOiB0cnVlO1xuICBsZXQgcGF0aCA9IGdldFBhdGhXaXRoRGVmYXVsdHMoZGF0YSwgZGVmYXVsdERhdGEsIGtleSk7XG4gIGlmICghcGF0aCAmJiBpZ25vcmVKU09OU3RydWN0dXJlICYmIHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnKSB7XG4gICAgcGF0aCA9IGRlZXBGaW5kKGRhdGEsIGtleSwga2V5U2VwYXJhdG9yKTtcbiAgICBpZiAocGF0aCA9PT0gdW5kZWZpbmVkKSBwYXRoID0gZGVlcEZpbmQoZGVmYXVsdERhdGEsIGtleSwga2V5U2VwYXJhdG9yKTtcbiAgfVxuICByZXR1cm4gcGF0aDtcbn07XG5jb25zdCByZWdleFNhZmUgPSB2YWwgPT4gdmFsLnJlcGxhY2UoL1xcJC9nLCAnJCQkJCcpO1xuY2xhc3MgSW50ZXJwb2xhdG9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IHt9O1xuICAgIHRoaXMubG9nZ2VyID0gYmFzZUxvZ2dlci5jcmVhdGUoJ2ludGVycG9sYXRvcicpO1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy5mb3JtYXQgPSBvcHRpb25zLmludGVycG9sYXRpb24gJiYgb3B0aW9ucy5pbnRlcnBvbGF0aW9uLmZvcm1hdCB8fCAodmFsdWUgPT4gdmFsdWUpO1xuICAgIHRoaXMuaW5pdChvcHRpb25zKTtcbiAgfVxuICBpbml0KCkge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiB7fTtcbiAgICBpZiAoIW9wdGlvbnMuaW50ZXJwb2xhdGlvbikgb3B0aW9ucy5pbnRlcnBvbGF0aW9uID0ge1xuICAgICAgZXNjYXBlVmFsdWU6IHRydWVcbiAgICB9O1xuICAgIGNvbnN0IHtcbiAgICAgIGVzY2FwZTogZXNjYXBlJDEsXG4gICAgICBlc2NhcGVWYWx1ZSxcbiAgICAgIHVzZVJhd1ZhbHVlVG9Fc2NhcGUsXG4gICAgICBwcmVmaXgsXG4gICAgICBwcmVmaXhFc2NhcGVkLFxuICAgICAgc3VmZml4LFxuICAgICAgc3VmZml4RXNjYXBlZCxcbiAgICAgIGZvcm1hdFNlcGFyYXRvcixcbiAgICAgIHVuZXNjYXBlU3VmZml4LFxuICAgICAgdW5lc2NhcGVQcmVmaXgsXG4gICAgICBuZXN0aW5nUHJlZml4LFxuICAgICAgbmVzdGluZ1ByZWZpeEVzY2FwZWQsXG4gICAgICBuZXN0aW5nU3VmZml4LFxuICAgICAgbmVzdGluZ1N1ZmZpeEVzY2FwZWQsXG4gICAgICBuZXN0aW5nT3B0aW9uc1NlcGFyYXRvcixcbiAgICAgIG1heFJlcGxhY2VzLFxuICAgICAgYWx3YXlzRm9ybWF0XG4gICAgfSA9IG9wdGlvbnMuaW50ZXJwb2xhdGlvbjtcbiAgICB0aGlzLmVzY2FwZSA9IGVzY2FwZSQxICE9PSB1bmRlZmluZWQgPyBlc2NhcGUkMSA6IGVzY2FwZTtcbiAgICB0aGlzLmVzY2FwZVZhbHVlID0gZXNjYXBlVmFsdWUgIT09IHVuZGVmaW5lZCA/IGVzY2FwZVZhbHVlIDogdHJ1ZTtcbiAgICB0aGlzLnVzZVJhd1ZhbHVlVG9Fc2NhcGUgPSB1c2VSYXdWYWx1ZVRvRXNjYXBlICE9PSB1bmRlZmluZWQgPyB1c2VSYXdWYWx1ZVRvRXNjYXBlIDogZmFsc2U7XG4gICAgdGhpcy5wcmVmaXggPSBwcmVmaXggPyByZWdleEVzY2FwZShwcmVmaXgpIDogcHJlZml4RXNjYXBlZCB8fCAne3snO1xuICAgIHRoaXMuc3VmZml4ID0gc3VmZml4ID8gcmVnZXhFc2NhcGUoc3VmZml4KSA6IHN1ZmZpeEVzY2FwZWQgfHwgJ319JztcbiAgICB0aGlzLmZvcm1hdFNlcGFyYXRvciA9IGZvcm1hdFNlcGFyYXRvciB8fCAnLCc7XG4gICAgdGhpcy51bmVzY2FwZVByZWZpeCA9IHVuZXNjYXBlU3VmZml4ID8gJycgOiB1bmVzY2FwZVByZWZpeCB8fCAnLSc7XG4gICAgdGhpcy51bmVzY2FwZVN1ZmZpeCA9IHRoaXMudW5lc2NhcGVQcmVmaXggPyAnJyA6IHVuZXNjYXBlU3VmZml4IHx8ICcnO1xuICAgIHRoaXMubmVzdGluZ1ByZWZpeCA9IG5lc3RpbmdQcmVmaXggPyByZWdleEVzY2FwZShuZXN0aW5nUHJlZml4KSA6IG5lc3RpbmdQcmVmaXhFc2NhcGVkIHx8IHJlZ2V4RXNjYXBlKCckdCgnKTtcbiAgICB0aGlzLm5lc3RpbmdTdWZmaXggPSBuZXN0aW5nU3VmZml4ID8gcmVnZXhFc2NhcGUobmVzdGluZ1N1ZmZpeCkgOiBuZXN0aW5nU3VmZml4RXNjYXBlZCB8fCByZWdleEVzY2FwZSgnKScpO1xuICAgIHRoaXMubmVzdGluZ09wdGlvbnNTZXBhcmF0b3IgPSBuZXN0aW5nT3B0aW9uc1NlcGFyYXRvciB8fCAnLCc7XG4gICAgdGhpcy5tYXhSZXBsYWNlcyA9IG1heFJlcGxhY2VzIHx8IDEwMDA7XG4gICAgdGhpcy5hbHdheXNGb3JtYXQgPSBhbHdheXNGb3JtYXQgIT09IHVuZGVmaW5lZCA/IGFsd2F5c0Zvcm1hdCA6IGZhbHNlO1xuICAgIHRoaXMucmVzZXRSZWdFeHAoKTtcbiAgfVxuICByZXNldCgpIHtcbiAgICBpZiAodGhpcy5vcHRpb25zKSB0aGlzLmluaXQodGhpcy5vcHRpb25zKTtcbiAgfVxuICByZXNldFJlZ0V4cCgpIHtcbiAgICBjb25zdCBnZXRPclJlc2V0UmVnRXhwID0gKGV4aXN0aW5nUmVnRXhwLCBwYXR0ZXJuKSA9PiB7XG4gICAgICBpZiAoZXhpc3RpbmdSZWdFeHAgJiYgZXhpc3RpbmdSZWdFeHAuc291cmNlID09PSBwYXR0ZXJuKSB7XG4gICAgICAgIGV4aXN0aW5nUmVnRXhwLmxhc3RJbmRleCA9IDA7XG4gICAgICAgIHJldHVybiBleGlzdGluZ1JlZ0V4cDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgUmVnRXhwKHBhdHRlcm4sICdnJyk7XG4gICAgfTtcbiAgICB0aGlzLnJlZ2V4cCA9IGdldE9yUmVzZXRSZWdFeHAodGhpcy5yZWdleHAsIGAke3RoaXMucHJlZml4fSguKz8pJHt0aGlzLnN1ZmZpeH1gKTtcbiAgICB0aGlzLnJlZ2V4cFVuZXNjYXBlID0gZ2V0T3JSZXNldFJlZ0V4cCh0aGlzLnJlZ2V4cFVuZXNjYXBlLCBgJHt0aGlzLnByZWZpeH0ke3RoaXMudW5lc2NhcGVQcmVmaXh9KC4rPykke3RoaXMudW5lc2NhcGVTdWZmaXh9JHt0aGlzLnN1ZmZpeH1gKTtcbiAgICB0aGlzLm5lc3RpbmdSZWdleHAgPSBnZXRPclJlc2V0UmVnRXhwKHRoaXMubmVzdGluZ1JlZ2V4cCwgYCR7dGhpcy5uZXN0aW5nUHJlZml4fSguKz8pJHt0aGlzLm5lc3RpbmdTdWZmaXh9YCk7XG4gIH1cbiAgaW50ZXJwb2xhdGUoc3RyLCBkYXRhLCBsbmcsIG9wdGlvbnMpIHtcbiAgICBsZXQgbWF0Y2g7XG4gICAgbGV0IHZhbHVlO1xuICAgIGxldCByZXBsYWNlcztcbiAgICBjb25zdCBkZWZhdWx0RGF0YSA9IHRoaXMub3B0aW9ucyAmJiB0aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbiAmJiB0aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbi5kZWZhdWx0VmFyaWFibGVzIHx8IHt9O1xuICAgIGNvbnN0IGhhbmRsZUZvcm1hdCA9IGtleSA9PiB7XG4gICAgICBpZiAoa2V5LmluZGV4T2YodGhpcy5mb3JtYXRTZXBhcmF0b3IpIDwgMCkge1xuICAgICAgICBjb25zdCBwYXRoID0gZGVlcEZpbmRXaXRoRGVmYXVsdHMoZGF0YSwgZGVmYXVsdERhdGEsIGtleSwgdGhpcy5vcHRpb25zLmtleVNlcGFyYXRvciwgdGhpcy5vcHRpb25zLmlnbm9yZUpTT05TdHJ1Y3R1cmUpO1xuICAgICAgICByZXR1cm4gdGhpcy5hbHdheXNGb3JtYXQgPyB0aGlzLmZvcm1hdChwYXRoLCB1bmRlZmluZWQsIGxuZywge1xuICAgICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgICAgLi4uZGF0YSxcbiAgICAgICAgICBpbnRlcnBvbGF0aW9ua2V5OiBrZXlcbiAgICAgICAgfSkgOiBwYXRoO1xuICAgICAgfVxuICAgICAgY29uc3QgcCA9IGtleS5zcGxpdCh0aGlzLmZvcm1hdFNlcGFyYXRvcik7XG4gICAgICBjb25zdCBrID0gcC5zaGlmdCgpLnRyaW0oKTtcbiAgICAgIGNvbnN0IGYgPSBwLmpvaW4odGhpcy5mb3JtYXRTZXBhcmF0b3IpLnRyaW0oKTtcbiAgICAgIHJldHVybiB0aGlzLmZvcm1hdChkZWVwRmluZFdpdGhEZWZhdWx0cyhkYXRhLCBkZWZhdWx0RGF0YSwgaywgdGhpcy5vcHRpb25zLmtleVNlcGFyYXRvciwgdGhpcy5vcHRpb25zLmlnbm9yZUpTT05TdHJ1Y3R1cmUpLCBmLCBsbmcsIHtcbiAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgLi4uZGF0YSxcbiAgICAgICAgaW50ZXJwb2xhdGlvbmtleToga1xuICAgICAgfSk7XG4gICAgfTtcbiAgICB0aGlzLnJlc2V0UmVnRXhwKCk7XG4gICAgY29uc3QgbWlzc2luZ0ludGVycG9sYXRpb25IYW5kbGVyID0gb3B0aW9ucyAmJiBvcHRpb25zLm1pc3NpbmdJbnRlcnBvbGF0aW9uSGFuZGxlciB8fCB0aGlzLm9wdGlvbnMubWlzc2luZ0ludGVycG9sYXRpb25IYW5kbGVyO1xuICAgIGNvbnN0IHNraXBPblZhcmlhYmxlcyA9IG9wdGlvbnMgJiYgb3B0aW9ucy5pbnRlcnBvbGF0aW9uICYmIG9wdGlvbnMuaW50ZXJwb2xhdGlvbi5za2lwT25WYXJpYWJsZXMgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMuaW50ZXJwb2xhdGlvbi5za2lwT25WYXJpYWJsZXMgOiB0aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbi5za2lwT25WYXJpYWJsZXM7XG4gICAgY29uc3QgdG9kb3MgPSBbe1xuICAgICAgcmVnZXg6IHRoaXMucmVnZXhwVW5lc2NhcGUsXG4gICAgICBzYWZlVmFsdWU6IHZhbCA9PiByZWdleFNhZmUodmFsKVxuICAgIH0sIHtcbiAgICAgIHJlZ2V4OiB0aGlzLnJlZ2V4cCxcbiAgICAgIHNhZmVWYWx1ZTogdmFsID0+IHRoaXMuZXNjYXBlVmFsdWUgPyByZWdleFNhZmUodGhpcy5lc2NhcGUodmFsKSkgOiByZWdleFNhZmUodmFsKVxuICAgIH1dO1xuICAgIHRvZG9zLmZvckVhY2godG9kbyA9PiB7XG4gICAgICByZXBsYWNlcyA9IDA7XG4gICAgICB3aGlsZSAobWF0Y2ggPSB0b2RvLnJlZ2V4LmV4ZWMoc3RyKSkge1xuICAgICAgICBjb25zdCBtYXRjaGVkVmFyID0gbWF0Y2hbMV0udHJpbSgpO1xuICAgICAgICB2YWx1ZSA9IGhhbmRsZUZvcm1hdChtYXRjaGVkVmFyKTtcbiAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBpZiAodHlwZW9mIG1pc3NpbmdJbnRlcnBvbGF0aW9uSGFuZGxlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY29uc3QgdGVtcCA9IG1pc3NpbmdJbnRlcnBvbGF0aW9uSGFuZGxlcihzdHIsIG1hdGNoLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHZhbHVlID0gdHlwZW9mIHRlbXAgPT09ICdzdHJpbmcnID8gdGVtcCA6ICcnO1xuICAgICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucyAmJiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob3B0aW9ucywgbWF0Y2hlZFZhcikpIHtcbiAgICAgICAgICAgIHZhbHVlID0gJyc7XG4gICAgICAgICAgfSBlbHNlIGlmIChza2lwT25WYXJpYWJsZXMpIHtcbiAgICAgICAgICAgIHZhbHVlID0gbWF0Y2hbMF07XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5sb2dnZXIud2FybihgbWlzc2VkIHRvIHBhc3MgaW4gdmFyaWFibGUgJHttYXRjaGVkVmFyfSBmb3IgaW50ZXJwb2xhdGluZyAke3N0cn1gKTtcbiAgICAgICAgICAgIHZhbHVlID0gJyc7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycgJiYgIXRoaXMudXNlUmF3VmFsdWVUb0VzY2FwZSkge1xuICAgICAgICAgIHZhbHVlID0gbWFrZVN0cmluZyh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc2FmZVZhbHVlID0gdG9kby5zYWZlVmFsdWUodmFsdWUpO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZShtYXRjaFswXSwgc2FmZVZhbHVlKTtcbiAgICAgICAgaWYgKHNraXBPblZhcmlhYmxlcykge1xuICAgICAgICAgIHRvZG8ucmVnZXgubGFzdEluZGV4ICs9IHZhbHVlLmxlbmd0aDtcbiAgICAgICAgICB0b2RvLnJlZ2V4Lmxhc3RJbmRleCAtPSBtYXRjaFswXS5sZW5ndGg7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdG9kby5yZWdleC5sYXN0SW5kZXggPSAwO1xuICAgICAgICB9XG4gICAgICAgIHJlcGxhY2VzKys7XG4gICAgICAgIGlmIChyZXBsYWNlcyA+PSB0aGlzLm1heFJlcGxhY2VzKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gc3RyO1xuICB9XG4gIG5lc3Qoc3RyLCBmYykge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMl0gOiB7fTtcbiAgICBsZXQgbWF0Y2g7XG4gICAgbGV0IHZhbHVlO1xuICAgIGxldCBjbG9uZWRPcHRpb25zO1xuICAgIGNvbnN0IGhhbmRsZUhhc09wdGlvbnMgPSAoa2V5LCBpbmhlcml0ZWRPcHRpb25zKSA9PiB7XG4gICAgICBjb25zdCBzZXAgPSB0aGlzLm5lc3RpbmdPcHRpb25zU2VwYXJhdG9yO1xuICAgICAgaWYgKGtleS5pbmRleE9mKHNlcCkgPCAwKSByZXR1cm4ga2V5O1xuICAgICAgY29uc3QgYyA9IGtleS5zcGxpdChuZXcgUmVnRXhwKGAke3NlcH1bIF0qe2ApKTtcbiAgICAgIGxldCBvcHRpb25zU3RyaW5nID0gYHske2NbMV19YDtcbiAgICAgIGtleSA9IGNbMF07XG4gICAgICBvcHRpb25zU3RyaW5nID0gdGhpcy5pbnRlcnBvbGF0ZShvcHRpb25zU3RyaW5nLCBjbG9uZWRPcHRpb25zKTtcbiAgICAgIGNvbnN0IG1hdGNoZWRTaW5nbGVRdW90ZXMgPSBvcHRpb25zU3RyaW5nLm1hdGNoKC8nL2cpO1xuICAgICAgY29uc3QgbWF0Y2hlZERvdWJsZVF1b3RlcyA9IG9wdGlvbnNTdHJpbmcubWF0Y2goL1wiL2cpO1xuICAgICAgaWYgKG1hdGNoZWRTaW5nbGVRdW90ZXMgJiYgbWF0Y2hlZFNpbmdsZVF1b3Rlcy5sZW5ndGggJSAyID09PSAwICYmICFtYXRjaGVkRG91YmxlUXVvdGVzIHx8IG1hdGNoZWREb3VibGVRdW90ZXMubGVuZ3RoICUgMiAhPT0gMCkge1xuICAgICAgICBvcHRpb25zU3RyaW5nID0gb3B0aW9uc1N0cmluZy5yZXBsYWNlKC8nL2csICdcIicpO1xuICAgICAgfVxuICAgICAgdHJ5IHtcbiAgICAgICAgY2xvbmVkT3B0aW9ucyA9IEpTT04ucGFyc2Uob3B0aW9uc1N0cmluZyk7XG4gICAgICAgIGlmIChpbmhlcml0ZWRPcHRpb25zKSBjbG9uZWRPcHRpb25zID0ge1xuICAgICAgICAgIC4uLmluaGVyaXRlZE9wdGlvbnMsXG4gICAgICAgICAgLi4uY2xvbmVkT3B0aW9uc1xuICAgICAgICB9O1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICB0aGlzLmxvZ2dlci53YXJuKGBmYWlsZWQgcGFyc2luZyBvcHRpb25zIHN0cmluZyBpbiBuZXN0aW5nIGZvciBrZXkgJHtrZXl9YCwgZSk7XG4gICAgICAgIHJldHVybiBgJHtrZXl9JHtzZXB9JHtvcHRpb25zU3RyaW5nfWA7XG4gICAgICB9XG4gICAgICBpZiAoY2xvbmVkT3B0aW9ucy5kZWZhdWx0VmFsdWUgJiYgY2xvbmVkT3B0aW9ucy5kZWZhdWx0VmFsdWUuaW5kZXhPZih0aGlzLnByZWZpeCkgPiAtMSkgZGVsZXRlIGNsb25lZE9wdGlvbnMuZGVmYXVsdFZhbHVlO1xuICAgICAgcmV0dXJuIGtleTtcbiAgICB9O1xuICAgIHdoaWxlIChtYXRjaCA9IHRoaXMubmVzdGluZ1JlZ2V4cC5leGVjKHN0cikpIHtcbiAgICAgIGxldCBmb3JtYXR0ZXJzID0gW107XG4gICAgICBjbG9uZWRPcHRpb25zID0ge1xuICAgICAgICAuLi5vcHRpb25zXG4gICAgICB9O1xuICAgICAgY2xvbmVkT3B0aW9ucyA9IGNsb25lZE9wdGlvbnMucmVwbGFjZSAmJiB0eXBlb2YgY2xvbmVkT3B0aW9ucy5yZXBsYWNlICE9PSAnc3RyaW5nJyA/IGNsb25lZE9wdGlvbnMucmVwbGFjZSA6IGNsb25lZE9wdGlvbnM7XG4gICAgICBjbG9uZWRPcHRpb25zLmFwcGx5UG9zdFByb2Nlc3NvciA9IGZhbHNlO1xuICAgICAgZGVsZXRlIGNsb25lZE9wdGlvbnMuZGVmYXVsdFZhbHVlO1xuICAgICAgbGV0IGRvUmVkdWNlID0gZmFsc2U7XG4gICAgICBpZiAobWF0Y2hbMF0uaW5kZXhPZih0aGlzLmZvcm1hdFNlcGFyYXRvcikgIT09IC0xICYmICEvey4qfS8udGVzdChtYXRjaFsxXSkpIHtcbiAgICAgICAgY29uc3QgciA9IG1hdGNoWzFdLnNwbGl0KHRoaXMuZm9ybWF0U2VwYXJhdG9yKS5tYXAoZWxlbSA9PiBlbGVtLnRyaW0oKSk7XG4gICAgICAgIG1hdGNoWzFdID0gci5zaGlmdCgpO1xuICAgICAgICBmb3JtYXR0ZXJzID0gcjtcbiAgICAgICAgZG9SZWR1Y2UgPSB0cnVlO1xuICAgICAgfVxuICAgICAgdmFsdWUgPSBmYyhoYW5kbGVIYXNPcHRpb25zLmNhbGwodGhpcywgbWF0Y2hbMV0udHJpbSgpLCBjbG9uZWRPcHRpb25zKSwgY2xvbmVkT3B0aW9ucyk7XG4gICAgICBpZiAodmFsdWUgJiYgbWF0Y2hbMF0gPT09IHN0ciAmJiB0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSByZXR1cm4gdmFsdWU7XG4gICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJykgdmFsdWUgPSBtYWtlU3RyaW5nKHZhbHVlKTtcbiAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgdGhpcy5sb2dnZXIud2FybihgbWlzc2VkIHRvIHJlc29sdmUgJHttYXRjaFsxXX0gZm9yIG5lc3RpbmcgJHtzdHJ9YCk7XG4gICAgICAgIHZhbHVlID0gJyc7XG4gICAgICB9XG4gICAgICBpZiAoZG9SZWR1Y2UpIHtcbiAgICAgICAgdmFsdWUgPSBmb3JtYXR0ZXJzLnJlZHVjZSgodiwgZikgPT4gdGhpcy5mb3JtYXQodiwgZiwgb3B0aW9ucy5sbmcsIHtcbiAgICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICAgIGludGVycG9sYXRpb25rZXk6IG1hdGNoWzFdLnRyaW0oKVxuICAgICAgICB9KSwgdmFsdWUudHJpbSgpKTtcbiAgICAgIH1cbiAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKG1hdGNoWzBdLCB2YWx1ZSk7XG4gICAgICB0aGlzLnJlZ2V4cC5sYXN0SW5kZXggPSAwO1xuICAgIH1cbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cbmNvbnN0IHBhcnNlRm9ybWF0U3RyID0gZm9ybWF0U3RyID0+IHtcbiAgbGV0IGZvcm1hdE5hbWUgPSBmb3JtYXRTdHIudG9Mb3dlckNhc2UoKS50cmltKCk7XG4gIGNvbnN0IGZvcm1hdE9wdGlvbnMgPSB7fTtcbiAgaWYgKGZvcm1hdFN0ci5pbmRleE9mKCcoJykgPiAtMSkge1xuICAgIGNvbnN0IHAgPSBmb3JtYXRTdHIuc3BsaXQoJygnKTtcbiAgICBmb3JtYXROYW1lID0gcFswXS50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcbiAgICBjb25zdCBvcHRTdHIgPSBwWzFdLnN1YnN0cmluZygwLCBwWzFdLmxlbmd0aCAtIDEpO1xuICAgIGlmIChmb3JtYXROYW1lID09PSAnY3VycmVuY3knICYmIG9wdFN0ci5pbmRleE9mKCc6JykgPCAwKSB7XG4gICAgICBpZiAoIWZvcm1hdE9wdGlvbnMuY3VycmVuY3kpIGZvcm1hdE9wdGlvbnMuY3VycmVuY3kgPSBvcHRTdHIudHJpbSgpO1xuICAgIH0gZWxzZSBpZiAoZm9ybWF0TmFtZSA9PT0gJ3JlbGF0aXZldGltZScgJiYgb3B0U3RyLmluZGV4T2YoJzonKSA8IDApIHtcbiAgICAgIGlmICghZm9ybWF0T3B0aW9ucy5yYW5nZSkgZm9ybWF0T3B0aW9ucy5yYW5nZSA9IG9wdFN0ci50cmltKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IG9wdHMgPSBvcHRTdHIuc3BsaXQoJzsnKTtcbiAgICAgIG9wdHMuZm9yRWFjaChvcHQgPT4ge1xuICAgICAgICBpZiAob3B0KSB7XG4gICAgICAgICAgY29uc3QgW2tleSwgLi4ucmVzdF0gPSBvcHQuc3BsaXQoJzonKTtcbiAgICAgICAgICBjb25zdCB2YWwgPSByZXN0LmpvaW4oJzonKS50cmltKCkucmVwbGFjZSgvXicrfCcrJC9nLCAnJyk7XG4gICAgICAgICAgY29uc3QgdHJpbW1lZEtleSA9IGtleS50cmltKCk7XG4gICAgICAgICAgaWYgKCFmb3JtYXRPcHRpb25zW3RyaW1tZWRLZXldKSBmb3JtYXRPcHRpb25zW3RyaW1tZWRLZXldID0gdmFsO1xuICAgICAgICAgIGlmICh2YWwgPT09ICdmYWxzZScpIGZvcm1hdE9wdGlvbnNbdHJpbW1lZEtleV0gPSBmYWxzZTtcbiAgICAgICAgICBpZiAodmFsID09PSAndHJ1ZScpIGZvcm1hdE9wdGlvbnNbdHJpbW1lZEtleV0gPSB0cnVlO1xuICAgICAgICAgIGlmICghaXNOYU4odmFsKSkgZm9ybWF0T3B0aW9uc1t0cmltbWVkS2V5XSA9IHBhcnNlSW50KHZhbCwgMTApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBmb3JtYXROYW1lLFxuICAgIGZvcm1hdE9wdGlvbnNcbiAgfTtcbn07XG5jb25zdCBjcmVhdGVDYWNoZWRGb3JtYXR0ZXIgPSBmbiA9PiB7XG4gIGNvbnN0IGNhY2hlID0ge307XG4gIHJldHVybiAodmFsLCBsbmcsIG9wdGlvbnMpID0+IHtcbiAgICBjb25zdCBrZXkgPSBsbmcgKyBKU09OLnN0cmluZ2lmeShvcHRpb25zKTtcbiAgICBsZXQgZm9ybWF0dGVyID0gY2FjaGVba2V5XTtcbiAgICBpZiAoIWZvcm1hdHRlcikge1xuICAgICAgZm9ybWF0dGVyID0gZm4oZ2V0Q2xlYW5lZENvZGUobG5nKSwgb3B0aW9ucyk7XG4gICAgICBjYWNoZVtrZXldID0gZm9ybWF0dGVyO1xuICAgIH1cbiAgICByZXR1cm4gZm9ybWF0dGVyKHZhbCk7XG4gIH07XG59O1xuY2xhc3MgRm9ybWF0dGVyIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IHt9O1xuICAgIHRoaXMubG9nZ2VyID0gYmFzZUxvZ2dlci5jcmVhdGUoJ2Zvcm1hdHRlcicpO1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy5mb3JtYXRzID0ge1xuICAgICAgbnVtYmVyOiBjcmVhdGVDYWNoZWRGb3JtYXR0ZXIoKGxuZywgb3B0KSA9PiB7XG4gICAgICAgIGNvbnN0IGZvcm1hdHRlciA9IG5ldyBJbnRsLk51bWJlckZvcm1hdChsbmcsIHtcbiAgICAgICAgICAuLi5vcHRcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB2YWwgPT4gZm9ybWF0dGVyLmZvcm1hdCh2YWwpO1xuICAgICAgfSksXG4gICAgICBjdXJyZW5jeTogY3JlYXRlQ2FjaGVkRm9ybWF0dGVyKChsbmcsIG9wdCkgPT4ge1xuICAgICAgICBjb25zdCBmb3JtYXR0ZXIgPSBuZXcgSW50bC5OdW1iZXJGb3JtYXQobG5nLCB7XG4gICAgICAgICAgLi4ub3B0LFxuICAgICAgICAgIHN0eWxlOiAnY3VycmVuY3knXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdmFsID0+IGZvcm1hdHRlci5mb3JtYXQodmFsKTtcbiAgICAgIH0pLFxuICAgICAgZGF0ZXRpbWU6IGNyZWF0ZUNhY2hlZEZvcm1hdHRlcigobG5nLCBvcHQpID0+IHtcbiAgICAgICAgY29uc3QgZm9ybWF0dGVyID0gbmV3IEludGwuRGF0ZVRpbWVGb3JtYXQobG5nLCB7XG4gICAgICAgICAgLi4ub3B0XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdmFsID0+IGZvcm1hdHRlci5mb3JtYXQodmFsKTtcbiAgICAgIH0pLFxuICAgICAgcmVsYXRpdmV0aW1lOiBjcmVhdGVDYWNoZWRGb3JtYXR0ZXIoKGxuZywgb3B0KSA9PiB7XG4gICAgICAgIGNvbnN0IGZvcm1hdHRlciA9IG5ldyBJbnRsLlJlbGF0aXZlVGltZUZvcm1hdChsbmcsIHtcbiAgICAgICAgICAuLi5vcHRcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB2YWwgPT4gZm9ybWF0dGVyLmZvcm1hdCh2YWwsIG9wdC5yYW5nZSB8fCAnZGF5Jyk7XG4gICAgICB9KSxcbiAgICAgIGxpc3Q6IGNyZWF0ZUNhY2hlZEZvcm1hdHRlcigobG5nLCBvcHQpID0+IHtcbiAgICAgICAgY29uc3QgZm9ybWF0dGVyID0gbmV3IEludGwuTGlzdEZvcm1hdChsbmcsIHtcbiAgICAgICAgICAuLi5vcHRcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB2YWwgPT4gZm9ybWF0dGVyLmZvcm1hdCh2YWwpO1xuICAgICAgfSlcbiAgICB9O1xuICAgIHRoaXMuaW5pdChvcHRpb25zKTtcbiAgfVxuICBpbml0KHNlcnZpY2VzKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IHtcbiAgICAgIGludGVycG9sYXRpb246IHt9XG4gICAgfTtcbiAgICBjb25zdCBpT3B0cyA9IG9wdGlvbnMuaW50ZXJwb2xhdGlvbjtcbiAgICB0aGlzLmZvcm1hdFNlcGFyYXRvciA9IGlPcHRzLmZvcm1hdFNlcGFyYXRvciA/IGlPcHRzLmZvcm1hdFNlcGFyYXRvciA6IGlPcHRzLmZvcm1hdFNlcGFyYXRvciB8fCAnLCc7XG4gIH1cbiAgYWRkKG5hbWUsIGZjKSB7XG4gICAgdGhpcy5mb3JtYXRzW25hbWUudG9Mb3dlckNhc2UoKS50cmltKCldID0gZmM7XG4gIH1cbiAgYWRkQ2FjaGVkKG5hbWUsIGZjKSB7XG4gICAgdGhpcy5mb3JtYXRzW25hbWUudG9Mb3dlckNhc2UoKS50cmltKCldID0gY3JlYXRlQ2FjaGVkRm9ybWF0dGVyKGZjKTtcbiAgfVxuICBmb3JtYXQodmFsdWUsIGZvcm1hdCwgbG5nKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMyAmJiBhcmd1bWVudHNbM10gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1szXSA6IHt9O1xuICAgIGNvbnN0IGZvcm1hdHMgPSBmb3JtYXQuc3BsaXQodGhpcy5mb3JtYXRTZXBhcmF0b3IpO1xuICAgIGlmIChmb3JtYXRzLmxlbmd0aCA+IDEgJiYgZm9ybWF0c1swXS5pbmRleE9mKCcoJykgPiAxICYmIGZvcm1hdHNbMF0uaW5kZXhPZignKScpIDwgMCAmJiBmb3JtYXRzLmZpbmQoZiA9PiBmLmluZGV4T2YoJyknKSA+IC0xKSkge1xuICAgICAgY29uc3QgbGFzdEluZGV4ID0gZm9ybWF0cy5maW5kSW5kZXgoZiA9PiBmLmluZGV4T2YoJyknKSA+IC0xKTtcbiAgICAgIGZvcm1hdHNbMF0gPSBbZm9ybWF0c1swXSwgLi4uZm9ybWF0cy5zcGxpY2UoMSwgbGFzdEluZGV4KV0uam9pbih0aGlzLmZvcm1hdFNlcGFyYXRvcik7XG4gICAgfVxuICAgIGNvbnN0IHJlc3VsdCA9IGZvcm1hdHMucmVkdWNlKChtZW0sIGYpID0+IHtcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgZm9ybWF0TmFtZSxcbiAgICAgICAgZm9ybWF0T3B0aW9uc1xuICAgICAgfSA9IHBhcnNlRm9ybWF0U3RyKGYpO1xuICAgICAgaWYgKHRoaXMuZm9ybWF0c1tmb3JtYXROYW1lXSkge1xuICAgICAgICBsZXQgZm9ybWF0dGVkID0gbWVtO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IHZhbE9wdGlvbnMgPSBvcHRpb25zICYmIG9wdGlvbnMuZm9ybWF0UGFyYW1zICYmIG9wdGlvbnMuZm9ybWF0UGFyYW1zW29wdGlvbnMuaW50ZXJwb2xhdGlvbmtleV0gfHwge307XG4gICAgICAgICAgY29uc3QgbCA9IHZhbE9wdGlvbnMubG9jYWxlIHx8IHZhbE9wdGlvbnMubG5nIHx8IG9wdGlvbnMubG9jYWxlIHx8IG9wdGlvbnMubG5nIHx8IGxuZztcbiAgICAgICAgICBmb3JtYXR0ZWQgPSB0aGlzLmZvcm1hdHNbZm9ybWF0TmFtZV0obWVtLCBsLCB7XG4gICAgICAgICAgICAuLi5mb3JtYXRPcHRpb25zLFxuICAgICAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgICAgIC4uLnZhbE9wdGlvbnNcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICB0aGlzLmxvZ2dlci53YXJuKGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZm9ybWF0dGVkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5sb2dnZXIud2FybihgdGhlcmUgd2FzIG5vIGZvcm1hdCBmdW5jdGlvbiBmb3IgJHtmb3JtYXROYW1lfWApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1lbTtcbiAgICB9LCB2YWx1ZSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxufVxuXG5jb25zdCByZW1vdmVQZW5kaW5nID0gKHEsIG5hbWUpID0+IHtcbiAgaWYgKHEucGVuZGluZ1tuYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgZGVsZXRlIHEucGVuZGluZ1tuYW1lXTtcbiAgICBxLnBlbmRpbmdDb3VudC0tO1xuICB9XG59O1xuY2xhc3MgQ29ubmVjdG9yIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgY29uc3RydWN0b3IoYmFja2VuZCwgc3RvcmUsIHNlcnZpY2VzKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMyAmJiBhcmd1bWVudHNbM10gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1szXSA6IHt9O1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5iYWNrZW5kID0gYmFja2VuZDtcbiAgICB0aGlzLnN0b3JlID0gc3RvcmU7XG4gICAgdGhpcy5zZXJ2aWNlcyA9IHNlcnZpY2VzO1xuICAgIHRoaXMubGFuZ3VhZ2VVdGlscyA9IHNlcnZpY2VzLmxhbmd1YWdlVXRpbHM7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLmxvZ2dlciA9IGJhc2VMb2dnZXIuY3JlYXRlKCdiYWNrZW5kQ29ubmVjdG9yJyk7XG4gICAgdGhpcy53YWl0aW5nUmVhZHMgPSBbXTtcbiAgICB0aGlzLm1heFBhcmFsbGVsUmVhZHMgPSBvcHRpb25zLm1heFBhcmFsbGVsUmVhZHMgfHwgMTA7XG4gICAgdGhpcy5yZWFkaW5nQ2FsbHMgPSAwO1xuICAgIHRoaXMubWF4UmV0cmllcyA9IG9wdGlvbnMubWF4UmV0cmllcyA+PSAwID8gb3B0aW9ucy5tYXhSZXRyaWVzIDogNTtcbiAgICB0aGlzLnJldHJ5VGltZW91dCA9IG9wdGlvbnMucmV0cnlUaW1lb3V0ID49IDEgPyBvcHRpb25zLnJldHJ5VGltZW91dCA6IDM1MDtcbiAgICB0aGlzLnN0YXRlID0ge307XG4gICAgdGhpcy5xdWV1ZSA9IFtdO1xuICAgIGlmICh0aGlzLmJhY2tlbmQgJiYgdGhpcy5iYWNrZW5kLmluaXQpIHtcbiAgICAgIHRoaXMuYmFja2VuZC5pbml0KHNlcnZpY2VzLCBvcHRpb25zLmJhY2tlbmQsIG9wdGlvbnMpO1xuICAgIH1cbiAgfVxuICBxdWV1ZUxvYWQobGFuZ3VhZ2VzLCBuYW1lc3BhY2VzLCBvcHRpb25zLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IHRvTG9hZCA9IHt9O1xuICAgIGNvbnN0IHBlbmRpbmcgPSB7fTtcbiAgICBjb25zdCB0b0xvYWRMYW5ndWFnZXMgPSB7fTtcbiAgICBjb25zdCB0b0xvYWROYW1lc3BhY2VzID0ge307XG4gICAgbGFuZ3VhZ2VzLmZvckVhY2gobG5nID0+IHtcbiAgICAgIGxldCBoYXNBbGxOYW1lc3BhY2VzID0gdHJ1ZTtcbiAgICAgIG5hbWVzcGFjZXMuZm9yRWFjaChucyA9PiB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBgJHtsbmd9fCR7bnN9YDtcbiAgICAgICAgaWYgKCFvcHRpb25zLnJlbG9hZCAmJiB0aGlzLnN0b3JlLmhhc1Jlc291cmNlQnVuZGxlKGxuZywgbnMpKSB7XG4gICAgICAgICAgdGhpcy5zdGF0ZVtuYW1lXSA9IDI7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0ZVtuYW1lXSA8IDApIDsgZWxzZSBpZiAodGhpcy5zdGF0ZVtuYW1lXSA9PT0gMSkge1xuICAgICAgICAgIGlmIChwZW5kaW5nW25hbWVdID09PSB1bmRlZmluZWQpIHBlbmRpbmdbbmFtZV0gPSB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuc3RhdGVbbmFtZV0gPSAxO1xuICAgICAgICAgIGhhc0FsbE5hbWVzcGFjZXMgPSBmYWxzZTtcbiAgICAgICAgICBpZiAocGVuZGluZ1tuYW1lXSA9PT0gdW5kZWZpbmVkKSBwZW5kaW5nW25hbWVdID0gdHJ1ZTtcbiAgICAgICAgICBpZiAodG9Mb2FkW25hbWVdID09PSB1bmRlZmluZWQpIHRvTG9hZFtuYW1lXSA9IHRydWU7XG4gICAgICAgICAgaWYgKHRvTG9hZE5hbWVzcGFjZXNbbnNdID09PSB1bmRlZmluZWQpIHRvTG9hZE5hbWVzcGFjZXNbbnNdID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBpZiAoIWhhc0FsbE5hbWVzcGFjZXMpIHRvTG9hZExhbmd1YWdlc1tsbmddID0gdHJ1ZTtcbiAgICB9KTtcbiAgICBpZiAoT2JqZWN0LmtleXModG9Mb2FkKS5sZW5ndGggfHwgT2JqZWN0LmtleXMocGVuZGluZykubGVuZ3RoKSB7XG4gICAgICB0aGlzLnF1ZXVlLnB1c2goe1xuICAgICAgICBwZW5kaW5nLFxuICAgICAgICBwZW5kaW5nQ291bnQ6IE9iamVjdC5rZXlzKHBlbmRpbmcpLmxlbmd0aCxcbiAgICAgICAgbG9hZGVkOiB7fSxcbiAgICAgICAgZXJyb3JzOiBbXSxcbiAgICAgICAgY2FsbGJhY2tcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgdG9Mb2FkOiBPYmplY3Qua2V5cyh0b0xvYWQpLFxuICAgICAgcGVuZGluZzogT2JqZWN0LmtleXMocGVuZGluZyksXG4gICAgICB0b0xvYWRMYW5ndWFnZXM6IE9iamVjdC5rZXlzKHRvTG9hZExhbmd1YWdlcyksXG4gICAgICB0b0xvYWROYW1lc3BhY2VzOiBPYmplY3Qua2V5cyh0b0xvYWROYW1lc3BhY2VzKVxuICAgIH07XG4gIH1cbiAgbG9hZGVkKG5hbWUsIGVyciwgZGF0YSkge1xuICAgIGNvbnN0IHMgPSBuYW1lLnNwbGl0KCd8Jyk7XG4gICAgY29uc3QgbG5nID0gc1swXTtcbiAgICBjb25zdCBucyA9IHNbMV07XG4gICAgaWYgKGVycikgdGhpcy5lbWl0KCdmYWlsZWRMb2FkaW5nJywgbG5nLCBucywgZXJyKTtcbiAgICBpZiAoZGF0YSkge1xuICAgICAgdGhpcy5zdG9yZS5hZGRSZXNvdXJjZUJ1bmRsZShsbmcsIG5zLCBkYXRhLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwge1xuICAgICAgICBza2lwQ29weTogdHJ1ZVxuICAgICAgfSk7XG4gICAgfVxuICAgIHRoaXMuc3RhdGVbbmFtZV0gPSBlcnIgPyAtMSA6IDI7XG4gICAgY29uc3QgbG9hZGVkID0ge307XG4gICAgdGhpcy5xdWV1ZS5mb3JFYWNoKHEgPT4ge1xuICAgICAgcHVzaFBhdGgocS5sb2FkZWQsIFtsbmddLCBucyk7XG4gICAgICByZW1vdmVQZW5kaW5nKHEsIG5hbWUpO1xuICAgICAgaWYgKGVycikgcS5lcnJvcnMucHVzaChlcnIpO1xuICAgICAgaWYgKHEucGVuZGluZ0NvdW50ID09PSAwICYmICFxLmRvbmUpIHtcbiAgICAgICAgT2JqZWN0LmtleXMocS5sb2FkZWQpLmZvckVhY2gobCA9PiB7XG4gICAgICAgICAgaWYgKCFsb2FkZWRbbF0pIGxvYWRlZFtsXSA9IHt9O1xuICAgICAgICAgIGNvbnN0IGxvYWRlZEtleXMgPSBxLmxvYWRlZFtsXTtcbiAgICAgICAgICBpZiAobG9hZGVkS2V5cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGxvYWRlZEtleXMuZm9yRWFjaChuID0+IHtcbiAgICAgICAgICAgICAgaWYgKGxvYWRlZFtsXVtuXSA9PT0gdW5kZWZpbmVkKSBsb2FkZWRbbF1bbl0gPSB0cnVlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcS5kb25lID0gdHJ1ZTtcbiAgICAgICAgaWYgKHEuZXJyb3JzLmxlbmd0aCkge1xuICAgICAgICAgIHEuY2FsbGJhY2socS5lcnJvcnMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHEuY2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuZW1pdCgnbG9hZGVkJywgbG9hZGVkKTtcbiAgICB0aGlzLnF1ZXVlID0gdGhpcy5xdWV1ZS5maWx0ZXIocSA9PiAhcS5kb25lKTtcbiAgfVxuICByZWFkKGxuZywgbnMsIGZjTmFtZSkge1xuICAgIGxldCB0cmllZCA9IGFyZ3VtZW50cy5sZW5ndGggPiAzICYmIGFyZ3VtZW50c1szXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzNdIDogMDtcbiAgICBsZXQgd2FpdCA9IGFyZ3VtZW50cy5sZW5ndGggPiA0ICYmIGFyZ3VtZW50c1s0XSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzRdIDogdGhpcy5yZXRyeVRpbWVvdXQ7XG4gICAgbGV0IGNhbGxiYWNrID0gYXJndW1lbnRzLmxlbmd0aCA+IDUgPyBhcmd1bWVudHNbNV0gOiB1bmRlZmluZWQ7XG4gICAgaWYgKCFsbmcubGVuZ3RoKSByZXR1cm4gY2FsbGJhY2sobnVsbCwge30pO1xuICAgIGlmICh0aGlzLnJlYWRpbmdDYWxscyA+PSB0aGlzLm1heFBhcmFsbGVsUmVhZHMpIHtcbiAgICAgIHRoaXMud2FpdGluZ1JlYWRzLnB1c2goe1xuICAgICAgICBsbmcsXG4gICAgICAgIG5zLFxuICAgICAgICBmY05hbWUsXG4gICAgICAgIHRyaWVkLFxuICAgICAgICB3YWl0LFxuICAgICAgICBjYWxsYmFja1xuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMucmVhZGluZ0NhbGxzKys7XG4gICAgY29uc3QgcmVzb2x2ZXIgPSAoZXJyLCBkYXRhKSA9PiB7XG4gICAgICB0aGlzLnJlYWRpbmdDYWxscy0tO1xuICAgICAgaWYgKHRoaXMud2FpdGluZ1JlYWRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3QgbmV4dCA9IHRoaXMud2FpdGluZ1JlYWRzLnNoaWZ0KCk7XG4gICAgICAgIHRoaXMucmVhZChuZXh0LmxuZywgbmV4dC5ucywgbmV4dC5mY05hbWUsIG5leHQudHJpZWQsIG5leHQud2FpdCwgbmV4dC5jYWxsYmFjayk7XG4gICAgICB9XG4gICAgICBpZiAoZXJyICYmIGRhdGEgJiYgdHJpZWQgPCB0aGlzLm1heFJldHJpZXMpIHtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgdGhpcy5yZWFkLmNhbGwodGhpcywgbG5nLCBucywgZmNOYW1lLCB0cmllZCArIDEsIHdhaXQgKiAyLCBjYWxsYmFjayk7XG4gICAgICAgIH0sIHdhaXQpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjYWxsYmFjayhlcnIsIGRhdGEpO1xuICAgIH07XG4gICAgY29uc3QgZmMgPSB0aGlzLmJhY2tlbmRbZmNOYW1lXS5iaW5kKHRoaXMuYmFja2VuZCk7XG4gICAgaWYgKGZjLmxlbmd0aCA9PT0gMikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgciA9IGZjKGxuZywgbnMpO1xuICAgICAgICBpZiAociAmJiB0eXBlb2Ygci50aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgci50aGVuKGRhdGEgPT4gcmVzb2x2ZXIobnVsbCwgZGF0YSkpLmNhdGNoKHJlc29sdmVyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNvbHZlcihudWxsLCByKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHJlc29sdmVyKGVycik7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHJldHVybiBmYyhsbmcsIG5zLCByZXNvbHZlcik7XG4gIH1cbiAgcHJlcGFyZUxvYWRpbmcobGFuZ3VhZ2VzLCBuYW1lc3BhY2VzKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6IHt9O1xuICAgIGxldCBjYWxsYmFjayA9IGFyZ3VtZW50cy5sZW5ndGggPiAzID8gYXJndW1lbnRzWzNdIDogdW5kZWZpbmVkO1xuICAgIGlmICghdGhpcy5iYWNrZW5kKSB7XG4gICAgICB0aGlzLmxvZ2dlci53YXJuKCdObyBiYWNrZW5kIHdhcyBhZGRlZCB2aWEgaTE4bmV4dC51c2UuIFdpbGwgbm90IGxvYWQgcmVzb3VyY2VzLicpO1xuICAgICAgcmV0dXJuIGNhbGxiYWNrICYmIGNhbGxiYWNrKCk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgbGFuZ3VhZ2VzID09PSAnc3RyaW5nJykgbGFuZ3VhZ2VzID0gdGhpcy5sYW5ndWFnZVV0aWxzLnRvUmVzb2x2ZUhpZXJhcmNoeShsYW5ndWFnZXMpO1xuICAgIGlmICh0eXBlb2YgbmFtZXNwYWNlcyA9PT0gJ3N0cmluZycpIG5hbWVzcGFjZXMgPSBbbmFtZXNwYWNlc107XG4gICAgY29uc3QgdG9Mb2FkID0gdGhpcy5xdWV1ZUxvYWQobGFuZ3VhZ2VzLCBuYW1lc3BhY2VzLCBvcHRpb25zLCBjYWxsYmFjayk7XG4gICAgaWYgKCF0b0xvYWQudG9Mb2FkLmxlbmd0aCkge1xuICAgICAgaWYgKCF0b0xvYWQucGVuZGluZy5sZW5ndGgpIGNhbGxiYWNrKCk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgdG9Mb2FkLnRvTG9hZC5mb3JFYWNoKG5hbWUgPT4ge1xuICAgICAgdGhpcy5sb2FkT25lKG5hbWUpO1xuICAgIH0pO1xuICB9XG4gIGxvYWQobGFuZ3VhZ2VzLCBuYW1lc3BhY2VzLCBjYWxsYmFjaykge1xuICAgIHRoaXMucHJlcGFyZUxvYWRpbmcobGFuZ3VhZ2VzLCBuYW1lc3BhY2VzLCB7fSwgY2FsbGJhY2spO1xuICB9XG4gIHJlbG9hZChsYW5ndWFnZXMsIG5hbWVzcGFjZXMsIGNhbGxiYWNrKSB7XG4gICAgdGhpcy5wcmVwYXJlTG9hZGluZyhsYW5ndWFnZXMsIG5hbWVzcGFjZXMsIHtcbiAgICAgIHJlbG9hZDogdHJ1ZVxuICAgIH0sIGNhbGxiYWNrKTtcbiAgfVxuICBsb2FkT25lKG5hbWUpIHtcbiAgICBsZXQgcHJlZml4ID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiAnJztcbiAgICBjb25zdCBzID0gbmFtZS5zcGxpdCgnfCcpO1xuICAgIGNvbnN0IGxuZyA9IHNbMF07XG4gICAgY29uc3QgbnMgPSBzWzFdO1xuICAgIHRoaXMucmVhZChsbmcsIG5zLCAncmVhZCcsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCAoZXJyLCBkYXRhKSA9PiB7XG4gICAgICBpZiAoZXJyKSB0aGlzLmxvZ2dlci53YXJuKGAke3ByZWZpeH1sb2FkaW5nIG5hbWVzcGFjZSAke25zfSBmb3IgbGFuZ3VhZ2UgJHtsbmd9IGZhaWxlZGAsIGVycik7XG4gICAgICBpZiAoIWVyciAmJiBkYXRhKSB0aGlzLmxvZ2dlci5sb2coYCR7cHJlZml4fWxvYWRlZCBuYW1lc3BhY2UgJHtuc30gZm9yIGxhbmd1YWdlICR7bG5nfWAsIGRhdGEpO1xuICAgICAgdGhpcy5sb2FkZWQobmFtZSwgZXJyLCBkYXRhKTtcbiAgICB9KTtcbiAgfVxuICBzYXZlTWlzc2luZyhsYW5ndWFnZXMsIG5hbWVzcGFjZSwga2V5LCBmYWxsYmFja1ZhbHVlLCBpc1VwZGF0ZSkge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDUgJiYgYXJndW1lbnRzWzVdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbNV0gOiB7fTtcbiAgICBsZXQgY2xiID0gYXJndW1lbnRzLmxlbmd0aCA+IDYgJiYgYXJndW1lbnRzWzZdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbNl0gOiAoKSA9PiB7fTtcbiAgICBpZiAodGhpcy5zZXJ2aWNlcy51dGlscyAmJiB0aGlzLnNlcnZpY2VzLnV0aWxzLmhhc0xvYWRlZE5hbWVzcGFjZSAmJiAhdGhpcy5zZXJ2aWNlcy51dGlscy5oYXNMb2FkZWROYW1lc3BhY2UobmFtZXNwYWNlKSkge1xuICAgICAgdGhpcy5sb2dnZXIud2FybihgZGlkIG5vdCBzYXZlIGtleSBcIiR7a2V5fVwiIGFzIHRoZSBuYW1lc3BhY2UgXCIke25hbWVzcGFjZX1cIiB3YXMgbm90IHlldCBsb2FkZWRgLCAnVGhpcyBtZWFucyBzb21ldGhpbmcgSVMgV1JPTkcgaW4geW91ciBzZXR1cC4gWW91IGFjY2VzcyB0aGUgdCBmdW5jdGlvbiBiZWZvcmUgaTE4bmV4dC5pbml0IC8gaTE4bmV4dC5sb2FkTmFtZXNwYWNlIC8gaTE4bmV4dC5jaGFuZ2VMYW5ndWFnZSB3YXMgZG9uZS4gV2FpdCBmb3IgdGhlIGNhbGxiYWNrIG9yIFByb21pc2UgdG8gcmVzb2x2ZSBiZWZvcmUgYWNjZXNzaW5nIGl0ISEhJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChrZXkgPT09IHVuZGVmaW5lZCB8fCBrZXkgPT09IG51bGwgfHwga2V5ID09PSAnJykgcmV0dXJuO1xuICAgIGlmICh0aGlzLmJhY2tlbmQgJiYgdGhpcy5iYWNrZW5kLmNyZWF0ZSkge1xuICAgICAgY29uc3Qgb3B0cyA9IHtcbiAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgaXNVcGRhdGVcbiAgICAgIH07XG4gICAgICBjb25zdCBmYyA9IHRoaXMuYmFja2VuZC5jcmVhdGUuYmluZCh0aGlzLmJhY2tlbmQpO1xuICAgICAgaWYgKGZjLmxlbmd0aCA8IDYpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBsZXQgcjtcbiAgICAgICAgICBpZiAoZmMubGVuZ3RoID09PSA1KSB7XG4gICAgICAgICAgICByID0gZmMobGFuZ3VhZ2VzLCBuYW1lc3BhY2UsIGtleSwgZmFsbGJhY2tWYWx1ZSwgb3B0cyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHIgPSBmYyhsYW5ndWFnZXMsIG5hbWVzcGFjZSwga2V5LCBmYWxsYmFja1ZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHIgJiYgdHlwZW9mIHIudGhlbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgci50aGVuKGRhdGEgPT4gY2xiKG51bGwsIGRhdGEpKS5jYXRjaChjbGIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjbGIobnVsbCwgcik7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICBjbGIoZXJyKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZmMobGFuZ3VhZ2VzLCBuYW1lc3BhY2UsIGtleSwgZmFsbGJhY2tWYWx1ZSwgY2xiLCBvcHRzKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFsYW5ndWFnZXMgfHwgIWxhbmd1YWdlc1swXSkgcmV0dXJuO1xuICAgIHRoaXMuc3RvcmUuYWRkUmVzb3VyY2UobGFuZ3VhZ2VzWzBdLCBuYW1lc3BhY2UsIGtleSwgZmFsbGJhY2tWYWx1ZSk7XG4gIH1cbn1cblxuY29uc3QgZ2V0ID0gKCkgPT4gKHtcbiAgZGVidWc6IGZhbHNlLFxuICBpbml0SW1tZWRpYXRlOiB0cnVlLFxuICBuczogWyd0cmFuc2xhdGlvbiddLFxuICBkZWZhdWx0TlM6IFsndHJhbnNsYXRpb24nXSxcbiAgZmFsbGJhY2tMbmc6IFsnZGV2J10sXG4gIGZhbGxiYWNrTlM6IGZhbHNlLFxuICBzdXBwb3J0ZWRMbmdzOiBmYWxzZSxcbiAgbm9uRXhwbGljaXRTdXBwb3J0ZWRMbmdzOiBmYWxzZSxcbiAgbG9hZDogJ2FsbCcsXG4gIHByZWxvYWQ6IGZhbHNlLFxuICBzaW1wbGlmeVBsdXJhbFN1ZmZpeDogdHJ1ZSxcbiAga2V5U2VwYXJhdG9yOiAnLicsXG4gIG5zU2VwYXJhdG9yOiAnOicsXG4gIHBsdXJhbFNlcGFyYXRvcjogJ18nLFxuICBjb250ZXh0U2VwYXJhdG9yOiAnXycsXG4gIHBhcnRpYWxCdW5kbGVkTGFuZ3VhZ2VzOiBmYWxzZSxcbiAgc2F2ZU1pc3Npbmc6IGZhbHNlLFxuICB1cGRhdGVNaXNzaW5nOiBmYWxzZSxcbiAgc2F2ZU1pc3NpbmdUbzogJ2ZhbGxiYWNrJyxcbiAgc2F2ZU1pc3NpbmdQbHVyYWxzOiB0cnVlLFxuICBtaXNzaW5nS2V5SGFuZGxlcjogZmFsc2UsXG4gIG1pc3NpbmdJbnRlcnBvbGF0aW9uSGFuZGxlcjogZmFsc2UsXG4gIHBvc3RQcm9jZXNzOiBmYWxzZSxcbiAgcG9zdFByb2Nlc3NQYXNzUmVzb2x2ZWQ6IGZhbHNlLFxuICByZXR1cm5OdWxsOiBmYWxzZSxcbiAgcmV0dXJuRW1wdHlTdHJpbmc6IHRydWUsXG4gIHJldHVybk9iamVjdHM6IGZhbHNlLFxuICBqb2luQXJyYXlzOiBmYWxzZSxcbiAgcmV0dXJuZWRPYmplY3RIYW5kbGVyOiBmYWxzZSxcbiAgcGFyc2VNaXNzaW5nS2V5SGFuZGxlcjogZmFsc2UsXG4gIGFwcGVuZE5hbWVzcGFjZVRvTWlzc2luZ0tleTogZmFsc2UsXG4gIGFwcGVuZE5hbWVzcGFjZVRvQ0lNb2RlOiBmYWxzZSxcbiAgb3ZlcmxvYWRUcmFuc2xhdGlvbk9wdGlvbkhhbmRsZXI6IGFyZ3MgPT4ge1xuICAgIGxldCByZXQgPSB7fTtcbiAgICBpZiAodHlwZW9mIGFyZ3NbMV0gPT09ICdvYmplY3QnKSByZXQgPSBhcmdzWzFdO1xuICAgIGlmICh0eXBlb2YgYXJnc1sxXSA9PT0gJ3N0cmluZycpIHJldC5kZWZhdWx0VmFsdWUgPSBhcmdzWzFdO1xuICAgIGlmICh0eXBlb2YgYXJnc1syXSA9PT0gJ3N0cmluZycpIHJldC50RGVzY3JpcHRpb24gPSBhcmdzWzJdO1xuICAgIGlmICh0eXBlb2YgYXJnc1syXSA9PT0gJ29iamVjdCcgfHwgdHlwZW9mIGFyZ3NbM10gPT09ICdvYmplY3QnKSB7XG4gICAgICBjb25zdCBvcHRpb25zID0gYXJnc1szXSB8fCBhcmdzWzJdO1xuICAgICAgT2JqZWN0LmtleXMob3B0aW9ucykuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICByZXRba2V5XSA9IG9wdGlvbnNba2V5XTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9LFxuICBpbnRlcnBvbGF0aW9uOiB7XG4gICAgZXNjYXBlVmFsdWU6IHRydWUsXG4gICAgZm9ybWF0OiB2YWx1ZSA9PiB2YWx1ZSxcbiAgICBwcmVmaXg6ICd7eycsXG4gICAgc3VmZml4OiAnfX0nLFxuICAgIGZvcm1hdFNlcGFyYXRvcjogJywnLFxuICAgIHVuZXNjYXBlUHJlZml4OiAnLScsXG4gICAgbmVzdGluZ1ByZWZpeDogJyR0KCcsXG4gICAgbmVzdGluZ1N1ZmZpeDogJyknLFxuICAgIG5lc3RpbmdPcHRpb25zU2VwYXJhdG9yOiAnLCcsXG4gICAgbWF4UmVwbGFjZXM6IDEwMDAsXG4gICAgc2tpcE9uVmFyaWFibGVzOiB0cnVlXG4gIH1cbn0pO1xuY29uc3QgdHJhbnNmb3JtT3B0aW9ucyA9IG9wdGlvbnMgPT4ge1xuICBpZiAodHlwZW9mIG9wdGlvbnMubnMgPT09ICdzdHJpbmcnKSBvcHRpb25zLm5zID0gW29wdGlvbnMubnNdO1xuICBpZiAodHlwZW9mIG9wdGlvbnMuZmFsbGJhY2tMbmcgPT09ICdzdHJpbmcnKSBvcHRpb25zLmZhbGxiYWNrTG5nID0gW29wdGlvbnMuZmFsbGJhY2tMbmddO1xuICBpZiAodHlwZW9mIG9wdGlvbnMuZmFsbGJhY2tOUyA9PT0gJ3N0cmluZycpIG9wdGlvbnMuZmFsbGJhY2tOUyA9IFtvcHRpb25zLmZhbGxiYWNrTlNdO1xuICBpZiAob3B0aW9ucy5zdXBwb3J0ZWRMbmdzICYmIG9wdGlvbnMuc3VwcG9ydGVkTG5ncy5pbmRleE9mKCdjaW1vZGUnKSA8IDApIHtcbiAgICBvcHRpb25zLnN1cHBvcnRlZExuZ3MgPSBvcHRpb25zLnN1cHBvcnRlZExuZ3MuY29uY2F0KFsnY2ltb2RlJ10pO1xuICB9XG4gIHJldHVybiBvcHRpb25zO1xufTtcblxuY29uc3Qgbm9vcCA9ICgpID0+IHt9O1xuY29uc3QgYmluZE1lbWJlckZ1bmN0aW9ucyA9IGluc3QgPT4ge1xuICBjb25zdCBtZW1zID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoT2JqZWN0LmdldFByb3RvdHlwZU9mKGluc3QpKTtcbiAgbWVtcy5mb3JFYWNoKG1lbSA9PiB7XG4gICAgaWYgKHR5cGVvZiBpbnN0W21lbV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGluc3RbbWVtXSA9IGluc3RbbWVtXS5iaW5kKGluc3QpO1xuICAgIH1cbiAgfSk7XG59O1xuY2xhc3MgSTE4biBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiB7fTtcbiAgICBsZXQgY2FsbGJhY2sgPSBhcmd1bWVudHMubGVuZ3RoID4gMSA/IGFyZ3VtZW50c1sxXSA6IHVuZGVmaW5lZDtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMub3B0aW9ucyA9IHRyYW5zZm9ybU9wdGlvbnMob3B0aW9ucyk7XG4gICAgdGhpcy5zZXJ2aWNlcyA9IHt9O1xuICAgIHRoaXMubG9nZ2VyID0gYmFzZUxvZ2dlcjtcbiAgICB0aGlzLm1vZHVsZXMgPSB7XG4gICAgICBleHRlcm5hbDogW11cbiAgICB9O1xuICAgIGJpbmRNZW1iZXJGdW5jdGlvbnModGhpcyk7XG4gICAgaWYgKGNhbGxiYWNrICYmICF0aGlzLmlzSW5pdGlhbGl6ZWQgJiYgIW9wdGlvbnMuaXNDbG9uZSkge1xuICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuaW5pdEltbWVkaWF0ZSkge1xuICAgICAgICB0aGlzLmluaXQob3B0aW9ucywgY2FsbGJhY2spO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLmluaXQob3B0aW9ucywgY2FsbGJhY2spO1xuICAgICAgfSwgMCk7XG4gICAgfVxuICB9XG4gIGluaXQoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDoge307XG4gICAgbGV0IGNhbGxiYWNrID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgPyBhcmd1bWVudHNbMV0gOiB1bmRlZmluZWQ7XG4gICAgdGhpcy5pc0luaXRpYWxpemluZyA9IHRydWU7XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjYWxsYmFjayA9IG9wdGlvbnM7XG4gICAgICBvcHRpb25zID0ge307XG4gICAgfVxuICAgIGlmICghb3B0aW9ucy5kZWZhdWx0TlMgJiYgb3B0aW9ucy5kZWZhdWx0TlMgIT09IGZhbHNlICYmIG9wdGlvbnMubnMpIHtcbiAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5ucyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgb3B0aW9ucy5kZWZhdWx0TlMgPSBvcHRpb25zLm5zO1xuICAgICAgfSBlbHNlIGlmIChvcHRpb25zLm5zLmluZGV4T2YoJ3RyYW5zbGF0aW9uJykgPCAwKSB7XG4gICAgICAgIG9wdGlvbnMuZGVmYXVsdE5TID0gb3B0aW9ucy5uc1swXTtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgZGVmT3B0cyA9IGdldCgpO1xuICAgIHRoaXMub3B0aW9ucyA9IHtcbiAgICAgIC4uLmRlZk9wdHMsXG4gICAgICAuLi50aGlzLm9wdGlvbnMsXG4gICAgICAuLi50cmFuc2Zvcm1PcHRpb25zKG9wdGlvbnMpXG4gICAgfTtcbiAgICBpZiAodGhpcy5vcHRpb25zLmNvbXBhdGliaWxpdHlBUEkgIT09ICd2MScpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5pbnRlcnBvbGF0aW9uID0ge1xuICAgICAgICAuLi5kZWZPcHRzLmludGVycG9sYXRpb24sXG4gICAgICAgIC4uLnRoaXMub3B0aW9ucy5pbnRlcnBvbGF0aW9uXG4gICAgICB9O1xuICAgIH1cbiAgICBpZiAob3B0aW9ucy5rZXlTZXBhcmF0b3IgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5vcHRpb25zLnVzZXJEZWZpbmVkS2V5U2VwYXJhdG9yID0gb3B0aW9ucy5rZXlTZXBhcmF0b3I7XG4gICAgfVxuICAgIGlmIChvcHRpb25zLm5zU2VwYXJhdG9yICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMub3B0aW9ucy51c2VyRGVmaW5lZE5zU2VwYXJhdG9yID0gb3B0aW9ucy5uc1NlcGFyYXRvcjtcbiAgICB9XG4gICAgY29uc3QgY3JlYXRlQ2xhc3NPbkRlbWFuZCA9IENsYXNzT3JPYmplY3QgPT4ge1xuICAgICAgaWYgKCFDbGFzc09yT2JqZWN0KSByZXR1cm4gbnVsbDtcbiAgICAgIGlmICh0eXBlb2YgQ2xhc3NPck9iamVjdCA9PT0gJ2Z1bmN0aW9uJykgcmV0dXJuIG5ldyBDbGFzc09yT2JqZWN0KCk7XG4gICAgICByZXR1cm4gQ2xhc3NPck9iamVjdDtcbiAgICB9O1xuICAgIGlmICghdGhpcy5vcHRpb25zLmlzQ2xvbmUpIHtcbiAgICAgIGlmICh0aGlzLm1vZHVsZXMubG9nZ2VyKSB7XG4gICAgICAgIGJhc2VMb2dnZXIuaW5pdChjcmVhdGVDbGFzc09uRGVtYW5kKHRoaXMubW9kdWxlcy5sb2dnZXIpLCB0aGlzLm9wdGlvbnMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYmFzZUxvZ2dlci5pbml0KG51bGwsIHRoaXMub3B0aW9ucyk7XG4gICAgICB9XG4gICAgICBsZXQgZm9ybWF0dGVyO1xuICAgICAgaWYgKHRoaXMubW9kdWxlcy5mb3JtYXR0ZXIpIHtcbiAgICAgICAgZm9ybWF0dGVyID0gdGhpcy5tb2R1bGVzLmZvcm1hdHRlcjtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIEludGwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGZvcm1hdHRlciA9IEZvcm1hdHRlcjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGx1ID0gbmV3IExhbmd1YWdlVXRpbCh0aGlzLm9wdGlvbnMpO1xuICAgICAgdGhpcy5zdG9yZSA9IG5ldyBSZXNvdXJjZVN0b3JlKHRoaXMub3B0aW9ucy5yZXNvdXJjZXMsIHRoaXMub3B0aW9ucyk7XG4gICAgICBjb25zdCBzID0gdGhpcy5zZXJ2aWNlcztcbiAgICAgIHMubG9nZ2VyID0gYmFzZUxvZ2dlcjtcbiAgICAgIHMucmVzb3VyY2VTdG9yZSA9IHRoaXMuc3RvcmU7XG4gICAgICBzLmxhbmd1YWdlVXRpbHMgPSBsdTtcbiAgICAgIHMucGx1cmFsUmVzb2x2ZXIgPSBuZXcgUGx1cmFsUmVzb2x2ZXIobHUsIHtcbiAgICAgICAgcHJlcGVuZDogdGhpcy5vcHRpb25zLnBsdXJhbFNlcGFyYXRvcixcbiAgICAgICAgY29tcGF0aWJpbGl0eUpTT046IHRoaXMub3B0aW9ucy5jb21wYXRpYmlsaXR5SlNPTixcbiAgICAgICAgc2ltcGxpZnlQbHVyYWxTdWZmaXg6IHRoaXMub3B0aW9ucy5zaW1wbGlmeVBsdXJhbFN1ZmZpeFxuICAgICAgfSk7XG4gICAgICBpZiAoZm9ybWF0dGVyICYmICghdGhpcy5vcHRpb25zLmludGVycG9sYXRpb24uZm9ybWF0IHx8IHRoaXMub3B0aW9ucy5pbnRlcnBvbGF0aW9uLmZvcm1hdCA9PT0gZGVmT3B0cy5pbnRlcnBvbGF0aW9uLmZvcm1hdCkpIHtcbiAgICAgICAgcy5mb3JtYXR0ZXIgPSBjcmVhdGVDbGFzc09uRGVtYW5kKGZvcm1hdHRlcik7XG4gICAgICAgIHMuZm9ybWF0dGVyLmluaXQocywgdGhpcy5vcHRpb25zKTtcbiAgICAgICAgdGhpcy5vcHRpb25zLmludGVycG9sYXRpb24uZm9ybWF0ID0gcy5mb3JtYXR0ZXIuZm9ybWF0LmJpbmQocy5mb3JtYXR0ZXIpO1xuICAgICAgfVxuICAgICAgcy5pbnRlcnBvbGF0b3IgPSBuZXcgSW50ZXJwb2xhdG9yKHRoaXMub3B0aW9ucyk7XG4gICAgICBzLnV0aWxzID0ge1xuICAgICAgICBoYXNMb2FkZWROYW1lc3BhY2U6IHRoaXMuaGFzTG9hZGVkTmFtZXNwYWNlLmJpbmQodGhpcylcbiAgICAgIH07XG4gICAgICBzLmJhY2tlbmRDb25uZWN0b3IgPSBuZXcgQ29ubmVjdG9yKGNyZWF0ZUNsYXNzT25EZW1hbmQodGhpcy5tb2R1bGVzLmJhY2tlbmQpLCBzLnJlc291cmNlU3RvcmUsIHMsIHRoaXMub3B0aW9ucyk7XG4gICAgICBzLmJhY2tlbmRDb25uZWN0b3Iub24oJyonLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgZm9yICh2YXIgX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBuZXcgQXJyYXkoX2xlbiA+IDEgPyBfbGVuIC0gMSA6IDApLCBfa2V5ID0gMTsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgICAgICAgIGFyZ3NbX2tleSAtIDFdID0gYXJndW1lbnRzW19rZXldO1xuICAgICAgICB9XG4gICAgICAgIF90aGlzLmVtaXQoZXZlbnQsIC4uLmFyZ3MpO1xuICAgICAgfSk7XG4gICAgICBpZiAodGhpcy5tb2R1bGVzLmxhbmd1YWdlRGV0ZWN0b3IpIHtcbiAgICAgICAgcy5sYW5ndWFnZURldGVjdG9yID0gY3JlYXRlQ2xhc3NPbkRlbWFuZCh0aGlzLm1vZHVsZXMubGFuZ3VhZ2VEZXRlY3Rvcik7XG4gICAgICAgIGlmIChzLmxhbmd1YWdlRGV0ZWN0b3IuaW5pdCkgcy5sYW5ndWFnZURldGVjdG9yLmluaXQocywgdGhpcy5vcHRpb25zLmRldGVjdGlvbiwgdGhpcy5vcHRpb25zKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLm1vZHVsZXMuaTE4bkZvcm1hdCkge1xuICAgICAgICBzLmkxOG5Gb3JtYXQgPSBjcmVhdGVDbGFzc09uRGVtYW5kKHRoaXMubW9kdWxlcy5pMThuRm9ybWF0KTtcbiAgICAgICAgaWYgKHMuaTE4bkZvcm1hdC5pbml0KSBzLmkxOG5Gb3JtYXQuaW5pdCh0aGlzKTtcbiAgICAgIH1cbiAgICAgIHRoaXMudHJhbnNsYXRvciA9IG5ldyBUcmFuc2xhdG9yKHRoaXMuc2VydmljZXMsIHRoaXMub3B0aW9ucyk7XG4gICAgICB0aGlzLnRyYW5zbGF0b3Iub24oJyonLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgZm9yICh2YXIgX2xlbjIgPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gbmV3IEFycmF5KF9sZW4yID4gMSA/IF9sZW4yIC0gMSA6IDApLCBfa2V5MiA9IDE7IF9rZXkyIDwgX2xlbjI7IF9rZXkyKyspIHtcbiAgICAgICAgICBhcmdzW19rZXkyIC0gMV0gPSBhcmd1bWVudHNbX2tleTJdO1xuICAgICAgICB9XG4gICAgICAgIF90aGlzLmVtaXQoZXZlbnQsIC4uLmFyZ3MpO1xuICAgICAgfSk7XG4gICAgICB0aGlzLm1vZHVsZXMuZXh0ZXJuYWwuZm9yRWFjaChtID0+IHtcbiAgICAgICAgaWYgKG0uaW5pdCkgbS5pbml0KHRoaXMpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHRoaXMuZm9ybWF0ID0gdGhpcy5vcHRpb25zLmludGVycG9sYXRpb24uZm9ybWF0O1xuICAgIGlmICghY2FsbGJhY2spIGNhbGxiYWNrID0gbm9vcDtcbiAgICBpZiAodGhpcy5vcHRpb25zLmZhbGxiYWNrTG5nICYmICF0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IgJiYgIXRoaXMub3B0aW9ucy5sbmcpIHtcbiAgICAgIGNvbnN0IGNvZGVzID0gdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZVV0aWxzLmdldEZhbGxiYWNrQ29kZXModGhpcy5vcHRpb25zLmZhbGxiYWNrTG5nKTtcbiAgICAgIGlmIChjb2Rlcy5sZW5ndGggPiAwICYmIGNvZGVzWzBdICE9PSAnZGV2JykgdGhpcy5vcHRpb25zLmxuZyA9IGNvZGVzWzBdO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuc2VydmljZXMubGFuZ3VhZ2VEZXRlY3RvciAmJiAhdGhpcy5vcHRpb25zLmxuZykge1xuICAgICAgdGhpcy5sb2dnZXIud2FybignaW5pdDogbm8gbGFuZ3VhZ2VEZXRlY3RvciBpcyB1c2VkIGFuZCBubyBsbmcgaXMgZGVmaW5lZCcpO1xuICAgIH1cbiAgICBjb25zdCBzdG9yZUFwaSA9IFsnZ2V0UmVzb3VyY2UnLCAnaGFzUmVzb3VyY2VCdW5kbGUnLCAnZ2V0UmVzb3VyY2VCdW5kbGUnLCAnZ2V0RGF0YUJ5TGFuZ3VhZ2UnXTtcbiAgICBzdG9yZUFwaS5mb3JFYWNoKGZjTmFtZSA9PiB7XG4gICAgICB0aGlzW2ZjTmFtZV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBfdGhpcy5zdG9yZVtmY05hbWVdKC4uLmFyZ3VtZW50cyk7XG4gICAgICB9O1xuICAgIH0pO1xuICAgIGNvbnN0IHN0b3JlQXBpQ2hhaW5lZCA9IFsnYWRkUmVzb3VyY2UnLCAnYWRkUmVzb3VyY2VzJywgJ2FkZFJlc291cmNlQnVuZGxlJywgJ3JlbW92ZVJlc291cmNlQnVuZGxlJ107XG4gICAgc3RvcmVBcGlDaGFpbmVkLmZvckVhY2goZmNOYW1lID0+IHtcbiAgICAgIHRoaXNbZmNOYW1lXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgX3RoaXMuc3RvcmVbZmNOYW1lXSguLi5hcmd1bWVudHMpO1xuICAgICAgICByZXR1cm4gX3RoaXM7XG4gICAgICB9O1xuICAgIH0pO1xuICAgIGNvbnN0IGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBjb25zdCBsb2FkID0gKCkgPT4ge1xuICAgICAgY29uc3QgZmluaXNoID0gKGVyciwgdCkgPT4ge1xuICAgICAgICB0aGlzLmlzSW5pdGlhbGl6aW5nID0gZmFsc2U7XG4gICAgICAgIGlmICh0aGlzLmlzSW5pdGlhbGl6ZWQgJiYgIXRoaXMuaW5pdGlhbGl6ZWRTdG9yZU9uY2UpIHRoaXMubG9nZ2VyLndhcm4oJ2luaXQ6IGkxOG5leHQgaXMgYWxyZWFkeSBpbml0aWFsaXplZC4gWW91IHNob3VsZCBjYWxsIGluaXQganVzdCBvbmNlIScpO1xuICAgICAgICB0aGlzLmlzSW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5pc0Nsb25lKSB0aGlzLmxvZ2dlci5sb2coJ2luaXRpYWxpemVkJywgdGhpcy5vcHRpb25zKTtcbiAgICAgICAgdGhpcy5lbWl0KCdpbml0aWFsaXplZCcsIHRoaXMub3B0aW9ucyk7XG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUodCk7XG4gICAgICAgIGNhbGxiYWNrKGVyciwgdCk7XG4gICAgICB9O1xuICAgICAgaWYgKHRoaXMubGFuZ3VhZ2VzICYmIHRoaXMub3B0aW9ucy5jb21wYXRpYmlsaXR5QVBJICE9PSAndjEnICYmICF0aGlzLmlzSW5pdGlhbGl6ZWQpIHJldHVybiBmaW5pc2gobnVsbCwgdGhpcy50LmJpbmQodGhpcykpO1xuICAgICAgdGhpcy5jaGFuZ2VMYW5ndWFnZSh0aGlzLm9wdGlvbnMubG5nLCBmaW5pc2gpO1xuICAgIH07XG4gICAgaWYgKHRoaXMub3B0aW9ucy5yZXNvdXJjZXMgfHwgIXRoaXMub3B0aW9ucy5pbml0SW1tZWRpYXRlKSB7XG4gICAgICBsb2FkKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNldFRpbWVvdXQobG9hZCwgMCk7XG4gICAgfVxuICAgIHJldHVybiBkZWZlcnJlZDtcbiAgfVxuICBsb2FkUmVzb3VyY2VzKGxhbmd1YWdlKSB7XG4gICAgbGV0IGNhbGxiYWNrID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiBub29wO1xuICAgIGxldCB1c2VkQ2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICBjb25zdCB1c2VkTG5nID0gdHlwZW9mIGxhbmd1YWdlID09PSAnc3RyaW5nJyA/IGxhbmd1YWdlIDogdGhpcy5sYW5ndWFnZTtcbiAgICBpZiAodHlwZW9mIGxhbmd1YWdlID09PSAnZnVuY3Rpb24nKSB1c2VkQ2FsbGJhY2sgPSBsYW5ndWFnZTtcbiAgICBpZiAoIXRoaXMub3B0aW9ucy5yZXNvdXJjZXMgfHwgdGhpcy5vcHRpb25zLnBhcnRpYWxCdW5kbGVkTGFuZ3VhZ2VzKSB7XG4gICAgICBpZiAodXNlZExuZyAmJiB1c2VkTG5nLnRvTG93ZXJDYXNlKCkgPT09ICdjaW1vZGUnICYmICghdGhpcy5vcHRpb25zLnByZWxvYWQgfHwgdGhpcy5vcHRpb25zLnByZWxvYWQubGVuZ3RoID09PSAwKSkgcmV0dXJuIHVzZWRDYWxsYmFjaygpO1xuICAgICAgY29uc3QgdG9Mb2FkID0gW107XG4gICAgICBjb25zdCBhcHBlbmQgPSBsbmcgPT4ge1xuICAgICAgICBpZiAoIWxuZykgcmV0dXJuO1xuICAgICAgICBpZiAobG5nID09PSAnY2ltb2RlJykgcmV0dXJuO1xuICAgICAgICBjb25zdCBsbmdzID0gdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZVV0aWxzLnRvUmVzb2x2ZUhpZXJhcmNoeShsbmcpO1xuICAgICAgICBsbmdzLmZvckVhY2gobCA9PiB7XG4gICAgICAgICAgaWYgKGwgPT09ICdjaW1vZGUnKSByZXR1cm47XG4gICAgICAgICAgaWYgKHRvTG9hZC5pbmRleE9mKGwpIDwgMCkgdG9Mb2FkLnB1c2gobCk7XG4gICAgICAgIH0pO1xuICAgICAgfTtcbiAgICAgIGlmICghdXNlZExuZykge1xuICAgICAgICBjb25zdCBmYWxsYmFja3MgPSB0aGlzLnNlcnZpY2VzLmxhbmd1YWdlVXRpbHMuZ2V0RmFsbGJhY2tDb2Rlcyh0aGlzLm9wdGlvbnMuZmFsbGJhY2tMbmcpO1xuICAgICAgICBmYWxsYmFja3MuZm9yRWFjaChsID0+IGFwcGVuZChsKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhcHBlbmQodXNlZExuZyk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5vcHRpb25zLnByZWxvYWQpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLnByZWxvYWQuZm9yRWFjaChsID0+IGFwcGVuZChsKSk7XG4gICAgICB9XG4gICAgICB0aGlzLnNlcnZpY2VzLmJhY2tlbmRDb25uZWN0b3IubG9hZCh0b0xvYWQsIHRoaXMub3B0aW9ucy5ucywgZSA9PiB7XG4gICAgICAgIGlmICghZSAmJiAhdGhpcy5yZXNvbHZlZExhbmd1YWdlICYmIHRoaXMubGFuZ3VhZ2UpIHRoaXMuc2V0UmVzb2x2ZWRMYW5ndWFnZSh0aGlzLmxhbmd1YWdlKTtcbiAgICAgICAgdXNlZENhbGxiYWNrKGUpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHVzZWRDYWxsYmFjayhudWxsKTtcbiAgICB9XG4gIH1cbiAgcmVsb2FkUmVzb3VyY2VzKGxuZ3MsIG5zLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBpZiAoIWxuZ3MpIGxuZ3MgPSB0aGlzLmxhbmd1YWdlcztcbiAgICBpZiAoIW5zKSBucyA9IHRoaXMub3B0aW9ucy5ucztcbiAgICBpZiAoIWNhbGxiYWNrKSBjYWxsYmFjayA9IG5vb3A7XG4gICAgdGhpcy5zZXJ2aWNlcy5iYWNrZW5kQ29ubmVjdG9yLnJlbG9hZChsbmdzLCBucywgZXJyID0+IHtcbiAgICAgIGRlZmVycmVkLnJlc29sdmUoKTtcbiAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgfSk7XG4gICAgcmV0dXJuIGRlZmVycmVkO1xuICB9XG4gIHVzZShtb2R1bGUpIHtcbiAgICBpZiAoIW1vZHVsZSkgdGhyb3cgbmV3IEVycm9yKCdZb3UgYXJlIHBhc3NpbmcgYW4gdW5kZWZpbmVkIG1vZHVsZSEgUGxlYXNlIGNoZWNrIHRoZSBvYmplY3QgeW91IGFyZSBwYXNzaW5nIHRvIGkxOG5leHQudXNlKCknKTtcbiAgICBpZiAoIW1vZHVsZS50eXBlKSB0aHJvdyBuZXcgRXJyb3IoJ1lvdSBhcmUgcGFzc2luZyBhIHdyb25nIG1vZHVsZSEgUGxlYXNlIGNoZWNrIHRoZSBvYmplY3QgeW91IGFyZSBwYXNzaW5nIHRvIGkxOG5leHQudXNlKCknKTtcbiAgICBpZiAobW9kdWxlLnR5cGUgPT09ICdiYWNrZW5kJykge1xuICAgICAgdGhpcy5tb2R1bGVzLmJhY2tlbmQgPSBtb2R1bGU7XG4gICAgfVxuICAgIGlmIChtb2R1bGUudHlwZSA9PT0gJ2xvZ2dlcicgfHwgbW9kdWxlLmxvZyAmJiBtb2R1bGUud2FybiAmJiBtb2R1bGUuZXJyb3IpIHtcbiAgICAgIHRoaXMubW9kdWxlcy5sb2dnZXIgPSBtb2R1bGU7XG4gICAgfVxuICAgIGlmIChtb2R1bGUudHlwZSA9PT0gJ2xhbmd1YWdlRGV0ZWN0b3InKSB7XG4gICAgICB0aGlzLm1vZHVsZXMubGFuZ3VhZ2VEZXRlY3RvciA9IG1vZHVsZTtcbiAgICB9XG4gICAgaWYgKG1vZHVsZS50eXBlID09PSAnaTE4bkZvcm1hdCcpIHtcbiAgICAgIHRoaXMubW9kdWxlcy5pMThuRm9ybWF0ID0gbW9kdWxlO1xuICAgIH1cbiAgICBpZiAobW9kdWxlLnR5cGUgPT09ICdwb3N0UHJvY2Vzc29yJykge1xuICAgICAgcG9zdFByb2Nlc3Nvci5hZGRQb3N0UHJvY2Vzc29yKG1vZHVsZSk7XG4gICAgfVxuICAgIGlmIChtb2R1bGUudHlwZSA9PT0gJ2Zvcm1hdHRlcicpIHtcbiAgICAgIHRoaXMubW9kdWxlcy5mb3JtYXR0ZXIgPSBtb2R1bGU7XG4gICAgfVxuICAgIGlmIChtb2R1bGUudHlwZSA9PT0gJzNyZFBhcnR5Jykge1xuICAgICAgdGhpcy5tb2R1bGVzLmV4dGVybmFsLnB1c2gobW9kdWxlKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgc2V0UmVzb2x2ZWRMYW5ndWFnZShsKSB7XG4gICAgaWYgKCFsIHx8ICF0aGlzLmxhbmd1YWdlcykgcmV0dXJuO1xuICAgIGlmIChbJ2NpbW9kZScsICdkZXYnXS5pbmRleE9mKGwpID4gLTEpIHJldHVybjtcbiAgICBmb3IgKGxldCBsaSA9IDA7IGxpIDwgdGhpcy5sYW5ndWFnZXMubGVuZ3RoOyBsaSsrKSB7XG4gICAgICBjb25zdCBsbmdJbkxuZ3MgPSB0aGlzLmxhbmd1YWdlc1tsaV07XG4gICAgICBpZiAoWydjaW1vZGUnLCAnZGV2J10uaW5kZXhPZihsbmdJbkxuZ3MpID4gLTEpIGNvbnRpbnVlO1xuICAgICAgaWYgKHRoaXMuc3RvcmUuaGFzTGFuZ3VhZ2VTb21lVHJhbnNsYXRpb25zKGxuZ0luTG5ncykpIHtcbiAgICAgICAgdGhpcy5yZXNvbHZlZExhbmd1YWdlID0gbG5nSW5MbmdzO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgY2hhbmdlTGFuZ3VhZ2UobG5nLCBjYWxsYmFjaykge1xuICAgIHZhciBfdGhpczIgPSB0aGlzO1xuICAgIHRoaXMuaXNMYW5ndWFnZUNoYW5naW5nVG8gPSBsbmc7XG4gICAgY29uc3QgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIHRoaXMuZW1pdCgnbGFuZ3VhZ2VDaGFuZ2luZycsIGxuZyk7XG4gICAgY29uc3Qgc2V0TG5nUHJvcHMgPSBsID0+IHtcbiAgICAgIHRoaXMubGFuZ3VhZ2UgPSBsO1xuICAgICAgdGhpcy5sYW5ndWFnZXMgPSB0aGlzLnNlcnZpY2VzLmxhbmd1YWdlVXRpbHMudG9SZXNvbHZlSGllcmFyY2h5KGwpO1xuICAgICAgdGhpcy5yZXNvbHZlZExhbmd1YWdlID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5zZXRSZXNvbHZlZExhbmd1YWdlKGwpO1xuICAgIH07XG4gICAgY29uc3QgZG9uZSA9IChlcnIsIGwpID0+IHtcbiAgICAgIGlmIChsKSB7XG4gICAgICAgIHNldExuZ1Byb3BzKGwpO1xuICAgICAgICB0aGlzLnRyYW5zbGF0b3IuY2hhbmdlTGFuZ3VhZ2UobCk7XG4gICAgICAgIHRoaXMuaXNMYW5ndWFnZUNoYW5naW5nVG8gPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuZW1pdCgnbGFuZ3VhZ2VDaGFuZ2VkJywgbCk7XG4gICAgICAgIHRoaXMubG9nZ2VyLmxvZygnbGFuZ3VhZ2VDaGFuZ2VkJywgbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmlzTGFuZ3VhZ2VDaGFuZ2luZ1RvID0gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgICAgZGVmZXJyZWQucmVzb2x2ZShmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBfdGhpczIudCguLi5hcmd1bWVudHMpO1xuICAgICAgfSk7XG4gICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKGVyciwgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gX3RoaXMyLnQoLi4uYXJndW1lbnRzKTtcbiAgICAgIH0pO1xuICAgIH07XG4gICAgY29uc3Qgc2V0TG5nID0gbG5ncyA9PiB7XG4gICAgICBpZiAoIWxuZyAmJiAhbG5ncyAmJiB0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IpIGxuZ3MgPSBbXTtcbiAgICAgIGNvbnN0IGwgPSB0eXBlb2YgbG5ncyA9PT0gJ3N0cmluZycgPyBsbmdzIDogdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZVV0aWxzLmdldEJlc3RNYXRjaEZyb21Db2RlcyhsbmdzKTtcbiAgICAgIGlmIChsKSB7XG4gICAgICAgIGlmICghdGhpcy5sYW5ndWFnZSkge1xuICAgICAgICAgIHNldExuZ1Byb3BzKGwpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy50cmFuc2xhdG9yLmxhbmd1YWdlKSB0aGlzLnRyYW5zbGF0b3IuY2hhbmdlTGFuZ3VhZ2UobCk7XG4gICAgICAgIGlmICh0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IgJiYgdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZURldGVjdG9yLmNhY2hlVXNlckxhbmd1YWdlKSB0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IuY2FjaGVVc2VyTGFuZ3VhZ2UobCk7XG4gICAgICB9XG4gICAgICB0aGlzLmxvYWRSZXNvdXJjZXMobCwgZXJyID0+IHtcbiAgICAgICAgZG9uZShlcnIsIGwpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgICBpZiAoIWxuZyAmJiB0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IgJiYgIXRoaXMuc2VydmljZXMubGFuZ3VhZ2VEZXRlY3Rvci5hc3luYykge1xuICAgICAgc2V0TG5nKHRoaXMuc2VydmljZXMubGFuZ3VhZ2VEZXRlY3Rvci5kZXRlY3QoKSk7XG4gICAgfSBlbHNlIGlmICghbG5nICYmIHRoaXMuc2VydmljZXMubGFuZ3VhZ2VEZXRlY3RvciAmJiB0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IuYXN5bmMpIHtcbiAgICAgIGlmICh0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IuZGV0ZWN0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICB0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IuZGV0ZWN0KCkudGhlbihzZXRMbmcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZURldGVjdG9yLmRldGVjdChzZXRMbmcpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzZXRMbmcobG5nKTtcbiAgICB9XG4gICAgcmV0dXJuIGRlZmVycmVkO1xuICB9XG4gIGdldEZpeGVkVChsbmcsIG5zLCBrZXlQcmVmaXgpIHtcbiAgICB2YXIgX3RoaXMzID0gdGhpcztcbiAgICBjb25zdCBmaXhlZFQgPSBmdW5jdGlvbiAoa2V5LCBvcHRzKSB7XG4gICAgICBsZXQgb3B0aW9ucztcbiAgICAgIGlmICh0eXBlb2Ygb3B0cyAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgZm9yICh2YXIgX2xlbjMgPSBhcmd1bWVudHMubGVuZ3RoLCByZXN0ID0gbmV3IEFycmF5KF9sZW4zID4gMiA/IF9sZW4zIC0gMiA6IDApLCBfa2V5MyA9IDI7IF9rZXkzIDwgX2xlbjM7IF9rZXkzKyspIHtcbiAgICAgICAgICByZXN0W19rZXkzIC0gMl0gPSBhcmd1bWVudHNbX2tleTNdO1xuICAgICAgICB9XG4gICAgICAgIG9wdGlvbnMgPSBfdGhpczMub3B0aW9ucy5vdmVybG9hZFRyYW5zbGF0aW9uT3B0aW9uSGFuZGxlcihba2V5LCBvcHRzXS5jb25jYXQocmVzdCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3B0aW9ucyA9IHtcbiAgICAgICAgICAuLi5vcHRzXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBvcHRpb25zLmxuZyA9IG9wdGlvbnMubG5nIHx8IGZpeGVkVC5sbmc7XG4gICAgICBvcHRpb25zLmxuZ3MgPSBvcHRpb25zLmxuZ3MgfHwgZml4ZWRULmxuZ3M7XG4gICAgICBvcHRpb25zLm5zID0gb3B0aW9ucy5ucyB8fCBmaXhlZFQubnM7XG4gICAgICBpZiAob3B0aW9ucy5rZXlQcmVmaXggIT09ICcnKSBvcHRpb25zLmtleVByZWZpeCA9IG9wdGlvbnMua2V5UHJlZml4IHx8IGtleVByZWZpeCB8fCBmaXhlZFQua2V5UHJlZml4O1xuICAgICAgY29uc3Qga2V5U2VwYXJhdG9yID0gX3RoaXMzLm9wdGlvbnMua2V5U2VwYXJhdG9yIHx8ICcuJztcbiAgICAgIGxldCByZXN1bHRLZXk7XG4gICAgICBpZiAob3B0aW9ucy5rZXlQcmVmaXggJiYgQXJyYXkuaXNBcnJheShrZXkpKSB7XG4gICAgICAgIHJlc3VsdEtleSA9IGtleS5tYXAoayA9PiBgJHtvcHRpb25zLmtleVByZWZpeH0ke2tleVNlcGFyYXRvcn0ke2t9YCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHRLZXkgPSBvcHRpb25zLmtleVByZWZpeCA/IGAke29wdGlvbnMua2V5UHJlZml4fSR7a2V5U2VwYXJhdG9yfSR7a2V5fWAgOiBrZXk7XG4gICAgICB9XG4gICAgICByZXR1cm4gX3RoaXMzLnQocmVzdWx0S2V5LCBvcHRpb25zKTtcbiAgICB9O1xuICAgIGlmICh0eXBlb2YgbG5nID09PSAnc3RyaW5nJykge1xuICAgICAgZml4ZWRULmxuZyA9IGxuZztcbiAgICB9IGVsc2Uge1xuICAgICAgZml4ZWRULmxuZ3MgPSBsbmc7XG4gICAgfVxuICAgIGZpeGVkVC5ucyA9IG5zO1xuICAgIGZpeGVkVC5rZXlQcmVmaXggPSBrZXlQcmVmaXg7XG4gICAgcmV0dXJuIGZpeGVkVDtcbiAgfVxuICB0KCkge1xuICAgIHJldHVybiB0aGlzLnRyYW5zbGF0b3IgJiYgdGhpcy50cmFuc2xhdG9yLnRyYW5zbGF0ZSguLi5hcmd1bWVudHMpO1xuICB9XG4gIGV4aXN0cygpIHtcbiAgICByZXR1cm4gdGhpcy50cmFuc2xhdG9yICYmIHRoaXMudHJhbnNsYXRvci5leGlzdHMoLi4uYXJndW1lbnRzKTtcbiAgfVxuICBzZXREZWZhdWx0TmFtZXNwYWNlKG5zKSB7XG4gICAgdGhpcy5vcHRpb25zLmRlZmF1bHROUyA9IG5zO1xuICB9XG4gIGhhc0xvYWRlZE5hbWVzcGFjZShucykge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB7fTtcbiAgICBpZiAoIXRoaXMuaXNJbml0aWFsaXplZCkge1xuICAgICAgdGhpcy5sb2dnZXIud2FybignaGFzTG9hZGVkTmFtZXNwYWNlOiBpMThuZXh0IHdhcyBub3QgaW5pdGlhbGl6ZWQnLCB0aGlzLmxhbmd1YWdlcyk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICghdGhpcy5sYW5ndWFnZXMgfHwgIXRoaXMubGFuZ3VhZ2VzLmxlbmd0aCkge1xuICAgICAgdGhpcy5sb2dnZXIud2FybignaGFzTG9hZGVkTmFtZXNwYWNlOiBpMThuLmxhbmd1YWdlcyB3ZXJlIHVuZGVmaW5lZCBvciBlbXB0eScsIHRoaXMubGFuZ3VhZ2VzKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3QgbG5nID0gb3B0aW9ucy5sbmcgfHwgdGhpcy5yZXNvbHZlZExhbmd1YWdlIHx8IHRoaXMubGFuZ3VhZ2VzWzBdO1xuICAgIGNvbnN0IGZhbGxiYWNrTG5nID0gdGhpcy5vcHRpb25zID8gdGhpcy5vcHRpb25zLmZhbGxiYWNrTG5nIDogZmFsc2U7XG4gICAgY29uc3QgbGFzdExuZyA9IHRoaXMubGFuZ3VhZ2VzW3RoaXMubGFuZ3VhZ2VzLmxlbmd0aCAtIDFdO1xuICAgIGlmIChsbmcudG9Mb3dlckNhc2UoKSA9PT0gJ2NpbW9kZScpIHJldHVybiB0cnVlO1xuICAgIGNvbnN0IGxvYWROb3RQZW5kaW5nID0gKGwsIG4pID0+IHtcbiAgICAgIGNvbnN0IGxvYWRTdGF0ZSA9IHRoaXMuc2VydmljZXMuYmFja2VuZENvbm5lY3Rvci5zdGF0ZVtgJHtsfXwke259YF07XG4gICAgICByZXR1cm4gbG9hZFN0YXRlID09PSAtMSB8fCBsb2FkU3RhdGUgPT09IDI7XG4gICAgfTtcbiAgICBpZiAob3B0aW9ucy5wcmVjaGVjaykge1xuICAgICAgY29uc3QgcHJlUmVzdWx0ID0gb3B0aW9ucy5wcmVjaGVjayh0aGlzLCBsb2FkTm90UGVuZGluZyk7XG4gICAgICBpZiAocHJlUmVzdWx0ICE9PSB1bmRlZmluZWQpIHJldHVybiBwcmVSZXN1bHQ7XG4gICAgfVxuICAgIGlmICh0aGlzLmhhc1Jlc291cmNlQnVuZGxlKGxuZywgbnMpKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAoIXRoaXMuc2VydmljZXMuYmFja2VuZENvbm5lY3Rvci5iYWNrZW5kIHx8IHRoaXMub3B0aW9ucy5yZXNvdXJjZXMgJiYgIXRoaXMub3B0aW9ucy5wYXJ0aWFsQnVuZGxlZExhbmd1YWdlcykgcmV0dXJuIHRydWU7XG4gICAgaWYgKGxvYWROb3RQZW5kaW5nKGxuZywgbnMpICYmICghZmFsbGJhY2tMbmcgfHwgbG9hZE5vdFBlbmRpbmcobGFzdExuZywgbnMpKSkgcmV0dXJuIHRydWU7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGxvYWROYW1lc3BhY2VzKG5zLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBpZiAoIXRoaXMub3B0aW9ucy5ucykge1xuICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjaygpO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIG5zID09PSAnc3RyaW5nJykgbnMgPSBbbnNdO1xuICAgIG5zLmZvckVhY2gobiA9PiB7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLm5zLmluZGV4T2YobikgPCAwKSB0aGlzLm9wdGlvbnMubnMucHVzaChuKTtcbiAgICB9KTtcbiAgICB0aGlzLmxvYWRSZXNvdXJjZXMoZXJyID0+IHtcbiAgICAgIGRlZmVycmVkLnJlc29sdmUoKTtcbiAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soZXJyKTtcbiAgICB9KTtcbiAgICByZXR1cm4gZGVmZXJyZWQ7XG4gIH1cbiAgbG9hZExhbmd1YWdlcyhsbmdzLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBpZiAodHlwZW9mIGxuZ3MgPT09ICdzdHJpbmcnKSBsbmdzID0gW2xuZ3NdO1xuICAgIGNvbnN0IHByZWxvYWRlZCA9IHRoaXMub3B0aW9ucy5wcmVsb2FkIHx8IFtdO1xuICAgIGNvbnN0IG5ld0xuZ3MgPSBsbmdzLmZpbHRlcihsbmcgPT4gcHJlbG9hZGVkLmluZGV4T2YobG5nKSA8IDAgJiYgdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZVV0aWxzLmlzU3VwcG9ydGVkQ29kZShsbmcpKTtcbiAgICBpZiAoIW5ld0xuZ3MubGVuZ3RoKSB7XG4gICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKCk7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuICAgIHRoaXMub3B0aW9ucy5wcmVsb2FkID0gcHJlbG9hZGVkLmNvbmNhdChuZXdMbmdzKTtcbiAgICB0aGlzLmxvYWRSZXNvdXJjZXMoZXJyID0+IHtcbiAgICAgIGRlZmVycmVkLnJlc29sdmUoKTtcbiAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soZXJyKTtcbiAgICB9KTtcbiAgICByZXR1cm4gZGVmZXJyZWQ7XG4gIH1cbiAgZGlyKGxuZykge1xuICAgIGlmICghbG5nKSBsbmcgPSB0aGlzLnJlc29sdmVkTGFuZ3VhZ2UgfHwgKHRoaXMubGFuZ3VhZ2VzICYmIHRoaXMubGFuZ3VhZ2VzLmxlbmd0aCA+IDAgPyB0aGlzLmxhbmd1YWdlc1swXSA6IHRoaXMubGFuZ3VhZ2UpO1xuICAgIGlmICghbG5nKSByZXR1cm4gJ3J0bCc7XG4gICAgY29uc3QgcnRsTG5ncyA9IFsnYXInLCAnc2h1JywgJ3NxcicsICdzc2gnLCAneGFhJywgJ3loZCcsICd5dWQnLCAnYWFvJywgJ2FiaCcsICdhYnYnLCAnYWNtJywgJ2FjcScsICdhY3cnLCAnYWN4JywgJ2FjeScsICdhZGYnLCAnYWRzJywgJ2FlYicsICdhZWMnLCAnYWZiJywgJ2FqcCcsICdhcGMnLCAnYXBkJywgJ2FyYicsICdhcnEnLCAnYXJzJywgJ2FyeScsICdhcnonLCAnYXV6JywgJ2F2bCcsICdheWgnLCAnYXlsJywgJ2F5bicsICdheXAnLCAnYmJ6JywgJ3BnYScsICdoZScsICdpdycsICdwcycsICdwYnQnLCAncGJ1JywgJ3BzdCcsICdwcnAnLCAncHJkJywgJ3VnJywgJ3VyJywgJ3lkZCcsICd5ZHMnLCAneWloJywgJ2ppJywgJ3lpJywgJ2hibycsICdtZW4nLCAneG1uJywgJ2ZhJywgJ2pwcicsICdwZW8nLCAncGVzJywgJ3BycycsICdkdicsICdzYW0nLCAnY2tiJ107XG4gICAgY29uc3QgbGFuZ3VhZ2VVdGlscyA9IHRoaXMuc2VydmljZXMgJiYgdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZVV0aWxzIHx8IG5ldyBMYW5ndWFnZVV0aWwoZ2V0KCkpO1xuICAgIHJldHVybiBydGxMbmdzLmluZGV4T2YobGFuZ3VhZ2VVdGlscy5nZXRMYW5ndWFnZVBhcnRGcm9tQ29kZShsbmcpKSA+IC0xIHx8IGxuZy50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJy1hcmFiJykgPiAxID8gJ3J0bCcgOiAnbHRyJztcbiAgfVxuICBzdGF0aWMgY3JlYXRlSW5zdGFuY2UoKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IHt9O1xuICAgIGxldCBjYWxsYmFjayA9IGFyZ3VtZW50cy5sZW5ndGggPiAxID8gYXJndW1lbnRzWzFdIDogdW5kZWZpbmVkO1xuICAgIHJldHVybiBuZXcgSTE4bihvcHRpb25zLCBjYWxsYmFjayk7XG4gIH1cbiAgY2xvbmVJbnN0YW5jZSgpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDoge307XG4gICAgbGV0IGNhbGxiYWNrID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiBub29wO1xuICAgIGNvbnN0IGZvcmtSZXNvdXJjZVN0b3JlID0gb3B0aW9ucy5mb3JrUmVzb3VyY2VTdG9yZTtcbiAgICBpZiAoZm9ya1Jlc291cmNlU3RvcmUpIGRlbGV0ZSBvcHRpb25zLmZvcmtSZXNvdXJjZVN0b3JlO1xuICAgIGNvbnN0IG1lcmdlZE9wdGlvbnMgPSB7XG4gICAgICAuLi50aGlzLm9wdGlvbnMsXG4gICAgICAuLi5vcHRpb25zLFxuICAgICAgLi4ue1xuICAgICAgICBpc0Nsb25lOiB0cnVlXG4gICAgICB9XG4gICAgfTtcbiAgICBjb25zdCBjbG9uZSA9IG5ldyBJMThuKG1lcmdlZE9wdGlvbnMpO1xuICAgIGlmIChvcHRpb25zLmRlYnVnICE9PSB1bmRlZmluZWQgfHwgb3B0aW9ucy5wcmVmaXggIT09IHVuZGVmaW5lZCkge1xuICAgICAgY2xvbmUubG9nZ2VyID0gY2xvbmUubG9nZ2VyLmNsb25lKG9wdGlvbnMpO1xuICAgIH1cbiAgICBjb25zdCBtZW1iZXJzVG9Db3B5ID0gWydzdG9yZScsICdzZXJ2aWNlcycsICdsYW5ndWFnZSddO1xuICAgIG1lbWJlcnNUb0NvcHkuZm9yRWFjaChtID0+IHtcbiAgICAgIGNsb25lW21dID0gdGhpc1ttXTtcbiAgICB9KTtcbiAgICBjbG9uZS5zZXJ2aWNlcyA9IHtcbiAgICAgIC4uLnRoaXMuc2VydmljZXNcbiAgICB9O1xuICAgIGNsb25lLnNlcnZpY2VzLnV0aWxzID0ge1xuICAgICAgaGFzTG9hZGVkTmFtZXNwYWNlOiBjbG9uZS5oYXNMb2FkZWROYW1lc3BhY2UuYmluZChjbG9uZSlcbiAgICB9O1xuICAgIGlmIChmb3JrUmVzb3VyY2VTdG9yZSkge1xuICAgICAgY2xvbmUuc3RvcmUgPSBuZXcgUmVzb3VyY2VTdG9yZSh0aGlzLnN0b3JlLmRhdGEsIG1lcmdlZE9wdGlvbnMpO1xuICAgICAgY2xvbmUuc2VydmljZXMucmVzb3VyY2VTdG9yZSA9IGNsb25lLnN0b3JlO1xuICAgIH1cbiAgICBjbG9uZS50cmFuc2xhdG9yID0gbmV3IFRyYW5zbGF0b3IoY2xvbmUuc2VydmljZXMsIG1lcmdlZE9wdGlvbnMpO1xuICAgIGNsb25lLnRyYW5zbGF0b3Iub24oJyonLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgIGZvciAodmFyIF9sZW40ID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IG5ldyBBcnJheShfbGVuNCA+IDEgPyBfbGVuNCAtIDEgOiAwKSwgX2tleTQgPSAxOyBfa2V5NCA8IF9sZW40OyBfa2V5NCsrKSB7XG4gICAgICAgIGFyZ3NbX2tleTQgLSAxXSA9IGFyZ3VtZW50c1tfa2V5NF07XG4gICAgICB9XG4gICAgICBjbG9uZS5lbWl0KGV2ZW50LCAuLi5hcmdzKTtcbiAgICB9KTtcbiAgICBjbG9uZS5pbml0KG1lcmdlZE9wdGlvbnMsIGNhbGxiYWNrKTtcbiAgICBjbG9uZS50cmFuc2xhdG9yLm9wdGlvbnMgPSBtZXJnZWRPcHRpb25zO1xuICAgIGNsb25lLnRyYW5zbGF0b3IuYmFja2VuZENvbm5lY3Rvci5zZXJ2aWNlcy51dGlscyA9IHtcbiAgICAgIGhhc0xvYWRlZE5hbWVzcGFjZTogY2xvbmUuaGFzTG9hZGVkTmFtZXNwYWNlLmJpbmQoY2xvbmUpXG4gICAgfTtcbiAgICByZXR1cm4gY2xvbmU7XG4gIH1cbiAgdG9KU09OKCkge1xuICAgIHJldHVybiB7XG4gICAgICBvcHRpb25zOiB0aGlzLm9wdGlvbnMsXG4gICAgICBzdG9yZTogdGhpcy5zdG9yZSxcbiAgICAgIGxhbmd1YWdlOiB0aGlzLmxhbmd1YWdlLFxuICAgICAgbGFuZ3VhZ2VzOiB0aGlzLmxhbmd1YWdlcyxcbiAgICAgIHJlc29sdmVkTGFuZ3VhZ2U6IHRoaXMucmVzb2x2ZWRMYW5ndWFnZVxuICAgIH07XG4gIH1cbn1cbmNvbnN0IGluc3RhbmNlID0gSTE4bi5jcmVhdGVJbnN0YW5jZSgpO1xuaW5zdGFuY2UuY3JlYXRlSW5zdGFuY2UgPSBJMThuLmNyZWF0ZUluc3RhbmNlO1xuXG5jb25zdCBjcmVhdGVJbnN0YW5jZSA9IGluc3RhbmNlLmNyZWF0ZUluc3RhbmNlO1xuY29uc3QgZGlyID0gaW5zdGFuY2UuZGlyO1xuY29uc3QgaW5pdCA9IGluc3RhbmNlLmluaXQ7XG5jb25zdCBsb2FkUmVzb3VyY2VzID0gaW5zdGFuY2UubG9hZFJlc291cmNlcztcbmNvbnN0IHJlbG9hZFJlc291cmNlcyA9IGluc3RhbmNlLnJlbG9hZFJlc291cmNlcztcbmNvbnN0IHVzZSA9IGluc3RhbmNlLnVzZTtcbmNvbnN0IGNoYW5nZUxhbmd1YWdlID0gaW5zdGFuY2UuY2hhbmdlTGFuZ3VhZ2U7XG5jb25zdCBnZXRGaXhlZFQgPSBpbnN0YW5jZS5nZXRGaXhlZFQ7XG5jb25zdCB0ID0gaW5zdGFuY2UudDtcbmNvbnN0IGV4aXN0cyA9IGluc3RhbmNlLmV4aXN0cztcbmNvbnN0IHNldERlZmF1bHROYW1lc3BhY2UgPSBpbnN0YW5jZS5zZXREZWZhdWx0TmFtZXNwYWNlO1xuY29uc3QgaGFzTG9hZGVkTmFtZXNwYWNlID0gaW5zdGFuY2UuaGFzTG9hZGVkTmFtZXNwYWNlO1xuY29uc3QgbG9hZE5hbWVzcGFjZXMgPSBpbnN0YW5jZS5sb2FkTmFtZXNwYWNlcztcbmNvbnN0IGxvYWRMYW5ndWFnZXMgPSBpbnN0YW5jZS5sb2FkTGFuZ3VhZ2VzO1xuXG5leHBvcnQgeyBjaGFuZ2VMYW5ndWFnZSwgY3JlYXRlSW5zdGFuY2UsIGluc3RhbmNlIGFzIGRlZmF1bHQsIGRpciwgZXhpc3RzLCBnZXRGaXhlZFQsIGhhc0xvYWRlZE5hbWVzcGFjZSwgaW5pdCwgbG9hZExhbmd1YWdlcywgbG9hZE5hbWVzcGFjZXMsIGxvYWRSZXNvdXJjZXMsIHJlbG9hZFJlc291cmNlcywgc2V0RGVmYXVsdE5hbWVzcGFjZSwgdCwgdXNlIH07XG4iLCAiZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGEsIG4pIHtcbiAgaWYgKCEoYSBpbnN0YW5jZW9mIG4pKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpO1xufVxuZXhwb3J0IHsgX2NsYXNzQ2FsbENoZWNrIGFzIGRlZmF1bHQgfTsiLCAiZnVuY3Rpb24gX3R5cGVvZihvKSB7XG4gIFwiQGJhYmVsL2hlbHBlcnMgLSB0eXBlb2ZcIjtcblxuICByZXR1cm4gX3R5cGVvZiA9IFwiZnVuY3Rpb25cIiA9PSB0eXBlb2YgU3ltYm9sICYmIFwic3ltYm9sXCIgPT0gdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA/IGZ1bmN0aW9uIChvKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBvO1xuICB9IDogZnVuY3Rpb24gKG8pIHtcbiAgICByZXR1cm4gbyAmJiBcImZ1bmN0aW9uXCIgPT0gdHlwZW9mIFN5bWJvbCAmJiBvLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgJiYgbyAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2YgbztcbiAgfSwgX3R5cGVvZihvKTtcbn1cbmV4cG9ydCB7IF90eXBlb2YgYXMgZGVmYXVsdCB9OyIsICJpbXBvcnQgX3R5cGVvZiBmcm9tIFwiLi90eXBlb2YuanNcIjtcbmZ1bmN0aW9uIHRvUHJpbWl0aXZlKHQsIHIpIHtcbiAgaWYgKFwib2JqZWN0XCIgIT0gX3R5cGVvZih0KSB8fCAhdCkgcmV0dXJuIHQ7XG4gIHZhciBlID0gdFtTeW1ib2wudG9QcmltaXRpdmVdO1xuICBpZiAodm9pZCAwICE9PSBlKSB7XG4gICAgdmFyIGkgPSBlLmNhbGwodCwgciB8fCBcImRlZmF1bHRcIik7XG4gICAgaWYgKFwib2JqZWN0XCIgIT0gX3R5cGVvZihpKSkgcmV0dXJuIGk7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkBAdG9QcmltaXRpdmUgbXVzdCByZXR1cm4gYSBwcmltaXRpdmUgdmFsdWUuXCIpO1xuICB9XG4gIHJldHVybiAoXCJzdHJpbmdcIiA9PT0gciA/IFN0cmluZyA6IE51bWJlcikodCk7XG59XG5leHBvcnQgeyB0b1ByaW1pdGl2ZSBhcyBkZWZhdWx0IH07IiwgImltcG9ydCBfdHlwZW9mIGZyb20gXCIuL3R5cGVvZi5qc1wiO1xuaW1wb3J0IHRvUHJpbWl0aXZlIGZyb20gXCIuL3RvUHJpbWl0aXZlLmpzXCI7XG5mdW5jdGlvbiB0b1Byb3BlcnR5S2V5KHQpIHtcbiAgdmFyIGkgPSB0b1ByaW1pdGl2ZSh0LCBcInN0cmluZ1wiKTtcbiAgcmV0dXJuIFwic3ltYm9sXCIgPT0gX3R5cGVvZihpKSA/IGkgOiBpICsgXCJcIjtcbn1cbmV4cG9ydCB7IHRvUHJvcGVydHlLZXkgYXMgZGVmYXVsdCB9OyIsICJpbXBvcnQgdG9Qcm9wZXJ0eUtleSBmcm9tIFwiLi90b1Byb3BlcnR5S2V5LmpzXCI7XG5mdW5jdGlvbiBfZGVmaW5lUHJvcGVydGllcyhlLCByKSB7XG4gIGZvciAodmFyIHQgPSAwOyB0IDwgci5sZW5ndGg7IHQrKykge1xuICAgIHZhciBvID0gclt0XTtcbiAgICBvLmVudW1lcmFibGUgPSBvLmVudW1lcmFibGUgfHwgITEsIG8uY29uZmlndXJhYmxlID0gITAsIFwidmFsdWVcIiBpbiBvICYmIChvLndyaXRhYmxlID0gITApLCBPYmplY3QuZGVmaW5lUHJvcGVydHkoZSwgdG9Qcm9wZXJ0eUtleShvLmtleSksIG8pO1xuICB9XG59XG5mdW5jdGlvbiBfY3JlYXRlQ2xhc3MoZSwgciwgdCkge1xuICByZXR1cm4gciAmJiBfZGVmaW5lUHJvcGVydGllcyhlLnByb3RvdHlwZSwgciksIHQgJiYgX2RlZmluZVByb3BlcnRpZXMoZSwgdCksIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlLCBcInByb3RvdHlwZVwiLCB7XG4gICAgd3JpdGFibGU6ICExXG4gIH0pLCBlO1xufVxuZXhwb3J0IHsgX2NyZWF0ZUNsYXNzIGFzIGRlZmF1bHQgfTsiLCAiaW1wb3J0IF9jbGFzc0NhbGxDaGVjayBmcm9tICdAYmFiZWwvcnVudGltZS9oZWxwZXJzL2VzbS9jbGFzc0NhbGxDaGVjayc7XG5pbXBvcnQgX2NyZWF0ZUNsYXNzIGZyb20gJ0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvZXNtL2NyZWF0ZUNsYXNzJztcblxudmFyIGFyciA9IFtdO1xudmFyIGVhY2ggPSBhcnIuZm9yRWFjaDtcbnZhciBzbGljZSA9IGFyci5zbGljZTtcbmZ1bmN0aW9uIGRlZmF1bHRzKG9iaikge1xuICBlYWNoLmNhbGwoc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLCBmdW5jdGlvbiAoc291cmNlKSB7XG4gICAgaWYgKHNvdXJjZSkge1xuICAgICAgZm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpIHtcbiAgICAgICAgaWYgKG9ialtwcm9wXSA9PT0gdW5kZWZpbmVkKSBvYmpbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG4gICAgICB9XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG9iajtcbn1cblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnRyb2wtcmVnZXhcbnZhciBmaWVsZENvbnRlbnRSZWdFeHAgPSAvXltcXHUwMDA5XFx1MDAyMC1cXHUwMDdlXFx1MDA4MC1cXHUwMGZmXSskLztcbnZhciBzZXJpYWxpemVDb29raWUgPSBmdW5jdGlvbiBzZXJpYWxpemVDb29raWUobmFtZSwgdmFsLCBvcHRpb25zKSB7XG4gIHZhciBvcHQgPSBvcHRpb25zIHx8IHt9O1xuICBvcHQucGF0aCA9IG9wdC5wYXRoIHx8ICcvJztcbiAgdmFyIHZhbHVlID0gZW5jb2RlVVJJQ29tcG9uZW50KHZhbCk7XG4gIHZhciBzdHIgPSBcIlwiLmNvbmNhdChuYW1lLCBcIj1cIikuY29uY2F0KHZhbHVlKTtcbiAgaWYgKG9wdC5tYXhBZ2UgPiAwKSB7XG4gICAgdmFyIG1heEFnZSA9IG9wdC5tYXhBZ2UgLSAwO1xuICAgIGlmIChOdW1iZXIuaXNOYU4obWF4QWdlKSkgdGhyb3cgbmV3IEVycm9yKCdtYXhBZ2Ugc2hvdWxkIGJlIGEgTnVtYmVyJyk7XG4gICAgc3RyICs9IFwiOyBNYXgtQWdlPVwiLmNvbmNhdChNYXRoLmZsb29yKG1heEFnZSkpO1xuICB9XG4gIGlmIChvcHQuZG9tYWluKSB7XG4gICAgaWYgKCFmaWVsZENvbnRlbnRSZWdFeHAudGVzdChvcHQuZG9tYWluKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignb3B0aW9uIGRvbWFpbiBpcyBpbnZhbGlkJyk7XG4gICAgfVxuICAgIHN0ciArPSBcIjsgRG9tYWluPVwiLmNvbmNhdChvcHQuZG9tYWluKTtcbiAgfVxuICBpZiAob3B0LnBhdGgpIHtcbiAgICBpZiAoIWZpZWxkQ29udGVudFJlZ0V4cC50ZXN0KG9wdC5wYXRoKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignb3B0aW9uIHBhdGggaXMgaW52YWxpZCcpO1xuICAgIH1cbiAgICBzdHIgKz0gXCI7IFBhdGg9XCIuY29uY2F0KG9wdC5wYXRoKTtcbiAgfVxuICBpZiAob3B0LmV4cGlyZXMpIHtcbiAgICBpZiAodHlwZW9mIG9wdC5leHBpcmVzLnRvVVRDU3RyaW5nICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdvcHRpb24gZXhwaXJlcyBpcyBpbnZhbGlkJyk7XG4gICAgfVxuICAgIHN0ciArPSBcIjsgRXhwaXJlcz1cIi5jb25jYXQob3B0LmV4cGlyZXMudG9VVENTdHJpbmcoKSk7XG4gIH1cbiAgaWYgKG9wdC5odHRwT25seSkgc3RyICs9ICc7IEh0dHBPbmx5JztcbiAgaWYgKG9wdC5zZWN1cmUpIHN0ciArPSAnOyBTZWN1cmUnO1xuICBpZiAob3B0LnNhbWVTaXRlKSB7XG4gICAgdmFyIHNhbWVTaXRlID0gdHlwZW9mIG9wdC5zYW1lU2l0ZSA9PT0gJ3N0cmluZycgPyBvcHQuc2FtZVNpdGUudG9Mb3dlckNhc2UoKSA6IG9wdC5zYW1lU2l0ZTtcbiAgICBzd2l0Y2ggKHNhbWVTaXRlKSB7XG4gICAgICBjYXNlIHRydWU6XG4gICAgICAgIHN0ciArPSAnOyBTYW1lU2l0ZT1TdHJpY3QnO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2xheCc6XG4gICAgICAgIHN0ciArPSAnOyBTYW1lU2l0ZT1MYXgnO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3N0cmljdCc6XG4gICAgICAgIHN0ciArPSAnOyBTYW1lU2l0ZT1TdHJpY3QnO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ25vbmUnOlxuICAgICAgICBzdHIgKz0gJzsgU2FtZVNpdGU9Tm9uZSc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignb3B0aW9uIHNhbWVTaXRlIGlzIGludmFsaWQnKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG52YXIgY29va2llID0ge1xuICBjcmVhdGU6IGZ1bmN0aW9uIGNyZWF0ZShuYW1lLCB2YWx1ZSwgbWludXRlcywgZG9tYWluKSB7XG4gICAgdmFyIGNvb2tpZU9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gNCAmJiBhcmd1bWVudHNbNF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1s0XSA6IHtcbiAgICAgIHBhdGg6ICcvJyxcbiAgICAgIHNhbWVTaXRlOiAnc3RyaWN0J1xuICAgIH07XG4gICAgaWYgKG1pbnV0ZXMpIHtcbiAgICAgIGNvb2tpZU9wdGlvbnMuZXhwaXJlcyA9IG5ldyBEYXRlKCk7XG4gICAgICBjb29raWVPcHRpb25zLmV4cGlyZXMuc2V0VGltZShjb29raWVPcHRpb25zLmV4cGlyZXMuZ2V0VGltZSgpICsgbWludXRlcyAqIDYwICogMTAwMCk7XG4gICAgfVxuICAgIGlmIChkb21haW4pIGNvb2tpZU9wdGlvbnMuZG9tYWluID0gZG9tYWluO1xuICAgIGRvY3VtZW50LmNvb2tpZSA9IHNlcmlhbGl6ZUNvb2tpZShuYW1lLCBlbmNvZGVVUklDb21wb25lbnQodmFsdWUpLCBjb29raWVPcHRpb25zKTtcbiAgfSxcbiAgcmVhZDogZnVuY3Rpb24gcmVhZChuYW1lKSB7XG4gICAgdmFyIG5hbWVFUSA9IFwiXCIuY29uY2F0KG5hbWUsIFwiPVwiKTtcbiAgICB2YXIgY2EgPSBkb2N1bWVudC5jb29raWUuc3BsaXQoJzsnKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgYyA9IGNhW2ldO1xuICAgICAgd2hpbGUgKGMuY2hhckF0KDApID09PSAnICcpIGMgPSBjLnN1YnN0cmluZygxLCBjLmxlbmd0aCk7XG4gICAgICBpZiAoYy5pbmRleE9mKG5hbWVFUSkgPT09IDApIHJldHVybiBjLnN1YnN0cmluZyhuYW1lRVEubGVuZ3RoLCBjLmxlbmd0aCk7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9LFxuICByZW1vdmU6IGZ1bmN0aW9uIHJlbW92ZShuYW1lKSB7XG4gICAgdGhpcy5jcmVhdGUobmFtZSwgJycsIC0xKTtcbiAgfVxufTtcbnZhciBjb29raWUkMSA9IHtcbiAgbmFtZTogJ2Nvb2tpZScsXG4gIGxvb2t1cDogZnVuY3Rpb24gbG9va3VwKG9wdGlvbnMpIHtcbiAgICB2YXIgZm91bmQ7XG4gICAgaWYgKG9wdGlvbnMubG9va3VwQ29va2llICYmIHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHZhciBjID0gY29va2llLnJlYWQob3B0aW9ucy5sb29rdXBDb29raWUpO1xuICAgICAgaWYgKGMpIGZvdW5kID0gYztcbiAgICB9XG4gICAgcmV0dXJuIGZvdW5kO1xuICB9LFxuICBjYWNoZVVzZXJMYW5ndWFnZTogZnVuY3Rpb24gY2FjaGVVc2VyTGFuZ3VhZ2UobG5nLCBvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMubG9va3VwQ29va2llICYmIHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGNvb2tpZS5jcmVhdGUob3B0aW9ucy5sb29rdXBDb29raWUsIGxuZywgb3B0aW9ucy5jb29raWVNaW51dGVzLCBvcHRpb25zLmNvb2tpZURvbWFpbiwgb3B0aW9ucy5jb29raWVPcHRpb25zKTtcbiAgICB9XG4gIH1cbn07XG5cbnZhciBxdWVyeXN0cmluZyA9IHtcbiAgbmFtZTogJ3F1ZXJ5c3RyaW5nJyxcbiAgbG9va3VwOiBmdW5jdGlvbiBsb29rdXAob3B0aW9ucykge1xuICAgIHZhciBmb3VuZDtcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHZhciBzZWFyY2ggPSB3aW5kb3cubG9jYXRpb24uc2VhcmNoO1xuICAgICAgaWYgKCF3aW5kb3cubG9jYXRpb24uc2VhcmNoICYmIHdpbmRvdy5sb2NhdGlvbi5oYXNoICYmIHdpbmRvdy5sb2NhdGlvbi5oYXNoLmluZGV4T2YoJz8nKSA+IC0xKSB7XG4gICAgICAgIHNlYXJjaCA9IHdpbmRvdy5sb2NhdGlvbi5oYXNoLnN1YnN0cmluZyh3aW5kb3cubG9jYXRpb24uaGFzaC5pbmRleE9mKCc/JykpO1xuICAgICAgfVxuICAgICAgdmFyIHF1ZXJ5ID0gc2VhcmNoLnN1YnN0cmluZygxKTtcbiAgICAgIHZhciBwYXJhbXMgPSBxdWVyeS5zcGxpdCgnJicpO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXJhbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHBvcyA9IHBhcmFtc1tpXS5pbmRleE9mKCc9Jyk7XG4gICAgICAgIGlmIChwb3MgPiAwKSB7XG4gICAgICAgICAgdmFyIGtleSA9IHBhcmFtc1tpXS5zdWJzdHJpbmcoMCwgcG9zKTtcbiAgICAgICAgICBpZiAoa2V5ID09PSBvcHRpb25zLmxvb2t1cFF1ZXJ5c3RyaW5nKSB7XG4gICAgICAgICAgICBmb3VuZCA9IHBhcmFtc1tpXS5zdWJzdHJpbmcocG9zICsgMSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmb3VuZDtcbiAgfVxufTtcblxudmFyIGhhc0xvY2FsU3RvcmFnZVN1cHBvcnQgPSBudWxsO1xudmFyIGxvY2FsU3RvcmFnZUF2YWlsYWJsZSA9IGZ1bmN0aW9uIGxvY2FsU3RvcmFnZUF2YWlsYWJsZSgpIHtcbiAgaWYgKGhhc0xvY2FsU3RvcmFnZVN1cHBvcnQgIT09IG51bGwpIHJldHVybiBoYXNMb2NhbFN0b3JhZ2VTdXBwb3J0O1xuICB0cnkge1xuICAgIGhhc0xvY2FsU3RvcmFnZVN1cHBvcnQgPSB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5sb2NhbFN0b3JhZ2UgIT09IG51bGw7XG4gICAgdmFyIHRlc3RLZXkgPSAnaTE4bmV4dC50cmFuc2xhdGUuYm9vJztcbiAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0odGVzdEtleSwgJ2ZvbycpO1xuICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSh0ZXN0S2V5KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGhhc0xvY2FsU3RvcmFnZVN1cHBvcnQgPSBmYWxzZTtcbiAgfVxuICByZXR1cm4gaGFzTG9jYWxTdG9yYWdlU3VwcG9ydDtcbn07XG52YXIgbG9jYWxTdG9yYWdlID0ge1xuICBuYW1lOiAnbG9jYWxTdG9yYWdlJyxcbiAgbG9va3VwOiBmdW5jdGlvbiBsb29rdXAob3B0aW9ucykge1xuICAgIHZhciBmb3VuZDtcbiAgICBpZiAob3B0aW9ucy5sb29rdXBMb2NhbFN0b3JhZ2UgJiYgbG9jYWxTdG9yYWdlQXZhaWxhYmxlKCkpIHtcbiAgICAgIHZhciBsbmcgPSB3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0ob3B0aW9ucy5sb29rdXBMb2NhbFN0b3JhZ2UpO1xuICAgICAgaWYgKGxuZykgZm91bmQgPSBsbmc7XG4gICAgfVxuICAgIHJldHVybiBmb3VuZDtcbiAgfSxcbiAgY2FjaGVVc2VyTGFuZ3VhZ2U6IGZ1bmN0aW9uIGNhY2hlVXNlckxhbmd1YWdlKGxuZywgb3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zLmxvb2t1cExvY2FsU3RvcmFnZSAmJiBsb2NhbFN0b3JhZ2VBdmFpbGFibGUoKSkge1xuICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKG9wdGlvbnMubG9va3VwTG9jYWxTdG9yYWdlLCBsbmcpO1xuICAgIH1cbiAgfVxufTtcblxudmFyIGhhc1Nlc3Npb25TdG9yYWdlU3VwcG9ydCA9IG51bGw7XG52YXIgc2Vzc2lvblN0b3JhZ2VBdmFpbGFibGUgPSBmdW5jdGlvbiBzZXNzaW9uU3RvcmFnZUF2YWlsYWJsZSgpIHtcbiAgaWYgKGhhc1Nlc3Npb25TdG9yYWdlU3VwcG9ydCAhPT0gbnVsbCkgcmV0dXJuIGhhc1Nlc3Npb25TdG9yYWdlU3VwcG9ydDtcbiAgdHJ5IHtcbiAgICBoYXNTZXNzaW9uU3RvcmFnZVN1cHBvcnQgPSB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5zZXNzaW9uU3RvcmFnZSAhPT0gbnVsbDtcbiAgICB2YXIgdGVzdEtleSA9ICdpMThuZXh0LnRyYW5zbGF0ZS5ib28nO1xuICAgIHdpbmRvdy5zZXNzaW9uU3RvcmFnZS5zZXRJdGVtKHRlc3RLZXksICdmb28nKTtcbiAgICB3aW5kb3cuc2Vzc2lvblN0b3JhZ2UucmVtb3ZlSXRlbSh0ZXN0S2V5KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGhhc1Nlc3Npb25TdG9yYWdlU3VwcG9ydCA9IGZhbHNlO1xuICB9XG4gIHJldHVybiBoYXNTZXNzaW9uU3RvcmFnZVN1cHBvcnQ7XG59O1xudmFyIHNlc3Npb25TdG9yYWdlID0ge1xuICBuYW1lOiAnc2Vzc2lvblN0b3JhZ2UnLFxuICBsb29rdXA6IGZ1bmN0aW9uIGxvb2t1cChvcHRpb25zKSB7XG4gICAgdmFyIGZvdW5kO1xuICAgIGlmIChvcHRpb25zLmxvb2t1cFNlc3Npb25TdG9yYWdlICYmIHNlc3Npb25TdG9yYWdlQXZhaWxhYmxlKCkpIHtcbiAgICAgIHZhciBsbmcgPSB3aW5kb3cuc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShvcHRpb25zLmxvb2t1cFNlc3Npb25TdG9yYWdlKTtcbiAgICAgIGlmIChsbmcpIGZvdW5kID0gbG5nO1xuICAgIH1cbiAgICByZXR1cm4gZm91bmQ7XG4gIH0sXG4gIGNhY2hlVXNlckxhbmd1YWdlOiBmdW5jdGlvbiBjYWNoZVVzZXJMYW5ndWFnZShsbmcsIG9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucy5sb29rdXBTZXNzaW9uU3RvcmFnZSAmJiBzZXNzaW9uU3RvcmFnZUF2YWlsYWJsZSgpKSB7XG4gICAgICB3aW5kb3cuc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbShvcHRpb25zLmxvb2t1cFNlc3Npb25TdG9yYWdlLCBsbmcpO1xuICAgIH1cbiAgfVxufTtcblxudmFyIG5hdmlnYXRvciQxID0ge1xuICBuYW1lOiAnbmF2aWdhdG9yJyxcbiAgbG9va3VwOiBmdW5jdGlvbiBsb29rdXAob3B0aW9ucykge1xuICAgIHZhciBmb3VuZCA9IFtdO1xuICAgIGlmICh0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgaWYgKG5hdmlnYXRvci5sYW5ndWFnZXMpIHtcbiAgICAgICAgLy8gY2hyb21lIG9ubHk7IG5vdCBhbiBhcnJheSwgc28gY2FuJ3QgdXNlIC5wdXNoLmFwcGx5IGluc3RlYWQgb2YgaXRlcmF0aW5nXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbmF2aWdhdG9yLmxhbmd1YWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGZvdW5kLnB1c2gobmF2aWdhdG9yLmxhbmd1YWdlc1tpXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChuYXZpZ2F0b3IudXNlckxhbmd1YWdlKSB7XG4gICAgICAgIGZvdW5kLnB1c2gobmF2aWdhdG9yLnVzZXJMYW5ndWFnZSk7XG4gICAgICB9XG4gICAgICBpZiAobmF2aWdhdG9yLmxhbmd1YWdlKSB7XG4gICAgICAgIGZvdW5kLnB1c2gobmF2aWdhdG9yLmxhbmd1YWdlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZvdW5kLmxlbmd0aCA+IDAgPyBmb3VuZCA6IHVuZGVmaW5lZDtcbiAgfVxufTtcblxudmFyIGh0bWxUYWcgPSB7XG4gIG5hbWU6ICdodG1sVGFnJyxcbiAgbG9va3VwOiBmdW5jdGlvbiBsb29rdXAob3B0aW9ucykge1xuICAgIHZhciBmb3VuZDtcbiAgICB2YXIgaHRtbFRhZyA9IG9wdGlvbnMuaHRtbFRhZyB8fCAodHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyA/IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCA6IG51bGwpO1xuICAgIGlmIChodG1sVGFnICYmIHR5cGVvZiBodG1sVGFnLmdldEF0dHJpYnV0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgZm91bmQgPSBodG1sVGFnLmdldEF0dHJpYnV0ZSgnbGFuZycpO1xuICAgIH1cbiAgICByZXR1cm4gZm91bmQ7XG4gIH1cbn07XG5cbnZhciBwYXRoID0ge1xuICBuYW1lOiAncGF0aCcsXG4gIGxvb2t1cDogZnVuY3Rpb24gbG9va3VwKG9wdGlvbnMpIHtcbiAgICB2YXIgZm91bmQ7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB2YXIgbGFuZ3VhZ2UgPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUubWF0Y2goL1xcLyhbYS16QS1aLV0qKS9nKTtcbiAgICAgIGlmIChsYW5ndWFnZSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5sb29rdXBGcm9tUGF0aEluZGV4ID09PSAnbnVtYmVyJykge1xuICAgICAgICAgIGlmICh0eXBlb2YgbGFuZ3VhZ2Vbb3B0aW9ucy5sb29rdXBGcm9tUGF0aEluZGV4XSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIGZvdW5kID0gbGFuZ3VhZ2Vbb3B0aW9ucy5sb29rdXBGcm9tUGF0aEluZGV4XS5yZXBsYWNlKCcvJywgJycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGZvdW5kID0gbGFuZ3VhZ2VbMF0ucmVwbGFjZSgnLycsICcnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZm91bmQ7XG4gIH1cbn07XG5cbnZhciBzdWJkb21haW4gPSB7XG4gIG5hbWU6ICdzdWJkb21haW4nLFxuICBsb29rdXA6IGZ1bmN0aW9uIGxvb2t1cChvcHRpb25zKSB7XG4gICAgLy8gSWYgZ2l2ZW4gZ2V0IHRoZSBzdWJkb21haW4gaW5kZXggZWxzZSAxXG4gICAgdmFyIGxvb2t1cEZyb21TdWJkb21haW5JbmRleCA9IHR5cGVvZiBvcHRpb25zLmxvb2t1cEZyb21TdWJkb21haW5JbmRleCA9PT0gJ251bWJlcicgPyBvcHRpb25zLmxvb2t1cEZyb21TdWJkb21haW5JbmRleCArIDEgOiAxO1xuICAgIC8vIGdldCBhbGwgbWF0Y2hlcyBpZiB3aW5kb3cubG9jYXRpb24uIGlzIGV4aXN0aW5nXG4gICAgLy8gZmlyc3QgaXRlbSBvZiBtYXRjaCBpcyB0aGUgbWF0Y2ggaXRzZWxmIGFuZCB0aGUgc2Vjb25kIGlzIHRoZSBmaXJzdCBncm91cCBtYWNodCB3aGljaCBzb3VsZCBiZSB0aGUgZmlyc3Qgc3ViZG9tYWluIG1hdGNoXG4gICAgLy8gaXMgdGhlIGhvc3RuYW1lIG5vIHB1YmxpYyBkb21haW4gZ2V0IHRoZSBvciBvcHRpb24gb2YgbG9jYWxob3N0XG4gICAgdmFyIGxhbmd1YWdlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LmxvY2F0aW9uICYmIHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZSAmJiB3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUubWF0Y2goL14oXFx3ezIsNX0pXFwuKChbYS16MC05LV17MSw2M31cXC5bYS16XXsyLDZ9KXxsb2NhbGhvc3QpL2kpO1xuXG4gICAgLy8gaWYgdGhlcmUgaXMgbm8gbWF0Y2ggKG51bGwpIHJldHVybiB1bmRlZmluZWRcbiAgICBpZiAoIWxhbmd1YWdlKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgIC8vIHJldHVybiB0aGUgZ2l2ZW4gZ3JvdXAgbWF0Y2hcbiAgICByZXR1cm4gbGFuZ3VhZ2VbbG9va3VwRnJvbVN1YmRvbWFpbkluZGV4XTtcbiAgfVxufTtcblxuZnVuY3Rpb24gZ2V0RGVmYXVsdHMoKSB7XG4gIHJldHVybiB7XG4gICAgb3JkZXI6IFsncXVlcnlzdHJpbmcnLCAnY29va2llJywgJ2xvY2FsU3RvcmFnZScsICdzZXNzaW9uU3RvcmFnZScsICduYXZpZ2F0b3InLCAnaHRtbFRhZyddLFxuICAgIGxvb2t1cFF1ZXJ5c3RyaW5nOiAnbG5nJyxcbiAgICBsb29rdXBDb29raWU6ICdpMThuZXh0JyxcbiAgICBsb29rdXBMb2NhbFN0b3JhZ2U6ICdpMThuZXh0TG5nJyxcbiAgICBsb29rdXBTZXNzaW9uU3RvcmFnZTogJ2kxOG5leHRMbmcnLFxuICAgIC8vIGNhY2hlIHVzZXIgbGFuZ3VhZ2VcbiAgICBjYWNoZXM6IFsnbG9jYWxTdG9yYWdlJ10sXG4gICAgZXhjbHVkZUNhY2hlRm9yOiBbJ2NpbW9kZSddLFxuICAgIC8vIGNvb2tpZU1pbnV0ZXM6IDEwLFxuICAgIC8vIGNvb2tpZURvbWFpbjogJ215RG9tYWluJ1xuXG4gICAgY29udmVydERldGVjdGVkTGFuZ3VhZ2U6IGZ1bmN0aW9uIGNvbnZlcnREZXRlY3RlZExhbmd1YWdlKGwpIHtcbiAgICAgIHJldHVybiBsO1xuICAgIH1cbiAgfTtcbn1cbnZhciBCcm93c2VyID0gLyojX19QVVJFX18qL2Z1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gQnJvd3NlcihzZXJ2aWNlcykge1xuICAgIHZhciBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB7fTtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgQnJvd3Nlcik7XG4gICAgdGhpcy50eXBlID0gJ2xhbmd1YWdlRGV0ZWN0b3InO1xuICAgIHRoaXMuZGV0ZWN0b3JzID0ge307XG4gICAgdGhpcy5pbml0KHNlcnZpY2VzLCBvcHRpb25zKTtcbiAgfVxuICBfY3JlYXRlQ2xhc3MoQnJvd3NlciwgW3tcbiAgICBrZXk6IFwiaW5pdFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBpbml0KHNlcnZpY2VzKSB7XG4gICAgICB2YXIgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge307XG4gICAgICB2YXIgaTE4bk9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6IHt9O1xuICAgICAgdGhpcy5zZXJ2aWNlcyA9IHNlcnZpY2VzIHx8IHtcbiAgICAgICAgbGFuZ3VhZ2VVdGlsczoge31cbiAgICAgIH07IC8vIHRoaXMgd2F5IHRoZSBsYW5ndWFnZSBkZXRlY3RvciBjYW4gYmUgdXNlZCB3aXRob3V0IGkxOG5leHRcbiAgICAgIHRoaXMub3B0aW9ucyA9IGRlZmF1bHRzKG9wdGlvbnMsIHRoaXMub3B0aW9ucyB8fCB7fSwgZ2V0RGVmYXVsdHMoKSk7XG4gICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5jb252ZXJ0RGV0ZWN0ZWRMYW5ndWFnZSA9PT0gJ3N0cmluZycgJiYgdGhpcy5vcHRpb25zLmNvbnZlcnREZXRlY3RlZExhbmd1YWdlLmluZGV4T2YoJzE1ODk3JykgPiAtMSkge1xuICAgICAgICB0aGlzLm9wdGlvbnMuY29udmVydERldGVjdGVkTGFuZ3VhZ2UgPSBmdW5jdGlvbiAobCkge1xuICAgICAgICAgIHJldHVybiBsLnJlcGxhY2UoJy0nLCAnXycpO1xuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICAvLyBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eVxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5sb29rdXBGcm9tVXJsSW5kZXgpIHRoaXMub3B0aW9ucy5sb29rdXBGcm9tUGF0aEluZGV4ID0gdGhpcy5vcHRpb25zLmxvb2t1cEZyb21VcmxJbmRleDtcbiAgICAgIHRoaXMuaTE4bk9wdGlvbnMgPSBpMThuT3B0aW9ucztcbiAgICAgIHRoaXMuYWRkRGV0ZWN0b3IoY29va2llJDEpO1xuICAgICAgdGhpcy5hZGREZXRlY3RvcihxdWVyeXN0cmluZyk7XG4gICAgICB0aGlzLmFkZERldGVjdG9yKGxvY2FsU3RvcmFnZSk7XG4gICAgICB0aGlzLmFkZERldGVjdG9yKHNlc3Npb25TdG9yYWdlKTtcbiAgICAgIHRoaXMuYWRkRGV0ZWN0b3IobmF2aWdhdG9yJDEpO1xuICAgICAgdGhpcy5hZGREZXRlY3RvcihodG1sVGFnKTtcbiAgICAgIHRoaXMuYWRkRGV0ZWN0b3IocGF0aCk7XG4gICAgICB0aGlzLmFkZERldGVjdG9yKHN1YmRvbWFpbik7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImFkZERldGVjdG9yXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGFkZERldGVjdG9yKGRldGVjdG9yKSB7XG4gICAgICB0aGlzLmRldGVjdG9yc1tkZXRlY3Rvci5uYW1lXSA9IGRldGVjdG9yO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImRldGVjdFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBkZXRlY3QoZGV0ZWN0aW9uT3JkZXIpIHtcbiAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICBpZiAoIWRldGVjdGlvbk9yZGVyKSBkZXRlY3Rpb25PcmRlciA9IHRoaXMub3B0aW9ucy5vcmRlcjtcbiAgICAgIHZhciBkZXRlY3RlZCA9IFtdO1xuICAgICAgZGV0ZWN0aW9uT3JkZXIuZm9yRWFjaChmdW5jdGlvbiAoZGV0ZWN0b3JOYW1lKSB7XG4gICAgICAgIGlmIChfdGhpcy5kZXRlY3RvcnNbZGV0ZWN0b3JOYW1lXSkge1xuICAgICAgICAgIHZhciBsb29rdXAgPSBfdGhpcy5kZXRlY3RvcnNbZGV0ZWN0b3JOYW1lXS5sb29rdXAoX3RoaXMub3B0aW9ucyk7XG4gICAgICAgICAgaWYgKGxvb2t1cCAmJiB0eXBlb2YgbG9va3VwID09PSAnc3RyaW5nJykgbG9va3VwID0gW2xvb2t1cF07XG4gICAgICAgICAgaWYgKGxvb2t1cCkgZGV0ZWN0ZWQgPSBkZXRlY3RlZC5jb25jYXQobG9va3VwKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBkZXRlY3RlZCA9IGRldGVjdGVkLm1hcChmdW5jdGlvbiAoZCkge1xuICAgICAgICByZXR1cm4gX3RoaXMub3B0aW9ucy5jb252ZXJ0RGV0ZWN0ZWRMYW5ndWFnZShkKTtcbiAgICAgIH0pO1xuICAgICAgaWYgKHRoaXMuc2VydmljZXMubGFuZ3VhZ2VVdGlscy5nZXRCZXN0TWF0Y2hGcm9tQ29kZXMpIHJldHVybiBkZXRlY3RlZDsgLy8gbmV3IGkxOG5leHQgdjE5LjUuMFxuICAgICAgcmV0dXJuIGRldGVjdGVkLmxlbmd0aCA+IDAgPyBkZXRlY3RlZFswXSA6IG51bGw7IC8vIGEgbGl0dGxlIGJhY2t3YXJkIGNvbXBhdGliaWxpdHlcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiY2FjaGVVc2VyTGFuZ3VhZ2VcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gY2FjaGVVc2VyTGFuZ3VhZ2UobG5nLCBjYWNoZXMpIHtcbiAgICAgIHZhciBfdGhpczIgPSB0aGlzO1xuICAgICAgaWYgKCFjYWNoZXMpIGNhY2hlcyA9IHRoaXMub3B0aW9ucy5jYWNoZXM7XG4gICAgICBpZiAoIWNhY2hlcykgcmV0dXJuO1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5leGNsdWRlQ2FjaGVGb3IgJiYgdGhpcy5vcHRpb25zLmV4Y2x1ZGVDYWNoZUZvci5pbmRleE9mKGxuZykgPiAtMSkgcmV0dXJuO1xuICAgICAgY2FjaGVzLmZvckVhY2goZnVuY3Rpb24gKGNhY2hlTmFtZSkge1xuICAgICAgICBpZiAoX3RoaXMyLmRldGVjdG9yc1tjYWNoZU5hbWVdKSBfdGhpczIuZGV0ZWN0b3JzW2NhY2hlTmFtZV0uY2FjaGVVc2VyTGFuZ3VhZ2UobG5nLCBfdGhpczIub3B0aW9ucyk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1dKTtcbiAgcmV0dXJuIEJyb3dzZXI7XG59KCk7XG5Ccm93c2VyLnR5cGUgPSAnbGFuZ3VhZ2VEZXRlY3Rvcic7XG5cbmV4cG9ydCB7IEJyb3dzZXIgYXMgZGVmYXVsdCB9O1xuIiwgImV4cG9ydCBjb25zdCBTVEFURV9LRVlfUFJFRklYID0gJ2FqX2x0aSc7XG5leHBvcnQgY29uc3QgTUFJTl9DT05URU5UX0lEID0gJ21haW4tY29udGVudCc7XG4iLCAiaW1wb3J0IHsgSW5pdFNldHRpbmdzIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNDb29raWUoc2V0dGluZ3M6IEluaXRTZXR0aW5ncykge1xuICBpZiAoZG9jdW1lbnQuY29va2llKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNvb2tpZS5tYXRjaChcbiAgICAgIGAoXnw7KVxcXFxzKiR7c2V0dGluZ3Mub3BlbklkQ29va2llUHJlZml4fWAgKyBzZXR0aW5ncy5zdGF0ZVxuICAgICk7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0Q29va2llKHNldHRpbmdzOiBJbml0U2V0dGluZ3MpIHtcbiAgZG9jdW1lbnQuY29va2llID1cbiAgICBzZXR0aW5ncy5vcGVuSWRDb29raWVQcmVmaXggK1xuICAgIHNldHRpbmdzLnN0YXRlICtcbiAgICBcIj0xOyBwYXRoPS87IG1heC1hZ2U9NjA7IFNhbWVTaXRlPU5vbmU7XCI7XG59XG4iLCAiaW1wb3J0IGkxOG5leHQgZnJvbSBcImkxOG5leHRcIjtcbmltcG9ydCB7IEluaXRTZXR0aW5ncyB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG5leHBvcnQgZnVuY3Rpb24gcHJpdmFjeUh0bWwoc2V0dGluZ3M6IEluaXRTZXR0aW5ncykge1xuICByZXR1cm4gKFxuICAgIGkxOG5leHQudChcbiAgICAgIHNldHRpbmdzLnByaXZhY3lQb2xpY3lNZXNzYWdlIHx8IGBXZSB1c2UgY29va2llcyBmb3IgbG9naW4gYW5kIHNlY3VyaXR5LmBcbiAgICApICtcbiAgICBcIiBcIiArXG4gICAgaTE4bmV4dC50KFxuICAgICAgYExlYXJuIG1vcmUgaW4gb3VyIDxhIGhyZWY9J3t7dXJsfX0nIHRhcmdldD0nX2JsYW5rJz5wcml2YWN5IHBvbGljeTwvYT4uYFxuICAgIClcbiAgKTtcbn1cbiIsICJpbXBvcnQgaTE4bmV4dCBmcm9tIFwiaTE4bmV4dFwiO1xuaW1wb3J0IHsgSW5pdFNldHRpbmdzIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgeyBwcml2YWN5SHRtbCB9IGZyb20gXCIuL3ByaXZhY3lcIjtcbmltcG9ydCB7IE1BSU5fQ09OVEVOVF9JRCB9IGZyb20gXCIuLi9saWJzL2NvbnN0YW50c1wiO1xuaW1wb3J0IHsgdHJ5UmVxdWVzdFN0b3JhZ2VBY2Nlc3MgfSBmcm9tIFwiLi4vbGlicy9wbGF0Zm9ybV9zdG9yYWdlXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBsYXVuY2hOZXdXaW5kb3coc2V0dGluZ3M6IEluaXRTZXR0aW5ncykge1xuICB3aW5kb3cub3BlbihzZXR0aW5ncy5yZWxhdW5jaEluaXRVcmwpO1xuICBzaG93TGF1bmNoTmV3V2luZG93KHNldHRpbmdzLCB7XG4gICAgZGlzYWJsZUxhdW5jaDogdHJ1ZSxcbiAgICBzaG93UmVxdWVzdFN0b3JhZ2VBY2Nlc3M6IGZhbHNlLFxuICAgIHNob3dTdG9yYWdlQWNjZXNzRGVuaWVkOiBmYWxzZSxcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzaG93TGF1bmNoTmV3V2luZG93KFxuICBzZXR0aW5nczogSW5pdFNldHRpbmdzLFxuICBvcHRpb25zOiB7XG4gICAgZGlzYWJsZUxhdW5jaDogYm9vbGVhbjtcbiAgICBzaG93UmVxdWVzdFN0b3JhZ2VBY2Nlc3M6IGJvb2xlYW47XG4gICAgc2hvd1N0b3JhZ2VBY2Nlc3NEZW5pZWQ6IGJvb2xlYW47XG4gIH1cbikge1xuICBjb25zdCB7IGRpc2FibGVMYXVuY2gsIHNob3dSZXF1ZXN0U3RvcmFnZUFjY2Vzcywgc2hvd1N0b3JhZ2VBY2Nlc3NEZW5pZWQgfSA9XG4gICAgb3B0aW9ucztcbiAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoTUFJTl9DT05URU5UX0lEKTtcbiAgaWYgKCFjb250YWluZXIpIHtcbiAgICB0aHJvdyBpMThuZXh0LnQoXCJDb3VsZCBub3QgZmluZCBtYWluLWNvbnRlbnQgZWxlbWVudFwiKTtcbiAgfVxuICBjb250YWluZXIuaW5uZXJIVE1MID0gYFxuICAgIDxkaXYgY2xhc3M9XCJhai1jZW50ZXJlZC1tZXNzYWdlXCI+XG4gICAgICA8aDEgY2xhc3M9XCJhai10aXRsZVwiPlxuICAgICAgICA8aSBjbGFzcz1cIm1hdGVyaWFsLWljb25zLW91dGxpbmVkIGFqLWljb25cIiBhcmlhLWhpZGRlbj1cInRydWVcIj5jb29raWVfb2ZmPC9pPlxuICAgICAgICAke2kxOG5leHQudChcIkNvb2tpZXMgUmVxdWlyZWRcIil9XG4gICAgICA8L2gxPlxuICAgICAgPHAgY2xhc3M9XCJhai10ZXh0XCI+XG4gICAgICAgICR7cHJpdmFjeUh0bWwoc2V0dGluZ3MpfSA8L3A+XG4gICAgICA8cCBjbGFzcz1cImFqLXRleHRcIj5cbiAgICAgICAgJHtpMThuZXh0LnQoXCJQbGVhc2UgY2xpY2sgdGhlIGJ1dHRvbiBiZWxvdyB0byByZWxvYWQgaW4gYSBuZXcgd2luZG93LlwiKX1cbiAgICAgIDwvcD5cbiAgICAgIDxidXR0b24gaWQ9XCJidXR0b25fbGF1bmNoX25ld193aW5kb3dcIiBjbGFzcz1cImFqLWJ0biBhai1idG4tLWJsdWVcIiAke1xuICAgICAgICBkaXNhYmxlTGF1bmNoID8gJ2Rpc2FibGVkPVwiXCInIDogXCJcIlxuICAgICAgfSA+XG4gICAgICAgICR7aTE4bmV4dC50KFwiT3BlbiBpbiBhIG5ldyB3aW5kb3dcIil9XG4gICAgICA8L2J1dHRvbj5cbiAgICAgIDwvYT5cbiAgICAgICR7XG4gICAgICAgIHNob3dSZXF1ZXN0U3RvcmFnZUFjY2Vzc1xuICAgICAgICAgID8gYFxuICAgICAgICA8ZGl2IGlkPVwicmVxdWVzdF9zdG9yYWdlX2FjY2Vzc1wiPlxuICAgICAgICAgIDxwIGNsYXNzPVwiYWotdGV4dFwiPlxuICAgICAgICAgICAgJHtpMThuZXh0LnQoXG4gICAgICAgICAgICAgIFwiSWYgeW91IGhhdmUgdXNlZCB0aGlzIGFwcGxpY2F0aW9uIGJlZm9yZSwgeW91ciBicm93c2VyIG1heSBhbGxvdyB5b3UgdG8gPGEgaWQ9J3JlcXVlc3Rfc3RvcmFnZV9hY2Nlc3NfbGluaycgaHJlZj0nIyc+ZW5hYmxlIGNvb2tpZXM8L2E+IGFuZCBwcmV2ZW50IHRoaXMgbWVzc2FnZSBpbiB0aGUgZnV0dXJlLlwiXG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvcD5cbiAgICAgICAgPC9kaXY+XG4gICAgICBgXG4gICAgICAgICAgOiBcIlwiXG4gICAgICB9XG4gICAgICAke1xuICAgICAgICBzaG93U3RvcmFnZUFjY2Vzc0RlbmllZFxuICAgICAgICAgID8gYFxuICAgICAgPGRpdiBpZD1cInJlcXVlc3Rfc3RvcmFnZV9hY2Nlc3NfZXJyb3JcIiBjbGFzcz1cInUtZmxleFwiPlxuICAgICAgICA8aSBjbGFzcz1cIm1hdGVyaWFsLWljb25zLW91dGxpbmVkIGFqLWljb25cIiBhcmlhLWhpZGRlbj1cInRydWVcIj53YXJuaW5nPC9pPlxuICAgICAgICA8cCBjbGFzcz1cImFqLXRleHRcIj5cbiAgICAgICAgJHtpMThuZXh0LnQoXG4gICAgICAgICAgXCJUaGUgYnJvd3NlciBwcmV2ZW50ZWQgYWNjZXNzLiAgVHJ5IGxhdW5jaGluZyBpbiBhIG5ldyB3aW5kb3cgZmlyc3QgYW5kIHRoZW4gY2xpY2tpbmcgdGhpcyBvcHRpb24gYWdhaW4gbmV4dCB0aW1lLiBJZiB0aGF0IGRvZXNuJ3Qgd29yayBjaGVjayB5b3VyIHByaXZhY3kgc2V0dGluZ3MuIFNvbWUgYnJvd3NlcnMgd2lsbCBwcmV2ZW50IGFsbCB0aGlyZCBwYXJ0eSBjb29raWVzLlwiXG4gICAgICAgICl9XG4gICAgICAgIDwvcD5cbiAgICAgIDwvZGl2PlxuICAgICAgYFxuICAgICAgICAgIDogXCJcIlxuICAgICAgfVxuICAgIDwvZGl2PlxuICBgO1xuXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYnV0dG9uX2xhdW5jaF9uZXdfd2luZG93XCIpIS5vbmNsaWNrID0gKCkgPT5cbiAgICBsYXVuY2hOZXdXaW5kb3coc2V0dGluZ3MpO1xuXG4gIGlmIChzaG93UmVxdWVzdFN0b3JhZ2VBY2Nlc3MpIHtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInJlcXVlc3Rfc3RvcmFnZV9hY2Nlc3NfbGlua1wiKSEub25jbGljayA9ICgpID0+XG4gICAgICB0cnlSZXF1ZXN0U3RvcmFnZUFjY2VzcyhzZXR0aW5ncyk7XG4gIH1cbn1cbiIsICJpbXBvcnQgaTE4bmV4dCBmcm9tIFwiaTE4bmV4dFwiO1xuaW1wb3J0IHsgQ2FwYWJpbGl0eSB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2FwYWJpbGl0aWVzKCk6IFByb21pc2U8Q2FwYWJpbGl0eVtdPiB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgbGV0IHBhcmVudCA9IHdpbmRvdy5wYXJlbnQgfHwgd2luZG93Lm9wZW5lcjtcblxuICAgIGNvbnN0IHRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGkxOG5leHQudChcImNhcGFiaWxpdGllcyByZXF1ZXN0IHRpbWVvdXRcIikpO1xuICAgICAgcmVqZWN0KFxuICAgICAgICBuZXcgRXJyb3IoaTE4bmV4dC50KFwiVGltZW91dCB3aGlsZSB3YWl0aW5nIGZvciBjYXBhYmlsaXRpZXMgcmVzcG9uc2VcIikpXG4gICAgICApO1xuICAgIH0sIDEwMDApO1xuXG4gICAgY29uc3QgcmVjZWl2ZU1lc3NhZ2UgPSAoZXZlbnQ6IE1lc3NhZ2VFdmVudCkgPT4ge1xuICAgICAgaWYgKFxuICAgICAgICB0eXBlb2YgZXZlbnQuZGF0YSA9PT0gXCJvYmplY3RcIiAmJlxuICAgICAgICBldmVudC5kYXRhLnN1YmplY3QgPT09IFwibHRpLmNhcGFiaWxpdGllcy5yZXNwb25zZVwiICYmXG4gICAgICAgIGV2ZW50LmRhdGEubWVzc2FnZV9pZCA9PT0gXCJhai1sdGktY2Fwc1wiXG4gICAgICApIHtcbiAgICAgICAgcmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgcmVjZWl2ZU1lc3NhZ2UpO1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG5cbiAgICAgICAgaWYgKGV2ZW50LmRhdGEuZXJyb3IpIHtcbiAgICAgICAgICAvLyBoYW5kbGUgZXJyb3JzXG4gICAgICAgICAgY29uc29sZS5lcnJvcihldmVudC5kYXRhLmVycm9yLmNvZGUpO1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXZlbnQuZGF0YS5lcnJvci5tZXNzYWdlKTtcbiAgICAgICAgICByZWplY3QobmV3IEVycm9yKGV2ZW50LmRhdGEuZXJyb3JtZXNzYWdlKSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHJlc29sdmUoZXZlbnQuZGF0YS5zdXBwb3J0ZWRfbWVzc2FnZXMpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgcmVjZWl2ZU1lc3NhZ2UpO1xuICAgIHBhcmVudC5wb3N0TWVzc2FnZShcbiAgICAgIHtcbiAgICAgICAgc3ViamVjdDogXCJsdGkuY2FwYWJpbGl0aWVzXCIsXG4gICAgICAgIG1lc3NhZ2VfaWQ6IFwiYWotbHRpLWNhcHNcIixcbiAgICAgIH0sXG4gICAgICBcIipcIlxuICAgICk7XG4gICAgLy8gUGxhdGZvcm0gd2lsbCBwb3N0IGEgbWVzc2FnZSBiYWNrIG9yIHdlJ2xsIHRpbWVvdXRcbiAgfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRDYXBhYmlsaXR5KFxuICBzdWJqZWN0OiBTdHJpbmdcbik6IFByb21pc2U8Q2FwYWJpbGl0eSB8IG51bGw+IHtcbiAgY29uc3QgY2FwcyA9IGF3YWl0IGdldENhcGFiaWxpdGllcygpO1xuICBpZiAoY2Fwcykge1xuICAgIHJldHVybiBjYXBzLmZpbmQoKGVsZW1lbnQpID0+IGVsZW1lbnQuc3ViamVjdCA9PSBzdWJqZWN0KSB8fCBudWxsO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuIiwgImltcG9ydCBpMThuZXh0IGZyb20gXCJpMThuZXh0XCI7XG5pbXBvcnQgeyBTVEFURV9LRVlfUFJFRklYIH0gZnJvbSBcIi4vY29uc3RhbnRzXCI7XG5pbXBvcnQgeyBMVElTdG9yYWdlUGFyYW1zLCBJbml0U2V0dGluZ3MgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7IHNldENvb2tpZSB9IGZyb20gXCIuL2Nvb2tpZXNcIjtcbmltcG9ydCB7IHNob3dMYXVuY2hOZXdXaW5kb3cgfSBmcm9tIFwiLi4vaHRtbC9sYXVuY2hfbmV3X3dpbmRvd1wiO1xuaW1wb3J0IHsgZ2V0Q2FwYWJpbGl0eSB9IGZyb20gXCIuLi9saWJzL2NhcGFiaWxpdGllc1wiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0VGFyZ2V0RnJhbWUoXG4gIHN0b3JhZ2VQYXJhbXM6IExUSVN0b3JhZ2VQYXJhbXNcbik6IFByb21pc2U8V2luZG93PiB7XG4gIGxldCB0YXJnZXQgPSBzdG9yYWdlUGFyYW1zLnRhcmdldDtcbiAgaWYgKHRhcmdldCA9PSBudWxsKSB7XG4gICAgY29uc3QgY2FwID0gYXdhaXQgZ2V0Q2FwYWJpbGl0eShcImx0aS5nZXRfZGF0YVwiKTtcbiAgICB0YXJnZXQgPSBjYXA/LmZyYW1lO1xuICB9XG4gIGlmICh0YXJnZXQgPT0gbnVsbCkge1xuICAgIHRhcmdldCA9IFwiX3BhcmVudFwiO1xuICB9XG4gIGNvbnN0IHBhcmVudCA9IHdpbmRvdy5wYXJlbnQgfHwgd2luZG93Lm9wZW5lcjtcbiAgcmV0dXJuIHRhcmdldCA9PT0gXCJfcGFyZW50XCIgPyBwYXJlbnQgOiBwYXJlbnQuZnJhbWVzW3RhcmdldCBhcyBhbnldIHx8IHBhcmVudDtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHN0b3JlU3RhdGUoXG4gIHN0YXRlOiBzdHJpbmcsXG4gIHN0b3JhZ2VQYXJhbXM6IExUSVN0b3JhZ2VQYXJhbXNcbik6IFByb21pc2U8dm9pZD4ge1xuICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGxldCBwbGF0Zm9ybU9yaWdpbiA9IG5ldyBVUkwoc3RvcmFnZVBhcmFtcy5wbGF0Zm9ybU9JRENVcmwpLm9yaWdpbjtcblxuICAgIGlmIChzdG9yYWdlUGFyYW1zLm9yaWdpblN1cHBvcnRCcm9rZW4pIHtcbiAgICAgIC8vIFRoZSBzcGVjIHJlcXVpcmVzIHRoYXQgdGhlIG1lc3NhZ2UncyB0YXJnZXQgb3JpZ2luIGJlIHNldCB0byB0aGUgcGxhdGZvcm0ncyBPSURDIEF1dGhvcml6YXRpb24gdXJsXG4gICAgICAvLyBidXQgQ2FudmFzIGRvZXMgbm90IHlldCBzdXBwb3J0IHRoaXMsIHNvIHdlIGhhdmUgdG8gdXNlICcqJy5cbiAgICAgIHBsYXRmb3JtT3JpZ2luID0gXCIqXCI7XG4gICAgfVxuXG4gICAgbGV0IHRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJwb3N0TWVzc2FnZSB0aW1lb3V0XCIpO1xuICAgICAgcmVqZWN0KFxuICAgICAgICBuZXcgRXJyb3IoaTE4bmV4dC50KFwiVGltZW91dCB3aGlsZSB3YWl0aW5nIGZvciBwbGF0Zm9ybSByZXNwb25zZVwiKSlcbiAgICAgICk7XG4gICAgfSwgMjAwMCk7XG5cbiAgICBsZXQgcmVjZWl2ZU1lc3NhZ2UgPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgICAgaWYgKFxuICAgICAgICB0eXBlb2YgZXZlbnQuZGF0YSA9PT0gXCJvYmplY3RcIiAmJlxuICAgICAgICBldmVudC5kYXRhLnN1YmplY3QgPT09IFwibHRpLnB1dF9kYXRhLnJlc3BvbnNlXCIgJiZcbiAgICAgICAgZXZlbnQuZGF0YS5tZXNzYWdlX2lkID09PSBzdGF0ZSAmJlxuICAgICAgICAoZXZlbnQub3JpZ2luID09PSBwbGF0Zm9ybU9yaWdpbiB8fFxuICAgICAgICAgIChzdG9yYWdlUGFyYW1zLm9yaWdpblN1cHBvcnRCcm9rZW4gJiYgcGxhdGZvcm1PcmlnaW4gPT09IFwiKlwiKSlcbiAgICAgICkge1xuICAgICAgICByZW1vdmVFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCByZWNlaXZlTWVzc2FnZSk7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcblxuICAgICAgICBpZiAoZXZlbnQuZGF0YS5lcnJvcikge1xuICAgICAgICAgIC8vIGhhbmRsZSBlcnJvcnNcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGV2ZW50LmRhdGEuZXJyb3IuY29kZSk7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihldmVudC5kYXRhLmVycm9yLm1lc3NhZ2UpO1xuICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoZXZlbnQuZGF0YS5lcnJvcm1lc3NhZ2UpKTtcbiAgICAgICAgfVxuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCByZWNlaXZlTWVzc2FnZSk7XG4gICAgZ2V0VGFyZ2V0RnJhbWUoc3RvcmFnZVBhcmFtcylcbiAgICAgIC50aGVuKCh0YXJnZXRGcmFtZSkgPT5cbiAgICAgICAgdGFyZ2V0RnJhbWU/LnBvc3RNZXNzYWdlKFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHN1YmplY3Q6IFwibHRpLnB1dF9kYXRhXCIsXG4gICAgICAgICAgICBtZXNzYWdlX2lkOiBzdGF0ZSxcbiAgICAgICAgICAgIGtleTogYCR7U1RBVEVfS0VZX1BSRUZJWH0ke3N0YXRlfWAsXG4gICAgICAgICAgICB2YWx1ZTogc3RhdGUsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBwbGF0Zm9ybU9yaWdpblxuICAgICAgICApXG4gICAgICApXG4gICAgICAuY2F0Y2goKGU6IHVua25vd24pID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coaTE4bmV4dC50KFwiQ291bGQgbm90IGZpbmQgdGFyZ2V0IGZyYW1lXCIpKTtcbiAgICAgICAgY29uc29sZS5sb2coZSk7XG4gICAgICAgIHJlamVjdChuZXcgRXJyb3IoaTE4bmV4dC50KFwiQ291bGQgbm90IGZpbmQgdGFyZ2V0IGZyYW1lXCIpKSk7XG4gICAgICB9KTtcblxuICAgIC8vIFBsYXRmb3JtIHNob3VsZCBwb3N0IGEgbWVzc2FnZSBiYWNrXG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFzU3RvcmFnZUFjY2Vzc0FQSSgpIHtcbiAgcmV0dXJuIChcbiAgICB0eXBlb2YgZG9jdW1lbnQuaGFzU3RvcmFnZUFjY2VzcyA9PT0gXCJmdW5jdGlvblwiICYmXG4gICAgdHlwZW9mIGRvY3VtZW50LnJlcXVlc3RTdG9yYWdlQWNjZXNzID09PSBcImZ1bmN0aW9uXCJcbiAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRyeVJlcXVlc3RTdG9yYWdlQWNjZXNzKHNldHRpbmdzOiBJbml0U2V0dGluZ3MpIHtcbiAgZG9jdW1lbnRcbiAgICAucmVxdWVzdFN0b3JhZ2VBY2Nlc3MoKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIC8vIFdlIHNob3VsZCBoYXZlIGNvb2tpZXMgbm93XG4gICAgICBzZXRDb29raWUoc2V0dGluZ3MpO1xuICAgICAgd2luZG93LmxvY2F0aW9uLnJlcGxhY2Uoc2V0dGluZ3MucmVzcG9uc2VVcmwpO1xuICAgIH0pXG4gICAgLmNhdGNoKChlKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhlKTtcbiAgICAgIHNob3dMYXVuY2hOZXdXaW5kb3coc2V0dGluZ3MsIHtcbiAgICAgICAgc2hvd1N0b3JhZ2VBY2Nlc3NEZW5pZWQ6IHRydWUsXG4gICAgICAgIGRpc2FibGVMYXVuY2g6IHRydWUsXG4gICAgICAgIHNob3dSZXF1ZXN0U3RvcmFnZUFjY2VzczogZmFsc2UsXG4gICAgICB9KTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRTdGF0ZShcbiAgc3RhdGU6IHN0cmluZyxcbiAgc3RvcmFnZVBhcmFtczogTFRJU3RvcmFnZVBhcmFtc1xuKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBsZXQgcGxhdGZvcm1PcmlnaW4gPSBuZXcgVVJMKHN0b3JhZ2VQYXJhbXMucGxhdGZvcm1PSURDVXJsKS5vcmlnaW47XG5cbiAgICBpZiAoc3RvcmFnZVBhcmFtcy5vcmlnaW5TdXBwb3J0QnJva2VuKSB7XG4gICAgICAvLyBUaGUgc3BlYyByZXF1aXJlcyB0aGF0IHRoZSBtZXNzYWdlJ3MgdGFyZ2V0IG9yaWdpbiBiZSBzZXQgdG8gdGhlIHBsYXRmb3JtJ3MgT0lEQyBBdXRob3JpemF0aW9uIHVybFxuICAgICAgLy8gYnV0IENhbnZhcyBkb2VzIG5vdCB5ZXQgc3VwcG9ydCB0aGlzLCBzbyB3ZSBoYXZlIHRvIHVzZSAnKicuXG4gICAgICBwbGF0Zm9ybU9yaWdpbiA9IFwiKlwiO1xuICAgIH1cblxuICAgIGNvbnN0IHRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGkxOG5leHQudChcInBvc3RNZXNzYWdlIHRpbWVvdXRcIikpO1xuICAgICAgcmVqZWN0KFxuICAgICAgICBuZXcgRXJyb3IoaTE4bmV4dC50KFwiVGltZW91dCB3aGlsZSB3YWl0aW5nIGZvciBwbGF0Zm9ybSByZXNwb25zZVwiKSlcbiAgICAgICk7XG4gICAgfSwgMjAwMCk7XG5cbiAgICBjb25zdCByZWNlaXZlTWVzc2FnZSA9IChldmVudDogTWVzc2FnZUV2ZW50KSA9PiB7XG4gICAgICBpZiAoXG4gICAgICAgIHR5cGVvZiBldmVudC5kYXRhID09PSBcIm9iamVjdFwiICYmXG4gICAgICAgIGV2ZW50LmRhdGEuc3ViamVjdCA9PT0gXCJsdGkuZ2V0X2RhdGEucmVzcG9uc2VcIiAmJlxuICAgICAgICBldmVudC5kYXRhLm1lc3NhZ2VfaWQgPT09IHN0YXRlICYmXG4gICAgICAgIChldmVudC5vcmlnaW4gPT09IHBsYXRmb3JtT3JpZ2luIHx8IHBsYXRmb3JtT3JpZ2luID09PSBcIipcIilcbiAgICAgICkge1xuICAgICAgICByZW1vdmVFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCByZWNlaXZlTWVzc2FnZSk7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcblxuICAgICAgICBpZiAoZXZlbnQuZGF0YS5lcnJvcikge1xuICAgICAgICAgIC8vIGhhbmRsZSBlcnJvcnNcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGV2ZW50LmRhdGEuZXJyb3IuY29kZSk7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihldmVudC5kYXRhLmVycm9yLm1lc3NhZ2UpO1xuICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoZXZlbnQuZGF0YS5lcnJvcm1lc3NhZ2UpKTtcbiAgICAgICAgfVxuICAgICAgICByZXNvbHZlKGV2ZW50LmRhdGEudmFsdWUpO1xuICAgICAgfVxuICAgIH07XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIHJlY2VpdmVNZXNzYWdlKTtcbiAgICBnZXRUYXJnZXRGcmFtZShzdG9yYWdlUGFyYW1zKVxuICAgICAgLnRoZW4oKHRhcmdldEZyYW1lKSA9PlxuICAgICAgICB0YXJnZXRGcmFtZS5wb3N0TWVzc2FnZShcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzdWJqZWN0OiBcImx0aS5nZXRfZGF0YVwiLFxuICAgICAgICAgICAgbWVzc2FnZV9pZDogc3RhdGUsXG4gICAgICAgICAgICBrZXk6IGAke1NUQVRFX0tFWV9QUkVGSVh9JHtzdGF0ZX1gLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgcGxhdGZvcm1PcmlnaW5cbiAgICAgICAgKVxuICAgICAgKVxuICAgICAgLmNhdGNoKChlOiB1bmtub3duKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGkxOG5leHQudChcIkNvdWxkIG5vdCBmaW5kIHRhcmdldCBmcmFtZVwiKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGUpO1xuICAgICAgICByZWplY3QobmV3IEVycm9yKGkxOG5leHQudChcIkNvdWxkIG5vdCBmaW5kIHRhcmdldCBmcmFtZVwiKSkpO1xuICAgICAgfSk7XG4gICAgLy8gUGxhdGZvcm0gd2lsbCBwb3N0IGEgbWVzc2FnZSBiYWNrXG4gIH0pO1xufVxuIiwgImltcG9ydCBpMThuZXh0IGZyb20gXCJpMThuZXh0XCI7XG5pbXBvcnQgeyBJbml0U2V0dGluZ3MgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7IHByaXZhY3lIdG1sIH0gZnJvbSBcIi4vcHJpdmFjeVwiO1xuaW1wb3J0IHsgTUFJTl9DT05URU5UX0lEIH0gZnJvbSBcIi4uL2xpYnMvY29uc3RhbnRzXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBzaG93Q29va2llRXJyb3Ioc2V0dGluZ3M6IEluaXRTZXR0aW5ncykge1xuICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChNQUlOX0NPTlRFTlRfSUQpO1xuXG4gIGlmICghY29udGFpbmVyKSB7XG4gICAgdGhyb3cgaTE4bmV4dC50KFwiQ291bGQgbm90IGZpbmQgbWFpbi1jb250ZW50IGVsZW1lbnRcIik7XG4gIH1cblxuICBjb250YWluZXIuaW5uZXJIVE1MID0gYFxuICAgIDxkaXYgaWQ9XCJjb29raWVfZXJyb3JcIiBjbGFzcz1cImFqLWNlbnRlcmVkLW1lc3NhZ2VcIj5cbiAgICAgIDxoMSBjbGFzcz1cImFqLXRpdGxlXCI+XG4gICAgICAgIDxpIGNsYXNzPVwibWF0ZXJpYWwtaWNvbnMtb3V0bGluZWQgYWotaWNvblwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPmNvb2tpZV9vZmY8L2k+XG4gICAgICAgICR7aTE4bmV4dC50KFwiQ29va2llcyBSZXF1aXJlZFwiKX1cbiAgICAgIDwvaDE+XG4gICAgICA8cCBjbGFzcz1cImFqLXRleHRcIj5cbiAgICAgICAgJHtwcml2YWN5SHRtbChzZXR0aW5ncyl9XG4gICAgICA8L3A+XG4gICAgICA8cCBjbGFzcz1cImFqLXRleHRcIj5cbiAgICAgICAgJHtpMThuZXh0LnQoXCJQbGVhc2UgY2hlY2sgeW91ciBicm93c2VyIHNldHRpbmdzIGFuZCBlbmFibGUgY29va2llcy5cIil9XG4gICAgICA8L3A+XG4gICAgPC9kaXY+XG4gIGA7XG59XG4iLCAiaW1wb3J0IHsgSW5pdFNldHRpbmdzIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgeyBoYXNTdG9yYWdlQWNjZXNzQVBJIH0gZnJvbSBcIi4vcGxhdGZvcm1fc3RvcmFnZVwiO1xuaW1wb3J0IHsgaGFzQ29va2llIH0gZnJvbSBcIi4vY29va2llc1wiO1xuaW1wb3J0IHsgc3RvcmVTdGF0ZSB9IGZyb20gXCIuL3BsYXRmb3JtX3N0b3JhZ2VcIjtcbmltcG9ydCB7IHNob3dMYXVuY2hOZXdXaW5kb3cgfSBmcm9tIFwiLi4vaHRtbC9sYXVuY2hfbmV3X3dpbmRvd1wiO1xuaW1wb3J0IHsgc2hvd0Nvb2tpZUVycm9yIH0gZnJvbSBcIi4uL2h0bWwvY29va2llX2Vycm9yXCI7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsdGlTdG9yYWdlTGF1bmNoKHNldHRpbmdzOiBJbml0U2V0dGluZ3MpIHtcbiAgbGV0IHN1Ym1pdFRvUGxhdGZvcm0gPSAoKSA9PiB7XG4gICAgd2luZG93LmxvY2F0aW9uLnJlcGxhY2Uoc2V0dGluZ3MucmVzcG9uc2VVcmwpO1xuICB9O1xuXG4gIGlmIChoYXNDb29raWUoc2V0dGluZ3MpKSB7XG4gICAgLy8gV2UgaGF2ZSBjb29raWVzXG4gICAgcmV0dXJuIHN1Ym1pdFRvUGxhdGZvcm0oKTtcbiAgfVxuXG4gIGlmIChzZXR0aW5ncy5sdGlTdG9yYWdlUGFyYW1zKSB7XG4gICAgLy8gV2UgaGF2ZSBsdGkgcG9zdE1lc3NhZ2Ugc3RvcmFnZVxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBzdG9yZVN0YXRlKHNldHRpbmdzLnN0YXRlLCBzZXR0aW5ncy5sdGlTdG9yYWdlUGFyYW1zKTtcbiAgICAgIHJldHVybiBzdWJtaXRUb1BsYXRmb3JtKCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICB9XG4gIH1cblxuICBpZiAod2luZG93LnNlbGYgIT09IHdpbmRvdy50b3ApIHtcbiAgICBsZXQgc2hvd1JlcXVlc3RTdG9yYWdlQWNjZXNzID0gZmFsc2U7XG4gICAgaWYgKGhhc1N0b3JhZ2VBY2Nlc3NBUEkoKSkge1xuICAgICAgLy8gV2UgaGF2ZSBzdG9yYWdlIGFjY2VzcyBBUEksIHdoaWNoIHdpbGwgd29yayBmb3IgU2FmYXJpIGFzIGxvbmcgYXMgdGhlXG4gICAgICAvLyB1c2VyIGFscmVhZHkgaGFzIHVzZWQgdGhlIGFwcGxpY2F0aW9uIGluIHRoZSB0b3AgbGF5ZXIgYW5kIGl0IHNldCBhIGNvb2tpZS5cbiAgICAgIHRyeSB7XG4gICAgICAgIGxldCBoYXNBY2Nlc3MgPSBhd2FpdCBkb2N1bWVudC5oYXNTdG9yYWdlQWNjZXNzKCk7XG4gICAgICAgIGlmICghaGFzQWNjZXNzKSB7XG4gICAgICAgICAgc2hvd1JlcXVlc3RTdG9yYWdlQWNjZXNzID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLmxvZyhlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgc2hvd0xhdW5jaE5ld1dpbmRvdyhzZXR0aW5ncywge1xuICAgICAgc2hvd1JlcXVlc3RTdG9yYWdlQWNjZXNzLFxuICAgICAgZGlzYWJsZUxhdW5jaDogZmFsc2UsXG4gICAgICBzaG93U3RvcmFnZUFjY2Vzc0RlbmllZDogZmFsc2UsXG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgc2hvd0Nvb2tpZUVycm9yKHNldHRpbmdzKTtcbiAgfVxufVxuIiwgIntcbiAgICBcIkNvb2tpZXMgUmVxdWlyZWRcIjogXCJHYWxsZXRhcyByZXF1ZXJpZGFzXCIsXG4gICAgXCJUaGVyZSB3YXMgYW4gZXJyb3IgbGF1bmNoaW5nIHRoZSBMVEkgdG9vbC4gUGxlYXNlIHJlbG9hZCBhbmQgdHJ5IGFnYWluLlwiOiBcIkh1Ym8gdW4gZXJyb3IgYWwgaW5pY2lhciBsYSBoZXJyYW1pZW50YSBMVEkuIFZ1ZWx2YSBhIGNhcmdhciB5IHZ1ZWx2YSBhIGludGVudGFybG8uXCIsXG4gICAgXCJQbGVhc2UgY2xpY2sgdGhlIGJ1dHRvbiBiZWxvdyB0byByZWxvYWQgaW4gYSBuZXcgd2luZG93LlwiOiBcIkhhZ2EgY2xpYyBlbiBlbCBib3RcdTAwRjNuIGRlIGFiYWpvIHBhcmEgcmVjYXJnYXIgZW4gdW5hIG51ZXZhIHZlbnRhbmEuXCIsXG4gICAgXCJPcGVuIGluIGEgbmV3IHdpbmRvd1wiOiBcIkFicmlyIGVuIHVuYSBudWV2YSB2ZW50YW5hXCIsXG4gICAgXCJJZiB5b3UgaGF2ZSB1c2VkIHRoaXMgYXBwbGljYXRpb24gYmVmb3JlLCB5b3VyIGJyb3dzZXIgbWF5IGFsbG93IHlvdSB0byA8YSBpZD0ncmVxdWVzdF9zdG9yYWdlX2FjY2Vzc19saW5rJyBocmVmPScjJz5lbmFibGUgY29va2llczwvYT4gYW5kIHByZXZlbnQgdGhpcyBtZXNzYWdlIGluIHRoZSBmdXR1cmUuXCI6IFwiU2kgaGEgdXRpbGl6YWRvIGVzdGEgYXBsaWNhY2lcdTAwRjNuIGFudGVyaW9ybWVudGUsIHN1IG5hdmVnYWRvciBwdWVkZSBwZXJtaXRpcmxlIDxhIGlkPSdyZXF1ZXN0X3N0b3JhZ2VfYWNjZXNzX2xpbmsnIGhyZWY9JyMnPmhhYmlsaXRhciBjb29raWVzPC9hPiB5IGV2aXRhciBlc3RlIG1lbnNhamUgZW4gZWwgZnV0dXJvLlwiLFxuICAgIFwiVGhlIGJyb3dzZXIgcHJldmVudGVkIGFjY2Vzcy4gIFRyeSBsYXVuY2hpbmcgaW4gYSBuZXcgd2luZG93IGZpcnN0IGFuZCB0aGVuIGNsaWNraW5nIHRoaXMgb3B0aW9uIGFnYWluIG5leHQgdGltZS4gSWYgdGhhdCBkb2Vzbid0IHdvcmsgY2hlY2sgeW91ciBwcml2YWN5IHNldHRpbmdzLiBTb21lIGJyb3dzZXJzIHdpbGwgcHJldmVudCBhbGwgdGhpcmQgcGFydHkgY29va2llcy5cIjogXCJFbCBuYXZlZ2Fkb3IgaW1waWRpXHUwMEYzIGVsIGFjY2Vzby4gSW50ZW50ZSBpbmljaWFyIHByaW1lcm8gZW4gdW5hIG51ZXZhIHZlbnRhbmEgeSBsdWVnbyB2dWVsdmEgYSBoYWNlciBjbGljIGVuIGVzdGEgb3BjaVx1MDBGM24gbGEgcHJcdTAwRjN4aW1hIHZlei4gU2kgZXNvIG5vIGZ1bmNpb25hLCB2ZXJpZmlxdWUgc3UgY29uZmlndXJhY2lcdTAwRjNuIGRlIHByaXZhY2lkYWQuIEFsZ3Vub3MgbmF2ZWdhZG9yZXMgZXZpdGFyXHUwMEUxbiB0b2RhcyBsYXMgY29va2llcyBkZSB0ZXJjZXJvcy5cIixcbiAgICBcIldlIHVzZSBjb29raWVzIGZvciBsb2dpbiBhbmQgc2VjdXJpdHkuXCI6IFwiVXNhbW9zIGNvb2tpZXMgcGFyYSBpbmljaW8gZGUgc2VzaVx1MDBGM24geSBzZWd1cmlkYWQuXCIsXG4gICAgXCJMZWFybiBtb3JlIGluIG91ciA8YSBocmVmPSd7e3VybH19JyB0YXJnZXQ9J19ibGFuayc+cHJpdmFjeSBwb2xpY3k8L2E+LlwiOiBcIk9idFx1MDBFOW4gbVx1MDBFMXMgaW5mb3JtYWNpXHUwMEYzbiBlbiBudWVzdHJhIDxhIGhyZWY9J3t7dXJsfX0nIHRhcmdldD0nX2JsYW5rJz5wb2xcdTAwRUR0aWNhIGRlIHByaXZhY2lkYWQ8L2E+LlwiLFxuICAgIFwiUGxlYXNlIGNoZWNrIHlvdXIgYnJvd3NlciBzZXR0aW5ncyBhbmQgZW5hYmxlIGNvb2tpZXMuXCI6IFwiVmVyaWZpcXVlIGxhIGNvbmZpZ3VyYWNpXHUwMEYzbiBkZSBzdSBuYXZlZ2Fkb3IgeSBoYWJpbGl0ZSBsYXMgY29va2llcy5cIlxufVxuIiwgIntcbiAgICBcIkNvb2tpZXMgUmVxdWlyZWRcIjogXCJDb29raWVzIG5cdTAwRTljZXNzYWlyZXNcIixcbiAgICBcIlRoZXJlIHdhcyBhbiBlcnJvciBsYXVuY2hpbmcgdGhlIExUSSB0b29sLiBQbGVhc2UgcmVsb2FkIGFuZCB0cnkgYWdhaW4uXCI6IFwiVW5lIGVycmV1ciBzJ2VzdCBwcm9kdWl0ZSBsb3JzIGR1IGxhbmNlbWVudCBkZSBsJ291dGlsIExUSS4gVmV1aWxsZXogcmVjaGFyZ2VyIGV0IHJcdTAwRTllc3NheWVyLlwiLFxuICAgIFwiUGxlYXNlIGNsaWNrIHRoZSBidXR0b24gYmVsb3cgdG8gcmVsb2FkIGluIGEgbmV3IHdpbmRvdy5cIjogXCJWZXVpbGxleiBjbGlxdWVyIHN1ciBsZSBib3V0b24gY2ktZGVzc291cyBwb3VyIHJlY2hhcmdlciBkYW5zIHVuZSBub3V2ZWxsZSBmZW5cdTAwRUF0cmUuXCIsXG4gICAgXCJPcGVuIGluIGEgbmV3IHdpbmRvd1wiOiBcIk91dnJpciBkYW5zIHVuZSBub3V2ZWxsZSBmZW5cdTAwRUF0cmVcIixcbiAgICBcIklmIHlvdSBoYXZlIHVzZWQgdGhpcyBhcHBsaWNhdGlvbiBiZWZvcmUsIHlvdXIgYnJvd3NlciBtYXkgYWxsb3cgeW91IHRvIDxhIGlkPSdyZXF1ZXN0X3N0b3JhZ2VfYWNjZXNzX2xpbmsnIGhyZWY9JyMnPmVuYWJsZSBjb29raWVzPC9hPiBhbmQgcHJldmVudCB0aGlzIG1lc3NhZ2UgaW4gdGhlIGZ1dHVyZS5cIjogXCJTaSB2b3VzIGF2ZXogZFx1MDBFOWpcdTAwRTAgdXRpbGlzXHUwMEU5IGNldHRlIGFwcGxpY2F0aW9uLCB2b3RyZSBuYXZpZ2F0ZXVyIHBldXQgdm91cyBwZXJtZXR0cmUgZCc8YSBpZD0ncmVxdWVzdF9zdG9yYWdlX2FjY2Vzc19saW5rJyBocmVmPScjJz5hY3RpdmVyIGxlcyBjb29raWVzPC9hPiBldCBlbXBcdTAwRUFjaGVyIGNlIG1lc3NhZ2UgXHUwMEUwIGwnYXZlbmlyLlwiLFxuICAgIFwiVGhlIGJyb3dzZXIgcHJldmVudGVkIGFjY2Vzcy4gIFRyeSBsYXVuY2hpbmcgaW4gYSBuZXcgd2luZG93IGZpcnN0IGFuZCB0aGVuIGNsaWNraW5nIHRoaXMgb3B0aW9uIGFnYWluIG5leHQgdGltZS4gSWYgdGhhdCBkb2Vzbid0IHdvcmsgY2hlY2sgeW91ciBwcml2YWN5IHNldHRpbmdzLiBTb21lIGJyb3dzZXJzIHdpbGwgcHJldmVudCBhbGwgdGhpcmQgcGFydHkgY29va2llcy5cIjogXCJMZSBuYXZpZ2F0ZXVyIGEgZW1wXHUwMEVBY2hcdTAwRTkgbCdhY2NcdTAwRThzLiBFc3NheWV6IGQnYWJvcmQgZGUgbGFuY2VyIGRhbnMgdW5lIG5vdXZlbGxlIGZlblx1MDBFQXRyZSwgcHVpcyBjbGlxdWV6IFx1MDBFMCBub3V2ZWF1IHN1ciBjZXR0ZSBvcHRpb24gbGEgcHJvY2hhaW5lIGZvaXMuIFNpIGNlbGEgbmUgZm9uY3Rpb25uZSBwYXMsIHZcdTAwRTlyaWZpZXogdm9zIHBhcmFtXHUwMEU4dHJlcyBkZSBjb25maWRlbnRpYWxpdFx1MDBFOS4gQ2VydGFpbnMgbmF2aWdhdGV1cnMgZW1wXHUwMEVBY2hlcm9udCB0b3VzIGxlcyBjb29raWVzIHRpZXJzLlwiLFxuICAgIFwiV2UgdXNlIGNvb2tpZXMgZm9yIGxvZ2luIGFuZCBzZWN1cml0eS5cIjogXCJOb3VzIHV0aWxpc29ucyBkZXMgY29va2llcyBwb3VyIGxhIGNvbm5leGlvbiBldCBsYSBzXHUwMEU5Y3VyaXRcdTAwRTkuXCIsXG4gICAgXCJMZWFybiBtb3JlIGluIG91ciA8YSBocmVmPSd7e3VybH19JyB0YXJnZXQ9J19ibGFuayc+cHJpdmFjeSBwb2xpY3k8L2E+LlwiOiBcIkVuIHNhdm9pciBwbHVzIGRhbnMgbm90cmUgPGEgaHJlZj0ne3t1cmx9fScgdGFyZ2V0PSdfYmxhbmsnPnBvbGl0aXF1ZSBkZSBjb25maWRlbnRpYWxpdFx1MDBFOTwvYT4uXCIsXG4gICAgXCJQbGVhc2UgY2hlY2sgeW91ciBicm93c2VyIHNldHRpbmdzIGFuZCBlbmFibGUgY29va2llcy5cIjogXCJWZXVpbGxleiB2XHUwMEU5cmlmaWVyIGxlcyBwYXJhbVx1MDBFOHRyZXMgZGUgdm90cmUgbmF2aWdhdGV1ciBldCBhY3RpdmVyIGxlcyBjb29raWVzLlwiXG59XG4iLCAiaW1wb3J0IGkxOG5leHQgZnJvbSBcImkxOG5leHRcIjtcbmltcG9ydCBMYW5ndWFnZURldGVjdG9yIGZyb20gXCJpMThuZXh0LWJyb3dzZXItbGFuZ3VhZ2VkZXRlY3RvclwiO1xuaW1wb3J0IHsgbHRpU3RvcmFnZUxhdW5jaCB9IGZyb20gXCIuLi9saWJzL2x0aV9zdG9yYWdlX2xhdW5jaFwiO1xuaW1wb3J0IGVzIGZyb20gXCIuLi9sb2NhbGUvZXMuanNvblwiO1xuaW1wb3J0IGZyIGZyb20gXCIuLi9sb2NhbGUvZnIuanNvblwiO1xuaW1wb3J0IHsgTUFJTl9DT05URU5UX0lEIH0gZnJvbSBcIi4uL2xpYnMvY29uc3RhbnRzXCI7XG5pbXBvcnQgeyBJbml0U2V0dGluZ3MgfSBmcm9tIFwiLi4vdHlwZXNcIjtcblxuZnVuY3Rpb24gc2hvd0Vycm9yKCkge1xuICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChNQUlOX0NPTlRFTlRfSUQpO1xuICBpZiAoIWNvbnRhaW5lcikge1xuICAgIHRocm93IFwiQ291bGQgbm90IGZpbmQgbWFpbi1jb250ZW50IGVsZW1lbnRcIjtcbiAgfVxuICBjb250YWluZXIuaW5uZXJIVE1MICs9IGBcbiAgICA8ZGl2IGNsYXNzPVwidS1mbGV4IGFqLWNlbnRlcmVkLW1lc3NhZ2VcIj5cbiAgICAgIDxpIGNsYXNzPVwibWF0ZXJpYWwtaWNvbnMtb3V0bGluZWQgYWotaWNvblwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPndhcm5pbmc8L2k+XG4gICAgICA8cCBjbGFzcz1cImFqLXRleHQgdHJhbnNsYXRlXCI+XG4gICAgICAgICR7aTE4bmV4dC50KFxuICAgICAgICAgIFwiVGhlcmUgd2FzIGFuIGVycm9yIGxhdW5jaGluZyB0aGUgTFRJIHRvb2wuIFBsZWFzZSByZWxvYWQgYW5kIHRyeSBhZ2Fpbi5cIlxuICAgICAgICApfVxuICAgICAgPC9wPlxuICAgIDwvZGl2PlxuICBgO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5pdE9JRENMYXVuY2goc2V0dGluZ3M6IEluaXRTZXR0aW5ncykge1xuICBsZXQgaXNMYXVuY2hlZCA9IGZhbHNlO1xuXG4gIGkxOG5leHQudXNlKExhbmd1YWdlRGV0ZWN0b3IpLmluaXQoe1xuICAgIGRldGVjdGlvbjogeyBvcmRlcjogW1wicXVlcnlzdHJpbmdcIiwgXCJuYXZpZ2F0b3JcIl0gfSxcbiAgICBmYWxsYmFja0xuZzogXCJlblwiLFxuICAgIGtleVNlcGFyYXRvcjogZmFsc2UsXG4gIH0pO1xuXG4gIGkxOG5leHQuYWRkUmVzb3VyY2VCdW5kbGUoXCJlc1wiLCBcInRyYW5zbGF0aW9uXCIsIGVzKTtcbiAgaTE4bmV4dC5hZGRSZXNvdXJjZUJ1bmRsZShcImZyXCIsIFwidHJhbnNsYXRpb25cIiwgZnIpO1xuICBpMThuZXh0LmNoYW5nZUxhbmd1YWdlKCk7XG5cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkXCIsICgpID0+IHtcbiAgICBsdGlTdG9yYWdlTGF1bmNoKHNldHRpbmdzKTtcbiAgICBpc0xhdW5jaGVkID0gdHJ1ZTtcbiAgfSk7XG5cbiAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgaWYgKCFpc0xhdW5jaGVkKSB7XG4gICAgICBzaG93RXJyb3IoKTtcbiAgICB9XG4gIH0sIDUwMDApO1xufVxuIiwgImV4cG9ydCBjb25zdCBMVElfVkVSU0lPTiA9IFwiaHR0cHM6Ly9wdXJsLmltc2dsb2JhbC5vcmcvc3BlYy9sdGkvY2xhaW0vdmVyc2lvblwiO1xuZXhwb3J0IGNvbnN0IExBVU5DSF9QUkVTRU5UQVRJT04gPSBcImh0dHBzOi8vcHVybC5pbXNnbG9iYWwub3JnL3NwZWMvbHRpL2NsYWltL2xhdW5jaF9wcmVzZW50YXRpb25cIjtcbmV4cG9ydCBjb25zdCBERVBMT1lNRU5UX0lEID0gXCJodHRwczovL3B1cmwuaW1zZ2xvYmFsLm9yZy9zcGVjL2x0aS9jbGFpbS9kZXBsb3ltZW50X2lkXCI7XG5leHBvcnQgY29uc3QgTUVTU0FHRV9UWVBFID0gXCJodHRwczovL3B1cmwuaW1zZ2xvYmFsLm9yZy9zcGVjL2x0aS9jbGFpbS9tZXNzYWdlX3R5cGVcIjtcblxuLy8gQ2xhaW1zXG5leHBvcnQgY29uc3QgQ09OVEVYVF9DTEFJTSA9IFwiaHR0cHM6Ly9wdXJsLmltc2dsb2JhbC5vcmcvc3BlYy9sdGkvY2xhaW0vY29udGV4dFwiO1xuZXhwb3J0IGNvbnN0IFJFU09VUkNFX0xJTktfQ0xBSU0gPSBcImh0dHBzOi8vcHVybC5pbXNnbG9iYWwub3JnL3NwZWMvbHRpL2NsYWltL3Jlc291cmNlX2xpbmtcIjtcbmV4cG9ydCBjb25zdCBUT09MX1BMQVRGT1JNX0NMQUlNID0gXCJodHRwczovL3B1cmwuaW1zZ2xvYmFsLm9yZy9zcGVjL2x0aS9jbGFpbS90b29sX3BsYXRmb3JtXCI7XG5leHBvcnQgY29uc3QgQUdTX0NMQUlNID0gXCJodHRwczovL3B1cmwuaW1zZ2xvYmFsLm9yZy9zcGVjL2x0aS1hZ3MvY2xhaW0vZW5kcG9pbnRcIjtcbmV4cG9ydCBjb25zdCBCQVNJQ19PVVRDT01FX0NMQUlNID0gXCJodHRwczovL3B1cmwuaW1zZ2xvYmFsLm9yZy9zcGVjL2x0aS1iby9jbGFpbS9iYXNpY291dGNvbWVcIjtcblxuZXhwb3J0IGNvbnN0IE1FTlRPUl9DTEFJTSA9IFwiaHR0cHM6Ly9wdXJsLmltc2dsb2JhbC5vcmcvc3BlYy9sdGkvY2xhaW0vcm9sZV9zY29wZV9tZW50b3JcIjtcbmV4cG9ydCBjb25zdCBST0xFU19DTEFJTSA9IFwiaHR0cHM6Ly9wdXJsLmltc2dsb2JhbC5vcmcvc3BlYy9sdGkvY2xhaW0vcm9sZXNcIjtcblxuZXhwb3J0IGNvbnN0IENVU1RPTV9DTEFJTSA9IFwiaHR0cHM6Ly9wdXJsLmltc2dsb2JhbC5vcmcvc3BlYy9sdGkvY2xhaW0vY3VzdG9tXCI7XG5leHBvcnQgY29uc3QgRVhURU5TSU9OX0NMQUlNID0gXCJodHRwOi8vd3d3LkV4YW1wbGVQbGF0Zm9ybVZlbmRvci5jb20vc2Vzc2lvblwiO1xuXG5leHBvcnQgY29uc3QgTElTX0NMQUlNID0gXCJodHRwczovL3B1cmwuaW1zZ2xvYmFsLm9yZy9zcGVjL2x0aS9jbGFpbS9saXNcIjtcbmV4cG9ydCBjb25zdCBUQVJHRVRfTElOS19VUklfQ0xBSU0gPSBcImh0dHBzOi8vcHVybC5pbXNnbG9iYWwub3JnL3NwZWMvbHRpL2NsYWltL3RhcmdldF9saW5rX3VyaVwiO1xuZXhwb3J0IGNvbnN0IExUSTExX0xFR0FDWV9VU0VSX0lEX0NMQUlNID0gXCJodHRwczovL3B1cmwuaW1zZ2xvYmFsLm9yZy9zcGVjL2x0aS9jbGFpbS9sdGkxMV9sZWdhY3lfdXNlcl9pZFwiO1xuZXhwb3J0IGNvbnN0IExUSTFQMV9DTEFJTSA9IFwiaHR0cHM6Ly9wdXJsLmltc2dsb2JhbC5vcmcvc3BlYy9sdGkvY2xhaW0vbHRpMXAxXCI7XG5cbmV4cG9ydCBjb25zdCBERUVQX0xJTktJTkdfQ0xBSU0gPSBcImh0dHBzOi8vcHVybC5pbXNnbG9iYWwub3JnL3NwZWMvbHRpLWRsL2NsYWltL2RlZXBfbGlua2luZ19zZXR0aW5nc1wiO1xuZXhwb3J0IGNvbnN0IERFRVBfTElOS0lOR19EQVRBX0NMQUlNID0gXCJodHRwczovL3B1cmwuaW1zZ2xvYmFsLm9yZy9zcGVjL2x0aS1kbC9jbGFpbS9kYXRhXCI7XG5leHBvcnQgY29uc3QgREVFUF9MSU5LSU5HX1RPT0xfTVNHX0NMQUlNID0gXCJodHRwczovL3B1cmwuaW1zZ2xvYmFsLm9yZy9zcGVjL2x0aS1kbC9jbGFpbS9tc2dcIjtcbmV4cG9ydCBjb25zdCBERUVQX0xJTktJTkdfVE9PTF9MT0dfQ0xBSU0gPSBcImh0dHBzOi8vcHVybC5pbXNnbG9iYWwub3JnL3NwZWMvbHRpLWRsL2NsYWltL2xvZ1wiO1xuZXhwb3J0IGNvbnN0IENPTlRFTlRfSVRFTV9DTEFJTSA9IFwiaHR0cHM6Ly9wdXJsLmltc2dsb2JhbC5vcmcvc3BlYy9sdGktZGwvY2xhaW0vY29udGVudF9pdGVtc1wiO1xuZXhwb3J0IGNvbnN0IE5BTUVTX0FORF9ST0xFU19DTEFJTSA9IFwiaHR0cHM6Ly9wdXJsLmltc2dsb2JhbC5vcmcvc3BlYy9sdGktbnJwcy9jbGFpbS9uYW1lc3JvbGVzZXJ2aWNlXCI7XG5leHBvcnQgY29uc3QgTUlHUkFUSU9OX0NMQUlNID0gXCJodHRwczovL3B1cmwuaW1zZ2xvYmFsLm9yZy9zcGVjL2x0aS9jbGFpbS9sdGkxcDFcIjtcblxuZXhwb3J0IGNvbnN0IE5BTUVTX0FORF9ST0xFU19TRVJWSUNFX1ZFUlNJT05TID0gW1wiMi4wXCJdO1xuXG5leHBvcnQgY29uc3QgQ0FMSVBFUl9DTEFJTSA9IFwiaHR0cHM6Ly9wdXJsLmltc2dsb2JhbC5vcmcvc3BlYy9sdGktY2VzL2NsYWltL2NhbGlwZXItZW5kcG9pbnQtc2VydmljZVwiO1xuXG5leHBvcnQgY29uc3QgVE9PTF9MQVVOQ0hfQ0FMSVBFUl9DT05URVhUID0gXCJodHRwOi8vcHVybC5pbXNnbG9iYWwub3JnL2N0eC9jYWxpcGVyL3YxcDEvVG9vbExhdW5jaFByb2ZpbGUtZXh0ZW5zaW9uXCI7XG5leHBvcnQgY29uc3QgVE9PTF9VU0VfQ0FMSVBFUl9DT05URVhUID0gXCJodHRwOi8vcHVybC5pbXNnbG9iYWwub3JnL2N0eC9jYWxpcGVyL3YxcDFcIjtcblxuLy8gU2NvcGVzXG5leHBvcnQgY29uc3QgQUdTX1NDT1BFX0xJTkVfSVRFTSA9IFwiaHR0cHM6Ly9wdXJsLmltc2dsb2JhbC5vcmcvc3BlYy9sdGktYWdzL3Njb3BlL2xpbmVpdGVtXCI7XG5leHBvcnQgY29uc3QgQUdTX1NDT1BFX0xJTkVfSVRFTV9SRUFET05MWSA9IFwiaHR0cHM6Ly9wdXJsLmltc2dsb2JhbC5vcmcvc3BlYy9sdGktYWdzL3Njb3BlL2xpbmVpdGVtLnJlYWRvbmx5XCI7XG5leHBvcnQgY29uc3QgQUdTX1NDT1BFX1JFU1VMVCA9IFwiaHR0cHM6Ly9wdXJsLmltc2dsb2JhbC5vcmcvc3BlYy9sdGktYWdzL3Njb3BlL3Jlc3VsdC5yZWFkb25seVwiO1xuZXhwb3J0IGNvbnN0IEFHU19TQ09QRV9TQ09SRSA9IFwiaHR0cHM6Ly9wdXJsLmltc2dsb2JhbC5vcmcvc3BlYy9sdGktYWdzL3Njb3BlL3Njb3JlXCI7XG5leHBvcnQgY29uc3QgTkFNRVNfQU5EX1JPTEVTX1NDT1BFID0gXCJodHRwczovL3B1cmwuaW1zZ2xvYmFsLm9yZy9zcGVjL2x0aS1ucnBzL3Njb3BlL2NvbnRleHRtZW1iZXJzaGlwLnJlYWRvbmx5XCI7XG5leHBvcnQgY29uc3QgQ0FMSVBFUl9TQ09QRSA9IFwiaHR0cHM6Ly9wdXJsLmltc2dsb2JhbC5vcmcvc3BlYy9sdGktY2VzL3YxcDAvc2NvcGUvc2VuZFwiO1xuXG5leHBvcnQgY29uc3QgU1RVREVOVF9TQ09QRSA9IFwiaHR0cDovL3B1cmwuaW1zZ2xvYmFsLm9yZy92b2NhYi9saXMvdjIvaW5zdGl0dXRpb24vcGVyc29uI1N0dWRlbnRcIjtcbmV4cG9ydCBjb25zdCBJTlNUUlVDVE9SX1NDT1BFID0gXCJodHRwOi8vcHVybC5pbXNnbG9iYWwub3JnL3ZvY2FiL2xpcy92Mi9pbnN0aXR1dGlvbi9wZXJzb24jSW5zdHJ1Y3RvclwiO1xuZXhwb3J0IGNvbnN0IExFQVJORVJfU0NPUEUgPSBcImh0dHA6Ly9wdXJsLmltc2dsb2JhbC5vcmcvdm9jYWIvbGlzL3YyL21lbWJlcnNoaXAjTGVhcm5lclwiO1xuZXhwb3J0IGNvbnN0IE1FTlRPUl9TQ09QRSA9IFwiaHR0cDovL3B1cmwuaW1zZ2xvYmFsLm9yZy92b2NhYi9saXMvdjIvbWVtYmVyc2hpcCNNZW50b3JcIjtcbmV4cG9ydCBjb25zdCBNRU5UT1JfUk9MRV9TQ09QRSA9IFwiYTYyYzUyYzAyYmEyNjIwMDNmNWVcIjtcblxuLy8gTGF1bmNoIGNvbnRleHRzXG5leHBvcnQgY29uc3QgQ09VUlNFX0NPTlRFWFQgPSBcImh0dHA6Ly9wdXJsLmltc2dsb2JhbC5vcmcvdm9jYWIvbGlzL3YyL2NvdXJzZSNDb3Vyc2VPZmZlcmluZ1wiO1xuZXhwb3J0IGNvbnN0IEFDQ09VTlRfQ09OVEVYVCA9IFwiQWNjb3VudFwiO1xuXG4vLyBDb25maWd1cmF0aW9uXG5leHBvcnQgY29uc3QgTFRJX1RPT0xfQ09ORklHVVJBVElPTiA9IFwiaHR0cHM6Ly9wdXJsLmltc2dsb2JhbC5vcmcvc3BlYy9sdGktdG9vbC1jb25maWd1cmF0aW9uXCI7XG5leHBvcnQgY29uc3QgTFRJX1BMQVRGT1JNX0NPTkZJR1VSQVRJT04gPSBcImh0dHBzOi8vcHVybC5pbXNnbG9iYWwub3JnL3NwZWMvbHRpLXBsYXRmb3JtLWNvbmZpZ3VyYXRpb25cIjtcblxuLy8gU3BlY2ZpZXMgYWxsIGF2YWlsYWJsZSBzY29wZXMuXG5leHBvcnQgY29uc3QgQUxMX1NDT1BFUyA9IFtcbiAgQUdTX1NDT1BFX0xJTkVfSVRFTSxcbiAgQUdTX1NDT1BFX0xJTkVfSVRFTV9SRUFET05MWSxcbiAgQUdTX1NDT1BFX1JFU1VMVCxcbiAgQUdTX1NDT1BFX1NDT1JFLFxuICBOQU1FU19BTkRfUk9MRVNfU0NPUEUsXG5dO1xuXG4vLyBDYW52YXMgc3BlY2lmaWNcbmV4cG9ydCBjb25zdCBDQU5WQVNfUFVCTElDX0pXS1NfVVJMID0gXCJodHRwczovL3Nzby5jYW52YXNsbXMuY29tL2FwaS9sdGkvc2VjdXJpdHkvandrc1wiO1xuZXhwb3J0IGNvbnN0IENBTlZBU19BVVRIX1RPS0VOX1VSTCA9IFwiaHR0cHM6Ly9jYW52YXMuaW5zdHJ1Y3R1cmUuY29tL2xvZ2luL29hdXRoMi90b2tlblwiO1xuZXhwb3J0IGNvbnN0IENBTlZBU19PSURDX1VSTCA9IFwiaHR0cHM6Ly9zc28uY2FudmFzbG1zLmNvbS9hcGkvbHRpL2F1dGhvcml6ZV9yZWRpcmVjdFwiO1xuXG5leHBvcnQgY29uc3QgQ0FOVkFTX0JFVEFfUFVCTElDX0pXS1NfVVJMID0gXCJodHRwczovL3Nzby5iZXRhLmNhbnZhc2xtcy5jb20vYXBpL2x0aS9zZWN1cml0eS9qd2tzXCI7XG5leHBvcnQgY29uc3QgQ0FOVkFTX0JFVEFfQVVUSF9UT0tFTl9VUkwgPSBcImh0dHBzOi8vc3NvLmJldGEuY2FudmFzbG1zLmNvbS9sb2dpbi9vYXV0aDIvdG9rZW5cIjtcbmV4cG9ydCBjb25zdCBDQU5WQVNfQkVUQV9PSURDX1VSTCA9IFwiaHR0cHM6Ly9zc28uYmV0YS5jYW52YXNsbXMuY29tL2FwaS9sdGkvYXV0aG9yaXplX3JlZGlyZWN0XCI7XG5cbmV4cG9ydCBjb25zdCBDQU5WQVNfU1VCTUlTU0lPTl9UWVBFID0gXCJodHRwczovL2NhbnZhcy5pbnN0cnVjdHVyZS5jb20vbHRpL3N1Ym1pc3Npb25fdHlwZVwiO1xuXG5leHBvcnQgY29uc3QgQ0FOVkFTX1BSSVZBQ1lfTEVWRUwgPSBcImh0dHBzOi8vY2FudmFzLmluc3RydWN0dXJlLmNvbS9sdGkvcHJpdmFjeV9sZXZlbFwiO1xuZXhwb3J0IGNvbnN0IENBTlZBU19QTEFDRU1FTlRfVklTSUJJTElUWSA9IFwiaHR0cHM6Ly9jYW52YXMuaW5zdHJ1Y3R1cmUuY29tL2x0aS92aXNpYmlsaXR5XCI7XG5leHBvcnQgY29uc3QgQ0FOVkFTX1BMQUNFTUVOVF9DT1VSU0VfTkFWSUdBVElPTl9FTkFCTEVEID0gXCJodHRwczovL2NhbnZhcy5pbnN0cnVjdHVyZS5jb20vbHRpL2NvdXJzZV9uYXZpZ2F0aW9uL2RlZmF1bHRfZW5hYmxlZFwiO1xuXG5pbnRlcmZhY2UgSWRUb2tlbkVycm9ycyB7XG4gIGVycm9yczoge1xuICAgIGVycm9ycz86IHtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGVudW0gTHRpVmVyc2lvbnMge1xuICB2MV8zXzAgPSAnMS4zLjAnLFxufVxuXG5leHBvcnQgZW51bSBEb2N1bWVudFRhcmdldHMge1xuICBpZnJhbWUgPSAnaWZyYW1lJyxcbiAgd2luZG93ID0gJ3dpbmRvdycsXG4gIGVtYmVkID0gJ2VtYmVkJyxcbn1cblxuZXhwb3J0IGVudW0gQWNjZXB0VHlwZXMge1xuICBsaW5rID0gJ2xpbmsnLFxuICBmaWxlID0gJ2ZpbGUnLFxuICBodG1sID0gJ2h0bWwnLFxuICBsdGlSZXNvdXJjZUxpbmsgPSAnbHRpUmVzb3VyY2VMaW5rJyxcbiAgaW1hZ2UgPSAnaW1hZ2UnLFxufVxuXG5leHBvcnQgZW51bSBNZXNzYWdlVHlwZXMge1xuICBMdGlSZXNvdXJjZUxpbmtSZXF1ZXN0ID0gJ0x0aVJlc291cmNlTGlua1JlcXVlc3QnLFxuICBMdGlEZWVwTGlua2luZ1JlcXVlc3QgPSAnTHRpRGVlcExpbmtpbmdSZXF1ZXN0JyxcbiAgTHRpRGVlcExpbmtpbmdSZXNwb25zZSA9IFwiTHRpRGVlcExpbmtpbmdSZXNwb25zZVwiLFxufVxuXG4vLyBCZWxvdyBhcmUgYWxsIHRoZSByb2xlcyBzcGVjaWZpZWQgaW4gdGhlIExUSSAxLjMgc3BlYy4gKGh0dHBzOi8vd3d3Lmltc2dsb2JhbC5vcmcvc3BlYy9sdGkvdjFwMyNyb2xlLXZvY2FidWxhcmllcy0wKVxuLy8gaHR0cHM6Ly93d3cuaW1zZ2xvYmFsLm9yZy9zcGVjL2x0aS92MXAzI3JvbGVzLWNsYWltXG5leHBvcnQgZW51bSBSb2xlcyB7XG4gIC8vIENvcmUgc3lzdGVtIHJvbGVzXG4gIEFkbWluaXN0cmF0b3JTeXN0ZW1Sb2xlID0gJ2h0dHA6Ly9wdXJsLmltc2dsb2JhbC5vcmcvdm9jYWIvbGlzL3YyL3N5c3RlbS9wZXJzb24jQWRtaW5pc3RyYXRvcicsXG4gIE5vbmVTeXN0ZW1Sb2xlID0gJ2h0dHA6Ly9wdXJsLmltc2dsb2JhbC5vcmcvdm9jYWIvbGlzL3YyL3N5c3RlbS9wZXJzb24jTm9uZScsXG5cbiAgLy8gTm9uXHUyMDExY29yZSBzeXN0ZW0gcm9sZXNcbiAgQWNjb3VudEFkbWluU3lzdGVtUm9sZSA9ICdodHRwOi8vcHVybC5pbXNnbG9iYWwub3JnL3ZvY2FiL2xpcy92Mi9zeXN0ZW0vcGVyc29uI0FjY291bnRBZG1pbicsXG4gIENyZWF0b3JTeXN0ZW1Sb2xlID0gJ2h0dHA6Ly9wdXJsLmltc2dsb2JhbC5vcmcvdm9jYWIvbGlzL3YyL3N5c3RlbS9wZXJzb24jQ3JlYXRvcicsXG4gIFN5c0FkbWluU3lzdGVtUm9sZSA9ICdodHRwOi8vcHVybC5pbXNnbG9iYWwub3JnL3ZvY2FiL2xpcy92Mi9zeXN0ZW0vcGVyc29uI1N5c0FkbWluJyxcbiAgU3lzU3VwcG9ydFN5c3RlbVJvbGUgPSAnaHR0cDovL3B1cmwuaW1zZ2xvYmFsLm9yZy92b2NhYi9saXMvdjIvc3lzdGVtL3BlcnNvbiNTeXNTdXBwb3J0JyxcbiAgVXNlclN5c3RlbVJvbGUgPSAnaHR0cDovL3B1cmwuaW1zZ2xvYmFsLm9yZy92b2NhYi9saXMvdjIvc3lzdGVtL3BlcnNvbiNVc2VyJyxcblxuICAvLyBDb3JlIGluc3RpdHV0aW9uIHJvbGVzXG4gIEFkbWluaXN0cmF0b3JJbnN0aXR1dGlvblJvbGUgPSAnaHR0cDovL3B1cmwuaW1zZ2xvYmFsLm9yZy92b2NhYi9saXMvdjIvaW5zdGl0dXRpb24vcGVyc29uI0FkbWluaXN0cmF0b3InLFxuICBGYWN1bHR5SW5zdGl0dXRpb25Sb2xlID0gJ2h0dHA6Ly9wdXJsLmltc2dsb2JhbC5vcmcvdm9jYWIvbGlzL3YyL2luc3RpdHV0aW9uL3BlcnNvbiNGYWN1bHR5JyxcbiAgR3Vlc3RJbnN0aXR1dGlvblJvbGUgPSAnaHR0cDovL3B1cmwuaW1zZ2xvYmFsLm9yZy92b2NhYi9saXMvdjIvaW5zdGl0dXRpb24vcGVyc29uI0d1ZXN0JyxcbiAgTm9uZUluc3RpdHV0aW9uUm9sZSA9ICdodHRwOi8vcHVybC5pbXNnbG9iYWwub3JnL3ZvY2FiL2xpcy92Mi9pbnN0aXR1dGlvbi9wZXJzb24jTm9uZScsXG4gIE90aGVySW5zdGl0dXRpb25Sb2xlID0gJ2h0dHA6Ly9wdXJsLmltc2dsb2JhbC5vcmcvdm9jYWIvbGlzL3YyL2luc3RpdHV0aW9uL3BlcnNvbiNPdGhlcicsXG4gIFN0YWZmSW5zdGl0dXRpb25Sb2xlID0gJ2h0dHA6Ly9wdXJsLmltc2dsb2JhbC5vcmcvdm9jYWIvbGlzL3YyL2luc3RpdHV0aW9uL3BlcnNvbiNTdGFmZicsXG4gIFN0dWRlbnRJbnN0aXR1dGlvblJvbGUgPSAnaHR0cDovL3B1cmwuaW1zZ2xvYmFsLm9yZy92b2NhYi9saXMvdjIvaW5zdGl0dXRpb24vcGVyc29uI1N0dWRlbnQnLFxuXG4gIC8vIE5vblx1MjAxMWNvcmUgaW5zdGl0dXRpb24gcm9sZXNcbiAgQWx1bW5pSW5zdGl0dXRpb25Sb2xlID0gJ2h0dHA6Ly9wdXJsLmltc2dsb2JhbC5vcmcvdm9jYWIvbGlzL3YyL2luc3RpdHV0aW9uL3BlcnNvbiNBbHVtbmknLFxuICBJbnN0cnVjdG9ySW5zdGl0dXRpb25Sb2xlID0gJ2h0dHA6Ly9wdXJsLmltc2dsb2JhbC5vcmcvdm9jYWIvbGlzL3YyL2luc3RpdHV0aW9uL3BlcnNvbiNJbnN0cnVjdG9yJyxcbiAgTGVhcm5lckluc3RpdHV0aW9uUm9sZSA9ICdodHRwOi8vcHVybC5pbXNnbG9iYWwub3JnL3ZvY2FiL2xpcy92Mi9pbnN0aXR1dGlvbi9wZXJzb24jTGVhcm5lcicsXG4gIE1lbWJlckluc3RpdHV0aW9uUm9sZSA9ICdodHRwOi8vcHVybC5pbXNnbG9iYWwub3JnL3ZvY2FiL2xpcy92Mi9pbnN0aXR1dGlvbi9wZXJzb24jTWVtYmVyJyxcbiAgTWVudG9ySW5zdGl0dXRpb25Sb2xlID0gJ2h0dHA6Ly9wdXJsLmltc2dsb2JhbC5vcmcvdm9jYWIvbGlzL3YyL2luc3RpdHV0aW9uL3BlcnNvbiNNZW50b3InLFxuICBPYnNlcnZlckluc3RpdHV0aW9uUm9sZSA9ICdodHRwOi8vcHVybC5pbXNnbG9iYWwub3JnL3ZvY2FiL2xpcy92Mi9pbnN0aXR1dGlvbi9wZXJzb24jT2JzZXJ2ZXInLFxuICBQcm9zcGVjdGl2ZVN0dWRlbnRJbnN0aXR1dGlvblJvbGUgPSAnaHR0cDovL3B1cmwuaW1zZ2xvYmFsLm9yZy92b2NhYi9saXMvdjIvaW5zdGl0dXRpb24vcGVyc29uI1Byb3NwZWN0aXZlU3R1ZGVudCcsXG5cbiAgLy8gQ29yZSBjb250ZXh0IHJvbGVzXG4gIEFkbWluaXN0cmF0b3JDb250ZXh0Um9sZSA9ICdodHRwOi8vcHVybC5pbXNnbG9iYWwub3JnL3ZvY2FiL2xpcy92Mi9tZW1iZXJzaGlwI0FkbWluaXN0cmF0b3InLFxuICBDb250ZW50RGV2ZWxvcGVyQ29udGV4dFJvbGUgPSAnaHR0cDovL3B1cmwuaW1zZ2xvYmFsLm9yZy92b2NhYi9saXMvdjIvbWVtYmVyc2hpcCNDb250ZW50RGV2ZWxvcGVyJyxcbiAgSW5zdHJ1Y3RvckNvbnRleHRSb2xlID0gJ2h0dHA6Ly9wdXJsLmltc2dsb2JhbC5vcmcvdm9jYWIvbGlzL3YyL21lbWJlcnNoaXAjSW5zdHJ1Y3RvcicsXG4gIExlYXJuZXJDb250ZXh0Um9sZSA9ICdodHRwOi8vcHVybC5pbXNnbG9iYWwub3JnL3ZvY2FiL2xpcy92Mi9tZW1iZXJzaGlwI0xlYXJuZXInLFxuICBNZW50b3JDb250ZXh0Um9sZSA9ICdodHRwOi8vcHVybC5pbXNnbG9iYWwub3JnL3ZvY2FiL2xpcy92Mi9tZW1iZXJzaGlwI01lbnRvcicsXG5cbiAgLy8gTm9uXHUyMDExY29yZSBjb250ZXh0IHJvbGVzXG4gIE1hbmFnZXJDb250ZXh0Um9sZSA9ICdodHRwOi8vcHVybC5pbXNnbG9iYWwub3JnL3ZvY2FiL2xpcy92Mi9tZW1iZXJzaGlwI01hbmFnZXInLFxuICBNZW1iZXJDb250ZXh0Um9sZSA9ICdodHRwOi8vcHVybC5pbXNnbG9iYWwub3JnL3ZvY2FiL2xpcy92Mi9tZW1iZXJzaGlwI01lbWJlcicsXG4gIE9mZmljZXJDb250ZXh0Um9sZSA9ICdodHRwOi8vcHVybC5pbXNnbG9iYWwub3JnL3ZvY2FiL2xpcy92Mi9tZW1iZXJzaGlwI09mZmljZXInLFxufVxuXG4vLyBodHRwczovL3d3dy5pbXNnbG9iYWwub3JnL3NwZWMvbHRpL3YxcDMjcmVzb3VyY2UtbGluay1jbGFpbVxuZXhwb3J0IHR5cGUgUmVzb3VyY2VMaW5rQ2xhaW0gPSB7XG4gIC8vIE9wYXF1ZSBpZGVudGlmaWVyIGZvciBhIHBsYWNlbWVudCBvZiBhbiBMVEkgcmVzb3VyY2UgbGluayB3aXRoaW4gYSBjb250ZXh0IHRoYXQgTVVTVFxuICAvLyBiZSBhIHN0YWJsZSBhbmQgbG9jYWxseSB1bmlxdWUgdG8gdGhlIGRlcGxveW1lbnRfaWQuIFRoaXMgdmFsdWUgTVVTVCBjaGFuZ2UgaWYgdGhlIGxpbmtcbiAgLy8gaXMgY29waWVkIG9yIGV4cG9ydGVkIGZyb20gb25lIHN5c3RlbSBvciBjb250ZXh0IGFuZCBpbXBvcnRlZCBpbnRvIGFub3RoZXIgc3lzdGVtIG9yIGNvbnRleHQuXG4gIC8vIFRoZSB2YWx1ZSBvZiBpZCBNVVNUIE5PVCBleGNlZWQgMjU1IEFTQ0lJIGNoYXJhY3RlcnMgaW4gbGVuZ3RoIGFuZCBpcyBjYXNlLXNlbnNpdGl2ZVxuICBpZDogc3RyaW5nO1xuICAvLyBEZXNjcmlwdGl2ZSBwaHJhc2UgZm9yIGFuIExUSSByZXNvdXJjZSBsaW5rIHBsYWNlbWVudC5cbiAgZGVzY3JpcHRpb24/OiBzdHJpbmcgfCBudWxsO1xuICAvLyBEZXNjcmlwdGl2ZSB0aXRsZSBmb3IgYW4gTFRJIHJlc291cmNlIGxpbmsgcGxhY2VtZW50LlxuICB0aXRsZT86IHN0cmluZztcbiAgdmFsaWRhdGlvbl9jb250ZXh0Pzogc3RyaW5nIHwgbnVsbDtcbiAgZXJyb3JzPzogSWRUb2tlbkVycm9ycztcbn07XG5cbi8vIGh0dHBzOi8vd3d3Lmltc2dsb2JhbC5vcmcvc3BlYy9sdGkvdjFwMyNsYXVuY2gtcHJlc2VudGF0aW9uLWNsYWltXG5leHBvcnQgdHlwZSBMYXVuY2hQcmVzZW50YXRpb25DbGFpbSA9IHtcbiAgLy8gVGhlIGtpbmQgb2YgYnJvd3NlciB3aW5kb3cgb3IgZnJhbWUgZnJvbSB3aGljaCB0aGUgdXNlciBsYXVuY2hlZCBpbnNpZGUgdGhlIG1lc3NhZ2VcbiAgLy8gc2VuZGVyJ3Mgc3lzdGVtLiBUaGUgdmFsdWUgZm9yIHRoaXMgcHJvcGVydHkgTVVTVCBiZSBvbmUgb2Y6IGZyYW1lLCBpZnJhbWUsIG9yIHdpbmRvdy5cbiAgZG9jdW1lbnRfdGFyZ2V0PzogRG9jdW1lbnRUYXJnZXRzO1xuICAvLyBGdWxseS1xdWFsaWZpZWQgSFRUUFMgVVJMIHdpdGhpbiB0aGUgbWVzc2FnZSBzZW5kZXIncyB1c2VyIGV4cGVyaWVuY2UgdG8gd2hlcmUgdGhlIG1lc3NhZ2VcbiAgLy8gcmVjZWl2ZXIgY2FuIHJlZGlyZWN0IHRoZSB1c2VyIGJhY2suIFRoZSBtZXNzYWdlIHJlY2VpdmVyIGNhbiByZWRpcmVjdCB0byB0aGlzIFVSTCBhZnRlclxuICAvLyB0aGUgdXNlciBoYXMgZmluaXNoZWQgYWN0aXZpdHksIG9yIGlmIHRoZSByZWNlaXZlciBjYW5ub3Qgc3RhcnQgYmVjYXVzZSBvZiBzb21lIHRlY2huaWNhbCBkaWZmaWN1bHR5LlxuICByZXR1cm5fdXJsPzogc3RyaW5nO1xuICAvLyBMYW5ndWFnZSwgY291bnRyeSwgYW5kIHZhcmlhbnQgYXMgcmVwcmVzZW50ZWQgdXNpbmcgdGhlIElFVEYgQmVzdCBQcmFjdGljZXMgZm9yIFRhZ3MgZm9yIElkZW50aWZ5aW5nIExhbmd1YWdlc1xuICBsb2NhbGU6IHN0cmluZztcbiAgLy8gSGVpZ2h0IG9mIHRoZSB3aW5kb3cgb3IgZnJhbWUgd2hlcmUgdGhlIGNvbnRlbnQgZnJvbSB0aGUgbWVzc2FnZSByZWNlaXZlciB3aWxsIGJlIGRpc3BsYXllZCB0byB0aGUgdXNlci5cbiAgaGVpZ2h0PzogbnVtYmVyO1xuICAvLyBXaWR0aCBvZiB0aGUgd2luZG93IG9yIGZyYW1lIHdoZXJlIHRoZSBjb250ZW50IGZyb20gdGhlIG1lc3NhZ2UgcmVjZWl2ZXIgd2lsbCBiZSBkaXNwbGF5ZWQgdG8gdGhlIHVzZXIuXG4gIHdpZHRoPzogbnVtYmVyO1xuICB2YWxpZGF0aW9uX2NvbnRleHQ/OiBzdHJpbmcgfCBudWxsO1xuICBlcnJvcnM/OiBJZFRva2VuRXJyb3JzO1xufTtcblxuLy8gaHR0cHM6Ly93d3cuaW1zZ2xvYmFsLm9yZy9zcGVjL2x0aS1kbC92MnAwI2RlZXAtbGlua2luZy1zZXR0aW5nc1xuZXhwb3J0IHR5cGUgRGVlcExpbmtpbmdDbGFpbSA9IHtcbiAgLy8gRnVsbHkgcXVhbGlmaWVkIFVSTCB3aGVyZSB0aGUgdG9vbCByZWRpcmVjdHMgdGhlIHVzZXIgYmFjayB0byB0aGUgcGxhdGZvcm0gaW50ZXJmYWNlLlxuICAvLyBUaGlzIFVSTCBjYW4gYmUgdXNlZCBvbmNlIHRoZSB0b29sIGlzIGZpbmlzaGVkLlxuICBkZWVwX2xpbmtfcmV0dXJuX3VybDogc3RyaW5nO1xuICAvLyBBbiBhcnJheSBvZiB0eXBlcyBhY2NlcHRlZCwgZS5nLlxuICBhY2NlcHRfdHlwZXM6IEFycmF5PGtleW9mIHR5cGVvZiBBY2NlcHRUeXBlcz47XG4gIC8vIEFuIGFycmF5IG9mIGRvY3VtZW50IHRhcmdldHMgc3VwcG9ydGVkLCBlLmcuLFxuICBhY2NlcHRfcHJlc2VudGF0aW9uX2RvY3VtZW50X3RhcmdldHM6IEFycmF5PGtleW9mIHR5cGVvZiBEb2N1bWVudFRhcmdldHM+O1xuICAvLyBNZWRpYSB0eXBlcyBbUkZDNzIzMV0gdGhlIHBsYXRmb3JtIGFjY2VwdHMuIFRoaXMgb25seSBhcHBsaWVzIHRvIEZpbGUgdHlwZXMsIGUuZy4sIFwiaW1hZ2UvOjo6YXN0ZXJpc2s6OjosdGV4dC9odG1sXCIuXG4gIGFjY2VwdF9tZWRpYV90eXBlcz86IHN0cmluZztcbiAgLy8gV2hldGhlciB0aGUgcGxhdGZvcm0gYWxsb3dzIG11bHRpcGxlIGNvbnRlbnQgaXRlbXMgdG8gYmUgc3VibWl0dGVkIGluIGEgc2luZ2xlIHJlc3BvbnNlLlxuICBhY2NlcHRfbXVsdGlwbGU/OiBib29sZWFuO1xuICAvLyBXaGV0aGVyIHRoZSBwbGF0Zm9ybSBpbiB0aGUgY29udGV4dCBvZiB0aGF0IGRlZXAgbGlua2luZyByZXF1ZXN0IHN1cHBvcnRzIG9yIGlnbm9yZXMgbGluZVxuICAvLyBpdGVtcyBpbmNsdWRlZCBpbiBMVEkgUmVzb3VyY2UgTGluayBpdGVtcy4gRmFsc2UgaW5kaWNhdGVzIGxpbmUgaXRlbXMgd2lsbCBiZSBpZ25vcmVkLlxuICAvLyBUcnVlIGluZGljYXRlcyB0aGUgcGxhdGZvcm0gd2lsbCBjcmVhdGUgYSBsaW5lIGl0ZW0gd2hlbiBjcmVhdGluZyB0aGUgcmVzb3VyY2UgbGluay5cbiAgLy8gSWYgdGhlIGZpZWxkIGlzIG5vdCBwcmVzZW50LCBubyBhc3N1bXB0aW9uIHRoYXQgY2FuIGJlIG1hZGUgYWJvdXQgdGhlIHN1cHBvcnQgb2YgbGluZSBpdGVtc1xuICBhY2NlcHRfbGluZWl0ZW0/OiBib29sZWFuO1xuICAvLyBXaGV0aGVyIGFueSBjb250ZW50IGl0ZW1zIHJldHVybmVkIGJ5IHRoZSB0b29sIHdvdWxkIGJlIGF1dG9tYXRpY2FsbHkgcGVyc2lzdGVkXG4gIC8vIHdpdGhvdXQgYW55IG9wdGlvbiBmb3IgdGhlIHVzZXIgdG8gY2FuY2VsIHRoZSBvcGVyYXRpb24uIFRoZSBkZWZhdWx0IGlzIGZhbHNlLlxuICBhdXRvX2NyZWF0ZT86IGJvb2xlYW47XG4gIC8vIERlZmF1bHQgdGV4dCB0byBiZSB1c2VkIGFzIHRoZSB0aXRsZSBvciBhbHQgdGV4dCBmb3IgdGhlIGNvbnRlbnQgaXRlbSByZXR1cm5lZCBieSB0aGUgdG9vbC5cbiAgLy8gVGhpcyB2YWx1ZSBpcyBub3JtYWxseSBzaG9ydCBpbiBsZW5ndGgsIGZvciBleGFtcGxlLCBzdWl0YWJsZSBmb3IgdXNlIGFzIGEgaGVhZGluZy5cbiAgdGl0bGU/OiBzdHJpbmc7XG4gIC8vRGVmYXVsdCB0ZXh0IHRvIGJlIHVzZWQgYXMgdGhlIHZpc2libGUgdGV4dCBmb3IgdGhlIGNvbnRlbnQgaXRlbSByZXR1cm5lZCBieSB0aGUgdG9vbC5cbiAgLy8gSWYgbm8gdGV4dCBpcyByZXR1cm5lZCBieSB0aGUgdG9vbCwgdGhlIHBsYXRmb3JtIG1heSB1c2UgdGhlIHZhbHVlIG9mIHRoZSB0aXRsZSBwYXJhbWV0ZXIgaW5zdGVhZCAoaWYgYW55KS5cbiAgLy8gVGhpcyB2YWx1ZSBtYXkgYmUgYSBsb25nIGRlc2NyaXB0aW9uIG9mIHRoZSBjb250ZW50IGl0ZW0uXG4gIHRleHQ/OiBzdHJpbmc7XG4gIC8vXHRBbiBvcGFxdWUgdmFsdWUgd2hpY2ggbXVzdCBiZSByZXR1cm5lZCBieSB0aGUgdG9vbCBpbiBpdHMgcmVzcG9uc2UgaWYgaXQgd2FzIHBhc3NlZCBpbiBvbiB0aGUgcmVxdWVzdFxuICBkYXRhPzogc3RyaW5nO1xufTtcblxuLy8gaHR0cHM6Ly93d3cuaW1zZ2xvYmFsLm9yZy9zcGVjL2x0aS1ucnBzL3YycDAjY2xhaW0tZm9yLWluY2x1c2lvbi1pbi1sdGktbWVzc2FnZXNcbmV4cG9ydCB0eXBlIE5hbWVzQW5kUm9sZXNDbGFpbSA9IHtcbiAgLy8gU2VydmljZSBVUkwgdGhhdCBpcyBhbHdheXMgZnVsbHkgcmVzb2x2ZWQsIGFuZCBtYXRjaGVzIHRoZSBjb250ZXh0IG9mIHRoZSBsYXVuY2hcbiAgY29udGV4dF9tZW1iZXJzaGlwc191cmw6IHN0cmluZztcbiAgLy8gU3BlY2lmaWVzIHRoZSB2ZXJzaW9ucyBvZiB0aGUgc2VydmljZSB0aGF0IGFyZSBzdXBwb3J0ZWQgb24gdGhlIGVuZCBwb2ludCBwcm92aWRlZCBieSBjb250ZXh0X21lbWJlcnNoaXBzX3VybFxuICBzZXJ2aWNlX3ZlcnNpb25zOiBBcnJheTxzdHJpbmc+O1xuICB2YWxpZGF0aW9uX2NvbnRleHQ/OiBzdHJpbmcgfCBudWxsO1xuICBlcnJvcnM/OiBJZFRva2VuRXJyb3JzO1xufTtcblxuZXhwb3J0IGVudW0gQUdTU2NvcGVzIHtcbiAgbGluZUl0ZW0gPSAnaHR0cHM6Ly9wdXJsLmltc2dsb2JhbC5vcmcvc3BlYy9sdGktYWdzL3Njb3BlL2xpbmVpdGVtJyxcbiAgcmVzdWx0UmVhZE9ubHkgPSAnaHR0cHM6Ly9wdXJsLmltc2dsb2JhbC5vcmcvc3BlYy9sdGktYWdzL3Njb3BlL3Jlc3VsdC5yZWFkb25seScsXG4gIHNjb3JlID0gJ2h0dHBzOi8vcHVybC5pbXNnbG9iYWwub3JnL3NwZWMvbHRpLWFncy9zY29wZS9zY29yZScsXG4gIGxpbmVJdGVtUmVhZE9ubHkgPSAnaHR0cHM6Ly9wdXJsLmltc2dsb2JhbC5vcmcvc3BlYy9sdGktYWdzL3Njb3BlL2xpbmVpdGVtLnJlYWRvbmx5Jyxcbn1cblxuLy8gaHR0cHM6Ly93d3cuaW1zZ2xvYmFsLm9yZy9zcGVjL2x0aS1hZ3MvdjJwMC8jYXNzaWdubWVudC1hbmQtZ3JhZGUtc2VydmljZS1jbGFpbVxuZXhwb3J0IHR5cGUgQUdTQ2xhaW0gPSB7XG4gIC8vIEFuIGFycmF5IG9mIHNjb3BlcyB0aGUgdG9vbCBtYXkgYXNrIGFuIGFjY2VzcyB0b2tlbiBmb3IuXG4gIHNjb3BlOiBBcnJheTxBR1NTY29wZXM+O1xuICAvLyBUaGUgZW5kcG9pbnQgVVJMIGZvciBhY2Nlc3NpbmcgdGhlIGxpbmUgaXRlbSBjb250YWluZXIgZm9yIHRoZSBjdXJyZW50IGNvbnRleHQuXG4gIC8vIE1heSBiZSBvbWl0dGVkIGlmIHRoZSB0b29sIGhhcyBubyBwZXJtaXNzaW9ucyB0byBhY2Nlc3MgdGhpcyBlbmRwb2ludFxuICBsaW5laXRlbXM/OiBzdHJpbmc7XG4gIC8vIFdoZW4gYW4gTFRJIG1lc3NhZ2UgaXMgbGF1bmNoaW5nIGEgcmVzb3VyY2UgYXNzb2NpYXRlZCB0byBvbmUgYW5kIG9ubHkgb25lIGxpbmVpdGVtLFxuICAvLyB0aGUgY2xhaW0gbXVzdCBpbmNsdWRlIHRoZSBlbmRwb2ludCBVUkwgZm9yIGFjY2Vzc2luZyB0aGUgYXNzb2NpYXRlZCBsaW5lIGl0ZW07XG4gIC8vIGluIGFsbCBvdGhlciBjYXNlcywgdGhpcyBwcm9wZXJ0eSBtdXN0IGJlIGVpdGhlciBibGFuayBvciBub3QgaW5jbHVkZWQgaW4gdGhlIGNsYWltXG4gIGxpbmVpdGVtPzogc3RyaW5nO1xuICB2YWxpZGF0aW9uX2NvbnRleHQ/OiBzdHJpbmcgfCBudWxsO1xuICBlcnJvcnM/OiBJZFRva2VuRXJyb3JzO1xufTtcblxuLy8gaHR0cHM6Ly93d3cuaW1zZ2xvYmFsLm9yZy9zcGVjL2x0aS92MXAzI2xlYXJuaW5nLWluZm9ybWF0aW9uLXNlcnZpY2VzLWxpcy1jbGFpbVxuZXhwb3J0IHR5cGUgTElTQ2xhaW0gPSB7XG4gIHBlcnNvbl9zb3VyY2VkaWQ6IHN0cmluZztcbiAgY291cnNlX29mZmVyaW5nX3NvdXJjZWRpZDogc3RyaW5nO1xuICBjb3Vyc2Vfc2VjdGlvbl9zb3VyY2VkaWQ6IHN0cmluZztcbiAgdmFsaWRhdGlvbl9jb250ZXh0Pzogc3RyaW5nIHwgbnVsbDtcbiAgZXJyb3JzPzogSWRUb2tlbkVycm9ycztcbn07XG5cbi8vIGh0dHBzOi8vd3d3Lmltc2dsb2JhbC5vcmcvc3BlYy9sdGkvdjFwMyNjb250ZXh0LWNsYWltXG5leHBvcnQgdHlwZSBDb250ZXh0Q2xhaW0gPSB7XG4gIGlkOiBzdHJpbmc7XG4gIGxhYmVsPzogc3RyaW5nO1xuICB0aXRsZT86IHN0cmluZztcbiAgdHlwZT86IEFycmF5PHN0cmluZz47XG4gIHZhbGlkYXRpb25fY29udGV4dD86IHN0cmluZyB8IG51bGw7XG4gIGVycm9ycz86IElkVG9rZW5FcnJvcnM7XG59O1xuXG4vLyBodHRwczovL3d3dy5pbXNnbG9iYWwub3JnL3NwZWMvbHRpL3YxcDMjcGxhdGZvcm0taW5zdGFuY2UtY2xhaW1cbmV4cG9ydCB0eXBlIFRvb2xQbGF0Zm9ybUNsYWltID0ge1xuICBndWlkOiBzdHJpbmc7XG4gIGNvbnRhY3RfZW1haWw/OiBzdHJpbmc7XG4gIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xuICBuYW1lPzogc3RyaW5nO1xuICB1cmw/OiBzdHJpbmc7XG4gIHByb2R1Y3RfZmFtaWx5X2NvZGU/OiBzdHJpbmc7XG4gIHZlcnNpb24/OiBzdHJpbmc7XG4gIHZhbGlkYXRpb25fY29udGV4dD86IHN0cmluZyB8IG51bGw7XG4gIGVycm9ycz86IElkVG9rZW5FcnJvcnM7XG59O1xuXG4vLyBodHRwczovL3d3dy5pbXNnbG9iYWwub3JnL3NwZWMvbHRpL3YxcDMjcmVzb3VyY2UtbGluay1sYXVuY2gtcmVxdWVzdC1tZXNzYWdlXG5leHBvcnQgdHlwZSBJZFRva2VuID0ge1xuICBhdWQ6IHN0cmluZztcbiAgYXVkcz86IEFycmF5PHN0cmluZz47XG4gIGF6cD86IHN0cmluZztcbiAgZXhwOiBudW1iZXI7XG4gIGlhdDogbnVtYmVyO1xuICBpc3M6IHN0cmluZztcbiAgbm9uY2U6IHN0cmluZztcbiAgc3ViOiBzdHJpbmc7XG5cbiAgW01FU1NBR0VfVFlQRV06IE1lc3NhZ2VUeXBlcztcbiAgW0xUSV9WRVJTSU9OXTogTHRpVmVyc2lvbnM7XG4gIFtSRVNPVVJDRV9MSU5LX0NMQUlNXTogUmVzb3VyY2VMaW5rQ2xhaW07XG4gIFtERVBMT1lNRU5UX0lEXTogc3RyaW5nO1xuICBbVEFSR0VUX0xJTktfVVJJX0NMQUlNXTogc3RyaW5nO1xuICBbUk9MRVNfQ0xBSU1dOiBBcnJheTxSb2xlcz47XG4gIFtDT05URVhUX0NMQUlNXT86IENvbnRleHRDbGFpbTtcbiAgW1RPT0xfUExBVEZPUk1fQ0xBSU1dPzogVG9vbFBsYXRmb3JtQ2xhaW07XG4gIFtERUVQX0xJTktJTkdfQ0xBSU1dPzogRGVlcExpbmtpbmdDbGFpbTtcbiAgW0RFRVBfTElOS0lOR19EQVRBX0NMQUlNXT86IHN0cmluZztcbiAgW0xBVU5DSF9QUkVTRU5UQVRJT05dPzogTGF1bmNoUHJlc2VudGF0aW9uQ2xhaW07XG4gIFtOQU1FU19BTkRfUk9MRVNfQ0xBSU1dPzogTmFtZXNBbmRSb2xlc0NsYWltO1xuICBbQUdTX0NMQUlNXT86IEFHU0NsYWltO1xuICBbTElTX0NMQUlNXT86IExJU0NsYWltO1xuICBbTUlHUkFUSU9OX0NMQUlNXT86IG9iamVjdDtcbiAgW0NVU1RPTV9DTEFJTV0/OiBvYmplY3Q7XG4gIFtMVEkxMV9MRUdBQ1lfVVNFUl9JRF9DTEFJTV0/OiBzdHJpbmc7XG4gIFtMVEkxUDFfQ0xBSU1dPzogb2JqZWN0LFxuICBwaWN0dXJlPzogc3RyaW5nO1xuICBlbWFpbD86IHN0cmluZztcbiAgbmFtZT86IHN0cmluZztcbiAgZ2l2ZW5fbmFtZT86IHN0cmluZztcbiAgZmFtaWx5X25hbWU/OiBzdHJpbmc7XG4gIG1pZGRsZV9uYW1lPzogc3RyaW5nO1xuICBsb2NhbGU/OiBzdHJpbmc7XG5cbiAgZXJyb3JzPzogSWRUb2tlbkVycm9ycztcbn07XG5cblxuLy9cbi8vIER5bmFtaWMgUmVnaXN0cmF0aW9uXG4vL1xuZXhwb3J0IHR5cGUgUGxhdGZvcm1Db25maWd1cmF0aW9uID0ge1xuICBpc3N1ZXI6IHN0cmluZztcbiAgYXV0aG9yaXphdGlvbl9lbmRwb2ludDogc3RyaW5nO1xuICB0b2tlbl9lbmRwb2ludDogc3RyaW5nO1xuICB0b2tlbl9lbmRwb2ludF9hdXRoX21ldGhvZHNfc3VwcG9ydGVkPzogc3RyaW5nW107XG4gIHRva2VuX2VuZHBvaW50X2F1dGhfc2lnbmluZ19hbGdfdmFsdWVzX3N1cHBvcnRlZD86IHN0cmluZ1tdO1xuICBqd2tzX3VyaTogc3RyaW5nO1xuICByZWdpc3RyYXRpb25fZW5kcG9pbnQ/OiBzdHJpbmc7XG4gIHNjb3Blc19zdXBwb3J0ZWQ/OiBzdHJpbmdbXTtcbiAgcmVzcG9uc2VfdHlwZXNfc3VwcG9ydGVkPzogc3RyaW5nW107XG4gIHN1YmplY3RfdHlwZXNfc3VwcG9ydGVkPzogc3RyaW5nW107XG4gIGlkX3Rva2VuX3NpZ25pbmdfYWxnX3ZhbHVlc19zdXBwb3J0ZWQ/OiBzdHJpbmdbXTtcbiAgY2xhaW1zX3N1cHBvcnRlZD86IHN0cmluZ1tdO1xuICBhdXRob3JpemF0aW9uX3NlcnZlcj86IHN0cmluZztcbiAgW0xUSV9QTEFURk9STV9DT05GSUdVUkFUSU9OXT86IEx0aVBsYXRmb3JtQ29uZmlndXJhdGlvbjtcbn07XG5cbmV4cG9ydCB0eXBlIEx0aVBsYXRmb3JtQ29uZmlndXJhdGlvbiA9IHtcbiAgcHJvZHVjdF9mYW1pbHlfY29kZTogc3RyaW5nO1xuICB2ZXJzaW9uOiBzdHJpbmc7XG4gIG1lc3NhZ2VzX3N1cHBvcnRlZDogTWVzc2FnZVN1cHBvcnRlZFtdO1xuICB2YXJpYWJsZXM/OiBzdHJpbmdbXTtcbn07XG5cbmV4cG9ydCB0eXBlIE1lc3NhZ2VTdXBwb3J0ZWQgPSB7XG4gIHR5cGU6IHN0cmluZztcbiAgcGxhY2VtZW50cz86IHN0cmluZ1tdO1xufTtcblxuZXhwb3J0IHR5cGUgUmVnaXN0cmF0aW9uQ29uZmlndXJhdGlvbiA9IHtcbiAgcGxhdGZvcm1Ub29sQ29uZmlndXJhdGlvbjogVG9vbENvbmZpZ3VyYXRpb24sXG4gIHBsYXRmb3JtQ29uZmlndXJhdGlvbjogUGxhdGZvcm1Db25maWd1cmF0aW9uLFxufVxuXG5leHBvcnQgdHlwZSBUb29sQ29uZmlndXJhdGlvbiA9IHtcbiAgYXBwbGljYXRpb25fdHlwZTogc3RyaW5nO1xuICBncmFudF90eXBlczogc3RyaW5nW107XG4gIHJlc3BvbnNlX3R5cGVzOiBzdHJpbmdbXTtcbiAgcmVkaXJlY3RfdXJpczogc3RyaW5nW107XG4gIGluaXRpYXRlX2xvZ2luX3VyaTogc3RyaW5nO1xuICBjbGllbnRfbmFtZTogc3RyaW5nO1xuICBqd2tzX3VyaTogc3RyaW5nO1xuICBsb2dvX3VyaT86IHN0cmluZztcbiAgdG9rZW5fZW5kcG9pbnRfYXV0aF9tZXRob2Q6IHN0cmluZztcbiAgY29udGFjdHM/OiBzdHJpbmdbXTtcbiAgc2NvcGU6IHN0cmluZztcbiAgW0xUSV9UT09MX0NPTkZJR1VSQVRJT05dOiBMdGlUb29sQ29uZmlndXJhdGlvbjtcbiAgY2xpZW50X3VyaT86IHN0cmluZztcbiAgdG9zX3VyaT86IHN0cmluZztcbiAgcG9saWN5X3VyaT86IHN0cmluZztcbiAgY2xpZW50X2lkPzogc3RyaW5nO1xuICByZWdpc3RyYXRpb25fY2xpZW50X3VyaT86IHN0cmluZztcbn1cblxuZXhwb3J0IHR5cGUgTHRpVG9vbENvbmZpZ3VyYXRpb24gPSB7XG4gIGRvbWFpbjogc3RyaW5nO1xuICBzZWNvbmRhcnlfZG9tYWlucz86IHN0cmluZ1tdO1xuICBkZXBsb3ltZW50X2lkPzogc3RyaW5nO1xuICB0YXJnZXRfbGlua191cmk6IHN0cmluZztcbiAgY3VzdG9tX3BhcmFtZXRlcnM/OiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9O1xuICBkZXNjcmlwdGlvbj86IHN0cmluZztcbiAgbWVzc2FnZXM6IEx0aU1lc3NhZ2VbXTtcbiAgY2xhaW1zOiBzdHJpbmdbXTtcbiAgW0NBTlZBU19QUklWQUNZX0xFVkVMXT86IHN0cmluZztcbn1cblxuZXhwb3J0IHR5cGUgTHRpTWVzc2FnZSA9IHtcbiAgdHlwZTogc3RyaW5nO1xuICB0YXJnZXRfbGlua191cmk/OiBzdHJpbmc7XG4gIGxhYmVsPzogc3RyaW5nO1xuICBpY29uX3VyaT86IHN0cmluZztcbiAgY3VzdG9tX3BhcmFtZXRlcnM/OiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9O1xuICBwbGFjZW1lbnRzPzogc3RyaW5nW107XG4gIHJvbGVzPzogc3RyaW5nW107XG4gIFtDQU5WQVNfUExBQ0VNRU5UX1ZJU0lCSUxJVFldPzogc3RyaW5nO1xuICBbQ0FOVkFTX1BMQUNFTUVOVF9DT1VSU0VfTkFWSUdBVElPTl9FTkFCTEVEXT86IGJvb2xlYW47XG59XG5cblxuLy9cbi8vIE5hbWVzIGFuZCBSb2xlc1xuLy9cbmV4cG9ydCBpbnRlcmZhY2UgQ29udGV4dCB7XG4gIGlkOiBzdHJpbmc7XG4gIGxhYmVsPzogc3RyaW5nO1xuICB0aXRsZT86IHN0cmluZztcbn1cblxuZXhwb3J0IGVudW0gTWVtYmVyU3RhdHVzIHtcbiAgQWN0aXZlID0gJ0FjdGl2ZScsXG4gIEluYWN0aXZlID0gJ0luYWN0aXZlJyxcbiAgRGVsZXRlZCA9ICdEZWxldGVkJ1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1lbWJlciB7XG4gIHVzZXJfaWQ6IHN0cmluZztcbiAgcm9sZXM6IHN0cmluZ1tdO1xuICBzdGF0dXM/OiBNZW1iZXJTdGF0dXM7XG4gIG5hbWU/OiBzdHJpbmc7XG4gIGVtYWlsPzogc3RyaW5nO1xuICBwaWN0dXJlPzogc3RyaW5nO1xuICBnaXZlbl9uYW1lPzogc3RyaW5nO1xuICBmYW1pbHlfbmFtZT86IHN0cmluZztcbiAgbWlkZGxlX25hbWU/OiBzdHJpbmc7XG4gIGxpc19wZXJzb25fc291cmNlZGlkPzogc3RyaW5nO1xuICBsdGkxMV9sZWdhY3lfdXNlcl9pZD86IHN0cmluZztcbiAgbWVzc2FnZT86IEFycmF5PHtcbiAgICBba2V5OiBzdHJpbmddOiBhbnk7XG4gICAgW01FU1NBR0VfVFlQRV0/OiBzdHJpbmc7XG4gICAgW0JBU0lDX09VVENPTUVfQ0xBSU1dPzoge1xuICAgICAgbGlzX3Jlc3VsdF9zb3VyY2VkaWQ6IHN0cmluZztcbiAgICAgIGxpc19vdXRjb21lX3NlcnZpY2VfdXJsOiBzdHJpbmc7XG4gICAgfTtcbiAgICBbQ1VTVE9NX0NMQUlNXT86IHtcbiAgICAgIFtrZXk6IHN0cmluZ106IHN0cmluZztcbiAgICB9O1xuICB9Pjtcbn1cbmV4cG9ydCBpbnRlcmZhY2UgTWVtYmVyc2hpcENvbnRhaW5lciB7XG4gIGlkOiBzdHJpbmc7XG4gIGNvbnRleHQ6IENvbnRleHQ7XG4gIG1lbWJlcnM6IE1lbWJlcltdO1xufVxuIiwgImltcG9ydCB7IFBvc3RNZXNzYWdlUmVxdWVzdCwgUG9zdE1lc3NhZ2VSZXNwb25zZSB9IGZyb20gXCIuL3R5cGVzXCI7XG5cbmV4cG9ydCBjbGFzcyBQb3N0TWVzc2FnZUVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihcbiAgICBwdWJsaWMgdHlwZTogUG9zdE1lc3NhZ2VFcnJvclR5cGUsXG4gICAgcHVibGljIHBheWxvYWQ/OiBQb3N0TWVzc2FnZVJlcXVlc3QsXG4gICAgcHVibGljIHJlc3BvbnNlPzogUG9zdE1lc3NhZ2VSZXNwb25zZVxuICApIHtcbiAgICBzdXBlcihgUG9zdE1lc3NhZ2VFcnJvcjogJHt0eXBlfWApO1xuICB9XG59XG5cbmV4cG9ydCBlbnVtIFBvc3RNZXNzYWdlRXJyb3JUeXBlIHtcbiAgVGltZW91dCA9IFwidGltZW91dFwiLFxuICBSZXNwb25zZUVycm9yID0gXCJyZXNwb25zZV9lcnJvclwiLFxufVxuIiwgImltcG9ydCB7IFBvc3RNZXNzYWdlRXJyb3IsIFBvc3RNZXNzYWdlRXJyb3JUeXBlIH0gZnJvbSBcIi4vZXJyb3JcIjtcbmltcG9ydCB7XG4gIFBvc3RNZXNzYWdlQ2FwYWJpbGl0aWVzUmVzcG9uc2UsXG4gIFBvc3RNZXNzYWdlQ2FwYWJpbGl0eSxcbiAgUG9zdE1lc3NhZ2VSZXF1ZXN0LFxuICBQb3N0TWVzc2FnZVJlc3BvbnNlLFxufSBmcm9tIFwiLi90eXBlc1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFBvc3RNZXNzYWdlQ2xpZW50T3B0aW9ucyB7XG4gIG9yaWdpbjogc3RyaW5nO1xuICB0YXJnZXRGcmFtZT86IFdpbmRvdyB8IHN0cmluZyB8IG51bGw7XG4gIHRpbWVvdXQ/OiBudW1iZXI7XG59XG5cbmNvbnN0IERFRkFVTFRfT1BUSU9OUzogUG9zdE1lc3NhZ2VDbGllbnRPcHRpb25zID0ge1xuICBvcmlnaW46IFwiKlwiLFxuICB0YXJnZXRGcmFtZTogbnVsbCxcbiAgdGltZW91dDogMjAwMCxcbn07XG5cbi8qKlxuICogQSBjbGllbnQgZm9yIHNlbmRpbmcgYW5kIHJlY2VpdmluZyBtZXNzYWdlcyB2aWEgdGhlIHBvc3RNZXNzYWdlIEFQSSBhY2NvcmRpbmcgdGhlIHRoZSBMVEkgcG9zdE1lc3NhZ2Ugc3BlY2lmaWNhdGlvblxuICogaHR0cHM6Ly93d3cuaW1zZ2xvYmFsLm9yZy9zcGVjL2x0aS1jcy1wbS92MHAxI3Jlc3BvbnNlLXBhcmFtZXRlcnNcbiAqL1xuZXhwb3J0IGNsYXNzIFBvc3RNZXNzYWdlQ2xpZW50IHtcbiAgZGVmYXVsdE9wdGlvbnM6IFBhcnRpYWw8UG9zdE1lc3NhZ2VDbGllbnRPcHRpb25zPjtcblxuICBjb25zdHJ1Y3RvcihvcHRpb25zPzogUGFydGlhbDxQb3N0TWVzc2FnZUNsaWVudE9wdGlvbnM+KSB7XG4gICAgdGhpcy5kZWZhdWx0T3B0aW9ucyA9IHsgLi4uREVGQVVMVF9PUFRJT05TLCAuLi5vcHRpb25zIH07XG4gIH1cblxuICAvKiogU2VuZCBhIHJlcXVlc3QgdG8gdGhlIExUSSBwbGF0Zm9ybSB2aWEgdGhlIHBvc3RNZXNzYWdlIEFQSSBhbmQgcmVjaWV2ZSBiYWNrIHRoZSBwbGF0Zm9ybXMgcmVzcG9uc2VcbiAgICogSWYgdGhlIHJlcXVlc3QgdGltZXMgb3V0LCBhIFBvc3RNZXNzYWdlRXJyb3Igd2l0aCB0eXBlIFRpbWVvdXQgd2lsbCBiZSB0aHJvd25cbiAgICogSWYgdGhlIHBsYXRmb3JtIHJldHVybnMgYW4gZXJyb3IsIGEgUG9zdE1lc3NhZ2VFcnJvciB3aXRoIHR5cGUgUmVzcG9uc2VFcnJvciB3aWxsIGJlIHRocm93blxuICAgKi9cbiAgcHVibGljIGFzeW5jIHNlbmQ8XG4gICAgUmVxdWVzdCBleHRlbmRzIFBvc3RNZXNzYWdlUmVxdWVzdCA9IFBvc3RNZXNzYWdlUmVxdWVzdCxcbiAgICBSZXNwb25zZSBleHRlbmRzIFBvc3RNZXNzYWdlUmVzcG9uc2UgPSBQb3N0TWVzc2FnZVJlc3BvbnNlPFxuICAgICAgUmVxdWVzdFtcInN1YmplY3RcIl1cbiAgICA+XG4gID4oXG4gICAgcGF5bG9hZDogUmVxdWVzdCxcbiAgICBvcHRpb25zOiBQYXJ0aWFsPFBvc3RNZXNzYWdlQ2xpZW50T3B0aW9ucz4gPSB7fVxuICApOiBQcm9taXNlPFJlc3BvbnNlPiB7XG4gICAgY29uc3QgYWxsT3B0aW9ucyA9IHtcbiAgICAgIC4uLnRoaXMuZGVmYXVsdE9wdGlvbnMsXG4gICAgICAuLi5vcHRpb25zLFxuICAgIH07XG5cbiAgICBjb25zdCBmcmFtZSA9IGF3YWl0IHRoaXMuZmluZFRhcmdldEZyYW1lKFxuICAgICAgcGF5bG9hZC5zdWJqZWN0LFxuICAgICAgYWxsT3B0aW9ucy50YXJnZXRGcmFtZSA/PyBudWxsXG4gICAgKTtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZTxSZXNwb25zZT4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3QgdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICByZWplY3QobmV3IFBvc3RNZXNzYWdlRXJyb3IoUG9zdE1lc3NhZ2VFcnJvclR5cGUuVGltZW91dCwgcGF5bG9hZCkpO1xuICAgICAgfSwgYWxsT3B0aW9ucy50aW1lb3V0KTtcblxuICAgICAgY29uc3QgcmVjZWl2ZU1lc3NhZ2UgPSAoZXZlbnQ6IE1lc3NhZ2VFdmVudDxSZXNwb25zZT4pID0+IHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIHR5cGVvZiBldmVudC5kYXRhID09PSBcIm9iamVjdFwiICYmXG4gICAgICAgICAgZXZlbnQuZGF0YS5zdWJqZWN0ID09PSBgJHtwYXlsb2FkLnN1YmplY3R9LnJlc3BvbnNlYCAmJlxuICAgICAgICAgIGV2ZW50LmRhdGEubWVzc2FnZV9pZCA9PT0gcGF5bG9hZC5tZXNzYWdlX2lkICYmXG4gICAgICAgICAgKGV2ZW50Lm9yaWdpbiA9PT0gYWxsT3B0aW9ucy5vcmlnaW4gfHxcbiAgICAgICAgICAgIChhbGxPcHRpb25zLm9yaWdpbiA9PT0gXCIqXCIgJiYgZXZlbnQub3JpZ2luICE9PSBcIm51bGxcIikpXG4gICAgICAgICkge1xuICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCByZWNlaXZlTWVzc2FnZSk7XG4gICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuXG4gICAgICAgICAgaWYgKGV2ZW50LmRhdGEuZXJyb3IpIHtcbiAgICAgICAgICAgIHJlamVjdChcbiAgICAgICAgICAgICAgbmV3IFBvc3RNZXNzYWdlRXJyb3IoXG4gICAgICAgICAgICAgICAgUG9zdE1lc3NhZ2VFcnJvclR5cGUuUmVzcG9uc2VFcnJvcixcbiAgICAgICAgICAgICAgICBwYXlsb2FkLFxuICAgICAgICAgICAgICAgIGV2ZW50LmRhdGFcbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzb2x2ZShldmVudC5kYXRhKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCByZWNlaXZlTWVzc2FnZSk7XG5cbiAgICAgIGZyYW1lLnBvc3RNZXNzYWdlKHBheWxvYWQsIHtcbiAgICAgICAgdGFyZ2V0T3JpZ2luOiBhbGxPcHRpb25zLm9yaWdpbixcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIFJldHJpZXZlIHRoZSBsaXN0IG9mIG1lc3NhZ2UgY2FwYWJpbGl0aWVzIHRoYXQgdGhlIHBsYXRmb3JtIHN1cHBvcnRzICovXG4gIHB1YmxpYyBhc3luYyBnZXRDYXBhYmlsaXRpZXMoKTogUHJvbWlzZTxQb3N0TWVzc2FnZUNhcGFiaWxpdHlbXT4ge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5zZW5kPFxuICAgICAgUG9zdE1lc3NhZ2VSZXF1ZXN0LFxuICAgICAgUG9zdE1lc3NhZ2VDYXBhYmlsaXRpZXNSZXNwb25zZVxuICAgID4oXG4gICAgICB7IHN1YmplY3Q6IFwibHRpLmNhcGFiaWxpdGllc1wiLCBtZXNzYWdlX2lkOiBcImx0aS1jYXBzXCIgfSxcbiAgICAgIHsgb3JpZ2luOiBcIipcIiwgdGFyZ2V0RnJhbWU6IHdpbmRvdy5wYXJlbnQgPz8gd2luZG93Lm9wZW5lciB9XG4gICAgKTtcblxuICAgIHJldHVybiByZXNwb25zZS5zdXBwb3J0ZWRfbWVzc2FnZXM7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgY29uZmlndXJhdGlvbiBmb3IgYSBjYXBhYmlsaXR5IGlmIHRoZSBwbGF0Zm9ybSBzdXBwb3J0cyBpdCwgbnVsbCBvdGhlcndpc2UgICAqL1xuICBwdWJsaWMgYXN5bmMgZ2V0Q2FwYWJpbGl0eShcbiAgICBjYXBhYmlsaXR5OiBzdHJpbmdcbiAgKTogUHJvbWlzZTxQb3N0TWVzc2FnZUNhcGFiaWxpdHkgfCBudWxsPiB7XG4gICAgY29uc3QgY2FwYWJpbGl0aWVzID0gYXdhaXQgdGhpcy5nZXRDYXBhYmlsaXRpZXMoKTtcbiAgICByZXR1cm4gY2FwYWJpbGl0aWVzLmZpbmQoKGM6IGFueSkgPT4gYy5zdWJqZWN0ID09PSBjYXBhYmlsaXR5KSA/PyBudWxsO1xuICB9XG5cbiAgLyoqIEdlbmVyYXRlIGEgdW5pcXVlIG1lc3NhZ2UgaWQgZm9yIGEgcmVxdWVzdCAqL1xuICBwdWJsaWMgbWVzc2FnZUlkKHN1YmplY3Q6IHN0cmluZywgLi4uYXJnczogc3RyaW5nW10pOiBzdHJpbmcge1xuICAgIGNvbnN0IHJhbmRvbSA9IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZygyKTtcbiAgICByZXR1cm4gYCR7c3ViamVjdH0tJHthcmdzLmpvaW4oXCItXCIpfS0ke3JhbmRvbX1gO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBmaW5kVGFyZ2V0RnJhbWUoXG4gICAgc3ViamVjdDogc3RyaW5nLFxuICAgIHRhcmdldDogV2luZG93IHwgc3RyaW5nIHwgbnVsbFxuICApOiBQcm9taXNlPFdpbmRvdz4ge1xuICAgIGlmICh0eXBlb2YgdGFyZ2V0ICE9PSBcInN0cmluZ1wiICYmIHRhcmdldCAhPT0gbnVsbCkgcmV0dXJuIHRhcmdldDtcblxuICAgIGlmICh0YXJnZXQgPT0gbnVsbCkge1xuICAgICAgLy8gVGhlIHBsYXRmb3JtIGNhbiBwcm92aWRlIGFsbCBvZiB0aGUgc3VwcG9ydGVkIGNhcGFiaWxpdGllc1xuICAgICAgLy8gc28gd2UgbmVlZCB0byBjaGVjayBmb3IgdGhlIGx0aS5nZXRfZGF0YSBjYXBhYmlsaXR5IGFuZCB0aGF0IHdpbGxcbiAgICAgIC8vIHRlbGwgdXMgdGhlIGZyYW1lIHRvIHRhbGsgdG8uXG4gICAgICBjb25zdCBjYXAgPSBhd2FpdCB0aGlzLmdldENhcGFiaWxpdHkoc3ViamVjdCk7XG4gICAgICB0YXJnZXQgPSBjYXA/LmZyYW1lID8/IFwiX3BhcmVudFwiO1xuICAgIH1cblxuICAgIGNvbnN0IHBhcmVudCA9IHdpbmRvdy5wYXJlbnQgfHwgd2luZG93Lm9wZW5lcjtcblxuICAgIGlmICh0YXJnZXQgPT09IFwiX3BhcmVudFwiKSB7XG4gICAgICByZXR1cm4gcGFyZW50O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gcGFyZW50LmZyYW1lc1t0YXJnZXQgYXMgYW55XSB8fCBwYXJlbnQ7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBQb3N0TWVzc2FnZUNsaWVudFdyYXBwZXIge1xuICBwcm90ZWN0ZWQgY2xpZW50OiBQb3N0TWVzc2FnZUNsaWVudDtcbiAgc3RhdGljIE1lc3NhZ2VUeXBlczogc3RyaW5nW10gfCBudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihjbGllbnQ/OiBQb3N0TWVzc2FnZUNsaWVudCkge1xuICAgIHRoaXMuY2xpZW50ID0gY2xpZW50ID8/IG5ldyBQb3N0TWVzc2FnZUNsaWVudCgpO1xuICB9XG5cbiAgYWJzdHJhY3QgaXNTdXBwb3J0ZWQoKTogUHJvbWlzZTxib29sZWFuPjtcbn1cbiIsICJpbXBvcnQgeyBpbml0T0lEQ0xhdW5jaCB9IGZyb20gJ0BhdG9taWNqb2x0L2x0aS1jbGllbnQnO1xuaW1wb3J0IHR5cGUgeyBJbml0U2V0dGluZ3MgfSBmcm9tICdAYXRvbWljam9sdC9sdGktY2xpZW50L3R5cGVzJztcblxuY29uc3QgaW5pdFNldHRpbmdzOiBJbml0U2V0dGluZ3MgPSB3aW5kb3cuSU5JVF9TRVRUSU5HUztcbmluaXRPSURDTGF1bmNoKGluaXRTZXR0aW5ncyk7XG4iXSwKICAibWFwcGluZ3MiOiAiOztBQUFBLE1BQU0sZ0JBQWdCO0FBQUEsSUFDcEIsTUFBTTtBQUFBLElBQ04sSUFBSSxNQUFNO0FBQ1IsV0FBSyxPQUFPLE9BQU8sSUFBSTtBQUFBLElBQ3pCO0FBQUEsSUFDQSxLQUFLLE1BQU07QUFDVCxXQUFLLE9BQU8sUUFBUSxJQUFJO0FBQUEsSUFDMUI7QUFBQSxJQUNBLE1BQU0sTUFBTTtBQUNWLFdBQUssT0FBTyxTQUFTLElBQUk7QUFBQSxJQUMzQjtBQUFBLElBQ0EsT0FBTyxNQUFNLE1BQU07QUFDakIsVUFBSSxXQUFXLFFBQVEsSUFBSSxFQUFHLFNBQVEsSUFBSSxFQUFFLE1BQU0sU0FBUyxJQUFJO0FBQUEsSUFDakU7QUFBQSxFQUNGO0FBQ0EsTUFBTSxTQUFOLE1BQU0sUUFBTztBQUFBLElBQ1gsWUFBWSxnQkFBZ0I7QUFDMUIsVUFBSSxVQUFVLFVBQVUsU0FBUyxLQUFLLFVBQVUsQ0FBQyxNQUFNLFNBQVksVUFBVSxDQUFDLElBQUksQ0FBQztBQUNuRixXQUFLLEtBQUssZ0JBQWdCLE9BQU87QUFBQSxJQUNuQztBQUFBLElBQ0EsS0FBSyxnQkFBZ0I7QUFDbkIsVUFBSSxVQUFVLFVBQVUsU0FBUyxLQUFLLFVBQVUsQ0FBQyxNQUFNLFNBQVksVUFBVSxDQUFDLElBQUksQ0FBQztBQUNuRixXQUFLLFNBQVMsUUFBUSxVQUFVO0FBQ2hDLFdBQUssU0FBUyxrQkFBa0I7QUFDaEMsV0FBSyxVQUFVO0FBQ2YsV0FBSyxRQUFRLFFBQVE7QUFBQSxJQUN2QjtBQUFBLElBQ0EsTUFBTTtBQUNKLGVBQVMsT0FBTyxVQUFVLFFBQVEsT0FBTyxJQUFJLE1BQU0sSUFBSSxHQUFHLE9BQU8sR0FBRyxPQUFPLE1BQU0sUUFBUTtBQUN2RixhQUFLLElBQUksSUFBSSxVQUFVLElBQUk7QUFBQSxNQUM3QjtBQUNBLGFBQU8sS0FBSyxRQUFRLE1BQU0sT0FB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TUFBTSxPQUFPLE1BQU0sTUFBTSxNQUFNLE1BQU0sTUFBTSxNQUFNLE1BQU0sTUFBTSxPQUFPLE1BQU0sTUFBTSxNQUFNLE1BQU0sTUFBTSxNQUFNLE1BQU0sTUFBTSxNQUFNLE1BQU0sTUFBTSxNQUFNLE1BQU0sT0FBTyxNQUFNLE1BQU0sTUFBTSxPQUFPLE9BQU8sTUFBTSxNQUFNLE1BQU0sTUFBTSxNQUFNLE9BQU8sTUFBTSxPQUFPLE9BQU8sTUFBTSxTQUFTLE1BQU0sT0FBTyxNQUFNLE1BQU0sTUFBTSxPQUFPLE1BQU0sTUFBTSxNQUFNLE1BQU0sTUFBTSxNQUFNLE1BQU0sSUFBSTtBQUFBLElBQzdZLElBQUksQ0FBQyxHQUFHLENBQUM7QUFBQSxJQUNULElBQUk7QUFBQSxFQUNOLEdBQUc7QUFBQSxJQUNELE1BQU0sQ0FBQyxNQUFNLE1BQU0sT0FBTyxNQUFNLE1BQU0sTUFBTSxNQUFNLE9BQU8sTUFBTSxNQUFNLE1BQU0sTUFBTSxNQUFNLE1BQU0sT0FBTyxNQUFNLE1BQU0sTUFBTSxNQUFNLE1BQU0sTUFBTSxJQUFJO0FBQUEsSUFDNUksSUFBSSxDQUFDLENBQUM7QUFBQSxJQUNOLElBQUk7QUFBQSxFQUNOLEdBQUc7QUFBQSxJQUNELE1BQU0sQ0FBQyxNQUFNLE1BQU0sT0FBTyxNQUFNLE1BQU0sTUFBTSxNQUFNLElBQUk7QUFBQSxJQUN0RCxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUM7QUFBQSxJQUNaLElBQUk7QUFBQSxFQUNOLEdBQUc7QUFBQSxJQUNELE1BQU0sQ0FBQyxJQUFJO0FBQUEsSUFDWCxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUc7QUFBQSxJQUN4QixJQUFJO0FBQUEsRUFDTixHQUFHO0FBQUEsSUFDRCxNQUFNLENBQUMsTUFBTSxJQUFJO0FBQUEsSUFDakIsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDO0FBQUEsSUFDWixJQUFJO0FBQUEsRUFDTixHQUFHO0FBQUEsSUFDRCxNQUFNLENBQUMsT0FBTyxJQUFJO0FBQUEsSUFDbEIsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDO0FBQUEsSUFDWixJQUFJO0FBQUEsRUFDTixHQUFHO0FBQUEsSUFDRCxNQUFNLENBQUMsSUFBSTtBQUFBLElBQ1gsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7QUFBQSxJQUNmLElBQUk7QUFBQSxFQUNOLEdBQUc7QUFBQSxJQUNELE1BQU0sQ0FBQyxJQUFJO0FBQUEsSUFDWCxJQUFJLENBQUMsR0FBRyxDQUFDO0FBQUEsSUFDVCxJQUFJO0FBQUEsRUFDTixHQUFHO0FBQUEsSUFDRCxNQUFNLENBQUMsSUFBSTtBQUFBLElBQ1gsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsRUFBRTtBQUFBLElBQ25CLElBQUk7QUFBQSxFQUNOLEdBQUc7QUFBQSxJQUNELE1BQU0sQ0FBQyxJQUFJO0FBQUEsSUFDWCxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsRUFBRTtBQUFBLElBQ2hCLElBQUk7QUFBQSxFQUNOLEdBQUc7QUFBQSxJQUNELE1BQU0sQ0FBQyxJQUFJO0FBQUEsSUFDWCxJQUFJLENBQUMsR0FBRyxDQUFDO0FBQUEsSUFDVCxJQUFJO0FBQUEsRUFDTixHQUFHO0FBQUEsSUFDRCxNQUFNLENBQUMsSUFBSTtBQUFBLElBQ1gsSUFBSSxDQUFDLEdBQUcsQ0FBQztBQUFBLElBQ1QsSUFBSTtBQUFBLEVBQ04sR0FBRztBQUFBLElBQ0QsTUFBTSxDQUFDLElBQUk7QUFBQSxJQUNYLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO0FBQUEsSUFDZixJQUFJO0FBQUEsRUFDTixHQUFHO0FBQUEsSUFDRCxNQUFNLENBQUMsSUFBSTtBQUFBLElBQ1gsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFO0FBQUEsSUFDYixJQUFJO0FBQUEsRUFDTixHQUFHO0FBQUEsSUFDRCxNQUFNLENBQUMsSUFBSTtBQUFBLElBQ1gsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDO0FBQUEsSUFDWixJQUFJO0FBQUEsRUFDTixHQUFHO0FBQUEsSUFDRCxNQUFNLENBQUMsSUFBSTtBQUFBLElB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O1VBQ0Y7UUFDRjtBQUVBLGVBQU8saUJBQWlCLFdBQVcsY0FBYztBQUVqRCxjQUFNLFlBQVksU0FBUztVQUN6QixjQUFjLFdBQVc7U0FDMUI7TUFDSCxDQUFDO0lBQ0g7O0lBR08sTUFBTSxrQkFBZTtBQUMxQixZQUFNLFdBQVcsTUFBTSxLQUFLLEtBSTFCLEVBQUUsU0FBUyxvQkFBb0IsWUFBWSxXQUFVLEdBQ3JELEVBQUUsUUFBUSxLQUFLLGFBQWEsT0FBTyxVQUFVLE9BQU8sT0FBTSxDQUFFO0FBRzlELGFBQU8sU0FBUztJQUNsQjs7SUFHTyxNQUFNLGNBQ1gsWUFBa0I7QUFFbEIsWUFBTSxlQUFlLE1BQU0sS0FBSyxnQkFBZTtBQUMvQyxhQUFPLGFBQWEsS0FBSyxDQUFDLE1BQVcsRUFBRSxZQUFZLFVBQVUsS0FBSztJQUNwRTs7SUFHTyxVQUFVLFlBQW9CLE1BQWM7QUFDakQsWUFBTSxTQUFTLEtBQUssT0FBTSxFQUFHLFNBQVMsRUFBRSxFQUFFLFVBQVUsQ0FBQztBQUNyRCxhQUFPLEdBQUcsT0FBTyxJQUFJLEtBQUssS0FBSyxHQUFHLENBQUMsSUFBSSxNQUFNO0lBQy9DO0lBRVEsTUFBTSxnQkFDWixTQUNBLFFBQThCO0FBRTlCLFVBQUksT0FBTyxXQUFXLFlBQVksV0FBVztBQUFNLGVBQU87QUFFMUQsVUFBSSxVQUFVLE1BQU07QUFJbEIsY0FBTSxNQUFNLE1BQU0sS0FBSyxjQUFjLE9BQU87QUFDNUMsaUJBQVMsS0FBSyxTQUFTO01BQ3pCO0FBRUEsWUFBTSxTQUFTLE9BQU8sVUFBVSxPQUFPO0FBRXZDLFVBQUksV0FBVyxXQUFXO0FBQ3hCLGVBQU87TUFDVCxPQUFPO0FBQ0wsZUFBTyxPQUFPLE9BQU8sTUFBYSxLQUFLO01BQ3pDO0lBQ0Y7O0FBR0ksTUFBZ0IsMkJBQWhCLE1BQXdDO0lBSTVDLFlBQVksUUFBMEI7QUFDcEMsV0FBSyxTQUFTLFVBQVUsSUFBSSxrQkFBaUI7SUFDL0M7O0FBSk8sMkJBQUEsZUFBZ0M7OztBQzlJekMsTUFBTSxlQUE2QixPQUFPO0FBQzFDLGlCQUFlLFlBQVk7IiwKICAibmFtZXMiOiBbInQiLCAicGF0aCIsICJjb3B5IiwgImxvYWRTdGF0ZSIsICJvIiwgInQiLCAidCIsICJ0IiwgInNlcmlhbGl6ZUNvb2tpZSIsICJsb29rdXAiLCAibG9jYWxTdG9yYWdlQXZhaWxhYmxlIiwgImNhY2hlVXNlckxhbmd1YWdlIiwgInNlc3Npb25TdG9yYWdlQXZhaWxhYmxlIiwgImh0bWxUYWciLCAiQnJvd3NlciIsICJpbml0IiwgIkx0aVZlcnNpb25zIiwgIkRvY3VtZW50VGFyZ2V0cyIsICJBY2NlcHRUeXBlcyIsICJNZXNzYWdlVHlwZXMiLCAiUm9sZXMiLCAiQUdTU2NvcGVzIiwgIk1lbWJlclN0YXR1cyIsICJQb3N0TWVzc2FnZUVycm9yVHlwZSJdCn0K
