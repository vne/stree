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

var testObj1 = {
	a: 5,
	b: {
		c: {
			d: 10
		}
	}
};
var testObj2 = {
	id: 1,
	s: "qwe-abc-test1",
	a: 1,
	obj: {
		oa: 1,
		oobj: {
			ooa: 1
		}
	},
	arr: [
		{ aa: 10 },
		{ ab: 20 }
	]
};

var s = new STree();
try {
	s.readFrom('test1.stree');
} catch(e) {
	console.log("STree test data file couldn't be read");
}

describe("STree library", function() {
	it('should read stree data files', function() {
		assert.doesNotThrow(function() {
			s.readFrom('test1.stree');
		}, Error);
	});
	it('should read all the trees from data file', function() {
		assert.equal(s.getTrees().length, 6);
	});
	it('should provide names of the trees', function() {
		assert.deepEqual(s.getTrees(), ['abc', 'qqq', 'operators', 'negate', 'paths', 'regex']);
	});
	it('should throw exception on non-stree data files', function() {
		assert.throws(function() {
			var s2 = new STree().readFrom('test3.stree');
		}, /Failed to parse line/);
	});
	it('should throw "unknown operator" exception on data files with unknown operators', function() {
		assert.throws(function() {
			var s2 = new STree().readFrom('test4.stree').value({ a: 5 });
		}, /Unknown operator/);
		// console.log(JSON.stringify(s2.trees['default'], undefined, 4));
	});
	it('should return undefined when object is undefined', function() {
		assert.equal(s.value('abc', undefined), undefined);
	});
	it('should evaluate "else" when a non-object argument is passed', function() {
		assert.equal(s.value('abc', [1,2,3]), 100);
		assert.equal(s.value('abc', "abc"), 100);
		assert.equal(s.value('abc', function() {}), 100);
	});
});
describe("STree should correctly evaluate", function() {
	it('first level conditions with values', function() {
		assert.deepEqual(s.object('abc', {
			a: 1
		}), { x: 10 });
	});
	it('first level "else" conditions with value on the same line', function() {
		assert.equal(s.value('abc', {
			a: 2
		}), 100);
		assert.deepEqual(s.retobj, { x: 101 });
	});
	it('nested conditions with values', function() {
		assert.deepEqual(s.value('abc', {
			a: 5,
			b: {
				c: {
					d: 1
				}
			}
		}), 20);
	});
	it('nested conditions with values on next lines', function() {
		assert.deepEqual(s.apply('abc', {
			a: 5,
			b: {
				c: {
					d: 10
				}
			}
		}).value(), 30);
		assert.deepEqual(s.retobj, { x: 20, y: 200 });
	});
	it('"else" conditions with values on next lines', function() {
		assert.deepEqual(s.value('qqq', {
			a: 6,
		}), 20);
	});
	it('default tree', function() {
		var s2 = new STree().readFrom('test2.stree');
		assert.equal(s2.value({ a: 1 }), 2);
	});
	it('paths with array indexes > 0', function() {
		assert.equal(s.value('paths', {
			obj: {
				arr: [
					{ x: 1 },
					{ x: 3 },
					{ x: 5 },
					{ x: 7 }
				]
			}
		}), 1);
	});
	it('paths with array indexes < 0', function() {
		assert.equal(s.value('paths', {
			obj: {
				arr: [
					{ x: 1 },
					{ x: 2 },
					{ x: 3 },
					{ x: 4 }
				]
			}
		}), 2);
	});
	it('nested assignments', function() {
		assert.deepEqual(s.object('abc', {
			a: 5,
			b: {
				c: {
					d: 10
				}
			}
		}), {
			x: 20,
			y: 200
		});
	});
});
describe("STree operator", function() {
	it("'in' should evaluate correctly", function() {
		assert.equal(s.value('operators', { a: 2 }), 1);
		assert.equal(s.value('operators', { a: 12 }), 2);
	});
	it("'>' should evaluate correctly", function() {
		assert.equal(s.value('operators', { a: 5 }), 3);
	});
	it("'>=' should evaluate correctly", function() {
		assert.equal(s.value('operators', { a: 4 }), 5);
	});
	it("'<' should evaluate correctly", function() {
		assert.equal(s.value('operators', { a: -5 }), 4);
	});
	it("'<=' should evaluate correctly", function() {
		assert.equal(s.value('operators', { a: 0 }), 6);
	});
	it("'contains' should evaluate correctly", function() {
		assert.equal(s.value('operators', { b: "all you need is glove" }), 7);
	});
	it("'contains' should evaluate correctly", function() {
		assert.equal(s.value('operators', { b: "all you need is grave" }), 9);
	});
	it("'icontains' should evaluate correctly", function() {
		assert.equal(s.value('operators', { b: "all you need is lOvE" }), 8);
	});
	it("'nin' should evaluate correctly - 1", function() {
		assert.equal(s.value('negate', { a: 1 }), 1);
	});
	it("'nin' should evaluate correctly - 2", function() {
		assert.equal(s.value('negate', { a: 4 }), 2);
	});
	it("'~' should evaluate correctly", function() {
		assert.equal(s.value('regex', { a: 5 }), 1);
	});
	it("'~' should evaluate correctly", function() {
		assert.equal(s.value('regex', { a: "abc" }), 2);
	});
});
