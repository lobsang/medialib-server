var crypto = require( 'crypto' ),
   Backend = require( './couch/backend' ).Backend,
   async = require( 'async' ),
   events = require( 'events' ),
   util = require( 'util' );

var Enumerable = require( '../vendor/linq.js/linq.js' ).Enumerable;
var ContentType = require( './content_types' ).ContentType;
var SongResource = require( './song' ).SongResource;

// TODO: Scrub out links/actions properties before saving any entities (they are purely a part of the
//       representations sent to the client).

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
 * linkifySong( songRecord ) -> songForClient
 */




/**
 * Event which is triggered when a song record has been created.
 * 
 * @name MediaLibrary#songRecordCreated
 * @event
 * @param {Object} record
 */

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * @enum {number}
 */
StatusCode = {
   Ok: 200,
   Created: 201,
   Forbidden: 403,
   UnsupportedMediaType: 415,
   InternalServerError: 500
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * @constructor 
 * @augments EventEmitter
 */
function MediaLibrary( conf ) {
   events.EventEmitter.call( this );
   
   this.conf = conf;
	return this;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

util.inherits( MediaLibrary, events.EventEmitter );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

MediaLibrary.prototype.start = function( whenStartedCallback ) {
   this.backend = new Backend( this.conf.couch );
   this.backend.start( whenStartedCallback );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Called when the given song has been added successfully or an error occured.
 * 
 * @name WhenSongAddedCallback
 * @function
 * @param {?Object} [error]
 * @param {!Object=} [result] the result or <code>undefined</code> in case of error
*/

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

MediaLibrary.prototype._getOrCreateArtist = function( artist, onComplete ) {
   
   
   
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
   
MediaLibrary.prototype.createArtist = function( artist, onComplete ) {

   var hash = contentHash( artist.name );
   var record = {
      type: 'ArtistRecord',
      entityID: 'urn:artist:' + contentHash( Date.now(), hash ),
      entityHash: hash,
      entity: artist
   };
   
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * @param {!Object} song The song to add/create. 
 * @param {!WhenSongAddedCallback} whenSongAdded The callback.
 */
MediaLibrary.prototype.createSong = function( song, onComplete ) {
   
   var library = this;
   console.log( "song: %j", song );

   var hash = contentHash( song.title, song.artist, song.album ); 
   var record = new SongResource( {
      type: 'SongRecord',
      entityID: 'urn:song:' + contentHash( Date.now(), hash ),
      entityHash: hash,
      entity: song
   } );

   var saveRecord = function( callback ) {
      library.backend.createSongRecord( record, callback );
   };
   
   var triggerEvent = function( record, callback ) {
      library.emit( 'songRecordCreated', record );
      callback( null, record );
   };
   
   var emitResponse = function( record, callback ) {

      // Create canonical hash from song.artist
      // Use that hash to check if an artist with an equal hash already exists
      // If so, add link to artist to song response 
      // If not, create artist
      //   add link to artist to song response
      
      library.createSongResponse( StatusCode.Created, record, callback );
   };
   
   async.waterfall( [ saveRecord, triggerEvent, emitResponse ], function( err, result ) {
      
      if( !err ) {
         onComplete( null, result );
         return;
      }
     
      console.error( err );      
      library.createInternalServerErrorResponse( err, onComplete );
   } );
   
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

// TODO: re-use between getSongById and getArtistByID
MediaLibrary.prototype.getArtistByID = function( id, callback ) {

   var library = this;
   this.backend.getRecordByEntityID( id, function( err, record ) {
      
      if( err ) {
         console.error( err );
         library.createInternalServerErrorResponse( err, callback );
         return;
      }
      
      library.createArtistResponse( StatusCode.Ok, record, callback );
   } );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

MediaLibrary.prototype.getSongByID = function( id, callback ) {

   var library = this;
   this.backend.getRecordByEntityID( id, function( err, record ) {
      
      if( err ) {
         console.error( err );
         library.createInternalServerErrorResponse( err, callback );
         return;
      }
      
      library.createSongResponse( StatusCode.Ok, record, callback );
   } );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

MediaLibrary.prototype.createLibraryResponse = function( callback ) {
  
   // TODO: encapsulate url generation

   var library = {
      links: [
         { rel: 'songs', url: this.baseURL + '/songs' }
      ]
   };
   
   var response = {
      statusCode : StatusCode.Ok,
      headers : {
         contentType : ContentType.Library
      },
      body : library
   };
   
   callback( null, response );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

MediaLibrary.prototype.createSongResponse = function( statusCode, songRecord, onComplete ) {

   songRecord.linkifiedSong( this, function( err, song ) {
      onComplete( err, song && {
         statusCode : statusCode,
         headers : {
            contentType : ContentType.Song
         },
         body: song
      } );
   } );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * @private
 */
MediaLibrary.prototype._createErrorResponse = function( statusCode, error ) {
   return  {
      statusCode: statusCode,
      headers: {
         contentType: ContentType.Error
      },
      body: error
   };
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

MediaLibrary.prototype.createSchemaValidationErrorResponse = function( details, callback ) {
   var error = this._createErrorResponse( StatusCode.Forbidden, {
      type: 'jsonSchemaValidation',
      errors: details
    } );
   
   callback( null, error );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

MediaLibrary.prototype.getMediaURL = function( mediaID, source, callback ) {
   
   this.backend.getRecordByEntityID( mediaID, function( err, record ) {
      
      if( err ) {
         console.error( err );
         library.createInternalServerErrorResponse( err, callback );
         return;
      }
      
      var url = Enumerable.From( record.entity.links )
         .Where( function( link ) { return link.rel === 'mp3' && link.url.toLowerCase().indexOf( source + '://' ) === 0; } )
         .Select( function( link ) { return link.url; } )
         .First();
      
      console.log( 'url: %s', url );
      
      callback( null, url );
      
   } );
   
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

MediaLibrary.prototype.createInternalServerErrorResponse = function( cause, callback ) {
   var error = this._createErrorResponse( StatusCode.InternalServerError, {} );
   callback( null, error );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

MediaLibrary.prototype.createRequestContentTypeErrorResponse = function( callback ) {
   var error = this._createErrorResponse( StatusCode.UnsupportedMediaType, {
      message: "Unsupported or missing Content-Type"
   } );
   
   callback( null, error );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

MediaLibrary.prototype.contentTypes = ContentType;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function canonicalize() {
   // Project to ascii character set and convert to lower case
   var repr = Array.prototype.slice.call( arguments, 0 ).join();
   return repr.replace( /[^A-Z0-9]*/gi, '' ).toLowerCase();
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function obfuscate( string ) {
	return crypto.createHash( 'sha1' ).update( string ).digest( 'hex' );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function contentHash() {
   return obfuscate( canonicalize.apply( null, arguments ) );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.MediaLibrary = MediaLibrary;
