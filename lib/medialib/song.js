var clone = require( './util/objects' ).clone;
var extend = require( './util/objects' ).extend;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function SongResource( properties ) {
   extend( this, properties );
   return this;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * When complete, passes an enriched clone of the song to the given callback. 
 */
SongResource.prototype.linkifiedSong = function( library, callback ) {

   var originalSong = this.entity;
   var enrichedSong = clone( originalSong );
   
   // TODO: service.addressForSong( this.entity ) instead of library.baseURL stuff
   
   enrichedSong.links.push( {
      rel : 'self',
      url : library.baseURL + '/songs/' + this.entityID
   } );

   // library.baseURL + '/play/' + record.entityID + '?source=file'
   
   // song.links = song.links.concat( mediaLinks );
   
//   async.series( [requireArtists, requireAlbums], function( err, artists, albums ) {
//      
//      
//      
//   } );
   
   callback( null, enrichedSong );
};

exports.SongResource = SongResource;
