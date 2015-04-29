/*jslint node:true*/

var path = require('path');

function File(filepath, id) {
    this.id = id;
    this.name = path.basename(filepath);
    this.path = filepath;
}

function ContainerFile(file, referencedFiles) {
    this.file = file;
    this.referencedFiles = referencedFiles || null; //useFile array
}

function UseFile(file, uses) {
    this.file = file;
    this.uses = uses;
}

module.exports = {
    File: File,
    ContainerFile : ContainerFile,
    UseFile: UseFile
};
