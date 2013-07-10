#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest    = require('restler');

var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {

    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
	console.log("%s does not exist. Exiting.", instr);
	process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var loadChecks = function(checksfile) {

    return JSON.parse(fs.readFileSync(checksfile));
};

var writeToConsole = function(out){

    console.log(JSON.stringify(out, null, 4));

};

var checkHtml = function(path_or_url, checksfile, isUrl, outputProcessor) {

    isUrl = isUrl || false;
    outputProcessor = outputProcessor || writeToConsole;

    var htmlChecker = getHtmlChecker(checksfile, outputProcessor);

    if (isUrl){
	rest.get(path_or_url).on('complete', function(result){
	    if(result instanceof Error){
		console.log('Error: ' + result.message);
	    }else{
		htmlChecker(result);
	    }
	});

    }else{
	htmlChecker(fs.readFileSync(path_or_url));
    }

};



//This function given a checkfile and outputProcessor will return
// a functin that would take an html buffer and check its content
// according to the file checkfile and pass the output of the check
// to the function outputProcessor.

var getHtmlChecker = function(checksfile, outputProcessor) {

    var htmlChecker = function(htmlBuffer){

	$ = cheerio.load(htmlBuffer);
	var checks = loadChecks(checksfile).sort();
	var out = {};
	for(var ii in checks) {
	    var present = $(checks[ii]).length > 0;
	    out[checks[ii]] = present;
	}
	outputProcessor(out);
    };
    return htmlChecker;
};


var clone = function(fn) {

    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {

    program
	.option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
	.option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
	.option('-u, --url <url>', 'URL to html file')
	.parse(process.argv);

    if(program.url){

	checkHtml(program.url, program.checks, true);

    }else{

	checkHtml(program.file, program.checks);
    }

} else {

    exports.checkHtmlFile = checkHtml;
}
