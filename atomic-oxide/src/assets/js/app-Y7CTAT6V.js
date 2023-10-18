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
      if (console && console[type])
        console[type].apply(console, args);
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
      if (debugOnly && !this.debug)
        return null;
      if (typeof args[0] === "string")
        args[0] = `${prefix}${this.prefix} ${args[0]}`;
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
        this.observers[event] = this.observers[event] || [];
        this.observers[event].push(listener);
      });
      return this;
    }
    off(event, listener) {
      if (!this.observers[event])
        return;
      if (!listener) {
        delete this.observers[event];
        return;
      }
      this.observers[event] = this.observers[event].filter((l) => l !== listener);
    }
    emit(event) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }
      if (this.observers[event]) {
        const cloned = [].concat(this.observers[event]);
        cloned.forEach((observer) => {
          observer(...args);
        });
      }
      if (this.observers["*"]) {
        const cloned = [].concat(this.observers["*"]);
        cloned.forEach((observer) => {
          observer.apply(observer, [event, ...args]);
        });
      }
    }
  };
  function defer() {
    let res;
    let rej;
    const promise = new Promise((resolve, reject) => {
      res = resolve;
      rej = reject;
    });
    promise.resolve = res;
    promise.reject = rej;
    return promise;
  }
  function makeString(object) {
    if (object == null)
      return "";
    return "" + object;
  }
  function copy(a, s, t2) {
    a.forEach((m) => {
      if (s[m])
        t2[m] = s[m];
    });
  }
  function getLastOfPath(object, path2, Empty) {
    function cleanKey(key) {
      return key && key.indexOf("###") > -1 ? key.replace(/###/g, ".") : key;
    }
    function canNotTraverseDeeper() {
      return !object || typeof object === "string";
    }
    const stack = typeof path2 !== "string" ? [].concat(path2) : path2.split(".");
    while (stack.length > 1) {
      if (canNotTraverseDeeper())
        return {};
      const key = cleanKey(stack.shift());
      if (!object[key] && Empty)
        object[key] = new Empty();
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        object = object[key];
      } else {
        object = {};
      }
    }
    if (canNotTraverseDeeper())
      return {};
    return {
      obj: object,
      k: cleanKey(stack.shift())
    };
  }
  function setPath(object, path2, newValue) {
    const {
      obj,
      k
    } = getLastOfPath(object, path2, Object);
    obj[k] = newValue;
  }
  function pushPath(object, path2, newValue, concat) {
    const {
      obj,
      k
    } = getLastOfPath(object, path2, Object);
    obj[k] = obj[k] || [];
    if (concat)
      obj[k] = obj[k].concat(newValue);
    if (!concat)
      obj[k].push(newValue);
  }
  function getPath(object, path2) {
    const {
      obj,
      k
    } = getLastOfPath(object, path2);
    if (!obj)
      return void 0;
    return obj[k];
  }
  function getPathWithDefaults(data, defaultData, key) {
    const value = getPath(data, key);
    if (value !== void 0) {
      return value;
    }
    return getPath(defaultData, key);
  }
  function deepExtend(target, source, overwrite) {
    for (const prop in source) {
      if (prop !== "__proto__" && prop !== "constructor") {
        if (prop in target) {
          if (typeof target[prop] === "string" || target[prop] instanceof String || typeof source[prop] === "string" || source[prop] instanceof String) {
            if (overwrite)
              target[prop] = source[prop];
          } else {
            deepExtend(target[prop], source[prop], overwrite);
          }
        } else {
          target[prop] = source[prop];
        }
      }
    }
    return target;
  }
  function regexEscape(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  }
  var _entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#x2F;"
  };
  function escape(data) {
    if (typeof data === "string") {
      return data.replace(/[&<>"'\/]/g, (s) => _entityMap[s]);
    }
    return data;
  }
  var chars = [" ", ",", "?", "!", ";"];
  function looksLikeObjectPath(key, nsSeparator, keySeparator) {
    nsSeparator = nsSeparator || "";
    keySeparator = keySeparator || "";
    const possibleChars = chars.filter((c) => nsSeparator.indexOf(c) < 0 && keySeparator.indexOf(c) < 0);
    if (possibleChars.length === 0)
      return true;
    const r = new RegExp(`(${possibleChars.map((c) => c === "?" ? "\\?" : c).join("|")})`);
    let matched = !r.test(key);
    if (!matched) {
      const ki = key.indexOf(keySeparator);
      if (ki > 0 && !r.test(key.substring(0, ki))) {
        matched = true;
      }
    }
    return matched;
  }
  function deepFind(obj, path2) {
    let keySeparator = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : ".";
    if (!obj)
      return void 0;
    if (obj[path2])
      return obj[path2];
    const paths = path2.split(keySeparator);
    let current = obj;
    for (let i = 0; i < paths.length; ++i) {
      if (!current)
        return void 0;
      if (typeof current[paths[i]] === "string" && i + 1 < paths.length) {
        return void 0;
      }
      if (current[paths[i]] === void 0) {
        let j = 2;
        let p = paths.slice(i, i + j).join(keySeparator);
        let mix = current[p];
        while (mix === void 0 && paths.length > i + j) {
          j++;
          p = paths.slice(i, i + j).join(keySeparator);
          mix = current[p];
        }
        if (mix === void 0)
          return void 0;
        if (mix === null)
          return null;
        if (path2.endsWith(p)) {
          if (typeof mix === "string")
            return mix;
          if (p && typeof mix[p] === "string")
            return mix[p];
        }
        const joinedPath = paths.slice(i + j).join(keySeparator);
        if (joinedPath)
          return deepFind(mix, joinedPath, keySeparator);
        return void 0;
      }
      current = current[paths[i]];
    }
    return current;
  }
  function getCleanedCode(code) {
    if (code && code.indexOf("_") > 0)
      return code.replace("_", "-");
    return code;
  }
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
      let path2 = [lng, ns];
      if (key && typeof key !== "string")
        path2 = path2.concat(key);
      if (key && typeof key === "string")
        path2 = path2.concat(keySeparator ? key.split(keySeparator) : key);
      if (lng.indexOf(".") > -1) {
        path2 = lng.split(".");
      }
      const result = getPath(this.data, path2);
      if (result || !ignoreJSONStructure || typeof key !== "string")
        return result;
      return deepFind(this.data && this.data[lng] && this.data[lng][ns], key, keySeparator);
    }
    addResource(lng, ns, key, value) {
      let options = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : {
        silent: false
      };
      const keySeparator = options.keySeparator !== void 0 ? options.keySeparator : this.options.keySeparator;
      let path2 = [lng, ns];
      if (key)
        path2 = path2.concat(keySeparator ? key.split(keySeparator) : key);
      if (lng.indexOf(".") > -1) {
        path2 = lng.split(".");
        value = ns;
        ns = path2[1];
      }
      this.addNamespaces(ns);
      setPath(this.data, path2, value);
      if (!options.silent)
        this.emit("added", lng, ns, key, value);
    }
    addResources(lng, ns, resources) {
      let options = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {
        silent: false
      };
      for (const m in resources) {
        if (typeof resources[m] === "string" || Object.prototype.toString.apply(resources[m]) === "[object Array]")
          this.addResource(lng, ns, m, resources[m], {
            silent: true
          });
      }
      if (!options.silent)
        this.emit("added", lng, ns, resources);
    }
    addResourceBundle(lng, ns, resources, deep, overwrite) {
      let options = arguments.length > 5 && arguments[5] !== void 0 ? arguments[5] : {
        silent: false
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
      if (deep) {
        deepExtend(pack, resources, overwrite);
      } else {
        pack = {
          ...pack,
          ...resources
        };
      }
      setPath(this.data, path2, pack);
      if (!options.silent)
        this.emit("added", lng, ns, resources);
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
      if (!ns)
        ns = this.options.defaultNS;
      if (this.options.compatibilityAPI === "v1")
        return {
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
        if (this.processors[processor])
          value = this.processors[processor].process(value, key, options, translator);
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
      if (lng)
        this.language = lng;
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
      if (nsSeparator === void 0)
        nsSeparator = ":";
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
        if (nsSeparator !== keySeparator || nsSeparator === keySeparator && this.options.ns.indexOf(parts[0]) > -1)
          namespaces = parts.shift();
        key = parts.join(keySeparator);
      }
      if (typeof namespaces === "string")
        namespaces = [namespaces];
      return {
        key,
        namespaces
      };
    }
    translate(keys, options, lastKey) {
      if (typeof options !== "object" && this.options.overloadTranslationOptionHandler) {
        options = this.options.overloadTranslationOptionHandler(arguments);
      }
      if (typeof options === "object")
        options = {
          ...options
        };
      if (!options)
        options = {};
      if (keys === void 0 || keys === null)
        return "";
      if (!Array.isArray(keys))
        keys = [String(keys)];
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
              usedNS: namespace
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
            usedNS: namespace
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
      if (handleAsObjectInI18nFormat && res && handleAsObject && noObject.indexOf(resType) < 0 && !(typeof joinArrays === "string" && resType === "[object Array]")) {
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
            return resolved;
          }
          return r;
        }
        if (keySeparator) {
          const resTypeIsArray = resType === "[object Array]";
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
              if (copy2[m] === deepKey)
                copy2[m] = res[m];
            }
          }
          res = copy2;
        }
      } else if (handleAsObjectInI18nFormat && typeof joinArrays === "string" && resType === "[object Array]") {
        res = res.join(joinArrays);
        if (res)
          res = this.extendTranslation(res, keys, options, lastKey);
      } else {
        let usedDefault = false;
        let usedKey = false;
        const needsPluralHandling = options.count !== void 0 && typeof options.count !== "string";
        const hasDefaultValue = _Translator.hasDefaultValue(options);
        const defaultValueSuffix = needsPluralHandling ? this.pluralResolver.getSuffix(lng, options.count, options) : "";
        const defaultValueSuffixOrdinalFallback = options.ordinal && needsPluralHandling ? this.pluralResolver.getSuffix(lng, options.count, {
          ordinal: false
        }) : "";
        const defaultValue = options[`defaultValue${defaultValueSuffix}`] || options[`defaultValue${defaultValueSuffixOrdinalFallback}`] || options.defaultValue;
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
            if (fk && fk.res)
              this.logger.warn("Seems the loaded translations were in flat JSON format instead of nested. Either set keySeparator: false on init or make sure your translations are published in nested format.");
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
                this.pluralResolver.getSuffixes(language, options).forEach((suffix) => {
                  send([language], key + suffix, options[`defaultValue${suffix}`] || defaultValue);
                });
              });
            } else {
              send(lngs, key, defaultValue);
            }
          }
        }
        res = this.extendTranslation(res, keys, options, resolved, lastKey);
        if (usedKey && res === key && this.options.appendNamespaceToMissingKey)
          res = `${namespace}:${key}`;
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
        if (options.interpolation)
          this.interpolator.init({
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
        if (this.options.interpolation.defaultVariables)
          data = {
            ...this.options.interpolation.defaultVariables,
            ...data
          };
        res = this.interpolator.interpolate(res, data, options.lng || this.language, options);
        if (skipOnVariables) {
          const na = res.match(this.interpolator.nestingRegexp);
          const nestAft = na && na.length;
          if (nestBef < nestAft)
            options.nest = false;
        }
        if (!options.lng && this.options.compatibilityAPI !== "v1" && resolved && resolved.res)
          options.lng = resolved.usedLng;
        if (options.nest !== false)
          res = this.interpolator.nest(res, function() {
            for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
              args[_key] = arguments[_key];
            }
            if (lastKey && lastKey[0] === args[0] && !options.context) {
              _this.logger.warn(`It seems you are nesting recursively key: ${args[0]} in key: ${key[0]}`);
              return null;
            }
            return _this.translate(...args, key);
          }, options);
        if (options.interpolation)
          this.interpolator.reset();
      }
      const postProcess = options.postProcess || this.options.postProcess;
      const postProcessorNames = typeof postProcess === "string" ? [postProcess] : postProcess;
      if (res !== void 0 && res !== null && postProcessorNames && postProcessorNames.length && options.applyPostProcessor !== false) {
        res = postProcessor.handle(postProcessorNames, res, key, this.options && this.options.postProcessPassResolved ? {
          i18nResolved: resolved,
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
      if (typeof keys === "string")
        keys = [keys];
      keys.forEach((k) => {
        if (this.isValidLookup(found))
          return;
        const extracted = this.extractFromKey(k, options);
        const key = extracted.key;
        usedKey = key;
        let namespaces = extracted.namespaces;
        if (this.options.fallbackNS)
          namespaces = namespaces.concat(this.options.fallbackNS);
        const needsPluralHandling = options.count !== void 0 && typeof options.count !== "string";
        const needsZeroSuffixLookup = needsPluralHandling && !options.ordinal && options.count === 0 && this.pluralResolver.shouldUseIntlApi();
        const needsContextHandling = options.context !== void 0 && (typeof options.context === "string" || typeof options.context === "number") && options.context !== "";
        const codes = options.lngs ? options.lngs : this.languageUtils.toResolveHierarchy(options.lng || this.language, options.fallbackLng);
        namespaces.forEach((ns) => {
          if (this.isValidLookup(found))
            return;
          usedNS = ns;
          if (!checkedLoadedFor[`${codes[0]}-${ns}`] && this.utils && this.utils.hasLoadedNamespace && !this.utils.hasLoadedNamespace(usedNS)) {
            checkedLoadedFor[`${codes[0]}-${ns}`] = true;
            this.logger.warn(`key "${usedKey}" for languages "${codes.join(", ")}" won't get resolved as namespace "${usedNS}" was not yet loaded`, "This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!");
          }
          codes.forEach((code) => {
            if (this.isValidLookup(found))
              return;
            usedLng = code;
            const finalKeys = [key];
            if (this.i18nFormat && this.i18nFormat.addLookupKeys) {
              this.i18nFormat.addLookupKeys(finalKeys, key, code, ns, options);
            } else {
              let pluralSuffix;
              if (needsPluralHandling)
                pluralSuffix = this.pluralResolver.getSuffix(code, options.count, options);
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
      if (this.i18nFormat && this.i18nFormat.getResource)
        return this.i18nFormat.getResource(code, ns, key, options);
      return this.resourceStore.getResource(code, ns, key, options);
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
  function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  var LanguageUtil = class {
    constructor(options) {
      this.options = options;
      this.supportedLngs = this.options.supportedLngs || false;
      this.logger = baseLogger.create("languageUtils");
    }
    getScriptPartFromCode(code) {
      code = getCleanedCode(code);
      if (!code || code.indexOf("-") < 0)
        return null;
      const p = code.split("-");
      if (p.length === 2)
        return null;
      p.pop();
      if (p[p.length - 1].toLowerCase() === "x")
        return null;
      return this.formatLanguageCode(p.join("-"));
    }
    getLanguagePartFromCode(code) {
      code = getCleanedCode(code);
      if (!code || code.indexOf("-") < 0)
        return code;
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
          if (specialCases.indexOf(p[1].toLowerCase()) > -1)
            p[1] = capitalize(p[1].toLowerCase());
        } else if (p.length === 3) {
          p[0] = p[0].toLowerCase();
          if (p[1].length === 2)
            p[1] = p[1].toUpperCase();
          if (p[0] !== "sgn" && p[2].length === 2)
            p[2] = p[2].toUpperCase();
          if (specialCases.indexOf(p[1].toLowerCase()) > -1)
            p[1] = capitalize(p[1].toLowerCase());
          if (specialCases.indexOf(p[2].toLowerCase()) > -1)
            p[2] = capitalize(p[2].toLowerCase());
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
      if (!codes)
        return null;
      let found;
      codes.forEach((code) => {
        if (found)
          return;
        const cleanedLng = this.formatLanguageCode(code);
        if (!this.options.supportedLngs || this.isSupportedCode(cleanedLng))
          found = cleanedLng;
      });
      if (!found && this.options.supportedLngs) {
        codes.forEach((code) => {
          if (found)
            return;
          const lngOnly = this.getLanguagePartFromCode(code);
          if (this.isSupportedCode(lngOnly))
            return found = lngOnly;
          found = this.options.supportedLngs.find((supportedLng) => {
            if (supportedLng === lngOnly)
              return supportedLng;
            if (supportedLng.indexOf("-") < 0 && lngOnly.indexOf("-") < 0)
              return;
            if (supportedLng.indexOf(lngOnly) === 0)
              return supportedLng;
          });
        });
      }
      if (!found)
        found = this.getFallbackCodes(this.options.fallbackLng)[0];
      return found;
    }
    getFallbackCodes(fallbacks, code) {
      if (!fallbacks)
        return [];
      if (typeof fallbacks === "function")
        fallbacks = fallbacks(code);
      if (typeof fallbacks === "string")
        fallbacks = [fallbacks];
      if (Object.prototype.toString.apply(fallbacks) === "[object Array]")
        return fallbacks;
      if (!code)
        return fallbacks.default || [];
      let found = fallbacks[code];
      if (!found)
        found = fallbacks[this.getScriptPartFromCode(code)];
      if (!found)
        found = fallbacks[this.formatLanguageCode(code)];
      if (!found)
        found = fallbacks[this.getLanguagePartFromCode(code)];
      if (!found)
        found = fallbacks.default;
      return found || [];
    }
    toResolveHierarchy(code, fallbackCode) {
      const fallbackCodes = this.getFallbackCodes(fallbackCode || this.options.fallbackLng || [], code);
      const codes = [];
      const addCode = (c) => {
        if (!c)
          return;
        if (this.isSupportedCode(c)) {
          codes.push(c);
        } else {
          this.logger.warn(`rejecting language code not found in supportedLngs: ${c}`);
        }
      };
      if (typeof code === "string" && (code.indexOf("-") > -1 || code.indexOf("_") > -1)) {
        if (this.options.load !== "languageOnly")
          addCode(this.formatLanguageCode(code));
        if (this.options.load !== "languageOnly" && this.options.load !== "currentOnly")
          addCode(this.getScriptPartFromCode(code));
        if (this.options.load !== "currentOnly")
          addCode(this.getLanguagePartFromCode(code));
      } else if (typeof code === "string") {
        addCode(this.formatLanguageCode(code));
      }
      fallbackCodes.forEach((fc) => {
        if (codes.indexOf(fc) < 0)
          addCode(this.formatLanguageCode(fc));
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
    1: function(n) {
      return Number(n > 1);
    },
    2: function(n) {
      return Number(n != 1);
    },
    3: function(n) {
      return 0;
    },
    4: function(n) {
      return Number(n % 10 == 1 && n % 100 != 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2);
    },
    5: function(n) {
      return Number(n == 0 ? 0 : n == 1 ? 1 : n == 2 ? 2 : n % 100 >= 3 && n % 100 <= 10 ? 3 : n % 100 >= 11 ? 4 : 5);
    },
    6: function(n) {
      return Number(n == 1 ? 0 : n >= 2 && n <= 4 ? 1 : 2);
    },
    7: function(n) {
      return Number(n == 1 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2);
    },
    8: function(n) {
      return Number(n == 1 ? 0 : n == 2 ? 1 : n != 8 && n != 11 ? 2 : 3);
    },
    9: function(n) {
      return Number(n >= 2);
    },
    10: function(n) {
      return Number(n == 1 ? 0 : n == 2 ? 1 : n < 7 ? 2 : n < 11 ? 3 : 4);
    },
    11: function(n) {
      return Number(n == 1 || n == 11 ? 0 : n == 2 || n == 12 ? 1 : n > 2 && n < 20 ? 2 : 3);
    },
    12: function(n) {
      return Number(n % 10 != 1 || n % 100 == 11);
    },
    13: function(n) {
      return Number(n !== 0);
    },
    14: function(n) {
      return Number(n == 1 ? 0 : n == 2 ? 1 : n == 3 ? 2 : 3);
    },
    15: function(n) {
      return Number(n % 10 == 1 && n % 100 != 11 ? 0 : n % 10 >= 2 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2);
    },
    16: function(n) {
      return Number(n % 10 == 1 && n % 100 != 11 ? 0 : n !== 0 ? 1 : 2);
    },
    17: function(n) {
      return Number(n == 1 || n % 10 == 1 && n % 100 != 11 ? 0 : 1);
    },
    18: function(n) {
      return Number(n == 0 ? 0 : n == 1 ? 1 : 2);
    },
    19: function(n) {
      return Number(n == 1 ? 0 : n == 0 || n % 100 > 1 && n % 100 < 11 ? 1 : n % 100 > 10 && n % 100 < 20 ? 2 : 3);
    },
    20: function(n) {
      return Number(n == 1 ? 0 : n == 0 || n % 100 > 0 && n % 100 < 20 ? 1 : 2);
    },
    21: function(n) {
      return Number(n % 100 == 1 ? 1 : n % 100 == 2 ? 2 : n % 100 == 3 || n % 100 == 4 ? 3 : 0);
    },
    22: function(n) {
      return Number(n == 1 ? 0 : n == 2 ? 1 : (n < 0 || n > 10) && n % 10 == 0 ? 2 : 3);
    }
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
  function createRules() {
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
  }
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
          return new Intl.PluralRules(getCleanedCode(code), {
            type: options.ordinal ? "ordinal" : "cardinal"
          });
        } catch {
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
        if (suffix === 1)
          return "";
        if (typeof suffix === "number")
          return `_plural_${suffix.toString()}`;
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
  function deepFindWithDefaults(data, defaultData, key) {
    let keySeparator = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : ".";
    let ignoreJSONStructure = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : true;
    let path2 = getPathWithDefaults(data, defaultData, key);
    if (!path2 && ignoreJSONStructure && typeof key === "string") {
      path2 = deepFind(data, key, keySeparator);
      if (path2 === void 0)
        path2 = deepFind(defaultData, key, keySeparator);
    }
    return path2;
  }
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
      if (!options.interpolation)
        options.interpolation = {
          escapeValue: true
        };
      const iOpts = options.interpolation;
      this.escape = iOpts.escape !== void 0 ? iOpts.escape : escape;
      this.escapeValue = iOpts.escapeValue !== void 0 ? iOpts.escapeValue : true;
      this.useRawValueToEscape = iOpts.useRawValueToEscape !== void 0 ? iOpts.useRawValueToEscape : false;
      this.prefix = iOpts.prefix ? regexEscape(iOpts.prefix) : iOpts.prefixEscaped || "{{";
      this.suffix = iOpts.suffix ? regexEscape(iOpts.suffix) : iOpts.suffixEscaped || "}}";
      this.formatSeparator = iOpts.formatSeparator ? iOpts.formatSeparator : iOpts.formatSeparator || ",";
      this.unescapePrefix = iOpts.unescapeSuffix ? "" : iOpts.unescapePrefix || "-";
      this.unescapeSuffix = this.unescapePrefix ? "" : iOpts.unescapeSuffix || "";
      this.nestingPrefix = iOpts.nestingPrefix ? regexEscape(iOpts.nestingPrefix) : iOpts.nestingPrefixEscaped || regexEscape("$t(");
      this.nestingSuffix = iOpts.nestingSuffix ? regexEscape(iOpts.nestingSuffix) : iOpts.nestingSuffixEscaped || regexEscape(")");
      this.nestingOptionsSeparator = iOpts.nestingOptionsSeparator ? iOpts.nestingOptionsSeparator : iOpts.nestingOptionsSeparator || ",";
      this.maxReplaces = iOpts.maxReplaces ? iOpts.maxReplaces : 1e3;
      this.alwaysFormat = iOpts.alwaysFormat !== void 0 ? iOpts.alwaysFormat : false;
      this.resetRegExp();
    }
    reset() {
      if (this.options)
        this.init(this.options);
    }
    resetRegExp() {
      const regexpStr = `${this.prefix}(.+?)${this.suffix}`;
      this.regexp = new RegExp(regexpStr, "g");
      const regexpUnescapeStr = `${this.prefix}${this.unescapePrefix}(.+?)${this.unescapeSuffix}${this.suffix}`;
      this.regexpUnescape = new RegExp(regexpUnescapeStr, "g");
      const nestingRegexpStr = `${this.nestingPrefix}(.+?)${this.nestingSuffix}`;
      this.nestingRegexp = new RegExp(nestingRegexpStr, "g");
    }
    interpolate(str, data, lng, options) {
      let match;
      let value;
      let replaces;
      const defaultData = this.options && this.options.interpolation && this.options.interpolation.defaultVariables || {};
      function regexSafe(val) {
        return val.replace(/\$/g, "$$$$");
      }
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
      function handleHasOptions(key, inheritedOptions) {
        const sep = this.nestingOptionsSeparator;
        if (key.indexOf(sep) < 0)
          return key;
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
          if (inheritedOptions)
            clonedOptions = {
              ...inheritedOptions,
              ...clonedOptions
            };
        } catch (e) {
          this.logger.warn(`failed parsing options string in nesting for key ${key}`, e);
          return `${key}${sep}${optionsString}`;
        }
        delete clonedOptions.defaultValue;
        return key;
      }
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
        if (value && match[0] === str && typeof value !== "string")
          return value;
        if (typeof value !== "string")
          value = makeString(value);
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
  function parseFormatStr(formatStr) {
    let formatName = formatStr.toLowerCase().trim();
    const formatOptions = {};
    if (formatStr.indexOf("(") > -1) {
      const p = formatStr.split("(");
      formatName = p[0].toLowerCase().trim();
      const optStr = p[1].substring(0, p[1].length - 1);
      if (formatName === "currency" && optStr.indexOf(":") < 0) {
        if (!formatOptions.currency)
          formatOptions.currency = optStr.trim();
      } else if (formatName === "relativetime" && optStr.indexOf(":") < 0) {
        if (!formatOptions.range)
          formatOptions.range = optStr.trim();
      } else {
        const opts = optStr.split(";");
        opts.forEach((opt) => {
          if (!opt)
            return;
          const [key, ...rest] = opt.split(":");
          const val = rest.join(":").trim().replace(/^'+|'+$/g, "");
          if (!formatOptions[key.trim()])
            formatOptions[key.trim()] = val;
          if (val === "false")
            formatOptions[key.trim()] = false;
          if (val === "true")
            formatOptions[key.trim()] = true;
          if (!isNaN(val))
            formatOptions[key.trim()] = parseInt(val, 10);
        });
      }
    }
    return {
      formatName,
      formatOptions
    };
  }
  function createCachedFormatter(fn) {
    const cache = {};
    return function invokeFormatter(val, lng, options) {
      const key = lng + JSON.stringify(options);
      let formatter = cache[key];
      if (!formatter) {
        formatter = fn(getCleanedCode(lng), options);
        cache[key] = formatter;
      }
      return formatter(val);
    };
  }
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
  function removePending(q, name) {
    if (q.pending[name] !== void 0) {
      delete q.pending[name];
      q.pendingCount--;
    }
  }
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
          } else if (this.state[name] < 0)
            ;
          else if (this.state[name] === 1) {
            if (pending[name] === void 0)
              pending[name] = true;
          } else {
            this.state[name] = 1;
            hasAllNamespaces = false;
            if (pending[name] === void 0)
              pending[name] = true;
            if (toLoad[name] === void 0)
              toLoad[name] = true;
            if (toLoadNamespaces[ns] === void 0)
              toLoadNamespaces[ns] = true;
          }
        });
        if (!hasAllNamespaces)
          toLoadLanguages[lng] = true;
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
      if (err)
        this.emit("failedLoading", lng, ns, err);
      if (data) {
        this.store.addResourceBundle(lng, ns, data);
      }
      this.state[name] = err ? -1 : 2;
      const loaded = {};
      this.queue.forEach((q) => {
        pushPath(q.loaded, [lng], ns);
        removePending(q, name);
        if (err)
          q.errors.push(err);
        if (q.pendingCount === 0 && !q.done) {
          Object.keys(q.loaded).forEach((l) => {
            if (!loaded[l])
              loaded[l] = {};
            const loadedKeys = q.loaded[l];
            if (loadedKeys.length) {
              loadedKeys.forEach((n) => {
                if (loaded[l][n] === void 0)
                  loaded[l][n] = true;
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
      if (!lng.length)
        return callback(null, {});
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
      if (typeof languages === "string")
        languages = this.languageUtils.toResolveHierarchy(languages);
      if (typeof namespaces === "string")
        namespaces = [namespaces];
      const toLoad = this.queueLoad(languages, namespaces, options, callback);
      if (!toLoad.toLoad.length) {
        if (!toLoad.pending.length)
          callback();
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
        if (err)
          this.logger.warn(`${prefix}loading namespace ${ns} for language ${lng} failed`, err);
        if (!err && data)
          this.logger.log(`${prefix}loaded namespace ${ns} for language ${lng}`, data);
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
      if (key === void 0 || key === null || key === "")
        return;
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
      if (!languages || !languages[0])
        return;
      this.store.addResource(languages[0], namespace, key, fallbackValue);
    }
  };
  function get() {
    return {
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
      overloadTranslationOptionHandler: function handle(args) {
        let ret = {};
        if (typeof args[1] === "object")
          ret = args[1];
        if (typeof args[1] === "string")
          ret.defaultValue = args[1];
        if (typeof args[2] === "string")
          ret.tDescription = args[2];
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
        format: (value, format, lng, options) => value,
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
    };
  }
  function transformOptions(options) {
    if (typeof options.ns === "string")
      options.ns = [options.ns];
    if (typeof options.fallbackLng === "string")
      options.fallbackLng = [options.fallbackLng];
    if (typeof options.fallbackNS === "string")
      options.fallbackNS = [options.fallbackNS];
    if (options.supportedLngs && options.supportedLngs.indexOf("cimode") < 0) {
      options.supportedLngs = options.supportedLngs.concat(["cimode"]);
    }
    return options;
  }
  function noop() {
  }
  function bindMemberFunctions(inst) {
    const mems = Object.getOwnPropertyNames(Object.getPrototypeOf(inst));
    mems.forEach((mem) => {
      if (typeof inst[mem] === "function") {
        inst[mem] = inst[mem].bind(inst);
      }
    });
  }
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
      function createClassOnDemand(ClassOrObject) {
        if (!ClassOrObject)
          return null;
        if (typeof ClassOrObject === "function")
          return new ClassOrObject();
        return ClassOrObject;
      }
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
          if (s.languageDetector.init)
            s.languageDetector.init(s, this.options.detection, this.options);
        }
        if (this.modules.i18nFormat) {
          s.i18nFormat = createClassOnDemand(this.modules.i18nFormat);
          if (s.i18nFormat.init)
            s.i18nFormat.init(this);
        }
        this.translator = new Translator(this.services, this.options);
        this.translator.on("*", function(event) {
          for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
            args[_key2 - 1] = arguments[_key2];
          }
          _this.emit(event, ...args);
        });
        this.modules.external.forEach((m) => {
          if (m.init)
            m.init(this);
        });
      }
      this.format = this.options.interpolation.format;
      if (!callback)
        callback = noop;
      if (this.options.fallbackLng && !this.services.languageDetector && !this.options.lng) {
        const codes = this.services.languageUtils.getFallbackCodes(this.options.fallbackLng);
        if (codes.length > 0 && codes[0] !== "dev")
          this.options.lng = codes[0];
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
          if (this.isInitialized && !this.initializedStoreOnce)
            this.logger.warn("init: i18next is already initialized. You should call init just once!");
          this.isInitialized = true;
          if (!this.options.isClone)
            this.logger.log("initialized", this.options);
          this.emit("initialized", this.options);
          deferred.resolve(t2);
          callback(err, t2);
        };
        if (this.languages && this.options.compatibilityAPI !== "v1" && !this.isInitialized)
          return finish(null, this.t.bind(this));
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
      if (typeof language === "function")
        usedCallback = language;
      if (!this.options.resources || this.options.partialBundledLanguages) {
        if (usedLng && usedLng.toLowerCase() === "cimode" && (!this.options.preload || this.options.preload.length === 0))
          return usedCallback();
        const toLoad = [];
        const append = (lng) => {
          if (!lng)
            return;
          if (lng === "cimode")
            return;
          const lngs = this.services.languageUtils.toResolveHierarchy(lng);
          lngs.forEach((l) => {
            if (l === "cimode")
              return;
            if (toLoad.indexOf(l) < 0)
              toLoad.push(l);
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
          if (!e && !this.resolvedLanguage && this.language)
            this.setResolvedLanguage(this.language);
          usedCallback(e);
        });
      } else {
        usedCallback(null);
      }
    }
    reloadResources(lngs, ns, callback) {
      const deferred = defer();
      if (!lngs)
        lngs = this.languages;
      if (!ns)
        ns = this.options.ns;
      if (!callback)
        callback = noop;
      this.services.backendConnector.reload(lngs, ns, (err) => {
        deferred.resolve();
        callback(err);
      });
      return deferred;
    }
    use(module) {
      if (!module)
        throw new Error("You are passing an undefined module! Please check the object you are passing to i18next.use()");
      if (!module.type)
        throw new Error("You are passing a wrong module! Please check the object you are passing to i18next.use()");
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
      if (!l || !this.languages)
        return;
      if (["cimode", "dev"].indexOf(l) > -1)
        return;
      for (let li = 0; li < this.languages.length; li++) {
        const lngInLngs = this.languages[li];
        if (["cimode", "dev"].indexOf(lngInLngs) > -1)
          continue;
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
        if (callback)
          callback(err, function() {
            return _this2.t(...arguments);
          });
      };
      const setLng = (lngs) => {
        if (!lng && !lngs && this.services.languageDetector)
          lngs = [];
        const l = typeof lngs === "string" ? lngs : this.services.languageUtils.getBestMatchFromCodes(lngs);
        if (l) {
          if (!this.language) {
            setLngProps(l);
          }
          if (!this.translator.language)
            this.translator.changeLanguage(l);
          if (this.services.languageDetector && this.services.languageDetector.cacheUserLanguage)
            this.services.languageDetector.cacheUserLanguage(l);
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
        options.keyPrefix = options.keyPrefix || keyPrefix || fixedT.keyPrefix;
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
      if (lng.toLowerCase() === "cimode")
        return true;
      const loadNotPending = (l, n) => {
        const loadState2 = this.services.backendConnector.state[`${l}|${n}`];
        return loadState2 === -1 || loadState2 === 2;
      };
      if (options.precheck) {
        const preResult = options.precheck(this, loadNotPending);
        if (preResult !== void 0)
          return preResult;
      }
      if (this.hasResourceBundle(lng, ns))
        return true;
      if (!this.services.backendConnector.backend || this.options.resources && !this.options.partialBundledLanguages)
        return true;
      if (loadNotPending(lng, ns) && (!fallbackLng || loadNotPending(lastLng, ns)))
        return true;
      return false;
    }
    loadNamespaces(ns, callback) {
      const deferred = defer();
      if (!this.options.ns) {
        if (callback)
          callback();
        return Promise.resolve();
      }
      if (typeof ns === "string")
        ns = [ns];
      ns.forEach((n) => {
        if (this.options.ns.indexOf(n) < 0)
          this.options.ns.push(n);
      });
      this.loadResources((err) => {
        deferred.resolve();
        if (callback)
          callback(err);
      });
      return deferred;
    }
    loadLanguages(lngs, callback) {
      const deferred = defer();
      if (typeof lngs === "string")
        lngs = [lngs];
      const preloaded = this.options.preload || [];
      const newLngs = lngs.filter((lng) => preloaded.indexOf(lng) < 0);
      if (!newLngs.length) {
        if (callback)
          callback();
        return Promise.resolve();
      }
      this.options.preload = preloaded.concat(newLngs);
      this.loadResources((err) => {
        deferred.resolve();
        if (callback)
          callback(err);
      });
      return deferred;
    }
    dir(lng) {
      if (!lng)
        lng = this.resolvedLanguage || (this.languages && this.languages.length > 0 ? this.languages[0] : this.language);
      if (!lng)
        return "rtl";
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
      if (forkResourceStore)
        delete options.forkResourceStore;
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
  function _classCallCheck(instance2, Constructor) {
    if (!(instance2 instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
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
  function _toPrimitive(input, hint) {
    if (_typeof(input) !== "object" || input === null)
      return input;
    var prim = input[Symbol.toPrimitive];
    if (prim !== void 0) {
      var res = prim.call(input, hint || "default");
      if (_typeof(res) !== "object")
        return res;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return (hint === "string" ? String : Number)(input);
  }

  // node_modules/@babel/runtime/helpers/esm/toPropertyKey.js
  function _toPropertyKey(arg) {
    var key = _toPrimitive(arg, "string");
    return _typeof(key) === "symbol" ? key : String(key);
  }

  // node_modules/@babel/runtime/helpers/esm/createClass.js
  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor)
        descriptor.writable = true;
      Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
    }
  }
  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps)
      _defineProperties(Constructor.prototype, protoProps);
    if (staticProps)
      _defineProperties(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }

  // node_modules/i18next-browser-languagedetector/dist/esm/i18nextBrowserLanguageDetector.js
  var arr = [];
  var each = arr.forEach;
  var slice = arr.slice;
  function defaults(obj) {
    each.call(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0)
            obj[prop] = source[prop];
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
      if (Number.isNaN(maxAge))
        throw new Error("maxAge should be a Number");
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
    if (opt.httpOnly)
      str += "; HttpOnly";
    if (opt.secure)
      str += "; Secure";
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
      if (domain)
        cookieOptions.domain = domain;
      document.cookie = serializeCookie(name, encodeURIComponent(value), cookieOptions);
    },
    read: function read(name) {
      var nameEQ = "".concat(name, "=");
      var ca = document.cookie.split(";");
      for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === " ") {
          c = c.substring(1, c.length);
        }
        if (c.indexOf(nameEQ) === 0)
          return c.substring(nameEQ.length, c.length);
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
        if (c)
          found = c;
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
    if (hasLocalStorageSupport !== null)
      return hasLocalStorageSupport;
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
        if (lng)
          found = lng;
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
    if (hasSessionStorageSupport !== null)
      return hasSessionStorageSupport;
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
        if (lng)
          found = lng;
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
      if (!language)
        return void 0;
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
        if (this.options.lookupFromUrlIndex)
          this.options.lookupFromPathIndex = this.options.lookupFromUrlIndex;
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
      }
    }, {
      key: "detect",
      value: function detect(detectionOrder) {
        var _this = this;
        if (!detectionOrder)
          detectionOrder = this.options.order;
        var detected = [];
        detectionOrder.forEach(function(detectorName) {
          if (_this.detectors[detectorName]) {
            var lookup9 = _this.detectors[detectorName].lookup(_this.options);
            if (lookup9 && typeof lookup9 === "string")
              lookup9 = [lookup9];
            if (lookup9)
              detected = detected.concat(lookup9);
          }
        });
        detected = detected.map(function(d) {
          return _this.options.convertDetectedLanguage(d);
        });
        if (this.services.languageUtils.getBestMatchFromCodes)
          return detected;
        return detected.length > 0 ? detected[0] : null;
      }
    }, {
      key: "cacheUserLanguage",
      value: function cacheUserLanguage4(lng, caches) {
        var _this2 = this;
        if (!caches)
          caches = this.options.caches;
        if (!caches)
          return;
        if (this.options.excludeCacheFor && this.options.excludeCacheFor.indexOf(lng) > -1)
          return;
        caches.forEach(function(cacheName) {
          if (_this2.detectors[cacheName])
            _this2.detectors[cacheName].cacheUserLanguage(lng, _this2.options);
        });
      }
    }]);
    return Browser2;
  }();
  Browser.type = "languageDetector";

  // node_modules/@atomicjolt/lti-client/dist/libs/constants.js
  var STATE_KEY_PREFIX = "aj_lti";

  // node_modules/@atomicjolt/lti-client/dist/libs/platform_storage.js
  function loadState(state, storageParams) {
    return new Promise((resolve, reject) => {
      let platformOrigin = new URL(storageParams.platformOIDCUrl).origin;
      let frameName = storageParams.target;
      let parent = window.parent || window.opener;
      let targetFrame = frameName === "_parent" ? parent : parent.frames[frameName];
      if (!targetFrame) {
        console.log(instance.t("Could not find target frame"));
        reject(new Error(instance.t("Could not find target frame")));
        return;
      }
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
      targetFrame.postMessage({
        subject: "lti.get_data",
        message_id: state,
        key: `${STATE_KEY_PREFIX}${state}`
      }, platformOrigin);
    });
  }

  // node_modules/@atomicjolt/lti-client/dist/client/launch.js
  async function validateLaunch(settings) {
    if (settings.ltiStorageParams) {
      try {
        const state = await loadState(settings.state, settings.ltiStorageParams);
        if (state == settings.state) {
          return true;
        }
        return false;
      } catch (e) {
        console.log(e);
        return false;
      }
    }
    return false;
  }
  async function ltiLaunch(settings) {
    return new Promise((resolve, reject) => {
      if (!settings.stateVerified) {
        window.addEventListener("load", async () => {
          try {
            const result = await validateLaunch(settings);
            resolve(result);
          } catch (e) {
            reject(e);
          }
        });
      } else {
        resolve(true);
      }
    });
  }

  // client/app.ts
  var launchSettings = window.LAUNCH_SETTINGS;
  ltiLaunch(launchSettings).then((valid) => {
    if (valid) {
      document.body.innerHTML = "hello world";
    } else {
      document.body.innerHTML = "failed to launch";
    }
  });
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2kxOG5leHQvZGlzdC9lc20vaTE4bmV4dC5qcyIsICIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQGJhYmVsL3J1bnRpbWUvaGVscGVycy9lc20vY2xhc3NDYWxsQ2hlY2suanMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvZXNtL3R5cGVvZi5qcyIsICIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQGJhYmVsL3J1bnRpbWUvaGVscGVycy9lc20vdG9QcmltaXRpdmUuanMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvZXNtL3RvUHJvcGVydHlLZXkuanMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvZXNtL2NyZWF0ZUNsYXNzLmpzIiwgIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9pMThuZXh0LWJyb3dzZXItbGFuZ3VhZ2VkZXRlY3Rvci9kaXN0L2VzbS9pMThuZXh0QnJvd3Nlckxhbmd1YWdlRGV0ZWN0b3IuanMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BhdG9taWNqb2x0L2x0aS1jbGllbnQvc3JjL2xpYnMvY29uc3RhbnRzLnRzIiwgIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9AYXRvbWljam9sdC9sdGktY2xpZW50L3NyYy9saWJzL3BsYXRmb3JtX3N0b3JhZ2UudHMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BhdG9taWNqb2x0L2x0aS1jbGllbnQvc3JjL2NsaWVudC9sYXVuY2gudHMiLCAiLi4vLi4vLi4vY2xpZW50L2FwcC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgY29uc29sZUxvZ2dlciA9IHtcbiAgdHlwZTogJ2xvZ2dlcicsXG4gIGxvZyhhcmdzKSB7XG4gICAgdGhpcy5vdXRwdXQoJ2xvZycsIGFyZ3MpO1xuICB9LFxuICB3YXJuKGFyZ3MpIHtcbiAgICB0aGlzLm91dHB1dCgnd2FybicsIGFyZ3MpO1xuICB9LFxuICBlcnJvcihhcmdzKSB7XG4gICAgdGhpcy5vdXRwdXQoJ2Vycm9yJywgYXJncyk7XG4gIH0sXG4gIG91dHB1dCh0eXBlLCBhcmdzKSB7XG4gICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZVt0eXBlXSkgY29uc29sZVt0eXBlXS5hcHBseShjb25zb2xlLCBhcmdzKTtcbiAgfVxufTtcbmNsYXNzIExvZ2dlciB7XG4gIGNvbnN0cnVjdG9yKGNvbmNyZXRlTG9nZ2VyKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IHt9O1xuICAgIHRoaXMuaW5pdChjb25jcmV0ZUxvZ2dlciwgb3B0aW9ucyk7XG4gIH1cbiAgaW5pdChjb25jcmV0ZUxvZ2dlcikge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB7fTtcbiAgICB0aGlzLnByZWZpeCA9IG9wdGlvbnMucHJlZml4IHx8ICdpMThuZXh0Oic7XG4gICAgdGhpcy5sb2dnZXIgPSBjb25jcmV0ZUxvZ2dlciB8fCBjb25zb2xlTG9nZ2VyO1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy5kZWJ1ZyA9IG9wdGlvbnMuZGVidWc7XG4gIH1cbiAgbG9nKCkge1xuICAgIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gbmV3IEFycmF5KF9sZW4pLCBfa2V5ID0gMDsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgICAgYXJnc1tfa2V5XSA9IGFyZ3VtZW50c1tfa2V5XTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZm9yd2FyZChhcmdzLCAnbG9nJywgJycsIHRydWUpO1xuICB9XG4gIHdhcm4oKSB7XG4gICAgZm9yICh2YXIgX2xlbjIgPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gbmV3IEFycmF5KF9sZW4yKSwgX2tleTIgPSAwOyBfa2V5MiA8IF9sZW4yOyBfa2V5MisrKSB7XG4gICAgICBhcmdzW19rZXkyXSA9IGFyZ3VtZW50c1tfa2V5Ml07XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmZvcndhcmQoYXJncywgJ3dhcm4nLCAnJywgdHJ1ZSk7XG4gIH1cbiAgZXJyb3IoKSB7XG4gICAgZm9yICh2YXIgX2xlbjMgPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gbmV3IEFycmF5KF9sZW4zKSwgX2tleTMgPSAwOyBfa2V5MyA8IF9sZW4zOyBfa2V5MysrKSB7XG4gICAgICBhcmdzW19rZXkzXSA9IGFyZ3VtZW50c1tfa2V5M107XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmZvcndhcmQoYXJncywgJ2Vycm9yJywgJycpO1xuICB9XG4gIGRlcHJlY2F0ZSgpIHtcbiAgICBmb3IgKHZhciBfbGVuNCA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBuZXcgQXJyYXkoX2xlbjQpLCBfa2V5NCA9IDA7IF9rZXk0IDwgX2xlbjQ7IF9rZXk0KyspIHtcbiAgICAgIGFyZ3NbX2tleTRdID0gYXJndW1lbnRzW19rZXk0XTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZm9yd2FyZChhcmdzLCAnd2FybicsICdXQVJOSU5HIERFUFJFQ0FURUQ6ICcsIHRydWUpO1xuICB9XG4gIGZvcndhcmQoYXJncywgbHZsLCBwcmVmaXgsIGRlYnVnT25seSkge1xuICAgIGlmIChkZWJ1Z09ubHkgJiYgIXRoaXMuZGVidWcpIHJldHVybiBudWxsO1xuICAgIGlmICh0eXBlb2YgYXJnc1swXSA9PT0gJ3N0cmluZycpIGFyZ3NbMF0gPSBgJHtwcmVmaXh9JHt0aGlzLnByZWZpeH0gJHthcmdzWzBdfWA7XG4gICAgcmV0dXJuIHRoaXMubG9nZ2VyW2x2bF0oYXJncyk7XG4gIH1cbiAgY3JlYXRlKG1vZHVsZU5hbWUpIHtcbiAgICByZXR1cm4gbmV3IExvZ2dlcih0aGlzLmxvZ2dlciwge1xuICAgICAgLi4ue1xuICAgICAgICBwcmVmaXg6IGAke3RoaXMucHJlZml4fToke21vZHVsZU5hbWV9OmBcbiAgICAgIH0sXG4gICAgICAuLi50aGlzLm9wdGlvbnNcbiAgICB9KTtcbiAgfVxuICBjbG9uZShvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwgdGhpcy5vcHRpb25zO1xuICAgIG9wdGlvbnMucHJlZml4ID0gb3B0aW9ucy5wcmVmaXggfHwgdGhpcy5wcmVmaXg7XG4gICAgcmV0dXJuIG5ldyBMb2dnZXIodGhpcy5sb2dnZXIsIG9wdGlvbnMpO1xuICB9XG59XG52YXIgYmFzZUxvZ2dlciA9IG5ldyBMb2dnZXIoKTtcblxuY2xhc3MgRXZlbnRFbWl0dGVyIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5vYnNlcnZlcnMgPSB7fTtcbiAgfVxuICBvbihldmVudHMsIGxpc3RlbmVyKSB7XG4gICAgZXZlbnRzLnNwbGl0KCcgJykuZm9yRWFjaChldmVudCA9PiB7XG4gICAgICB0aGlzLm9ic2VydmVyc1tldmVudF0gPSB0aGlzLm9ic2VydmVyc1tldmVudF0gfHwgW107XG4gICAgICB0aGlzLm9ic2VydmVyc1tldmVudF0ucHVzaChsaXN0ZW5lcik7XG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgb2ZmKGV2ZW50LCBsaXN0ZW5lcikge1xuICAgIGlmICghdGhpcy5vYnNlcnZlcnNbZXZlbnRdKSByZXR1cm47XG4gICAgaWYgKCFsaXN0ZW5lcikge1xuICAgICAgZGVsZXRlIHRoaXMub2JzZXJ2ZXJzW2V2ZW50XTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5vYnNlcnZlcnNbZXZlbnRdID0gdGhpcy5vYnNlcnZlcnNbZXZlbnRdLmZpbHRlcihsID0+IGwgIT09IGxpc3RlbmVyKTtcbiAgfVxuICBlbWl0KGV2ZW50KSB7XG4gICAgZm9yICh2YXIgX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBuZXcgQXJyYXkoX2xlbiA+IDEgPyBfbGVuIC0gMSA6IDApLCBfa2V5ID0gMTsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgICAgYXJnc1tfa2V5IC0gMV0gPSBhcmd1bWVudHNbX2tleV07XG4gICAgfVxuICAgIGlmICh0aGlzLm9ic2VydmVyc1tldmVudF0pIHtcbiAgICAgIGNvbnN0IGNsb25lZCA9IFtdLmNvbmNhdCh0aGlzLm9ic2VydmVyc1tldmVudF0pO1xuICAgICAgY2xvbmVkLmZvckVhY2gob2JzZXJ2ZXIgPT4ge1xuICAgICAgICBvYnNlcnZlciguLi5hcmdzKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAodGhpcy5vYnNlcnZlcnNbJyonXSkge1xuICAgICAgY29uc3QgY2xvbmVkID0gW10uY29uY2F0KHRoaXMub2JzZXJ2ZXJzWycqJ10pO1xuICAgICAgY2xvbmVkLmZvckVhY2gob2JzZXJ2ZXIgPT4ge1xuICAgICAgICBvYnNlcnZlci5hcHBseShvYnNlcnZlciwgW2V2ZW50LCAuLi5hcmdzXSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZGVmZXIoKSB7XG4gIGxldCByZXM7XG4gIGxldCByZWo7XG4gIGNvbnN0IHByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgcmVzID0gcmVzb2x2ZTtcbiAgICByZWogPSByZWplY3Q7XG4gIH0pO1xuICBwcm9taXNlLnJlc29sdmUgPSByZXM7XG4gIHByb21pc2UucmVqZWN0ID0gcmVqO1xuICByZXR1cm4gcHJvbWlzZTtcbn1cbmZ1bmN0aW9uIG1ha2VTdHJpbmcob2JqZWN0KSB7XG4gIGlmIChvYmplY3QgPT0gbnVsbCkgcmV0dXJuICcnO1xuICByZXR1cm4gJycgKyBvYmplY3Q7XG59XG5mdW5jdGlvbiBjb3B5KGEsIHMsIHQpIHtcbiAgYS5mb3JFYWNoKG0gPT4ge1xuICAgIGlmIChzW21dKSB0W21dID0gc1ttXTtcbiAgfSk7XG59XG5mdW5jdGlvbiBnZXRMYXN0T2ZQYXRoKG9iamVjdCwgcGF0aCwgRW1wdHkpIHtcbiAgZnVuY3Rpb24gY2xlYW5LZXkoa2V5KSB7XG4gICAgcmV0dXJuIGtleSAmJiBrZXkuaW5kZXhPZignIyMjJykgPiAtMSA/IGtleS5yZXBsYWNlKC8jIyMvZywgJy4nKSA6IGtleTtcbiAgfVxuICBmdW5jdGlvbiBjYW5Ob3RUcmF2ZXJzZURlZXBlcigpIHtcbiAgICByZXR1cm4gIW9iamVjdCB8fCB0eXBlb2Ygb2JqZWN0ID09PSAnc3RyaW5nJztcbiAgfVxuICBjb25zdCBzdGFjayA9IHR5cGVvZiBwYXRoICE9PSAnc3RyaW5nJyA/IFtdLmNvbmNhdChwYXRoKSA6IHBhdGguc3BsaXQoJy4nKTtcbiAgd2hpbGUgKHN0YWNrLmxlbmd0aCA+IDEpIHtcbiAgICBpZiAoY2FuTm90VHJhdmVyc2VEZWVwZXIoKSkgcmV0dXJuIHt9O1xuICAgIGNvbnN0IGtleSA9IGNsZWFuS2V5KHN0YWNrLnNoaWZ0KCkpO1xuICAgIGlmICghb2JqZWN0W2tleV0gJiYgRW1wdHkpIG9iamVjdFtrZXldID0gbmV3IEVtcHR5KCk7XG4gICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIGtleSkpIHtcbiAgICAgIG9iamVjdCA9IG9iamVjdFtrZXldO1xuICAgIH0gZWxzZSB7XG4gICAgICBvYmplY3QgPSB7fTtcbiAgICB9XG4gIH1cbiAgaWYgKGNhbk5vdFRyYXZlcnNlRGVlcGVyKCkpIHJldHVybiB7fTtcbiAgcmV0dXJuIHtcbiAgICBvYmo6IG9iamVjdCxcbiAgICBrOiBjbGVhbktleShzdGFjay5zaGlmdCgpKVxuICB9O1xufVxuZnVuY3Rpb24gc2V0UGF0aChvYmplY3QsIHBhdGgsIG5ld1ZhbHVlKSB7XG4gIGNvbnN0IHtcbiAgICBvYmosXG4gICAga1xuICB9ID0gZ2V0TGFzdE9mUGF0aChvYmplY3QsIHBhdGgsIE9iamVjdCk7XG4gIG9ialtrXSA9IG5ld1ZhbHVlO1xufVxuZnVuY3Rpb24gcHVzaFBhdGgob2JqZWN0LCBwYXRoLCBuZXdWYWx1ZSwgY29uY2F0KSB7XG4gIGNvbnN0IHtcbiAgICBvYmosXG4gICAga1xuICB9ID0gZ2V0TGFzdE9mUGF0aChvYmplY3QsIHBhdGgsIE9iamVjdCk7XG4gIG9ialtrXSA9IG9ialtrXSB8fCBbXTtcbiAgaWYgKGNvbmNhdCkgb2JqW2tdID0gb2JqW2tdLmNvbmNhdChuZXdWYWx1ZSk7XG4gIGlmICghY29uY2F0KSBvYmpba10ucHVzaChuZXdWYWx1ZSk7XG59XG5mdW5jdGlvbiBnZXRQYXRoKG9iamVjdCwgcGF0aCkge1xuICBjb25zdCB7XG4gICAgb2JqLFxuICAgIGtcbiAgfSA9IGdldExhc3RPZlBhdGgob2JqZWN0LCBwYXRoKTtcbiAgaWYgKCFvYmopIHJldHVybiB1bmRlZmluZWQ7XG4gIHJldHVybiBvYmpba107XG59XG5mdW5jdGlvbiBnZXRQYXRoV2l0aERlZmF1bHRzKGRhdGEsIGRlZmF1bHREYXRhLCBrZXkpIHtcbiAgY29uc3QgdmFsdWUgPSBnZXRQYXRoKGRhdGEsIGtleSk7XG4gIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG4gIHJldHVybiBnZXRQYXRoKGRlZmF1bHREYXRhLCBrZXkpO1xufVxuZnVuY3Rpb24gZGVlcEV4dGVuZCh0YXJnZXQsIHNvdXJjZSwgb3ZlcndyaXRlKSB7XG4gIGZvciAoY29uc3QgcHJvcCBpbiBzb3VyY2UpIHtcbiAgICBpZiAocHJvcCAhPT0gJ19fcHJvdG9fXycgJiYgcHJvcCAhPT0gJ2NvbnN0cnVjdG9yJykge1xuICAgICAgaWYgKHByb3AgaW4gdGFyZ2V0KSB7XG4gICAgICAgIGlmICh0eXBlb2YgdGFyZ2V0W3Byb3BdID09PSAnc3RyaW5nJyB8fCB0YXJnZXRbcHJvcF0gaW5zdGFuY2VvZiBTdHJpbmcgfHwgdHlwZW9mIHNvdXJjZVtwcm9wXSA9PT0gJ3N0cmluZycgfHwgc291cmNlW3Byb3BdIGluc3RhbmNlb2YgU3RyaW5nKSB7XG4gICAgICAgICAgaWYgKG92ZXJ3cml0ZSkgdGFyZ2V0W3Byb3BdID0gc291cmNlW3Byb3BdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRlZXBFeHRlbmQodGFyZ2V0W3Byb3BdLCBzb3VyY2VbcHJvcF0sIG92ZXJ3cml0ZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRhcmdldFtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRhcmdldDtcbn1cbmZ1bmN0aW9uIHJlZ2V4RXNjYXBlKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoL1tcXC1cXFtcXF1cXC9cXHtcXH1cXChcXClcXCpcXCtcXD9cXC5cXFxcXFxeXFwkXFx8XS9nLCAnXFxcXCQmJyk7XG59XG52YXIgX2VudGl0eU1hcCA9IHtcbiAgJyYnOiAnJmFtcDsnLFxuICAnPCc6ICcmbHQ7JyxcbiAgJz4nOiAnJmd0OycsXG4gICdcIic6ICcmcXVvdDsnLFxuICBcIidcIjogJyYjMzk7JyxcbiAgJy8nOiAnJiN4MkY7J1xufTtcbmZ1bmN0aW9uIGVzY2FwZShkYXRhKSB7XG4gIGlmICh0eXBlb2YgZGF0YSA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gZGF0YS5yZXBsYWNlKC9bJjw+XCInXFwvXS9nLCBzID0+IF9lbnRpdHlNYXBbc10pO1xuICB9XG4gIHJldHVybiBkYXRhO1xufVxuY29uc3QgY2hhcnMgPSBbJyAnLCAnLCcsICc/JywgJyEnLCAnOyddO1xuZnVuY3Rpb24gbG9va3NMaWtlT2JqZWN0UGF0aChrZXksIG5zU2VwYXJhdG9yLCBrZXlTZXBhcmF0b3IpIHtcbiAgbnNTZXBhcmF0b3IgPSBuc1NlcGFyYXRvciB8fCAnJztcbiAga2V5U2VwYXJhdG9yID0ga2V5U2VwYXJhdG9yIHx8ICcnO1xuICBjb25zdCBwb3NzaWJsZUNoYXJzID0gY2hhcnMuZmlsdGVyKGMgPT4gbnNTZXBhcmF0b3IuaW5kZXhPZihjKSA8IDAgJiYga2V5U2VwYXJhdG9yLmluZGV4T2YoYykgPCAwKTtcbiAgaWYgKHBvc3NpYmxlQ2hhcnMubGVuZ3RoID09PSAwKSByZXR1cm4gdHJ1ZTtcbiAgY29uc3QgciA9IG5ldyBSZWdFeHAoYCgke3Bvc3NpYmxlQ2hhcnMubWFwKGMgPT4gYyA9PT0gJz8nID8gJ1xcXFw/JyA6IGMpLmpvaW4oJ3wnKX0pYCk7XG4gIGxldCBtYXRjaGVkID0gIXIudGVzdChrZXkpO1xuICBpZiAoIW1hdGNoZWQpIHtcbiAgICBjb25zdCBraSA9IGtleS5pbmRleE9mKGtleVNlcGFyYXRvcik7XG4gICAgaWYgKGtpID4gMCAmJiAhci50ZXN0KGtleS5zdWJzdHJpbmcoMCwga2kpKSkge1xuICAgICAgbWF0Y2hlZCA9IHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBtYXRjaGVkO1xufVxuZnVuY3Rpb24gZGVlcEZpbmQob2JqLCBwYXRoKSB7XG4gIGxldCBrZXlTZXBhcmF0b3IgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6ICcuJztcbiAgaWYgKCFvYmopIHJldHVybiB1bmRlZmluZWQ7XG4gIGlmIChvYmpbcGF0aF0pIHJldHVybiBvYmpbcGF0aF07XG4gIGNvbnN0IHBhdGhzID0gcGF0aC5zcGxpdChrZXlTZXBhcmF0b3IpO1xuICBsZXQgY3VycmVudCA9IG9iajtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXRocy5sZW5ndGg7ICsraSkge1xuICAgIGlmICghY3VycmVudCkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICBpZiAodHlwZW9mIGN1cnJlbnRbcGF0aHNbaV1dID09PSAnc3RyaW5nJyAmJiBpICsgMSA8IHBhdGhzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKGN1cnJlbnRbcGF0aHNbaV1dID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGxldCBqID0gMjtcbiAgICAgIGxldCBwID0gcGF0aHMuc2xpY2UoaSwgaSArIGopLmpvaW4oa2V5U2VwYXJhdG9yKTtcbiAgICAgIGxldCBtaXggPSBjdXJyZW50W3BdO1xuICAgICAgd2hpbGUgKG1peCA9PT0gdW5kZWZpbmVkICYmIHBhdGhzLmxlbmd0aCA+IGkgKyBqKSB7XG4gICAgICAgIGorKztcbiAgICAgICAgcCA9IHBhdGhzLnNsaWNlKGksIGkgKyBqKS5qb2luKGtleVNlcGFyYXRvcik7XG4gICAgICAgIG1peCA9IGN1cnJlbnRbcF07XG4gICAgICB9XG4gICAgICBpZiAobWl4ID09PSB1bmRlZmluZWQpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICBpZiAobWl4ID09PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgICAgIGlmIChwYXRoLmVuZHNXaXRoKHApKSB7XG4gICAgICAgIGlmICh0eXBlb2YgbWl4ID09PSAnc3RyaW5nJykgcmV0dXJuIG1peDtcbiAgICAgICAgaWYgKHAgJiYgdHlwZW9mIG1peFtwXSA9PT0gJ3N0cmluZycpIHJldHVybiBtaXhbcF07XG4gICAgICB9XG4gICAgICBjb25zdCBqb2luZWRQYXRoID0gcGF0aHMuc2xpY2UoaSArIGopLmpvaW4oa2V5U2VwYXJhdG9yKTtcbiAgICAgIGlmIChqb2luZWRQYXRoKSByZXR1cm4gZGVlcEZpbmQobWl4LCBqb2luZWRQYXRoLCBrZXlTZXBhcmF0b3IpO1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgY3VycmVudCA9IGN1cnJlbnRbcGF0aHNbaV1dO1xuICB9XG4gIHJldHVybiBjdXJyZW50O1xufVxuZnVuY3Rpb24gZ2V0Q2xlYW5lZENvZGUoY29kZSkge1xuICBpZiAoY29kZSAmJiBjb2RlLmluZGV4T2YoJ18nKSA+IDApIHJldHVybiBjb2RlLnJlcGxhY2UoJ18nLCAnLScpO1xuICByZXR1cm4gY29kZTtcbn1cblxuY2xhc3MgUmVzb3VyY2VTdG9yZSBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yKGRhdGEpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge1xuICAgICAgbnM6IFsndHJhbnNsYXRpb24nXSxcbiAgICAgIGRlZmF1bHROUzogJ3RyYW5zbGF0aW9uJ1xuICAgIH07XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmRhdGEgPSBkYXRhIHx8IHt9O1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5rZXlTZXBhcmF0b3IgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5vcHRpb25zLmtleVNlcGFyYXRvciA9ICcuJztcbiAgICB9XG4gICAgaWYgKHRoaXMub3B0aW9ucy5pZ25vcmVKU09OU3RydWN0dXJlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5pZ25vcmVKU09OU3RydWN0dXJlID0gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgYWRkTmFtZXNwYWNlcyhucykge1xuICAgIGlmICh0aGlzLm9wdGlvbnMubnMuaW5kZXhPZihucykgPCAwKSB7XG4gICAgICB0aGlzLm9wdGlvbnMubnMucHVzaChucyk7XG4gICAgfVxuICB9XG4gIHJlbW92ZU5hbWVzcGFjZXMobnMpIHtcbiAgICBjb25zdCBpbmRleCA9IHRoaXMub3B0aW9ucy5ucy5pbmRleE9mKG5zKTtcbiAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgdGhpcy5vcHRpb25zLm5zLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuICB9XG4gIGdldFJlc291cmNlKGxuZywgbnMsIGtleSkge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDMgJiYgYXJndW1lbnRzWzNdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbM10gOiB7fTtcbiAgICBjb25zdCBrZXlTZXBhcmF0b3IgPSBvcHRpb25zLmtleVNlcGFyYXRvciAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy5rZXlTZXBhcmF0b3IgOiB0aGlzLm9wdGlvbnMua2V5U2VwYXJhdG9yO1xuICAgIGNvbnN0IGlnbm9yZUpTT05TdHJ1Y3R1cmUgPSBvcHRpb25zLmlnbm9yZUpTT05TdHJ1Y3R1cmUgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMuaWdub3JlSlNPTlN0cnVjdHVyZSA6IHRoaXMub3B0aW9ucy5pZ25vcmVKU09OU3RydWN0dXJlO1xuICAgIGxldCBwYXRoID0gW2xuZywgbnNdO1xuICAgIGlmIChrZXkgJiYgdHlwZW9mIGtleSAhPT0gJ3N0cmluZycpIHBhdGggPSBwYXRoLmNvbmNhdChrZXkpO1xuICAgIGlmIChrZXkgJiYgdHlwZW9mIGtleSA9PT0gJ3N0cmluZycpIHBhdGggPSBwYXRoLmNvbmNhdChrZXlTZXBhcmF0b3IgPyBrZXkuc3BsaXQoa2V5U2VwYXJhdG9yKSA6IGtleSk7XG4gICAgaWYgKGxuZy5pbmRleE9mKCcuJykgPiAtMSkge1xuICAgICAgcGF0aCA9IGxuZy5zcGxpdCgnLicpO1xuICAgIH1cbiAgICBjb25zdCByZXN1bHQgPSBnZXRQYXRoKHRoaXMuZGF0YSwgcGF0aCk7XG4gICAgaWYgKHJlc3VsdCB8fCAhaWdub3JlSlNPTlN0cnVjdHVyZSB8fCB0eXBlb2Yga2V5ICE9PSAnc3RyaW5nJykgcmV0dXJuIHJlc3VsdDtcbiAgICByZXR1cm4gZGVlcEZpbmQodGhpcy5kYXRhICYmIHRoaXMuZGF0YVtsbmddICYmIHRoaXMuZGF0YVtsbmddW25zXSwga2V5LCBrZXlTZXBhcmF0b3IpO1xuICB9XG4gIGFkZFJlc291cmNlKGxuZywgbnMsIGtleSwgdmFsdWUpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiA0ICYmIGFyZ3VtZW50c1s0XSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzRdIDoge1xuICAgICAgc2lsZW50OiBmYWxzZVxuICAgIH07XG4gICAgY29uc3Qga2V5U2VwYXJhdG9yID0gb3B0aW9ucy5rZXlTZXBhcmF0b3IgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMua2V5U2VwYXJhdG9yIDogdGhpcy5vcHRpb25zLmtleVNlcGFyYXRvcjtcbiAgICBsZXQgcGF0aCA9IFtsbmcsIG5zXTtcbiAgICBpZiAoa2V5KSBwYXRoID0gcGF0aC5jb25jYXQoa2V5U2VwYXJhdG9yID8ga2V5LnNwbGl0KGtleVNlcGFyYXRvcikgOiBrZXkpO1xuICAgIGlmIChsbmcuaW5kZXhPZignLicpID4gLTEpIHtcbiAgICAgIHBhdGggPSBsbmcuc3BsaXQoJy4nKTtcbiAgICAgIHZhbHVlID0gbnM7XG4gICAgICBucyA9IHBhdGhbMV07XG4gICAgfVxuICAgIHRoaXMuYWRkTmFtZXNwYWNlcyhucyk7XG4gICAgc2V0UGF0aCh0aGlzLmRhdGEsIHBhdGgsIHZhbHVlKTtcbiAgICBpZiAoIW9wdGlvbnMuc2lsZW50KSB0aGlzLmVtaXQoJ2FkZGVkJywgbG5nLCBucywga2V5LCB2YWx1ZSk7XG4gIH1cbiAgYWRkUmVzb3VyY2VzKGxuZywgbnMsIHJlc291cmNlcykge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDMgJiYgYXJndW1lbnRzWzNdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbM10gOiB7XG4gICAgICBzaWxlbnQ6IGZhbHNlXG4gICAgfTtcbiAgICBmb3IgKGNvbnN0IG0gaW4gcmVzb3VyY2VzKSB7XG4gICAgICBpZiAodHlwZW9mIHJlc291cmNlc1ttXSA9PT0gJ3N0cmluZycgfHwgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5hcHBseShyZXNvdXJjZXNbbV0pID09PSAnW29iamVjdCBBcnJheV0nKSB0aGlzLmFkZFJlc291cmNlKGxuZywgbnMsIG0sIHJlc291cmNlc1ttXSwge1xuICAgICAgICBzaWxlbnQ6IHRydWVcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAoIW9wdGlvbnMuc2lsZW50KSB0aGlzLmVtaXQoJ2FkZGVkJywgbG5nLCBucywgcmVzb3VyY2VzKTtcbiAgfVxuICBhZGRSZXNvdXJjZUJ1bmRsZShsbmcsIG5zLCByZXNvdXJjZXMsIGRlZXAsIG92ZXJ3cml0ZSkge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDUgJiYgYXJndW1lbnRzWzVdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbNV0gOiB7XG4gICAgICBzaWxlbnQ6IGZhbHNlXG4gICAgfTtcbiAgICBsZXQgcGF0aCA9IFtsbmcsIG5zXTtcbiAgICBpZiAobG5nLmluZGV4T2YoJy4nKSA+IC0xKSB7XG4gICAgICBwYXRoID0gbG5nLnNwbGl0KCcuJyk7XG4gICAgICBkZWVwID0gcmVzb3VyY2VzO1xuICAgICAgcmVzb3VyY2VzID0gbnM7XG4gICAgICBucyA9IHBhdGhbMV07XG4gICAgfVxuICAgIHRoaXMuYWRkTmFtZXNwYWNlcyhucyk7XG4gICAgbGV0IHBhY2sgPSBnZXRQYXRoKHRoaXMuZGF0YSwgcGF0aCkgfHwge307XG4gICAgaWYgKGRlZXApIHtcbiAgICAgIGRlZXBFeHRlbmQocGFjaywgcmVzb3VyY2VzLCBvdmVyd3JpdGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBwYWNrID0ge1xuICAgICAgICAuLi5wYWNrLFxuICAgICAgICAuLi5yZXNvdXJjZXNcbiAgICAgIH07XG4gICAgfVxuICAgIHNldFBhdGgodGhpcy5kYXRhLCBwYXRoLCBwYWNrKTtcbiAgICBpZiAoIW9wdGlvbnMuc2lsZW50KSB0aGlzLmVtaXQoJ2FkZGVkJywgbG5nLCBucywgcmVzb3VyY2VzKTtcbiAgfVxuICByZW1vdmVSZXNvdXJjZUJ1bmRsZShsbmcsIG5zKSB7XG4gICAgaWYgKHRoaXMuaGFzUmVzb3VyY2VCdW5kbGUobG5nLCBucykpIHtcbiAgICAgIGRlbGV0ZSB0aGlzLmRhdGFbbG5nXVtuc107XG4gICAgfVxuICAgIHRoaXMucmVtb3ZlTmFtZXNwYWNlcyhucyk7XG4gICAgdGhpcy5lbWl0KCdyZW1vdmVkJywgbG5nLCBucyk7XG4gIH1cbiAgaGFzUmVzb3VyY2VCdW5kbGUobG5nLCBucykge1xuICAgIHJldHVybiB0aGlzLmdldFJlc291cmNlKGxuZywgbnMpICE9PSB1bmRlZmluZWQ7XG4gIH1cbiAgZ2V0UmVzb3VyY2VCdW5kbGUobG5nLCBucykge1xuICAgIGlmICghbnMpIG5zID0gdGhpcy5vcHRpb25zLmRlZmF1bHROUztcbiAgICBpZiAodGhpcy5vcHRpb25zLmNvbXBhdGliaWxpdHlBUEkgPT09ICd2MScpIHJldHVybiB7XG4gICAgICAuLi57fSxcbiAgICAgIC4uLnRoaXMuZ2V0UmVzb3VyY2UobG5nLCBucylcbiAgICB9O1xuICAgIHJldHVybiB0aGlzLmdldFJlc291cmNlKGxuZywgbnMpO1xuICB9XG4gIGdldERhdGFCeUxhbmd1YWdlKGxuZykge1xuICAgIHJldHVybiB0aGlzLmRhdGFbbG5nXTtcbiAgfVxuICBoYXNMYW5ndWFnZVNvbWVUcmFuc2xhdGlvbnMobG5nKSB7XG4gICAgY29uc3QgZGF0YSA9IHRoaXMuZ2V0RGF0YUJ5TGFuZ3VhZ2UobG5nKTtcbiAgICBjb25zdCBuID0gZGF0YSAmJiBPYmplY3Qua2V5cyhkYXRhKSB8fCBbXTtcbiAgICByZXR1cm4gISFuLmZpbmQodiA9PiBkYXRhW3ZdICYmIE9iamVjdC5rZXlzKGRhdGFbdl0pLmxlbmd0aCA+IDApO1xuICB9XG4gIHRvSlNPTigpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhO1xuICB9XG59XG5cbnZhciBwb3N0UHJvY2Vzc29yID0ge1xuICBwcm9jZXNzb3JzOiB7fSxcbiAgYWRkUG9zdFByb2Nlc3Nvcihtb2R1bGUpIHtcbiAgICB0aGlzLnByb2Nlc3NvcnNbbW9kdWxlLm5hbWVdID0gbW9kdWxlO1xuICB9LFxuICBoYW5kbGUocHJvY2Vzc29ycywgdmFsdWUsIGtleSwgb3B0aW9ucywgdHJhbnNsYXRvcikge1xuICAgIHByb2Nlc3NvcnMuZm9yRWFjaChwcm9jZXNzb3IgPT4ge1xuICAgICAgaWYgKHRoaXMucHJvY2Vzc29yc1twcm9jZXNzb3JdKSB2YWx1ZSA9IHRoaXMucHJvY2Vzc29yc1twcm9jZXNzb3JdLnByb2Nlc3ModmFsdWUsIGtleSwgb3B0aW9ucywgdHJhbnNsYXRvcik7XG4gICAgfSk7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG59O1xuXG5jb25zdCBjaGVja2VkTG9hZGVkRm9yID0ge307XG5jbGFzcyBUcmFuc2xhdG9yIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgY29uc3RydWN0b3Ioc2VydmljZXMpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge307XG4gICAgc3VwZXIoKTtcbiAgICBjb3B5KFsncmVzb3VyY2VTdG9yZScsICdsYW5ndWFnZVV0aWxzJywgJ3BsdXJhbFJlc29sdmVyJywgJ2ludGVycG9sYXRvcicsICdiYWNrZW5kQ29ubmVjdG9yJywgJ2kxOG5Gb3JtYXQnLCAndXRpbHMnXSwgc2VydmljZXMsIHRoaXMpO1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5rZXlTZXBhcmF0b3IgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5vcHRpb25zLmtleVNlcGFyYXRvciA9ICcuJztcbiAgICB9XG4gICAgdGhpcy5sb2dnZXIgPSBiYXNlTG9nZ2VyLmNyZWF0ZSgndHJhbnNsYXRvcicpO1xuICB9XG4gIGNoYW5nZUxhbmd1YWdlKGxuZykge1xuICAgIGlmIChsbmcpIHRoaXMubGFuZ3VhZ2UgPSBsbmc7XG4gIH1cbiAgZXhpc3RzKGtleSkge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB7XG4gICAgICBpbnRlcnBvbGF0aW9uOiB7fVxuICAgIH07XG4gICAgaWYgKGtleSA9PT0gdW5kZWZpbmVkIHx8IGtleSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCByZXNvbHZlZCA9IHRoaXMucmVzb2x2ZShrZXksIG9wdGlvbnMpO1xuICAgIHJldHVybiByZXNvbHZlZCAmJiByZXNvbHZlZC5yZXMgIT09IHVuZGVmaW5lZDtcbiAgfVxuICBleHRyYWN0RnJvbUtleShrZXksIG9wdGlvbnMpIHtcbiAgICBsZXQgbnNTZXBhcmF0b3IgPSBvcHRpb25zLm5zU2VwYXJhdG9yICE9PSB1bmRlZmluZWQgPyBvcHRpb25zLm5zU2VwYXJhdG9yIDogdGhpcy5vcHRpb25zLm5zU2VwYXJhdG9yO1xuICAgIGlmIChuc1NlcGFyYXRvciA9PT0gdW5kZWZpbmVkKSBuc1NlcGFyYXRvciA9ICc6JztcbiAgICBjb25zdCBrZXlTZXBhcmF0b3IgPSBvcHRpb25zLmtleVNlcGFyYXRvciAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy5rZXlTZXBhcmF0b3IgOiB0aGlzLm9wdGlvbnMua2V5U2VwYXJhdG9yO1xuICAgIGxldCBuYW1lc3BhY2VzID0gb3B0aW9ucy5ucyB8fCB0aGlzLm9wdGlvbnMuZGVmYXVsdE5TIHx8IFtdO1xuICAgIGNvbnN0IHdvdWxkQ2hlY2tGb3JOc0luS2V5ID0gbnNTZXBhcmF0b3IgJiYga2V5LmluZGV4T2YobnNTZXBhcmF0b3IpID4gLTE7XG4gICAgY29uc3Qgc2VlbXNOYXR1cmFsTGFuZ3VhZ2UgPSAhdGhpcy5vcHRpb25zLnVzZXJEZWZpbmVkS2V5U2VwYXJhdG9yICYmICFvcHRpb25zLmtleVNlcGFyYXRvciAmJiAhdGhpcy5vcHRpb25zLnVzZXJEZWZpbmVkTnNTZXBhcmF0b3IgJiYgIW9wdGlvbnMubnNTZXBhcmF0b3IgJiYgIWxvb2tzTGlrZU9iamVjdFBhdGgoa2V5LCBuc1NlcGFyYXRvciwga2V5U2VwYXJhdG9yKTtcbiAgICBpZiAod291bGRDaGVja0Zvck5zSW5LZXkgJiYgIXNlZW1zTmF0dXJhbExhbmd1YWdlKSB7XG4gICAgICBjb25zdCBtID0ga2V5Lm1hdGNoKHRoaXMuaW50ZXJwb2xhdG9yLm5lc3RpbmdSZWdleHApO1xuICAgICAgaWYgKG0gJiYgbS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAga2V5LFxuICAgICAgICAgIG5hbWVzcGFjZXNcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHBhcnRzID0ga2V5LnNwbGl0KG5zU2VwYXJhdG9yKTtcbiAgICAgIGlmIChuc1NlcGFyYXRvciAhPT0ga2V5U2VwYXJhdG9yIHx8IG5zU2VwYXJhdG9yID09PSBrZXlTZXBhcmF0b3IgJiYgdGhpcy5vcHRpb25zLm5zLmluZGV4T2YocGFydHNbMF0pID4gLTEpIG5hbWVzcGFjZXMgPSBwYXJ0cy5zaGlmdCgpO1xuICAgICAga2V5ID0gcGFydHMuam9pbihrZXlTZXBhcmF0b3IpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIG5hbWVzcGFjZXMgPT09ICdzdHJpbmcnKSBuYW1lc3BhY2VzID0gW25hbWVzcGFjZXNdO1xuICAgIHJldHVybiB7XG4gICAgICBrZXksXG4gICAgICBuYW1lc3BhY2VzXG4gICAgfTtcbiAgfVxuICB0cmFuc2xhdGUoa2V5cywgb3B0aW9ucywgbGFzdEtleSkge1xuICAgIGlmICh0eXBlb2Ygb3B0aW9ucyAhPT0gJ29iamVjdCcgJiYgdGhpcy5vcHRpb25zLm92ZXJsb2FkVHJhbnNsYXRpb25PcHRpb25IYW5kbGVyKSB7XG4gICAgICBvcHRpb25zID0gdGhpcy5vcHRpb25zLm92ZXJsb2FkVHJhbnNsYXRpb25PcHRpb25IYW5kbGVyKGFyZ3VtZW50cyk7XG4gICAgfVxuICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ29iamVjdCcpIG9wdGlvbnMgPSB7XG4gICAgICAuLi5vcHRpb25zXG4gICAgfTtcbiAgICBpZiAoIW9wdGlvbnMpIG9wdGlvbnMgPSB7fTtcbiAgICBpZiAoa2V5cyA9PT0gdW5kZWZpbmVkIHx8IGtleXMgPT09IG51bGwpIHJldHVybiAnJztcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoa2V5cykpIGtleXMgPSBbU3RyaW5nKGtleXMpXTtcbiAgICBjb25zdCByZXR1cm5EZXRhaWxzID0gb3B0aW9ucy5yZXR1cm5EZXRhaWxzICE9PSB1bmRlZmluZWQgPyBvcHRpb25zLnJldHVybkRldGFpbHMgOiB0aGlzLm9wdGlvbnMucmV0dXJuRGV0YWlscztcbiAgICBjb25zdCBrZXlTZXBhcmF0b3IgPSBvcHRpb25zLmtleVNlcGFyYXRvciAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy5rZXlTZXBhcmF0b3IgOiB0aGlzLm9wdGlvbnMua2V5U2VwYXJhdG9yO1xuICAgIGNvbnN0IHtcbiAgICAgIGtleSxcbiAgICAgIG5hbWVzcGFjZXNcbiAgICB9ID0gdGhpcy5leHRyYWN0RnJvbUtleShrZXlzW2tleXMubGVuZ3RoIC0gMV0sIG9wdGlvbnMpO1xuICAgIGNvbnN0IG5hbWVzcGFjZSA9IG5hbWVzcGFjZXNbbmFtZXNwYWNlcy5sZW5ndGggLSAxXTtcbiAgICBjb25zdCBsbmcgPSBvcHRpb25zLmxuZyB8fCB0aGlzLmxhbmd1YWdlO1xuICAgIGNvbnN0IGFwcGVuZE5hbWVzcGFjZVRvQ0lNb2RlID0gb3B0aW9ucy5hcHBlbmROYW1lc3BhY2VUb0NJTW9kZSB8fCB0aGlzLm9wdGlvbnMuYXBwZW5kTmFtZXNwYWNlVG9DSU1vZGU7XG4gICAgaWYgKGxuZyAmJiBsbmcudG9Mb3dlckNhc2UoKSA9PT0gJ2NpbW9kZScpIHtcbiAgICAgIGlmIChhcHBlbmROYW1lc3BhY2VUb0NJTW9kZSkge1xuICAgICAgICBjb25zdCBuc1NlcGFyYXRvciA9IG9wdGlvbnMubnNTZXBhcmF0b3IgfHwgdGhpcy5vcHRpb25zLm5zU2VwYXJhdG9yO1xuICAgICAgICBpZiAocmV0dXJuRGV0YWlscykge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXM6IGAke25hbWVzcGFjZX0ke25zU2VwYXJhdG9yfSR7a2V5fWAsXG4gICAgICAgICAgICB1c2VkS2V5OiBrZXksXG4gICAgICAgICAgICBleGFjdFVzZWRLZXk6IGtleSxcbiAgICAgICAgICAgIHVzZWRMbmc6IGxuZyxcbiAgICAgICAgICAgIHVzZWROUzogbmFtZXNwYWNlXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYCR7bmFtZXNwYWNlfSR7bnNTZXBhcmF0b3J9JHtrZXl9YDtcbiAgICAgIH1cbiAgICAgIGlmIChyZXR1cm5EZXRhaWxzKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgcmVzOiBrZXksXG4gICAgICAgICAgdXNlZEtleToga2V5LFxuICAgICAgICAgIGV4YWN0VXNlZEtleToga2V5LFxuICAgICAgICAgIHVzZWRMbmc6IGxuZyxcbiAgICAgICAgICB1c2VkTlM6IG5hbWVzcGFjZVxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIGtleTtcbiAgICB9XG4gICAgY29uc3QgcmVzb2x2ZWQgPSB0aGlzLnJlc29sdmUoa2V5cywgb3B0aW9ucyk7XG4gICAgbGV0IHJlcyA9IHJlc29sdmVkICYmIHJlc29sdmVkLnJlcztcbiAgICBjb25zdCByZXNVc2VkS2V5ID0gcmVzb2x2ZWQgJiYgcmVzb2x2ZWQudXNlZEtleSB8fCBrZXk7XG4gICAgY29uc3QgcmVzRXhhY3RVc2VkS2V5ID0gcmVzb2x2ZWQgJiYgcmVzb2x2ZWQuZXhhY3RVc2VkS2V5IHx8IGtleTtcbiAgICBjb25zdCByZXNUeXBlID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5hcHBseShyZXMpO1xuICAgIGNvbnN0IG5vT2JqZWN0ID0gWydbb2JqZWN0IE51bWJlcl0nLCAnW29iamVjdCBGdW5jdGlvbl0nLCAnW29iamVjdCBSZWdFeHBdJ107XG4gICAgY29uc3Qgam9pbkFycmF5cyA9IG9wdGlvbnMuam9pbkFycmF5cyAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy5qb2luQXJyYXlzIDogdGhpcy5vcHRpb25zLmpvaW5BcnJheXM7XG4gICAgY29uc3QgaGFuZGxlQXNPYmplY3RJbkkxOG5Gb3JtYXQgPSAhdGhpcy5pMThuRm9ybWF0IHx8IHRoaXMuaTE4bkZvcm1hdC5oYW5kbGVBc09iamVjdDtcbiAgICBjb25zdCBoYW5kbGVBc09iamVjdCA9IHR5cGVvZiByZXMgIT09ICdzdHJpbmcnICYmIHR5cGVvZiByZXMgIT09ICdib29sZWFuJyAmJiB0eXBlb2YgcmVzICE9PSAnbnVtYmVyJztcbiAgICBpZiAoaGFuZGxlQXNPYmplY3RJbkkxOG5Gb3JtYXQgJiYgcmVzICYmIGhhbmRsZUFzT2JqZWN0ICYmIG5vT2JqZWN0LmluZGV4T2YocmVzVHlwZSkgPCAwICYmICEodHlwZW9mIGpvaW5BcnJheXMgPT09ICdzdHJpbmcnICYmIHJlc1R5cGUgPT09ICdbb2JqZWN0IEFycmF5XScpKSB7XG4gICAgICBpZiAoIW9wdGlvbnMucmV0dXJuT2JqZWN0cyAmJiAhdGhpcy5vcHRpb25zLnJldHVybk9iamVjdHMpIHtcbiAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnMucmV0dXJuZWRPYmplY3RIYW5kbGVyKSB7XG4gICAgICAgICAgdGhpcy5sb2dnZXIud2FybignYWNjZXNzaW5nIGFuIG9iamVjdCAtIGJ1dCByZXR1cm5PYmplY3RzIG9wdGlvbnMgaXMgbm90IGVuYWJsZWQhJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgciA9IHRoaXMub3B0aW9ucy5yZXR1cm5lZE9iamVjdEhhbmRsZXIgPyB0aGlzLm9wdGlvbnMucmV0dXJuZWRPYmplY3RIYW5kbGVyKHJlc1VzZWRLZXksIHJlcywge1xuICAgICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgICAgbnM6IG5hbWVzcGFjZXNcbiAgICAgICAgfSkgOiBga2V5ICcke2tleX0gKCR7dGhpcy5sYW5ndWFnZX0pJyByZXR1cm5lZCBhbiBvYmplY3QgaW5zdGVhZCBvZiBzdHJpbmcuYDtcbiAgICAgICAgaWYgKHJldHVybkRldGFpbHMpIHtcbiAgICAgICAgICByZXNvbHZlZC5yZXMgPSByO1xuICAgICAgICAgIHJldHVybiByZXNvbHZlZDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcjtcbiAgICAgIH1cbiAgICAgIGlmIChrZXlTZXBhcmF0b3IpIHtcbiAgICAgICAgY29uc3QgcmVzVHlwZUlzQXJyYXkgPSByZXNUeXBlID09PSAnW29iamVjdCBBcnJheV0nO1xuICAgICAgICBjb25zdCBjb3B5ID0gcmVzVHlwZUlzQXJyYXkgPyBbXSA6IHt9O1xuICAgICAgICBjb25zdCBuZXdLZXlUb1VzZSA9IHJlc1R5cGVJc0FycmF5ID8gcmVzRXhhY3RVc2VkS2V5IDogcmVzVXNlZEtleTtcbiAgICAgICAgZm9yIChjb25zdCBtIGluIHJlcykge1xuICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocmVzLCBtKSkge1xuICAgICAgICAgICAgY29uc3QgZGVlcEtleSA9IGAke25ld0tleVRvVXNlfSR7a2V5U2VwYXJhdG9yfSR7bX1gO1xuICAgICAgICAgICAgY29weVttXSA9IHRoaXMudHJhbnNsYXRlKGRlZXBLZXksIHtcbiAgICAgICAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgICAgICAgLi4ue1xuICAgICAgICAgICAgICAgIGpvaW5BcnJheXM6IGZhbHNlLFxuICAgICAgICAgICAgICAgIG5zOiBuYW1lc3BhY2VzXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGNvcHlbbV0gPT09IGRlZXBLZXkpIGNvcHlbbV0gPSByZXNbbV07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJlcyA9IGNvcHk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChoYW5kbGVBc09iamVjdEluSTE4bkZvcm1hdCAmJiB0eXBlb2Ygam9pbkFycmF5cyA9PT0gJ3N0cmluZycgJiYgcmVzVHlwZSA9PT0gJ1tvYmplY3QgQXJyYXldJykge1xuICAgICAgcmVzID0gcmVzLmpvaW4oam9pbkFycmF5cyk7XG4gICAgICBpZiAocmVzKSByZXMgPSB0aGlzLmV4dGVuZFRyYW5zbGF0aW9uKHJlcywga2V5cywgb3B0aW9ucywgbGFzdEtleSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCB1c2VkRGVmYXVsdCA9IGZhbHNlO1xuICAgICAgbGV0IHVzZWRLZXkgPSBmYWxzZTtcbiAgICAgIGNvbnN0IG5lZWRzUGx1cmFsSGFuZGxpbmcgPSBvcHRpb25zLmNvdW50ICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIG9wdGlvbnMuY291bnQgIT09ICdzdHJpbmcnO1xuICAgICAgY29uc3QgaGFzRGVmYXVsdFZhbHVlID0gVHJhbnNsYXRvci5oYXNEZWZhdWx0VmFsdWUob3B0aW9ucyk7XG4gICAgICBjb25zdCBkZWZhdWx0VmFsdWVTdWZmaXggPSBuZWVkc1BsdXJhbEhhbmRsaW5nID8gdGhpcy5wbHVyYWxSZXNvbHZlci5nZXRTdWZmaXgobG5nLCBvcHRpb25zLmNvdW50LCBvcHRpb25zKSA6ICcnO1xuICAgICAgY29uc3QgZGVmYXVsdFZhbHVlU3VmZml4T3JkaW5hbEZhbGxiYWNrID0gb3B0aW9ucy5vcmRpbmFsICYmIG5lZWRzUGx1cmFsSGFuZGxpbmcgPyB0aGlzLnBsdXJhbFJlc29sdmVyLmdldFN1ZmZpeChsbmcsIG9wdGlvbnMuY291bnQsIHtcbiAgICAgICAgb3JkaW5hbDogZmFsc2VcbiAgICAgIH0pIDogJyc7XG4gICAgICBjb25zdCBkZWZhdWx0VmFsdWUgPSBvcHRpb25zW2BkZWZhdWx0VmFsdWUke2RlZmF1bHRWYWx1ZVN1ZmZpeH1gXSB8fCBvcHRpb25zW2BkZWZhdWx0VmFsdWUke2RlZmF1bHRWYWx1ZVN1ZmZpeE9yZGluYWxGYWxsYmFja31gXSB8fCBvcHRpb25zLmRlZmF1bHRWYWx1ZTtcbiAgICAgIGlmICghdGhpcy5pc1ZhbGlkTG9va3VwKHJlcykgJiYgaGFzRGVmYXVsdFZhbHVlKSB7XG4gICAgICAgIHVzZWREZWZhdWx0ID0gdHJ1ZTtcbiAgICAgICAgcmVzID0gZGVmYXVsdFZhbHVlO1xuICAgICAgfVxuICAgICAgaWYgKCF0aGlzLmlzVmFsaWRMb29rdXAocmVzKSkge1xuICAgICAgICB1c2VkS2V5ID0gdHJ1ZTtcbiAgICAgICAgcmVzID0ga2V5O1xuICAgICAgfVxuICAgICAgY29uc3QgbWlzc2luZ0tleU5vVmFsdWVGYWxsYmFja1RvS2V5ID0gb3B0aW9ucy5taXNzaW5nS2V5Tm9WYWx1ZUZhbGxiYWNrVG9LZXkgfHwgdGhpcy5vcHRpb25zLm1pc3NpbmdLZXlOb1ZhbHVlRmFsbGJhY2tUb0tleTtcbiAgICAgIGNvbnN0IHJlc0Zvck1pc3NpbmcgPSBtaXNzaW5nS2V5Tm9WYWx1ZUZhbGxiYWNrVG9LZXkgJiYgdXNlZEtleSA/IHVuZGVmaW5lZCA6IHJlcztcbiAgICAgIGNvbnN0IHVwZGF0ZU1pc3NpbmcgPSBoYXNEZWZhdWx0VmFsdWUgJiYgZGVmYXVsdFZhbHVlICE9PSByZXMgJiYgdGhpcy5vcHRpb25zLnVwZGF0ZU1pc3Npbmc7XG4gICAgICBpZiAodXNlZEtleSB8fCB1c2VkRGVmYXVsdCB8fCB1cGRhdGVNaXNzaW5nKSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLmxvZyh1cGRhdGVNaXNzaW5nID8gJ3VwZGF0ZUtleScgOiAnbWlzc2luZ0tleScsIGxuZywgbmFtZXNwYWNlLCBrZXksIHVwZGF0ZU1pc3NpbmcgPyBkZWZhdWx0VmFsdWUgOiByZXMpO1xuICAgICAgICBpZiAoa2V5U2VwYXJhdG9yKSB7XG4gICAgICAgICAgY29uc3QgZmsgPSB0aGlzLnJlc29sdmUoa2V5LCB7XG4gICAgICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICAgICAga2V5U2VwYXJhdG9yOiBmYWxzZVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGlmIChmayAmJiBmay5yZXMpIHRoaXMubG9nZ2VyLndhcm4oJ1NlZW1zIHRoZSBsb2FkZWQgdHJhbnNsYXRpb25zIHdlcmUgaW4gZmxhdCBKU09OIGZvcm1hdCBpbnN0ZWFkIG9mIG5lc3RlZC4gRWl0aGVyIHNldCBrZXlTZXBhcmF0b3I6IGZhbHNlIG9uIGluaXQgb3IgbWFrZSBzdXJlIHlvdXIgdHJhbnNsYXRpb25zIGFyZSBwdWJsaXNoZWQgaW4gbmVzdGVkIGZvcm1hdC4nKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgbG5ncyA9IFtdO1xuICAgICAgICBjb25zdCBmYWxsYmFja0xuZ3MgPSB0aGlzLmxhbmd1YWdlVXRpbHMuZ2V0RmFsbGJhY2tDb2Rlcyh0aGlzLm9wdGlvbnMuZmFsbGJhY2tMbmcsIG9wdGlvbnMubG5nIHx8IHRoaXMubGFuZ3VhZ2UpO1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNhdmVNaXNzaW5nVG8gPT09ICdmYWxsYmFjaycgJiYgZmFsbGJhY2tMbmdzICYmIGZhbGxiYWNrTG5nc1swXSkge1xuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmFsbGJhY2tMbmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBsbmdzLnB1c2goZmFsbGJhY2tMbmdzW2ldKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLnNhdmVNaXNzaW5nVG8gPT09ICdhbGwnKSB7XG4gICAgICAgICAgbG5ncyA9IHRoaXMubGFuZ3VhZ2VVdGlscy50b1Jlc29sdmVIaWVyYXJjaHkob3B0aW9ucy5sbmcgfHwgdGhpcy5sYW5ndWFnZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbG5ncy5wdXNoKG9wdGlvbnMubG5nIHx8IHRoaXMubGFuZ3VhZ2UpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHNlbmQgPSAobCwgaywgc3BlY2lmaWNEZWZhdWx0VmFsdWUpID0+IHtcbiAgICAgICAgICBjb25zdCBkZWZhdWx0Rm9yTWlzc2luZyA9IGhhc0RlZmF1bHRWYWx1ZSAmJiBzcGVjaWZpY0RlZmF1bHRWYWx1ZSAhPT0gcmVzID8gc3BlY2lmaWNEZWZhdWx0VmFsdWUgOiByZXNGb3JNaXNzaW5nO1xuICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMubWlzc2luZ0tleUhhbmRsZXIpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5taXNzaW5nS2V5SGFuZGxlcihsLCBuYW1lc3BhY2UsIGssIGRlZmF1bHRGb3JNaXNzaW5nLCB1cGRhdGVNaXNzaW5nLCBvcHRpb25zKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuYmFja2VuZENvbm5lY3RvciAmJiB0aGlzLmJhY2tlbmRDb25uZWN0b3Iuc2F2ZU1pc3NpbmcpIHtcbiAgICAgICAgICAgIHRoaXMuYmFja2VuZENvbm5lY3Rvci5zYXZlTWlzc2luZyhsLCBuYW1lc3BhY2UsIGssIGRlZmF1bHRGb3JNaXNzaW5nLCB1cGRhdGVNaXNzaW5nLCBvcHRpb25zKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5lbWl0KCdtaXNzaW5nS2V5JywgbCwgbmFtZXNwYWNlLCBrLCByZXMpO1xuICAgICAgICB9O1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNhdmVNaXNzaW5nKSB7XG4gICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zYXZlTWlzc2luZ1BsdXJhbHMgJiYgbmVlZHNQbHVyYWxIYW5kbGluZykge1xuICAgICAgICAgICAgbG5ncy5mb3JFYWNoKGxhbmd1YWdlID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5wbHVyYWxSZXNvbHZlci5nZXRTdWZmaXhlcyhsYW5ndWFnZSwgb3B0aW9ucykuZm9yRWFjaChzdWZmaXggPT4ge1xuICAgICAgICAgICAgICAgIHNlbmQoW2xhbmd1YWdlXSwga2V5ICsgc3VmZml4LCBvcHRpb25zW2BkZWZhdWx0VmFsdWUke3N1ZmZpeH1gXSB8fCBkZWZhdWx0VmFsdWUpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZW5kKGxuZ3MsIGtleSwgZGVmYXVsdFZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJlcyA9IHRoaXMuZXh0ZW5kVHJhbnNsYXRpb24ocmVzLCBrZXlzLCBvcHRpb25zLCByZXNvbHZlZCwgbGFzdEtleSk7XG4gICAgICBpZiAodXNlZEtleSAmJiByZXMgPT09IGtleSAmJiB0aGlzLm9wdGlvbnMuYXBwZW5kTmFtZXNwYWNlVG9NaXNzaW5nS2V5KSByZXMgPSBgJHtuYW1lc3BhY2V9OiR7a2V5fWA7XG4gICAgICBpZiAoKHVzZWRLZXkgfHwgdXNlZERlZmF1bHQpICYmIHRoaXMub3B0aW9ucy5wYXJzZU1pc3NpbmdLZXlIYW5kbGVyKSB7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuY29tcGF0aWJpbGl0eUFQSSAhPT0gJ3YxJykge1xuICAgICAgICAgIHJlcyA9IHRoaXMub3B0aW9ucy5wYXJzZU1pc3NpbmdLZXlIYW5kbGVyKHRoaXMub3B0aW9ucy5hcHBlbmROYW1lc3BhY2VUb01pc3NpbmdLZXkgPyBgJHtuYW1lc3BhY2V9OiR7a2V5fWAgOiBrZXksIHVzZWREZWZhdWx0ID8gcmVzIDogdW5kZWZpbmVkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXMgPSB0aGlzLm9wdGlvbnMucGFyc2VNaXNzaW5nS2V5SGFuZGxlcihyZXMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChyZXR1cm5EZXRhaWxzKSB7XG4gICAgICByZXNvbHZlZC5yZXMgPSByZXM7XG4gICAgICByZXR1cm4gcmVzb2x2ZWQ7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG4gIH1cbiAgZXh0ZW5kVHJhbnNsYXRpb24ocmVzLCBrZXksIG9wdGlvbnMsIHJlc29sdmVkLCBsYXN0S2V5KSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICBpZiAodGhpcy5pMThuRm9ybWF0ICYmIHRoaXMuaTE4bkZvcm1hdC5wYXJzZSkge1xuICAgICAgcmVzID0gdGhpcy5pMThuRm9ybWF0LnBhcnNlKHJlcywge1xuICAgICAgICAuLi50aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbi5kZWZhdWx0VmFyaWFibGVzLFxuICAgICAgICAuLi5vcHRpb25zXG4gICAgICB9LCBvcHRpb25zLmxuZyB8fCB0aGlzLmxhbmd1YWdlIHx8IHJlc29sdmVkLnVzZWRMbmcsIHJlc29sdmVkLnVzZWROUywgcmVzb2x2ZWQudXNlZEtleSwge1xuICAgICAgICByZXNvbHZlZFxuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmICghb3B0aW9ucy5za2lwSW50ZXJwb2xhdGlvbikge1xuICAgICAgaWYgKG9wdGlvbnMuaW50ZXJwb2xhdGlvbikgdGhpcy5pbnRlcnBvbGF0b3IuaW5pdCh7XG4gICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgIC4uLntcbiAgICAgICAgICBpbnRlcnBvbGF0aW9uOiB7XG4gICAgICAgICAgICAuLi50aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbixcbiAgICAgICAgICAgIC4uLm9wdGlvbnMuaW50ZXJwb2xhdGlvblxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBjb25zdCBza2lwT25WYXJpYWJsZXMgPSB0eXBlb2YgcmVzID09PSAnc3RyaW5nJyAmJiAob3B0aW9ucyAmJiBvcHRpb25zLmludGVycG9sYXRpb24gJiYgb3B0aW9ucy5pbnRlcnBvbGF0aW9uLnNraXBPblZhcmlhYmxlcyAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy5pbnRlcnBvbGF0aW9uLnNraXBPblZhcmlhYmxlcyA6IHRoaXMub3B0aW9ucy5pbnRlcnBvbGF0aW9uLnNraXBPblZhcmlhYmxlcyk7XG4gICAgICBsZXQgbmVzdEJlZjtcbiAgICAgIGlmIChza2lwT25WYXJpYWJsZXMpIHtcbiAgICAgICAgY29uc3QgbmIgPSByZXMubWF0Y2godGhpcy5pbnRlcnBvbGF0b3IubmVzdGluZ1JlZ2V4cCk7XG4gICAgICAgIG5lc3RCZWYgPSBuYiAmJiBuYi5sZW5ndGg7XG4gICAgICB9XG4gICAgICBsZXQgZGF0YSA9IG9wdGlvbnMucmVwbGFjZSAmJiB0eXBlb2Ygb3B0aW9ucy5yZXBsYWNlICE9PSAnc3RyaW5nJyA/IG9wdGlvbnMucmVwbGFjZSA6IG9wdGlvbnM7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmludGVycG9sYXRpb24uZGVmYXVsdFZhcmlhYmxlcykgZGF0YSA9IHtcbiAgICAgICAgLi4udGhpcy5vcHRpb25zLmludGVycG9sYXRpb24uZGVmYXVsdFZhcmlhYmxlcyxcbiAgICAgICAgLi4uZGF0YVxuICAgICAgfTtcbiAgICAgIHJlcyA9IHRoaXMuaW50ZXJwb2xhdG9yLmludGVycG9sYXRlKHJlcywgZGF0YSwgb3B0aW9ucy5sbmcgfHwgdGhpcy5sYW5ndWFnZSwgb3B0aW9ucyk7XG4gICAgICBpZiAoc2tpcE9uVmFyaWFibGVzKSB7XG4gICAgICAgIGNvbnN0IG5hID0gcmVzLm1hdGNoKHRoaXMuaW50ZXJwb2xhdG9yLm5lc3RpbmdSZWdleHApO1xuICAgICAgICBjb25zdCBuZXN0QWZ0ID0gbmEgJiYgbmEubGVuZ3RoO1xuICAgICAgICBpZiAobmVzdEJlZiA8IG5lc3RBZnQpIG9wdGlvbnMubmVzdCA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKCFvcHRpb25zLmxuZyAmJiB0aGlzLm9wdGlvbnMuY29tcGF0aWJpbGl0eUFQSSAhPT0gJ3YxJyAmJiByZXNvbHZlZCAmJiByZXNvbHZlZC5yZXMpIG9wdGlvbnMubG5nID0gcmVzb2x2ZWQudXNlZExuZztcbiAgICAgIGlmIChvcHRpb25zLm5lc3QgIT09IGZhbHNlKSByZXMgPSB0aGlzLmludGVycG9sYXRvci5uZXN0KHJlcywgZnVuY3Rpb24gKCkge1xuICAgICAgICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IG5ldyBBcnJheShfbGVuKSwgX2tleSA9IDA7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcbiAgICAgICAgICBhcmdzW19rZXldID0gYXJndW1lbnRzW19rZXldO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsYXN0S2V5ICYmIGxhc3RLZXlbMF0gPT09IGFyZ3NbMF0gJiYgIW9wdGlvbnMuY29udGV4dCkge1xuICAgICAgICAgIF90aGlzLmxvZ2dlci53YXJuKGBJdCBzZWVtcyB5b3UgYXJlIG5lc3RpbmcgcmVjdXJzaXZlbHkga2V5OiAke2FyZ3NbMF19IGluIGtleTogJHtrZXlbMF19YCk7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF90aGlzLnRyYW5zbGF0ZSguLi5hcmdzLCBrZXkpO1xuICAgICAgfSwgb3B0aW9ucyk7XG4gICAgICBpZiAob3B0aW9ucy5pbnRlcnBvbGF0aW9uKSB0aGlzLmludGVycG9sYXRvci5yZXNldCgpO1xuICAgIH1cbiAgICBjb25zdCBwb3N0UHJvY2VzcyA9IG9wdGlvbnMucG9zdFByb2Nlc3MgfHwgdGhpcy5vcHRpb25zLnBvc3RQcm9jZXNzO1xuICAgIGNvbnN0IHBvc3RQcm9jZXNzb3JOYW1lcyA9IHR5cGVvZiBwb3N0UHJvY2VzcyA9PT0gJ3N0cmluZycgPyBbcG9zdFByb2Nlc3NdIDogcG9zdFByb2Nlc3M7XG4gICAgaWYgKHJlcyAhPT0gdW5kZWZpbmVkICYmIHJlcyAhPT0gbnVsbCAmJiBwb3N0UHJvY2Vzc29yTmFtZXMgJiYgcG9zdFByb2Nlc3Nvck5hbWVzLmxlbmd0aCAmJiBvcHRpb25zLmFwcGx5UG9zdFByb2Nlc3NvciAhPT0gZmFsc2UpIHtcbiAgICAgIHJlcyA9IHBvc3RQcm9jZXNzb3IuaGFuZGxlKHBvc3RQcm9jZXNzb3JOYW1lcywgcmVzLCBrZXksIHRoaXMub3B0aW9ucyAmJiB0aGlzLm9wdGlvbnMucG9zdFByb2Nlc3NQYXNzUmVzb2x2ZWQgPyB7XG4gICAgICAgIGkxOG5SZXNvbHZlZDogcmVzb2x2ZWQsXG4gICAgICAgIC4uLm9wdGlvbnNcbiAgICAgIH0gOiBvcHRpb25zLCB0aGlzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbiAgfVxuICByZXNvbHZlKGtleXMpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge307XG4gICAgbGV0IGZvdW5kO1xuICAgIGxldCB1c2VkS2V5O1xuICAgIGxldCBleGFjdFVzZWRLZXk7XG4gICAgbGV0IHVzZWRMbmc7XG4gICAgbGV0IHVzZWROUztcbiAgICBpZiAodHlwZW9mIGtleXMgPT09ICdzdHJpbmcnKSBrZXlzID0gW2tleXNdO1xuICAgIGtleXMuZm9yRWFjaChrID0+IHtcbiAgICAgIGlmICh0aGlzLmlzVmFsaWRMb29rdXAoZm91bmQpKSByZXR1cm47XG4gICAgICBjb25zdCBleHRyYWN0ZWQgPSB0aGlzLmV4dHJhY3RGcm9tS2V5KGssIG9wdGlvbnMpO1xuICAgICAgY29uc3Qga2V5ID0gZXh0cmFjdGVkLmtleTtcbiAgICAgIHVzZWRLZXkgPSBrZXk7XG4gICAgICBsZXQgbmFtZXNwYWNlcyA9IGV4dHJhY3RlZC5uYW1lc3BhY2VzO1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5mYWxsYmFja05TKSBuYW1lc3BhY2VzID0gbmFtZXNwYWNlcy5jb25jYXQodGhpcy5vcHRpb25zLmZhbGxiYWNrTlMpO1xuICAgICAgY29uc3QgbmVlZHNQbHVyYWxIYW5kbGluZyA9IG9wdGlvbnMuY291bnQgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2Ygb3B0aW9ucy5jb3VudCAhPT0gJ3N0cmluZyc7XG4gICAgICBjb25zdCBuZWVkc1plcm9TdWZmaXhMb29rdXAgPSBuZWVkc1BsdXJhbEhhbmRsaW5nICYmICFvcHRpb25zLm9yZGluYWwgJiYgb3B0aW9ucy5jb3VudCA9PT0gMCAmJiB0aGlzLnBsdXJhbFJlc29sdmVyLnNob3VsZFVzZUludGxBcGkoKTtcbiAgICAgIGNvbnN0IG5lZWRzQ29udGV4dEhhbmRsaW5nID0gb3B0aW9ucy5jb250ZXh0ICE9PSB1bmRlZmluZWQgJiYgKHR5cGVvZiBvcHRpb25zLmNvbnRleHQgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiBvcHRpb25zLmNvbnRleHQgPT09ICdudW1iZXInKSAmJiBvcHRpb25zLmNvbnRleHQgIT09ICcnO1xuICAgICAgY29uc3QgY29kZXMgPSBvcHRpb25zLmxuZ3MgPyBvcHRpb25zLmxuZ3MgOiB0aGlzLmxhbmd1YWdlVXRpbHMudG9SZXNvbHZlSGllcmFyY2h5KG9wdGlvbnMubG5nIHx8IHRoaXMubGFuZ3VhZ2UsIG9wdGlvbnMuZmFsbGJhY2tMbmcpO1xuICAgICAgbmFtZXNwYWNlcy5mb3JFYWNoKG5zID0+IHtcbiAgICAgICAgaWYgKHRoaXMuaXNWYWxpZExvb2t1cChmb3VuZCkpIHJldHVybjtcbiAgICAgICAgdXNlZE5TID0gbnM7XG4gICAgICAgIGlmICghY2hlY2tlZExvYWRlZEZvcltgJHtjb2Rlc1swXX0tJHtuc31gXSAmJiB0aGlzLnV0aWxzICYmIHRoaXMudXRpbHMuaGFzTG9hZGVkTmFtZXNwYWNlICYmICF0aGlzLnV0aWxzLmhhc0xvYWRlZE5hbWVzcGFjZSh1c2VkTlMpKSB7XG4gICAgICAgICAgY2hlY2tlZExvYWRlZEZvcltgJHtjb2Rlc1swXX0tJHtuc31gXSA9IHRydWU7XG4gICAgICAgICAgdGhpcy5sb2dnZXIud2Fybihga2V5IFwiJHt1c2VkS2V5fVwiIGZvciBsYW5ndWFnZXMgXCIke2NvZGVzLmpvaW4oJywgJyl9XCIgd29uJ3QgZ2V0IHJlc29sdmVkIGFzIG5hbWVzcGFjZSBcIiR7dXNlZE5TfVwiIHdhcyBub3QgeWV0IGxvYWRlZGAsICdUaGlzIG1lYW5zIHNvbWV0aGluZyBJUyBXUk9ORyBpbiB5b3VyIHNldHVwLiBZb3UgYWNjZXNzIHRoZSB0IGZ1bmN0aW9uIGJlZm9yZSBpMThuZXh0LmluaXQgLyBpMThuZXh0LmxvYWROYW1lc3BhY2UgLyBpMThuZXh0LmNoYW5nZUxhbmd1YWdlIHdhcyBkb25lLiBXYWl0IGZvciB0aGUgY2FsbGJhY2sgb3IgUHJvbWlzZSB0byByZXNvbHZlIGJlZm9yZSBhY2Nlc3NpbmcgaXQhISEnKTtcbiAgICAgICAgfVxuICAgICAgICBjb2Rlcy5mb3JFYWNoKGNvZGUgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLmlzVmFsaWRMb29rdXAoZm91bmQpKSByZXR1cm47XG4gICAgICAgICAgdXNlZExuZyA9IGNvZGU7XG4gICAgICAgICAgY29uc3QgZmluYWxLZXlzID0gW2tleV07XG4gICAgICAgICAgaWYgKHRoaXMuaTE4bkZvcm1hdCAmJiB0aGlzLmkxOG5Gb3JtYXQuYWRkTG9va3VwS2V5cykge1xuICAgICAgICAgICAgdGhpcy5pMThuRm9ybWF0LmFkZExvb2t1cEtleXMoZmluYWxLZXlzLCBrZXksIGNvZGUsIG5zLCBvcHRpb25zKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGV0IHBsdXJhbFN1ZmZpeDtcbiAgICAgICAgICAgIGlmIChuZWVkc1BsdXJhbEhhbmRsaW5nKSBwbHVyYWxTdWZmaXggPSB0aGlzLnBsdXJhbFJlc29sdmVyLmdldFN1ZmZpeChjb2RlLCBvcHRpb25zLmNvdW50LCBvcHRpb25zKTtcbiAgICAgICAgICAgIGNvbnN0IHplcm9TdWZmaXggPSBgJHt0aGlzLm9wdGlvbnMucGx1cmFsU2VwYXJhdG9yfXplcm9gO1xuICAgICAgICAgICAgY29uc3Qgb3JkaW5hbFByZWZpeCA9IGAke3RoaXMub3B0aW9ucy5wbHVyYWxTZXBhcmF0b3J9b3JkaW5hbCR7dGhpcy5vcHRpb25zLnBsdXJhbFNlcGFyYXRvcn1gO1xuICAgICAgICAgICAgaWYgKG5lZWRzUGx1cmFsSGFuZGxpbmcpIHtcbiAgICAgICAgICAgICAgZmluYWxLZXlzLnB1c2goa2V5ICsgcGx1cmFsU3VmZml4KTtcbiAgICAgICAgICAgICAgaWYgKG9wdGlvbnMub3JkaW5hbCAmJiBwbHVyYWxTdWZmaXguaW5kZXhPZihvcmRpbmFsUHJlZml4KSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGZpbmFsS2V5cy5wdXNoKGtleSArIHBsdXJhbFN1ZmZpeC5yZXBsYWNlKG9yZGluYWxQcmVmaXgsIHRoaXMub3B0aW9ucy5wbHVyYWxTZXBhcmF0b3IpKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAobmVlZHNaZXJvU3VmZml4TG9va3VwKSB7XG4gICAgICAgICAgICAgICAgZmluYWxLZXlzLnB1c2goa2V5ICsgemVyb1N1ZmZpeCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChuZWVkc0NvbnRleHRIYW5kbGluZykge1xuICAgICAgICAgICAgICBjb25zdCBjb250ZXh0S2V5ID0gYCR7a2V5fSR7dGhpcy5vcHRpb25zLmNvbnRleHRTZXBhcmF0b3J9JHtvcHRpb25zLmNvbnRleHR9YDtcbiAgICAgICAgICAgICAgZmluYWxLZXlzLnB1c2goY29udGV4dEtleSk7XG4gICAgICAgICAgICAgIGlmIChuZWVkc1BsdXJhbEhhbmRsaW5nKSB7XG4gICAgICAgICAgICAgICAgZmluYWxLZXlzLnB1c2goY29udGV4dEtleSArIHBsdXJhbFN1ZmZpeCk7XG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMub3JkaW5hbCAmJiBwbHVyYWxTdWZmaXguaW5kZXhPZihvcmRpbmFsUHJlZml4KSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgZmluYWxLZXlzLnB1c2goY29udGV4dEtleSArIHBsdXJhbFN1ZmZpeC5yZXBsYWNlKG9yZGluYWxQcmVmaXgsIHRoaXMub3B0aW9ucy5wbHVyYWxTZXBhcmF0b3IpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG5lZWRzWmVyb1N1ZmZpeExvb2t1cCkge1xuICAgICAgICAgICAgICAgICAgZmluYWxLZXlzLnB1c2goY29udGV4dEtleSArIHplcm9TdWZmaXgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBsZXQgcG9zc2libGVLZXk7XG4gICAgICAgICAgd2hpbGUgKHBvc3NpYmxlS2V5ID0gZmluYWxLZXlzLnBvcCgpKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNWYWxpZExvb2t1cChmb3VuZCkpIHtcbiAgICAgICAgICAgICAgZXhhY3RVc2VkS2V5ID0gcG9zc2libGVLZXk7XG4gICAgICAgICAgICAgIGZvdW5kID0gdGhpcy5nZXRSZXNvdXJjZShjb2RlLCBucywgcG9zc2libGVLZXksIG9wdGlvbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgcmVzOiBmb3VuZCxcbiAgICAgIHVzZWRLZXksXG4gICAgICBleGFjdFVzZWRLZXksXG4gICAgICB1c2VkTG5nLFxuICAgICAgdXNlZE5TXG4gICAgfTtcbiAgfVxuICBpc1ZhbGlkTG9va3VwKHJlcykge1xuICAgIHJldHVybiByZXMgIT09IHVuZGVmaW5lZCAmJiAhKCF0aGlzLm9wdGlvbnMucmV0dXJuTnVsbCAmJiByZXMgPT09IG51bGwpICYmICEoIXRoaXMub3B0aW9ucy5yZXR1cm5FbXB0eVN0cmluZyAmJiByZXMgPT09ICcnKTtcbiAgfVxuICBnZXRSZXNvdXJjZShjb2RlLCBucywga2V5KSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMyAmJiBhcmd1bWVudHNbM10gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1szXSA6IHt9O1xuICAgIGlmICh0aGlzLmkxOG5Gb3JtYXQgJiYgdGhpcy5pMThuRm9ybWF0LmdldFJlc291cmNlKSByZXR1cm4gdGhpcy5pMThuRm9ybWF0LmdldFJlc291cmNlKGNvZGUsIG5zLCBrZXksIG9wdGlvbnMpO1xuICAgIHJldHVybiB0aGlzLnJlc291cmNlU3RvcmUuZ2V0UmVzb3VyY2UoY29kZSwgbnMsIGtleSwgb3B0aW9ucyk7XG4gIH1cbiAgc3RhdGljIGhhc0RlZmF1bHRWYWx1ZShvcHRpb25zKSB7XG4gICAgY29uc3QgcHJlZml4ID0gJ2RlZmF1bHRWYWx1ZSc7XG4gICAgZm9yIChjb25zdCBvcHRpb24gaW4gb3B0aW9ucykge1xuICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvcHRpb25zLCBvcHRpb24pICYmIHByZWZpeCA9PT0gb3B0aW9uLnN1YnN0cmluZygwLCBwcmVmaXgubGVuZ3RoKSAmJiB1bmRlZmluZWQgIT09IG9wdGlvbnNbb3B0aW9uXSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNhcGl0YWxpemUoc3RyaW5nKSB7XG4gIHJldHVybiBzdHJpbmcuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHJpbmcuc2xpY2UoMSk7XG59XG5jbGFzcyBMYW5ndWFnZVV0aWwge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLnN1cHBvcnRlZExuZ3MgPSB0aGlzLm9wdGlvbnMuc3VwcG9ydGVkTG5ncyB8fCBmYWxzZTtcbiAgICB0aGlzLmxvZ2dlciA9IGJhc2VMb2dnZXIuY3JlYXRlKCdsYW5ndWFnZVV0aWxzJyk7XG4gIH1cbiAgZ2V0U2NyaXB0UGFydEZyb21Db2RlKGNvZGUpIHtcbiAgICBjb2RlID0gZ2V0Q2xlYW5lZENvZGUoY29kZSk7XG4gICAgaWYgKCFjb2RlIHx8IGNvZGUuaW5kZXhPZignLScpIDwgMCkgcmV0dXJuIG51bGw7XG4gICAgY29uc3QgcCA9IGNvZGUuc3BsaXQoJy0nKTtcbiAgICBpZiAocC5sZW5ndGggPT09IDIpIHJldHVybiBudWxsO1xuICAgIHAucG9wKCk7XG4gICAgaWYgKHBbcC5sZW5ndGggLSAxXS50b0xvd2VyQ2FzZSgpID09PSAneCcpIHJldHVybiBudWxsO1xuICAgIHJldHVybiB0aGlzLmZvcm1hdExhbmd1YWdlQ29kZShwLmpvaW4oJy0nKSk7XG4gIH1cbiAgZ2V0TGFuZ3VhZ2VQYXJ0RnJvbUNvZGUoY29kZSkge1xuICAgIGNvZGUgPSBnZXRDbGVhbmVkQ29kZShjb2RlKTtcbiAgICBpZiAoIWNvZGUgfHwgY29kZS5pbmRleE9mKCctJykgPCAwKSByZXR1cm4gY29kZTtcbiAgICBjb25zdCBwID0gY29kZS5zcGxpdCgnLScpO1xuICAgIHJldHVybiB0aGlzLmZvcm1hdExhbmd1YWdlQ29kZShwWzBdKTtcbiAgfVxuICBmb3JtYXRMYW5ndWFnZUNvZGUoY29kZSkge1xuICAgIGlmICh0eXBlb2YgY29kZSA9PT0gJ3N0cmluZycgJiYgY29kZS5pbmRleE9mKCctJykgPiAtMSkge1xuICAgICAgY29uc3Qgc3BlY2lhbENhc2VzID0gWydoYW5zJywgJ2hhbnQnLCAnbGF0bicsICdjeXJsJywgJ2NhbnMnLCAnbW9uZycsICdhcmFiJ107XG4gICAgICBsZXQgcCA9IGNvZGUuc3BsaXQoJy0nKTtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMubG93ZXJDYXNlTG5nKSB7XG4gICAgICAgIHAgPSBwLm1hcChwYXJ0ID0+IHBhcnQudG9Mb3dlckNhc2UoKSk7XG4gICAgICB9IGVsc2UgaWYgKHAubGVuZ3RoID09PSAyKSB7XG4gICAgICAgIHBbMF0gPSBwWzBdLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIHBbMV0gPSBwWzFdLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgIGlmIChzcGVjaWFsQ2FzZXMuaW5kZXhPZihwWzFdLnRvTG93ZXJDYXNlKCkpID4gLTEpIHBbMV0gPSBjYXBpdGFsaXplKHBbMV0udG9Mb3dlckNhc2UoKSk7XG4gICAgICB9IGVsc2UgaWYgKHAubGVuZ3RoID09PSAzKSB7XG4gICAgICAgIHBbMF0gPSBwWzBdLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGlmIChwWzFdLmxlbmd0aCA9PT0gMikgcFsxXSA9IHBbMV0udG9VcHBlckNhc2UoKTtcbiAgICAgICAgaWYgKHBbMF0gIT09ICdzZ24nICYmIHBbMl0ubGVuZ3RoID09PSAyKSBwWzJdID0gcFsyXS50b1VwcGVyQ2FzZSgpO1xuICAgICAgICBpZiAoc3BlY2lhbENhc2VzLmluZGV4T2YocFsxXS50b0xvd2VyQ2FzZSgpKSA+IC0xKSBwWzFdID0gY2FwaXRhbGl6ZShwWzFdLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgICBpZiAoc3BlY2lhbENhc2VzLmluZGV4T2YocFsyXS50b0xvd2VyQ2FzZSgpKSA+IC0xKSBwWzJdID0gY2FwaXRhbGl6ZShwWzJdLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHAuam9pbignLScpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLmNsZWFuQ29kZSB8fCB0aGlzLm9wdGlvbnMubG93ZXJDYXNlTG5nID8gY29kZS50b0xvd2VyQ2FzZSgpIDogY29kZTtcbiAgfVxuICBpc1N1cHBvcnRlZENvZGUoY29kZSkge1xuICAgIGlmICh0aGlzLm9wdGlvbnMubG9hZCA9PT0gJ2xhbmd1YWdlT25seScgfHwgdGhpcy5vcHRpb25zLm5vbkV4cGxpY2l0U3VwcG9ydGVkTG5ncykge1xuICAgICAgY29kZSA9IHRoaXMuZ2V0TGFuZ3VhZ2VQYXJ0RnJvbUNvZGUoY29kZSk7XG4gICAgfVxuICAgIHJldHVybiAhdGhpcy5zdXBwb3J0ZWRMbmdzIHx8ICF0aGlzLnN1cHBvcnRlZExuZ3MubGVuZ3RoIHx8IHRoaXMuc3VwcG9ydGVkTG5ncy5pbmRleE9mKGNvZGUpID4gLTE7XG4gIH1cbiAgZ2V0QmVzdE1hdGNoRnJvbUNvZGVzKGNvZGVzKSB7XG4gICAgaWYgKCFjb2RlcykgcmV0dXJuIG51bGw7XG4gICAgbGV0IGZvdW5kO1xuICAgIGNvZGVzLmZvckVhY2goY29kZSA9PiB7XG4gICAgICBpZiAoZm91bmQpIHJldHVybjtcbiAgICAgIGNvbnN0IGNsZWFuZWRMbmcgPSB0aGlzLmZvcm1hdExhbmd1YWdlQ29kZShjb2RlKTtcbiAgICAgIGlmICghdGhpcy5vcHRpb25zLnN1cHBvcnRlZExuZ3MgfHwgdGhpcy5pc1N1cHBvcnRlZENvZGUoY2xlYW5lZExuZykpIGZvdW5kID0gY2xlYW5lZExuZztcbiAgICB9KTtcbiAgICBpZiAoIWZvdW5kICYmIHRoaXMub3B0aW9ucy5zdXBwb3J0ZWRMbmdzKSB7XG4gICAgICBjb2Rlcy5mb3JFYWNoKGNvZGUgPT4ge1xuICAgICAgICBpZiAoZm91bmQpIHJldHVybjtcbiAgICAgICAgY29uc3QgbG5nT25seSA9IHRoaXMuZ2V0TGFuZ3VhZ2VQYXJ0RnJvbUNvZGUoY29kZSk7XG4gICAgICAgIGlmICh0aGlzLmlzU3VwcG9ydGVkQ29kZShsbmdPbmx5KSkgcmV0dXJuIGZvdW5kID0gbG5nT25seTtcbiAgICAgICAgZm91bmQgPSB0aGlzLm9wdGlvbnMuc3VwcG9ydGVkTG5ncy5maW5kKHN1cHBvcnRlZExuZyA9PiB7XG4gICAgICAgICAgaWYgKHN1cHBvcnRlZExuZyA9PT0gbG5nT25seSkgcmV0dXJuIHN1cHBvcnRlZExuZztcbiAgICAgICAgICBpZiAoc3VwcG9ydGVkTG5nLmluZGV4T2YoJy0nKSA8IDAgJiYgbG5nT25seS5pbmRleE9mKCctJykgPCAwKSByZXR1cm47XG4gICAgICAgICAgaWYgKHN1cHBvcnRlZExuZy5pbmRleE9mKGxuZ09ubHkpID09PSAwKSByZXR1cm4gc3VwcG9ydGVkTG5nO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAoIWZvdW5kKSBmb3VuZCA9IHRoaXMuZ2V0RmFsbGJhY2tDb2Rlcyh0aGlzLm9wdGlvbnMuZmFsbGJhY2tMbmcpWzBdO1xuICAgIHJldHVybiBmb3VuZDtcbiAgfVxuICBnZXRGYWxsYmFja0NvZGVzKGZhbGxiYWNrcywgY29kZSkge1xuICAgIGlmICghZmFsbGJhY2tzKSByZXR1cm4gW107XG4gICAgaWYgKHR5cGVvZiBmYWxsYmFja3MgPT09ICdmdW5jdGlvbicpIGZhbGxiYWNrcyA9IGZhbGxiYWNrcyhjb2RlKTtcbiAgICBpZiAodHlwZW9mIGZhbGxiYWNrcyA9PT0gJ3N0cmluZycpIGZhbGxiYWNrcyA9IFtmYWxsYmFja3NdO1xuICAgIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmFwcGx5KGZhbGxiYWNrcykgPT09ICdbb2JqZWN0IEFycmF5XScpIHJldHVybiBmYWxsYmFja3M7XG4gICAgaWYgKCFjb2RlKSByZXR1cm4gZmFsbGJhY2tzLmRlZmF1bHQgfHwgW107XG4gICAgbGV0IGZvdW5kID0gZmFsbGJhY2tzW2NvZGVdO1xuICAgIGlmICghZm91bmQpIGZvdW5kID0gZmFsbGJhY2tzW3RoaXMuZ2V0U2NyaXB0UGFydEZyb21Db2RlKGNvZGUpXTtcbiAgICBpZiAoIWZvdW5kKSBmb3VuZCA9IGZhbGxiYWNrc1t0aGlzLmZvcm1hdExhbmd1YWdlQ29kZShjb2RlKV07XG4gICAgaWYgKCFmb3VuZCkgZm91bmQgPSBmYWxsYmFja3NbdGhpcy5nZXRMYW5ndWFnZVBhcnRGcm9tQ29kZShjb2RlKV07XG4gICAgaWYgKCFmb3VuZCkgZm91bmQgPSBmYWxsYmFja3MuZGVmYXVsdDtcbiAgICByZXR1cm4gZm91bmQgfHwgW107XG4gIH1cbiAgdG9SZXNvbHZlSGllcmFyY2h5KGNvZGUsIGZhbGxiYWNrQ29kZSkge1xuICAgIGNvbnN0IGZhbGxiYWNrQ29kZXMgPSB0aGlzLmdldEZhbGxiYWNrQ29kZXMoZmFsbGJhY2tDb2RlIHx8IHRoaXMub3B0aW9ucy5mYWxsYmFja0xuZyB8fCBbXSwgY29kZSk7XG4gICAgY29uc3QgY29kZXMgPSBbXTtcbiAgICBjb25zdCBhZGRDb2RlID0gYyA9PiB7XG4gICAgICBpZiAoIWMpIHJldHVybjtcbiAgICAgIGlmICh0aGlzLmlzU3VwcG9ydGVkQ29kZShjKSkge1xuICAgICAgICBjb2Rlcy5wdXNoKGMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5sb2dnZXIud2FybihgcmVqZWN0aW5nIGxhbmd1YWdlIGNvZGUgbm90IGZvdW5kIGluIHN1cHBvcnRlZExuZ3M6ICR7Y31gKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIGlmICh0eXBlb2YgY29kZSA9PT0gJ3N0cmluZycgJiYgKGNvZGUuaW5kZXhPZignLScpID4gLTEgfHwgY29kZS5pbmRleE9mKCdfJykgPiAtMSkpIHtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMubG9hZCAhPT0gJ2xhbmd1YWdlT25seScpIGFkZENvZGUodGhpcy5mb3JtYXRMYW5ndWFnZUNvZGUoY29kZSkpO1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5sb2FkICE9PSAnbGFuZ3VhZ2VPbmx5JyAmJiB0aGlzLm9wdGlvbnMubG9hZCAhPT0gJ2N1cnJlbnRPbmx5JykgYWRkQ29kZSh0aGlzLmdldFNjcmlwdFBhcnRGcm9tQ29kZShjb2RlKSk7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmxvYWQgIT09ICdjdXJyZW50T25seScpIGFkZENvZGUodGhpcy5nZXRMYW5ndWFnZVBhcnRGcm9tQ29kZShjb2RlKSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgY29kZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGFkZENvZGUodGhpcy5mb3JtYXRMYW5ndWFnZUNvZGUoY29kZSkpO1xuICAgIH1cbiAgICBmYWxsYmFja0NvZGVzLmZvckVhY2goZmMgPT4ge1xuICAgICAgaWYgKGNvZGVzLmluZGV4T2YoZmMpIDwgMCkgYWRkQ29kZSh0aGlzLmZvcm1hdExhbmd1YWdlQ29kZShmYykpO1xuICAgIH0pO1xuICAgIHJldHVybiBjb2RlcztcbiAgfVxufVxuXG5sZXQgc2V0cyA9IFt7XG4gIGxuZ3M6IFsnYWNoJywgJ2FrJywgJ2FtJywgJ2FybicsICdicicsICdmaWwnLCAnZ3VuJywgJ2xuJywgJ21mZScsICdtZycsICdtaScsICdvYycsICdwdCcsICdwdC1CUicsICd0ZycsICd0bCcsICd0aScsICd0cicsICd1eicsICd3YSddLFxuICBucjogWzEsIDJdLFxuICBmYzogMVxufSwge1xuICBsbmdzOiBbJ2FmJywgJ2FuJywgJ2FzdCcsICdheicsICdiZycsICdibicsICdjYScsICdkYScsICdkZScsICdkZXYnLCAnZWwnLCAnZW4nLCAnZW8nLCAnZXMnLCAnZXQnLCAnZXUnLCAnZmknLCAnZm8nLCAnZnVyJywgJ2Z5JywgJ2dsJywgJ2d1JywgJ2hhJywgJ2hpJywgJ2h1JywgJ2h5JywgJ2lhJywgJ2l0JywgJ2trJywgJ2tuJywgJ2t1JywgJ2xiJywgJ21haScsICdtbCcsICdtbicsICdtcicsICduYWgnLCAnbmFwJywgJ25iJywgJ25lJywgJ25sJywgJ25uJywgJ25vJywgJ25zbycsICdwYScsICdwYXAnLCAncG1zJywgJ3BzJywgJ3B0LVBUJywgJ3JtJywgJ3NjbycsICdzZScsICdzaScsICdzbycsICdzb24nLCAnc3EnLCAnc3YnLCAnc3cnLCAndGEnLCAndGUnLCAndGsnLCAndXInLCAneW8nXSxcbiAgbnI6IFsxLCAyXSxcbiAgZmM6IDJcbn0sIHtcbiAgbG5nczogWydheScsICdibycsICdjZ2cnLCAnZmEnLCAnaHQnLCAnaWQnLCAnamEnLCAnamJvJywgJ2thJywgJ2ttJywgJ2tvJywgJ2t5JywgJ2xvJywgJ21zJywgJ3NhaCcsICdzdScsICd0aCcsICd0dCcsICd1ZycsICd2aScsICd3bycsICd6aCddLFxuICBucjogWzFdLFxuICBmYzogM1xufSwge1xuICBsbmdzOiBbJ2JlJywgJ2JzJywgJ2NucicsICdkeicsICdocicsICdydScsICdzcicsICd1ayddLFxuICBucjogWzEsIDIsIDVdLFxuICBmYzogNFxufSwge1xuICBsbmdzOiBbJ2FyJ10sXG4gIG5yOiBbMCwgMSwgMiwgMywgMTEsIDEwMF0sXG4gIGZjOiA1XG59LCB7XG4gIGxuZ3M6IFsnY3MnLCAnc2snXSxcbiAgbnI6IFsxLCAyLCA1XSxcbiAgZmM6IDZcbn0sIHtcbiAgbG5nczogWydjc2InLCAncGwnXSxcbiAgbnI6IFsxLCAyLCA1XSxcbiAgZmM6IDdcbn0sIHtcbiAgbG5nczogWydjeSddLFxuICBucjogWzEsIDIsIDMsIDhdLFxuICBmYzogOFxufSwge1xuICBsbmdzOiBbJ2ZyJ10sXG4gIG5yOiBbMSwgMl0sXG4gIGZjOiA5XG59LCB7XG4gIGxuZ3M6IFsnZ2EnXSxcbiAgbnI6IFsxLCAyLCAzLCA3LCAxMV0sXG4gIGZjOiAxMFxufSwge1xuICBsbmdzOiBbJ2dkJ10sXG4gIG5yOiBbMSwgMiwgMywgMjBdLFxuICBmYzogMTFcbn0sIHtcbiAgbG5nczogWydpcyddLFxuICBucjogWzEsIDJdLFxuICBmYzogMTJcbn0sIHtcbiAgbG5nczogWydqdiddLFxuICBucjogWzAsIDFdLFxuICBmYzogMTNcbn0sIHtcbiAgbG5nczogWydrdyddLFxuICBucjogWzEsIDIsIDMsIDRdLFxuICBmYzogMTRcbn0sIHtcbiAgbG5nczogWydsdCddLFxuICBucjogWzEsIDIsIDEwXSxcbiAgZmM6IDE1XG59LCB7XG4gIGxuZ3M6IFsnbHYnXSxcbiAgbnI6IFsxLCAyLCAwXSxcbiAgZmM6IDE2XG59LCB7XG4gIGxuZ3M6IFsnbWsnXSxcbiAgbnI6IFsxLCAyXSxcbiAgZmM6IDE3XG59LCB7XG4gIGxuZ3M6IFsnbW5rJ10sXG4gIG5yOiBbMCwgMSwgMl0sXG4gIGZjOiAxOFxufSwge1xuICBsbmdzOiBbJ210J10sXG4gIG5yOiBbMSwgMiwgMTEsIDIwXSxcbiAgZmM6IDE5XG59LCB7XG4gIGxuZ3M6IFsnb3InXSxcbiAgbnI6IFsyLCAxXSxcbiAgZmM6IDJcbn0sIHtcbiAgbG5nczogWydybyddLFxuICBucjogWzEsIDIsIDIwXSxcbiAgZmM6IDIwXG59LCB7XG4gIGxuZ3M6IFsnc2wnXSxcbiAgbnI6IFs1LCAxLCAyLCAzXSxcbiAgZmM6IDIxXG59LCB7XG4gIGxuZ3M6IFsnaGUnLCAnaXcnXSxcbiAgbnI6IFsxLCAyLCAyMCwgMjFdLFxuICBmYzogMjJcbn1dO1xubGV0IF9ydWxlc1BsdXJhbHNUeXBlcyA9IHtcbiAgMTogZnVuY3Rpb24gKG4pIHtcbiAgICByZXR1cm4gTnVtYmVyKG4gPiAxKTtcbiAgfSxcbiAgMjogZnVuY3Rpb24gKG4pIHtcbiAgICByZXR1cm4gTnVtYmVyKG4gIT0gMSk7XG4gIH0sXG4gIDM6IGZ1bmN0aW9uIChuKSB7XG4gICAgcmV0dXJuIDA7XG4gIH0sXG4gIDQ6IGZ1bmN0aW9uIChuKSB7XG4gICAgcmV0dXJuIE51bWJlcihuICUgMTAgPT0gMSAmJiBuICUgMTAwICE9IDExID8gMCA6IG4gJSAxMCA+PSAyICYmIG4gJSAxMCA8PSA0ICYmIChuICUgMTAwIDwgMTAgfHwgbiAlIDEwMCA+PSAyMCkgPyAxIDogMik7XG4gIH0sXG4gIDU6IGZ1bmN0aW9uIChuKSB7XG4gICAgcmV0dXJuIE51bWJlcihuID09IDAgPyAwIDogbiA9PSAxID8gMSA6IG4gPT0gMiA/IDIgOiBuICUgMTAwID49IDMgJiYgbiAlIDEwMCA8PSAxMCA/IDMgOiBuICUgMTAwID49IDExID8gNCA6IDUpO1xuICB9LFxuICA2OiBmdW5jdGlvbiAobikge1xuICAgIHJldHVybiBOdW1iZXIobiA9PSAxID8gMCA6IG4gPj0gMiAmJiBuIDw9IDQgPyAxIDogMik7XG4gIH0sXG4gIDc6IGZ1bmN0aW9uIChuKSB7XG4gICAgcmV0dXJuIE51bWJlcihuID09IDEgPyAwIDogbiAlIDEwID49IDIgJiYgbiAlIDEwIDw9IDQgJiYgKG4gJSAxMDAgPCAxMCB8fCBuICUgMTAwID49IDIwKSA/IDEgOiAyKTtcbiAgfSxcbiAgODogZnVuY3Rpb24gKG4pIHtcbiAgICByZXR1cm4gTnVtYmVyKG4gPT0gMSA/IDAgOiBuID09IDIgPyAxIDogbiAhPSA4ICYmIG4gIT0gMTEgPyAyIDogMyk7XG4gIH0sXG4gIDk6IGZ1bmN0aW9uIChuKSB7XG4gICAgcmV0dXJuIE51bWJlcihuID49IDIpO1xuICB9LFxuICAxMDogZnVuY3Rpb24gKG4pIHtcbiAgICByZXR1cm4gTnVtYmVyKG4gPT0gMSA/IDAgOiBuID09IDIgPyAxIDogbiA8IDcgPyAyIDogbiA8IDExID8gMyA6IDQpO1xuICB9LFxuICAxMTogZnVuY3Rpb24gKG4pIHtcbiAgICByZXR1cm4gTnVtYmVyKG4gPT0gMSB8fCBuID09IDExID8gMCA6IG4gPT0gMiB8fCBuID09IDEyID8gMSA6IG4gPiAyICYmIG4gPCAyMCA/IDIgOiAzKTtcbiAgfSxcbiAgMTI6IGZ1bmN0aW9uIChuKSB7XG4gICAgcmV0dXJuIE51bWJlcihuICUgMTAgIT0gMSB8fCBuICUgMTAwID09IDExKTtcbiAgfSxcbiAgMTM6IGZ1bmN0aW9uIChuKSB7XG4gICAgcmV0dXJuIE51bWJlcihuICE9PSAwKTtcbiAgfSxcbiAgMTQ6IGZ1bmN0aW9uIChuKSB7XG4gICAgcmV0dXJuIE51bWJlcihuID09IDEgPyAwIDogbiA9PSAyID8gMSA6IG4gPT0gMyA/IDIgOiAzKTtcbiAgfSxcbiAgMTU6IGZ1bmN0aW9uIChuKSB7XG4gICAgcmV0dXJuIE51bWJlcihuICUgMTAgPT0gMSAmJiBuICUgMTAwICE9IDExID8gMCA6IG4gJSAxMCA+PSAyICYmIChuICUgMTAwIDwgMTAgfHwgbiAlIDEwMCA+PSAyMCkgPyAxIDogMik7XG4gIH0sXG4gIDE2OiBmdW5jdGlvbiAobikge1xuICAgIHJldHVybiBOdW1iZXIobiAlIDEwID09IDEgJiYgbiAlIDEwMCAhPSAxMSA/IDAgOiBuICE9PSAwID8gMSA6IDIpO1xuICB9LFxuICAxNzogZnVuY3Rpb24gKG4pIHtcbiAgICByZXR1cm4gTnVtYmVyKG4gPT0gMSB8fCBuICUgMTAgPT0gMSAmJiBuICUgMTAwICE9IDExID8gMCA6IDEpO1xuICB9LFxuICAxODogZnVuY3Rpb24gKG4pIHtcbiAgICByZXR1cm4gTnVtYmVyKG4gPT0gMCA/IDAgOiBuID09IDEgPyAxIDogMik7XG4gIH0sXG4gIDE5OiBmdW5jdGlvbiAobikge1xuICAgIHJldHVybiBOdW1iZXIobiA9PSAxID8gMCA6IG4gPT0gMCB8fCBuICUgMTAwID4gMSAmJiBuICUgMTAwIDwgMTEgPyAxIDogbiAlIDEwMCA+IDEwICYmIG4gJSAxMDAgPCAyMCA/IDIgOiAzKTtcbiAgfSxcbiAgMjA6IGZ1bmN0aW9uIChuKSB7XG4gICAgcmV0dXJuIE51bWJlcihuID09IDEgPyAwIDogbiA9PSAwIHx8IG4gJSAxMDAgPiAwICYmIG4gJSAxMDAgPCAyMCA/IDEgOiAyKTtcbiAgfSxcbiAgMjE6IGZ1bmN0aW9uIChuKSB7XG4gICAgcmV0dXJuIE51bWJlcihuICUgMTAwID09IDEgPyAxIDogbiAlIDEwMCA9PSAyID8gMiA6IG4gJSAxMDAgPT0gMyB8fCBuICUgMTAwID09IDQgPyAzIDogMCk7XG4gIH0sXG4gIDIyOiBmdW5jdGlvbiAobikge1xuICAgIHJldHVybiBOdW1iZXIobiA9PSAxID8gMCA6IG4gPT0gMiA/IDEgOiAobiA8IDAgfHwgbiA+IDEwKSAmJiBuICUgMTAgPT0gMCA/IDIgOiAzKTtcbiAgfVxufTtcbmNvbnN0IG5vbkludGxWZXJzaW9ucyA9IFsndjEnLCAndjInLCAndjMnXTtcbmNvbnN0IGludGxWZXJzaW9ucyA9IFsndjQnXTtcbmNvbnN0IHN1ZmZpeGVzT3JkZXIgPSB7XG4gIHplcm86IDAsXG4gIG9uZTogMSxcbiAgdHdvOiAyLFxuICBmZXc6IDMsXG4gIG1hbnk6IDQsXG4gIG90aGVyOiA1XG59O1xuZnVuY3Rpb24gY3JlYXRlUnVsZXMoKSB7XG4gIGNvbnN0IHJ1bGVzID0ge307XG4gIHNldHMuZm9yRWFjaChzZXQgPT4ge1xuICAgIHNldC5sbmdzLmZvckVhY2gobCA9PiB7XG4gICAgICBydWxlc1tsXSA9IHtcbiAgICAgICAgbnVtYmVyczogc2V0Lm5yLFxuICAgICAgICBwbHVyYWxzOiBfcnVsZXNQbHVyYWxzVHlwZXNbc2V0LmZjXVxuICAgICAgfTtcbiAgICB9KTtcbiAgfSk7XG4gIHJldHVybiBydWxlcztcbn1cbmNsYXNzIFBsdXJhbFJlc29sdmVyIHtcbiAgY29uc3RydWN0b3IobGFuZ3VhZ2VVdGlscykge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB7fTtcbiAgICB0aGlzLmxhbmd1YWdlVXRpbHMgPSBsYW5ndWFnZVV0aWxzO1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy5sb2dnZXIgPSBiYXNlTG9nZ2VyLmNyZWF0ZSgncGx1cmFsUmVzb2x2ZXInKTtcbiAgICBpZiAoKCF0aGlzLm9wdGlvbnMuY29tcGF0aWJpbGl0eUpTT04gfHwgaW50bFZlcnNpb25zLmluY2x1ZGVzKHRoaXMub3B0aW9ucy5jb21wYXRpYmlsaXR5SlNPTikpICYmICh0eXBlb2YgSW50bCA9PT0gJ3VuZGVmaW5lZCcgfHwgIUludGwuUGx1cmFsUnVsZXMpKSB7XG4gICAgICB0aGlzLm9wdGlvbnMuY29tcGF0aWJpbGl0eUpTT04gPSAndjMnO1xuICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoJ1lvdXIgZW52aXJvbm1lbnQgc2VlbXMgbm90IHRvIGJlIEludGwgQVBJIGNvbXBhdGlibGUsIHVzZSBhbiBJbnRsLlBsdXJhbFJ1bGVzIHBvbHlmaWxsLiBXaWxsIGZhbGxiYWNrIHRvIHRoZSBjb21wYXRpYmlsaXR5SlNPTiB2MyBmb3JtYXQgaGFuZGxpbmcuJyk7XG4gICAgfVxuICAgIHRoaXMucnVsZXMgPSBjcmVhdGVSdWxlcygpO1xuICB9XG4gIGFkZFJ1bGUobG5nLCBvYmopIHtcbiAgICB0aGlzLnJ1bGVzW2xuZ10gPSBvYmo7XG4gIH1cbiAgZ2V0UnVsZShjb2RlKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IHt9O1xuICAgIGlmICh0aGlzLnNob3VsZFVzZUludGxBcGkoKSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIG5ldyBJbnRsLlBsdXJhbFJ1bGVzKGdldENsZWFuZWRDb2RlKGNvZGUpLCB7XG4gICAgICAgICAgdHlwZTogb3B0aW9ucy5vcmRpbmFsID8gJ29yZGluYWwnIDogJ2NhcmRpbmFsJ1xuICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnJ1bGVzW2NvZGVdIHx8IHRoaXMucnVsZXNbdGhpcy5sYW5ndWFnZVV0aWxzLmdldExhbmd1YWdlUGFydEZyb21Db2RlKGNvZGUpXTtcbiAgfVxuICBuZWVkc1BsdXJhbChjb2RlKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IHt9O1xuICAgIGNvbnN0IHJ1bGUgPSB0aGlzLmdldFJ1bGUoY29kZSwgb3B0aW9ucyk7XG4gICAgaWYgKHRoaXMuc2hvdWxkVXNlSW50bEFwaSgpKSB7XG4gICAgICByZXR1cm4gcnVsZSAmJiBydWxlLnJlc29sdmVkT3B0aW9ucygpLnBsdXJhbENhdGVnb3JpZXMubGVuZ3RoID4gMTtcbiAgICB9XG4gICAgcmV0dXJuIHJ1bGUgJiYgcnVsZS5udW1iZXJzLmxlbmd0aCA+IDE7XG4gIH1cbiAgZ2V0UGx1cmFsRm9ybXNPZktleShjb2RlLCBrZXkpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzJdIDoge307XG4gICAgcmV0dXJuIHRoaXMuZ2V0U3VmZml4ZXMoY29kZSwgb3B0aW9ucykubWFwKHN1ZmZpeCA9PiBgJHtrZXl9JHtzdWZmaXh9YCk7XG4gIH1cbiAgZ2V0U3VmZml4ZXMoY29kZSkge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB7fTtcbiAgICBjb25zdCBydWxlID0gdGhpcy5nZXRSdWxlKGNvZGUsIG9wdGlvbnMpO1xuICAgIGlmICghcnVsZSkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICBpZiAodGhpcy5zaG91bGRVc2VJbnRsQXBpKCkpIHtcbiAgICAgIHJldHVybiBydWxlLnJlc29sdmVkT3B0aW9ucygpLnBsdXJhbENhdGVnb3JpZXMuc29ydCgocGx1cmFsQ2F0ZWdvcnkxLCBwbHVyYWxDYXRlZ29yeTIpID0+IHN1ZmZpeGVzT3JkZXJbcGx1cmFsQ2F0ZWdvcnkxXSAtIHN1ZmZpeGVzT3JkZXJbcGx1cmFsQ2F0ZWdvcnkyXSkubWFwKHBsdXJhbENhdGVnb3J5ID0+IGAke3RoaXMub3B0aW9ucy5wcmVwZW5kfSR7b3B0aW9ucy5vcmRpbmFsID8gYG9yZGluYWwke3RoaXMub3B0aW9ucy5wcmVwZW5kfWAgOiAnJ30ke3BsdXJhbENhdGVnb3J5fWApO1xuICAgIH1cbiAgICByZXR1cm4gcnVsZS5udW1iZXJzLm1hcChudW1iZXIgPT4gdGhpcy5nZXRTdWZmaXgoY29kZSwgbnVtYmVyLCBvcHRpb25zKSk7XG4gIH1cbiAgZ2V0U3VmZml4KGNvZGUsIGNvdW50KSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6IHt9O1xuICAgIGNvbnN0IHJ1bGUgPSB0aGlzLmdldFJ1bGUoY29kZSwgb3B0aW9ucyk7XG4gICAgaWYgKHJ1bGUpIHtcbiAgICAgIGlmICh0aGlzLnNob3VsZFVzZUludGxBcGkoKSkge1xuICAgICAgICByZXR1cm4gYCR7dGhpcy5vcHRpb25zLnByZXBlbmR9JHtvcHRpb25zLm9yZGluYWwgPyBgb3JkaW5hbCR7dGhpcy5vcHRpb25zLnByZXBlbmR9YCA6ICcnfSR7cnVsZS5zZWxlY3QoY291bnQpfWA7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5nZXRTdWZmaXhSZXRyb0NvbXBhdGlibGUocnVsZSwgY291bnQpO1xuICAgIH1cbiAgICB0aGlzLmxvZ2dlci53YXJuKGBubyBwbHVyYWwgcnVsZSBmb3VuZCBmb3I6ICR7Y29kZX1gKTtcbiAgICByZXR1cm4gJyc7XG4gIH1cbiAgZ2V0U3VmZml4UmV0cm9Db21wYXRpYmxlKHJ1bGUsIGNvdW50KSB7XG4gICAgY29uc3QgaWR4ID0gcnVsZS5ub0FicyA/IHJ1bGUucGx1cmFscyhjb3VudCkgOiBydWxlLnBsdXJhbHMoTWF0aC5hYnMoY291bnQpKTtcbiAgICBsZXQgc3VmZml4ID0gcnVsZS5udW1iZXJzW2lkeF07XG4gICAgaWYgKHRoaXMub3B0aW9ucy5zaW1wbGlmeVBsdXJhbFN1ZmZpeCAmJiBydWxlLm51bWJlcnMubGVuZ3RoID09PSAyICYmIHJ1bGUubnVtYmVyc1swXSA9PT0gMSkge1xuICAgICAgaWYgKHN1ZmZpeCA9PT0gMikge1xuICAgICAgICBzdWZmaXggPSAncGx1cmFsJztcbiAgICAgIH0gZWxzZSBpZiAoc3VmZml4ID09PSAxKSB7XG4gICAgICAgIHN1ZmZpeCA9ICcnO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCByZXR1cm5TdWZmaXggPSAoKSA9PiB0aGlzLm9wdGlvbnMucHJlcGVuZCAmJiBzdWZmaXgudG9TdHJpbmcoKSA/IHRoaXMub3B0aW9ucy5wcmVwZW5kICsgc3VmZml4LnRvU3RyaW5nKCkgOiBzdWZmaXgudG9TdHJpbmcoKTtcbiAgICBpZiAodGhpcy5vcHRpb25zLmNvbXBhdGliaWxpdHlKU09OID09PSAndjEnKSB7XG4gICAgICBpZiAoc3VmZml4ID09PSAxKSByZXR1cm4gJyc7XG4gICAgICBpZiAodHlwZW9mIHN1ZmZpeCA9PT0gJ251bWJlcicpIHJldHVybiBgX3BsdXJhbF8ke3N1ZmZpeC50b1N0cmluZygpfWA7XG4gICAgICByZXR1cm4gcmV0dXJuU3VmZml4KCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLm9wdGlvbnMuY29tcGF0aWJpbGl0eUpTT04gPT09ICd2MicpIHtcbiAgICAgIHJldHVybiByZXR1cm5TdWZmaXgoKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5zaW1wbGlmeVBsdXJhbFN1ZmZpeCAmJiBydWxlLm51bWJlcnMubGVuZ3RoID09PSAyICYmIHJ1bGUubnVtYmVyc1swXSA9PT0gMSkge1xuICAgICAgcmV0dXJuIHJldHVyblN1ZmZpeCgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLnByZXBlbmQgJiYgaWR4LnRvU3RyaW5nKCkgPyB0aGlzLm9wdGlvbnMucHJlcGVuZCArIGlkeC50b1N0cmluZygpIDogaWR4LnRvU3RyaW5nKCk7XG4gIH1cbiAgc2hvdWxkVXNlSW50bEFwaSgpIHtcbiAgICByZXR1cm4gIW5vbkludGxWZXJzaW9ucy5pbmNsdWRlcyh0aGlzLm9wdGlvbnMuY29tcGF0aWJpbGl0eUpTT04pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGRlZXBGaW5kV2l0aERlZmF1bHRzKGRhdGEsIGRlZmF1bHREYXRhLCBrZXkpIHtcbiAgbGV0IGtleVNlcGFyYXRvciA9IGFyZ3VtZW50cy5sZW5ndGggPiAzICYmIGFyZ3VtZW50c1szXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzNdIDogJy4nO1xuICBsZXQgaWdub3JlSlNPTlN0cnVjdHVyZSA9IGFyZ3VtZW50cy5sZW5ndGggPiA0ICYmIGFyZ3VtZW50c1s0XSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzRdIDogdHJ1ZTtcbiAgbGV0IHBhdGggPSBnZXRQYXRoV2l0aERlZmF1bHRzKGRhdGEsIGRlZmF1bHREYXRhLCBrZXkpO1xuICBpZiAoIXBhdGggJiYgaWdub3JlSlNPTlN0cnVjdHVyZSAmJiB0eXBlb2Yga2V5ID09PSAnc3RyaW5nJykge1xuICAgIHBhdGggPSBkZWVwRmluZChkYXRhLCBrZXksIGtleVNlcGFyYXRvcik7XG4gICAgaWYgKHBhdGggPT09IHVuZGVmaW5lZCkgcGF0aCA9IGRlZXBGaW5kKGRlZmF1bHREYXRhLCBrZXksIGtleVNlcGFyYXRvcik7XG4gIH1cbiAgcmV0dXJuIHBhdGg7XG59XG5jbGFzcyBJbnRlcnBvbGF0b3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDoge307XG4gICAgdGhpcy5sb2dnZXIgPSBiYXNlTG9nZ2VyLmNyZWF0ZSgnaW50ZXJwb2xhdG9yJyk7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLmZvcm1hdCA9IG9wdGlvbnMuaW50ZXJwb2xhdGlvbiAmJiBvcHRpb25zLmludGVycG9sYXRpb24uZm9ybWF0IHx8ICh2YWx1ZSA9PiB2YWx1ZSk7XG4gICAgdGhpcy5pbml0KG9wdGlvbnMpO1xuICB9XG4gIGluaXQoKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IHt9O1xuICAgIGlmICghb3B0aW9ucy5pbnRlcnBvbGF0aW9uKSBvcHRpb25zLmludGVycG9sYXRpb24gPSB7XG4gICAgICBlc2NhcGVWYWx1ZTogdHJ1ZVxuICAgIH07XG4gICAgY29uc3QgaU9wdHMgPSBvcHRpb25zLmludGVycG9sYXRpb247XG4gICAgdGhpcy5lc2NhcGUgPSBpT3B0cy5lc2NhcGUgIT09IHVuZGVmaW5lZCA/IGlPcHRzLmVzY2FwZSA6IGVzY2FwZTtcbiAgICB0aGlzLmVzY2FwZVZhbHVlID0gaU9wdHMuZXNjYXBlVmFsdWUgIT09IHVuZGVmaW5lZCA/IGlPcHRzLmVzY2FwZVZhbHVlIDogdHJ1ZTtcbiAgICB0aGlzLnVzZVJhd1ZhbHVlVG9Fc2NhcGUgPSBpT3B0cy51c2VSYXdWYWx1ZVRvRXNjYXBlICE9PSB1bmRlZmluZWQgPyBpT3B0cy51c2VSYXdWYWx1ZVRvRXNjYXBlIDogZmFsc2U7XG4gICAgdGhpcy5wcmVmaXggPSBpT3B0cy5wcmVmaXggPyByZWdleEVzY2FwZShpT3B0cy5wcmVmaXgpIDogaU9wdHMucHJlZml4RXNjYXBlZCB8fCAne3snO1xuICAgIHRoaXMuc3VmZml4ID0gaU9wdHMuc3VmZml4ID8gcmVnZXhFc2NhcGUoaU9wdHMuc3VmZml4KSA6IGlPcHRzLnN1ZmZpeEVzY2FwZWQgfHwgJ319JztcbiAgICB0aGlzLmZvcm1hdFNlcGFyYXRvciA9IGlPcHRzLmZvcm1hdFNlcGFyYXRvciA/IGlPcHRzLmZvcm1hdFNlcGFyYXRvciA6IGlPcHRzLmZvcm1hdFNlcGFyYXRvciB8fCAnLCc7XG4gICAgdGhpcy51bmVzY2FwZVByZWZpeCA9IGlPcHRzLnVuZXNjYXBlU3VmZml4ID8gJycgOiBpT3B0cy51bmVzY2FwZVByZWZpeCB8fCAnLSc7XG4gICAgdGhpcy51bmVzY2FwZVN1ZmZpeCA9IHRoaXMudW5lc2NhcGVQcmVmaXggPyAnJyA6IGlPcHRzLnVuZXNjYXBlU3VmZml4IHx8ICcnO1xuICAgIHRoaXMubmVzdGluZ1ByZWZpeCA9IGlPcHRzLm5lc3RpbmdQcmVmaXggPyByZWdleEVzY2FwZShpT3B0cy5uZXN0aW5nUHJlZml4KSA6IGlPcHRzLm5lc3RpbmdQcmVmaXhFc2NhcGVkIHx8IHJlZ2V4RXNjYXBlKCckdCgnKTtcbiAgICB0aGlzLm5lc3RpbmdTdWZmaXggPSBpT3B0cy5uZXN0aW5nU3VmZml4ID8gcmVnZXhFc2NhcGUoaU9wdHMubmVzdGluZ1N1ZmZpeCkgOiBpT3B0cy5uZXN0aW5nU3VmZml4RXNjYXBlZCB8fCByZWdleEVzY2FwZSgnKScpO1xuICAgIHRoaXMubmVzdGluZ09wdGlvbnNTZXBhcmF0b3IgPSBpT3B0cy5uZXN0aW5nT3B0aW9uc1NlcGFyYXRvciA/IGlPcHRzLm5lc3RpbmdPcHRpb25zU2VwYXJhdG9yIDogaU9wdHMubmVzdGluZ09wdGlvbnNTZXBhcmF0b3IgfHwgJywnO1xuICAgIHRoaXMubWF4UmVwbGFjZXMgPSBpT3B0cy5tYXhSZXBsYWNlcyA/IGlPcHRzLm1heFJlcGxhY2VzIDogMTAwMDtcbiAgICB0aGlzLmFsd2F5c0Zvcm1hdCA9IGlPcHRzLmFsd2F5c0Zvcm1hdCAhPT0gdW5kZWZpbmVkID8gaU9wdHMuYWx3YXlzRm9ybWF0IDogZmFsc2U7XG4gICAgdGhpcy5yZXNldFJlZ0V4cCgpO1xuICB9XG4gIHJlc2V0KCkge1xuICAgIGlmICh0aGlzLm9wdGlvbnMpIHRoaXMuaW5pdCh0aGlzLm9wdGlvbnMpO1xuICB9XG4gIHJlc2V0UmVnRXhwKCkge1xuICAgIGNvbnN0IHJlZ2V4cFN0ciA9IGAke3RoaXMucHJlZml4fSguKz8pJHt0aGlzLnN1ZmZpeH1gO1xuICAgIHRoaXMucmVnZXhwID0gbmV3IFJlZ0V4cChyZWdleHBTdHIsICdnJyk7XG4gICAgY29uc3QgcmVnZXhwVW5lc2NhcGVTdHIgPSBgJHt0aGlzLnByZWZpeH0ke3RoaXMudW5lc2NhcGVQcmVmaXh9KC4rPykke3RoaXMudW5lc2NhcGVTdWZmaXh9JHt0aGlzLnN1ZmZpeH1gO1xuICAgIHRoaXMucmVnZXhwVW5lc2NhcGUgPSBuZXcgUmVnRXhwKHJlZ2V4cFVuZXNjYXBlU3RyLCAnZycpO1xuICAgIGNvbnN0IG5lc3RpbmdSZWdleHBTdHIgPSBgJHt0aGlzLm5lc3RpbmdQcmVmaXh9KC4rPykke3RoaXMubmVzdGluZ1N1ZmZpeH1gO1xuICAgIHRoaXMubmVzdGluZ1JlZ2V4cCA9IG5ldyBSZWdFeHAobmVzdGluZ1JlZ2V4cFN0ciwgJ2cnKTtcbiAgfVxuICBpbnRlcnBvbGF0ZShzdHIsIGRhdGEsIGxuZywgb3B0aW9ucykge1xuICAgIGxldCBtYXRjaDtcbiAgICBsZXQgdmFsdWU7XG4gICAgbGV0IHJlcGxhY2VzO1xuICAgIGNvbnN0IGRlZmF1bHREYXRhID0gdGhpcy5vcHRpb25zICYmIHRoaXMub3B0aW9ucy5pbnRlcnBvbGF0aW9uICYmIHRoaXMub3B0aW9ucy5pbnRlcnBvbGF0aW9uLmRlZmF1bHRWYXJpYWJsZXMgfHwge307XG4gICAgZnVuY3Rpb24gcmVnZXhTYWZlKHZhbCkge1xuICAgICAgcmV0dXJuIHZhbC5yZXBsYWNlKC9cXCQvZywgJyQkJCQnKTtcbiAgICB9XG4gICAgY29uc3QgaGFuZGxlRm9ybWF0ID0ga2V5ID0+IHtcbiAgICAgIGlmIChrZXkuaW5kZXhPZih0aGlzLmZvcm1hdFNlcGFyYXRvcikgPCAwKSB7XG4gICAgICAgIGNvbnN0IHBhdGggPSBkZWVwRmluZFdpdGhEZWZhdWx0cyhkYXRhLCBkZWZhdWx0RGF0YSwga2V5LCB0aGlzLm9wdGlvbnMua2V5U2VwYXJhdG9yLCB0aGlzLm9wdGlvbnMuaWdub3JlSlNPTlN0cnVjdHVyZSk7XG4gICAgICAgIHJldHVybiB0aGlzLmFsd2F5c0Zvcm1hdCA/IHRoaXMuZm9ybWF0KHBhdGgsIHVuZGVmaW5lZCwgbG5nLCB7XG4gICAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgICAuLi5kYXRhLFxuICAgICAgICAgIGludGVycG9sYXRpb25rZXk6IGtleVxuICAgICAgICB9KSA6IHBhdGg7XG4gICAgICB9XG4gICAgICBjb25zdCBwID0ga2V5LnNwbGl0KHRoaXMuZm9ybWF0U2VwYXJhdG9yKTtcbiAgICAgIGNvbnN0IGsgPSBwLnNoaWZ0KCkudHJpbSgpO1xuICAgICAgY29uc3QgZiA9IHAuam9pbih0aGlzLmZvcm1hdFNlcGFyYXRvcikudHJpbSgpO1xuICAgICAgcmV0dXJuIHRoaXMuZm9ybWF0KGRlZXBGaW5kV2l0aERlZmF1bHRzKGRhdGEsIGRlZmF1bHREYXRhLCBrLCB0aGlzLm9wdGlvbnMua2V5U2VwYXJhdG9yLCB0aGlzLm9wdGlvbnMuaWdub3JlSlNPTlN0cnVjdHVyZSksIGYsIGxuZywge1xuICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICAuLi5kYXRhLFxuICAgICAgICBpbnRlcnBvbGF0aW9ua2V5OiBrXG4gICAgICB9KTtcbiAgICB9O1xuICAgIHRoaXMucmVzZXRSZWdFeHAoKTtcbiAgICBjb25zdCBtaXNzaW5nSW50ZXJwb2xhdGlvbkhhbmRsZXIgPSBvcHRpb25zICYmIG9wdGlvbnMubWlzc2luZ0ludGVycG9sYXRpb25IYW5kbGVyIHx8IHRoaXMub3B0aW9ucy5taXNzaW5nSW50ZXJwb2xhdGlvbkhhbmRsZXI7XG4gICAgY29uc3Qgc2tpcE9uVmFyaWFibGVzID0gb3B0aW9ucyAmJiBvcHRpb25zLmludGVycG9sYXRpb24gJiYgb3B0aW9ucy5pbnRlcnBvbGF0aW9uLnNraXBPblZhcmlhYmxlcyAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy5pbnRlcnBvbGF0aW9uLnNraXBPblZhcmlhYmxlcyA6IHRoaXMub3B0aW9ucy5pbnRlcnBvbGF0aW9uLnNraXBPblZhcmlhYmxlcztcbiAgICBjb25zdCB0b2RvcyA9IFt7XG4gICAgICByZWdleDogdGhpcy5yZWdleHBVbmVzY2FwZSxcbiAgICAgIHNhZmVWYWx1ZTogdmFsID0+IHJlZ2V4U2FmZSh2YWwpXG4gICAgfSwge1xuICAgICAgcmVnZXg6IHRoaXMucmVnZXhwLFxuICAgICAgc2FmZVZhbHVlOiB2YWwgPT4gdGhpcy5lc2NhcGVWYWx1ZSA/IHJlZ2V4U2FmZSh0aGlzLmVzY2FwZSh2YWwpKSA6IHJlZ2V4U2FmZSh2YWwpXG4gICAgfV07XG4gICAgdG9kb3MuZm9yRWFjaCh0b2RvID0+IHtcbiAgICAgIHJlcGxhY2VzID0gMDtcbiAgICAgIHdoaWxlIChtYXRjaCA9IHRvZG8ucmVnZXguZXhlYyhzdHIpKSB7XG4gICAgICAgIGNvbnN0IG1hdGNoZWRWYXIgPSBtYXRjaFsxXS50cmltKCk7XG4gICAgICAgIHZhbHVlID0gaGFuZGxlRm9ybWF0KG1hdGNoZWRWYXIpO1xuICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGlmICh0eXBlb2YgbWlzc2luZ0ludGVycG9sYXRpb25IYW5kbGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjb25zdCB0ZW1wID0gbWlzc2luZ0ludGVycG9sYXRpb25IYW5kbGVyKHN0ciwgbWF0Y2gsIG9wdGlvbnMpO1xuICAgICAgICAgICAgdmFsdWUgPSB0eXBlb2YgdGVtcCA9PT0gJ3N0cmluZycgPyB0ZW1wIDogJyc7XG4gICAgICAgICAgfSBlbHNlIGlmIChvcHRpb25zICYmIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvcHRpb25zLCBtYXRjaGVkVmFyKSkge1xuICAgICAgICAgICAgdmFsdWUgPSAnJztcbiAgICAgICAgICB9IGVsc2UgaWYgKHNraXBPblZhcmlhYmxlcykge1xuICAgICAgICAgICAgdmFsdWUgPSBtYXRjaFswXTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmxvZ2dlci53YXJuKGBtaXNzZWQgdG8gcGFzcyBpbiB2YXJpYWJsZSAke21hdGNoZWRWYXJ9IGZvciBpbnRlcnBvbGF0aW5nICR7c3RyfWApO1xuICAgICAgICAgICAgdmFsdWUgPSAnJztcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJyAmJiAhdGhpcy51c2VSYXdWYWx1ZVRvRXNjYXBlKSB7XG4gICAgICAgICAgdmFsdWUgPSBtYWtlU3RyaW5nKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzYWZlVmFsdWUgPSB0b2RvLnNhZmVWYWx1ZSh2YWx1ZSk7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKG1hdGNoWzBdLCBzYWZlVmFsdWUpO1xuICAgICAgICBpZiAoc2tpcE9uVmFyaWFibGVzKSB7XG4gICAgICAgICAgdG9kby5yZWdleC5sYXN0SW5kZXggKz0gdmFsdWUubGVuZ3RoO1xuICAgICAgICAgIHRvZG8ucmVnZXgubGFzdEluZGV4IC09IG1hdGNoWzBdLmxlbmd0aDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0b2RvLnJlZ2V4Lmxhc3RJbmRleCA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgcmVwbGFjZXMrKztcbiAgICAgICAgaWYgKHJlcGxhY2VzID49IHRoaXMubWF4UmVwbGFjZXMpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBzdHI7XG4gIH1cbiAgbmVzdChzdHIsIGZjKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6IHt9O1xuICAgIGxldCBtYXRjaDtcbiAgICBsZXQgdmFsdWU7XG4gICAgbGV0IGNsb25lZE9wdGlvbnM7XG4gICAgZnVuY3Rpb24gaGFuZGxlSGFzT3B0aW9ucyhrZXksIGluaGVyaXRlZE9wdGlvbnMpIHtcbiAgICAgIGNvbnN0IHNlcCA9IHRoaXMubmVzdGluZ09wdGlvbnNTZXBhcmF0b3I7XG4gICAgICBpZiAoa2V5LmluZGV4T2Yoc2VwKSA8IDApIHJldHVybiBrZXk7XG4gICAgICBjb25zdCBjID0ga2V5LnNwbGl0KG5ldyBSZWdFeHAoYCR7c2VwfVsgXSp7YCkpO1xuICAgICAgbGV0IG9wdGlvbnNTdHJpbmcgPSBgeyR7Y1sxXX1gO1xuICAgICAga2V5ID0gY1swXTtcbiAgICAgIG9wdGlvbnNTdHJpbmcgPSB0aGlzLmludGVycG9sYXRlKG9wdGlvbnNTdHJpbmcsIGNsb25lZE9wdGlvbnMpO1xuICAgICAgY29uc3QgbWF0Y2hlZFNpbmdsZVF1b3RlcyA9IG9wdGlvbnNTdHJpbmcubWF0Y2goLycvZyk7XG4gICAgICBjb25zdCBtYXRjaGVkRG91YmxlUXVvdGVzID0gb3B0aW9uc1N0cmluZy5tYXRjaCgvXCIvZyk7XG4gICAgICBpZiAobWF0Y2hlZFNpbmdsZVF1b3RlcyAmJiBtYXRjaGVkU2luZ2xlUXVvdGVzLmxlbmd0aCAlIDIgPT09IDAgJiYgIW1hdGNoZWREb3VibGVRdW90ZXMgfHwgbWF0Y2hlZERvdWJsZVF1b3Rlcy5sZW5ndGggJSAyICE9PSAwKSB7XG4gICAgICAgIG9wdGlvbnNTdHJpbmcgPSBvcHRpb25zU3RyaW5nLnJlcGxhY2UoLycvZywgJ1wiJyk7XG4gICAgICB9XG4gICAgICB0cnkge1xuICAgICAgICBjbG9uZWRPcHRpb25zID0gSlNPTi5wYXJzZShvcHRpb25zU3RyaW5nKTtcbiAgICAgICAgaWYgKGluaGVyaXRlZE9wdGlvbnMpIGNsb25lZE9wdGlvbnMgPSB7XG4gICAgICAgICAgLi4uaW5oZXJpdGVkT3B0aW9ucyxcbiAgICAgICAgICAuLi5jbG9uZWRPcHRpb25zXG4gICAgICAgIH07XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLndhcm4oYGZhaWxlZCBwYXJzaW5nIG9wdGlvbnMgc3RyaW5nIGluIG5lc3RpbmcgZm9yIGtleSAke2tleX1gLCBlKTtcbiAgICAgICAgcmV0dXJuIGAke2tleX0ke3NlcH0ke29wdGlvbnNTdHJpbmd9YDtcbiAgICAgIH1cbiAgICAgIGRlbGV0ZSBjbG9uZWRPcHRpb25zLmRlZmF1bHRWYWx1ZTtcbiAgICAgIHJldHVybiBrZXk7XG4gICAgfVxuICAgIHdoaWxlIChtYXRjaCA9IHRoaXMubmVzdGluZ1JlZ2V4cC5leGVjKHN0cikpIHtcbiAgICAgIGxldCBmb3JtYXR0ZXJzID0gW107XG4gICAgICBjbG9uZWRPcHRpb25zID0ge1xuICAgICAgICAuLi5vcHRpb25zXG4gICAgICB9O1xuICAgICAgY2xvbmVkT3B0aW9ucyA9IGNsb25lZE9wdGlvbnMucmVwbGFjZSAmJiB0eXBlb2YgY2xvbmVkT3B0aW9ucy5yZXBsYWNlICE9PSAnc3RyaW5nJyA/IGNsb25lZE9wdGlvbnMucmVwbGFjZSA6IGNsb25lZE9wdGlvbnM7XG4gICAgICBjbG9uZWRPcHRpb25zLmFwcGx5UG9zdFByb2Nlc3NvciA9IGZhbHNlO1xuICAgICAgZGVsZXRlIGNsb25lZE9wdGlvbnMuZGVmYXVsdFZhbHVlO1xuICAgICAgbGV0IGRvUmVkdWNlID0gZmFsc2U7XG4gICAgICBpZiAobWF0Y2hbMF0uaW5kZXhPZih0aGlzLmZvcm1hdFNlcGFyYXRvcikgIT09IC0xICYmICEvey4qfS8udGVzdChtYXRjaFsxXSkpIHtcbiAgICAgICAgY29uc3QgciA9IG1hdGNoWzFdLnNwbGl0KHRoaXMuZm9ybWF0U2VwYXJhdG9yKS5tYXAoZWxlbSA9PiBlbGVtLnRyaW0oKSk7XG4gICAgICAgIG1hdGNoWzFdID0gci5zaGlmdCgpO1xuICAgICAgICBmb3JtYXR0ZXJzID0gcjtcbiAgICAgICAgZG9SZWR1Y2UgPSB0cnVlO1xuICAgICAgfVxuICAgICAgdmFsdWUgPSBmYyhoYW5kbGVIYXNPcHRpb25zLmNhbGwodGhpcywgbWF0Y2hbMV0udHJpbSgpLCBjbG9uZWRPcHRpb25zKSwgY2xvbmVkT3B0aW9ucyk7XG4gICAgICBpZiAodmFsdWUgJiYgbWF0Y2hbMF0gPT09IHN0ciAmJiB0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSByZXR1cm4gdmFsdWU7XG4gICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJykgdmFsdWUgPSBtYWtlU3RyaW5nKHZhbHVlKTtcbiAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgdGhpcy5sb2dnZXIud2FybihgbWlzc2VkIHRvIHJlc29sdmUgJHttYXRjaFsxXX0gZm9yIG5lc3RpbmcgJHtzdHJ9YCk7XG4gICAgICAgIHZhbHVlID0gJyc7XG4gICAgICB9XG4gICAgICBpZiAoZG9SZWR1Y2UpIHtcbiAgICAgICAgdmFsdWUgPSBmb3JtYXR0ZXJzLnJlZHVjZSgodiwgZikgPT4gdGhpcy5mb3JtYXQodiwgZiwgb3B0aW9ucy5sbmcsIHtcbiAgICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICAgIGludGVycG9sYXRpb25rZXk6IG1hdGNoWzFdLnRyaW0oKVxuICAgICAgICB9KSwgdmFsdWUudHJpbSgpKTtcbiAgICAgIH1cbiAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKG1hdGNoWzBdLCB2YWx1ZSk7XG4gICAgICB0aGlzLnJlZ2V4cC5sYXN0SW5kZXggPSAwO1xuICAgIH1cbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cbmZ1bmN0aW9uIHBhcnNlRm9ybWF0U3RyKGZvcm1hdFN0cikge1xuICBsZXQgZm9ybWF0TmFtZSA9IGZvcm1hdFN0ci50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcbiAgY29uc3QgZm9ybWF0T3B0aW9ucyA9IHt9O1xuICBpZiAoZm9ybWF0U3RyLmluZGV4T2YoJygnKSA+IC0xKSB7XG4gICAgY29uc3QgcCA9IGZvcm1hdFN0ci5zcGxpdCgnKCcpO1xuICAgIGZvcm1hdE5hbWUgPSBwWzBdLnRvTG93ZXJDYXNlKCkudHJpbSgpO1xuICAgIGNvbnN0IG9wdFN0ciA9IHBbMV0uc3Vic3RyaW5nKDAsIHBbMV0ubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGZvcm1hdE5hbWUgPT09ICdjdXJyZW5jeScgJiYgb3B0U3RyLmluZGV4T2YoJzonKSA8IDApIHtcbiAgICAgIGlmICghZm9ybWF0T3B0aW9ucy5jdXJyZW5jeSkgZm9ybWF0T3B0aW9ucy5jdXJyZW5jeSA9IG9wdFN0ci50cmltKCk7XG4gICAgfSBlbHNlIGlmIChmb3JtYXROYW1lID09PSAncmVsYXRpdmV0aW1lJyAmJiBvcHRTdHIuaW5kZXhPZignOicpIDwgMCkge1xuICAgICAgaWYgKCFmb3JtYXRPcHRpb25zLnJhbmdlKSBmb3JtYXRPcHRpb25zLnJhbmdlID0gb3B0U3RyLnRyaW0oKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3Qgb3B0cyA9IG9wdFN0ci5zcGxpdCgnOycpO1xuICAgICAgb3B0cy5mb3JFYWNoKG9wdCA9PiB7XG4gICAgICAgIGlmICghb3B0KSByZXR1cm47XG4gICAgICAgIGNvbnN0IFtrZXksIC4uLnJlc3RdID0gb3B0LnNwbGl0KCc6Jyk7XG4gICAgICAgIGNvbnN0IHZhbCA9IHJlc3Quam9pbignOicpLnRyaW0oKS5yZXBsYWNlKC9eJyt8JyskL2csICcnKTtcbiAgICAgICAgaWYgKCFmb3JtYXRPcHRpb25zW2tleS50cmltKCldKSBmb3JtYXRPcHRpb25zW2tleS50cmltKCldID0gdmFsO1xuICAgICAgICBpZiAodmFsID09PSAnZmFsc2UnKSBmb3JtYXRPcHRpb25zW2tleS50cmltKCldID0gZmFsc2U7XG4gICAgICAgIGlmICh2YWwgPT09ICd0cnVlJykgZm9ybWF0T3B0aW9uc1trZXkudHJpbSgpXSA9IHRydWU7XG4gICAgICAgIGlmICghaXNOYU4odmFsKSkgZm9ybWF0T3B0aW9uc1trZXkudHJpbSgpXSA9IHBhcnNlSW50KHZhbCwgMTApO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIHJldHVybiB7XG4gICAgZm9ybWF0TmFtZSxcbiAgICBmb3JtYXRPcHRpb25zXG4gIH07XG59XG5mdW5jdGlvbiBjcmVhdGVDYWNoZWRGb3JtYXR0ZXIoZm4pIHtcbiAgY29uc3QgY2FjaGUgPSB7fTtcbiAgcmV0dXJuIGZ1bmN0aW9uIGludm9rZUZvcm1hdHRlcih2YWwsIGxuZywgb3B0aW9ucykge1xuICAgIGNvbnN0IGtleSA9IGxuZyArIEpTT04uc3RyaW5naWZ5KG9wdGlvbnMpO1xuICAgIGxldCBmb3JtYXR0ZXIgPSBjYWNoZVtrZXldO1xuICAgIGlmICghZm9ybWF0dGVyKSB7XG4gICAgICBmb3JtYXR0ZXIgPSBmbihnZXRDbGVhbmVkQ29kZShsbmcpLCBvcHRpb25zKTtcbiAgICAgIGNhY2hlW2tleV0gPSBmb3JtYXR0ZXI7XG4gICAgfVxuICAgIHJldHVybiBmb3JtYXR0ZXIodmFsKTtcbiAgfTtcbn1cbmNsYXNzIEZvcm1hdHRlciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiB7fTtcbiAgICB0aGlzLmxvZ2dlciA9IGJhc2VMb2dnZXIuY3JlYXRlKCdmb3JtYXR0ZXInKTtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMuZm9ybWF0cyA9IHtcbiAgICAgIG51bWJlcjogY3JlYXRlQ2FjaGVkRm9ybWF0dGVyKChsbmcsIG9wdCkgPT4ge1xuICAgICAgICBjb25zdCBmb3JtYXR0ZXIgPSBuZXcgSW50bC5OdW1iZXJGb3JtYXQobG5nLCB7XG4gICAgICAgICAgLi4ub3B0XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdmFsID0+IGZvcm1hdHRlci5mb3JtYXQodmFsKTtcbiAgICAgIH0pLFxuICAgICAgY3VycmVuY3k6IGNyZWF0ZUNhY2hlZEZvcm1hdHRlcigobG5nLCBvcHQpID0+IHtcbiAgICAgICAgY29uc3QgZm9ybWF0dGVyID0gbmV3IEludGwuTnVtYmVyRm9ybWF0KGxuZywge1xuICAgICAgICAgIC4uLm9wdCxcbiAgICAgICAgICBzdHlsZTogJ2N1cnJlbmN5J1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHZhbCA9PiBmb3JtYXR0ZXIuZm9ybWF0KHZhbCk7XG4gICAgICB9KSxcbiAgICAgIGRhdGV0aW1lOiBjcmVhdGVDYWNoZWRGb3JtYXR0ZXIoKGxuZywgb3B0KSA9PiB7XG4gICAgICAgIGNvbnN0IGZvcm1hdHRlciA9IG5ldyBJbnRsLkRhdGVUaW1lRm9ybWF0KGxuZywge1xuICAgICAgICAgIC4uLm9wdFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHZhbCA9PiBmb3JtYXR0ZXIuZm9ybWF0KHZhbCk7XG4gICAgICB9KSxcbiAgICAgIHJlbGF0aXZldGltZTogY3JlYXRlQ2FjaGVkRm9ybWF0dGVyKChsbmcsIG9wdCkgPT4ge1xuICAgICAgICBjb25zdCBmb3JtYXR0ZXIgPSBuZXcgSW50bC5SZWxhdGl2ZVRpbWVGb3JtYXQobG5nLCB7XG4gICAgICAgICAgLi4ub3B0XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdmFsID0+IGZvcm1hdHRlci5mb3JtYXQodmFsLCBvcHQucmFuZ2UgfHwgJ2RheScpO1xuICAgICAgfSksXG4gICAgICBsaXN0OiBjcmVhdGVDYWNoZWRGb3JtYXR0ZXIoKGxuZywgb3B0KSA9PiB7XG4gICAgICAgIGNvbnN0IGZvcm1hdHRlciA9IG5ldyBJbnRsLkxpc3RGb3JtYXQobG5nLCB7XG4gICAgICAgICAgLi4ub3B0XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdmFsID0+IGZvcm1hdHRlci5mb3JtYXQodmFsKTtcbiAgICAgIH0pXG4gICAgfTtcbiAgICB0aGlzLmluaXQob3B0aW9ucyk7XG4gIH1cbiAgaW5pdChzZXJ2aWNlcykge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB7XG4gICAgICBpbnRlcnBvbGF0aW9uOiB7fVxuICAgIH07XG4gICAgY29uc3QgaU9wdHMgPSBvcHRpb25zLmludGVycG9sYXRpb247XG4gICAgdGhpcy5mb3JtYXRTZXBhcmF0b3IgPSBpT3B0cy5mb3JtYXRTZXBhcmF0b3IgPyBpT3B0cy5mb3JtYXRTZXBhcmF0b3IgOiBpT3B0cy5mb3JtYXRTZXBhcmF0b3IgfHwgJywnO1xuICB9XG4gIGFkZChuYW1lLCBmYykge1xuICAgIHRoaXMuZm9ybWF0c1tuYW1lLnRvTG93ZXJDYXNlKCkudHJpbSgpXSA9IGZjO1xuICB9XG4gIGFkZENhY2hlZChuYW1lLCBmYykge1xuICAgIHRoaXMuZm9ybWF0c1tuYW1lLnRvTG93ZXJDYXNlKCkudHJpbSgpXSA9IGNyZWF0ZUNhY2hlZEZvcm1hdHRlcihmYyk7XG4gIH1cbiAgZm9ybWF0KHZhbHVlLCBmb3JtYXQsIGxuZykge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDMgJiYgYXJndW1lbnRzWzNdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbM10gOiB7fTtcbiAgICBjb25zdCBmb3JtYXRzID0gZm9ybWF0LnNwbGl0KHRoaXMuZm9ybWF0U2VwYXJhdG9yKTtcbiAgICBjb25zdCByZXN1bHQgPSBmb3JtYXRzLnJlZHVjZSgobWVtLCBmKSA9PiB7XG4gICAgICBjb25zdCB7XG4gICAgICAgIGZvcm1hdE5hbWUsXG4gICAgICAgIGZvcm1hdE9wdGlvbnNcbiAgICAgIH0gPSBwYXJzZUZvcm1hdFN0cihmKTtcbiAgICAgIGlmICh0aGlzLmZvcm1hdHNbZm9ybWF0TmFtZV0pIHtcbiAgICAgICAgbGV0IGZvcm1hdHRlZCA9IG1lbTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCB2YWxPcHRpb25zID0gb3B0aW9ucyAmJiBvcHRpb25zLmZvcm1hdFBhcmFtcyAmJiBvcHRpb25zLmZvcm1hdFBhcmFtc1tvcHRpb25zLmludGVycG9sYXRpb25rZXldIHx8IHt9O1xuICAgICAgICAgIGNvbnN0IGwgPSB2YWxPcHRpb25zLmxvY2FsZSB8fCB2YWxPcHRpb25zLmxuZyB8fCBvcHRpb25zLmxvY2FsZSB8fCBvcHRpb25zLmxuZyB8fCBsbmc7XG4gICAgICAgICAgZm9ybWF0dGVkID0gdGhpcy5mb3JtYXRzW2Zvcm1hdE5hbWVdKG1lbSwgbCwge1xuICAgICAgICAgICAgLi4uZm9ybWF0T3B0aW9ucyxcbiAgICAgICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgICAgICAuLi52YWxPcHRpb25zXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgdGhpcy5sb2dnZXIud2FybihlcnJvcik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZvcm1hdHRlZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLndhcm4oYHRoZXJlIHdhcyBubyBmb3JtYXQgZnVuY3Rpb24gZm9yICR7Zm9ybWF0TmFtZX1gKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBtZW07XG4gICAgfSwgdmFsdWUpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVtb3ZlUGVuZGluZyhxLCBuYW1lKSB7XG4gIGlmIChxLnBlbmRpbmdbbmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgIGRlbGV0ZSBxLnBlbmRpbmdbbmFtZV07XG4gICAgcS5wZW5kaW5nQ291bnQtLTtcbiAgfVxufVxuY2xhc3MgQ29ubmVjdG9yIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgY29uc3RydWN0b3IoYmFja2VuZCwgc3RvcmUsIHNlcnZpY2VzKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMyAmJiBhcmd1bWVudHNbM10gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1szXSA6IHt9O1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5iYWNrZW5kID0gYmFja2VuZDtcbiAgICB0aGlzLnN0b3JlID0gc3RvcmU7XG4gICAgdGhpcy5zZXJ2aWNlcyA9IHNlcnZpY2VzO1xuICAgIHRoaXMubGFuZ3VhZ2VVdGlscyA9IHNlcnZpY2VzLmxhbmd1YWdlVXRpbHM7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLmxvZ2dlciA9IGJhc2VMb2dnZXIuY3JlYXRlKCdiYWNrZW5kQ29ubmVjdG9yJyk7XG4gICAgdGhpcy53YWl0aW5nUmVhZHMgPSBbXTtcbiAgICB0aGlzLm1heFBhcmFsbGVsUmVhZHMgPSBvcHRpb25zLm1heFBhcmFsbGVsUmVhZHMgfHwgMTA7XG4gICAgdGhpcy5yZWFkaW5nQ2FsbHMgPSAwO1xuICAgIHRoaXMubWF4UmV0cmllcyA9IG9wdGlvbnMubWF4UmV0cmllcyA+PSAwID8gb3B0aW9ucy5tYXhSZXRyaWVzIDogNTtcbiAgICB0aGlzLnJldHJ5VGltZW91dCA9IG9wdGlvbnMucmV0cnlUaW1lb3V0ID49IDEgPyBvcHRpb25zLnJldHJ5VGltZW91dCA6IDM1MDtcbiAgICB0aGlzLnN0YXRlID0ge307XG4gICAgdGhpcy5xdWV1ZSA9IFtdO1xuICAgIGlmICh0aGlzLmJhY2tlbmQgJiYgdGhpcy5iYWNrZW5kLmluaXQpIHtcbiAgICAgIHRoaXMuYmFja2VuZC5pbml0KHNlcnZpY2VzLCBvcHRpb25zLmJhY2tlbmQsIG9wdGlvbnMpO1xuICAgIH1cbiAgfVxuICBxdWV1ZUxvYWQobGFuZ3VhZ2VzLCBuYW1lc3BhY2VzLCBvcHRpb25zLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IHRvTG9hZCA9IHt9O1xuICAgIGNvbnN0IHBlbmRpbmcgPSB7fTtcbiAgICBjb25zdCB0b0xvYWRMYW5ndWFnZXMgPSB7fTtcbiAgICBjb25zdCB0b0xvYWROYW1lc3BhY2VzID0ge307XG4gICAgbGFuZ3VhZ2VzLmZvckVhY2gobG5nID0+IHtcbiAgICAgIGxldCBoYXNBbGxOYW1lc3BhY2VzID0gdHJ1ZTtcbiAgICAgIG5hbWVzcGFjZXMuZm9yRWFjaChucyA9PiB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBgJHtsbmd9fCR7bnN9YDtcbiAgICAgICAgaWYgKCFvcHRpb25zLnJlbG9hZCAmJiB0aGlzLnN0b3JlLmhhc1Jlc291cmNlQnVuZGxlKGxuZywgbnMpKSB7XG4gICAgICAgICAgdGhpcy5zdGF0ZVtuYW1lXSA9IDI7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0ZVtuYW1lXSA8IDApIDsgZWxzZSBpZiAodGhpcy5zdGF0ZVtuYW1lXSA9PT0gMSkge1xuICAgICAgICAgIGlmIChwZW5kaW5nW25hbWVdID09PSB1bmRlZmluZWQpIHBlbmRpbmdbbmFtZV0gPSB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuc3RhdGVbbmFtZV0gPSAxO1xuICAgICAgICAgIGhhc0FsbE5hbWVzcGFjZXMgPSBmYWxzZTtcbiAgICAgICAgICBpZiAocGVuZGluZ1tuYW1lXSA9PT0gdW5kZWZpbmVkKSBwZW5kaW5nW25hbWVdID0gdHJ1ZTtcbiAgICAgICAgICBpZiAodG9Mb2FkW25hbWVdID09PSB1bmRlZmluZWQpIHRvTG9hZFtuYW1lXSA9IHRydWU7XG4gICAgICAgICAgaWYgKHRvTG9hZE5hbWVzcGFjZXNbbnNdID09PSB1bmRlZmluZWQpIHRvTG9hZE5hbWVzcGFjZXNbbnNdID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBpZiAoIWhhc0FsbE5hbWVzcGFjZXMpIHRvTG9hZExhbmd1YWdlc1tsbmddID0gdHJ1ZTtcbiAgICB9KTtcbiAgICBpZiAoT2JqZWN0LmtleXModG9Mb2FkKS5sZW5ndGggfHwgT2JqZWN0LmtleXMocGVuZGluZykubGVuZ3RoKSB7XG4gICAgICB0aGlzLnF1ZXVlLnB1c2goe1xuICAgICAgICBwZW5kaW5nLFxuICAgICAgICBwZW5kaW5nQ291bnQ6IE9iamVjdC5rZXlzKHBlbmRpbmcpLmxlbmd0aCxcbiAgICAgICAgbG9hZGVkOiB7fSxcbiAgICAgICAgZXJyb3JzOiBbXSxcbiAgICAgICAgY2FsbGJhY2tcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgdG9Mb2FkOiBPYmplY3Qua2V5cyh0b0xvYWQpLFxuICAgICAgcGVuZGluZzogT2JqZWN0LmtleXMocGVuZGluZyksXG4gICAgICB0b0xvYWRMYW5ndWFnZXM6IE9iamVjdC5rZXlzKHRvTG9hZExhbmd1YWdlcyksXG4gICAgICB0b0xvYWROYW1lc3BhY2VzOiBPYmplY3Qua2V5cyh0b0xvYWROYW1lc3BhY2VzKVxuICAgIH07XG4gIH1cbiAgbG9hZGVkKG5hbWUsIGVyciwgZGF0YSkge1xuICAgIGNvbnN0IHMgPSBuYW1lLnNwbGl0KCd8Jyk7XG4gICAgY29uc3QgbG5nID0gc1swXTtcbiAgICBjb25zdCBucyA9IHNbMV07XG4gICAgaWYgKGVycikgdGhpcy5lbWl0KCdmYWlsZWRMb2FkaW5nJywgbG5nLCBucywgZXJyKTtcbiAgICBpZiAoZGF0YSkge1xuICAgICAgdGhpcy5zdG9yZS5hZGRSZXNvdXJjZUJ1bmRsZShsbmcsIG5zLCBkYXRhKTtcbiAgICB9XG4gICAgdGhpcy5zdGF0ZVtuYW1lXSA9IGVyciA/IC0xIDogMjtcbiAgICBjb25zdCBsb2FkZWQgPSB7fTtcbiAgICB0aGlzLnF1ZXVlLmZvckVhY2gocSA9PiB7XG4gICAgICBwdXNoUGF0aChxLmxvYWRlZCwgW2xuZ10sIG5zKTtcbiAgICAgIHJlbW92ZVBlbmRpbmcocSwgbmFtZSk7XG4gICAgICBpZiAoZXJyKSBxLmVycm9ycy5wdXNoKGVycik7XG4gICAgICBpZiAocS5wZW5kaW5nQ291bnQgPT09IDAgJiYgIXEuZG9uZSkge1xuICAgICAgICBPYmplY3Qua2V5cyhxLmxvYWRlZCkuZm9yRWFjaChsID0+IHtcbiAgICAgICAgICBpZiAoIWxvYWRlZFtsXSkgbG9hZGVkW2xdID0ge307XG4gICAgICAgICAgY29uc3QgbG9hZGVkS2V5cyA9IHEubG9hZGVkW2xdO1xuICAgICAgICAgIGlmIChsb2FkZWRLZXlzLmxlbmd0aCkge1xuICAgICAgICAgICAgbG9hZGVkS2V5cy5mb3JFYWNoKG4gPT4ge1xuICAgICAgICAgICAgICBpZiAobG9hZGVkW2xdW25dID09PSB1bmRlZmluZWQpIGxvYWRlZFtsXVtuXSA9IHRydWU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBxLmRvbmUgPSB0cnVlO1xuICAgICAgICBpZiAocS5lcnJvcnMubGVuZ3RoKSB7XG4gICAgICAgICAgcS5jYWxsYmFjayhxLmVycm9ycyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcS5jYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy5lbWl0KCdsb2FkZWQnLCBsb2FkZWQpO1xuICAgIHRoaXMucXVldWUgPSB0aGlzLnF1ZXVlLmZpbHRlcihxID0+ICFxLmRvbmUpO1xuICB9XG4gIHJlYWQobG5nLCBucywgZmNOYW1lKSB7XG4gICAgbGV0IHRyaWVkID0gYXJndW1lbnRzLmxlbmd0aCA+IDMgJiYgYXJndW1lbnRzWzNdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbM10gOiAwO1xuICAgIGxldCB3YWl0ID0gYXJndW1lbnRzLmxlbmd0aCA+IDQgJiYgYXJndW1lbnRzWzRdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbNF0gOiB0aGlzLnJldHJ5VGltZW91dDtcbiAgICBsZXQgY2FsbGJhY2sgPSBhcmd1bWVudHMubGVuZ3RoID4gNSA/IGFyZ3VtZW50c1s1XSA6IHVuZGVmaW5lZDtcbiAgICBpZiAoIWxuZy5sZW5ndGgpIHJldHVybiBjYWxsYmFjayhudWxsLCB7fSk7XG4gICAgaWYgKHRoaXMucmVhZGluZ0NhbGxzID49IHRoaXMubWF4UGFyYWxsZWxSZWFkcykge1xuICAgICAgdGhpcy53YWl0aW5nUmVhZHMucHVzaCh7XG4gICAgICAgIGxuZyxcbiAgICAgICAgbnMsXG4gICAgICAgIGZjTmFtZSxcbiAgICAgICAgdHJpZWQsXG4gICAgICAgIHdhaXQsXG4gICAgICAgIGNhbGxiYWNrXG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5yZWFkaW5nQ2FsbHMrKztcbiAgICBjb25zdCByZXNvbHZlciA9IChlcnIsIGRhdGEpID0+IHtcbiAgICAgIHRoaXMucmVhZGluZ0NhbGxzLS07XG4gICAgICBpZiAodGhpcy53YWl0aW5nUmVhZHMubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCBuZXh0ID0gdGhpcy53YWl0aW5nUmVhZHMuc2hpZnQoKTtcbiAgICAgICAgdGhpcy5yZWFkKG5leHQubG5nLCBuZXh0Lm5zLCBuZXh0LmZjTmFtZSwgbmV4dC50cmllZCwgbmV4dC53YWl0LCBuZXh0LmNhbGxiYWNrKTtcbiAgICAgIH1cbiAgICAgIGlmIChlcnIgJiYgZGF0YSAmJiB0cmllZCA8IHRoaXMubWF4UmV0cmllcykge1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICB0aGlzLnJlYWQuY2FsbCh0aGlzLCBsbmcsIG5zLCBmY05hbWUsIHRyaWVkICsgMSwgd2FpdCAqIDIsIGNhbGxiYWNrKTtcbiAgICAgICAgfSwgd2FpdCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNhbGxiYWNrKGVyciwgZGF0YSk7XG4gICAgfTtcbiAgICBjb25zdCBmYyA9IHRoaXMuYmFja2VuZFtmY05hbWVdLmJpbmQodGhpcy5iYWNrZW5kKTtcbiAgICBpZiAoZmMubGVuZ3RoID09PSAyKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByID0gZmMobG5nLCBucyk7XG4gICAgICAgIGlmIChyICYmIHR5cGVvZiByLnRoZW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICByLnRoZW4oZGF0YSA9PiByZXNvbHZlcihudWxsLCBkYXRhKSkuY2F0Y2gocmVzb2x2ZXIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc29sdmVyKG51bGwsIHIpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgcmVzb2x2ZXIoZXJyKTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmV0dXJuIGZjKGxuZywgbnMsIHJlc29sdmVyKTtcbiAgfVxuICBwcmVwYXJlTG9hZGluZyhsYW5ndWFnZXMsIG5hbWVzcGFjZXMpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzJdIDoge307XG4gICAgbGV0IGNhbGxiYWNrID0gYXJndW1lbnRzLmxlbmd0aCA+IDMgPyBhcmd1bWVudHNbM10gOiB1bmRlZmluZWQ7XG4gICAgaWYgKCF0aGlzLmJhY2tlbmQpIHtcbiAgICAgIHRoaXMubG9nZ2VyLndhcm4oJ05vIGJhY2tlbmQgd2FzIGFkZGVkIHZpYSBpMThuZXh0LnVzZS4gV2lsbCBub3QgbG9hZCByZXNvdXJjZXMuJyk7XG4gICAgICByZXR1cm4gY2FsbGJhY2sgJiYgY2FsbGJhY2soKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBsYW5ndWFnZXMgPT09ICdzdHJpbmcnKSBsYW5ndWFnZXMgPSB0aGlzLmxhbmd1YWdlVXRpbHMudG9SZXNvbHZlSGllcmFyY2h5KGxhbmd1YWdlcyk7XG4gICAgaWYgKHR5cGVvZiBuYW1lc3BhY2VzID09PSAnc3RyaW5nJykgbmFtZXNwYWNlcyA9IFtuYW1lc3BhY2VzXTtcbiAgICBjb25zdCB0b0xvYWQgPSB0aGlzLnF1ZXVlTG9hZChsYW5ndWFnZXMsIG5hbWVzcGFjZXMsIG9wdGlvbnMsIGNhbGxiYWNrKTtcbiAgICBpZiAoIXRvTG9hZC50b0xvYWQubGVuZ3RoKSB7XG4gICAgICBpZiAoIXRvTG9hZC5wZW5kaW5nLmxlbmd0aCkgY2FsbGJhY2soKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICB0b0xvYWQudG9Mb2FkLmZvckVhY2gobmFtZSA9PiB7XG4gICAgICB0aGlzLmxvYWRPbmUobmFtZSk7XG4gICAgfSk7XG4gIH1cbiAgbG9hZChsYW5ndWFnZXMsIG5hbWVzcGFjZXMsIGNhbGxiYWNrKSB7XG4gICAgdGhpcy5wcmVwYXJlTG9hZGluZyhsYW5ndWFnZXMsIG5hbWVzcGFjZXMsIHt9LCBjYWxsYmFjayk7XG4gIH1cbiAgcmVsb2FkKGxhbmd1YWdlcywgbmFtZXNwYWNlcywgY2FsbGJhY2spIHtcbiAgICB0aGlzLnByZXBhcmVMb2FkaW5nKGxhbmd1YWdlcywgbmFtZXNwYWNlcywge1xuICAgICAgcmVsb2FkOiB0cnVlXG4gICAgfSwgY2FsbGJhY2spO1xuICB9XG4gIGxvYWRPbmUobmFtZSkge1xuICAgIGxldCBwcmVmaXggPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6ICcnO1xuICAgIGNvbnN0IHMgPSBuYW1lLnNwbGl0KCd8Jyk7XG4gICAgY29uc3QgbG5nID0gc1swXTtcbiAgICBjb25zdCBucyA9IHNbMV07XG4gICAgdGhpcy5yZWFkKGxuZywgbnMsICdyZWFkJywgdW5kZWZpbmVkLCB1bmRlZmluZWQsIChlcnIsIGRhdGEpID0+IHtcbiAgICAgIGlmIChlcnIpIHRoaXMubG9nZ2VyLndhcm4oYCR7cHJlZml4fWxvYWRpbmcgbmFtZXNwYWNlICR7bnN9IGZvciBsYW5ndWFnZSAke2xuZ30gZmFpbGVkYCwgZXJyKTtcbiAgICAgIGlmICghZXJyICYmIGRhdGEpIHRoaXMubG9nZ2VyLmxvZyhgJHtwcmVmaXh9bG9hZGVkIG5hbWVzcGFjZSAke25zfSBmb3IgbGFuZ3VhZ2UgJHtsbmd9YCwgZGF0YSk7XG4gICAgICB0aGlzLmxvYWRlZChuYW1lLCBlcnIsIGRhdGEpO1xuICAgIH0pO1xuICB9XG4gIHNhdmVNaXNzaW5nKGxhbmd1YWdlcywgbmFtZXNwYWNlLCBrZXksIGZhbGxiYWNrVmFsdWUsIGlzVXBkYXRlKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gNSAmJiBhcmd1bWVudHNbNV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1s1XSA6IHt9O1xuICAgIGxldCBjbGIgPSBhcmd1bWVudHMubGVuZ3RoID4gNiAmJiBhcmd1bWVudHNbNl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1s2XSA6ICgpID0+IHt9O1xuICAgIGlmICh0aGlzLnNlcnZpY2VzLnV0aWxzICYmIHRoaXMuc2VydmljZXMudXRpbHMuaGFzTG9hZGVkTmFtZXNwYWNlICYmICF0aGlzLnNlcnZpY2VzLnV0aWxzLmhhc0xvYWRlZE5hbWVzcGFjZShuYW1lc3BhY2UpKSB7XG4gICAgICB0aGlzLmxvZ2dlci53YXJuKGBkaWQgbm90IHNhdmUga2V5IFwiJHtrZXl9XCIgYXMgdGhlIG5hbWVzcGFjZSBcIiR7bmFtZXNwYWNlfVwiIHdhcyBub3QgeWV0IGxvYWRlZGAsICdUaGlzIG1lYW5zIHNvbWV0aGluZyBJUyBXUk9ORyBpbiB5b3VyIHNldHVwLiBZb3UgYWNjZXNzIHRoZSB0IGZ1bmN0aW9uIGJlZm9yZSBpMThuZXh0LmluaXQgLyBpMThuZXh0LmxvYWROYW1lc3BhY2UgLyBpMThuZXh0LmNoYW5nZUxhbmd1YWdlIHdhcyBkb25lLiBXYWl0IGZvciB0aGUgY2FsbGJhY2sgb3IgUHJvbWlzZSB0byByZXNvbHZlIGJlZm9yZSBhY2Nlc3NpbmcgaXQhISEnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGtleSA9PT0gdW5kZWZpbmVkIHx8IGtleSA9PT0gbnVsbCB8fCBrZXkgPT09ICcnKSByZXR1cm47XG4gICAgaWYgKHRoaXMuYmFja2VuZCAmJiB0aGlzLmJhY2tlbmQuY3JlYXRlKSB7XG4gICAgICBjb25zdCBvcHRzID0ge1xuICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICBpc1VwZGF0ZVxuICAgICAgfTtcbiAgICAgIGNvbnN0IGZjID0gdGhpcy5iYWNrZW5kLmNyZWF0ZS5iaW5kKHRoaXMuYmFja2VuZCk7XG4gICAgICBpZiAoZmMubGVuZ3RoIDwgNikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGxldCByO1xuICAgICAgICAgIGlmIChmYy5sZW5ndGggPT09IDUpIHtcbiAgICAgICAgICAgIHIgPSBmYyhsYW5ndWFnZXMsIG5hbWVzcGFjZSwga2V5LCBmYWxsYmFja1ZhbHVlLCBvcHRzKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgciA9IGZjKGxhbmd1YWdlcywgbmFtZXNwYWNlLCBrZXksIGZhbGxiYWNrVmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAociAmJiB0eXBlb2Ygci50aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByLnRoZW4oZGF0YSA9PiBjbGIobnVsbCwgZGF0YSkpLmNhdGNoKGNsYik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNsYihudWxsLCByKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIGNsYihlcnIpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmYyhsYW5ndWFnZXMsIG5hbWVzcGFjZSwga2V5LCBmYWxsYmFja1ZhbHVlLCBjbGIsIG9wdHMpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIWxhbmd1YWdlcyB8fCAhbGFuZ3VhZ2VzWzBdKSByZXR1cm47XG4gICAgdGhpcy5zdG9yZS5hZGRSZXNvdXJjZShsYW5ndWFnZXNbMF0sIG5hbWVzcGFjZSwga2V5LCBmYWxsYmFja1ZhbHVlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXQoKSB7XG4gIHJldHVybiB7XG4gICAgZGVidWc6IGZhbHNlLFxuICAgIGluaXRJbW1lZGlhdGU6IHRydWUsXG4gICAgbnM6IFsndHJhbnNsYXRpb24nXSxcbiAgICBkZWZhdWx0TlM6IFsndHJhbnNsYXRpb24nXSxcbiAgICBmYWxsYmFja0xuZzogWydkZXYnXSxcbiAgICBmYWxsYmFja05TOiBmYWxzZSxcbiAgICBzdXBwb3J0ZWRMbmdzOiBmYWxzZSxcbiAgICBub25FeHBsaWNpdFN1cHBvcnRlZExuZ3M6IGZhbHNlLFxuICAgIGxvYWQ6ICdhbGwnLFxuICAgIHByZWxvYWQ6IGZhbHNlLFxuICAgIHNpbXBsaWZ5UGx1cmFsU3VmZml4OiB0cnVlLFxuICAgIGtleVNlcGFyYXRvcjogJy4nLFxuICAgIG5zU2VwYXJhdG9yOiAnOicsXG4gICAgcGx1cmFsU2VwYXJhdG9yOiAnXycsXG4gICAgY29udGV4dFNlcGFyYXRvcjogJ18nLFxuICAgIHBhcnRpYWxCdW5kbGVkTGFuZ3VhZ2VzOiBmYWxzZSxcbiAgICBzYXZlTWlzc2luZzogZmFsc2UsXG4gICAgdXBkYXRlTWlzc2luZzogZmFsc2UsXG4gICAgc2F2ZU1pc3NpbmdUbzogJ2ZhbGxiYWNrJyxcbiAgICBzYXZlTWlzc2luZ1BsdXJhbHM6IHRydWUsXG4gICAgbWlzc2luZ0tleUhhbmRsZXI6IGZhbHNlLFxuICAgIG1pc3NpbmdJbnRlcnBvbGF0aW9uSGFuZGxlcjogZmFsc2UsXG4gICAgcG9zdFByb2Nlc3M6IGZhbHNlLFxuICAgIHBvc3RQcm9jZXNzUGFzc1Jlc29sdmVkOiBmYWxzZSxcbiAgICByZXR1cm5OdWxsOiBmYWxzZSxcbiAgICByZXR1cm5FbXB0eVN0cmluZzogdHJ1ZSxcbiAgICByZXR1cm5PYmplY3RzOiBmYWxzZSxcbiAgICBqb2luQXJyYXlzOiBmYWxzZSxcbiAgICByZXR1cm5lZE9iamVjdEhhbmRsZXI6IGZhbHNlLFxuICAgIHBhcnNlTWlzc2luZ0tleUhhbmRsZXI6IGZhbHNlLFxuICAgIGFwcGVuZE5hbWVzcGFjZVRvTWlzc2luZ0tleTogZmFsc2UsXG4gICAgYXBwZW5kTmFtZXNwYWNlVG9DSU1vZGU6IGZhbHNlLFxuICAgIG92ZXJsb2FkVHJhbnNsYXRpb25PcHRpb25IYW5kbGVyOiBmdW5jdGlvbiBoYW5kbGUoYXJncykge1xuICAgICAgbGV0IHJldCA9IHt9O1xuICAgICAgaWYgKHR5cGVvZiBhcmdzWzFdID09PSAnb2JqZWN0JykgcmV0ID0gYXJnc1sxXTtcbiAgICAgIGlmICh0eXBlb2YgYXJnc1sxXSA9PT0gJ3N0cmluZycpIHJldC5kZWZhdWx0VmFsdWUgPSBhcmdzWzFdO1xuICAgICAgaWYgKHR5cGVvZiBhcmdzWzJdID09PSAnc3RyaW5nJykgcmV0LnREZXNjcmlwdGlvbiA9IGFyZ3NbMl07XG4gICAgICBpZiAodHlwZW9mIGFyZ3NbMl0gPT09ICdvYmplY3QnIHx8IHR5cGVvZiBhcmdzWzNdID09PSAnb2JqZWN0Jykge1xuICAgICAgICBjb25zdCBvcHRpb25zID0gYXJnc1szXSB8fCBhcmdzWzJdO1xuICAgICAgICBPYmplY3Qua2V5cyhvcHRpb25zKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgICAgcmV0W2tleV0gPSBvcHRpb25zW2tleV07XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJldDtcbiAgICB9LFxuICAgIGludGVycG9sYXRpb246IHtcbiAgICAgIGVzY2FwZVZhbHVlOiB0cnVlLFxuICAgICAgZm9ybWF0OiAodmFsdWUsIGZvcm1hdCwgbG5nLCBvcHRpb25zKSA9PiB2YWx1ZSxcbiAgICAgIHByZWZpeDogJ3t7JyxcbiAgICAgIHN1ZmZpeDogJ319JyxcbiAgICAgIGZvcm1hdFNlcGFyYXRvcjogJywnLFxuICAgICAgdW5lc2NhcGVQcmVmaXg6ICctJyxcbiAgICAgIG5lc3RpbmdQcmVmaXg6ICckdCgnLFxuICAgICAgbmVzdGluZ1N1ZmZpeDogJyknLFxuICAgICAgbmVzdGluZ09wdGlvbnNTZXBhcmF0b3I6ICcsJyxcbiAgICAgIG1heFJlcGxhY2VzOiAxMDAwLFxuICAgICAgc2tpcE9uVmFyaWFibGVzOiB0cnVlXG4gICAgfVxuICB9O1xufVxuZnVuY3Rpb24gdHJhbnNmb3JtT3B0aW9ucyhvcHRpb25zKSB7XG4gIGlmICh0eXBlb2Ygb3B0aW9ucy5ucyA9PT0gJ3N0cmluZycpIG9wdGlvbnMubnMgPSBbb3B0aW9ucy5uc107XG4gIGlmICh0eXBlb2Ygb3B0aW9ucy5mYWxsYmFja0xuZyA9PT0gJ3N0cmluZycpIG9wdGlvbnMuZmFsbGJhY2tMbmcgPSBbb3B0aW9ucy5mYWxsYmFja0xuZ107XG4gIGlmICh0eXBlb2Ygb3B0aW9ucy5mYWxsYmFja05TID09PSAnc3RyaW5nJykgb3B0aW9ucy5mYWxsYmFja05TID0gW29wdGlvbnMuZmFsbGJhY2tOU107XG4gIGlmIChvcHRpb25zLnN1cHBvcnRlZExuZ3MgJiYgb3B0aW9ucy5zdXBwb3J0ZWRMbmdzLmluZGV4T2YoJ2NpbW9kZScpIDwgMCkge1xuICAgIG9wdGlvbnMuc3VwcG9ydGVkTG5ncyA9IG9wdGlvbnMuc3VwcG9ydGVkTG5ncy5jb25jYXQoWydjaW1vZGUnXSk7XG4gIH1cbiAgcmV0dXJuIG9wdGlvbnM7XG59XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuZnVuY3Rpb24gYmluZE1lbWJlckZ1bmN0aW9ucyhpbnN0KSB7XG4gIGNvbnN0IG1lbXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhPYmplY3QuZ2V0UHJvdG90eXBlT2YoaW5zdCkpO1xuICBtZW1zLmZvckVhY2gobWVtID0+IHtcbiAgICBpZiAodHlwZW9mIGluc3RbbWVtXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgaW5zdFttZW1dID0gaW5zdFttZW1dLmJpbmQoaW5zdCk7XG4gICAgfVxuICB9KTtcbn1cbmNsYXNzIEkxOG4gZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDoge307XG4gICAgbGV0IGNhbGxiYWNrID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgPyBhcmd1bWVudHNbMV0gOiB1bmRlZmluZWQ7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLm9wdGlvbnMgPSB0cmFuc2Zvcm1PcHRpb25zKG9wdGlvbnMpO1xuICAgIHRoaXMuc2VydmljZXMgPSB7fTtcbiAgICB0aGlzLmxvZ2dlciA9IGJhc2VMb2dnZXI7XG4gICAgdGhpcy5tb2R1bGVzID0ge1xuICAgICAgZXh0ZXJuYWw6IFtdXG4gICAgfTtcbiAgICBiaW5kTWVtYmVyRnVuY3Rpb25zKHRoaXMpO1xuICAgIGlmIChjYWxsYmFjayAmJiAhdGhpcy5pc0luaXRpYWxpemVkICYmICFvcHRpb25zLmlzQ2xvbmUpIHtcbiAgICAgIGlmICghdGhpcy5vcHRpb25zLmluaXRJbW1lZGlhdGUpIHtcbiAgICAgICAgdGhpcy5pbml0KG9wdGlvbnMsIGNhbGxiYWNrKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5pbml0KG9wdGlvbnMsIGNhbGxiYWNrKTtcbiAgICAgIH0sIDApO1xuICAgIH1cbiAgfVxuICBpbml0KCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IHt9O1xuICAgIGxldCBjYWxsYmFjayA9IGFyZ3VtZW50cy5sZW5ndGggPiAxID8gYXJndW1lbnRzWzFdIDogdW5kZWZpbmVkO1xuICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY2FsbGJhY2sgPSBvcHRpb25zO1xuICAgICAgb3B0aW9ucyA9IHt9O1xuICAgIH1cbiAgICBpZiAoIW9wdGlvbnMuZGVmYXVsdE5TICYmIG9wdGlvbnMuZGVmYXVsdE5TICE9PSBmYWxzZSAmJiBvcHRpb25zLm5zKSB7XG4gICAgICBpZiAodHlwZW9mIG9wdGlvbnMubnMgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIG9wdGlvbnMuZGVmYXVsdE5TID0gb3B0aW9ucy5ucztcbiAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5ucy5pbmRleE9mKCd0cmFuc2xhdGlvbicpIDwgMCkge1xuICAgICAgICBvcHRpb25zLmRlZmF1bHROUyA9IG9wdGlvbnMubnNbMF07XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGRlZk9wdHMgPSBnZXQoKTtcbiAgICB0aGlzLm9wdGlvbnMgPSB7XG4gICAgICAuLi5kZWZPcHRzLFxuICAgICAgLi4udGhpcy5vcHRpb25zLFxuICAgICAgLi4udHJhbnNmb3JtT3B0aW9ucyhvcHRpb25zKVxuICAgIH07XG4gICAgaWYgKHRoaXMub3B0aW9ucy5jb21wYXRpYmlsaXR5QVBJICE9PSAndjEnKSB7XG4gICAgICB0aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbiA9IHtcbiAgICAgICAgLi4uZGVmT3B0cy5pbnRlcnBvbGF0aW9uLFxuICAgICAgICAuLi50aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvblxuICAgICAgfTtcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMua2V5U2VwYXJhdG9yICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMub3B0aW9ucy51c2VyRGVmaW5lZEtleVNlcGFyYXRvciA9IG9wdGlvbnMua2V5U2VwYXJhdG9yO1xuICAgIH1cbiAgICBpZiAob3B0aW9ucy5uc1NlcGFyYXRvciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLm9wdGlvbnMudXNlckRlZmluZWROc1NlcGFyYXRvciA9IG9wdGlvbnMubnNTZXBhcmF0b3I7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNyZWF0ZUNsYXNzT25EZW1hbmQoQ2xhc3NPck9iamVjdCkge1xuICAgICAgaWYgKCFDbGFzc09yT2JqZWN0KSByZXR1cm4gbnVsbDtcbiAgICAgIGlmICh0eXBlb2YgQ2xhc3NPck9iamVjdCA9PT0gJ2Z1bmN0aW9uJykgcmV0dXJuIG5ldyBDbGFzc09yT2JqZWN0KCk7XG4gICAgICByZXR1cm4gQ2xhc3NPck9iamVjdDtcbiAgICB9XG4gICAgaWYgKCF0aGlzLm9wdGlvbnMuaXNDbG9uZSkge1xuICAgICAgaWYgKHRoaXMubW9kdWxlcy5sb2dnZXIpIHtcbiAgICAgICAgYmFzZUxvZ2dlci5pbml0KGNyZWF0ZUNsYXNzT25EZW1hbmQodGhpcy5tb2R1bGVzLmxvZ2dlciksIHRoaXMub3B0aW9ucyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBiYXNlTG9nZ2VyLmluaXQobnVsbCwgdGhpcy5vcHRpb25zKTtcbiAgICAgIH1cbiAgICAgIGxldCBmb3JtYXR0ZXI7XG4gICAgICBpZiAodGhpcy5tb2R1bGVzLmZvcm1hdHRlcikge1xuICAgICAgICBmb3JtYXR0ZXIgPSB0aGlzLm1vZHVsZXMuZm9ybWF0dGVyO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgSW50bCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZm9ybWF0dGVyID0gRm9ybWF0dGVyO1xuICAgICAgfVxuICAgICAgY29uc3QgbHUgPSBuZXcgTGFuZ3VhZ2VVdGlsKHRoaXMub3B0aW9ucyk7XG4gICAgICB0aGlzLnN0b3JlID0gbmV3IFJlc291cmNlU3RvcmUodGhpcy5vcHRpb25zLnJlc291cmNlcywgdGhpcy5vcHRpb25zKTtcbiAgICAgIGNvbnN0IHMgPSB0aGlzLnNlcnZpY2VzO1xuICAgICAgcy5sb2dnZXIgPSBiYXNlTG9nZ2VyO1xuICAgICAgcy5yZXNvdXJjZVN0b3JlID0gdGhpcy5zdG9yZTtcbiAgICAgIHMubGFuZ3VhZ2VVdGlscyA9IGx1O1xuICAgICAgcy5wbHVyYWxSZXNvbHZlciA9IG5ldyBQbHVyYWxSZXNvbHZlcihsdSwge1xuICAgICAgICBwcmVwZW5kOiB0aGlzLm9wdGlvbnMucGx1cmFsU2VwYXJhdG9yLFxuICAgICAgICBjb21wYXRpYmlsaXR5SlNPTjogdGhpcy5vcHRpb25zLmNvbXBhdGliaWxpdHlKU09OLFxuICAgICAgICBzaW1wbGlmeVBsdXJhbFN1ZmZpeDogdGhpcy5vcHRpb25zLnNpbXBsaWZ5UGx1cmFsU3VmZml4XG4gICAgICB9KTtcbiAgICAgIGlmIChmb3JtYXR0ZXIgJiYgKCF0aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbi5mb3JtYXQgfHwgdGhpcy5vcHRpb25zLmludGVycG9sYXRpb24uZm9ybWF0ID09PSBkZWZPcHRzLmludGVycG9sYXRpb24uZm9ybWF0KSkge1xuICAgICAgICBzLmZvcm1hdHRlciA9IGNyZWF0ZUNsYXNzT25EZW1hbmQoZm9ybWF0dGVyKTtcbiAgICAgICAgcy5mb3JtYXR0ZXIuaW5pdChzLCB0aGlzLm9wdGlvbnMpO1xuICAgICAgICB0aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbi5mb3JtYXQgPSBzLmZvcm1hdHRlci5mb3JtYXQuYmluZChzLmZvcm1hdHRlcik7XG4gICAgICB9XG4gICAgICBzLmludGVycG9sYXRvciA9IG5ldyBJbnRlcnBvbGF0b3IodGhpcy5vcHRpb25zKTtcbiAgICAgIHMudXRpbHMgPSB7XG4gICAgICAgIGhhc0xvYWRlZE5hbWVzcGFjZTogdGhpcy5oYXNMb2FkZWROYW1lc3BhY2UuYmluZCh0aGlzKVxuICAgICAgfTtcbiAgICAgIHMuYmFja2VuZENvbm5lY3RvciA9IG5ldyBDb25uZWN0b3IoY3JlYXRlQ2xhc3NPbkRlbWFuZCh0aGlzLm1vZHVsZXMuYmFja2VuZCksIHMucmVzb3VyY2VTdG9yZSwgcywgdGhpcy5vcHRpb25zKTtcbiAgICAgIHMuYmFja2VuZENvbm5lY3Rvci5vbignKicsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IG5ldyBBcnJheShfbGVuID4gMSA/IF9sZW4gLSAxIDogMCksIF9rZXkgPSAxOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG4gICAgICAgICAgYXJnc1tfa2V5IC0gMV0gPSBhcmd1bWVudHNbX2tleV07XG4gICAgICAgIH1cbiAgICAgICAgX3RoaXMuZW1pdChldmVudCwgLi4uYXJncyk7XG4gICAgICB9KTtcbiAgICAgIGlmICh0aGlzLm1vZHVsZXMubGFuZ3VhZ2VEZXRlY3Rvcikge1xuICAgICAgICBzLmxhbmd1YWdlRGV0ZWN0b3IgPSBjcmVhdGVDbGFzc09uRGVtYW5kKHRoaXMubW9kdWxlcy5sYW5ndWFnZURldGVjdG9yKTtcbiAgICAgICAgaWYgKHMubGFuZ3VhZ2VEZXRlY3Rvci5pbml0KSBzLmxhbmd1YWdlRGV0ZWN0b3IuaW5pdChzLCB0aGlzLm9wdGlvbnMuZGV0ZWN0aW9uLCB0aGlzLm9wdGlvbnMpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMubW9kdWxlcy5pMThuRm9ybWF0KSB7XG4gICAgICAgIHMuaTE4bkZvcm1hdCA9IGNyZWF0ZUNsYXNzT25EZW1hbmQodGhpcy5tb2R1bGVzLmkxOG5Gb3JtYXQpO1xuICAgICAgICBpZiAocy5pMThuRm9ybWF0LmluaXQpIHMuaTE4bkZvcm1hdC5pbml0KHRoaXMpO1xuICAgICAgfVxuICAgICAgdGhpcy50cmFuc2xhdG9yID0gbmV3IFRyYW5zbGF0b3IodGhpcy5zZXJ2aWNlcywgdGhpcy5vcHRpb25zKTtcbiAgICAgIHRoaXMudHJhbnNsYXRvci5vbignKicsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBmb3IgKHZhciBfbGVuMiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBuZXcgQXJyYXkoX2xlbjIgPiAxID8gX2xlbjIgLSAxIDogMCksIF9rZXkyID0gMTsgX2tleTIgPCBfbGVuMjsgX2tleTIrKykge1xuICAgICAgICAgIGFyZ3NbX2tleTIgLSAxXSA9IGFyZ3VtZW50c1tfa2V5Ml07XG4gICAgICAgIH1cbiAgICAgICAgX3RoaXMuZW1pdChldmVudCwgLi4uYXJncyk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMubW9kdWxlcy5leHRlcm5hbC5mb3JFYWNoKG0gPT4ge1xuICAgICAgICBpZiAobS5pbml0KSBtLmluaXQodGhpcyk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgdGhpcy5mb3JtYXQgPSB0aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbi5mb3JtYXQ7XG4gICAgaWYgKCFjYWxsYmFjaykgY2FsbGJhY2sgPSBub29wO1xuICAgIGlmICh0aGlzLm9wdGlvbnMuZmFsbGJhY2tMbmcgJiYgIXRoaXMuc2VydmljZXMubGFuZ3VhZ2VEZXRlY3RvciAmJiAhdGhpcy5vcHRpb25zLmxuZykge1xuICAgICAgY29uc3QgY29kZXMgPSB0aGlzLnNlcnZpY2VzLmxhbmd1YWdlVXRpbHMuZ2V0RmFsbGJhY2tDb2Rlcyh0aGlzLm9wdGlvbnMuZmFsbGJhY2tMbmcpO1xuICAgICAgaWYgKGNvZGVzLmxlbmd0aCA+IDAgJiYgY29kZXNbMF0gIT09ICdkZXYnKSB0aGlzLm9wdGlvbnMubG5nID0gY29kZXNbMF07XG4gICAgfVxuICAgIGlmICghdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZURldGVjdG9yICYmICF0aGlzLm9wdGlvbnMubG5nKSB7XG4gICAgICB0aGlzLmxvZ2dlci53YXJuKCdpbml0OiBubyBsYW5ndWFnZURldGVjdG9yIGlzIHVzZWQgYW5kIG5vIGxuZyBpcyBkZWZpbmVkJyk7XG4gICAgfVxuICAgIGNvbnN0IHN0b3JlQXBpID0gWydnZXRSZXNvdXJjZScsICdoYXNSZXNvdXJjZUJ1bmRsZScsICdnZXRSZXNvdXJjZUJ1bmRsZScsICdnZXREYXRhQnlMYW5ndWFnZSddO1xuICAgIHN0b3JlQXBpLmZvckVhY2goZmNOYW1lID0+IHtcbiAgICAgIHRoaXNbZmNOYW1lXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIF90aGlzLnN0b3JlW2ZjTmFtZV0oLi4uYXJndW1lbnRzKTtcbiAgICAgIH07XG4gICAgfSk7XG4gICAgY29uc3Qgc3RvcmVBcGlDaGFpbmVkID0gWydhZGRSZXNvdXJjZScsICdhZGRSZXNvdXJjZXMnLCAnYWRkUmVzb3VyY2VCdW5kbGUnLCAncmVtb3ZlUmVzb3VyY2VCdW5kbGUnXTtcbiAgICBzdG9yZUFwaUNoYWluZWQuZm9yRWFjaChmY05hbWUgPT4ge1xuICAgICAgdGhpc1tmY05hbWVdID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBfdGhpcy5zdG9yZVtmY05hbWVdKC4uLmFyZ3VtZW50cyk7XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICAgIH07XG4gICAgfSk7XG4gICAgY29uc3QgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIGNvbnN0IGxvYWQgPSAoKSA9PiB7XG4gICAgICBjb25zdCBmaW5pc2ggPSAoZXJyLCB0KSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmlzSW5pdGlhbGl6ZWQgJiYgIXRoaXMuaW5pdGlhbGl6ZWRTdG9yZU9uY2UpIHRoaXMubG9nZ2VyLndhcm4oJ2luaXQ6IGkxOG5leHQgaXMgYWxyZWFkeSBpbml0aWFsaXplZC4gWW91IHNob3VsZCBjYWxsIGluaXQganVzdCBvbmNlIScpO1xuICAgICAgICB0aGlzLmlzSW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5pc0Nsb25lKSB0aGlzLmxvZ2dlci5sb2coJ2luaXRpYWxpemVkJywgdGhpcy5vcHRpb25zKTtcbiAgICAgICAgdGhpcy5lbWl0KCdpbml0aWFsaXplZCcsIHRoaXMub3B0aW9ucyk7XG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUodCk7XG4gICAgICAgIGNhbGxiYWNrKGVyciwgdCk7XG4gICAgICB9O1xuICAgICAgaWYgKHRoaXMubGFuZ3VhZ2VzICYmIHRoaXMub3B0aW9ucy5jb21wYXRpYmlsaXR5QVBJICE9PSAndjEnICYmICF0aGlzLmlzSW5pdGlhbGl6ZWQpIHJldHVybiBmaW5pc2gobnVsbCwgdGhpcy50LmJpbmQodGhpcykpO1xuICAgICAgdGhpcy5jaGFuZ2VMYW5ndWFnZSh0aGlzLm9wdGlvbnMubG5nLCBmaW5pc2gpO1xuICAgIH07XG4gICAgaWYgKHRoaXMub3B0aW9ucy5yZXNvdXJjZXMgfHwgIXRoaXMub3B0aW9ucy5pbml0SW1tZWRpYXRlKSB7XG4gICAgICBsb2FkKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNldFRpbWVvdXQobG9hZCwgMCk7XG4gICAgfVxuICAgIHJldHVybiBkZWZlcnJlZDtcbiAgfVxuICBsb2FkUmVzb3VyY2VzKGxhbmd1YWdlKSB7XG4gICAgbGV0IGNhbGxiYWNrID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiBub29wO1xuICAgIGxldCB1c2VkQ2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICBjb25zdCB1c2VkTG5nID0gdHlwZW9mIGxhbmd1YWdlID09PSAnc3RyaW5nJyA/IGxhbmd1YWdlIDogdGhpcy5sYW5ndWFnZTtcbiAgICBpZiAodHlwZW9mIGxhbmd1YWdlID09PSAnZnVuY3Rpb24nKSB1c2VkQ2FsbGJhY2sgPSBsYW5ndWFnZTtcbiAgICBpZiAoIXRoaXMub3B0aW9ucy5yZXNvdXJjZXMgfHwgdGhpcy5vcHRpb25zLnBhcnRpYWxCdW5kbGVkTGFuZ3VhZ2VzKSB7XG4gICAgICBpZiAodXNlZExuZyAmJiB1c2VkTG5nLnRvTG93ZXJDYXNlKCkgPT09ICdjaW1vZGUnICYmICghdGhpcy5vcHRpb25zLnByZWxvYWQgfHwgdGhpcy5vcHRpb25zLnByZWxvYWQubGVuZ3RoID09PSAwKSkgcmV0dXJuIHVzZWRDYWxsYmFjaygpO1xuICAgICAgY29uc3QgdG9Mb2FkID0gW107XG4gICAgICBjb25zdCBhcHBlbmQgPSBsbmcgPT4ge1xuICAgICAgICBpZiAoIWxuZykgcmV0dXJuO1xuICAgICAgICBpZiAobG5nID09PSAnY2ltb2RlJykgcmV0dXJuO1xuICAgICAgICBjb25zdCBsbmdzID0gdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZVV0aWxzLnRvUmVzb2x2ZUhpZXJhcmNoeShsbmcpO1xuICAgICAgICBsbmdzLmZvckVhY2gobCA9PiB7XG4gICAgICAgICAgaWYgKGwgPT09ICdjaW1vZGUnKSByZXR1cm47XG4gICAgICAgICAgaWYgKHRvTG9hZC5pbmRleE9mKGwpIDwgMCkgdG9Mb2FkLnB1c2gobCk7XG4gICAgICAgIH0pO1xuICAgICAgfTtcbiAgICAgIGlmICghdXNlZExuZykge1xuICAgICAgICBjb25zdCBmYWxsYmFja3MgPSB0aGlzLnNlcnZpY2VzLmxhbmd1YWdlVXRpbHMuZ2V0RmFsbGJhY2tDb2Rlcyh0aGlzLm9wdGlvbnMuZmFsbGJhY2tMbmcpO1xuICAgICAgICBmYWxsYmFja3MuZm9yRWFjaChsID0+IGFwcGVuZChsKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhcHBlbmQodXNlZExuZyk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5vcHRpb25zLnByZWxvYWQpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLnByZWxvYWQuZm9yRWFjaChsID0+IGFwcGVuZChsKSk7XG4gICAgICB9XG4gICAgICB0aGlzLnNlcnZpY2VzLmJhY2tlbmRDb25uZWN0b3IubG9hZCh0b0xvYWQsIHRoaXMub3B0aW9ucy5ucywgZSA9PiB7XG4gICAgICAgIGlmICghZSAmJiAhdGhpcy5yZXNvbHZlZExhbmd1YWdlICYmIHRoaXMubGFuZ3VhZ2UpIHRoaXMuc2V0UmVzb2x2ZWRMYW5ndWFnZSh0aGlzLmxhbmd1YWdlKTtcbiAgICAgICAgdXNlZENhbGxiYWNrKGUpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHVzZWRDYWxsYmFjayhudWxsKTtcbiAgICB9XG4gIH1cbiAgcmVsb2FkUmVzb3VyY2VzKGxuZ3MsIG5zLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBpZiAoIWxuZ3MpIGxuZ3MgPSB0aGlzLmxhbmd1YWdlcztcbiAgICBpZiAoIW5zKSBucyA9IHRoaXMub3B0aW9ucy5ucztcbiAgICBpZiAoIWNhbGxiYWNrKSBjYWxsYmFjayA9IG5vb3A7XG4gICAgdGhpcy5zZXJ2aWNlcy5iYWNrZW5kQ29ubmVjdG9yLnJlbG9hZChsbmdzLCBucywgZXJyID0+IHtcbiAgICAgIGRlZmVycmVkLnJlc29sdmUoKTtcbiAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgfSk7XG4gICAgcmV0dXJuIGRlZmVycmVkO1xuICB9XG4gIHVzZShtb2R1bGUpIHtcbiAgICBpZiAoIW1vZHVsZSkgdGhyb3cgbmV3IEVycm9yKCdZb3UgYXJlIHBhc3NpbmcgYW4gdW5kZWZpbmVkIG1vZHVsZSEgUGxlYXNlIGNoZWNrIHRoZSBvYmplY3QgeW91IGFyZSBwYXNzaW5nIHRvIGkxOG5leHQudXNlKCknKTtcbiAgICBpZiAoIW1vZHVsZS50eXBlKSB0aHJvdyBuZXcgRXJyb3IoJ1lvdSBhcmUgcGFzc2luZyBhIHdyb25nIG1vZHVsZSEgUGxlYXNlIGNoZWNrIHRoZSBvYmplY3QgeW91IGFyZSBwYXNzaW5nIHRvIGkxOG5leHQudXNlKCknKTtcbiAgICBpZiAobW9kdWxlLnR5cGUgPT09ICdiYWNrZW5kJykge1xuICAgICAgdGhpcy5tb2R1bGVzLmJhY2tlbmQgPSBtb2R1bGU7XG4gICAgfVxuICAgIGlmIChtb2R1bGUudHlwZSA9PT0gJ2xvZ2dlcicgfHwgbW9kdWxlLmxvZyAmJiBtb2R1bGUud2FybiAmJiBtb2R1bGUuZXJyb3IpIHtcbiAgICAgIHRoaXMubW9kdWxlcy5sb2dnZXIgPSBtb2R1bGU7XG4gICAgfVxuICAgIGlmIChtb2R1bGUudHlwZSA9PT0gJ2xhbmd1YWdlRGV0ZWN0b3InKSB7XG4gICAgICB0aGlzLm1vZHVsZXMubGFuZ3VhZ2VEZXRlY3RvciA9IG1vZHVsZTtcbiAgICB9XG4gICAgaWYgKG1vZHVsZS50eXBlID09PSAnaTE4bkZvcm1hdCcpIHtcbiAgICAgIHRoaXMubW9kdWxlcy5pMThuRm9ybWF0ID0gbW9kdWxlO1xuICAgIH1cbiAgICBpZiAobW9kdWxlLnR5cGUgPT09ICdwb3N0UHJvY2Vzc29yJykge1xuICAgICAgcG9zdFByb2Nlc3Nvci5hZGRQb3N0UHJvY2Vzc29yKG1vZHVsZSk7XG4gICAgfVxuICAgIGlmIChtb2R1bGUudHlwZSA9PT0gJ2Zvcm1hdHRlcicpIHtcbiAgICAgIHRoaXMubW9kdWxlcy5mb3JtYXR0ZXIgPSBtb2R1bGU7XG4gICAgfVxuICAgIGlmIChtb2R1bGUudHlwZSA9PT0gJzNyZFBhcnR5Jykge1xuICAgICAgdGhpcy5tb2R1bGVzLmV4dGVybmFsLnB1c2gobW9kdWxlKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgc2V0UmVzb2x2ZWRMYW5ndWFnZShsKSB7XG4gICAgaWYgKCFsIHx8ICF0aGlzLmxhbmd1YWdlcykgcmV0dXJuO1xuICAgIGlmIChbJ2NpbW9kZScsICdkZXYnXS5pbmRleE9mKGwpID4gLTEpIHJldHVybjtcbiAgICBmb3IgKGxldCBsaSA9IDA7IGxpIDwgdGhpcy5sYW5ndWFnZXMubGVuZ3RoOyBsaSsrKSB7XG4gICAgICBjb25zdCBsbmdJbkxuZ3MgPSB0aGlzLmxhbmd1YWdlc1tsaV07XG4gICAgICBpZiAoWydjaW1vZGUnLCAnZGV2J10uaW5kZXhPZihsbmdJbkxuZ3MpID4gLTEpIGNvbnRpbnVlO1xuICAgICAgaWYgKHRoaXMuc3RvcmUuaGFzTGFuZ3VhZ2VTb21lVHJhbnNsYXRpb25zKGxuZ0luTG5ncykpIHtcbiAgICAgICAgdGhpcy5yZXNvbHZlZExhbmd1YWdlID0gbG5nSW5MbmdzO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgY2hhbmdlTGFuZ3VhZ2UobG5nLCBjYWxsYmFjaykge1xuICAgIHZhciBfdGhpczIgPSB0aGlzO1xuICAgIHRoaXMuaXNMYW5ndWFnZUNoYW5naW5nVG8gPSBsbmc7XG4gICAgY29uc3QgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIHRoaXMuZW1pdCgnbGFuZ3VhZ2VDaGFuZ2luZycsIGxuZyk7XG4gICAgY29uc3Qgc2V0TG5nUHJvcHMgPSBsID0+IHtcbiAgICAgIHRoaXMubGFuZ3VhZ2UgPSBsO1xuICAgICAgdGhpcy5sYW5ndWFnZXMgPSB0aGlzLnNlcnZpY2VzLmxhbmd1YWdlVXRpbHMudG9SZXNvbHZlSGllcmFyY2h5KGwpO1xuICAgICAgdGhpcy5yZXNvbHZlZExhbmd1YWdlID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5zZXRSZXNvbHZlZExhbmd1YWdlKGwpO1xuICAgIH07XG4gICAgY29uc3QgZG9uZSA9IChlcnIsIGwpID0+IHtcbiAgICAgIGlmIChsKSB7XG4gICAgICAgIHNldExuZ1Byb3BzKGwpO1xuICAgICAgICB0aGlzLnRyYW5zbGF0b3IuY2hhbmdlTGFuZ3VhZ2UobCk7XG4gICAgICAgIHRoaXMuaXNMYW5ndWFnZUNoYW5naW5nVG8gPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuZW1pdCgnbGFuZ3VhZ2VDaGFuZ2VkJywgbCk7XG4gICAgICAgIHRoaXMubG9nZ2VyLmxvZygnbGFuZ3VhZ2VDaGFuZ2VkJywgbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmlzTGFuZ3VhZ2VDaGFuZ2luZ1RvID0gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgICAgZGVmZXJyZWQucmVzb2x2ZShmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBfdGhpczIudCguLi5hcmd1bWVudHMpO1xuICAgICAgfSk7XG4gICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKGVyciwgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gX3RoaXMyLnQoLi4uYXJndW1lbnRzKTtcbiAgICAgIH0pO1xuICAgIH07XG4gICAgY29uc3Qgc2V0TG5nID0gbG5ncyA9PiB7XG4gICAgICBpZiAoIWxuZyAmJiAhbG5ncyAmJiB0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IpIGxuZ3MgPSBbXTtcbiAgICAgIGNvbnN0IGwgPSB0eXBlb2YgbG5ncyA9PT0gJ3N0cmluZycgPyBsbmdzIDogdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZVV0aWxzLmdldEJlc3RNYXRjaEZyb21Db2RlcyhsbmdzKTtcbiAgICAgIGlmIChsKSB7XG4gICAgICAgIGlmICghdGhpcy5sYW5ndWFnZSkge1xuICAgICAgICAgIHNldExuZ1Byb3BzKGwpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy50cmFuc2xhdG9yLmxhbmd1YWdlKSB0aGlzLnRyYW5zbGF0b3IuY2hhbmdlTGFuZ3VhZ2UobCk7XG4gICAgICAgIGlmICh0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IgJiYgdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZURldGVjdG9yLmNhY2hlVXNlckxhbmd1YWdlKSB0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IuY2FjaGVVc2VyTGFuZ3VhZ2UobCk7XG4gICAgICB9XG4gICAgICB0aGlzLmxvYWRSZXNvdXJjZXMobCwgZXJyID0+IHtcbiAgICAgICAgZG9uZShlcnIsIGwpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgICBpZiAoIWxuZyAmJiB0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IgJiYgIXRoaXMuc2VydmljZXMubGFuZ3VhZ2VEZXRlY3Rvci5hc3luYykge1xuICAgICAgc2V0TG5nKHRoaXMuc2VydmljZXMubGFuZ3VhZ2VEZXRlY3Rvci5kZXRlY3QoKSk7XG4gICAgfSBlbHNlIGlmICghbG5nICYmIHRoaXMuc2VydmljZXMubGFuZ3VhZ2VEZXRlY3RvciAmJiB0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IuYXN5bmMpIHtcbiAgICAgIGlmICh0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IuZGV0ZWN0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICB0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IuZGV0ZWN0KCkudGhlbihzZXRMbmcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZURldGVjdG9yLmRldGVjdChzZXRMbmcpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzZXRMbmcobG5nKTtcbiAgICB9XG4gICAgcmV0dXJuIGRlZmVycmVkO1xuICB9XG4gIGdldEZpeGVkVChsbmcsIG5zLCBrZXlQcmVmaXgpIHtcbiAgICB2YXIgX3RoaXMzID0gdGhpcztcbiAgICBjb25zdCBmaXhlZFQgPSBmdW5jdGlvbiAoa2V5LCBvcHRzKSB7XG4gICAgICBsZXQgb3B0aW9ucztcbiAgICAgIGlmICh0eXBlb2Ygb3B0cyAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgZm9yICh2YXIgX2xlbjMgPSBhcmd1bWVudHMubGVuZ3RoLCByZXN0ID0gbmV3IEFycmF5KF9sZW4zID4gMiA/IF9sZW4zIC0gMiA6IDApLCBfa2V5MyA9IDI7IF9rZXkzIDwgX2xlbjM7IF9rZXkzKyspIHtcbiAgICAgICAgICByZXN0W19rZXkzIC0gMl0gPSBhcmd1bWVudHNbX2tleTNdO1xuICAgICAgICB9XG4gICAgICAgIG9wdGlvbnMgPSBfdGhpczMub3B0aW9ucy5vdmVybG9hZFRyYW5zbGF0aW9uT3B0aW9uSGFuZGxlcihba2V5LCBvcHRzXS5jb25jYXQocmVzdCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3B0aW9ucyA9IHtcbiAgICAgICAgICAuLi5vcHRzXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBvcHRpb25zLmxuZyA9IG9wdGlvbnMubG5nIHx8IGZpeGVkVC5sbmc7XG4gICAgICBvcHRpb25zLmxuZ3MgPSBvcHRpb25zLmxuZ3MgfHwgZml4ZWRULmxuZ3M7XG4gICAgICBvcHRpb25zLm5zID0gb3B0aW9ucy5ucyB8fCBmaXhlZFQubnM7XG4gICAgICBvcHRpb25zLmtleVByZWZpeCA9IG9wdGlvbnMua2V5UHJlZml4IHx8IGtleVByZWZpeCB8fCBmaXhlZFQua2V5UHJlZml4O1xuICAgICAgY29uc3Qga2V5U2VwYXJhdG9yID0gX3RoaXMzLm9wdGlvbnMua2V5U2VwYXJhdG9yIHx8ICcuJztcbiAgICAgIGxldCByZXN1bHRLZXk7XG4gICAgICBpZiAob3B0aW9ucy5rZXlQcmVmaXggJiYgQXJyYXkuaXNBcnJheShrZXkpKSB7XG4gICAgICAgIHJlc3VsdEtleSA9IGtleS5tYXAoayA9PiBgJHtvcHRpb25zLmtleVByZWZpeH0ke2tleVNlcGFyYXRvcn0ke2t9YCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHRLZXkgPSBvcHRpb25zLmtleVByZWZpeCA/IGAke29wdGlvbnMua2V5UHJlZml4fSR7a2V5U2VwYXJhdG9yfSR7a2V5fWAgOiBrZXk7XG4gICAgICB9XG4gICAgICByZXR1cm4gX3RoaXMzLnQocmVzdWx0S2V5LCBvcHRpb25zKTtcbiAgICB9O1xuICAgIGlmICh0eXBlb2YgbG5nID09PSAnc3RyaW5nJykge1xuICAgICAgZml4ZWRULmxuZyA9IGxuZztcbiAgICB9IGVsc2Uge1xuICAgICAgZml4ZWRULmxuZ3MgPSBsbmc7XG4gICAgfVxuICAgIGZpeGVkVC5ucyA9IG5zO1xuICAgIGZpeGVkVC5rZXlQcmVmaXggPSBrZXlQcmVmaXg7XG4gICAgcmV0dXJuIGZpeGVkVDtcbiAgfVxuICB0KCkge1xuICAgIHJldHVybiB0aGlzLnRyYW5zbGF0b3IgJiYgdGhpcy50cmFuc2xhdG9yLnRyYW5zbGF0ZSguLi5hcmd1bWVudHMpO1xuICB9XG4gIGV4aXN0cygpIHtcbiAgICByZXR1cm4gdGhpcy50cmFuc2xhdG9yICYmIHRoaXMudHJhbnNsYXRvci5leGlzdHMoLi4uYXJndW1lbnRzKTtcbiAgfVxuICBzZXREZWZhdWx0TmFtZXNwYWNlKG5zKSB7XG4gICAgdGhpcy5vcHRpb25zLmRlZmF1bHROUyA9IG5zO1xuICB9XG4gIGhhc0xvYWRlZE5hbWVzcGFjZShucykge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB7fTtcbiAgICBpZiAoIXRoaXMuaXNJbml0aWFsaXplZCkge1xuICAgICAgdGhpcy5sb2dnZXIud2FybignaGFzTG9hZGVkTmFtZXNwYWNlOiBpMThuZXh0IHdhcyBub3QgaW5pdGlhbGl6ZWQnLCB0aGlzLmxhbmd1YWdlcyk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICghdGhpcy5sYW5ndWFnZXMgfHwgIXRoaXMubGFuZ3VhZ2VzLmxlbmd0aCkge1xuICAgICAgdGhpcy5sb2dnZXIud2FybignaGFzTG9hZGVkTmFtZXNwYWNlOiBpMThuLmxhbmd1YWdlcyB3ZXJlIHVuZGVmaW5lZCBvciBlbXB0eScsIHRoaXMubGFuZ3VhZ2VzKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3QgbG5nID0gb3B0aW9ucy5sbmcgfHwgdGhpcy5yZXNvbHZlZExhbmd1YWdlIHx8IHRoaXMubGFuZ3VhZ2VzWzBdO1xuICAgIGNvbnN0IGZhbGxiYWNrTG5nID0gdGhpcy5vcHRpb25zID8gdGhpcy5vcHRpb25zLmZhbGxiYWNrTG5nIDogZmFsc2U7XG4gICAgY29uc3QgbGFzdExuZyA9IHRoaXMubGFuZ3VhZ2VzW3RoaXMubGFuZ3VhZ2VzLmxlbmd0aCAtIDFdO1xuICAgIGlmIChsbmcudG9Mb3dlckNhc2UoKSA9PT0gJ2NpbW9kZScpIHJldHVybiB0cnVlO1xuICAgIGNvbnN0IGxvYWROb3RQZW5kaW5nID0gKGwsIG4pID0+IHtcbiAgICAgIGNvbnN0IGxvYWRTdGF0ZSA9IHRoaXMuc2VydmljZXMuYmFja2VuZENvbm5lY3Rvci5zdGF0ZVtgJHtsfXwke259YF07XG4gICAgICByZXR1cm4gbG9hZFN0YXRlID09PSAtMSB8fCBsb2FkU3RhdGUgPT09IDI7XG4gICAgfTtcbiAgICBpZiAob3B0aW9ucy5wcmVjaGVjaykge1xuICAgICAgY29uc3QgcHJlUmVzdWx0ID0gb3B0aW9ucy5wcmVjaGVjayh0aGlzLCBsb2FkTm90UGVuZGluZyk7XG4gICAgICBpZiAocHJlUmVzdWx0ICE9PSB1bmRlZmluZWQpIHJldHVybiBwcmVSZXN1bHQ7XG4gICAgfVxuICAgIGlmICh0aGlzLmhhc1Jlc291cmNlQnVuZGxlKGxuZywgbnMpKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAoIXRoaXMuc2VydmljZXMuYmFja2VuZENvbm5lY3Rvci5iYWNrZW5kIHx8IHRoaXMub3B0aW9ucy5yZXNvdXJjZXMgJiYgIXRoaXMub3B0aW9ucy5wYXJ0aWFsQnVuZGxlZExhbmd1YWdlcykgcmV0dXJuIHRydWU7XG4gICAgaWYgKGxvYWROb3RQZW5kaW5nKGxuZywgbnMpICYmICghZmFsbGJhY2tMbmcgfHwgbG9hZE5vdFBlbmRpbmcobGFzdExuZywgbnMpKSkgcmV0dXJuIHRydWU7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGxvYWROYW1lc3BhY2VzKG5zLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBpZiAoIXRoaXMub3B0aW9ucy5ucykge1xuICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjaygpO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIG5zID09PSAnc3RyaW5nJykgbnMgPSBbbnNdO1xuICAgIG5zLmZvckVhY2gobiA9PiB7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLm5zLmluZGV4T2YobikgPCAwKSB0aGlzLm9wdGlvbnMubnMucHVzaChuKTtcbiAgICB9KTtcbiAgICB0aGlzLmxvYWRSZXNvdXJjZXMoZXJyID0+IHtcbiAgICAgIGRlZmVycmVkLnJlc29sdmUoKTtcbiAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soZXJyKTtcbiAgICB9KTtcbiAgICByZXR1cm4gZGVmZXJyZWQ7XG4gIH1cbiAgbG9hZExhbmd1YWdlcyhsbmdzLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBpZiAodHlwZW9mIGxuZ3MgPT09ICdzdHJpbmcnKSBsbmdzID0gW2xuZ3NdO1xuICAgIGNvbnN0IHByZWxvYWRlZCA9IHRoaXMub3B0aW9ucy5wcmVsb2FkIHx8IFtdO1xuICAgIGNvbnN0IG5ld0xuZ3MgPSBsbmdzLmZpbHRlcihsbmcgPT4gcHJlbG9hZGVkLmluZGV4T2YobG5nKSA8IDApO1xuICAgIGlmICghbmV3TG5ncy5sZW5ndGgpIHtcbiAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soKTtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG4gICAgdGhpcy5vcHRpb25zLnByZWxvYWQgPSBwcmVsb2FkZWQuY29uY2F0KG5ld0xuZ3MpO1xuICAgIHRoaXMubG9hZFJlc291cmNlcyhlcnIgPT4ge1xuICAgICAgZGVmZXJyZWQucmVzb2x2ZSgpO1xuICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjayhlcnIpO1xuICAgIH0pO1xuICAgIHJldHVybiBkZWZlcnJlZDtcbiAgfVxuICBkaXIobG5nKSB7XG4gICAgaWYgKCFsbmcpIGxuZyA9IHRoaXMucmVzb2x2ZWRMYW5ndWFnZSB8fCAodGhpcy5sYW5ndWFnZXMgJiYgdGhpcy5sYW5ndWFnZXMubGVuZ3RoID4gMCA/IHRoaXMubGFuZ3VhZ2VzWzBdIDogdGhpcy5sYW5ndWFnZSk7XG4gICAgaWYgKCFsbmcpIHJldHVybiAncnRsJztcbiAgICBjb25zdCBydGxMbmdzID0gWydhcicsICdzaHUnLCAnc3FyJywgJ3NzaCcsICd4YWEnLCAneWhkJywgJ3l1ZCcsICdhYW8nLCAnYWJoJywgJ2FidicsICdhY20nLCAnYWNxJywgJ2FjdycsICdhY3gnLCAnYWN5JywgJ2FkZicsICdhZHMnLCAnYWViJywgJ2FlYycsICdhZmInLCAnYWpwJywgJ2FwYycsICdhcGQnLCAnYXJiJywgJ2FycScsICdhcnMnLCAnYXJ5JywgJ2FyeicsICdhdXonLCAnYXZsJywgJ2F5aCcsICdheWwnLCAnYXluJywgJ2F5cCcsICdiYnonLCAncGdhJywgJ2hlJywgJ2l3JywgJ3BzJywgJ3BidCcsICdwYnUnLCAncHN0JywgJ3BycCcsICdwcmQnLCAndWcnLCAndXInLCAneWRkJywgJ3lkcycsICd5aWgnLCAnamknLCAneWknLCAnaGJvJywgJ21lbicsICd4bW4nLCAnZmEnLCAnanByJywgJ3BlbycsICdwZXMnLCAncHJzJywgJ2R2JywgJ3NhbScsICdja2InXTtcbiAgICBjb25zdCBsYW5ndWFnZVV0aWxzID0gdGhpcy5zZXJ2aWNlcyAmJiB0aGlzLnNlcnZpY2VzLmxhbmd1YWdlVXRpbHMgfHwgbmV3IExhbmd1YWdlVXRpbChnZXQoKSk7XG4gICAgcmV0dXJuIHJ0bExuZ3MuaW5kZXhPZihsYW5ndWFnZVV0aWxzLmdldExhbmd1YWdlUGFydEZyb21Db2RlKGxuZykpID4gLTEgfHwgbG5nLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignLWFyYWInKSA+IDEgPyAncnRsJyA6ICdsdHInO1xuICB9XG4gIHN0YXRpYyBjcmVhdGVJbnN0YW5jZSgpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDoge307XG4gICAgbGV0IGNhbGxiYWNrID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgPyBhcmd1bWVudHNbMV0gOiB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIG5ldyBJMThuKG9wdGlvbnMsIGNhbGxiYWNrKTtcbiAgfVxuICBjbG9uZUluc3RhbmNlKCkge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiB7fTtcbiAgICBsZXQgY2FsbGJhY2sgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IG5vb3A7XG4gICAgY29uc3QgZm9ya1Jlc291cmNlU3RvcmUgPSBvcHRpb25zLmZvcmtSZXNvdXJjZVN0b3JlO1xuICAgIGlmIChmb3JrUmVzb3VyY2VTdG9yZSkgZGVsZXRlIG9wdGlvbnMuZm9ya1Jlc291cmNlU3RvcmU7XG4gICAgY29uc3QgbWVyZ2VkT3B0aW9ucyA9IHtcbiAgICAgIC4uLnRoaXMub3B0aW9ucyxcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAuLi57XG4gICAgICAgIGlzQ2xvbmU6IHRydWVcbiAgICAgIH1cbiAgICB9O1xuICAgIGNvbnN0IGNsb25lID0gbmV3IEkxOG4obWVyZ2VkT3B0aW9ucyk7XG4gICAgaWYgKG9wdGlvbnMuZGVidWcgIT09IHVuZGVmaW5lZCB8fCBvcHRpb25zLnByZWZpeCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjbG9uZS5sb2dnZXIgPSBjbG9uZS5sb2dnZXIuY2xvbmUob3B0aW9ucyk7XG4gICAgfVxuICAgIGNvbnN0IG1lbWJlcnNUb0NvcHkgPSBbJ3N0b3JlJywgJ3NlcnZpY2VzJywgJ2xhbmd1YWdlJ107XG4gICAgbWVtYmVyc1RvQ29weS5mb3JFYWNoKG0gPT4ge1xuICAgICAgY2xvbmVbbV0gPSB0aGlzW21dO1xuICAgIH0pO1xuICAgIGNsb25lLnNlcnZpY2VzID0ge1xuICAgICAgLi4udGhpcy5zZXJ2aWNlc1xuICAgIH07XG4gICAgY2xvbmUuc2VydmljZXMudXRpbHMgPSB7XG4gICAgICBoYXNMb2FkZWROYW1lc3BhY2U6IGNsb25lLmhhc0xvYWRlZE5hbWVzcGFjZS5iaW5kKGNsb25lKVxuICAgIH07XG4gICAgaWYgKGZvcmtSZXNvdXJjZVN0b3JlKSB7XG4gICAgICBjbG9uZS5zdG9yZSA9IG5ldyBSZXNvdXJjZVN0b3JlKHRoaXMuc3RvcmUuZGF0YSwgbWVyZ2VkT3B0aW9ucyk7XG4gICAgICBjbG9uZS5zZXJ2aWNlcy5yZXNvdXJjZVN0b3JlID0gY2xvbmUuc3RvcmU7XG4gICAgfVxuICAgIGNsb25lLnRyYW5zbGF0b3IgPSBuZXcgVHJhbnNsYXRvcihjbG9uZS5zZXJ2aWNlcywgbWVyZ2VkT3B0aW9ucyk7XG4gICAgY2xvbmUudHJhbnNsYXRvci5vbignKicsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgZm9yICh2YXIgX2xlbjQgPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gbmV3IEFycmF5KF9sZW40ID4gMSA/IF9sZW40IC0gMSA6IDApLCBfa2V5NCA9IDE7IF9rZXk0IDwgX2xlbjQ7IF9rZXk0KyspIHtcbiAgICAgICAgYXJnc1tfa2V5NCAtIDFdID0gYXJndW1lbnRzW19rZXk0XTtcbiAgICAgIH1cbiAgICAgIGNsb25lLmVtaXQoZXZlbnQsIC4uLmFyZ3MpO1xuICAgIH0pO1xuICAgIGNsb25lLmluaXQobWVyZ2VkT3B0aW9ucywgY2FsbGJhY2spO1xuICAgIGNsb25lLnRyYW5zbGF0b3Iub3B0aW9ucyA9IG1lcmdlZE9wdGlvbnM7XG4gICAgY2xvbmUudHJhbnNsYXRvci5iYWNrZW5kQ29ubmVjdG9yLnNlcnZpY2VzLnV0aWxzID0ge1xuICAgICAgaGFzTG9hZGVkTmFtZXNwYWNlOiBjbG9uZS5oYXNMb2FkZWROYW1lc3BhY2UuYmluZChjbG9uZSlcbiAgICB9O1xuICAgIHJldHVybiBjbG9uZTtcbiAgfVxuICB0b0pTT04oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9wdGlvbnM6IHRoaXMub3B0aW9ucyxcbiAgICAgIHN0b3JlOiB0aGlzLnN0b3JlLFxuICAgICAgbGFuZ3VhZ2U6IHRoaXMubGFuZ3VhZ2UsXG4gICAgICBsYW5ndWFnZXM6IHRoaXMubGFuZ3VhZ2VzLFxuICAgICAgcmVzb2x2ZWRMYW5ndWFnZTogdGhpcy5yZXNvbHZlZExhbmd1YWdlXG4gICAgfTtcbiAgfVxufVxuY29uc3QgaW5zdGFuY2UgPSBJMThuLmNyZWF0ZUluc3RhbmNlKCk7XG5pbnN0YW5jZS5jcmVhdGVJbnN0YW5jZSA9IEkxOG4uY3JlYXRlSW5zdGFuY2U7XG5cbmNvbnN0IGNyZWF0ZUluc3RhbmNlID0gaW5zdGFuY2UuY3JlYXRlSW5zdGFuY2U7XG5jb25zdCBkaXIgPSBpbnN0YW5jZS5kaXI7XG5jb25zdCBpbml0ID0gaW5zdGFuY2UuaW5pdDtcbmNvbnN0IGxvYWRSZXNvdXJjZXMgPSBpbnN0YW5jZS5sb2FkUmVzb3VyY2VzO1xuY29uc3QgcmVsb2FkUmVzb3VyY2VzID0gaW5zdGFuY2UucmVsb2FkUmVzb3VyY2VzO1xuY29uc3QgdXNlID0gaW5zdGFuY2UudXNlO1xuY29uc3QgY2hhbmdlTGFuZ3VhZ2UgPSBpbnN0YW5jZS5jaGFuZ2VMYW5ndWFnZTtcbmNvbnN0IGdldEZpeGVkVCA9IGluc3RhbmNlLmdldEZpeGVkVDtcbmNvbnN0IHQgPSBpbnN0YW5jZS50O1xuY29uc3QgZXhpc3RzID0gaW5zdGFuY2UuZXhpc3RzO1xuY29uc3Qgc2V0RGVmYXVsdE5hbWVzcGFjZSA9IGluc3RhbmNlLnNldERlZmF1bHROYW1lc3BhY2U7XG5jb25zdCBoYXNMb2FkZWROYW1lc3BhY2UgPSBpbnN0YW5jZS5oYXNMb2FkZWROYW1lc3BhY2U7XG5jb25zdCBsb2FkTmFtZXNwYWNlcyA9IGluc3RhbmNlLmxvYWROYW1lc3BhY2VzO1xuY29uc3QgbG9hZExhbmd1YWdlcyA9IGluc3RhbmNlLmxvYWRMYW5ndWFnZXM7XG5cbmV4cG9ydCB7IGNoYW5nZUxhbmd1YWdlLCBjcmVhdGVJbnN0YW5jZSwgaW5zdGFuY2UgYXMgZGVmYXVsdCwgZGlyLCBleGlzdHMsIGdldEZpeGVkVCwgaGFzTG9hZGVkTmFtZXNwYWNlLCBpbml0LCBsb2FkTGFuZ3VhZ2VzLCBsb2FkTmFtZXNwYWNlcywgbG9hZFJlc291cmNlcywgcmVsb2FkUmVzb3VyY2VzLCBzZXREZWZhdWx0TmFtZXNwYWNlLCB0LCB1c2UgfTtcbiIsICJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7XG4gIGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTtcbiAgfVxufSIsICJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBfdHlwZW9mKG8pIHtcbiAgXCJAYmFiZWwvaGVscGVycyAtIHR5cGVvZlwiO1xuXG4gIHJldHVybiBfdHlwZW9mID0gXCJmdW5jdGlvblwiID09IHR5cGVvZiBTeW1ib2wgJiYgXCJzeW1ib2xcIiA9PSB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID8gZnVuY3Rpb24gKG8pIHtcbiAgICByZXR1cm4gdHlwZW9mIG87XG4gIH0gOiBmdW5jdGlvbiAobykge1xuICAgIHJldHVybiBvICYmIFwiZnVuY3Rpb25cIiA9PSB0eXBlb2YgU3ltYm9sICYmIG8uY29uc3RydWN0b3IgPT09IFN5bWJvbCAmJiBvICE9PSBTeW1ib2wucHJvdG90eXBlID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvO1xuICB9LCBfdHlwZW9mKG8pO1xufSIsICJpbXBvcnQgX3R5cGVvZiBmcm9tIFwiLi90eXBlb2YuanNcIjtcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIF90b1ByaW1pdGl2ZShpbnB1dCwgaGludCkge1xuICBpZiAoX3R5cGVvZihpbnB1dCkgIT09IFwib2JqZWN0XCIgfHwgaW5wdXQgPT09IG51bGwpIHJldHVybiBpbnB1dDtcbiAgdmFyIHByaW0gPSBpbnB1dFtTeW1ib2wudG9QcmltaXRpdmVdO1xuICBpZiAocHJpbSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgdmFyIHJlcyA9IHByaW0uY2FsbChpbnB1dCwgaGludCB8fCBcImRlZmF1bHRcIik7XG4gICAgaWYgKF90eXBlb2YocmVzKSAhPT0gXCJvYmplY3RcIikgcmV0dXJuIHJlcztcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQEB0b1ByaW1pdGl2ZSBtdXN0IHJldHVybiBhIHByaW1pdGl2ZSB2YWx1ZS5cIik7XG4gIH1cbiAgcmV0dXJuIChoaW50ID09PSBcInN0cmluZ1wiID8gU3RyaW5nIDogTnVtYmVyKShpbnB1dCk7XG59IiwgImltcG9ydCBfdHlwZW9mIGZyb20gXCIuL3R5cGVvZi5qc1wiO1xuaW1wb3J0IHRvUHJpbWl0aXZlIGZyb20gXCIuL3RvUHJpbWl0aXZlLmpzXCI7XG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBfdG9Qcm9wZXJ0eUtleShhcmcpIHtcbiAgdmFyIGtleSA9IHRvUHJpbWl0aXZlKGFyZywgXCJzdHJpbmdcIik7XG4gIHJldHVybiBfdHlwZW9mKGtleSkgPT09IFwic3ltYm9sXCIgPyBrZXkgOiBTdHJpbmcoa2V5KTtcbn0iLCAiaW1wb3J0IHRvUHJvcGVydHlLZXkgZnJvbSBcIi4vdG9Qcm9wZXJ0eUtleS5qc1wiO1xuZnVuY3Rpb24gX2RlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTtcbiAgICBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7XG4gICAgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlO1xuICAgIGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgdG9Qcm9wZXJ0eUtleShkZXNjcmlwdG9yLmtleSksIGRlc2NyaXB0b3IpO1xuICB9XG59XG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBfY3JlYXRlQ2xhc3MoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7XG4gIGlmIChwcm90b1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpO1xuICBpZiAoc3RhdGljUHJvcHMpIF9kZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDb25zdHJ1Y3RvciwgXCJwcm90b3R5cGVcIiwge1xuICAgIHdyaXRhYmxlOiBmYWxzZVxuICB9KTtcbiAgcmV0dXJuIENvbnN0cnVjdG9yO1xufSIsICJpbXBvcnQgX2NsYXNzQ2FsbENoZWNrIGZyb20gJ0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvZXNtL2NsYXNzQ2FsbENoZWNrJztcbmltcG9ydCBfY3JlYXRlQ2xhc3MgZnJvbSAnQGJhYmVsL3J1bnRpbWUvaGVscGVycy9lc20vY3JlYXRlQ2xhc3MnO1xuXG52YXIgYXJyID0gW107XG52YXIgZWFjaCA9IGFyci5mb3JFYWNoO1xudmFyIHNsaWNlID0gYXJyLnNsaWNlO1xuZnVuY3Rpb24gZGVmYXVsdHMob2JqKSB7XG4gIGVhY2guY2FsbChzbGljZS5jYWxsKGFyZ3VtZW50cywgMSksIGZ1bmN0aW9uIChzb3VyY2UpIHtcbiAgICBpZiAoc291cmNlKSB7XG4gICAgICBmb3IgKHZhciBwcm9wIGluIHNvdXJjZSkge1xuICAgICAgICBpZiAob2JqW3Byb3BdID09PSB1bmRlZmluZWQpIG9ialtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb2JqO1xufVxuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29udHJvbC1yZWdleFxudmFyIGZpZWxkQ29udGVudFJlZ0V4cCA9IC9eW1xcdTAwMDlcXHUwMDIwLVxcdTAwN2VcXHUwMDgwLVxcdTAwZmZdKyQvO1xudmFyIHNlcmlhbGl6ZUNvb2tpZSA9IGZ1bmN0aW9uIHNlcmlhbGl6ZUNvb2tpZShuYW1lLCB2YWwsIG9wdGlvbnMpIHtcbiAgdmFyIG9wdCA9IG9wdGlvbnMgfHwge307XG4gIG9wdC5wYXRoID0gb3B0LnBhdGggfHwgJy8nO1xuICB2YXIgdmFsdWUgPSBlbmNvZGVVUklDb21wb25lbnQodmFsKTtcbiAgdmFyIHN0ciA9IFwiXCIuY29uY2F0KG5hbWUsIFwiPVwiKS5jb25jYXQodmFsdWUpO1xuICBpZiAob3B0Lm1heEFnZSA+IDApIHtcbiAgICB2YXIgbWF4QWdlID0gb3B0Lm1heEFnZSAtIDA7XG4gICAgaWYgKE51bWJlci5pc05hTihtYXhBZ2UpKSB0aHJvdyBuZXcgRXJyb3IoJ21heEFnZSBzaG91bGQgYmUgYSBOdW1iZXInKTtcbiAgICBzdHIgKz0gXCI7IE1heC1BZ2U9XCIuY29uY2F0KE1hdGguZmxvb3IobWF4QWdlKSk7XG4gIH1cbiAgaWYgKG9wdC5kb21haW4pIHtcbiAgICBpZiAoIWZpZWxkQ29udGVudFJlZ0V4cC50ZXN0KG9wdC5kb21haW4pKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdvcHRpb24gZG9tYWluIGlzIGludmFsaWQnKTtcbiAgICB9XG4gICAgc3RyICs9IFwiOyBEb21haW49XCIuY29uY2F0KG9wdC5kb21haW4pO1xuICB9XG4gIGlmIChvcHQucGF0aCkge1xuICAgIGlmICghZmllbGRDb250ZW50UmVnRXhwLnRlc3Qob3B0LnBhdGgpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdvcHRpb24gcGF0aCBpcyBpbnZhbGlkJyk7XG4gICAgfVxuICAgIHN0ciArPSBcIjsgUGF0aD1cIi5jb25jYXQob3B0LnBhdGgpO1xuICB9XG4gIGlmIChvcHQuZXhwaXJlcykge1xuICAgIGlmICh0eXBlb2Ygb3B0LmV4cGlyZXMudG9VVENTdHJpbmcgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ29wdGlvbiBleHBpcmVzIGlzIGludmFsaWQnKTtcbiAgICB9XG4gICAgc3RyICs9IFwiOyBFeHBpcmVzPVwiLmNvbmNhdChvcHQuZXhwaXJlcy50b1VUQ1N0cmluZygpKTtcbiAgfVxuICBpZiAob3B0Lmh0dHBPbmx5KSBzdHIgKz0gJzsgSHR0cE9ubHknO1xuICBpZiAob3B0LnNlY3VyZSkgc3RyICs9ICc7IFNlY3VyZSc7XG4gIGlmIChvcHQuc2FtZVNpdGUpIHtcbiAgICB2YXIgc2FtZVNpdGUgPSB0eXBlb2Ygb3B0LnNhbWVTaXRlID09PSAnc3RyaW5nJyA/IG9wdC5zYW1lU2l0ZS50b0xvd2VyQ2FzZSgpIDogb3B0LnNhbWVTaXRlO1xuICAgIHN3aXRjaCAoc2FtZVNpdGUpIHtcbiAgICAgIGNhc2UgdHJ1ZTpcbiAgICAgICAgc3RyICs9ICc7IFNhbWVTaXRlPVN0cmljdCc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnbGF4JzpcbiAgICAgICAgc3RyICs9ICc7IFNhbWVTaXRlPUxheCc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnc3RyaWN0JzpcbiAgICAgICAgc3RyICs9ICc7IFNhbWVTaXRlPVN0cmljdCc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnbm9uZSc6XG4gICAgICAgIHN0ciArPSAnOyBTYW1lU2l0ZT1Ob25lJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdvcHRpb24gc2FtZVNpdGUgaXMgaW52YWxpZCcpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufTtcbnZhciBjb29raWUgPSB7XG4gIGNyZWF0ZTogZnVuY3Rpb24gY3JlYXRlKG5hbWUsIHZhbHVlLCBtaW51dGVzLCBkb21haW4pIHtcbiAgICB2YXIgY29va2llT3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiA0ICYmIGFyZ3VtZW50c1s0XSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzRdIDoge1xuICAgICAgcGF0aDogJy8nLFxuICAgICAgc2FtZVNpdGU6ICdzdHJpY3QnXG4gICAgfTtcbiAgICBpZiAobWludXRlcykge1xuICAgICAgY29va2llT3B0aW9ucy5leHBpcmVzID0gbmV3IERhdGUoKTtcbiAgICAgIGNvb2tpZU9wdGlvbnMuZXhwaXJlcy5zZXRUaW1lKGNvb2tpZU9wdGlvbnMuZXhwaXJlcy5nZXRUaW1lKCkgKyBtaW51dGVzICogNjAgKiAxMDAwKTtcbiAgICB9XG4gICAgaWYgKGRvbWFpbikgY29va2llT3B0aW9ucy5kb21haW4gPSBkb21haW47XG4gICAgZG9jdW1lbnQuY29va2llID0gc2VyaWFsaXplQ29va2llKG5hbWUsIGVuY29kZVVSSUNvbXBvbmVudCh2YWx1ZSksIGNvb2tpZU9wdGlvbnMpO1xuICB9LFxuICByZWFkOiBmdW5jdGlvbiByZWFkKG5hbWUpIHtcbiAgICB2YXIgbmFtZUVRID0gXCJcIi5jb25jYXQobmFtZSwgXCI9XCIpO1xuICAgIHZhciBjYSA9IGRvY3VtZW50LmNvb2tpZS5zcGxpdCgnOycpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2EubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBjID0gY2FbaV07XG4gICAgICB3aGlsZSAoYy5jaGFyQXQoMCkgPT09ICcgJykge1xuICAgICAgICBjID0gYy5zdWJzdHJpbmcoMSwgYy5sZW5ndGgpO1xuICAgICAgfVxuICAgICAgaWYgKGMuaW5kZXhPZihuYW1lRVEpID09PSAwKSByZXR1cm4gYy5zdWJzdHJpbmcobmFtZUVRLmxlbmd0aCwgYy5sZW5ndGgpO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfSxcbiAgcmVtb3ZlOiBmdW5jdGlvbiByZW1vdmUobmFtZSkge1xuICAgIHRoaXMuY3JlYXRlKG5hbWUsICcnLCAtMSk7XG4gIH1cbn07XG52YXIgY29va2llJDEgPSB7XG4gIG5hbWU6ICdjb29raWUnLFxuICBsb29rdXA6IGZ1bmN0aW9uIGxvb2t1cChvcHRpb25zKSB7XG4gICAgdmFyIGZvdW5kO1xuICAgIGlmIChvcHRpb25zLmxvb2t1cENvb2tpZSAmJiB0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB2YXIgYyA9IGNvb2tpZS5yZWFkKG9wdGlvbnMubG9va3VwQ29va2llKTtcbiAgICAgIGlmIChjKSBmb3VuZCA9IGM7XG4gICAgfVxuICAgIHJldHVybiBmb3VuZDtcbiAgfSxcbiAgY2FjaGVVc2VyTGFuZ3VhZ2U6IGZ1bmN0aW9uIGNhY2hlVXNlckxhbmd1YWdlKGxuZywgb3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zLmxvb2t1cENvb2tpZSAmJiB0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBjb29raWUuY3JlYXRlKG9wdGlvbnMubG9va3VwQ29va2llLCBsbmcsIG9wdGlvbnMuY29va2llTWludXRlcywgb3B0aW9ucy5jb29raWVEb21haW4sIG9wdGlvbnMuY29va2llT3B0aW9ucyk7XG4gICAgfVxuICB9XG59O1xuXG52YXIgcXVlcnlzdHJpbmcgPSB7XG4gIG5hbWU6ICdxdWVyeXN0cmluZycsXG4gIGxvb2t1cDogZnVuY3Rpb24gbG9va3VwKG9wdGlvbnMpIHtcbiAgICB2YXIgZm91bmQ7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB2YXIgc2VhcmNoID0gd2luZG93LmxvY2F0aW9uLnNlYXJjaDtcbiAgICAgIGlmICghd2luZG93LmxvY2F0aW9uLnNlYXJjaCAmJiB3aW5kb3cubG9jYXRpb24uaGFzaCAmJiB3aW5kb3cubG9jYXRpb24uaGFzaC5pbmRleE9mKCc/JykgPiAtMSkge1xuICAgICAgICBzZWFyY2ggPSB3aW5kb3cubG9jYXRpb24uaGFzaC5zdWJzdHJpbmcod2luZG93LmxvY2F0aW9uLmhhc2guaW5kZXhPZignPycpKTtcbiAgICAgIH1cbiAgICAgIHZhciBxdWVyeSA9IHNlYXJjaC5zdWJzdHJpbmcoMSk7XG4gICAgICB2YXIgcGFyYW1zID0gcXVlcnkuc3BsaXQoJyYnKTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFyYW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBwb3MgPSBwYXJhbXNbaV0uaW5kZXhPZignPScpO1xuICAgICAgICBpZiAocG9zID4gMCkge1xuICAgICAgICAgIHZhciBrZXkgPSBwYXJhbXNbaV0uc3Vic3RyaW5nKDAsIHBvcyk7XG4gICAgICAgICAgaWYgKGtleSA9PT0gb3B0aW9ucy5sb29rdXBRdWVyeXN0cmluZykge1xuICAgICAgICAgICAgZm91bmQgPSBwYXJhbXNbaV0uc3Vic3RyaW5nKHBvcyArIDEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZm91bmQ7XG4gIH1cbn07XG5cbnZhciBoYXNMb2NhbFN0b3JhZ2VTdXBwb3J0ID0gbnVsbDtcbnZhciBsb2NhbFN0b3JhZ2VBdmFpbGFibGUgPSBmdW5jdGlvbiBsb2NhbFN0b3JhZ2VBdmFpbGFibGUoKSB7XG4gIGlmIChoYXNMb2NhbFN0b3JhZ2VTdXBwb3J0ICE9PSBudWxsKSByZXR1cm4gaGFzTG9jYWxTdG9yYWdlU3VwcG9ydDtcbiAgdHJ5IHtcbiAgICBoYXNMb2NhbFN0b3JhZ2VTdXBwb3J0ID0gd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cubG9jYWxTdG9yYWdlICE9PSBudWxsO1xuICAgIHZhciB0ZXN0S2V5ID0gJ2kxOG5leHQudHJhbnNsYXRlLmJvbyc7XG4gICAgd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKHRlc3RLZXksICdmb28nKTtcbiAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0odGVzdEtleSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBoYXNMb2NhbFN0b3JhZ2VTdXBwb3J0ID0gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIGhhc0xvY2FsU3RvcmFnZVN1cHBvcnQ7XG59O1xudmFyIGxvY2FsU3RvcmFnZSA9IHtcbiAgbmFtZTogJ2xvY2FsU3RvcmFnZScsXG4gIGxvb2t1cDogZnVuY3Rpb24gbG9va3VwKG9wdGlvbnMpIHtcbiAgICB2YXIgZm91bmQ7XG4gICAgaWYgKG9wdGlvbnMubG9va3VwTG9jYWxTdG9yYWdlICYmIGxvY2FsU3RvcmFnZUF2YWlsYWJsZSgpKSB7XG4gICAgICB2YXIgbG5nID0gd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKG9wdGlvbnMubG9va3VwTG9jYWxTdG9yYWdlKTtcbiAgICAgIGlmIChsbmcpIGZvdW5kID0gbG5nO1xuICAgIH1cbiAgICByZXR1cm4gZm91bmQ7XG4gIH0sXG4gIGNhY2hlVXNlckxhbmd1YWdlOiBmdW5jdGlvbiBjYWNoZVVzZXJMYW5ndWFnZShsbmcsIG9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucy5sb29rdXBMb2NhbFN0b3JhZ2UgJiYgbG9jYWxTdG9yYWdlQXZhaWxhYmxlKCkpIHtcbiAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbShvcHRpb25zLmxvb2t1cExvY2FsU3RvcmFnZSwgbG5nKTtcbiAgICB9XG4gIH1cbn07XG5cbnZhciBoYXNTZXNzaW9uU3RvcmFnZVN1cHBvcnQgPSBudWxsO1xudmFyIHNlc3Npb25TdG9yYWdlQXZhaWxhYmxlID0gZnVuY3Rpb24gc2Vzc2lvblN0b3JhZ2VBdmFpbGFibGUoKSB7XG4gIGlmIChoYXNTZXNzaW9uU3RvcmFnZVN1cHBvcnQgIT09IG51bGwpIHJldHVybiBoYXNTZXNzaW9uU3RvcmFnZVN1cHBvcnQ7XG4gIHRyeSB7XG4gICAgaGFzU2Vzc2lvblN0b3JhZ2VTdXBwb3J0ID0gd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuc2Vzc2lvblN0b3JhZ2UgIT09IG51bGw7XG4gICAgdmFyIHRlc3RLZXkgPSAnaTE4bmV4dC50cmFuc2xhdGUuYm9vJztcbiAgICB3aW5kb3cuc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbSh0ZXN0S2V5LCAnZm9vJyk7XG4gICAgd2luZG93LnNlc3Npb25TdG9yYWdlLnJlbW92ZUl0ZW0odGVzdEtleSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBoYXNTZXNzaW9uU3RvcmFnZVN1cHBvcnQgPSBmYWxzZTtcbiAgfVxuICByZXR1cm4gaGFzU2Vzc2lvblN0b3JhZ2VTdXBwb3J0O1xufTtcbnZhciBzZXNzaW9uU3RvcmFnZSA9IHtcbiAgbmFtZTogJ3Nlc3Npb25TdG9yYWdlJyxcbiAgbG9va3VwOiBmdW5jdGlvbiBsb29rdXAob3B0aW9ucykge1xuICAgIHZhciBmb3VuZDtcbiAgICBpZiAob3B0aW9ucy5sb29rdXBTZXNzaW9uU3RvcmFnZSAmJiBzZXNzaW9uU3RvcmFnZUF2YWlsYWJsZSgpKSB7XG4gICAgICB2YXIgbG5nID0gd2luZG93LnNlc3Npb25TdG9yYWdlLmdldEl0ZW0ob3B0aW9ucy5sb29rdXBTZXNzaW9uU3RvcmFnZSk7XG4gICAgICBpZiAobG5nKSBmb3VuZCA9IGxuZztcbiAgICB9XG4gICAgcmV0dXJuIGZvdW5kO1xuICB9LFxuICBjYWNoZVVzZXJMYW5ndWFnZTogZnVuY3Rpb24gY2FjaGVVc2VyTGFuZ3VhZ2UobG5nLCBvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMubG9va3VwU2Vzc2lvblN0b3JhZ2UgJiYgc2Vzc2lvblN0b3JhZ2VBdmFpbGFibGUoKSkge1xuICAgICAgd2luZG93LnNlc3Npb25TdG9yYWdlLnNldEl0ZW0ob3B0aW9ucy5sb29rdXBTZXNzaW9uU3RvcmFnZSwgbG5nKTtcbiAgICB9XG4gIH1cbn07XG5cbnZhciBuYXZpZ2F0b3IkMSA9IHtcbiAgbmFtZTogJ25hdmlnYXRvcicsXG4gIGxvb2t1cDogZnVuY3Rpb24gbG9va3VwKG9wdGlvbnMpIHtcbiAgICB2YXIgZm91bmQgPSBbXTtcbiAgICBpZiAodHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGlmIChuYXZpZ2F0b3IubGFuZ3VhZ2VzKSB7XG4gICAgICAgIC8vIGNocm9tZSBvbmx5OyBub3QgYW4gYXJyYXksIHNvIGNhbid0IHVzZSAucHVzaC5hcHBseSBpbnN0ZWFkIG9mIGl0ZXJhdGluZ1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5hdmlnYXRvci5sYW5ndWFnZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBmb3VuZC5wdXNoKG5hdmlnYXRvci5sYW5ndWFnZXNbaV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAobmF2aWdhdG9yLnVzZXJMYW5ndWFnZSkge1xuICAgICAgICBmb3VuZC5wdXNoKG5hdmlnYXRvci51c2VyTGFuZ3VhZ2UpO1xuICAgICAgfVxuICAgICAgaWYgKG5hdmlnYXRvci5sYW5ndWFnZSkge1xuICAgICAgICBmb3VuZC5wdXNoKG5hdmlnYXRvci5sYW5ndWFnZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmb3VuZC5sZW5ndGggPiAwID8gZm91bmQgOiB1bmRlZmluZWQ7XG4gIH1cbn07XG5cbnZhciBodG1sVGFnID0ge1xuICBuYW1lOiAnaHRtbFRhZycsXG4gIGxvb2t1cDogZnVuY3Rpb24gbG9va3VwKG9wdGlvbnMpIHtcbiAgICB2YXIgZm91bmQ7XG4gICAgdmFyIGh0bWxUYWcgPSBvcHRpb25zLmh0bWxUYWcgfHwgKHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcgPyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgOiBudWxsKTtcbiAgICBpZiAoaHRtbFRhZyAmJiB0eXBlb2YgaHRtbFRhZy5nZXRBdHRyaWJ1dGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGZvdW5kID0gaHRtbFRhZy5nZXRBdHRyaWJ1dGUoJ2xhbmcnKTtcbiAgICB9XG4gICAgcmV0dXJuIGZvdW5kO1xuICB9XG59O1xuXG52YXIgcGF0aCA9IHtcbiAgbmFtZTogJ3BhdGgnLFxuICBsb29rdXA6IGZ1bmN0aW9uIGxvb2t1cChvcHRpb25zKSB7XG4gICAgdmFyIGZvdW5kO1xuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgdmFyIGxhbmd1YWdlID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLm1hdGNoKC9cXC8oW2EtekEtWi1dKikvZyk7XG4gICAgICBpZiAobGFuZ3VhZ2UgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMubG9va3VwRnJvbVBhdGhJbmRleCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICBpZiAodHlwZW9mIGxhbmd1YWdlW29wdGlvbnMubG9va3VwRnJvbVBhdGhJbmRleF0gIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgIH1cbiAgICAgICAgICBmb3VuZCA9IGxhbmd1YWdlW29wdGlvbnMubG9va3VwRnJvbVBhdGhJbmRleF0ucmVwbGFjZSgnLycsICcnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBmb3VuZCA9IGxhbmd1YWdlWzBdLnJlcGxhY2UoJy8nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZvdW5kO1xuICB9XG59O1xuXG52YXIgc3ViZG9tYWluID0ge1xuICBuYW1lOiAnc3ViZG9tYWluJyxcbiAgbG9va3VwOiBmdW5jdGlvbiBsb29rdXAob3B0aW9ucykge1xuICAgIC8vIElmIGdpdmVuIGdldCB0aGUgc3ViZG9tYWluIGluZGV4IGVsc2UgMVxuICAgIHZhciBsb29rdXBGcm9tU3ViZG9tYWluSW5kZXggPSB0eXBlb2Ygb3B0aW9ucy5sb29rdXBGcm9tU3ViZG9tYWluSW5kZXggPT09ICdudW1iZXInID8gb3B0aW9ucy5sb29rdXBGcm9tU3ViZG9tYWluSW5kZXggKyAxIDogMTtcbiAgICAvLyBnZXQgYWxsIG1hdGNoZXMgaWYgd2luZG93LmxvY2F0aW9uLiBpcyBleGlzdGluZ1xuICAgIC8vIGZpcnN0IGl0ZW0gb2YgbWF0Y2ggaXMgdGhlIG1hdGNoIGl0c2VsZiBhbmQgdGhlIHNlY29uZCBpcyB0aGUgZmlyc3QgZ3JvdXAgbWFjaHQgd2hpY2ggc291bGQgYmUgdGhlIGZpcnN0IHN1YmRvbWFpbiBtYXRjaFxuICAgIC8vIGlzIHRoZSBob3N0bmFtZSBubyBwdWJsaWMgZG9tYWluIGdldCB0aGUgb3Igb3B0aW9uIG9mIGxvY2FsaG9zdFxuICAgIHZhciBsYW5ndWFnZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5sb2NhdGlvbiAmJiB3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUgJiYgd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lLm1hdGNoKC9eKFxcd3syLDV9KVxcLigoW2EtejAtOS1dezEsNjN9XFwuW2Etel17Miw2fSl8bG9jYWxob3N0KS9pKTtcblxuICAgIC8vIGlmIHRoZXJlIGlzIG5vIG1hdGNoIChudWxsKSByZXR1cm4gdW5kZWZpbmVkXG4gICAgaWYgKCFsYW5ndWFnZSkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAvLyByZXR1cm4gdGhlIGdpdmVuIGdyb3VwIG1hdGNoXG4gICAgcmV0dXJuIGxhbmd1YWdlW2xvb2t1cEZyb21TdWJkb21haW5JbmRleF07XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGdldERlZmF1bHRzKCkge1xuICByZXR1cm4ge1xuICAgIG9yZGVyOiBbJ3F1ZXJ5c3RyaW5nJywgJ2Nvb2tpZScsICdsb2NhbFN0b3JhZ2UnLCAnc2Vzc2lvblN0b3JhZ2UnLCAnbmF2aWdhdG9yJywgJ2h0bWxUYWcnXSxcbiAgICBsb29rdXBRdWVyeXN0cmluZzogJ2xuZycsXG4gICAgbG9va3VwQ29va2llOiAnaTE4bmV4dCcsXG4gICAgbG9va3VwTG9jYWxTdG9yYWdlOiAnaTE4bmV4dExuZycsXG4gICAgbG9va3VwU2Vzc2lvblN0b3JhZ2U6ICdpMThuZXh0TG5nJyxcbiAgICAvLyBjYWNoZSB1c2VyIGxhbmd1YWdlXG4gICAgY2FjaGVzOiBbJ2xvY2FsU3RvcmFnZSddLFxuICAgIGV4Y2x1ZGVDYWNoZUZvcjogWydjaW1vZGUnXSxcbiAgICAvLyBjb29raWVNaW51dGVzOiAxMCxcbiAgICAvLyBjb29raWVEb21haW46ICdteURvbWFpbidcblxuICAgIGNvbnZlcnREZXRlY3RlZExhbmd1YWdlOiBmdW5jdGlvbiBjb252ZXJ0RGV0ZWN0ZWRMYW5ndWFnZShsKSB7XG4gICAgICByZXR1cm4gbDtcbiAgICB9XG4gIH07XG59XG52YXIgQnJvd3NlciA9IC8qI19fUFVSRV9fKi9mdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIEJyb3dzZXIoc2VydmljZXMpIHtcbiAgICB2YXIgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge307XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEJyb3dzZXIpO1xuICAgIHRoaXMudHlwZSA9ICdsYW5ndWFnZURldGVjdG9yJztcbiAgICB0aGlzLmRldGVjdG9ycyA9IHt9O1xuICAgIHRoaXMuaW5pdChzZXJ2aWNlcywgb3B0aW9ucyk7XG4gIH1cbiAgX2NyZWF0ZUNsYXNzKEJyb3dzZXIsIFt7XG4gICAga2V5OiBcImluaXRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gaW5pdChzZXJ2aWNlcykge1xuICAgICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IHt9O1xuICAgICAgdmFyIGkxOG5PcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMl0gOiB7fTtcbiAgICAgIHRoaXMuc2VydmljZXMgPSBzZXJ2aWNlcyB8fCB7XG4gICAgICAgIGxhbmd1YWdlVXRpbHM6IHt9XG4gICAgICB9OyAvLyB0aGlzIHdheSB0aGUgbGFuZ3VhZ2UgZGV0ZWN0b3IgY2FuIGJlIHVzZWQgd2l0aG91dCBpMThuZXh0XG4gICAgICB0aGlzLm9wdGlvbnMgPSBkZWZhdWx0cyhvcHRpb25zLCB0aGlzLm9wdGlvbnMgfHwge30sIGdldERlZmF1bHRzKCkpO1xuICAgICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMuY29udmVydERldGVjdGVkTGFuZ3VhZ2UgPT09ICdzdHJpbmcnICYmIHRoaXMub3B0aW9ucy5jb252ZXJ0RGV0ZWN0ZWRMYW5ndWFnZS5pbmRleE9mKCcxNTg5NycpID4gLTEpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLmNvbnZlcnREZXRlY3RlZExhbmd1YWdlID0gZnVuY3Rpb24gKGwpIHtcbiAgICAgICAgICByZXR1cm4gbC5yZXBsYWNlKCctJywgJ18nKTtcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgLy8gYmFja3dhcmRzIGNvbXBhdGliaWxpdHlcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMubG9va3VwRnJvbVVybEluZGV4KSB0aGlzLm9wdGlvbnMubG9va3VwRnJvbVBhdGhJbmRleCA9IHRoaXMub3B0aW9ucy5sb29rdXBGcm9tVXJsSW5kZXg7XG4gICAgICB0aGlzLmkxOG5PcHRpb25zID0gaTE4bk9wdGlvbnM7XG4gICAgICB0aGlzLmFkZERldGVjdG9yKGNvb2tpZSQxKTtcbiAgICAgIHRoaXMuYWRkRGV0ZWN0b3IocXVlcnlzdHJpbmcpO1xuICAgICAgdGhpcy5hZGREZXRlY3Rvcihsb2NhbFN0b3JhZ2UpO1xuICAgICAgdGhpcy5hZGREZXRlY3RvcihzZXNzaW9uU3RvcmFnZSk7XG4gICAgICB0aGlzLmFkZERldGVjdG9yKG5hdmlnYXRvciQxKTtcbiAgICAgIHRoaXMuYWRkRGV0ZWN0b3IoaHRtbFRhZyk7XG4gICAgICB0aGlzLmFkZERldGVjdG9yKHBhdGgpO1xuICAgICAgdGhpcy5hZGREZXRlY3RvcihzdWJkb21haW4pO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJhZGREZXRlY3RvclwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBhZGREZXRlY3RvcihkZXRlY3Rvcikge1xuICAgICAgdGhpcy5kZXRlY3RvcnNbZGV0ZWN0b3IubmFtZV0gPSBkZXRlY3RvcjtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiZGV0ZWN0XCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGRldGVjdChkZXRlY3Rpb25PcmRlcikge1xuICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgIGlmICghZGV0ZWN0aW9uT3JkZXIpIGRldGVjdGlvbk9yZGVyID0gdGhpcy5vcHRpb25zLm9yZGVyO1xuICAgICAgdmFyIGRldGVjdGVkID0gW107XG4gICAgICBkZXRlY3Rpb25PcmRlci5mb3JFYWNoKGZ1bmN0aW9uIChkZXRlY3Rvck5hbWUpIHtcbiAgICAgICAgaWYgKF90aGlzLmRldGVjdG9yc1tkZXRlY3Rvck5hbWVdKSB7XG4gICAgICAgICAgdmFyIGxvb2t1cCA9IF90aGlzLmRldGVjdG9yc1tkZXRlY3Rvck5hbWVdLmxvb2t1cChfdGhpcy5vcHRpb25zKTtcbiAgICAgICAgICBpZiAobG9va3VwICYmIHR5cGVvZiBsb29rdXAgPT09ICdzdHJpbmcnKSBsb29rdXAgPSBbbG9va3VwXTtcbiAgICAgICAgICBpZiAobG9va3VwKSBkZXRlY3RlZCA9IGRldGVjdGVkLmNvbmNhdChsb29rdXApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGRldGVjdGVkID0gZGV0ZWN0ZWQubWFwKGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIHJldHVybiBfdGhpcy5vcHRpb25zLmNvbnZlcnREZXRlY3RlZExhbmd1YWdlKGQpO1xuICAgICAgfSk7XG4gICAgICBpZiAodGhpcy5zZXJ2aWNlcy5sYW5ndWFnZVV0aWxzLmdldEJlc3RNYXRjaEZyb21Db2RlcykgcmV0dXJuIGRldGVjdGVkOyAvLyBuZXcgaTE4bmV4dCB2MTkuNS4wXG4gICAgICByZXR1cm4gZGV0ZWN0ZWQubGVuZ3RoID4gMCA/IGRldGVjdGVkWzBdIDogbnVsbDsgLy8gYSBsaXR0bGUgYmFja3dhcmQgY29tcGF0aWJpbGl0eVxuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJjYWNoZVVzZXJMYW5ndWFnZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBjYWNoZVVzZXJMYW5ndWFnZShsbmcsIGNhY2hlcykge1xuICAgICAgdmFyIF90aGlzMiA9IHRoaXM7XG4gICAgICBpZiAoIWNhY2hlcykgY2FjaGVzID0gdGhpcy5vcHRpb25zLmNhY2hlcztcbiAgICAgIGlmICghY2FjaGVzKSByZXR1cm47XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmV4Y2x1ZGVDYWNoZUZvciAmJiB0aGlzLm9wdGlvbnMuZXhjbHVkZUNhY2hlRm9yLmluZGV4T2YobG5nKSA+IC0xKSByZXR1cm47XG4gICAgICBjYWNoZXMuZm9yRWFjaChmdW5jdGlvbiAoY2FjaGVOYW1lKSB7XG4gICAgICAgIGlmIChfdGhpczIuZGV0ZWN0b3JzW2NhY2hlTmFtZV0pIF90aGlzMi5kZXRlY3RvcnNbY2FjaGVOYW1lXS5jYWNoZVVzZXJMYW5ndWFnZShsbmcsIF90aGlzMi5vcHRpb25zKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfV0pO1xuICByZXR1cm4gQnJvd3Nlcjtcbn0oKTtcbkJyb3dzZXIudHlwZSA9ICdsYW5ndWFnZURldGVjdG9yJztcblxuZXhwb3J0IHsgQnJvd3NlciBhcyBkZWZhdWx0IH07XG4iLCBudWxsLCBudWxsLCBudWxsLCAiaW1wb3J0IHsgbHRpTGF1bmNoIH0gZnJvbSAnQGF0b21pY2pvbHQvbHRpLWNsaWVudCc7XG5pbXBvcnQgdHlwZSB7IExhdW5jaFNldHRpbmdzIH0gZnJvbSAnQGF0b21pY2pvbHQvbHRpLWNsaWVudC90eXBlcyc7XG5cbmNvbnN0IGxhdW5jaFNldHRpbmdzOiBMYXVuY2hTZXR0aW5ncyA9IHdpbmRvdy5MQVVOQ0hfU0VUVElOR1M7XG5sdGlMYXVuY2gobGF1bmNoU2V0dGluZ3MpLnRoZW4oKHZhbGlkKSA9PiB7XG4gIGlmICh2YWxpZCkge1xuICAgIGRvY3VtZW50LmJvZHkuaW5uZXJIVE1MID0gJ2hlbGxvIHdvcmxkJztcbiAgfSBlbHNlIHtcbiAgICBkb2N1bWVudC5ib2R5LmlubmVySFRNTCA9ICdmYWlsZWQgdG8gbGF1bmNoJztcbiAgfVxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7QUFBQSxNQUFNLGdCQUFnQjtBQUFBLElBQ3BCLE1BQU07QUFBQSxJQUNOLElBQUksTUFBTTtBQUNSLFdBQUssT0FBTyxPQUFPLElBQUk7QUFBQSxJQUN6QjtBQUFBLElBQ0EsS0FBSyxNQUFNO0FBQ1QsV0FBSyxPQUFPLFFBQVEsSUFBSTtBQUFBLElBQzFCO0FBQUEsSUFDQSxNQUFNLE1BQU07QUFDVixXQUFLLE9BQU8sU0FBUyxJQUFJO0FBQUEsSUFDM0I7QUFBQSxJQUNBLE9BQU8sTUFBTSxNQUFNO0FBQ2pCLFVBQUksV0FBVyxRQUFRLElBQUk7QUFBRyxnQkFBUSxJQUFJLEVBQUUsTUFBTSxTQUFTLElBQUk7QUFBQSxJQUNqRTtBQUFBLEVBQ0Y7QUFDQSxNQUFNLFNBQU4sTUFBTSxRQUFPO0FBQUEsSUFDWCxZQUFZLGdCQUFnQjtBQUMxQixVQUFJLFVBQVUsVUFBVSxTQUFTLEtBQUssVUFBVSxDQUFDLE1BQU0sU0FBWSxVQUFVLENBQUMsSUFBSSxDQUFD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QUFJLFNBQVUsR0FBRztBQUNmLGFBQU8sT0FBTyxLQUFLLElBQUksSUFBSSxLQUFLLElBQUksSUFBSSxLQUFLLElBQUksSUFBSSxDQUFDO0FBQUEsSUFDeEQ7QUFBQSxJQUNBLElBQUksU0FBVSxHQUFHO0FBQ2YsYUFBTyxPQUFPLElBQUksTUFBTSxLQUFLLElBQUksT0FBTyxLQUFLLElBQUksSUFBSSxNQUFNLE1BQU0sSUFBSSxNQUFNLE1BQU0sSUFBSSxPQUFPLE1BQU0sSUFBSSxDQUFDO0FBQUEsSUFDekc7QUFBQSxJQUNBLElBQUksU0FBVSxHQUFHO0FBQ2YsYUFBTyxPQUFPLElBQUksTUFBTSxLQUFLLElBQUksT0FBTyxLQUFLLElBQUksTUFBTSxJQUFJLElBQUksQ0FBQztBQUFBLElBQ2xFO0FBQUEsSUFDQSxJQUFJLFNBQVUsR0FBRztBQUNmLGFBQU8sT0FBTyxLQUFLLEtBQUssSUFBSSxNQUFNLEtBQUssSUFBSSxPQUFPLEtBQUssSUFBSSxDQUFDO0FBQUEsSUFDOUQ7QUFBQSxJQUNBLElBQUksU0FBVSxHQUFHO0FBQ2YsYUFBTyxPQUFPLEtBQUssSUFBSSxJQUFJLEtBQUssSUFBSSxJQUFJLENBQUM7QUFBQSxJQUMzQztBQUFBLElBQ0EsSUFBSSxTQUFVLEdBQUc7QUFDZixhQUFPLE9BQU8sS0FBSyxJQUFJLElBQUksS0FBSyxLQUFLLElBQUksTUFBTSxLQUFLLElBQUksTUFBTSxLQUFLLElBQUksSUFBSSxNQUFNLE1BQU0sSUFBSSxNQUFNLEtBQUssSUFBSSxDQUFDO0FBQUEsSUFDN0c7QUFBQSxJQUNBLElBQUksU0FBVSxHQUFHO0FBQ2YsYUFBTyxPQUFPLEtBQUssSUFBSSxJQUFJLEtBQUssS0FBSyxJQUFJLE1BQU0sS0FBSyxJQUFJLE1BQU0sS0FBSyxJQUFJLENBQUM7QUFBQSxJQUMxRTtBQUFBLElBQ0EsSUFBSSxTQUFVLEdBQUc7QUFDZixhQUFPLE9BQU8sSUFBSSxPQUFPLElBQUksSUFBSSxJQUFJLE9BQU8sSUFBSSxJQUFJLElBQUksT0FBTyxLQUFLLElBQUksT0FBTyxJQUFJ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QUFJO0FBQ0Ysa0JBQU0sU0FBUyxNQUFNLGVBQWUsUUFBUTtBQUM1QyxvQkFBUSxNQUFNO21CQUNQLEdBQUc7QUFDVixtQkFBTyxDQUFDOztRQUVaLENBQUM7YUFDSTtBQUNMLGdCQUFRLElBQUk7O0lBRWhCLENBQUM7RUFDSDs7O0FDaENBLE1BQU0saUJBQWlDLE9BQU87QUFDOUMsWUFBVSxjQUFjLEVBQUUsS0FBSyxDQUFDLFVBQVU7QUFDeEMsUUFBSSxPQUFPO0FBQ1QsZUFBUyxLQUFLLFlBQVk7QUFBQSxJQUM1QixPQUFPO0FBQ0wsZUFBUyxLQUFLLFlBQVk7QUFBQSxJQUM1QjtBQUFBLEVBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFsidCIsICJwYXRoIiwgImNvcHkiLCAibG9hZFN0YXRlIiwgImluc3RhbmNlIiwgIm8iLCAic2VyaWFsaXplQ29va2llIiwgImxvb2t1cCIsICJsb2NhbFN0b3JhZ2VBdmFpbGFibGUiLCAiY2FjaGVVc2VyTGFuZ3VhZ2UiLCAic2Vzc2lvblN0b3JhZ2VBdmFpbGFibGUiLCAiaHRtbFRhZyIsICJCcm93c2VyIiwgImluaXQiXQp9Cg==
