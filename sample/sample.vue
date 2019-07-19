
<script>
import Package, { asdf, asdf2 } from 'package2';
import Package2 from 'package';
import { fx, fy } from '../services/functions.js';

export default {
	// middleware: 'auth',
	middleware: ['auth', 'asdff'],
	
	props: {
		/** Labels */
		labels: {
			type: Array,
			default: () => [],
		},
		/** Series - x */
		series: {
			type: Array,
			default: () => [],
		},
		/** Label y */
		yLabel: {
			type: String,
			default: 'Price (EUR)',
		},
		/** Label x */
		xLabel: {
			type: String,
			default: 'Date',
		},
		height: {
			type: Number,
			default: 260,
		},
		yPadding: {
			type: Number,
			default: 10,
		},
		xPadding: {
			type: Number,
			default: 20,
		},
		yTicks: {
			type: Number,
			default: 10,
		},
		xTicks: {
			type: Number,
			default: 10,
		},
		tickPadding: {
			type: Number,
			default: 4,
		},
		labelWidth: {
			type: Number,
			default: 60,
		},
		labelHeight: {
			type: Number,
			default: 25,
		},
		tooltipPrecision: {
			type: Number,
			default: 2,
		},
		tooltipExtension: {
			type: String,
			default: 'EUR',
		},
		rangeFactor: {
			type: Number,
			default: 1.03,
		},
		loading: {
			type: Boolean,
			default: false,
		},
	},

	// data: () => ({}),

	data() {
		return {
			breadcrumbs: this.getBreadcrumbs(),
			routepath: this.getRoutePathValue(),
			collapse: false,
		};
	},

	watch: {
		$route() {
			this.$set(this, 'breadcrumbs', this.getBreadcrumbs());
			this.$set(this, 'routepath', this.getRoutePathValue());
		},
		/** Update series on change */
		series() {
			// this.graph.axis.min({ y: min, x: 0 });
			// this.graph.axis.max({ y: max, x: this.labels.length - 1 });
			// this.graph.load({
			// 	columns,
			// });
			this.$set(this, 'graph', this.constructGraph());
		},
		width() {
			this.$set(this, 'graph', this.constructGraph());
		},

		data: {
			handler() {
				return;
			},
			deep: true,
		}
	},

	computed: {
		/** Generate list based on
		 * @returns {Array} List of lgeneds
		 */
		legendList() {
			return (this.legend || []).filter(x => x.enabled);
		},
	},

	/**
	 * Add listeneners to windows
	 */
	mounted() {
		// const breakpoint = 800;
		// window.onresize = () => {
		// 	const vw = window.innerWidth;
		// 	if (vw < breakpoint && this.collapse === false) this.collapse = true;
		// 	if (vw > breakpoint && this.collapse === true) this.collapse = false;
		// };
	},

	methods: {
		/**
		 * A command
		 * @param {Object} cmd A command
		 */
		command(cmd) {
			if (this[cmd]) this[cmd]();
			else this.goTo(cmd);
		},
	},
};
</script>