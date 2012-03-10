var amazon = require( '../webapis/amazon' ).service();

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

var albumArtPlugin = {
   
   pluginID: 'urn:mediaLibrary:plugin:albumArt',
      
   activate: function( mediaLibrary ) {
      mediaLibrary.on( 'albumCreated', this.findAlbumArt );
   },
   
   deactivate: function( mediaLibrary ) {
      mediaLibrary.remove( 'albumCreated', this.findAlbumArt );
   },
      
   findAlbumArt: function( mediaLibrary, albumEntity ) {
      
      var album = albumEntity.value;
      
      amazon.findAlbumArt( album.artist, album.title, function( err, images ) {
         
         var artworks = [];
         
         images.forEach( function( img ) {
            var artwork = {
               provider: 'amazon',
               source: img.url,
               status: 'WaitingForApproval',
               size: img.size
            };
            
            artworks.push( artwork );
            
         } );
         
         mediaLibrary.createEntity( entities.types.Artwork, artwork, [albumEntity], function( err ) {
            if( err ) {
               // TODO: Plugin should have state in order to remember to try again later.
               console.error( err );
               return;
            }
            
            
         } );
         
      } );
      
   }
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports = albumArtPlugin;
