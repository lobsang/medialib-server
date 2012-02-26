var contentHash = require( '../../util/strings' ).contentHash;
var decapitaliseFirstLetter = require( '../../util/strings' ).decapitaliseFirstLetter;
var Assert = require( '../../util/assert' ).Assert;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

var types = [ {
   name: 'Album',
      
   fromValue: function( album, callback ) {
      var hash = contentHash( album.title, album.artist );
      var albumEntity = {
         type: 'Album',
         self: 'urn:album:' + contentHash( Date.now(), hash ),
         hash: hash,
         value: album,
         rels: [],
      };
    
      callback( null, albumEntity );
   } }, {
   name: 'Artist',
      
   fromValue: function( artist, callback ) {
      var hash = contentHash( artist.name );
      var artistEntity = {
         type: 'Artist',
         self: 'urn:artist:' + contentHash( Date.now(), hash ),
         hash: hash,
         value: artist,
         rels: [],
      };
    
      callback( null, artistEntity );
   } }, {
   name: 'Song',
      
   fromValue: function( song, callback ) {
      var hash = contentHash( song.title, song.artist, song.album ); 
      var songEntity = {
         type: 'Song',
         self: 'urn:song:' + contentHash( Date.now(), hash ),
         hash: hash,
         value: song,
         rels: [],
      };
      
      callback( null, songEntity );  
   } }, {
   name: 'MediaFile',
      
   fromValue: function( mediaFile, callback ) {
      var hash = contentHash( mediaFile.url ); 
      var mediaFileEntity = {
         type: 'MediaFile',
         self: 'urn:mediaFile:' + contentHash( Date.now(), hash ),
         hash: hash,
         value: mediaFile,
         rels: []
      };   
      
      callback( null, mediaFileEntity );  
   }
} ];

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

var typesByName = {};
types.forEach( function( t ) {
   typesByName[ t.name ] = t;
} );
exports.types = typesByName;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function structuralRelationshipTo( toEntity ) {
   var relName = decapitaliseFirstLetter( toEntity.type );
   return { name: relName, target: toEntity.self };
};
exports.structuralRelationshipTo = structuralRelationshipTo;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Bi-directionally associates the given entities with each other.
 */
exports.associate = function() {
   
   var entities = Array.prototype.slice.call( arguments, 0 );
   
   entities.forEach( function( entityOne ) {
      
      entities.forEach( function( entityTwo ) {
         
         if( entityOne === entityTwo ) {
            return;
         }
         
         // The relationships are very structural right now. As soon as they turn more meaningful, this
         // will not be enough anymore.
         entityOne.rels.push( structuralRelationshipTo( entityTwo ) );
         
      } );
      
   } );
};