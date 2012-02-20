var contentHash = require( '../../util/strings' ).contentHash;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.artistEntityFactory = {
   fromValue: function( artist, callback ) {
      var hash = contentHash( artist.name );
      var artistEntity = {
         type: 'Artist',
         self: 'urn:artist:' + contentHash( Date.now(), hash ),
         songs: [],
         hash: hash,
         value: artist
      };
    
      callback( null, artistEntity );
   }
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.songEntityFactory = {
   fromValue: function( song, callback ) {
      var hash = contentHash( song.title, song.artist, song.album ); 
      var songEntity = {
         type: 'Song',
         self: 'urn:song:' + contentHash( Date.now(), hash ),
         artists: [],
         hash: hash,
         value: song
      };
      
      callback( null, songEntity );  
   }
};
