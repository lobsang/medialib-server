var express = require( 'express' );
var format = require( 'util' ).format;
var expressResource = require( 'express-resource' );

var contentTypes = require( './content_types' ).ContentType;
var StatusCode = require( './status_codes' ).StatusCode;
var addressable = require( 'addressable' );
var resources = require( './resources' );
var middlewares = require( './middlewares' );
var entities = require( '../library/entities' );
var ResourceMappings = require( './routing' ).ResourceMappings;
var arrays = require ( '../util/arrays' );
var querystring = require( 'querystring' );

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

   var resourceMappings = new ResourceMappings( this.service );
   
   var self = this;   
   this.service.use( function( req, res, next ) {
      req.context = createRequestContext( req, resourceMappings, self.mediaLibrary );
      next();
   } );

   resourceMappings.mapEntity( entities.types.Library, libraryPath );
   
   resourceMappings[ libraryPath ]
      .mapEntity( entities.types.Album, 'albums' )
      .mapEntity( entities.types.Artist, 'artists' )
      .mapEntity( entities.types.MediaFile, 'mediaFiles' )
      .mapEntity( entities.types.Song, 'songs' );

   resourceMappings[ libraryPath ].songs
      .mapEntity( entities.types.Artist, 'albums' )
      .mapEntity( entities.types.Artist, 'artists' )
      .mapEntity( entities.types.MediaFile, 'mediaFiles' );

   resourceMappings[ libraryPath ].mediaFiles.map( { 
      method: 'get',
      path: 'stream',
      handler: function( request, response ) {
         var mediaFile = request.params.mediaFile;
         var options = request.query;
         
         res.contentType( options.mediaType );
         self.mediaLibrary.playStream( mediaFile, options, response );   
      },
      availableOptions: function( request ) {
         var mediaFile = arrays.last( request.context.entities ); // request.params.mediaFile not set on create
         return self.mediaLibrary.getAvailableStreamingOptions( mediaFile );
      }
   } );

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
//         resourceMappings?
//         createRequestContext
function createRequestContext( request, resourceMappings, mediaLibrary )
{
   // TODO: get rid of host and just link to absolute paths
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
         
         var path = resourceMappings.resourcePath( [ this.entities[ 0 ], entity ] );
         return { rel: 'self', url: baseURL + path };
      },
      
      affordancesLinks: function() {
         
         var entityPath = [this.entities[ 0 ], arrays.last( this.entities )];
         
         var contextNode = resourceMappings.contextNode( entityPath );
         var prefixURL = baseURL + contextNode.boundPath( entityPath );

         var links = [];
         contextNode.mappings.forEach( function( mapping ) {
            var rel = mapping.path;
            
            links = links.concat( mapping.availableOptions( request ).map( function( opts ) {
               return { rel: rel, url: prefixURL + '/' + mapping.path + '?' + querystring.stringify( opts ) };
            } ) );
            
         } );
         
         return links;
      },
      
      nestedResourceLinks: function() {
         // Nested resource links are completely dependent upon context as specified by the entity path.

         var contextNode = resourceMappings.contextNode( this.entities );
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
