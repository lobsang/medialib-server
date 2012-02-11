var crypto = require( 'crypto' ),
   Backend = require( './couch/backend' ).Backend,
   async = require( 'async' ),
   events = require( 'events' );

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
MediaLibrary.ContentType = {
   Song: 'application/de.mlehmacher.medialib.Song+json',
   Error: 'application/de.mlehmacher.medialib.Error+json',
   'songs': 'application/de.mlehmacher.medialib.Songs+json',
   'entityAdded': 'application/de.mlehmacher.medialib.EntityAdded+json'
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * @enum {number}
 */
MediaLibrary.StatusCode = {
   Forbidden: 403,    
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
      
   var whenWaterfallFinished = function( err, result ) {

      if( !err ) {
         whenSongAdded( null, result );
         return;
      }
      
      var error = {
         op: 'SongCreation',
         causes: []
      };
      
      if( err.cause ) {
         error.causes.push( err.cause );
      }
      else {
         error.causes.push( {
            type: 'unknown',
            text: err
         } );
      }
            
      console.error( error );
      
      whenSongAdded( null, {
         statusCode: err.statusCode ? err.statusCode : 500,
         headers: {
            contentType: MediaLibrary.ContentType.Error
         },
         body: JSON.stringify( error )
      } );
   };
   
   // Enforce contract
   if( song.id ) {
      var error = {
        statusCode: MediaLibrary.StatusCode.Forbidden,
        cause: {
           type: 'constraintViolation',
           text: 'Song.id is determined by the server, must not be send by the client'
        }    
      };
      
      whenWaterfallFinished( error );
      
   }
   else {
      song.id = this.idForSong( song );
   }
   
   // Persist song
   var self = this;
   async.waterfall( [
      function( callback ) {
         self.backend.persistSong( song, callback );
      },
//      function( callback ) {
//         self.backend.findArtist( song.artist, callback );
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
//            artist.id = self.idForArtist( artist );
//
//            self.backend.persistArtist( artist, callback );
//         }
//         
//         song.addLink( 'artist', artist.fetchURL() );
//      },
      function( callback ) {
         
         self.emit( 'songCreated', song );
         
         callback( null, {
            statusCode: 201,
            headers: {
               contentType: MediaLibrary.ContentType.Song
            },
            body: JSON.stringify( song )
         } );
      }
      
   ], whenWaterfallFinished );
   
};

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

exports.ContentType = MediaLibrary.ContentType;
exports.MediaLibrary = MediaLibrary;
