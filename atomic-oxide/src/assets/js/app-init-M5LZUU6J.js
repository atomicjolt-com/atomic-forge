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

  // node_modules/@atomicjolt/lti-client/dist/libs/platform_storage.js
  async function storeState(state, storageParams) {
    return new Promise((resolve, reject) => {
      let platformOrigin = new URL(storageParams.platformOIDCUrl).origin;
      let frameName = storageParams.target;
      let parent = window.parent || window.opener;
      let targetFrame = frameName === "_parent" ? parent : parent.frames[frameName];
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
      targetFrame?.postMessage({
        "subject": "lti.put_data",
        "message_id": state,
        "key": `${STATE_KEY_PREFIX}${state}`,
        "value": state
      }, platformOrigin);
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

  // client/app-init.ts
  var initSettings = window.INIT_SETTINGS;
  initOIDCLaunch(initSettings);
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2kxOG5leHQvZGlzdC9lc20vaTE4bmV4dC5qcyIsICIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQGJhYmVsL3J1bnRpbWUvaGVscGVycy9lc20vY2xhc3NDYWxsQ2hlY2suanMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvZXNtL3R5cGVvZi5qcyIsICIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQGJhYmVsL3J1bnRpbWUvaGVscGVycy9lc20vdG9QcmltaXRpdmUuanMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvZXNtL3RvUHJvcGVydHlLZXkuanMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvZXNtL2NyZWF0ZUNsYXNzLmpzIiwgIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9pMThuZXh0LWJyb3dzZXItbGFuZ3VhZ2VkZXRlY3Rvci9kaXN0L2VzbS9pMThuZXh0QnJvd3Nlckxhbmd1YWdlRGV0ZWN0b3IuanMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BhdG9taWNqb2x0L2x0aS1jbGllbnQvc3JjL2xpYnMvY29uc3RhbnRzLnRzIiwgIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9AYXRvbWljam9sdC9sdGktY2xpZW50L3NyYy9saWJzL2Nvb2tpZXMudHMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BhdG9taWNqb2x0L2x0aS1jbGllbnQvc3JjL2h0bWwvcHJpdmFjeS50cyIsICIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQGF0b21pY2pvbHQvbHRpLWNsaWVudC9zcmMvaHRtbC9sYXVuY2hfbmV3X3dpbmRvdy50cyIsICIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQGF0b21pY2pvbHQvbHRpLWNsaWVudC9zcmMvbGlicy9wbGF0Zm9ybV9zdG9yYWdlLnRzIiwgIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9AYXRvbWljam9sdC9sdGktY2xpZW50L3NyYy9odG1sL2Nvb2tpZV9lcnJvci50cyIsICIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQGF0b21pY2pvbHQvbHRpLWNsaWVudC9zcmMvbGlicy9sdGlfc3RvcmFnZV9sYXVuY2gudHMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BhdG9taWNqb2x0L2x0aS1jbGllbnQvZGlzdC9sb2NhbGUvZXMuanNvbiIsICIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQGF0b21pY2pvbHQvbHRpLWNsaWVudC9kaXN0L2xvY2FsZS9mci5qc29uIiwgIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9AYXRvbWljam9sdC9sdGktY2xpZW50L3NyYy9jbGllbnQvaW5pdC50cyIsICIuLi8uLi8uLi9jbGllbnQvYXBwLWluaXQudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IGNvbnNvbGVMb2dnZXIgPSB7XG4gIHR5cGU6ICdsb2dnZXInLFxuICBsb2coYXJncykge1xuICAgIHRoaXMub3V0cHV0KCdsb2cnLCBhcmdzKTtcbiAgfSxcbiAgd2FybihhcmdzKSB7XG4gICAgdGhpcy5vdXRwdXQoJ3dhcm4nLCBhcmdzKTtcbiAgfSxcbiAgZXJyb3IoYXJncykge1xuICAgIHRoaXMub3V0cHV0KCdlcnJvcicsIGFyZ3MpO1xuICB9LFxuICBvdXRwdXQodHlwZSwgYXJncykge1xuICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGVbdHlwZV0pIGNvbnNvbGVbdHlwZV0uYXBwbHkoY29uc29sZSwgYXJncyk7XG4gIH1cbn07XG5jbGFzcyBMb2dnZXIge1xuICBjb25zdHJ1Y3Rvcihjb25jcmV0ZUxvZ2dlcikge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB7fTtcbiAgICB0aGlzLmluaXQoY29uY3JldGVMb2dnZXIsIG9wdGlvbnMpO1xuICB9XG4gIGluaXQoY29uY3JldGVMb2dnZXIpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge307XG4gICAgdGhpcy5wcmVmaXggPSBvcHRpb25zLnByZWZpeCB8fCAnaTE4bmV4dDonO1xuICAgIHRoaXMubG9nZ2VyID0gY29uY3JldGVMb2dnZXIgfHwgY29uc29sZUxvZ2dlcjtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMuZGVidWcgPSBvcHRpb25zLmRlYnVnO1xuICB9XG4gIGxvZygpIHtcbiAgICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IG5ldyBBcnJheShfbGVuKSwgX2tleSA9IDA7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcbiAgICAgIGFyZ3NbX2tleV0gPSBhcmd1bWVudHNbX2tleV07XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmZvcndhcmQoYXJncywgJ2xvZycsICcnLCB0cnVlKTtcbiAgfVxuICB3YXJuKCkge1xuICAgIGZvciAodmFyIF9sZW4yID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IG5ldyBBcnJheShfbGVuMiksIF9rZXkyID0gMDsgX2tleTIgPCBfbGVuMjsgX2tleTIrKykge1xuICAgICAgYXJnc1tfa2V5Ml0gPSBhcmd1bWVudHNbX2tleTJdO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5mb3J3YXJkKGFyZ3MsICd3YXJuJywgJycsIHRydWUpO1xuICB9XG4gIGVycm9yKCkge1xuICAgIGZvciAodmFyIF9sZW4zID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IG5ldyBBcnJheShfbGVuMyksIF9rZXkzID0gMDsgX2tleTMgPCBfbGVuMzsgX2tleTMrKykge1xuICAgICAgYXJnc1tfa2V5M10gPSBhcmd1bWVudHNbX2tleTNdO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5mb3J3YXJkKGFyZ3MsICdlcnJvcicsICcnKTtcbiAgfVxuICBkZXByZWNhdGUoKSB7XG4gICAgZm9yICh2YXIgX2xlbjQgPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gbmV3IEFycmF5KF9sZW40KSwgX2tleTQgPSAwOyBfa2V5NCA8IF9sZW40OyBfa2V5NCsrKSB7XG4gICAgICBhcmdzW19rZXk0XSA9IGFyZ3VtZW50c1tfa2V5NF07XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmZvcndhcmQoYXJncywgJ3dhcm4nLCAnV0FSTklORyBERVBSRUNBVEVEOiAnLCB0cnVlKTtcbiAgfVxuICBmb3J3YXJkKGFyZ3MsIGx2bCwgcHJlZml4LCBkZWJ1Z09ubHkpIHtcbiAgICBpZiAoZGVidWdPbmx5ICYmICF0aGlzLmRlYnVnKSByZXR1cm4gbnVsbDtcbiAgICBpZiAodHlwZW9mIGFyZ3NbMF0gPT09ICdzdHJpbmcnKSBhcmdzWzBdID0gYCR7cHJlZml4fSR7dGhpcy5wcmVmaXh9ICR7YXJnc1swXX1gO1xuICAgIHJldHVybiB0aGlzLmxvZ2dlcltsdmxdKGFyZ3MpO1xuICB9XG4gIGNyZWF0ZShtb2R1bGVOYW1lKSB7XG4gICAgcmV0dXJuIG5ldyBMb2dnZXIodGhpcy5sb2dnZXIsIHtcbiAgICAgIC4uLntcbiAgICAgICAgcHJlZml4OiBgJHt0aGlzLnByZWZpeH06JHttb2R1bGVOYW1lfTpgXG4gICAgICB9LFxuICAgICAgLi4udGhpcy5vcHRpb25zXG4gICAgfSk7XG4gIH1cbiAgY2xvbmUob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHRoaXMub3B0aW9ucztcbiAgICBvcHRpb25zLnByZWZpeCA9IG9wdGlvbnMucHJlZml4IHx8IHRoaXMucHJlZml4O1xuICAgIHJldHVybiBuZXcgTG9nZ2VyKHRoaXMubG9nZ2VyLCBvcHRpb25zKTtcbiAgfVxufVxudmFyIGJhc2VMb2dnZXIgPSBuZXcgTG9nZ2VyKCk7XG5cbmNsYXNzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMub2JzZXJ2ZXJzID0ge307XG4gIH1cbiAgb24oZXZlbnRzLCBsaXN0ZW5lcikge1xuICAgIGV2ZW50cy5zcGxpdCgnICcpLmZvckVhY2goZXZlbnQgPT4ge1xuICAgICAgdGhpcy5vYnNlcnZlcnNbZXZlbnRdID0gdGhpcy5vYnNlcnZlcnNbZXZlbnRdIHx8IFtdO1xuICAgICAgdGhpcy5vYnNlcnZlcnNbZXZlbnRdLnB1c2gobGlzdGVuZXIpO1xuICAgIH0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIG9mZihldmVudCwgbGlzdGVuZXIpIHtcbiAgICBpZiAoIXRoaXMub2JzZXJ2ZXJzW2V2ZW50XSkgcmV0dXJuO1xuICAgIGlmICghbGlzdGVuZXIpIHtcbiAgICAgIGRlbGV0ZSB0aGlzLm9ic2VydmVyc1tldmVudF07XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMub2JzZXJ2ZXJzW2V2ZW50XSA9IHRoaXMub2JzZXJ2ZXJzW2V2ZW50XS5maWx0ZXIobCA9PiBsICE9PSBsaXN0ZW5lcik7XG4gIH1cbiAgZW1pdChldmVudCkge1xuICAgIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gbmV3IEFycmF5KF9sZW4gPiAxID8gX2xlbiAtIDEgOiAwKSwgX2tleSA9IDE7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcbiAgICAgIGFyZ3NbX2tleSAtIDFdID0gYXJndW1lbnRzW19rZXldO1xuICAgIH1cbiAgICBpZiAodGhpcy5vYnNlcnZlcnNbZXZlbnRdKSB7XG4gICAgICBjb25zdCBjbG9uZWQgPSBbXS5jb25jYXQodGhpcy5vYnNlcnZlcnNbZXZlbnRdKTtcbiAgICAgIGNsb25lZC5mb3JFYWNoKG9ic2VydmVyID0+IHtcbiAgICAgICAgb2JzZXJ2ZXIoLi4uYXJncyk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKHRoaXMub2JzZXJ2ZXJzWycqJ10pIHtcbiAgICAgIGNvbnN0IGNsb25lZCA9IFtdLmNvbmNhdCh0aGlzLm9ic2VydmVyc1snKiddKTtcbiAgICAgIGNsb25lZC5mb3JFYWNoKG9ic2VydmVyID0+IHtcbiAgICAgICAgb2JzZXJ2ZXIuYXBwbHkob2JzZXJ2ZXIsIFtldmVudCwgLi4uYXJnc10pO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGRlZmVyKCkge1xuICBsZXQgcmVzO1xuICBsZXQgcmVqO1xuICBjb25zdCBwcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIHJlcyA9IHJlc29sdmU7XG4gICAgcmVqID0gcmVqZWN0O1xuICB9KTtcbiAgcHJvbWlzZS5yZXNvbHZlID0gcmVzO1xuICBwcm9taXNlLnJlamVjdCA9IHJlajtcbiAgcmV0dXJuIHByb21pc2U7XG59XG5mdW5jdGlvbiBtYWtlU3RyaW5nKG9iamVjdCkge1xuICBpZiAob2JqZWN0ID09IG51bGwpIHJldHVybiAnJztcbiAgcmV0dXJuICcnICsgb2JqZWN0O1xufVxuZnVuY3Rpb24gY29weShhLCBzLCB0KSB7XG4gIGEuZm9yRWFjaChtID0+IHtcbiAgICBpZiAoc1ttXSkgdFttXSA9IHNbbV07XG4gIH0pO1xufVxuZnVuY3Rpb24gZ2V0TGFzdE9mUGF0aChvYmplY3QsIHBhdGgsIEVtcHR5KSB7XG4gIGZ1bmN0aW9uIGNsZWFuS2V5KGtleSkge1xuICAgIHJldHVybiBrZXkgJiYga2V5LmluZGV4T2YoJyMjIycpID4gLTEgPyBrZXkucmVwbGFjZSgvIyMjL2csICcuJykgOiBrZXk7XG4gIH1cbiAgZnVuY3Rpb24gY2FuTm90VHJhdmVyc2VEZWVwZXIoKSB7XG4gICAgcmV0dXJuICFvYmplY3QgfHwgdHlwZW9mIG9iamVjdCA9PT0gJ3N0cmluZyc7XG4gIH1cbiAgY29uc3Qgc3RhY2sgPSB0eXBlb2YgcGF0aCAhPT0gJ3N0cmluZycgPyBbXS5jb25jYXQocGF0aCkgOiBwYXRoLnNwbGl0KCcuJyk7XG4gIHdoaWxlIChzdGFjay5sZW5ndGggPiAxKSB7XG4gICAgaWYgKGNhbk5vdFRyYXZlcnNlRGVlcGVyKCkpIHJldHVybiB7fTtcbiAgICBjb25zdCBrZXkgPSBjbGVhbktleShzdGFjay5zaGlmdCgpKTtcbiAgICBpZiAoIW9iamVjdFtrZXldICYmIEVtcHR5KSBvYmplY3Rba2V5XSA9IG5ldyBFbXB0eSgpO1xuICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBrZXkpKSB7XG4gICAgICBvYmplY3QgPSBvYmplY3Rba2V5XTtcbiAgICB9IGVsc2Uge1xuICAgICAgb2JqZWN0ID0ge307XG4gICAgfVxuICB9XG4gIGlmIChjYW5Ob3RUcmF2ZXJzZURlZXBlcigpKSByZXR1cm4ge307XG4gIHJldHVybiB7XG4gICAgb2JqOiBvYmplY3QsXG4gICAgazogY2xlYW5LZXkoc3RhY2suc2hpZnQoKSlcbiAgfTtcbn1cbmZ1bmN0aW9uIHNldFBhdGgob2JqZWN0LCBwYXRoLCBuZXdWYWx1ZSkge1xuICBjb25zdCB7XG4gICAgb2JqLFxuICAgIGtcbiAgfSA9IGdldExhc3RPZlBhdGgob2JqZWN0LCBwYXRoLCBPYmplY3QpO1xuICBvYmpba10gPSBuZXdWYWx1ZTtcbn1cbmZ1bmN0aW9uIHB1c2hQYXRoKG9iamVjdCwgcGF0aCwgbmV3VmFsdWUsIGNvbmNhdCkge1xuICBjb25zdCB7XG4gICAgb2JqLFxuICAgIGtcbiAgfSA9IGdldExhc3RPZlBhdGgob2JqZWN0LCBwYXRoLCBPYmplY3QpO1xuICBvYmpba10gPSBvYmpba10gfHwgW107XG4gIGlmIChjb25jYXQpIG9ialtrXSA9IG9ialtrXS5jb25jYXQobmV3VmFsdWUpO1xuICBpZiAoIWNvbmNhdCkgb2JqW2tdLnB1c2gobmV3VmFsdWUpO1xufVxuZnVuY3Rpb24gZ2V0UGF0aChvYmplY3QsIHBhdGgpIHtcbiAgY29uc3Qge1xuICAgIG9iaixcbiAgICBrXG4gIH0gPSBnZXRMYXN0T2ZQYXRoKG9iamVjdCwgcGF0aCk7XG4gIGlmICghb2JqKSByZXR1cm4gdW5kZWZpbmVkO1xuICByZXR1cm4gb2JqW2tdO1xufVxuZnVuY3Rpb24gZ2V0UGF0aFdpdGhEZWZhdWx0cyhkYXRhLCBkZWZhdWx0RGF0YSwga2V5KSB7XG4gIGNvbnN0IHZhbHVlID0gZ2V0UGF0aChkYXRhLCBrZXkpO1xuICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuICByZXR1cm4gZ2V0UGF0aChkZWZhdWx0RGF0YSwga2V5KTtcbn1cbmZ1bmN0aW9uIGRlZXBFeHRlbmQodGFyZ2V0LCBzb3VyY2UsIG92ZXJ3cml0ZSkge1xuICBmb3IgKGNvbnN0IHByb3AgaW4gc291cmNlKSB7XG4gICAgaWYgKHByb3AgIT09ICdfX3Byb3RvX18nICYmIHByb3AgIT09ICdjb25zdHJ1Y3RvcicpIHtcbiAgICAgIGlmIChwcm9wIGluIHRhcmdldCkge1xuICAgICAgICBpZiAodHlwZW9mIHRhcmdldFtwcm9wXSA9PT0gJ3N0cmluZycgfHwgdGFyZ2V0W3Byb3BdIGluc3RhbmNlb2YgU3RyaW5nIHx8IHR5cGVvZiBzb3VyY2VbcHJvcF0gPT09ICdzdHJpbmcnIHx8IHNvdXJjZVtwcm9wXSBpbnN0YW5jZW9mIFN0cmluZykge1xuICAgICAgICAgIGlmIChvdmVyd3JpdGUpIHRhcmdldFtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkZWVwRXh0ZW5kKHRhcmdldFtwcm9wXSwgc291cmNlW3Byb3BdLCBvdmVyd3JpdGUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0YXJnZXRbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiB0YXJnZXQ7XG59XG5mdW5jdGlvbiByZWdleEVzY2FwZShzdHIpIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9bXFwtXFxbXFxdXFwvXFx7XFx9XFwoXFwpXFwqXFwrXFw/XFwuXFxcXFxcXlxcJFxcfF0vZywgJ1xcXFwkJicpO1xufVxudmFyIF9lbnRpdHlNYXAgPSB7XG4gICcmJzogJyZhbXA7JyxcbiAgJzwnOiAnJmx0OycsXG4gICc+JzogJyZndDsnLFxuICAnXCInOiAnJnF1b3Q7JyxcbiAgXCInXCI6ICcmIzM5OycsXG4gICcvJzogJyYjeDJGOydcbn07XG5mdW5jdGlvbiBlc2NhcGUoZGF0YSkge1xuICBpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIGRhdGEucmVwbGFjZSgvWyY8PlwiJ1xcL10vZywgcyA9PiBfZW50aXR5TWFwW3NdKTtcbiAgfVxuICByZXR1cm4gZGF0YTtcbn1cbmNvbnN0IGNoYXJzID0gWycgJywgJywnLCAnPycsICchJywgJzsnXTtcbmZ1bmN0aW9uIGxvb2tzTGlrZU9iamVjdFBhdGgoa2V5LCBuc1NlcGFyYXRvciwga2V5U2VwYXJhdG9yKSB7XG4gIG5zU2VwYXJhdG9yID0gbnNTZXBhcmF0b3IgfHwgJyc7XG4gIGtleVNlcGFyYXRvciA9IGtleVNlcGFyYXRvciB8fCAnJztcbiAgY29uc3QgcG9zc2libGVDaGFycyA9IGNoYXJzLmZpbHRlcihjID0+IG5zU2VwYXJhdG9yLmluZGV4T2YoYykgPCAwICYmIGtleVNlcGFyYXRvci5pbmRleE9mKGMpIDwgMCk7XG4gIGlmIChwb3NzaWJsZUNoYXJzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHRydWU7XG4gIGNvbnN0IHIgPSBuZXcgUmVnRXhwKGAoJHtwb3NzaWJsZUNoYXJzLm1hcChjID0+IGMgPT09ICc/JyA/ICdcXFxcPycgOiBjKS5qb2luKCd8Jyl9KWApO1xuICBsZXQgbWF0Y2hlZCA9ICFyLnRlc3Qoa2V5KTtcbiAgaWYgKCFtYXRjaGVkKSB7XG4gICAgY29uc3Qga2kgPSBrZXkuaW5kZXhPZihrZXlTZXBhcmF0b3IpO1xuICAgIGlmIChraSA+IDAgJiYgIXIudGVzdChrZXkuc3Vic3RyaW5nKDAsIGtpKSkpIHtcbiAgICAgIG1hdGNoZWQgPSB0cnVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbWF0Y2hlZDtcbn1cbmZ1bmN0aW9uIGRlZXBGaW5kKG9iaiwgcGF0aCkge1xuICBsZXQga2V5U2VwYXJhdG9yID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMl0gOiAnLic7XG4gIGlmICghb2JqKSByZXR1cm4gdW5kZWZpbmVkO1xuICBpZiAob2JqW3BhdGhdKSByZXR1cm4gb2JqW3BhdGhdO1xuICBjb25zdCBwYXRocyA9IHBhdGguc3BsaXQoa2V5U2VwYXJhdG9yKTtcbiAgbGV0IGN1cnJlbnQgPSBvYmo7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcGF0aHMubGVuZ3RoOyArK2kpIHtcbiAgICBpZiAoIWN1cnJlbnQpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgaWYgKHR5cGVvZiBjdXJyZW50W3BhdGhzW2ldXSA9PT0gJ3N0cmluZycgJiYgaSArIDEgPCBwYXRocy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmIChjdXJyZW50W3BhdGhzW2ldXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBsZXQgaiA9IDI7XG4gICAgICBsZXQgcCA9IHBhdGhzLnNsaWNlKGksIGkgKyBqKS5qb2luKGtleVNlcGFyYXRvcik7XG4gICAgICBsZXQgbWl4ID0gY3VycmVudFtwXTtcbiAgICAgIHdoaWxlIChtaXggPT09IHVuZGVmaW5lZCAmJiBwYXRocy5sZW5ndGggPiBpICsgaikge1xuICAgICAgICBqKys7XG4gICAgICAgIHAgPSBwYXRocy5zbGljZShpLCBpICsgaikuam9pbihrZXlTZXBhcmF0b3IpO1xuICAgICAgICBtaXggPSBjdXJyZW50W3BdO1xuICAgICAgfVxuICAgICAgaWYgKG1peCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgaWYgKG1peCA9PT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gICAgICBpZiAocGF0aC5lbmRzV2l0aChwKSkge1xuICAgICAgICBpZiAodHlwZW9mIG1peCA9PT0gJ3N0cmluZycpIHJldHVybiBtaXg7XG4gICAgICAgIGlmIChwICYmIHR5cGVvZiBtaXhbcF0gPT09ICdzdHJpbmcnKSByZXR1cm4gbWl4W3BdO1xuICAgICAgfVxuICAgICAgY29uc3Qgam9pbmVkUGF0aCA9IHBhdGhzLnNsaWNlKGkgKyBqKS5qb2luKGtleVNlcGFyYXRvcik7XG4gICAgICBpZiAoam9pbmVkUGF0aCkgcmV0dXJuIGRlZXBGaW5kKG1peCwgam9pbmVkUGF0aCwga2V5U2VwYXJhdG9yKTtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGN1cnJlbnQgPSBjdXJyZW50W3BhdGhzW2ldXTtcbiAgfVxuICByZXR1cm4gY3VycmVudDtcbn1cbmZ1bmN0aW9uIGdldENsZWFuZWRDb2RlKGNvZGUpIHtcbiAgaWYgKGNvZGUgJiYgY29kZS5pbmRleE9mKCdfJykgPiAwKSByZXR1cm4gY29kZS5yZXBsYWNlKCdfJywgJy0nKTtcbiAgcmV0dXJuIGNvZGU7XG59XG5cbmNsYXNzIFJlc291cmNlU3RvcmUgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICBjb25zdHJ1Y3RvcihkYXRhKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IHtcbiAgICAgIG5zOiBbJ3RyYW5zbGF0aW9uJ10sXG4gICAgICBkZWZhdWx0TlM6ICd0cmFuc2xhdGlvbidcbiAgICB9O1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5kYXRhID0gZGF0YSB8fCB7fTtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIGlmICh0aGlzLm9wdGlvbnMua2V5U2VwYXJhdG9yID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5rZXlTZXBhcmF0b3IgPSAnLic7XG4gICAgfVxuICAgIGlmICh0aGlzLm9wdGlvbnMuaWdub3JlSlNPTlN0cnVjdHVyZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLm9wdGlvbnMuaWdub3JlSlNPTlN0cnVjdHVyZSA9IHRydWU7XG4gICAgfVxuICB9XG4gIGFkZE5hbWVzcGFjZXMobnMpIHtcbiAgICBpZiAodGhpcy5vcHRpb25zLm5zLmluZGV4T2YobnMpIDwgMCkge1xuICAgICAgdGhpcy5vcHRpb25zLm5zLnB1c2gobnMpO1xuICAgIH1cbiAgfVxuICByZW1vdmVOYW1lc3BhY2VzKG5zKSB7XG4gICAgY29uc3QgaW5kZXggPSB0aGlzLm9wdGlvbnMubnMuaW5kZXhPZihucyk7XG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5ucy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgfVxuICBnZXRSZXNvdXJjZShsbmcsIG5zLCBrZXkpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAzICYmIGFyZ3VtZW50c1szXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzNdIDoge307XG4gICAgY29uc3Qga2V5U2VwYXJhdG9yID0gb3B0aW9ucy5rZXlTZXBhcmF0b3IgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMua2V5U2VwYXJhdG9yIDogdGhpcy5vcHRpb25zLmtleVNlcGFyYXRvcjtcbiAgICBjb25zdCBpZ25vcmVKU09OU3RydWN0dXJlID0gb3B0aW9ucy5pZ25vcmVKU09OU3RydWN0dXJlICE9PSB1bmRlZmluZWQgPyBvcHRpb25zLmlnbm9yZUpTT05TdHJ1Y3R1cmUgOiB0aGlzLm9wdGlvbnMuaWdub3JlSlNPTlN0cnVjdHVyZTtcbiAgICBsZXQgcGF0aCA9IFtsbmcsIG5zXTtcbiAgICBpZiAoa2V5ICYmIHR5cGVvZiBrZXkgIT09ICdzdHJpbmcnKSBwYXRoID0gcGF0aC5jb25jYXQoa2V5KTtcbiAgICBpZiAoa2V5ICYmIHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnKSBwYXRoID0gcGF0aC5jb25jYXQoa2V5U2VwYXJhdG9yID8ga2V5LnNwbGl0KGtleVNlcGFyYXRvcikgOiBrZXkpO1xuICAgIGlmIChsbmcuaW5kZXhPZignLicpID4gLTEpIHtcbiAgICAgIHBhdGggPSBsbmcuc3BsaXQoJy4nKTtcbiAgICB9XG4gICAgY29uc3QgcmVzdWx0ID0gZ2V0UGF0aCh0aGlzLmRhdGEsIHBhdGgpO1xuICAgIGlmIChyZXN1bHQgfHwgIWlnbm9yZUpTT05TdHJ1Y3R1cmUgfHwgdHlwZW9mIGtleSAhPT0gJ3N0cmluZycpIHJldHVybiByZXN1bHQ7XG4gICAgcmV0dXJuIGRlZXBGaW5kKHRoaXMuZGF0YSAmJiB0aGlzLmRhdGFbbG5nXSAmJiB0aGlzLmRhdGFbbG5nXVtuc10sIGtleSwga2V5U2VwYXJhdG9yKTtcbiAgfVxuICBhZGRSZXNvdXJjZShsbmcsIG5zLCBrZXksIHZhbHVlKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gNCAmJiBhcmd1bWVudHNbNF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1s0XSA6IHtcbiAgICAgIHNpbGVudDogZmFsc2VcbiAgICB9O1xuICAgIGNvbnN0IGtleVNlcGFyYXRvciA9IG9wdGlvbnMua2V5U2VwYXJhdG9yICE9PSB1bmRlZmluZWQgPyBvcHRpb25zLmtleVNlcGFyYXRvciA6IHRoaXMub3B0aW9ucy5rZXlTZXBhcmF0b3I7XG4gICAgbGV0IHBhdGggPSBbbG5nLCBuc107XG4gICAgaWYgKGtleSkgcGF0aCA9IHBhdGguY29uY2F0KGtleVNlcGFyYXRvciA/IGtleS5zcGxpdChrZXlTZXBhcmF0b3IpIDoga2V5KTtcbiAgICBpZiAobG5nLmluZGV4T2YoJy4nKSA+IC0xKSB7XG4gICAgICBwYXRoID0gbG5nLnNwbGl0KCcuJyk7XG4gICAgICB2YWx1ZSA9IG5zO1xuICAgICAgbnMgPSBwYXRoWzFdO1xuICAgIH1cbiAgICB0aGlzLmFkZE5hbWVzcGFjZXMobnMpO1xuICAgIHNldFBhdGgodGhpcy5kYXRhLCBwYXRoLCB2YWx1ZSk7XG4gICAgaWYgKCFvcHRpb25zLnNpbGVudCkgdGhpcy5lbWl0KCdhZGRlZCcsIGxuZywgbnMsIGtleSwgdmFsdWUpO1xuICB9XG4gIGFkZFJlc291cmNlcyhsbmcsIG5zLCByZXNvdXJjZXMpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAzICYmIGFyZ3VtZW50c1szXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzNdIDoge1xuICAgICAgc2lsZW50OiBmYWxzZVxuICAgIH07XG4gICAgZm9yIChjb25zdCBtIGluIHJlc291cmNlcykge1xuICAgICAgaWYgKHR5cGVvZiByZXNvdXJjZXNbbV0gPT09ICdzdHJpbmcnIHx8IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuYXBwbHkocmVzb3VyY2VzW21dKSA9PT0gJ1tvYmplY3QgQXJyYXldJykgdGhpcy5hZGRSZXNvdXJjZShsbmcsIG5zLCBtLCByZXNvdXJjZXNbbV0sIHtcbiAgICAgICAgc2lsZW50OiB0cnVlXG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKCFvcHRpb25zLnNpbGVudCkgdGhpcy5lbWl0KCdhZGRlZCcsIGxuZywgbnMsIHJlc291cmNlcyk7XG4gIH1cbiAgYWRkUmVzb3VyY2VCdW5kbGUobG5nLCBucywgcmVzb3VyY2VzLCBkZWVwLCBvdmVyd3JpdGUpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiA1ICYmIGFyZ3VtZW50c1s1XSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzVdIDoge1xuICAgICAgc2lsZW50OiBmYWxzZVxuICAgIH07XG4gICAgbGV0IHBhdGggPSBbbG5nLCBuc107XG4gICAgaWYgKGxuZy5pbmRleE9mKCcuJykgPiAtMSkge1xuICAgICAgcGF0aCA9IGxuZy5zcGxpdCgnLicpO1xuICAgICAgZGVlcCA9IHJlc291cmNlcztcbiAgICAgIHJlc291cmNlcyA9IG5zO1xuICAgICAgbnMgPSBwYXRoWzFdO1xuICAgIH1cbiAgICB0aGlzLmFkZE5hbWVzcGFjZXMobnMpO1xuICAgIGxldCBwYWNrID0gZ2V0UGF0aCh0aGlzLmRhdGEsIHBhdGgpIHx8IHt9O1xuICAgIGlmIChkZWVwKSB7XG4gICAgICBkZWVwRXh0ZW5kKHBhY2ssIHJlc291cmNlcywgb3ZlcndyaXRlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcGFjayA9IHtcbiAgICAgICAgLi4ucGFjayxcbiAgICAgICAgLi4ucmVzb3VyY2VzXG4gICAgICB9O1xuICAgIH1cbiAgICBzZXRQYXRoKHRoaXMuZGF0YSwgcGF0aCwgcGFjayk7XG4gICAgaWYgKCFvcHRpb25zLnNpbGVudCkgdGhpcy5lbWl0KCdhZGRlZCcsIGxuZywgbnMsIHJlc291cmNlcyk7XG4gIH1cbiAgcmVtb3ZlUmVzb3VyY2VCdW5kbGUobG5nLCBucykge1xuICAgIGlmICh0aGlzLmhhc1Jlc291cmNlQnVuZGxlKGxuZywgbnMpKSB7XG4gICAgICBkZWxldGUgdGhpcy5kYXRhW2xuZ11bbnNdO1xuICAgIH1cbiAgICB0aGlzLnJlbW92ZU5hbWVzcGFjZXMobnMpO1xuICAgIHRoaXMuZW1pdCgncmVtb3ZlZCcsIGxuZywgbnMpO1xuICB9XG4gIGhhc1Jlc291cmNlQnVuZGxlKGxuZywgbnMpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRSZXNvdXJjZShsbmcsIG5zKSAhPT0gdW5kZWZpbmVkO1xuICB9XG4gIGdldFJlc291cmNlQnVuZGxlKGxuZywgbnMpIHtcbiAgICBpZiAoIW5zKSBucyA9IHRoaXMub3B0aW9ucy5kZWZhdWx0TlM7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5jb21wYXRpYmlsaXR5QVBJID09PSAndjEnKSByZXR1cm4ge1xuICAgICAgLi4ue30sXG4gICAgICAuLi50aGlzLmdldFJlc291cmNlKGxuZywgbnMpXG4gICAgfTtcbiAgICByZXR1cm4gdGhpcy5nZXRSZXNvdXJjZShsbmcsIG5zKTtcbiAgfVxuICBnZXREYXRhQnlMYW5ndWFnZShsbmcpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhW2xuZ107XG4gIH1cbiAgaGFzTGFuZ3VhZ2VTb21lVHJhbnNsYXRpb25zKGxuZykge1xuICAgIGNvbnN0IGRhdGEgPSB0aGlzLmdldERhdGFCeUxhbmd1YWdlKGxuZyk7XG4gICAgY29uc3QgbiA9IGRhdGEgJiYgT2JqZWN0LmtleXMoZGF0YSkgfHwgW107XG4gICAgcmV0dXJuICEhbi5maW5kKHYgPT4gZGF0YVt2XSAmJiBPYmplY3Qua2V5cyhkYXRhW3ZdKS5sZW5ndGggPiAwKTtcbiAgfVxuICB0b0pTT04oKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YTtcbiAgfVxufVxuXG52YXIgcG9zdFByb2Nlc3NvciA9IHtcbiAgcHJvY2Vzc29yczoge30sXG4gIGFkZFBvc3RQcm9jZXNzb3IobW9kdWxlKSB7XG4gICAgdGhpcy5wcm9jZXNzb3JzW21vZHVsZS5uYW1lXSA9IG1vZHVsZTtcbiAgfSxcbiAgaGFuZGxlKHByb2Nlc3NvcnMsIHZhbHVlLCBrZXksIG9wdGlvbnMsIHRyYW5zbGF0b3IpIHtcbiAgICBwcm9jZXNzb3JzLmZvckVhY2gocHJvY2Vzc29yID0+IHtcbiAgICAgIGlmICh0aGlzLnByb2Nlc3NvcnNbcHJvY2Vzc29yXSkgdmFsdWUgPSB0aGlzLnByb2Nlc3NvcnNbcHJvY2Vzc29yXS5wcm9jZXNzKHZhbHVlLCBrZXksIG9wdGlvbnMsIHRyYW5zbGF0b3IpO1xuICAgIH0pO1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxufTtcblxuY29uc3QgY2hlY2tlZExvYWRlZEZvciA9IHt9O1xuY2xhc3MgVHJhbnNsYXRvciBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yKHNlcnZpY2VzKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IHt9O1xuICAgIHN1cGVyKCk7XG4gICAgY29weShbJ3Jlc291cmNlU3RvcmUnLCAnbGFuZ3VhZ2VVdGlscycsICdwbHVyYWxSZXNvbHZlcicsICdpbnRlcnBvbGF0b3InLCAnYmFja2VuZENvbm5lY3RvcicsICdpMThuRm9ybWF0JywgJ3V0aWxzJ10sIHNlcnZpY2VzLCB0aGlzKTtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIGlmICh0aGlzLm9wdGlvbnMua2V5U2VwYXJhdG9yID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5rZXlTZXBhcmF0b3IgPSAnLic7XG4gICAgfVxuICAgIHRoaXMubG9nZ2VyID0gYmFzZUxvZ2dlci5jcmVhdGUoJ3RyYW5zbGF0b3InKTtcbiAgfVxuICBjaGFuZ2VMYW5ndWFnZShsbmcpIHtcbiAgICBpZiAobG5nKSB0aGlzLmxhbmd1YWdlID0gbG5nO1xuICB9XG4gIGV4aXN0cyhrZXkpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge1xuICAgICAgaW50ZXJwb2xhdGlvbjoge31cbiAgICB9O1xuICAgIGlmIChrZXkgPT09IHVuZGVmaW5lZCB8fCBrZXkgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3QgcmVzb2x2ZWQgPSB0aGlzLnJlc29sdmUoa2V5LCBvcHRpb25zKTtcbiAgICByZXR1cm4gcmVzb2x2ZWQgJiYgcmVzb2x2ZWQucmVzICE9PSB1bmRlZmluZWQ7XG4gIH1cbiAgZXh0cmFjdEZyb21LZXkoa2V5LCBvcHRpb25zKSB7XG4gICAgbGV0IG5zU2VwYXJhdG9yID0gb3B0aW9ucy5uc1NlcGFyYXRvciAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy5uc1NlcGFyYXRvciA6IHRoaXMub3B0aW9ucy5uc1NlcGFyYXRvcjtcbiAgICBpZiAobnNTZXBhcmF0b3IgPT09IHVuZGVmaW5lZCkgbnNTZXBhcmF0b3IgPSAnOic7XG4gICAgY29uc3Qga2V5U2VwYXJhdG9yID0gb3B0aW9ucy5rZXlTZXBhcmF0b3IgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMua2V5U2VwYXJhdG9yIDogdGhpcy5vcHRpb25zLmtleVNlcGFyYXRvcjtcbiAgICBsZXQgbmFtZXNwYWNlcyA9IG9wdGlvbnMubnMgfHwgdGhpcy5vcHRpb25zLmRlZmF1bHROUyB8fCBbXTtcbiAgICBjb25zdCB3b3VsZENoZWNrRm9yTnNJbktleSA9IG5zU2VwYXJhdG9yICYmIGtleS5pbmRleE9mKG5zU2VwYXJhdG9yKSA+IC0xO1xuICAgIGNvbnN0IHNlZW1zTmF0dXJhbExhbmd1YWdlID0gIXRoaXMub3B0aW9ucy51c2VyRGVmaW5lZEtleVNlcGFyYXRvciAmJiAhb3B0aW9ucy5rZXlTZXBhcmF0b3IgJiYgIXRoaXMub3B0aW9ucy51c2VyRGVmaW5lZE5zU2VwYXJhdG9yICYmICFvcHRpb25zLm5zU2VwYXJhdG9yICYmICFsb29rc0xpa2VPYmplY3RQYXRoKGtleSwgbnNTZXBhcmF0b3IsIGtleVNlcGFyYXRvcik7XG4gICAgaWYgKHdvdWxkQ2hlY2tGb3JOc0luS2V5ICYmICFzZWVtc05hdHVyYWxMYW5ndWFnZSkge1xuICAgICAgY29uc3QgbSA9IGtleS5tYXRjaCh0aGlzLmludGVycG9sYXRvci5uZXN0aW5nUmVnZXhwKTtcbiAgICAgIGlmIChtICYmIG0ubGVuZ3RoID4gMCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGtleSxcbiAgICAgICAgICBuYW1lc3BhY2VzXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBjb25zdCBwYXJ0cyA9IGtleS5zcGxpdChuc1NlcGFyYXRvcik7XG4gICAgICBpZiAobnNTZXBhcmF0b3IgIT09IGtleVNlcGFyYXRvciB8fCBuc1NlcGFyYXRvciA9PT0ga2V5U2VwYXJhdG9yICYmIHRoaXMub3B0aW9ucy5ucy5pbmRleE9mKHBhcnRzWzBdKSA+IC0xKSBuYW1lc3BhY2VzID0gcGFydHMuc2hpZnQoKTtcbiAgICAgIGtleSA9IHBhcnRzLmpvaW4oa2V5U2VwYXJhdG9yKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBuYW1lc3BhY2VzID09PSAnc3RyaW5nJykgbmFtZXNwYWNlcyA9IFtuYW1lc3BhY2VzXTtcbiAgICByZXR1cm4ge1xuICAgICAga2V5LFxuICAgICAgbmFtZXNwYWNlc1xuICAgIH07XG4gIH1cbiAgdHJhbnNsYXRlKGtleXMsIG9wdGlvbnMsIGxhc3RLZXkpIHtcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMgIT09ICdvYmplY3QnICYmIHRoaXMub3B0aW9ucy5vdmVybG9hZFRyYW5zbGF0aW9uT3B0aW9uSGFuZGxlcikge1xuICAgICAgb3B0aW9ucyA9IHRoaXMub3B0aW9ucy5vdmVybG9hZFRyYW5zbGF0aW9uT3B0aW9uSGFuZGxlcihhcmd1bWVudHMpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdvYmplY3QnKSBvcHRpb25zID0ge1xuICAgICAgLi4ub3B0aW9uc1xuICAgIH07XG4gICAgaWYgKCFvcHRpb25zKSBvcHRpb25zID0ge307XG4gICAgaWYgKGtleXMgPT09IHVuZGVmaW5lZCB8fCBrZXlzID09PSBudWxsKSByZXR1cm4gJyc7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGtleXMpKSBrZXlzID0gW1N0cmluZyhrZXlzKV07XG4gICAgY29uc3QgcmV0dXJuRGV0YWlscyA9IG9wdGlvbnMucmV0dXJuRGV0YWlscyAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy5yZXR1cm5EZXRhaWxzIDogdGhpcy5vcHRpb25zLnJldHVybkRldGFpbHM7XG4gICAgY29uc3Qga2V5U2VwYXJhdG9yID0gb3B0aW9ucy5rZXlTZXBhcmF0b3IgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMua2V5U2VwYXJhdG9yIDogdGhpcy5vcHRpb25zLmtleVNlcGFyYXRvcjtcbiAgICBjb25zdCB7XG4gICAgICBrZXksXG4gICAgICBuYW1lc3BhY2VzXG4gICAgfSA9IHRoaXMuZXh0cmFjdEZyb21LZXkoa2V5c1trZXlzLmxlbmd0aCAtIDFdLCBvcHRpb25zKTtcbiAgICBjb25zdCBuYW1lc3BhY2UgPSBuYW1lc3BhY2VzW25hbWVzcGFjZXMubGVuZ3RoIC0gMV07XG4gICAgY29uc3QgbG5nID0gb3B0aW9ucy5sbmcgfHwgdGhpcy5sYW5ndWFnZTtcbiAgICBjb25zdCBhcHBlbmROYW1lc3BhY2VUb0NJTW9kZSA9IG9wdGlvbnMuYXBwZW5kTmFtZXNwYWNlVG9DSU1vZGUgfHwgdGhpcy5vcHRpb25zLmFwcGVuZE5hbWVzcGFjZVRvQ0lNb2RlO1xuICAgIGlmIChsbmcgJiYgbG5nLnRvTG93ZXJDYXNlKCkgPT09ICdjaW1vZGUnKSB7XG4gICAgICBpZiAoYXBwZW5kTmFtZXNwYWNlVG9DSU1vZGUpIHtcbiAgICAgICAgY29uc3QgbnNTZXBhcmF0b3IgPSBvcHRpb25zLm5zU2VwYXJhdG9yIHx8IHRoaXMub3B0aW9ucy5uc1NlcGFyYXRvcjtcbiAgICAgICAgaWYgKHJldHVybkRldGFpbHMpIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzOiBgJHtuYW1lc3BhY2V9JHtuc1NlcGFyYXRvcn0ke2tleX1gLFxuICAgICAgICAgICAgdXNlZEtleToga2V5LFxuICAgICAgICAgICAgZXhhY3RVc2VkS2V5OiBrZXksXG4gICAgICAgICAgICB1c2VkTG5nOiBsbmcsXG4gICAgICAgICAgICB1c2VkTlM6IG5hbWVzcGFjZVxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGAke25hbWVzcGFjZX0ke25zU2VwYXJhdG9yfSR7a2V5fWA7XG4gICAgICB9XG4gICAgICBpZiAocmV0dXJuRGV0YWlscykge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHJlczoga2V5LFxuICAgICAgICAgIHVzZWRLZXk6IGtleSxcbiAgICAgICAgICBleGFjdFVzZWRLZXk6IGtleSxcbiAgICAgICAgICB1c2VkTG5nOiBsbmcsXG4gICAgICAgICAgdXNlZE5TOiBuYW1lc3BhY2VcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBrZXk7XG4gICAgfVxuICAgIGNvbnN0IHJlc29sdmVkID0gdGhpcy5yZXNvbHZlKGtleXMsIG9wdGlvbnMpO1xuICAgIGxldCByZXMgPSByZXNvbHZlZCAmJiByZXNvbHZlZC5yZXM7XG4gICAgY29uc3QgcmVzVXNlZEtleSA9IHJlc29sdmVkICYmIHJlc29sdmVkLnVzZWRLZXkgfHwga2V5O1xuICAgIGNvbnN0IHJlc0V4YWN0VXNlZEtleSA9IHJlc29sdmVkICYmIHJlc29sdmVkLmV4YWN0VXNlZEtleSB8fCBrZXk7XG4gICAgY29uc3QgcmVzVHlwZSA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuYXBwbHkocmVzKTtcbiAgICBjb25zdCBub09iamVjdCA9IFsnW29iamVjdCBOdW1iZXJdJywgJ1tvYmplY3QgRnVuY3Rpb25dJywgJ1tvYmplY3QgUmVnRXhwXSddO1xuICAgIGNvbnN0IGpvaW5BcnJheXMgPSBvcHRpb25zLmpvaW5BcnJheXMgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMuam9pbkFycmF5cyA6IHRoaXMub3B0aW9ucy5qb2luQXJyYXlzO1xuICAgIGNvbnN0IGhhbmRsZUFzT2JqZWN0SW5JMThuRm9ybWF0ID0gIXRoaXMuaTE4bkZvcm1hdCB8fCB0aGlzLmkxOG5Gb3JtYXQuaGFuZGxlQXNPYmplY3Q7XG4gICAgY29uc3QgaGFuZGxlQXNPYmplY3QgPSB0eXBlb2YgcmVzICE9PSAnc3RyaW5nJyAmJiB0eXBlb2YgcmVzICE9PSAnYm9vbGVhbicgJiYgdHlwZW9mIHJlcyAhPT0gJ251bWJlcic7XG4gICAgaWYgKGhhbmRsZUFzT2JqZWN0SW5JMThuRm9ybWF0ICYmIHJlcyAmJiBoYW5kbGVBc09iamVjdCAmJiBub09iamVjdC5pbmRleE9mKHJlc1R5cGUpIDwgMCAmJiAhKHR5cGVvZiBqb2luQXJyYXlzID09PSAnc3RyaW5nJyAmJiByZXNUeXBlID09PSAnW29iamVjdCBBcnJheV0nKSkge1xuICAgICAgaWYgKCFvcHRpb25zLnJldHVybk9iamVjdHMgJiYgIXRoaXMub3B0aW9ucy5yZXR1cm5PYmplY3RzKSB7XG4gICAgICAgIGlmICghdGhpcy5vcHRpb25zLnJldHVybmVkT2JqZWN0SGFuZGxlcikge1xuICAgICAgICAgIHRoaXMubG9nZ2VyLndhcm4oJ2FjY2Vzc2luZyBhbiBvYmplY3QgLSBidXQgcmV0dXJuT2JqZWN0cyBvcHRpb25zIGlzIG5vdCBlbmFibGVkIScpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHIgPSB0aGlzLm9wdGlvbnMucmV0dXJuZWRPYmplY3RIYW5kbGVyID8gdGhpcy5vcHRpb25zLnJldHVybmVkT2JqZWN0SGFuZGxlcihyZXNVc2VkS2V5LCByZXMsIHtcbiAgICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICAgIG5zOiBuYW1lc3BhY2VzXG4gICAgICAgIH0pIDogYGtleSAnJHtrZXl9ICgke3RoaXMubGFuZ3VhZ2V9KScgcmV0dXJuZWQgYW4gb2JqZWN0IGluc3RlYWQgb2Ygc3RyaW5nLmA7XG4gICAgICAgIGlmIChyZXR1cm5EZXRhaWxzKSB7XG4gICAgICAgICAgcmVzb2x2ZWQucmVzID0gcjtcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZWQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHI7XG4gICAgICB9XG4gICAgICBpZiAoa2V5U2VwYXJhdG9yKSB7XG4gICAgICAgIGNvbnN0IHJlc1R5cGVJc0FycmF5ID0gcmVzVHlwZSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbiAgICAgICAgY29uc3QgY29weSA9IHJlc1R5cGVJc0FycmF5ID8gW10gOiB7fTtcbiAgICAgICAgY29uc3QgbmV3S2V5VG9Vc2UgPSByZXNUeXBlSXNBcnJheSA/IHJlc0V4YWN0VXNlZEtleSA6IHJlc1VzZWRLZXk7XG4gICAgICAgIGZvciAoY29uc3QgbSBpbiByZXMpIHtcbiAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHJlcywgbSkpIHtcbiAgICAgICAgICAgIGNvbnN0IGRlZXBLZXkgPSBgJHtuZXdLZXlUb1VzZX0ke2tleVNlcGFyYXRvcn0ke219YDtcbiAgICAgICAgICAgIGNvcHlbbV0gPSB0aGlzLnRyYW5zbGF0ZShkZWVwS2V5LCB7XG4gICAgICAgICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgICAgICAgIC4uLntcbiAgICAgICAgICAgICAgICBqb2luQXJyYXlzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBuczogbmFtZXNwYWNlc1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChjb3B5W21dID09PSBkZWVwS2V5KSBjb3B5W21dID0gcmVzW21dO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXMgPSBjb3B5O1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaGFuZGxlQXNPYmplY3RJbkkxOG5Gb3JtYXQgJiYgdHlwZW9mIGpvaW5BcnJheXMgPT09ICdzdHJpbmcnICYmIHJlc1R5cGUgPT09ICdbb2JqZWN0IEFycmF5XScpIHtcbiAgICAgIHJlcyA9IHJlcy5qb2luKGpvaW5BcnJheXMpO1xuICAgICAgaWYgKHJlcykgcmVzID0gdGhpcy5leHRlbmRUcmFuc2xhdGlvbihyZXMsIGtleXMsIG9wdGlvbnMsIGxhc3RLZXkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgdXNlZERlZmF1bHQgPSBmYWxzZTtcbiAgICAgIGxldCB1c2VkS2V5ID0gZmFsc2U7XG4gICAgICBjb25zdCBuZWVkc1BsdXJhbEhhbmRsaW5nID0gb3B0aW9ucy5jb3VudCAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBvcHRpb25zLmNvdW50ICE9PSAnc3RyaW5nJztcbiAgICAgIGNvbnN0IGhhc0RlZmF1bHRWYWx1ZSA9IFRyYW5zbGF0b3IuaGFzRGVmYXVsdFZhbHVlKG9wdGlvbnMpO1xuICAgICAgY29uc3QgZGVmYXVsdFZhbHVlU3VmZml4ID0gbmVlZHNQbHVyYWxIYW5kbGluZyA/IHRoaXMucGx1cmFsUmVzb2x2ZXIuZ2V0U3VmZml4KGxuZywgb3B0aW9ucy5jb3VudCwgb3B0aW9ucykgOiAnJztcbiAgICAgIGNvbnN0IGRlZmF1bHRWYWx1ZVN1ZmZpeE9yZGluYWxGYWxsYmFjayA9IG9wdGlvbnMub3JkaW5hbCAmJiBuZWVkc1BsdXJhbEhhbmRsaW5nID8gdGhpcy5wbHVyYWxSZXNvbHZlci5nZXRTdWZmaXgobG5nLCBvcHRpb25zLmNvdW50LCB7XG4gICAgICAgIG9yZGluYWw6IGZhbHNlXG4gICAgICB9KSA6ICcnO1xuICAgICAgY29uc3QgZGVmYXVsdFZhbHVlID0gb3B0aW9uc1tgZGVmYXVsdFZhbHVlJHtkZWZhdWx0VmFsdWVTdWZmaXh9YF0gfHwgb3B0aW9uc1tgZGVmYXVsdFZhbHVlJHtkZWZhdWx0VmFsdWVTdWZmaXhPcmRpbmFsRmFsbGJhY2t9YF0gfHwgb3B0aW9ucy5kZWZhdWx0VmFsdWU7XG4gICAgICBpZiAoIXRoaXMuaXNWYWxpZExvb2t1cChyZXMpICYmIGhhc0RlZmF1bHRWYWx1ZSkge1xuICAgICAgICB1c2VkRGVmYXVsdCA9IHRydWU7XG4gICAgICAgIHJlcyA9IGRlZmF1bHRWYWx1ZTtcbiAgICAgIH1cbiAgICAgIGlmICghdGhpcy5pc1ZhbGlkTG9va3VwKHJlcykpIHtcbiAgICAgICAgdXNlZEtleSA9IHRydWU7XG4gICAgICAgIHJlcyA9IGtleTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG1pc3NpbmdLZXlOb1ZhbHVlRmFsbGJhY2tUb0tleSA9IG9wdGlvbnMubWlzc2luZ0tleU5vVmFsdWVGYWxsYmFja1RvS2V5IHx8IHRoaXMub3B0aW9ucy5taXNzaW5nS2V5Tm9WYWx1ZUZhbGxiYWNrVG9LZXk7XG4gICAgICBjb25zdCByZXNGb3JNaXNzaW5nID0gbWlzc2luZ0tleU5vVmFsdWVGYWxsYmFja1RvS2V5ICYmIHVzZWRLZXkgPyB1bmRlZmluZWQgOiByZXM7XG4gICAgICBjb25zdCB1cGRhdGVNaXNzaW5nID0gaGFzRGVmYXVsdFZhbHVlICYmIGRlZmF1bHRWYWx1ZSAhPT0gcmVzICYmIHRoaXMub3B0aW9ucy51cGRhdGVNaXNzaW5nO1xuICAgICAgaWYgKHVzZWRLZXkgfHwgdXNlZERlZmF1bHQgfHwgdXBkYXRlTWlzc2luZykge1xuICAgICAgICB0aGlzLmxvZ2dlci5sb2codXBkYXRlTWlzc2luZyA/ICd1cGRhdGVLZXknIDogJ21pc3NpbmdLZXknLCBsbmcsIG5hbWVzcGFjZSwga2V5LCB1cGRhdGVNaXNzaW5nID8gZGVmYXVsdFZhbHVlIDogcmVzKTtcbiAgICAgICAgaWYgKGtleVNlcGFyYXRvcikge1xuICAgICAgICAgIGNvbnN0IGZrID0gdGhpcy5yZXNvbHZlKGtleSwge1xuICAgICAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgICAgIGtleVNlcGFyYXRvcjogZmFsc2VcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBpZiAoZmsgJiYgZmsucmVzKSB0aGlzLmxvZ2dlci53YXJuKCdTZWVtcyB0aGUgbG9hZGVkIHRyYW5zbGF0aW9ucyB3ZXJlIGluIGZsYXQgSlNPTiBmb3JtYXQgaW5zdGVhZCBvZiBuZXN0ZWQuIEVpdGhlciBzZXQga2V5U2VwYXJhdG9yOiBmYWxzZSBvbiBpbml0IG9yIG1ha2Ugc3VyZSB5b3VyIHRyYW5zbGF0aW9ucyBhcmUgcHVibGlzaGVkIGluIG5lc3RlZCBmb3JtYXQuJyk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGxuZ3MgPSBbXTtcbiAgICAgICAgY29uc3QgZmFsbGJhY2tMbmdzID0gdGhpcy5sYW5ndWFnZVV0aWxzLmdldEZhbGxiYWNrQ29kZXModGhpcy5vcHRpb25zLmZhbGxiYWNrTG5nLCBvcHRpb25zLmxuZyB8fCB0aGlzLmxhbmd1YWdlKTtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zYXZlTWlzc2luZ1RvID09PSAnZmFsbGJhY2snICYmIGZhbGxiYWNrTG5ncyAmJiBmYWxsYmFja0xuZ3NbMF0pIHtcbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZhbGxiYWNrTG5ncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbG5ncy5wdXNoKGZhbGxiYWNrTG5nc1tpXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5zYXZlTWlzc2luZ1RvID09PSAnYWxsJykge1xuICAgICAgICAgIGxuZ3MgPSB0aGlzLmxhbmd1YWdlVXRpbHMudG9SZXNvbHZlSGllcmFyY2h5KG9wdGlvbnMubG5nIHx8IHRoaXMubGFuZ3VhZ2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxuZ3MucHVzaChvcHRpb25zLmxuZyB8fCB0aGlzLmxhbmd1YWdlKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzZW5kID0gKGwsIGssIHNwZWNpZmljRGVmYXVsdFZhbHVlKSA9PiB7XG4gICAgICAgICAgY29uc3QgZGVmYXVsdEZvck1pc3NpbmcgPSBoYXNEZWZhdWx0VmFsdWUgJiYgc3BlY2lmaWNEZWZhdWx0VmFsdWUgIT09IHJlcyA/IHNwZWNpZmljRGVmYXVsdFZhbHVlIDogcmVzRm9yTWlzc2luZztcbiAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLm1pc3NpbmdLZXlIYW5kbGVyKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMubWlzc2luZ0tleUhhbmRsZXIobCwgbmFtZXNwYWNlLCBrLCBkZWZhdWx0Rm9yTWlzc2luZywgdXBkYXRlTWlzc2luZywgb3B0aW9ucyk7XG4gICAgICAgICAgfSBlbHNlIGlmICh0aGlzLmJhY2tlbmRDb25uZWN0b3IgJiYgdGhpcy5iYWNrZW5kQ29ubmVjdG9yLnNhdmVNaXNzaW5nKSB7XG4gICAgICAgICAgICB0aGlzLmJhY2tlbmRDb25uZWN0b3Iuc2F2ZU1pc3NpbmcobCwgbmFtZXNwYWNlLCBrLCBkZWZhdWx0Rm9yTWlzc2luZywgdXBkYXRlTWlzc2luZywgb3B0aW9ucyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuZW1pdCgnbWlzc2luZ0tleScsIGwsIG5hbWVzcGFjZSwgaywgcmVzKTtcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zYXZlTWlzc2luZykge1xuICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2F2ZU1pc3NpbmdQbHVyYWxzICYmIG5lZWRzUGx1cmFsSGFuZGxpbmcpIHtcbiAgICAgICAgICAgIGxuZ3MuZm9yRWFjaChsYW5ndWFnZSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMucGx1cmFsUmVzb2x2ZXIuZ2V0U3VmZml4ZXMobGFuZ3VhZ2UsIG9wdGlvbnMpLmZvckVhY2goc3VmZml4ID0+IHtcbiAgICAgICAgICAgICAgICBzZW5kKFtsYW5ndWFnZV0sIGtleSArIHN1ZmZpeCwgb3B0aW9uc1tgZGVmYXVsdFZhbHVlJHtzdWZmaXh9YF0gfHwgZGVmYXVsdFZhbHVlKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VuZChsbmdzLCBrZXksIGRlZmF1bHRWYWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXMgPSB0aGlzLmV4dGVuZFRyYW5zbGF0aW9uKHJlcywga2V5cywgb3B0aW9ucywgcmVzb2x2ZWQsIGxhc3RLZXkpO1xuICAgICAgaWYgKHVzZWRLZXkgJiYgcmVzID09PSBrZXkgJiYgdGhpcy5vcHRpb25zLmFwcGVuZE5hbWVzcGFjZVRvTWlzc2luZ0tleSkgcmVzID0gYCR7bmFtZXNwYWNlfToke2tleX1gO1xuICAgICAgaWYgKCh1c2VkS2V5IHx8IHVzZWREZWZhdWx0KSAmJiB0aGlzLm9wdGlvbnMucGFyc2VNaXNzaW5nS2V5SGFuZGxlcikge1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmNvbXBhdGliaWxpdHlBUEkgIT09ICd2MScpIHtcbiAgICAgICAgICByZXMgPSB0aGlzLm9wdGlvbnMucGFyc2VNaXNzaW5nS2V5SGFuZGxlcih0aGlzLm9wdGlvbnMuYXBwZW5kTmFtZXNwYWNlVG9NaXNzaW5nS2V5ID8gYCR7bmFtZXNwYWNlfToke2tleX1gIDoga2V5LCB1c2VkRGVmYXVsdCA/IHJlcyA6IHVuZGVmaW5lZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzID0gdGhpcy5vcHRpb25zLnBhcnNlTWlzc2luZ0tleUhhbmRsZXIocmVzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAocmV0dXJuRGV0YWlscykge1xuICAgICAgcmVzb2x2ZWQucmVzID0gcmVzO1xuICAgICAgcmV0dXJuIHJlc29sdmVkO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xuICB9XG4gIGV4dGVuZFRyYW5zbGF0aW9uKHJlcywga2V5LCBvcHRpb25zLCByZXNvbHZlZCwgbGFzdEtleSkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgaWYgKHRoaXMuaTE4bkZvcm1hdCAmJiB0aGlzLmkxOG5Gb3JtYXQucGFyc2UpIHtcbiAgICAgIHJlcyA9IHRoaXMuaTE4bkZvcm1hdC5wYXJzZShyZXMsIHtcbiAgICAgICAgLi4udGhpcy5vcHRpb25zLmludGVycG9sYXRpb24uZGVmYXVsdFZhcmlhYmxlcyxcbiAgICAgICAgLi4ub3B0aW9uc1xuICAgICAgfSwgb3B0aW9ucy5sbmcgfHwgdGhpcy5sYW5ndWFnZSB8fCByZXNvbHZlZC51c2VkTG5nLCByZXNvbHZlZC51c2VkTlMsIHJlc29sdmVkLnVzZWRLZXksIHtcbiAgICAgICAgcmVzb2x2ZWRcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoIW9wdGlvbnMuc2tpcEludGVycG9sYXRpb24pIHtcbiAgICAgIGlmIChvcHRpb25zLmludGVycG9sYXRpb24pIHRoaXMuaW50ZXJwb2xhdG9yLmluaXQoe1xuICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICAuLi57XG4gICAgICAgICAgaW50ZXJwb2xhdGlvbjoge1xuICAgICAgICAgICAgLi4udGhpcy5vcHRpb25zLmludGVycG9sYXRpb24sXG4gICAgICAgICAgICAuLi5vcHRpb25zLmludGVycG9sYXRpb25cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgY29uc3Qgc2tpcE9uVmFyaWFibGVzID0gdHlwZW9mIHJlcyA9PT0gJ3N0cmluZycgJiYgKG9wdGlvbnMgJiYgb3B0aW9ucy5pbnRlcnBvbGF0aW9uICYmIG9wdGlvbnMuaW50ZXJwb2xhdGlvbi5za2lwT25WYXJpYWJsZXMgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMuaW50ZXJwb2xhdGlvbi5za2lwT25WYXJpYWJsZXMgOiB0aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbi5za2lwT25WYXJpYWJsZXMpO1xuICAgICAgbGV0IG5lc3RCZWY7XG4gICAgICBpZiAoc2tpcE9uVmFyaWFibGVzKSB7XG4gICAgICAgIGNvbnN0IG5iID0gcmVzLm1hdGNoKHRoaXMuaW50ZXJwb2xhdG9yLm5lc3RpbmdSZWdleHApO1xuICAgICAgICBuZXN0QmVmID0gbmIgJiYgbmIubGVuZ3RoO1xuICAgICAgfVxuICAgICAgbGV0IGRhdGEgPSBvcHRpb25zLnJlcGxhY2UgJiYgdHlwZW9mIG9wdGlvbnMucmVwbGFjZSAhPT0gJ3N0cmluZycgPyBvcHRpb25zLnJlcGxhY2UgOiBvcHRpb25zO1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5pbnRlcnBvbGF0aW9uLmRlZmF1bHRWYXJpYWJsZXMpIGRhdGEgPSB7XG4gICAgICAgIC4uLnRoaXMub3B0aW9ucy5pbnRlcnBvbGF0aW9uLmRlZmF1bHRWYXJpYWJsZXMsXG4gICAgICAgIC4uLmRhdGFcbiAgICAgIH07XG4gICAgICByZXMgPSB0aGlzLmludGVycG9sYXRvci5pbnRlcnBvbGF0ZShyZXMsIGRhdGEsIG9wdGlvbnMubG5nIHx8IHRoaXMubGFuZ3VhZ2UsIG9wdGlvbnMpO1xuICAgICAgaWYgKHNraXBPblZhcmlhYmxlcykge1xuICAgICAgICBjb25zdCBuYSA9IHJlcy5tYXRjaCh0aGlzLmludGVycG9sYXRvci5uZXN0aW5nUmVnZXhwKTtcbiAgICAgICAgY29uc3QgbmVzdEFmdCA9IG5hICYmIG5hLmxlbmd0aDtcbiAgICAgICAgaWYgKG5lc3RCZWYgPCBuZXN0QWZ0KSBvcHRpb25zLm5lc3QgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmICghb3B0aW9ucy5sbmcgJiYgdGhpcy5vcHRpb25zLmNvbXBhdGliaWxpdHlBUEkgIT09ICd2MScgJiYgcmVzb2x2ZWQgJiYgcmVzb2x2ZWQucmVzKSBvcHRpb25zLmxuZyA9IHJlc29sdmVkLnVzZWRMbmc7XG4gICAgICBpZiAob3B0aW9ucy5uZXN0ICE9PSBmYWxzZSkgcmVzID0gdGhpcy5pbnRlcnBvbGF0b3IubmVzdChyZXMsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZm9yICh2YXIgX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBuZXcgQXJyYXkoX2xlbiksIF9rZXkgPSAwOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG4gICAgICAgICAgYXJnc1tfa2V5XSA9IGFyZ3VtZW50c1tfa2V5XTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobGFzdEtleSAmJiBsYXN0S2V5WzBdID09PSBhcmdzWzBdICYmICFvcHRpb25zLmNvbnRleHQpIHtcbiAgICAgICAgICBfdGhpcy5sb2dnZXIud2FybihgSXQgc2VlbXMgeW91IGFyZSBuZXN0aW5nIHJlY3Vyc2l2ZWx5IGtleTogJHthcmdzWzBdfSBpbiBrZXk6ICR7a2V5WzBdfWApO1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfdGhpcy50cmFuc2xhdGUoLi4uYXJncywga2V5KTtcbiAgICAgIH0sIG9wdGlvbnMpO1xuICAgICAgaWYgKG9wdGlvbnMuaW50ZXJwb2xhdGlvbikgdGhpcy5pbnRlcnBvbGF0b3IucmVzZXQoKTtcbiAgICB9XG4gICAgY29uc3QgcG9zdFByb2Nlc3MgPSBvcHRpb25zLnBvc3RQcm9jZXNzIHx8IHRoaXMub3B0aW9ucy5wb3N0UHJvY2VzcztcbiAgICBjb25zdCBwb3N0UHJvY2Vzc29yTmFtZXMgPSB0eXBlb2YgcG9zdFByb2Nlc3MgPT09ICdzdHJpbmcnID8gW3Bvc3RQcm9jZXNzXSA6IHBvc3RQcm9jZXNzO1xuICAgIGlmIChyZXMgIT09IHVuZGVmaW5lZCAmJiByZXMgIT09IG51bGwgJiYgcG9zdFByb2Nlc3Nvck5hbWVzICYmIHBvc3RQcm9jZXNzb3JOYW1lcy5sZW5ndGggJiYgb3B0aW9ucy5hcHBseVBvc3RQcm9jZXNzb3IgIT09IGZhbHNlKSB7XG4gICAgICByZXMgPSBwb3N0UHJvY2Vzc29yLmhhbmRsZShwb3N0UHJvY2Vzc29yTmFtZXMsIHJlcywga2V5LCB0aGlzLm9wdGlvbnMgJiYgdGhpcy5vcHRpb25zLnBvc3RQcm9jZXNzUGFzc1Jlc29sdmVkID8ge1xuICAgICAgICBpMThuUmVzb2x2ZWQ6IHJlc29sdmVkLFxuICAgICAgICAuLi5vcHRpb25zXG4gICAgICB9IDogb3B0aW9ucywgdGhpcyk7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG4gIH1cbiAgcmVzb2x2ZShrZXlzKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IHt9O1xuICAgIGxldCBmb3VuZDtcbiAgICBsZXQgdXNlZEtleTtcbiAgICBsZXQgZXhhY3RVc2VkS2V5O1xuICAgIGxldCB1c2VkTG5nO1xuICAgIGxldCB1c2VkTlM7XG4gICAgaWYgKHR5cGVvZiBrZXlzID09PSAnc3RyaW5nJykga2V5cyA9IFtrZXlzXTtcbiAgICBrZXlzLmZvckVhY2goayA9PiB7XG4gICAgICBpZiAodGhpcy5pc1ZhbGlkTG9va3VwKGZvdW5kKSkgcmV0dXJuO1xuICAgICAgY29uc3QgZXh0cmFjdGVkID0gdGhpcy5leHRyYWN0RnJvbUtleShrLCBvcHRpb25zKTtcbiAgICAgIGNvbnN0IGtleSA9IGV4dHJhY3RlZC5rZXk7XG4gICAgICB1c2VkS2V5ID0ga2V5O1xuICAgICAgbGV0IG5hbWVzcGFjZXMgPSBleHRyYWN0ZWQubmFtZXNwYWNlcztcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuZmFsbGJhY2tOUykgbmFtZXNwYWNlcyA9IG5hbWVzcGFjZXMuY29uY2F0KHRoaXMub3B0aW9ucy5mYWxsYmFja05TKTtcbiAgICAgIGNvbnN0IG5lZWRzUGx1cmFsSGFuZGxpbmcgPSBvcHRpb25zLmNvdW50ICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIG9wdGlvbnMuY291bnQgIT09ICdzdHJpbmcnO1xuICAgICAgY29uc3QgbmVlZHNaZXJvU3VmZml4TG9va3VwID0gbmVlZHNQbHVyYWxIYW5kbGluZyAmJiAhb3B0aW9ucy5vcmRpbmFsICYmIG9wdGlvbnMuY291bnQgPT09IDAgJiYgdGhpcy5wbHVyYWxSZXNvbHZlci5zaG91bGRVc2VJbnRsQXBpKCk7XG4gICAgICBjb25zdCBuZWVkc0NvbnRleHRIYW5kbGluZyA9IG9wdGlvbnMuY29udGV4dCAhPT0gdW5kZWZpbmVkICYmICh0eXBlb2Ygb3B0aW9ucy5jb250ZXh0ID09PSAnc3RyaW5nJyB8fCB0eXBlb2Ygb3B0aW9ucy5jb250ZXh0ID09PSAnbnVtYmVyJykgJiYgb3B0aW9ucy5jb250ZXh0ICE9PSAnJztcbiAgICAgIGNvbnN0IGNvZGVzID0gb3B0aW9ucy5sbmdzID8gb3B0aW9ucy5sbmdzIDogdGhpcy5sYW5ndWFnZVV0aWxzLnRvUmVzb2x2ZUhpZXJhcmNoeShvcHRpb25zLmxuZyB8fCB0aGlzLmxhbmd1YWdlLCBvcHRpb25zLmZhbGxiYWNrTG5nKTtcbiAgICAgIG5hbWVzcGFjZXMuZm9yRWFjaChucyA9PiB7XG4gICAgICAgIGlmICh0aGlzLmlzVmFsaWRMb29rdXAoZm91bmQpKSByZXR1cm47XG4gICAgICAgIHVzZWROUyA9IG5zO1xuICAgICAgICBpZiAoIWNoZWNrZWRMb2FkZWRGb3JbYCR7Y29kZXNbMF19LSR7bnN9YF0gJiYgdGhpcy51dGlscyAmJiB0aGlzLnV0aWxzLmhhc0xvYWRlZE5hbWVzcGFjZSAmJiAhdGhpcy51dGlscy5oYXNMb2FkZWROYW1lc3BhY2UodXNlZE5TKSkge1xuICAgICAgICAgIGNoZWNrZWRMb2FkZWRGb3JbYCR7Y29kZXNbMF19LSR7bnN9YF0gPSB0cnVlO1xuICAgICAgICAgIHRoaXMubG9nZ2VyLndhcm4oYGtleSBcIiR7dXNlZEtleX1cIiBmb3IgbGFuZ3VhZ2VzIFwiJHtjb2Rlcy5qb2luKCcsICcpfVwiIHdvbid0IGdldCByZXNvbHZlZCBhcyBuYW1lc3BhY2UgXCIke3VzZWROU31cIiB3YXMgbm90IHlldCBsb2FkZWRgLCAnVGhpcyBtZWFucyBzb21ldGhpbmcgSVMgV1JPTkcgaW4geW91ciBzZXR1cC4gWW91IGFjY2VzcyB0aGUgdCBmdW5jdGlvbiBiZWZvcmUgaTE4bmV4dC5pbml0IC8gaTE4bmV4dC5sb2FkTmFtZXNwYWNlIC8gaTE4bmV4dC5jaGFuZ2VMYW5ndWFnZSB3YXMgZG9uZS4gV2FpdCBmb3IgdGhlIGNhbGxiYWNrIG9yIFByb21pc2UgdG8gcmVzb2x2ZSBiZWZvcmUgYWNjZXNzaW5nIGl0ISEhJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29kZXMuZm9yRWFjaChjb2RlID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5pc1ZhbGlkTG9va3VwKGZvdW5kKSkgcmV0dXJuO1xuICAgICAgICAgIHVzZWRMbmcgPSBjb2RlO1xuICAgICAgICAgIGNvbnN0IGZpbmFsS2V5cyA9IFtrZXldO1xuICAgICAgICAgIGlmICh0aGlzLmkxOG5Gb3JtYXQgJiYgdGhpcy5pMThuRm9ybWF0LmFkZExvb2t1cEtleXMpIHtcbiAgICAgICAgICAgIHRoaXMuaTE4bkZvcm1hdC5hZGRMb29rdXBLZXlzKGZpbmFsS2V5cywga2V5LCBjb2RlLCBucywgb3B0aW9ucyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxldCBwbHVyYWxTdWZmaXg7XG4gICAgICAgICAgICBpZiAobmVlZHNQbHVyYWxIYW5kbGluZykgcGx1cmFsU3VmZml4ID0gdGhpcy5wbHVyYWxSZXNvbHZlci5nZXRTdWZmaXgoY29kZSwgb3B0aW9ucy5jb3VudCwgb3B0aW9ucyk7XG4gICAgICAgICAgICBjb25zdCB6ZXJvU3VmZml4ID0gYCR7dGhpcy5vcHRpb25zLnBsdXJhbFNlcGFyYXRvcn16ZXJvYDtcbiAgICAgICAgICAgIGNvbnN0IG9yZGluYWxQcmVmaXggPSBgJHt0aGlzLm9wdGlvbnMucGx1cmFsU2VwYXJhdG9yfW9yZGluYWwke3RoaXMub3B0aW9ucy5wbHVyYWxTZXBhcmF0b3J9YDtcbiAgICAgICAgICAgIGlmIChuZWVkc1BsdXJhbEhhbmRsaW5nKSB7XG4gICAgICAgICAgICAgIGZpbmFsS2V5cy5wdXNoKGtleSArIHBsdXJhbFN1ZmZpeCk7XG4gICAgICAgICAgICAgIGlmIChvcHRpb25zLm9yZGluYWwgJiYgcGx1cmFsU3VmZml4LmluZGV4T2Yob3JkaW5hbFByZWZpeCkgPT09IDApIHtcbiAgICAgICAgICAgICAgICBmaW5hbEtleXMucHVzaChrZXkgKyBwbHVyYWxTdWZmaXgucmVwbGFjZShvcmRpbmFsUHJlZml4LCB0aGlzLm9wdGlvbnMucGx1cmFsU2VwYXJhdG9yKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKG5lZWRzWmVyb1N1ZmZpeExvb2t1cCkge1xuICAgICAgICAgICAgICAgIGZpbmFsS2V5cy5wdXNoKGtleSArIHplcm9TdWZmaXgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobmVlZHNDb250ZXh0SGFuZGxpbmcpIHtcbiAgICAgICAgICAgICAgY29uc3QgY29udGV4dEtleSA9IGAke2tleX0ke3RoaXMub3B0aW9ucy5jb250ZXh0U2VwYXJhdG9yfSR7b3B0aW9ucy5jb250ZXh0fWA7XG4gICAgICAgICAgICAgIGZpbmFsS2V5cy5wdXNoKGNvbnRleHRLZXkpO1xuICAgICAgICAgICAgICBpZiAobmVlZHNQbHVyYWxIYW5kbGluZykge1xuICAgICAgICAgICAgICAgIGZpbmFsS2V5cy5wdXNoKGNvbnRleHRLZXkgKyBwbHVyYWxTdWZmaXgpO1xuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLm9yZGluYWwgJiYgcGx1cmFsU3VmZml4LmluZGV4T2Yob3JkaW5hbFByZWZpeCkgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgIGZpbmFsS2V5cy5wdXNoKGNvbnRleHRLZXkgKyBwbHVyYWxTdWZmaXgucmVwbGFjZShvcmRpbmFsUHJlZml4LCB0aGlzLm9wdGlvbnMucGx1cmFsU2VwYXJhdG9yKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChuZWVkc1plcm9TdWZmaXhMb29rdXApIHtcbiAgICAgICAgICAgICAgICAgIGZpbmFsS2V5cy5wdXNoKGNvbnRleHRLZXkgKyB6ZXJvU3VmZml4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgbGV0IHBvc3NpYmxlS2V5O1xuICAgICAgICAgIHdoaWxlIChwb3NzaWJsZUtleSA9IGZpbmFsS2V5cy5wb3AoKSkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmlzVmFsaWRMb29rdXAoZm91bmQpKSB7XG4gICAgICAgICAgICAgIGV4YWN0VXNlZEtleSA9IHBvc3NpYmxlS2V5O1xuICAgICAgICAgICAgICBmb3VuZCA9IHRoaXMuZ2V0UmVzb3VyY2UoY29kZSwgbnMsIHBvc3NpYmxlS2V5LCBvcHRpb25zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHJlczogZm91bmQsXG4gICAgICB1c2VkS2V5LFxuICAgICAgZXhhY3RVc2VkS2V5LFxuICAgICAgdXNlZExuZyxcbiAgICAgIHVzZWROU1xuICAgIH07XG4gIH1cbiAgaXNWYWxpZExvb2t1cChyZXMpIHtcbiAgICByZXR1cm4gcmVzICE9PSB1bmRlZmluZWQgJiYgISghdGhpcy5vcHRpb25zLnJldHVybk51bGwgJiYgcmVzID09PSBudWxsKSAmJiAhKCF0aGlzLm9wdGlvbnMucmV0dXJuRW1wdHlTdHJpbmcgJiYgcmVzID09PSAnJyk7XG4gIH1cbiAgZ2V0UmVzb3VyY2UoY29kZSwgbnMsIGtleSkge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDMgJiYgYXJndW1lbnRzWzNdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbM10gOiB7fTtcbiAgICBpZiAodGhpcy5pMThuRm9ybWF0ICYmIHRoaXMuaTE4bkZvcm1hdC5nZXRSZXNvdXJjZSkgcmV0dXJuIHRoaXMuaTE4bkZvcm1hdC5nZXRSZXNvdXJjZShjb2RlLCBucywga2V5LCBvcHRpb25zKTtcbiAgICByZXR1cm4gdGhpcy5yZXNvdXJjZVN0b3JlLmdldFJlc291cmNlKGNvZGUsIG5zLCBrZXksIG9wdGlvbnMpO1xuICB9XG4gIHN0YXRpYyBoYXNEZWZhdWx0VmFsdWUob3B0aW9ucykge1xuICAgIGNvbnN0IHByZWZpeCA9ICdkZWZhdWx0VmFsdWUnO1xuICAgIGZvciAoY29uc3Qgb3B0aW9uIGluIG9wdGlvbnMpIHtcbiAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob3B0aW9ucywgb3B0aW9uKSAmJiBwcmVmaXggPT09IG9wdGlvbi5zdWJzdHJpbmcoMCwgcHJlZml4Lmxlbmd0aCkgJiYgdW5kZWZpbmVkICE9PSBvcHRpb25zW29wdGlvbl0pIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjYXBpdGFsaXplKHN0cmluZykge1xuICByZXR1cm4gc3RyaW5nLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgc3RyaW5nLnNsaWNlKDEpO1xufVxuY2xhc3MgTGFuZ3VhZ2VVdGlsIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy5zdXBwb3J0ZWRMbmdzID0gdGhpcy5vcHRpb25zLnN1cHBvcnRlZExuZ3MgfHwgZmFsc2U7XG4gICAgdGhpcy5sb2dnZXIgPSBiYXNlTG9nZ2VyLmNyZWF0ZSgnbGFuZ3VhZ2VVdGlscycpO1xuICB9XG4gIGdldFNjcmlwdFBhcnRGcm9tQ29kZShjb2RlKSB7XG4gICAgY29kZSA9IGdldENsZWFuZWRDb2RlKGNvZGUpO1xuICAgIGlmICghY29kZSB8fCBjb2RlLmluZGV4T2YoJy0nKSA8IDApIHJldHVybiBudWxsO1xuICAgIGNvbnN0IHAgPSBjb2RlLnNwbGl0KCctJyk7XG4gICAgaWYgKHAubGVuZ3RoID09PSAyKSByZXR1cm4gbnVsbDtcbiAgICBwLnBvcCgpO1xuICAgIGlmIChwW3AubGVuZ3RoIC0gMV0udG9Mb3dlckNhc2UoKSA9PT0gJ3gnKSByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4gdGhpcy5mb3JtYXRMYW5ndWFnZUNvZGUocC5qb2luKCctJykpO1xuICB9XG4gIGdldExhbmd1YWdlUGFydEZyb21Db2RlKGNvZGUpIHtcbiAgICBjb2RlID0gZ2V0Q2xlYW5lZENvZGUoY29kZSk7XG4gICAgaWYgKCFjb2RlIHx8IGNvZGUuaW5kZXhPZignLScpIDwgMCkgcmV0dXJuIGNvZGU7XG4gICAgY29uc3QgcCA9IGNvZGUuc3BsaXQoJy0nKTtcbiAgICByZXR1cm4gdGhpcy5mb3JtYXRMYW5ndWFnZUNvZGUocFswXSk7XG4gIH1cbiAgZm9ybWF0TGFuZ3VhZ2VDb2RlKGNvZGUpIHtcbiAgICBpZiAodHlwZW9mIGNvZGUgPT09ICdzdHJpbmcnICYmIGNvZGUuaW5kZXhPZignLScpID4gLTEpIHtcbiAgICAgIGNvbnN0IHNwZWNpYWxDYXNlcyA9IFsnaGFucycsICdoYW50JywgJ2xhdG4nLCAnY3lybCcsICdjYW5zJywgJ21vbmcnLCAnYXJhYiddO1xuICAgICAgbGV0IHAgPSBjb2RlLnNwbGl0KCctJyk7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmxvd2VyQ2FzZUxuZykge1xuICAgICAgICBwID0gcC5tYXAocGFydCA9PiBwYXJ0LnRvTG93ZXJDYXNlKCkpO1xuICAgICAgfSBlbHNlIGlmIChwLmxlbmd0aCA9PT0gMikge1xuICAgICAgICBwWzBdID0gcFswXS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBwWzFdID0gcFsxXS50b1VwcGVyQ2FzZSgpO1xuICAgICAgICBpZiAoc3BlY2lhbENhc2VzLmluZGV4T2YocFsxXS50b0xvd2VyQ2FzZSgpKSA+IC0xKSBwWzFdID0gY2FwaXRhbGl6ZShwWzFdLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgfSBlbHNlIGlmIChwLmxlbmd0aCA9PT0gMykge1xuICAgICAgICBwWzBdID0gcFswXS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBpZiAocFsxXS5sZW5ndGggPT09IDIpIHBbMV0gPSBwWzFdLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgIGlmIChwWzBdICE9PSAnc2duJyAmJiBwWzJdLmxlbmd0aCA9PT0gMikgcFsyXSA9IHBbMl0udG9VcHBlckNhc2UoKTtcbiAgICAgICAgaWYgKHNwZWNpYWxDYXNlcy5pbmRleE9mKHBbMV0udG9Mb3dlckNhc2UoKSkgPiAtMSkgcFsxXSA9IGNhcGl0YWxpemUocFsxXS50b0xvd2VyQ2FzZSgpKTtcbiAgICAgICAgaWYgKHNwZWNpYWxDYXNlcy5pbmRleE9mKHBbMl0udG9Mb3dlckNhc2UoKSkgPiAtMSkgcFsyXSA9IGNhcGl0YWxpemUocFsyXS50b0xvd2VyQ2FzZSgpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBwLmpvaW4oJy0nKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5jbGVhbkNvZGUgfHwgdGhpcy5vcHRpb25zLmxvd2VyQ2FzZUxuZyA/IGNvZGUudG9Mb3dlckNhc2UoKSA6IGNvZGU7XG4gIH1cbiAgaXNTdXBwb3J0ZWRDb2RlKGNvZGUpIHtcbiAgICBpZiAodGhpcy5vcHRpb25zLmxvYWQgPT09ICdsYW5ndWFnZU9ubHknIHx8IHRoaXMub3B0aW9ucy5ub25FeHBsaWNpdFN1cHBvcnRlZExuZ3MpIHtcbiAgICAgIGNvZGUgPSB0aGlzLmdldExhbmd1YWdlUGFydEZyb21Db2RlKGNvZGUpO1xuICAgIH1cbiAgICByZXR1cm4gIXRoaXMuc3VwcG9ydGVkTG5ncyB8fCAhdGhpcy5zdXBwb3J0ZWRMbmdzLmxlbmd0aCB8fCB0aGlzLnN1cHBvcnRlZExuZ3MuaW5kZXhPZihjb2RlKSA+IC0xO1xuICB9XG4gIGdldEJlc3RNYXRjaEZyb21Db2Rlcyhjb2Rlcykge1xuICAgIGlmICghY29kZXMpIHJldHVybiBudWxsO1xuICAgIGxldCBmb3VuZDtcbiAgICBjb2Rlcy5mb3JFYWNoKGNvZGUgPT4ge1xuICAgICAgaWYgKGZvdW5kKSByZXR1cm47XG4gICAgICBjb25zdCBjbGVhbmVkTG5nID0gdGhpcy5mb3JtYXRMYW5ndWFnZUNvZGUoY29kZSk7XG4gICAgICBpZiAoIXRoaXMub3B0aW9ucy5zdXBwb3J0ZWRMbmdzIHx8IHRoaXMuaXNTdXBwb3J0ZWRDb2RlKGNsZWFuZWRMbmcpKSBmb3VuZCA9IGNsZWFuZWRMbmc7XG4gICAgfSk7XG4gICAgaWYgKCFmb3VuZCAmJiB0aGlzLm9wdGlvbnMuc3VwcG9ydGVkTG5ncykge1xuICAgICAgY29kZXMuZm9yRWFjaChjb2RlID0+IHtcbiAgICAgICAgaWYgKGZvdW5kKSByZXR1cm47XG4gICAgICAgIGNvbnN0IGxuZ09ubHkgPSB0aGlzLmdldExhbmd1YWdlUGFydEZyb21Db2RlKGNvZGUpO1xuICAgICAgICBpZiAodGhpcy5pc1N1cHBvcnRlZENvZGUobG5nT25seSkpIHJldHVybiBmb3VuZCA9IGxuZ09ubHk7XG4gICAgICAgIGZvdW5kID0gdGhpcy5vcHRpb25zLnN1cHBvcnRlZExuZ3MuZmluZChzdXBwb3J0ZWRMbmcgPT4ge1xuICAgICAgICAgIGlmIChzdXBwb3J0ZWRMbmcgPT09IGxuZ09ubHkpIHJldHVybiBzdXBwb3J0ZWRMbmc7XG4gICAgICAgICAgaWYgKHN1cHBvcnRlZExuZy5pbmRleE9mKCctJykgPCAwICYmIGxuZ09ubHkuaW5kZXhPZignLScpIDwgMCkgcmV0dXJuO1xuICAgICAgICAgIGlmIChzdXBwb3J0ZWRMbmcuaW5kZXhPZihsbmdPbmx5KSA9PT0gMCkgcmV0dXJuIHN1cHBvcnRlZExuZztcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKCFmb3VuZCkgZm91bmQgPSB0aGlzLmdldEZhbGxiYWNrQ29kZXModGhpcy5vcHRpb25zLmZhbGxiYWNrTG5nKVswXTtcbiAgICByZXR1cm4gZm91bmQ7XG4gIH1cbiAgZ2V0RmFsbGJhY2tDb2RlcyhmYWxsYmFja3MsIGNvZGUpIHtcbiAgICBpZiAoIWZhbGxiYWNrcykgcmV0dXJuIFtdO1xuICAgIGlmICh0eXBlb2YgZmFsbGJhY2tzID09PSAnZnVuY3Rpb24nKSBmYWxsYmFja3MgPSBmYWxsYmFja3MoY29kZSk7XG4gICAgaWYgKHR5cGVvZiBmYWxsYmFja3MgPT09ICdzdHJpbmcnKSBmYWxsYmFja3MgPSBbZmFsbGJhY2tzXTtcbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5hcHBseShmYWxsYmFja3MpID09PSAnW29iamVjdCBBcnJheV0nKSByZXR1cm4gZmFsbGJhY2tzO1xuICAgIGlmICghY29kZSkgcmV0dXJuIGZhbGxiYWNrcy5kZWZhdWx0IHx8IFtdO1xuICAgIGxldCBmb3VuZCA9IGZhbGxiYWNrc1tjb2RlXTtcbiAgICBpZiAoIWZvdW5kKSBmb3VuZCA9IGZhbGxiYWNrc1t0aGlzLmdldFNjcmlwdFBhcnRGcm9tQ29kZShjb2RlKV07XG4gICAgaWYgKCFmb3VuZCkgZm91bmQgPSBmYWxsYmFja3NbdGhpcy5mb3JtYXRMYW5ndWFnZUNvZGUoY29kZSldO1xuICAgIGlmICghZm91bmQpIGZvdW5kID0gZmFsbGJhY2tzW3RoaXMuZ2V0TGFuZ3VhZ2VQYXJ0RnJvbUNvZGUoY29kZSldO1xuICAgIGlmICghZm91bmQpIGZvdW5kID0gZmFsbGJhY2tzLmRlZmF1bHQ7XG4gICAgcmV0dXJuIGZvdW5kIHx8IFtdO1xuICB9XG4gIHRvUmVzb2x2ZUhpZXJhcmNoeShjb2RlLCBmYWxsYmFja0NvZGUpIHtcbiAgICBjb25zdCBmYWxsYmFja0NvZGVzID0gdGhpcy5nZXRGYWxsYmFja0NvZGVzKGZhbGxiYWNrQ29kZSB8fCB0aGlzLm9wdGlvbnMuZmFsbGJhY2tMbmcgfHwgW10sIGNvZGUpO1xuICAgIGNvbnN0IGNvZGVzID0gW107XG4gICAgY29uc3QgYWRkQ29kZSA9IGMgPT4ge1xuICAgICAgaWYgKCFjKSByZXR1cm47XG4gICAgICBpZiAodGhpcy5pc1N1cHBvcnRlZENvZGUoYykpIHtcbiAgICAgICAgY29kZXMucHVzaChjKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLndhcm4oYHJlamVjdGluZyBsYW5ndWFnZSBjb2RlIG5vdCBmb3VuZCBpbiBzdXBwb3J0ZWRMbmdzOiAke2N9YCk7XG4gICAgICB9XG4gICAgfTtcbiAgICBpZiAodHlwZW9mIGNvZGUgPT09ICdzdHJpbmcnICYmIChjb2RlLmluZGV4T2YoJy0nKSA+IC0xIHx8IGNvZGUuaW5kZXhPZignXycpID4gLTEpKSB7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmxvYWQgIT09ICdsYW5ndWFnZU9ubHknKSBhZGRDb2RlKHRoaXMuZm9ybWF0TGFuZ3VhZ2VDb2RlKGNvZGUpKTtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMubG9hZCAhPT0gJ2xhbmd1YWdlT25seScgJiYgdGhpcy5vcHRpb25zLmxvYWQgIT09ICdjdXJyZW50T25seScpIGFkZENvZGUodGhpcy5nZXRTY3JpcHRQYXJ0RnJvbUNvZGUoY29kZSkpO1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5sb2FkICE9PSAnY3VycmVudE9ubHknKSBhZGRDb2RlKHRoaXMuZ2V0TGFuZ3VhZ2VQYXJ0RnJvbUNvZGUoY29kZSkpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGNvZGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICBhZGRDb2RlKHRoaXMuZm9ybWF0TGFuZ3VhZ2VDb2RlKGNvZGUpKTtcbiAgICB9XG4gICAgZmFsbGJhY2tDb2Rlcy5mb3JFYWNoKGZjID0+IHtcbiAgICAgIGlmIChjb2Rlcy5pbmRleE9mKGZjKSA8IDApIGFkZENvZGUodGhpcy5mb3JtYXRMYW5ndWFnZUNvZGUoZmMpKTtcbiAgICB9KTtcbiAgICByZXR1cm4gY29kZXM7XG4gIH1cbn1cblxubGV0IHNldHMgPSBbe1xuICBsbmdzOiBbJ2FjaCcsICdhaycsICdhbScsICdhcm4nLCAnYnInLCAnZmlsJywgJ2d1bicsICdsbicsICdtZmUnLCAnbWcnLCAnbWknLCAnb2MnLCAncHQnLCAncHQtQlInLCAndGcnLCAndGwnLCAndGknLCAndHInLCAndXonLCAnd2EnXSxcbiAgbnI6IFsxLCAyXSxcbiAgZmM6IDFcbn0sIHtcbiAgbG5nczogWydhZicsICdhbicsICdhc3QnLCAnYXonLCAnYmcnLCAnYm4nLCAnY2EnLCAnZGEnLCAnZGUnLCAnZGV2JywgJ2VsJywgJ2VuJywgJ2VvJywgJ2VzJywgJ2V0JywgJ2V1JywgJ2ZpJywgJ2ZvJywgJ2Z1cicsICdmeScsICdnbCcsICdndScsICdoYScsICdoaScsICdodScsICdoeScsICdpYScsICdpdCcsICdraycsICdrbicsICdrdScsICdsYicsICdtYWknLCAnbWwnLCAnbW4nLCAnbXInLCAnbmFoJywgJ25hcCcsICduYicsICduZScsICdubCcsICdubicsICdubycsICduc28nLCAncGEnLCAncGFwJywgJ3BtcycsICdwcycsICdwdC1QVCcsICdybScsICdzY28nLCAnc2UnLCAnc2knLCAnc28nLCAnc29uJywgJ3NxJywgJ3N2JywgJ3N3JywgJ3RhJywgJ3RlJywgJ3RrJywgJ3VyJywgJ3lvJ10sXG4gIG5yOiBbMSwgMl0sXG4gIGZjOiAyXG59LCB7XG4gIGxuZ3M6IFsnYXknLCAnYm8nLCAnY2dnJywgJ2ZhJywgJ2h0JywgJ2lkJywgJ2phJywgJ2pibycsICdrYScsICdrbScsICdrbycsICdreScsICdsbycsICdtcycsICdzYWgnLCAnc3UnLCAndGgnLCAndHQnLCAndWcnLCAndmknLCAnd28nLCAnemgnXSxcbiAgbnI6IFsxXSxcbiAgZmM6IDNcbn0sIHtcbiAgbG5nczogWydiZScsICdicycsICdjbnInLCAnZHonLCAnaHInLCAncnUnLCAnc3InLCAndWsnXSxcbiAgbnI6IFsxLCAyLCA1XSxcbiAgZmM6IDRcbn0sIHtcbiAgbG5nczogWydhciddLFxuICBucjogWzAsIDEsIDIsIDMsIDExLCAxMDBdLFxuICBmYzogNVxufSwge1xuICBsbmdzOiBbJ2NzJywgJ3NrJ10sXG4gIG5yOiBbMSwgMiwgNV0sXG4gIGZjOiA2XG59LCB7XG4gIGxuZ3M6IFsnY3NiJywgJ3BsJ10sXG4gIG5yOiBbMSwgMiwgNV0sXG4gIGZjOiA3XG59LCB7XG4gIGxuZ3M6IFsnY3knXSxcbiAgbnI6IFsxLCAyLCAzLCA4XSxcbiAgZmM6IDhcbn0sIHtcbiAgbG5nczogWydmciddLFxuICBucjogWzEsIDJdLFxuICBmYzogOVxufSwge1xuICBsbmdzOiBbJ2dhJ10sXG4gIG5yOiBbMSwgMiwgMywgNywgMTFdLFxuICBmYzogMTBcbn0sIHtcbiAgbG5nczogWydnZCddLFxuICBucjogWzEsIDIsIDMsIDIwXSxcbiAgZmM6IDExXG59LCB7XG4gIGxuZ3M6IFsnaXMnXSxcbiAgbnI6IFsxLCAyXSxcbiAgZmM6IDEyXG59LCB7XG4gIGxuZ3M6IFsnanYnXSxcbiAgbnI6IFswLCAxXSxcbiAgZmM6IDEzXG59LCB7XG4gIGxuZ3M6IFsna3cnXSxcbiAgbnI6IFsxLCAyLCAzLCA0XSxcbiAgZmM6IDE0XG59LCB7XG4gIGxuZ3M6IFsnbHQnXSxcbiAgbnI6IFsxLCAyLCAxMF0sXG4gIGZjOiAxNVxufSwge1xuICBsbmdzOiBbJ2x2J10sXG4gIG5yOiBbMSwgMiwgMF0sXG4gIGZjOiAxNlxufSwge1xuICBsbmdzOiBbJ21rJ10sXG4gIG5yOiBbMSwgMl0sXG4gIGZjOiAxN1xufSwge1xuICBsbmdzOiBbJ21uayddLFxuICBucjogWzAsIDEsIDJdLFxuICBmYzogMThcbn0sIHtcbiAgbG5nczogWydtdCddLFxuICBucjogWzEsIDIsIDExLCAyMF0sXG4gIGZjOiAxOVxufSwge1xuICBsbmdzOiBbJ29yJ10sXG4gIG5yOiBbMiwgMV0sXG4gIGZjOiAyXG59LCB7XG4gIGxuZ3M6IFsncm8nXSxcbiAgbnI6IFsxLCAyLCAyMF0sXG4gIGZjOiAyMFxufSwge1xuICBsbmdzOiBbJ3NsJ10sXG4gIG5yOiBbNSwgMSwgMiwgM10sXG4gIGZjOiAyMVxufSwge1xuICBsbmdzOiBbJ2hlJywgJ2l3J10sXG4gIG5yOiBbMSwgMiwgMjAsIDIxXSxcbiAgZmM6IDIyXG59XTtcbmxldCBfcnVsZXNQbHVyYWxzVHlwZXMgPSB7XG4gIDE6IGZ1bmN0aW9uIChuKSB7XG4gICAgcmV0dXJuIE51bWJlcihuID4gMSk7XG4gIH0sXG4gIDI6IGZ1bmN0aW9uIChuKSB7XG4gICAgcmV0dXJuIE51bWJlcihuICE9IDEpO1xuICB9LFxuICAzOiBmdW5jdGlvbiAobikge1xuICAgIHJldHVybiAwO1xuICB9LFxuICA0OiBmdW5jdGlvbiAobikge1xuICAgIHJldHVybiBOdW1iZXIobiAlIDEwID09IDEgJiYgbiAlIDEwMCAhPSAxMSA/IDAgOiBuICUgMTAgPj0gMiAmJiBuICUgMTAgPD0gNCAmJiAobiAlIDEwMCA8IDEwIHx8IG4gJSAxMDAgPj0gMjApID8gMSA6IDIpO1xuICB9LFxuICA1OiBmdW5jdGlvbiAobikge1xuICAgIHJldHVybiBOdW1iZXIobiA9PSAwID8gMCA6IG4gPT0gMSA/IDEgOiBuID09IDIgPyAyIDogbiAlIDEwMCA+PSAzICYmIG4gJSAxMDAgPD0gMTAgPyAzIDogbiAlIDEwMCA+PSAxMSA/IDQgOiA1KTtcbiAgfSxcbiAgNjogZnVuY3Rpb24gKG4pIHtcbiAgICByZXR1cm4gTnVtYmVyKG4gPT0gMSA/IDAgOiBuID49IDIgJiYgbiA8PSA0ID8gMSA6IDIpO1xuICB9LFxuICA3OiBmdW5jdGlvbiAobikge1xuICAgIHJldHVybiBOdW1iZXIobiA9PSAxID8gMCA6IG4gJSAxMCA+PSAyICYmIG4gJSAxMCA8PSA0ICYmIChuICUgMTAwIDwgMTAgfHwgbiAlIDEwMCA+PSAyMCkgPyAxIDogMik7XG4gIH0sXG4gIDg6IGZ1bmN0aW9uIChuKSB7XG4gICAgcmV0dXJuIE51bWJlcihuID09IDEgPyAwIDogbiA9PSAyID8gMSA6IG4gIT0gOCAmJiBuICE9IDExID8gMiA6IDMpO1xuICB9LFxuICA5OiBmdW5jdGlvbiAobikge1xuICAgIHJldHVybiBOdW1iZXIobiA+PSAyKTtcbiAgfSxcbiAgMTA6IGZ1bmN0aW9uIChuKSB7XG4gICAgcmV0dXJuIE51bWJlcihuID09IDEgPyAwIDogbiA9PSAyID8gMSA6IG4gPCA3ID8gMiA6IG4gPCAxMSA/IDMgOiA0KTtcbiAgfSxcbiAgMTE6IGZ1bmN0aW9uIChuKSB7XG4gICAgcmV0dXJuIE51bWJlcihuID09IDEgfHwgbiA9PSAxMSA/IDAgOiBuID09IDIgfHwgbiA9PSAxMiA/IDEgOiBuID4gMiAmJiBuIDwgMjAgPyAyIDogMyk7XG4gIH0sXG4gIDEyOiBmdW5jdGlvbiAobikge1xuICAgIHJldHVybiBOdW1iZXIobiAlIDEwICE9IDEgfHwgbiAlIDEwMCA9PSAxMSk7XG4gIH0sXG4gIDEzOiBmdW5jdGlvbiAobikge1xuICAgIHJldHVybiBOdW1iZXIobiAhPT0gMCk7XG4gIH0sXG4gIDE0OiBmdW5jdGlvbiAobikge1xuICAgIHJldHVybiBOdW1iZXIobiA9PSAxID8gMCA6IG4gPT0gMiA/IDEgOiBuID09IDMgPyAyIDogMyk7XG4gIH0sXG4gIDE1OiBmdW5jdGlvbiAobikge1xuICAgIHJldHVybiBOdW1iZXIobiAlIDEwID09IDEgJiYgbiAlIDEwMCAhPSAxMSA/IDAgOiBuICUgMTAgPj0gMiAmJiAobiAlIDEwMCA8IDEwIHx8IG4gJSAxMDAgPj0gMjApID8gMSA6IDIpO1xuICB9LFxuICAxNjogZnVuY3Rpb24gKG4pIHtcbiAgICByZXR1cm4gTnVtYmVyKG4gJSAxMCA9PSAxICYmIG4gJSAxMDAgIT0gMTEgPyAwIDogbiAhPT0gMCA/IDEgOiAyKTtcbiAgfSxcbiAgMTc6IGZ1bmN0aW9uIChuKSB7XG4gICAgcmV0dXJuIE51bWJlcihuID09IDEgfHwgbiAlIDEwID09IDEgJiYgbiAlIDEwMCAhPSAxMSA/IDAgOiAxKTtcbiAgfSxcbiAgMTg6IGZ1bmN0aW9uIChuKSB7XG4gICAgcmV0dXJuIE51bWJlcihuID09IDAgPyAwIDogbiA9PSAxID8gMSA6IDIpO1xuICB9LFxuICAxOTogZnVuY3Rpb24gKG4pIHtcbiAgICByZXR1cm4gTnVtYmVyKG4gPT0gMSA/IDAgOiBuID09IDAgfHwgbiAlIDEwMCA+IDEgJiYgbiAlIDEwMCA8IDExID8gMSA6IG4gJSAxMDAgPiAxMCAmJiBuICUgMTAwIDwgMjAgPyAyIDogMyk7XG4gIH0sXG4gIDIwOiBmdW5jdGlvbiAobikge1xuICAgIHJldHVybiBOdW1iZXIobiA9PSAxID8gMCA6IG4gPT0gMCB8fCBuICUgMTAwID4gMCAmJiBuICUgMTAwIDwgMjAgPyAxIDogMik7XG4gIH0sXG4gIDIxOiBmdW5jdGlvbiAobikge1xuICAgIHJldHVybiBOdW1iZXIobiAlIDEwMCA9PSAxID8gMSA6IG4gJSAxMDAgPT0gMiA/IDIgOiBuICUgMTAwID09IDMgfHwgbiAlIDEwMCA9PSA0ID8gMyA6IDApO1xuICB9LFxuICAyMjogZnVuY3Rpb24gKG4pIHtcbiAgICByZXR1cm4gTnVtYmVyKG4gPT0gMSA/IDAgOiBuID09IDIgPyAxIDogKG4gPCAwIHx8IG4gPiAxMCkgJiYgbiAlIDEwID09IDAgPyAyIDogMyk7XG4gIH1cbn07XG5jb25zdCBub25JbnRsVmVyc2lvbnMgPSBbJ3YxJywgJ3YyJywgJ3YzJ107XG5jb25zdCBpbnRsVmVyc2lvbnMgPSBbJ3Y0J107XG5jb25zdCBzdWZmaXhlc09yZGVyID0ge1xuICB6ZXJvOiAwLFxuICBvbmU6IDEsXG4gIHR3bzogMixcbiAgZmV3OiAzLFxuICBtYW55OiA0LFxuICBvdGhlcjogNVxufTtcbmZ1bmN0aW9uIGNyZWF0ZVJ1bGVzKCkge1xuICBjb25zdCBydWxlcyA9IHt9O1xuICBzZXRzLmZvckVhY2goc2V0ID0+IHtcbiAgICBzZXQubG5ncy5mb3JFYWNoKGwgPT4ge1xuICAgICAgcnVsZXNbbF0gPSB7XG4gICAgICAgIG51bWJlcnM6IHNldC5ucixcbiAgICAgICAgcGx1cmFsczogX3J1bGVzUGx1cmFsc1R5cGVzW3NldC5mY11cbiAgICAgIH07XG4gICAgfSk7XG4gIH0pO1xuICByZXR1cm4gcnVsZXM7XG59XG5jbGFzcyBQbHVyYWxSZXNvbHZlciB7XG4gIGNvbnN0cnVjdG9yKGxhbmd1YWdlVXRpbHMpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge307XG4gICAgdGhpcy5sYW5ndWFnZVV0aWxzID0gbGFuZ3VhZ2VVdGlscztcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMubG9nZ2VyID0gYmFzZUxvZ2dlci5jcmVhdGUoJ3BsdXJhbFJlc29sdmVyJyk7XG4gICAgaWYgKCghdGhpcy5vcHRpb25zLmNvbXBhdGliaWxpdHlKU09OIHx8IGludGxWZXJzaW9ucy5pbmNsdWRlcyh0aGlzLm9wdGlvbnMuY29tcGF0aWJpbGl0eUpTT04pKSAmJiAodHlwZW9mIEludGwgPT09ICd1bmRlZmluZWQnIHx8ICFJbnRsLlBsdXJhbFJ1bGVzKSkge1xuICAgICAgdGhpcy5vcHRpb25zLmNvbXBhdGliaWxpdHlKU09OID0gJ3YzJztcbiAgICAgIHRoaXMubG9nZ2VyLmVycm9yKCdZb3VyIGVudmlyb25tZW50IHNlZW1zIG5vdCB0byBiZSBJbnRsIEFQSSBjb21wYXRpYmxlLCB1c2UgYW4gSW50bC5QbHVyYWxSdWxlcyBwb2x5ZmlsbC4gV2lsbCBmYWxsYmFjayB0byB0aGUgY29tcGF0aWJpbGl0eUpTT04gdjMgZm9ybWF0IGhhbmRsaW5nLicpO1xuICAgIH1cbiAgICB0aGlzLnJ1bGVzID0gY3JlYXRlUnVsZXMoKTtcbiAgfVxuICBhZGRSdWxlKGxuZywgb2JqKSB7XG4gICAgdGhpcy5ydWxlc1tsbmddID0gb2JqO1xuICB9XG4gIGdldFJ1bGUoY29kZSkge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB7fTtcbiAgICBpZiAodGhpcy5zaG91bGRVc2VJbnRsQXBpKCkpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBuZXcgSW50bC5QbHVyYWxSdWxlcyhnZXRDbGVhbmVkQ29kZShjb2RlKSwge1xuICAgICAgICAgIHR5cGU6IG9wdGlvbnMub3JkaW5hbCA/ICdvcmRpbmFsJyA6ICdjYXJkaW5hbCdcbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5ydWxlc1tjb2RlXSB8fCB0aGlzLnJ1bGVzW3RoaXMubGFuZ3VhZ2VVdGlscy5nZXRMYW5ndWFnZVBhcnRGcm9tQ29kZShjb2RlKV07XG4gIH1cbiAgbmVlZHNQbHVyYWwoY29kZSkge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB7fTtcbiAgICBjb25zdCBydWxlID0gdGhpcy5nZXRSdWxlKGNvZGUsIG9wdGlvbnMpO1xuICAgIGlmICh0aGlzLnNob3VsZFVzZUludGxBcGkoKSkge1xuICAgICAgcmV0dXJuIHJ1bGUgJiYgcnVsZS5yZXNvbHZlZE9wdGlvbnMoKS5wbHVyYWxDYXRlZ29yaWVzLmxlbmd0aCA+IDE7XG4gICAgfVxuICAgIHJldHVybiBydWxlICYmIHJ1bGUubnVtYmVycy5sZW5ndGggPiAxO1xuICB9XG4gIGdldFBsdXJhbEZvcm1zT2ZLZXkoY29kZSwga2V5KSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6IHt9O1xuICAgIHJldHVybiB0aGlzLmdldFN1ZmZpeGVzKGNvZGUsIG9wdGlvbnMpLm1hcChzdWZmaXggPT4gYCR7a2V5fSR7c3VmZml4fWApO1xuICB9XG4gIGdldFN1ZmZpeGVzKGNvZGUpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge307XG4gICAgY29uc3QgcnVsZSA9IHRoaXMuZ2V0UnVsZShjb2RlLCBvcHRpb25zKTtcbiAgICBpZiAoIXJ1bGUpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgaWYgKHRoaXMuc2hvdWxkVXNlSW50bEFwaSgpKSB7XG4gICAgICByZXR1cm4gcnVsZS5yZXNvbHZlZE9wdGlvbnMoKS5wbHVyYWxDYXRlZ29yaWVzLnNvcnQoKHBsdXJhbENhdGVnb3J5MSwgcGx1cmFsQ2F0ZWdvcnkyKSA9PiBzdWZmaXhlc09yZGVyW3BsdXJhbENhdGVnb3J5MV0gLSBzdWZmaXhlc09yZGVyW3BsdXJhbENhdGVnb3J5Ml0pLm1hcChwbHVyYWxDYXRlZ29yeSA9PiBgJHt0aGlzLm9wdGlvbnMucHJlcGVuZH0ke29wdGlvbnMub3JkaW5hbCA/IGBvcmRpbmFsJHt0aGlzLm9wdGlvbnMucHJlcGVuZH1gIDogJyd9JHtwbHVyYWxDYXRlZ29yeX1gKTtcbiAgICB9XG4gICAgcmV0dXJuIHJ1bGUubnVtYmVycy5tYXAobnVtYmVyID0+IHRoaXMuZ2V0U3VmZml4KGNvZGUsIG51bWJlciwgb3B0aW9ucykpO1xuICB9XG4gIGdldFN1ZmZpeChjb2RlLCBjb3VudCkge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMl0gOiB7fTtcbiAgICBjb25zdCBydWxlID0gdGhpcy5nZXRSdWxlKGNvZGUsIG9wdGlvbnMpO1xuICAgIGlmIChydWxlKSB7XG4gICAgICBpZiAodGhpcy5zaG91bGRVc2VJbnRsQXBpKCkpIHtcbiAgICAgICAgcmV0dXJuIGAke3RoaXMub3B0aW9ucy5wcmVwZW5kfSR7b3B0aW9ucy5vcmRpbmFsID8gYG9yZGluYWwke3RoaXMub3B0aW9ucy5wcmVwZW5kfWAgOiAnJ30ke3J1bGUuc2VsZWN0KGNvdW50KX1gO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuZ2V0U3VmZml4UmV0cm9Db21wYXRpYmxlKHJ1bGUsIGNvdW50KTtcbiAgICB9XG4gICAgdGhpcy5sb2dnZXIud2Fybihgbm8gcGx1cmFsIHJ1bGUgZm91bmQgZm9yOiAke2NvZGV9YCk7XG4gICAgcmV0dXJuICcnO1xuICB9XG4gIGdldFN1ZmZpeFJldHJvQ29tcGF0aWJsZShydWxlLCBjb3VudCkge1xuICAgIGNvbnN0IGlkeCA9IHJ1bGUubm9BYnMgPyBydWxlLnBsdXJhbHMoY291bnQpIDogcnVsZS5wbHVyYWxzKE1hdGguYWJzKGNvdW50KSk7XG4gICAgbGV0IHN1ZmZpeCA9IHJ1bGUubnVtYmVyc1tpZHhdO1xuICAgIGlmICh0aGlzLm9wdGlvbnMuc2ltcGxpZnlQbHVyYWxTdWZmaXggJiYgcnVsZS5udW1iZXJzLmxlbmd0aCA9PT0gMiAmJiBydWxlLm51bWJlcnNbMF0gPT09IDEpIHtcbiAgICAgIGlmIChzdWZmaXggPT09IDIpIHtcbiAgICAgICAgc3VmZml4ID0gJ3BsdXJhbCc7XG4gICAgICB9IGVsc2UgaWYgKHN1ZmZpeCA9PT0gMSkge1xuICAgICAgICBzdWZmaXggPSAnJztcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgcmV0dXJuU3VmZml4ID0gKCkgPT4gdGhpcy5vcHRpb25zLnByZXBlbmQgJiYgc3VmZml4LnRvU3RyaW5nKCkgPyB0aGlzLm9wdGlvbnMucHJlcGVuZCArIHN1ZmZpeC50b1N0cmluZygpIDogc3VmZml4LnRvU3RyaW5nKCk7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5jb21wYXRpYmlsaXR5SlNPTiA9PT0gJ3YxJykge1xuICAgICAgaWYgKHN1ZmZpeCA9PT0gMSkgcmV0dXJuICcnO1xuICAgICAgaWYgKHR5cGVvZiBzdWZmaXggPT09ICdudW1iZXInKSByZXR1cm4gYF9wbHVyYWxfJHtzdWZmaXgudG9TdHJpbmcoKX1gO1xuICAgICAgcmV0dXJuIHJldHVyblN1ZmZpeCgpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLmNvbXBhdGliaWxpdHlKU09OID09PSAndjInKSB7XG4gICAgICByZXR1cm4gcmV0dXJuU3VmZml4KCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLm9wdGlvbnMuc2ltcGxpZnlQbHVyYWxTdWZmaXggJiYgcnVsZS5udW1iZXJzLmxlbmd0aCA9PT0gMiAmJiBydWxlLm51bWJlcnNbMF0gPT09IDEpIHtcbiAgICAgIHJldHVybiByZXR1cm5TdWZmaXgoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5wcmVwZW5kICYmIGlkeC50b1N0cmluZygpID8gdGhpcy5vcHRpb25zLnByZXBlbmQgKyBpZHgudG9TdHJpbmcoKSA6IGlkeC50b1N0cmluZygpO1xuICB9XG4gIHNob3VsZFVzZUludGxBcGkoKSB7XG4gICAgcmV0dXJuICFub25JbnRsVmVyc2lvbnMuaW5jbHVkZXModGhpcy5vcHRpb25zLmNvbXBhdGliaWxpdHlKU09OKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBkZWVwRmluZFdpdGhEZWZhdWx0cyhkYXRhLCBkZWZhdWx0RGF0YSwga2V5KSB7XG4gIGxldCBrZXlTZXBhcmF0b3IgPSBhcmd1bWVudHMubGVuZ3RoID4gMyAmJiBhcmd1bWVudHNbM10gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1szXSA6ICcuJztcbiAgbGV0IGlnbm9yZUpTT05TdHJ1Y3R1cmUgPSBhcmd1bWVudHMubGVuZ3RoID4gNCAmJiBhcmd1bWVudHNbNF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1s0XSA6IHRydWU7XG4gIGxldCBwYXRoID0gZ2V0UGF0aFdpdGhEZWZhdWx0cyhkYXRhLCBkZWZhdWx0RGF0YSwga2V5KTtcbiAgaWYgKCFwYXRoICYmIGlnbm9yZUpTT05TdHJ1Y3R1cmUgJiYgdHlwZW9mIGtleSA9PT0gJ3N0cmluZycpIHtcbiAgICBwYXRoID0gZGVlcEZpbmQoZGF0YSwga2V5LCBrZXlTZXBhcmF0b3IpO1xuICAgIGlmIChwYXRoID09PSB1bmRlZmluZWQpIHBhdGggPSBkZWVwRmluZChkZWZhdWx0RGF0YSwga2V5LCBrZXlTZXBhcmF0b3IpO1xuICB9XG4gIHJldHVybiBwYXRoO1xufVxuY2xhc3MgSW50ZXJwb2xhdG9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IHt9O1xuICAgIHRoaXMubG9nZ2VyID0gYmFzZUxvZ2dlci5jcmVhdGUoJ2ludGVycG9sYXRvcicpO1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy5mb3JtYXQgPSBvcHRpb25zLmludGVycG9sYXRpb24gJiYgb3B0aW9ucy5pbnRlcnBvbGF0aW9uLmZvcm1hdCB8fCAodmFsdWUgPT4gdmFsdWUpO1xuICAgIHRoaXMuaW5pdChvcHRpb25zKTtcbiAgfVxuICBpbml0KCkge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiB7fTtcbiAgICBpZiAoIW9wdGlvbnMuaW50ZXJwb2xhdGlvbikgb3B0aW9ucy5pbnRlcnBvbGF0aW9uID0ge1xuICAgICAgZXNjYXBlVmFsdWU6IHRydWVcbiAgICB9O1xuICAgIGNvbnN0IGlPcHRzID0gb3B0aW9ucy5pbnRlcnBvbGF0aW9uO1xuICAgIHRoaXMuZXNjYXBlID0gaU9wdHMuZXNjYXBlICE9PSB1bmRlZmluZWQgPyBpT3B0cy5lc2NhcGUgOiBlc2NhcGU7XG4gICAgdGhpcy5lc2NhcGVWYWx1ZSA9IGlPcHRzLmVzY2FwZVZhbHVlICE9PSB1bmRlZmluZWQgPyBpT3B0cy5lc2NhcGVWYWx1ZSA6IHRydWU7XG4gICAgdGhpcy51c2VSYXdWYWx1ZVRvRXNjYXBlID0gaU9wdHMudXNlUmF3VmFsdWVUb0VzY2FwZSAhPT0gdW5kZWZpbmVkID8gaU9wdHMudXNlUmF3VmFsdWVUb0VzY2FwZSA6IGZhbHNlO1xuICAgIHRoaXMucHJlZml4ID0gaU9wdHMucHJlZml4ID8gcmVnZXhFc2NhcGUoaU9wdHMucHJlZml4KSA6IGlPcHRzLnByZWZpeEVzY2FwZWQgfHwgJ3t7JztcbiAgICB0aGlzLnN1ZmZpeCA9IGlPcHRzLnN1ZmZpeCA/IHJlZ2V4RXNjYXBlKGlPcHRzLnN1ZmZpeCkgOiBpT3B0cy5zdWZmaXhFc2NhcGVkIHx8ICd9fSc7XG4gICAgdGhpcy5mb3JtYXRTZXBhcmF0b3IgPSBpT3B0cy5mb3JtYXRTZXBhcmF0b3IgPyBpT3B0cy5mb3JtYXRTZXBhcmF0b3IgOiBpT3B0cy5mb3JtYXRTZXBhcmF0b3IgfHwgJywnO1xuICAgIHRoaXMudW5lc2NhcGVQcmVmaXggPSBpT3B0cy51bmVzY2FwZVN1ZmZpeCA/ICcnIDogaU9wdHMudW5lc2NhcGVQcmVmaXggfHwgJy0nO1xuICAgIHRoaXMudW5lc2NhcGVTdWZmaXggPSB0aGlzLnVuZXNjYXBlUHJlZml4ID8gJycgOiBpT3B0cy51bmVzY2FwZVN1ZmZpeCB8fCAnJztcbiAgICB0aGlzLm5lc3RpbmdQcmVmaXggPSBpT3B0cy5uZXN0aW5nUHJlZml4ID8gcmVnZXhFc2NhcGUoaU9wdHMubmVzdGluZ1ByZWZpeCkgOiBpT3B0cy5uZXN0aW5nUHJlZml4RXNjYXBlZCB8fCByZWdleEVzY2FwZSgnJHQoJyk7XG4gICAgdGhpcy5uZXN0aW5nU3VmZml4ID0gaU9wdHMubmVzdGluZ1N1ZmZpeCA/IHJlZ2V4RXNjYXBlKGlPcHRzLm5lc3RpbmdTdWZmaXgpIDogaU9wdHMubmVzdGluZ1N1ZmZpeEVzY2FwZWQgfHwgcmVnZXhFc2NhcGUoJyknKTtcbiAgICB0aGlzLm5lc3RpbmdPcHRpb25zU2VwYXJhdG9yID0gaU9wdHMubmVzdGluZ09wdGlvbnNTZXBhcmF0b3IgPyBpT3B0cy5uZXN0aW5nT3B0aW9uc1NlcGFyYXRvciA6IGlPcHRzLm5lc3RpbmdPcHRpb25zU2VwYXJhdG9yIHx8ICcsJztcbiAgICB0aGlzLm1heFJlcGxhY2VzID0gaU9wdHMubWF4UmVwbGFjZXMgPyBpT3B0cy5tYXhSZXBsYWNlcyA6IDEwMDA7XG4gICAgdGhpcy5hbHdheXNGb3JtYXQgPSBpT3B0cy5hbHdheXNGb3JtYXQgIT09IHVuZGVmaW5lZCA/IGlPcHRzLmFsd2F5c0Zvcm1hdCA6IGZhbHNlO1xuICAgIHRoaXMucmVzZXRSZWdFeHAoKTtcbiAgfVxuICByZXNldCgpIHtcbiAgICBpZiAodGhpcy5vcHRpb25zKSB0aGlzLmluaXQodGhpcy5vcHRpb25zKTtcbiAgfVxuICByZXNldFJlZ0V4cCgpIHtcbiAgICBjb25zdCByZWdleHBTdHIgPSBgJHt0aGlzLnByZWZpeH0oLis/KSR7dGhpcy5zdWZmaXh9YDtcbiAgICB0aGlzLnJlZ2V4cCA9IG5ldyBSZWdFeHAocmVnZXhwU3RyLCAnZycpO1xuICAgIGNvbnN0IHJlZ2V4cFVuZXNjYXBlU3RyID0gYCR7dGhpcy5wcmVmaXh9JHt0aGlzLnVuZXNjYXBlUHJlZml4fSguKz8pJHt0aGlzLnVuZXNjYXBlU3VmZml4fSR7dGhpcy5zdWZmaXh9YDtcbiAgICB0aGlzLnJlZ2V4cFVuZXNjYXBlID0gbmV3IFJlZ0V4cChyZWdleHBVbmVzY2FwZVN0ciwgJ2cnKTtcbiAgICBjb25zdCBuZXN0aW5nUmVnZXhwU3RyID0gYCR7dGhpcy5uZXN0aW5nUHJlZml4fSguKz8pJHt0aGlzLm5lc3RpbmdTdWZmaXh9YDtcbiAgICB0aGlzLm5lc3RpbmdSZWdleHAgPSBuZXcgUmVnRXhwKG5lc3RpbmdSZWdleHBTdHIsICdnJyk7XG4gIH1cbiAgaW50ZXJwb2xhdGUoc3RyLCBkYXRhLCBsbmcsIG9wdGlvbnMpIHtcbiAgICBsZXQgbWF0Y2g7XG4gICAgbGV0IHZhbHVlO1xuICAgIGxldCByZXBsYWNlcztcbiAgICBjb25zdCBkZWZhdWx0RGF0YSA9IHRoaXMub3B0aW9ucyAmJiB0aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbiAmJiB0aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbi5kZWZhdWx0VmFyaWFibGVzIHx8IHt9O1xuICAgIGZ1bmN0aW9uIHJlZ2V4U2FmZSh2YWwpIHtcbiAgICAgIHJldHVybiB2YWwucmVwbGFjZSgvXFwkL2csICckJCQkJyk7XG4gICAgfVxuICAgIGNvbnN0IGhhbmRsZUZvcm1hdCA9IGtleSA9PiB7XG4gICAgICBpZiAoa2V5LmluZGV4T2YodGhpcy5mb3JtYXRTZXBhcmF0b3IpIDwgMCkge1xuICAgICAgICBjb25zdCBwYXRoID0gZGVlcEZpbmRXaXRoRGVmYXVsdHMoZGF0YSwgZGVmYXVsdERhdGEsIGtleSwgdGhpcy5vcHRpb25zLmtleVNlcGFyYXRvciwgdGhpcy5vcHRpb25zLmlnbm9yZUpTT05TdHJ1Y3R1cmUpO1xuICAgICAgICByZXR1cm4gdGhpcy5hbHdheXNGb3JtYXQgPyB0aGlzLmZvcm1hdChwYXRoLCB1bmRlZmluZWQsIGxuZywge1xuICAgICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgICAgLi4uZGF0YSxcbiAgICAgICAgICBpbnRlcnBvbGF0aW9ua2V5OiBrZXlcbiAgICAgICAgfSkgOiBwYXRoO1xuICAgICAgfVxuICAgICAgY29uc3QgcCA9IGtleS5zcGxpdCh0aGlzLmZvcm1hdFNlcGFyYXRvcik7XG4gICAgICBjb25zdCBrID0gcC5zaGlmdCgpLnRyaW0oKTtcbiAgICAgIGNvbnN0IGYgPSBwLmpvaW4odGhpcy5mb3JtYXRTZXBhcmF0b3IpLnRyaW0oKTtcbiAgICAgIHJldHVybiB0aGlzLmZvcm1hdChkZWVwRmluZFdpdGhEZWZhdWx0cyhkYXRhLCBkZWZhdWx0RGF0YSwgaywgdGhpcy5vcHRpb25zLmtleVNlcGFyYXRvciwgdGhpcy5vcHRpb25zLmlnbm9yZUpTT05TdHJ1Y3R1cmUpLCBmLCBsbmcsIHtcbiAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgLi4uZGF0YSxcbiAgICAgICAgaW50ZXJwb2xhdGlvbmtleToga1xuICAgICAgfSk7XG4gICAgfTtcbiAgICB0aGlzLnJlc2V0UmVnRXhwKCk7XG4gICAgY29uc3QgbWlzc2luZ0ludGVycG9sYXRpb25IYW5kbGVyID0gb3B0aW9ucyAmJiBvcHRpb25zLm1pc3NpbmdJbnRlcnBvbGF0aW9uSGFuZGxlciB8fCB0aGlzLm9wdGlvbnMubWlzc2luZ0ludGVycG9sYXRpb25IYW5kbGVyO1xuICAgIGNvbnN0IHNraXBPblZhcmlhYmxlcyA9IG9wdGlvbnMgJiYgb3B0aW9ucy5pbnRlcnBvbGF0aW9uICYmIG9wdGlvbnMuaW50ZXJwb2xhdGlvbi5za2lwT25WYXJpYWJsZXMgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMuaW50ZXJwb2xhdGlvbi5za2lwT25WYXJpYWJsZXMgOiB0aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbi5za2lwT25WYXJpYWJsZXM7XG4gICAgY29uc3QgdG9kb3MgPSBbe1xuICAgICAgcmVnZXg6IHRoaXMucmVnZXhwVW5lc2NhcGUsXG4gICAgICBzYWZlVmFsdWU6IHZhbCA9PiByZWdleFNhZmUodmFsKVxuICAgIH0sIHtcbiAgICAgIHJlZ2V4OiB0aGlzLnJlZ2V4cCxcbiAgICAgIHNhZmVWYWx1ZTogdmFsID0+IHRoaXMuZXNjYXBlVmFsdWUgPyByZWdleFNhZmUodGhpcy5lc2NhcGUodmFsKSkgOiByZWdleFNhZmUodmFsKVxuICAgIH1dO1xuICAgIHRvZG9zLmZvckVhY2godG9kbyA9PiB7XG4gICAgICByZXBsYWNlcyA9IDA7XG4gICAgICB3aGlsZSAobWF0Y2ggPSB0b2RvLnJlZ2V4LmV4ZWMoc3RyKSkge1xuICAgICAgICBjb25zdCBtYXRjaGVkVmFyID0gbWF0Y2hbMV0udHJpbSgpO1xuICAgICAgICB2YWx1ZSA9IGhhbmRsZUZvcm1hdChtYXRjaGVkVmFyKTtcbiAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBpZiAodHlwZW9mIG1pc3NpbmdJbnRlcnBvbGF0aW9uSGFuZGxlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY29uc3QgdGVtcCA9IG1pc3NpbmdJbnRlcnBvbGF0aW9uSGFuZGxlcihzdHIsIG1hdGNoLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHZhbHVlID0gdHlwZW9mIHRlbXAgPT09ICdzdHJpbmcnID8gdGVtcCA6ICcnO1xuICAgICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucyAmJiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob3B0aW9ucywgbWF0Y2hlZFZhcikpIHtcbiAgICAgICAgICAgIHZhbHVlID0gJyc7XG4gICAgICAgICAgfSBlbHNlIGlmIChza2lwT25WYXJpYWJsZXMpIHtcbiAgICAgICAgICAgIHZhbHVlID0gbWF0Y2hbMF07XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5sb2dnZXIud2FybihgbWlzc2VkIHRvIHBhc3MgaW4gdmFyaWFibGUgJHttYXRjaGVkVmFyfSBmb3IgaW50ZXJwb2xhdGluZyAke3N0cn1gKTtcbiAgICAgICAgICAgIHZhbHVlID0gJyc7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycgJiYgIXRoaXMudXNlUmF3VmFsdWVUb0VzY2FwZSkge1xuICAgICAgICAgIHZhbHVlID0gbWFrZVN0cmluZyh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc2FmZVZhbHVlID0gdG9kby5zYWZlVmFsdWUodmFsdWUpO1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZShtYXRjaFswXSwgc2FmZVZhbHVlKTtcbiAgICAgICAgaWYgKHNraXBPblZhcmlhYmxlcykge1xuICAgICAgICAgIHRvZG8ucmVnZXgubGFzdEluZGV4ICs9IHZhbHVlLmxlbmd0aDtcbiAgICAgICAgICB0b2RvLnJlZ2V4Lmxhc3RJbmRleCAtPSBtYXRjaFswXS5sZW5ndGg7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdG9kby5yZWdleC5sYXN0SW5kZXggPSAwO1xuICAgICAgICB9XG4gICAgICAgIHJlcGxhY2VzKys7XG4gICAgICAgIGlmIChyZXBsYWNlcyA+PSB0aGlzLm1heFJlcGxhY2VzKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gc3RyO1xuICB9XG4gIG5lc3Qoc3RyLCBmYykge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMl0gOiB7fTtcbiAgICBsZXQgbWF0Y2g7XG4gICAgbGV0IHZhbHVlO1xuICAgIGxldCBjbG9uZWRPcHRpb25zO1xuICAgIGZ1bmN0aW9uIGhhbmRsZUhhc09wdGlvbnMoa2V5LCBpbmhlcml0ZWRPcHRpb25zKSB7XG4gICAgICBjb25zdCBzZXAgPSB0aGlzLm5lc3RpbmdPcHRpb25zU2VwYXJhdG9yO1xuICAgICAgaWYgKGtleS5pbmRleE9mKHNlcCkgPCAwKSByZXR1cm4ga2V5O1xuICAgICAgY29uc3QgYyA9IGtleS5zcGxpdChuZXcgUmVnRXhwKGAke3NlcH1bIF0qe2ApKTtcbiAgICAgIGxldCBvcHRpb25zU3RyaW5nID0gYHske2NbMV19YDtcbiAgICAgIGtleSA9IGNbMF07XG4gICAgICBvcHRpb25zU3RyaW5nID0gdGhpcy5pbnRlcnBvbGF0ZShvcHRpb25zU3RyaW5nLCBjbG9uZWRPcHRpb25zKTtcbiAgICAgIGNvbnN0IG1hdGNoZWRTaW5nbGVRdW90ZXMgPSBvcHRpb25zU3RyaW5nLm1hdGNoKC8nL2cpO1xuICAgICAgY29uc3QgbWF0Y2hlZERvdWJsZVF1b3RlcyA9IG9wdGlvbnNTdHJpbmcubWF0Y2goL1wiL2cpO1xuICAgICAgaWYgKG1hdGNoZWRTaW5nbGVRdW90ZXMgJiYgbWF0Y2hlZFNpbmdsZVF1b3Rlcy5sZW5ndGggJSAyID09PSAwICYmICFtYXRjaGVkRG91YmxlUXVvdGVzIHx8IG1hdGNoZWREb3VibGVRdW90ZXMubGVuZ3RoICUgMiAhPT0gMCkge1xuICAgICAgICBvcHRpb25zU3RyaW5nID0gb3B0aW9uc1N0cmluZy5yZXBsYWNlKC8nL2csICdcIicpO1xuICAgICAgfVxuICAgICAgdHJ5IHtcbiAgICAgICAgY2xvbmVkT3B0aW9ucyA9IEpTT04ucGFyc2Uob3B0aW9uc1N0cmluZyk7XG4gICAgICAgIGlmIChpbmhlcml0ZWRPcHRpb25zKSBjbG9uZWRPcHRpb25zID0ge1xuICAgICAgICAgIC4uLmluaGVyaXRlZE9wdGlvbnMsXG4gICAgICAgICAgLi4uY2xvbmVkT3B0aW9uc1xuICAgICAgICB9O1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICB0aGlzLmxvZ2dlci53YXJuKGBmYWlsZWQgcGFyc2luZyBvcHRpb25zIHN0cmluZyBpbiBuZXN0aW5nIGZvciBrZXkgJHtrZXl9YCwgZSk7XG4gICAgICAgIHJldHVybiBgJHtrZXl9JHtzZXB9JHtvcHRpb25zU3RyaW5nfWA7XG4gICAgICB9XG4gICAgICBkZWxldGUgY2xvbmVkT3B0aW9ucy5kZWZhdWx0VmFsdWU7XG4gICAgICByZXR1cm4ga2V5O1xuICAgIH1cbiAgICB3aGlsZSAobWF0Y2ggPSB0aGlzLm5lc3RpbmdSZWdleHAuZXhlYyhzdHIpKSB7XG4gICAgICBsZXQgZm9ybWF0dGVycyA9IFtdO1xuICAgICAgY2xvbmVkT3B0aW9ucyA9IHtcbiAgICAgICAgLi4ub3B0aW9uc1xuICAgICAgfTtcbiAgICAgIGNsb25lZE9wdGlvbnMgPSBjbG9uZWRPcHRpb25zLnJlcGxhY2UgJiYgdHlwZW9mIGNsb25lZE9wdGlvbnMucmVwbGFjZSAhPT0gJ3N0cmluZycgPyBjbG9uZWRPcHRpb25zLnJlcGxhY2UgOiBjbG9uZWRPcHRpb25zO1xuICAgICAgY2xvbmVkT3B0aW9ucy5hcHBseVBvc3RQcm9jZXNzb3IgPSBmYWxzZTtcbiAgICAgIGRlbGV0ZSBjbG9uZWRPcHRpb25zLmRlZmF1bHRWYWx1ZTtcbiAgICAgIGxldCBkb1JlZHVjZSA9IGZhbHNlO1xuICAgICAgaWYgKG1hdGNoWzBdLmluZGV4T2YodGhpcy5mb3JtYXRTZXBhcmF0b3IpICE9PSAtMSAmJiAhL3suKn0vLnRlc3QobWF0Y2hbMV0pKSB7XG4gICAgICAgIGNvbnN0IHIgPSBtYXRjaFsxXS5zcGxpdCh0aGlzLmZvcm1hdFNlcGFyYXRvcikubWFwKGVsZW0gPT4gZWxlbS50cmltKCkpO1xuICAgICAgICBtYXRjaFsxXSA9IHIuc2hpZnQoKTtcbiAgICAgICAgZm9ybWF0dGVycyA9IHI7XG4gICAgICAgIGRvUmVkdWNlID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHZhbHVlID0gZmMoaGFuZGxlSGFzT3B0aW9ucy5jYWxsKHRoaXMsIG1hdGNoWzFdLnRyaW0oKSwgY2xvbmVkT3B0aW9ucyksIGNsb25lZE9wdGlvbnMpO1xuICAgICAgaWYgKHZhbHVlICYmIG1hdGNoWzBdID09PSBzdHIgJiYgdHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJykgcmV0dXJuIHZhbHVlO1xuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycpIHZhbHVlID0gbWFrZVN0cmluZyh2YWx1ZSk7XG4gICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLndhcm4oYG1pc3NlZCB0byByZXNvbHZlICR7bWF0Y2hbMV19IGZvciBuZXN0aW5nICR7c3RyfWApO1xuICAgICAgICB2YWx1ZSA9ICcnO1xuICAgICAgfVxuICAgICAgaWYgKGRvUmVkdWNlKSB7XG4gICAgICAgIHZhbHVlID0gZm9ybWF0dGVycy5yZWR1Y2UoKHYsIGYpID0+IHRoaXMuZm9ybWF0KHYsIGYsIG9wdGlvbnMubG5nLCB7XG4gICAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgICBpbnRlcnBvbGF0aW9ua2V5OiBtYXRjaFsxXS50cmltKClcbiAgICAgICAgfSksIHZhbHVlLnRyaW0oKSk7XG4gICAgICB9XG4gICAgICBzdHIgPSBzdHIucmVwbGFjZShtYXRjaFswXSwgdmFsdWUpO1xuICAgICAgdGhpcy5yZWdleHAubGFzdEluZGV4ID0gMDtcbiAgICB9XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufVxuXG5mdW5jdGlvbiBwYXJzZUZvcm1hdFN0cihmb3JtYXRTdHIpIHtcbiAgbGV0IGZvcm1hdE5hbWUgPSBmb3JtYXRTdHIudG9Mb3dlckNhc2UoKS50cmltKCk7XG4gIGNvbnN0IGZvcm1hdE9wdGlvbnMgPSB7fTtcbiAgaWYgKGZvcm1hdFN0ci5pbmRleE9mKCcoJykgPiAtMSkge1xuICAgIGNvbnN0IHAgPSBmb3JtYXRTdHIuc3BsaXQoJygnKTtcbiAgICBmb3JtYXROYW1lID0gcFswXS50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcbiAgICBjb25zdCBvcHRTdHIgPSBwWzFdLnN1YnN0cmluZygwLCBwWzFdLmxlbmd0aCAtIDEpO1xuICAgIGlmIChmb3JtYXROYW1lID09PSAnY3VycmVuY3knICYmIG9wdFN0ci5pbmRleE9mKCc6JykgPCAwKSB7XG4gICAgICBpZiAoIWZvcm1hdE9wdGlvbnMuY3VycmVuY3kpIGZvcm1hdE9wdGlvbnMuY3VycmVuY3kgPSBvcHRTdHIudHJpbSgpO1xuICAgIH0gZWxzZSBpZiAoZm9ybWF0TmFtZSA9PT0gJ3JlbGF0aXZldGltZScgJiYgb3B0U3RyLmluZGV4T2YoJzonKSA8IDApIHtcbiAgICAgIGlmICghZm9ybWF0T3B0aW9ucy5yYW5nZSkgZm9ybWF0T3B0aW9ucy5yYW5nZSA9IG9wdFN0ci50cmltKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IG9wdHMgPSBvcHRTdHIuc3BsaXQoJzsnKTtcbiAgICAgIG9wdHMuZm9yRWFjaChvcHQgPT4ge1xuICAgICAgICBpZiAoIW9wdCkgcmV0dXJuO1xuICAgICAgICBjb25zdCBba2V5LCAuLi5yZXN0XSA9IG9wdC5zcGxpdCgnOicpO1xuICAgICAgICBjb25zdCB2YWwgPSByZXN0LmpvaW4oJzonKS50cmltKCkucmVwbGFjZSgvXicrfCcrJC9nLCAnJyk7XG4gICAgICAgIGlmICghZm9ybWF0T3B0aW9uc1trZXkudHJpbSgpXSkgZm9ybWF0T3B0aW9uc1trZXkudHJpbSgpXSA9IHZhbDtcbiAgICAgICAgaWYgKHZhbCA9PT0gJ2ZhbHNlJykgZm9ybWF0T3B0aW9uc1trZXkudHJpbSgpXSA9IGZhbHNlO1xuICAgICAgICBpZiAodmFsID09PSAndHJ1ZScpIGZvcm1hdE9wdGlvbnNba2V5LnRyaW0oKV0gPSB0cnVlO1xuICAgICAgICBpZiAoIWlzTmFOKHZhbCkpIGZvcm1hdE9wdGlvbnNba2V5LnRyaW0oKV0gPSBwYXJzZUludCh2YWwsIDEwKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4ge1xuICAgIGZvcm1hdE5hbWUsXG4gICAgZm9ybWF0T3B0aW9uc1xuICB9O1xufVxuZnVuY3Rpb24gY3JlYXRlQ2FjaGVkRm9ybWF0dGVyKGZuKSB7XG4gIGNvbnN0IGNhY2hlID0ge307XG4gIHJldHVybiBmdW5jdGlvbiBpbnZva2VGb3JtYXR0ZXIodmFsLCBsbmcsIG9wdGlvbnMpIHtcbiAgICBjb25zdCBrZXkgPSBsbmcgKyBKU09OLnN0cmluZ2lmeShvcHRpb25zKTtcbiAgICBsZXQgZm9ybWF0dGVyID0gY2FjaGVba2V5XTtcbiAgICBpZiAoIWZvcm1hdHRlcikge1xuICAgICAgZm9ybWF0dGVyID0gZm4oZ2V0Q2xlYW5lZENvZGUobG5nKSwgb3B0aW9ucyk7XG4gICAgICBjYWNoZVtrZXldID0gZm9ybWF0dGVyO1xuICAgIH1cbiAgICByZXR1cm4gZm9ybWF0dGVyKHZhbCk7XG4gIH07XG59XG5jbGFzcyBGb3JtYXR0ZXIge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDoge307XG4gICAgdGhpcy5sb2dnZXIgPSBiYXNlTG9nZ2VyLmNyZWF0ZSgnZm9ybWF0dGVyJyk7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLmZvcm1hdHMgPSB7XG4gICAgICBudW1iZXI6IGNyZWF0ZUNhY2hlZEZvcm1hdHRlcigobG5nLCBvcHQpID0+IHtcbiAgICAgICAgY29uc3QgZm9ybWF0dGVyID0gbmV3IEludGwuTnVtYmVyRm9ybWF0KGxuZywge1xuICAgICAgICAgIC4uLm9wdFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHZhbCA9PiBmb3JtYXR0ZXIuZm9ybWF0KHZhbCk7XG4gICAgICB9KSxcbiAgICAgIGN1cnJlbmN5OiBjcmVhdGVDYWNoZWRGb3JtYXR0ZXIoKGxuZywgb3B0KSA9PiB7XG4gICAgICAgIGNvbnN0IGZvcm1hdHRlciA9IG5ldyBJbnRsLk51bWJlckZvcm1hdChsbmcsIHtcbiAgICAgICAgICAuLi5vcHQsXG4gICAgICAgICAgc3R5bGU6ICdjdXJyZW5jeSdcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB2YWwgPT4gZm9ybWF0dGVyLmZvcm1hdCh2YWwpO1xuICAgICAgfSksXG4gICAgICBkYXRldGltZTogY3JlYXRlQ2FjaGVkRm9ybWF0dGVyKChsbmcsIG9wdCkgPT4ge1xuICAgICAgICBjb25zdCBmb3JtYXR0ZXIgPSBuZXcgSW50bC5EYXRlVGltZUZvcm1hdChsbmcsIHtcbiAgICAgICAgICAuLi5vcHRcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB2YWwgPT4gZm9ybWF0dGVyLmZvcm1hdCh2YWwpO1xuICAgICAgfSksXG4gICAgICByZWxhdGl2ZXRpbWU6IGNyZWF0ZUNhY2hlZEZvcm1hdHRlcigobG5nLCBvcHQpID0+IHtcbiAgICAgICAgY29uc3QgZm9ybWF0dGVyID0gbmV3IEludGwuUmVsYXRpdmVUaW1lRm9ybWF0KGxuZywge1xuICAgICAgICAgIC4uLm9wdFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHZhbCA9PiBmb3JtYXR0ZXIuZm9ybWF0KHZhbCwgb3B0LnJhbmdlIHx8ICdkYXknKTtcbiAgICAgIH0pLFxuICAgICAgbGlzdDogY3JlYXRlQ2FjaGVkRm9ybWF0dGVyKChsbmcsIG9wdCkgPT4ge1xuICAgICAgICBjb25zdCBmb3JtYXR0ZXIgPSBuZXcgSW50bC5MaXN0Rm9ybWF0KGxuZywge1xuICAgICAgICAgIC4uLm9wdFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHZhbCA9PiBmb3JtYXR0ZXIuZm9ybWF0KHZhbCk7XG4gICAgICB9KVxuICAgIH07XG4gICAgdGhpcy5pbml0KG9wdGlvbnMpO1xuICB9XG4gIGluaXQoc2VydmljZXMpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge1xuICAgICAgaW50ZXJwb2xhdGlvbjoge31cbiAgICB9O1xuICAgIGNvbnN0IGlPcHRzID0gb3B0aW9ucy5pbnRlcnBvbGF0aW9uO1xuICAgIHRoaXMuZm9ybWF0U2VwYXJhdG9yID0gaU9wdHMuZm9ybWF0U2VwYXJhdG9yID8gaU9wdHMuZm9ybWF0U2VwYXJhdG9yIDogaU9wdHMuZm9ybWF0U2VwYXJhdG9yIHx8ICcsJztcbiAgfVxuICBhZGQobmFtZSwgZmMpIHtcbiAgICB0aGlzLmZvcm1hdHNbbmFtZS50b0xvd2VyQ2FzZSgpLnRyaW0oKV0gPSBmYztcbiAgfVxuICBhZGRDYWNoZWQobmFtZSwgZmMpIHtcbiAgICB0aGlzLmZvcm1hdHNbbmFtZS50b0xvd2VyQ2FzZSgpLnRyaW0oKV0gPSBjcmVhdGVDYWNoZWRGb3JtYXR0ZXIoZmMpO1xuICB9XG4gIGZvcm1hdCh2YWx1ZSwgZm9ybWF0LCBsbmcpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAzICYmIGFyZ3VtZW50c1szXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzNdIDoge307XG4gICAgY29uc3QgZm9ybWF0cyA9IGZvcm1hdC5zcGxpdCh0aGlzLmZvcm1hdFNlcGFyYXRvcik7XG4gICAgY29uc3QgcmVzdWx0ID0gZm9ybWF0cy5yZWR1Y2UoKG1lbSwgZikgPT4ge1xuICAgICAgY29uc3Qge1xuICAgICAgICBmb3JtYXROYW1lLFxuICAgICAgICBmb3JtYXRPcHRpb25zXG4gICAgICB9ID0gcGFyc2VGb3JtYXRTdHIoZik7XG4gICAgICBpZiAodGhpcy5mb3JtYXRzW2Zvcm1hdE5hbWVdKSB7XG4gICAgICAgIGxldCBmb3JtYXR0ZWQgPSBtZW07XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgdmFsT3B0aW9ucyA9IG9wdGlvbnMgJiYgb3B0aW9ucy5mb3JtYXRQYXJhbXMgJiYgb3B0aW9ucy5mb3JtYXRQYXJhbXNbb3B0aW9ucy5pbnRlcnBvbGF0aW9ua2V5XSB8fCB7fTtcbiAgICAgICAgICBjb25zdCBsID0gdmFsT3B0aW9ucy5sb2NhbGUgfHwgdmFsT3B0aW9ucy5sbmcgfHwgb3B0aW9ucy5sb2NhbGUgfHwgb3B0aW9ucy5sbmcgfHwgbG5nO1xuICAgICAgICAgIGZvcm1hdHRlZCA9IHRoaXMuZm9ybWF0c1tmb3JtYXROYW1lXShtZW0sIGwsIHtcbiAgICAgICAgICAgIC4uLmZvcm1hdE9wdGlvbnMsXG4gICAgICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICAgICAgLi4udmFsT3B0aW9uc1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIHRoaXMubG9nZ2VyLndhcm4oZXJyb3IpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmb3JtYXR0ZWQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmxvZ2dlci53YXJuKGB0aGVyZSB3YXMgbm8gZm9ybWF0IGZ1bmN0aW9uIGZvciAke2Zvcm1hdE5hbWV9YCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbWVtO1xuICAgIH0sIHZhbHVlKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlbW92ZVBlbmRpbmcocSwgbmFtZSkge1xuICBpZiAocS5wZW5kaW5nW25hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICBkZWxldGUgcS5wZW5kaW5nW25hbWVdO1xuICAgIHEucGVuZGluZ0NvdW50LS07XG4gIH1cbn1cbmNsYXNzIENvbm5lY3RvciBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yKGJhY2tlbmQsIHN0b3JlLCBzZXJ2aWNlcykge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDMgJiYgYXJndW1lbnRzWzNdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbM10gOiB7fTtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuYmFja2VuZCA9IGJhY2tlbmQ7XG4gICAgdGhpcy5zdG9yZSA9IHN0b3JlO1xuICAgIHRoaXMuc2VydmljZXMgPSBzZXJ2aWNlcztcbiAgICB0aGlzLmxhbmd1YWdlVXRpbHMgPSBzZXJ2aWNlcy5sYW5ndWFnZVV0aWxzO1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy5sb2dnZXIgPSBiYXNlTG9nZ2VyLmNyZWF0ZSgnYmFja2VuZENvbm5lY3RvcicpO1xuICAgIHRoaXMud2FpdGluZ1JlYWRzID0gW107XG4gICAgdGhpcy5tYXhQYXJhbGxlbFJlYWRzID0gb3B0aW9ucy5tYXhQYXJhbGxlbFJlYWRzIHx8IDEwO1xuICAgIHRoaXMucmVhZGluZ0NhbGxzID0gMDtcbiAgICB0aGlzLm1heFJldHJpZXMgPSBvcHRpb25zLm1heFJldHJpZXMgPj0gMCA/IG9wdGlvbnMubWF4UmV0cmllcyA6IDU7XG4gICAgdGhpcy5yZXRyeVRpbWVvdXQgPSBvcHRpb25zLnJldHJ5VGltZW91dCA+PSAxID8gb3B0aW9ucy5yZXRyeVRpbWVvdXQgOiAzNTA7XG4gICAgdGhpcy5zdGF0ZSA9IHt9O1xuICAgIHRoaXMucXVldWUgPSBbXTtcbiAgICBpZiAodGhpcy5iYWNrZW5kICYmIHRoaXMuYmFja2VuZC5pbml0KSB7XG4gICAgICB0aGlzLmJhY2tlbmQuaW5pdChzZXJ2aWNlcywgb3B0aW9ucy5iYWNrZW5kLCBvcHRpb25zKTtcbiAgICB9XG4gIH1cbiAgcXVldWVMb2FkKGxhbmd1YWdlcywgbmFtZXNwYWNlcywgb3B0aW9ucywgY2FsbGJhY2spIHtcbiAgICBjb25zdCB0b0xvYWQgPSB7fTtcbiAgICBjb25zdCBwZW5kaW5nID0ge307XG4gICAgY29uc3QgdG9Mb2FkTGFuZ3VhZ2VzID0ge307XG4gICAgY29uc3QgdG9Mb2FkTmFtZXNwYWNlcyA9IHt9O1xuICAgIGxhbmd1YWdlcy5mb3JFYWNoKGxuZyA9PiB7XG4gICAgICBsZXQgaGFzQWxsTmFtZXNwYWNlcyA9IHRydWU7XG4gICAgICBuYW1lc3BhY2VzLmZvckVhY2gobnMgPT4ge1xuICAgICAgICBjb25zdCBuYW1lID0gYCR7bG5nfXwke25zfWA7XG4gICAgICAgIGlmICghb3B0aW9ucy5yZWxvYWQgJiYgdGhpcy5zdG9yZS5oYXNSZXNvdXJjZUJ1bmRsZShsbmcsIG5zKSkge1xuICAgICAgICAgIHRoaXMuc3RhdGVbbmFtZV0gPSAyO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdGVbbmFtZV0gPCAwKSA7IGVsc2UgaWYgKHRoaXMuc3RhdGVbbmFtZV0gPT09IDEpIHtcbiAgICAgICAgICBpZiAocGVuZGluZ1tuYW1lXSA9PT0gdW5kZWZpbmVkKSBwZW5kaW5nW25hbWVdID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLnN0YXRlW25hbWVdID0gMTtcbiAgICAgICAgICBoYXNBbGxOYW1lc3BhY2VzID0gZmFsc2U7XG4gICAgICAgICAgaWYgKHBlbmRpbmdbbmFtZV0gPT09IHVuZGVmaW5lZCkgcGVuZGluZ1tuYW1lXSA9IHRydWU7XG4gICAgICAgICAgaWYgKHRvTG9hZFtuYW1lXSA9PT0gdW5kZWZpbmVkKSB0b0xvYWRbbmFtZV0gPSB0cnVlO1xuICAgICAgICAgIGlmICh0b0xvYWROYW1lc3BhY2VzW25zXSA9PT0gdW5kZWZpbmVkKSB0b0xvYWROYW1lc3BhY2VzW25zXSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgaWYgKCFoYXNBbGxOYW1lc3BhY2VzKSB0b0xvYWRMYW5ndWFnZXNbbG5nXSA9IHRydWU7XG4gICAgfSk7XG4gICAgaWYgKE9iamVjdC5rZXlzKHRvTG9hZCkubGVuZ3RoIHx8IE9iamVjdC5rZXlzKHBlbmRpbmcpLmxlbmd0aCkge1xuICAgICAgdGhpcy5xdWV1ZS5wdXNoKHtcbiAgICAgICAgcGVuZGluZyxcbiAgICAgICAgcGVuZGluZ0NvdW50OiBPYmplY3Qua2V5cyhwZW5kaW5nKS5sZW5ndGgsXG4gICAgICAgIGxvYWRlZDoge30sXG4gICAgICAgIGVycm9yczogW10sXG4gICAgICAgIGNhbGxiYWNrXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHRvTG9hZDogT2JqZWN0LmtleXModG9Mb2FkKSxcbiAgICAgIHBlbmRpbmc6IE9iamVjdC5rZXlzKHBlbmRpbmcpLFxuICAgICAgdG9Mb2FkTGFuZ3VhZ2VzOiBPYmplY3Qua2V5cyh0b0xvYWRMYW5ndWFnZXMpLFxuICAgICAgdG9Mb2FkTmFtZXNwYWNlczogT2JqZWN0LmtleXModG9Mb2FkTmFtZXNwYWNlcylcbiAgICB9O1xuICB9XG4gIGxvYWRlZChuYW1lLCBlcnIsIGRhdGEpIHtcbiAgICBjb25zdCBzID0gbmFtZS5zcGxpdCgnfCcpO1xuICAgIGNvbnN0IGxuZyA9IHNbMF07XG4gICAgY29uc3QgbnMgPSBzWzFdO1xuICAgIGlmIChlcnIpIHRoaXMuZW1pdCgnZmFpbGVkTG9hZGluZycsIGxuZywgbnMsIGVycik7XG4gICAgaWYgKGRhdGEpIHtcbiAgICAgIHRoaXMuc3RvcmUuYWRkUmVzb3VyY2VCdW5kbGUobG5nLCBucywgZGF0YSk7XG4gICAgfVxuICAgIHRoaXMuc3RhdGVbbmFtZV0gPSBlcnIgPyAtMSA6IDI7XG4gICAgY29uc3QgbG9hZGVkID0ge307XG4gICAgdGhpcy5xdWV1ZS5mb3JFYWNoKHEgPT4ge1xuICAgICAgcHVzaFBhdGgocS5sb2FkZWQsIFtsbmddLCBucyk7XG4gICAgICByZW1vdmVQZW5kaW5nKHEsIG5hbWUpO1xuICAgICAgaWYgKGVycikgcS5lcnJvcnMucHVzaChlcnIpO1xuICAgICAgaWYgKHEucGVuZGluZ0NvdW50ID09PSAwICYmICFxLmRvbmUpIHtcbiAgICAgICAgT2JqZWN0LmtleXMocS5sb2FkZWQpLmZvckVhY2gobCA9PiB7XG4gICAgICAgICAgaWYgKCFsb2FkZWRbbF0pIGxvYWRlZFtsXSA9IHt9O1xuICAgICAgICAgIGNvbnN0IGxvYWRlZEtleXMgPSBxLmxvYWRlZFtsXTtcbiAgICAgICAgICBpZiAobG9hZGVkS2V5cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGxvYWRlZEtleXMuZm9yRWFjaChuID0+IHtcbiAgICAgICAgICAgICAgaWYgKGxvYWRlZFtsXVtuXSA9PT0gdW5kZWZpbmVkKSBsb2FkZWRbbF1bbl0gPSB0cnVlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcS5kb25lID0gdHJ1ZTtcbiAgICAgICAgaWYgKHEuZXJyb3JzLmxlbmd0aCkge1xuICAgICAgICAgIHEuY2FsbGJhY2socS5lcnJvcnMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHEuY2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuZW1pdCgnbG9hZGVkJywgbG9hZGVkKTtcbiAgICB0aGlzLnF1ZXVlID0gdGhpcy5xdWV1ZS5maWx0ZXIocSA9PiAhcS5kb25lKTtcbiAgfVxuICByZWFkKGxuZywgbnMsIGZjTmFtZSkge1xuICAgIGxldCB0cmllZCA9IGFyZ3VtZW50cy5sZW5ndGggPiAzICYmIGFyZ3VtZW50c1szXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzNdIDogMDtcbiAgICBsZXQgd2FpdCA9IGFyZ3VtZW50cy5sZW5ndGggPiA0ICYmIGFyZ3VtZW50c1s0XSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzRdIDogdGhpcy5yZXRyeVRpbWVvdXQ7XG4gICAgbGV0IGNhbGxiYWNrID0gYXJndW1lbnRzLmxlbmd0aCA+IDUgPyBhcmd1bWVudHNbNV0gOiB1bmRlZmluZWQ7XG4gICAgaWYgKCFsbmcubGVuZ3RoKSByZXR1cm4gY2FsbGJhY2sobnVsbCwge30pO1xuICAgIGlmICh0aGlzLnJlYWRpbmdDYWxscyA+PSB0aGlzLm1heFBhcmFsbGVsUmVhZHMpIHtcbiAgICAgIHRoaXMud2FpdGluZ1JlYWRzLnB1c2goe1xuICAgICAgICBsbmcsXG4gICAgICAgIG5zLFxuICAgICAgICBmY05hbWUsXG4gICAgICAgIHRyaWVkLFxuICAgICAgICB3YWl0LFxuICAgICAgICBjYWxsYmFja1xuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMucmVhZGluZ0NhbGxzKys7XG4gICAgY29uc3QgcmVzb2x2ZXIgPSAoZXJyLCBkYXRhKSA9PiB7XG4gICAgICB0aGlzLnJlYWRpbmdDYWxscy0tO1xuICAgICAgaWYgKHRoaXMud2FpdGluZ1JlYWRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3QgbmV4dCA9IHRoaXMud2FpdGluZ1JlYWRzLnNoaWZ0KCk7XG4gICAgICAgIHRoaXMucmVhZChuZXh0LmxuZywgbmV4dC5ucywgbmV4dC5mY05hbWUsIG5leHQudHJpZWQsIG5leHQud2FpdCwgbmV4dC5jYWxsYmFjayk7XG4gICAgICB9XG4gICAgICBpZiAoZXJyICYmIGRhdGEgJiYgdHJpZWQgPCB0aGlzLm1heFJldHJpZXMpIHtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgdGhpcy5yZWFkLmNhbGwodGhpcywgbG5nLCBucywgZmNOYW1lLCB0cmllZCArIDEsIHdhaXQgKiAyLCBjYWxsYmFjayk7XG4gICAgICAgIH0sIHdhaXQpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjYWxsYmFjayhlcnIsIGRhdGEpO1xuICAgIH07XG4gICAgY29uc3QgZmMgPSB0aGlzLmJhY2tlbmRbZmNOYW1lXS5iaW5kKHRoaXMuYmFja2VuZCk7XG4gICAgaWYgKGZjLmxlbmd0aCA9PT0gMikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgciA9IGZjKGxuZywgbnMpO1xuICAgICAgICBpZiAociAmJiB0eXBlb2Ygci50aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgci50aGVuKGRhdGEgPT4gcmVzb2x2ZXIobnVsbCwgZGF0YSkpLmNhdGNoKHJlc29sdmVyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNvbHZlcihudWxsLCByKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHJlc29sdmVyKGVycik7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHJldHVybiBmYyhsbmcsIG5zLCByZXNvbHZlcik7XG4gIH1cbiAgcHJlcGFyZUxvYWRpbmcobGFuZ3VhZ2VzLCBuYW1lc3BhY2VzKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6IHt9O1xuICAgIGxldCBjYWxsYmFjayA9IGFyZ3VtZW50cy5sZW5ndGggPiAzID8gYXJndW1lbnRzWzNdIDogdW5kZWZpbmVkO1xuICAgIGlmICghdGhpcy5iYWNrZW5kKSB7XG4gICAgICB0aGlzLmxvZ2dlci53YXJuKCdObyBiYWNrZW5kIHdhcyBhZGRlZCB2aWEgaTE4bmV4dC51c2UuIFdpbGwgbm90IGxvYWQgcmVzb3VyY2VzLicpO1xuICAgICAgcmV0dXJuIGNhbGxiYWNrICYmIGNhbGxiYWNrKCk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgbGFuZ3VhZ2VzID09PSAnc3RyaW5nJykgbGFuZ3VhZ2VzID0gdGhpcy5sYW5ndWFnZVV0aWxzLnRvUmVzb2x2ZUhpZXJhcmNoeShsYW5ndWFnZXMpO1xuICAgIGlmICh0eXBlb2YgbmFtZXNwYWNlcyA9PT0gJ3N0cmluZycpIG5hbWVzcGFjZXMgPSBbbmFtZXNwYWNlc107XG4gICAgY29uc3QgdG9Mb2FkID0gdGhpcy5xdWV1ZUxvYWQobGFuZ3VhZ2VzLCBuYW1lc3BhY2VzLCBvcHRpb25zLCBjYWxsYmFjayk7XG4gICAgaWYgKCF0b0xvYWQudG9Mb2FkLmxlbmd0aCkge1xuICAgICAgaWYgKCF0b0xvYWQucGVuZGluZy5sZW5ndGgpIGNhbGxiYWNrKCk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgdG9Mb2FkLnRvTG9hZC5mb3JFYWNoKG5hbWUgPT4ge1xuICAgICAgdGhpcy5sb2FkT25lKG5hbWUpO1xuICAgIH0pO1xuICB9XG4gIGxvYWQobGFuZ3VhZ2VzLCBuYW1lc3BhY2VzLCBjYWxsYmFjaykge1xuICAgIHRoaXMucHJlcGFyZUxvYWRpbmcobGFuZ3VhZ2VzLCBuYW1lc3BhY2VzLCB7fSwgY2FsbGJhY2spO1xuICB9XG4gIHJlbG9hZChsYW5ndWFnZXMsIG5hbWVzcGFjZXMsIGNhbGxiYWNrKSB7XG4gICAgdGhpcy5wcmVwYXJlTG9hZGluZyhsYW5ndWFnZXMsIG5hbWVzcGFjZXMsIHtcbiAgICAgIHJlbG9hZDogdHJ1ZVxuICAgIH0sIGNhbGxiYWNrKTtcbiAgfVxuICBsb2FkT25lKG5hbWUpIHtcbiAgICBsZXQgcHJlZml4ID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiAnJztcbiAgICBjb25zdCBzID0gbmFtZS5zcGxpdCgnfCcpO1xuICAgIGNvbnN0IGxuZyA9IHNbMF07XG4gICAgY29uc3QgbnMgPSBzWzFdO1xuICAgIHRoaXMucmVhZChsbmcsIG5zLCAncmVhZCcsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCAoZXJyLCBkYXRhKSA9PiB7XG4gICAgICBpZiAoZXJyKSB0aGlzLmxvZ2dlci53YXJuKGAke3ByZWZpeH1sb2FkaW5nIG5hbWVzcGFjZSAke25zfSBmb3IgbGFuZ3VhZ2UgJHtsbmd9IGZhaWxlZGAsIGVycik7XG4gICAgICBpZiAoIWVyciAmJiBkYXRhKSB0aGlzLmxvZ2dlci5sb2coYCR7cHJlZml4fWxvYWRlZCBuYW1lc3BhY2UgJHtuc30gZm9yIGxhbmd1YWdlICR7bG5nfWAsIGRhdGEpO1xuICAgICAgdGhpcy5sb2FkZWQobmFtZSwgZXJyLCBkYXRhKTtcbiAgICB9KTtcbiAgfVxuICBzYXZlTWlzc2luZyhsYW5ndWFnZXMsIG5hbWVzcGFjZSwga2V5LCBmYWxsYmFja1ZhbHVlLCBpc1VwZGF0ZSkge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDUgJiYgYXJndW1lbnRzWzVdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbNV0gOiB7fTtcbiAgICBsZXQgY2xiID0gYXJndW1lbnRzLmxlbmd0aCA+IDYgJiYgYXJndW1lbnRzWzZdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbNl0gOiAoKSA9PiB7fTtcbiAgICBpZiAodGhpcy5zZXJ2aWNlcy51dGlscyAmJiB0aGlzLnNlcnZpY2VzLnV0aWxzLmhhc0xvYWRlZE5hbWVzcGFjZSAmJiAhdGhpcy5zZXJ2aWNlcy51dGlscy5oYXNMb2FkZWROYW1lc3BhY2UobmFtZXNwYWNlKSkge1xuICAgICAgdGhpcy5sb2dnZXIud2FybihgZGlkIG5vdCBzYXZlIGtleSBcIiR7a2V5fVwiIGFzIHRoZSBuYW1lc3BhY2UgXCIke25hbWVzcGFjZX1cIiB3YXMgbm90IHlldCBsb2FkZWRgLCAnVGhpcyBtZWFucyBzb21ldGhpbmcgSVMgV1JPTkcgaW4geW91ciBzZXR1cC4gWW91IGFjY2VzcyB0aGUgdCBmdW5jdGlvbiBiZWZvcmUgaTE4bmV4dC5pbml0IC8gaTE4bmV4dC5sb2FkTmFtZXNwYWNlIC8gaTE4bmV4dC5jaGFuZ2VMYW5ndWFnZSB3YXMgZG9uZS4gV2FpdCBmb3IgdGhlIGNhbGxiYWNrIG9yIFByb21pc2UgdG8gcmVzb2x2ZSBiZWZvcmUgYWNjZXNzaW5nIGl0ISEhJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChrZXkgPT09IHVuZGVmaW5lZCB8fCBrZXkgPT09IG51bGwgfHwga2V5ID09PSAnJykgcmV0dXJuO1xuICAgIGlmICh0aGlzLmJhY2tlbmQgJiYgdGhpcy5iYWNrZW5kLmNyZWF0ZSkge1xuICAgICAgY29uc3Qgb3B0cyA9IHtcbiAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgaXNVcGRhdGVcbiAgICAgIH07XG4gICAgICBjb25zdCBmYyA9IHRoaXMuYmFja2VuZC5jcmVhdGUuYmluZCh0aGlzLmJhY2tlbmQpO1xuICAgICAgaWYgKGZjLmxlbmd0aCA8IDYpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBsZXQgcjtcbiAgICAgICAgICBpZiAoZmMubGVuZ3RoID09PSA1KSB7XG4gICAgICAgICAgICByID0gZmMobGFuZ3VhZ2VzLCBuYW1lc3BhY2UsIGtleSwgZmFsbGJhY2tWYWx1ZSwgb3B0cyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHIgPSBmYyhsYW5ndWFnZXMsIG5hbWVzcGFjZSwga2V5LCBmYWxsYmFja1ZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHIgJiYgdHlwZW9mIHIudGhlbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgci50aGVuKGRhdGEgPT4gY2xiKG51bGwsIGRhdGEpKS5jYXRjaChjbGIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjbGIobnVsbCwgcik7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICBjbGIoZXJyKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZmMobGFuZ3VhZ2VzLCBuYW1lc3BhY2UsIGtleSwgZmFsbGJhY2tWYWx1ZSwgY2xiLCBvcHRzKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFsYW5ndWFnZXMgfHwgIWxhbmd1YWdlc1swXSkgcmV0dXJuO1xuICAgIHRoaXMuc3RvcmUuYWRkUmVzb3VyY2UobGFuZ3VhZ2VzWzBdLCBuYW1lc3BhY2UsIGtleSwgZmFsbGJhY2tWYWx1ZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0KCkge1xuICByZXR1cm4ge1xuICAgIGRlYnVnOiBmYWxzZSxcbiAgICBpbml0SW1tZWRpYXRlOiB0cnVlLFxuICAgIG5zOiBbJ3RyYW5zbGF0aW9uJ10sXG4gICAgZGVmYXVsdE5TOiBbJ3RyYW5zbGF0aW9uJ10sXG4gICAgZmFsbGJhY2tMbmc6IFsnZGV2J10sXG4gICAgZmFsbGJhY2tOUzogZmFsc2UsXG4gICAgc3VwcG9ydGVkTG5nczogZmFsc2UsXG4gICAgbm9uRXhwbGljaXRTdXBwb3J0ZWRMbmdzOiBmYWxzZSxcbiAgICBsb2FkOiAnYWxsJyxcbiAgICBwcmVsb2FkOiBmYWxzZSxcbiAgICBzaW1wbGlmeVBsdXJhbFN1ZmZpeDogdHJ1ZSxcbiAgICBrZXlTZXBhcmF0b3I6ICcuJyxcbiAgICBuc1NlcGFyYXRvcjogJzonLFxuICAgIHBsdXJhbFNlcGFyYXRvcjogJ18nLFxuICAgIGNvbnRleHRTZXBhcmF0b3I6ICdfJyxcbiAgICBwYXJ0aWFsQnVuZGxlZExhbmd1YWdlczogZmFsc2UsXG4gICAgc2F2ZU1pc3Npbmc6IGZhbHNlLFxuICAgIHVwZGF0ZU1pc3Npbmc6IGZhbHNlLFxuICAgIHNhdmVNaXNzaW5nVG86ICdmYWxsYmFjaycsXG4gICAgc2F2ZU1pc3NpbmdQbHVyYWxzOiB0cnVlLFxuICAgIG1pc3NpbmdLZXlIYW5kbGVyOiBmYWxzZSxcbiAgICBtaXNzaW5nSW50ZXJwb2xhdGlvbkhhbmRsZXI6IGZhbHNlLFxuICAgIHBvc3RQcm9jZXNzOiBmYWxzZSxcbiAgICBwb3N0UHJvY2Vzc1Bhc3NSZXNvbHZlZDogZmFsc2UsXG4gICAgcmV0dXJuTnVsbDogZmFsc2UsXG4gICAgcmV0dXJuRW1wdHlTdHJpbmc6IHRydWUsXG4gICAgcmV0dXJuT2JqZWN0czogZmFsc2UsXG4gICAgam9pbkFycmF5czogZmFsc2UsXG4gICAgcmV0dXJuZWRPYmplY3RIYW5kbGVyOiBmYWxzZSxcbiAgICBwYXJzZU1pc3NpbmdLZXlIYW5kbGVyOiBmYWxzZSxcbiAgICBhcHBlbmROYW1lc3BhY2VUb01pc3NpbmdLZXk6IGZhbHNlLFxuICAgIGFwcGVuZE5hbWVzcGFjZVRvQ0lNb2RlOiBmYWxzZSxcbiAgICBvdmVybG9hZFRyYW5zbGF0aW9uT3B0aW9uSGFuZGxlcjogZnVuY3Rpb24gaGFuZGxlKGFyZ3MpIHtcbiAgICAgIGxldCByZXQgPSB7fTtcbiAgICAgIGlmICh0eXBlb2YgYXJnc1sxXSA9PT0gJ29iamVjdCcpIHJldCA9IGFyZ3NbMV07XG4gICAgICBpZiAodHlwZW9mIGFyZ3NbMV0gPT09ICdzdHJpbmcnKSByZXQuZGVmYXVsdFZhbHVlID0gYXJnc1sxXTtcbiAgICAgIGlmICh0eXBlb2YgYXJnc1syXSA9PT0gJ3N0cmluZycpIHJldC50RGVzY3JpcHRpb24gPSBhcmdzWzJdO1xuICAgICAgaWYgKHR5cGVvZiBhcmdzWzJdID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgYXJnc1szXSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IGFyZ3NbM10gfHwgYXJnc1syXTtcbiAgICAgICAgT2JqZWN0LmtleXMob3B0aW9ucykuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICAgIHJldFtrZXldID0gb3B0aW9uc1trZXldO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXQ7XG4gICAgfSxcbiAgICBpbnRlcnBvbGF0aW9uOiB7XG4gICAgICBlc2NhcGVWYWx1ZTogdHJ1ZSxcbiAgICAgIGZvcm1hdDogKHZhbHVlLCBmb3JtYXQsIGxuZywgb3B0aW9ucykgPT4gdmFsdWUsXG4gICAgICBwcmVmaXg6ICd7eycsXG4gICAgICBzdWZmaXg6ICd9fScsXG4gICAgICBmb3JtYXRTZXBhcmF0b3I6ICcsJyxcbiAgICAgIHVuZXNjYXBlUHJlZml4OiAnLScsXG4gICAgICBuZXN0aW5nUHJlZml4OiAnJHQoJyxcbiAgICAgIG5lc3RpbmdTdWZmaXg6ICcpJyxcbiAgICAgIG5lc3RpbmdPcHRpb25zU2VwYXJhdG9yOiAnLCcsXG4gICAgICBtYXhSZXBsYWNlczogMTAwMCxcbiAgICAgIHNraXBPblZhcmlhYmxlczogdHJ1ZVxuICAgIH1cbiAgfTtcbn1cbmZ1bmN0aW9uIHRyYW5zZm9ybU9wdGlvbnMob3B0aW9ucykge1xuICBpZiAodHlwZW9mIG9wdGlvbnMubnMgPT09ICdzdHJpbmcnKSBvcHRpb25zLm5zID0gW29wdGlvbnMubnNdO1xuICBpZiAodHlwZW9mIG9wdGlvbnMuZmFsbGJhY2tMbmcgPT09ICdzdHJpbmcnKSBvcHRpb25zLmZhbGxiYWNrTG5nID0gW29wdGlvbnMuZmFsbGJhY2tMbmddO1xuICBpZiAodHlwZW9mIG9wdGlvbnMuZmFsbGJhY2tOUyA9PT0gJ3N0cmluZycpIG9wdGlvbnMuZmFsbGJhY2tOUyA9IFtvcHRpb25zLmZhbGxiYWNrTlNdO1xuICBpZiAob3B0aW9ucy5zdXBwb3J0ZWRMbmdzICYmIG9wdGlvbnMuc3VwcG9ydGVkTG5ncy5pbmRleE9mKCdjaW1vZGUnKSA8IDApIHtcbiAgICBvcHRpb25zLnN1cHBvcnRlZExuZ3MgPSBvcHRpb25zLnN1cHBvcnRlZExuZ3MuY29uY2F0KFsnY2ltb2RlJ10pO1xuICB9XG4gIHJldHVybiBvcHRpb25zO1xufVxuXG5mdW5jdGlvbiBub29wKCkge31cbmZ1bmN0aW9uIGJpbmRNZW1iZXJGdW5jdGlvbnMoaW5zdCkge1xuICBjb25zdCBtZW1zID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoT2JqZWN0LmdldFByb3RvdHlwZU9mKGluc3QpKTtcbiAgbWVtcy5mb3JFYWNoKG1lbSA9PiB7XG4gICAgaWYgKHR5cGVvZiBpbnN0W21lbV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGluc3RbbWVtXSA9IGluc3RbbWVtXS5iaW5kKGluc3QpO1xuICAgIH1cbiAgfSk7XG59XG5jbGFzcyBJMThuIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IHt9O1xuICAgIGxldCBjYWxsYmFjayA9IGFyZ3VtZW50cy5sZW5ndGggPiAxID8gYXJndW1lbnRzWzFdIDogdW5kZWZpbmVkO1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5vcHRpb25zID0gdHJhbnNmb3JtT3B0aW9ucyhvcHRpb25zKTtcbiAgICB0aGlzLnNlcnZpY2VzID0ge307XG4gICAgdGhpcy5sb2dnZXIgPSBiYXNlTG9nZ2VyO1xuICAgIHRoaXMubW9kdWxlcyA9IHtcbiAgICAgIGV4dGVybmFsOiBbXVxuICAgIH07XG4gICAgYmluZE1lbWJlckZ1bmN0aW9ucyh0aGlzKTtcbiAgICBpZiAoY2FsbGJhY2sgJiYgIXRoaXMuaXNJbml0aWFsaXplZCAmJiAhb3B0aW9ucy5pc0Nsb25lKSB7XG4gICAgICBpZiAoIXRoaXMub3B0aW9ucy5pbml0SW1tZWRpYXRlKSB7XG4gICAgICAgIHRoaXMuaW5pdChvcHRpb25zLCBjYWxsYmFjayk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuaW5pdChvcHRpb25zLCBjYWxsYmFjayk7XG4gICAgICB9LCAwKTtcbiAgICB9XG4gIH1cbiAgaW5pdCgpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiB7fTtcbiAgICBsZXQgY2FsbGJhY2sgPSBhcmd1bWVudHMubGVuZ3RoID4gMSA/IGFyZ3VtZW50c1sxXSA6IHVuZGVmaW5lZDtcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNhbGxiYWNrID0gb3B0aW9ucztcbiAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICB9XG4gICAgaWYgKCFvcHRpb25zLmRlZmF1bHROUyAmJiBvcHRpb25zLmRlZmF1bHROUyAhPT0gZmFsc2UgJiYgb3B0aW9ucy5ucykge1xuICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLm5zID09PSAnc3RyaW5nJykge1xuICAgICAgICBvcHRpb25zLmRlZmF1bHROUyA9IG9wdGlvbnMubnM7XG4gICAgICB9IGVsc2UgaWYgKG9wdGlvbnMubnMuaW5kZXhPZigndHJhbnNsYXRpb24nKSA8IDApIHtcbiAgICAgICAgb3B0aW9ucy5kZWZhdWx0TlMgPSBvcHRpb25zLm5zWzBdO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBkZWZPcHRzID0gZ2V0KCk7XG4gICAgdGhpcy5vcHRpb25zID0ge1xuICAgICAgLi4uZGVmT3B0cyxcbiAgICAgIC4uLnRoaXMub3B0aW9ucyxcbiAgICAgIC4uLnRyYW5zZm9ybU9wdGlvbnMob3B0aW9ucylcbiAgICB9O1xuICAgIGlmICh0aGlzLm9wdGlvbnMuY29tcGF0aWJpbGl0eUFQSSAhPT0gJ3YxJykge1xuICAgICAgdGhpcy5vcHRpb25zLmludGVycG9sYXRpb24gPSB7XG4gICAgICAgIC4uLmRlZk9wdHMuaW50ZXJwb2xhdGlvbixcbiAgICAgICAgLi4udGhpcy5vcHRpb25zLmludGVycG9sYXRpb25cbiAgICAgIH07XG4gICAgfVxuICAgIGlmIChvcHRpb25zLmtleVNlcGFyYXRvciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLm9wdGlvbnMudXNlckRlZmluZWRLZXlTZXBhcmF0b3IgPSBvcHRpb25zLmtleVNlcGFyYXRvcjtcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMubnNTZXBhcmF0b3IgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5vcHRpb25zLnVzZXJEZWZpbmVkTnNTZXBhcmF0b3IgPSBvcHRpb25zLm5zU2VwYXJhdG9yO1xuICAgIH1cbiAgICBmdW5jdGlvbiBjcmVhdGVDbGFzc09uRGVtYW5kKENsYXNzT3JPYmplY3QpIHtcbiAgICAgIGlmICghQ2xhc3NPck9iamVjdCkgcmV0dXJuIG51bGw7XG4gICAgICBpZiAodHlwZW9mIENsYXNzT3JPYmplY3QgPT09ICdmdW5jdGlvbicpIHJldHVybiBuZXcgQ2xhc3NPck9iamVjdCgpO1xuICAgICAgcmV0dXJuIENsYXNzT3JPYmplY3Q7XG4gICAgfVxuICAgIGlmICghdGhpcy5vcHRpb25zLmlzQ2xvbmUpIHtcbiAgICAgIGlmICh0aGlzLm1vZHVsZXMubG9nZ2VyKSB7XG4gICAgICAgIGJhc2VMb2dnZXIuaW5pdChjcmVhdGVDbGFzc09uRGVtYW5kKHRoaXMubW9kdWxlcy5sb2dnZXIpLCB0aGlzLm9wdGlvbnMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYmFzZUxvZ2dlci5pbml0KG51bGwsIHRoaXMub3B0aW9ucyk7XG4gICAgICB9XG4gICAgICBsZXQgZm9ybWF0dGVyO1xuICAgICAgaWYgKHRoaXMubW9kdWxlcy5mb3JtYXR0ZXIpIHtcbiAgICAgICAgZm9ybWF0dGVyID0gdGhpcy5tb2R1bGVzLmZvcm1hdHRlcjtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIEludGwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGZvcm1hdHRlciA9IEZvcm1hdHRlcjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGx1ID0gbmV3IExhbmd1YWdlVXRpbCh0aGlzLm9wdGlvbnMpO1xuICAgICAgdGhpcy5zdG9yZSA9IG5ldyBSZXNvdXJjZVN0b3JlKHRoaXMub3B0aW9ucy5yZXNvdXJjZXMsIHRoaXMub3B0aW9ucyk7XG4gICAgICBjb25zdCBzID0gdGhpcy5zZXJ2aWNlcztcbiAgICAgIHMubG9nZ2VyID0gYmFzZUxvZ2dlcjtcbiAgICAgIHMucmVzb3VyY2VTdG9yZSA9IHRoaXMuc3RvcmU7XG4gICAgICBzLmxhbmd1YWdlVXRpbHMgPSBsdTtcbiAgICAgIHMucGx1cmFsUmVzb2x2ZXIgPSBuZXcgUGx1cmFsUmVzb2x2ZXIobHUsIHtcbiAgICAgICAgcHJlcGVuZDogdGhpcy5vcHRpb25zLnBsdXJhbFNlcGFyYXRvcixcbiAgICAgICAgY29tcGF0aWJpbGl0eUpTT046IHRoaXMub3B0aW9ucy5jb21wYXRpYmlsaXR5SlNPTixcbiAgICAgICAgc2ltcGxpZnlQbHVyYWxTdWZmaXg6IHRoaXMub3B0aW9ucy5zaW1wbGlmeVBsdXJhbFN1ZmZpeFxuICAgICAgfSk7XG4gICAgICBpZiAoZm9ybWF0dGVyICYmICghdGhpcy5vcHRpb25zLmludGVycG9sYXRpb24uZm9ybWF0IHx8IHRoaXMub3B0aW9ucy5pbnRlcnBvbGF0aW9uLmZvcm1hdCA9PT0gZGVmT3B0cy5pbnRlcnBvbGF0aW9uLmZvcm1hdCkpIHtcbiAgICAgICAgcy5mb3JtYXR0ZXIgPSBjcmVhdGVDbGFzc09uRGVtYW5kKGZvcm1hdHRlcik7XG4gICAgICAgIHMuZm9ybWF0dGVyLmluaXQocywgdGhpcy5vcHRpb25zKTtcbiAgICAgICAgdGhpcy5vcHRpb25zLmludGVycG9sYXRpb24uZm9ybWF0ID0gcy5mb3JtYXR0ZXIuZm9ybWF0LmJpbmQocy5mb3JtYXR0ZXIpO1xuICAgICAgfVxuICAgICAgcy5pbnRlcnBvbGF0b3IgPSBuZXcgSW50ZXJwb2xhdG9yKHRoaXMub3B0aW9ucyk7XG4gICAgICBzLnV0aWxzID0ge1xuICAgICAgICBoYXNMb2FkZWROYW1lc3BhY2U6IHRoaXMuaGFzTG9hZGVkTmFtZXNwYWNlLmJpbmQodGhpcylcbiAgICAgIH07XG4gICAgICBzLmJhY2tlbmRDb25uZWN0b3IgPSBuZXcgQ29ubmVjdG9yKGNyZWF0ZUNsYXNzT25EZW1hbmQodGhpcy5tb2R1bGVzLmJhY2tlbmQpLCBzLnJlc291cmNlU3RvcmUsIHMsIHRoaXMub3B0aW9ucyk7XG4gICAgICBzLmJhY2tlbmRDb25uZWN0b3Iub24oJyonLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgZm9yICh2YXIgX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBuZXcgQXJyYXkoX2xlbiA+IDEgPyBfbGVuIC0gMSA6IDApLCBfa2V5ID0gMTsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgICAgICAgIGFyZ3NbX2tleSAtIDFdID0gYXJndW1lbnRzW19rZXldO1xuICAgICAgICB9XG4gICAgICAgIF90aGlzLmVtaXQoZXZlbnQsIC4uLmFyZ3MpO1xuICAgICAgfSk7XG4gICAgICBpZiAodGhpcy5tb2R1bGVzLmxhbmd1YWdlRGV0ZWN0b3IpIHtcbiAgICAgICAgcy5sYW5ndWFnZURldGVjdG9yID0gY3JlYXRlQ2xhc3NPbkRlbWFuZCh0aGlzLm1vZHVsZXMubGFuZ3VhZ2VEZXRlY3Rvcik7XG4gICAgICAgIGlmIChzLmxhbmd1YWdlRGV0ZWN0b3IuaW5pdCkgcy5sYW5ndWFnZURldGVjdG9yLmluaXQocywgdGhpcy5vcHRpb25zLmRldGVjdGlvbiwgdGhpcy5vcHRpb25zKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLm1vZHVsZXMuaTE4bkZvcm1hdCkge1xuICAgICAgICBzLmkxOG5Gb3JtYXQgPSBjcmVhdGVDbGFzc09uRGVtYW5kKHRoaXMubW9kdWxlcy5pMThuRm9ybWF0KTtcbiAgICAgICAgaWYgKHMuaTE4bkZvcm1hdC5pbml0KSBzLmkxOG5Gb3JtYXQuaW5pdCh0aGlzKTtcbiAgICAgIH1cbiAgICAgIHRoaXMudHJhbnNsYXRvciA9IG5ldyBUcmFuc2xhdG9yKHRoaXMuc2VydmljZXMsIHRoaXMub3B0aW9ucyk7XG4gICAgICB0aGlzLnRyYW5zbGF0b3Iub24oJyonLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgZm9yICh2YXIgX2xlbjIgPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gbmV3IEFycmF5KF9sZW4yID4gMSA/IF9sZW4yIC0gMSA6IDApLCBfa2V5MiA9IDE7IF9rZXkyIDwgX2xlbjI7IF9rZXkyKyspIHtcbiAgICAgICAgICBhcmdzW19rZXkyIC0gMV0gPSBhcmd1bWVudHNbX2tleTJdO1xuICAgICAgICB9XG4gICAgICAgIF90aGlzLmVtaXQoZXZlbnQsIC4uLmFyZ3MpO1xuICAgICAgfSk7XG4gICAgICB0aGlzLm1vZHVsZXMuZXh0ZXJuYWwuZm9yRWFjaChtID0+IHtcbiAgICAgICAgaWYgKG0uaW5pdCkgbS5pbml0KHRoaXMpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHRoaXMuZm9ybWF0ID0gdGhpcy5vcHRpb25zLmludGVycG9sYXRpb24uZm9ybWF0O1xuICAgIGlmICghY2FsbGJhY2spIGNhbGxiYWNrID0gbm9vcDtcbiAgICBpZiAodGhpcy5vcHRpb25zLmZhbGxiYWNrTG5nICYmICF0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IgJiYgIXRoaXMub3B0aW9ucy5sbmcpIHtcbiAgICAgIGNvbnN0IGNvZGVzID0gdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZVV0aWxzLmdldEZhbGxiYWNrQ29kZXModGhpcy5vcHRpb25zLmZhbGxiYWNrTG5nKTtcbiAgICAgIGlmIChjb2Rlcy5sZW5ndGggPiAwICYmIGNvZGVzWzBdICE9PSAnZGV2JykgdGhpcy5vcHRpb25zLmxuZyA9IGNvZGVzWzBdO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuc2VydmljZXMubGFuZ3VhZ2VEZXRlY3RvciAmJiAhdGhpcy5vcHRpb25zLmxuZykge1xuICAgICAgdGhpcy5sb2dnZXIud2FybignaW5pdDogbm8gbGFuZ3VhZ2VEZXRlY3RvciBpcyB1c2VkIGFuZCBubyBsbmcgaXMgZGVmaW5lZCcpO1xuICAgIH1cbiAgICBjb25zdCBzdG9yZUFwaSA9IFsnZ2V0UmVzb3VyY2UnLCAnaGFzUmVzb3VyY2VCdW5kbGUnLCAnZ2V0UmVzb3VyY2VCdW5kbGUnLCAnZ2V0RGF0YUJ5TGFuZ3VhZ2UnXTtcbiAgICBzdG9yZUFwaS5mb3JFYWNoKGZjTmFtZSA9PiB7XG4gICAgICB0aGlzW2ZjTmFtZV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBfdGhpcy5zdG9yZVtmY05hbWVdKC4uLmFyZ3VtZW50cyk7XG4gICAgICB9O1xuICAgIH0pO1xuICAgIGNvbnN0IHN0b3JlQXBpQ2hhaW5lZCA9IFsnYWRkUmVzb3VyY2UnLCAnYWRkUmVzb3VyY2VzJywgJ2FkZFJlc291cmNlQnVuZGxlJywgJ3JlbW92ZVJlc291cmNlQnVuZGxlJ107XG4gICAgc3RvcmVBcGlDaGFpbmVkLmZvckVhY2goZmNOYW1lID0+IHtcbiAgICAgIHRoaXNbZmNOYW1lXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgX3RoaXMuc3RvcmVbZmNOYW1lXSguLi5hcmd1bWVudHMpO1xuICAgICAgICByZXR1cm4gX3RoaXM7XG4gICAgICB9O1xuICAgIH0pO1xuICAgIGNvbnN0IGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBjb25zdCBsb2FkID0gKCkgPT4ge1xuICAgICAgY29uc3QgZmluaXNoID0gKGVyciwgdCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5pc0luaXRpYWxpemVkICYmICF0aGlzLmluaXRpYWxpemVkU3RvcmVPbmNlKSB0aGlzLmxvZ2dlci53YXJuKCdpbml0OiBpMThuZXh0IGlzIGFscmVhZHkgaW5pdGlhbGl6ZWQuIFlvdSBzaG91bGQgY2FsbCBpbml0IGp1c3Qgb25jZSEnKTtcbiAgICAgICAgdGhpcy5pc0luaXRpYWxpemVkID0gdHJ1ZTtcbiAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuaXNDbG9uZSkgdGhpcy5sb2dnZXIubG9nKCdpbml0aWFsaXplZCcsIHRoaXMub3B0aW9ucyk7XG4gICAgICAgIHRoaXMuZW1pdCgnaW5pdGlhbGl6ZWQnLCB0aGlzLm9wdGlvbnMpO1xuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHQpO1xuICAgICAgICBjYWxsYmFjayhlcnIsIHQpO1xuICAgICAgfTtcbiAgICAgIGlmICh0aGlzLmxhbmd1YWdlcyAmJiB0aGlzLm9wdGlvbnMuY29tcGF0aWJpbGl0eUFQSSAhPT0gJ3YxJyAmJiAhdGhpcy5pc0luaXRpYWxpemVkKSByZXR1cm4gZmluaXNoKG51bGwsIHRoaXMudC5iaW5kKHRoaXMpKTtcbiAgICAgIHRoaXMuY2hhbmdlTGFuZ3VhZ2UodGhpcy5vcHRpb25zLmxuZywgZmluaXNoKTtcbiAgICB9O1xuICAgIGlmICh0aGlzLm9wdGlvbnMucmVzb3VyY2VzIHx8ICF0aGlzLm9wdGlvbnMuaW5pdEltbWVkaWF0ZSkge1xuICAgICAgbG9hZCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZXRUaW1lb3V0KGxvYWQsIDApO1xuICAgIH1cbiAgICByZXR1cm4gZGVmZXJyZWQ7XG4gIH1cbiAgbG9hZFJlc291cmNlcyhsYW5ndWFnZSkge1xuICAgIGxldCBjYWxsYmFjayA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDogbm9vcDtcbiAgICBsZXQgdXNlZENhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgY29uc3QgdXNlZExuZyA9IHR5cGVvZiBsYW5ndWFnZSA9PT0gJ3N0cmluZycgPyBsYW5ndWFnZSA6IHRoaXMubGFuZ3VhZ2U7XG4gICAgaWYgKHR5cGVvZiBsYW5ndWFnZSA9PT0gJ2Z1bmN0aW9uJykgdXNlZENhbGxiYWNrID0gbGFuZ3VhZ2U7XG4gICAgaWYgKCF0aGlzLm9wdGlvbnMucmVzb3VyY2VzIHx8IHRoaXMub3B0aW9ucy5wYXJ0aWFsQnVuZGxlZExhbmd1YWdlcykge1xuICAgICAgaWYgKHVzZWRMbmcgJiYgdXNlZExuZy50b0xvd2VyQ2FzZSgpID09PSAnY2ltb2RlJyAmJiAoIXRoaXMub3B0aW9ucy5wcmVsb2FkIHx8IHRoaXMub3B0aW9ucy5wcmVsb2FkLmxlbmd0aCA9PT0gMCkpIHJldHVybiB1c2VkQ2FsbGJhY2soKTtcbiAgICAgIGNvbnN0IHRvTG9hZCA9IFtdO1xuICAgICAgY29uc3QgYXBwZW5kID0gbG5nID0+IHtcbiAgICAgICAgaWYgKCFsbmcpIHJldHVybjtcbiAgICAgICAgaWYgKGxuZyA9PT0gJ2NpbW9kZScpIHJldHVybjtcbiAgICAgICAgY29uc3QgbG5ncyA9IHRoaXMuc2VydmljZXMubGFuZ3VhZ2VVdGlscy50b1Jlc29sdmVIaWVyYXJjaHkobG5nKTtcbiAgICAgICAgbG5ncy5mb3JFYWNoKGwgPT4ge1xuICAgICAgICAgIGlmIChsID09PSAnY2ltb2RlJykgcmV0dXJuO1xuICAgICAgICAgIGlmICh0b0xvYWQuaW5kZXhPZihsKSA8IDApIHRvTG9hZC5wdXNoKGwpO1xuICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgICBpZiAoIXVzZWRMbmcpIHtcbiAgICAgICAgY29uc3QgZmFsbGJhY2tzID0gdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZVV0aWxzLmdldEZhbGxiYWNrQ29kZXModGhpcy5vcHRpb25zLmZhbGxiYWNrTG5nKTtcbiAgICAgICAgZmFsbGJhY2tzLmZvckVhY2gobCA9PiBhcHBlbmQobCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXBwZW5kKHVzZWRMbmcpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5wcmVsb2FkKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5wcmVsb2FkLmZvckVhY2gobCA9PiBhcHBlbmQobCkpO1xuICAgICAgfVxuICAgICAgdGhpcy5zZXJ2aWNlcy5iYWNrZW5kQ29ubmVjdG9yLmxvYWQodG9Mb2FkLCB0aGlzLm9wdGlvbnMubnMsIGUgPT4ge1xuICAgICAgICBpZiAoIWUgJiYgIXRoaXMucmVzb2x2ZWRMYW5ndWFnZSAmJiB0aGlzLmxhbmd1YWdlKSB0aGlzLnNldFJlc29sdmVkTGFuZ3VhZ2UodGhpcy5sYW5ndWFnZSk7XG4gICAgICAgIHVzZWRDYWxsYmFjayhlKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB1c2VkQ2FsbGJhY2sobnVsbCk7XG4gICAgfVxuICB9XG4gIHJlbG9hZFJlc291cmNlcyhsbmdzLCBucywgY2FsbGJhY2spIHtcbiAgICBjb25zdCBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgaWYgKCFsbmdzKSBsbmdzID0gdGhpcy5sYW5ndWFnZXM7XG4gICAgaWYgKCFucykgbnMgPSB0aGlzLm9wdGlvbnMubnM7XG4gICAgaWYgKCFjYWxsYmFjaykgY2FsbGJhY2sgPSBub29wO1xuICAgIHRoaXMuc2VydmljZXMuYmFja2VuZENvbm5lY3Rvci5yZWxvYWQobG5ncywgbnMsIGVyciA9PiB7XG4gICAgICBkZWZlcnJlZC5yZXNvbHZlKCk7XG4gICAgICBjYWxsYmFjayhlcnIpO1xuICAgIH0pO1xuICAgIHJldHVybiBkZWZlcnJlZDtcbiAgfVxuICB1c2UobW9kdWxlKSB7XG4gICAgaWYgKCFtb2R1bGUpIHRocm93IG5ldyBFcnJvcignWW91IGFyZSBwYXNzaW5nIGFuIHVuZGVmaW5lZCBtb2R1bGUhIFBsZWFzZSBjaGVjayB0aGUgb2JqZWN0IHlvdSBhcmUgcGFzc2luZyB0byBpMThuZXh0LnVzZSgpJyk7XG4gICAgaWYgKCFtb2R1bGUudHlwZSkgdGhyb3cgbmV3IEVycm9yKCdZb3UgYXJlIHBhc3NpbmcgYSB3cm9uZyBtb2R1bGUhIFBsZWFzZSBjaGVjayB0aGUgb2JqZWN0IHlvdSBhcmUgcGFzc2luZyB0byBpMThuZXh0LnVzZSgpJyk7XG4gICAgaWYgKG1vZHVsZS50eXBlID09PSAnYmFja2VuZCcpIHtcbiAgICAgIHRoaXMubW9kdWxlcy5iYWNrZW5kID0gbW9kdWxlO1xuICAgIH1cbiAgICBpZiAobW9kdWxlLnR5cGUgPT09ICdsb2dnZXInIHx8IG1vZHVsZS5sb2cgJiYgbW9kdWxlLndhcm4gJiYgbW9kdWxlLmVycm9yKSB7XG4gICAgICB0aGlzLm1vZHVsZXMubG9nZ2VyID0gbW9kdWxlO1xuICAgIH1cbiAgICBpZiAobW9kdWxlLnR5cGUgPT09ICdsYW5ndWFnZURldGVjdG9yJykge1xuICAgICAgdGhpcy5tb2R1bGVzLmxhbmd1YWdlRGV0ZWN0b3IgPSBtb2R1bGU7XG4gICAgfVxuICAgIGlmIChtb2R1bGUudHlwZSA9PT0gJ2kxOG5Gb3JtYXQnKSB7XG4gICAgICB0aGlzLm1vZHVsZXMuaTE4bkZvcm1hdCA9IG1vZHVsZTtcbiAgICB9XG4gICAgaWYgKG1vZHVsZS50eXBlID09PSAncG9zdFByb2Nlc3NvcicpIHtcbiAgICAgIHBvc3RQcm9jZXNzb3IuYWRkUG9zdFByb2Nlc3Nvcihtb2R1bGUpO1xuICAgIH1cbiAgICBpZiAobW9kdWxlLnR5cGUgPT09ICdmb3JtYXR0ZXInKSB7XG4gICAgICB0aGlzLm1vZHVsZXMuZm9ybWF0dGVyID0gbW9kdWxlO1xuICAgIH1cbiAgICBpZiAobW9kdWxlLnR5cGUgPT09ICczcmRQYXJ0eScpIHtcbiAgICAgIHRoaXMubW9kdWxlcy5leHRlcm5hbC5wdXNoKG1vZHVsZSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIHNldFJlc29sdmVkTGFuZ3VhZ2UobCkge1xuICAgIGlmICghbCB8fCAhdGhpcy5sYW5ndWFnZXMpIHJldHVybjtcbiAgICBpZiAoWydjaW1vZGUnLCAnZGV2J10uaW5kZXhPZihsKSA+IC0xKSByZXR1cm47XG4gICAgZm9yIChsZXQgbGkgPSAwOyBsaSA8IHRoaXMubGFuZ3VhZ2VzLmxlbmd0aDsgbGkrKykge1xuICAgICAgY29uc3QgbG5nSW5MbmdzID0gdGhpcy5sYW5ndWFnZXNbbGldO1xuICAgICAgaWYgKFsnY2ltb2RlJywgJ2RldiddLmluZGV4T2YobG5nSW5MbmdzKSA+IC0xKSBjb250aW51ZTtcbiAgICAgIGlmICh0aGlzLnN0b3JlLmhhc0xhbmd1YWdlU29tZVRyYW5zbGF0aW9ucyhsbmdJbkxuZ3MpKSB7XG4gICAgICAgIHRoaXMucmVzb2x2ZWRMYW5ndWFnZSA9IGxuZ0luTG5ncztcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGNoYW5nZUxhbmd1YWdlKGxuZywgY2FsbGJhY2spIHtcbiAgICB2YXIgX3RoaXMyID0gdGhpcztcbiAgICB0aGlzLmlzTGFuZ3VhZ2VDaGFuZ2luZ1RvID0gbG5nO1xuICAgIGNvbnN0IGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICB0aGlzLmVtaXQoJ2xhbmd1YWdlQ2hhbmdpbmcnLCBsbmcpO1xuICAgIGNvbnN0IHNldExuZ1Byb3BzID0gbCA9PiB7XG4gICAgICB0aGlzLmxhbmd1YWdlID0gbDtcbiAgICAgIHRoaXMubGFuZ3VhZ2VzID0gdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZVV0aWxzLnRvUmVzb2x2ZUhpZXJhcmNoeShsKTtcbiAgICAgIHRoaXMucmVzb2x2ZWRMYW5ndWFnZSA9IHVuZGVmaW5lZDtcbiAgICAgIHRoaXMuc2V0UmVzb2x2ZWRMYW5ndWFnZShsKTtcbiAgICB9O1xuICAgIGNvbnN0IGRvbmUgPSAoZXJyLCBsKSA9PiB7XG4gICAgICBpZiAobCkge1xuICAgICAgICBzZXRMbmdQcm9wcyhsKTtcbiAgICAgICAgdGhpcy50cmFuc2xhdG9yLmNoYW5nZUxhbmd1YWdlKGwpO1xuICAgICAgICB0aGlzLmlzTGFuZ3VhZ2VDaGFuZ2luZ1RvID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLmVtaXQoJ2xhbmd1YWdlQ2hhbmdlZCcsIGwpO1xuICAgICAgICB0aGlzLmxvZ2dlci5sb2coJ2xhbmd1YWdlQ2hhbmdlZCcsIGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5pc0xhbmd1YWdlQ2hhbmdpbmdUbyA9IHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICAgIGRlZmVycmVkLnJlc29sdmUoZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gX3RoaXMyLnQoLi4uYXJndW1lbnRzKTtcbiAgICAgIH0pO1xuICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjayhlcnIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIF90aGlzMi50KC4uLmFyZ3VtZW50cyk7XG4gICAgICB9KTtcbiAgICB9O1xuICAgIGNvbnN0IHNldExuZyA9IGxuZ3MgPT4ge1xuICAgICAgaWYgKCFsbmcgJiYgIWxuZ3MgJiYgdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZURldGVjdG9yKSBsbmdzID0gW107XG4gICAgICBjb25zdCBsID0gdHlwZW9mIGxuZ3MgPT09ICdzdHJpbmcnID8gbG5ncyA6IHRoaXMuc2VydmljZXMubGFuZ3VhZ2VVdGlscy5nZXRCZXN0TWF0Y2hGcm9tQ29kZXMobG5ncyk7XG4gICAgICBpZiAobCkge1xuICAgICAgICBpZiAoIXRoaXMubGFuZ3VhZ2UpIHtcbiAgICAgICAgICBzZXRMbmdQcm9wcyhsKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMudHJhbnNsYXRvci5sYW5ndWFnZSkgdGhpcy50cmFuc2xhdG9yLmNoYW5nZUxhbmd1YWdlKGwpO1xuICAgICAgICBpZiAodGhpcy5zZXJ2aWNlcy5sYW5ndWFnZURldGVjdG9yICYmIHRoaXMuc2VydmljZXMubGFuZ3VhZ2VEZXRlY3Rvci5jYWNoZVVzZXJMYW5ndWFnZSkgdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZURldGVjdG9yLmNhY2hlVXNlckxhbmd1YWdlKGwpO1xuICAgICAgfVxuICAgICAgdGhpcy5sb2FkUmVzb3VyY2VzKGwsIGVyciA9PiB7XG4gICAgICAgIGRvbmUoZXJyLCBsKTtcbiAgICAgIH0pO1xuICAgIH07XG4gICAgaWYgKCFsbmcgJiYgdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZURldGVjdG9yICYmICF0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IuYXN5bmMpIHtcbiAgICAgIHNldExuZyh0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IuZGV0ZWN0KCkpO1xuICAgIH0gZWxzZSBpZiAoIWxuZyAmJiB0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IgJiYgdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZURldGVjdG9yLmFzeW5jKSB7XG4gICAgICBpZiAodGhpcy5zZXJ2aWNlcy5sYW5ndWFnZURldGVjdG9yLmRldGVjdC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZURldGVjdG9yLmRldGVjdCgpLnRoZW4oc2V0TG5nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuc2VydmljZXMubGFuZ3VhZ2VEZXRlY3Rvci5kZXRlY3Qoc2V0TG5nKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc2V0TG5nKGxuZyk7XG4gICAgfVxuICAgIHJldHVybiBkZWZlcnJlZDtcbiAgfVxuICBnZXRGaXhlZFQobG5nLCBucywga2V5UHJlZml4KSB7XG4gICAgdmFyIF90aGlzMyA9IHRoaXM7XG4gICAgY29uc3QgZml4ZWRUID0gZnVuY3Rpb24gKGtleSwgb3B0cykge1xuICAgICAgbGV0IG9wdGlvbnM7XG4gICAgICBpZiAodHlwZW9mIG9wdHMgIT09ICdvYmplY3QnKSB7XG4gICAgICAgIGZvciAodmFyIF9sZW4zID0gYXJndW1lbnRzLmxlbmd0aCwgcmVzdCA9IG5ldyBBcnJheShfbGVuMyA+IDIgPyBfbGVuMyAtIDIgOiAwKSwgX2tleTMgPSAyOyBfa2V5MyA8IF9sZW4zOyBfa2V5MysrKSB7XG4gICAgICAgICAgcmVzdFtfa2V5MyAtIDJdID0gYXJndW1lbnRzW19rZXkzXTtcbiAgICAgICAgfVxuICAgICAgICBvcHRpb25zID0gX3RoaXMzLm9wdGlvbnMub3ZlcmxvYWRUcmFuc2xhdGlvbk9wdGlvbkhhbmRsZXIoW2tleSwgb3B0c10uY29uY2F0KHJlc3QpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG9wdGlvbnMgPSB7XG4gICAgICAgICAgLi4ub3B0c1xuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgb3B0aW9ucy5sbmcgPSBvcHRpb25zLmxuZyB8fCBmaXhlZFQubG5nO1xuICAgICAgb3B0aW9ucy5sbmdzID0gb3B0aW9ucy5sbmdzIHx8IGZpeGVkVC5sbmdzO1xuICAgICAgb3B0aW9ucy5ucyA9IG9wdGlvbnMubnMgfHwgZml4ZWRULm5zO1xuICAgICAgb3B0aW9ucy5rZXlQcmVmaXggPSBvcHRpb25zLmtleVByZWZpeCB8fCBrZXlQcmVmaXggfHwgZml4ZWRULmtleVByZWZpeDtcbiAgICAgIGNvbnN0IGtleVNlcGFyYXRvciA9IF90aGlzMy5vcHRpb25zLmtleVNlcGFyYXRvciB8fCAnLic7XG4gICAgICBsZXQgcmVzdWx0S2V5O1xuICAgICAgaWYgKG9wdGlvbnMua2V5UHJlZml4ICYmIEFycmF5LmlzQXJyYXkoa2V5KSkge1xuICAgICAgICByZXN1bHRLZXkgPSBrZXkubWFwKGsgPT4gYCR7b3B0aW9ucy5rZXlQcmVmaXh9JHtrZXlTZXBhcmF0b3J9JHtrfWApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0S2V5ID0gb3B0aW9ucy5rZXlQcmVmaXggPyBgJHtvcHRpb25zLmtleVByZWZpeH0ke2tleVNlcGFyYXRvcn0ke2tleX1gIDoga2V5O1xuICAgICAgfVxuICAgICAgcmV0dXJuIF90aGlzMy50KHJlc3VsdEtleSwgb3B0aW9ucyk7XG4gICAgfTtcbiAgICBpZiAodHlwZW9mIGxuZyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGZpeGVkVC5sbmcgPSBsbmc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZpeGVkVC5sbmdzID0gbG5nO1xuICAgIH1cbiAgICBmaXhlZFQubnMgPSBucztcbiAgICBmaXhlZFQua2V5UHJlZml4ID0ga2V5UHJlZml4O1xuICAgIHJldHVybiBmaXhlZFQ7XG4gIH1cbiAgdCgpIHtcbiAgICByZXR1cm4gdGhpcy50cmFuc2xhdG9yICYmIHRoaXMudHJhbnNsYXRvci50cmFuc2xhdGUoLi4uYXJndW1lbnRzKTtcbiAgfVxuICBleGlzdHMoKSB7XG4gICAgcmV0dXJuIHRoaXMudHJhbnNsYXRvciAmJiB0aGlzLnRyYW5zbGF0b3IuZXhpc3RzKC4uLmFyZ3VtZW50cyk7XG4gIH1cbiAgc2V0RGVmYXVsdE5hbWVzcGFjZShucykge1xuICAgIHRoaXMub3B0aW9ucy5kZWZhdWx0TlMgPSBucztcbiAgfVxuICBoYXNMb2FkZWROYW1lc3BhY2UobnMpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge307XG4gICAgaWYgKCF0aGlzLmlzSW5pdGlhbGl6ZWQpIHtcbiAgICAgIHRoaXMubG9nZ2VyLndhcm4oJ2hhc0xvYWRlZE5hbWVzcGFjZTogaTE4bmV4dCB3YXMgbm90IGluaXRpYWxpemVkJywgdGhpcy5sYW5ndWFnZXMpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoIXRoaXMubGFuZ3VhZ2VzIHx8ICF0aGlzLmxhbmd1YWdlcy5sZW5ndGgpIHtcbiAgICAgIHRoaXMubG9nZ2VyLndhcm4oJ2hhc0xvYWRlZE5hbWVzcGFjZTogaTE4bi5sYW5ndWFnZXMgd2VyZSB1bmRlZmluZWQgb3IgZW1wdHknLCB0aGlzLmxhbmd1YWdlcyk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNvbnN0IGxuZyA9IG9wdGlvbnMubG5nIHx8IHRoaXMucmVzb2x2ZWRMYW5ndWFnZSB8fCB0aGlzLmxhbmd1YWdlc1swXTtcbiAgICBjb25zdCBmYWxsYmFja0xuZyA9IHRoaXMub3B0aW9ucyA/IHRoaXMub3B0aW9ucy5mYWxsYmFja0xuZyA6IGZhbHNlO1xuICAgIGNvbnN0IGxhc3RMbmcgPSB0aGlzLmxhbmd1YWdlc1t0aGlzLmxhbmd1YWdlcy5sZW5ndGggLSAxXTtcbiAgICBpZiAobG5nLnRvTG93ZXJDYXNlKCkgPT09ICdjaW1vZGUnKSByZXR1cm4gdHJ1ZTtcbiAgICBjb25zdCBsb2FkTm90UGVuZGluZyA9IChsLCBuKSA9PiB7XG4gICAgICBjb25zdCBsb2FkU3RhdGUgPSB0aGlzLnNlcnZpY2VzLmJhY2tlbmRDb25uZWN0b3Iuc3RhdGVbYCR7bH18JHtufWBdO1xuICAgICAgcmV0dXJuIGxvYWRTdGF0ZSA9PT0gLTEgfHwgbG9hZFN0YXRlID09PSAyO1xuICAgIH07XG4gICAgaWYgKG9wdGlvbnMucHJlY2hlY2spIHtcbiAgICAgIGNvbnN0IHByZVJlc3VsdCA9IG9wdGlvbnMucHJlY2hlY2sodGhpcywgbG9hZE5vdFBlbmRpbmcpO1xuICAgICAgaWYgKHByZVJlc3VsdCAhPT0gdW5kZWZpbmVkKSByZXR1cm4gcHJlUmVzdWx0O1xuICAgIH1cbiAgICBpZiAodGhpcy5oYXNSZXNvdXJjZUJ1bmRsZShsbmcsIG5zKSkgcmV0dXJuIHRydWU7XG4gICAgaWYgKCF0aGlzLnNlcnZpY2VzLmJhY2tlbmRDb25uZWN0b3IuYmFja2VuZCB8fCB0aGlzLm9wdGlvbnMucmVzb3VyY2VzICYmICF0aGlzLm9wdGlvbnMucGFydGlhbEJ1bmRsZWRMYW5ndWFnZXMpIHJldHVybiB0cnVlO1xuICAgIGlmIChsb2FkTm90UGVuZGluZyhsbmcsIG5zKSAmJiAoIWZhbGxiYWNrTG5nIHx8IGxvYWROb3RQZW5kaW5nKGxhc3RMbmcsIG5zKSkpIHJldHVybiB0cnVlO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBsb2FkTmFtZXNwYWNlcyhucywgY2FsbGJhY2spIHtcbiAgICBjb25zdCBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgaWYgKCF0aGlzLm9wdGlvbnMubnMpIHtcbiAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soKTtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBucyA9PT0gJ3N0cmluZycpIG5zID0gW25zXTtcbiAgICBucy5mb3JFYWNoKG4gPT4ge1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5ucy5pbmRleE9mKG4pIDwgMCkgdGhpcy5vcHRpb25zLm5zLnB1c2gobik7XG4gICAgfSk7XG4gICAgdGhpcy5sb2FkUmVzb3VyY2VzKGVyciA9PiB7XG4gICAgICBkZWZlcnJlZC5yZXNvbHZlKCk7XG4gICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKGVycik7XG4gICAgfSk7XG4gICAgcmV0dXJuIGRlZmVycmVkO1xuICB9XG4gIGxvYWRMYW5ndWFnZXMobG5ncywgY2FsbGJhY2spIHtcbiAgICBjb25zdCBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgaWYgKHR5cGVvZiBsbmdzID09PSAnc3RyaW5nJykgbG5ncyA9IFtsbmdzXTtcbiAgICBjb25zdCBwcmVsb2FkZWQgPSB0aGlzLm9wdGlvbnMucHJlbG9hZCB8fCBbXTtcbiAgICBjb25zdCBuZXdMbmdzID0gbG5ncy5maWx0ZXIobG5nID0+IHByZWxvYWRlZC5pbmRleE9mKGxuZykgPCAwKTtcbiAgICBpZiAoIW5ld0xuZ3MubGVuZ3RoKSB7XG4gICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKCk7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuICAgIHRoaXMub3B0aW9ucy5wcmVsb2FkID0gcHJlbG9hZGVkLmNvbmNhdChuZXdMbmdzKTtcbiAgICB0aGlzLmxvYWRSZXNvdXJjZXMoZXJyID0+IHtcbiAgICAgIGRlZmVycmVkLnJlc29sdmUoKTtcbiAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soZXJyKTtcbiAgICB9KTtcbiAgICByZXR1cm4gZGVmZXJyZWQ7XG4gIH1cbiAgZGlyKGxuZykge1xuICAgIGlmICghbG5nKSBsbmcgPSB0aGlzLnJlc29sdmVkTGFuZ3VhZ2UgfHwgKHRoaXMubGFuZ3VhZ2VzICYmIHRoaXMubGFuZ3VhZ2VzLmxlbmd0aCA+IDAgPyB0aGlzLmxhbmd1YWdlc1swXSA6IHRoaXMubGFuZ3VhZ2UpO1xuICAgIGlmICghbG5nKSByZXR1cm4gJ3J0bCc7XG4gICAgY29uc3QgcnRsTG5ncyA9IFsnYXInLCAnc2h1JywgJ3NxcicsICdzc2gnLCAneGFhJywgJ3loZCcsICd5dWQnLCAnYWFvJywgJ2FiaCcsICdhYnYnLCAnYWNtJywgJ2FjcScsICdhY3cnLCAnYWN4JywgJ2FjeScsICdhZGYnLCAnYWRzJywgJ2FlYicsICdhZWMnLCAnYWZiJywgJ2FqcCcsICdhcGMnLCAnYXBkJywgJ2FyYicsICdhcnEnLCAnYXJzJywgJ2FyeScsICdhcnonLCAnYXV6JywgJ2F2bCcsICdheWgnLCAnYXlsJywgJ2F5bicsICdheXAnLCAnYmJ6JywgJ3BnYScsICdoZScsICdpdycsICdwcycsICdwYnQnLCAncGJ1JywgJ3BzdCcsICdwcnAnLCAncHJkJywgJ3VnJywgJ3VyJywgJ3lkZCcsICd5ZHMnLCAneWloJywgJ2ppJywgJ3lpJywgJ2hibycsICdtZW4nLCAneG1uJywgJ2ZhJywgJ2pwcicsICdwZW8nLCAncGVzJywgJ3BycycsICdkdicsICdzYW0nLCAnY2tiJ107XG4gICAgY29uc3QgbGFuZ3VhZ2VVdGlscyA9IHRoaXMuc2VydmljZXMgJiYgdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZVV0aWxzIHx8IG5ldyBMYW5ndWFnZVV0aWwoZ2V0KCkpO1xuICAgIHJldHVybiBydGxMbmdzLmluZGV4T2YobGFuZ3VhZ2VVdGlscy5nZXRMYW5ndWFnZVBhcnRGcm9tQ29kZShsbmcpKSA+IC0xIHx8IGxuZy50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJy1hcmFiJykgPiAxID8gJ3J0bCcgOiAnbHRyJztcbiAgfVxuICBzdGF0aWMgY3JlYXRlSW5zdGFuY2UoKSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IHt9O1xuICAgIGxldCBjYWxsYmFjayA9IGFyZ3VtZW50cy5sZW5ndGggPiAxID8gYXJndW1lbnRzWzFdIDogdW5kZWZpbmVkO1xuICAgIHJldHVybiBuZXcgSTE4bihvcHRpb25zLCBjYWxsYmFjayk7XG4gIH1cbiAgY2xvbmVJbnN0YW5jZSgpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDoge307XG4gICAgbGV0IGNhbGxiYWNrID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiBub29wO1xuICAgIGNvbnN0IGZvcmtSZXNvdXJjZVN0b3JlID0gb3B0aW9ucy5mb3JrUmVzb3VyY2VTdG9yZTtcbiAgICBpZiAoZm9ya1Jlc291cmNlU3RvcmUpIGRlbGV0ZSBvcHRpb25zLmZvcmtSZXNvdXJjZVN0b3JlO1xuICAgIGNvbnN0IG1lcmdlZE9wdGlvbnMgPSB7XG4gICAgICAuLi50aGlzLm9wdGlvbnMsXG4gICAgICAuLi5vcHRpb25zLFxuICAgICAgLi4ue1xuICAgICAgICBpc0Nsb25lOiB0cnVlXG4gICAgICB9XG4gICAgfTtcbiAgICBjb25zdCBjbG9uZSA9IG5ldyBJMThuKG1lcmdlZE9wdGlvbnMpO1xuICAgIGlmIChvcHRpb25zLmRlYnVnICE9PSB1bmRlZmluZWQgfHwgb3B0aW9ucy5wcmVmaXggIT09IHVuZGVmaW5lZCkge1xuICAgICAgY2xvbmUubG9nZ2VyID0gY2xvbmUubG9nZ2VyLmNsb25lKG9wdGlvbnMpO1xuICAgIH1cbiAgICBjb25zdCBtZW1iZXJzVG9Db3B5ID0gWydzdG9yZScsICdzZXJ2aWNlcycsICdsYW5ndWFnZSddO1xuICAgIG1lbWJlcnNUb0NvcHkuZm9yRWFjaChtID0+IHtcbiAgICAgIGNsb25lW21dID0gdGhpc1ttXTtcbiAgICB9KTtcbiAgICBjbG9uZS5zZXJ2aWNlcyA9IHtcbiAgICAgIC4uLnRoaXMuc2VydmljZXNcbiAgICB9O1xuICAgIGNsb25lLnNlcnZpY2VzLnV0aWxzID0ge1xuICAgICAgaGFzTG9hZGVkTmFtZXNwYWNlOiBjbG9uZS5oYXNMb2FkZWROYW1lc3BhY2UuYmluZChjbG9uZSlcbiAgICB9O1xuICAgIGlmIChmb3JrUmVzb3VyY2VTdG9yZSkge1xuICAgICAgY2xvbmUuc3RvcmUgPSBuZXcgUmVzb3VyY2VTdG9yZSh0aGlzLnN0b3JlLmRhdGEsIG1lcmdlZE9wdGlvbnMpO1xuICAgICAgY2xvbmUuc2VydmljZXMucmVzb3VyY2VTdG9yZSA9IGNsb25lLnN0b3JlO1xuICAgIH1cbiAgICBjbG9uZS50cmFuc2xhdG9yID0gbmV3IFRyYW5zbGF0b3IoY2xvbmUuc2VydmljZXMsIG1lcmdlZE9wdGlvbnMpO1xuICAgIGNsb25lLnRyYW5zbGF0b3Iub24oJyonLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgIGZvciAodmFyIF9sZW40ID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IG5ldyBBcnJheShfbGVuNCA+IDEgPyBfbGVuNCAtIDEgOiAwKSwgX2tleTQgPSAxOyBfa2V5NCA8IF9sZW40OyBfa2V5NCsrKSB7XG4gICAgICAgIGFyZ3NbX2tleTQgLSAxXSA9IGFyZ3VtZW50c1tfa2V5NF07XG4gICAgICB9XG4gICAgICBjbG9uZS5lbWl0KGV2ZW50LCAuLi5hcmdzKTtcbiAgICB9KTtcbiAgICBjbG9uZS5pbml0KG1lcmdlZE9wdGlvbnMsIGNhbGxiYWNrKTtcbiAgICBjbG9uZS50cmFuc2xhdG9yLm9wdGlvbnMgPSBtZXJnZWRPcHRpb25zO1xuICAgIGNsb25lLnRyYW5zbGF0b3IuYmFja2VuZENvbm5lY3Rvci5zZXJ2aWNlcy51dGlscyA9IHtcbiAgICAgIGhhc0xvYWRlZE5hbWVzcGFjZTogY2xvbmUuaGFzTG9hZGVkTmFtZXNwYWNlLmJpbmQoY2xvbmUpXG4gICAgfTtcbiAgICByZXR1cm4gY2xvbmU7XG4gIH1cbiAgdG9KU09OKCkge1xuICAgIHJldHVybiB7XG4gICAgICBvcHRpb25zOiB0aGlzLm9wdGlvbnMsXG4gICAgICBzdG9yZTogdGhpcy5zdG9yZSxcbiAgICAgIGxhbmd1YWdlOiB0aGlzLmxhbmd1YWdlLFxuICAgICAgbGFuZ3VhZ2VzOiB0aGlzLmxhbmd1YWdlcyxcbiAgICAgIHJlc29sdmVkTGFuZ3VhZ2U6IHRoaXMucmVzb2x2ZWRMYW5ndWFnZVxuICAgIH07XG4gIH1cbn1cbmNvbnN0IGluc3RhbmNlID0gSTE4bi5jcmVhdGVJbnN0YW5jZSgpO1xuaW5zdGFuY2UuY3JlYXRlSW5zdGFuY2UgPSBJMThuLmNyZWF0ZUluc3RhbmNlO1xuXG5jb25zdCBjcmVhdGVJbnN0YW5jZSA9IGluc3RhbmNlLmNyZWF0ZUluc3RhbmNlO1xuY29uc3QgZGlyID0gaW5zdGFuY2UuZGlyO1xuY29uc3QgaW5pdCA9IGluc3RhbmNlLmluaXQ7XG5jb25zdCBsb2FkUmVzb3VyY2VzID0gaW5zdGFuY2UubG9hZFJlc291cmNlcztcbmNvbnN0IHJlbG9hZFJlc291cmNlcyA9IGluc3RhbmNlLnJlbG9hZFJlc291cmNlcztcbmNvbnN0IHVzZSA9IGluc3RhbmNlLnVzZTtcbmNvbnN0IGNoYW5nZUxhbmd1YWdlID0gaW5zdGFuY2UuY2hhbmdlTGFuZ3VhZ2U7XG5jb25zdCBnZXRGaXhlZFQgPSBpbnN0YW5jZS5nZXRGaXhlZFQ7XG5jb25zdCB0ID0gaW5zdGFuY2UudDtcbmNvbnN0IGV4aXN0cyA9IGluc3RhbmNlLmV4aXN0cztcbmNvbnN0IHNldERlZmF1bHROYW1lc3BhY2UgPSBpbnN0YW5jZS5zZXREZWZhdWx0TmFtZXNwYWNlO1xuY29uc3QgaGFzTG9hZGVkTmFtZXNwYWNlID0gaW5zdGFuY2UuaGFzTG9hZGVkTmFtZXNwYWNlO1xuY29uc3QgbG9hZE5hbWVzcGFjZXMgPSBpbnN0YW5jZS5sb2FkTmFtZXNwYWNlcztcbmNvbnN0IGxvYWRMYW5ndWFnZXMgPSBpbnN0YW5jZS5sb2FkTGFuZ3VhZ2VzO1xuXG5leHBvcnQgeyBjaGFuZ2VMYW5ndWFnZSwgY3JlYXRlSW5zdGFuY2UsIGluc3RhbmNlIGFzIGRlZmF1bHQsIGRpciwgZXhpc3RzLCBnZXRGaXhlZFQsIGhhc0xvYWRlZE5hbWVzcGFjZSwgaW5pdCwgbG9hZExhbmd1YWdlcywgbG9hZE5hbWVzcGFjZXMsIGxvYWRSZXNvdXJjZXMsIHJlbG9hZFJlc291cmNlcywgc2V0RGVmYXVsdE5hbWVzcGFjZSwgdCwgdXNlIH07XG4iLCAiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3Rvcikge1xuICBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7XG4gIH1cbn0iLCAiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gX3R5cGVvZihvKSB7XG4gIFwiQGJhYmVsL2hlbHBlcnMgLSB0eXBlb2ZcIjtcblxuICByZXR1cm4gX3R5cGVvZiA9IFwiZnVuY3Rpb25cIiA9PSB0eXBlb2YgU3ltYm9sICYmIFwic3ltYm9sXCIgPT0gdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA/IGZ1bmN0aW9uIChvKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBvO1xuICB9IDogZnVuY3Rpb24gKG8pIHtcbiAgICByZXR1cm4gbyAmJiBcImZ1bmN0aW9uXCIgPT0gdHlwZW9mIFN5bWJvbCAmJiBvLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgJiYgbyAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2YgbztcbiAgfSwgX3R5cGVvZihvKTtcbn0iLCAiaW1wb3J0IF90eXBlb2YgZnJvbSBcIi4vdHlwZW9mLmpzXCI7XG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBfdG9QcmltaXRpdmUoaW5wdXQsIGhpbnQpIHtcbiAgaWYgKF90eXBlb2YoaW5wdXQpICE9PSBcIm9iamVjdFwiIHx8IGlucHV0ID09PSBudWxsKSByZXR1cm4gaW5wdXQ7XG4gIHZhciBwcmltID0gaW5wdXRbU3ltYm9sLnRvUHJpbWl0aXZlXTtcbiAgaWYgKHByaW0gIT09IHVuZGVmaW5lZCkge1xuICAgIHZhciByZXMgPSBwcmltLmNhbGwoaW5wdXQsIGhpbnQgfHwgXCJkZWZhdWx0XCIpO1xuICAgIGlmIChfdHlwZW9mKHJlcykgIT09IFwib2JqZWN0XCIpIHJldHVybiByZXM7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkBAdG9QcmltaXRpdmUgbXVzdCByZXR1cm4gYSBwcmltaXRpdmUgdmFsdWUuXCIpO1xuICB9XG4gIHJldHVybiAoaGludCA9PT0gXCJzdHJpbmdcIiA/IFN0cmluZyA6IE51bWJlcikoaW5wdXQpO1xufSIsICJpbXBvcnQgX3R5cGVvZiBmcm9tIFwiLi90eXBlb2YuanNcIjtcbmltcG9ydCB0b1ByaW1pdGl2ZSBmcm9tIFwiLi90b1ByaW1pdGl2ZS5qc1wiO1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gX3RvUHJvcGVydHlLZXkoYXJnKSB7XG4gIHZhciBrZXkgPSB0b1ByaW1pdGl2ZShhcmcsIFwic3RyaW5nXCIpO1xuICByZXR1cm4gX3R5cGVvZihrZXkpID09PSBcInN5bWJvbFwiID8ga2V5IDogU3RyaW5nKGtleSk7XG59IiwgImltcG9ydCB0b1Byb3BlcnR5S2V5IGZyb20gXCIuL3RvUHJvcGVydHlLZXkuanNcIjtcbmZ1bmN0aW9uIF9kZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07XG4gICAgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlO1xuICAgIGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTtcbiAgICBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIHRvUHJvcGVydHlLZXkoZGVzY3JpcHRvci5rZXkpLCBkZXNjcmlwdG9yKTtcbiAgfVxufVxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gX2NyZWF0ZUNsYXNzKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykge1xuICBpZiAocHJvdG9Qcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTtcbiAgaWYgKHN0YXRpY1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQ29uc3RydWN0b3IsIFwicHJvdG90eXBlXCIsIHtcbiAgICB3cml0YWJsZTogZmFsc2VcbiAgfSk7XG4gIHJldHVybiBDb25zdHJ1Y3Rvcjtcbn0iLCAiaW1wb3J0IF9jbGFzc0NhbGxDaGVjayBmcm9tICdAYmFiZWwvcnVudGltZS9oZWxwZXJzL2VzbS9jbGFzc0NhbGxDaGVjayc7XG5pbXBvcnQgX2NyZWF0ZUNsYXNzIGZyb20gJ0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvZXNtL2NyZWF0ZUNsYXNzJztcblxudmFyIGFyciA9IFtdO1xudmFyIGVhY2ggPSBhcnIuZm9yRWFjaDtcbnZhciBzbGljZSA9IGFyci5zbGljZTtcbmZ1bmN0aW9uIGRlZmF1bHRzKG9iaikge1xuICBlYWNoLmNhbGwoc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLCBmdW5jdGlvbiAoc291cmNlKSB7XG4gICAgaWYgKHNvdXJjZSkge1xuICAgICAgZm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpIHtcbiAgICAgICAgaWYgKG9ialtwcm9wXSA9PT0gdW5kZWZpbmVkKSBvYmpbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG4gICAgICB9XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG9iajtcbn1cblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnRyb2wtcmVnZXhcbnZhciBmaWVsZENvbnRlbnRSZWdFeHAgPSAvXltcXHUwMDA5XFx1MDAyMC1cXHUwMDdlXFx1MDA4MC1cXHUwMGZmXSskLztcbnZhciBzZXJpYWxpemVDb29raWUgPSBmdW5jdGlvbiBzZXJpYWxpemVDb29raWUobmFtZSwgdmFsLCBvcHRpb25zKSB7XG4gIHZhciBvcHQgPSBvcHRpb25zIHx8IHt9O1xuICBvcHQucGF0aCA9IG9wdC5wYXRoIHx8ICcvJztcbiAgdmFyIHZhbHVlID0gZW5jb2RlVVJJQ29tcG9uZW50KHZhbCk7XG4gIHZhciBzdHIgPSBcIlwiLmNvbmNhdChuYW1lLCBcIj1cIikuY29uY2F0KHZhbHVlKTtcbiAgaWYgKG9wdC5tYXhBZ2UgPiAwKSB7XG4gICAgdmFyIG1heEFnZSA9IG9wdC5tYXhBZ2UgLSAwO1xuICAgIGlmIChOdW1iZXIuaXNOYU4obWF4QWdlKSkgdGhyb3cgbmV3IEVycm9yKCdtYXhBZ2Ugc2hvdWxkIGJlIGEgTnVtYmVyJyk7XG4gICAgc3RyICs9IFwiOyBNYXgtQWdlPVwiLmNvbmNhdChNYXRoLmZsb29yKG1heEFnZSkpO1xuICB9XG4gIGlmIChvcHQuZG9tYWluKSB7XG4gICAgaWYgKCFmaWVsZENvbnRlbnRSZWdFeHAudGVzdChvcHQuZG9tYWluKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignb3B0aW9uIGRvbWFpbiBpcyBpbnZhbGlkJyk7XG4gICAgfVxuICAgIHN0ciArPSBcIjsgRG9tYWluPVwiLmNvbmNhdChvcHQuZG9tYWluKTtcbiAgfVxuICBpZiAob3B0LnBhdGgpIHtcbiAgICBpZiAoIWZpZWxkQ29udGVudFJlZ0V4cC50ZXN0KG9wdC5wYXRoKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignb3B0aW9uIHBhdGggaXMgaW52YWxpZCcpO1xuICAgIH1cbiAgICBzdHIgKz0gXCI7IFBhdGg9XCIuY29uY2F0KG9wdC5wYXRoKTtcbiAgfVxuICBpZiAob3B0LmV4cGlyZXMpIHtcbiAgICBpZiAodHlwZW9mIG9wdC5leHBpcmVzLnRvVVRDU3RyaW5nICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdvcHRpb24gZXhwaXJlcyBpcyBpbnZhbGlkJyk7XG4gICAgfVxuICAgIHN0ciArPSBcIjsgRXhwaXJlcz1cIi5jb25jYXQob3B0LmV4cGlyZXMudG9VVENTdHJpbmcoKSk7XG4gIH1cbiAgaWYgKG9wdC5odHRwT25seSkgc3RyICs9ICc7IEh0dHBPbmx5JztcbiAgaWYgKG9wdC5zZWN1cmUpIHN0ciArPSAnOyBTZWN1cmUnO1xuICBpZiAob3B0LnNhbWVTaXRlKSB7XG4gICAgdmFyIHNhbWVTaXRlID0gdHlwZW9mIG9wdC5zYW1lU2l0ZSA9PT0gJ3N0cmluZycgPyBvcHQuc2FtZVNpdGUudG9Mb3dlckNhc2UoKSA6IG9wdC5zYW1lU2l0ZTtcbiAgICBzd2l0Y2ggKHNhbWVTaXRlKSB7XG4gICAgICBjYXNlIHRydWU6XG4gICAgICAgIHN0ciArPSAnOyBTYW1lU2l0ZT1TdHJpY3QnO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2xheCc6XG4gICAgICAgIHN0ciArPSAnOyBTYW1lU2l0ZT1MYXgnO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3N0cmljdCc6XG4gICAgICAgIHN0ciArPSAnOyBTYW1lU2l0ZT1TdHJpY3QnO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ25vbmUnOlxuICAgICAgICBzdHIgKz0gJzsgU2FtZVNpdGU9Tm9uZSc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignb3B0aW9uIHNhbWVTaXRlIGlzIGludmFsaWQnKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG52YXIgY29va2llID0ge1xuICBjcmVhdGU6IGZ1bmN0aW9uIGNyZWF0ZShuYW1lLCB2YWx1ZSwgbWludXRlcywgZG9tYWluKSB7XG4gICAgdmFyIGNvb2tpZU9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gNCAmJiBhcmd1bWVudHNbNF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1s0XSA6IHtcbiAgICAgIHBhdGg6ICcvJyxcbiAgICAgIHNhbWVTaXRlOiAnc3RyaWN0J1xuICAgIH07XG4gICAgaWYgKG1pbnV0ZXMpIHtcbiAgICAgIGNvb2tpZU9wdGlvbnMuZXhwaXJlcyA9IG5ldyBEYXRlKCk7XG4gICAgICBjb29raWVPcHRpb25zLmV4cGlyZXMuc2V0VGltZShjb29raWVPcHRpb25zLmV4cGlyZXMuZ2V0VGltZSgpICsgbWludXRlcyAqIDYwICogMTAwMCk7XG4gICAgfVxuICAgIGlmIChkb21haW4pIGNvb2tpZU9wdGlvbnMuZG9tYWluID0gZG9tYWluO1xuICAgIGRvY3VtZW50LmNvb2tpZSA9IHNlcmlhbGl6ZUNvb2tpZShuYW1lLCBlbmNvZGVVUklDb21wb25lbnQodmFsdWUpLCBjb29raWVPcHRpb25zKTtcbiAgfSxcbiAgcmVhZDogZnVuY3Rpb24gcmVhZChuYW1lKSB7XG4gICAgdmFyIG5hbWVFUSA9IFwiXCIuY29uY2F0KG5hbWUsIFwiPVwiKTtcbiAgICB2YXIgY2EgPSBkb2N1bWVudC5jb29raWUuc3BsaXQoJzsnKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgYyA9IGNhW2ldO1xuICAgICAgd2hpbGUgKGMuY2hhckF0KDApID09PSAnICcpIHtcbiAgICAgICAgYyA9IGMuc3Vic3RyaW5nKDEsIGMubGVuZ3RoKTtcbiAgICAgIH1cbiAgICAgIGlmIChjLmluZGV4T2YobmFtZUVRKSA9PT0gMCkgcmV0dXJuIGMuc3Vic3RyaW5nKG5hbWVFUS5sZW5ndGgsIGMubGVuZ3RoKTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH0sXG4gIHJlbW92ZTogZnVuY3Rpb24gcmVtb3ZlKG5hbWUpIHtcbiAgICB0aGlzLmNyZWF0ZShuYW1lLCAnJywgLTEpO1xuICB9XG59O1xudmFyIGNvb2tpZSQxID0ge1xuICBuYW1lOiAnY29va2llJyxcbiAgbG9va3VwOiBmdW5jdGlvbiBsb29rdXAob3B0aW9ucykge1xuICAgIHZhciBmb3VuZDtcbiAgICBpZiAob3B0aW9ucy5sb29rdXBDb29raWUgJiYgdHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgdmFyIGMgPSBjb29raWUucmVhZChvcHRpb25zLmxvb2t1cENvb2tpZSk7XG4gICAgICBpZiAoYykgZm91bmQgPSBjO1xuICAgIH1cbiAgICByZXR1cm4gZm91bmQ7XG4gIH0sXG4gIGNhY2hlVXNlckxhbmd1YWdlOiBmdW5jdGlvbiBjYWNoZVVzZXJMYW5ndWFnZShsbmcsIG9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucy5sb29rdXBDb29raWUgJiYgdHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgY29va2llLmNyZWF0ZShvcHRpb25zLmxvb2t1cENvb2tpZSwgbG5nLCBvcHRpb25zLmNvb2tpZU1pbnV0ZXMsIG9wdGlvbnMuY29va2llRG9tYWluLCBvcHRpb25zLmNvb2tpZU9wdGlvbnMpO1xuICAgIH1cbiAgfVxufTtcblxudmFyIHF1ZXJ5c3RyaW5nID0ge1xuICBuYW1lOiAncXVlcnlzdHJpbmcnLFxuICBsb29rdXA6IGZ1bmN0aW9uIGxvb2t1cChvcHRpb25zKSB7XG4gICAgdmFyIGZvdW5kO1xuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgdmFyIHNlYXJjaCA9IHdpbmRvdy5sb2NhdGlvbi5zZWFyY2g7XG4gICAgICBpZiAoIXdpbmRvdy5sb2NhdGlvbi5zZWFyY2ggJiYgd2luZG93LmxvY2F0aW9uLmhhc2ggJiYgd2luZG93LmxvY2F0aW9uLmhhc2guaW5kZXhPZignPycpID4gLTEpIHtcbiAgICAgICAgc2VhcmNoID0gd2luZG93LmxvY2F0aW9uLmhhc2guc3Vic3RyaW5nKHdpbmRvdy5sb2NhdGlvbi5oYXNoLmluZGV4T2YoJz8nKSk7XG4gICAgICB9XG4gICAgICB2YXIgcXVlcnkgPSBzZWFyY2guc3Vic3RyaW5nKDEpO1xuICAgICAgdmFyIHBhcmFtcyA9IHF1ZXJ5LnNwbGl0KCcmJyk7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhcmFtcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgcG9zID0gcGFyYW1zW2ldLmluZGV4T2YoJz0nKTtcbiAgICAgICAgaWYgKHBvcyA+IDApIHtcbiAgICAgICAgICB2YXIga2V5ID0gcGFyYW1zW2ldLnN1YnN0cmluZygwLCBwb3MpO1xuICAgICAgICAgIGlmIChrZXkgPT09IG9wdGlvbnMubG9va3VwUXVlcnlzdHJpbmcpIHtcbiAgICAgICAgICAgIGZvdW5kID0gcGFyYW1zW2ldLnN1YnN0cmluZyhwb3MgKyAxKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZvdW5kO1xuICB9XG59O1xuXG52YXIgaGFzTG9jYWxTdG9yYWdlU3VwcG9ydCA9IG51bGw7XG52YXIgbG9jYWxTdG9yYWdlQXZhaWxhYmxlID0gZnVuY3Rpb24gbG9jYWxTdG9yYWdlQXZhaWxhYmxlKCkge1xuICBpZiAoaGFzTG9jYWxTdG9yYWdlU3VwcG9ydCAhPT0gbnVsbCkgcmV0dXJuIGhhc0xvY2FsU3RvcmFnZVN1cHBvcnQ7XG4gIHRyeSB7XG4gICAgaGFzTG9jYWxTdG9yYWdlU3VwcG9ydCA9IHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LmxvY2FsU3RvcmFnZSAhPT0gbnVsbDtcbiAgICB2YXIgdGVzdEtleSA9ICdpMThuZXh0LnRyYW5zbGF0ZS5ib28nO1xuICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbSh0ZXN0S2V5LCAnZm9vJyk7XG4gICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKHRlc3RLZXkpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgaGFzTG9jYWxTdG9yYWdlU3VwcG9ydCA9IGZhbHNlO1xuICB9XG4gIHJldHVybiBoYXNMb2NhbFN0b3JhZ2VTdXBwb3J0O1xufTtcbnZhciBsb2NhbFN0b3JhZ2UgPSB7XG4gIG5hbWU6ICdsb2NhbFN0b3JhZ2UnLFxuICBsb29rdXA6IGZ1bmN0aW9uIGxvb2t1cChvcHRpb25zKSB7XG4gICAgdmFyIGZvdW5kO1xuICAgIGlmIChvcHRpb25zLmxvb2t1cExvY2FsU3RvcmFnZSAmJiBsb2NhbFN0b3JhZ2VBdmFpbGFibGUoKSkge1xuICAgICAgdmFyIGxuZyA9IHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShvcHRpb25zLmxvb2t1cExvY2FsU3RvcmFnZSk7XG4gICAgICBpZiAobG5nKSBmb3VuZCA9IGxuZztcbiAgICB9XG4gICAgcmV0dXJuIGZvdW5kO1xuICB9LFxuICBjYWNoZVVzZXJMYW5ndWFnZTogZnVuY3Rpb24gY2FjaGVVc2VyTGFuZ3VhZ2UobG5nLCBvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMubG9va3VwTG9jYWxTdG9yYWdlICYmIGxvY2FsU3RvcmFnZUF2YWlsYWJsZSgpKSB7XG4gICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0ob3B0aW9ucy5sb29rdXBMb2NhbFN0b3JhZ2UsIGxuZyk7XG4gICAgfVxuICB9XG59O1xuXG52YXIgaGFzU2Vzc2lvblN0b3JhZ2VTdXBwb3J0ID0gbnVsbDtcbnZhciBzZXNzaW9uU3RvcmFnZUF2YWlsYWJsZSA9IGZ1bmN0aW9uIHNlc3Npb25TdG9yYWdlQXZhaWxhYmxlKCkge1xuICBpZiAoaGFzU2Vzc2lvblN0b3JhZ2VTdXBwb3J0ICE9PSBudWxsKSByZXR1cm4gaGFzU2Vzc2lvblN0b3JhZ2VTdXBwb3J0O1xuICB0cnkge1xuICAgIGhhc1Nlc3Npb25TdG9yYWdlU3VwcG9ydCA9IHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LnNlc3Npb25TdG9yYWdlICE9PSBudWxsO1xuICAgIHZhciB0ZXN0S2V5ID0gJ2kxOG5leHQudHJhbnNsYXRlLmJvbyc7XG4gICAgd2luZG93LnNlc3Npb25TdG9yYWdlLnNldEl0ZW0odGVzdEtleSwgJ2ZvbycpO1xuICAgIHdpbmRvdy5zZXNzaW9uU3RvcmFnZS5yZW1vdmVJdGVtKHRlc3RLZXkpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgaGFzU2Vzc2lvblN0b3JhZ2VTdXBwb3J0ID0gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIGhhc1Nlc3Npb25TdG9yYWdlU3VwcG9ydDtcbn07XG52YXIgc2Vzc2lvblN0b3JhZ2UgPSB7XG4gIG5hbWU6ICdzZXNzaW9uU3RvcmFnZScsXG4gIGxvb2t1cDogZnVuY3Rpb24gbG9va3VwKG9wdGlvbnMpIHtcbiAgICB2YXIgZm91bmQ7XG4gICAgaWYgKG9wdGlvbnMubG9va3VwU2Vzc2lvblN0b3JhZ2UgJiYgc2Vzc2lvblN0b3JhZ2VBdmFpbGFibGUoKSkge1xuICAgICAgdmFyIGxuZyA9IHdpbmRvdy5zZXNzaW9uU3RvcmFnZS5nZXRJdGVtKG9wdGlvbnMubG9va3VwU2Vzc2lvblN0b3JhZ2UpO1xuICAgICAgaWYgKGxuZykgZm91bmQgPSBsbmc7XG4gICAgfVxuICAgIHJldHVybiBmb3VuZDtcbiAgfSxcbiAgY2FjaGVVc2VyTGFuZ3VhZ2U6IGZ1bmN0aW9uIGNhY2hlVXNlckxhbmd1YWdlKGxuZywgb3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zLmxvb2t1cFNlc3Npb25TdG9yYWdlICYmIHNlc3Npb25TdG9yYWdlQXZhaWxhYmxlKCkpIHtcbiAgICAgIHdpbmRvdy5zZXNzaW9uU3RvcmFnZS5zZXRJdGVtKG9wdGlvbnMubG9va3VwU2Vzc2lvblN0b3JhZ2UsIGxuZyk7XG4gICAgfVxuICB9XG59O1xuXG52YXIgbmF2aWdhdG9yJDEgPSB7XG4gIG5hbWU6ICduYXZpZ2F0b3InLFxuICBsb29rdXA6IGZ1bmN0aW9uIGxvb2t1cChvcHRpb25zKSB7XG4gICAgdmFyIGZvdW5kID0gW107XG4gICAgaWYgKHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBpZiAobmF2aWdhdG9yLmxhbmd1YWdlcykge1xuICAgICAgICAvLyBjaHJvbWUgb25seTsgbm90IGFuIGFycmF5LCBzbyBjYW4ndCB1c2UgLnB1c2guYXBwbHkgaW5zdGVhZCBvZiBpdGVyYXRpbmdcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuYXZpZ2F0b3IubGFuZ3VhZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgZm91bmQucHVzaChuYXZpZ2F0b3IubGFuZ3VhZ2VzW2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKG5hdmlnYXRvci51c2VyTGFuZ3VhZ2UpIHtcbiAgICAgICAgZm91bmQucHVzaChuYXZpZ2F0b3IudXNlckxhbmd1YWdlKTtcbiAgICAgIH1cbiAgICAgIGlmIChuYXZpZ2F0b3IubGFuZ3VhZ2UpIHtcbiAgICAgICAgZm91bmQucHVzaChuYXZpZ2F0b3IubGFuZ3VhZ2UpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZm91bmQubGVuZ3RoID4gMCA/IGZvdW5kIDogdW5kZWZpbmVkO1xuICB9XG59O1xuXG52YXIgaHRtbFRhZyA9IHtcbiAgbmFtZTogJ2h0bWxUYWcnLFxuICBsb29rdXA6IGZ1bmN0aW9uIGxvb2t1cChvcHRpb25zKSB7XG4gICAgdmFyIGZvdW5kO1xuICAgIHZhciBodG1sVGFnID0gb3B0aW9ucy5odG1sVGFnIHx8ICh0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnID8gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IDogbnVsbCk7XG4gICAgaWYgKGh0bWxUYWcgJiYgdHlwZW9mIGh0bWxUYWcuZ2V0QXR0cmlidXRlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBmb3VuZCA9IGh0bWxUYWcuZ2V0QXR0cmlidXRlKCdsYW5nJyk7XG4gICAgfVxuICAgIHJldHVybiBmb3VuZDtcbiAgfVxufTtcblxudmFyIHBhdGggPSB7XG4gIG5hbWU6ICdwYXRoJyxcbiAgbG9va3VwOiBmdW5jdGlvbiBsb29rdXAob3B0aW9ucykge1xuICAgIHZhciBmb3VuZDtcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHZhciBsYW5ndWFnZSA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5tYXRjaCgvXFwvKFthLXpBLVotXSopL2cpO1xuICAgICAgaWYgKGxhbmd1YWdlIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmxvb2t1cEZyb21QYXRoSW5kZXggPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBsYW5ndWFnZVtvcHRpb25zLmxvb2t1cEZyb21QYXRoSW5kZXhdICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICB9XG4gICAgICAgICAgZm91bmQgPSBsYW5ndWFnZVtvcHRpb25zLmxvb2t1cEZyb21QYXRoSW5kZXhdLnJlcGxhY2UoJy8nLCAnJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZm91bmQgPSBsYW5ndWFnZVswXS5yZXBsYWNlKCcvJywgJycpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmb3VuZDtcbiAgfVxufTtcblxudmFyIHN1YmRvbWFpbiA9IHtcbiAgbmFtZTogJ3N1YmRvbWFpbicsXG4gIGxvb2t1cDogZnVuY3Rpb24gbG9va3VwKG9wdGlvbnMpIHtcbiAgICAvLyBJZiBnaXZlbiBnZXQgdGhlIHN1YmRvbWFpbiBpbmRleCBlbHNlIDFcbiAgICB2YXIgbG9va3VwRnJvbVN1YmRvbWFpbkluZGV4ID0gdHlwZW9mIG9wdGlvbnMubG9va3VwRnJvbVN1YmRvbWFpbkluZGV4ID09PSAnbnVtYmVyJyA/IG9wdGlvbnMubG9va3VwRnJvbVN1YmRvbWFpbkluZGV4ICsgMSA6IDE7XG4gICAgLy8gZ2V0IGFsbCBtYXRjaGVzIGlmIHdpbmRvdy5sb2NhdGlvbi4gaXMgZXhpc3RpbmdcbiAgICAvLyBmaXJzdCBpdGVtIG9mIG1hdGNoIGlzIHRoZSBtYXRjaCBpdHNlbGYgYW5kIHRoZSBzZWNvbmQgaXMgdGhlIGZpcnN0IGdyb3VwIG1hY2h0IHdoaWNoIHNvdWxkIGJlIHRoZSBmaXJzdCBzdWJkb21haW4gbWF0Y2hcbiAgICAvLyBpcyB0aGUgaG9zdG5hbWUgbm8gcHVibGljIGRvbWFpbiBnZXQgdGhlIG9yIG9wdGlvbiBvZiBsb2NhbGhvc3RcbiAgICB2YXIgbGFuZ3VhZ2UgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cubG9jYXRpb24gJiYgd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lICYmIHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZS5tYXRjaCgvXihcXHd7Miw1fSlcXC4oKFthLXowLTktXXsxLDYzfVxcLlthLXpdezIsNn0pfGxvY2FsaG9zdCkvaSk7XG5cbiAgICAvLyBpZiB0aGVyZSBpcyBubyBtYXRjaCAobnVsbCkgcmV0dXJuIHVuZGVmaW5lZFxuICAgIGlmICghbGFuZ3VhZ2UpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgLy8gcmV0dXJuIHRoZSBnaXZlbiBncm91cCBtYXRjaFxuICAgIHJldHVybiBsYW5ndWFnZVtsb29rdXBGcm9tU3ViZG9tYWluSW5kZXhdO1xuICB9XG59O1xuXG5mdW5jdGlvbiBnZXREZWZhdWx0cygpIHtcbiAgcmV0dXJuIHtcbiAgICBvcmRlcjogWydxdWVyeXN0cmluZycsICdjb29raWUnLCAnbG9jYWxTdG9yYWdlJywgJ3Nlc3Npb25TdG9yYWdlJywgJ25hdmlnYXRvcicsICdodG1sVGFnJ10sXG4gICAgbG9va3VwUXVlcnlzdHJpbmc6ICdsbmcnLFxuICAgIGxvb2t1cENvb2tpZTogJ2kxOG5leHQnLFxuICAgIGxvb2t1cExvY2FsU3RvcmFnZTogJ2kxOG5leHRMbmcnLFxuICAgIGxvb2t1cFNlc3Npb25TdG9yYWdlOiAnaTE4bmV4dExuZycsXG4gICAgLy8gY2FjaGUgdXNlciBsYW5ndWFnZVxuICAgIGNhY2hlczogWydsb2NhbFN0b3JhZ2UnXSxcbiAgICBleGNsdWRlQ2FjaGVGb3I6IFsnY2ltb2RlJ10sXG4gICAgLy8gY29va2llTWludXRlczogMTAsXG4gICAgLy8gY29va2llRG9tYWluOiAnbXlEb21haW4nXG5cbiAgICBjb252ZXJ0RGV0ZWN0ZWRMYW5ndWFnZTogZnVuY3Rpb24gY29udmVydERldGVjdGVkTGFuZ3VhZ2UobCkge1xuICAgICAgcmV0dXJuIGw7XG4gICAgfVxuICB9O1xufVxudmFyIEJyb3dzZXIgPSAvKiNfX1BVUkVfXyovZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBCcm93c2VyKHNlcnZpY2VzKSB7XG4gICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IHt9O1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBCcm93c2VyKTtcbiAgICB0aGlzLnR5cGUgPSAnbGFuZ3VhZ2VEZXRlY3Rvcic7XG4gICAgdGhpcy5kZXRlY3RvcnMgPSB7fTtcbiAgICB0aGlzLmluaXQoc2VydmljZXMsIG9wdGlvbnMpO1xuICB9XG4gIF9jcmVhdGVDbGFzcyhCcm93c2VyLCBbe1xuICAgIGtleTogXCJpbml0XCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGluaXQoc2VydmljZXMpIHtcbiAgICAgIHZhciBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB7fTtcbiAgICAgIHZhciBpMThuT3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzJdIDoge307XG4gICAgICB0aGlzLnNlcnZpY2VzID0gc2VydmljZXMgfHwge1xuICAgICAgICBsYW5ndWFnZVV0aWxzOiB7fVxuICAgICAgfTsgLy8gdGhpcyB3YXkgdGhlIGxhbmd1YWdlIGRldGVjdG9yIGNhbiBiZSB1c2VkIHdpdGhvdXQgaTE4bmV4dFxuICAgICAgdGhpcy5vcHRpb25zID0gZGVmYXVsdHMob3B0aW9ucywgdGhpcy5vcHRpb25zIHx8IHt9LCBnZXREZWZhdWx0cygpKTtcbiAgICAgIGlmICh0eXBlb2YgdGhpcy5vcHRpb25zLmNvbnZlcnREZXRlY3RlZExhbmd1YWdlID09PSAnc3RyaW5nJyAmJiB0aGlzLm9wdGlvbnMuY29udmVydERldGVjdGVkTGFuZ3VhZ2UuaW5kZXhPZignMTU4OTcnKSA+IC0xKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5jb252ZXJ0RGV0ZWN0ZWRMYW5ndWFnZSA9IGZ1bmN0aW9uIChsKSB7XG4gICAgICAgICAgcmV0dXJuIGwucmVwbGFjZSgnLScsICdfJyk7XG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIC8vIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmxvb2t1cEZyb21VcmxJbmRleCkgdGhpcy5vcHRpb25zLmxvb2t1cEZyb21QYXRoSW5kZXggPSB0aGlzLm9wdGlvbnMubG9va3VwRnJvbVVybEluZGV4O1xuICAgICAgdGhpcy5pMThuT3B0aW9ucyA9IGkxOG5PcHRpb25zO1xuICAgICAgdGhpcy5hZGREZXRlY3Rvcihjb29raWUkMSk7XG4gICAgICB0aGlzLmFkZERldGVjdG9yKHF1ZXJ5c3RyaW5nKTtcbiAgICAgIHRoaXMuYWRkRGV0ZWN0b3IobG9jYWxTdG9yYWdlKTtcbiAgICAgIHRoaXMuYWRkRGV0ZWN0b3Ioc2Vzc2lvblN0b3JhZ2UpO1xuICAgICAgdGhpcy5hZGREZXRlY3RvcihuYXZpZ2F0b3IkMSk7XG4gICAgICB0aGlzLmFkZERldGVjdG9yKGh0bWxUYWcpO1xuICAgICAgdGhpcy5hZGREZXRlY3RvcihwYXRoKTtcbiAgICAgIHRoaXMuYWRkRGV0ZWN0b3Ioc3ViZG9tYWluKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiYWRkRGV0ZWN0b3JcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gYWRkRGV0ZWN0b3IoZGV0ZWN0b3IpIHtcbiAgICAgIHRoaXMuZGV0ZWN0b3JzW2RldGVjdG9yLm5hbWVdID0gZGV0ZWN0b3I7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImRldGVjdFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBkZXRlY3QoZGV0ZWN0aW9uT3JkZXIpIHtcbiAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICBpZiAoIWRldGVjdGlvbk9yZGVyKSBkZXRlY3Rpb25PcmRlciA9IHRoaXMub3B0aW9ucy5vcmRlcjtcbiAgICAgIHZhciBkZXRlY3RlZCA9IFtdO1xuICAgICAgZGV0ZWN0aW9uT3JkZXIuZm9yRWFjaChmdW5jdGlvbiAoZGV0ZWN0b3JOYW1lKSB7XG4gICAgICAgIGlmIChfdGhpcy5kZXRlY3RvcnNbZGV0ZWN0b3JOYW1lXSkge1xuICAgICAgICAgIHZhciBsb29rdXAgPSBfdGhpcy5kZXRlY3RvcnNbZGV0ZWN0b3JOYW1lXS5sb29rdXAoX3RoaXMub3B0aW9ucyk7XG4gICAgICAgICAgaWYgKGxvb2t1cCAmJiB0eXBlb2YgbG9va3VwID09PSAnc3RyaW5nJykgbG9va3VwID0gW2xvb2t1cF07XG4gICAgICAgICAgaWYgKGxvb2t1cCkgZGV0ZWN0ZWQgPSBkZXRlY3RlZC5jb25jYXQobG9va3VwKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBkZXRlY3RlZCA9IGRldGVjdGVkLm1hcChmdW5jdGlvbiAoZCkge1xuICAgICAgICByZXR1cm4gX3RoaXMub3B0aW9ucy5jb252ZXJ0RGV0ZWN0ZWRMYW5ndWFnZShkKTtcbiAgICAgIH0pO1xuICAgICAgaWYgKHRoaXMuc2VydmljZXMubGFuZ3VhZ2VVdGlscy5nZXRCZXN0TWF0Y2hGcm9tQ29kZXMpIHJldHVybiBkZXRlY3RlZDsgLy8gbmV3IGkxOG5leHQgdjE5LjUuMFxuICAgICAgcmV0dXJuIGRldGVjdGVkLmxlbmd0aCA+IDAgPyBkZXRlY3RlZFswXSA6IG51bGw7IC8vIGEgbGl0dGxlIGJhY2t3YXJkIGNvbXBhdGliaWxpdHlcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiY2FjaGVVc2VyTGFuZ3VhZ2VcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gY2FjaGVVc2VyTGFuZ3VhZ2UobG5nLCBjYWNoZXMpIHtcbiAgICAgIHZhciBfdGhpczIgPSB0aGlzO1xuICAgICAgaWYgKCFjYWNoZXMpIGNhY2hlcyA9IHRoaXMub3B0aW9ucy5jYWNoZXM7XG4gICAgICBpZiAoIWNhY2hlcykgcmV0dXJuO1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5leGNsdWRlQ2FjaGVGb3IgJiYgdGhpcy5vcHRpb25zLmV4Y2x1ZGVDYWNoZUZvci5pbmRleE9mKGxuZykgPiAtMSkgcmV0dXJuO1xuICAgICAgY2FjaGVzLmZvckVhY2goZnVuY3Rpb24gKGNhY2hlTmFtZSkge1xuICAgICAgICBpZiAoX3RoaXMyLmRldGVjdG9yc1tjYWNoZU5hbWVdKSBfdGhpczIuZGV0ZWN0b3JzW2NhY2hlTmFtZV0uY2FjaGVVc2VyTGFuZ3VhZ2UobG5nLCBfdGhpczIub3B0aW9ucyk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1dKTtcbiAgcmV0dXJuIEJyb3dzZXI7XG59KCk7XG5Ccm93c2VyLnR5cGUgPSAnbGFuZ3VhZ2VEZXRlY3Rvcic7XG5cbmV4cG9ydCB7IEJyb3dzZXIgYXMgZGVmYXVsdCB9O1xuIiwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCwgIntcbiAgICBcIkNvb2tpZXMgUmVxdWlyZWRcIjogXCJHYWxsZXRhcyByZXF1ZXJpZGFzXCIsXG4gICAgXCJUaGVyZSB3YXMgYW4gZXJyb3IgbGF1bmNoaW5nIHRoZSBMVEkgdG9vbC4gUGxlYXNlIHJlbG9hZCBhbmQgdHJ5IGFnYWluLlwiOiBcIkh1Ym8gdW4gZXJyb3IgYWwgaW5pY2lhciBsYSBoZXJyYW1pZW50YSBMVEkuIFZ1ZWx2YSBhIGNhcmdhciB5IHZ1ZWx2YSBhIGludGVudGFybG8uXCIsXG4gICAgXCJQbGVhc2UgY2xpY2sgdGhlIGJ1dHRvbiBiZWxvdyB0byByZWxvYWQgaW4gYSBuZXcgd2luZG93LlwiOiBcIkhhZ2EgY2xpYyBlbiBlbCBib3RcdTAwRjNuIGRlIGFiYWpvIHBhcmEgcmVjYXJnYXIgZW4gdW5hIG51ZXZhIHZlbnRhbmEuXCIsXG4gICAgXCJPcGVuIGluIGEgbmV3IHdpbmRvd1wiOiBcIkFicmlyIGVuIHVuYSBudWV2YSB2ZW50YW5hXCIsXG4gICAgXCJJZiB5b3UgaGF2ZSB1c2VkIHRoaXMgYXBwbGljYXRpb24gYmVmb3JlLCB5b3VyIGJyb3dzZXIgbWF5IGFsbG93IHlvdSB0byA8YSBpZD0ncmVxdWVzdF9zdG9yYWdlX2FjY2Vzc19saW5rJyBocmVmPScjJz5lbmFibGUgY29va2llczwvYT4gYW5kIHByZXZlbnQgdGhpcyBtZXNzYWdlIGluIHRoZSBmdXR1cmUuXCI6IFwiU2kgaGEgdXRpbGl6YWRvIGVzdGEgYXBsaWNhY2lcdTAwRjNuIGFudGVyaW9ybWVudGUsIHN1IG5hdmVnYWRvciBwdWVkZSBwZXJtaXRpcmxlIDxhIGlkPSdyZXF1ZXN0X3N0b3JhZ2VfYWNjZXNzX2xpbmsnIGhyZWY9JyMnPmhhYmlsaXRhciBjb29raWVzPC9hPiB5IGV2aXRhciBlc3RlIG1lbnNhamUgZW4gZWwgZnV0dXJvLlwiLFxuICAgIFwiVGhlIGJyb3dzZXIgcHJldmVudGVkIGFjY2Vzcy4gIFRyeSBsYXVuY2hpbmcgaW4gYSBuZXcgd2luZG93IGZpcnN0IGFuZCB0aGVuIGNsaWNraW5nIHRoaXMgb3B0aW9uIGFnYWluIG5leHQgdGltZS4gSWYgdGhhdCBkb2Vzbid0IHdvcmsgY2hlY2sgeW91ciBwcml2YWN5IHNldHRpbmdzLiBTb21lIGJyb3dzZXJzIHdpbGwgcHJldmVudCBhbGwgdGhpcmQgcGFydHkgY29va2llcy5cIjogXCJFbCBuYXZlZ2Fkb3IgaW1waWRpXHUwMEYzIGVsIGFjY2Vzby4gSW50ZW50ZSBpbmljaWFyIHByaW1lcm8gZW4gdW5hIG51ZXZhIHZlbnRhbmEgeSBsdWVnbyB2dWVsdmEgYSBoYWNlciBjbGljIGVuIGVzdGEgb3BjaVx1MDBGM24gbGEgcHJcdTAwRjN4aW1hIHZlei4gU2kgZXNvIG5vIGZ1bmNpb25hLCB2ZXJpZmlxdWUgc3UgY29uZmlndXJhY2lcdTAwRjNuIGRlIHByaXZhY2lkYWQuIEFsZ3Vub3MgbmF2ZWdhZG9yZXMgZXZpdGFyXHUwMEUxbiB0b2RhcyBsYXMgY29va2llcyBkZSB0ZXJjZXJvcy5cIixcbiAgICBcIldlIHVzZSBjb29raWVzIGZvciBsb2dpbiBhbmQgc2VjdXJpdHkuXCI6IFwiVXNhbW9zIGNvb2tpZXMgcGFyYSBpbmljaW8gZGUgc2VzaVx1MDBGM24geSBzZWd1cmlkYWQuXCIsXG4gICAgXCJMZWFybiBtb3JlIGluIG91ciA8YSBocmVmPSd7e3VybH19JyB0YXJnZXQ9J19ibGFuayc+cHJpdmFjeSBwb2xpY3k8L2E+LlwiOiBcIk9idFx1MDBFOW4gbVx1MDBFMXMgaW5mb3JtYWNpXHUwMEYzbiBlbiBudWVzdHJhIDxhIGhyZWY9J3t7dXJsfX0nIHRhcmdldD0nX2JsYW5rJz5wb2xcdTAwRUR0aWNhIGRlIHByaXZhY2lkYWQ8L2E+LlwiLFxuICAgIFwiUGxlYXNlIGNoZWNrIHlvdXIgYnJvd3NlciBzZXR0aW5ncyBhbmQgZW5hYmxlIGNvb2tpZXMuXCI6IFwiVmVyaWZpcXVlIGxhIGNvbmZpZ3VyYWNpXHUwMEYzbiBkZSBzdSBuYXZlZ2Fkb3IgeSBoYWJpbGl0ZSBsYXMgY29va2llcy5cIlxufVxuIiwgIntcbiAgICBcIkNvb2tpZXMgUmVxdWlyZWRcIjogXCJDb29raWVzIG5cdTAwRTljZXNzYWlyZXNcIixcbiAgICBcIlRoZXJlIHdhcyBhbiBlcnJvciBsYXVuY2hpbmcgdGhlIExUSSB0b29sLiBQbGVhc2UgcmVsb2FkIGFuZCB0cnkgYWdhaW4uXCI6IFwiVW5lIGVycmV1ciBzJ2VzdCBwcm9kdWl0ZSBsb3JzIGR1IGxhbmNlbWVudCBkZSBsJ291dGlsIExUSS4gVmV1aWxsZXogcmVjaGFyZ2VyIGV0IHJcdTAwRTllc3NheWVyLlwiLFxuICAgIFwiUGxlYXNlIGNsaWNrIHRoZSBidXR0b24gYmVsb3cgdG8gcmVsb2FkIGluIGEgbmV3IHdpbmRvdy5cIjogXCJWZXVpbGxleiBjbGlxdWVyIHN1ciBsZSBib3V0b24gY2ktZGVzc291cyBwb3VyIHJlY2hhcmdlciBkYW5zIHVuZSBub3V2ZWxsZSBmZW5cdTAwRUF0cmUuXCIsXG4gICAgXCJPcGVuIGluIGEgbmV3IHdpbmRvd1wiOiBcIk91dnJpciBkYW5zIHVuZSBub3V2ZWxsZSBmZW5cdTAwRUF0cmVcIixcbiAgICBcIklmIHlvdSBoYXZlIHVzZWQgdGhpcyBhcHBsaWNhdGlvbiBiZWZvcmUsIHlvdXIgYnJvd3NlciBtYXkgYWxsb3cgeW91IHRvIDxhIGlkPSdyZXF1ZXN0X3N0b3JhZ2VfYWNjZXNzX2xpbmsnIGhyZWY9JyMnPmVuYWJsZSBjb29raWVzPC9hPiBhbmQgcHJldmVudCB0aGlzIG1lc3NhZ2UgaW4gdGhlIGZ1dHVyZS5cIjogXCJTaSB2b3VzIGF2ZXogZFx1MDBFOWpcdTAwRTAgdXRpbGlzXHUwMEU5IGNldHRlIGFwcGxpY2F0aW9uLCB2b3RyZSBuYXZpZ2F0ZXVyIHBldXQgdm91cyBwZXJtZXR0cmUgZCc8YSBpZD0ncmVxdWVzdF9zdG9yYWdlX2FjY2Vzc19saW5rJyBocmVmPScjJz5hY3RpdmVyIGxlcyBjb29raWVzPC9hPiBldCBlbXBcdTAwRUFjaGVyIGNlIG1lc3NhZ2UgXHUwMEUwIGwnYXZlbmlyLlwiLFxuICAgIFwiVGhlIGJyb3dzZXIgcHJldmVudGVkIGFjY2Vzcy4gIFRyeSBsYXVuY2hpbmcgaW4gYSBuZXcgd2luZG93IGZpcnN0IGFuZCB0aGVuIGNsaWNraW5nIHRoaXMgb3B0aW9uIGFnYWluIG5leHQgdGltZS4gSWYgdGhhdCBkb2Vzbid0IHdvcmsgY2hlY2sgeW91ciBwcml2YWN5IHNldHRpbmdzLiBTb21lIGJyb3dzZXJzIHdpbGwgcHJldmVudCBhbGwgdGhpcmQgcGFydHkgY29va2llcy5cIjogXCJMZSBuYXZpZ2F0ZXVyIGEgZW1wXHUwMEVBY2hcdTAwRTkgbCdhY2NcdTAwRThzLiBFc3NheWV6IGQnYWJvcmQgZGUgbGFuY2VyIGRhbnMgdW5lIG5vdXZlbGxlIGZlblx1MDBFQXRyZSwgcHVpcyBjbGlxdWV6IFx1MDBFMCBub3V2ZWF1IHN1ciBjZXR0ZSBvcHRpb24gbGEgcHJvY2hhaW5lIGZvaXMuIFNpIGNlbGEgbmUgZm9uY3Rpb25uZSBwYXMsIHZcdTAwRTlyaWZpZXogdm9zIHBhcmFtXHUwMEU4dHJlcyBkZSBjb25maWRlbnRpYWxpdFx1MDBFOS4gQ2VydGFpbnMgbmF2aWdhdGV1cnMgZW1wXHUwMEVBY2hlcm9udCB0b3VzIGxlcyBjb29raWVzIHRpZXJzLlwiLFxuICAgIFwiV2UgdXNlIGNvb2tpZXMgZm9yIGxvZ2luIGFuZCBzZWN1cml0eS5cIjogXCJOb3VzIHV0aWxpc29ucyBkZXMgY29va2llcyBwb3VyIGxhIGNvbm5leGlvbiBldCBsYSBzXHUwMEU5Y3VyaXRcdTAwRTkuXCIsXG4gICAgXCJMZWFybiBtb3JlIGluIG91ciA8YSBocmVmPSd7e3VybH19JyB0YXJnZXQ9J19ibGFuayc+cHJpdmFjeSBwb2xpY3k8L2E+LlwiOiBcIkVuIHNhdm9pciBwbHVzIGRhbnMgbm90cmUgPGEgaHJlZj0ne3t1cmx9fScgdGFyZ2V0PSdfYmxhbmsnPnBvbGl0aXF1ZSBkZSBjb25maWRlbnRpYWxpdFx1MDBFOTwvYT4uXCIsXG4gICAgXCJQbGVhc2UgY2hlY2sgeW91ciBicm93c2VyIHNldHRpbmdzIGFuZCBlbmFibGUgY29va2llcy5cIjogXCJWZXVpbGxleiB2XHUwMEU5cmlmaWVyIGxlcyBwYXJhbVx1MDBFOHRyZXMgZGUgdm90cmUgbmF2aWdhdGV1ciBldCBhY3RpdmVyIGxlcyBjb29raWVzLlwiXG59XG4iLCBudWxsLCAiaW1wb3J0IHsgaW5pdE9JRENMYXVuY2ggfSBmcm9tICdAYXRvbWljam9sdC9sdGktY2xpZW50JztcbmltcG9ydCB0eXBlIHsgSW5pdFNldHRpbmdzIH0gZnJvbSAnQGF0b21pY2pvbHQvbHRpLWNsaWVudC90eXBlcyc7XG5cbmNvbnN0IGluaXRTZXR0aW5nczogSW5pdFNldHRpbmdzID0gd2luZG93LklOSVRfU0VUVElOR1M7XG5pbml0T0lE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QyxNQUFNLE1BQU0sT0FBTyxNQUFNLE1BQU0sTUFBTSxNQUFNLElBQUk7QUFBQSxJQUN0RCxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUM7QUFBQSxJQUNaLElBQUk7QUFBQSxFQUNOLEdBQUc7QUFBQSxJQUNELE1BQU0sQ0FBQyxJQUFJO0FBQUEsSUFDWCxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUc7QUFBQSxJQUN4QixJQUFJO0FBQUEsRUFDTixHQUFHO0FBQUEsSUFDRCxNQUFNLENBQUMsTUFBTSxJQUFJO0FBQUEsSUFDakIsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDO0FBQUEsSUFDWixJQUFJO0FBQUEsRUFDTixHQUFHO0FBQUEsSUFDRCxNQUFNLENBQUMsT0FBTyxJQUFJO0FBQUEsSUFDbEIsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDO0FBQUEsSUFDWixJQUFJO0FBQUEsRUFDTixHQUFHO0FBQUEsSUFDRCxNQUFNLENBQUMsSUFBSTtBQUFBLElBQ1gsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7QUFBQSxJQUNmLElBQUk7QUFBQSxFQUNOLEdBQUc7QUFBQSxJQUNELE1BQU0sQ0FBQyxJQUFJO0FBQUEsSUFDWCxJQUFJLENBQUMsR0FBRyxDQUFDO0FBQUEsSUFDVCxJQUFJO0FBQUEsRUFDTixHQUFHO0FBQUEsSUFDRCxNQUFNLENBQUMsSUFBSTtBQUFBLElBQ1gsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsRUFBRTtBQUFBLElBQ25CLElBQUk7QUFBQSxFQUNOLEdBQUc7QUFBQSxJQUNELE1BQU0sQ0FBQyxJQUFJO0FBQUEsSUFDWCxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsRUFBRTtBQUFBLElBQ2hCLElBQUk7QUFBQSxFQUNOLEdBQUc7QUFBQSxJQUNELE1BQU0sQ0FBQyxJQUFJO0FBQUEsSUFDWCxJQUFJLENBQUMsR0FBRyxDQUFDO0FBQUEsSUFDVCxJQUFJO0FBQUEsRUFDTixHQUFHO0FBQUEsSUFDRCxNQUFNLENBQUMsSUFBSTtBQUFBLElBQ1gsSUFBSSxDQUFDLEdBQUcsQ0FBQztBQUFBLElBQ1QsSUFBSTtBQUFBLEVBQ04sR0FBRztBQUFBLElBQ0QsTUFBTSxDQUFDLElBQUk7QUFBQSxJQUNYLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO0FBQUEsSUFDZixJQUFJO0FBQUEsRUFDTixHQUFHO0FBQUEsSUFDRCxNQUFNLENBQUMsSUFBSTtBQUFBLElBQ1gsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFO0FBQUEsSUFDYixJQUFJO0FBQUEsRUFDTixHQUFHO0FBQUEsSUFDRCxNQUFNLENBQUMsSUFBSTtBQUFBLElBQ1gsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDO0FBQUEsSUFDWixJQUFJO0FBQUEsRUFDTixHQUFHO0FBQUEsSUFDRCxNQUFNLENBQUMsSUFBSTtBQUFBLElBQ1gsSUFBSSxDQUFDLEdBQUcsQ0FBQztBQUFBLElBQ1QsSUFBSTtBQUFBLEVBQ04sR0FBRztBQUFBLElBQ0QsTUFBTSxDQUFDLEtBQUs7QUFBQSxJQUNaLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUFBLElBQ1osSUFBSTtBQUFBLEVBQ04sR0FBRztBQUFBLElBQ0QsTUFBTSxDQUFDLElBQUk7QUFBQSxJQUNYLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxFQUFFO0FBQUEsSUFDakIsSUFBSTtBQUFBLEVBQ04sR0FBRztBQUFBLElBQ0QsTUFBTSxDQUFDLElBQUk7QUFBQSxJQUNYLElBQUksQ0FBQyxHQUFHLENBQUM7QUFBQSxJQUNULElBQUk7QUFBQSxFQUNOLEdBQUc7QUFBQSxJQUNELE1BQU0sQ0FBQyxJQUFJO0FBQUEsSUFDWCxJQUFJLENBQUMsR0FBRyxHQUFHLEVBQUU7QUFBQSxJQUNiLElBQUk7QUFBQSxFQUNOLEdBQUc7QUFBQSxJQUNELE1BQU0sQ0FBQyxJQUFJO0FBQUEsSUFDWCxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztBQUFBLElBQ2YsSUFBSTtBQUFBLEVBQ04sR0FBRztBQUFBLElBQ0QsTUFBTSxDQUFDLE1BQU0sSUFBSTtB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QUMvQixVQUFJLG9CQUFtQixHQUFJO0FBR3pCLFlBQUk7QUFDRixjQUFJLFlBQVksTUFBTSxTQUFTLGlCQUFnQjtBQUMvQyxjQUFJLENBQUMsV0FBVztBQUNkLHVDQUEyQjs7aUJBRXZCLEdBQUc7QUFDVCxrQkFBUSxJQUFJLENBQUM7OztBQUdqQiwwQkFBb0IsVUFBVSxFQUFFLDBCQUEwQixlQUFlLE9BQU8seUJBQXlCLE1BQUssQ0FBRTtXQUMzRztBQUNMLHNCQUFnQixRQUFROztFQUU1Qjs7O0FDM0NBO0FBQUEsSUFDSSxvQkFBb0I7QUFBQSxJQUNwQiwyRUFBMkU7QUFBQSxJQUMzRSw0REFBNEQ7QUFBQSxJQUM1RCx3QkFBd0I7QUFBQSxJQUN4QixtTEFBbUw7QUFBQSxJQUNuTCwyTkFBMk47QUFBQSxJQUMzTiwwQ0FBMEM7QUFBQSxJQUMxQywyRUFBMkU7QUFBQSxJQUMzRSwwREFBMEQ7QUFBQSxFQUM5RDs7O0FDVkE7QUFBQSxJQUNJLG9CQUFvQjtBQUFBLElBQ3BCLDJFQUEyRTtBQUFBLElBQzNFLDREQUE0RDtBQUFBLElBQzVELHdCQUF3QjtBQUFBLElBQ3hCLG1MQUFtTDtBQUFBLElBQ25MLDJOQUEyTjtBQUFBLElBQzNOLDBDQUEwQztBQUFBLElBQzFDLDJFQUEyRTtBQUFBLElBQzNFLDBEQUEwRDtBQUFBLEVBQzlEOzs7QUNGQSxXQUFTLFlBQVM7QUFDaEIsVUFBTSxZQUFZLFNBQVMsZUFBZSxlQUFlO0FBQ3pELFFBQUksQ0FBQyxXQUFXO0FBQ2QsWUFBTTs7QUFFUixjQUFVLGFBQWE7Ozs7VUFJZixTQUFRLEVBQUUseUVBQXlFLENBQUM7Ozs7RUFJOUY7QUFFTSxXQUFVLGVBQWUsVUFBc0I7QUFDbkQsUUFBSSxhQUFhO0FBRWpCLGFBQ0MsSUFBSSxPQUFnQixFQUNwQixLQUFLO01BQ0YsV0FBVyxFQUFFLE9BQU8sQ0FBQyxlQUFlLFdBQVcsRUFBQztNQUNoRCxhQUFhO01BQ2IsY0FBYztLQUNqQjtBQUVELGFBQVEsa0JBQWtCLE1BQU0sZUFBZSxVQUFFO0FBQ2pELGFBQVEsa0JBQWtCLE1BQU0sZUFBZSxVQUFFO0FBQ2pELGFBQVEsZUFBYztBQUV0QixXQUFPLGlCQUFpQixRQUFRLE1BQUs7QUFDbkMsdUJBQWlCLFFBQVE7QUFDekIsbUJBQWE7SUFDZixDQUFDO0FBRUQsZUFBVyxNQUFLO0FBQ2QsVUFBSSxDQUFDLFlBQVk7QUFDZixrQkFBUzs7SUFFYixHQUFHLEdBQUk7RUFDVDs7O0FDN0NBLE1BQU0sZUFBNkIsT0FBTztBQUMxQyxpQkFBZSxZQUFZOyIsCiAgIm5hbWVzIjogWyJ0IiwgInBhdGgiLCAiY29weSIsICJsb2FkU3RhdGUiLCAiaW5zdGFuY2UiLCAibyIsICJzZXJpYWxpemVDb29raWUiLCAibG9va3VwIiwgImxvY2FsU3RvcmFnZUF2YWlsYWJsZSIsICJjYWNoZVVzZXJMYW5ndWFnZSIsICJzZXNzaW9uU3RvcmFnZUF2YWlsYWJsZSIsICJodG1sVGFnIiwgIkJyb3dzZXIiLCAiaW5pdCJdCn0K
