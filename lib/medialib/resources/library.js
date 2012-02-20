var ContentType = require( '../content_types' ).ContentType;
var clone = require( '../util/objects' ).clone;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.LibraryResourceType = {
   contentType: ContentType.Library,
   
   linkify: function( request, entity, callback ) {
      
      var library = clone( entity.value );
      library.links = [
        { rel: 'songs', url: request.context.address.songs.index }
      ];
      
      callback( null, song );
   },
   
   createEntityFromValue: function( request, song, callback ) {
      throw new Error( 'Unsupported operation' );
   }
};
