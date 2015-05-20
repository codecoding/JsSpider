# JsSpider

This is a small utility to search for js references and inline code in your files.

You have three different options: *node offline*, *node inline* and *node external*

##config.js

Before running the app you will have to stablish some configuration settings. These settings can be found in *config.js* file:

1. **DIR**: It's the array of directories you want to check. Take into account that the app will drill down the directory tree by default. Passing an array only makes sense when you have different folders which are not nested but you want to analyze the use of the JavaScript references as a whole. Think of different physical folders which are treated as nested in your server due to a virtual directory policy.

2. **ContainerFilePattern**: This property accepts a regular expression so if you need to check the references in your .html and .asp files you just have to provid a valid pattern (/\.(asp|html)$/).

3. **extension**: This is just a string used for printing purposes.


##node offline


*node offline* will first search for all the JS files in your directories and then will try to find all the files of a specified type that contain a reference to any of them. 

This is very useful to find information about unused JavaScript files in your projects.
 

##node inline

*node inline* will search for script tags. This is mainly intended to find inline code. The result will tell you which of your files have embedded JavaScript code and will show you the actual code, too.

##node external

*node external* will look for script tags referencing external files not found in your app's directory.


##And that's all!

Feel free to change the code.

Don't forget to stablish your settings modifying the config.js file.

Cheers!



