var async = require( 'async' );
var ContentType = require( '../content_types' ).ContentType;
var contentTypeToEntityType = require( '../content_types' ).contentTypeToEntityType;
var StatusCode = require( '../status_codes' ).StatusCode;
var partial = require( '../../util/functions' ).partial;

//TODO: Scrub out links/actions properties before saving any entities (they are purely a part of the
//representations sent to the client).

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function handleIndex( entityType, resourceType, request, response ) {
   request.context.entityStore.findByType( entityType, function( err, entities ) {
      
      var values = [];
      entities.forEach( function( entity ) {
         
         resourceType.linkify( request, entity, function( err, value ) {
            values.push( value );
         } );
         
      } );
      
      response.contentType( ContentType.LibraryItems );
      response.send( JSON.stringify( { items: values } ), StatusCode.Ok );
      
   } );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function handleCreate( resourceType, request, response ) {
   
   var mediaLibrary = request.context.mediaLibrary;
   
   var createEntity = function( callback ) {
      
      var contentType = request.headers[ 'content-type' ];
      var entityType = contentTypeToEntityType( contentType );
      
      // This is rather brittle, because we have to manually add entities here, whenever we add a nesting
      // level to our resources. It might be better to completely override the express-resource loading
      // mechanism with our own, which magically manages the parent entities for us.
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
      
      throw err;
   } );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function handleShow( resourceType, request, response ) {
   var entity = request.entityPath[ request.entityPath.length - 1 ];
   
   resourceType.linkify( request, entity, function( err, value ) {

      response.contentType( resourceType.contentType );
      response.send( JSON.stringify( value ), StatusCode.Ok );
  
   } );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function handleLoad( resourceType, request, id, callback ) {
   request.context.entityStore.getByEntityID( id, function( err, entity ) {
      
      if( !err ) {
         if( !request.entityPath ) {
            request.entityPath = [];
         }
 
         request.entityPath.push( entity );
      }
      
      callback( err, err || entity );
   } );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

var LibraryResourceType = require( './library' ).LibraryResourceType;
exports.Library = {
   load: function( request, id, callback ) {

      // The library resource is virtual, thus its corresponding entity is always the same.
      var entity = { self: '0', value: {} };
      request.entityPath = [entity];

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

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

var ArtistResourceType = require( './artist' ).ArtistResourceType;
exports.Artist = {
      // TODO: get rid of hardcoded entityTypeName
   index: partial( handleIndex, 'Artist', ArtistResourceType ),
   show: partial( handleShow, ArtistResourceType ),
   load: partial( handleLoad, ArtistResourceType )    
};
