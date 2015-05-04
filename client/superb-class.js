(function() {


// ==========================================================================
// ClassDefinition
// ==========================================================================

/**
 * ClassDefinition - A class description to be created.
 * @return {void}
 */
function ClassDefinition() {
    this.name = null; // the class name.
    this.superClass = Object.prototype;
    this.mixins = [];
    this.instanceProperties = {};
    this.staticProperties = {};
}

/**
 * parseName - Attempts at storing the string name of the class.
 * @param {string|any} name
 * @return {boolean}
 */
ClassDefinition.prototype.parseName = function(name) {
    if (typeof name != "string") {
        return false;
    }

    this.name = name;

    return true;
}

/**
 * parseBaseClass - Attempts at storing the base class.
 * @param {function|any} baseClass
 * @return {boolean}
 */
ClassDefinition.prototype.parseBaseClass = function(baseClass) {
    if (typeof baseClass != "function") {
        return false;
    }

    this.superClass = baseClass;

    return true;
}

/**
 * parseMixins - Attempts at storing the array of mixins.
 * @param {Array<object>|any} mixins
 * @return {boolean}
 */
ClassDefinition.prototype.parseMixins = function(mixins) {
    if ((typeof mixins != 'object') || (typeof mixins.length != 'number')) {
        return false;
    }

    this.mixins = mixins;

    return true;
}

/**
 * parseInstanceMembers - Attempts at storing the instance members.
 * @param {object|any} instanceProperties
 * @return {boolean}
 */
ClassDefinition.prototype.parseInstanceMembers = function(instanceProperties) {
    if (typeof instanceProperties != "object") {
        return false;
    }

    this.instanceProperties = instanceProperties;

    return true;
}

/**
 * parseInstanceMembers - Attempts at storing the instance members.
 * @param {object|any} staticProperties
 * @return {boolean}
 */
ClassDefinition.prototype.parseStaticMembers = function(staticProperties) {
    if (typeof staticProperties != "object") {
        return false;
    }

    this.staticProperties = staticProperties;

    return true;
}

/**
 * failParsingArgument - Throws an error.
 * @param {} argumentValue
 * @return {void}
 */
function failParsingArgument(args, index) {
    throw new Error('Failed parsing arguments ' + args + ' at index ' + index);
}

/**
 * parseClassDefinition - Parses the class definition from the arguments.
 * @param {Array<any>} argumentArray
 * @return {ClassDefinition}
 */
function parseClassDefinition(argumentArray) {
    var classDefinition = new ClassDefinition(),
        stageFunctions = [
            classDefinition.parseName.bind(classDefinition),
            classDefinition.parseBaseClass.bind(classDefinition),
            classDefinition.parseMixins.bind(classDefinition),
            classDefinition.parseInstanceMembers.bind(classDefinition),
            classDefinition.parseStaticMembers.bind(classDefinition),
            failParsingArgument.bind(this, argumentArray)
        ],
        currentStage = 0,
        i;

    for (i = 0; i < argumentArray.length; i++) {
        var currentArgument = argumentArray[i];

        while(! stageFunctions[currentStage++](currentArgument));
    }

    if (i != argumentArray.length) {
        failParsingArgument(argumentArray, i);
    }

    return classDefinition;
}


// ==========================================================================
// createClass
// ==========================================================================

/**
 * Create a class.
 * @param {string} name The string name of the class.
 * @param {function} superClass The superclass to inherit from. It will be
 *                          available as $super in the this instance, for
 *                          calls on the super class.
 * @param {Array<function>} mixins mixins definitions.
 * @param {Object} instanceProperties Instance properties that should be
 *          created. Properties that are prefixed with _ denode private
 *          properties, and creation of the class will fail if another
 *          property with the same name exists in the parent prototype.
 *          Properties prefixed with $ are protected properties.
 *          Shadowing is allowed only for public and protected members.
 *          The constructor() will be called if present with the arguments
 *          from the function itself.
 * @param {Object} staticProperties Static properties that will be defined
 *          on the returned class itself.
 * @type {function}
 */
function createClass() {
    var args,
        result,
        classDefinition,
        proto;

    args = Array.prototype.slice.apply(arguments);
    classDefinition = parseClassDefinition(args);

    result = function A() {
        if (this.constructor) {
            this.constructor.apply(this, arguments);
        }
    };

    var newPrototype = {};

    result.prototype = newPrototype;
    newPrototype.__proto__ = classDefinition.superClass.prototype;
    newPrototype._super = classDefinition.superClass.prototype;

    for (var i = 0; i < classDefinition.mixins.length; i++) {
        joinPrototype(classDefinition.mixins[i].prototype, newPrototype, /* mixin: */ true);
    }

    joinPrototype(classDefinition.instanceProperties, newPrototype);
    joinPrototype(classDefinition.staticProperties, result);

    return result;
}

/**
 * joinPrototype - Mixes the target prototype with the items from the
 *                 sourceObject.
 * @param {object} sourceObject
 * @param {object} targetPrototype
 * @param {boolean?} mixin Is the source from a mixin.
 * @return {void}
 */
function joinPrototype(sourceObject, targetPrototype, mixin) {
    for (var k in sourceObject) {
        if (mixin && k == '_super') {
            continue; // ignore _super from mixins.
        }

        if (/^_/.test(k) && (typeof targetPrototype[k] !== "undefined")) {
            throw new Error('Private member ' + k + ' is already defined.');
        }

        if (mixin && /^\$/.test(k) && (typeof targetPrototype[k] !== "undefined")) {
            throw new Error('Protected member ' + k + ' can not be overwritten by mixins.');
        }

        targetPrototype[k] = sourceObject[k];
    }
}



window.createClass = createClass;



})();

//# sourceMappingURL=superb-class.js.map