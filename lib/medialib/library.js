var EntityStore = require( './couch/backend' ).EntityStore,
   async = require( 'async' ),
   events = require( 'events' ),
   util = require( 'util' );

var Enumerable = require( '../vendor/linq.js/linq.js' ).Enumerable;
var ContentType = require( './content_types' ).ContentType;
var StatusCode = require( './status_codes' ).StatusCode;


//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * 
 * @constructor 
 * @augments EventEmitter
 */
function MediaLibrary( conf ) {   
   this.conf = conf;
	return this;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

MediaLibrary.prototype.start = function( whenStartedCallback ) {
   this.entityStore = new EntityStore( this.conf.couch );
   this.entityStore.start( whenStartedCallback );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
   
//MediaLibrary.prototype.createArtist = function( artist, onComplete ) {
//
//   var hash = contentHash( artist.name );
//   var record = {
//      type: 'ArtistRecord',
//      entityID: 'urn:artist:' + contentHash( Date.now(), hash ),
//      entityHash: hash,
//      entity: artist
//   };
//   
//};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

// TODO: re-use between getSongById and getArtistByID
//MediaLibrary.prototype.getArtistByID = function( id, callback ) {
//
//   var library = this;
//   this.entityStore.getRecordByEntityID( id, function( err, record ) {
//      
//      if( err ) {
//         console.error( err );
//         library.createInternalServerErrorResponse( err, callback );
//         return;
//      }
//      
//      library.createArtistResponse( StatusCode.Ok, record, callback );
//   } );
//};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

//MediaLibrary.prototype.getMediaURL = function( mediaID, source, callback ) {
//   
//   this.entityStore.getRecordByEntityID( mediaID, function( err, record ) {
//      
//      if( err ) {
//         console.error( err );
//         library.createInternalServerErrorResponse( err, callback );
//         return;
//      }
//      
//      var url = Enumerable.From( record.entity.links )
//         .Where( function( link ) { return link.rel === 'mp3' && link.url.toLowerCase().indexOf( source + '://' ) === 0; } )
//         .Select( function( link ) { return link.url; } )
//         .First();
//      
//      console.log( 'url: %s', url );
//      
//      callback( null, url );
//      
//   } );
//   
//};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

MediaLibrary.prototype.contentTypes = ContentType;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.MediaLibrary = MediaLibrary;
