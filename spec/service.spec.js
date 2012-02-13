var medialib = require( '../lib/medialib' );
var wwwdude = require( 'wwwdude' );
var util = require( 'util' );
var fs = require( 'fs' );

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

var httpClient = wwwdude.createClient( {
   headers: { 'User-Agent': 'medialib test client' },
   timeout: 500
} );

var fixture = {
   songs: JSON.parse( fs.readFileSync( __filename.replace( /js$/, 'songs.json' ), 'utf8' ) ).songs
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe( 'medialib service', function() {

   var mediaLibrary = null;
   var service = null;
   var baseURL = null;
   
   beforeEach( function () {
      if( !service ) {
         
         mediaLibrary = new medialib.MediaLibrary( conf.mediaLibrary );
         service = new medialib.MediaLibraryService( conf.webService, mediaLibrary );
                  
         baseURL = util.format( "http://localhost:%d%s", conf.webService.listenPort, conf.webService.contextRoot );

      }
   } );
   
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'starts listening when started', function( done ) {
      service.start( function( err ) {
         
         expect( err ).toBeFalsy();
         
         httpClient.get( baseURL ).on( 'complete', function ( data, response ) {

            expect( response.statusCode ).toBe( 200 );
            
            done();
         } );
         
      } );
   } );
   
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////
   
   it( 'rejects song creations without content type', function( done ) {

      var request = {
         payload: JSON.stringify( fixture.songs[ 0 ] ),
         headers: {}
      };
      
      httpClient.post( baseURL + '/0/songs', request ).on( 'complete', function ( data, response ) {

         expect( response.statusCode ).toBe( 415 );
            
         done();
      } );

   } );
   
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////
   
   it( 'rejects song with additional properties', function( done ) {

      var song = JSON.parse( JSON.stringify( fixture.songs[ 0 ] ) );
      song.myProperty = "value";
      
      var request = {
         payload: JSON.stringify( song ),
         headers: {}
      };
      
      httpClient.post( baseURL + '/0/songs', request ).on( 'complete', function ( data, response ) {

         expect( response.statusCode ).toBe( 415 );
            
         done();
      } );

   } );
   
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////
   
   it( 'rejects song with missing properties', function( done ) {

      var song = JSON.parse( JSON.stringify( fixture.songs[ 0 ] ) );
      delete( song.title );
      
      var request = {
         payload: JSON.stringify( song ),
         headers: {}
      };
      
      httpClient.post( baseURL + '/0/songs', request ).on( 'complete', function ( data, response ) {

         expect( response.statusCode ).toBe( 415 );
            
         done();
      } );

   } );
   
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////
   
   var song = null;
   it( 'creates a song', function( done ) {

      var request = {
         payload: JSON.stringify( fixture.songs[ 0 ] ),
         headers: { 'Content-Type': mediaLibrary.contentTypes.Song }
      };
      
      httpClient.post( baseURL + '/0/songs', request ).on( 'complete', function ( data, response ) {

         expect( response.statusCode ).toBe( 201 );
         song = JSON.parse( data );
            
         done();
      } );

   } );
   
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////
   
   it( 'returns a song representation, containing a self link', function() {

      var url = null;
      song.links.forEach( function( link ) {
         if( link.rel === 'self' ) {
            url = link.url;
            return;
         }
      } );
      
      expect( url ).toBeTruthy();
   } );
   
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////
   
   it( 'returns a song representation, containing an artist link', function() {

      var url = null;
      song.links.forEach( function( link ) {
         if( link.rel === 'artist' ) {
            url = link.url;
            return;
         }
      } );
      
      expect( url ).toBeTruthy();
   } );
   
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////
   
   it( 'returns a song from self link', function( done ) {

      var request = {
         headers: { 'Content-Type': mediaLibrary.contentTypes.Song }
      };

      var url = null;
      song.links.forEach( function( link ) {
         if( link.rel === 'self' ) {
            url = link.url;
            return;
         }
      } );
      
      expect( url ).toBeTruthy();

      httpClient.get( url, request ).on( 'complete', function ( data, response ) {

         expect( response.statusCode ).toBe( 200 );
            
         done();
      } );

   } );
   
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////
   
   it( 'stops listening when stopped', function( done ) {
      
      var spec = this;
      service.stop( function( err ) {
         
         expect( err ).toBeFalsy();
         
         httpClient.get( baseURL ).
            on( 'error', function( err ) {
               expect( err.errno ).toEqual( 'ECONNREFUSED' );
               
               done();
            } ).
            on( 'complete', function ( data, response ) {
               spec.fail( 'Service still responding.' );
               done();
            } );
         
      } );
   } );
   
} );
