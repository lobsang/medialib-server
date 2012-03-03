var designs = require( './designs' ),
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

EntityStore.prototype.stop = function( callback ) {
   if( this.conf.destroyDataBaseWhenStopping ) {
      return self.db.destroy( callback );
   }
   
   callback();
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

EntityStore.prototype.create = function( entity, callback ) {
   
   var self = this;
   // It's only an implementation choice, that entityID is our document id
   this.db.save( entity.self, entity, function onSave( err, couchResponse ) {

      if( err ) {
         callback( err );  
      }
         
      entity._id = couchResponse.id;
      entity._rev = couchResponse.rev;
      
      var listeners = [];
      self.listeners( 'entityCreated').forEach( function( listener ) {
         listeners.push( partial( listener, entity ) );
      } );
      
      async.parallel( listeners, function( err ) {
         callback( null, entity );
      } );

   } );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

EntityStore.prototype.findByTypeAndRelationship = function( entityType, rel, callback ) {
   this._view( 'all/selection', { key: [ entityType.name, rel.target ] }, callback );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

EntityStore.prototype.findByType = function( entityType, callback ) {
   // {} is a high key sentinel (i.e. ZZZZZZZZ... < {} holds true)
   this._view( 'all/equality', { startkey: [ entityType.name ], endkey: [entityType.name, {}], include_docs: true }, callback );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Searches for entities which are equal to the given one.
 */
EntityStore.prototype.findEqual = function( entity, callback ) {
   this._view( 'all/equality', { key: [ entity.type, entity.hash ], include_docs: true }, callback );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

EntityStore.prototype.findIdenticalOrCreate = function( entity, callback ) {
   
   var self = this;
   this.getByEntityID( entity.self, function( err, couchEntity ) {
      
      if( err && err.error !== 'not_found' ) {
         return callback( err );
      }
      
      if( couchEntity ) {
         return callback( null, couchEntity );
      }
      
      self.create( entity, callback );
      
   } );
   
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Searches the entity store for entities equal to the given one. If one or more equal entities are found, the
 * callback will be invoked with an array containing the entities.
 * 
 * If no equal entities are found, the given entity will be added to the entity store and the callback be
 * invoked with an array, containing only the single new entity.
 */
EntityStore.prototype.findEqualOrCreate = function( entity, callback ) {
   var self = this;
   this.findEqual( entity, function( err, entities ) {

      if( entities.length === 0 ) {
         self.create( entity, function( err, entity ) {
            
            callback( err, err || [entity] );
            
         } );
      }
      else {
         
         callback( err, err || entities );

      }
    
   } );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

EntityStore.prototype.save = function( entity, callback ) {
   
   var bulk = entity.concat !== undefined;
   
   Assert.that( bulk || entity._id ).is( true );
   
   this.db.save( entity, function( err, couchResponse ) {
      
      if( err ) {
         callback( err );
      }
      
      var update = function( entity, storeEntity ) {
         entity._id = storeEntity.id;
         entity._rev = storeEntity.rev;
      };
         
      if( !bulk ) {
         update( entity, couchResponse );
      }
      else {
         
         for( var i = 0; i < entity.length; i++ ) {
            update( entity[ i ], couchResponse[ i ] );
         }
         
      }

      callback( null, entity );
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

/**
 * @private
 */
EntityStore.prototype._view = function( name, options, callback ) {
   this.db.view( name, options, function( error, table ) {
      if ( error ) {
         callback( error );
         return;
      }
// console.log("%j", table);
      if( table.doc ) {
         callback( null, [ table.doc ] );
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