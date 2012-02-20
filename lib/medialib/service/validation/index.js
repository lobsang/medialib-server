var orderly = require( 'orderly' ),
         fs = require( 'fs' ),
 jsonschema = require( 'json-schema' ),
       path = require( 'path' ),
ContentType = require( '../content_types' ).ContentType;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

var validators = {};
Object.keys( ContentType ).forEach( function( contentType ) {
   
   try {
      var orderlySpec = fs.readFileSync( path.join( __dirname, contentType + '.orderly' ), 'utf8' );
   }
   catch( ex ) {
      return;
   }
   
   var schema = orderly.parse( orderlySpec );
   
   var validator = function( representation ) {
      return jsonschema.validate( representation, schema );
   };
   
   validators[ contentType ] = validator;
   validators[ ContentType[ contentType ] ] = validator;
   
} );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.validators = {
   /**
    * @param contentType
    * @returns the validator function for the given content type, or undefined if no validator available
    */
   getByContentType: function( contentType ) {
      return validators[ contentType ];
   }
};
