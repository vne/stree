(function() {
	var fs = require('fs');

	function STree(settings) {
		this.settings = settings;
	}
	STree.prototype.readFrom = function(path) {
		var res = fs.readFileSync(path, 'utf-8');
		if (!res) {
			throw new Error("Couldn't read file " + path);
		}
		this.load(res);
		return this;
	}
	STree.prototype.load = function(data) {
		this.trees = parseSTree(data);
		// console.log('load', JSON.stringify(this.tree, null, 4));
		// console.log('trees', Object.keys(this.trees));
		return this;
	}
	STree.prototype.getTrees = function() {
		if (!this.trees) { return []; }
		return Object.keys(this.trees);
	}
	STree.prototype.value = function(name, inobj, copy) {
		if (Array.prototype.slice.call(arguments).length) {
			this.apply(name, inobj, copy);
		}
		return this.retval;
	}
	STree.prototype.object = function(name, inobj, copy) {
		if (Array.prototype.slice.call(arguments).length) {
			this.apply(name, inobj, copy);
		}
		return this.retobj;
	}
	STree.prototype.apply = function(name, inobj, copy) {
		var obj, tree;
		if (name && name.constructor === Object) {
			copy = inobj;
			inobj = name;
			name = undefined;
		}
		obj = inobj;
		if (typeof obj === "undefined") {
			return;
		}
		if (!this.trees) {
			throw new Error("Couldn't apply stree without a tree");
		}
		if (name && this.trees[name]) {
			// console.log('named tree', name);
			tree = this.trees[name];
		} else if (this.trees['default']) {
			// console.log('default tree');
			tree = this.trees['default'];
			// console.log(tree);
		} else if (name) {
			throw new Error("Couldn't find tree '" + name + '"');
		} else {
			throw new Error("Either no default tree exists and no tree name specified");
		}
		if (copy) {
			obj = JSON.parse(JSON.stringify(inobj));
		}
		this.retobj = {};
		this.retval = undefined;
		var r = this.evaluate(obj, tree);
		if (Object.keys(this.retobj).length && typeof this.retval === "undefined") {
			return this.retobj;
		}
		return this;
	}
	STree.prototype.evaluate = function(obj, tree) {
		var i, j, rule, objval, match = false;
		for (i = 0; i < tree.length; i++) {
			match = false;
			rule = tree[i];
			if (rule.else) {
				this.applyRule(obj, rule, rule.val);
				break;
			}
			objval = this.resolve(rule.name, obj);
			// console.log('eval', objval, rule);
			if (typeof objval !== "undefined") {
				if (this.applyOperator(objval, rule.op, rule.val)) {
					match = true;
				}
			}
			if (!match) {
				// console.log('  no match', objval, rule.val);
				continue;
			}
			// console.log('  MATCH');
			this.applyRule(obj, rule, objval);
			break;
		}
		return this.retval;
	}
	STree.prototype.applyRule = function(obj, rule, value) {
		var j;
		// if (typeof value !== "undefined") {
		// 	this.retval = value;
		// }
		if (rule.apply && rule.apply.length) {
			for (j = 0; j < rule.apply.length; j++) {
				if (rule.apply[j].name) {
					this.retobj[ rule.apply[j].name ] = rule.apply[j].val;
				} else {
					// console.log('qqq');
					this.retval = rule.apply[j].val;
				}
			}
		}
		if (rule.children && rule.children.length) {
			// console.log('evaluate children');
			this.retval = this.evaluate(obj, rule.children);
		}
	}
	STree.prototype.applyOperator = function(a, op, b) {
		if (op === '=') {
			return a == b;
		} else if (op === '!=') {
			return a != b;
		} else if (op === '>') {
			return a > b;
		} else if (op === '>=') {
			return a >= b;
		} else if (op === '<') {
			return a < b;
		} else if (op === '<=') {
			return a <= b;
		} else if (op === 'contains') {
			return a.toString().indexOf(b) >= 0;
		} else if (op === 'ncontains') {
			return a.toString().indexOf(b) < 0;
		} else if (op === 'icontains') {
			return a.toString().toLowerCase().indexOf(b.toString().toLowerCase()) >= 0;
		} else if (['nicontains', 'incontains'].indexOf(op) >= 0) {
			return a.toString().toLowerCase().indexOf(b.toString().toLowerCase()) < 0;
		} else if (op === 'in') {
			var list = eval(b); // this should be Javascript array
			return list.indexOf(a) >= 0;
		} else if (op === 'nin') {
			var list = eval(b); // this should be Javascript array
			return list.indexOf(a) < 0;
		} else if (op === '~') {
			var regex = eval(b);
			return regex.test(a);
		} else {
			throw new Error("Unknown operator '" + op + "'");
		}
	}
	STree.prototype.resolve = function(name, obj) {
		if (name.indexOf('.') <= 0) { return obj[name]; }
		var parts = name.split('.'),
			i, o = obj, p, idx = -1, re, array_idx = false;
		for (i in parts) {
			idx = -1;
			p = parts[i];
			if (re = /(.+)\[([\-\d]+)\]/.exec(p)) {
				idx = parseInt(re[2], 10);
				p = re[1];
				array_idx = true;
			}
			// console.log('      resolve', i, p, o[p]);
			if (typeof o[p] !== "undefined") {
				o = o[p];
				if (array_idx && o && o.constructor === Array) {
					// console.log('negative index', o.length, idx, name, o);
					if (idx >= 0) {
						if (o.length > idx) {
							o = o[idx];
						}
					} else if (idx < 0) {
						if (o.length > -idx) {
							o = o[o.length + idx];
						}
					} else {
						return;
					}
				}
				array_idx = false;
			} else {
				return;
			}
		}
		// console.log('return o', o);
		return o;
	}


	try {
		window.STree = STree;
	} catch(e) {
		module.exports = STree;
	}

	function prefixLength(str) {
		var re_prefix = /^(\s*)/,
			re = re_prefix.exec(str);
		return re ? re[0].length : 0;
	}

	function parseSTreeLine(line) {
		var is_resultLine = /^(\s*):(.+)/,
			has_result = /^(\s*)([^:\s][^\s]*)\s+(\S*)([^:\n]+)(:.+)/i,
			no_result =  /^(\s*)([^:\s][^\s]*)\s+(\S*)([^:\n]+)/i,
			re_elseval = /^(\s*)else\s*(:.+)/i,
			re_else = /^(\s*)else\s*/i,
			cur = {},
			buf, re;
		// console.log('pstl', line);
		if (re = is_resultLine.exec(line)) {
			cur.type = 1;
			cur.prefix = re[1].length;
			if (re[2].indexOf('=') > 0) {
				buf = re[2].split('='); // TODO: replace with a parser that supports screening and quoting
				// console.log('buf', buf);
				cur.resname = buf[0].trim();
				cur.resval = buf.slice(1).join('=').trim();
			} else {
				cur.resval = re[2].trim();
			}
		} else if (re = re_elseval.exec(line)) {
			cur = parseSTreeLine(re[2]);
			cur.type = 2;
			cur.prefix = re[1].length;
			cur.else = true;
		} else if (re = re_else.exec(line)) {
			cur.type = 2;
			cur.prefix = re[1].length;
			cur.else = true;
		} else if (re = has_result.exec(line)) {
			// console.log('has_result', re);
			cur = parseSTreeLine(re[5]);
			cur.type = 0;
			cur.prefix = re[1].length;
			cur.varname = re[2].trim();
			cur.op = re[3].trim();
			cur.varval = re[4].trim();
		} else if (re = no_result.exec(line)) {
			cur.type = 0;
			cur.prefix = re[1].length;
			cur.varname = re[2].trim();
			cur.op = re[3].trim();
			cur.varval = re[4].trim();
		} else {
			throw new Error("Failed to parse line: '" + line + "'");
		}
		// if (cur.op && (['=', 'in'].indexOf(cur.op.toLowerCase()) < 0)) {
			// throw new Error("Unknown operator '" + cur.op + "' in line '" + line + "'");
		// }
		// console.log('pstl', cur.prefix, JSON.stringify(line));
		return cur;
	}

	function parseSTree(data) {
		var i, re,
			lines = data
				.split("\n")
				.filter(function(e) { return /\S/.test(e) && !/^\s*#/.test(e); }),
			treelines = {},
			res = {},
			curtree,
			curlines = [];
		for (i = 0; i < lines.length; i++) {
			if (re = /^\s*\[([^\]]+)\]\s*$/.exec(lines[i])) {
				if (curtree && curlines.length) {
					treelines[curtree] = curlines;
					curlines = [];
				}
				curtree = re[1];
			} else {
				curlines.push(parseSTreeLine(lines[i]));
			}
		}
		if (curlines.length) {
			treelines[curtree] = curlines;
		}
		if (!curtree) {
			treelines['default'] = lines.map(function(e) { return parseSTreeLine(e) });
		}
		for (i in treelines) {
			res[i] = processSTreeLines(treelines[i], treelines[i][0].prefix);
			// console.log('treeline', i, treelines[i], res[i]);
		}
		// return processSTreeLines(lines, lines[0].prefix);
		return res;
	}

	function processSTreeLines(lines, prefix, startidx) {
		var i, j, si = 0, line, len = lines.length,
			tree = [],
			cur = { apply: [], children: [] },
			sub, nopt, pfx = '';
		if (startidx) {
			si = startidx.i;
		}
		for (i = 0; i < prefix; i++) {
			pfx += ' ';
		}
		for (i = si; i < len; i++) {
			line = lines[i];
			// console.log('pstl', i, pfx, prefix, JSON.stringify(line));
			if (line.prefix === prefix) {
				// if (!line.varname && !cur.varname) {
				// 	throw new Error("Bad syntax in line " + (i+1) + ": results before conditions");
				// }
				if (line.varname) {
					if (cur.name) {
						// console.log('    push 1');
						tree.push(cur);
					}
					cur = {
						name: line.varname,
						op: line.op,
						val: line.varval,
						apply: [],
						children: []
					};
				}
				if (line.else) {
					// console.log('    push 2');
					tree.push(cur);
					cur = {
						"else": true,
						apply: [],
						children: []
					};
				}
				if (line.resval) {
					// if (!cur.apply) {
					// 	console.log('xxx',line);
					// 	throw new Error("Bad syntax in line " + (i+1) + ": results before conditions");
					// }
					cur.apply.push({
						name: line.resname,
						val: line.resval
					});
				}
				// console.log('    qqq', cur);
			} else if (line.prefix > prefix) {
				nopt = { i: i };
				sub = processSTreeLines(lines, line.prefix, nopt);
				i = nopt.i;
				for (j = 0; j < sub.length; j++) {
					if (sub[j].name) {
						cur.children.push(sub[j]);
					} else if (sub[j].apply && sub[j].apply.length) {
						cur.apply = cur.apply.concat(sub[j].apply);
					}
				}
			} else {
				if (cur.name || cur.apply.length) {
					tree.push(cur);
					cur = {};
					// console.log('push 4',prefix, JSON.stringify(tree));
				}
				if (startidx) {
					startidx.i = i - 1;
				}
				return tree;
			}
		}
		if (cur.name || cur.apply.length) {
			tree.push(cur);
			// console.log('    push 3');
		}
		if (startidx) {
			startidx.i = i;
		}
		return tree;
	}
})();
