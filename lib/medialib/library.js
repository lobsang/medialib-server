var EntityStore = require( './couch/backend' ).EntityStore,
   async = require( 'async' ),
   events = require( 'events' ),
   util = require( 'util' );

var Enumerable = require( '../vendor/linq.js/linq.js' ).Enumerable;
var ContentType = require( './content_types' ).ContentType;
var StatusCode = require( './status_codes' ).StatusCode;

/**
 * What is my domain?
 * 
 * Use Case: Client scans user music files. Client sends each song to server with the intention of creating
 *           a song resource on the server.
 *           
 *           Server stores songs. Server also creates corresponding album and artist resources on the fly or
 *           updates existing resources with new song. Server responds to client request with song
 *           representation which contains links to all participating artists and all albums it is part of.
 * 
 * --> The server builds a relationship graph involving songs, artists and albums by intelligently creating
 *     resources and inferring relationships.
 * 
 */

/**
 * To REST or not to REST, or how much to REST?
 * 
 * Where is the dividing line between the media library (i.e. the programmatic interface) and the web service?
 * Is it really useful to distinguish between both? It will probably only lead to an indirection between HTTP
 * specific concepts (HTTP headers, Content Types, etc.), REST concepts (verbs, idempotent and safe
 * operations, etc.) and media library concepts (i.e. domain specific requests [additional and/or different
 * verbs] and domain specific responses). What IS the domain, anyways? Isn't it actually creating and querying
 * resources? What are the behavioral semantics contained within the media library? Where do those semantics
 * arise within the REST-API anyways? Which expresses my semantics, the hypermedia, the content types, or both
 * combined? How do the REST verbs play into this?
 * 
 * As I understand it right now the REST verbs play a big role for performance and scalability. They do not
 * offer an intrinsic value with respect to API design. Or do they? Their semantics are well understood and
 * obviously influence API design.
 * 
 * Right now I feel I should embrace both REST and HTTP and should not try to isolate the core library from
 * REST and HTTP particulars. Then again I feel, that REST has more influence on my design (because it
 * actually constrains my domain to four verbs), where HTTP is more influencing of the implementation (whether
 * some information is part of the headers or part of the body).
 * 
 * 
 * 
 */


/**
 * To get our vocabulary straight:
 * 
 * A song is a bunch of meta data for a playable item of music. This bunch of meta data gains its resource
 * semantics simply by virtue of having its own unique identity and being somehow addressable and thus
 * susceptible to inspection and manipulation by interested clients.
 * 
 * Then we have the canonical representation of a song. This is a JavaScript object which is used in code
 * to carry the bunch of meta data around. From that canonical representation, one representation 
 * (serialization, really) for each supported data format can be derived.
 * 
 * As such, this part of the code only cares for the application/Song part of the application/Song+json
 * content type.
 * 
 * Within this layer there is also the song record, a container for a song which apart from the song itself,
 * also contains meta data pertaining to the song resource (its identity, a hash for equal comparisons, etc.).
 * 
 * The canonical song representation is derived from this record by applying a transformation which mixes part
 * of the resource meta data into the song representation for the purpose of achieving hypermediality.
 * 
 * The transformation basically goes like this: song -> record(songMeta, song) -> song'.
 * In words: Client puts song, Library wraps it in a song record and generates meta data. Enriches the song
 * with links of related resources and possible actions to be performed on it. Sends a serialization of that
 * back to the client.
 */


/**
 * TODO: How does all of this belong together?
 *       
 * Content Type, Resource, Song, Artist, Response, Representation, Validator, Route
 * linkify, delinkify, create, get, validate, 
 *
 * getSongByID( id ): Returns a representation? of the song resource identified by the given id
 * createSong( songFromClient )
 * createSongResponse( statusCode, songRecord ) -> songRepresentation?
 * SongResource.linkifiedSong() -> songForClient
 */




/**
 * Event which is triggered when a song record has been created.
 * 
 * @name MediaLibrary#songRecordCreated
 * @event
 * @param {Object} record
 */

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
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
