var ContentType = require( '../content_types' ).ContentType;
var StatusCode = require( '../status_codes' ).StatusCode;
var contentHash = require( '../util/strings' ).contentHash;
var ErrorResource = require( './error' ).ErrorResource;
var async = require( 'async' );
var Resource = require( './resource' ).Resource;
var inherits = require( 'util' ).inherits;
var partial = require( '../util/functions' ).partial;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function MediaFileResource() {
   this.constructor.super_.apply( this, arguments );
   return this;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

inherits( MediaFileResource, Resource );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

MediaFileResource.CONTENT_TYPE = ContentType.MediaFile;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * @param {!Object} song The song to add/create. 
 * @param {!WhenSongAddedCallback} whenSongAdded The callback.
 */
MediaFileResource.handleCreate = function( context, mediaFile, onComplete ) {

   var hash = contentHash( mediaFile.url ); 
   var entity = {
      type: 'MediaFileEntity',
      entityID: 'urn:mediaFile:' + contentHash( Date.now(), hash ),
      hash: hash,
      value: mediaFile
   };

   var saveRecord = function( callback ) {
      context.entityStore.create( entity, callback );
   };
   
   var triggerEvent = function( entity, callback ) {
      callback( null, entity );
   };
   
   var emitResponse = function( entity, callback ) {
      new MediaFileResource( context, entity ).createResponse( StatusCode.Created, callback );
   };
   
   async.waterfall( [ saveRecord, triggerEvent, emitResponse ], function( err, result ) {
      
      if( !err ) {
         onComplete( null, result );
         return;
      }
     
      console.error( err );
      console.trace();
      ErrorResource.createInternalServerErrorResource( context, err ).createResponse( onComplete );
   } );
   
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

MediaFileResource.handleShow = partial( Resource.handleShow, SongResource );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

MediaFileResource.prototype.linkify = function( song, callback ) {

   song.links = [ {
      rel: 'self',
      url: this._context.address.songs.show( this._entity )
   } ];
   
   callback( null, song );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.MediaFileResource = MediaFileResource;
