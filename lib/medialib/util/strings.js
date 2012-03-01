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

var pluralizers = [ {
   matcher: new RegExp( '([^aeiouy]|qu)y$', 'i' ),
   replacement: '$1ies'
}, {
   matcher: new RegExp('(x|ch|ss|sh)$', 'i'),
   replacement: '$1es'
}, {
   matcher: new RegExp( '$', 'i' ),
   replacement: 's'
} ];
           
function pluralize( substantive ) {
   for( var i = 0; i < pluralizers.length; i++ ) {
      if( substantive.match( pluralizers[ i ].matcher ) ) {
         return substantive.replace( pluralizers[ i ].matcher, pluralizers[ i ].replacement );
      }
   }
   
   return substantive;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * @example
 * 
 * var name = 'Dieter';
 * new RegExp( "^Hallo " + quote( name ) );
 */
function quoteForRegExp( string ) {
   return string.replace( /(?=[\/\\^$*+?.()|{}[\]])/g, "\\" );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.canonicalize = canonicalize;
exports.contentHash = contentHash;
exports.obfuscate = obfuscate;
exports.decapitaliseFirstLetter = decapitaliseFirstLetter;
exports.pluralize = pluralize;
exports.quoteForRegExp = quoteForRegExp;
