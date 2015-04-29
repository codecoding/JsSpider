# JsSpider

This is a small utility to search for js references in your files.

You have two different options:
node offline
or 
node inline

node offline will search for all the JS files in your directories and then will try to find all the files of a specified type that contain a reference to any of them

node inline will search for script tags. This is mainly intended to find inline code.

Feel free to change the code in order to search amongst the files of the type you want.
Don't forget to change the root path in offline.js and inline.js too





