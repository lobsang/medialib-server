// Plugins offer additional features and are not part of the core media library.
//
// Plugins may not necessarily participate in the the request lifecycle. They can be triggered by a side 
// effect induced by a request and then perform their task independently of the request processing pipeline.
// TODO: The request lifecycle has to do with the service layer and not the library layer in any case. Plugins
//       are part of the library layer. Maybe there's a mistake somewhere.
//
// Plugins may introduce their own concepts and associate reifications (objects representing the concepts)
// with media library entities. It is only natural, that those concepts are expressed as entities. After all
// the core library concepts are also modeled as entities.
//
// Take the album art plugin for instance, which searches the web for album artworks. To that end it defines
// its own Artwork entity type and associates artwork entities with album entities.
//
// For a plugin to deliver any net use, its effects must somehow be observable by the client. First, there
// are the added relationships between entities. Second, when using the general entity search api provided
// by the media library, it will also return plugin entities (provided the query matches).
//
// TODO: Also consider introducing a mechanism by which the client can discover specific plugin apis. This
//       needs not be completely generic, as coupling between plugins and client is okay (after all it's the 
//       client who decides which plugins to activate in the first place).

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * This is only for documentation and concept building purposes.
 */
var PluginPrototype = {
   pluginID: 'urn:mediaLibrary:plugin:Example',
   activate: function( mediaLibrary, callback ) {},
   deactivate: function( mediaLibrary, callback ) {}
};
