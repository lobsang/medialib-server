var ContentType = require( '../content_types' ).ContentType;
var contentHash = require( '../../util/strings' ).contentHash;
var clone = require( '../../util/objects' ).clone;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.SongResourceType = {
  contentType: ContentType.Song,
  
  linkify: function( request, entity, callback ) {
     
     var song = clone( entity.value );
     song.links = [ {
        rel: 'self',
        url: request.context.address.songs.show( entity )
     }, {
        rel: 'mediaFiles',
        url: request.context.address.mediaFiles.index( entity )
     } ];
     
     callback( null, song );
  },
  
  createEntityFromValue: function( request, song, callback ) {

     var hash = contentHash( song.title, song.artist, song.album ); 
     var entity = {
        type: 'Song',
        self: 'urn:song:' + contentHash( Date.now(), hash ),
        hash: hash,
        value: song
     };
     
     callback( null, entity );
  }
};
