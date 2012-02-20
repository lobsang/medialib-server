var ContentType = require( '../content_types' ).ContentType;
var contentHash = require( '../../util/strings' ).contentHash;
var clone = require( '../../util/objects' ).clone;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.MediaFileResourceType = {
  contentType: ContentType.MediaFile,
  
  linkify: function( request, entity, callback ) {
     
     var value = clone( entity.value );
     var address = request.context.address; 
     value.links = [ {
        rel: 'self', url: address.mediaFiles.show( entity )
     }, {
        rel: 'song', url: address.songs.show( entity.song )
     } ];
     
     callback( null, value );
  }
};
