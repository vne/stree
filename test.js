var _global, is_nodejs = false;
try {
	var assert, stree;
	_global = window;
} catch(e) {
	_global = global;
	is_nodejs = true;
}

if (is_nodejs) {
	assert = require('assert');
	STree = require('./stree');
}

var obj = {
	a: 5,
	b: {
		c: {
			d: 10
		}
	}
};

var s = new STree()
s.readFrom('test1.stree');
console.log('ret', s.apply('abc', obj));
console.log(s.retobj);