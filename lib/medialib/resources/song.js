var ContentType = require( '../content_types' ).ContentType;
var StatusCode = require( '../status_codes' ).StatusCode;
var contentHash = require( '../util/strings' ).contentHash;
var ErrorResource = require( './error' ).ErrorResource;
var async = require( 'async' );
var Resource = require( './resource' ).Resource;
var inherits = require( 'util' ).inherits;
var partial = require( '../util/functions' ).partial;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function SongResource() {
   this.constructor.super_.apply( this, arguments );
   return this;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

inherits( SongResource, Resource );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

SongResource.CONTENT_TYPE = ContentType.Song;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Called when the given song has been added successfully or an error occured.
 * 
 * @name WhenSongAddedCallback
 * @function
 * @param {?Object} [error]
 * @param {!Object=} [result] the result or <code>undefined</code> in case of error
*/

/**
 * @param {!Object} song The song to add/create. 
 * @param {!WhenSongAddedCallback} whenSongAdded The callback.
 */
SongResource.handleCreate = function( context, song, onComplete ) {

   var hash = contentHash( song.title, song.artist, song.album ); 
   var entity = {
      type: 'SongRecord',
      entityID: 'urn:song:' + contentHash( Date.now(), hash ),
      hash: hash,
      value: song
   };

   var saveRecord = function( callback ) {
      context.entityStore.create( entity, callback );
   };
   
   var triggerEvent = function( entity, callback ) {
      callback( null, entity );
   };
   
   var emitResponse = function( entity, callback ) {
      new SongResource( context, entity ).createResponse( StatusCode.Created, callback );
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

SongResource.handleShow = partial( Resource.handleShow, SongResource );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

SongResource.prototype.linkify = function( song, callback ) {

   song.links = [ {
      rel: 'self',
      url: this._context.address.songs.show( this._entity )
   } ];
   
   callback( null, song );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.SongResource = SongResource;
