// TODO: Scrub out links/actions properties before saving any entities (they are purely a part of the
//       representations sent to the client).

exports.Song = require( './song' ).SongResource;
exports.Library = require( './library' ).LibraryResource;
exports.Error = require( './error' ).ErrorResource;
