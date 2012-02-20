var designs = require( './designs' ), 
     crypto = require( 'crypto' ),
     cradle = require( 'cradle' ),
     extend = require( '../../util/objects' ).extend,
    partial = require( '../../util/functions' ).partial,
      async = require( 'async' ),
     format = require( 'util' ).format,
     inherits = require( 'util' ).inherits,
     EventEmitter = require( 'events' ).EventEmitter,
     Assert = require( '../../util/assert' ).Assert;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * 
 * @param {!Object} conf the configuration
 * @config {!string} [host] The host of the couch to connect to.
 * @config {!number} [port] The port of the couch to connect to.
 * @config {!string} [db] The name of the database to use.
 */
function EntityStore( conf ) {
   EventEmitter.call( this );
   
   this.conf = conf;
   return this;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

inherits( EntityStore, EventEmitter );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
 
EntityStore.prototype.start = function( whenStartedCallback ) {

   var client = new cradle.Connection( this.conf.host, this.conf.port, {
      cache: true,
      raw: false
   } );
   
   this.db = client.database( this.conf.db );

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
   
   var updateViews = function( callback ) {

      async.series( [
         partial( updateDesign, self.db, 'all', designs.all )
      ], callback );
      
   };

   async.series( [createDatabase, updateViews], function onError( error ) {
      if ( !error ) {
         console.log( 'Successfully initialized couchdb backend.' );
      }

      whenStartedCallback( error );
   } );
 
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

EntityStore.prototype.create = function( entity, callback ) {
   
   var self = this;
   // It's only an implementation choice, that entityID is our document id
   this.db.save( entity.self, entity, function onSave( err, couchResponse ) {

      if( !err ) {
         entity._id = couchResponse.id;
         entity._rev = couchResponse.rev;
         
         self.emit( 'entityCreated', entity );
      }
      
      callback( err, err || entity );
   } );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Searches for entities which are equal to the given one.
 */
EntityStore.prototype.findEqual = function( entity, callback ) {
   this.db.view( 'all/equality', { key: [ entity.type, entity.hash ], include_docs: true }, function( error, table ) {
      if ( error ) {
         callback( error );
         return;
      }
      
      var entities = [];
      table.rows.forEach( function( row ) {
         entities.push( row.doc );
      } );
      
      callback( null, entities );
   } );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

EntityStore.prototype.save = function( entity, callback ) {
   Assert.that( entity._id ).isDefined();
   
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