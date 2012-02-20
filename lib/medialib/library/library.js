var async = require( 'async' );
var EntityStore = require( './couch' ).EntityStore;
var entities = require( './entities' );
var inherits = require( 'util' ).inherits;
var EventEmitter = require( 'events' ).EventEmitter;
var decapitaliseFirstLetter = require( '../util/strings' ).decapitaliseFirstLetter;
var partial = require( '../util/functions' ).partial;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

var triggers = [ {
   // Create artist (if necessary) and update relationships
   'songCreated': function( mediaLibrary, songEntity, callback ) {
      var entityStore = mediaLibrary.entityStore;
      var artist = { name: songEntity.value.artist };
      
      entities.ArtistType.fromValue( artist, {}, function( err, artistEntity ) {

         entityStore.findEqualOrCreate( artistEntity, function( err, entities ) {

            // Update relationships
            entities.forEach( function( artistEntity ) {
               
               songEntity.artists.push( artistEntity.self );
               artistEntity.songs.push( songEntity.self );
               
            } );
            
            entityStore.save( [songEntity].concat( entities ), callback );
            
         } );
      } );
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
         }
      } );

      async.series( triggerFunctions, function( err ) {
         callback( err );
      } );
      
   } );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

MediaLibrary.prototype.createEntity = function( entityType, value, parentEntities, callback ) {
   
   var entityStore = this.entityStore;
   entityType.fromValue( value, parentEntities, function( err, entity ) {
      
      if( err ) {
         callback( err );
         return;
      }
      
      entityStore.create( entity, function( err, entity ) {
         callback( err, entity );
      } );
      
   } );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.MediaLibrary = MediaLibrary;
