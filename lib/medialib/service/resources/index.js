var async = require( 'async' );
var ContentType = require( '../content_types' ).ContentType;
var entityTypeContentType = require( '../content_types' ).entityTypeContentType;
var StatusCode = require( '../status_codes' ).StatusCode;
var partial = require( '../../util/functions' ).partial;
var clone = require( '../../util/objects' ).clone;
var arrays = require( '../../util/arrays' );
var entities = require( '../../library/entities' );
var pluralize = require( '../../util/strings' ).pluralize;
var decapitalize = require( '../../util/strings' ).decapitaliseFirstLetter;

//TODO: Scrub out links/actions properties before saving any entities (they are purely a part of the
//representations sent to the client).

function linkify( request, entity, callback ) {

   var links = [];
   links = links.concat( request.context.nestedResourceLinks() );
   links.push( request.context.resourceSelfLink( entity ) );
   
   var repr = clone( entity.value );
   repr.links = links;
   callback( null, repr );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function loadEntity( request, id, callback ) {
   var mediaLibrary = request.context.mediaLibrary;

   mediaLibrary.search( {
      entityID: id
   }, function( err, entities ) {
      if( err ) {
         return callback( err );
      }
      
      var entity = entities[ 0 ];
      // Nestedness of resources translates into relationship between entities.
      request.context.entities.push( entity );
      
      callback( null, entity );
   } );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function handleIndex( entityType, request, response ) {
   
   // Resource nestedness translates into entity filtering (i.e. song/xyz/artists translates into "load all 
   // artists which are related with song xyz").
   
   var mediaLibrary = request.context.mediaLibrary;
   var relatedEntities = request.context.entities;
   
   mediaLibrary.search( {
      entityType: entityType,
      relatedEntity: arrays.last( relatedEntities )
   }, function( err, entities ) {

      var values = [];
      entities.forEach( function( entity ) {
         
         request.context.entities.push( entity );
         
         linkify( request, entity, function( err, value ) {
            values.push( value );
         } );
         
         request.context.entities.pop();
         
      } );
      
      var items = pluralize( decapitalize( entityType.name ) );
      
      var body = {};
      body[ items ] = values;

      response.contentType( ContentType.MediaLibrary );      
      response.send( JSON.stringify( body ), StatusCode.Ok );
      
   } );

};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function handleCreate( entityType, request, response ) {
   
   var mediaLibrary = request.context.mediaLibrary;
   var createEntity = function( callback ) {

      var relatedEntities = request.context.entities;
      mediaLibrary.createEntity( entityType, request.body, relatedEntities, callback );
   };
   
   var pushToContext = function( entity, callback ) {
      request.context.entities.push( entity );
      callback( null, entity );
   };
   
   var emitResponse = function( entity, callback ) {
      
      linkify( request, entity, function( err, value ) {

         response.contentType( entityTypeContentType( entityType ) );
         response.send( JSON.stringify( value ), StatusCode.Created );
     
      } );
   };
   
   async.waterfall( [ createEntity, pushToContext, emitResponse ], function( err, result ) {
      
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

function handleShow( entityType, request, response ) {
   
   var entity = arrays.last( request.context.entities );

   linkify( request, entity, function( err, value ) {

      response.contentType( entityTypeContentType( entityType ) );
      response.send( JSON.stringify( value ), StatusCode.Ok );
  
   } );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Actions as express-resource understands them.
 */
exports.resourceActions = function( entityType ) {
   return {
      index: partial( handleIndex, entityType ),
      show: partial( handleShow, entityType ),
      create: partial( handleCreate, entityType ),
      load: loadEntity 
   };
};
