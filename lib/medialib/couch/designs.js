exports.artistRecord = {
  views: {
      index: {
         map: function( doc ) {
            if ( doc.type === 'ArtistRecord' ) {
               emit( doc.entity.name, doc.entity );              
            }
         }
      }
  }
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.songRecord = {
  views: {
      index: {
         map: function( doc ) {
            if ( doc.type === 'SongRecord' ) {
               emit( doc.entity.artist, doc.entity );              
            }
         }
      }
  },
  lists: {
        artists: function( head, request ) {
           var row;
           var artist = null;
           send( '[' );
           var first = true;
           while( row = getRow() ) {
              var song = row.value;
              
              if( artist ) {
                 if( song.artist === artist.name ) {
                    
                    artist.songs.push( row.id );
                    continue;
                 }
                 else {                  
                    send( ( first ? '' : ', ' ) + JSON.stringify( artist ) );
                    first = false;
                 }
              }

              artist = { name: song.artist, songs: [row.id] };
              
           }
           
           if ( artist ) {
              send( ( first ? '' : ', ' ) + JSON.stringify( artist ) );
           }
           
           send( ']' );
        }
     }
};
