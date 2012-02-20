var ContentType = require( '../content_types' ).ContentType;
var clone = require( '../../util/objects' ).clone;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.ArtistResourceType = {
   contentType: ContentType.Artist,
   
   linkify: function( request, entity, callback ) {
      
      var artist = clone( entity.value );
      artist.links = [];
      
      entity.songs.forEach( function( songID ) {
         artist.links.push( {
            rel: 'song',
            url: request.context.address.songs.show( songID )
         } );
      } );
      
      callback( null, artist );
   }
};
