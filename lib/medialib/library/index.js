var async = require( 'async' );
var EntityStore = require( './couch' ).EntityStore;
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
               songEntity.artists.push( artistEntity.self );
               entityStore.save( songEntity, callback );
            } );
         }
         else {
            
            entities.forEach( function( artistEntity ) {
               
               songEntity.artists.push( artistEntity.self );
               artistEntity.songs.push( songEntity.self );
               
            } );
            
            entityStore.save( [songEntity].concat( entities ), callback );
         }
       
      } );
   } );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

MediaLibrary.prototype.start = function( whenStartedCallback ) {
   this.entityStore = new EntityStore( this.conf.couch );
   this.entityStore.start( whenStartedCallback );
   
   var entityStore = this.entityStore;
   this.entityStore.on( 'entityCreated', function( entity, callback ) {
      
      if( entity.type === 'Song' ) {
         associateSongWithArtist( entityStore, entity, function( err ) {
            callback( err );
         } );
      }
      else {
         callback( null );
      }
      
   } );
   
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.MediaLibrary = MediaLibrary;
