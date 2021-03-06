var async = require( 'async' );
var EntityStore = require( './couch' ).EntityStore;
var entities = require( './entities' );
var inherits = require( 'util' ).inherits;
var EventEmitter = require( 'events' ).EventEmitter;
var decapitaliseFirstLetter = require( '../util/strings' ).decapitaliseFirstLetter;
var Assert = require( '../util/assert' ).Assert;
var util = require( 'util' );
var streaming = require( './streaming' );
var functions = require( '../util/functions' );

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

function mediaTypeForFileFormat( format ) {

   if( format.toLowerCase() === 'mp3' ) {
      return 'audio/mpeg';
   }

   throw util.format( "No media type registered for file format '%s'", format );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * @constructor
 */
function MediaLibrary( conf ) {   
   this.conf = conf;
   this.streamer = streaming;
   
   this.plugins = [];
   return this;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

inherits( MediaLibrary, EventEmitter );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Adds a plugin to this library and activates it.
 */
MediaLibrary.prototype.addPlugin = function( plugin ) {
   
   this.plugins.push( plugin );
   plugin.activate( this );

};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

MediaLibrary.prototype.start = function( whenStartedCallback ) {
   var entityStore = new EntityStore( this.conf.couch );
   this.entityStore = entityStore;
   
   var startEntityStore = function( callback ) {
      entityStore.start( callback );
   };
   
   var createLibraryEntity = function( callback ) {
      
      entities.types.Library.fromValue( {
         name: 'default',
         created: Date.now()
      }, function( err, libraryEntity ) {
         entityStore.findIdenticalOrCreate( libraryEntity, callback );
      } );

   };
   
   async.series( [startEntityStore, createLibraryEntity], whenStartedCallback );

   var self = this;
   this.entityStore.on( 'entityCreated', function( entity, callback ) {

      var specificEventName = decapitaliseFirstLetter( entity.type ) + 'Created';

      // The specific events are mostly intended for plugins
      self.emit( specificEventName, self, entity );

      var triggerFunctions = [];
      triggers.forEach( function( trigger ) {
         var triggerFn = trigger[ specificEventName ];
         if( triggerFn ) {
            triggerFunctions.push( functions.partial( triggerFn, self, entity ) );
         };
      } );

      async.series( triggerFunctions, function( err ) {
         callback( err );
      } );
      
   } );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

MediaLibrary.prototype.stop = function( callback ) {
   this.entityStore.stop( callback );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates an entity for the given value, unless there already exists a value equal to the given one in the
 * media library. In that case the entity corresponding to the equal value will be passed to the given 
 * callback.
 * 
 * @public 
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
 * @public 
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

/**
 * @public 
 */
MediaLibrary.prototype.playStream = function( mediaFileEntity, options, writeStream, callback ) {
   
   var mediaFile = mediaFileEntity.value;
   
   // Transcoding would just be a stream transformer (probably pipe bytes from streamer into separate
   // transcoding process and pipe process stdout into the response.
   
   if( options.transformer === 'identity' ) {
      return this.streamer.open( mediaFile.url, function( err, data ) {
         
         if( err ) {
            return functions.callback( callback, err );
         }
         
         data.pipe( writeStream );
         
         if( callback ) {
            data.on( 'end', callback ).on( 'error', callback );
         }

      } );  
   }
   
   throw util.format( "Unsupported transformer '%s'", options.transformer );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * @public 
 */
MediaLibrary.prototype.getAvailableStreamingOptions = function( mediaFileEntity ) {

   var mediaFile = mediaFileEntity.value;
   
   // Query all transcoders for options.
   var options = [ {
      transformer: 'identity',
      mediaType: mediaTypeForFileFormat( mediaFile.format )
   } ];

   return options;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.MediaLibrary = MediaLibrary;
