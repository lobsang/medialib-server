var medialib = require( '../lib/medialib' );
var wwwdude = require( 'wwwdude' );
var util = require( 'util' );

console.log(   
jasmine.DEFAULT_TIMEOUT_INTERVAL );

var conf = {
   "mediaLibrary": {
      "couch": {
         "db": "medialib-test",
         "host": "localhost",
         "port": 5984
      }
   },
   "webService": {
      "contextRoot" : "/medialib",
      "listenPort": 4000
   }
};

describe( 'medialib service', function() {

   var service = null;
   var client = null;
   var baseURL = null;
   
   beforeEach( function () {
      if( !service ) {
         
         var mediaLibrary = new medialib.MediaLibrary( conf.mediaLibrary );
         service = new medialib.MediaLibraryService( conf.webService, mediaLibrary );
         
         client = wwwdude.createClient( {
            timeout: 500
         } );
         
         baseURL = util.format( "http://localhost:%d%s", conf.webService.listenPort, conf.webService.contextRoot );

      }
   } );
   
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'starts listening when started', function( done ) {
      service.start( function( err ) {
         console.log( "a" );
         expect( err ).toBeFalsy();
         
         client.get( baseURL ).on( 'complete', function ( err, data, resp ) {
            console.log( "b" );
            expect( err ).toBeFalsy();
            expect( resp.statusCode ).toEqual( 200 );
            
            done();
         } );
         
      } );
   } );
} );
