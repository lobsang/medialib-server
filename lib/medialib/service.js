var express = require( 'express' ),
contentTypes = require( './library' ).ContentType;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function MediaLibraryService( conf, mediaLibrary ) {
   this.conf = conf;
   this.mediaLibrary = mediaLibrary;
   return this;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

MediaLibraryService.prototype.start = function( whenStartedCallback ) {
   
   this.service = express.createServer();
   
   this.service.use( express.bodyParser() );
   
   var allowCrossDomain = function( req, res, next ) {
      res.header( 'Access-Control-Allow-Origin', '*' );
      res.header( 'Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE' );
      res.header( 'Access-Control-Allow-Headers', 'Content-Type' );

      next();
   };
  
   this.service.use( allowCrossDomain );

   for( var name in contentTypes ) {
      express.bodyParser.parse[ contentTypes[ name ] ] = express.bodyParser.parse['application/json'];
   }
   
   this.service.resource = function( path, obj ) {
      this.get( path, obj.index );
      this.get( path + '/:a..:b.:format?', function( req, res ) {
         var a = parseInt(req.params.a, 10),
            b = parseInt(req.params.b, 10),
            format = req.params.format;
          obj.range(req, res, a, b, format);
      } );
      this.get( path + '/:id', obj.show );
      this.post( path, obj.add );
   };

   this.service.resource( this.conf.contextRoot + '/songs', SongResource );
   SongResource.mediaLibrary = this.mediaLibrary;
   
   var self = this;
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

var SongResource = {
      
   add: function( request, response ) {
      var song = request.body;

      SongResource.mediaLibrary.addSong( song, function( err, result ) {
         
         response.contentType( result.headers.contentType );
         response.send( result.body, result.statusCode );

      } );

   },
   index: function( request, response ) {



   }  
};

exports.MediaLibraryService = MediaLibraryService;
