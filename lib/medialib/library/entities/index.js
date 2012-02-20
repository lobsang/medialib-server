var contentHash = require( '../../util/strings' ).contentHash;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.AlbumType = {
   fromValue: function( album, parentEntities, callback ) {
      var hash = contentHash( album.title, album.artist );
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
      var hash = contentHash( artist.name );
      var artistEntity = {
         type: 'Artist',
         self: 'urn:artist:' + contentHash( Date.now(), hash ),
         hash: hash,
         value: artist,
         songs: []
      };
    
      callback( null, artistEntity );
   }
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.SongType = {
   fromValue: function( song, parentEntities, callback ) {
      var hash = contentHash( song.title, song.artist, song.album ); 
      var songEntity = {
         type: 'Song',
         self: 'urn:song:' + contentHash( Date.now(), hash ),
         hash: hash,
         value: song,
         artists: []
      };
      
      callback( null, songEntity );  
   }
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.MediaFileType = {
   fromValue: function( mediaFile, parentEntities, callback ) {
      var hash = contentHash( mediaFile.url ); 
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