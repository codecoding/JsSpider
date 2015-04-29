/* jslint node: true */

var fs = require('fs'),
    nd = require('node-dir'),
    path = require('path'),
    models = require('./models.js'),
    DIR = 'C:\\TFS\\Habitaclia\\Frontal\\Habitaclia\\RELEASE',
    jsFiles = [],
    aspFiles = [],
    echo = console.log,
    jsPattern = /\.js$/,
    aspPattern = /\.asp$/,
    found = 0,
    totalAsp = 0,
    usedJsFiles = [];

echo('Starting our mission');
echo('Searching in', DIR);

function getJsFiles(files) {
    var js = files.filter(function (f) {
        return jsPattern.test(f);
    }),
        jsc = js.map(function (f, i) {
            return new models.File(f, i);
        });
    
    return jsc;
}

function parseAsp(content, usedInFileName){
    var patt = null,
        extpatt = null,
        jsUsedFiles = [],
        useFound = 0;
    //let's search
    jsFiles.forEach(function (f) {
        patt = new RegExp('[/"]' + f.name, 'gi');
        extpatt = new RegExp('(.{0,40})([/"]' + f.name + ')(.{0,40})', 'gi');
        var isIn = patt.test(content);
        if (isIn) {
            //try to find all matches
            var m = null, uses = [];
            do {
                m = extpatt.exec(content);
                if (m) {
                    uses.push(m[1] + m[2] + m[3]);
                    useFound++;
                        //console.log(m[1], m[2], m[3]); //groups
                }
            } while(m);
            echo('... found ', useFound , ' js matches in ' + path.basename(usedInFileName));
            jsUsedFiles.push(new models.UseFile(f, uses)); //asp specific
            if (usedJsFiles.indexOf(f) < 0) {
                usedJsFiles.push(f); //global
            }
        }
    });
    
    //check if any use and add to aspFiles
    if (jsUsedFiles.length) {
        //get the container file (asp) and find all js uses in it
        var id = found++;
        var asp = new models.ContainerFile(new models.File(usedInFileName, id), jsUsedFiles);
        aspFiles.push(asp);
        echo('... ASPs affected ', id);
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
    fstr = addline(fstr, 'JS files used in ASP documents');
    fstr = addline(fstr, '------------------------------');
    fstr = addline(fstr, nl);
    fstr = addline(fstr, 'SUMMARY');
    fstr = addline(fstr, '------------------------------');
    fstr = addline(fstr, nl);
    fstr = addline(fstr, aspFiles.length + ' ASP files affected of ' + totalAsp);
    
    aspFiles.forEach(function (f) {
        var name = f.file.name,
            ref = f.referencedFiles.length,
            totalUses = 0;
        f.referencedFiles.forEach(function (rf) {
            totalUses += rf.uses.length;
        });
        
        fstr = addline(fstr, name + '  ............  ' + ref + ' js references with ' + totalUses + ' uses.');
    });
    fstr = addline(fstr);
    fstr = addline(fstr, '------------------------------');
    fstr = addline(fstr, nl);
    //unused js files
    fstr = addline(fstr, jsFiles.length + ' JS files included in the app\'s solution');
    fstr = addline(fstr, usedJsFiles.length + ' JS files used accross the app');
    var notUsedJsFiles = jsFiles.filter(function (f) {
        return usedJsFiles.indexOf(f) < 0;
    });
    fstr = addline(fstr, notUsedJsFiles.length + ' JS files not used accross the app:');
    notUsedJsFiles.forEach(function (f) {
        fstr = addline(fstr, f.name);
    });
    fstr = addline(fstr);
    fstr = addline(fstr, '------------------------------');
    fstr = addline(fstr, nl);
    
    aspFiles.forEach(function (f, i) {
        //asp name
        fstr = addline(fstr, i + ' ASP: ' + f.file.name);
        fstr = addline(fstr, f.file.path);
        fstr = addline(fstr);
        fstr = addline(fstr, '-------------------------------------');
        fstr = addline(fstr);
        fstr = addline(fstr, tab + 'JS FILES: ' + f.referencedFiles.length);
        fstr = addline(fstr);
        //js names
        f.referencedFiles.forEach(function (rf) {
            fstr = addline(fstr, tab + 'JS: (' + rf.file.id + ') ' + rf.file.name);
            fstr = addline(fstr, tab + rf.file.path);
            fstr = addline(fstr);
            fstr = addline(fstr, tab + tab + 'uses in ASP file: ' + rf.uses.length);
            fstr = addline(fstr);
            //uses
            rf.uses.forEach(function (u) {
                fstr = addline(fstr, tab + tab + u);
            });
            fstr = addline(fstr);
        });
        fstr = addline(fstr);
        fstr = addline(fstr, '-------------------------------------');
    });
    echo('Writing to file...');
    //write to file
    fs.writeFile('offline.txt', fstr, function (err) {
        if (err) throw err;
        echo('File output has been created');
    });
}

//execute app
nd.files(DIR, function (err, files) {
    if (err) throw err;
    
    jsFiles = getJsFiles(files);
    echo('Found ' + jsFiles.length + ' files');
    
    //now let's start searching for the names
    nd.readFiles(DIR, {
        match: aspPattern
    }, function (err, content, usedInFileName, next) {
        if (err) throw err;
        parseAsp(content, usedInFileName);
        next();
    }, function (err) {
        if (err) throw err;
        echo('Found ' + aspFiles.length + ' asp files with js use');
        writeFile();
    });
});
