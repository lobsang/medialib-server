var express = require( 'express' );
var format = require( 'util' ).format;
var expressResource = require( 'express-resource' );

var contentTypes = require( './content_types' ).ContentType;
var StatusCode = require( './status_codes' ).StatusCode;
var addressable = require( 'addressable' );
var resources = require( './resources' );
var middlewares = require( './middlewares' );
var entities = require( '../library/entities' );
var newEntityMappings = require( './routing' ).newEntityMappings;

// TODO: Use express-resource content negotiation for realizing the following requirement:
//
//       If at all possible, I'd like to transparently deal with serialization and deserialization from and to
//       different data formats in my middleware. I don't really care if the client sends or wishes to
//       receive xml oder json as long as there is one canonical intermediate representation (a JavaScript
//       object) I can work with.

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function MediaLibraryService( conf, mediaLibrary ) {
   this.conf = JSON.parse( JSON.stringify( conf ) );
   this.conf.contextRoot = this.conf.contextRoot.replace( /^\//, '' ); // Remove leading slash
   
   this.mediaLibrary = mediaLibrary;
   return this;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

MediaLibraryService.prototype.start = function( whenStartedCallback ) {
   
   this.service = express.createServer();
   this.service.use( express.responseTime() );
   this.service.use( express.bodyParser() );  
   this.service.use( middlewares.enableCrossOriginResourceSharing );
   this.service.use( middlewares.requestValidator );
   
   // This is a workaround to make the bodyParser actually parse my application content types, because it only
   // parses application/json by default.
   for( var name in contentTypes ) {
      express.bodyParser.parse[ contentTypes[ name ] ] = express.bodyParser.parse[ 'application/json' ];
   }
   
   var libraryPath = this.conf.contextRoot;

   var entityMappings = newEntityMappings( this.service );
   
   var self = this;   
   this.service.use( function( req, res, next ) {
      req.context = createRequestContext( req, entityMappings, self.mediaLibrary );
      next();
   } );

   entityMappings.add( entities.types.Library, libraryPath );
   
   entityMappings[ libraryPath ]
      .add( entities.types.Album, 'albums' )
      .add( entities.types.Artist, 'artists' )
      .add( entities.types.MediaFile, 'mediaFiles' )
      .add( entities.types.Song, 'songs' );

   entityMappings[ libraryPath ].songs
      .add( entities.types.Artist, 'albums' )
      .add( entities.types.Artist, 'artists' )
      .add( entities.types.MediaFile, 'mediaFiles' );

   // TODO: as resource
   var mediaPlayer = function( req, res, next ) {
      
      // TODO: formalize contract
      // TODO: make scheme handlers pluggable (within the library, not here - library is supposed to respond
      //       to a play request).
      
      // Possible Responses: Not Found, Moved?, Not Implemented
      
      var source = req.query.source; // one of 'file', 'acd', 'http', ...

      self.mediaLibrary.getMediaURL( req.params.song, source, function( err, mediaURL ) {
         
         var uri = addressable.parse( mediaURL );
         if( uri.scheme === 'file' ) {
            // TODO: do not hardcode content type
            res.contentType( 'audio/mpeg' );
            res.sendfile( uri.path );
         }
         else {
            response.send( '{}', 501 );
         }
         
      } );

   };
   
   self.service.get( '/medialib/0/play/:song', mediaPlayer );
   
   self.service.use( middlewares.errorHandler );
   
   this.mediaLibrary.start( function whenStarted() {
      
      var listenPort = self.conf.listenPort;
      console.info( 'medialib web service listening on port %d.', listenPort );
      self.service.listen( listenPort, whenStartedCallback );

   } );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

MediaLibraryService.prototype.stop = function( callback ) {
   
   var httpServer = this.service;
   this.mediaLibrary.stop( function( err ) {
      
      // Ignore error and close down service.
      httpServer.close();
      
      callback( err );
   } );   

};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

// TODO: put the coupled bits into a cohesive unit:
//         entity loading function (resource action)
//         entityMappings?
//         createRequestContext
function createRequestContext( request, entityMappings, mediaLibrary )
{
   // TODO: How do I know whether its http/https?

   var baseURL = 'http://' + request.headers.host;

   return {
      /**
       * The entity path which makes up the current processing context (thus influencing resource link 
       * generation, index requests, relationship of newly created entities, etc.).
       * 
       * The entity path contains the loaded entities corresponding to all addressed resources within a
       * given request, in the order the resources are nested.
       * 
       * Suppose a request is made against /medialib/default/songs/yyz/mediaFiles. In that case the entity
       * path is supposed to contain the library entity with identity 'default' and the song entity with
       * identity 'xyz'.
       */
      entities: [],
      mediaLibrary: mediaLibrary,      
      resourceSelfLink: function( entity ) {
         
         // The resource self link is not dependent upon the whole current entity context (the stack of
         // entities), but only on the first element, which is the library, because all other resources
         // are accessible from there.
         
         var path = entityMappings.resourcePath( [ this.entities[ 0 ], entity ] );
         return { rel: 'self', url: baseURL + path };
      },
      nestedResourceLinks: function() {
         // Nested resource links are completely dependent upon context as specified by the entity path.

         var contextNode = entityMappings.contextNode( this.entities );
         
         var prefixURL = baseURL + contextNode.boundPath( this.entities );
         
         return contextNode.children.map( function( childNode ) {
            var rel = childNode.path;
            
            return { rel: rel, url: prefixURL + '/' + childNode.path };
         } );
      }
   };
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.MediaLibraryService = MediaLibraryService;
