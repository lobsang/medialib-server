var async = require( 'async' );
var EntityStore = require( './couch' ).EntityStore;
var entities = require( './entities' );
var inherits = require( 'util' ).inherits;
var EventEmitter = require( 'events' ).EventEmitter;
var decapitaliseFirstLetter = require( '../util/strings' ).decapitaliseFirstLetter;
var partial = require( '../util/functions' ).partial;
var Assert = require( '../util/assert' ).Assert;
var util = require( 'util' );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

var triggers = [ {
   // Create artist (if necessary) and update relationships
   'songCreated': function( mediaLibrary, songEntity, callback ) {
      var artist = { name: songEntity.value.artist };
      mediaLibrary.createEntity( entities.types.Artist, artist, [songEntity], callback );
   }
}, {
   // Create album (if necessary) and update relationships
   'songCreated': function( mediaLibrary, songEntity, callback ) {
      var album = { title: songEntity.value.album };
      mediaLibrary.createEntity( entities.types.Album, album, [songEntity], callback );
   }
} ];

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Plugins offer additional features and are not part of the core media library.
//
// Plugins do not participate in the the request lifecycle. They are usually triggered by a side effect
// induced by a request, but they are independent of the request processing pipeline. 
var coverFinderPlugin = {
   'albumCreated': function( mediaLibrary, album ) {
      // Here be Dragons
   }
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * @constructor
 */
function MediaLibrary( conf ) {   
   this.conf = conf;
   return this;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

inherits( MediaLibrary, EventEmitter );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

MediaLibrary.prototype.addPlugin = function( plugin ) {
   var self = this;
   Object.keys( plugin ).forEach( function( key ) {
      self.on( key, plugin[ key ] );
   } );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

MediaLibrary.prototype.start = function( whenStartedCallback ) {
   this.entityStore = new EntityStore( this.conf.couch );
   this.entityStore.start( whenStartedCallback );
   
   var self = this;
   this.entityStore.on( 'entityCreated', function( entity, callback ) {

      var specificEventName = decapitaliseFirstLetter( entity.type ) + 'Created';

      // The specific events are mostly intended for plugins
      self.emit( specificEventName, self, entity );

      var triggerFunctions = [];
      triggers.forEach( function( trigger ) {
         var triggerFn = trigger[ specificEventName ];
         if( triggerFn ) {
            triggerFunctions.push( partial( triggerFn, self, entity ) );
         };
      } );

      async.series( triggerFunctions, function( err ) {
         callback( err );
      } );
      
   } );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates an entity for the given value, unless there already exists a value equal to the given one in the
 * media library. In that case the entity corresponding to the equal value will be passed to the given 
 * callback.
 * 
 * @param array {Array.<Object>} entities to associate with the newly created entity
 */
MediaLibrary.prototype.createEntity = function( entityType, value, relatedEntities, callback ) {

   var entityStore = this.entityStore;
   
   var associate = entities.associate;
   async.waterfall( [
      function( callback ) {
         entityType.fromValue( value, callback );
      },
      function( entity, callback ) {
         entityStore.findEqualOrCreate( entity, callback );
      },
      function( entities, callback ) {
         
         // Due to the implementation of the media library equal items are always merged on creation and thus
         // there will never be two equal entities in the entity store.
         Assert.that( entities.length ).is( 1 );
         
         var all = entities.concat( relatedEntities );
         associate.apply( null, all );
         entityStore.save( all, function( err, savedEntities ) {
            
            callback( err, err || savedEntities[ 0 ] );
            
         } );
            
      }
   ], function( err, entity ) {
      callback( err, err || entity );
   } );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Calls the given callback with an array of all entities matching the given query.
 * 
 * @example
 * lib.search( { entityID: 'urn:artist:xyz' } )
 * lib.search( { entityType: type.Song } )
 * lib.search( { entityType: type.Album, relatedEntity: aSongEntity } )
 */
MediaLibrary.prototype.search = function( query, callback ) {
   
   if( query.entityType && query.relatedEntity ) {
      var rel = entities.structuralRelationshipTo( query.relatedEntity );
      this.entityStore.findByTypeAndRelationship( query.entityType, rel, callback );
   }
   else if( query.entityType ) {
      this.entityStore.findByType( query.entityType, callback );
   }
   else if( query.entityID ) {
      this.entityStore.getByEntityID( query.entityID, function( err, entity ) {
         callback( err, [ entity ] );
      } );
   }
   else {
      callback( util.format( 'query not supported: %j', query ) );      
   }
   
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.MediaLibrary = MediaLibrary;
