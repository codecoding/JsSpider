/* jslint node: true */

var fs = require('fs'),
    nd = require('node-dir'),
    path = require('path'),
    models = require('./models.js'),
    DIR = 'C:\\TFS\\Habitaclia\\Frontal\\Habitaclia\\RELEASE',
    aspFiles = [],
    echo = console.log,
    aspPattern = /\.asp$/,
    found = 0,
    totalAsp = 0;

echo('Starting our mission');
echo('Searching in', DIR);


function parseAsp(content, filename){
    var patt = /<script/gi,
        extpatt = new RegExp('(.{0,40})(<script)(.{0,120})', 'gi'),
        useFound = 0;
    //let's search
    var isIn = patt.test(content);
    if (isIn) {
        //try to find all matches
        var m = null, uses = [];
        do {
            m = extpatt.exec(content);
            if (m) {
                if (m[0].indexOf('src') < 0) {
                    uses.push(m[1] + m[2] + m[3]);
                    useFound++;
                }
                //console.log(m[1], m[2], m[3]); //groups
            }
        } while(m);
        if (uses.length) {
            echo('... found ', useFound , ' inline uses in ' + path.basename(filename));
            aspFiles.push(new models.UseFile(new models.File(filename), uses));
            echo('... ASPs affected ', found++);
        }
    }
    totalAsp++;
}

function writeFile(){
    //creating formatted string
    var nl = '\r\n';
    function addline(str, strAdd) {
        strAdd = strAdd || '';
        str += strAdd + nl;
        return str;
    }
    var fstr = '', tab = '      ';
    fstr = addline(fstr, 'Inline code used in ASP documents');
    fstr = addline(fstr, '------------------------------');
    fstr = addline(fstr, nl);
    fstr = addline(fstr, 'SUMMARY');
    fstr = addline(fstr, '------------------------------');
    fstr = addline(fstr, nl);
    fstr = addline(fstr, aspFiles.length + ' ASP files affected of ' + totalAsp);
    
    aspFiles.forEach(function (f) {
        fstr = addline(fstr, f.file.name + '  ............  ' + f.uses.length + ' inline uses.');
    });
    fstr = addline(fstr, '------------------------------' + nl);
    
    aspFiles.forEach(function (f) {
        //asp name
        fstr = addline(fstr, 'ASP: ' + f.file.name);
        fstr = addline(fstr, f.file.path);
        fstr = addline(fstr);
        fstr = addline(fstr, '-------------------------------------');
        fstr = addline(fstr);
        fstr = addline(fstr, tab + 'inline uses ' + f.uses.length);
        fstr = addline(fstr);
        //uses
        f.uses.forEach(function (u) {
            fstr = addline(fstr, tab + u);
        });
        fstr = addline(fstr);
        fstr = addline(fstr);
        fstr = addline(fstr, '-------------------------------------');
    });
    echo('Writing to file...');
    //write to file
    fs.writeFile('inline.txt', fstr, function (err) {
        if (err) throw err;
        echo('File output has been created');
    });
}

//now let's start searching for the names
nd.readFiles(DIR, {
    match: aspPattern
}, function (err, content, filename, next) {
    if (err) throw err;
    parseAsp(content, filename);
    next();
}, function (err) {
    if (err) throw err;
    echo('Found ' + aspFiles.length + ' asp files with inline js');
    writeFile();
});
