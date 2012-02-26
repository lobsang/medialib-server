var express = require( 'express' );
var format = require( 'util' ).format;
var expressResource = require( 'express-resource' );

var contentTypes = require( './content_types' ).ContentType;
var addressable = require( 'addressable' );
var partial = require( '../util/functions' ).partial;
var resources = require( './resources' );
var middlewares = require( './middlewares' );

// TODO: Use express-resource content negotiation for realzing the following requirement:
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

var newRoutingTable = function( service ) {
   
   var node = function( parent, name, handler ) {
      
      var resource = name ? service.resource( name, handler ) : null;

      var n = {
         parent: parent,
         children: [],
         resource: resource,
         add: function( name, handler ) {
                       
            var child = node( this, name, handler );
            this.children.push( child );
            if( this.resource ) {
               // console.log( "%s.add( %s )", this.resource.id, child.resource.id );
               this.resource.add( child.resource );
            }
            
            this[ name ] = child;
            return this;
         },

      };
      
      return n;
   };
   
   return {
      root: node()
   };
   
};

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
   
   var routingTable = newRoutingTable( this.service );
   var self = this;   
   this.service.use( function( req, res, next ) {
      req.context = createRequestContext( req, routingTable, self.mediaLibrary );
      
      next();
   } );
   
   var libraryPath = this.conf.contextRoot;
   routingTable.root.add( libraryPath, resources.Library );
   
   routingTable.root[ libraryPath ].
      add( 'songs', resources.Song ).
      add( 'artists', resources.Artist );   

   routingTable.root[ libraryPath ].songs.
      add( 'mediaFiles', resources.MediaFile ).
      add( 'artists', resources.Artist );

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
   this.service.close();
   callback();
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function createRequestContext( request, routingTable, mediaLibrary )
{
   // TODO: This way of uri generation totally sucks (duplication of knowledge and all that). The knowledge
   //       about nesting of resources and how uris looks like is contained within express-resource. Try
   //       to get it from there. 
   // TODO: How do I know whether its http/https?

   var baseURL = 'http://' + request.headers.host + '/medialib/0';

   var resourceURL = function( entity ) {
      switch( entity.type ) {
         
         case 'Library':
            return baseURL;
         case 'Album':
            return format( '%s/%s/%s', baseURL, 'albums', entity.self );
         case 'Artist':
            return format( '%s/%s/%s', baseURL, 'artists', entity.self );
         case 'MediaFile':
            return format( '%s/%s/%s', baseURL, 'mediaFiles', entity.self );
         case 'Song':
            return format( '%s/%s/%s', baseURL, 'songs', entity.self );

         default:
            break;
      }
   };
   
   return {
      entities: [],
      mediaLibrary: mediaLibrary,
      resourceURL: resourceURL,
      nestedResourceLinks: function( entity ) {
         var linkify = function( path ) {
            var url = resourceURL( entity ) + '/' + path;
            return { rel: path, url: url };
         };

         switch( entity.type ) {
            case 'Library':
               return [ 'songs', 'artists' ].map( linkify );
            case 'Album':
               return [ 'songs', 'artists' ].map( linkify );
            case 'Artist':
               return [ 'songs', 'albums' ].map( linkify );
            case 'MediaFile':
               return [ 'songs' ].map( linkify );
            case 'Song':
               return [ 'artists', 'mediaFiles' ].map( linkify );

            default:
               break;
         }
      }
      
   };
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.MediaLibraryService = MediaLibraryService;
