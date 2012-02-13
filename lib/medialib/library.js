var crypto = require( 'crypto' ),
   Backend = require( './couch/backend' ).Backend,
   async = require( 'async' ),
   events = require( 'events' ),
   validateSong = require( './validation' ).validateSong;

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
 * 
 * A song is an atomic, playable item of music within the media library. It is reified as a resource. The 
 * resource has one canonical representation (a JavaScript object) from which one representation for each
 * supported content type is derived.
 * 
 * TODO: Or is the resource the JavaScript object (linkified song)? Or is the SongRecord the Resource? If
 *       yes, rename to SongResource? Or is the SongRecord a Meta-Resource? I think it is that. Song and
 *       SongRecord are both resources from different point of views (service client and couchdb client).
 *       
 * Content Type, Resource, Song, Artist, Response, Representation
 * linkify, create, get
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
 * @enum {string}
 */
ContentType = {
   Song: 'application/de.mlehmacher.medialib.Song+json',
   Error: 'application/de.mlehmacher.medialib.Error+json',
   Library: 'application/de.mlehmacher.medialib.Library+json',
};

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

MediaLibrary.prototype = new events.EventEmitter();

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
   
   var check = validateSong( song );
   if( !check.valid ) {
      var error = library.createErrorResponse( StatusCode.Forbidden, {
         type: 'jsonSchemaValidation',
         errors: check.errors
       } );
       
       onComplete( null, error );
       return;
   }

   var hash = contentHash( song.title, song.artist, song.album ); 
   var record = {
      type: 'SongRecord',
      entityID: 'urn:song:' + contentHash( Date.now(), hash ),
      entityHash: hash,
      entity: song
   };

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
      var error = library.createInternalServerErrorResponse( err );
      onComplete( null, error );
   } );
   
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

// TODO: re-use between getSongById and getArtistByID
MediaLibrary.prototype.getArtistByID = function( id, callback ) {

   var library = this;
   this.backend.getRecordByEntityID( id, function( err, record ) {
      
      if( err ) {
         console.error( err );
         var error = library.createInternalServerErrorResponse( err );
         callback( null, error );
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
         var error = library.createInternalServerErrorResponse( err );
         callback( null, error );
         return;
      }
      
      library.createSongResponse( StatusCode.Ok, record, callback );
   } );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

// TODO: make async
MediaLibrary.prototype.createLibraryResponse = function() {
  
   // TODO: encapsulate url generation

   var library = {
      links: [
         { rel: 'songs', url: this.baseURL + '/songs' }
      ]
   };
   
   return {
      statusCode : StatusCode.Ok,
      headers : {
         contentType : ContentType.Library
      },
      body : JSON.stringify( library )
   };
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * When complete, passes a clone of the song from the record to the given callback. 
 */
MediaLibrary.prototype.linkifySong = function( record, onComplete ) {
   
   // TODO: clone function
   var song = JSON.parse( JSON.stringify( record.entity ) );
   
   // TODO: encapsulate url generation
   song.links.push( {
      rel : 'self',
      url : this.baseURL + '/songs/' + record.entityID
   } );
      
//   async.series( [requireArtists, requireAlbums], function( err, artists, albums ) {
//      
//      
//      
//   } );
   
   onComplete( null, song );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

MediaLibrary.prototype.createSongResponse = function( statusCode, songRecord, onComplete ) {

   this.linkifySong( songRecord, function( err, song ) {
      onComplete( err, song && {
         statusCode : statusCode,
         headers : {
            contentType : ContentType.Song
         },
         body: JSON.stringify( song )
      } );
   } );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

// TODO: make async
MediaLibrary.prototype.createErrorResponse = function( statusCode, error ) {
   return  {
      statusCode: statusCode,
      headers: {
         contentType: ContentType.Error
      },
      body: JSON.stringify( error )
   };
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

// TODO: make async
MediaLibrary.prototype.createInternalServerErrorResponse = function() {
   return this.createErrorResponse( StatusCode.InternalServerError, {} );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

// TODO: make async
// TODO: rename to createRequestContentTypeErrorResponse
MediaLibrary.prototype.createRequestContentTypeError = function() {
   return this.createErrorResponse( StatusCode.UnsupportedMediaType, {
      message: "Unsupported or missing Content-Type"
   } );
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
