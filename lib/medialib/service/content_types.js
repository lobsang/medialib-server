var entities = require( '../library/entities' );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

var contentTypes = {
   Song: 'application/de.mlehmacher.medialib.Song',
   Error: 'application/de.mlehmacher.medialib.Error',
   Library: 'application/de.mlehmacher.medialib.Library',
   MediaFile: 'application/de.mlehmacher.medialib.MediaFile',
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

var entityTypeLookupTable = {};
for( var name in contentTypes ) {
   
   var entityType = null;
   switch( name ) {
      case 'Song':
         entityType = entities.SongType;
         break;
      case 'MediaFile':
         entityType = entities.MediaFileType;
         break;
         
      default:
         break;
   }
   
   if( entityType ) {
      entityTypeLookupTable[ name ] = entityType;
      entityTypeLookupTable[ contentTypes[ name ] ] = entityType;  
   }
   
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.contentTypeToEntityType = function( contentType ) {
   return entityTypeLookupTable[ contentType ];
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * @enum {string}
 * @name ContentType
 */
exports.ContentType = contentTypes;
