var ContentType = require( '../content_types' ).ContentType;
var contentHash = require( '../../util/strings' ).contentHash;
var clone = require( '../../util/objects' ).clone;
var createSongEntity = require( '../../library/entities' ).songEntityFactory.fromValue;

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
     
     entity.artists.forEach( function( artistID ) {
        song.links.push( {
           rel: 'artist',
           url: request.context.address.artists.show( artistID )
        } );
     } );
     
     callback( null, song );
  },
  
  createEntityFromValue: function( request, song, callback ) {
     createSongEntity( song, callback );
  }
};
