var songRecordDesign = require( './designs' ), 
              crypto = require( 'crypto' ),
             couchdb = require( 'felix-couchdb' ),
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

   var client = couchdb.createClient( this.conf.port, this.conf.host );
   
   this.db = client.db( this.conf.db );

   var self = this;
   var updateSongsViews = function( callback ) {
      self.db.updateDesign( 'songs', songRecordDesign, callback );
   };

   async.series( [updateSongsViews], function onError( error ) {
      if ( !error ) {
         console.log( 'Successfully initialized designs.' );
      }
      
      whenStartedCallback( error );
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
      self.db.saveDoc( recordId, record, callback );
   };

   function whenWaterfallFinished( err ) {
      
      if( !err ) {
         whenPersistedCallback();
         return;
      }
      
      if ( err.error === 'conflict' ) {
         
         var retrieveSongRecord = function( callback ) {
            self.db.getDoc( recordId, callback );
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

couchdb.Db.prototype.getDesign = function( design, cb ) {
  if ( typeof design == 'object' ) {
    return this.getDoc( design._id, cb );
  }

  return this.getDoc( '_design/' + design, cb );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

couchdb.Db.prototype.updateDesign = function( name, design, callback ) {
   
   var self = this;
   this.getDesign( name, function( error, couchDesign ) {
      if ( error ) {

         // not found is okay, in this case we create it
         if ( error.error !== 'not_found' ) {
            error.action = format( "Getting design '%s'.", 'artists' );
            callback( error );
            return;
         }

         couchDesign = {};
      }
      
      // TODO: reuse (mixin, extend)
      for( var designPart in design ) {
         couchDesign[ designPart ] = design[ designPart ];
      }
      
      self.saveDesign( name, couchDesign, function( error, data ) {
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