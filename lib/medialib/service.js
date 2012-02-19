var express = require( 'express' );
var format = require( 'util' ).format;
require( 'express-resource' );

var addressable = require( 'addressable' );
var validators = require( './validation' ).validators;
var partial = require( './util/functions' ).partial;
var resources = require( './resources' );

// TODO: Why is there a express.js body parser but no corresponding symmetric encoder?
//
//       If at all possible, I'd like to transparently deal with serialization and deserialization from and to
//       different data formats in my middleware. I don't really care if the client sends or wishes to
//       receive xml oder json as long as there is one canonical intermediate representation (a JavaScript
//       object) I can work with.

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function pump( httpResponse ) {
   return function( err, resourceResponse ) {

      httpResponse.contentType( resourceResponse.headers.contentType );
      httpResponse.send( JSON.stringify( resourceResponse.body ), resourceResponse.statusCode );
   };
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Performs validation on POST and PUT requests according to content type.
 */
function validationMiddleware( request, response, next ) {
   
   var method = request.method.toUpperCase();
   if( method !== 'POST' && method !== 'PUT' ) {
      next();
      return;
   }
   
   // Missing content type
   var contentType = request.headers[ 'content-type' ];
   if( !contentType ) {
      resources.Error.createRequestContentTypeErrorResource( request.context ).createResponse( pump( response ) );      
      return;
   }
   
   var validate = validators.getByContentType( contentType );
   
   // Illegal content type
   if( !validate ) {
      resources.Error.createRequestContentTypeErrorResource( request.context ).createResponse( pump( response ) );
      return;
   }
   else if( !validate( request.body ) ) {
      resources.Error.createSchemaValidationErrorResource( request.context, check.errors ).createResponse( pump( response ) );       
      return;
   }

   next();
};

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
   
   var self = this;
   
   this.service.use( express.bodyParser() );
   
   this.service.use( function( req, res, next ) {
      // TODO: This way of letting mediaLibrary know of the absolute base url totally sucks (also applies to
      //       how the url is assembled). The knowledge about nesting of resources and how uris looks like
      //       is encapsulated within express-resource. Try to get it from there. 
      // TODO: How do I know whether its http/https?

      req.context = createContext( 'http://' + req.headers.host, self.mediaLibrary.entityStore );
      req.context.request = req;
      req.context.response = res;
      
      next();
   } );

   var allowCrossDomain = function( req, res, next ) {
      res.header( 'Access-Control-Allow-Origin', '*' );
      res.header( 'Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE' );
      res.header( 'Access-Control-Allow-Headers', 'Content-Type' );

      next();
   };
  
   this.service.use( allowCrossDomain );
   this.service.use( validationMiddleware );
   
   var contentTypes = this.mediaLibrary.contentTypes;
   for( var name in contentTypes ) {
      express.bodyParser.parse[ contentTypes[ name ] ] = express.bodyParser.parse[ 'application/json' ];
   }

   var library = this.service.resource( this.conf.contextRoot, libraryRequestHandler );
   var songs = this.service.resource( 'songs', songRequestHandler );
   library.add( songs );
   
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
   self.service.use( express.errorHandler( { dumpExceptions: true } ) );
   
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

// ResourceAddress: f( parentResources, resource) -> address and g( request ) -> parentResources
// EventEmitter
// ResourceFinder

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

// TODO:  Must be bound to request?
function createContext( baseURL, entityStore )
{
   return {
      entityStore: entityStore,
      address : {
         songs: {
            index: function() {
               // TODO: obviously don't hardcode uri creation
               return baseURL + '/medialib/0/songs';
            },
            show: function( entity ) {
               // TODO: obviously don't hardcode uri creation
               return baseURL + '/medialib/0/songs/' + entity.entityID;
            }
         },
         libraries: {
            show: function( entity ) {
               // TODO: obviously don't hardcode uri creation
               return baseURL + '/medialib/' + entity.entityID;
            } 
         }
      }
   };
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

var libraryRequestHandler = {
   index: function( request, response ) {
      resources.Library.handleIndex( request.context, pump( response ) );
   },
   show: function( request, response ) {
      resources.Library.handleShow( request.context, request.params.medialib, pump( response ) );
   }
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

var songRequestHandler = {
   create: function( request, response ) {
      var song = request.body;   
      resources.Song.handleCreate( request.context, song, pump( response ) );
   },
   show: function( request, response ) {
      resources.Song.handleShow( request.context, request.params.song, pump( response ) );
   }
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.MediaLibraryService = MediaLibraryService;
