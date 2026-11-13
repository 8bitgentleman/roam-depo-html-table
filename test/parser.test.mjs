import assert from "node:assert/strict";
import { parseTable, detectDelimiter } from "../extension.js";

const cases = [
    [1, "a\tb\tc\n1\t2\t3\n", "\t", [["a","b","c"],["1","2","3"]]],
    [2, "a\tb\tc\n1\t2\t3", "\t", [["a","b","c"],["1","2","3"]]],
    [3, "a\tb\r\n1\t2\r\n", "\t", [["a","b"],["1","2"]]],
    [4, "a\tb\r\n1\t2\r\n\r\n\r\n", "\t", [["a","b"],["1","2"]]],
    [5, "a\tb\n\t\n1\t2\n\t\n", "\t", [["a","b"],["",""],["1","2"]]],
    [6, "a\tb\n\n1\t2\n", "\t", [["a","b"],["",""],["1","2"]]],
    [7, 'name,notes\n"Smith, John","likes, commas"\n', ",", [["name","notes"],["Smith, John","likes, commas"]]],
    [8, 'a,b\n"line 1\nline 2",x\n', ",", [["a","b"],["line 1\nline 2","x"]]],
    [9, 'a,b\r\n"line 1\r\nline 2",x\r\n', ",", [["a","b"],["line 1\nline 2","x"]]],
    [10, 'a,b\n"say ""hi""",x\n', ",", [["a","b"],["say \"hi\"","x"]]],
    [11, 'a,"",c\n1,2,3\n', ",", [["a","","c"],["1","2","3"]]],
    [12, "a,b\n1,\n", ",", [["a","b"],["1",""]]],
    [13, "a,b,c", ",", [["a","b","c"]]],
    [14, "a,b\n\n1,2\n", ",", [["a","b"],["",""],["1","2"]]],
    [15, "﻿a,b\n1,2\n", ",", [["a","b"],["1","2"]]],
    [16, 'a\t"line 1\nline 2"\tc\n1\t2\t3\n', "\t", [["a","line 1\nline 2","c"],["1","2","3"]]],
    [17, 'a\t"say ""hi""\nbye"\n', "\t", [["a","say \"hi\"\nbye"]]],
    [18, '"hello"\tworld\n', "\t", [["\"hello\"","world"]]],
    [19, "a, b\tc\n1\t2\n", "\t", [["a, b","c"],["1","2"]]],
    [20, "one\ntwo\nthree\n", "\t", [["one"],["two"],["three"]]],
    [21, "one\n\nthree\n", "\t", [["one"],[""],["three"]]],
    [22, "Hello, world\nNo commas here\n", "\t", [["Hello, world"],["No commas here"]]],
    [23, "Portland, OR\nAustin, TX\n", ",", [["Portland"," OR"],["Austin"," TX"]]],
    [24, "a,b,c\n1,2\n", "\t", [["a,b,c"],["1,2"]]],
    [25, "a\tb\tc\n1\n", "\t", [["a","b","c"],["1","",""]]],
    [26, "", "\t", []],
    [27, "\n", "\t", []],
    [28, "\r\n\r\n", "\t", []],
    [29, "  \n\t\t\n", "\t", []],
    [30, "a\rb\r", "\t", [["a"],["b"]]],
    [31, "[[Page]]\t((abc123xyz))\n{{[[TODO]]}} x\t#tag\n", "\t", [["[[Page]]","((abc123xyz))"],["{{[[TODO]]}} x","#tag"]]],
    [32, 'a,b\n"unterminated,x\n1,2\n', ",", [["a","b"],["\"unterminated","x"],["1","2"]]],
    [33, '"hi" there,x\n1,2\n', ",", [["\"hi\" there","x"],["1","2"]]],
    [34, '5" nail,6" nail\n1,2\n', ",", [["5\" nail","6\" nail"],["1","2"]]],
];

let failed = 0;
for (const [n, input, delim, expected] of cases) {
    try {
        assert.equal(detectDelimiter(input), delim);
        assert.deepEqual(parseTable(input), expected);
    } catch (error) {
        failed++;
        console.error(`FAIL case ${n}: ${error.message}`);
    }
}
console.log(`${cases.length - failed}/${cases.length} parser cases passed`);
process.exit(failed ? 1 : 0);
