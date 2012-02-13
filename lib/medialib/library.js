var crypto = require( 'crypto' ),
   Backend = require( './couch/backend' ).Backend,
   async = require( 'async' ),
   events = require( 'events' ),
   validateSong = require( './validation' ).validateSong;

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

/**
 * @param {!Object} song The song to add/create. 
 * @param {!WhenSongAddedCallback} whenSongAdded The callback.
 */
MediaLibrary.prototype.createSong = function( song, whenSongAdded ) {
   
   var library = this;
   var whenWaterfallFinished = function( err, result ) {

      if( !err ) {
         whenSongAdded( null, result );
         return;
      }
     
      console.error( err );      
      var error = library.createInternalServerErrorResponse( err );
      whenSongAdded( null, error );
   };
   
   var check = validateSong( song );
   if( !check.valid ) {
      var error = library.createErrorResponse( StatusCode.Forbidden, {
         type: 'jsonSchemaValidation',
         errors: check.errors
       } );
       
       whenWaterfallFinished( null, error );
       return;
   }
   
   // Enforce contract
   if( song.id ) {
      var error = library.createErrorResponse( StatusCode.Forbidden, {
        type: 'constraintViolation',
        message: 'Song.id is determined by the server, must not be send by the client'
      } );
      
      whenWaterfallFinished( null, error );
      return;
   }
   
   var record = {
      type: 'SongRecord',
      hash: contentHash( song.title, song.artist, song.album ),
      entity: song
   };

   // Persist song
   async.waterfall( [
      function( callback ) {
         library.backend.createSongRecord( record, callback );
      },
      function( songId, callback ) {
         
         record.entityId = songId;
         library.backend.saveRecord( record, function() {} );
         library.emit( 'songRecordCreated', record );
         
         // Create canonical hash from song.artist
         // Use that hash to check if an artist with an equal hash already exists
         // If so, add link to artist to song response 
         // If not, create artist
         //   add link to artist to song response
         
         var response = library.createSongResponse( StatusCode.Created, record );
         callback( null, response ); 
      }
      
   ], whenWaterfallFinished );
   
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

MediaLibrary.prototype.getSongById = function( id, callback ) {

   var library = this;
   this.backend.getRecord( id, function( err, songRecord ) {
      
      if( err ) {
         console.error( err );
         var error = library.createInternalServerErrorResponse( err );
         callback( null, error );
         return;
      }
      
      var response = library.createSongResponse( StatusCode.Ok, songRecord );
      callback( null, response ); 
   } );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

MediaLibrary.prototype.createSongResponse = function( statusCode, songRecord ) {

   // TODO: clone method
   var song = JSON.parse( JSON.stringify( songRecord.entity ) );

   // TODO: encapsulate url generation
   song.links.push( {
      rel : 'self',
      url : this.baseURL + '/songs/' + songRecord.entityId
   } );

   return {
      statusCode : statusCode,
      headers : {
         contentType : ContentType.Song
      },
      body : JSON.stringify( song )
   };
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

MediaLibrary.prototype.createInternalServerErrorResponse = function() {
   return this.createErrorResponse( StatusCode.InternalServerError, {} );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
