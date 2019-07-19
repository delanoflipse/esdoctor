import Vue from 'vue';
import { defaultTo } from '~/classes/Util';

/** The class description */
export default class FormField {
	/** Text only */
	stringField = 'asdf';
	stringFieldNoComment = 'asdf';
	/**
	 * should be null
	 * @type {null}
	 */
	nullField = null;
	/**
	 * should be number
	 * @type {Number}
	 */
	undefFieldNumber;
	undefField;

	/**
	 * Request basic properties of the field
	 * @param {String} label The i18n label string
	 * @param {(String|null)} sublabel The i18n sublabel string
	 */
	constructor(label = '', sublabel = null) {
		this.label = label;
		this.sublabel = sublabel;
		return this;
	}

	/**
	 * Set the order value
	 * @param {Number} order the order value
	 * @returns {Promise<Array>} the order
	 */
	setOrder(order) {
		this.order = order;
		return this;
	}

	/**
	 * Default cast method
	 * @override
	 */
	cast() {
		return null;
	}

	/**
	 * Set the visibility to false
	 * @deprecated
	 */
	hide() {
		this.visible = false;
		return this;
	}

	/**
	 * Set the populate function.
	 * This function gets called on every form initialisation.
	 * @param {Function} fn the function
	 */
	setPopulate(fn) {
		this.populatefn = fn;
		return this;
	}

	/**
	 * Set the fields nullability
	 * @param {Boolean} val The value
	 */
	setNullable(val = true) {
		this.nullable = val;
		return this;
	}

	/**
	 * Register a hook for a given event.
	 * If the even is already defined, it will override.
	 * @param {*} event the event key
	 * @param {*} fn the function
	 */
	addHook(event, fn) {
		this.hooks[event] = fn;
		return this;
	}

	/**
	 * Add a validation rule.
	 * @see https://element.eleme.io/#/en-US/component/form#validation
	 * @see https://github.com/yiminghe/async-validator
	 * @param {*} rule The rule
	 * @returns {Object} promise
	 */
	addRule(rule) {
		this.rules.push(rule);
		return this;
	}

	/**
	 * Call the populate function
	 * @param {(Object | null)} attributes the populate attributes
	 * @param {*} state the current state (store, instance ed)
	 */
	async populate(attributes, state) {
		if (this.populatefn) {
			const data = await this.populatefn(state);
			this.handlePopulate(attributes, data);
		}
	}

	/**
	 * Extend self.
	 * @param {Object} options object with values
	 * @deprecated
	 */
	extend(options) {
		for (const key in options) {
			if (typeof this[key] === 'undefined') {
				throw new Error(`Key ${key} cannot be set!`);
			}
			this[key] = options[key];
		}
	}

	/**
	 * Default attributes (empty map).
	 * @override
	 */
	getAttributes() {
		return {};
	}
}

/**
 * Custom sort for fields. Sort by fields
 * @param {FormField} a field a
 * @param {FormField} b field b
 * @returns {Number} sorting order
 */
const sort = (a, b) => {
	return a.definition.order === b.definition.order
		? a.key > b.key
			? 1
			: -1
		: a.definition.order - b.definition.order;
};

/**
 * The Form class.
 * Form are classes to provide context to a form constructor.
 * A Form can be used to modify a model instance, but is not not a model instance!
 */
export class Form {
	schema = null;
	fields = [];

	/**
	 * Create a new Form instance based on a model schema.
	 * @param {Object} schema the model schema
	 */
	constructor(schema = null) {
		this.schema = schema;

		const fields = [];
		for (const key in this.schema) {
			const field = this.schema[key];
			if (!field.visible) {
				continue;
			}

			fields.push(new ClassName(key, field));
		}

		Vue.set(this, 'fields', fields.sort(sort));
	}

	/**
	 * Call the change hook for a given field.
	 * @param {Object} reference the form instance
	 * @param {FormField} field the form field
	 * @param {String} key the form field key.
	 * @param {*} value the new value
	 */
	changeHook(reference, field, key, value) {
		if (field.definition.hooks.change) {
			field.definition.hooks.change({
				reference,
				field,
				key,
				value,
			});
		}
	}
}
