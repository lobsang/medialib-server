var ContentType = require( '../content_types' ).ContentType;
var StatusCode = require( '../status_codes' ).StatusCode;
var validators = require( '../validation' ).validators;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.enableCrossOriginResourceSharing = function( req, res, next ) {
   res.header( 'Access-Control-Allow-Origin', '*' );
   res.header( 'Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE' );
   res.header( 'Access-Control-Allow-Headers', 'Content-Type' );

   next();
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Performs validation on POST and PUT requests according to content type.
 */
exports.requestValidator = function( request, response, next ) {
   
   var method = request.method.toUpperCase();
   if( method !== 'POST' && method !== 'PUT' ) {
      next();
      return;
   }
   
   // Missing content type
   var contentType = request.headers[ 'content-type' ];
   if( !contentType ) {
      emitRequestContentTypeError( request, response );
      return;
   }
   
   var validate = validators.getByContentType( contentType );
   
   // Illegal content type
   if( !validate ) {
      emitRequestContentTypeError( request, response );
      return;
   }
   else if( !validate( request.body ) ) {
      emitSchemaValidationError( request, response );      
      return;
   }

   next();
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.errorHandler = function( err, request, response, next ) {

   console.error( 'Error during request processing: %s (json: %j)', err, err );
   
   var statusCode = err.statusCode || ( err.status && StatusCode[ err.status ] ) || 500;
   var accept = request.headers.accept || '';
   if( accept.indexOf( 'json' ) !== -1 ) {

      response.contentType( ContentType.Error );
      
      // Don't send implementation details to the client
      if( statusCode === StatusCode.InternalServerError ) {
         response.send( '{}', statusCode );
      }
      else {
         response.send( JSON.stringify( err ), statusCode );
      }
      
    }
   else {
      // Right now only json is properly supported
      response.send( '', statusCode );
   }
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function emitInternalServerError( request, response ) {
   throw {
      status: 'InternalServerError'
   };
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function emitSchemaValidationError( request, response, details ) {
   throw {
      status: 'Forbidden',
      cause: {
         message: 'JSON schema validation failed. Details are included.',
         details: details
      }
    };
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function emitRequestContentTypeError( request, response ) {
   throw {
      status: 'UnsupportedMediaType',
      cause: {
         message: 'Unsupported or missing Content-Type'
      }
   };
};
