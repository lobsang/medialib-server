var express = require( 'express' );
var format = require( 'util' ).format;
require( 'express-resource');

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function MediaLibraryService( conf, mediaLibrary ) {
   this.conf = conf;
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

      self.mediaLibrary.currentContext = 'http://' + req.headers.host + req.url;

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

   var library = this.service.resource( 'medialib', libraryRequestHandler() );
   var songs = this.service.resource( 'songs', songRequestHandler( this.mediaLibrary ) );
   library.add( songs );
   
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

var libraryRequestHandler = function() {
   return {
      index: function( request, response ) {
         response.send( JSON.stringify( {
            links: [
               { rel: 'songs', url: '' }
            ]
         } ), 200 );
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
         
         mediaLibrary.getSongById( request.params.song, function( err, result ) {
            
            response.contentType( result.headers.contentType );
            response.send( result.body, result.statusCode );
            
         } );

      }
   };
};

exports.MediaLibraryService = MediaLibraryService;
