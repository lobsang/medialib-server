var fs = require( 'fs' );
var partial = require( '../util/functions' ).partial;
var aws = require( 'aws-lib' );
var Args = require( 'vargs' ).Constructor;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function findAlbumArt( credentials, artistName, albumTitle ) {
   
   var args = new Args( arguments );
   
   var callback = args.callback;
   var keywords = args.last !== albumTitle ? args.array.slice( 3, -1 ) : [ artistName, albumTitle ];
   
   var prodAdv = aws.createProdAdvClient(
         credentials.accessKeyID, credentials.accessKeySecret, credentials.associateTag );

   var query = {
      SearchIndex: 'Music',
      Artist: artistName,
      Title: albumTitle,
      Keywords: keywords.join( ' ' ),
      ResponseGroup: 'Images'
   };
   
   prodAdv.call( 'ItemSearch', query, function( result ) {
      
      if( result.Errors ) {
         var error = result.Errors.Error;
         return callback( {code: error.Code, message: error.Message } );
      }
      
      var images = [];

      result.Items.Item.forEach( function( item ) {
         if( item[ 'MediumImage' ] ) {
            images.push( { size: 'medium', url: item[ 'MediumImage' ].URL } );
         }
      } );

      return callback( null, images );
   } );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.findAlbumArt = findAlbumArt;
exports.service = function( credentials ) {
   
   if( !credentials ) {
      credentials = JSON.parse( fs.readFileSync( __filename.replace( /js$/, 'json' ), 'utf8' ) );  
   }
   
   return {
      findAlbumArt: partial( findAlbumArt, credentials )
   };
};
