STree
=====

A configurable replacement for multiple IFs

Written by Vladimir Neverov <sanguini@gmail.com> in 2014

Brief description
-----------------

STree allows using of special YAML-like text files to determine properties of objects based on properties of another objects. It's just like multiple nested IFs where logic is stored in an external file.

STree uses its own syntax instead of JSON or YAML for these text files because it tends to be human readable and compact. Not that the syntax is brilliant at present, but it tends to be :)

Simple example of a STree data file:

	> a = 5: 10
	> a = 20
	>   b = 1: 20
	>	else: 30
	> else: 40

This should be read from file or loaded as text into a new STree instance:

	> var stree = new STree().readForm('some/file.txt');

Then it can be used:

	> var sourceObject = {
	>	a: 20,
	>	b: 1
	> }
	>
	> var result = stree.value(sourceObject)
	>
	> console.log(result); // will print 20

For now, see test.js for other more sophisticated examples.

TODO
====

 - write more documentation
 - replace regex parser with something like PEG.js or own parser