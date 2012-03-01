var entities = require( '../library/entities' );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

var contentTypes = {
   Album: 'application/de.mlehmacher.medialib.Album',
   Artist: 'application/de.mlehmacher.medialib.Artist',
   Song: 'application/de.mlehmacher.medialib.Song',
   Error: 'application/de.mlehmacher.medialib.Error',
   Library: 'application/de.mlehmacher.medialib.Library',
   MediaFile: 'application/de.mlehmacher.medialib.MediaFile',
   LibraryItems: 'application/de.mlehmacher.medialib.LibraryItems',
   
   /**
    * The media library domain content type.
    */
   MediaLibrary: 'application/de.mlehmacher.medialib.MediaLibrary',
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.entityTypeContentType = function( entityType ) {
   return contentTypes[ entityType.name ];
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * @enum {string}
 * @name ContentType
 */
exports.ContentType = contentTypes;
