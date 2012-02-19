var designs = require( './designs' ), 
     crypto = require( 'crypto' ),
     cradle = require( 'cradle' ),
     extend = require( '../util/objects' ).extend,
    partial = require( '../util/functions' ).partial,
      async = require( 'async' ),
     format = require( 'util' ).format;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * 
 * @param {!Object} conf the configuration
 * @config {!string} [host] The host of the couch to connect to.
 * @config {!number} [port] The port of the couch to connect to.
 * @config {!string} [db] The name of the database to use.
 */
function EntityStore( conf ) {
   this.conf = conf;
   return this;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
 
EntityStore.prototype.start = function( whenStartedCallback ) {

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

EntityStore.prototype.listSongs = function( song, whenRetrievedCallback ) {
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

EntityStore.prototype.create = function( entity, callback ) {
   
   // It's only an implementation choice, that entityID is our document id
   this.db.save( entity.entityID, entity, function onSave( err, couchResponse ) {

      if( !err ) {
         entity._id = couchResponse.id;
         entity._rev = couchResponse.rev;
      }
      
      callback( err, err || entity );
   } );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

EntityStore.prototype.findArtist = function( song, onComplete ) {
   
   this.db.view( 'artists/index', { key: song.artist }, function( error, table ) {
      if ( error ) {
         log.error( "Getting view '%s': %j", 'songs/index', error );
         onComplete( error );
         return;
      }
      
      var artists = [];
      table.rows.forEach( function( row ) {
         artists.push( row.value );
      } );

      onComplete( null, artists );
      
   } );
   
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

EntityStore.prototype.save = function( entity, callback ) {
   this.db.save( entity, function( err, couchResponse ) {
      if( !err ) {
         entity._id = couchResponse.id;
         entity._rev = couchResponse.rev;
      }
      
      callback( err, err || entity );
   } );
}; 

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

EntityStore.prototype.getByEntityID = function( entityID, callback ) {
   // It's only an implementation choice, that entityID is our document id
   this.db.get( entityID, function( err, couchResponse ) {
      
      callback( err, couchResponse );
      
   } );
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

exports.EntityStore = EntityStore;