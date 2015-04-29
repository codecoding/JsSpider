/* jslint node: true */

var fs = require('fs'),
    nd = require('node-dir'),
    path = require('path'),
    models = require('./models.js'),
    config = require('./config.js'),
    DIR = config.DIR,
    ContainerFilePattern = config.ContainerFilePattern,
    extension = config.extension,
    containerFiles = [],
    echo = console.log,
    found = 0,
    totalContainerFiles = 0;

echo('Starting our mission');
echo('Searching in', DIR);


function parseContainerFile(content, filename){
    var patt = /<script/gi,
        extpatt = new RegExp('(<script)((.|[\r\n])+?(</script>))', 'gi'),
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
                    uses.push(m[0]);
                    useFound++;
                }
                //console.log(m[1], m[2], m[3]); //groups
            }
        } while(m);
        if (uses.length) {
            echo('... found ', useFound , ' inline uses in ' + path.basename(filename));
            containerFiles.push(new models.UseFile(new models.File(filename), uses));
            echo('... ' + extension + 's affected ', found++);
        }
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
    fstr = addline(fstr, 'Inline code used in ' + extension + ' documents');
    fstr = addline(fstr, '------------------------------');
    fstr = addline(fstr, nl);
    fstr = addline(fstr, 'SUMMARY');
    fstr = addline(fstr, '------------------------------');
    fstr = addline(fstr, nl);
    fstr = addline(fstr, containerFiles.length + ' ' + extension + ' files affected of ' + totalContainerFiles);
    
    containerFiles.forEach(function (f) {
        fstr = addline(fstr, f.file.name + '  ............  ' + f.uses.length + ' inline uses.');
    });
    fstr = addline(fstr, '------------------------------' + nl);
    
    containerFiles.forEach(function (f) {
        //container file name
        fstr = addline(fstr,  extension +': '+ f.file.name);
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
    match: ContainerFilePattern
}, function (err, content, filename, next) {
    if (err) throw err;
    parseContainerFile(content, filename);
    next();
}, function (err) {
    if (err) throw err;
    echo('Found ' + containerFiles.length + ' ' + extension + ' files with inline js');
    writeFile();
});
