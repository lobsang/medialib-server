var async = require( 'async' );
var ContentType = require( '../content_types' ).ContentType;
var contentTypeToEntityType = require( '../content_types' ).contentTypeToEntityType;
var StatusCode = require( '../status_codes' ).StatusCode;
var partial = require( '../../util/functions' ).partial;
var validators = require( '../validation' ).validators;

//TODO: Scrub out links/actions properties before saving any entities (they are purely a part of the
//representations sent to the client).

exports.errorHandler = function( err, request, response, next ) {

   console.error( 'Error during request processing: %j', err );
   
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

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function handleCreate( resourceType, request, response ) {
   
   var mediaLibrary = request.context.mediaLibrary;
   
   var createEntity = function( callback ) {
      
      var contentType = request.headers[ 'content-type' ];
      var entityType = contentTypeToEntityType( contentType );
      
      var parentEntities = {
         song: request.song,
      };
      
      mediaLibrary.createEntity( entityType, request.body, parentEntities, callback );
   };
   
   var emitResponse = function( entity, callback ) {
      
      resourceType.linkify( request, entity, function( err, value ) {

         response.contentType( resourceType.contentType );
         response.send( JSON.stringify( value ), StatusCode.Created );
     
      } );
   };
   
   async.waterfall( [ createEntity, emitResponse ], function( err, result ) {
      
      if( !err ) {
         onComplete( null, result );
         return;
      }
     
      console.error( err );
      console.trace();
      
      emitInternalServerError( request, response );
   } );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function handleShow( resourceType, request, response ) {
   
   response.contentType( resourceType.contentType );
   response.send( JSON.stringify( request.entities[ resourceType.contentType ].value ), StatusCode.Ok );

};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function handleLoad( resourceType, request, id, callback ) {
   request.context.entityStore.getByEntityID( id, function( err, entity ) {
      
      if( !err ) {
         if( !request.entities ) {
            request.entities = {};
         }
 
         request.entities[ resourceType.contentType ] = entity;
      }
      
      callback( err, err || entity );
   } );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Performs validation on POST and PUT requests according to content type.
 */
exports.validationMiddleware = function( request, response, next ) {
   
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

var LibraryResourceType = require( './library' ).LibraryResourceType;
exports.Library = {
   load: function( request, id, callback ) {

      if( !request.entities ) {
         request.entities = {};
      }

      // The library resource is virtual, thus its corresponding entity is always the same.
      var entity = { value: {} };
      
      // Requirement for show implementation
      request.entities[ ContentType.Library ] = entity;
      
      callback( null, entity );
   },
   index: function( request, response ) {
      // The library resource collection is virtual. Always forward to the one media library (also virtual).
      response.redirect( request.context.address.libraries.show( { self: '0' } ) );
   },
   show: partial( handleShow, LibraryResourceType )

};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

var SongResourceType = require( './song' ).SongResourceType;
exports.Song = {
   show: partial( handleShow, SongResourceType ),
   create: partial( handleCreate, SongResourceType ),
   load: partial( handleLoad, SongResourceType )
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

var MediaFileResourceType = require( './media_file' ).MediaFileResourceType;
exports.MediaFile = {
   show: partial( handleShow, MediaFileResourceType ),
   create: partial( handleCreate, MediaFileResourceType ),
   load: partial( handleLoad, MediaFileResourceType )
};
