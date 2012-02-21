var contentHash = require( '../../util/strings' ).contentHash;

// TODO: Consider generalizing relationships. Immediate advantage: no more specific linkifies.
//       Disadvantage: lose multiplicity semantics (everything will be to-many)
// TODO: Get rid of parentEntities arg. Relationships have to be established elsewhere. Where though?
//       Identify in which general cases relationships have to be updated (create, delete, ...?).
//       Also consider dualism between Resource nestedness and entity aggregation (ownership).

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.AlbumType = {
   fromValue: function( album, parentEntities, callback ) {
      var hash = contentHash( album.title, album.artist, album.clientID );
      var albumEntity = {
         type: 'Album',
         self: 'urn:album:' + contentHash( Date.now(), hash ),
         hash: hash,
         value: album,
         songs: [],
         artists: []
      };
    
      callback( null, albumEntity );
   }
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.ArtistType = {
   fromValue: function( artist, parentEntities, callback ) {
      var hash = contentHash( artist.name, artist.clientID );
      var artistEntity = {
         type: 'Artist',
         self: 'urn:artist:' + contentHash( Date.now(), hash ),
         hash: hash,
         value: artist,
         albums: [],
         songs: []
      };
    
      callback( null, artistEntity );
   }
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.SongType = {
   fromValue: function( song, parentEntities, callback ) {
      var hash = contentHash( song.title, song.artist, song.album, song.clientID ); 
      var songEntity = {
         type: 'Song',
         self: 'urn:song:' + contentHash( Date.now(), hash ),
         hash: hash,
         value: song,
         albums: [],
         artists: [],
         mediaFiles: []
      };
      
      callback( null, songEntity );  
   }
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.MediaFileType = {
   fromValue: function( mediaFile, parentEntities, callback ) {
      var hash = contentHash( mediaFile.url, mediaFile.clientID ); 
      var mediaFileEntity = {
         type: 'MediaFile',
         self: 'urn:mediaFile:' + contentHash( Date.now(), hash ),
         hash: hash,
         value: mediaFile,
         song: parentEntities.song.self
      };   
      
      callback( null, mediaFileEntity );  
   }
};