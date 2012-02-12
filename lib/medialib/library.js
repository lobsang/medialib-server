var crypto = require( 'crypto' ),
   Backend = require( './couch/backend' ).Backend,
   async = require( 'async' ),
   events = require( 'events' ),
   validateSong = require( './validation' ).validateSong;

/**
 * Event which is triggered when a song resource has been created.
 * 
 * @name MediaLibrary#songCreated
 * @event
 * @param {Object} song
 */

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * @enum {string}
 */
ContentType = {
   Song: 'application/de.mlehmacher.medialib.Song+json',
   Error: 'application/de.mlehmacher.medialib.Error+json',
   'songs': 'application/de.mlehmacher.medialib.Songs+json',
   'entityAdded': 'application/de.mlehmacher.medialib.EntityAdded+json'
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
MediaLibrary.prototype.addSong = function( song, whenSongAdded ) {
   
   var library = this;
   var whenWaterfallFinished = function( err, result ) {

      if( !err ) {
         whenSongAdded( null, result );
         return;
      }
     
      console.error( err );
      
      var error = library.createErrorResponse( StatusCode.InternalServerError, {} );
      
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
   else {
      song.id = this.idForSong( song );
   }
   
   // Persist song
   async.waterfall( [
      function( callback ) {
         library.backend.persistSong( song, callback );
      },
//      function( callback ) {
//         library.backend.findArtist( song.artist, callback );
//      },
//      function( artist, callback ) {
//         if( artist ) {
//            callback( artist );
//         }
//         else {
//            artist = {
//               
//               name: song.name,
//            };
//            
//            artist.id = library.idForArtist( artist );
//
//            library.backend.persistArtist( artist, callback );
//         }
//         
//         song.addLink( 'artist', artist.fetchURL() );
//      },
      function( callback ) {
         
         library.emit( 'songCreated', song );
         
         callback( null, {
            statusCode: StatusCode.Created,
            headers: {
               contentType: ContentType.Song
            },
            body: JSON.stringify( song )
         } );
      }
      
   ], whenWaterfallFinished );
   
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

MediaLibrary.prototype.createErrorResponse = function( statusCode, error )
{
   return  {
      statusCode: statusCode,
      headers: {
         contentType: ContentType.Error
      },
      body: JSON.stringify( error )
   };
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

MediaLibrary.prototype.createRequestContentTypeError = function()
{
   return this.createErrorResponse( StatusCode.UnsupportedMediaType, {
      message: "Unsupported or missing Content-Type"
   } );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

MediaLibrary.prototype.contentTypes = ContentType;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function obfuscateString( string ) {
	return crypto.createHash( 'sha1' ).update( string ).digest( 'hex' );
};

function normalizeString( string ) {
	return string;
};

MediaLibrary.prototype.idForArtist = function( artist ) {
	return 'urn:artist:' + obfuscateString( normalizeString( artist.name ) );
};

MediaLibrary.prototype.idForSong = function( song ) {
	return 'urn:song:' + obfuscateString( normalizeString( song.artist + song.album + song.title ) ); 
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.MediaLibrary = MediaLibrary;
