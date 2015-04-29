/* jslint node: true */

var fs = require('fs'),
    nd = require('node-dir'),
    path = require('path'),
    models = require('./models.js'),
    config = require('./config.js'),
    DIR = config.DIR,
    ContainerFilePattern = config.ContainerFilePattern,
    extension = config.extension,
    jsFiles = [],
    containerFiles = [],
    echo = console.log,
    jsPattern = /\.js$/,
    found = 0,
    totalContainerFiles = 0,
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

function parseContainerFile(content, usedInFileName){
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
                    uses.push(m[0]);
                    useFound++;
                }
            } while(m);
            echo('... found ', useFound , ' js matches in ' + path.basename(usedInFileName));
            jsUsedFiles.push(new models.UseFile(f, uses)); //container file specific
            if (usedJsFiles.indexOf(f) < 0) {
                usedJsFiles.push(f); //global
            }
        }
    });
    
    //check if any use and add to containerFiles
    if (jsUsedFiles.length) {
        //get the container file and find all js uses in it
        var id = found++;
        var cf = new models.ContainerFile(new models.File(usedInFileName, id), jsUsedFiles);
        containerFiles.push(cf);
        echo('... ' + extension +'s affected ', id);
    }
    totalContainerFiles++;
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
    fstr = addline(fstr, 'JS files used in ' + extension + ' documents');
    fstr = addline(fstr, '------------------------------');
    fstr = addline(fstr, nl);
    fstr = addline(fstr, 'SUMMARY');
    fstr = addline(fstr, '------------------------------');
    fstr = addline(fstr, nl);
    fstr = addline(fstr, containerFiles.length + ' ' +  extension + ' files affected of ' + totalContainerFiles);
    
    containerFiles.forEach(function (f) {
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
    
    containerFiles.forEach(function (f, i) {
        //container name
        fstr = addline(fstr, i + ' ' + extension + ': ' + f.file.name);
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
            fstr = addline(fstr, tab + tab + 'uses in ' + extension + ' file: ' + rf.uses.length);
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
        match: ContainerFilePattern
    }, function (err, content, usedInFileName, next) {
        if (err) throw err;
        parseContainerFile(content, usedInFileName);
        next();
    }, function (err) {
        if (err) throw err;
        echo('Found ' + containerFiles.length + ' ' + extension +' files with js use');
        writeFile();
    });
});
