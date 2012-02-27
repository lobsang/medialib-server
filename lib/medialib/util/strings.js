var crypto = require( 'crypto' );

function canonicalize() {
   // Project to ascii character set and convert to lower case
   var repr = Array.prototype.slice.call( arguments, 0 ).join();
   return repr.replace( /[^A-Z0-9]*/gi, '' ).toLowerCase();
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function obfuscate( string ) {
   return crypto.createHash( 'sha1' ).update( string ).digest( 'hex' );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function contentHash() {
   return obfuscate( canonicalize.apply( null, arguments ) );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function decapitaliseFirstLetter( string ) {
    return string.charAt( 0 ).toLowerCase() + string.slice( 1 );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * @example
 * 
 * var name = 'Dieter';
 * new RegExp( "^Hallo " + quote( name ) );
 */
exports.quoteForRegExp = function( string ) {
   return string.replace( /(?=[\/\\^$*+?.()|{}[\]])/g, "\\" );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.canonicalize = canonicalize;
exports.contentHash = contentHash;
exports.obfuscate = obfuscate;
exports.decapitaliseFirstLetter = decapitaliseFirstLetter;
