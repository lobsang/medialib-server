var express = require( 'express' );
var format = require( 'util' ).format;
require( 'express-resource' );

var contentTypes = require( './content_types' ).ContentType;
var addressable = require( 'addressable' );
var partial = require( '../util/functions' ).partial;
var resources = require( './resources' );

// TODO: Why is there a express.js body parser but no corresponding symmetric encoder?
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
   
   var self = this;
   
   this.service.use( express.bodyParser() );
   
   this.service.use( function( req, res, next ) {
      // TODO: This way of letting mediaLibrary know of the absolute base url totally sucks (also applies to
      //       how the url is assembled). The knowledge about nesting of resources and how uris looks like
      //       is encapsulated within express-resource. Try to get it from there. 
      // TODO: How do I know whether its http/https?

      req.context = createContext( req, self.mediaLibrary.entityStore );

      next();
   } );

   var allowCrossDomain = function( req, res, next ) {
      res.header( 'Access-Control-Allow-Origin', '*' );
      res.header( 'Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE' );
      res.header( 'Access-Control-Allow-Headers', 'Content-Type' );

      next();
   };
  
   this.service.use( allowCrossDomain );
   this.service.use( resources.validationMiddleware );
   
   // This is a workaround to make the bodyParser actually parse my application content types, because it only
   // parses application/json by default.
   for( var name in contentTypes ) {
      express.bodyParser.parse[ contentTypes[ name ] ] = express.bodyParser.parse[ 'application/json' ];
   }

   var library = this.service.resource( this.conf.contextRoot, resources.Library );
   var songs = this.service.resource( 'songs', resources.Song );
   library.add( songs );
   
   var mediaFiles = this.service.resource( 'mediaFiles', resources.MediaFile );
   songs.add( mediaFiles );
   
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
   
   self.service.use( resources.errorHandler );
   
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

function createContext( request, entityStore )
{
   var baseURL = 'http://' + request.headers.host; 
   
   return {
      entityStore: entityStore,
      address : {
         libraries: {
            show: function( entity ) {
               // TODO: obviously don't hardcode uri creation
               return baseURL + '/medialib/' + entity.self;
            } 
         },
         artists: {
            show: function( artist ) {
               var id = artist.self || artist;
               return baseURL + '/medialib/0/artists/' + id;
            }
         },
         songs: {
            index: function() {
               // TODO: obviously don't hardcode uri creation
               return baseURL + '/medialib/0/songs';
            },
            show: function( song ) {
               var id = song.self || song;
               // TODO: obviously don't hardcode uri creation
               return baseURL + '/medialib/0/songs/' + id;
            }
         },
         mediaFiles: {
            index: function( song ) {
               return baseURL + '/medialib/0/songs/' + song.self + '/mediaFiles'; 
            },
            show: function( mediaFile ) {
               return baseURL + '/medialib/0/songs/' + mediaFile.song + '/mediaFiles' + '/' + mediaFile.self;
            },
         }
      }
   };
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.contentTypes = contentTypes;
exports.MediaLibraryService = MediaLibraryService;
