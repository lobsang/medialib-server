var express = require( 'express' );
var format = require( 'util' ).format;
require( 'express-resource');

var addressable = require("addressable");

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
   
   var self = this;
   this.service.use( function( req, res, next ) {
      // TODO: This way of letting mediaLibrary know of the absolute base url totally sucks (also applies to
      //       how the url is assembled).
      // TODO: How do I know whether its http/https?

      self.mediaLibrary.baseURL = 'http://' + req.headers.host + '/' + self.conf.contextRoot + '/0';

      next();
   } );
   
   this.service.use( express.bodyParser() );
   
   var allowCrossDomain = function( req, res, next ) {
      res.header( 'Access-Control-Allow-Origin', '*' );
      res.header( 'Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE' );
      res.header( 'Access-Control-Allow-Headers', 'Content-Type' );

      next();
   };
  
   this.service.use( allowCrossDomain );

   var contentTypes = this.mediaLibrary.contentTypes;
   for( var name in contentTypes ) {
      express.bodyParser.parse[ contentTypes[ name ] ] = express.bodyParser.parse['application/json'];
   }

   var library = this.service.resource( this.conf.contextRoot, libraryRequestHandler( this.mediaLibrary ) );
   var songs = this.service.resource( 'songs', songRequestHandler( this.mediaLibrary ) );
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

   this.mediaLibrary.start( function whenStarted() {
      
      var listenPort = self.conf.listenPort;
      console.info( 'medialib web service listening on port %d.', listenPort );
      self.service.listen( listenPort, whenStartedCallback );

   } );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

MediaLibraryService.prototype.stop = function( whenStoppedCallback ) {
   this.service.close();
   whenStoppedCallback();
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

var libraryRequestHandler = function( mediaLibrary ) {
   return {
      index: function( request, response ) {
         var result = mediaLibrary.createLibraryResponse();
         
         response.contentType( result.headers.contentType );
         response.send( result.body, result.statusCode );
      }
   };
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

var songRequestHandler = function( mediaLibrary ) {
  
   return {
      create: function( request, response ) {

         if( request.headers[ 'content-type'] !== mediaLibrary.contentTypes.Song ) {
            var result = mediaLibrary.createRequestContentTypeError();
               
            response.contentType( result.headers.contentType );
            response.send( result.body, result.statusCode );
            return;
         }
         
         var song = request.body;
   
         mediaLibrary.createSong( song, function( err, result ) {
            
            response.contentType( result.headers.contentType );
            response.send( result.body, result.statusCode );
   
         } );
   
      },
      show: function( request, response ) {
         
         mediaLibrary.getSongByID( request.params.song, function( err, result ) {
            
            response.contentType( result.headers.contentType );
            response.send( result.body, result.statusCode );
            
         } );

      }
   };
};

exports.MediaLibraryService = MediaLibraryService;
