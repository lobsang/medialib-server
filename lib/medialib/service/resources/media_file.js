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
        rel: 'song', url: address.songs.show( request.song )
     } ];
     
     callback( null, value );
  },
  
  createEntityFromValue: function( request, mediaFile, callback ) {
     var hash = contentHash( mediaFile.url ); 
     var entity = {
        type: 'MediaFile',
        self: 'urn:mediaFile:' + contentHash( Date.now(), hash ),
        // TODO: no good here, because coupled to uri fragment names (song)
        song: request.song.self,
        hash: hash,
        value: mediaFile
     };   
     
     callback( null, entity );
  }
};
