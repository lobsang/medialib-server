var async = require( 'async' );
var EntityStore = require( './couch' ).EntityStore;
var noop = require( '../util/functions' ).noop;
var entities = require( './entities' );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * @constructor
 */
function MediaLibrary( conf ) {   
   this.conf = conf;
	return this;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function associateSongWithArtist( entityStore, songEntity, callback ) {
   var artist = { name: songEntity.value.artist };
   
   entities.artistEntityFactory.fromValue( artist, function( err, artistEntity ) {
      artistEntity.songs.push( songEntity.self );
      
      entityStore.findEqual( artistEntity, function( err, entities ) {

         if( entities.length === 0 ) {
            entityStore.create( artistEntity, function( err, artistEntity ) {
               songEntity.artist = artistEntity.self;
               entityStore.save( songEntity, noop );
            } );
         }
         else if( entities.length === 1 ) {
            artistEntity = entities[ 0 ];
            
            songEntity.artist = artistEntity.self;
            artistEntity.songs.push( songEntity.self );

            // TODO: Is there any way of batching saves?
            entityStore.save( songEntity, noop );
            entityStore.save( artistEntity, noop );
         }
         else {
            // TODO: Implement relationship choice entity for selection between one of the alternatives,
            //       or just add all artist?
            throw new Error( 'Unimplemented' );
         }
       
      } );
   } );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

MediaLibrary.prototype.start = function( whenStartedCallback ) {
   this.entityStore = new EntityStore( this.conf.couch );
   this.entityStore.start( whenStartedCallback );
   
   var entityStore = this.entityStore;
   this.entityStore.on( 'entityCreated', function( entity ) {
      
      if( entity.type === 'Song' ) {
         associateSongWithArtist( entityStore, entity ); 
      }
      
   } );
   
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.MediaLibrary = MediaLibrary;
