var designs = require( './designs' ), 
     crypto = require( 'crypto' ),
     cradle = require( 'cradle' ),
     extend = require( '../util/objects' ).extend,
    partial = require( '../util/functions' ).partial,
      async = require( 'async' );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * 
 * @param {!Object} conf the configuration
 * @config {!string} [host] The host of the couch to connect to.
 * @config {!number} [port] The port of the couch to connect to.
 * @config {!string} [db] The name of the database to use.
 */
function Backend( conf ) {
   this.conf = conf;
   return this;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
 
Backend.prototype.start = function( whenStartedCallback ) {

   var client = new cradle.Connection( this.conf.host, this.conf.port, {
      cache: true,
      raw: false
   } );
   
   this.db = client.database( this.conf.db );
   this.db.updateDesign = partial( updateDesign, this.db );
   
   var self = this;
   
   var createDatabase = function( callback ) {
      
      self.db.exists( function( err, exists ) {
         
         if( err ) {
            callback( err );
            return;
         }
         
         if( exists ) {
            callback();
            return;
         }
         
         self.db.create( callback );
         
      } );

   };
   
   var updateSongsViews = function( callback ) {
      self.db.updateDesign( 'songs', designs.songRecord, callback );
   };

   var updateArtistsViews = function( callback ) {
      self.db.updateDesign( 'artists', designs.artistRecord, callback );
   };
   
   async.series( [createDatabase, updateSongsViews, updateArtistsViews], function onError( error ) {
      if ( !error ) {
         console.log( 'Successfully initialized couchdb backend.' );
      }

      whenStartedCallback( error );
   } );
 
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

Backend.prototype.createArtist = function( song, whenFoundCallback ) {
   
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

Backend.prototype.findArtist = function( song, whenFoundCallback ) {
   
   this.db.view( 'artists/index', { key: song.artist }, function( error, table ) {
      if ( error ) {
         log.error( "Getting view '%s': %j", 'songs/index', error );
         whenRetrievedCallback( error );
         return;
      }
      
      var artists = [];
      table.rows.forEach( function( row ) {
         artists.push( row.value );
      } );

      whenRetrievedCallback( null, artists );
      
   } );
   
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

Backend.prototype.listSongs = function( song, whenRetrievedCallback ) {
   this.db.view( 'songs/index', null, function( error, table ) {
      if ( error ) {
         log.error( "Getting view '%s': %j", 'songs/index', error );
         whenRetrievedCallback( error );
         return;
      }
      
      var songs = [];
      table.rows.forEach( function( row ) {
         songs.push( row.value );
      } );

      whenRetrievedCallback( null, songs );
      
   } );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

Backend.prototype.persistSong = function( song, whenPersistedCallback ) {
   
   var recordId = 'urn:SongRecord:' + crypto.createHash( 'sha1' ).update( song.id ).digest( 'hex' );
   
   var record = {
      type: 'SongRecord',
      entity: song
   };

   var self = this;
   var persistSongRecord = function( callback ) {
      self.db.save( recordId, record, callback );
   };

   function whenWaterfallFinished( err ) {
      
      if( !err ) {
         whenPersistedCallback();
         return;
      }
      
      if ( err.error === 'conflict' ) {
         
         var retrieveSongRecord = function( callback ) {
            self.db.get( recordId, callback );
         };
         
         var updateSongRecord = function( couchRecord, callback ) {
            record._rev = couchRecord._rev;
            callback();
         };
         
         async.waterfall( [retrieveSongRecord, updateSongRecord, persistSongRecord], whenWaterfallFinished );
         
      }

   };

   async.waterfall( [persistSongRecord], whenWaterfallFinished );     
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function getDesign( db, name, callback ) {
  return db.get( '_design/' + name, callback );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function saveDesign( db, name, design, callback ) {
   return db.save( '_design/' + name, design, callback );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function updateDesign( db, name, design, callback ) {

   getDesign( db, name, function( error, couchDesign ) {
      if ( error ) {

         // not found is okay, in this case we create it
         if ( error.error !== 'not_found' ) {
            error.action = format( "Getting design '%s'.", 'artists' );
            callback( error );
            return;
         }

         couchDesign = {};
      }
      
      extend( couchDesign, design );
      
      saveDesign( db, name, couchDesign, function( error, data ) {
         if ( error ) {
            error.action = 'Initializing designs.';
            callback( error );
            return;  
         }

         callback();
         
      } );
   } );
   
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.Backend = Backend;