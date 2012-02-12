var orderly = require( 'orderly' ),
         fs = require( 'fs' ),
 jsonschema = require( 'json-schema' ),
       path = require( 'path' );

var songOrderly = fs.readFileSync( path.join( __dirname, 'song.orderly' ), 'utf8' );
var songSchema = orderly.parse( songOrderly );

function validateSong( song ) {
   return jsonschema.validate( song, songSchema );
};

exports.validateSong = validateSong;
