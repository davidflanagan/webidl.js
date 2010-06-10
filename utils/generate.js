
var sys = require("sys"),
    fs  = require("fs"),
    peg = require(__dirname + "/../lib/peg").PEG;

var grammar = fs.readFileSync(__dirname + "/../lib/grammar.peg");
var parser = peg.buildParser(grammar);
var source = parser.toSource();

// we brute-force modify the source, it would be nice if there were a more elegant way in PEG
// we could alternatively monkey patch from the generated code that we add
source = source.replace("var result = {", "var result = {\n    killComments: function (str) {\n" +
                                                          "      return str.replace(/\\/\\/.*$/gm, '')\n" +
                                                          "                .replace(/\\/\\*[\\s\\S]*?\\*\\//g, '');\n" +
                                                          "    },\n")
               .replace("parse: function(input) {", "parse: function(input, start) {\n" +
                                                    "      input = this.killComments(input);\n" +
                                                    "      if (!start) start = 'definitions';\n" +
                                                    "      var funcs = {};\n")
               .replace(/function parse_(\w+)\(context\)/g, "var parse_$1 = funcs['$1'] = function parse_$1(context)")
               .replace("var result = parse_definitions", "var result = funcs[start]");

var webSrc = "window.WebIDLParser = " + source + ";\n",
    nodeSrc = "exports.Parser = " + source + ";\n";

fs.writeFileSync(__dirname + "/../web/WebIDLParser.js", webSrc);
fs.writeFileSync(__dirname + "/../node/WebIDLParser.js", nodeSrc);
